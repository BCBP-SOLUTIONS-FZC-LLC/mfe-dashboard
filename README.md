# mfe-dashboard

Ticket and user-management remote for the BCBP shell. Module Federation name **`app2`**. The shell (`web-shell`, container `app1`) loads `remoteEntry.js` and mounts `./App`. This repo does not sign users in.

`package.json` is private. Consume the GHCR image or the release tarball. Do not `npm install` this package. Versioning rules are in [VERSIONING.md](VERSIONING.md).

## Mental model

| Piece | Role |
|---|---|
| `src/App.tsx` | Exposed module. Renders relative routes when a router already exists, otherwise its own `BrowserRouter` |
| `src/layouts/AppShellLayout.tsx` | Sidebar, search, theme, user menu, logout |
| `src/pages/DashboardPage.tsx` | Ticket views, filters, KPI cards. Data comes from `useDashboardData` after a short timeout |
| `src/pages/UserManagementPage.tsx` | Mock user table filtered by the shell search box |
| `src/theme/` | Aura light/dark and daisyUI themes, stored in `localStorage` |
| `nginx/default.conf` | Static host for the production image |

Props the shell may pass:

| Prop | Meaning |
|---|---|
| `userLabel` | Display name or email. Initials are derived from it. Default `User` |
| `onLogout` | Called from the sidebar and the user menu. When omitted, the browser goes to `VITE_APP1_URL` |

## Routes

| How it is opened | Paths |
|---|---|
| Inside the shell (a router is already mounted) | index → dashboard, `user-management` → user table. The shell's URL is `/dashboard` and `/dashboard/user-management` |
| Alone (`npm run dev` or the image) | `/` and any unknown path redirect to `/dashboard`. `/dashboard/user-management` is the user table |

Dev server: `http://localhost:5002` (`strictPort`). The image listens on **8080**.

## Federation

`module-federation.config.ts`:

- name `app2`, file `remoteEntry.js`, expose `./App` from `src/App.tsx`
- `bundleAllCSS: true`
- shared singletons: `react` `^19.3.0`, `react-dom` `^19.3.0`, `react-router-dom` `^7.18.4`

Those ranges must stay aligned with web-shell. A mismatch fails at runtime in the shell origin.

## nginx

| Path | Behaviour |
|---|---|
| `GET /healthz` | `200` and body `ok` |
| `GET /` | SPA document (`id="app"`) |
| `GET /remoteEntry.js`, `GET /mf-manifest.json` | `Cache-Control: no-cache` |
| `/assets/*` | immutable, 1 year |
| anything else | `try_files` back to `index.html` |

## Repository layout

```
src/App.tsx                      exposed remote
src/main.tsx                     standalone bootstrap (#app)
src/layouts/                     shell chrome and outlet context
src/pages/                       dashboard and user management
src/hooks/useDashboardData.ts    mock load (700 ms) and refresh (400 ms)
src/mocks/                       ticket fixtures
src/theme/                       localStorage theme
module-federation.config.ts
nginx/default.conf
Dockerfile
.github/                         CI, release, coverage gate
test/                            Vitest unit and e2e
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
| `npm run dev` | Vite on port 5002 |
| `npm run build` | `tsc` and production bundle |
| `npm test` | Vitest once |
| `npm run test:coverage` | Vitest with the v8 report |
| `npm run test:ci` | Coverage plus the 95% gate (`.github/scripts/coverage-gate.mjs`) |
| `npm run hooks:install` | Copy `.githooks/pre-commit` into `.git/hooks` |
| `npm run preview` | Preview the production build on port 5002 |

## Tests

Vitest 5, happy-dom, Testing Library. `vitest.config.ts` does **not** load the federation plugin. Layers:

| Directory | What it exercises |
|---|---|
| `test/unit` | Theme storage, ticket views, `useDashboardData`, presentational components, `main.tsx` |
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

Bases are digest-pinned in the Dockerfile (`node:22-bookworm`, `nginxinc/nginx-unprivileged:1.27-alpine`). The process runs as uid **101**.

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
