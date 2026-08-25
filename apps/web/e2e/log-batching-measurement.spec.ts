import { expect, test, type Page, type Request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * FE 로그 배치 측정.
 *
 * `logQueue`는 이벤트를 버퍼에 모아 `/api/logs`로 한 번에 보낸다(`flushSize` 20, `flushIntervalMs` 3000).
 * 이 하네스는 실제 브라우저에서 사용자 행동으로 이벤트를 만들고 요청 수를 센다.
 *
 * 회차:
 *   current    지금 코드 그대로
 *   unbatched  flush 지연(3000ms)을 0으로 만들어 이벤트마다 즉시 전송되게 한 상태.
 *              배치가 없었다면 어땠을지를 같은 페이지에서 재현한다.
 *              검색 하네스가 debounce 타이머를 무력화해 baseline을 만든 것과 같은 방법이다.
 *
 * 이벤트 1건 = 게시글 상세 모달을 열었다 닫기.
 * `PostCardDetailModal.handleClose`가 `emitOnce`로 정확히 한 번만 기록한다(중복 가드 있음).
 *
 * 실행:
 *   LOG_BATCHING_MEASUREMENT=1 LOG_BATCHING_MEASUREMENT_MODE=current pnpm exec playwright test e2e/log-batching-measurement.spec.ts --project=chromium
 */

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const shouldRun = process.env.LOG_BATCHING_MEASUREMENT === '1';

const MODE = (process.env.LOG_BATCHING_MEASUREMENT_MODE ?? '').trim().replace(/[^a-zA-Z0-9._-]/g, '-') || 'current';

const SESSION_COUNT = numberFromEnv('LOG_BATCHING_MEASUREMENT_SESSIONS', 10);
/** 배치 국면에서 만들 이벤트 수. flushSize(20)를 넘겨야 크기 기반 flush도 관찰된다. */
const EVENTS_PER_SESSION = numberFromEnv('LOG_BATCHING_MEASUREMENT_EVENTS', 24);
/**
 * 탭 종료 국면에서 구동할 사용자 행동 수.
 *
 * 두 조건을 만족해야 이 국면이 성립한다.
 *   1. 쌓이는 이벤트 수가 flushSize(20) 미만  — 넘으면 크기 기반 flush로 숨기기 전에 전송된다
 *   2. 구동 시간이 flushIntervalMs(3000ms) 미만 — 넘으면 타이머가 먼저 발화한다
 *
 * 현재 상세 열고닫기 1회가 이벤트를 2건 만들므로(중복 기록 결함) 5회면 10건이라 1을 만족하고,
 * 한 회 약 140ms이므로 약 0.7초로 2도 만족한다.
 */
const LOSS_EVENTS = numberFromEnv('LOG_BATCHING_MEASUREMENT_LOSS_EVENTS', 5);
const MOCK_API_DELAY_MS = numberFromEnv('LOG_BATCHING_MEASUREMENT_MOCK_DELAY_MS', 60);

/** 로그 큐 기본값. 앱 코드와 같아야 리포트 해석이 맞다. */
const FLUSH_SIZE = 20;
const FLUSH_INTERVAL_MS = 3000;

const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/log-batching');

const VIEWER_ID = 'viewer-1';
const POST_ID = 'post-1';
const TOKEN = 'measurement-token';

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

type LogRequestRecord = {
  sessionId: string;
  /** 세션 시작 이후 경과 ms */
  tsMs: number;
  /** 이 요청에 담긴 이벤트 수 */
  eventCount: number;
  /** `eventType:postId:dwellMs`. 같은 행동이 중복 기록되는지 확인용 */
  fingerprints: string[];
};

type SessionResult = {
  sessionId: string;

  // A. 배치
  /** 구동한 사용자 행동 수(상세 열고 닫기). 이벤트 수와 같다고 가정하지 않는다. */
  actionsDriven: number;
  requests: number;
  eventsSent: number;
  /** 행동 1건이 실제로 만든 이벤트 수. 1이 아니면 중복 기록이다. */
  eventsPerAction: number;
  batchSizes: number[];
  medianDriveIntervalMs: number;

  // B. 탭 종료
  lossActionsDriven: number;
  /** 탭 숨김 국면에서 실제로 전송된 이벤트 수. 0이면 버퍼에 있던 것이 전부 사라졌다는 뜻이다. */
  lossEventsSent: number;
  requestsAfterHide: number;
};

const post = {
  id: POST_ID,
  content: '게시글 내용',
  coverImgUrl: '/cover.png',
  likeCount: 0,
  commentCount: 0,
  isLiked: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  author: { id: VIEWER_ID, nickname: '나', profileImgUrl: null },
  musics: [],
};

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

const delayed = async (ms: number) => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const routeApis = async (page: Page) => {
  await page.addInitScript(
    ([key, token]) => {
      sessionStorage.setItem(key as string, token as string);
      localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    },
    ['appJwt', TOKEN],
  );

  // Playwright는 나중에 등록한 라우트를 먼저 매칭한다. 포괄 라우트를 맨 앞에 두어야
  // 뒤에 오는 구체 라우트가 이긴다. `/api/logs`도 여기서 200으로 받는다(요청 수는 request 리스너가 센다).
  await page.route('**/api/**', (route) => route.fulfill(json({})));

  await page.route('**/_next/image**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));
  await page.route('**/cover.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));

  await page.route('**/api/user/me', (route) => route.fulfill(json({ id: VIEWER_ID, nickname: '나', profileImgUrl: null })));
  await page.route('**/api/noti**', (route) => route.fulfill(json([])));
  await page.route('**/api/privacy', (route) => route.fulfill(json({ items: [{ id: 'c1', agreedAt: '2026-01-01' }] })));
  await page.route('**/api/comment**', (route) => route.fulfill(json({ comments: [], hasNext: false })));
  await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [post], hasNext: false })));
  await page.route(`**/api/post/${POST_ID}`, async (route) => {
    await delayed(MOCK_API_DELAY_MS);
    await route.fulfill(json(post));
  });
};

/**
 * `unbatched`는 flush 지연만 0으로 만든다. 그러면 이벤트가 버퍼에 들어가는 즉시 타이머가 발화해
 * 사실상 이벤트 1건당 요청 1건이 된다. 큐 자체를 들어내지 않고 `배치가 없었다면`을 재현하는 방법이다.
 */
const applyUnbatchedPatch = async (page: Page, flushIntervalMs: number) => {
  await page.addInitScript((interval) => {
    const original = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      original(handler, timeout === interval ? 0 : timeout, ...args)) as typeof window.setTimeout;
  }, flushIntervalMs);
};

const setupLogCapture = (page: Page, records: LogRequestRecord[]) => {
  let active: { id: string; startedAt: number } | null = null;

  const onRequest = (request: Request) => {
    if (!active) return;
    if (request.method() !== 'POST') return;
    if (!request.url().includes('/api/logs')) return;

    let eventCount = 0;
    let fingerprints: string[] = [];
    try {
      const body = JSON.parse(request.postData() ?? '{}') as { events?: Record<string, unknown>[] };
      const events = Array.isArray(body.events) ? body.events : [];
      eventCount = events.length;
      // 같은 행동이 두 번 기록되는지 보려면 이벤트를 구분할 수 있어야 한다.
      fingerprints = events.map((e) => {
        const meta = (e.meta ?? {}) as Record<string, unknown>;
        return `${String(e.eventType ?? '?')}|${String(e.targetPostId ?? '-')}|dwell=${String(meta.dwellMs ?? '-')}|at=${String(e.occurredAt ?? '-')}`;
      });
    } catch {
      eventCount = 0;
    }

    records.push({ sessionId: active.id, tsMs: Date.now() - active.startedAt, eventCount, fingerprints });
  };

  page.on('request', onRequest);

  return {
    setActive: (session: { id: string; startedAt: number } | null) => {
      active = session;
    },
  };
};

/** 게시글 상세를 열었다 닫으면 로그 이벤트가 정확히 1건 쌓인다. */
const driveOneEvent = async (page: Page) => {
  await page.getByText('게시글 내용').first().click();
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('Escape').catch(() => {});
  const closeButton = dialog.getByRole('button').first();
  if (await dialog.isVisible().catch(() => false)) {
    await closeButton.click({ timeout: 5_000 }).catch(() => {});
  }
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });
};

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2) : (sorted[mid] ?? 0);
};

const setVisibility = (page: Page, state: 'visible' | 'hidden') =>
  page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('visibilitychange'));
  }, state);

const driveEvents = async (page: Page, count: number): Promise<number[]> => {
  const stamps: number[] = [];
  for (let i = 0; i < count; i += 1) {
    await driveOneEvent(page);
    stamps.push(Date.now());
  }
  return stamps;
};

const countEvents = (rows: LogRequestRecord[]) => rows.reduce((sum, r) => sum + r.eventCount, 0);

/**
 * 한 세션은 두 국면으로 나뉜다.
 *
 *  A 배치     `flushSize`(20)를 넘는 이벤트를 만들고 타이머까지 지난 뒤 요청 수를 센다.
 *  B 탭 종료   `flushSize` 미만을 만들어 버퍼에 남긴 상태에서 곧바로 탭을 숨긴다.
 *             `initLogQueue`가 호출되지 않으면 `visibilitychange` 리스너가 없어 그대로 사라진다.
 */
/**
 * 로그 버퍼는 모듈 스코프 변수라 페이지를 새로 열면 비워진다.
 * 국면마다 초기화하지 않으면 앞 국면에서 전송되지 않고 남은 이벤트가 다음 국면의 수치를 오염시킨다.
 * 특히 B는 버퍼가 `flushSize` 미만이어야 성립하므로 반드시 깨끗한 상태에서 시작해야 한다.
 */
const resetPage = async (page: Page) => {
  await page.goto('/');
  await expect(page.getByText('게시글 내용').first()).toBeVisible({ timeout: 30_000 });
  await setVisibility(page, 'visible');
};

const runSession = async (
  page: Page,
  sessionId: string,
  capture: ReturnType<typeof setupLogCapture>,
  records: LogRequestRecord[],
): Promise<SessionResult> => {
  const startedAt = Date.now();
  capture.setActive({ id: sessionId, startedAt });

  // --- A. 배치 ---
  await resetPage(page);
  const batchStart = records.length;
  const driveStamps = await driveEvents(page, EVENTS_PER_SESSION);
  await page.waitForTimeout(FLUSH_INTERVAL_MS + 1_500); // 남은 타이머까지 전부 발화시킨다
  const batchRows = records.slice(batchStart);

  // --- B. 탭 종료 유실 ---
  await resetPage(page);
  const lossStart = records.length;
  await driveEvents(page, LOSS_EVENTS);
  const beforeHide = records.length;
  await setVisibility(page, 'hidden');
  await page.waitForTimeout(1_500);
  const lossRows = records.slice(lossStart);
  const requestsAfterHide = records.length - beforeHide;

  capture.setActive(null);

  const intervals = driveStamps.slice(1).map((t, i) => t - (driveStamps[i] ?? t));

  const eventsSent = countEvents(batchRows);

  return {
    sessionId,
    actionsDriven: EVENTS_PER_SESSION,
    requests: batchRows.length,
    eventsSent,
    eventsPerAction: EVENTS_PER_SESSION === 0 ? 0 : Number((eventsSent / EVENTS_PER_SESSION).toFixed(2)),
    batchSizes: batchRows.map((r) => r.eventCount),
    medianDriveIntervalMs: median(intervals),

    lossActionsDriven: LOSS_EVENTS,
    lossEventsSent: countEvents(lossRows),
    requestsAfterHide,
  };
};

const summarize = (sessions: SessionResult[]) => {
  const avg = (pick: (s: SessionResult) => number) =>
    sessions.length === 0 ? 0 : Number((sessions.reduce((sum, s) => sum + pick(s), 0) / sessions.length).toFixed(2));

  return {
    mode: MODE,
    sessionCount: sessions.length,
    flushSize: FLUSH_SIZE,
    flushIntervalMs: FLUSH_INTERVAL_MS,
    mockApiDelayMs: MOCK_API_DELAY_MS,
    medianDriveIntervalMs: median(sessions.map((s) => s.medianDriveIntervalMs)),

    // A. 배치
    actionsPerSession: EVENTS_PER_SESSION,
    averageRequests: avg((s) => s.requests),
    medianRequests: median(sessions.map((s) => s.requests)),
    averageEventsSent: avg((s) => s.eventsSent),
    /** 1이 아니면 사용자 행동 한 번이 로그를 여러 건 만들고 있다는 뜻이다. */
    averageEventsPerAction: avg((s) => s.eventsPerAction),
    averageBatchSize: avg((s) => (s.batchSizes.length === 0 ? 0 : s.batchSizes.reduce((a, b) => a + b, 0) / s.batchSizes.length)),
    /** 이벤트 1건당 요청 수. 배치가 없으면 1, 배치가 잘 되면 0에 가깝다. */
    requestsPerEvent: avg((s) => (s.eventsSent === 0 ? 0 : s.requests / s.eventsSent)),

    // B. 탭 종료 유실
    lossActionsPerSession: LOSS_EVENTS,
    averageLossEventsSent: avg((s) => s.lossEventsSent),
    /** 버퍼에 있던 것이 하나도 전송되지 않은 세션 수 */
    sessionsWithTotalLoss: sessions.filter((s) => s.lossEventsSent === 0).length,
    /** 탭 숨김 이후 나간 요청 수. initLogQueue 미호출이면 전 세션에서 0이어야 한다. */
    averageRequestsAfterHide: avg((s) => s.requestsAfterHide),
    sessionsFlushedOnHide: sessions.filter((s) => s.requestsAfterHide > 0).length,
  };
};

const toCsv = (sessions: SessionResult[]): string => {
  const header =
    'mode,sessionId,actionsDriven,requests,eventsSent,eventsPerAction,lossActionsDriven,lossEventsSent,requestsAfterHide,medianDriveIntervalMs,batchSizes';
  const rows = sessions.map((s) =>
    [
      MODE,
      s.sessionId,
      s.actionsDriven,
      s.requests,
      s.eventsSent,
      s.eventsPerAction,
      s.lossActionsDriven,
      s.lossEventsSent,
      s.requestsAfterHide,
      s.medianDriveIntervalMs,
      `"${s.batchSizes.join(' ')}"`,
    ].join(','),
  );
  return [header, ...rows].join('\n');
};

test.skip(!shouldRun, 'Run with LOG_BATCHING_MEASUREMENT=1 pnpm -C apps/web measure:log-batching');
test.setTimeout(Math.max(180_000, SESSION_COUNT * EVENTS_PER_SESSION * 3_000));

test('records /api/logs request counts and tab-hide loss', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await routeApis(page);
  if (MODE === 'unbatched') await applyUnbatchedPatch(page, FLUSH_INTERVAL_MS);

  const records: LogRequestRecord[] = [];
  const capture = setupLogCapture(page, records);

  // 워밍업 1세션은 집계에서 뺀다. Next dev 라우트 컴파일이 첫 표본을 부풀린다.
  await runSession(page, 'warmup', capture, records);
  records.length = 0;

  const sessions: SessionResult[] = [];
  for (let i = 0; i < SESSION_COUNT; i += 1) {
    sessions.push(await runSession(page, `session-${String(i + 1).padStart(3, '0')}`, capture, records));
  }

  await context.close();

  const summary = summarize(sessions);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(OUTPUT_DIR, `summary-${MODE}.json`), JSON.stringify({ ...summary, sessions }, null, 2)),
    fs.writeFile(path.join(OUTPUT_DIR, `summary-${MODE}.csv`), toCsv(sessions)),
    fs.writeFile(path.join(OUTPUT_DIR, `raw-${MODE}.json`), JSON.stringify(records, null, 2)),
  ]);

   
  console.log(`\n[${MODE}] 세션 ${summary.sessionCount} · 이벤트 간격 중앙값 ${summary.medianDriveIntervalMs}ms`);
  console.log(
    `  A 배치     행동 ${summary.actionsPerSession} → 이벤트 ${summary.averageEventsSent} → 요청 ${summary.averageRequests} ` +
      `(행동당 이벤트 ${summary.averageEventsPerAction}, 배치 크기 평균 ${summary.averageBatchSize}, 이벤트당 요청 ${summary.requestsPerEvent})`,
  );
  console.log(
    `  B 탭 종료   행동 ${summary.lossActionsPerSession} → 전송된 이벤트 ${summary.averageLossEventsSent} ` +
      `(전량 유실 세션 ${summary.sessionsWithTotalLoss}/${summary.sessionCount}, 숨김 후 요청 ${summary.averageRequestsAfterHide})`,
  );
   

  expect(summary.sessionCount).toBe(SESSION_COUNT);
});
