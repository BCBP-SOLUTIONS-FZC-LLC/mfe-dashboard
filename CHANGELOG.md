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

- **No platform logic reimplemented here (`2026-11-03`).** Everything platform-reactcommon's SDK already provides now goes through it: the theme is kept in `storage('app2')` (namespaced per workspace, cleared on logout) instead of raw `localStorage` (keys `bcbp.appTheme`/`bcbp.themeMode` become `appTheme`/`themeMode`, so a saved theme resets once); due dates use `formatDate` in the page locale instead of a fixed `en-GB`; "Last updated" uses the SDK's ICU plurals through a new `app2` message namespace (`src/i18n.ts`, `src/locales/en.json`); the Language menu shows the SDK locale (`useLocale`) instead of a hard-coded English; "All Tenders In Flight" is gated by `useHasPermission('read', 'tender')` (every web-shell role has it) instead of a constant; `useDashboardData` loads through `useApi` (still the fixtures); the router basename is computed as web-shell does (`slugFromPath` + `workspacePathPrefix`); the user-management page registers its route template. All UI text is in the `app2` catalog (`src/locales/en.json`, `useT`), including the delegation period, now formatted with `formatDate`. User management is gated by `useHasPermission('manage', 'members')` (web-shell: `tenant_admin` only): the sidebar link is hidden and the route goes back to the dashboard without it. The standalone page now bundles the SDK and runs on its anonymous defaults (design doc §C2): `rsbuild.config.ts` builds two environments into `dist/`, **remote** (`remoteEntry.js`, SDK from the shell, unchanged contract) and **standalone** (`index.html`, `assets/`). `src/DashboardApp.tsx` and `src/index.ts` are gone; `src/main.tsx` is the standalone entry. `npm run lint` (ESLint with `@bcbp-solutions-fzc-llc/eslint-plugin`, as web-shell) runs in CI; `typescript` is aliased to `@typescript/typescript6` for typescript-eslint while `tsc` stays TypeScript 7 (`@typescript/native`).
- **The remote uses the platform SDK at runtime (`2026-11-03`).** `./App` (`src/App.tsx`) reads the signed-in user with `useCurrentUser()` and signs out with `useSignOut()` (global), from the `@bcbp-solutions-fzc-llc/frontend-sdk` singleton the shell provides; the shell no longer has to pass `userLabel` or `onLogout`, and props it does pass still win. If the shell provides no `signOut`, logout falls back to `VITE_APP1_URL`. The SDK-free dashboard moves to `src/DashboardApp.tsx`, which the standalone entry renders, so `npm run dev` on port 5002 still runs without a shell. `frontend-sdk` is a peer dependency (`^1.0.0-alpha.2`) and a dev dependency pinned to `1.0.0-alpha.2` with `@opentelemetry/api` `1.10.0`, as in web-shell; it is still never bundled. Tests use the SDK's `createTestPlatform`.
- **Breaking: built for the platform SDK shell (`2026-11-03`).** Vite, `@module-federation/vite`, `@tailwindcss/vite` and `autoprefixer` are replaced by Rsbuild 2 and `@bcbp-solutions-fzc-llc/webpack-preset` `1.0.0-alpha.2` (`rsbuild.config.ts`); Tailwind runs through `@tailwindcss/postcss`. The container is a classic-script `var app2` global with Module Federation v1, which is what web-shell's SDK `loadRemote` reads; a Vite/ES-module host can no longer load it. `react-router-dom` is no longer shared: inside web-shell the remote runs its own router under `/t/<slug>/dashboard`. `/mf-manifest.json` is gone. The standalone entry is `src/index.ts` (an async boundary before shared React). Only async chunks are split, and the dev server runs without live reload, so `remoteEntry.js` defines the container synchronously. `.npmrc` maps `@bcbp-solutions-fzc-llc` to GitHub Packages; CI and the Docker build pass `NODE_AUTH_TOKEN` (`packages: read`, BuildKit secret `npm_token`), and this repository needs Actions read access on the `webpack-preset` package. Node 22 → 26 and nginx 1.27 → 1.31-alpine (`apk upgrade`), as in web-shell. Source maps are deleted from the image and the release bundle; the smoke test checks `var app2` and that no `.map` file shipped.
- Dependencies updated to latest (`2026-11-03`): TypeScript 6.0 → 7.0 (`~7.0.2`), `@rsbuild/core` 2.3.1, `@vitejs/plugin-react` 6.2.1, Vitest and `@vitest/coverage-v8` 5.1.0, `postcss` 8.5.32, `@types/node` 26.6.6, `react-router-dom` 7.18.5. Actions: `github/codeql-action` 4.39.1, `hadolint/hadolint-action` 3.5.0, `docker/build-push-action` 7.4.0, `docker/setup-buildx-action` 4.4.1, `docker/login-action` 4.7.0, `actions/upload-artifact` 7.0.2, `actions/download-artifact` 8.0.2. Replaces Dependabot PRs #2–#10.

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
