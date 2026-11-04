# Contributing

Changes land through a pull request. CI on `main` and `master` is the gate that publishes an image. This guide matches the workflows in `.github/workflows` and the local hook in `.githooks/pre-commit`.

## Setup

Node **22**.

```bash
npm ci
npm run hooks:install
npm run test:ci
npm run build
```

`hooks:install` copies `.githooks/pre-commit` to `.git/hooks/pre-commit`. Run it again after that file changes. Git for Windows executes the hook with Bash. The hook does **not** run Vitest, Hadolint, Trivy, or the smoke script. Those stay in CI.

The hook rejects:

- a staged `.env` or `docker.local.env`
- HTML entities `&gt;`, `&lt;`, `&amp;` in `.github/workflows` or `.github/scripts`
- CRLF in `.github/scripts`, workflows, `Dockerfile`, `nginx/`, or `.githooks`
- a `FROM` line that is not `image:tag@sha256:…`
- a missing `.dockerignore`
- `npx tsc --noEmit` (TypeScript 7) when `node_modules/typescript` is present

## What a change has to keep true

- Federation name stays `app2`, the expose stays `./App`, and the shared map comes from `@bcbp-solutions-fzc-llc/webpack-preset` (`rsbuild.config.ts`). Keep its version the same as, or older than, web-shell's SDK. Do not set Rsbuild's `moduleFederation` option, and keep `splitChunks` on async chunks only.
- `./App` keeps optional `userLabel` and `onLogout`. New required props are a breaking change ([VERSIONING.md](VERSIONING.md)).
- Do not reimplement what `@bcbp-solutions-fzc-llc/frontend-sdk` (platform-reactcommon) provides: storage, locale-aware dates and numbers, messages and plurals, permissions, data loading (`useApi`), navigation, sign-out. Import it through its public subpaths only. Keep the dev dependency on the same version as web-shell. `npm run lint` enforces the platform rules.
- A new `VITE_*` variable is documented in [README.md](README.md) and given a Dockerfile `ARG` default when the image needs it.
- No raw `localStorage` or `sessionStorage`: use `storage('app2')` from the SDK (the lint rule `no-raw-storage`).
- nginx keeps `/healthz`, port 8080, and no-cache and CORS on `remoteEntry.js`, CORS on the hashed chunks.

## Tests

| Layer | Directory | Use it for |
|---|---|---|
| Unit | `test/unit/<area>` | One area of `src/`: `app`, `authz`, `dashboard`, `components`, `theme`, `i18n`, `sdk`; `docs` checks the diagrams |
| Integration | `test/integration` | The built remote container, loaded as web-shell loads it |
| End to end | `test/e2e` | Render `App` inside `MemoryRouter` (embedded) and without one (standalone `BrowserRouter`) |

[test/README.md](test/README.md) lists what each folder covers. New UI text needs a catalog key (`test/unit/i18n/catalog.test.ts`), and code that would reimplement the platform SDK fails `test/unit/sdk/dependency-rules.test.ts`.

`useDashboardData` waits 700 ms to load and 400 ms to refresh. Pass a **stable** filters object into `renderHook`. A new object on every render retriggers the effect.

`npm run test:ci` must stay at or above 95% statements, branches, functions, and lines. The check is `.github/scripts/coverage-gate.mjs`, not a Vitest threshold.

## Docs to touch

| You changed | Update |
|---|---|
| `src/`, dependencies, Dockerfile, nginx, `rsbuild.config.ts`, `index.html` | `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md). The changelog workflow fails the PR otherwise |
| A route, prop, or `VITE_*` name | [README.md](README.md) and, if the contract moved, [VERSIONING.md](VERSIONING.md) |
| A pipeline job | [docs/pipeline/README.md](docs/pipeline/README.md) and the matching runbook |
| The contract, a flow, an SDK API in use, a failure mode, an open item | [the LLD](docs/lld/mfe-dashboard-lld.md) |
| Module structure, a diagram, a decision | [ARCHITECTURE.md](ARCHITECTURE.md) and `docs/architecture/mermaid/*.mmd` together (`test/unit/docs/diagrams.test.ts`) |
| Commands, versions, rules, layout | [.claude/](.claude/CLAUDE.md) (`CLAUDE.md`, `architecture.md`, `operations.md`) |
| Tests | [test/README.md](test/README.md) |

## Branches and commits

`feat/…`, `fix/…`, `docs/…`, `chore/…`. Commit subjects say why. The PR template in `.github/pull_request_template.md` is the checklist: `npm run test:ci`, `npm run build`, changelog line, federation contract.

## Releases

Maintainers tag `vX.Y.Z` after the changelog has `## [X.Y.Z] - YYYY-MM-DD`. Image tags drop the `v`. Details: [VERSIONING.md](VERSIONING.md) and [docs/runbook-release.md](docs/runbook-release.md).
