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
| `app/` | `config/app1Url.ts`; the standalone `MFEErrorBoundary`; the labelled search box; `App` with the SDK (user, sign-out, props from the shell), the workspace basename and routing under `/t/<slug>/dashboard`, `main.tsx`, `AppShellLayout` (user button, `defaultLogout`, the page error boundary that clears on navigation) |
| `authz/` | User management under `read:members` / `manage:members` and a read-only tenant; the approval step-up (`useStepUp`) |
| `dashboard/` | `ticketsForView`, `useDashboardData` (fake timers), load errors (SDK `ApiError` → alert, Retry, a `warn` log), the deadline filter and KPI counts, `calendarDate`, the dashboard page's filters and formatted dates, `aria-pressed` on the selected view and the persistent loading status |
| `components/` | Presentational components (logos, icons, ticket rows, theme picker, filter selects) and keyboard behaviour (user menu and theme picker menu keys, Escape, the drawer's focus trap) |
| `theme/` | Theme mode and app theme in `storage('dashboard')` |
| `i18n/` | `dashboard` messages through the SDK (plurals, fallback), and the `en` catalog against the source: no missing keys, no unused keys, every message formats |
| `docs/` | `ARCHITECTURE.md`'s mermaid fences equal `docs/architecture/mermaid/*.mmd` |
| `sdk/` | Dependency rules: the remote uses the platform SDK and does not reimplement it (no `Intl` formatters, `fetch`, token or cookie reading, role-name checks, browser storage, hand-made workspace paths or sign-out; SDK imports only from public subpaths; the SDK stays a peer dependency) |

## `integration/remote-entry.test.tsx`

Builds the `remote` environment of `rsbuild.config.ts` into a temporary directory (`fixtures/remote-build.ts`, in a child process; `dist/` is untouched). It then runs `remoteEntry.js` as a classic script and checks:

- `var __platform_mfe_dashboard` is defined synchronously as `{ init, get }`, as the SDK's `loadRemote` reads it;
- every share key the container consumes is one the shell provides, and no SDK code is bundled;
- `init(shareScope)` then `get('./App')` renders the dashboard with the test's own React and SDK handed over as the shell's singletons (the signed-in user proves the SDK is the shell's);
- without the shell's SDK the load fails, because there is no fallback copy, and an unknown module is rejected;
- every lazy stylesheet is pinned by its sha384;
- the logos are emitted under `assets/` and loaded from the remote's public path (`__webpack_require__.p`), never a root-relative `/image/…` that would resolve on the shell's origin.

The only stub is the network: `<script>` and `<link>` tags the container appends are answered from the build output.

## Standalone host page (`unit/app/standalone-*.test.ts`)

`src/standalone.ts` sets the page identity and runtime config, which the SDK allows only once per page. Each test file has its own SDK, and `setup.ts` starts the test platform in `beforeEach`, so these files do their work in `beforeAll`, on an SDK in the same state `main.tsx` sees:

- `standalone-config.test.ts`: the identity is `mfe-dashboard` / `portal`; `/config/runtime.json` is fetched once and set (the shipped `public/config/runtime.json` plus a `signInUrl`, so the strict SDK schema also validates the shipped file); logout goes to `auth.signInUrl`.
- `standalone-no-config.test.ts`: a 404 is a warning (one console line in local, from the SDK), the page still starts with no config, and logout goes to `PUBLIC_APP1_URL`.
- `standalone-no-config-prod.test.ts`: the same in `prod`, where the SDK logger is silent: `standalone.ts` writes one `console.warn`.
- `standalone-build.test.ts`: `rsbuild.config.ts` gives the standalone environment `assetPrefix: '/'` and leaves the remote's to the preset.

`shell-layout.test.tsx` covers a page that already has a config (nothing is fetched) and `main.test.ts` waits for `startStandalone` before the render.

## Fixtures and setup

- `setup.ts`: a fresh `createTestPlatform` runtime per test (signed in, `MANAGER` grants, `dashboard` messages registered), plus DOM and storage cleanup. Since SDK `1.0.0-alpha.3` the test platform sets the storage workspace, so `storage()` is real.
- `fixtures/platform.ts`: `startPlatform()` and the permission sets `MANAGER`, `VIEWER`, `MANAGE_ONLY` and `NO_MEMBER_ACCESS`. Which roles get them is web-shell's role map; the tests do not copy it.
- `fixtures/remote-build.ts`: `buildRemote()`, the temporary remote build.

## Writing tests

- Use the SDK's test platform (`startPlatform`, `platform.Wrapper`) rather than mocking SDK modules.
- `useDashboardData` waits 700 ms to load and 400 ms to refresh. Pass a **stable** filters object into `renderHook`.
- A new UI string goes in `src/locales/en.json`. `unit/i18n/catalog.test.ts` fails on a missing or unused key. A new view, SLA state or user status is a type error there until its keys are listed.
