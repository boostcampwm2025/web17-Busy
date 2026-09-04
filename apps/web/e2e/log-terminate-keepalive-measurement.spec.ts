import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * pagehide(flushOnTerminate, fetch keepalive)가 탭 즉시 종료 시 얼마나 살아남는지 네트워크
 * 지연을 흉내 내 근사 측정한다(#441 TODO의 로컬 근사판, 실배포 실측을 대체하지 않는다).
 *
 * localhost는 왕복 지연이 거의 0이라 keepalive가 항상 페이지 파괴보다 먼저 끝난다. 실제 유실은
 * RTT가 있는 환경에서만 보이므로 CDP Network.emulateNetworkConditions로 지연을 흉내 낸다.
 *
 * /api/logs는 page.route로 가로채지 않는다 — Fetch 도메인 인터셉션은 CDP 세션에 묶여 있어
 * page.close()로 세션이 끊기면 continue 못 받은 요청이 실제와 무관하게 막힐 수 있다(측정
 * 장치가 측정 대상을 왜곡). 대신 `e2e/support/log-terminate-proxy-server.mjs`가 3010에서
 * 진짜 리버스 프록시로 미리 떠 있어야 한다 — CDP를 안 거치는 진짜 소켓이라 페이지 생명주기와
 * 무관하게 도착을 관찰할 수 있고, playwright.config.ts의 webServer가 3010을 선점하는 것도
 * 막는다. next.config.js의 `/api` rewrite는 프로덕션 빌드(`next start`)에서 꺼지므로 이
 * 프록시 없이는 애초에 안 된다.
 *
 * 반드시 프로덕션 빌드로 잰다(#432, next dev는 Strict Mode로 수치가 왜곡된다).
 *
 * 실행:
 *   pnpm -C apps/web build && pnpm -C apps/web exec next start --port 3011
 *   node e2e/support/log-terminate-proxy-server.mjs &
 *   LOG_TERMINATE_MEASUREMENT=1 pnpm -C apps/web measure:log-terminate
 *
 * 주의: 모든 지연 구간이 100%로 나오면 CDP 스로틀링이 keepalive 경로엔 안 걸렸다는 신호다 —
 * 그 경우 이 수치는 안전 쪽으로 편향된 근사로 읽는다.
 */

const shouldRun = process.env.LOG_TERMINATE_MEASUREMENT === '1';

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const numberListFromEnv = (name: string, fallback: number[]) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = raw
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return parsed.length > 0 ? parsed : fallback;
};

/** RTT 근사치: 0(로컬 기준선) · 100(양호한 LTE) · 300(혼잡한 3G) · 600(열악한 모바일) */
const LATENCIES_MS = numberListFromEnv('LOG_TERMINATE_MEASUREMENT_LATENCIES', [0, 100, 300, 600]);
const TRIALS_PER_LATENCY = numberFromEnv('LOG_TERMINATE_MEASUREMENT_TRIALS', 6);

const PROXY_PORT = 3010;
const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/log-terminate-keepalive');

/** e2e/support/log-terminate-proxy-server.mjs가 미리 떠 있어야 한다(파일 상단 실행 안내 참고). */
const ensureProxyIsUp = async () => {
  const res = await fetch(`http://127.0.0.1:${PROXY_PORT}/__test__/arrivals`).catch(() => null);
  if (!res?.ok) {
    throw new Error(`log-terminate-proxy-server가 ${PROXY_PORT}에 떠 있지 않다. 먼저 실행: node e2e/support/log-terminate-proxy-server.mjs`);
  }
};

const getArrivalCount = async (): Promise<number> => {
  const res = await fetch(`http://127.0.0.1:${PROXY_PORT}/__test__/arrivals`);
  const data = (await res.json()) as { count: number };
  return data.count;
};

type LogQueueStats = { sent: number };

/** 닫기 직전 `sent`가 0보다 크면 주기 flush(3000ms)가 pagehide보다 먼저 비운 것이다 — keepalive를 시험 못 한 오염 트라이얼로 표시한다. */
const readSentBeforeClose = (page: Page) =>
  page.evaluate(() => {
    const read = (window as unknown as { __logQueueStats?: () => LogQueueStats }).__logQueueStats;
    return read ? read().sent : null;
  });

/** 게시글 상세를 열었다 닫으면 로그 이벤트가 1건 쌓인다(flushSize=20 미만이라 pagehide까지 버퍼에 남는다). */
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

test.skip(!shouldRun, 'Run with LOG_TERMINATE_MEASUREMENT=1 pnpm -C apps/web measure:log-terminate');
test.setTimeout(Math.max(300_000, LATENCIES_MS.length * TRIALS_PER_LATENCY * 15_000));

test('measures pagehide keepalive survival rate under simulated RTT', async ({ browser }) => {
  await ensureProxyIsUp();

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const rows: { latencyMs: number; trial: number; arrived: boolean; contaminated: boolean }[] = [];

  try {
    for (const latencyMs of LATENCIES_MS) {
      for (let trial = 0; trial < TRIALS_PER_LATENCY; trial += 1) {
        const page = await context.newPage();
        await page.addInitScript(() => {
          sessionStorage.setItem('appJwt', 'measurement-token');
          localStorage.setItem('pwa-install-dismissed', String(Date.now()));
        });

        // 로드/상호작용엔 지연을 안 건다 — 걸면 로드가 느려져 주기 flush(3000ms)가 pagehide보다 먼저 비울 위험이 커진다.
        await page.goto('/');
        await expect(page.getByText('게시글 내용').first()).toBeVisible({ timeout: 30_000 });
        await driveOneEvent(page);

        const sentBeforeClose = await readSentBeforeClose(page);
        const contaminated = sentBeforeClose !== 0; // 0이 아니면 pagehide보다 먼저 주기 flush가 이미 보냈다는 뜻

        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: latencyMs,
          downloadThroughput: -1,
          uploadThroughput: -1,
        });

        const before = await getArrivalCount();
        await page.close(); // pagehide -> flushOnTerminate -> keepalive fetch

        // 응답을 기다리지 않는 fire-and-forget이라, 지연 왕복 + 여유를 두고 폴링으로 도착을 확인한다.
        await new Promise((resolve) => setTimeout(resolve, latencyMs * 4 + 1_000));

        const after = await getArrivalCount();
        rows.push({ latencyMs, trial, arrived: after > before, contaminated });
      }
    }
  } finally {
    await context.close();
  }

  const summary = LATENCIES_MS.map((latencyMs) => {
    const forLatency = rows.filter((r) => r.latencyMs === latencyMs);
    const valid = forLatency.filter((r) => !r.contaminated);
    const arrived = valid.filter((r) => r.arrived).length;
    return {
      latencyMs,
      trials: forLatency.length,
      contaminated: forLatency.length - valid.length,
      validTrials: valid.length,
      arrived,
      successRate: valid.length > 0 ? arrived / valid.length : null,
    };
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'keepalive-survival-by-latency.json'),
    JSON.stringify({ measuredAt: new Date().toISOString(), trialsPerLatency: TRIALS_PER_LATENCY, summary, rows }, null, 2),
  );

  console.log('\n[log-terminate-keepalive] 지연별 keepalive 생존율 (탭 즉시 종료 근사)');
  for (const s of summary) {
    const rate = s.successRate === null ? 'N/A(전부 오염)' : `${(s.successRate * 100).toFixed(0)}%`;
    console.log(
      `  RTT ${String(s.latencyMs).padStart(4)}ms  도착 ${s.arrived}/${s.validTrials}(유효)  오염 ${s.contaminated}/${s.trials}  생존율 ${rate}`,
    );
  }

  expect(summary).toHaveLength(LATENCIES_MS.length);
});
