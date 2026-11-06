# Operations

## Commands

| Command | What it does |
|---|---|
| `export NODE_AUTH_TOKEN=$(gh auth token)` | GitHub Packages token for `@bcbp-solutions-fzc-llc/*` (`read:packages`) |
| `npm ci` | Install from the lockfile |
| `npm run dev` | Dev server, port 5002 (`strictPort`), CORS open for the shell, no HMR/live reload: reload the shell by hand |
| `npm test` | Vitest once: unit, integration, e2e |
| `npm run test:unit` / `test:integration` / `test:e2e` | One suite. Integration builds the remote into a temp dir (a few seconds) |
| `npm run test:coverage` | With the v8 report |
| `npm run test:ci` | Coverage + the 95% gate; what CI runs |
| `npm run lint` | ESLint (platform rules, React hooks) |
| `npx tsc --noEmit -p .` | Type check `src/` (also the first step of `npm run build`) |
| `npm run build` | `tsc`, empty `dist/`, both Rsbuild environments |
| `npm run preview` | Serve the production build on port 5002 |
| `docker build --secret id=npm_token,env=NODE_AUTH_TOKEN -t mfe-dashboard:dev .` | The image; run with `-p 18080:8080`, `GET /healthz` → `ok` |
| `IMAGE=mfe-dashboard:dev bash .github/scripts/smoke-tests.sh` | The CI smoke script against a local image |

Port 5002 may already be taken on this machine by another process; preview on another port rather than killing it.

## CI (`.github/workflows/`)

| Job (required check) | Gate |
|---|---|
| `Validate / Test / test` | `npm ci`, `npm run test:coverage`, the 95% gate, `npm run build` |
| `Validate / Quality / quality` | Workflow hygiene, digest-pinned `FROM`, `npm audit --omit=dev --audit-level=high` |
| `Build image (cache)` | Hadolint, then a cached `linux/amd64` build |
| `Trivy CVE scan` | CRITICAL / HIGH / UNKNOWN unfixed fail |
| `Smoke tests` | Size ≤ 200 MB, `/healthz`, `/`, `remoteEntry.js` starts with `var __platform_mfe_dashboard`, no `.map` files, `/config/runtime.json` served as JSON, the platform SPA rule (routes → document; missing files, pass-through prefixes, dotfiles → 404) |
| `PR summary` | One comment with the results |
| `changelog` | `CHANGELOG.md` touched when `src/`, deps, Dockerfile, nginx, `rsbuild.config.ts` or `index.html` changed |

`Push image → GHCR` runs on `main` only (GHCR + Cosign). Markdown-only changes skip `ci.yml`. The repository needs Actions read access on the `frontend-sdk`, `webpack-preset` and `eslint-plugin` packages (package settings → Manage Actions access). Map and runbooks: [`docs/pipeline/README.md`](../docs/pipeline/README.md), `docs/runbook-*.md`.

## Pull Requests

- Target `main`; squash merge; delete the branch after merge.
- `main`'s ruleset: one approving code-owner review, last-push approval, resolved threads, the required checks above, linear history. A merge without approval needs `--admin`: only with the user's explicit yes.
- For a stack, retarget each PR to `main` before merging it; after a squash merge, rebase the next branch onto `main` (`git rebase --onto origin/main <old-base-commit>`).

## Release

1. On a branch: move `[Unreleased]` into `## [X.Y.Z] - YYYY-MM-DD`, set `package.json` `version` (`npm version X.Y.Z --no-git-tag-version`), and update VERSIONING's table, README Status, the LLD header and `CLAUDE.md` Status. PR, merge.
2. Tag the merge commit: `git tag -a vX.Y.Z -m vX.Y.Z <sha>` and push the tag (ask first). Watch `gh run list --workflow release.yml`.

`release.yml` builds the image (tags without `v`), SBOM, provenance (read from the image index), Cosign signature, version tags and a GitHub Release with the `dist` tarball and `remote-manifest-entry.json`. No deploy job. The image is pushed by digest and tagged only after Trivy, provenance and the signature (`tag-signed-image.sh`). A flaky failure can be re-run; a bug in the workflow cannot (the rerun uses the tag's scripts) and ships as the next patch, never by moving the tag. Detail: [LLD §12.5](../docs/lld/mfe-dashboard-lld.md#125-release), [`docs/runbook-release.md`](../docs/runbook-release.md).

## Dependabot

`.github/dependabot.yml`: weekly npm, Docker and Actions updates. The npm job needs the Dependabot secret `PACKAGES_READ_TOKEN` (reads `npm.pkg.github.com`; created by a repo or org admin), or it fails with a 401 on the platform packages. It ignores `@bcbp-solutions-fzc-llc/*`: upgrade those by hand (below).

## Upgrading the Platform Packages

1. Check web-shell's versions (`../web-shell/package.json`); the SDK dev dependency must equal web-shell's.
2. `npm install @bcbp-solutions-fzc-llc/frontend-sdk@<v> --save-exact` (and `webpack-preset`, `eslint-plugin` together), then set the peer to `^<v>`.
3. `npm test`, `npm run lint`, `npm run build`; `dependency-rules.test.ts` checks the peer range.
4. CHANGELOG line; update the version in README Status, the LLD header and §12.2, and [`CLAUDE.md`](CLAUDE.md).

## Claude Code Settings and Hooks (`.claude/settings.json`)

`settings.json` is added by a maintainer (Claude does not write its own permissions). Its intended content:

- **Allowed without asking:** `npm test` / `run test*` / `run lint` / `run build`, `npx vitest`, `npx tsc`, `npx eslint`, read-only `git` and `gh pr|run view`, `gh pr checks`. Pushing, PRs, merges and tags still ask.
- **`hooks/post-edit.sh`** (PostToolUse, Edit/Write): `eslint --fix` on an edited `.ts/.tsx/.js/.mjs` (problems it cannot fix go back to Claude); after editing a `docs/architecture/mermaid/*.mmd` or `ARCHITECTURE.md`, runs `test/unit/docs/diagrams.test.ts` and reports a mismatch.
- Personal overrides go in `.claude/settings.local.json` (git-ignored).
