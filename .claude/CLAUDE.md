# CLAUDE.md

Guidance for Claude Code in **mfe-dashboard**, the dashboard and user-management remote (`app2`) that web-shell loads. Detail lives in the files under [See Also](#see-also); this file is what must always be in context.

## What This Repo Is

A Module Federation **remote**, container `app2`, exposing `./App` (`src/App.tsx`). web-shell (`app1`) loads `remoteEntry.js` with the platform SDK's `loadRemote` and mounts `App` at `/t/<slug>/dashboard/*`. The same code also runs standalone (`npm run dev`, port 5002; the image's `/`).

React 19, React Router 7, Tailwind 4 + daisyUI 5, Rsbuild 2 (Rspack) with `@bcbp-solutions-fzc-llc/webpack-preset/rsbuild`, Vitest 5 + happy-dom, nginx 1.31 image on port 8080. Node 22 in CI, npm. Packages `@bcbp-solutions-fzc-llc/*` come from **GitHub Packages**: `export NODE_AUTH_TOKEN=$(gh auth token)` before `npm ci` / `npm install`.

**Status (2026-11-04):** untagged (`[Unreleased]`). Platform packages (`frontend-sdk`, `webpack-preset`, `eslint-plugin`) `1.0.0-alpha.3`, all the same as web-shell. Data is fixtures; no backend calls. Open items: [LLD §15](../docs/lld/mfe-dashboard-lld.md#15-open-items).

**Owns:** the dashboard (views, KPIs, filters, load states, right panel), user management UI, the remote's chrome (sidebar, search, theme, user menu), the `app2` catalog, themes, the nginx image.

**Does NOT own:** sign-in, tokens, session, sign-out, workspace switch (SDK `/auth` in web-shell); roles (IAM P-35) and the role → permission map (web-shell `src/platform/permissions.ts`); authorisation (IAM and the APIs; UI checks are hints); the remote manifest, SRI and kill switch (web-shell + SDK `/mfe`); hosting in an environment.

## Common Commands

```bash
npm ci                     # needs NODE_AUTH_TOKEN (read:packages)
npm run dev                # http://localhost:5002 (strictPort; remote + standalone)
npm test                   # Vitest: unit, integration (builds the remote), e2e
npm run test:unit | test:integration | test:e2e
npm run test:ci            # coverage + 95% gate (.github/scripts/coverage-gate.mjs)
npm run lint               # ESLint with the platform rules
npm run build              # tsc (TypeScript 7), then both Rsbuild environments into dist/
```

One test: `npx vitest run test/unit/authz/permissions.test.tsx -t "read-only"`. Full list: [`operations.md`](operations.md).

## Critical Rules (do not break)

- **Use the platform SDK; never reimplement it.** User, sign-out, permissions, read-only, step-up, data loading (`useApi`), messages (`useT`), dates and numbers (`formatDate`, `formatNumber`), storage (`storage('app2')`), workspace paths (`slugFromPath`), route templates. Import public subpaths only. `npm run lint` and `test/unit/sdk/dependency-rules.test.ts` enforce it. If the SDK lacks something, raise it with platform-reactcommon (write it up as a `.md` for that team) rather than building it here.
- **The SDK comes from the shell.** It is a peer dependency (`^<dev version>`) and a dev dependency pinned to **web-shell's version**; never a runtime dependency; never bundled into the remote (`import: false`).
- **Container contract:** name `app2`, expose `./App`, `remoteEntry.js` defines `var app2` synchronously. Keep `splitChunks` async-only and the dev server without HMR/live reload. Do not set Rsbuild's `moduleFederation` option. `./App` props stay optional (`userLabel`, `onLogout`).
- **Access by permission, never by role name.** `read:tender`, `read:members`, `manage:members`, plus `useReadOnly()`. Roles belong to IAM and web-shell's map.
- **Every UI string is a key in `src/locales/en.json`, and every key is used** (`test/unit/i18n/catalog.test.ts`).
- **No raw browser storage, no tokens, no identity headers, no unsafe HTML** (lint). No third-party origins in the standalone page: the image's CSP is same-origin only (fonts are self-hosted).
- **Build-time config** is `PUBLIC_*` (Rsbuild's public prefix), resolved in `config/app1Url.ts`. `VITE_APP1_URL` is a deprecated fallback: do not add new `VITE_*` names.
- **Calendar dates** (`YYYY-MM-DD`) go through `calendarDate()` (`src/lib/dates.ts`) before `formatDate`; `new Date('YYYY-MM-DD')` is UTC and shows the previous day west of UTC.
- **Popups and dialogs** use `useDismiss` (outside press, Escape, menu arrow keys) and `useFocusTrap`; do not hand-roll document listeners.
- **Diagrams:** edit `docs/architecture/mermaid/*.mmd` and the matching fence in `ARCHITECTURE.md` together; `test/unit/docs/diagrams.test.ts` fails when they differ.
- **Changelog:** a PR touching `src/`, dependencies, the Dockerfile, nginx, `rsbuild.config.ts` or `index.html` adds a line under `[Unreleased]` (`changelog` check).
- **Coverage gate** is 95% on all four metrics; do not lower it.
- **Sibling repos are read-only** from here (`../web-shell`, platform-reactcommon, IAM). Cross-team asks go in a `.md` in `/Users/vijayaragavan/XPertPMS/frontend/` for the user to share.

## Conventions

- Tests mirror platform-reactcommon's layout: `test/unit/<area>/` (`app`, `authz`, `dashboard`, `components`, `theme`, `i18n`, `sdk`, `docs`), `test/integration`, `test/e2e`, `test/fixtures`. Use `startPlatform()` / `platform.Wrapper` from `test/fixtures/platform.ts`; do not mock SDK modules.
- Docs in plain, direct English; tables over prose; every claim checkable against the code. Keep README, ARCHITECTURE, the LLD and this folder in step with the code.
- Branches `feat/…`, `fix/…`, `docs/…`, `chore/…`, `test/…`; PRs into `main`, squash-merged. `main` requires an approving code-owner review and the checks `Build image (cache)`, `Trivy CVE scan`, `Smoke tests`, `Validate / Quality / quality`, `PR summary`, `Validate / Test / test`. Never merge with `--admin` unless the user says so.
- Commit and push only when asked. SSH may be unavailable in this environment; push over HTTPS with `gh` credentials per command, without changing git config.

## See Also

| File | Contents |
|---|---|
| [`architecture.md`](architecture.md) | Source and test layout, the SDK map, build environments, where things live |
| [`operations.md`](operations.md) | Commands, CI jobs, branch rules, release, the image, these Claude Code settings and hooks |
| [`../docs/lld/mfe-dashboard-lld.md`](../docs/lld/mfe-dashboard-lld.md) | The contract, SDK usage, domain model, flows, failure handling, open items |
| [`../ARCHITECTURE.md`](../ARCHITECTURE.md) | Diagrams, invariants, decisions, threat notes |
| [`../test/README.md`](../test/README.md) | What each test folder covers |
