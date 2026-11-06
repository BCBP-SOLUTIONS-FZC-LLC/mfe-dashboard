# Frontend Architecture Constitution: assessment and migration (mfe-dashboard)

Assessment of mfe-dashboard against the Frontend Architecture Constitution 1.0, as of 2026-11-06. It covers all seven written outputs the constitution asks for:
- §1 the assessment, and §2 the violations;
- §3 the target diagram, and §4 the folder plan;
- §5 the dependency cleanup, and §6 the roadmap;
- §7 the ADRs.

The refactor that resolves the violations is on branch `refactor/constitution-layers`. Behaviour is preserved, and the `./App` contract and the release are unchanged.

## 1. Assessment

| Constitution section | Before | After this refactor |
|---|---|---|
| Domain ownership (bounded context) | Owns the dashboard and the member list UI; no other domain's rules | Unchanged: compliant |
| Required project structure | Flat, by technical kind (`components/`, `hooks/`, `pages/`, `mocks/`, `theme/`, `types/`) | `app/`, `presentation/`, `application/`, `domain/`, `infrastructure/`, `shared/` (ADR 0001) |
| Architecture layers and dependency rules | No layers. Rules in sample data and a React hook; pages imported sample data | Enforced by `npm run arch-lint` (`.dependency-cruiser.cjs`) and `test/unit/architecture/layers.test.ts` |
| Presentation layer | Pages filtered and searched tickets, read sample data, stored the theme | Pages call use cases through feature hooks; rules are in the domain |
| Application layer | None | Use-case classes with `execute()` and a telemetry port, with no React and no browser |
| Domain layer | None (types only) | Entities, a value object (`CalendarDay`), rules and repository contracts; >90% coverage enforced |
| Infrastructure layer | Sample data mixed with rules; storage and metrics called from UI code | Fixture repositories, theme storage, telemetry adapter, sign-in navigation |
| Server state: TanStack Query | Platform SDK `useApi` | Unchanged: **approved deviation** (ADR 0002) |
| Client state: Zustand | React state | Unchanged: **approved deviation** (ADR 0003) |
| Shared cross-MFE state from the shell | From the SDK (user, workspace, permissions, read-only, step-up) | Unchanged: compliant |
| API access through repositories | No API yet; no `fetch` anywhere (SDK rule) | Repository contracts plus fixture implementations (ADR 0004) |
| Runtime configuration | `PUBLIC_APP1_URL` compiled in; the release baked the dev URL | Runtime only: `runtime.json` `auth.signInUrl` and `environment` (ADR 0006) |
| Module Federation: runtime-configurable remote | The shell's `/remotes/manifest.json` (SDK `loadRemote`, SRI) | Unchanged: compliant |
| Authentication centralised in the shell | SDK `useSignOut`, `useCurrentUser`; no MFE-local auth | Unchanged: compliant |
| Shared libraries: no domain logic shared | Platform SDK, preset, ESLint plugin only | Unchanged: compliant |
| Design system | Tailwind + daisyUI; `platform-design-system` does not exist | **Interim** (ADR 0008) |
| Observability | SDK logging, metrics (Tier 3) and error boundaries; the shell owns the provider | Unchanged: compliant through the SDK (ADR 0007) |
| Accessibility (WCAG 2.1 AA) | Keyboard, focus traps, ARIA roles, live regions, logical layout; contrast never checked | axe-core in CI (light, dark, drawer); contrast and label-in-name violations fixed (ADR 0009) |
| Security | CSP same-origin, SRI, no tokens or secrets, no unsafe HTML (lint) | Unchanged: compliant |
| Internationalization | SDK `useT`; every string in the catalog (tested) | Unchanged: compliant (ADR 0005) |
| Testing: Vitest, React Testing Library | Unit, integration, e2e (happy-dom) | Plus domain, use-case and architecture tests; domain coverage gate |
| Testing: contract tests (API schema) | None (no API) | Open: with the first API repository (§6) |
| Testing: Playwright e2e | Only in web-shell's contract suite, against this remote | `test/browser` journeys in Chromium, a CI job gating the image push (ADR 0009) |
| Deployment: S3 + CloudFront, build once | Nginx image; per-environment build value | Build once (ADR 0006); CloudFront/S3 layout still open (LLD §15 item 6) |
| Repository standards | Builds, tests and deploys independently | Unchanged: compliant (name `mfe-dashboard`, not `<domain>-ui`) |

## 2. Violations

| # | Violation | Severity | Resolution |
|---|---|---|---|
| V1 | `src/` not organised in the constitution's layers | High | Fixed: §4 mapping, ADR 0001 |
| V2 | Business rules in the presentation and data modules: view queues, SLA ordering, the deadline filter, KPI counts, SLA overview, ticket and member search | High | Fixed: `src/domain/rules/*`, tested in `test/unit/domain` |
| V3 | Presentation read sample data directly: `DashboardPage`, `DashboardRightPanel`, `AppShellLayout`, `UserManagementPage` | High | Fixed: repositories, use cases, feature hooks (ADR 0004) |
| V4 | No application layer or use cases | High | Fixed: `src/application/use-cases/*` |
| V5 | Environment-specific value compiled in (`PUBLIC_APP1_URL`), against build once, deploy everywhere | High | Fixed: runtime config only (ADR 0006) |
| V6 | Presentation stored the theme and recorded metrics itself | Medium | Fixed: `infrastructure/storage/themePreference`, the telemetry port |
| V7 | `APP_ID`, theme vocabulary and the layout–page contract lived in `app/`-level modules that presentation imported upward | Medium | Fixed: `src/shared/constants`, `shared/ui/themes`, `shared/types` |
| V8 | TanStack Query not used | Medium | Approved deviation (ADR 0002) |
| V9 | Zustand not used | Low | Approved deviation (ADR 0003) |
| V10 | No `platform-design-system` components | Low | Interim (ADR 0008); depends on the platform |
| V11 | No Playwright journeys or automated a11y checks in this repo | Medium | Fixed (ADR 0009). The browser run also found and fixed: the ticket-row layout collapsing at 1280px, 11 colour-contrast failures (light and dark), a notifications label mismatch, a blank page for unknown nested paths, and a dev `runtime.json` the SDK rejected |
| V12 | No contract tests (API schema validation) | Medium | Open: no API yet; with the first `infrastructure/api` repository (§6) |
| V13 | Use cases as functions; routes inside `App.tsx`; runtime configuration in `app/` | Low | Fixed: use-case classes with `execute()` injected by the composition root, `app/routes/`, `infrastructure/configuration/` |

## 3. Target architecture

The diagram is in [ARCHITECTURE.md](../../ARCHITECTURE.md#layer-model); its source is `docs/architecture/mermaid/layer-model.mmd`. In short:

```text
app (composition root) ──► presentation ──► application ──► domain
                     │                                        ▲
                     └──► infrastructure ── implements ───────┘
shared ◄── used by every layer; depends on nothing of ours
```

## 4. Folder restructuring (done)

| Before | After |
|---|---|
| `src/App.tsx` | `src/app/App.tsx` (exposed `./App`; wraps `DependenciesProvider`); routes → `src/app/routes/DashboardRoutes.tsx` |
| `src/main.tsx`, `src/remote.ts` | `src/app/bootstrap/` |
| `src/standalone.ts` (runtime config, page identity) | `src/infrastructure/configuration/standalone.ts` |
| `src/index.css` | `src/app/styles/index.css` |
| `src/i18n.ts`, `src/locales/en.json` | `src/app/configuration/` (`APP_ID` → `src/shared/constants/app.ts`) |
| `src/layouts/AppShellLayout.tsx` | `src/app/layouts/` |
| `src/layouts/appShellContext.ts` | `src/shared/types/` |
| `src/pages/*` | `src/presentation/pages/*` |
| `src/components/BrandLogo`, `ThemePicker`, `dashboard/DashboardIcons` | `src/presentation/components/` |
| `src/components/dashboard/TicketRow`, `DashboardRightPanel` | `src/presentation/widgets/dashboard/` |
| `src/hooks/useDashboardData`, `useMemberAccess` | `src/presentation/features/{tickets,members}/`, plus `useDashboardSummary`, `useDashboardInfo`, `useMembers` |
| `src/hooks/useDismiss`, `useFocusTrap`, `useNow` | `src/shared/hooks/` |
| `src/types/ticket.ts` | `src/domain/entities/ticket.ts`, plus `member.ts` and `dashboardInfo.ts` |
| `src/mocks/dashboardTickets.ts` (data + rules) | Data → `src/infrastructure/fixtures/tickets.ts` (`FixtureTicketRepository`); rules → `src/domain/rules/views.ts`, `filters.ts`; calendar days → `src/domain/value-objects/CalendarDay.ts` |
| `src/mocks/dashboardStats.ts` | `src/infrastructure/fixtures/dashboardInfo.ts`; counts and SLA → `src/domain/rules/` |
| `UserManagementPage`'s member list | `src/infrastructure/fixtures/members.ts`; search → `src/domain/rules/members.ts` |
| `src/theme/themeMode.ts` | Display → `src/presentation/theme/themeMode.ts`; storage → `src/infrastructure/storage/themePreference.ts` |
| `src/theme/daisyThemes.ts` | `src/shared/ui/themes.ts` |
| `src/theme/*.css` | `src/presentation/theme/` |
| `src/metrics.ts` | `src/infrastructure/telemetry/metrics.ts` (plus the `DashboardTelemetry` adapter) |
| `defaultLogout` in the layout | `src/infrastructure/auth/signIn.ts` (`goToSignIn`) |
| `src/assets/images` | `src/shared/assets/images` |
| `config/app1Url.ts` | Removed (ADR 0006) |

## 5. Dependency cleanup (done)

| From → to (before) | Now |
|---|---|
| pages, widgets, layout → `mocks/*` | → feature hooks → use cases → repository contracts; the composition root injects the fixtures |
| `useDashboardData` → `mocks` and its own filter code | → the injected `LoadTicketQueueUseCase.execute` (domain rules) through `useApi`; telemetry through the injected port |
| layout, `main` → `theme/themeMode` (storage + DOM) | `app/` → `infrastructure/storage` (store) and `presentation/theme` (show) |
| page → `metrics` | page → `useDependencies().telemetry` (port) |
| every layer → `i18n.ts` for `APP_ID` | → `shared/constants/app` |
| presentation → `layouts/appShellContext` | → `shared/types/appShellContext` |
| build → `PUBLIC_APP1_URL` | removed; `runtime.json` only |

Guards that keep it clean:
- `npm run arch-lint` (`.dependency-cruiser.cjs`, CI `Architecture lint`): the layer allow-list, packages only outside domain and application, no forbidden libraries, no cycles.
- `test/unit/architecture/layers.test.ts`: layer directions, framework-free domain and application, no SDK storage, metrics or config in presentation.
- `test/unit/sdk/dependency-rules.test.ts`: the platform SDK is used, not reimplemented.
- `.github/scripts/coverage-gate.mjs`: 95% overall, and every domain file above 90%.

## 6. Migration roadmap

| Phase | Work | Owner | Status |
|---|---|---|---|
| 1 | Layers, domain rules and value objects, use-case classes, repositories, composition root, runtime config only, guards, ADRs | mfe-dashboard | **Done** (this branch) |
| 2 | Deploy standalone `runtime.json` with `environment` and `auth.signInUrl` | platform deployment, maintainers | Next |
| 3 | `infrastructure/api/*ApiRepository` on the SDK `ApiClient` for tickets, notifications and members (IAM P-4/P-6), plus contract tests against their OpenAPI schemas (as platform-reactcommon does for PUB-1/P-35) | mfe-dashboard, API owners | When the APIs exist (LLD §15 item 1) |
| 4 | Playwright journeys in this repo (views, filters, search, nested routes, logout) | mfe-dashboard | **Done** (ADR 0009) |
| 5 | Accessibility: axe-core WCAG 2.1 AA in the Playwright run, with the contrast fixes; next, the remaining daisyUI themes from the theme picker | mfe-dashboard | **Done** for Aura light and dark; daisyUI themes next |
| 6 | Replace components with `platform-design-system` ones as they ship | mfe-dashboard, platform | When published (ADR 0008) |
| 7 | Revisit ADR 0002 (server-state cache) and 0003 (Zustand) when the APIs, or a wizard or drafts, arrive | mfe-dashboard, platform-reactcommon | On trigger |
| 8 | S3 + CloudFront under `/remotes/dashboard/<version>/` | platform deployment | LLD §15 item 6 |

## 7. Architecture decision records

[`docs/adr/`](../adr/README.md): 0001 layers, 0002 server state, 0003 client state, 0004 repositories and the composition root, 0005 localization, 0006 runtime configuration, 0007 observability, 0008 design system, 0009 browser journeys and accessibility.
