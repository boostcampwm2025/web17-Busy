import { expect, test, type Page, type Request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const shouldRun = process.env.SEARCH_MEASUREMENT === '1';
const SESSION_COUNT = Number.parseInt(process.env.SEARCH_MEASUREMENT_SESSIONS ?? '20', 10);
const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/search-pipeline');
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search**';
const SEARCH_TERMS = ['newjeans', 'radiohead', 'day6', 'iu', 'oasis', 'beatles', 'aespa', 'coldplay'];
const TIME_BUCKETS_MS = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000];

type MeasurementMode = 'baseline' | 'current';

type TypingAction = {
  char: string;
  delayAfterMs: number;
};

type SessionPlan = {
  id: string;
  term: string;
  actions: TypingAction[];
};

type SearchRequestEvent = {
  mode: MeasurementMode;
  sessionId: string;
  requestId: string;
  query: string;
  event: 'start' | 'finish' | 'failed';
  tsMs: number;
  failureText?: string;
};

type SessionSummary = {
  mode: MeasurementMode;
  sessionId: string;
  term: string;
  requestCount: number;
  failedCount: number;
  abortedCount: number;
  maxInFlight: number;
};

type ModeSummary = {
  mode: MeasurementMode;
  sessionCount: number;
  medianRequests: number;
  p90Requests: number;
  averageRequests: number;
  averageMaxInFlight: number;
  maxInFlightGte2Ratio: number;
};

type ModeMeasurement = {
  mode: MeasurementMode;
  events: SearchRequestEvent[];
  sessions: SessionSummary[];
  summary: ModeSummary;
  cumulativeRequestSeries: number[];
  inFlightSeries: number[];
};

type ActiveSession = {
  id: string;
  startedAt: number;
};

const testSkipMessage = 'Run with SEARCH_MEASUREMENT=1 pnpm -C apps/web measure:search';

test.skip(!shouldRun, testSkipMessage);
test.setTimeout(Math.max(120_000, SESSION_COUNT * 8_000));

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

const delayFor = (sessionIndex: number, charIndex: number) => 80 + ((sessionIndex * 37 + charIndex * 29) % 171);

const buildSessionPlans = (count: number): SessionPlan[] =>
  Array.from({ length: count }, (_, index) => {
    const term = SEARCH_TERMS[index % SEARCH_TERMS.length] ?? 'music';
    const splitIndex = Math.max(2, Math.floor(term.length / 2));
    const hasMidTypingPause = index % 3 === 2;
    const actions = [...term].map((char, charIndex) => ({
      char,
      delayAfterMs: hasMidTypingPause && charIndex === splitIndex - 1 ? 380 : delayFor(index, charIndex),
    }));

    return {
      id: `session-${String(index + 1).padStart(3, '0')}`,
      term,
      actions,
    };
  });

const createItunesResponse = (query: string) => ({
  resultCount: 1,
  results: [
    {
      trackId: Math.abs(hashQuery(query)),
      trackName: `${query} measurement track`,
      artistName: 'VIBR Measurement',
      artworkUrl100: 'https://example.com/cover-100x100bb.jpg',
      previewUrl: 'https://example.com/preview.mp3',
      trackTimeMillis: 180000,
    },
  ],
});

const hashQuery = (query: string): number => {
  let hash = 0;
  for (let i = 0; i < query.length; i += 1) {
    hash = (hash * 31 + query.charCodeAt(i)) | 0;
  }
  return hash || 1;
};

const routeStableInternalApis = async (page: Page) => {
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthenticated' }) });
  });
  await page.route('**/api/noti', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/feed**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ posts: [], hasNext: false }),
    });
  });
};

const applyBaselinePatch = async (page: Page) => {
  await page.evaluate(() => {
    const originalSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      originalSetTimeout(handler, timeout === 300 ? 0 : timeout, ...args)) as typeof window.setTimeout;

    AbortController.prototype.abort = function abort() {
      window.dispatchEvent(new CustomEvent('search-measurement-abort-noop'));
    };
  });
};

const setupItunesMeasurement = async (page: Page, mode: MeasurementMode, events: SearchRequestEvent[]) => {
  let activeSession: ActiveSession | null = null;
  let sequence = 0;
  const requestMeta = new Map<Request, { requestId: string; sessionId: string; query: string; startedAt: number }>();

  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('https://itunes.apple.com/search')) return;
    if (!activeSession) return;

    const query = new URL(url).searchParams.get('term') ?? '';
    const requestId = `${mode}-${activeSession.id}-${sequence}`;
    sequence += 1;

    requestMeta.set(request, {
      requestId,
      sessionId: activeSession.id,
      query,
      startedAt: activeSession.startedAt,
    });

    events.push({
      mode,
      sessionId: activeSession.id,
      requestId,
      query,
      event: 'start',
      tsMs: Date.now() - activeSession.startedAt,
    });
  });

  page.on('requestfinished', (request) => {
    const meta = requestMeta.get(request);
    if (!meta) return;

    events.push({
      mode,
      sessionId: meta.sessionId,
      requestId: meta.requestId,
      query: meta.query,
      event: 'finish',
      tsMs: Date.now() - meta.startedAt,
    });
  });

  page.on('requestfailed', (request) => {
    const meta = requestMeta.get(request);
    if (!meta) return;

    events.push({
      mode,
      sessionId: meta.sessionId,
      requestId: meta.requestId,
      query: meta.query,
      event: 'failed',
      tsMs: Date.now() - meta.startedAt,
      failureText: request.failure()?.errorText,
    });
  });

  await page.route(ITUNES_SEARCH_URL, async (route) => {
    const query = new URL(route.request().url()).searchParams.get('term') ?? 'music';

    await new Promise((resolve) => {
      setTimeout(resolve, 900);
    });

    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createItunesResponse(query)),
      });
    } catch {
      // The browser may abort the request before the delayed mock response is fulfilled.
    }
  });

  return {
    setActiveSession: (session: ActiveSession | null) => {
      activeSession = session;
    },
  };
};

const openSearchDrawer = async (page: Page) => {
  await page.goto('/');
  await page.getByTitle('검색').first().click();

  const input = page.getByPlaceholder('음악 검색, 사용자 검색');
  await expect(input).toBeVisible();
  return input;
};

const runSession = async (page: Page, input: ReturnType<Page['getByPlaceholder']>, plan: SessionPlan) => {
  await input.fill('');
  await page.waitForTimeout(80);

  for (const action of plan.actions) {
    await input.pressSequentially(action.char);
    await page.waitForTimeout(action.delayAfterMs);
  }

  await page.waitForTimeout(1300);
};

const computeMaxInFlight = (events: SearchRequestEvent[]): number => {
  const points = events
    .flatMap((event) => {
      if (event.event === 'start') return [{ tsMs: event.tsMs, delta: 1 }];
      return [{ tsMs: event.tsMs, delta: -1 }];
    })
    .sort((a, b) => (a.tsMs === b.tsMs ? a.delta - b.delta : a.tsMs - b.tsMs));

  let current = 0;
  let max = 0;

  for (const point of points) {
    current = Math.max(0, current + point.delta);
    max = Math.max(max, current);
  }

  return max;
};

const isAbortFailure = (event: SearchRequestEvent): boolean => {
  const text = event.failureText?.toLowerCase() ?? '';
  return text.includes('abort') || text.includes('cancel');
};

const countInFlightAt = (events: SearchRequestEvent[], bucketMs: number): number => {
  const starts = events.filter((event) => event.event === 'start' && event.tsMs <= bucketMs);

  return starts.filter((start) => {
    const end = events.find((event) => event.requestId === start.requestId && event.event !== 'start');
    return !end || end.tsMs > bucketMs;
  }).length;
};

const countRequestsAt = (events: SearchRequestEvent[], bucketMs: number): number =>
  events.filter((event) => event.event === 'start' && event.tsMs <= bucketMs).length;

const summarizeMode = (mode: MeasurementMode, plans: SessionPlan[], events: SearchRequestEvent[]): ModeMeasurement => {
  const sessions = plans.map((plan) => {
    const sessionEvents = events.filter((event) => event.sessionId === plan.id);
    const starts = sessionEvents.filter((event) => event.event === 'start');
    const failures = sessionEvents.filter((event) => event.event === 'failed');

    return {
      mode,
      sessionId: plan.id,
      term: plan.term,
      requestCount: starts.length,
      failedCount: failures.length,
      abortedCount: failures.filter(isAbortFailure).length,
      maxInFlight: computeMaxInFlight(sessionEvents),
    };
  });

  const requestCounts = sessions.map((session) => session.requestCount);
  const maxInFlightCounts = sessions.map((session) => session.maxInFlight);

  return {
    mode,
    events,
    sessions,
    summary: {
      mode,
      sessionCount: plans.length,
      medianRequests: percentile(requestCounts, 0.5),
      p90Requests: percentile(requestCounts, 0.9),
      averageRequests: average(requestCounts),
      averageMaxInFlight: average(maxInFlightCounts),
      maxInFlightGte2Ratio: round2(sessions.filter((session) => session.maxInFlight >= 2).length / sessions.length),
    },
    cumulativeRequestSeries: TIME_BUCKETS_MS.map((bucketMs) =>
      average(
        plans.map((plan) =>
          countRequestsAt(
            events.filter((event) => event.sessionId === plan.id),
            bucketMs,
          ),
        ),
      ),
    ),
    inFlightSeries: TIME_BUCKETS_MS.map((bucketMs) =>
      average(
        plans.map((plan) =>
          countInFlightAt(
            events.filter((event) => event.sessionId === plan.id),
            bucketMs,
          ),
        ),
      ),
    ),
  };
};

const toCsv = (rows: SessionSummary[]): string => {
  const header = 'mode,sessionId,term,requestCount,failedCount,abortedCount,maxInFlight';
  const body = rows.map((row) => [row.mode, row.sessionId, row.term, row.requestCount, row.failedCount, row.abortedCount, row.maxInFlight].join(','));
  return [header, ...body].join('\n');
};

const mermaidLine = (title: string, yAxis: string, baseline: number[], current: number[]) => {
  const maxY = Math.max(1, Math.ceil(Math.max(...baseline, ...current)));

  return `\`\`\`mermaid
xychart-beta
  title "${title}"
  x-axis "time(ms)" [${TIME_BUCKETS_MS.join(', ')}]
  y-axis "${yAxis}" 0 --> ${maxY}
  line "baseline" [${baseline.join(', ')}]
  line "current" [${current.join(', ')}]
\`\`\``;
};

const buildReport = (baseline: ModeMeasurement, current: ModeMeasurement): string =>
  [
    '# Search Pipeline Measurement Report',
    '',
    '## Scope',
    '',
    `- Generated at: ${new Date().toISOString()}`,
    `- Sessions per mode: ${SESSION_COUNT}`,
    '- Search API mode: controlled mock endpoint',
    '- Real iTunes API: excluded from repeated measurement because Apple documents an approximate 20 calls/min limit.',
    '',
    '## Summary',
    '',
    '| Mode | median requests | p90 requests | avg requests | avg max in-flight | max in-flight >= 2 ratio |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    `| baseline | ${baseline.summary.medianRequests} | ${baseline.summary.p90Requests} | ${baseline.summary.averageRequests} | ${baseline.summary.averageMaxInFlight} | ${baseline.summary.maxInFlightGte2Ratio} |`,
    `| current | ${current.summary.medianRequests} | ${current.summary.p90Requests} | ${current.summary.averageRequests} | ${current.summary.averageMaxInFlight} | ${current.summary.maxInFlightGte2Ratio} |`,
    '',
    '## Cumulative API Requests',
    '',
    mermaidLine('Cumulative API Requests During Search Sessions', 'avg requests', baseline.cumulativeRequestSeries, current.cumulativeRequestSeries),
    '',
    '## In-Flight Requests',
    '',
    mermaidLine('Average In-Flight Requests During Search Sessions', 'avg in-flight requests', baseline.inFlightSeries, current.inFlightSeries),
    '',
    '## Notes',
    '',
    '- baseline disables the 300ms debounce timer and makes AbortController.abort() a no-op in the browser context.',
    '- current uses the production search hook behavior.',
    '- This measures real browser input timing and Playwright network events, but uses a controlled mock iTunes endpoint to avoid exceeding external API limits.',
    '',
  ].join('\n');

const writeMeasurementFiles = async (baseline: ModeMeasurement, current: ModeMeasurement) => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all([
    fs.writeFile(path.join(OUTPUT_DIR, 'raw-baseline.json'), JSON.stringify(baseline.events, null, 2)),
    fs.writeFile(path.join(OUTPUT_DIR, 'raw-current.json'), JSON.stringify(current.events, null, 2)),
    fs.writeFile(path.join(OUTPUT_DIR, 'summary.json'), JSON.stringify({ baseline: baseline.summary, current: current.summary }, null, 2)),
    fs.writeFile(path.join(OUTPUT_DIR, 'summary.csv'), toCsv([...baseline.sessions, ...current.sessions])),
    fs.writeFile(path.join(OUTPUT_DIR, 'report.md'), buildReport(baseline, current)),
  ]);
};

const runModeMeasurement = async (page: Page, mode: MeasurementMode, plans: SessionPlan[]) => {
  const events: SearchRequestEvent[] = [];

  await routeStableInternalApis(page);
  const measurement = await setupItunesMeasurement(page, mode, events);
  const input = await openSearchDrawer(page);

  if (mode === 'baseline') {
    await applyBaselinePatch(page);
  }

  for (const plan of plans) {
    measurement.setActiveSession({ id: plan.id, startedAt: Date.now() });
    await runSession(page, input, plan);
    measurement.setActiveSession(null);
  }

  return summarizeMode(mode, plans, events);
};

test('records search request and in-flight measurements with a controlled iTunes mock', async ({ browser }) => {
  const plans = buildSessionPlans(SESSION_COUNT);

  const baselineContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const baselinePage = await baselineContext.newPage();
  const baseline = await runModeMeasurement(baselinePage, 'baseline', plans);
  await baselineContext.close();

  const currentContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const currentPage = await currentContext.newPage();
  const current = await runModeMeasurement(currentPage, 'current', plans);
  await currentContext.close();

  await writeMeasurementFiles(baseline, current);

  expect(current.summary.medianRequests).toBeLessThan(baseline.summary.medianRequests);
});
