import { expect, test, type Page, type Request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * 활성 사용자 1명이 만드는 로그 이벤트 발생률 측정.
 *
 * 실사용자가 없으므로 `운영 발생률`은 잴 수 없다. 대신 잴 수 있는 것을 잰다.
 * 게시글을 D초씩 보며 훑는 사용자 한 명이 초당 몇 건을 만드는지다.
 * 체류 시간 D는 알 수 없는 값이므로 가정하지 않고 스윕한다.
 * 그러면 스트림 용량 한계(초당 11.1건)를 `동시 활성 사용자 몇 명`으로 환산할 수 있다.
 *
 * 상세 모달의 1초 tick은 ref만 갱신하고 로그를 만들지 않는다(확인함).
 * 따라서 체류 중에는 이벤트가 늘지 않고, 발생률은 `조회당 이벤트 / 조회 주기`로 결정된다.
 *
 * 실행:
 *   LOG_RATE_MEASUREMENT=1 pnpm exec playwright test e2e/log-event-rate-measurement.spec.ts --project=chromium
 */

const shouldRun = process.env.LOG_RATE_MEASUREMENT === '1';

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/** 체류 시간 후보(ms). 알 수 없는 값이라 가정하지 않고 여러 조건을 잰다. */
const DWELL_MS_LIST = (process.env.LOG_RATE_MEASUREMENT_DWELLS ?? '2000,5000,10000')
  .split(',')
  .map((v) => Number.parseInt(v.trim(), 10))
  .filter((v) => Number.isFinite(v) && v > 0);

const VIEWS_PER_DWELL = numberFromEnv('LOG_RATE_MEASUREMENT_VIEWS', 5);

/** logs.service.ts의 LOG_STREAM_MAXLEN / 컨슈머 크론 주기(초). 실측으로 확인한 유실 시작점이다. */
const STREAM_CAPACITY_PER_SEC = 20_000 / 1_800;

const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/log-event-rate');

const VIEWER_ID = 'viewer-1';
const POST_ID = 'post-1';

const TRANSPARENT_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

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

const routeApis = async (page: Page) => {
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
};

const countEventsIn = (request: Request): number => {
  try {
    const body = JSON.parse(request.postData() ?? '{}') as { events?: unknown[] };
    return Array.isArray(body.events) ? body.events.length : 0;
  } catch {
    return 0;
  }
};

const viewOnePost = async (page: Page, dwellMs: number) => {
  await page.getByText('게시글 내용').first().click();
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  await page.waitForTimeout(dwellMs); // 사용자가 게시글을 보는 시간

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

test.skip(!shouldRun, 'Run with LOG_RATE_MEASUREMENT=1 pnpm -C apps/web measure:log-rate');
test.setTimeout(Math.max(300_000, DWELL_MS_LIST.reduce((sum, d) => sum + (d + 3_000) * VIEWS_PER_DWELL, 0) + DWELL_MS_LIST.length * 20_000));

test('measures log event rate per active user across dwell times', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await routeApis(page);

  let events = 0;
  page.on('request', (request) => {
    if (request.method() !== 'POST') return;
    if (!request.url().includes('/api/logs')) return;
    events += countEventsIn(request);
  });

  const rows: Record<string, number>[] = [];

  for (const dwellMs of DWELL_MS_LIST) {
    // 버퍼는 모듈 스코프라 새로 열면 비워진다. 조건 간 이월을 막는다.
    await page.goto('/');
    await expect(page.getByText('게시글 내용').first()).toBeVisible({ timeout: 30_000 });

    events = 0;
    const startedAt = Date.now();
    for (let i = 0; i < VIEWS_PER_DWELL; i += 1) await viewOnePost(page, dwellMs);
    await page.waitForTimeout(4_500); // 남은 flush 타이머까지 발화시켜 버퍼를 비운다
    const elapsedSec = (Date.now() - startedAt) / 1000;

    const eventsPerView = events / VIEWS_PER_DWELL;
    const eventsPerSec = events / elapsedSec;
    const ceilingUsers = eventsPerSec === 0 ? 0 : STREAM_CAPACITY_PER_SEC / eventsPerSec;

    rows.push({
      dwellMs,
      views: VIEWS_PER_DWELL,
      events,
      elapsedSec: Number(elapsedSec.toFixed(2)),
      eventsPerView: Number(eventsPerView.toFixed(2)),
      eventsPerSec: Number(eventsPerSec.toFixed(4)),
      concurrentUserCeiling: Math.floor(ceilingUsers),
    });

     
    console.log(
      `  체류 ${String(dwellMs / 1000).padStart(4)}초 · 조회 ${VIEWS_PER_DWELL}회 → 이벤트 ${String(events).padStart(3)}건 / ${elapsedSec.toFixed(1)}초` +
        ` = 초당 ${eventsPerSec.toFixed(3)}건  →  동시 활성 사용자 한계 약 ${Math.floor(ceilingUsers)}명`,
    );
  }

  await context.close();

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'event-rate.json'),
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        note: '실사용자가 없어 운영 발생률은 잴 수 없다. 활성 사용자 1명의 발생률을 체류 시간별로 재고, 스트림 한계를 동시 사용자 수로 환산했다.',
        streamCapacityPerSec: Number(STREAM_CAPACITY_PER_SEC.toFixed(2)),
        capacitySource: 'MAXLEN 20000 / 크론 주기 1800초. measurements/log-pipeline-be에서 실측 확인',
        rows,
      },
      null,
      2,
    ),
  );

  expect(rows.length).toBe(DWELL_MS_LIST.length);
});
