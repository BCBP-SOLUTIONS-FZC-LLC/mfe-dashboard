# mfe-dashboard — Low-Level Design

## Tender Management SaaS Platform — Dashboard Remote (`dashboard`)

| | |
|---|---|
| Repository | `BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard` (private) |
| Deliverables | Container image `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard` and the release `dist` tarball. `package.json` is private (`0.3.0`); nothing is published to npm |
| Version | `0.3.0`, released 2026-11-05 ([GitHub Release](https://github.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard/releases/tag/v0.3.0), [CHANGELOG.md](../../CHANGELOG.md)); SemVer rules in [VERSIONING.md](../../VERSIONING.md) |
| Host | `web-shell` (`app1`), which loads this remote as `DASHBOARD_REMOTE = 'dashboard'` (`web-shell/src/App.tsx`) |
| Platform SDK | `@bcbp-solutions-fzc-llc/frontend-sdk` `1.0.0-alpha.6` (peer `^1.0.0-alpha.6`, provided by the shell); `webpack-preset` and `eslint-plugin` `1.0.0-alpha.6` (§12) |
| Runtime | React 19, React Router 7, Tailwind 4 + daisyUI 5; built with Rsbuild 2 (Rspack); served by nginx 1.31 on port 8080 |
| Narrative | [ARCHITECTURE.md](../../ARCHITECTURE.md) (diagrams, failure domains, decisions) |
| Upstream contracts | platform-reactcommon LLD and design doc (`docs/lld/platform-reactcommon-lld.md`, `docs/design/frontend-sdk-design.md`); iam-org-membership LLD §5.4 P-35 and §10.4 (roles, member rights) |

### Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-04 | First LLD, written from `main` after #11–#16 (dependencies, platform SDK adoption, member access, step-up, SDK `1.0.0-alpha.3`) and #17 (test layout, integration and rule suites) |
| 1.18 | 2026-11-06 | Frontend Architecture Constitution: layered `src/` (§3), repositories and use cases, runtime configuration only (`PUBLIC_APP1_URL` removed; §7.2, §7.6, §11, §12.3, §12.4, §12.5), ADRs 0001–0008 |
| 1.17 | 2026-11-06 | Platform packages `1.0.0-alpha.6` (after web-shell #44): `formatDate('YYYY-MM-DD')` replaces `calendarDate()`, the SDK logger replaces the standalone `console.warn`, and the standalone page takes its environment from `runtime.json` (`PLATFORM_ENVIRONMENT` removed) (§5, §6.1, §7.2, §11, §12.3, §12.4; open items 14, 16) |
| 1.16 | 2026-11-05 | Open item 13 closed: the unsigned `0.1.0` image was deleted from GHCR |
| 1.15 | 2026-11-05 | Metrics per the Enterprise Platform Observability Standard: three Tier 3 `portal_dashboard_*` metrics through SDK `/metrics` (§5, §15 item 10), CI validation in `test/unit/metrics`; SDK and platform-reactcommon audit (§5), nginx follows the platform SPA rule (§12.3); second audit fixes (standalone `test` logging, `useDismiss`, build-time `ENVIRONMENTS`/`DOMAINS` checks, CORP) |
| 1.14 | 2026-11-05 | Release `v0.3.0` (remote `dashboard`); open item 15 at its deployment step |
| 1.13 | 2026-11-05 | Remote renamed `app2` → `dashboard` (container, global `__platform_mfe_dashboard`, manifest key, message namespace, storage, log label; §4, §5, §9, §10); open item 15 (switch together with web-shell) |
| 1.12 | 2026-11-05 | Release `v0.2.0` (alpha.5); open item 14 at its last step |
| 1.11 | 2026-11-05 | Platform packages `1.0.0-alpha.5`; the standalone page sets its identity and loads `/config/runtime.json`, and logout uses `auth.signInUrl` (§5, §7.2, §7.6, §11, §12.3, §12.4); open item 14 at step 3. Standalone `assetPrefix: '/'` so nested routes reload (§12.1, §11); a config failure is visible on the console in staging and prod (§11) |
| 1.10 | 2026-11-05 | Logos imported from `src/assets/images` instead of `public/image` (§3, §4.1) |
| 1.9 | 2026-11-05 | Release tags are added after scan, provenance and signature (§12.5); open item 14 (runtime logout target) |
| 1.8 | 2026-11-05 | `v0.1.1` published (GitHub Release, signed image `sha256:c9e10c06…`); release pipeline described in §12.5; supply chain (§13); open item 13 (the unsigned `0.1.0` tag). web-shell has the same release-script fixes (web-shell #27) |
| 1.7 | 2026-11-05 | `v0.1.1`: the release workflow's provenance export fixed; `v0.1.0` was not published |
| 1.6 | 2026-11-05 | First release `v0.1.0`, together with web-shell on alpha.4; open item 7 (tag and `PUBLIC_APP1_URL`) closed |
| 1.5 | 2026-11-05 | Theme picker as a menu of radio items and `aria-pressed` on the view switches (§7.8); loading announced as a busy status (§6.3); a page error boundary that resets on navigation (§5, §11); Node 26 / `engines >=22` (§12.2) |
| 1.4 | 2026-11-05 | Platform packages `1.0.0-alpha.4`: container global `__platform_mfe_app2` (§4.1), lazily loaded CSS pinned by sha384 (§4.1), sign-out as a form POST that needs the shell's CSP `form-action` (§7.6), storage keys renamed so a saved theme resets once (§7.7), deploy together with web-shell (§12.1) |
| 1.3 | 2026-11-04 | Remote manifest entry with `remoteEntry.js` integrity (§4.1, §12.1); deadline filter applied and KPI counts from the rows (§6.2); load errors logged (§5); "Last updated" keeps counting (§7.3); standalone `MFEErrorBoundary` (§7.2, §11); logical (RTL-ready) layout classes and labelled search (§7.8); fonts and Tailwind stack identical to web-shell (§12.2); `minimatch` override (§12.2) |
| 1.2 | 2026-11-04 | `VITE_APP1_URL` renamed `PUBLIC_APP1_URL` with the old name as a deprecated fallback (§12.4) |
| 1.1 | 2026-11-04 | Production gaps: ticket-load error state (§6.3, §7.3, §11), local calendar dates (§6.1), keyboard and focus handling (§7.8), nginx security headers, gzip and self-hosted fonts (§12.3, §13), `webpack-preset` / `eslint-plugin` `1.0.0-alpha.3` (§4.2, §12.2), release guard for `PUBLIC_APP1_URL` (§12.4) |

### Table of Contents

1. [Document Overview](#1-document-overview)
2. [Responsibilities and Boundaries](#2-responsibilities-and-boundaries)
3. [Architecture and Source Layout](#3-architecture-and-source-layout)
4. [Runtime Contract with the Shell](#4-runtime-contract-with-the-shell)
5. [Platform SDK Usage](#5-platform-sdk-usage)
6. [Domain Model](#6-domain-model)
7. [Key Flows](#7-key-flows)
8. [Authorization (UI hints)](#8-authorization-ui-hints)
9. [i18n](#9-i18n)
10. [State and Storage](#10-state-and-storage)
11. [Failure Handling](#11-failure-handling)
12. [Build, Image, Configuration and Release](#12-build-image-configuration-and-release)
13. [Security](#13-security)
14. [Testing](#14-testing)
15. [Open Items](#15-open-items)

---

## 1. Document Overview

This LLD records how the remote is built and what it promises its host: the exposed module and its props, routes, shared modules, the SDK APIs it depends on, the data it shows, and how it fails. Where this document and the code disagree, the code is right and this document has a bug.

The remote has no backend of its own yet. Tickets, KPI counts, notifications, delegation and users are fixtures in `src/infrastructure/fixtures/` and `src/presentation/pages/UserManagementPage.tsx`. §15 lists what replaces them.

## 2. Responsibilities and Boundaries

### 2.1 In scope

| Concern | Where |
|---|---|
| The ticket dashboard: five views, KPI cards, filters, search, refresh, load states, right panel (delegation, notifications, SLA overview, tender-details error) | `src/presentation/pages/DashboardPage.tsx`, `src/presentation/widgets/dashboard/`, `src/presentation/features/tickets/useDashboardData.ts` |
| User management: member table, search, Invite and Edit for managers | `src/presentation/pages/UserManagementPage.tsx`, `src/presentation/features/members/useMemberAccess.ts` |
| Chrome inside the remote: sidebar, search box, theme picker, user menu, logout | `src/app/layouts/AppShellLayout.tsx`, `src/presentation/components/ThemePicker.tsx` |
| Routing under the shell's workspace prefix, and standalone | `src/app/App.tsx` |
| The `dashboard` message catalog | `src/app/configuration/i18n.ts`, `src/app/configuration/locales/en.json` |
| Themes (Aura light/dark and daisyUI) | `src/presentation/theme/` |
| Static hosting of `remoteEntry.js`, chunks and the standalone page | `nginx/default.conf`, `Dockerfile` |

### 2.2 Out of scope (owned elsewhere)

| Concern | Owner |
|---|---|
| Sign-in, tokens, session, sign-out, workspace switch | platform SDK `/auth` in web-shell (Keycloak) |
| Which roles a user has; whether an action is allowed | IAM (session context P-35) and the backend services; the gateway authorises every request |
| Role → UI permission map | web-shell `src/platform/permissions.ts` (`setAuthorizer(roleMapAuthorizer(...))`) |
| Permission checks, storage, formatting, messages, data loading, route templates, step-up | platform SDK (platform-reactcommon). This repo uses them and must not reimplement them (§5) |
| The remote manifest (`/remotes/manifest.json`), SRI, kill switch, loading the container | web-shell + SDK `/mfe` (`loadRemote`) |
| Telemetry export, error boundary around the remote | SDK (`RemoteBoundary`, `/tracing`, `/logging`) in the shell |
| Hosting in an environment (CloudFront / S3 path) | Platform deployment. This repo ships an image and a tarball only |

## 3. Architecture and Source Layout

The Frontend Architecture Constitution's layers (ADR [0001](../adr/0001-layered-structure.md); assessment in [`../architecture/constitution-assessment.md`](../architecture/constitution-assessment.md)):

```
src/
├── app/                              composition root (may import every layer)
│   ├── App.tsx                       exposed ./App and standalone root: SDK user/sign-out, routes, workspaceBasename(), DependenciesProvider
│   ├── bootstrap/                    main.tsx (standalone entry), standalone.ts (runtime config, identity), remote.ts (placeholder entry)
│   ├── layouts/AppShellLayout.tsx    sidebar, search, theme, user menu, logout (goToSignIn)
│   ├── providers/dependencies.ts     which implementation backs each contract (fixtures today)
│   ├── configuration/                i18n.ts (registerMessages), locales/en.json (every UI string)
│   └── styles/index.css              Tailwind, daisyUI, Aura
├── presentation/                     UI (application, domain, shared)
│   ├── pages/                        DashboardPage, UserManagementPage
│   ├── widgets/dashboard/            TicketRow, DashboardRightPanel
│   ├── components/                   BrandLogo, ThemePicker, DashboardIcons
│   ├── features/                     tickets/useDashboardData, summary/useDashboardSummary + useDashboardInfo,
│   │                                 members/useMembers + useMemberAccess (use cases through the SDK's useApi)
│   ├── theme/                        themeMode.ts (show a theme, surface classes), aura.css, daisyAuraBridge.css
│   └── dependencies.tsx              Dependencies (contracts), DependenciesProvider, useDependencies
├── application/                      use cases, no React or browser (domain, shared)
│   ├── use-cases/                    loadTicketQueue, loadDashboardSummary, listMembers
│   └── ports/telemetry.ts            DashboardTelemetry
├── domain/                           pure TypeScript (nothing)
│   ├── entities/                     ticket.ts (TicketItem, DashboardView, DashboardFilters, SlaOverview, FilterOptions), member.ts, dashboardInfo.ts
│   ├── rules/                        views.ts (ticketsInView, countByView, hasPartialFailure), filters.ts (applyFilters, matchesDeadline,
│   │                                 dayKey, departmentsOf, searchTickets), sla.ts (slaOverview), members.ts (searchMembers)
│   └── repositories/                 TicketRepository, DashboardInfoRepository, MemberRepository (contracts)
├── infrastructure/                   implementations (application, domain, shared)
│   ├── fixtures/                     FixtureTicketRepository, FixtureDashboardInfoRepository, FixtureMemberRepository (sample data)
│   ├── storage/themePreference.ts    appTheme / themeMode in storage('dashboard')
│   ├── telemetry/metrics.ts          Tier 3 metrics; metricsTelemetry (the DashboardTelemetry adapter)
│   └── auth/signIn.ts                goToSignIn(): runtime config auth.signInUrl, else /
└── shared/                           depends on nothing of ours
    ├── constants/app.ts              APP_ID = 'dashboard'
    ├── hooks/                        useDismiss, useFocusTrap, useNow
    ├── ui/themes.ts                  theme vocabulary (Aura and daisyUI ids)
    ├── types/appShellContext.ts      outlet context { search }
    └── assets/images/                logos (imported; emitted as assets/<name>.<hash>.png)
```

`test/unit/architecture/layers.test.ts` enforces the import directions in brackets, keeps `domain/` and `application/` free of React, the SDK and browser APIs, and keeps the SDK's storage, metrics and config out of `presentation/`. `test/unit/sdk/dependency-rules.test.ts` enforces the SDK rules in §5.

## 4. Runtime Contract with the Shell

This is the SemVer surface ([VERSIONING.md](../../VERSIONING.md)).

### 4.1 Container

| Item | Value |
|---|---|
| Container name / global | `dashboard`, defined synchronously by `remoteEntry.js` as `var __platform_mfe_dashboard` (Module Federation v1). Since `1.0.0-alpha.4` the preset's `containerName('dashboard')` and the SDK's `loadRemote` both use `__platform_mfe_<name>`; a bare global could collide with an element `id` or a browser global. An entry built with an older preset defines `var dashboard`, which the alpha.4 SDK does not read |
| Exposed module | `./App` → `src/app/App.tsx` (default export `App`, named export `workspaceBasename`) |
| Chunk loading | Relative to `remoteEntry.js` (`self.rspackChunk_platform_mfe_dashboard`); CSS is a lazy chunk under `assets/async/` |
| Images and fonts | Imported from `src/`, so they are emitted under `assets/` and resolved against the remote's public path (where `remoteEntry.js` came from). Never root-relative: inside web-shell `/image/…` resolves on the shell's origin (web-shell #29 found the logo broken this way). `public/` holds only the standalone favicons. `dependency-rules.test.ts` and `remote-entry.test.tsx` check it |
| Split chunks | Async only (`splitChunks: { preset: 'none', chunks: 'async' }`); a split entry would make `window.__platform_mfe_dashboard` a Promise, which `loadRemote` refuses |
| Manifest entry (shell side) | `"dashboard": { "entry": ".../remoteEntry.js", "version": ..., "ownerDomain": "portal", "integrity": "sha384-..." }`; `integrity` required outside local and dev. Every build writes it to `dist/remote-manifest-entry.json` (`config/remote-manifest-entry.mjs`, the preset's `integrityOf` over the built `remoteEntry.js`); the image serves it at `/remote-manifest-entry.json` and each release attaches it as `mfe-dashboard_<tag>_remote-manifest-entry.json`. The deploy makes `entry` absolute |
| Chunk integrity | Every lazy chunk, scripts and (since `1.0.0-alpha.4`) stylesheets, is pinned by sha384 inside `remoteEntry.js` (the preset's `ChunkIntegrityPlugin`; the runtime sets `link.integrity` for CSS); a swapped chunk is refused |

### 4.2 Shared modules

The preset's `sharedFor('remote')` configures `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `react-dom`, `react-dom/client`, `@opentelemetry/api` and every SDK subpath as strict singletons. The build consumes only what `src/` imports; `remoteEntry.js` contains:

| Share key | `requiredVersion` | Notes |
|---|---|---|
| `react`, `react/jsx-runtime` | `^19.0.0` | strict singleton |
| `@bcbp-solutions-fzc-llc/frontend-sdk/{auth,config,i18n,logging,metrics,problem,react,storage}` | `^1.0.0-alpha.6` (the preset's SDK version) | `import: false`: never bundled, no fallback; the load fails without the shell's copy |

`react-dom` is used only by the standalone entry (`main.tsx`), and `@opentelemetry/api` not at all, so neither appears in the remote. `react-router-dom` is **not** shared; the remote brings its own router (§7.1). `test/integration/remote-entry.test.tsx` checks that every share key is one the shell provides and that no SDK code is in the bundle.

### 4.3 Props

| Prop | Type | Default |
|---|---|---|
| `userLabel` | `string?` | `useCurrentUser()` email, then name, then the catalog's `User` |
| `onLogout` | `() => void?` | `useSignOut()()` (global sign-out); when it rejects (no shell `signOut`), `goToSignIn()` → `auth.signInUrl`, else `/` |

web-shell passes neither today. A new required prop is a MAJOR change.

### 4.4 Routes

| Mounted | Router | Paths |
|---|---|---|
| By web-shell | The remote's `BrowserRouter`, `basename = workspaceBasename(location.pathname)` = `workspacePathPrefix + slugFromPath(...)` (e.g. `/t/acme`) | `/t/<slug>/dashboard`, `/t/<slug>/dashboard/user-management` |
| By a host that already has a router (`useInRouterContext()`) | The host's | index → dashboard, `user-management`, relative to the host route |
| Standalone (`npm run dev`, the image's `/`) | `BrowserRouter`, no basename (no runtime config) | `/dashboard`, `/dashboard/user-management`; `/` and unknown paths → `/dashboard` |

`UserManagementRoute` registers the route template `/t/:slug/dashboard/user-management` with `useRouteTemplate` (telemetry names the route by template, not by slug). Sidebar links are absolute (`/dashboard`, `/dashboard/user-management`) under the basename.

## 5. Platform SDK Usage

The rule: anything the SDK provides is used from the SDK, through public subpaths only. `npm run lint` (`@bcbp-solutions-fzc-llc/eslint-plugin`: `no-raw-storage`, `no-sdk-deep-import`, `no-sdk-root-import`, `no-unsafe-html`, `no-identity-headers`, `no-eval`, …) and `test/unit/sdk/dependency-rules.test.ts` enforce it. The latter also keeps metrics in `src/infrastructure/telemetry/metrics.ts` through `/metrics` (no OpenTelemetry or Prometheus client), host-page start-up (`initializeCore`, runtime config) in `src/app/bootstrap/standalone.ts`, shell-only APIs (manifest, `loadRemote`, auth, flags, telemetry start) out of `src/`, and `console` out except for the standalone config warning.

Audit (2026-11-05), every SDK export against `src/`: nothing the SDK provides is reimplemented. Our own helpers have no SDK counterpart: `workspaceBasename` (composes `slugFromPath` and `workspacePathPrefix`), `useNow`, `useDismiss`, `useFocusTrap`, the theme (stored with `storage()`), and `defaultLogout`'s full navigation to an absolute sign-in URL (`navigate()` takes same-origin paths only). `recordMetric` used to check label values again after the SDK; it now leaves run-time validation to the SDK. The two gap-fillers this audit found (a `calendarDate()` helper, because `formatDate` took only instants; a `console.warn` in `standalone.ts`, because the SDK logger was silent before logging outside local and dev) were raised with platform-reactcommon, which shipped both in `1.0.0-alpha.6` (`formatDate('YYYY-MM-DD')`; warn and error reach the console while logging is off). Both are gone from this repo, and `dependency-rules.test.ts` now rejects `calendarDate(`, a `Date` built from a `YYYY-MM-DD` literal, and any `console` call. The rest of platform-reactcommon: `webpack-preset` is used for the build (`pluginPlatform`), the container name and SRI (`containerName`, `integrityOf` in `config/remote-manifest-entry.mjs`; the preset has no manifest-entry generator); `eslint-plugin` as is; the SDK's `/testing` for every test; the observability registry is read from the SDK, not copied. One divergence was fixed: nginx's SPA fallback now follows `examples/cloudfront/spa-rewrite.js` (§12.3). An independent second audit (library source and docs, not only its types) found and fixed: `standalone.ts` treated `test` as an environment where the SDK logger writes to the console, so a config failure in `test` was silent (moot since alpha.6); `DashboardPage` closed the filter drawer with its own Escape listener instead of `useDismiss`; `ownerDomain` is checked against the SDK's `DOMAINS` at build time (and the build-time environment against `ENVIRONMENTS`, until alpha.6 moved the environment into `runtime.json`); remote assets send `Cross-Origin-Resource-Policy: cross-origin`. Kept on purpose: `src/infrastructure/telemetry/metrics.ts` makes instruments per call, not once at module scope (the SDK binds an instrument to the runtime it was made in, so module-scope instruments would outlive a test platform or a standalone start-up; the SDK keeps one per name). Copies the library only offers as examples, not as code to import: nginx's SPA lists (`spa-rewrite.js`, checked by the smoke script) and the standalone page's CSP (stricter than none, but not `buildCsp()`'s: no Trusted Types policy or `/csp-report` on the standalone page, which is not deployed behind CloudFront). The CI scripts under `.github/scripts/` started as copies of platform-reactcommon's; they are this repository's own CI (its workflows are for its pnpm monorepo, not published for reuse).

| Concern | SDK API | Used in |
|---|---|---|
| Signed-in user | `useCurrentUser` (`/react`) | `app/App.tsx` |
| Sign-out | `useSignOut` (`/react`) | `app/App.tsx` |
| Workspace basename | `slugFromPath` (`/auth`), `tryGetConfig().auth.workspacePathPrefix` (`/config`) | `app/App.tsx` `workspaceBasename` |
| Route naming | `useRouteTemplate` (`/react`) | `app/App.tsx` |
| Permissions | `useHasPermission('read','tender')`, `('read','members')`, `('manage','members')` (`/react`) | `presentation/pages/DashboardPage.tsx`, `presentation/features/members/useMemberAccess.ts` |
| Read-only tenant | `useReadOnly` (`/react`) | `presentation/features/members/useMemberAccess.ts` |
| Step-up MFA | `useStepUp` (`needed`, `reauthenticate()`) (`/react`) | `DashboardPage.tsx` |
| Data loading | `useApi(loader, deps)` (run on change, abort superseded loads, `reload`) (`/react`) | `presentation/features/*` (running the use cases; ADR 0002) |
| API errors | `isProblemError` (`/problem`), `problemMessage` (`/i18n`) | `DashboardPage.tsx` |
| Logs | `getLogger({ mfe: 'dashboard' })` (`/logging`): a failed ticket load is a `warn` with the error and view (redacted by the SDK, exported by the shell) | `useDashboardData.ts` |
| Render errors | `MFEErrorBoundary` (`/react`): around the routed page with `resetKeys={[pathname]}` (embedded and standalone), and around `App` standalone | `app/layouts/AppShellLayout.tsx`, `app/bootstrap/main.tsx` |
| Messages and plurals | `registerNamespace` (`/i18n`), `useT('dashboard')`, `useLocale` (`/react`) | `app/configuration/i18n.ts`, every component |
| Dates and numbers | `formatDate`, `formatNumber` (`/i18n`) | `TicketRow`, `DashboardRightPanel`, `DashboardPage`, `AppShellLayout`, `UserManagementPage` |
| Per-app storage | `storage('dashboard')` (`/storage`) | `infrastructure/storage/themePreference.ts` |
| Standalone host page | `loadRuntimeConfig`, then `initializeCore` (`/core`) with the file's `environment` (since `1.0.0-alpha.6`), then `setRuntimeConfig` (`/config`) | `app/bootstrap/standalone.ts` (from `main.tsx` only; never in the remote) |
| Standalone logout target | `tryGetConfig()?.auth.signInUrl` (`/config`) | `infrastructure/auth/signIn.ts` `goToSignIn` |
| Metrics | `getServiceMeter({ mfe: 'dashboard' })` (`/metrics`): Tier 3 `portal_dashboard_ticket_loads_total`, `portal_dashboard_ticket_load_duration_seconds`, `portal_dashboard_step_up_requests_total`; the SDK injects `domain`, `service`, `environment` and enforces the observability standard; the shell exports. Inventory and rules: [`docs/observability/metrics.md`](../observability/metrics.md) | `infrastructure/telemetry/metrics.ts` (through the `DashboardTelemetry` port) |
| Tests | `createTestPlatform` (`/testing`) | `test/fixtures/platform.ts`, `test/setup.ts` |

Not used yet, and the place to start when the need arrives: `useApiClient` / `createApiClient` (real APIs, §15), `useFeatureFlag`, `Can`, `useAppUpdate`, `useOnlineStatus`.

Standalone, with no shell, every SDK API answers with its anonymous defaults (design doc §C2): no user, `denyAll`, the default locale, and `storage()` writes nothing. The standalone page does set the page identity and runtime config itself (§7.2), as the SDK allows a remote's own page with no shell since `1.0.0-alpha.5`.

## 6. Domain Model

### 6.1 Types (`src/domain/entities/ticket.ts`)

| Type | Values / fields |
|---|---|
| `DashboardView` | `my-tickets`, `awaiting-review`, `awaiting-approval`, `delegated`, `all-tenders` |
| `SlaState` | `on_track`, `warning`, `breached` |
| `TicketItem` | `id`, `tenderTitle`, `client`, `stage`, `deliverable`, `section`, `department`, `roleLevel`, `dueDate` (ISO), `slaState`, `restricted?`, `evidenceGrade?`, `delegatedFrom?`, `unreadComments`, `tenderDetailsUnavailable?`, `status` |
| `DashboardFilters` | `status`, `role`, `department`, `deadline`, `tender` (each `'all'` or a value) |
| Calendar dates | `dueDate` and the delegation period are `YYYY-MM-DD` days: `formatDate('YYYY-MM-DD')` (SDK alpha.6) shows that day in every time zone, and the deadline filter compares them as day strings with the local today (`matchesDeadline`). No `Date` is built from a calendar day |
| `ManagedUser` (page-local) | `id`, `name`, `email`, `role`, `department`, `status: 'Active' \| 'Invited' \| 'Disabled'` |

### 6.2 Views (`ticketsForView`, `src/infrastructure/fixtures/tickets.ts`)

| View | Rows | Visible to |
|---|---|---|
| `my-tickets` | `status === 'open'`, not delegated; sorted by SLA, then due date | everyone |
| `awaiting-review` | `status === 'review'` | everyone |
| `awaiting-approval` | `status === 'approval'` | everyone; step-up banner when `useStepUp().needed` |
| `delegated` | `delegatedFrom` set | everyone |
| `all-tenders` | every row when `canSeeAllTenders`, otherwise `[]` | `read:tender` |

Filter options come from the data: `DEPARTMENT_OPTIONS` (distinct departments), `ROLE_OPTIONS`, `TENDER_OPTIONS`. Status, department, role (`roleLevel.includes`) and tender (title substring) are applied in `useDashboardData`. Deadline is applied by local calendar day (`matchesDeadline`): `overdue` is before today, `week` is today and the next six days. The header search then filters title, client and department.

KPI numbers are `kpiCounts()`: each view's row count before filters, from the same fixtures the list shows. The list heading shows the rows actually listed (after filters and search). The SLA overview counts `my-tickets` rows by `slaState`, and its total is their sum.

### 6.3 Load states (`useDashboardData`)

| State | When |
|---|---|
| `loading` | No data for the current query key (`JSON.stringify([view, filters, canSeeAllTenders])`). A visually hidden `role="status"`, always on the page, reads "Loading your tickets…" while loading and is empty otherwise (a live region inserted with its text is often not announced); the skeleton is `aria-hidden` |
| `error` | The load failed with an SDK `ApiError` (problem, timeout, network). `useApi` drops the rows; `error` is returned until a reload succeeds. Any other exception is rethrown by `useApi` to the page's `MFEErrorBoundary` in `AppShellLayout` (only the page is replaced; it clears when the path changes) |
| `partial_failure` | View `my-tickets` and a row has `tenderDetailsUnavailable` (fixture `T-1015`) |
| `empty` | Zero rows |
| `ready` | Otherwise |

`refreshing` is true while a reload of the same key runs; the last rows stay on screen. The fixture loader waits 700 ms (400 ms on refresh) on an abortable delay, so a superseded load is aborted by `useApi`.

## 7. Key Flows

### 7.1 Mount inside web-shell

1. The shell resolves `dashboard` from its manifest, injects `remoteEntry.js` (with SRI), calls `dashboard.init(shareScope)` and `dashboard.get('./App')` (SDK `loadRemote`), and renders `App` inside `RemoteBoundary` at `/t/:slug/dashboard/*`.
2. Importing `./App` imports `./i18n`, which calls `registerNamespace('dashboard', loader)`.
3. `App` reads the user (`useCurrentUser`) and builds `onLogout` from `useSignOut`.
4. No router context (the shell does not share `react-router-dom`), so `App` mounts `BrowserRouter` with `workspaceBasename(location.pathname)`, e.g. `/t/acme`.
5. `AppShellLayout` renders the chrome and an `<Outlet context={{ search }} />`; the index route renders `DashboardPage`.

### 7.2 Standalone

`src/app/bootstrap/main.tsx` applies the stored theme (`readStoredAppTheme` from `infrastructure/storage` → `showAppTheme`), throws if `#app` is missing, then awaits `startStandalone()` (`src/app/bootstrap/standalone.ts`) and renders `<App />` on `#app`. `startStandalone` is the host-page start a shell would do, in the SDK's order (alpha.6): `loadRuntimeConfig({ timeoutMs: 5000 })` (`/config/runtime.json`), then `initializeCore({ serviceName: 'mfe-dashboard', domain: 'portal', environment: <the file's environment>, buildVersion: BUILD_VERSION })`, then `setRuntimeConfig`. One build serves every environment: each deployed `runtime.json` names its own. Without a file, or a file without `environment`, the page runs as `local` on the dev server and `prod` in a build. Any failure (no file, bad JSON, schema, timeout) is a `warn` through the SDK logger, which writes it to the console while logging is off; the page still renders without a config, and it never rejects. The basename is empty, the user is anonymous, permissions deny all (User management and All Tenders are hidden), and logout goes to `auth.signInUrl` when the config has one, else `/`. `App` renders inside the SDK's `MFEErrorBoundary` (the shell's `RemoteBoundary` does this job when embedded).

### 7.3 Ticket load and refresh

`DashboardPage` → `useDashboardData({ view, filters, canSeeAllTenders })` → `useApi` loader → `ticketsForView` + filters → load state (§6.3) → search filter → `TicketRow` list. Refresh sets a ref so the next load uses the 400 ms delay, then calls `reload()`. The "Last updated" label uses the `lastUpdated.ago` plural with whole minutes since `cachedAt` (at least 1), and keeps counting: `useNow` refreshes it every 30 s. On `error` the page shows an alert (`role="alert"`) "Tickets could not be loaded.", followed by `problemMessage(error)` for a `ProblemError` (never the server's `detail`), and a Retry button that calls `refresh()`.

### 7.4 User management access

`useMemberAccess()` returns `canView = read:members || manage:members` and `canManage = manage:members && !useReadOnly()`. The sidebar link renders on `canView`; `UserManagementRoute` renders the page on `canView`, otherwise `<Navigate to=".." relative="path" replace />` back to the dashboard. Invite, the Actions column and Edit render on `canManage`; the empty-row `colSpan` is 6 with actions and 5 without.

### 7.5 Approval step-up

On `awaiting-approval`, when `useStepUp().needed` (login older than the tenant's `mfaFreshnessSeconds`), a banner shows with **Re-authenticate**, which calls `stepUp.reauthenticate()`. The SDK redirects to the identity provider and back to this page. The approval itself is authorised by the API, not by this banner.

### 7.6 Sign-out

Sidebar and user-menu **Logout** call `onLogout`. Inside web-shell that is the SDK's global sign-out (ends the Keycloak session; the SDK clears `storage()` for the workspace). Since `1.0.0-alpha.4` it POSTs to Keycloak's end-session endpoint with a hidden form, so **web-shell's CSP `form-action` must allow the IdP origin**; otherwise the browser blocks the POST and the SSO session stays alive. That is web-shell's header; this image's own CSP (`form-action 'self'`) only covers the standalone page, which has no shell sign-out. If `signOut()` rejects because no shell provides it, `goToSignIn()` (`src/infrastructure/auth/signIn.ts`) runs `window.location.assign` of the runtime config's `auth.signInUrl` without a trailing slash, else `/`. Inside web-shell the shell's config has no `signInUrl` (the shell is the sign-in page).

### 7.7 Theme

On start (`main.tsx`) and on mount (`AppShellLayout`), `showAppTheme(readStoredAppTheme())` sets `data-theme` on `<html>` and stores nothing. A user's choice (`ThemePicker`, or the user menu's light/dark toggle) goes through `chooseTheme` → `saveAppTheme`, which writes `appTheme`, and for Aura themes also `themeMode`. `readStoredAppTheme()` prefers `appTheme`, then `themeMode`, then `light`. The logo variant follows `auraModeFromAppTheme`. Who should own `data-theme` when embedded is open (§15 item 8). The SDK `1.0.0-alpha.4` stores keys as `@bcbp-solutions-fzc-llc/frontend-sdk:storage:<namespace>:dashboard:<key>` and does not read the alpha.3 keys, so after the upgrade a saved theme falls back to `light` once until the user picks it again.

### 7.8 Keyboard and focus

| Popup | Behaviour |
|---|---|
| User menu (`role="menu"`) | Opens with focus on the first item; ArrowDown / ArrowUp wrap, Home / End jump; Escape or an outside press closes; Escape returns focus to the trigger (`useDismiss`, `menu: true`) |
| Theme picker (`role="menu"`, two labelled `group`s of `menuitemradio` with `aria-checked`) | Opens with focus on the current theme; ArrowDown / ArrowUp wrap, Home / End jump; Escape or an outside press closes; Escape returns focus to the trigger (`useDismiss`, `menu: true`) |
| View cards and view buttons | `aria-pressed` marks the selected view |
| Filter drawer (`role="dialog"`, `aria-modal`) | Focus moves inside on open, Tab and Shift+Tab wrap inside, Escape or the overlay closes, focus returns to the Filters button (`useFocusTrap`) |
| Header search | `type="search"` with an `aria-label` (the placeholder text), so screen readers name it |

## 8. Authorization (UI hints)

All checks here are UI hints. IAM and the APIs decide (SDK `/authz`: "UI gating only").

| UI | Permission | Granted by web-shell's map to |
|---|---|---|
| "All Tenders In Flight" view | `read:tender` | `member` and above (Tender Service to confirm `tender_admin`'s tender rights) |
| User management page and sidebar link | `read:members` or `manage:members` | any active member (`read:members`); `tenant_admin`, `tenant_owner` (`manage:members`) |
| Invite, Edit, Actions column | `manage:members`, and not `useReadOnly()` | `tenant_admin`, `tenant_owner` |

Role names never appear in this repo (IAM's closed set is `member`, `tenant_owner`, `tenant_admin`, `tender_admin`; `preparator` / `reviewer` / `approver` are department levels). `dependency-rules.test.ts` fails on a role-name literal in `src/`. The ownership split is recorded in `../user-management-permission-ownership.md` (frontend workspace).

## 9. i18n

- Namespace `dashboard` (`APP_ID`). `registerMessages()` registers a loader that returns `en.json` for any `en*` locale and `{}` otherwise, so other locales fall back to English through the SDK, then to the key.
- Every UI string is a key in `src/app/configuration/locales/en.json`. Fixture data (tickets, users), brand and theme names are not translated.
- Keys built at runtime come from closed sets: `views.<view>.label|subtitle`, `sla.<state>`, `users.status.<status>`, `language.<locale>` (the language name; the locale code when missing).
- ICU-lite: placeholders (`{count}`, `{view}`, …) and `plural` (`lastUpdated.ago`). Numbers inside text go through `formatNumber`, dates through `formatDate`, both in the page locale.
- `test/unit/i18n/catalog.test.ts` fails on a missing key, an unused key, or a message that does not format.

## 10. State and Storage

| State | Where | Lifetime |
|---|---|---|
| `appTheme`, `themeMode` | SDK `storage('dashboard')`: `localStorage`, namespaced per workspace and tenant | Until sign-out or workspace switch (the SDK clears it); not written while anonymous |
| Search text | `AppShellLayout` state, passed by outlet context | The mount |
| View, filters, drawer | `DashboardPage` state | The mount |
| Tickets | `useApi` data, keyed by query | The mount |

No tokens, user data or permissions are stored by this repo. Raw `localStorage` / `sessionStorage` / IndexedDB are rejected by lint and the rules test.

## 11. Failure Handling

| Failure | Behaviour |
|---|---|
| A row's tender details unavailable | `partial_failure`: banner "Tickets are retained below", right-panel error card; rows stay |
| Filters match nothing / search matches nothing | "No tickets found" with Clear Filters / "No matching tickets" |
| No `read:members` / `manage:members` | Link hidden; route redirects to the dashboard |
| No shell `signOut` | Fallback navigation to `auth.signInUrl`, else `/` |
| Standalone `/config/runtime.json` missing, invalid or slow (> 5 s) | `warn` through the SDK logger (on the console in every environment while logging is off, alpha.6); the page renders with no config, as `prod` (`local` on the dev server), and logout uses `PUBLIC_APP1_URL`. Deploy check in `docs/runbook-release.md` |
| Reload of a nested standalone route (`/dashboard/user-management`) | Works: the standalone HTML links `/assets/…` and `/favicon.png` root-absolute (`assetPrefix: '/'`); the CI smoke script checks it |
| `#app` missing (standalone) | `main.tsx` throws before render |
| Ticket load fails with an API error | `error` state: alert with the SDK's problem message and Retry; rows cleared |
| Ticket loader throws anything else (a bug) | `useApi` rethrows; the page's `MFEErrorBoundary` in `AppShellLayout` (only the page is replaced; it clears when the path changes) shows its fallback and logs it |
| Shell does not provide a shared SDK subpath | `get('./App')` rejects ("Shared module … doesn't exist in shared scope default"); the shell's `RemoteBoundary` shows its error |
| Shell's SDK outside `^1.0.0-alpha.6`, or React outside `^19.0.0` | Strict singleton check fails at load; the shell shows its error |
| A render error in a page | the page's `MFEErrorBoundary` in `AppShellLayout` (only the page is replaced; it clears when the path changes); the sidebar still navigates |
| A render error in the chrome (sidebar, header) | Embedded: the shell's `RemoteBoundary`. Standalone: the SDK's `MFEErrorBoundary` in `main.tsx` (logged, fallback shown) |

## 12. Build, Image, Configuration and Release

### 12.1 Build (`rsbuild.config.ts`)

One `rsbuild build` makes two environments into `dist/` (`npm run build` runs `tsc`, empties `dist/`, then builds; `cleanDistPath: false`):

| Environment | Entry | Output | SDK |
|---|---|---|---|
| `remote` | `src/app/bootstrap/remote.ts` (placeholder) + `pluginPlatform({ role: 'remote', name: 'dashboard', exposes: { './App': './src/App.tsx' } })` | `remoteEntry.js`, chunks next to it, CSS under `assets/` | from the shell (`import: false`) |
| `standalone` | `src/app/bootstrap/main.tsx`, `index.html` | `index.html`, `assets/` | bundled |

The preset's `SdkVersionPlugin` (since `1.0.0-alpha.4`) fails the build when the installed `frontend-sdk` is not the preset's own version, so the three platform packages move together. Because the container global (§4.1) and the shared range come from that version, a platform upgrade ships as one release with web-shell: a remote built with the alpha.3 preset does not load in an alpha.4 shell, and the reverse.

The preset sets `assetPrefix: 'auto'`: the remote's chunks and images resolve from wherever `remoteEntry.js` was loaded. The `standalone` environment overrides it with `'/'`, because in its HTML `'auto'` becomes relative (`assets/…`) and breaks a reload of a nested route; `test/unit/app/standalone-build.test.ts` and the smoke script check it.

`inlineScripts`/`inlineStyles` are off (CSP `script-src 'self'`). The dev server (port 5002, `strictPort`, CORS `*`) runs without HMR or live reload, which would otherwise be injected into `remoteEntry.js`.

### 12.2 Dependencies

| Package | Version | Note |
|---|---|---|
| Node | `26` (`.nvmrc`, CI, the Dockerfile's builder); `engines.node` `>=22` | `>=22` is the platform packages' minimum |
| `@bcbp-solutions-fzc-llc/frontend-sdk` | dev `1.0.0-alpha.6`, peer `^1.0.0-alpha.6` | Same version as web-shell; never a runtime dependency (checked by `dependency-rules.test.ts`) |
| `@bcbp-solutions-fzc-llc/webpack-preset` | `1.0.0-alpha.6` | Same as web-shell |
| `@bcbp-solutions-fzc-llc/eslint-plugin` | `1.0.0-alpha.6` | Same as web-shell |
| `@fontsource-variable/geist`, `@fontsource-variable/inter` | `5.3.0` | Standalone page only (CSP `font-src 'self'`). Same packages, family names (`Geist Variable`, `Inter Variable`) and `tailwind.config.js` as web-shell, which provides the fonts when embedded |
| `overrides.minimatch` | `^11.0.4` | Dev-only toolchain (ESLint, typescript-eslint): fixes GHSA-g3hv-75wg-m249 without downgrading ESLint; `npm audit` reports 0 |
| `typescript` | `npm:@typescript/typescript6` | for typescript-eslint; `tsc` is `@typescript/native` (TypeScript 7) |
| Registry | GitHub Packages (`.npmrc`, `NODE_AUTH_TOKEN` with `read:packages`) | CI and the Docker build pass the token (`packages: read`, BuildKit secret `npm_token`) |

### 12.3 Image

`node:26-bookworm` builder → `nginxinc/nginx-unprivileged:1.31-alpine` (both digest-pinned, `apk upgrade`), uid 101, port 8080, source maps deleted. Build args: `BUILD_VERSION`, `SOURCE_DATE_EPOCH`. Nothing environment-specific is a build arg: the environment and sign-in URL come from `runtime.json` (ADR 0006).

| Path | Behaviour (`nginx/default.conf`) |
|---|---|
| `/healthz` | `200 ok` |
| `/` | standalone document (`id="app"`) |
| `/remoteEntry.js` | `Cache-Control: no-cache`, `Access-Control-Allow-Origin: *`, `Cross-Origin-Resource-Policy: cross-origin` |
| hashed chunks next to the entry, `/assets/*` (`^~`) | immutable, 1 year, CORS, `Cross-Origin-Resource-Policy: cross-origin` (platform guidance for a remote on another origin; `*` rather than the shell's origin because loads carry no credentials); `404` when absent |
| `/config/runtime.json` | The standalone page's SDK runtime config, `no-cache`; `404` when absent, never the SPA fallback. The image ships `public/config/runtime.json` (web-shell's defaults, no `signInUrl`); each environment mounts its own over it |
| `/api`, `/otel`, `/csp-report`, `/config`, `/remotes` (other files), and any dotfile (`/.env`, `/.git/…`) | `404` |
| a path whose last segment ends in a static-asset extension (`.js`, `.css`, `.json`, `.png`, `.woff2`, … : the list in `spa-rewrite.js`) | the file, `no-cache` (favicons, `remote-manifest-entry.json`); `404` when absent, never `index.html` |
| any other path (app routes, including dotted ones such as `/users/john.doe`) | `index.html` |

The last three rows are the platform's SPA rule, as CloudFront applies it (platform-reactcommon `examples/cloudfront/spa-rewrite.js`); the CI smoke script checks them. Until 0.3.0 this image fell back to `index.html` for every missing path, so a missing chunk or JSON file came back as HTML.
| every response | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (`nginx/security-headers.conf`) |
| the document (`/`, `/index.html`, the fallback) | CSP `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Permissions-Policy`, `X-Robots-Tag: noindex, nofollow`, `no-cache` (`nginx/document-headers.conf`) |

`server_tokens off`; gzip for text, CSS, JS, JSON and SVG over 1 kB. The CI smoke script asserts the document headers, the absence of the nginx version, and `remoteEntry.js`'s `nosniff`, CORS and gzip.

### 12.4 Configuration

| Variable | When | Default | Note |
|---|---|---|---|
| `auth.signInUrl` | run time (`/config/runtime.json`, SDK `1.0.0-alpha.5`+; standalone page only) | none | Standalone logout target per environment (else `/`). Absolute `https` (`http` only for local, dev and test) |
| `environment` in `/config/runtime.json` | run time (SDK `1.0.0-alpha.6`; standalone page only) | none: `prod` in a build, `local` on the dev server | The standalone page identity's environment. One build serves every environment; also decides whether `http` origins in the runtime config are accepted |
| `BUILD_VERSION` | build (release and Dockerfile; else the `package.json` version) | `npm_package_version` | The standalone page identity's build version |

### 12.5 Release

A tag `vX.Y.Z` (or a manual run with a tag input) runs `.github/workflows/release.yml`. Runbook: [`docs/runbook-release.md`](../runbook-release.md).

| Job | Does | Fails when |
|---|---|---|
| `validate-test`, `validate-quality` | Same as CI | Tests, the 95% gate, lint, audit |
| `build` | `verify-release-tag.sh` (tag equals the checked-out HEAD), `verify-changelog-entry.sh`, `prepare-release-asset.sh` (`dist` tarball, checksum, `remote-manifest-entry.json`) | The tag is not HEAD; no `## [X.Y.Z]` section |
| `docker` | `build-push-action` pushes **by digest only** (`push-by-digest=true`, `provenance: mode=max`, `sbom: true`); Trivy CRITICAL/HIGH and the CycloneDX SBOM on that digest; `export-image-provenance.sh`; Cosign keyless sign and verify; then `tag-signed-image.sh` adds `X.Y.Z`, `X.Y`, `X` and `latest` (no `-` in the tag) with `docker buildx imagetools create` and checks that each resolves to the signed digest | Trivy finds a fixable CRITICAL/HIGH; no provenance in the image index; signing fails; a tag resolves to another digest |
| `publish` | `extract-release-notes.sh` (the CHANGELOG section plus image and digest), then `create-github-release.sh` | Any asset missing |

Release assets: `mfe-dashboard_<tag>_dist.tar.gz`, `mfe-dashboard_<tag>_remote-manifest-entry.json`, `checksums.txt` (sha256 of those two), `provenance.slsa.json`, `sbom.cyclonedx.json`.

Provenance is a BuildKit attestation stored in the image index, not a Cosign attestation. `export-image-provenance.sh` reads it with `docker buildx imagetools inspect --format '{{ json .Provenance }}'` (an SLSA v1 predicate: `buildDefinition`, `runDetails`). Check it with the same command; check the signature with `cosign verify` and the tag identity in the runbook.

Tags are added last, so a failed scan, provenance export or signature leaves only an untagged digest in GHCR: no version tag, no `latest`, no GitHub Release. (`v0.1.0` predates this and left an unsigned `0.1.0` tag, since deleted.) A rerun checks out the same tag and scripts, so a fix to the workflow ships as the next patch version.

There is no deploy job. To deploy, copy the `dashboard` object from the release's `remote-manifest-entry.json` into the environment's manifest, with `entry` made absolute, and release together with a web-shell on the same platform packages (§12.1).

## 13. Security

| Item | Handling |
|---|---|
| Tokens | Never seen: the SDK holds them in memory in the shell; `dependency-rules.test.ts` rejects `document.cookie`, `atob(`, JWT libraries and `Authorization` headers in `src/` |
| Identity headers | Never set (lint `no-identity-headers`); the gateway injects them |
| HTML injection | No `dangerouslySetInnerHTML` (lint `no-unsafe-html`); all text is React-escaped |
| CSP | No inline scripts or styles in the build; no `eval` / `new Function` (lint); no third-party origins (fonts self-hosted). The image's document CSP is same-origin only and was checked in Chrome with no violations |
| Clickjacking, sniffing, indexing | `frame-ancestors 'none'` + `X-Frame-Options: DENY`, `nosniff`, `X-Robots-Tag: noindex` on the demo document |
| Supply chain | Base images digest-pinned; Trivy (CRITICAL/HIGH/UNKNOWN on PRs, CRITICAL/HIGH on tags); CycloneDX SBOM; BuildKit SLSA provenance in the image index, exported to the GitHub Release; Cosign keyless signature (§12.5); the shell pins `remoteEntry.js` by SRI in its manifest |
| Fixture data | Sample names and emails only; not accounts |

## 14. Testing

Laid out like platform-reactcommon's `test/` ([test/README.md](../../test/README.md)). Vitest 5, happy-dom, Testing Library; every test runs against a fresh `createTestPlatform` runtime (`test/setup.ts`).

| Suite | Command | Covers |
|---|---|---|
| `test/unit/<area>` (`app`, `authz`, `dashboard`, `components`, `theme`, `i18n`, `sdk`) | `npm run test:unit` | One area of `src/` each; the catalog and SDK-rule checks |
| `test/integration` | `npm run test:integration` | The built `remoteEntry.js` (temp Rsbuild build of the `remote` environment) loaded through `init(shareScope)` / `get('./App')` and rendered with the shell's React and SDK |
| `test/e2e` | `npm run test:e2e` | User flows through the whole `App` |
| Image smoke | CI `smoke` job (`.github/scripts/smoke-tests.sh`) | Size ≤ 200 MB, `/healthz`, `/`, `remoteEntry.js` starts with `var __platform_mfe_dashboard`, no `.map` files, `/config/runtime.json` served as JSON, the platform SPA rule (8 cases), security headers, no nginx version, gzip |

Gate: 95% statements, branches, functions and lines on `src/` (`.github/scripts/coverage-gate.mjs`); today 99.0% / 97.8% / 100% / 99.3% with 153 tests in 28 files; every `src/domain/` file above 90%.

## 15. Open Items

| # | Item | Owner |
|---|---|---|
| 1 | Tickets, KPI counts, notifications, delegation and users are fixtures. Replace the `useDashboardData` loader with `ApiClient` calls when the ticket, notification and membership APIs exist (IAM P-4/P-6 for members) | mfe-dashboard, with the API owners |
| 3 | Eight controls have no action yet (Invite user, Edit, View details ×2, View all, View Ticket, Notifications, Available) and ticket rows open nothing: they need the ticket, notification and membership APIs and product flows | mfe-dashboard, product |
| 4 | Only an English catalog | mfe-dashboard, when locales are agreed |
| 5 | `tender_admin`'s tender permissions in web-shell's map await Tender Service confirmation | web-shell, Tender Service |
| 6 | The image serves the remote from nginx; the platform's CloudFront/S3 layout (`/remotes/dashboard/<version>/`) is not yet wired | Platform deployment |
| 8 | The remote ships its own Tailwind preflight, every daisyUI theme (~180 kB CSS, a 78 kB theme chunk) and `html, body` styles, and `applyAppTheme` sets `data-theme` on the shell's `<html>`. Theme ownership and shared CSS need a decision with web-shell: options in `../mfe-dashboard-theme-and-css-ownership.md` (frontend workspace) | web-shell, mfe-dashboard |
| 9 | Layout uses logical classes (`ps/pe`, `ms/me`, `start/end`, `border-s/e`, `text-start/end`, `rtl:` for the sidebar slide), so it follows `dir`. Still needed for RTL: the shell setting `<html dir>` for the locale, an Arabic catalog, and a check of directional icons (chevrons) | web-shell, mfe-dashboard |
| 10 | Logs: failed loads only. Metrics: three Tier 3 metrics (ticket loads, load duration, step-up requests; `docs/observability/metrics.md`); the proposed recording rules, alerts and SLOs there need an owner in the platform's Prometheus/Grafana. Source maps are deleted rather than uploaded for symbolication | mfe-dashboard, platform observability |
| 11 | No test loads the real `remoteEntry.js` inside the real web-shell in a browser: each repo stubs the other (web-shell's e2e stubs `__platform_mfe_dashboard`; `remote-entry.test.tsx` builds the share scope itself). Until a joint Playwright test exists (`../web-shell-mfe-dashboard-cross-repo-test.md`, frontend workspace), check platform upgrades by hand with both dev servers | web-shell, mfe-dashboard |
| 12 | Web-shell's CSP (CloudFront) must allow the IdP origin in `form-action` for the alpha.4 global sign-out POST (§7.6). Deploying `v0.3.0` waits for web-shell's tag, which is blocked on the IAM endpoints, environment setup (interim CloudFront substitute), the Privacy and Terms URLs and Keycloak password-reset email | web-shell, platform deployment |
| 14 | Deployed `runtime.json` for the standalone image: set `auth.signInUrl` (since alpha.5) and, once this remote runs alpha.6, `environment` (earlier SDKs refuse the unknown key). Deploy check in `docs/runbook-release.md`. Until then standalone logout returns to `/` and the page runs as `prod` | platform deployment |
| 15 | Rename `app2` → `dashboard`: done in both repos (this repo #26, web-shell #35) and released in `v0.3.0`. Left: each dev environment's `/remotes/manifest.json` switches its key to `dashboard` (entry and integrity from `mfe-dashboard_v0.3.0_remote-manifest-entry.json`), the files are served under `/remotes/dashboard/<version>/`, and any kill-switch entry says `dashboard`; deploy together with web-shell | platform deployment |
| 16 | Platform packages `1.0.0-alpha.6`: web-shell moved first (web-shell #44); this remote follows here. Release, then deploy both together | mfe-dashboard |
| 17 | Frontend Architecture Constitution follow-ups (`docs/architecture/constitution-assessment.md` §6): Playwright journeys in this repo, automated a11y checks and a WCAG 2.1 AA contrast audit, contract tests with the first API repository, `platform-design-system` components when published, and revisiting ADR 0002/0003 when the APIs arrive | mfe-dashboard, platform |
