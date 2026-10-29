# Runbook: coverage gate

`validate-test` fails when any of statements, branches, functions, or lines on `src/**/*.{ts,tsx}` is under **95%**. The script is [`.github/scripts/coverage-gate.mjs`](../.github/scripts/coverage-gate.mjs). It reads `coverage/coverage-summary.json`. Vitest itself does not enforce the number.

## Reproduce

```bash
npm ci
npm run test:ci
```

`COVERAGE_THRESHOLD` overrides the number for a local experiment. CI does not set it.

## What usually dropped it

- A new branch in `src/pages/DashboardPage.tsx` or `src/layouts/AppShellLayout.tsx` without an assertion in `test/e2e/app-flows.test.tsx`.
- A `renderHook` call that builds a new `filters` object on every render. `useDashboardData` restarts the timer and stays on `loading`. Pass a stable object.
- `vitest.config.ts` started loading the app Vite config. Keep the federation plugin out of the test runner.

## Fix

Add or adjust a test, then re-run `npm run test:ci`. Do not lower the threshold in CI to make the job green.
