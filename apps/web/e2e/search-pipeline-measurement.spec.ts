import { expect, test, type Browser, type Page, type Request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const shouldRun = process.env.SEARCH_MEASUREMENT === '1';
const SESSION_COUNT = numberFromEnv('SEARCH_MEASUREMENT_SESSIONS', 20);
const OUTPUT_DIR = path.resolve(process.cwd(), '../../coverage/local-notes/measurements/search-pipeline');
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search**';
const SEARCH_TERMS = ['newjeans', 'radiohead', 'day6', 'iu', 'oasis', 'beatles', 'aespa', 'coldplay'];
const TIME_BUCKET_STEP_MS = 200;
const MEASUREMENT_WINDOW_MS = numberFromEnv('SEARCH_MEASUREMENT_WINDOW_MS', 3000);
const MOCK_ITUNES_RESPONSE_DELAY_MS = numberFromEnv('SEARCH_MEASUREMENT_MOCK_DELAY_MS', 900);
const TIME_BUCKETS_MS = Array.from(
  { length: Math.floor(MEASUREMENT_WINDOW_MS / TIME_BUCKET_STEP_MS) + 1 },
  (_, index) => index * TIME_BUCKET_STEP_MS,
);

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
      setTimeout(resolve, MOCK_ITUNES_RESPONSE_DELAY_MS);
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

const reductionPercent = (before: number, after: number) => {
  if (before <= 0) return 0;
  return round2(((before - after) / before) * 100);
};

const buildChartHtml = (title: string, yAxis: string, baseline: number[], current: number[]) => {
  const width = 960;
  const height = 540;
  const margin = { top: 72, right: 48, bottom: 76, left: 72 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxY = Math.max(1, Math.ceil(Math.max(...baseline, ...current)));
  const xMaxIndex = Math.max(1, TIME_BUCKETS_MS.length - 1);
  const xAt = (index: number) => margin.left + (index / xMaxIndex) * plotWidth;
  const yAt = (value: number) => margin.top + plotHeight - (value / maxY) * plotHeight;
  const pathFor = (series: number[]) =>
    series.map((value, index) => `${index === 0 ? 'M' : 'L'} ${round2(xAt(index))} ${round2(yAt(value))}`).join(' ');
  const yTicks = Array.from({ length: maxY + 1 }, (_, index) => index);
  const xTickIndexes = TIME_BUCKETS_MS.map((_, index) => index).filter((index) => index % 2 === 0 || index === TIME_BUCKETS_MS.length - 1);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; background: #ffffff; font-family: Inter, Arial, sans-serif; }
      #chart { width: ${width}px; height: ${height}px; background: #ffffff; }
      .title { font-size: 26px; font-weight: 700; fill: #111827; }
      .label { font-size: 14px; fill: #4b5563; }
      .tick { font-size: 12px; fill: #6b7280; }
      .grid { stroke: #e5e7eb; stroke-width: 1; }
      .axis { stroke: #9ca3af; stroke-width: 1.4; }
      .baseline { stroke: #2563eb; stroke-width: 4; fill: none; }
      .current { stroke: #dc2626; stroke-width: 4; fill: none; }
      .legend-text { font-size: 14px; fill: #374151; }
    </style>
  </head>
  <body>
    <div id="chart">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
        <text x="${margin.left}" y="38" class="title">${title}</text>
        <text x="${margin.left}" y="62" class="label">window ${MEASUREMENT_WINDOW_MS}ms, bucket ${TIME_BUCKET_STEP_MS}ms, mock delay ${MOCK_ITUNES_RESPONSE_DELAY_MS}ms</text>
        ${yTicks
          .map((tick) => {
            const y = round2(yAt(tick));
            return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="grid" /><text x="${margin.left - 14}" y="${y + 4}" text-anchor="end" class="tick">${tick}</text>`;
          })
          .join('')}
        ${xTickIndexes
          .map((index) => {
            const x = round2(xAt(index));
            const label = TIME_BUCKETS_MS[index] ?? 0;
            return `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 6}" class="axis" /><text x="${x}" y="${height - margin.bottom + 24}" text-anchor="middle" class="tick">${label}</text>`;
          })
          .join('')}
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" class="axis" />
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" class="axis" />
        <path d="${pathFor(baseline)}" class="baseline" />
        <path d="${pathFor(current)}" class="current" />
        <text x="${width / 2}" y="${height - 18}" text-anchor="middle" class="label">time(ms)</text>
        <text x="20" y="${height / 2}" transform="rotate(-90 20 ${height / 2})" text-anchor="middle" class="label">${yAxis}</text>
        <line x1="${width - 220}" y1="38" x2="${width - 180}" y2="38" class="baseline" />
        <text x="${width - 170}" y="43" class="legend-text">baseline</text>
        <line x1="${width - 220}" y1="62" x2="${width - 180}" y2="62" class="current" />
        <text x="${width - 170}" y="67" class="legend-text">current</text>
      </svg>
    </div>
  </body>
</html>`;
};

const writeMeasurementCharts = async (browser: Browser, baseline: ModeMeasurement, current: ModeMeasurement) => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const charts = [
    {
      title: 'Cumulative API Requests',
      yAxis: 'avg requests',
      fileName: 'cumulative-api-requests.png',
      baseline: baseline.cumulativeRequestSeries,
      current: current.cumulativeRequestSeries,
    },
    {
      title: 'Average In-Flight Requests',
      yAxis: 'avg in-flight requests',
      fileName: 'in-flight-requests.png',
      baseline: baseline.inFlightSeries,
      current: current.inFlightSeries,
    },
  ];

  for (const chart of charts) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
    await page.setContent(buildChartHtml(chart.title, chart.yAxis, chart.baseline, chart.current));
    await page.locator('#chart').screenshot({ path: path.join(OUTPUT_DIR, chart.fileName) });
    await page.close();
  }
};

const buildReport = (baseline: ModeMeasurement, current: ModeMeasurement): string => {
  const averageRequestReduction = reductionPercent(baseline.summary.averageRequests, current.summary.averageRequests);
  const riskSessionReduction = reductionPercent(baseline.summary.maxInFlightGte2Ratio, current.summary.maxInFlightGte2Ratio);

  return [
    '# Search Pipeline Measurement Report',
    '',
    '## Scope',
    '',
    `- Generated at: ${new Date().toISOString()}`,
    `- Sessions per mode: ${SESSION_COUNT}`,
    `- Measurement window: ${MEASUREMENT_WINDOW_MS}ms`,
    `- Time bucket interval: ${TIME_BUCKET_STEP_MS}ms`,
    `- Mock iTunes response delay: ${MOCK_ITUNES_RESPONSE_DELAY_MS}ms`,
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
    '## Interpretation',
    '',
    `- Average request count decreased by ${averageRequestReduction}% (${baseline.summary.averageRequests} -> ${current.summary.averageRequests}).`,
    `- Sessions with max in-flight >= 2 decreased by ${riskSessionReduction}% (${baseline.summary.maxInFlightGte2Ratio} -> ${current.summary.maxInFlightGte2Ratio}).`,
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
    '- The time-series charts use fixed-window averaging: every bucket includes every session; completed sessions keep their final cumulative request count and contribute 0 in-flight after requests settle.',
    '- The peak of the average in-flight line can be lower than average max in-flight because average(peak per session) is not the same as peak(average time series).',
    '- Real iTunes API sanity checks are intentionally separate from this repeated measurement script.',
    '',
  ].join('\n');
};

const writeMeasurementFiles = async (baseline: ModeMeasurement, current: ModeMeasurement) => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all([
    fs.writeFile(path.join(OUTPUT_DIR, 'raw-baseline.json'), JSON.stringify(baseline.events, null, 2)),
    fs.writeFile(path.join(OUTPUT_DIR, 'raw-current.json'), JSON.stringify(current.events, null, 2)),
    fs.writeFile(
      path.join(OUTPUT_DIR, 'summary.json'),
      JSON.stringify(
        {
          measurement: {
            sessionCount: SESSION_COUNT,
            windowMs: MEASUREMENT_WINDOW_MS,
            bucketIntervalMs: TIME_BUCKET_STEP_MS,
            mockItunesResponseDelayMs: MOCK_ITUNES_RESPONSE_DELAY_MS,
            apiMode: 'controlled mock endpoint',
          },
          baseline: baseline.summary,
          current: current.summary,
        },
        null,
        2,
      ),
    ),
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
  await writeMeasurementCharts(browser, baseline, current);

  expect(current.summary.medianRequests).toBeLessThan(baseline.summary.medianRequests);
});
