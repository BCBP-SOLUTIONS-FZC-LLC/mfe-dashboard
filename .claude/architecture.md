# Architecture

The narrative with diagrams is [`ARCHITECTURE.md`](../ARCHITECTURE.md); exact behaviour, the contract and open items are in the [LLD](../docs/lld/mfe-dashboard-lld.md). This file is the map.

## Repository Layout

```
mfe-dashboard/
├── src/                           the constitution's layers (ADR 0001; .dependency-cruiser.cjs, layers.test.ts)
│   ├── app/                       composition root: App.tsx (./App, DependenciesProvider), routes/ (routes, basename),
│   │                              bootstrap/ (main, remote), layouts/AppShellLayout, providers/dependencies.ts (use cases),
│   │                              configuration/ (i18n.ts, locales/en.json), styles/index.css
│   ├── presentation/              pages/, widgets/dashboard/, components/, features/ (useCases.*.execute via useApi;
│   │                              useLoadable: failed + retry + SDK warn),
│   │                              theme/ (show a theme, CSS), dependencies.tsx (injected contracts)
│   ├── application/               use-cases/ (*UseCase classes with execute()), ports/telemetry.ts
│   ├── domain/                    entities/, value-objects/ (CalendarDay), rules/, repositories/ (contracts)
│   ├── infrastructure/            fixtures/ (Fixture*Repository), configuration/standalone (runtime.json), storage/,
│   │                              telemetry/metrics, auth/signIn
│   └── shared/                    constants/app.ts (APP_ID), hooks/ (useDismiss, useFocusTrap, useNow), ui/themes.ts,
│                                  types/appShellContext.ts, assets/images
├── test/
│   ├── setup.ts                   fresh createTestPlatform per test
│   ├── fixtures/                  platform.ts (startPlatform, permission sets), dependencies.tsx (inject repositories), remote-build.ts
│   ├── unit/<area>/               architecture, domain, application, app, authz, dashboard, components, theme, i18n, metrics, sdk, docs
│   ├── integration/               remote-entry: built container via init(shareScope) / get('./App')
│   ├── e2e/                       app flows (happy-dom)
│   └── browser/                   Playwright journeys + axe WCAG 2.1 AA (playwright.config.ts)
├── README.md, ARCHITECTURE.md      overview and integration; layers, diagrams, failure domains, threat model
├── VERSIONING.md, CONTRIBUTING.md runtime contract and releases; extending each layer, PR checklist
├── CHANGELOG.md                   per-PR changes, known gaps
├── docs/
│   ├── lld/mfe-dashboard-lld.md
│   ├── architecture/              constitution-assessment.md; mermaid/ 8 diagram sources (embedded in ARCHITECTURE.md)
│   ├── observability/metrics.md   metric inventory, proposed alerts and SLOs
│   ├── adr/                       architecture decision records 0001–0009
│   ├── pipeline/                  CI and release map
│   └── runbook-*.md
├── public/                        standalone only: favicons, config/runtime.json (default SDK runtime config)
├── nginx/default.conf, Dockerfile
├── rsbuild.config.ts              environments: remote (pluginPlatform dashboard) and standalone
├── config/remote-manifest-entry.mjs  post-build: dist/remote-manifest-entry.json (remoteEntry.js sha384)
├── config/runtime.local.json      the dev server's /config/runtime.json (environment local, signInUrl http://localhost:5001/)
├── vitest.config.ts               happy-dom; test/{unit,integration,e2e}; coverage on src/
├── playwright.config.ts           Chromium against rsbuild preview (test/browser)
├── .dependency-cruiser.cjs        architecture lint (npm run arch-lint)
├── eslint.config.js               @bcbp-solutions-fzc-llc/eslint-plugin + React hooks (as web-shell)
└── .github/                       ci.yml, validate-test.yml, validate-quality.yml, changelog-check.yml, release.yml,
                                   scripts/ (coverage gate, smoke, release: verify-*, prepare-release-asset,
                                   export-image-provenance, tag-signed-image, extract-release-notes,
                                   create-github-release)
```

## Layers

`app` (composition root) → `presentation` → `application` → `domain`; `infrastructure` implements the domain's repository contracts and the application's telemetry port; `shared` depends on nothing of ours. Any layer except `domain` and `application` may use the SDK's public subpaths; `presentation` never uses its storage, metrics or config directly. Nothing in `src/` imports from `test/`.

## The SDK Map

| Concern | SDK | File |
|---|---|---|
| User, sign-out | `useCurrentUser`, `useSignOut` | `app/App.tsx` |
| Basename, route template | `slugFromPath` (`/auth`), `tryGetConfig` (`/config`), `useRouteTemplate` | `app/routes/DashboardRoutes.tsx` |
| Access | `useHasPermission`, `useReadOnly`, `useStepUp` | `presentation/pages/DashboardPage.tsx`, `presentation/features/members/useMemberAccess.ts` |
| Data, errors, logs | `useApi`, `isProblemError`, `problemMessage`, `getLogger` | `presentation/features/*`, `presentation/pages/DashboardPage.tsx` |
| Render errors | `MFEErrorBoundary` (page, `resetKeys` = path; standalone also around `App`) | `app/layouts/AppShellLayout.tsx`, `app/bootstrap/main.tsx` |
| Text, dates, numbers | `registerNamespace`, `useT`, `useLocale`, `formatDate`, `formatNumber` | `app/configuration/i18n.ts`, components |
| Storage | `storage('dashboard')` | `infrastructure/storage/themePreference.ts` |
| Runtime config, identity | `loadRuntimeConfig`, `initializeCore`, `setRuntimeConfig`, `tryGetConfig` | `infrastructure/configuration/standalone.ts`, `infrastructure/auth/signIn.ts` |
| Metrics | `getServiceMeter` | `infrastructure/telemetry/metrics.ts` |
| Tests | `createTestPlatform` | `test/fixtures/platform.ts` |

Next SDK APIs to reach for: `useApiClient` / `createApiClient` (for `infrastructure/api/*ApiRepository`), `useFeatureFlag`, `Can`.

## Build

One `rsbuild build`, two environments into `dist/`:

| Environment | Output | SDK |
|---|---|---|
| `remote` | `remoteEntry.js` (`var __platform_mfe_dashboard`), chunks beside it, CSS in `assets/async/` | shell's (`import: false`) |
| `standalone` | `index.html`, `assets/` | bundled; anonymous defaults with no shell |

The remote consumes `react`, `react/jsx-runtime` (`^19.0.0`) and the SDK's `auth`, `config`, `i18n`, `logging`, `metrics`, `problem`, `react`, `storage` (`^1.0.0-alpha.6`, the preset's SDK version); `core` only in the standalone build. `react-router-dom` is not shared.

## Access

| UI | Needs |
|---|---|
| All Tenders In Flight | `read:tender` |
| User management (link, page) | `read:members` or `manage:members` |
| Invite, Edit, Actions column | `manage:members` and not `useReadOnly()` |
| Approval step-up banner | `useStepUp().needed` on `awaiting-approval` |
