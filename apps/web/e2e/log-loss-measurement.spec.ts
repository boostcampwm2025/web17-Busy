import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * 로그 유실을 사유별로 측정한다.
 *
 * `logQueue`는 버리는 경로가 전부 조용한 `return`이라 흔적이 남지 않았다.
 * 사유별 카운터를 붙였으니 이제 어느 경로로 얼마나 사라지는지 셀 수 있다.
 *
 * 특히 `restored`(전송 실패로 버퍼에 되돌린 수)는 중요하다.
 * 서버가 이미 적재한 뒤 응답만 유실됐다면 그 되돌림은 그대로 중복이 된다.
 * 하류가 누적 연산(zincrby, r.weight + log.weight)이라 중복은 곧 데이터 오염인데,
 * 에픽 #394가 `아무도 세어 본 적이 없다`고 적은 바로 그 숫자다.
 *
 * 반드시 프로덕션 빌드로 잰다. `next dev`는 Strict Mode가 effect를 두 번 실행해
 * 이벤트 수를 부풀린다(#432에서 실측 확인).
 *
 * 실행:
 *   pnpm -C apps/web build && pnpm -C apps/web exec next start --port 3010
 *   LOG_LOSS_MEASUREMENT=1 pnpm -C apps/web measure:log-loss
 */

const shouldRun = process.env.LOG_LOSS_MEASUREMENT === '1';

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/** flushSize(20)를 넘겨야 크기 기반 flush까지 관찰된다. */
const EVENTS_PER_SCENARIO = numberFromEnv('LOG_LOSS_MEASUREMENT_EVENTS', 24);

const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/log-loss');

const VIEWER_ID = 'viewer-1';
const POST_ID = 'post-1';

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

type LogQueueStats = {
  enqueued: number;
  droppedOversize: number;
  droppedOverflow: number;
  droppedUnauthorized: number;
  sent: number;
  restored: number;
};

/** `/api/logs`가 어떻게 응답하는지에 따라 어느 유실 경로가 열리는지 본다. */
type Scenario = {
  id: string;
  label: string;
  logsResponse: 'ok' | 'server-error' | 'unauthorized';
  expectation: string;
};

const SCENARIOS: Scenario[] = [
  { id: 'healthy', label: '서버 정상', logsResponse: 'ok', expectation: '전량 전송, 유실 0' },
  {
    id: 'server-error',
    label: '서버 5xx',
    logsResponse: 'server-error',
    expectation: 'restored가 쌓인다 — 서버가 적재까지 마쳤다면 그만큼이 중복 위험',
  },
  { id: 'unauthorized', label: '토큰 만료(401)', logsResponse: 'unauthorized', expectation: 'droppedUnauthorized로 전량 폐기' },
];

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

const routeApis = async (page: Page, scenario: Scenario) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('appJwt', 'measurement-token');
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  });

  // 포괄 라우트를 먼저 등록해야 뒤의 구체 라우트가 이긴다(Playwright는 역순 매칭).
  await page.route('**/api/**', (route) => route.fulfill(json({})));
  await page.route('**/_next/image**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));
  await page.route('**/cover.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }));
  await page.route('**/api/user/me', (route) => route.fulfill(json({ id: VIEWER_ID, nickname: '나', profileImgUrl: null })));
  await page.route('**/api/noti**', (route) => route.fulfill(json([])));
  await page.route('**/api/privacy', (route) => route.fulfill(json({ items: [{ id: 'c1', agreedAt: '2026-01-01' }] })));
  await page.route('**/api/comment**', (route) => route.fulfill(json({ comments: [], hasNext: false })));
  await page.route('**/api/feed**', (route) => route.fulfill(json({ posts: [post], hasNext: false })));
  await page.route(`**/api/post/${POST_ID}`, (route) => route.fulfill(json(post)));

  await page.route('**/api/logs', (route) => {
    if (scenario.logsResponse === 'server-error') return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    if (scenario.logsResponse === 'unauthorized') return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    return route.fulfill(json({ ok: true, accepted: 0 }));
  });
};

/** 게시글 상세를 열었다 닫으면 로그 이벤트가 1건 쌓인다. */
const driveOneEvent = async (page: Page) => {
  await page.getByText('게시글 내용').first().click();
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('Escape').catch(() => {});
  if (await dialog.isVisible().catch(() => false)) {
    await dialog
      .getByRole('button')
      .first()
      .click({ timeout: 5_000 })
      .catch(() => {});
  }
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });
};

const readStats = (page: Page) =>
  page.evaluate(() => {
    const read = window.__logQueueStats;
    return read ? read() : null;
  }) as Promise<LogQueueStats | null>;

const runScenario = async (page: Page, scenario: Scenario) => {
  // 버퍼·카운터가 모듈 스코프라 페이지를 새로 열면 깨끗한 상태에서 시작한다.
  await page.goto('/');
  await expect(page.getByText('게시글 내용').first()).toBeVisible({ timeout: 30_000 });

  for (let i = 0; i < EVENTS_PER_SCENARIO; i += 1) await driveOneEvent(page);
  await page.waitForTimeout(4_500); // 남은 flush 타이머까지 발화시킨다

  const stats = await readStats(page);
  if (!stats) throw new Error('window.__logQueueStats가 없다. initLogQueue가 호출되지 않았는지 확인할 것.');

  const accountedFor = stats.sent + stats.droppedUnauthorized;
  return {
    scenario: scenario.id,
    label: scenario.label,
    ...stats,
    /** 버퍼에 남아 아직 어디에도 도달하지 못한 수 */
    stillBuffered: stats.enqueued - accountedFor,
  };
};

test.skip(!shouldRun, 'Run with LOG_LOSS_MEASUREMENT=1 pnpm -C apps/web measure:log-loss');
test.setTimeout(Math.max(300_000, SCENARIOS.length * EVENTS_PER_SCENARIO * 3_000));

test('measures log loss by reason across server conditions', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  const rows: Awaited<ReturnType<typeof runScenario>>[] = [];

  for (const scenario of SCENARIOS) {
    // 시나리오마다 라우트가 달라 페이지를 새로 만든다.
    const page = await context.newPage();
    await routeApis(page, scenario);
    rows.push(await runScenario(page, scenario));
    await page.close();
  }

  await context.close();

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'loss-by-reason.json'),
    JSON.stringify({ measuredAt: new Date().toISOString(), eventsPerScenario: EVENTS_PER_SCENARIO, rows }, null, 2),
  );

  console.log(`\n[log-loss] 시나리오별 ${EVENTS_PER_SCENARIO}건 구동`);
  for (const row of rows) {
    console.log(
      `  ${row.label.padEnd(14)} 적재 ${String(row.enqueued).padStart(3)} → 전송 ${String(row.sent).padStart(3)}` +
        ` · 되돌림 ${String(row.restored).padStart(3)} · 401폐기 ${String(row.droppedUnauthorized).padStart(3)}` +
        ` · 넘침 ${String(row.droppedOverflow).padStart(3)} · 크기초과 ${String(row.droppedOversize).padStart(3)}` +
        ` · 버퍼잔류 ${String(row.stillBuffered).padStart(3)}`,
    );
  }

  expect(rows).toHaveLength(SCENARIOS.length);
});
