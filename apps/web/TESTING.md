# Frontend Testing

## Scope

`apps/web` uses two test layers.

| Layer             | Tool                                 | Purpose                                                                 |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Unit/component    | Vitest, React Testing Library, jsdom | hooks, query key factories, cache updater logic, lightweight components |
| Browser smoke/E2E | Playwright                           | browser rendering and user-flow regression tests                        |

## Commands

Run unit tests:

```bash
pnpm -C apps/web test
```

Run unit tests in watch mode:

```bash
pnpm -C apps/web test:watch
```

Run unit tests with coverage:

```bash
pnpm -C apps/web test:coverage
```

Install Playwright browser binaries:

```bash
pnpm -C apps/web exec playwright install chromium
```

Run browser smoke tests:

```bash
pnpm -C apps/web test:e2e
```

Run search pipeline measurement:

```bash
pnpm -C apps/web measure:search
```

The measurement spec uses real browser input timing and Playwright network events with a controlled iTunes mock endpoint.
Outputs are written to a local-only measurement directory.
The command also writes PNG line charts for cumulative requests and in-flight requests.

Adjust the sample size:

```bash
SEARCH_MEASUREMENT_SESSIONS=50 pnpm -C apps/web measure:search
```

Adjust the measurement window or mock response delay:

```bash
SEARCH_MEASUREMENT_WINDOW_MS=3000 SEARCH_MEASUREMENT_MOCK_DELAY_MS=900 pnpm -C apps/web measure:search
```

Do not use repeated real iTunes API calls for this measurement. Apple documents an approximate Search API limit of 20 calls per minute, so repeated measurements must use the controlled mock endpoint.

Run profile posts request measurement:

```bash
pnpm -C apps/web measure:profile-posts
```

The measurement loads `/profile/:userId/posts` and then opens the post detail modal, counting profile list and post detail API requests separately.
Backend responses are stubbed with Playwright route interception, so no API server or database is required.

Select the mode. `baseline` records the current structure and `current` records the structure after the N+1 fix:

```bash
PROFILE_POSTS_MEASUREMENT_MODE=current pnpm -C apps/web measure:profile-posts
```

Each mode writes its own raw and summary files, and `report.md` is rebuilt as a comparison as soon as both modes exist.

Adjust the sample size, page size, or mock latency:

```bash
PROFILE_POSTS_MEASUREMENT_SESSIONS=20 PROFILE_POSTS_MEASUREMENT_PAGE_SIZE=12 PROFILE_POSTS_MEASUREMENT_MOCK_DELAY_MS=120 pnpm -C apps/web measure:profile-posts
```

## Test Utilities

Use `src/test/render-with-query-client.ts` when testing components or hooks that need TanStack Query.

The test QueryClient disables retry by default so failed query and mutation states can be asserted deterministically.

## Current Baseline

This foundation adds the minimum smoke tests needed to verify that the test runners are wired correctly.

Domain regression tests should be added in focused follow-up PRs.
