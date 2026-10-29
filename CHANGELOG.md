# Changelog

All notable changes to this remote are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as described in [VERSIONING.md](VERSIONING.md).

Nothing is tagged yet. `package.json` `version` is `0.0.0`. Everything that is true of the tree today is listed under `[Unreleased]`. The first Git tag will move those notes into a dated `## [X.Y.Z]` section. Pull requests that change `src/`, dependencies, the Dockerfile, or nginx config add a line under `[Unreleased]` (`.github/workflows/changelog-check.yml`).

## [Unreleased]

### Added

- Module Federation remote `app2` exposing `./App` (`remoteEntry.js`) with shared singletons `react` `^19.3.0`, `react-dom` `^19.3.0`, and `react-router-dom` `^7.18.4`.
- Dashboard and user-management UI. Tickets and users are in-repo fixtures (`src/mocks/dashboardTickets.ts`, `src/pages/UserManagementPage.tsx`). Views: My Tickets, Awaiting My Review, Awaiting My Approval, Delegated To Me, All Tenders In Flight. Filters cover status, role, department, deadline, and tender text. Deadline is counted in the filter badge and is not applied to the row list.
- Host contract: optional `userLabel` and `onLogout`. Without `onLogout`, logout navigates to `VITE_APP1_URL` (default `http://localhost:5001`).
- Standalone routing on port **5002**: `/` and unknown paths redirect to `/dashboard`. Inside the shell's router the same pages are the index route and `user-management`.
- Theme stored in `localStorage` under `bcbp.appTheme` and `bcbp.themeMode` (Aura light/dark plus daisyUI themes).
- Unprivileged nginx image on port **8080** (`GET /healthz` returns `ok`, `remoteEntry.js` and `mf-manifest.json` are not cached, `/assets/` is immutable). Build arg `VITE_APP1_URL`.
- CI (2026-10-27): typecheck and Vite build, Vitest with a 95% coverage gate, production `npm audit`, digest-pinned bases, Hadolint, Trivy, nginx smoke, Cosign on `main`/`master`, changelog check, and a semver release of the image plus `mfe-dashboard_<tag>_dist.tar.gz`.
- Tests under `test/unit` and `test/e2e`. `npm run test:ci` is the local gate.
- Pre-commit hook (`.githooks/pre-commit`, installed with `npm run hooks:install`): refuses staged `.env` files, HTML entities in workflows, CRLF in pipeline files, an unpinned `FROM`, a missing `.dockerignore`, and a failing `tsc --noEmit`.
- Operator docs: this changelog, [README.md](README.md), [VERSIONING.md](VERSIONING.md), [CONTRIBUTING.md](CONTRIBUTING.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [docs/](docs/README.md).

### Known gaps

- Ticket and user data is mocked in the browser. There is no backend and no auth in this repo. The shell owns sign-in.
- `countActiveFilters` includes deadline. `useDashboardData` does not filter on it.
- No cluster deploy step. Publishing the image does not roll it out.
- Dev-dependency audit is outside the CI gate (`npm audit --omit=dev`). The same `@module-federation/vite` → `undici` advisory that affects web-shell can appear here. `npm audit fix --force` would downgrade the federation plugin.
- Pre-v1: the contract in [VERSIONING.md](VERSIONING.md) is descriptive until the first tag.

### Current architecture notes

- Image: `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`, `linux/amd64`, listen 8080, `USER 101`.
- Bases (digest-pinned 2026-10-27): `node:22-bookworm` and `nginxinc/nginx-unprivileged:1.27-alpine`.
- The shell loads this remote. This remote does not load other remotes.
