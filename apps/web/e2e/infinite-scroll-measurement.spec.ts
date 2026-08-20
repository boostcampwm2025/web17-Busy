import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const shouldRun = process.env.INFINITE_SCROLL_MEASUREMENT === '1';

/** 개선 전 기준 회차에 예약된 이름 */
const BASELINE_MODE = 'baseline';

/**
 * 측정 회차를 구분하는 라벨. 결과 파일 이름과 비교 표의 행 이름이 된다.
 * `baseline`은 개선 전 기준 회차로 예약되어 있고, 이후 회차는 자유롭게 붙인다(`after-388` 등).
 */
const MODE = (process.env.INFINITE_SCROLL_MEASUREMENT_MODE ?? '').trim().replace(/[^a-zA-Z0-9._-]/g, '-') || BASELINE_MODE;

const SESSION_COUNT = numberFromEnv('INFINITE_SCROLL_MEASUREMENT_SESSIONS', 10);
/** 한 세션에서 스크롤로 채울 추가 페이지 수. 총 페이지 수는 이 값 + 1 이다. */
const SCROLL_PAGES = numberFromEnv('INFINITE_SCROLL_MEASUREMENT_PAGES', 5);
/** apps/web/src/api/internal/post.ts의 DEFAULT_FEED_LIMIT과 동일 */
const PAGE_SIZE = numberFromEnv('INFINITE_SCROLL_MEASUREMENT_PAGE_SIZE', 12);
const MOCK_API_DELAY_MS = numberFromEnv('INFINITE_SCROLL_MEASUREMENT_MOCK_DELAY_MS', 120);

/**
 * 측정 시점에 훅이 요청 앞에 두고 있던 고정 지연. #387에서 제거되어 0이다.
 * 이전 회차 summary에는 당시 값(300)이 그대로 기록되어 있어 비교에 쓸 수 있다.
 */
const SPINNER_DELAY_MS = 0;
const TOTAL_PAGES = SCROLL_PAGES + 1;
const TARGET_CARDS = TOTAL_PAGES * PAGE_SIZE;
/** 페이지가 늘지 않는 상황에서 무한 루프에 빠지지 않도록 둔 상한 */
const MAX_SCROLL_ACTIONS = TOTAL_PAGES * 4;
const QUIET_WINDOW_MS = 600;
const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/infinite-scroll');

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

type MeasurementMode = string;
/** initial: 페이지 진입 시 첫 페이지 로드 / scroll: 센티넬 노출로 발생한 추가 페이지 로드 */
type Phase = 'initial' | 'scroll';

type RequestEvent = {
  mode: MeasurementMode;
  sessionId: string;
  phase: Phase;
  requestId: string;
  /** 요청이 가져가려는 페이지 번호. cursor 파라미터에서 복원한다. */
  pageIndex: number;
  event: 'start' | 'finish' | 'failed';
  /** 세션 시작 기준 상대 시각 */
  tsMs: number;
};

type SessionSummary = {
  mode: MeasurementMode;
  sessionId: string;
  /** 페이지 진입 시 발생한 페이지 요청 수 */
  initialRequests: number;
  /** 스크롤 구간에서 발생한 페이지 요청 수. 이상적으로는 SCROLL_PAGES와 같다. */
  scrollRequests: number;
  /** 스크롤 구간에서 요청된 서로 다른 페이지 수 */
  distinctScrollPages: number;
  /** 같은 페이지를 두 번 이상 요청한 횟수 */
  duplicateRequests: number;
  /** 앞 요청이 끝나기 전에 시작된 요청 수 */
  overlappingRequests: number;
  /** 응답을 받지 못하고 끊긴 요청 수 */
  abortedRequests: number;
  scrollActions: number;
  pagesRendered: number;
  /** 첫 스크롤부터 목표 페이지 수가 모두 렌더링될 때까지의 시간 */
  loadDurationMs: number;
  /** 앞 요청 완료 → 다음 요청 시작 사이의 간격들. 지연이 직렬로 붙는지 보는 값이다. */
  gapsMs: number[];
};

type ModeSummary = {
  mode: MeasurementMode;
  sessionCount: number;
  totalPages: number;
  scrollPages: number;
  pageSize: number;
  mockApiDelayMs: number;
  spinnerDelayMs: number;
  expectedScrollRequests: number;
  averageScrollRequests: number;
  medianScrollRequests: number;
  p90ScrollRequests: number;
  /** 실제 요청 수 / 필요한 요청 수 */
  requestWasteRatio: number;
  averageDuplicateRequests: number;
  averageOverlappingRequests: number;
  averageAbortedRequests: number;
  /** 중복 요청이 한 번이라도 발생한 세션 비율(%) */
  duplicateSessionRatio: number;
  gapSampleCount: number;
  medianGapMs: number;
  averageGapMs: number;
  p90GapMs: number;
  averageScrollActions: number;
  medianLoadDurationMs: number;
  averageLoadDurationMs: number;
  p90LoadDurationMs: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const percentile = (values: number[], ratio: number): number => {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? 0;
};

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
};

/** 프로필 피드 페이지 요청만 추적한다. 나머지 API는 계측 대상이 아니다. */
const isProfileFeedRequest = (url: string): boolean => {
  try {
    const { pathname } = new URL(url);
    return pathname.startsWith('/api/post/user/') && pathname.endsWith('/feed');
  } catch {
    return false;
  }
};

const cursorToPageIndex = (cursor: string | null): number => {
  if (!cursor) return 0;
  const parsed = Number.parseInt(cursor.replace('page-', ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pageIndexOf = (url: string): number => {
  try {
    return cursorToPageIndex(new URL(url).searchParams.get('cursor'));
  } catch {
    return 0;
  }
};

const buildAuthor = (userId: string) => ({
  id: userId,
  nickname: `measure-${userId}`,
  profileImgUrl: null,
});

const buildMusic = (postId: string, index: number) => ({
  id: `${postId}-music-${index}`,
  trackUri: `measure:${postId}:${index}`,
  provider: 'ITUNES',
  albumCoverUrl: 'https://placehold.co/400x400/png?text=Music+Album',
  title: `${postId} track ${index}`,
  artistName: 'VIBR Measurement',
  durationMs: 180000,
});

const buildPost = (postId: string, userId: string) => ({
  id: postId,
  author: buildAuthor(userId),
  coverImgUrl: 'https://placehold.co/600x400/png?text=Post+Here!',
  musics: [buildMusic(postId, 0), buildMusic(postId, 1)],
  content: `measurement post ${postId}`,
  likeCount: 3,
  commentCount: 2,
  createdAt: '2026-08-01T00:00:00.000Z',
  isEdited: false,
  isLiked: false,
});

const postIdFor = (userId: string, pageIndex: number, index: number) =>
  `${userId}-p${String(pageIndex).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;

const jsonResponse = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

const delayMock = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_API_DELAY_MS);
  });
};

const routeStableApis = async (page: Page) => {
  await page.route('**/_next/image**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG });
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthenticated' }) });
  });
  await page.route('**/api/noti', async (route) => {
    await route.fulfill(jsonResponse([]));
  });
  await page.route('**/api/comment**', async (route) => {
    await route.fulfill(jsonResponse({ comments: [] }));
  });
};

/**
 * 프로필 피드 목록을 커서 페이지네이션으로 흉내낸다.
 * `hasNext`를 마지막 페이지까지 true로 유지해야 센티넬이 계속 떠 있고 스크롤이 이어진다.
 */
const routePostApis = async (page: Page) => {
  await page.route('**/api/post/**', async (route) => {
    const url = route.request().url();

    await delayMock();

    if (!isProfileFeedRequest(url)) {
      await route.fulfill(jsonResponse({}));
      return;
    }

    const { pathname } = new URL(url);
    const [userId = ''] = (pathname.split('/api/post/user/')[1] ?? '').split('/');
    const pageIndex = pageIndexOf(url);
    const hasNext = pageIndex + 1 < TOTAL_PAGES;
    const posts = Array.from({ length: PAGE_SIZE }, (_, index) => buildPost(postIdFor(userId, pageIndex, index), userId));

    await route.fulfill(jsonResponse({ posts, hasNext, nextCursor: hasNext ? `page-${pageIndex + 1}` : undefined }));
  });
};

type Tracker = {
  setSession: (sessionId: string | null, phase: Phase, startedAt: number) => void;
  setPhase: (phase: Phase) => void;
  lastActivityAt: () => number | null;
};

const createTracker = (page: Page, events: RequestEvent[]): Tracker => {
  let sessionId: string | null = null;
  let phase: Phase = 'initial';
  let startedAt = Date.now();
  let sequence = 0;
  let lastActivity: number | null = null;

  const meta = new Map<Request, { requestId: string; sessionId: string; phase: Phase; pageIndex: number; startedAt: number }>();

  page.on('request', (request) => {
    if (!sessionId) return;
    if (!isProfileFeedRequest(request.url())) return;

    const requestId = `${MODE}-${sessionId}-${phase}-${sequence}`;
    const pageIndex = pageIndexOf(request.url());
    sequence += 1;
    lastActivity = Date.now();

    meta.set(request, { requestId, sessionId, phase, pageIndex, startedAt });

    events.push({ mode: MODE, sessionId, phase, requestId, pageIndex, event: 'start', tsMs: Date.now() - startedAt });
  });

  const pushSettled = (request: Request, event: 'finish' | 'failed') => {
    const entry = meta.get(request);
    if (!entry) return;

    lastActivity = Date.now();

    events.push({
      mode: MODE,
      sessionId: entry.sessionId,
      phase: entry.phase,
      requestId: entry.requestId,
      pageIndex: entry.pageIndex,
      event,
      tsMs: Date.now() - entry.startedAt,
    });
  };

  page.on('requestfinished', (request) => pushSettled(request, 'finish'));
  page.on('requestfailed', (request) => pushSettled(request, 'failed'));

  return {
    setSession: (nextSessionId, nextPhase, nextStartedAt) => {
      sessionId = nextSessionId;
      phase = nextPhase;
      startedAt = nextStartedAt;
      lastActivity = null;
    },
    setPhase: (nextPhase) => {
      phase = nextPhase;
    },
    lastActivityAt: () => lastActivity,
  };
};

/** 추적 중인 요청이 일정 시간 동안 발생하지 않을 때까지 대기한다. */
const waitForQuiescence = async (page: Page, tracker: Tracker, timeoutMs = 15_000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const last = tracker.lastActivityAt();
    const reference = last ?? startedAt;

    if (Date.now() - reference >= QUIET_WINDOW_MS) return;

    await page.waitForTimeout(50);
  }
};

/** 앱 레이아웃은 `main`이 스크롤 컨테이너다(`app/layout.tsx`). window 스크롤로는 센티넬이 보이지 않는다. */
const scrollToBottom = async (page: Page) => {
  await page.evaluate(() => {
    const scroller = document.querySelector('main');

    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
      scroller.scrollTo({ top: scroller.scrollHeight });
      return;
    }

    window.scrollTo(0, document.body.scrollHeight);
  });
};

const waitForCardGrowth = async (page: Page, cards: Locator, previousCount: number, timeoutMs = 20_000): Promise<number> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const count = await cards.count();
    if (count > previousCount) return count;

    await page.waitForTimeout(50);
  }

  return previousCount;
};

/**
 * 한 세션의 스크롤 구간 요청을 시작 순서대로 훑어 앞 요청 완료와 다음 요청 시작 사이의 간격을 뽑는다.
 * 앞 요청이 끝나기 전에 시작된 요청은 간격 대신 겹침으로 센다.
 */
const analyzeScrollRequests = (events: RequestEvent[], sessionId: string) => {
  const sessionEvents = events.filter((event) => event.sessionId === sessionId && event.phase === 'scroll');
  const finishedAt = new Map<string, number>();

  sessionEvents.forEach((event) => {
    if (event.event !== 'start') finishedAt.set(event.requestId, event.tsMs);
  });

  const starts = sessionEvents.filter((event) => event.event === 'start').sort((a, b) => a.tsMs - b.tsMs);

  const gapsMs: number[] = [];
  let overlappingRequests = 0;

  starts.forEach((start, index) => {
    if (index === 0) return;

    const previous = starts[index - 1];
    if (!previous) return;

    const previousFinish = finishedAt.get(previous.requestId);
    if (previousFinish === undefined) return;

    const gap = start.tsMs - previousFinish;
    if (gap < 0) {
      overlappingRequests += 1;
      return;
    }

    gapsMs.push(gap);
  });

  return {
    starts,
    gapsMs,
    overlappingRequests,
    abortedRequests: sessionEvents.filter((event) => event.event === 'failed').length,
  };
};

/**
 * Next dev 서버는 최초 진입에서 라우트를 컴파일하므로 첫 세션의 시간이 크게 부풀려진다.
 * 측정 전에 같은 흐름을 한 번 실행해 컴파일 비용을 걷어낸다. `warmup` 세션 이벤트는 집계에서 제외된다.
 */
const runWarmup = async (page: Page, tracker: Tracker) => {
  tracker.setSession('warmup', 'initial', Date.now());
  await page.goto('/profile/measure-user-warmup/posts');

  const cards = page.locator('[id^="post-"]');
  await expect(cards).toHaveCount(PAGE_SIZE, { timeout: 30_000 });

  tracker.setPhase('scroll');
  await scrollToBottom(page);
  await waitForCardGrowth(page, cards, PAGE_SIZE);

  // 워밍업 요청이 첫 세션으로 흘러들어가지 않도록 잠잠해질 때까지 기다린 뒤 세션을 닫는다.
  await waitForQuiescence(page, tracker);
  tracker.setSession(null, 'initial', Date.now());
};

const runSession = async (page: Page, tracker: Tracker, events: RequestEvent[], sessionIndex: number): Promise<SessionSummary> => {
  const sessionId = `session-${String(sessionIndex + 1).padStart(3, '0')}`;
  const userId = `measure-user-${String(sessionIndex + 1).padStart(3, '0')}`;
  const cards = page.locator('[id^="post-"]');

  tracker.setSession(sessionId, 'initial', Date.now());

  await page.goto(`/profile/${userId}/posts`);
  await expect(cards).toHaveCount(PAGE_SIZE, { timeout: 20_000 });
  await waitForQuiescence(page, tracker);

  tracker.setPhase('scroll');

  let scrollActions = 0;
  let renderedCards = await cards.count();
  const scrollStartedAt = Date.now();

  while (renderedCards < TARGET_CARDS && scrollActions < MAX_SCROLL_ACTIONS) {
    await scrollToBottom(page);
    scrollActions += 1;

    const grown = await waitForCardGrowth(page, cards, renderedCards);
    if (grown === renderedCards) break;

    renderedCards = grown;
  }

  const loadDurationMs = Date.now() - scrollStartedAt;
  await waitForQuiescence(page, tracker);
  tracker.setSession(null, 'initial', Date.now());

  const initialRequests = events.filter((event) => event.sessionId === sessionId && event.phase === 'initial' && event.event === 'start').length;
  const { starts, gapsMs, overlappingRequests, abortedRequests } = analyzeScrollRequests(events, sessionId);
  const distinctScrollPages = new Set(starts.map((event) => event.pageIndex)).size;

  return {
    mode: MODE,
    sessionId,
    initialRequests,
    scrollRequests: starts.length,
    distinctScrollPages,
    duplicateRequests: starts.length - distinctScrollPages,
    overlappingRequests,
    abortedRequests,
    scrollActions,
    pagesRendered: Math.round(renderedCards / PAGE_SIZE),
    loadDurationMs,
    gapsMs,
  };
};

const summarizeMode = (sessions: SessionSummary[]): ModeSummary => {
  const scrollRequests = sessions.map((session) => session.scrollRequests);
  const durations = sessions.map((session) => session.loadDurationMs);
  const gaps = sessions.flatMap((session) => session.gapsMs);
  const duplicateSessions = sessions.filter((session) => session.duplicateRequests > 0).length;
  const averageScrollRequests = average(scrollRequests);

  return {
    mode: MODE,
    sessionCount: sessions.length,
    totalPages: TOTAL_PAGES,
    scrollPages: SCROLL_PAGES,
    pageSize: PAGE_SIZE,
    mockApiDelayMs: MOCK_API_DELAY_MS,
    spinnerDelayMs: SPINNER_DELAY_MS,
    expectedScrollRequests: SCROLL_PAGES,
    averageScrollRequests,
    medianScrollRequests: percentile(scrollRequests, 0.5),
    p90ScrollRequests: percentile(scrollRequests, 0.9),
    requestWasteRatio: SCROLL_PAGES === 0 ? 0 : round2(averageScrollRequests / SCROLL_PAGES),
    averageDuplicateRequests: average(sessions.map((session) => session.duplicateRequests)),
    averageOverlappingRequests: average(sessions.map((session) => session.overlappingRequests)),
    averageAbortedRequests: average(sessions.map((session) => session.abortedRequests)),
    duplicateSessionRatio: sessions.length === 0 ? 0 : round2((duplicateSessions / sessions.length) * 100),
    gapSampleCount: gaps.length,
    medianGapMs: percentile(gaps, 0.5),
    averageGapMs: average(gaps),
    p90GapMs: percentile(gaps, 0.9),
    averageScrollActions: average(sessions.map((session) => session.scrollActions)),
    medianLoadDurationMs: percentile(durations, 0.5),
    averageLoadDurationMs: average(durations),
    p90LoadDurationMs: percentile(durations, 0.9),
  };
};

const toCsv = (rows: SessionSummary[]): string => {
  const header =
    'mode,sessionId,initialRequests,scrollRequests,distinctScrollPages,duplicateRequests,overlappingRequests,abortedRequests,scrollActions,pagesRendered,loadDurationMs,medianGapMs';
  const body = rows.map((row) =>
    [
      row.mode,
      row.sessionId,
      row.initialRequests,
      row.scrollRequests,
      row.distinctScrollPages,
      row.duplicateRequests,
      row.overlappingRequests,
      row.abortedRequests,
      row.scrollActions,
      row.pagesRendered,
      row.loadDurationMs,
      percentile(row.gapsMs, 0.5),
    ].join(','),
  );

  return [header, ...body, ''].join('\n');
};

const readSummaryIfExists = async (mode: MeasurementMode): Promise<ModeSummary | null> => {
  try {
    const raw = await fs.readFile(path.join(OUTPUT_DIR, `summary-${mode}.json`), 'utf-8');
    return JSON.parse(raw) as ModeSummary;
  } catch {
    return null;
  }
};

/** 지금까지 기록된 모든 회차를 읽어 baseline을 맨 앞에 두고 나머지는 이름순으로 정렬한다. */
const readAllSummaries = async (latest: ModeSummary): Promise<ModeSummary[]> => {
  let fileNames: string[] = [];

  try {
    fileNames = await fs.readdir(OUTPUT_DIR);
  } catch {
    return [latest];
  }

  const modes = fileNames.map((name) => /^summary-(.+)\.json$/.exec(name)?.[1]).filter((mode): mode is string => Boolean(mode));

  const summaries = await Promise.all(modes.map((mode) => (mode === latest.mode ? Promise.resolve(latest) : readSummaryIfExists(mode))));

  return summaries
    .filter((summary): summary is ModeSummary => summary !== null)
    .sort((a, b) => {
      if (a.mode === BASELINE_MODE) return -1;
      if (b.mode === BASELINE_MODE) return 1;
      return a.mode.localeCompare(b.mode);
    });
};

const reductionPercent = (before: number, after: number) => {
  if (before === 0) return 0;
  return round2(((before - after) / before) * 100);
};

const summaryRow = (summary: ModeSummary) =>
  `| ${summary.mode} | ${summary.expectedScrollRequests} | ${summary.averageScrollRequests} | ${summary.medianScrollRequests} | ${summary.p90ScrollRequests} | ${summary.requestWasteRatio}x | ${summary.averageDuplicateRequests} | ${summary.duplicateSessionRatio}% | ${summary.medianGapMs} | ${summary.medianLoadDurationMs} | ${summary.averageLoadDurationMs} |`;

const buildReport = (summaries: ModeSummary[], latest: ModeSummary): string => {
  const generatedAt = new Date().toISOString();
  const baseline = summaries.find((summary) => summary.mode === BASELINE_MODE) ?? null;
  const current = latest.mode === BASELINE_MODE ? null : latest;
  const reference = latest;

  const lines = [
    '# Infinite Scroll Measurement Report',
    '',
    '## Scope',
    '',
    `- Generated at: ${generatedAt}`,
    `- Sessions per mode: ${reference.sessionCount}`,
    `- Pages per session: ${reference.totalPages} (1 on entry + ${reference.scrollPages} by scrolling)`,
    `- Page size (list limit): ${reference.pageSize}`,
    `- Mock API response delay: ${reference.mockApiDelayMs}ms`,
    `- Spinner delay inside the hook: ${reference.spinnerDelayMs}ms`,
    '- Backend: controlled mock endpoints via Playwright route interception',
    '- Screen: `/profile/:userId/posts`, which drives `useInfiniteScroll` -> `useInfiniteQueryScroll`',
    '- A session scrolls the sentinel into view repeatedly until every page is rendered',
    '',
    '## Summary',
    '',
    '| Mode | needed reqs | avg reqs | median | p90 | waste | avg duplicate | sessions with duplicate | median gap(ms) | median load(ms) | avg load(ms) |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  summaries.forEach((summary) => lines.push(summaryRow(summary)));

  lines.push('');
  lines.push('## Interpretation');
  lines.push('');

  if (baseline && current) {
    lines.push(
      `- \`${baseline.mode}\` -> \`${current.mode}\`: page requests needed to fill ${baseline.scrollPages} scrolled pages changed by ${reductionPercent(baseline.averageScrollRequests, current.averageScrollRequests)}% (${baseline.averageScrollRequests} -> ${current.averageScrollRequests}, ideal ${baseline.expectedScrollRequests}).`,
    );
    lines.push(
      `- Duplicate page requests per session changed from ${baseline.averageDuplicateRequests} to ${current.averageDuplicateRequests}; sessions containing at least one duplicate changed from ${baseline.duplicateSessionRatio}% to ${current.duplicateSessionRatio}%.`,
    );
    lines.push(
      `- Median gap between one page response finishing and the next request starting changed from ${baseline.medianGapMs}ms to ${current.medianGapMs}ms.`,
    );
    lines.push(
      `- Time to fill all pages by scrolling changed by ${reductionPercent(baseline.averageLoadDurationMs, current.averageLoadDurationMs)}% (${baseline.averageLoadDurationMs}ms -> ${current.averageLoadDurationMs}ms).`,
    );
  } else if (baseline) {
    lines.push(
      `- Filling ${baseline.scrollPages} scrolled pages issues ${baseline.averageScrollRequests} page requests on average against ${baseline.expectedScrollRequests} needed: ${baseline.requestWasteRatio}x.`,
    );
    lines.push(
      `- ${baseline.duplicateSessionRatio}% of sessions requested a page that had already been requested in the same session; the average duplicate count per session is ${baseline.averageDuplicateRequests}, and ${baseline.averageOverlappingRequests} requests per session started before the previous one finished.`,
    );
    lines.push(
      `- The median gap between one page response finishing and the next request starting is ${baseline.medianGapMs}ms, against a ${baseline.spinnerDelayMs}ms spinner delay that runs before the request.`,
    );
    lines.push(
      `- Filling all ${baseline.totalPages} pages by scrolling takes ${baseline.averageLoadDurationMs}ms on average (median ${baseline.medianLoadDurationMs}ms, p90 ${baseline.p90LoadDurationMs}ms).`,
    );
    lines.push('- No follow-up mode has been recorded yet. Re-run with `INFINITE_SCROLL_MEASUREMENT_MODE` set to label the next round.');
  }

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- `hasNext` stays true until the last mock page, so the sentinel remains mounted exactly as it does in production.');
  lines.push(
    '- In the baseline structure a fixed delay ran before the request, so one page cost `delay + network`. The delay was removed in #387 because the spinner it was meant to hold is not gated on the fetch state, so one page now costs `network` alone.',
  );
  lines.push(
    '- Duplicate detection compares the cursor of every scroll-phase request in a session; two requests for the same cursor count as one duplicate.',
  );
  lines.push(
    '- Aborted requests are counted separately because react-query cancels an in-flight page fetch when `fetchNextPage` is called again, which surfaces as a failed request rather than a second completed one.',
  );
  lines.push('- Render counts are out of scope for this harness; it measures network requests and elapsed time only.');
  lines.push(
    '- Timings come from `next dev`, not a production build, so they are for relative before/after comparison, not production latency figures.',
  );
  lines.push('- `/_next/image` is stubbed so image optimization latency does not affect the timings.');
  lines.push('- One warmup session runs before measurement and is excluded from every aggregate.');
  lines.push('');

  return lines.join('\n');
};

const writeMeasurementFiles = async (sessions: SessionSummary[], events: RequestEvent[], summary: ModeSummary) => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all([
    fs.writeFile(path.join(OUTPUT_DIR, `raw-${MODE}.json`), JSON.stringify(events, null, 2)),
    fs.writeFile(path.join(OUTPUT_DIR, `summary-${MODE}.json`), JSON.stringify(summary, null, 2)),
    fs.writeFile(path.join(OUTPUT_DIR, `summary-${MODE}.csv`), toCsv(sessions)),
  ]);

  const summaries = await readAllSummaries(summary);

  await fs.writeFile(path.join(OUTPUT_DIR, 'report.md'), buildReport(summaries, summary));
};

test.skip(!shouldRun, 'Run with INFINITE_SCROLL_MEASUREMENT=1 pnpm -C apps/web measure:infinite-scroll');
test.setTimeout(Math.max(180_000, SESSION_COUNT * TOTAL_PAGES * 8_000));

test('records infinite scroll page request counts and load durations', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const events: RequestEvent[] = [];

  await routeStableApis(page);
  await routePostApis(page);
  const tracker = createTracker(page, events);

  await runWarmup(page, tracker);

  const sessions: SessionSummary[] = [];

  for (let index = 0; index < SESSION_COUNT; index += 1) {
    sessions.push(await runSession(page, tracker, events, index));
  }

  await context.close();

  const summary = summarizeMode(sessions);
  await writeMeasurementFiles(sessions, events, summary);

  expect(summary.sessionCount).toBe(SESSION_COUNT);
  expect(summary.averageScrollRequests).toBeGreaterThan(0);
  // 목표 페이지를 채우지 못한 세션이 있으면 요청 수 비교가 성립하지 않는다.
  expect(sessions.every((session) => session.pagesRendered === TOTAL_PAGES)).toBe(true);
});
