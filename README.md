# mfe-dashboard

The dashboard and user-management **micro-frontend** of the BCBP portal: the Module Federation remote **`dashboard`**. web-shell (container `app1`) loads its `remoteEntry.js`, mounts `./App` at `/t/<slug>/dashboard/*`, and supplies the platform SDK. What this repository owns:
- the reviewer's ticket dashboard: views, KPIs, filters, load states, the SLA and delegation panel;
- the tenant's member list;
- the remote's chrome: sidebar, search, theme, user menu.

The same code also runs as a standalone page.

**Repository:** `github.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard`

**Package:**
- private and not published to npm;
- consume the GHCR image `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard` or the release tarball;
- versioning rules are in [VERSIONING.md](VERSIONING.md).

**Stack:**
- React 19, React Router 7, Tailwind 4 with daisyUI 5;
- Rsbuild 2 (Rspack) with `@bcbp-solutions-fzc-llc/webpack-preset`;
- Vitest 5 and Playwright;
- nginx 1.31 (unprivileged) on port 8080;
- Node 26.

**Design:**
- the [LLD](docs/lld/mfe-dashboard-lld.md) (contract, flows, open items);
- [ARCHITECTURE.md](ARCHITECTURE.md) (layers, diagrams, failure domains, threat model);
- the [ADRs](docs/adr/README.md);
- the layers follow the Frontend Architecture Constitution ([assessment](docs/architecture/constitution-assessment.md)).

---

## Status

| | |
|---|---|
| Release | [`v0.4.0`](https://github.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard/releases/tag/v0.4.0) (2026-11-06): signed image with SBOM and provenance; platform packages alpha.6; needs web-shell #44 or later. Previous: `v0.3.0` (alpha.5, web-shell #35). See [CHANGELOG.md](CHANGELOG.md) |
| Deploy | Not deployed yet. Ships with web-shell's first release ([LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items) item 12). At deploy, dev manifests switch the key `app2` → `dashboard` (item 15) and each environment's standalone `runtime.json` sets `auth.signInUrl` (item 14) |
| Platform packages | `@bcbp-solutions-fzc-llc/frontend-sdk`, `webpack-preset`, `eslint-plugin` all `1.0.0-alpha.6` |
| Data | In-repo fixtures behind repository contracts (`src/infrastructure/fixtures/`); no backend calls yet |
| Tests | 30 Vitest files, 168 tests (unit, integration, e2e): 99.07% statements, 97.64% branches, 100% functions, 99.37% lines. Plus 7 Playwright journeys and WCAG 2.1 AA checks |
| Open items | [LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items) |

---

## Mental model

| This remote owns | It does NOT own |
|---|---|
| The dashboard: five ticket views, KPI cards, filters, load, empty, error and partial-failure states, the SLA overview and delegation panel | Sign-in, tokens, session, sign-out, workspace switch (the SDK's `/auth`, run by web-shell) |
| User management UI: the member list, search, Invite and Edit when allowed | Roles (IAM) and the role → permission map (web-shell `src/platform/permissions.ts`) |
| The remote's chrome: sidebar, search box, theme picker, user menu, logout button | Authorisation: IAM and the APIs decide; checks here are UI hints |
| The `dashboard` message catalog (`src/app/configuration/locales/en.json`) | The remote manifest, SRI and the kill switch (web-shell and the SDK's `/mfe`) |
| Aura and daisyUI themes, stored with the SDK's `storage('dashboard')` | Ticket, notification and membership data (future APIs; fixtures today) |
| Three Tier 3 metrics (`portal_dashboard_*`) | Telemetry export (web-shell) |
| The nginx image and its security headers | Hosting in an environment (each environment's platform team) |

**Where its inputs come from.** Inside web-shell, `./App` takes everything from the SDK, which is the shell's singleton:
- the user and sign-out;
- permissions and read-only state;
- step-up;
- locale and messages;
- storage;
- the logger and meter.

So the shell needs to pass nothing. Props, when passed, override the SDK:

| Prop | Meaning |
|---|---|
| `userLabel?` | Display name or email; the initials are derived from it. Default: the SDK user's email, then name, then `User` |
| `onLogout?` | Called from the sidebar and the user menu. Default: the SDK's global sign-out; with no shell, a full navigation to the runtime config's `auth.signInUrl`, else `/` |

**How the SDK is supplied.** `@bcbp-solutions-fzc-llc/frontend-sdk` is a peer dependency (`^1.0.0-alpha.6`), and also a dev dependency pinned to web-shell's version for types and tests.
- **The remote build** never bundles it (`import: false`).
- **The standalone page** bundles it. With no shell, every SDK API gives its anonymous defaults: no user, `denyAll` (so "All Tenders In Flight" and User management are hidden), the default locale, and storage that writes nothing (the theme resets on reload).
- **Standalone start-up:** the standalone page is its own host page. Before rendering, it loads `/config/runtime.json` through the SDK and sets the page identity (`mfe-dashboard`, `portal`, the file's `environment`).

---

## Why this remote exists

The portal is a shell plus independently released remotes. The dashboard is the reviewer's home: what is waiting for them, how urgent it is, who covers for whom. It changes on its own schedule, separately from sign-in and navigation. Keeping it a separate remote means:
- **Releases are independent.** It releases on its own version and image, while still pairing with web-shell on the platform packages, as the container contract requires.
- **Nothing is reimplemented.** Session, permissions, data loading, text, storage, logging and metrics come from the platform SDK the shell already runs. Lint and `test/unit/sdk/dependency-rules.test.ts` reject a reimplementation.
- **Business rules are framework-free.** The rules (views, filters, deadlines, SLA, search) are pure TypeScript in `src/domain`. Use cases in `src/application` run them over repository contracts, so replacing the fixtures with the real APIs changes `src/infrastructure` and one wiring file, and nothing else. `npm run arch-lint` (`.dependency-cruiser.cjs`) checks the dependency directions on every PR.

---

## UI overview

### Routes

| Opened as | Paths |
|---|---|
| Inside web-shell | Its own `BrowserRouter` under the shell's workspace prefix: `/t/<slug>/dashboard`, `/t/<slug>/dashboard/user-management` |
| Inside a host that shares `react-router-dom` | Relative to the host's route: index → dashboard, `user-management` → member list |
| Standalone (`npm run dev`, the image's `/`) | `/` and unknown paths redirect to `/dashboard`; `/dashboard/user-management` |

An unknown nested path returns to the dashboard.

### Dashboard views

| View | Rows | Visible to |
|---|---|---|
| My Tickets | Open, not delegated; most urgent SLA first, then due day | everyone |
| Awaiting My Review | Status `review` | everyone |
| Awaiting My Approval | Status `approval`; a banner asks for MFA re-authentication when the login is not fresh (`useStepUp`) | everyone |
| Delegated To Me | Delegated from a colleague | everyone |
| All Tenders In Flight | Every ticket | `read:tender` |

Filters: status, role level, department, deadline (overdue, this week) and tender. The header search narrows the loaded rows by title, client and department.

### User management

| Capability | Needs |
|---|---|
| See the page and its sidebar link | `read:members` (every active member) or `manage:members` |
| Invite user, Edit | `manage:members` (`tenant_admin`, `tenant_owner`), and the tenant is not read-only (SDK `useReadOnly`) |

This follows iam-org-membership LLD §10.4 through web-shell's role map. Standalone the SDK grants nothing, so the page is hidden.

---

## Errors and input

Every load is a use case run by the SDK's `useApi`. An API error (a problem response, a timeout, a network failure) becomes a visible state with Retry, never a blank page:

| Load | On failure | While loading |
|---|---|---|
| Ticket list | Alert "Tickets could not be loaded." plus the SDK's `problemMessage` for an RFC 9457 problem, and Retry | Skeleton rows; a screen-reader status "Loading your tickets…" |
| Dashboard summary (KPIs, filter options, SLA, delegation) | Alert under the title with Retry; KPI cards show "—" | KPI cards show "—" |
| Member list | Row "Users could not be loaded." with Retry | Row "Loading users…", table `aria-busy` |
| Notification count (chrome) | No count shown | No count |

A row whose tender details failed (`tenderDetailsUnavailable`) stays listed under a "Tickets are retained below" banner. Each failure is logged through the SDK logger. Any other exception, which means a bug, goes to the page's `MFEErrorBoundary`; the sidebar keeps working.

### Notable input and display rules

| Rule | Enforcement |
|---|---|
| Due dates are calendar days, shown as that day in every time zone | `CalendarDay` and `formatDate('YYYY-MM-DD')`; `dependency-rules.test.ts` rejects `new Date('YYYY-MM-DD')` |
| The deadline filter compares local days: overdue is before today, this week is today plus six days | `matchesDeadline` (`src/domain/rules/filters.ts`) |
| The tender filter matches whole words ("IT" never matches "Hospital") | `titleHasKeyword` |
| Search never reloads; it filters loaded rows | `searchTickets`, `searchMembers` |
| A superseded load (view or filter changed) is aborted and never counted | `useApi`'s signal; `useDashboardData` |
| Text is never injected as HTML | React escaping; lint `no-unsafe-html` |

---

## Architecture

Clean Architecture after the Frontend Architecture Constitution: dependencies point inward. The diagrams, module graph, flows and invariants are in [ARCHITECTURE.md](ARCHITECTURE.md).

```
mfe-dashboard/
├── src/
│   ├── app/                         # Composition root
│   │   ├── App.tsx                  # The exposed ./App: WithDependencies, own BrowserRouter or the host's router
│   │   ├── bootstrap/               # main.tsx (standalone: fonts, theme, startStandalone, MFEErrorBoundary); remote.ts (placeholder entry)
│   │   ├── routes/                  # DashboardRoutes: layout, dashboard, user-management (guarded), catch-all; workspaceBasename
│   │   ├── layouts/                 # AppShellLayout: sidebar, search, theme, user menu, logout, the page's MFEErrorBoundary
│   │   ├── providers/               # dependencies.ts: createDependencies(overrides) → use cases on Fixture*Repository + metricsTelemetry
│   │   ├── configuration/           # i18n.ts (registerNamespace 'dashboard'), locales/en.json
│   │   └── styles/                  # index.css (Tailwind, daisyUI, Aura)
│   ├── presentation/
│   │   ├── pages/                   # DashboardPage, UserManagementPage
│   │   ├── widgets/dashboard/       # TicketRow (container queries), DashboardRightPanel
│   │   ├── components/              # BrandLogo, ThemePicker, DashboardIcons
│   │   ├── features/                # useDashboardData; useLoadable → useDashboardSummary, useDashboardInfo, useMembers; useMemberAccess
│   │   ├── theme/                   # themeMode (show a theme), aura.css, daisyAuraBridge.css
│   │   └── dependencies.tsx         # DependenciesProvider, useDependencies(): { useCases, telemetry }
│   ├── application/                 # No React, browser or SDK
│   │   ├── use-cases/               # LoadTicketQueueUseCase, LoadDashboardSummaryUseCase, GetDashboardInfoUseCase, ListMembersUseCase
│   │   └── ports/                   # DashboardTelemetry
│   ├── domain/                      # Pure TypeScript, no packages
│   │   ├── entities/                # TicketItem, DashboardFilters, Member, DashboardInfo
│   │   ├── value-objects/           # CalendarDay
│   │   ├── rules/                   # views, filters (deadline, tender, search), sla, members
│   │   └── repositories/            # TicketRepository, DashboardInfoRepository, MemberRepository (async, cancellable)
│   ├── infrastructure/
│   │   ├── fixtures/                # Fixture*Repository: sample data, due days from today, abortable delay
│   │   ├── configuration/           # standalone.ts: runtime.json → initializeCore → setRuntimeConfig
│   │   ├── storage/                 # themePreference.ts (SDK storage)
│   │   ├── telemetry/               # metrics.ts: the three portal_dashboard_* metrics (getServiceMeter)
│   │   └── auth/                    # signIn.ts: goToSignIn → auth.signInUrl or /
│   └── shared/                      # constants (APP_ID), hooks (useDismiss, useFocusTrap, useNow), ui/themes, types, assets
├── config/                          # runtime.local.json (dev server's /config/runtime.json); remote-manifest-entry.mjs
├── public/                          # favicons; config/runtime.json (the image's default, web-shell's)
├── nginx/                           # default.conf, security-headers.conf, document-headers.conf
├── test/                            # unit/<area>, integration, e2e, browser (Playwright, axe), fixtures
├── docs/                            # lld/, adr/, architecture/ (assessment, mermaid/), observability/, pipeline/, runbook-*.md
├── .github/                         # workflows (ci, validate-test, validate-quality, changelog-check, release), scripts/, dependabot
├── .githooks/pre-commit             # installed with npm run hooks:install
├── .dependency-cruiser.cjs          # architecture lint
├── rsbuild.config.ts                # two environments: remote (dashboard) and standalone
├── playwright.config.ts             # Chromium against rsbuild preview of the production build
└── Dockerfile                       # node:26 builder → nginx-unprivileged:1.31-alpine, USER 101
```

### Dependency rules (enforced by `npm run arch-lint` in CI)

| Component | May depend on | Packages |
|---|---|---|
| `domain` | Nothing | no |
| `application` | `domain`, `shared` | no |
| `presentation` | `application`, `domain`, `shared` (never infrastructure; never the SDK's storage, metrics or config) | yes |
| `infrastructure` | `application`, `domain`, `shared` | yes |
| `shared` | Nothing of ours | yes |
| `app` (composition root) | Everything above | yes |

On top of the table, the lint rejects:
- import cycles;
- OpenTelemetry, prom-client and web-vitals;
- TanStack Query, SWR, axios and ky;
- `src/` → `test/`;
- unresolvable imports.

`test/unit/architecture/layers.test.ts` adds the folder set and browser globals in `domain/` and `application/`.

### Runtime and storage

| Concern | Technology | Notes |
|---|---|---|
| Server state | SDK `useApi` (ADR 0002) | Abort on supersede, keep rows while refreshing, API errors returned as state |
| UI state | React state (ADR 0003) | View, filters, search, drawers |
| Persistent state | SDK `storage('dashboard')` | Only `appTheme` and `themeMode`; per workspace; cleared on sign-out and workspace switch; nothing while anonymous |
| Configuration | SDK runtime config, `/config/runtime.json` | Shell's inside web-shell; the standalone page loads its own. Nothing environment-specific compiled in (ADR 0006) |
| Text | SDK i18n, namespace `dashboard` | One catalog, every key used |
| Telemetry | SDK `/metrics` and `/logging` | Exported by the shell (ADR 0007) |

### Shared library dependencies

| Library | Version | Purpose |
|---|---|---|
| `@bcbp-solutions-fzc-llc/frontend-sdk` | `1.0.0-alpha.6` (peer `^1.0.0-alpha.6`) | Session, permissions, `useApi`, i18n, storage, logging, metrics, runtime config; the shell's singleton |
| `@bcbp-solutions-fzc-llc/webpack-preset` | `1.0.0-alpha.6` | `pluginPlatform` (Module Federation remote, shared singletons, `SdkVersionPlugin`), `containerName`, `integrityOf` |
| `@bcbp-solutions-fzc-llc/eslint-plugin` | `1.0.0-alpha.6` | Platform rules: no raw storage, no SDK deep or root imports, no unsafe HTML, no identity headers, no `eval` |
| `react`, `react-dom` | `^19.3.0` | Shared with the shell as strict singletons |
| `react-router-dom` | `^7.18.5` | Not shared; the remote runs its own router |
| `dependency-cruiser` | `18.7.0` | Architecture lint |

All three platform packages come from **GitHub Packages** and move together, at the same version as web-shell.

---

## Integrating with web-shell

### 1. Prerequisites

web-shell must be on the **same platform packages** as this build. The preset's `SdkVersionPlugin` fails a mismatched build, and a remote built with another preset major or pre-release names its container differently, so the shell cannot load it.

### 2. Register the remote

Every build writes `dist/remote-manifest-entry.json`, served at `/remote-manifest-entry.json` and attached to each GitHub Release. Copy it into the environment's `/remotes/manifest.json` with an absolute `entry`:

```json
"dashboard": {
  "entry": "https://<origin>/remoteEntry.js",
  "version": "0.4.0",
  "ownerDomain": "portal",
  "integrity": "sha384-…"
}
```

`integrity` is the sha384 of that exact `remoteEntry.js`, and it is required outside local, dev and test. Do not edit it by hand. The shell's runtime config must also list the remote's origin in `remotes.allowedOrigins`.

### 3. Mount `./App`

Mount it at `/t/:slug/dashboard/*` inside `RemoteBoundary`. No props are needed. The share scope must provide `react` and `react/jsx-runtime` (`^19.0.0`) and the SDK subpaths `auth`, `config`, `i18n`, `logging`, `metrics`, `problem`, `react` and `storage`. web-shell's SDK provides them; nothing needs to be listed per remote.

### 4. Permissions

The remote names three permissions:
- `read:tender`;
- `read:members`;
- `manage:members`.

web-shell's role map grants `read:members` to every active member, and `manage:members` to `tenant_admin` and `tenant_owner`. Without `read:members`, the shell still shows User management to those who may manage.

### 5. Runtime configuration

Inside web-shell, the shell's runtime config applies. The remote reads `auth.workspacePathPrefix` (`/t/`) to compute the same router basename as the shell. The standalone page reads the image's own `/config/runtime.json` (see [Configuration](#configuration)).

### 6. Telemetry

The remote records metrics only when it is in the manifest, because the SDK scopes them by `ownerDomain` `portal` and service `dashboard`. web-shell exports them, together with the remote's logs.

### 7. Origins and CSP

The shell's document must allow scripts, styles and images from the remote's origin. The remote's assets are served with `Access-Control-Allow-Origin: *` and `Cross-Origin-Resource-Policy: cross-origin`. Images and fonts are imported, so they resolve against the remote's origin, not the shell's.

### 8. Upgrading the platform packages

Both repositories upgrade in the same release:

```bash
npm install --save-exact @bcbp-solutions-fzc-llc/frontend-sdk@<v> @bcbp-solutions-fzc-llc/webpack-preset@<v> @bcbp-solutions-fzc-llc/eslint-plugin@<v>
```

Then set the peer to `^<v>` and run `npm test`, `npm run lint` and `npm run build`. Dependabot leaves these three packages alone.

---

## Local development

### Prerequisites

- **Node 26** (`.nvmrc`). `engines` allows `>=22`, the minimum the platform packages need.
- **The GitHub CLI**, signed in, with `read:packages`. The platform packages come from GitHub Packages.
- **Docker**, only for the image and the smoke script.
- **Chromium for Playwright**, only for the browser suite: `npx playwright install chromium`.

### Setup

```bash
git clone https://github.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard
cd mfe-dashboard
export NODE_AUTH_TOKEN=$(gh auth token)   # GitHub Packages (read:packages)
npm ci
npm run hooks:install                     # optional: .githooks/pre-commit
npm run dev                               # http://localhost:5002
```

You land on `/dashboard`. Logout navigates to `http://localhost:5001/`, the `auth.signInUrl` of `config/runtime.local.json` (the local web-shell).

### Common commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server on port 5002 (`strictPort`): the remote for a local web-shell (CORS open) and the standalone page. No HMR or live reload: reload the shell by hand |
| `npm run build` | `tsc` (TypeScript 7), an empty `dist/`, both Rsbuild environments, `remote-manifest-entry.json` |
| `npm run preview` | Serve the production build on port 5002 |
| `npm run lint` | ESLint with the platform rules and React hooks. typescript-eslint needs the TypeScript 6 API, so `typescript` is the `@typescript/typescript6` alias and `tsc` is `@typescript/native` (TypeScript 7) |
| `npm run arch-lint` | dependency-cruiser with `.dependency-cruiser.cjs` (CI step `Architecture lint`) |
| `npm test` | Vitest once: unit, integration (builds the remote) and e2e |
| `npm run test:unit` / `test:integration` / `test:e2e` | One suite |
| `npm run test:coverage` | With the v8 report |
| `npm run test:ci` | Coverage, the 95% gate and the domain >90% gate (what CI runs) |
| `npm run test:browser` | Build, then Playwright journeys and axe WCAG 2.1 AA (`test/browser`) |
| `npx tsc --noEmit -p .` | Type check only |
| `npm run hooks:install` | Copy `.githooks/pre-commit` into `.git/hooks` |

### Running a single test

```bash
npx vitest run test/unit/authz/permissions.test.tsx -t "read-only"
npx vitest run test/unit/domain/filters.test.ts
npx playwright test -g "dark theme"
```

### Running inside a local web-shell

1. Start this dev server: `npm run dev` (port 5002).
2. In web-shell, run `npm run dev` (port 5001). Its `config/remotes.local.json` points `dashboard` at `http://localhost:5002/remoteEntry.js`, and its local runtime config allows that origin.
3. Sign in, then open `http://localhost:5001/t/bcbp/dashboard` (or your workspace's slug). While this server is down, that route shows the shell's remote-boundary error, and the rest of the shell keeps working.
4. After a change here, reload the shell page. There is no live reload, by design.

### Developer tools

| Tool | Where |
|---|---|
| Playwright report | CI uploads it as `playwright-report-<sha>`; locally `CI=1 npm run test:browser` writes `playwright-report/` (otherwise the list reporter only) |
| Coverage report | `coverage/` (`npm run test:coverage`); CI uploads it |
| Import graph | `npx depcruise src --config .dependency-cruiser.cjs --output-type dot \| dot -Tsvg > graph.svg` (needs Graphviz) |
| Diagram sources | `docs/architecture/mermaid/*.mmd`, rendered in ARCHITECTURE.md; paste into [mermaid.live](https://mermaid.live) |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm ci` fails with `401 Unauthorized` from `npm.pkg.github.com` | No GitHub Packages token | `export NODE_AUTH_TOKEN=$(gh auth token)` (scope `read:packages`) |
| `npm run dev` fails: port 5002 in use | Another dev server or process | Stop it, or preview on another port; the shell expects 5002 |
| The shell says the remote did not register, or `window.__platform_mfe_dashboard` is a Promise | `remoteEntry.js` starts asynchronously: entry chunks split, or a dev client injected | Keep `splitChunks: { chunks: 'async' }` and `dev: { hmr: false, liveReload: false }` in `rsbuild.config.ts` |
| The shell's build or load fails with an SDK version error | Platform packages differ from web-shell's | Upgrade both together (see [Upgrading the platform packages](#8-upgrading-the-platform-packages)) |
| The standalone page logs "runtime config unavailable" | `/config/runtime.json` missing, invalid or slower than 5 s. The SDK rejects unknown keys, and URLs not in normal form (e.g. `signInUrl` without a trailing `/`) | Fix the file; `test/unit/app/runtime-config-files.test.ts` validates the shipped ones |
| A reload of `/dashboard/user-management` shows a blank page | Relative asset URLs in the standalone HTML | Keep the standalone environment's `assetPrefix: '/'` |
| "All Tenders In Flight" and User management are missing standalone | Expected: no shell, no permissions (`denyAll`) | Run inside web-shell |
| The theme resets on reload standalone | Expected: SDK storage writes nothing while anonymous | — |
| `npm run test:browser` fails to launch | Chromium not installed | `npx playwright install chromium` |
| `npm run arch-lint` reports `not-in-allowed` | An import against the layer table | Move the code to the right layer, or inject it through `app/providers/dependencies.ts` |
| A docs-only pull request shows no checks and cannot merge | `ci.yml` ignores Markdown-only changes, so `main`'s required checks never report | A maintainer merges it with an override ([LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items) item 18) |

---

## Testing

| Suite | Where | What it proves |
|---|---|---|
| Unit | `test/unit/<area>/` | Domain rules and use cases with no React; hooks and pages against a fresh SDK test platform; layer, SDK, i18n, metrics and diagram rules |
| Integration | `test/integration/remote-entry.test.tsx` | The built remote loads like web-shell loads it (`init(shareScope)`, `get('./App')`), with the shell's singletons and no SDK copy; no environment value compiled in |
| E2E | `test/e2e/app-flows.test.tsx` | Whole-app flows in happy-dom: filters, search, logout, user search, standalone redirect |
| Browser | `test/browser/` | Playwright journeys on the production build and axe-core WCAG 2.1 AA (light, dark, open drawer) |
| Smoke | `.github/scripts/smoke-tests.sh` (CI) | The image: size, `/healthz`, container global, no source maps, nested routes, SPA rule, runtime config, manifest integrity, headers |

Tests use `startPlatform()` / `platform.Wrapper` (`test/fixtures/platform.ts`), and inject repositories with `withDependencies()` / `testDependencies()` (`test/fixtures/dependencies.tsx`). They never mock SDK or `src` modules. Folder by folder: [test/README.md](test/README.md).

### Canonical tests (do not break)

- **`test/integration/remote-entry.test.tsx`:** the container contract. The container is defined synchronously; the SDK is not bundled; only shell-provided modules are consumed; `./App` renders through the container and fails without the shell's SDK.
- **`test/unit/architecture/layers.test.ts`** plus `npm run arch-lint`: the layer rules.
- **`test/unit/sdk/dependency-rules.test.ts`:** the SDK is used, not reimplemented. It also enforces the peer range, calendar days, no `console`, and metrics and start-up in one place.
- **`test/unit/metrics`:** the observability standard and the inventory in `docs/observability/metrics.md`.
- **`test/browser`:** WCAG 2.1 AA. happy-dom has no layout or colour.

### Coverage

`.github/scripts/coverage-gate.mjs` fails below **95%** on statements, branches, functions or lines, and below 90% on any file in `src/domain/`. The thresholds are not in the Vitest config. `COVERAGE_THRESHOLD` overrides the gate locally; CI does not set it. Runbook: [docs/runbook-coverage-gate.md](docs/runbook-coverage-gate.md).

---

## Configuration

Nothing environment-specific is compiled in (ADR [0006](docs/adr/0006-runtime-configuration-only.md)): one image serves every environment.

| Setting | When | Default | Purpose |
|---|---|---|---|
| `environment` in `/config/runtime.json` | Run time, standalone | `prod` in a build, `local` on the dev server | The standalone page's identity (`local`, `dev`, `test`, `staging`, `prod`). `http` origins in the config are accepted only for `local`, `dev`, `test` |
| `auth.signInUrl` in `/config/runtime.json` | Run time, standalone | none (logout goes to `/`) | Where standalone logout goes. Mount the environment's file over `/usr/share/nginx/html/config/runtime.json`. Check at deploy: [runbook](docs/runbook-release.md#standalone-runtime-config-authsigninurl) |
| `BUILD_VERSION` | Build time (build arg, env) | `dev` in Docker; else the package version | The page identity's build version; the image label |
| `SOURCE_DATE_EPOCH` | Build time (build arg) | `0` | Reproducible builds; CI sets it from the commit |
| `NODE_AUTH_TOKEN` | Install | — | GitHub Packages token for `npm ci`; in Docker, the BuildKit secret `npm_token` |
| `COVERAGE_THRESHOLD` | Tests | `95` | Overrides the coverage gate locally |
| `IMAGE`, `MAX_MB` | Smoke script | —, `200` | The image to test and its size limit |

The image's default `runtime.json` is web-shell's (`public/config/runtime.json`), with no `signInUrl`. The SDK validates every file strictly: unknown keys are rejected, and URLs must be in normal form.

---

## Security

| Topic | Guidance |
|---|---|
| **No tokens or identity** | The remote reads no token or cookie, sets no identity header, and stores only the theme (lint and `dependency-rules.test.ts`). The gateway injects identity; IAM authorises |
| **Permissions are hints** | Access by permission, never by role name; IAM and the APIs decide every request |
| **Supply chain** | Base images digest-pinned; the release image pushed by digest, Trivy-scanned, Cosign-signed with SLSA provenance and an SBOM, tagged only after that; the shell pins `remoteEntry.js` by sha384 |
| **Standalone document** | CSP same-origin only (`script-src 'self'`, no inline script, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `Permissions-Policy`, `X-Robots-Tag: noindex`; fonts self-hosted |
| **Image** | Unprivileged nginx (uid 101); no source maps; dotfiles, `/api`, `/config` (except `runtime.json`) return 404; `server_tokens off` |
| **Logout target** | `auth.signInUrl` only from the environment's `runtime.json`, validated by the SDK; never from the URL |
| **Reporting** | [.github/SECURITY.md](.github/SECURITY.md) |

Threat model (STRIDE): [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Observability

### Metrics

Tier 3 only (`portal_dashboard_*`), defined in `src/infrastructure/telemetry/metrics.ts` through the SDK's `getServiceMeter`:

| Metric | Type | Labels |
|---|---|---|
| `portal_dashboard_ticket_loads_total` | counter | `view`, `trigger` (`initial`, `refresh`), `outcome` (`success`, `error`) |
| `portal_dashboard_ticket_load_duration_seconds` | histogram | `view`, `outcome` |
| `portal_dashboard_step_up_requests_total` | counter | — |

The SDK injects `domain` (`portal`), `service` (`dashboard`) and `environment`, and validates every point; web-shell exports them. No Tier 1 or Tier 2 metric applies. Any new name needs the Enterprise Platform Observability Standard, and a shared name needs registry approval.

### Alerts, SLOs and runbook

[docs/observability/metrics.md](docs/observability/metrics.md) has the inventory, proposed recording rules, alerts, SLOs and a runbook. `test/unit/metrics` keeps it equal to the code.

### Logs and traces

Logs go through `getLogger({ mfe: 'dashboard' })`. The SDK redacts each record and tags it with the remote, and the shell exports it. The remote logs a `warn` for each failed load, the page boundary logs render errors, and the standalone page logs a `warn` when its config is missing. Traces are the shell's; the remote starts no telemetry of its own.

---

## Deployment

### Image

| Stage | Base | Result |
|---|---|---|
| builder | `node:26-bookworm` (digest-pinned) | `npm ci` (secret `npm_token`), `npm run build`, source maps deleted |
| runtime | `nginxinc/nginx-unprivileged:1.31-alpine` (digest-pinned), `apk upgrade` | `dist/` as uid 101, port 8080 |

### nginx

| Path | Behaviour |
|---|---|
| `GET /healthz` | `200 ok` |
| `GET /`, any app route | `index.html` with the document headers, `no-cache` |
| `GET /remoteEntry.js` | `no-cache`, CORS `*`, `Cross-Origin-Resource-Policy: cross-origin` |
| `/<name>.<16 hex>.js\|css`, `/assets/*` | Immutable, 1 year, CORS |
| `/config/runtime.json` | `no-cache`; `404` when absent |
| A missing file with a static extension; `/api`, `/otel`, `/csp-report`, `/config`, `/remotes`; dotfiles | `404` (the platform SPA rule, `spa-rewrite.js`) |

### Release

A tag `vX.Y.Z` runs `release.yml`:
1. validate;
2. build the `dist` tarball and `remote-manifest-entry.json`;
3. push the image by digest, with SBOM and provenance;
4. scan it with Trivy;
5. export the provenance;
6. sign it with Cosign;
7. tag it `X.Y.Z`, `X.Y`, `X` and `latest`;
8. create the GitHub Release.

The GitHub Release carries the tarball, `remote-manifest-entry.json`, `checksums.txt`, the SBOM and the provenance. There is no deploy job and no Helm chart: an environment ships the manifest entry with a web-shell on the same platform packages. Steps: [docs/runbook-release.md](docs/runbook-release.md); jobs: [LLD §12.5](docs/lld/mfe-dashboard-lld.md#125-release).

---

## CI

Five workflow files (map: [docs/pipeline/README.md](docs/pipeline/README.md)):

- **`ci.yml`**, the orchestrator, runs on pushes and pull requests to `main`, and on `workflow_dispatch`. Markdown-only changes skip it. Its jobs:
  - `Validate / Test` and `Validate / Quality`;
  - `Browser (Playwright, axe)`;
  - `Build image (cache)` (Hadolint, then a cached Buildx build), followed by `Trivy CVE scan` and `Smoke tests`;
  - `PR summary`, on pull requests;
  - `Push image → GHCR`, on `main` only, after all the others.
- **`validate-test.yml`** (reusable): `npm run test:ci` (unit, integration, e2e with coverage), then the gate, then the type check and production build.
- **`validate-quality.yml`** (reusable):
  - `npm run lint` and `npm run arch-lint`;
  - HTML-entity and CRLF checks on workflow files;
  - a check that the Dockerfile base images are digest-pinned, and that `.dockerignore` exists;
  - `npm audit --omit=dev --audit-level=high`.
- **`changelog-check.yml`** fails a pull request that touches `src/`, `package.json`, `package-lock.json`, the `Dockerfile`, `nginx/` or `rsbuild.config.ts` without a `CHANGELOG.md` line.
- **`release.yml`** is the tag pipeline described above.

**Required checks on `main`:**
- `Build image (cache)`, `Trivy CVE scan`, `Smoke tests`;
- `Validate / Quality / quality`, `Validate / Test / test`;
- `PR summary`;
- an approving code-owner review.

**Secrets:**
- `GITHUB_TOKEN` (built in): GitHub Packages and GHCR. The repository needs Actions read access on the three platform packages.
- `CI_REPO_READ_TOKEN` (optional): checkout.
- `PACKAGES_READ_TOKEN` (Dependabot secret): lets Dependabot resolve the GitHub Packages registry.

---

## Docker

```bash
docker build --secret id=npm_token,env=NODE_AUTH_TOKEN -t mfe-dashboard:dev .
docker run --rm -p 18080:8080 mfe-dashboard:dev
curl http://127.0.0.1:18080/healthz        # ok
IMAGE=mfe-dashboard:dev bash .github/scripts/smoke-tests.sh
```

Map host port 18080 when 8080 is taken. To try a standalone sign-in URL, mount a `runtime.json`:

```bash
docker run --rm -p 18080:8080 -v "$PWD/my-runtime.json:/usr/share/nginx/html/config/runtime.json:ro" mfe-dashboard:dev
```

---

## Cross-service dependencies

### 1. Runtime dependencies (this remote → others)

| Dependency | Used for | Posture | On failure |
|---|---|---|---|
| web-shell | Loading, mounting, session, permissions, telemetry export | required | The shell's `RemoteBoundary` shows its error |
| Platform SDK (the shell's copy) | Everything in [Runtime and storage](#runtime-and-storage) | required, no fallback | `get('./App')` fails; the shell shows its error |
| Ticket API (future; fixtures today) | Ticket list, KPIs, SLA, filter options | fail visible | Alerts with Retry |
| Tender service (via the ticket API) | Tender details on a row | degrade | Row kept, partial-failure banner |
| Notification and delegation APIs (future) | Notification count, delegation panel | degrade | No count; summary alert |
| Membership API, iam-org-membership (future) | Member list | fail visible | Row with Retry |
| `runtime.json` (standalone) | Environment, `auth.signInUrl` | degrade | Renders as `prod`, logout to `/` |

### 2. Hosts (others → this remote)

| Host | How | Notes |
|---|---|---|
| web-shell | `loadRemote('dashboard')` → `./App` at `/t/:slug/dashboard/*` | Same platform packages; manifest entry from this release |
| Any host sharing `react-router-dom` | `./App` with relative routes | — |
| A browser (standalone) | The image's `/` | For development and demos; no permissions |

### 3. Build and release dependencies

| System | Role |
|---|---|
| GitHub Packages | The three `@bcbp-solutions-fzc-llc` platform packages |
| GHCR | Image registry (`ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`) |
| Docker Hub, `nginxinc` | Digest-pinned base images |
| Sigstore (Cosign) | Image signature |

---

## Out of scope

| Concern | Where it lives |
|---|---|
| Sign-in, tokens, session, MFA, sign-out, workspace switch | Keycloak, the SDK's `/auth`, web-shell |
| Roles and the role → permission map | IAM; web-shell `src/platform/permissions.ts` |
| Authorisation | IAM and the APIs |
| The remote manifest, SRI, kill switch, loading other remotes | web-shell and the SDK's `/mfe` |
| Telemetry export | web-shell |
| Ticket, notification, membership data | Their services (fixtures here until the APIs exist) |
| Hosting, TLS, CDN, Helm | Each environment |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md):
- branches are named `feat/…`, `fix/…`, `docs/…`, `chore/…` or `test/…`;
- pull requests go into `main` and are squash-merged;
- a change to `src/`, dependencies, the Dockerfile, nginx, `rsbuild.config.ts` or `index.html` adds a line under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md).

| Document | Description |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, diagrams, flows, failure domains, invariants, threat model, decisions |
| [docs/lld/mfe-dashboard-lld.md](docs/lld/mfe-dashboard-lld.md) | The runtime contract, SDK usage, domain model, flows, failure handling, build and release, open items (§15) |
| [docs/adr/](docs/adr/README.md) | ADR 0001–0009 |
| [docs/architecture/](docs/architecture/README.md) | Constitution assessment; Mermaid diagram sources |
| [docs/observability/metrics.md](docs/observability/metrics.md) | Metric inventory, alerts, SLOs, runbook |
| [docs/pipeline/README.md](docs/pipeline/README.md) | CI and release map |
| [docs/runbook-release.md](docs/runbook-release.md), [runbook-image-scan.md](docs/runbook-image-scan.md), [runbook-coverage-gate.md](docs/runbook-coverage-gate.md) | Runbooks |
| [test/README.md](test/README.md) | What each test folder covers |
| [VERSIONING.md](VERSIONING.md), [CHANGELOG.md](CHANGELOG.md) | Versioning policy; releases |
| [.claude/CLAUDE.md](.claude/CLAUDE.md), [architecture.md](.claude/architecture.md), [operations.md](.claude/operations.md) | Guidance for Claude Code |

---

## License / ownership

BCBP Solutions FZC LLC: an internal platform micro-frontend. Not for external distribution.
