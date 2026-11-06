# Changelog

All notable changes to this remote are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as [VERSIONING.md](VERSIONING.md) applies it to the runtime contract: the container, `./App`, shared modules, routes, permissions, `runtime.json`, image paths, metrics.

**How releases map to this file:**
- **Sections:** each Git tag `vX.Y.Z` has a dated `## [X.Y.Z] - YYYY-MM-DD` section. `release.yml` refuses a tag without one and uses its text as the GitHub Release notes.
- **Versions:** `package.json` `version` matches the latest section.
- **What needs a line:** a pull request that changes `src/`, dependencies, the `Dockerfile`, `nginx/`, `rsbuild.config.ts` or `index.html` adds a line under `[Unreleased]` (`changelog-check.yml`).
- **Released sections are not edited.** They are what each release shipped. A later fix appears in a later section, with a *(Previously: …)* note when it reverses something.

**Conventions:**
- **Entries:** each starts with a **bold lead**, says what changed and why, and names the files, tests or ADRs involved.
- **Grouping in `[Unreleased]`:** entries are grouped into themed, dated subsections (`### Changed (YYYY-MM-DD — topic, #PR)`), newest first.
- **At cut time:** the subsections merge into `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and `Security`.
- **End of `[Unreleased]`:** *Known gaps* and *Current architecture notes* describe the state of `main`.

## [Unreleased]

`main` is on platform packages `1.0.0-alpha.6` and needs web-shell #44 or later. It is not released or deployed yet; it ships with web-shell's first release ([LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items)). The runtime contract is unchanged since `v0.3.0` except for the platform-package range, so the next release is a MINOR (`v0.4.0`).

### Changed (2026-11-06 — documentation in the structure of iam-org-membership's, #35–#39)

- **`ARCHITECTURE.md` rewritten** (#35): 252 → 907 lines, with the sections of iam-org-membership's document, adapted to a remote.
  - **Structure:**
    - layer model and module dependency graph, taken from dependency-cruiser's view of the code (mirroring `.dependency-cruiser.cjs`);
    - mount flow and routing;
    - data flow (hook → `useApi` → use case → repository) and the composition root;
    - domain model;
    - data freshness and caching;
    - access control and concurrency;
    - observability;
    - failure domains (FAIL-1..4) with a degradation matrix;
    - key invariants, each with where it is enforced;
    - deployment and testing strategy;
    - a host conformance checklist and the contract lifecycle;
    - a STRIDE threat model;
    - developer tools, decisions and documentation assets.
  - **Diagrams:** `docs/architecture/mermaid/` gains `module-dependencies`, `mount-flow`, `domain-model`, `observability` and `documentation` (8 diagrams in all), and `layer-model` and `ticket-load` are redrawn for the current code. `test/unit/docs/diagrams.test.ts` keeps each fence equal to its source, and all eight were rendered with mermaid 11 in Chromium before merging; that caught a `;` inside a sequence-diagram note, which ends the statement.
  - *(Previously: 252 lines, three diagrams. After #32 it still placed `ticketsForView` and `kpiCounts` in the fixtures, and named `./src/App.tsx` as the exposed module. A comment in `rsbuild.config.ts` pointed at `src/app/bootstrap/standalone.ts`, where `src/infrastructure/configuration/standalone.ts` is meant.)*
- **`README.md` rewritten** (#36): 190 → 625 lines.
  - **Sections:**
    - mental model (owns / does not own) and why the remote exists;
    - UI overview: routes, the five views, user-management capabilities;
    - errors and input;
    - architecture: annotated tree, dependency rules, runtime and storage, shared libraries;
    - **integrating with web-shell** in eight steps: the manifest entry and `remotes.allowedOrigins`, mounting, permissions, config, telemetry, CSP, upgrades;
    - local development, including running inside a local web-shell, checked against web-shell's `config/remotes.local.json`;
    - troubleshooting;
    - canonical tests and configuration;
    - security, observability, deployment, CI and Docker;
    - cross-service dependencies, with their posture on failure.
  - *(Previously: the README named preset `alpha.4`, a `src/locales/` folder and 158 tests, and its `docker build` lacked the `npm_token` secret that `npm ci` needs.)*
- **`VERSIONING.md` rewritten** (#37): 238 lines.
  - **The runtime contract** now lists:
    - the container and its global;
    - `./App` props;
    - the eight shared SDK subpaths;
    - routes, permissions and `runtime.json` keys;
    - image paths, release assets, metric names and storage keys.
  - **New sections:** retired names (`app2`, `PUBLIC_APP1_URL`, `VITE_APP1_URL`); **platform-package coupling** (an upgrade is never a PATCH); image and bundle verification; pin styles; **deploy and roll back via the manifest entry**; the release process as `release.yml` runs it; pre-release tags; a compatibility matrix.
  - **A finding it records:** `package.json` `version` is not checked against the tag.
  - *(Previously: removing `PUBLIC_APP1_URL` was listed as a future MAJOR, though #32 had already removed it, and only five shared SDK subpaths were listed.)*
- **`CONTRIBUTING.md` rewritten and the PR template updated** (#38): 68 → 369 lines.
  - **How to extend the remote, layer by layer:** a domain rule, a use case, a data source, a page or route, UI text, an access check, a metric, configuration, a platform-package upgrade.
  - **Testing:** the testing requirements, seven canonical tests, and the coverage gate.
  - **Rules:** linting, guardrails, a documentation checklist.
  - **Process:** branch names, the PR checklist, commit style and deployment.
  - **`.github/pull_request_template.md`** now asks for arch-lint, the browser suite when the UI changes, platform packages equal to web-shell's, and SDK storage.
  - *(Previously: CONTRIBUTING and the template both told contributors to add `PUBLIC_*` build variables, which ADR 0006 forbids, and the template still listed the `bcbp.*` `localStorage` keys that #14 replaced with SDK storage.)*
- **This changelog** (#39 and this change):
  - **Intro:** a policy introduction.
  - **`[Unreleased]`:** regrouped into dated, themed subsections with PR numbers, each entry traced with `git log -S`.
  - **New sections:** *Removed* and *Security*, plus *Known gaps* and *Current architecture notes* for `main`.
  - **Detail:** entries now give file paths, test names and *(Previously: …)* notes.
  - **Released sections** are unchanged, because the GitHub Release notes come from them.

### Added (2026-11-06 — architecture lint, #33)

- **Architecture lint:** run with `npm run arch-lint`; the CI step `Architecture lint` runs it in `validate-quality.yml`, right after Lint. The tool is dependency-cruiser `18.7.0`, pinned exactly; newer releases were under two weeks old.
  - **`.dependency-cruiser.cjs`** (136 lines) is written like iam-org-membership's `.go-arch-lint.yml`:
    - a commented component per layer;
    - a `MAY_DEPEND_ON` table, compiled into dependency-cruiser's `allowed` list (an allow-list: any import it does not list fails);
    - `VENDOR_ALLOWED` (`app`, `presentation`, `infrastructure`, `shared`), the equivalent of `anyVendorDeps`, so `domain` and `application` can import no package at all.
  - **Named forbidden rules:**
    - `presentation-no-sdk-data-access`: no SDK `storage`, `metrics` or `config` in presentation;
    - `no-telemetry-libraries`: OpenTelemetry, prom-client, web-vitals;
    - `no-server-state-libraries`: TanStack Query, SWR, axios, ky (ADR 0002);
    - `no-circular`;
    - `src-not-to-test`;
    - `no-unresolvable`.
  - **Proof:** five violations were injected and then reverted: `domain` → `react`, `application` → the SDK, `presentation` → SDK storage, `presentation` → infrastructure, `shared` → `domain`. Each was reported, with exit code 1.
  - **Two traps fixed while writing it:**
    - `includeOnly: '^src/'` dropped every package import from the graph, so `domain` → `react` passed;
    - an unanchored `dist/` exclude also dropped the SDK, which resolves to `node_modules/…/frontend-sdk/dist/`.

    The config now anchors `exclude` to the repository root.
  - **Overlap with the test:** `test/unit/architecture/layers.test.ts` stays, for what an import graph cannot see: the set of top-level folders, and browser globals in `domain/` and `application/`. ADR 0001 has a table of what each check enforces, and CLAUDE.md says a new layer rule goes into both.

### Fixed (2026-11-06 — tender filter, failed-load states, sample dates, #33)

- **Tender filter matched inside words.** "IT" listed "IT Infrastructure Modernization" and also "Hospital Campus Redevelopment" (hosp-*it*-al).
  - **Fix:** `titleHasKeyword(title, keyword)` (`src/domain/rules/filters.ts`) matches whole words, case-insensitively. Word characters are Unicode letters and digits (`\p{L}`, `\p{N}`), so "Écoles" and "C++" match too. A blank keyword matches everything.
  - **Test:** `test/unit/domain/filters.test.ts`, "matches the tender keyword as whole words, not inside a word".
  - *(Previously: `tenderTitle.toLowerCase().includes(tender.toLowerCase())`.)*
- **Failed loads besides the ticket list were silent.** `useDashboardSummary`, `useMembers` and `useDashboardInfo` returned only `useApi(...).data`, so an API error disappeared:
  - the KPI cards stayed at "—";
  - the role, department and tender lists held only "All";
  - the right panel never appeared;
  - the member table stayed blank, with no message and no retry.

  **Fix:**
  - **`useLoadable(what, load, deps)`** (`src/presentation/features/useLoadable.ts`) wraps `useApi`, returns `{ data, failed, retry }`, and logs `<what> failed to load` as a `warn` through `getLogger({ mfe: 'dashboard' })`. All three hooks use it.
  - **`DashboardPage`** shows a `role="alert"` under the title, "Ticket counts, filter options and the SLA overview could not be loaded.", with Retry.
  - **`UserManagementPage`** shows the row "Users could not be loaded." with Retry.
  - **The chrome's notification count** shows nothing when its load fails; the failure is logged.

  **New catalog keys:** `dashboard.summaryFailed`, `users.loading`, `users.loadFailed`.

  **Tests:** `test/unit/dashboard/summary-and-members-errors.test.tsx`:
  - "shows an alert with Retry, logs it, and recovers";
  - "shows a loading row and marks the table busy until the members arrive";
  - "shows a failure with Retry, then the members".
- **The member table had no loading state.** While the members loaded, the table body was simply empty. It now shows "Loading users…" and `aria-busy="true"` on the table. The empty-state text appears only once the members have arrived.
- **Sample due days were fixed October 2026 dates.** From November, the "This week" filter showed nothing, and tickets marked on track were weeks past due.
  - **Fix:** `FixtureTicketRepository` stores `dueInDays` offsets and builds due days from the local today (`sampleTicketsAt(now)`), consistent with each SLA state:

    | SLA state | Due |
    |---|---|
    | breached | −2 or −5 days |
    | warning | +1 or +2 days |
    | on track | +5, +7 or +9 days |

  - **Delegation:** `FixtureDashboardInfoRepository` gives a delegation period from two days before today to two days after.
  - **Tests:** "sample tickets > are due relative to today, consistent with their SLA state" (`filters.test.ts`). The delegation-panel test pins the system date (`vi.useFakeTimers({ toFake: ['Date'] })`).

### Changed (2026-11-06 — Frontend Architecture Constitution, #32)

- **`src/` is in the constitution's six layers** (ADR 0001). Behaviour and the `./App` contract are unchanged. 133 files changed, most of them moves:

  | Layer | Contents |
  |---|---|
  | `app/` | The composition root: `App.tsx`, `bootstrap/main.tsx` and `remote.ts`, `routes/DashboardRoutes.tsx`, `layouts/AppShellLayout.tsx`, `providers/dependencies.ts`, `configuration/` (`i18n.ts`, `locales/en.json`), `styles/` |
  | `presentation/` | `pages/`, `widgets/dashboard/` (`TicketRow`, `DashboardRightPanel`), `components/`, `features/`, `theme/`, `dependencies.tsx` |
  | `application/` | `use-cases/`, `ports/telemetry.ts` |
  | `domain/` | `entities/`, `value-objects/CalendarDay.ts`, `rules/` (`views`, `filters`, `sla`, `members`), `repositories/` |
  | `infrastructure/` | `fixtures/`, `configuration/standalone.ts`, `storage/themePreference.ts`, `telemetry/metrics.ts`, `auth/signIn.ts` |
  | `shared/` | `constants/app.ts`, `hooks/` (`useDismiss`, `useFocusTrap`, `useNow`), `ui/themes.ts`, `types/appShellContext.ts`, `assets/images/` |

  The assessment, the violations found and the roadmap are in `docs/architecture/constitution-assessment.md`; the decisions are ADRs 0001–0009.
- **Use cases are classes with `execute(query)`:** `LoadTicketQueueUseCase`, `LoadDashboardSummaryUseCase`, `GetDashboardInfoUseCase`, `ListMembersUseCase`.
  - Each takes its repositories in the constructor, with explicit fields: `erasableSyntaxOnly` forbids parameter properties.
  - Each passes the `AbortSignal` through.
  - `createDependencies(overrides)` builds them; `App` creates them once (`useState` initialiser) unless an outer `DependenciesProvider` supplies them.
  - Pages call `useDependencies().useCases.<name>.execute(...)`.
- **Business rules moved into `domain/rules`**, out of `src/mocks/dashboardTickets.ts` and `useDashboardData`: `ticketsInView`, `countByView`, `hasPartialFailure`, `applyFilters`, `matchesDeadline`, `departmentsOf`, `searchTickets`, `slaOverview`, `searchMembers`.
- **Data goes through repository contracts** (`TicketRepository.list` / `filterReference`, `DashboardInfoRepository.get`, `MemberRepository.list`; all asynchronous and cancellable), implemented by `Fixture*Repository` and wired in `app/providers/dependencies.ts`.
  - KPI counts, filter options, the right panel, the notification count and the member list now load asynchronously, as they will from an API.
  - *(Previously: `DashboardPage` and `UserManagementPage` imported sample data directly, and `useDashboardData` held the view and filter rules.)*
- **Telemetry is a port.** `DashboardTelemetry` (`ticketLoadFinished`, `stepUpRequested`) is implemented by `metricsTelemetry` and injected. *(Previously: pages imported `src/metrics.ts`.)*
- **Server and UI state.** Server state stays on the SDK's `useApi` (ADR 0002), not TanStack Query, and UI state stays in React state (ADR 0003), not Zustand. Both are approved deviations from the constitution.
- **Build once, deploy everywhere** (ADR 0006).
  - **Logout:** without a shell, logout goes to the runtime config's `auth.signInUrl` (`src/infrastructure/auth/signIn.ts`), else `/`.
  - **Dev server:** serves `config/runtime.local.json` at `/config/runtime.json`. Its `signInUrl` is `http://localhost:5001/`, the local web-shell.
  - **Removed variables:** see *Removed* below.

### Added (2026-11-06 — browser tests, WCAG 2.1 AA, layer and domain tests, #32)

- **Playwright journeys and WCAG 2.1 AA checks** (ADR 0009): `test/browser/dashboard.spec.ts` and `test/browser/axe.ts`, run with `npm run test:browser`.
  - **Setup:** `playwright.config.ts` runs Chromium against `rsbuild preview` of the production build of the standalone page. Playwright is `1.64.1`.
  - **CI:** the job `Browser (Playwright, axe)`, which `Push image → GHCR` waits for; it uploads `playwright-report-<sha>`.
  - **Journeys:**
    - "switches views and shows each queue";
    - "filters, clears, and searches the ticket list";
    - "reloads a nested route: its assets load (root-absolute) and an unknown path returns to the dashboard";
    - "logs out to the runtime config's sign-in page".
  - **axe-core** (WCAG 2.0 and 2.1, A and AA): "the dashboard has no violations", "the open filter drawer has no violations", "the dark theme has no violations".
  - **Why:** happy-dom has no layout or colour, and this suite found the 1280px layout bug and 11 contrast failures (see *Fixed*).
- **`CalendarDay`** (`src/domain/value-objects/CalendarDay.ts`): an immutable `YYYY-MM-DD` day.
  - `parse` rejects anything that is not a real day.
  - `fromLocalDate` is the viewer's local today.
  - `addDays` crosses months and years.
  - `isBefore` and `equals` compare strings.
  - The deadline filter and the sample dates use it.
- **`test/unit/architecture/layers.test.ts`.** It checks that:
  - `src/` has exactly the constitution's top-level folders;
  - each layer imports only what the layer table allows;
  - `domain/` and `application/` are framework-free: no React, router, SDK or browser API;
  - presentation never imports the SDK's storage, metrics or config (data access stays in infrastructure).
- **Domain and use-case tests:**
  - `test/unit/domain/filters.test.ts` and `views.test.ts`, which was moved from `tickets.test.ts`;
  - `test/unit/application/use-cases.test.ts`, with in-memory repositories: "loads through the repository (passing refresh and the signal), then applies the view and filters", "combines view counts, SLA, filter options and dashboard info".
- **Domain coverage gate.** `.github/scripts/coverage-gate.mjs` also holds every file in `src/domain/` above 90%, the constitution's domain target, on top of the 95% gate.
- **`test/fixtures/dependencies.tsx`:** `testDependencies(overrides)` and `withDependencies(deps, Outer?)`, so tests inject a failing, slow or never-settling repository instead of mocking modules.
- **`test/unit/app/runtime-config-files.test.ts`.** Each shipped `runtime.json` passes the SDK's `RuntimeConfigSchema`. The dev config names `local` and the local web-shell; the image's default names no environment and no sign-in page.
- **Integration: build once, deploy everywhere.** `test/integration/remote-entry.test.tsx` builds the remote with the old `PUBLIC_APP1_URL` / `VITE_APP1_URL` set, and proves that neither value reaches the bundle.

### Fixed (2026-11-06 — accessibility, layout and routing found by the browser suite, #32)

- **Ticket rows at 1280px.** Every title column collapsed to zero width, so the titles were invisible, and the client and the pills wrapped one word per line.
  - **Cause:** the row switched layouts at viewport breakpoints, but the list shares the row with the right panel, so the card was far narrower than the viewport.
  - **Fix:** `TicketRow` is an `@container`, and lays out by its own width (`@4xl:flex-row`, `@lg:grid-cols-4`).
  - *(Previously: `lg:`/`xl:` viewport breakpoints.)*
- **WCAG 2.1 AA contrast:** 11 colour pairs failed, as low as 1.15:1 in the dark theme.
  - **Brand-coloured text** uses new ink tokens in `src/presentation/theme/aura.css`: `--aura-primary-ink`, `--aura-secondary-ink`, and `--aura-*-on-soft` on a soft tint, through `text-[color:var(--aura-primary-ink)]`. `text-aura-primary` and `text-aura-secondary` remain fills and icons only.
  - **Small labels** are `text-slate-500` or darker.
  - **The KPI card text and the error text** get dark-theme overrides.
- **Notifications button.** Its accessible name was the static `header.notifications` text, without the count it showed, which fails "label in name". It is now "{count} unread notifications".
- **Unknown nested path** (`/dashboard/no/such/page`): it rendered an empty page.
  - **Fix:** `DashboardRoutes` has a catch-all `Navigate to=".." relative="route"`, which returns to the dashboard.
  - *(Previously: `<Navigate to=".">`, which resolved to the same unknown path.)*
- **The dev runtime config was rejected as a whole.** `config/runtime.local.json` had `auth.signInUrl` `http://localhost:5001`, without the trailing `/` that the SDK's normal form requires, so the SDK refused the entire file.

### Removed (2026-11-06 — build-time environment values, #31, #32)

- **`PUBLIC_APP1_URL` and its deprecated alias `VITE_APP1_URL`** (#32; deprecated in `0.1.0`, see below).
  - **Removed from:**
    - `config/app1Url.ts` and `test/unit/app/app1-url.test.ts`;
    - the Rsbuild `define`;
    - the Dockerfile `ARG`s;
    - the CI and release build args, and the release's `https://` check.
  - **Effect:** the `PUBLIC_APP1_URL` repository variable is now unused, and can be deleted.
  - *(Previously: the standalone logout target, compiled into each build, so every environment needed its own build.)*
- **`PLATFORM_ENVIRONMENT`** (#31), from `rsbuild.config.ts`, `src/env.d.ts` and the Dockerfile `ARG`. The standalone page's environment now comes from `runtime.json`.
- **`calendarDate()`** (`src/lib/dates.ts`, with `test/unit/dashboard/dates.test.ts`) and **the standalone page's `console.warn`** (#31). SDK alpha.6 covers both: `formatDate('YYYY-MM-DD')`, and warnings reaching the console while logging is off.
- **`test/unit/app/standalone-no-config-test-env.test.ts`** (#31). The case it covered, a silent `test` environment, no longer exists with alpha.6's logger.

### Changed (2026-11-06 — platform packages 1.0.0-alpha.6, #31)

- **Platform packages `1.0.0-alpha.6`:**
  - **Packages:** `@bcbp-solutions-fzc-llc/frontend-sdk`, `webpack-preset` and `eslint-plugin` are pinned exactly, with the peer at `^1.0.0-alpha.6`.
  - **Shell requirement:** a remote built on alpha.6 needs the shell's SDK `^1.0.0-alpha.6`, and web-shell moved first (web-shell #44). The preset's `SdkVersionPlugin` fails a build whose packages differ. Release and deploy the two together.
- **The two SDK-audit workarounds are gone.** The second SDK audit (#28) found two gaps in the SDK and raised them with platform-reactcommon, which shipped both in alpha.6.
  - **Calendar days** use `formatDate('YYYY-MM-DD')` in `TicketRow` and `DashboardRightPanel`, and the deadline filter compares them as day strings.
  - **The "runtime config unavailable" warning** goes through `getLogger` only.
  - **New rules in `dependency-rules.test.ts`:**
    - "logs with getLogger only, never console (the SDK writes warn and error to the console while logging is off)";
    - "formats calendar days with formatDate('YYYY-MM-DD'), never by building a Date from one", which rejects `calendarDate(` and a `Date` built from a `YYYY-MM-DD` literal.
- **The standalone page takes its environment from `/config/runtime.json`.**
  - **Start-up order:** `startStandalone()` loads the file, with a 5 s timeout. It then calls `initializeCore(standaloneIdentity(config.environment))`, then `setRuntimeConfig`, so one build serves every environment.
  - **Fallback:** without a file, or with a file that has no `environment`, it runs as `prod` in a build and `local` on the dev server (`FALLBACK_ENVIRONMENT`).

### Changed (2026-11-05 — Dependabot, #29)

- **Dependabot can resolve GitHub Packages.** `.github/dependabot.yml` declares the `npm.pkg.github.com` registry with the Dependabot secret `PACKAGES_READ_TOKEN`, and **ignores the three platform packages**: they move by hand, together with web-shell (see VERSIONING.md, platform-package coupling).
  - *(Previously: every weekly npm run failed with `private_source_authentication_failure`. npm.pkg.github.com answered 401 for the three packages, and regenerating `package-lock.json` resolves them too.)*

### Added (2026-11-05 — metrics per the Enterprise Platform Observability Standard, #28)

- **Three Tier 3 metrics**, through the SDK's `/metrics` (`getServiceMeter({ mfe: 'dashboard' })`) and exported by the shell. They are defined in `METRICS` in `src/infrastructure/telemetry/metrics.ts`, which was `src/metrics.ts` until #32:

  | Metric | Type | Labels | Recorded when |
  |---|---|---|---|
  | `portal_dashboard_ticket_loads_total` | counter | `view` (5 values), `trigger` (`initial`, `refresh`), `outcome` (`success`, `error`) | A ticket-list load finishes. A load superseded by a newer one is not counted |
  | `portal_dashboard_ticket_load_duration_seconds` | histogram | `view`, `outcome` | The same finished loads, timed |
  | `portal_dashboard_step_up_requests_total` | counter | — | The user clicks Re-authenticate on the approval banner |

  - **Labels:** every label has a closed value set, typed through `recordMetric`.
  - **What the SDK does:** it injects `domain` (`portal`, from the manifest's `ownerDomain`), `service` (`dashboard`) and `environment`, and validates every point.
  - **Tiers:** no Tier 1 or Tier 2 metric applies, and none was invented.
  - **Standalone:** there is no manifest, so nothing is recorded; a single warning is logged.
  - **`docs/observability/metrics.md`:** the inventory, proposed recording rules, alerts and SLOs, and a runbook.
  - **`test/unit/metrics/metrics.test.tsx`** checks:
    - the definitions: Tier 3 `portal_dashboard_*`, suffixes, labels, vocabularies, and acceptance by the SDK;
    - that they equal the inventory page;
    - what the code records: success, error, superseded loads, step-up.
- **`dependency-rules.test.ts` guards more SDK territory:**
  - "records metrics with frontend-sdk/metrics in src/infrastructure/telemetry/metrics.ts only, never OpenTelemetry or a Prometheus client directly";
  - "does host-page start-up only on the standalone page, with the SDK, and leaves remotes and auth to the shell": no `loadRemote`, manifest, auth, flags, or starting telemetry in `src/`.

  An audit of every SDK export against `src/` found no reimplementation. `recordMetric` no longer repeats the SDK's run-time label checks.
- **The remote now consumes the shell's SDK `/metrics`** as a shared subpath (`import: false`, like the others). A shell must provide it; web-shell already does.

### Fixed (2026-11-05 — second SDK audit, #28)

- **Silent config failure in `test`.** A missing or invalid standalone `/config/runtime.json` was silent in the `test` environment.
  - **Cause:** `standalone.ts` assumed the SDK logger writes to the console in `test`, but the SDK's rule was no identity, `local` or `dev` only.
  - **Fix:** it matched the SDK, with a `test` case (`standalone-no-config-test-env.test.ts`). That test was later removed in #31, when alpha.6 changed the logger.
- **The filter drawer** closed on Escape through its own `document` listener.
  - **Fix:** it uses `useDismiss` like the other popups. A press outside closes it too, and focus returns to the Filters button.
  - **Backdrop:** it is no longer a button, since focus never reaches it and the drawer has its own close button. The catalog key `filters.close` is gone.
- **Build-time checks** in `rsbuild.config.ts` and `config/remote-manifest-entry.mjs`:
  - `PLATFORM_ENVIRONMENT` is checked against the SDK's `ENVIRONMENTS`, where an empty value means the default;
  - the manifest entry's `ownerDomain` is checked against `DOMAINS`.
  - *(Previously: a typo reached `initializeCore` or the shell's manifest check at run time. `PLATFORM_ENVIRONMENT` itself was removed in #31.)*

### Security (2026-11-05 — cross-origin resources and the platform SPA rule, #28)

- **`Cross-Origin-Resource-Policy: cross-origin`** on `remoteEntry.js`, the hashed chunks and `/assets/` (`nginx/default.conf`), as platform-reactcommon's guidance for a remote on another origin asks. The smoke script checks it.
- **nginx follows the platform's SPA rule** (platform-reactcommon `examples/cloudfront/spa-rewrite.js`), as CloudFront will.
  - **Only real routes get the document:** paths whose last segment has no static-asset extension.
  - **Everything else is `404`:**
    - a missing file with a static extension;
    - the pass-through prefixes `/api`, `/otel`, `/csp-report`, `/config`, `/remotes`;
    - dotfiles.
  - **`/assets/`** is a `^~` prefix, so it keeps its immutable and CORS headers.
  - **`smoke-tests.sh`** checks eight cases: `200` for `/dashboard/user-management` and `/users/john.doe`; `404` for `/assets/missing.js`, `/missing.css`, `/config/missing.json`, `/remotes/missing`, `/api/v1/missing` and `/.env`.
  - *(Previously: every missing path fell back to `index.html`. A missing chunk, stylesheet or JSON file came back as an HTML page with status 200, which a browser then tried to run or parse.)*

### Known gaps

- **No backend yet.** Tickets, notifications, delegation and members are in-repo fixtures behind repository contracts. The ticket, notification and membership APIs replace them in `src/infrastructure` and `app/providers/dependencies.ts` only ([LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items) item 1).
- **Not deployed.** The remote ships with web-shell's first release (item 12). At deploy:
  - dev manifests switch the key `app2` → `dashboard` (item 15);
  - each environment's standalone `runtime.json` sets `environment` and `auth.signInUrl` (item 14).
- **Docs-only pull requests cannot satisfy the required checks.** `ci.yml` ignores Markdown-only changes (`paths-ignore: ['**.md']`), so its required checks never report, so such a pull request cannot merge without an override.
- **The `Browser (Playwright, axe)` check is not a required status check yet.** The image push waits for it, but branch protection does not.
- **`package.json` `version` is not checked against the tag.** The release takes its version from the tag (`BUILD_VERSION`); bumping `package.json` is a manual step (VERSIONING.md).
- **A failed notification count is only logged.** The chrome shows no count; there is no visible error.
- **Alerts and SLOs are proposals.** `docs/observability/metrics.md` proposes recording rules, alerts and SLOs; no environment runs them yet.
- **Dev-only advisories are outside the CI audit gate** (`npm audit --omit=dev --audit-level=high`). The image is scanned by Trivy.
- **Repository housekeeping open on 2026-11-06:**
  - delete the unused `PUBLIC_APP1_URL` repository variable;
  - create the Dependabot secret `PACKAGES_READ_TOKEN`;
  - make the Browser check required.

### Current architecture notes

- **Remote:** container `dashboard` (`var __platform_mfe_dashboard`, defined synchronously), exposing `./App` with the optional props `userLabel` and `onLogout`, mounted by web-shell at `/t/<slug>/dashboard/*`.
- **Shared from the shell** (strict singletons, never bundled): `react` and `react/jsx-runtime` `^19.0.0`, and the SDK subpaths `auth`, `config`, `i18n`, `logging`, `metrics`, `problem`, `react` and `storage` at `^1.0.0-alpha.6`. `react-router-dom` is not shared.
- **Layers:** `app`, `presentation`, `application`, `domain`, `infrastructure`, `shared`, enforced by `npm run arch-lint` and `layers.test.ts`.
  - Server state is the SDK's `useApi`; UI state is React state.
  - Configuration comes from the runtime only.
- **Image:** `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`, `linux/amd64`, nginx 1.31 unprivileged, listening on 8080, `USER 101`.
  - Bases are digest-pinned: `node:26-bookworm` and `nginxinc/nginx-unprivileged:1.31-alpine` (with `apk upgrade`).
  - Releases are pushed by digest, scanned, signed and then tagged.
- **Tests:** 30 Vitest files and 168 tests, at 99.07% statement coverage, plus 7 Playwright checks.
- **Remotes:** the shell loads this remote; this remote loads no other remotes.

## [0.3.0] - 2026-11-05

The remote is renamed `app2` → `dashboard`. This breaks the shell contract: release and deploy together with web-shell #35, which loads `dashboard`. A shell that asks for `app2` cannot load this release. Dev manifests switch their key to `dashboard`, and the hosting path becomes `/remotes/dashboard/<version>/`.

### Changed

- **Breaking for the shell: the remote is renamed `app2` → `dashboard`.** `app2` was a template leftover. Container `dashboard`, so `remoteEntry.js` defines `var __platform_mfe_dashboard` (chunk global `rspackChunk_platform_mfe_dashboard`). `remote-manifest-entry.json` has the key `dashboard`. `APP_ID` is `dashboard`, which names the SDK message namespace, `storage('dashboard')`, and the `mfe` label on logs and error boundaries. A shell that still asks for `app2` cannot load this build: web-shell switches `DASHBOARD_REMOTE`, its manifest key and any kill-switch entry in the same release (`../web-shell-rename-app2-to-dashboard.md`, frontend workspace). The theme saved under `app2` is not migrated (dev only, so nothing to keep). Hosting path: `/remotes/dashboard/<version>/`. The integration test now derives the container global from `APP_ID`, so the build name and the code name cannot drift apart.

## [0.2.0] - 2026-11-05

Platform packages `1.0.0-alpha.5`: needs web-shell on alpha.5 (web-shell #31; an alpha.4 shell refuses it). Fixes the logo inside web-shell. Once this and web-shell are deployed, each environment's standalone `runtime.json` can set `auth.signInUrl`.

### Added

- The standalone page is its own host page (SDK alpha.5): `src/standalone.ts` sets the page identity (`mfe-dashboard`, `portal`, `PLATFORM_ENVIRONMENT`, `BUILD_VERSION`) and loads `/config/runtime.json` before rendering. It renders anyway when the file is missing or invalid, with a warning. Logout without a shell goes to the config's `auth.signInUrl`, else `PUBLIC_APP1_URL`, so one release can serve every environment. The image ships web-shell's default `config/runtime.json` (no `signInUrl`) and serves it `no-cache` with no SPA fallback, and an environment mounts its own over it. The smoke script checks the file. New Dockerfile `ARG PLATFORM_ENVIRONMENT=prod`.

### Changed

- Platform packages `frontend-sdk`, `webpack-preset` and `eslint-plugin` move to `1.0.0-alpha.5` (pinned exactly, peer `^1.0.0-alpha.5`), the same as web-shell (web-shell #31). A remote built on alpha.5 needs the shell's SDK `^1.0.0-alpha.5`, so web-shell moved first.
- Release: the image is pushed by digest and gets its version tags and `latest` only after the Trivy scan, the provenance export and the Cosign signature (`.github/scripts/tag-signed-image.sh`), so a failed release no longer leaves a tag on an unscanned or unsigned image.

### Fixed

- Reloading a nested standalone route (`/dashboard/user-management`) left a blank page: the standalone HTML inherited the preset's `assetPrefix: 'auto'` and linked `assets/…` relatively, so nginx answered `/dashboard/assets/…` with `index.html`. The standalone environment now uses `assetPrefix: '/'`, and the smoke script loads a nested route's first script. The favicon link is root-absolute too.
- A missing or invalid `/config/runtime.json` in test, staging or prod left no trace (the SDK logger is silent there before logging starts); the standalone page now also writes a `console.warn`. The release runbook has a deploy check for `auth.signInUrl`.
- `smoke-tests.sh` runs locally without `GITHUB_STEP_SUMMARY` or `GITHUB_REPOSITORY`.
- The sidebar logo was broken inside web-shell (found by web-shell's contract suite, web-shell #29). `BrandLogo` used root-relative `/image/…` paths, which resolve on the shell's origin. The logos moved from `public/image/` to `src/assets/images/` and are imported, so they ship as `assets/<name>.<hash>.png` and load from the remote's public path. A source rule and an integration check stop root-relative image paths from coming back.

## [0.1.1] - 2026-11-05

The first published release. The application is the same as 0.1.0; only the release workflow changed.

### Fixed

- Release: the SLSA provenance export (`.github/scripts/export-image-provenance.sh`) asked Cosign for an attestation that does not exist. `build-push-action` stores provenance as a BuildKit attestation inside the image index, so the script now reads it with `docker buildx imagetools inspect`. The `v0.1.0` run pushed its image (`0.1.0`) and then failed before signing it, so `v0.1.0` has no GitHub Release and its image is unsigned. Use `0.1.1`.

## [0.1.0] - 2026-11-05

First release. Built on the platform packages `1.0.0-alpha.4`, so it loads only in a web-shell on alpha.4 (web-shell #23); release the two together. Built with `PUBLIC_APP1_URL=https://app.dev.bcbpsolutions.com`.

### Added

- Module Federation remote `app2` exposing `./App` (`remoteEntry.js`, global `var __platform_mfe_app2`), built with Rsbuild 2 and `@bcbp-solutions-fzc-llc/webpack-preset/rsbuild` (`pluginPlatform({ role: 'remote' })`). React, React DOM, the OTel API and the SDK are strict singletons from the shell.
- Dashboard and user-management UI. Tickets and users are in-repo fixtures (`src/mocks/dashboardTickets.ts`, `src/pages/UserManagementPage.tsx`). Views: My Tickets, Awaiting My Review, Awaiting My Approval, Delegated To Me, All Tenders In Flight. Filters cover status, role, department, deadline, and tender text. The deadline filter (overdue, this week) is applied by local calendar day, and the KPI counts are the rows each view lists.
- Host contract: optional `userLabel` and `onLogout`. Without `onLogout`, logout is the SDK's global sign-out; with no shell it navigates to `PUBLIC_APP1_URL` (default `http://localhost:5001`).
- Standalone routing on port **5002**: `/` and unknown paths redirect to `/dashboard`. Inside the shell's router the same pages are the index route and `user-management`.
- Theme (Aura light/dark plus daisyUI themes) stored as `appTheme` and `themeMode` through the SDK's `storage('app2')`, per workspace and cleared on sign-out.
- Unprivileged nginx image on port **8080** (`GET /healthz` returns `ok`, `remoteEntry.js` is not cached, hashed chunks and `/assets/` are immutable, all with CORS). Build arg `PUBLIC_APP1_URL` (`VITE_APP1_URL` is a deprecated fallback).
- CI (2026-10-27): typecheck and Rsbuild build, Vitest with a 95% coverage gate, production `npm audit`, digest-pinned bases, Hadolint, Trivy, nginx smoke, Cosign on `main`/`master`, changelog check, and a semver release of the image plus `mfe-dashboard_<tag>_dist.tar.gz`.
- Tests under `test/unit`, `test/integration` (the built remote loaded through its container) and `test/e2e`. `npm run test:ci` is the local gate.
- Pre-commit hook (`.githooks/pre-commit`, installed with `npm run hooks:install`): refuses staged `.env` files, HTML entities in workflows, CRLF in pipeline files, an unpinned `FROM`, a missing `.dockerignore`, and a failing `tsc --noEmit`.
- Operator docs: this changelog, [README.md](README.md), [VERSIONING.md](VERSIONING.md), [CONTRIBUTING.md](CONTRIBUTING.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [docs/](docs/README.md).

### Changed

- **Accessibility, error isolation and Node (`2026-11-05`).**
  - The theme picker is a menu of radio items in two labelled groups (`role="menu"`, `menuitemradio`, `aria-checked`): focus starts on the current theme, and arrows, Home, End and Escape work. `useDismiss` handles radio and checkbox menu items.
  - The view cards and view buttons expose the selected view (`aria-pressed`).
  - Loading is announced: a visually hidden `role="status"` that stays on the page reads "Loading your tickets…" while tickets load and empties after; the skeleton is `aria-hidden`.
  - A page's render error replaces only the page: `AppShellLayout` wraps the routed page in the SDK's `MFEErrorBoundary`, reset when the path changes (`resetKeys`), so the sidebar keeps working, in the shell and standalone.
  - `.nvmrc` is `26`, as CI and the image; `engines.node` is `>=22`, the platform packages' minimum. README, CONTRIBUTING, the pipeline doc and `.claude` said 22.
- **Breaking: platform packages `1.0.0-alpha.4` (`2026-11-05`), with web-shell.** `frontend-sdk` (dev and peer `^1.0.0-alpha.4`), `webpack-preset` and `eslint-plugin` are `1.0.0-alpha.4`, as in web-shell. `remoteEntry.js` now defines `var __platform_mfe_app2` (the preset's `containerName`), which only the alpha.4 SDK's `loadRemote` reads: deploy this remote and web-shell alpha.4 together. Lazily loaded CSS is pinned by sha384 like the scripts. Storage keys moved under the SDK's prefix and are not migrated, so a saved theme resets once. Global sign-out is a form POST to Keycloak, which needs web-shell's CSP `form-action` to allow the IdP origin. The smoke and integration tests check the new global and the CSS integrity.
- **Remaining production gaps fixed (`2026-11-04`).**
  - Every build writes `dist/remote-manifest-entry.json`: web-shell's manifest entry with the sha384 integrity of `remoteEntry.js`. The image serves it, releases attach it, and the smoke test compares it with the served file.
  - The deadline filter is applied (overdue / this week, by local day).
  - KPI counts come from the same rows the list shows, and the list heading counts the rows shown.
  - "Last updated" keeps counting.
  - Start and mount only show the stored theme; only a user's choice writes storage (no more ignored-write warnings on the standalone page).
  - A failed ticket load is logged through the SDK (`getLogger`, now a shared `/logging`).
  - The standalone page renders inside the SDK's `MFEErrorBoundary`.
  - The header search has an `aria-label`.
  - Layout classes are logical (RTL-ready).
  - Fonts are `@fontsource-variable/geist` and `/inter`, with web-shell's Tailwind font stack. Inside the shell, the remote's text was falling back to the system font.
  - `overrides.minimatch` `^11.0.4` clears the 11 dev-only audit findings.
- **`PUBLIC_APP1_URL` replaces `VITE_APP1_URL` (`2026-11-04`).** The build is Rsbuild, so the logout target uses Rsbuild's `PUBLIC_` prefix (`config/app1Url.ts`, `import.meta.env.PUBLIC_APP1_URL`, Dockerfile `ARG`, CI and release build args, `.env.example`). `.dockerignore` no longer lists `.mf`, `@mf-types` and `keycloak` (Vite-era paths that no longer exist).
- **Production gaps fixed (`2026-11-04`).**
  - Due dates and the delegation period are local calendar days (`src/lib/dates.ts`). They showed one day early west of UTC.
  - A ticket load that fails with an API error shows an alert with the SDK's `problemMessage` and a Retry button (`loadState: 'error'`). Other exceptions go to the shell's `RemoteBoundary`.
  - Keyboard support: the user menu has arrow, Home, End and Escape keys and returns focus to its trigger; Escape closes the theme picker. The filter drawer traps focus and returns it on close (`useDismiss`, `useFocusTrap`).
  - nginx sends `nosniff` and `Referrer-Policy` everywhere. The document gets a same-origin CSP, `X-Frame-Options: DENY`, `Permissions-Policy` and `X-Robots-Tag: noindex`. gzip is on and `server_tokens` off. The smoke script checks all of these.
  - Fonts are self-hosted (`@fontsource/geist-sans`, `@fontsource/inter`, standalone page only) instead of Google Fonts.
  - `webpack-preset` and `eslint-plugin` are now `1.0.0-alpha.3`, as in web-shell, so the remote requires `^1.0.0-alpha.3` of the shell's SDK. It now also shares `/problem`.
  - `release.yml` fails unless `VITE_APP1_URL` is an `https://` repository variable, and passes it to the tarball build too.
- **Docs aligned with the code (`2026-11-04`).** New [LLD](docs/lld/mfe-dashboard-lld.md) (runtime contract, SDK usage, domain model, flows, failure handling, open items) and `.claude/` (`CLAUDE.md`, `architecture.md`, `operations.md`, `hooks/post-edit.sh`). README (status, layout, consumed shared modules), ARCHITECTURE (SDK map, workspace basename, `useApi` ticket load, `read:tender` instead of a constant, invariants, decisions) and its three diagrams, VERSIONING (consumed singletons; `react-router-dom` is not shared; routes inside web-shell), CONTRIBUTING, the pipeline map and runbooks updated. `test/unit/docs/diagrams.test.ts` keeps ARCHITECTURE.md's fences equal to `docs/architecture/mermaid/*.mmd`.
- **Tests laid out like platform-reactcommon (`2026-11-04`).** `test/unit/<area>` (`app`, `authz`, `dashboard`, `components`, `theme`, `i18n`, `sdk`), `test/integration`, `test/e2e` and `test/fixtures`, with `npm run test:unit`, `test:integration` and `test:e2e` (`test/README.md`). New: the built `remoteEntry.js` loaded and rendered through `init(shareScope)` / `get('./App')` with the shell's singletons; dependency rules that the platform SDK is used, not reimplemented; the `en` catalog checked against the source; the user button, `defaultLogout` and the viewer's empty member list. 78 tests in 17 files, including the diagram check.
- **Platform SDK `1.0.0-alpha.3` (`2026-11-04`).** `@bcbp-solutions-fzc-llc/frontend-sdk` goes to `1.0.0-alpha.3`, the version web-shell provides (peer `^1.0.0-alpha.3`). Its `createTestPlatform` now sets the storage workspace, so `test/setup.ts` no longer mocks `frontend-sdk/storage` and the theme tests use the real `storage()`.
- **Approval MFA banner and counts through the SDK (`2026-11-04`).** The "MFA re-authentication required" banner showed on every visit to Awaiting My Approval; it now shows only when the SDK's `useStepUp()` says the login is older than the tenant's MFA window (`SessionContext.mfaFreshnessSeconds`), with a Re-authenticate button (`reauthenticate()`, which returns to the page). Counts shown outside messages (KPI cards, filter badge, notifications, SLA total, unread comments) use `formatNumber` in the page locale. The unread-notification count is one mock value (`UNREAD_NOTIFICATIONS`) instead of two literals. A read-only tenant (SDK `useReadOnly`: suspended or trial expired) sees the member list without Invite and Edit. The Language menu takes the language name from the `app2` catalog (`language.<locale>`, falling back to the locale code) instead of `Intl.DisplayNames`. Filter options live next to the data they filter (`src/mocks/dashboardTickets.ts`), and departments are derived from it: the hard-coded list had drifted and lacked MEP, Compliance and Estimating. Test fixtures are permission sets, not a copy of web-shell's role map.
- **No platform logic reimplemented here (`2026-11-03`).** Everything platform-reactcommon's SDK already provides now goes through it: the theme is kept in `storage('app2')` (namespaced per workspace, cleared on logout) instead of raw `localStorage` (keys `bcbp.appTheme`/`bcbp.themeMode` become `appTheme`/`themeMode`, so a saved theme resets once); due dates use `formatDate` in the page locale instead of a fixed `en-GB`; "Last updated" uses the SDK's ICU plurals through a new `app2` message namespace (`src/i18n.ts`, `src/locales/en.json`); the Language menu shows the SDK locale (`useLocale`) instead of a hard-coded English; "All Tenders In Flight" is gated by `useHasPermission('read', 'tender')` (every web-shell role has it) instead of a constant; `useDashboardData` loads through `useApi` (still the fixtures); the router basename is computed as web-shell does (`slugFromPath` + `workspacePathPrefix`); the user-management page registers its route template. All UI text is in the `app2` catalog (`src/locales/en.json`, `useT`), including the delegation period, now formatted with `formatDate`. User management follows IAM's rules (iam-org-membership #48, LLD §10.4): the page and sidebar link need `read:members` (any active member) or `manage:members`, and Invite and Edit need `manage:members` (`tenant_admin`, `tenant_owner`); without either the route goes back to the dashboard. Which roles get which permission is web-shell's role map. The standalone page now bundles the SDK and runs on its anonymous defaults (design doc §C2): `rsbuild.config.ts` builds two environments into `dist/`, **remote** (`remoteEntry.js`, SDK from the shell, unchanged contract) and **standalone** (`index.html`, `assets/`). `src/DashboardApp.tsx` and `src/index.ts` are gone; `src/main.tsx` is the standalone entry. `npm run lint` (ESLint with `@bcbp-solutions-fzc-llc/eslint-plugin`, as web-shell) runs in CI; `typescript` is aliased to `@typescript/typescript6` for typescript-eslint while `tsc` stays TypeScript 7 (`@typescript/native`).
- **The remote uses the platform SDK at runtime (`2026-11-03`).** `./App` (`src/App.tsx`) reads the signed-in user with `useCurrentUser()` and signs out with `useSignOut()` (global), from the `@bcbp-solutions-fzc-llc/frontend-sdk` singleton the shell provides; the shell no longer has to pass `userLabel` or `onLogout`, and props it does pass still win. If the shell provides no `signOut`, logout falls back to `VITE_APP1_URL`. The SDK-free dashboard moves to `src/DashboardApp.tsx`, which the standalone entry renders, so `npm run dev` on port 5002 still runs without a shell. `frontend-sdk` is a peer dependency (`^1.0.0-alpha.2`) and a dev dependency pinned to `1.0.0-alpha.2` with `@opentelemetry/api` `1.10.0`, as in web-shell; it is still never bundled. Tests use the SDK's `createTestPlatform`.
- **Breaking: built for the platform SDK shell (`2026-11-03`).** Vite, `@module-federation/vite`, `@tailwindcss/vite` and `autoprefixer` are replaced by Rsbuild 2 and `@bcbp-solutions-fzc-llc/webpack-preset` `1.0.0-alpha.2` (`rsbuild.config.ts`); Tailwind runs through `@tailwindcss/postcss`. The container is a classic-script `var app2` global with Module Federation v1, which is what web-shell's SDK `loadRemote` reads; a Vite/ES-module host can no longer load it. `react-router-dom` is no longer shared: inside web-shell the remote runs its own router under `/t/<slug>/dashboard`. `/mf-manifest.json` is gone. The standalone entry is `src/index.ts` (an async boundary before shared React). Only async chunks are split, and the dev server runs without live reload, so `remoteEntry.js` defines the container synchronously. `.npmrc` maps `@bcbp-solutions-fzc-llc` to GitHub Packages; CI and the Docker build pass `NODE_AUTH_TOKEN` (`packages: read`, BuildKit secret `npm_token`), and this repository needs Actions read access on the `webpack-preset` package. Node 22 → 26 and nginx 1.27 → 1.31-alpine (`apk upgrade`), as in web-shell. Source maps are deleted from the image and the release bundle; the smoke test checks `var app2` and that no `.map` file shipped.
- Dependencies updated to latest (`2026-11-03`): TypeScript 6.0 → 7.0 (`~7.0.2`), `@rsbuild/core` 2.3.1, `@vitejs/plugin-react` 6.2.1, Vitest and `@vitest/coverage-v8` 5.1.0, `postcss` 8.5.32, `@types/node` 26.6.6, `react-router-dom` 7.18.5. Actions: `github/codeql-action` 4.39.1, `hadolint/hadolint-action` 3.5.0, `docker/build-push-action` 7.4.0, `docker/setup-buildx-action` 4.4.1, `docker/login-action` 4.7.0, `actions/upload-artifact` 7.0.2, `actions/download-artifact` 8.0.2. Replaces Dependabot PRs #2–#10.

### Deprecated

- `VITE_APP1_URL` (build env, Dockerfile `ARG`, repository variable): still read when `PUBLIC_APP1_URL` is unset or empty, with a build warning and a release warning. Rename it to `PUBLIC_APP1_URL`; the alias goes in a major release.

### Known gaps

- Ticket and user data is mocked in the browser. There is no backend and no auth in this repo. The shell owns sign-in.
- `countActiveFilters` includes deadline. `useDashboardData` does not filter on it.
- No cluster deploy step. Publishing the image does not roll it out.
- Dev-dependency audit is outside the CI gate (`npm audit --omit=dev`).
- The production manifest entry for `app2` in web-shell needs this build's `remoteEntry.js` integrity (`sha384-…`); nothing computes or publishes it yet.
- Standalone deep links (`/dashboard/user-management` opened directly on port 5002 or the image) load the entry script relative to the path. Inside the shell they work.
- Pre-v1: the contract in [VERSIONING.md](VERSIONING.md) is descriptive until the first tag.

### Current architecture notes

- Image: `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`, `linux/amd64`, listen 8080, `USER 101`.
- Bases (digest-pinned 2026-11-03): `node:26-bookworm` and `nginxinc/nginx-unprivileged:1.31-alpine`, with `apk upgrade` at build time.
- The shell loads this remote. This remote does not load other remotes.
