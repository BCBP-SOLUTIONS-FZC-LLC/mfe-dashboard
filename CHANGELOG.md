# Changelog

All notable changes to this remote are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as described in [VERSIONING.md](VERSIONING.md).

Nothing is tagged yet. `package.json` `version` is `0.0.0`. Everything that is true of the tree today is listed under `[Unreleased]`. The first Git tag will move those notes into a dated `## [X.Y.Z]` section. Pull requests that change `src/`, dependencies, the Dockerfile, or nginx config add a line under `[Unreleased]` (`.github/workflows/changelog-check.yml`).

## [Unreleased]

### Added

- Module Federation remote `app2` exposing `./App` (`remoteEntry.js`, global `var app2`), built with Rsbuild 2 and `@bcbp-solutions-fzc-llc/webpack-preset/rsbuild` (`pluginPlatform({ role: 'remote' })`). React, React DOM, the OTel API and the SDK are strict singletons from the shell.
- Dashboard and user-management UI. Tickets and users are in-repo fixtures (`src/mocks/dashboardTickets.ts`, `src/pages/UserManagementPage.tsx`). Views: My Tickets, Awaiting My Review, Awaiting My Approval, Delegated To Me, All Tenders In Flight. Filters cover status, role, department, deadline, and tender text. Deadline is counted in the filter badge and is not applied to the row list.
- Host contract: optional `userLabel` and `onLogout`. Without `onLogout`, logout navigates to `VITE_APP1_URL` (default `http://localhost:5001`).
- Standalone routing on port **5002**: `/` and unknown paths redirect to `/dashboard`. Inside the shell's router the same pages are the index route and `user-management`.
- Theme stored in `localStorage` under `bcbp.appTheme` and `bcbp.themeMode` (Aura light/dark plus daisyUI themes).
- Unprivileged nginx image on port **8080** (`GET /healthz` returns `ok`, `remoteEntry.js` is not cached, hashed chunks and `/assets/` are immutable, all with CORS). Build arg `VITE_APP1_URL`.
- CI (2026-10-27): typecheck and Rsbuild build, Vitest with a 95% coverage gate, production `npm audit`, digest-pinned bases, Hadolint, Trivy, nginx smoke, Cosign on `main`/`master`, changelog check, and a semver release of the image plus `mfe-dashboard_<tag>_dist.tar.gz`.
- Tests under `test/unit` and `test/e2e`. `npm run test:ci` is the local gate.
- Pre-commit hook (`.githooks/pre-commit`, installed with `npm run hooks:install`): refuses staged `.env` files, HTML entities in workflows, CRLF in pipeline files, an unpinned `FROM`, a missing `.dockerignore`, and a failing `tsc --noEmit`.
- Operator docs: this changelog, [README.md](README.md), [VERSIONING.md](VERSIONING.md), [CONTRIBUTING.md](CONTRIBUTING.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [docs/](docs/README.md).

### Changed

- **Breaking: built for the platform SDK shell (`2026-11-03`).** Vite, `@module-federation/vite`, `@tailwindcss/vite` and `autoprefixer` are replaced by Rsbuild 2 and `@bcbp-solutions-fzc-llc/webpack-preset` `1.0.0-alpha.2` (`rsbuild.config.ts`); Tailwind runs through `@tailwindcss/postcss`. The container is a classic-script `var app2` global with Module Federation v1, which is what web-shell's SDK `loadRemote` reads; a Vite/ES-module host can no longer load it. `react-router-dom` is no longer shared: inside web-shell the remote runs its own router under `/t/<slug>/dashboard`. `/mf-manifest.json` is gone. The standalone entry is `src/index.ts` (an async boundary before shared React). Only async chunks are split, and the dev server runs without live reload, so `remoteEntry.js` defines the container synchronously. `.npmrc` maps `@bcbp-solutions-fzc-llc` to GitHub Packages; CI and the Docker build pass `NODE_AUTH_TOKEN` (`packages: read`, BuildKit secret `npm_token`), and this repository needs Actions read access on the `webpack-preset` package. Node 22 → 26 and nginx 1.27 → 1.31-alpine (`apk upgrade`), as in web-shell. Source maps are deleted from the image and the release bundle; the smoke test checks `var app2` and that no `.map` file shipped.

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
