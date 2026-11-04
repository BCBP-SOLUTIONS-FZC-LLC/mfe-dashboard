# mfe-dashboard

Ticket and user-management remote for the BCBP shell. Module Federation name **`app2`**. The shell (`web-shell`, built on the platform SDK) loads `remoteEntry.js` and mounts `./App` inside its `RemoteBoundary`. This repo does not sign users in.

`package.json` is private. Consume the GHCR image or the release tarball. Do not `npm install` this package. Versioning rules are in [VERSIONING.md](VERSIONING.md).

## Mental model

| Piece | Role |
|---|---|
| `src/App.tsx` | Exposed module, and the standalone page's root. User and sign-out from the SDK (`useCurrentUser`, `useSignOut`). Renders relative routes when a router already exists, otherwise its own `BrowserRouter` under the shell's workspace prefix (`slugFromPath`) |
| `src/i18n.ts`, `src/locales/` | The `app2` message namespace (`registerNamespace`, `useT`). Every UI string is in `src/locales/en.json`; mock data (tickets, users), brand names and theme names are not |
| `src/layouts/AppShellLayout.tsx` | Sidebar, search, theme, user menu, logout |
| `src/pages/DashboardPage.tsx` | Ticket views, filters, KPI cards. Data comes from `useDashboardData` after a short timeout |
| `src/pages/UserManagementPage.tsx` | Mock user table filtered by the shell search box |
| `src/theme/` | Aura light/dark and daisyUI themes, stored with the SDK's `storage('app2')` |
| `nginx/default.conf` | Static host for the production image |

Inside the shell, `./App` takes the user and sign-out from the SDK, so the shell needs to pass nothing. Props, when passed, override the SDK:

| Prop | Meaning |
|---|---|
| `userLabel` | Display name or email. Initials are derived from it. Default: the SDK user's email, then name, then `User` |
| `onLogout` | Called from the sidebar and the user menu. Default: the SDK's global sign-out; if the shell provides none, the browser goes to `VITE_APP1_URL` |

`@bcbp-solutions-fzc-llc/frontend-sdk` is a peer dependency (`^1.0.0-alpha.3`) and a dev dependency pinned to web-shell's version (`1.0.0-alpha.3`) for types and tests. In the remote build it is never bundled (`import: false`): the shell provides it. The standalone page bundles it, and with no shell every SDK API answers with its anonymous defaults (design doc §C2): no user, `denyAll` (so "All Tenders In Flight" is hidden), the default locale, and `storage()` writes nothing, so the theme resets on reload.

Use the SDK for anything it covers (storage, dates and numbers, messages, permissions, data loading, navigation) instead of writing it here. `npm run lint` runs the platform's ESLint rules, which reject raw `localStorage`/`sessionStorage`, unsanitised HTML and SDK deep imports.

## Routes

| How it is opened | Paths |
|---|---|
| Inside web-shell | Its own router under the shell's prefix: `/t/<slug>/dashboard` and `/t/<slug>/dashboard/user-management` |
| Inside a host that shares `react-router-dom` (a router is already mounted) | index → dashboard, `user-management` → user table, relative to the host's route |
| Alone (`npm run dev` or the image) | `/` and any unknown path redirect to `/dashboard`. `/dashboard/user-management` is the user table |

User management follows IAM's rules (iam-org-membership LLD §10.4): anyone with `read:members` (every active member) or `manage:members` sees the page and its sidebar link; only `manage:members` (`tenant_admin`, `tenant_owner`) gets Invite and Edit, and not in a read-only tenant (SDK `useReadOnly`) (`src/hooks/useMemberAccess.ts`). Without either, the link is hidden and the route goes back to the dashboard. The role → permission map is web-shell's (`src/platform/permissions.ts`). Standalone the SDK grants nothing, so the page is hidden there.

One `rsbuild` run makes two builds into `dist/` (`rsbuild.config.ts` environments): **remote** (`remoteEntry.js` and its chunks, SDK from the shell) and **standalone** (`index.html` and `assets/`, SDK bundled). Dev server: `http://localhost:5002` (`strictPort`) serves both. The image listens on **8080**.

## Federation

Built with Rsbuild 2 (Rspack) and the platform SDK's plugin, `pluginPlatform({ role: 'remote', name: 'app2', exposes: { './App': './src/App.tsx' } })` from `@bcbp-solutions-fzc-llc/webpack-preset/rsbuild` (`1.0.0-alpha.2`, GitHub Packages), in `rsbuild.config.ts`:

- container `app2`, defined as the global `var app2` by `remoteEntry.js`. The shell's SDK (`loadRemote`) injects that script and reads `window.app2`. Chunks load relative to `remoteEntry.js`.
- Module Federation v1 (Rspack's webpack-compatible protocol). Do not set Rsbuild's `moduleFederation` option; the plugin refuses it.
- shared strict singletons from the preset: `react`, `react-dom` (`^19.0.0`), `@opentelemetry/api` (`~1.10.0`) and every SDK subpath (`import: false`: never bundled, always the shell's). The shell provides them; web-shell does not need to list anything for this remote.
- `react-router-dom` is **not** shared. The remote runs its own `BrowserRouter`, with the basename the shell computes: `workspacePathPrefix` + `slugFromPath(location)` (`/t/<slug>` inside the shell, empty standalone).
- `splitChunks: { preset: 'none', chunks: 'async' }`. Rsbuild's default vendor groups split the entries too, and a `remoteEntry.js` that needs other chunks starts asynchronously: `window.app2` is then a Promise and the SDK refuses it.
- The dev server runs without Rsbuild's live-reload client for the same reason (it would be injected into `remoteEntry.js`). Reload the shell by hand after a change.

The shell registers the remote in its `/remotes/manifest.json` (`"app2": { "entry": ".../remoteEntry.js", "version": ..., "ownerDomain": "portal", "integrity": "sha384-..." }`). `integrity` is required outside local, dev and test.

## nginx

| Path | Behaviour |
|---|---|
| `GET /healthz` | `200` and body `ok` |
| `GET /` | SPA document (`id="app"`) |
| `GET /remoteEntry.js` | `Cache-Control: no-cache`, `Access-Control-Allow-Origin: *` |
| `/<name>.<16-hex hash>.js`, `.css` (chunks next to the entry) | immutable, 1 year, CORS |
| `/assets/*` | immutable, 1 year, CORS |
| anything else | `try_files` back to `index.html` |

## Repository layout

```
src/App.tsx                      exposed remote and standalone root (platform SDK)
src/remote.ts                    remote build's placeholder entry (the shell loads remoteEntry.js)
src/main.tsx                     standalone entry (#app)
src/i18n.ts, src/locales/        app2 messages
src/layouts/                     shell chrome and outlet context
src/pages/                       dashboard and user management
src/hooks/useDashboardData.ts    mock load (700 ms) and refresh (400 ms)
src/mocks/                       ticket fixtures
src/theme/                       theme, in SDK storage
rsbuild.config.ts                Rsbuild + platform plugin (remote app2)
nginx/default.conf
Dockerfile
.github/                         CI, release, coverage gate
test/                            Vitest unit, integration and e2e (test/README.md)
docs/                            pipeline map and runbooks
```

## Local setup

Node **22**. From this directory:

```bash
npm ci
npm run dev
```

Open `http://localhost:5002`. You land on `/dashboard`. Logout without an `onLogout` prop navigates to `http://localhost:5001` unless you set `VITE_APP1_URL`.

The shell, when you want them together, is a separate repo and expects this dev server on port 5002.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Rsbuild dev server on port 5002 (CORS open for the shell) |
| `npm run build` | `tsc` (TypeScript 7), then both builds into a clean `dist/` |
| `npm run lint` | ESLint with `@bcbp-solutions-fzc-llc/eslint-plugin` and React hooks rules (as web-shell). typescript-eslint needs the TypeScript 6 API, so `typescript` is the `@typescript/typescript6` alias and `tsc` comes from `@typescript/native` (TypeScript 7), as the TypeScript 7 release notes recommend |
| `npm test` | Vitest once: unit, integration and e2e (`npm run test:unit`, `test:integration`, `test:e2e` run one suite) |
| `npm run test:coverage` | Vitest with the v8 report |
| `npm run test:ci` | Coverage plus the 95% gate (`.github/scripts/coverage-gate.mjs`) |
| `npm run hooks:install` | Copy `.githooks/pre-commit` into `.git/hooks` |
| `npm run preview` | Preview the production build on port 5002 (the standalone page and `remoteEntry.js`) |

## Tests

Vitest 5, happy-dom, Testing Library, laid out like platform-reactcommon's `test/`. See [test/README.md](test/README.md).

| Directory | What it exercises |
|---|---|
| `test/unit` | One area per folder: `app`, `authz`, `dashboard`, `components`, `theme`, `i18n` (including the catalog against the source), `sdk` (rules that the SDK is used, not reimplemented) |
| `test/integration` | The built `remoteEntry.js` loaded the way web-shell loads it: `init(shareScope)`, `get('./App')`, rendered with the shell's React and SDK |
| `test/e2e` | Dashboard filters, search, refresh, user menu, logout, standalone redirect |

The gate requires **95%** statements, branches, functions, and lines on `src/**/*.{ts,tsx}`. Thresholds are not in the Vitest config. `COVERAGE_THRESHOLD` overrides the gate locally. CI does not set it.

## Environment

| Variable | When | Default |
|---|---|---|
| `VITE_APP1_URL` | Build time. Logout target when `onLogout` is omitted. Dockerfile `ARG` | `http://localhost:5001` |

Set the GitHub Actions variable of the same name for any image that should return to a real shell. The value is compiled into the bundle and is public.

## Image

```bash
docker build -t mfe-dashboard:dev .
docker run --rm -p 18080:8080 mfe-dashboard:dev
```

`GET http://127.0.0.1:18080/healthz` returns `ok`. Map host port **18080** when something else already uses 8080.

Bases are digest-pinned in the Dockerfile (`node:26-bookworm`, `nginxinc/nginx-unprivileged:1.31-alpine`, with `apk upgrade`). `npm ci` reads the GitHub Packages token from the BuildKit secret `npm_token` (`docker build --secret id=npm_token,env=NODE_AUTH_TOKEN .`). Source maps are deleted from the image. The process runs as uid **101**.

Published name: `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`. A Git tag `v0.1.0` becomes the image tag `0.1.0` (no `v`). See [VERSIONING.md](VERSIONING.md).

## CI

Push and pull request to `main` or `master`, plus `workflow_dispatch`. Markdown-only changes skip `ci.yml`. Job order and the release tag flow are in [docs/pipeline/README.md](docs/pipeline/README.md). Runbooks: [coverage](docs/runbook-coverage-gate.md), [image scan](docs/runbook-image-scan.md), [release](docs/runbook-release.md).

## Out of scope

Sign-in, token storage, and loading other remotes belong to web-shell. This repo does not deploy a cluster and has no Helm chart.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md). Security reports: [.github/SECURITY.md](.github/SECURITY.md).

## Related docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [CHANGELOG.md](CHANGELOG.md)
- [docs/README.md](docs/README.md)
