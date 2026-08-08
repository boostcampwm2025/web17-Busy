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

## Test Utilities

Use `src/test/render-with-query-client.ts` when testing components or hooks that need TanStack Query.

The test QueryClient disables retry by default so failed query and mutation states can be asserted deterministically.

## Current Baseline

This foundation adds the minimum smoke tests needed to verify that the test runners are wired correctly.

Domain regression tests should be added in focused follow-up PRs.
