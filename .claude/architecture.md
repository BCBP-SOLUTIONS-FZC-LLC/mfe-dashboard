# Architecture

The narrative with diagrams is [`ARCHITECTURE.md`](../ARCHITECTURE.md); exact behaviour, the contract and open items are in the [LLD](../docs/lld/mfe-dashboard-lld.md). This file is the map.

## Repository Layout

```
mfe-dashboard/
├── src/
│   ├── App.tsx                    ./App: SDK user/sign-out, own BrowserRouter at workspaceBasename(), routes
│   ├── remote.ts                  remote environment's placeholder entry
│   ├── main.tsx                   standalone entry (#app)
│   ├── i18n.ts                    APP_ID 'app2', registerMessages()
│   ├── locales/en.json            every UI string
│   ├── layouts/                   AppShellLayout (chrome, search, theme, user menu, defaultLogout), outlet context
│   ├── pages/                     DashboardPage, UserManagementPage
│   ├── components/                BrandLogo, ThemePicker, dashboard/{TicketRow, DashboardRightPanel, DashboardIcons}
│   ├── hooks/                     useDashboardData (useApi), useMemberAccess
│   ├── mocks/                     dashboardTickets (rows, ticketsForView, filter options), dashboardStats
│   ├── theme/                     themeMode (storage('app2')), daisyThemes, CSS
│   └── types/ticket.ts
├── test/
│   ├── setup.ts                   fresh createTestPlatform per test
│   ├── fixtures/                  platform.ts (startPlatform, permission sets), remote-build.ts (temp Rsbuild build)
│   ├── unit/<area>/               app, authz, dashboard, components, theme, i18n, sdk, docs
│   ├── integration/               remote-entry: built container via init(shareScope) / get('./App')
│   └── e2e/                       app flows
├── docs/
│   ├── lld/mfe-dashboard-lld.md
│   ├── architecture/mermaid/      diagram sources (embedded in ARCHITECTURE.md)
│   ├── pipeline/                  CI and release map
│   └── runbook-*.md
├── nginx/default.conf, Dockerfile
├── rsbuild.config.ts              environments: remote (pluginPlatform app2) and standalone
├── config/remote-manifest-entry.mjs  post-build: dist/remote-manifest-entry.json (remoteEntry.js sha384)
├── config/app1Url.ts              PUBLIC_APP1_URL → deprecated VITE_APP1_URL → http://localhost:5001
├── vitest.config.ts               happy-dom; test/{unit,integration,e2e}; coverage on src/
├── eslint.config.js               @bcbp-solutions-fzc-llc/eslint-plugin + React hooks (as web-shell)
└── .github/                       ci.yml, validate-test.yml, validate-quality.yml, changelog-check.yml, release.yml, scripts/
```

## Layers

`App` → `AppShellLayout` → pages → components and hooks → mocks, theme, types. Any layer may import the SDK's public subpaths. Nothing imports upward; nothing in `src/` imports from `test/`.

## The SDK Map

| Concern | SDK | File |
|---|---|---|
| User, sign-out | `useCurrentUser`, `useSignOut` | `App.tsx` |
| Basename, route template | `slugFromPath` (`/auth`), `tryGetConfig` (`/config`), `useRouteTemplate` | `App.tsx` |
| Access | `useHasPermission`, `useReadOnly`, `useStepUp` | `DashboardPage.tsx`, `useMemberAccess.ts` |
| Data, errors, logs | `useApi`, `isProblemError`, `problemMessage`, `getLogger` | `useDashboardData.ts`, `DashboardPage.tsx` |
| Standalone render errors | `MFEErrorBoundary` | `main.tsx` |
| Text, dates, numbers | `registerNamespace`, `useT`, `useLocale`, `formatDate`, `formatNumber` | `i18n.ts`, components |
| Storage | `storage('app2')` | `theme/themeMode.ts` |
| Tests | `createTestPlatform` | `test/fixtures/platform.ts` |

Next SDK APIs to reach for: `useApiClient` (real APIs), `useFeatureFlag`, `Can`, `getServiceMeter`.

## Build

One `rsbuild build`, two environments into `dist/`:

| Environment | Output | SDK |
|---|---|---|
| `remote` | `remoteEntry.js` (`var app2`), chunks beside it, CSS in `assets/async/` | shell's (`import: false`) |
| `standalone` | `index.html`, `assets/` | bundled; anonymous defaults with no shell |

The remote consumes `react`, `react/jsx-runtime` (`^19.0.0`) and the SDK's `auth`, `config`, `i18n`, `logging`, `problem`, `react`, `storage` (`^1.0.0-alpha.3`, the preset's SDK version). `react-router-dom` is not shared.

## Access

| UI | Needs |
|---|---|
| All Tenders In Flight | `read:tender` |
| User management (link, page) | `read:members` or `manage:members` |
| Invite, Edit, Actions column | `manage:members` and not `useReadOnly()` |
| Approval step-up banner | `useStepUp().needed` on `awaiting-approval` |
