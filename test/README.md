# Tests

Vitest 5, happy-dom and Testing Library, laid out like platform-reactcommon's `test/`. `npm test` runs every suite; `npm run test:ci` adds coverage and the 95% gate (`.github/scripts/coverage-gate.mjs`).

| Suite | Command | What it covers |
|---|---|---|
| `unit/` | `npm run test:unit` | One area of `src/` at a time, grouped by folder (below). |
| `integration/` | `npm run test:integration` | The built remote, loaded the way web-shell loads it. |
| `e2e/` | `npm run test:e2e` | User flows through the whole `App`: filters, search, refresh, user menu, logout, standalone redirect. |

The Docker image is smoke-tested in CI by `.github/scripts/smoke-tests.sh`: size, `/healthz`, `/`, `remoteEntry.js` and no source maps.

## `unit/`

| Folder | Covers |
|---|---|
| `architecture/` | The constitution's layers: exactly `app`, `presentation`, `application`, `domain`, `infrastructure`, `shared` under `src/`; import directions; no React, SDK or browser API in `domain/` and `application/`; no SDK storage, metrics or config in `presentation/` (ADR 0001) |
| `domain/` | The domain rules (views, filters, deadline, SLA, search) as pure functions of the sample tickets and members |
| `application/` | The use cases over in-memory repositories (no React, no SDK runtime) |
| `app/` | the shipped `runtime.json` files against the SDK's `RuntimeConfigSchema`; `goToSignIn` (runtime `auth.signInUrl`, else `/`); the standalone `MFEErrorBoundary`; the labelled search box; `App` with the SDK (user, sign-out, props from the shell), the workspace basename and routing under `/t/<slug>/dashboard`, `main.tsx`, `AppShellLayout` (user button, the page error boundary that clears on navigation) |
| `authz/` | User management under `read:members` / `manage:members` and a read-only tenant; the approval step-up (`useStepUp`) |
| `dashboard/` | `useDashboardData` (fake timers), load errors (an injected failing repository: SDK `ApiError` → alert, Retry, a `warn` log), the deadline filter (calendar days as strings, across a year end) and KPI counts, the dashboard page's filters and formatted dates, `aria-pressed` on the selected view and the persistent loading status |
| `components/` | Presentational components (logos, icons, ticket rows, theme picker, filter selects) and keyboard behaviour (user menu and theme picker menu keys, Escape, the drawer's focus trap) |
| `theme/` | Theme mode and app theme in `storage('dashboard')` |
| `i18n/` | `dashboard` messages through the SDK (plurals, fallback), and the `en` catalog against the source: no missing keys, no unused keys, every message formats |
| `docs/` | `ARCHITECTURE.md`'s mermaid fences equal `docs/architecture/mermaid/*.mmd` |
| `sdk/` | Dependency rules: the remote uses the platform SDK and does not reimplement it (no `Intl` formatters, `fetch`, token or cookie reading, role-name checks, browser storage, hand-made workspace paths or sign-out, metrics outside `src/infrastructure/telemetry/metrics.ts` or not through the SDK, OpenTelemetry or Prometheus clients, host-page start-up outside `src/infrastructure/configuration/standalone.ts`, shell-only APIs (manifest, remotes, auth, flags), `console` outside the standalone config warning; SDK imports only from public subpaths; the SDK stays a peer dependency) |

## `integration/remote-entry.test.tsx`

Builds the `remote` environment of `rsbuild.config.ts` into a temporary directory (`fixtures/remote-build.ts`, in a child process; `dist/` is untouched). It then runs `remoteEntry.js` as a classic script and checks:

- `var __platform_mfe_dashboard` is defined synchronously as `{ init, get }`, as the SDK's `loadRemote` reads it;
- every share key the container consumes is one the shell provides, and no SDK code is bundled;
- `init(shareScope)` then `get('./App')` renders the dashboard with the test's own React and SDK handed over as the shell's singletons (the signed-in user proves the SDK is the shell's);
- without the shell's SDK the load fails, because there is no fallback copy, and an unknown module is rejected;
- every lazy stylesheet is pinned by its sha384;
- built with the old `PUBLIC_APP1_URL` / `VITE_APP1_URL` set, no environment-specific value reaches the bundle (build once, deploy everywhere; ADR 0006);
- the logos are emitted under `assets/` and loaded from the remote's public path (`__webpack_require__.p`), never a root-relative `/image/…` that would resolve on the shell's origin.

The only stub is the network: `<script>` and `<link>` tags the container appends are answered from the build output.

## Metrics (`unit/metrics/metrics.test.tsx`)

CI validation of the observability standard for `src/infrastructure/telemetry/metrics.ts`: Tier 3 namespace (`portal_dashboard_*`, not `platform_*`, a registry or a legacy name), `_total` / `_seconds` suffixes, no central or prohibited label and at most 8, closed value sets (registry vocabularies for registry labels), SDK acceptance with `domain="portal"`, `service="dashboard"` injected, and the inventory table in `docs/observability/metrics.md`. Then what is recorded: finished loads by view, trigger and outcome, errors, no superseded loads, the step-up click, dropped out-of-set values, and nothing (one warning) without the manifest.

## Standalone host page (`unit/app/standalone-*.test.ts`)

`src/infrastructure/configuration/standalone.ts` sets the page identity and runtime config, which the SDK allows only once per page. Each test file has its own SDK, and `setup.ts` starts the test platform in `beforeEach`, so these files do their work in `beforeAll`, on an SDK in the same state `main.tsx` sees:

- `standalone-config.test.ts`: the identity is `mfe-dashboard` / `portal` in the `environment` the file names; `/config/runtime.json` is fetched once and set (the shipped `public/config/runtime.json` plus a `signInUrl`, so the strict SDK schema also validates the shipped file); logout goes to `auth.signInUrl`.
- `standalone-no-config.test.ts`: a 404 is a warning (one console line in local, from the SDK), the page still starts with no config, and logout goes to the page root (nothing is compiled in).
- `standalone-no-config-prod.test.ts`: a build (`DEV` false) without the file runs as `prod`, and the warning still reaches the console through the SDK logger (alpha.6); there is no `console` call in `src/`.
- `standalone-build.test.ts`: `rsbuild.config.ts` gives the standalone environment `assetPrefix: '/'` and leaves the remote's to the preset.

`shell-layout.test.tsx` covers a page that already has a config (nothing is fetched) and `main.test.ts` waits for `startStandalone` before the render.

## Browser (`browser/`, Playwright)

`npm run test:browser` builds, then runs Chromium against `rsbuild preview` of the production build (`playwright.config.ts`). Each test serves the environment's `runtime.json` itself (`config/runtime.local.json` with `environment: test`), as a deployment mounts it. It covers:
- **Journeys:** switch views; filter (Escape closes and returns focus), clear and search; reload a nested route (root-absolute assets, and an unknown path back to the dashboard); log out to `auth.signInUrl`.
- **Accessibility:** axe-core (`browser/axe.ts`) checks WCAG 2.1 A/AA on the dashboard, the open filter drawer and the dark theme, and fails on any violation (ADR 0009).

The standalone page runs anonymously, so User management is covered here by e2e and in web-shell's contract suite.

## Fixtures and setup

- `fixtures/dependencies.tsx`: `testDependencies(overrides)` and `withDependencies(deps)`, the composition root's repositories for a page, layout or hook rendered outside `App`, or a failing or slow repository in their place (no module mocks).

- `setup.ts`: a fresh `createTestPlatform` runtime per test (signed in, `MANAGER` grants, `dashboard` messages registered), plus DOM and storage cleanup. Since SDK `1.0.0-alpha.3` the test platform sets the storage workspace, so `storage()` is real.
- `fixtures/platform.ts`: `startPlatform()` and the permission sets `MANAGER`, `VIEWER`, `MANAGE_ONLY` and `NO_MEMBER_ACCESS`. Which roles get them is web-shell's role map; the tests do not copy it.
- `fixtures/remote-build.ts`: `buildRemote()`, the temporary remote build.

## Writing tests

- Use the SDK's test platform (`startPlatform`, `platform.Wrapper`) rather than mocking SDK modules.
- `useDashboardData` waits 700 ms to load and 400 ms to refresh. Pass a **stable** filters object into `renderHook`.
- A new UI string goes in `src/app/configuration/locales/en.json`. `unit/i18n/catalog.test.ts` fails on a missing or unused key. A new view, SLA state or user status is a type error there until its keys are listed.
