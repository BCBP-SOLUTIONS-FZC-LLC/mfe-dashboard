# Contributing

`mfe-dashboard` is the dashboard and user-management micro-frontend (Module Federation remote `dashboard`) of the BCBP portal. This guide covers:
- development setup;
- how to extend the remote in its layers;
- the test requirements and guardrails;
- the pull-request and release process.

It matches the workflows in `.github/workflows` and the local hook in `.githooks/pre-commit`. The rules Claude Code follows are the same ones, in [.claude/CLAUDE.md](.claude/CLAUDE.md).

## Prerequisites

- **Node 26** (`.nvmrc`; CI and the image use it). `engines` allows `>=22`, the platform packages' minimum.
- **npm** (the lockfile is `package-lock.json`).
- **GitHub CLI** (`gh`), signed in with `read:packages`. The three `@bcbp-solutions-fzc-llc` platform packages come from GitHub Packages.
- **Docker**, only to build the image and run the smoke script.
- **Chromium for Playwright**, only for the browser suite: `npx playwright install chromium`.
- **Optional:** a local web-shell checkout (`../web-shell`), to run the remote inside the shell.

## Development setup

```bash
git clone https://github.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard
cd mfe-dashboard
export NODE_AUTH_TOKEN=$(gh auth token)   # GitHub Packages; never write it to .npmrc
npm ci
npm run hooks:install                     # installs .githooks/pre-commit
npm run lint && npm run arch-lint         # verify the linters pass
npm test                                  # unit, integration (builds the remote), e2e
npm run dev                               # http://localhost:5002
```

To run only the fast suite:

```bash
npm run test:unit
```

`hooks:install` copies `.githooks/pre-commit` to `.git/hooks/pre-commit`; run it again whenever that file changes. Git for Windows runs the hook with Bash. The hook rejects:
- a staged `.env` or `docker.local.env`;
- HTML entities (`&gt;`, `&lt;`, `&amp;`) in `.github/workflows` or `.github/scripts`;
- CRLF in `.github/scripts`, the workflows, `Dockerfile`, `nginx/` or `.githooks`;
- a `FROM` line that is not `image:tag@sha256:…`, or a missing `.dockerignore`;
- a failing `npx tsc --noEmit` (TypeScript 7). This check needs `node_modules`.

The hook does not run Vitest, arch-lint, Playwright, Hadolint, Trivy or the smoke script; CI does.

**Ports:**
- **5002** (`strictPort`): the dev server and `npm run preview`;
- **5001**: the local web-shell;
- **8080**: the image (map it to 18080 when 8080 is taken).

If 5002 is taken by another process, find out what it is before stopping it.

## Project layout

`src/` follows the Frontend Architecture Constitution ([ADR 0001](docs/adr/0001-layered-structure.md)). Dependencies point inward, and `npm run arch-lint` plus `test/unit/architecture/layers.test.ts` enforce them.

```
src/
├── app/              # composition root: App.tsx (./App), bootstrap/, routes/, layouts/, providers/dependencies.ts, configuration/ (i18n), styles/
├── presentation/     # pages/, widgets/, components/, features/ (hooks running use cases), theme/, dependencies.tsx
├── application/      # use-cases/ (*UseCase classes with execute()), ports/        — no React, browser or SDK
├── domain/           # entities/, value-objects/, rules/, repositories/ (contracts) — pure TypeScript, no packages
├── infrastructure/   # fixtures/ (repository implementations), configuration/, storage/, telemetry/, auth/
└── shared/           # constants/, hooks/, ui/, types/, assets/                     — depends on nothing of ours
test/                 # unit/<area>, integration, e2e, browser, fixtures
```

| Layer | May import (ours) | Packages |
|---|---|---|
| `domain` | nothing | no |
| `application` | `domain`, `shared` | no |
| `presentation` | `application`, `domain`, `shared` | yes (not the SDK's `storage`, `metrics` or `config`) |
| `infrastructure` | `application`, `domain`, `shared` | yes |
| `shared` | nothing | yes |
| `app` | everything | yes |

The full tree, with what each file does, is in [README.md](README.md); the diagrams are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Extending the remote

### Adding a domain rule, entity or value object

1. Add the type to `src/domain/entities/` or `src/domain/value-objects/`, and the rule to `src/domain/rules/`. Use plain TypeScript only: no React, SDK, router, browser API or package of any kind.
2. **Calendar days** (`YYYY-MM-DD`) are `CalendarDay`s or day strings, never `new Date('YYYY-MM-DD')`, which is UTC and shows the previous day west of UTC.
3. **Tests:** add them in `test/unit/domain/`. Every file in `src/domain/` must stay above 90% coverage.

### Adding a use case

1. Add a class to `src/application/use-cases/`, named `<Verb><Thing>UseCase`. It takes its repositories in the constructor and has one `execute(query)` method. Write explicit fields: `erasableSyntaxOnly` forbids constructor parameter properties.
2. Take an `AbortSignal` in the query and pass it to every repository call.
3. Build it in `src/app/providers/dependencies.ts` (`createDependencies`) and add it to `UseCases` in `src/presentation/dependencies.tsx`.
4. **Tests:** add them in `test/unit/application/`, with in-memory repositories. No React.

### Adding a data source (a repository)

1. Add the contract to `src/domain/repositories/`, in domain terms. Its methods are asynchronous and take `{ signal }`.
2. Implement it in `src/infrastructure/`:
   - a fixture in `fixtures/` until the API exists;
   - then an `api/*ApiRepository` built on the SDK's `ApiClient`. Never `fetch`, axios or a token of our own.
3. Wire it in `src/app/providers/dependencies.ts` (`defaultInfrastructure`). Nothing above infrastructure changes when a fixture is replaced by an API.
4. **Tests:** inject a failing, slow or never-settling implementation with `testDependencies({ … })` from `test/fixtures/dependencies.tsx`. Do not mock modules.

### Adding a page, widget or route

1. **Where it goes:**
   - a page in `src/presentation/pages/`;
   - pieces in `widgets/` or `components/`;
   - the data hook in `features/`, built on `useApi`, or on `useLoadable` so that failures show and are logged.
2. **Data:** pages get it through `useDependencies()`, never by importing infrastructure.
3. **Routing:** add the route in `src/app/routes/DashboardRoutes.tsx`, relative to the remote's router, and name its template with `useRouteTemplate('/t/:slug/dashboard/<path>')`. A new route is a MINOR; removing or renaming one is a MAJOR ([VERSIONING.md](VERSIONING.md)).
4. **Layout:**
   - use logical classes only (`ps/pe`, `ms/me`, `start/end`, `border-s/e`, `text-start/end`), so RTL works;
   - lay out by the component's own width (container queries) when it sits beside a panel.
5. **Popups and dialogs:** use `useDismiss` and `useFocusTrap`, not document listeners.
6. **Accessibility:**
   - brand-coloured text uses the ink tokens (`text-[color:var(--aura-primary-ink)]`, `--aura-*-on-soft`), never `text-aura-primary`;
   - small labels are `text-slate-500` or darker;
   - a control's accessible name contains its visible text.
7. **Tests:**
   - unit tests in `test/unit/dashboard/` or `components/`;
   - a journey in `test/browser/` when the change affects layout or colour;
   - `npm run test:browser` must stay free of axe violations.

### Adding UI text

1. Add the key to `src/app/configuration/locales/en.json`, and read it with `useT('dashboard')`.
2. A key built at run time (``t(`sla.${state}`)``) must come from a closed set listed in `test/unit/i18n/catalog.test.ts`'s `dynamic` map.
3. The catalog test fails on a missing key and on an unused key, so remove the keys you stop using.
4. Format dates and numbers with the SDK (`formatDate`, `formatNumber`), never with `Intl` directly.

### Adding an access check

1. Ask for a **permission**, never a role name: `useHasPermission('<action>', '<resource>')`, plus `useReadOnly()` for writes.
2. Roles live in IAM; the role → permission map is web-shell's (`src/platform/permissions.ts`). A new permission needs that map changed: write the request as a `.md` file for the web-shell team.
3. Remember that checks here are UI hints; IAM authorises the request.
4. **Tests:** add them in `test/unit/authz/`.

### Adding a metric

1. Define it in `METRICS` in `src/infrastructure/telemetry/metrics.ts`, and nowhere else:
   - Tier 3, `portal_dashboard_*`;
   - counters end in `_total`, histograms in `_seconds`;
   - every label has a closed value set;
   - never `platform_*` or `portal_*` without registry approval.
2. Record it through a method on the `DashboardTelemetry` port (`src/application/ports/telemetry.ts`). Presentation calls the injected port, not the metrics module.
3. **Docs and tests:** add the row to `docs/observability/metrics.md` in the same PR; `test/unit/metrics` fails when the inventory and the code differ.

### Adding configuration

- **Per-environment values** come from the SDK runtime config (`/config/runtime.json`). Its schema is the SDK's and is strict, so a new key is a request to platform-reactcommon, not a local change.
- **Never** fetch a config of our own, and never compile in an environment-specific value: no `PUBLIC_*` or `VITE_*` URLs (ADR [0006](docs/adr/0006-runtime-configuration-only.md)). `BUILD_VERSION` is the only build-time value.
- **The dev server** serves `config/runtime.local.json`. `test/unit/app/runtime-config-files.test.ts` validates the shipped files against the SDK's `RuntimeConfigSchema`. URLs must be in normal form, for example `signInUrl` ending in `/`.

### Upgrading the platform packages

1. Upgrade only together with web-shell, to the same version:
   ```bash
   npm install --save-exact @bcbp-solutions-fzc-llc/frontend-sdk@<v> @bcbp-solutions-fzc-llc/webpack-preset@<v> @bcbp-solutions-fzc-llc/eslint-plugin@<v>
   ```
2. Set the peer dependency to `^<v>`.
3. Run `npm test`, `npm run lint` and `npm run build`. `dependency-rules.test.ts` checks the peer range, and the preset's `SdkVersionPlugin` fails a mismatched build.
4. Add a CHANGELOG line and update the compatibility matrix in [VERSIONING.md](VERSIONING.md).

When the SDK lacks something, do not build it here. Write it up as a `.md` file for the platform-reactcommon team and share it with them.

## Testing requirements

| Layer | Location | Needs | Notes |
|---|---|---|---|
| Unit | `test/unit/<area>/` | — | One area per folder: `architecture`, `domain`, `application`, `app`, `authz`, `dashboard`, `components`, `theme`, `i18n`, `metrics`, `sdk`, `docs` |
| Integration | `test/integration/` | — (builds the remote in a child process) | Loads the built `remoteEntry.js` like web-shell: `init(shareScope)`, `get('./App')` |
| E2E | `test/e2e/` | — | Whole-app flows in happy-dom, embedded and standalone |
| Browser | `test/browser/` | Chromium (`npx playwright install chromium`) | Playwright journeys on the production build; axe-core WCAG 2.1 AA |
| Smoke | `.github/scripts/smoke-tests.sh` | Docker (image only) | CI-only image gate: size ≤ 200 MB, `/healthz`, container global, no source maps, nested routes, SPA rule, runtime config, manifest integrity, headers |

How to write tests here:
- **Platform:** start a fresh SDK test platform with `startPlatform()` and render with `platform.Wrapper` (`test/fixtures/platform.ts`).
- **Dependencies:** inject them with `withDependencies()` / `testDependencies()` (`test/fixtures/dependencies.tsx`). **Do not mock SDK or `src` modules.**
- **Timers:** the fixture repositories wait 700 ms (400 ms on refresh). Use `vi.useFakeTimers()` with `advanceTimersByTimeAsync`. When only `Date` must be fixed, use `vi.useFakeTimers({ toFake: ['Date'] })`.
- **Stable inputs:** pass a stable `filters` object into `renderHook`. A new object on every render starts a new load.
- **Sample dates:** the sample due dates are relative to today, so pin the system time whenever a test asserts a specific date.

### Canonical tests (do not break)

These hold the remote's contract and its security and accessibility posture. Changing what they assert needs a design conversation:

- **`test/integration/remote-entry.test.tsx`:** the container contract.
  - The container is defined synchronously.
  - The SDK is not bundled.
  - Only modules the shell provides are consumed.
  - Lazy stylesheets are pinned by sha384.
  - Images load from the remote's own path.
  - `./App` renders through the container with the shell's singletons, and fails without the SDK.
  - No environment value is compiled in.
- **`test/unit/architecture/layers.test.ts`** (with `npm run arch-lint`): the layer directions; framework-free domain and application.
- **`test/unit/sdk/dependency-rules.test.ts`:** the SDK is used, not reimplemented. It also checks:
  - the peer range;
  - no role names;
  - no `console`;
  - no `Date` built from a calendar day;
  - metrics only in `infrastructure/telemetry`, and start-up only in `infrastructure/configuration`.
- **`test/unit/i18n/catalog.test.ts`:** every key exists and every key is used.
- **`test/unit/metrics`:** the observability standard and the inventory page.
- **`test/unit/docs/diagrams.test.ts`:** each ARCHITECTURE.md fence equals its `.mmd` source.
- **`test/browser`:** WCAG 2.1 AA on the dashboard, the open filter drawer and the dark theme.

Run a single test:

```bash
npx vitest run test/unit/authz/permissions.test.tsx -t "read-only"
npx vitest run test/unit/domain/filters.test.ts
npx playwright test -g "dark theme"
```

### Coverage gate

`npm run test:ci` runs Vitest with v8 coverage, then `.github/scripts/coverage-gate.mjs`:
- **95%** on statements, branches, functions and lines, over `src/**/*.{ts,tsx}`;
- above **90%** on every file in `src/domain/` (the constitution's domain target).

The thresholds live in the script, not in the Vitest config. `COVERAGE_THRESHOLD` overrides the gate locally; CI does not set it, and the gate is not lowered. Runbook: [docs/runbook-coverage-gate.md](docs/runbook-coverage-gate.md).

```bash
npm run test:coverage   # HTML and text report in coverage/
```

Aim the tests at what matters, not at trivial lines: domain rules, use cases, load and failure states, access checks, the container contract.

## Linting

```bash
npm run lint        # ESLint: @bcbp-solutions-fzc-llc/eslint-plugin + React hooks
npm run arch-lint   # dependency-cruiser: .dependency-cruiser.cjs
npx tsc --noEmit    # TypeScript 7 (also the first step of npm run build)
```

**ESLint:** the platform plugin rejects:
- raw `localStorage` / `sessionStorage`;
- SDK deep and root imports;
- unsafe HTML;
- identity headers;
- `eval`.

typescript-eslint needs the TypeScript 6 API, so `typescript` is the `@typescript/typescript6` alias, and `tsc` is `@typescript/native` (TypeScript 7).

**arch-lint:**
- **Allow-list:** the layer table is an allow-list, so an import the table does not list fails.
- **Other rules:** it also rejects cycles, telemetry and server-state libraries, `src/` → `test/`, and unresolvable imports.
- **Changing `.dependency-cruiser.cjs`:** inject a violation, check that it is reported, then restore the file.

## Guardrails and forbidden patterns

- **Do not commit `.env`, `docker.local.env` or a token.** Both files are in `.gitignore`, and the hook rejects them. Pass `NODE_AUTH_TOKEN` per command; never write it to `.npmrc` or a log.
- **Never reimplement the SDK.** That covers the user, sign-out, permissions, read-only state, step-up, data loading (`useApi`), messages (`useT`), dates and numbers, storage (`storage('dashboard')`), workspace paths (`slugFromPath`) and route templates. Import its public subpaths only.
- **Never bundle the SDK into the remote.** It is a peer dependency and a dev dependency pinned to web-shell's version; never a runtime dependency. Keep `import: false`.
- **Keep the container contract:**
  - the name `dashboard` and the expose `./App`, with optional props;
  - `splitChunks` on async chunks only;
  - the dev server without HMR or live reload;
  - the standalone environment's `assetPrefix: '/'`;
  - never set Rsbuild's `moduleFederation` option.
- **No server-state or global-state library** (TanStack Query, SWR, Zustand, Redux) without a new ADR (ADRs 0002, 0003).
- **No raw browser storage, tokens, cookies, identity headers or unsafe HTML.**
- **No third-party origins** in the standalone page. Its CSP is same-origin only, and fonts are self-hosted (`@fontsource-variable/geist`, `/inter`, the same as web-shell's).
- **Import images and fonts** (`import logo from '…/logo.png'`), never root-relative (`/image/…`, `url(/…)`). Inside web-shell, a root-relative path resolves on the shell's origin.
- **Keep fonts and `tailwind.config.js` identical to web-shell's.**
- **Sibling repositories are read-only from here** (web-shell, platform-reactcommon, IAM). Write cross-team requests as `.md` files.

## Documentation update checklist

| What changed | Documents to update |
|---|---|
| `src/`, dependencies, `Dockerfile`, `nginx/`, `rsbuild.config.ts`, `index.html` | A line under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md) (`changelog-check.yml` fails the PR otherwise) |
| A route, a prop, a permission, a `runtime.json` key, the container | [README.md](README.md) (UI overview, Integrating with web-shell) and [VERSIONING.md](VERSIONING.md) (runtime contract) |
| A flow, a failure mode, an SDK API in use, an open item | [docs/lld/mfe-dashboard-lld.md](docs/lld/mfe-dashboard-lld.md) |
| A layer, a module, a diagram, a decision | [ARCHITECTURE.md](ARCHITECTURE.md) and the matching `docs/architecture/mermaid/*.mmd`, edited together (`diagrams.test.ts`); an ADR for a significant decision |
| A metric | [docs/observability/metrics.md](docs/observability/metrics.md) (`test/unit/metrics`) |
| A CI or release job | [docs/pipeline/README.md](docs/pipeline/README.md) and the matching runbook |
| A test folder or fixture | [test/README.md](test/README.md) |
| Commands, versions, rules, layout | [.claude/](.claude/CLAUDE.md) (`CLAUDE.md`, `architecture.md`, `operations.md`) |

Write docs in plain, direct English. Prefer tables to prose, and make every claim checkable against the code.

## Branch naming

- `feat/<short-topic>`: a new capability
- `fix/<short-topic>`: a bug fix
- `docs/<short-topic>`: documentation only
- `chore/<short-topic>`: dependencies, tooling, CI, refactors with no behavioural change
- `test/<short-topic>`: tests only

Base new branches on the latest `main`. A platform-package upgrade is coordinated with web-shell (see [Upgrading the platform packages](#upgrading-the-platform-packages)).

## Pull request checklist

The template in `.github/pull_request_template.md` carries this list.

- [ ] `npm run lint`, `npm run arch-lint` and `npm run test:ci` pass (95% gate, domain > 90%)
- [ ] `npm run build` passes (type check and both environments)
- [ ] `npm run test:browser` passes when the UI, theme or layout changed (no axe violations)
- [ ] New behaviour is tested in the right layer, with injected dependencies, not mocked modules
- [ ] Every new UI string is a catalog key; unused keys are removed
- [ ] Access is by permission, never by role name
- [ ] The container contract still holds: `dashboard`, `./App` with optional props, platform packages equal to web-shell's
- [ ] Nothing environment-specific is compiled in; no secret is in `runtime.json` or the repository
- [ ] `CHANGELOG.md` `[Unreleased]` has a line (when `src/`, dependencies, Dockerfile, nginx, `rsbuild.config.ts` or `index.html` changed)
- [ ] The documentation checklist above is reviewed

`main` requires an approving code-owner review ([.github/CODEOWNERS](.github/CODEOWNERS)) and these checks:
- `Build image (cache)`, `Trivy CVE scan`, `Smoke tests`;
- `Validate / Quality / quality`, `Validate / Test / test`;
- `PR summary`.

Pull requests are squash-merged.

## Commit style

Keep commit messages short and say *why*. Reference the ADR, the LLD section or the invariant when it clarifies the change:

```
Show failed summary and member loads instead of empty sections

A failed summary left the KPI counts at "—" and no right panel with no reason
given. useLoadable keeps the failure for the UI and logs it through the SDK.
(LLD §11, ARCHITECTURE FAIL-1.)
```

Use a short imperative subject line (72 characters at most):

```
Fix the tender filter matching inside words
Add the Architecture lint step (dependency-cruiser)
Platform packages 1.0.0-alpha.6: drop the two SDK-audit workarounds
Docs: ARCHITECTURE.md in the structure of iam-org-membership's
```

## Deployment

**On a pull request**, `ci.yml` runs:
1. `Validate / Test`: `npm run test:ci` and the coverage gates, then the type check and build;
2. `Validate / Quality`: lint, arch-lint, workflow hygiene, digest-pinned base images, `npm audit` on production dependencies;
3. `Browser (Playwright, axe)`;
4. `Build image (cache)`, with Hadolint;
5. `Trivy CVE scan` and `Smoke tests`, in parallel;
6. `PR summary`.

Markdown-only changes skip `ci.yml`.

**On a push to `main`:** the same gates. Then `Push image → GHCR` pushes the image tagged `main` and `sha-<short>`, signed keylessly with Cosign. That image is not a release.

**On a `v*` tag:** `release.yml` runs:
1. validate;
2. build the tarball and the manifest entry;
3. push the image by digest;
4. scan it with Trivy;
5. export the SBOM and provenance;
6. sign it with Cosign;
7. tag it `X.Y.Z`, `X.Y`, `X` and `latest` (the `v` is dropped);
8. create the GitHub Release.

There is no deploy job. An environment deploys by publishing the release's manifest entry to web-shell, which needs a web-shell on the same platform packages. Process: [VERSIONING.md](VERSIONING.md); a failed release: [docs/runbook-release.md](docs/runbook-release.md).

Tell the web-shell owners, and whoever runs each environment, before a release that changes:
- the manifest key;
- the platform packages;
- a permission;
- a `runtime.json` key.
