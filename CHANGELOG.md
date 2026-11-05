# Changelog

All notable changes to this remote are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as described in [VERSIONING.md](VERSIONING.md).

Each Git tag `vX.Y.Z` has a dated `## [X.Y.Z]` section here, and `package.json` `version` matches the latest one. Pull requests that change `src/`, dependencies, the Dockerfile, or nginx config add a line under `[Unreleased]` (`.github/workflows/changelog-check.yml`).

## [Unreleased]

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
- A missing or invalid `/config/runtime.json` in staging or prod left no trace (the SDK logger is silent there before logging starts); the standalone page now also writes a `console.warn`. The release runbook has a deploy check for `auth.signInUrl`.
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
