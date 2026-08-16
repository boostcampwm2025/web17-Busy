import { expect, test, type Page, type Request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const shouldRun = process.env.PROFILE_POSTS_MEASUREMENT === '1';

/**
 * baseline: 목록 조회 후 항목마다 상세를 개별 호출하는 현재 구조
 * current: 목록 응답만으로 카드를 렌더링하는 개선 구조
 */
const MODE = process.env.PROFILE_POSTS_MEASUREMENT_MODE === 'current' ? 'current' : 'baseline';

const SESSION_COUNT = numberFromEnv('PROFILE_POSTS_MEASUREMENT_SESSIONS', 20);
/** apps/web/src/api/internal/post.ts의 DEFAULT_FEED_LIMIT과 동일 */
const PAGE_SIZE = numberFromEnv('PROFILE_POSTS_MEASUREMENT_PAGE_SIZE', 12);
const MOCK_API_DELAY_MS = numberFromEnv('PROFILE_POSTS_MEASUREMENT_MOCK_DELAY_MS', 120);
const QUIET_WINDOW_MS = 400;
const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/profile-posts');

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

type MeasurementMode = 'baseline' | 'current';
type Scenario = 'list' | 'detail';
type RequestKind = 'profile-list' | 'post-detail' | 'comments';

type RequestEvent = {
  mode: MeasurementMode;
  scenario: Scenario;
  sessionId: string;
  requestId: string;
  kind: RequestKind;
  path: string;
  event: 'start' | 'finish' | 'failed';
  tsMs: number;
};

type SessionSummary = {
  mode: MeasurementMode;
  sessionId: string;
  /** 목록 진입 시 발생한 목록 API 요청 수 */
  listListRequests: number;
  /** 목록 진입 시 발생한 상세 API 요청 수 (N+1의 N) */
  listDetailRequests: number;
  /** 목록 진입 시 발생한 전체 게시글 API 요청 수 */
  listTotalRequests: number;
  /** goto 시작부터 카드가 모두 렌더링될 때까지의 시간 */
  listDurationMs: number;
  /** 상세 모달 진입 시 발생한 상세 API 요청 수 (staleTime 중복 재요청) */
  detailRefetchRequests: number;
};

type ModeSummary = {
  mode: MeasurementMode;
  sessionCount: number;
  pageSize: number;
  mockApiDelayMs: number;
  medianListTotalRequests: number;
  p90ListTotalRequests: number;
  averageListTotalRequests: number;
  averageListListRequests: number;
  averageListDetailRequests: number;
  medianListDurationMs: number;
  p90ListDurationMs: number;
  averageListDurationMs: number;
  averageDetailRefetchRequests: number;
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

const classifyRequest = (url: string): RequestKind | null => {
  let pathname: string;

  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }

  if (pathname.startsWith('/api/comment')) return 'comments';
  if (pathname.startsWith('/api/post/user/')) return 'profile-list';
  if (pathname.startsWith('/api/post/')) return 'post-detail';
  return null;
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

/** 백엔드 `/post/user/:userId`가 반환하는 경량 미리보기 */
const buildPreview = (postId: string) => ({
  postId,
  coverImgUrl: 'https://placehold.co/600x400/png?text=Post+Here!',
  likeCount: 3,
  commentCount: 2,
  isMoreThanOneMusic: true,
});

/** 백엔드 `/post/:postId`가 반환하는 전체 게시글 */
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

const postIdFor = (userId: string, index: number) => `${userId}-post-${String(index + 1).padStart(2, '0')}`;

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
  await page.route('**/api/feed**', async (route) => {
    await route.fulfill(jsonResponse({ posts: [], hasNext: false }));
  });
  await page.route('**/api/comment**', async (route) => {
    await route.fulfill(jsonResponse({ comments: [] }));
  });
};

/**
 * `/api/post/**`를 하나의 핸들러에서 분기한다.
 * Playwright는 나중에 등록한 route가 우선하므로, 경로별로 나누면 등록 순서에 의존하게 된다.
 */
const routePostApis = async (page: Page) => {
  await page.route('**/api/post/**', async (route) => {
    const url = route.request().url();
    const kind = classifyRequest(url);
    const pathname = new URL(url).pathname;

    await delayMock();

    if (kind === 'profile-list') {
      const userId = pathname.split('/api/post/user/')[1] ?? '';
      const posts = Array.from({ length: PAGE_SIZE }, (_, index) => buildPreview(postIdFor(userId, index)));

      await route.fulfill(jsonResponse({ posts, hasNext: false }));
      return;
    }

    if (kind === 'post-detail') {
      const postId = pathname.replace('/api/post/', '');
      const userId = postId.split('-post-')[0] ?? 'measure-user';

      await route.fulfill(jsonResponse(buildPost(postId, userId)));
      return;
    }

    await route.fulfill(jsonResponse({}));
  });
};

type Tracker = {
  setScenario: (scenario: Scenario | null, sessionId: string | null, startedAt: number) => void;
  lastActivityAt: () => number | null;
};

const createTracker = (page: Page, events: RequestEvent[]): Tracker => {
  let scenario: Scenario | null = null;
  let sessionId: string | null = null;
  let startedAt = Date.now();
  let sequence = 0;
  let lastActivity: number | null = null;

  const meta = new Map<Request, { requestId: string; scenario: Scenario; sessionId: string; kind: RequestKind; path: string; startedAt: number }>();

  page.on('request', (request) => {
    if (!scenario || !sessionId) return;

    const kind = classifyRequest(request.url());
    if (!kind) return;

    const requestId = `${MODE}-${sessionId}-${scenario}-${sequence}`;
    const pathname = new URL(request.url()).pathname;
    sequence += 1;
    lastActivity = Date.now();

    meta.set(request, { requestId, scenario, sessionId, kind, path: pathname, startedAt });

    events.push({
      mode: MODE,
      scenario,
      sessionId,
      requestId,
      kind,
      path: pathname,
      event: 'start',
      tsMs: Date.now() - startedAt,
    });
  });

  const pushSettled = (request: Request, event: 'finish' | 'failed') => {
    const entry = meta.get(request);
    if (!entry) return;

    lastActivity = Date.now();

    events.push({
      mode: MODE,
      scenario: entry.scenario,
      sessionId: entry.sessionId,
      requestId: entry.requestId,
      kind: entry.kind,
      path: entry.path,
      event,
      tsMs: Date.now() - entry.startedAt,
    });
  };

  page.on('requestfinished', (request) => pushSettled(request, 'finish'));
  page.on('requestfailed', (request) => pushSettled(request, 'failed'));

  return {
    setScenario: (nextScenario, nextSessionId, nextStartedAt) => {
      scenario = nextScenario;
      sessionId = nextSessionId;
      startedAt = nextStartedAt;
      lastActivity = null;
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

const countEvents = (events: RequestEvent[], sessionId: string, scenario: Scenario, kind?: RequestKind) =>
  events.filter(
    (event) =>
      event.sessionId === sessionId &&
      event.scenario === scenario &&
      event.event === 'start' &&
      (kind ? event.kind === kind : event.kind !== 'comments'),
  ).length;

/**
 * Next dev 서버는 최초 진입에서 라우트를 컴파일하므로 첫 세션의 렌더 시간이 크게 부풀려진다.
 * 측정 전에 동일한 흐름을 한 번 실행해 컴파일 비용을 걷어낸다. tracker scenario가 없으므로 기록되지 않는다.
 */
const runWarmup = async (page: Page) => {
  await page.goto('/profile/measure-user-warmup/posts');

  const cards = page.locator('[id^="post-"]');
  await expect(cards).toHaveCount(PAGE_SIZE, { timeout: 30_000 });

  await cards.first().click();
  await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 15_000 });
};

const runSession = async (page: Page, tracker: Tracker, events: RequestEvent[], sessionIndex: number): Promise<SessionSummary> => {
  const sessionId = `session-${String(sessionIndex + 1).padStart(3, '0')}`;
  const userId = `measure-user-${String(sessionIndex + 1).padStart(3, '0')}`;

  // 시나리오 A: 프로필 게시글 목록 진입
  const listStartedAt = Date.now();
  tracker.setScenario('list', sessionId, listStartedAt);

  await page.goto(`/profile/${userId}/posts`);

  const cards = page.locator('[id^="post-"]');
  await expect(cards).toHaveCount(PAGE_SIZE, { timeout: 20_000 });

  const listDurationMs = Date.now() - listStartedAt;
  await waitForQuiescence(page, tracker);
  tracker.setScenario(null, null, Date.now());

  // 시나리오 B: 목록에서 상세 모달 열기
  tracker.setScenario('detail', sessionId, Date.now());

  await cards.first().click();
  await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
  await waitForQuiescence(page, tracker);

  tracker.setScenario(null, null, Date.now());

  return {
    mode: MODE,
    sessionId,
    listListRequests: countEvents(events, sessionId, 'list', 'profile-list'),
    listDetailRequests: countEvents(events, sessionId, 'list', 'post-detail'),
    listTotalRequests: countEvents(events, sessionId, 'list'),
    listDurationMs,
    detailRefetchRequests: countEvents(events, sessionId, 'detail', 'post-detail'),
  };
};

const summarizeMode = (sessions: SessionSummary[]): ModeSummary => {
  const listTotals = sessions.map((session) => session.listTotalRequests);
  const durations = sessions.map((session) => session.listDurationMs);

  return {
    mode: MODE,
    sessionCount: sessions.length,
    pageSize: PAGE_SIZE,
    mockApiDelayMs: MOCK_API_DELAY_MS,
    medianListTotalRequests: percentile(listTotals, 0.5),
    p90ListTotalRequests: percentile(listTotals, 0.9),
    averageListTotalRequests: average(listTotals),
    averageListListRequests: average(sessions.map((session) => session.listListRequests)),
    averageListDetailRequests: average(sessions.map((session) => session.listDetailRequests)),
    medianListDurationMs: percentile(durations, 0.5),
    p90ListDurationMs: percentile(durations, 0.9),
    averageListDurationMs: average(durations),
    averageDetailRefetchRequests: average(sessions.map((session) => session.detailRefetchRequests)),
  };
};

const toCsv = (rows: SessionSummary[]): string => {
  const header = 'mode,sessionId,listListRequests,listDetailRequests,listTotalRequests,listDurationMs,detailRefetchRequests';
  const body = rows.map((row) =>
    [
      row.mode,
      row.sessionId,
      row.listListRequests,
      row.listDetailRequests,
      row.listTotalRequests,
      row.listDurationMs,
      row.detailRefetchRequests,
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

const reductionPercent = (before: number, after: number) => {
  if (before === 0) return 0;
  return round2(((before - after) / before) * 100);
};

const summaryRow = (summary: ModeSummary) =>
  `| ${summary.mode} | ${summary.medianListTotalRequests} | ${summary.p90ListTotalRequests} | ${summary.averageListTotalRequests} | ${summary.averageListListRequests} | ${summary.averageListDetailRequests} | ${summary.averageListDurationMs} | ${summary.averageDetailRefetchRequests} |`;

const buildReport = (baseline: ModeSummary | null, current: ModeSummary | null): string => {
  const generatedAt = new Date().toISOString();
  const reference = current ?? baseline;

  const lines = [
    '# Profile Posts Pipeline Measurement Report',
    '',
    '## Scope',
    '',
    `- Generated at: ${generatedAt}`,
    `- Sessions per mode: ${reference?.sessionCount ?? 0}`,
    `- Page size (list limit): ${reference?.pageSize ?? PAGE_SIZE}`,
    `- Mock API response delay: ${reference?.mockApiDelayMs ?? MOCK_API_DELAY_MS}ms`,
    '- Backend: controlled mock endpoints via Playwright route interception',
    '- Scenario A: navigate to `/profile/:userId/posts` and wait until all cards render',
    '- Scenario B: open the post detail modal from the rendered list',
    '',
    '## Summary',
    '',
    '| Mode | median list reqs | p90 list reqs | avg list reqs | avg list API | avg detail API | avg list ready(ms) | avg detail refetch |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  if (baseline) lines.push(summaryRow(baseline));
  if (current) lines.push(summaryRow(current));

  lines.push('');
  lines.push('## Interpretation');
  lines.push('');

  if (baseline && current) {
    lines.push(
      `- Average profile list request count decreased by ${reductionPercent(baseline.averageListTotalRequests, current.averageListTotalRequests)}% (${baseline.averageListTotalRequests} -> ${current.averageListTotalRequests}).`,
    );
    lines.push(
      `- Average time until the list is rendered changed by ${reductionPercent(baseline.averageListDurationMs, current.averageListDurationMs)}% (${baseline.averageListDurationMs}ms -> ${current.averageListDurationMs}ms).`,
    );
    lines.push(
      `- Average duplicate detail refetch on modal open changed from ${baseline.averageDetailRefetchRequests} to ${current.averageDetailRefetchRequests}.`,
    );
  } else if (baseline) {
    lines.push(
      `- One profile list page load issues ${baseline.averageListTotalRequests} requests on average: ${baseline.averageListListRequests} list request plus ${baseline.averageListDetailRequests} individual detail requests.`,
    );
    lines.push(`- Time until the list is rendered averages ${baseline.averageListDurationMs}ms (p90 ${baseline.p90ListDurationMs}ms).`);
    lines.push(
      `- Opening the detail modal from the list issues ${baseline.averageDetailRefetchRequests} additional detail request on average even though the post data is already passed as \`initialData\`.`,
    );
    lines.push('- The `current` mode has not been measured yet. Run it after the N+1 fix lands.');
  }

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Request counts are structural and deterministic: one list page load always issues 1 + N requests in the baseline structure.');
  lines.push(
    '- The mock delay is a fixed internal-API latency assumption, not a measured production value. Only request counts are delay independent.',
  );
  lines.push(
    '- Render timings come from `next dev`, not a production build, so they are useful for relative before/after comparison but are not production latency figures.',
  );
  lines.push('- One warmup session runs before measurement and is excluded, so Next dev route compilation does not inflate the first sample.');
  lines.push('- `hasNext` is fixed to `false` so exactly one page is loaded per session and infinite scroll does not add requests.');
  lines.push('- `/_next/image` is stubbed so image optimization latency does not affect the list render timing.');
  lines.push('- Comment API requests are mocked and excluded from the request counts above.');
  lines.push('- DB query counts and CPU/memory comparison are out of scope here because this harness runs without a real backend.');
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

  const baseline = MODE === 'baseline' ? summary : await readSummaryIfExists('baseline');
  const current = MODE === 'current' ? summary : await readSummaryIfExists('current');

  await fs.writeFile(path.join(OUTPUT_DIR, 'report.md'), buildReport(baseline, current));
};

test.skip(!shouldRun, 'Run with PROFILE_POSTS_MEASUREMENT=1 pnpm -C apps/web measure:profile-posts');
test.setTimeout(Math.max(180_000, SESSION_COUNT * 15_000));

test('records profile posts list and detail request counts', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const events: RequestEvent[] = [];

  await routeStableApis(page);
  await routePostApis(page);
  const tracker = createTracker(page, events);

  await runWarmup(page);

  const sessions: SessionSummary[] = [];

  for (let index = 0; index < SESSION_COUNT; index += 1) {
    sessions.push(await runSession(page, tracker, events, index));
  }

  await context.close();

  const summary = summarizeMode(sessions);
  await writeMeasurementFiles(sessions, events, summary);

  expect(summary.sessionCount).toBe(SESSION_COUNT);
  expect(summary.averageListListRequests).toBeGreaterThan(0);
});
