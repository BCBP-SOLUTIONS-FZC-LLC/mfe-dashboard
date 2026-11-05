# mfe-dashboard — Low-Level Design

## Tender Management SaaS Platform — Dashboard Remote (`app2`)

| | |
|---|---|
| Repository | `BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard` (private) |
| Deliverables | Container image `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard` and the release `dist` tarball. `package.json` is private (`0.0.0`); nothing is published to npm |
| Version | Untagged (`[Unreleased]` in [CHANGELOG.md](../../CHANGELOG.md)); SemVer rules in [VERSIONING.md](../../VERSIONING.md) |
| Host | `web-shell` (`app1`), which loads this remote as `DASHBOARD_REMOTE = 'app2'` (`web-shell/src/App.tsx`) |
| Platform SDK | `@bcbp-solutions-fzc-llc/frontend-sdk` `1.0.0-alpha.3` (peer `^1.0.0-alpha.3`, provided by the shell); `webpack-preset` and `eslint-plugin` `1.0.0-alpha.2` (§12) |
| Runtime | React 19, React Router 7, Tailwind 4 + daisyUI 5; built with Rsbuild 2 (Rspack); served by nginx 1.31 on port 8080 |
| Narrative | [ARCHITECTURE.md](../../ARCHITECTURE.md) (diagrams, failure domains, decisions) |
| Upstream contracts | platform-reactcommon LLD and design doc (`docs/lld/platform-reactcommon-lld.md`, `docs/design/frontend-sdk-design.md`); iam-org-membership LLD §5.4 P-35 and §10.4 (roles, member rights) |

### Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-04 | First LLD, written from `main` after #11–#16 (dependencies, platform SDK adoption, member access, step-up, SDK `1.0.0-alpha.3`) and #17 (test layout, integration and rule suites) |

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
12. [Build, Image and Configuration](#12-build-image-and-configuration)
13. [Security](#13-security)
14. [Testing](#14-testing)
15. [Open Items](#15-open-items)

---

## 1. Document Overview

This LLD records how the remote is built and what it promises its host: the exposed module and its props, routes, shared modules, the SDK APIs it depends on, the data it shows, and how it fails. Where this document and the code disagree, the code is right and this document has a bug.

The remote has no backend of its own yet. Tickets, KPI counts, notifications, delegation and users are fixtures in `src/mocks/` and `src/pages/UserManagementPage.tsx`. §15 lists what replaces them.

## 2. Responsibilities and Boundaries

### 2.1 In scope

| Concern | Where |
|---|---|
| The ticket dashboard: five views, KPI cards, filters, search, refresh, load states, right panel (delegation, notifications, SLA overview, tender-details error) | `src/pages/DashboardPage.tsx`, `src/components/dashboard/`, `src/hooks/useDashboardData.ts` |
| User management: member table, search, Invite and Edit for managers | `src/pages/UserManagementPage.tsx`, `src/hooks/useMemberAccess.ts` |
| Chrome inside the remote: sidebar, search box, theme picker, user menu, logout | `src/layouts/AppShellLayout.tsx`, `src/components/ThemePicker.tsx` |
| Routing under the shell's workspace prefix, and standalone | `src/App.tsx` |
| The `app2` message catalog | `src/i18n.ts`, `src/locales/en.json` |
| Themes (Aura light/dark and daisyUI) | `src/theme/` |
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

```
src/
├── App.tsx                     exposed ./App and standalone root: SDK user/sign-out, routing, workspaceBasename()
├── remote.ts                   remote build's placeholder entry (the shell loads remoteEntry.js only)
├── main.tsx                    standalone entry: stored theme, then <App /> on #app
├── i18n.ts                     APP_ID = 'app2', registerMessages()
├── locales/en.json             every UI string
├── layouts/AppShellLayout.tsx  sidebar, search, theme, user menu, logout; defaultLogout()
├── layouts/appShellContext.ts  outlet context { search }
├── pages/DashboardPage.tsx     views, KPI cards, filters, banners, ticket list
├── pages/UserManagementPage.tsx member table (fixture rows)
├── components/                 BrandLogo, ThemePicker, dashboard/{TicketRow, DashboardRightPanel, DashboardIcons}
├── hooks/useDashboardData.ts   tickets through the SDK's useApi (fixture loader)
├── hooks/useMemberAccess.ts    canView / canManage from read:members, manage:members, useReadOnly
├── mocks/                      dashboardTickets (rows, ticketsForView, filter options), dashboardStats (KPI, notifications, delegation, SLA)
├── theme/                      themeMode.ts (storage('app2')), daisyThemes.ts, aura.css, daisyAuraBridge.css
└── types/ticket.ts             DashboardView, SlaState, TicketItem, DashboardFilters
```

Layering, top to bottom: `App` → `AppShellLayout` → pages → components and hooks → mocks, theme and types. Every layer may import the SDK's public subpaths; nothing imports upward. `test/unit/sdk/dependency-rules.test.ts` enforces the SDK rules in §5.

## 4. Runtime Contract with the Shell

This is the SemVer surface ([VERSIONING.md](../../VERSIONING.md)).

### 4.1 Container

| Item | Value |
|---|---|
| Container name / global | `app2`, defined synchronously by `remoteEntry.js` as `var app2` (Module Federation v1) |
| Exposed module | `./App` → `src/App.tsx` (default export `App`, named export `workspaceBasename`) |
| Chunk loading | Relative to `remoteEntry.js` (`self.rspackChunkapp2`); CSS is a lazy chunk under `assets/async/` |
| Split chunks | Async only (`splitChunks: { preset: 'none', chunks: 'async' }`); a split entry would make `window.app2` a Promise, which `loadRemote` refuses |
| Manifest entry (shell side) | `"app2": { "entry": ".../remoteEntry.js", "version": ..., "ownerDomain": "portal", "integrity": "sha384-..." }`; `integrity` required outside local, dev and test |

### 4.2 Shared modules

The preset's `sharedFor('remote')` configures `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `react-dom`, `react-dom/client`, `@opentelemetry/api` and every SDK subpath as strict singletons. The build consumes only what `src/` imports; `remoteEntry.js` contains:

| Share key | `requiredVersion` | Notes |
|---|---|---|
| `react`, `react/jsx-runtime` | `^19.0.0` | strict singleton |
| `@bcbp-solutions-fzc-llc/frontend-sdk/{auth,config,i18n,react,storage}` | `^1.0.0-alpha.2` (the preset's SDK version) | `import: false`: never bundled, no fallback; the load fails without the shell's copy |

`react-dom` is used only by the standalone entry (`main.tsx`), and `@opentelemetry/api` not at all, so neither appears in the remote. `react-router-dom` is **not** shared; the remote brings its own router (§7.1). `test/integration/remote-entry.test.tsx` checks that every share key is one the shell provides and that no SDK code is in the bundle.

### 4.3 Props

| Prop | Type | Default |
|---|---|---|
| `userLabel` | `string?` | `useCurrentUser()` email, then name, then the catalog's `User` |
| `onLogout` | `() => void?` | `useSignOut()()` (global sign-out); when it rejects (no shell `signOut`), `defaultLogout()` → `VITE_APP1_URL` |

web-shell passes neither today. A new required prop is a MAJOR change.

### 4.4 Routes

| Mounted | Router | Paths |
|---|---|---|
| By web-shell | The remote's `BrowserRouter`, `basename = workspaceBasename(location.pathname)` = `workspacePathPrefix + slugFromPath(...)` (e.g. `/t/acme`) | `/t/<slug>/dashboard`, `/t/<slug>/dashboard/user-management` |
| By a host that already has a router (`useInRouterContext()`) | The host's | index → dashboard, `user-management`, relative to the host route |
| Standalone (`npm run dev`, the image's `/`) | `BrowserRouter`, no basename (no runtime config) | `/dashboard`, `/dashboard/user-management`; `/` and unknown paths → `/dashboard` |

`UserManagementRoute` registers the route template `/t/:slug/dashboard/user-management` with `useRouteTemplate` (telemetry names the route by template, not by slug). Sidebar links are absolute (`/dashboard`, `/dashboard/user-management`) under the basename.

## 5. Platform SDK Usage

The rule: anything the SDK provides is used from the SDK, through public subpaths only. `npm run lint` (`@bcbp-solutions-fzc-llc/eslint-plugin`: `no-raw-storage`, `no-sdk-deep-import`, `no-sdk-root-import`, `no-unsafe-html`, `no-identity-headers`, `no-eval`, …) and `test/unit/sdk/dependency-rules.test.ts` enforce it.

| Concern | SDK API | Used in |
|---|---|---|
| Signed-in user | `useCurrentUser` (`/react`) | `App.tsx` |
| Sign-out | `useSignOut` (`/react`) | `App.tsx` |
| Workspace basename | `slugFromPath` (`/auth`), `tryGetConfig().auth.workspacePathPrefix` (`/config`) | `App.tsx` `workspaceBasename` |
| Route naming | `useRouteTemplate` (`/react`) | `App.tsx` |
| Permissions | `useHasPermission('read','tender')`, `('read','members')`, `('manage','members')` (`/react`) | `DashboardPage.tsx`, `useMemberAccess.ts` |
| Read-only tenant | `useReadOnly` (`/react`) | `useMemberAccess.ts` |
| Step-up MFA | `useStepUp` (`needed`, `reauthenticate()`) (`/react`) | `DashboardPage.tsx` |
| Data loading | `useApi(loader, deps)` (run on change, abort superseded loads, `reload`) (`/react`) | `useDashboardData.ts` |
| Messages and plurals | `registerNamespace` (`/i18n`), `useT('app2')`, `useLocale` (`/react`) | `i18n.ts`, every component |
| Dates and numbers | `formatDate`, `formatNumber` (`/i18n`) | `TicketRow`, `DashboardRightPanel`, `DashboardPage`, `AppShellLayout`, `UserManagementPage` |
| Per-app storage | `storage('app2')` (`/storage`) | `theme/themeMode.ts` |
| Tests | `createTestPlatform` (`/testing`) | `test/fixtures/platform.ts`, `test/setup.ts` |

Not used yet, and the place to start when the need arrives: `useApiClient` / `createApiClient` (real APIs, §15), `useFeatureFlag`, `Can`, `useAppUpdate`, `useOnlineStatus`, `MFEErrorBoundary`, `getLogger` / `getServiceMeter`.

Standalone, with no shell, every SDK API answers with its anonymous defaults (design doc §C2): no user, `denyAll`, the default locale, and `storage()` writes nothing.

## 6. Domain Model

### 6.1 Types (`src/types/ticket.ts`)

| Type | Values / fields |
|---|---|
| `DashboardView` | `my-tickets`, `awaiting-review`, `awaiting-approval`, `delegated`, `all-tenders` |
| `SlaState` | `on_track`, `warning`, `breached` |
| `TicketItem` | `id`, `tenderTitle`, `client`, `stage`, `deliverable`, `section`, `department`, `roleLevel`, `dueDate` (ISO), `slaState`, `restricted?`, `evidenceGrade?`, `delegatedFrom?`, `unreadComments`, `tenderDetailsUnavailable?`, `status` |
| `DashboardFilters` | `status`, `role`, `department`, `deadline`, `tender` (each `'all'` or a value) |
| `ManagedUser` (page-local) | `id`, `name`, `email`, `role`, `department`, `status: 'Active' \| 'Invited' \| 'Disabled'` |

### 6.2 Views (`ticketsForView`, `src/mocks/dashboardTickets.ts`)

| View | Rows | Visible to |
|---|---|---|
| `my-tickets` | `status === 'open'`, not delegated; sorted by SLA, then due date | everyone |
| `awaiting-review` | `status === 'review'` | everyone |
| `awaiting-approval` | `status === 'approval'` | everyone; step-up banner when `useStepUp().needed` |
| `delegated` | `delegatedFrom` set | everyone |
| `all-tenders` | every row when `canSeeAllTenders`, otherwise `[]` | `read:tender` |

Filter options come from the data: `DEPARTMENT_OPTIONS` (distinct departments), `ROLE_OPTIONS`, `TENDER_OPTIONS`. Status, department, role (`roleLevel.includes`) and tender (title substring) are applied in `useDashboardData`. **Deadline is counted in the badge and not applied** (no predicate yet). The header search then filters title, client and department.

KPI numbers are `KPI_COUNTS` (fixed per view), not row counts. The SLA overview counts `my-tickets` rows by `slaState` against `KPI_COUNTS['my-tickets']`.

### 6.3 Load states (`useDashboardData`)

| State | When |
|---|---|
| `loading` | No data for the current query key (`JSON.stringify([view, filters, canSeeAllTenders])`) |
| `partial_failure` | View `my-tickets` and a row has `tenderDetailsUnavailable` (fixture `T-1015`) |
| `empty` | Zero rows |
| `ready` | Otherwise |

`refreshing` is true while a reload of the same key runs; the last rows stay on screen. The fixture loader waits 700 ms (400 ms on refresh) on an abortable delay, so a superseded load is aborted by `useApi`.

## 7. Key Flows

### 7.1 Mount inside web-shell

1. The shell resolves `app2` from its manifest, injects `remoteEntry.js` (with SRI), calls `app2.init(shareScope)` and `app2.get('./App')` (SDK `loadRemote`), and renders `App` inside `RemoteBoundary` at `/t/:slug/dashboard/*`.
2. Importing `./App` imports `./i18n`, which calls `registerNamespace('app2', loader)`.
3. `App` reads the user (`useCurrentUser`) and builds `onLogout` from `useSignOut`.
4. No router context (the shell does not share `react-router-dom`), so `App` mounts `BrowserRouter` with `workspaceBasename(location.pathname)`, e.g. `/t/acme`.
5. `AppShellLayout` renders the chrome and an `<Outlet context={{ search }} />`; the index route renders `DashboardPage`.

### 7.2 Standalone

`src/main.tsx` applies the stored theme (`readStoredAppTheme` → `applyAppTheme`), then renders `<App />` on `#app` (throws if `#app` is missing). There is no runtime config, so the basename is empty, the user is anonymous, permissions deny all (User management and All Tenders are hidden), and logout goes to `VITE_APP1_URL`.

### 7.3 Ticket load and refresh

`DashboardPage` → `useDashboardData({ view, filters, canSeeAllTenders })` → `useApi` loader → `ticketsForView` + filters → load state (§6.3) → search filter → `TicketRow` list. Refresh sets a ref so the next load uses the 400 ms delay, then calls `reload()`. The "Last updated" label uses the `lastUpdated.ago` plural with whole minutes since `cachedAt`.

### 7.4 User management access

`useMemberAccess()` returns `canView = read:members || manage:members` and `canManage = manage:members && !useReadOnly()`. The sidebar link renders on `canView`; `UserManagementRoute` renders the page on `canView`, otherwise `<Navigate to=".." relative="path" replace />` back to the dashboard. Invite, the Actions column and Edit render on `canManage`; the empty-row `colSpan` is 6 with actions and 5 without.

### 7.5 Approval step-up

On `awaiting-approval`, when `useStepUp().needed` (login older than the tenant's `mfaFreshnessSeconds`), a banner shows with **Re-authenticate**, which calls `stepUp.reauthenticate()`. The SDK redirects to the identity provider and back to this page. The approval itself is authorised by the API, not by this banner.

### 7.6 Sign-out

Sidebar and user-menu **Logout** call `onLogout`. Inside web-shell that is the SDK's global sign-out (ends the Keycloak session; the SDK clears `storage()` for the workspace). If `signOut()` rejects because no shell provides it, `defaultLogout()` runs `window.location.assign(VITE_APP1_URL without a trailing slash)`.

### 7.7 Theme

`ThemePicker` and the user menu's theme toggle call `applyAppTheme(id)`: sets `data-theme` on `<html>`, writes `appTheme`, and for Aura themes also `themeMode`. `readStoredAppTheme()` prefers `appTheme`, then `themeMode`, then `light`. The logo variant follows `auraModeFromAppTheme`.

## 8. Authorization (UI hints)

All checks here are UI hints. IAM and the APIs decide (SDK `/authz`: "UI gating only").

| UI | Permission | Granted by web-shell's map to |
|---|---|---|
| "All Tenders In Flight" view | `read:tender` | `member` and above (Tender Service to confirm `tender_admin`'s tender rights) |
| User management page and sidebar link | `read:members` or `manage:members` | any active member (`read:members`); `tenant_admin`, `tenant_owner` (`manage:members`) |
| Invite, Edit, Actions column | `manage:members`, and not `useReadOnly()` | `tenant_admin`, `tenant_owner` |

Role names never appear in this repo (IAM's closed set is `member`, `tenant_owner`, `tenant_admin`, `tender_admin`; `preparator` / `reviewer` / `approver` are department levels). `dependency-rules.test.ts` fails on a role-name literal in `src/`. The ownership split is recorded in `../user-management-permission-ownership.md` (frontend workspace).

## 9. i18n

- Namespace `app2` (`APP_ID`). `registerMessages()` registers a loader that returns `en.json` for any `en*` locale and `{}` otherwise, so other locales fall back to English through the SDK, then to the key.
- Every UI string is a key in `src/locales/en.json`. Fixture data (tickets, users), brand and theme names are not translated.
- Keys built at runtime come from closed sets: `views.<view>.label|subtitle`, `sla.<state>`, `users.status.<status>`, `language.<locale>` (the language name; the locale code when missing).
- ICU-lite: placeholders (`{count}`, `{view}`, …) and `plural` (`lastUpdated.ago`). Numbers inside text go through `formatNumber`, dates through `formatDate`, both in the page locale.
- `test/unit/i18n/catalog.test.ts` fails on a missing key, an unused key, or a message that does not format.

## 10. State and Storage

| State | Where | Lifetime |
|---|---|---|
| `appTheme`, `themeMode` | SDK `storage('app2')`: `localStorage`, namespaced per workspace and tenant | Until sign-out or workspace switch (the SDK clears it); not written while anonymous |
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
| No shell `signOut` | Fallback navigation to `VITE_APP1_URL` |
| `#app` missing (standalone) | `main.tsx` throws before render |
| Shell does not provide a shared SDK subpath | `get('./App')` rejects ("Shared module … doesn't exist in shared scope default"); the shell's `RemoteBoundary` shows its error |
| Shell's SDK outside `^1.0.0-alpha.2`, or React outside `^19.0.0` | Strict singleton check fails at load; the shell shows its error |
| A render error inside the remote | Caught by the shell's `RemoteBoundary` (no boundary of its own here) |

## 12. Build, Image and Configuration

### 12.1 Build (`rsbuild.config.ts`)

One `rsbuild build` makes two environments into `dist/` (`npm run build` runs `tsc`, empties `dist/`, then builds; `cleanDistPath: false`):

| Environment | Entry | Output | SDK |
|---|---|---|---|
| `remote` | `src/remote.ts` (placeholder) + `pluginPlatform({ role: 'remote', name: 'app2', exposes: { './App': './src/App.tsx' } })` | `remoteEntry.js`, chunks next to it, CSS under `assets/` | from the shell (`import: false`) |
| `standalone` | `src/main.tsx`, `index.html` | `index.html`, `assets/` | bundled |

`inlineScripts`/`inlineStyles` are off (CSP `script-src 'self'`). The dev server (port 5002, `strictPort`, CORS `*`) runs without HMR or live reload, which would otherwise be injected into `remoteEntry.js`.

### 12.2 Dependencies

| Package | Version | Note |
|---|---|---|
| `@bcbp-solutions-fzc-llc/frontend-sdk` | dev `1.0.0-alpha.3`, peer `^1.0.0-alpha.3` | Same version as web-shell; never a runtime dependency (checked by `dependency-rules.test.ts`) |
| `@bcbp-solutions-fzc-llc/webpack-preset` | `1.0.0-alpha.2` | web-shell is on `1.0.0-alpha.3` (§15) |
| `@bcbp-solutions-fzc-llc/eslint-plugin` | `1.0.0-alpha.2` | web-shell is on `1.0.0-alpha.3` (§15) |
| `typescript` | `npm:@typescript/typescript6` | for typescript-eslint; `tsc` is `@typescript/native` (TypeScript 7) |
| Registry | GitHub Packages (`.npmrc`, `NODE_AUTH_TOKEN` with `read:packages`) | CI and the Docker build pass the token (`packages: read`, BuildKit secret `npm_token`) |

### 12.3 Image

`node:26-bookworm` builder → `nginxinc/nginx-unprivileged:1.31-alpine` (both digest-pinned, `apk upgrade`), uid 101, port 8080, source maps deleted. Build args: `VITE_APP1_URL` (default `http://localhost:5001`), `BUILD_VERSION`, `SOURCE_DATE_EPOCH`.

| Path | Behaviour (`nginx/default.conf`) |
|---|---|
| `/healthz` | `200 ok` |
| `/` | standalone document (`id="app"`) |
| `/remoteEntry.js` | `Cache-Control: no-cache`, `Access-Control-Allow-Origin: *` |
| hashed chunks next to the entry, `/assets/*` | immutable, 1 year, CORS |
| anything else | `try_files` → `index.html` |

### 12.4 Configuration

| Variable | When | Default | Note |
|---|---|---|---|
| `VITE_APP1_URL` | build (`source.define`, Dockerfile `ARG`, CI repository variable) | `http://localhost:5001` | Public in the bundle; logout target without a shell |

## 13. Security

| Item | Handling |
|---|---|
| Tokens | Never seen: the SDK holds them in memory in the shell; `dependency-rules.test.ts` rejects `document.cookie`, `atob(`, JWT libraries and `Authorization` headers in `src/` |
| Identity headers | Never set (lint `no-identity-headers`); the gateway injects them |
| HTML injection | No `dangerouslySetInnerHTML` (lint `no-unsafe-html`); all text is React-escaped |
| CSP | No inline scripts or styles in the build; no `eval` / `new Function` (lint) |
| Supply chain | Image digest-pinned, Trivy (CRITICAL/HIGH/UNKNOWN on PRs), SBOM, Cosign keyless signature; the shell pins `remoteEntry.js` by SRI in its manifest |
| Fixture data | Sample names and emails only; not accounts |

## 14. Testing

Laid out like platform-reactcommon's `test/` ([test/README.md](../../test/README.md)). Vitest 5, happy-dom, Testing Library; every test runs against a fresh `createTestPlatform` runtime (`test/setup.ts`).

| Suite | Command | Covers |
|---|---|---|
| `test/unit/<area>` (`app`, `authz`, `dashboard`, `components`, `theme`, `i18n`, `sdk`) | `npm run test:unit` | One area of `src/` each; the catalog and SDK-rule checks |
| `test/integration` | `npm run test:integration` | The built `remoteEntry.js` (temp Rsbuild build of the `remote` environment) loaded through `init(shareScope)` / `get('./App')` and rendered with the shell's React and SDK |
| `test/e2e` | `npm run test:e2e` | User flows through the whole `App` |
| Image smoke | CI `smoke` job (`.github/scripts/smoke-tests.sh`) | Size ≤ 200 MB, `/healthz`, `/`, `remoteEntry.js` starts with `var app2`, no `.map` files |

Gate: 95% statements, branches, functions and lines on `src/` (`.github/scripts/coverage-gate.mjs`); today 100% / 99.6% / 100% / 100% with 78 tests in 17 files.

## 15. Open Items

| # | Item | Owner |
|---|---|---|
| 1 | Tickets, KPI counts, notifications, delegation and users are fixtures. Replace the `useDashboardData` loader with `ApiClient` calls when the ticket, notification and membership APIs exist (IAM P-4/P-6 for members) | mfe-dashboard, with the API owners |
| 2 | Deadline filter is counted but not applied | mfe-dashboard |
| 3 | `webpack-preset` and `eslint-plugin` are `1.0.0-alpha.2`; web-shell is on `1.0.0-alpha.3`. Upgrade so the remote's SDK range becomes `^1.0.0-alpha.3` | mfe-dashboard |
| 4 | Only an English catalog | mfe-dashboard, when locales are agreed |
| 5 | `tender_admin`'s tender permissions in web-shell's map await Tender Service confirmation | web-shell, Tender Service |
| 6 | The image serves the remote from nginx; the platform's CloudFront/S3 layout (`/remotes/app2/<version>/`) is not yet wired | Platform deployment |
| 7 | No Git tag yet; the first release moves `[Unreleased]` into `## [0.1.0]` | maintainers |
