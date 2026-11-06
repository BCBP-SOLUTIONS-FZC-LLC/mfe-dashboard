# mfe-dashboard

Ticket and user-management remote for the BCBP shell. Module Federation name **`dashboard`**. The shell (`web-shell`, built on the platform SDK) loads `remoteEntry.js` and mounts `./App` inside its `RemoteBoundary`. This repo does not sign users in.

`package.json` is private. Consume the GHCR image or the release tarball. Do not `npm install` this package. Versioning rules are in [VERSIONING.md](VERSIONING.md).

## Status

| | |
|---|---|
| Release | [`v0.3.0`](https://github.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard/releases/tag/v0.3.0) (2026-11-05): image `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard:0.3.0`, signed, with SBOM and provenance. Remote named `dashboard` (was `app2` up to `v0.2.0`), platform packages alpha.5: needs web-shell #35 or later. See [CHANGELOG.md](CHANGELOG.md) |
| Deploy | Not deployed yet. Ships with web-shell's first release (on alpha.6 since web-shell #44, loading `dashboard` since web-shell #35), which is waiting on web-shell's own blockers ([LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items) item 12). At deploy, dev manifests switch the key `app2` → `dashboard` (item 15); then each environment's standalone `runtime.json` can set `auth.signInUrl` (item 14) |
| Platform SDK | `@bcbp-solutions-fzc-llc/frontend-sdk` `1.0.0-alpha.6` (same as web-shell, since web-shell #44); `webpack-preset` and `eslint-plugin` `1.0.0-alpha.6`. Released from `v0.2.0` |
| Data | Fixtures (`src/infrastructure/fixtures/`, `UserManagementPage`); no backend calls yet |
| Tests | 29 files, 158 Vitest tests (unit incl. architecture, domain and use cases; integration; e2e), coverage 99.1% statements, 97.8% branches, 100% functions, 99.4% lines; plus 7 Playwright journeys and WCAG 2.1 AA checks (`test/browser`) |
| Open items | [LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items) |

Design detail: the [LLD](docs/lld/mfe-dashboard-lld.md) (contract, SDK usage, flows, failure handling) and [ARCHITECTURE.md](ARCHITECTURE.md) (diagrams, decisions). Claude Code guidance: [.claude/CLAUDE.md](.claude/CLAUDE.md).

## Mental model

| Piece | Role |
|---|---|
| `src/app/App.tsx` | Exposed module, and the standalone page's root. User and sign-out from the SDK (`useCurrentUser`, `useSignOut`). Renders relative routes when a router already exists, otherwise its own `BrowserRouter` under the shell's workspace prefix (`workspaceBasename`: `workspacePathPrefix` + `slugFromPath`) |
| `src/app/configuration/i18n.ts`, `src/locales/` | The `dashboard` message namespace (`registerNamespace`, `useT`). Every UI string is in `src/app/configuration/locales/en.json`; mock data (tickets, users), brand names and theme names are not |
| `src/app/layouts/AppShellLayout.tsx` | Sidebar, search, theme, user menu, logout |
| `src/presentation/pages/DashboardPage.tsx` | Ticket views, filters, KPI cards, the approval step-up banner (`useStepUp`). "All Tenders In Flight" needs `read:tender` |
| `src/presentation/features/tickets/useDashboardData.ts` | Tickets through the SDK's `useApi` (fixture loader: 700 ms load, 400 ms refresh, aborted when superseded) |
| `src/presentation/pages/UserManagementPage.tsx` | Mock user table filtered by the shell search box |
| `src/presentation/features/members/useMemberAccess.ts` | `canView` (`read:members` or `manage:members`) and `canManage` (`manage:members`, not read-only) |
| `src/presentation/theme/` | Aura light/dark and daisyUI themes, stored with the SDK's `storage('dashboard')` |
| `nginx/default.conf` | Static host for the production image |

Inside the shell, `./App` takes the user and sign-out from the SDK, so the shell needs to pass nothing. Props, when passed, override the SDK:

| Prop | Meaning |
|---|---|
| `userLabel` | Display name or email. Initials are derived from it. Default: the SDK user's email, then name, then `User` |
| `onLogout` | Called from the sidebar and the user menu. Default: the SDK's global sign-out; if the shell provides none, the browser goes to the runtime config's `auth.signInUrl` (else `/`) |

`@bcbp-solutions-fzc-llc/frontend-sdk` is a peer dependency (`^1.0.0-alpha.6`) and a dev dependency pinned to web-shell's version (`1.0.0-alpha.6`) for types and tests. In the remote build it is never bundled (`import: false`): the shell provides it. The standalone page bundles it, and with no shell every SDK API answers with its anonymous defaults (design doc §C2): no user, `denyAll` (so "All Tenders In Flight" is hidden), the default locale, and `storage()` writes nothing, so the theme resets on reload. The standalone page is its own host page: before rendering, `src/infrastructure/configuration/standalone.ts` loads `/config/runtime.json` through the SDK, sets the page identity (`mfe-dashboard`, `portal`, the file's `environment`), so logout can use that environment's `auth.signInUrl`.

Use the SDK for anything it covers (storage, dates and numbers, messages, permissions, data loading, navigation) instead of writing it here. `npm run lint` runs the platform's ESLint rules, which reject raw `localStorage`/`sessionStorage`, unsanitised HTML and SDK deep imports.

## Routes

| How it is opened | Paths |
|---|---|
| Inside web-shell | Its own router under the shell's prefix: `/t/<slug>/dashboard` and `/t/<slug>/dashboard/user-management` |
| Inside a host that shares `react-router-dom` (a router is already mounted) | index → dashboard, `user-management` → user table, relative to the host's route |
| Alone (`npm run dev` or the image) | `/` and any unknown path redirect to `/dashboard`. `/dashboard/user-management` is the user table |

User management follows IAM's rules (iam-org-membership LLD §10.4): anyone with `read:members` (every active member) or `manage:members` sees the page and its sidebar link; only `manage:members` (`tenant_admin`, `tenant_owner`) gets Invite and Edit, and not in a read-only tenant (SDK `useReadOnly`) (`src/presentation/features/members/useMemberAccess.ts`). Without either, the link is hidden and the route goes back to the dashboard. The role → permission map is web-shell's (`src/platform/permissions.ts`). Standalone the SDK grants nothing, so the page is hidden there.

One `rsbuild` run makes two builds into `dist/` (`rsbuild.config.ts` environments): **remote** (`remoteEntry.js` and its chunks, SDK from the shell) and **standalone** (`index.html` and `assets/`, SDK bundled). Dev server: `http://localhost:5002` (`strictPort`) serves both. The image listens on **8080**.

## Federation

Built with Rsbuild 2 (Rspack) and the platform SDK's plugin, `pluginPlatform({ role: 'remote', name: 'dashboard', exposes: { './App': './src/App.tsx' } })` from `@bcbp-solutions-fzc-llc/webpack-preset/rsbuild` (`1.0.0-alpha.4`, GitHub Packages), in `rsbuild.config.ts`:

- container `dashboard`, defined as the global `var __platform_mfe_dashboard` by `remoteEntry.js`. The shell's SDK (`loadRemote`) injects that script and reads `window.__platform_mfe_dashboard`. Chunks load relative to `remoteEntry.js`.
- Module Federation v1 (Rspack's webpack-compatible protocol). Do not set Rsbuild's `moduleFederation` option; the plugin refuses it.
- shared strict singletons from the preset. The remote consumes `react` and `react/jsx-runtime` (`^19.0.0`) and the SDK subpaths it imports (`auth`, `config`, `i18n`, `logging`, `metrics`, `problem`, `react`, `storage`; `^1.0.0-alpha.6`, `import: false`: never bundled, no fallback, always the shell's). The shell provides them; web-shell does not need to list anything for this remote. `test/integration/remote-entry.test.tsx` loads the built container exactly this way.
- `react-router-dom` is **not** shared. The remote runs its own `BrowserRouter`, with the basename the shell computes: `workspacePathPrefix` + `slugFromPath(location)` (`/t/<slug>` inside the shell, empty standalone).
- `splitChunks: { preset: 'none', chunks: 'async' }`. Rsbuild's default vendor groups split the entries too, and a `remoteEntry.js` that needs other chunks starts asynchronously: `window.__platform_mfe_dashboard` is then a Promise and the SDK refuses it.
- The dev server runs without Rsbuild's live-reload client for the same reason (it would be injected into `remoteEntry.js`). Reload the shell by hand after a change.

Every build writes this remote's entry to `dist/remote-manifest-entry.json` (served at `/remote-manifest-entry.json`, attached to each GitHub Release) with the sha384 integrity of the exact `remoteEntry.js` built; copy it into the environment's manifest with an absolute `entry`. The shell registers the remote in its `/remotes/manifest.json` (`"dashboard": { "entry": ".../remoteEntry.js", "version": ..., "ownerDomain": "portal", "integrity": "sha384-..." }`). `integrity` is required outside local, dev and test.

## nginx

| Path | Behaviour |
|---|---|
| `GET /healthz` | `200` and body `ok` |
| `GET /` | SPA document (`id="app"`) |
| `GET /remoteEntry.js` | `Cache-Control: no-cache`, `Access-Control-Allow-Origin: *` |
| `/<name>.<16-hex hash>.js`, `.css` (chunks next to the entry) | immutable, 1 year, CORS |
| `/assets/*` | immutable, 1 year, CORS |
| `/config/runtime.json` | the environment's runtime config, `no-cache`; `404` when absent |
| a missing file with a static extension, `/api`, `/otel`, `/csp-report`, `/config`, `/remotes`, dotfiles | `404` (the platform SPA rule, `spa-rewrite.js`) |
| any other path (an app route) | `index.html` |

## Repository layout

`src/` follows the Frontend Architecture Constitution's layers ([ADR 0001](docs/adr/0001-layered-structure.md), enforced by `npm run arch-lint` and `test/unit/architecture/layers.test.ts`):

```
src/app/                         composition root: App.tsx (./App), routes/, bootstrap/ (main, remote), layouts/,
                                 providers/dependencies.ts (use cases), configuration/ (i18n, locales/en.json), styles/
src/presentation/                pages/, widgets/dashboard/, components/, features/ (hooks running use cases), theme/
src/application/                 use-cases/ (*UseCase classes with execute()), ports/
src/domain/                      entities/, value-objects/ (CalendarDay), rules/, repositories/ (contracts)
src/infrastructure/              fixtures/ (Fixture*Repository), configuration/ (runtime.json), storage/, telemetry/, auth/
src/shared/                      constants/, hooks/, ui/, types/, assets/
rsbuild.config.ts                Rsbuild + platform plugin (remote dashboard, standalone)
config/runtime.local.json        the dev server's /config/runtime.json (environment local, sign-in http://localhost:5001)
nginx/default.conf
Dockerfile
.github/                         CI, release, coverage gate
test/                            unit/<area>, integration, e2e, browser (Playwright, axe), fixtures (test/README.md)
playwright.config.ts             Chromium against `rsbuild preview` of the production build
docs/lld/                        low-level design
docs/adr/                        architecture decision records
docs/architecture/               constitution assessment; mermaid/ diagram sources embedded in ARCHITECTURE.md
docs/                            pipeline map, observability, runbooks
.claude/                         Claude Code guidance, settings and hooks
```

## Local setup

Node **26** (`.nvmrc`; CI and the image use it). `engines` allows `>=22`, the minimum the platform packages need. From this directory:

```bash
npm ci
npm run dev
```

Open `http://localhost:5002`. You land on `/dashboard`. Logout without an `onLogout` prop navigates to `http://localhost:5001`, the `auth.signInUrl` of the dev server's `config/runtime.local.json`.

The shell, when you want them together, is a separate repo and expects this dev server on port 5002.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Rsbuild dev server on port 5002 (CORS open for the shell) |
| `npm run build` | `tsc` (TypeScript 7), then both builds into a clean `dist/` |
| `npm run lint` | ESLint with `@bcbp-solutions-fzc-llc/eslint-plugin` and React hooks rules (as web-shell). typescript-eslint needs the TypeScript 6 API, so `typescript` is the `@typescript/typescript6` alias and `tsc` comes from `@typescript/native` (TypeScript 7), as the TypeScript 7 release notes recommend |
| `npm run arch-lint` | dependency-cruiser with `.dependency-cruiser.cjs`: layer directions (an allow-list), no packages in `domain/` or `application/`, no SDK storage, metrics or config in `presentation/`, no cycles. CI runs it in Validate / Quality |
| `npm test` | Vitest once: unit, integration and e2e (`npm run test:unit`, `test:integration`, `test:e2e` run one suite) |
| `npm run test:coverage` | Vitest with the v8 report |
| `npm run test:ci` | Coverage plus the 95% gate and the domain-layer >90% gate (`.github/scripts/coverage-gate.mjs`) |
| `npm run test:browser` | Builds, then Playwright (Chromium) journeys and axe-core WCAG 2.1 AA on the standalone page (`test/browser`; first run: `npx playwright install chromium`) |
| `npm run hooks:install` | Copy `.githooks/pre-commit` into `.git/hooks` |
| `npm run preview` | Preview the production build on port 5002 (the standalone page and `remoteEntry.js`) |

## Tests

Vitest 5, happy-dom, Testing Library, laid out like platform-reactcommon's `test/`. See [test/README.md](test/README.md).

| Directory | What it exercises |
|---|---|
| `test/unit` | One area per folder: `app`, `authz`, `dashboard`, `components`, `theme`, `i18n` (including the catalog against the source), `sdk` (rules that the SDK is used, not reimplemented), `docs` (ARCHITECTURE.md diagrams equal their sources) |
| `test/integration` | The built `remoteEntry.js` loaded the way web-shell loads it: `init(shareScope)`, `get('./App')`, rendered with the shell's React and SDK |
| `test/e2e` | Dashboard filters, search, refresh, user menu, logout, standalone redirect |

The gate requires **95%** statements, branches, functions, and lines on `src/**/*.{ts,tsx}`. Thresholds are not in the Vitest config. `COVERAGE_THRESHOLD` overrides the gate locally. CI does not set it.

## Environment

| Variable | When | Default |
|---|---|---|
| `auth.signInUrl` in `/config/runtime.json` | Run time, per environment. Standalone logout target (else `/`). Mount the environment's file over the image's default (`/usr/share/nginx/html/config/runtime.json`; the default, `public/config/runtime.json`, is web-shell's and has no `signInUrl`). The SDK validates the file strictly (unknown keys are rejected). Deploy check: [runbook](docs/runbook-release.md#standalone-runtime-config-authsigninurl) | none |
| `environment` in `/config/runtime.json` | Run time, per environment (SDK alpha.6). The standalone page's identity environment (`local`, `dev`, `test`, `staging`, `prod`), so one build serves every environment. `http` origins in the runtime config are accepted only for `local`, `dev` and `test` | none: `prod` in a build, `local` on the dev server |

Nothing environment-specific is compiled in (ADR [0006](docs/adr/0006-runtime-configuration-only.md)): one image serves every environment, and `runtime.json` is public.

## Image

```bash
docker build -t mfe-dashboard:dev .
docker run --rm -p 18080:8080 mfe-dashboard:dev
```

`GET http://127.0.0.1:18080/healthz` returns `ok`. Map host port **18080** when something else already uses 8080.

Bases are digest-pinned in the Dockerfile (`node:26-bookworm`, `nginxinc/nginx-unprivileged:1.31-alpine`, with `apk upgrade`). `npm ci` reads the GitHub Packages token from the BuildKit secret `npm_token` (`docker build --secret id=npm_token,env=NODE_AUTH_TOKEN .`). Source maps are deleted from the image. The process runs as uid **101**.

Published name: `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`. A Git tag `v0.3.0` becomes the image tags `0.3.0`, `0.3`, `0` and `latest` (no `v`). Each GitHub Release carries the `dist` tarball, `remote-manifest-entry.json` (web-shell's manifest entry with the `remoteEntry.js` integrity), `checksums.txt`, the SBOM and the SLSA provenance; the image is Cosign-signed. See [VERSIONING.md](VERSIONING.md) and [LLD §12.5](docs/lld/mfe-dashboard-lld.md#125-release).

## CI

Push and pull request to `main` or `master`, plus `workflow_dispatch`. Markdown-only changes skip `ci.yml`. Job order and the release tag flow are in [docs/pipeline/README.md](docs/pipeline/README.md). Runbooks: [coverage](docs/runbook-coverage-gate.md), [image scan](docs/runbook-image-scan.md), [release](docs/runbook-release.md).

## Out of scope

Sign-in, token storage, and loading other remotes belong to web-shell. This repo does not deploy a cluster and has no Helm chart.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md). Security reports: [.github/SECURITY.md](.github/SECURITY.md).

## Related docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [LLD](docs/lld/mfe-dashboard-lld.md)
- [test/README.md](test/README.md)
- [.claude/CLAUDE.md](.claude/CLAUDE.md)
- [CHANGELOG.md](CHANGELOG.md)
- [docs/README.md](docs/README.md)
