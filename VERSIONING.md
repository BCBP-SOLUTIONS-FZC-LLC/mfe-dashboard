# Versioning and releases

This repository is a **deployed micro-frontend remote**, not an npm library other apps install — `package.json` is `"private": true` and its `name` (`mfe-dashboard`) is the package identity, not something another app `npm install`s. What gets versioned here is the **container image** (`ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`) and the **static bundle** attached to the GitHub Release, plus the runtime contract the shell (`app1`) and operators depend on. Versions are published with **Git tags** and described in [CHANGELOG.md](./CHANGELOG.md).

This document follows the same SemVer / image-tag / maintainer-process layout as [`iam-org-membership/VERSIONING.md`](https://github.com/BCBP-SOLUTIONS-FZC-LLC/iam-org-membership/blob/main/VERSIONING.md). There is no Helm chart in this repo, so that service's deploy step is not part of this one.

## Semantic versioning (SemVer)

We use [SemVer 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH` (e.g. `v1.2.3`).

| Bump | When you change | Examples |
|------|-----------------|----------|
| **MAJOR** | Breaking change in the runtime contract (§ below) | Renaming the federation container (`dashboard`) or `remoteEntry.js`, removing `./App` or changing its props so the shell cannot mount it, moving to an SDK preset release that the shell's SDK cannot satisfy (a remote requires `^<its preset version>` of the shell's SDK), removing `/healthz` or `/`, removing `PUBLIC_APP1_URL` or its deprecated alias `VITE_APP1_URL`, changing the image listen port |
| **MINOR** | New backward-compatible capability | A new optional prop on `./App`, a new route that does not remove an existing one, a new optional `PUBLIC_*` build arg |
| **PATCH** | Backward-compatible fix | Ticket, theme, or navigation bug fix, visual fix that does not change the federation contract, dependency bump with no observable behavior change, documentation-only correction |

### What counts as the runtime contract

This remote has no package for another app to import from npm. Its public contract is what the shell, a browser, and an operator can rely on after the image is deployed.

| In scope (SemVer applies) | Out of scope (may change without MAJOR) |
|---------------------------|------------------------------------------|
| Federation container `name` (`dashboard`), `filename` (`remoteEntry.js`), and `exposes['./App']` in `rsbuild.config.ts` (`pluginPlatform`) | Internal file layout under `src/`, component names that are not the exposed `./App`, CSS class names |
| Props `./App` accepts: optional `userLabel` (string) and optional `onLogout` (function) | Mock ticket and user rows. They are fixture data, not an API |
| Shared singletons the remote consumes and their `requiredVersion`, from `@bcbp-solutions-fzc-llc/webpack-preset`: `react` and `react/jsx-runtime` `^19.0.0`, and the SDK subpaths it imports (`auth`, `config`, `i18n`, `react`, `storage`) at `^<preset SDK version>` with `import: false`. `react-router-dom` is not shared | Patch-level upgrades inside those ranges |
| Routes: inside web-shell, `/t/<slug>/dashboard` and `/t/<slug>/dashboard/user-management` (own router at the workspace basename). When the host already provides a router: index route (dashboard) and `user-management`. Alone: `/` and unknown paths redirect to `/dashboard`, and `/dashboard/*` renders the same two pages. The permissions a page asks for (`read:tender`, `read:members`, `manage:members`) | Copy, KPI counts, and theme class names |
| Build-time env `PUBLIC_APP1_URL` (deprecated alias `VITE_APP1_URL`, read when `PUBLIC_APP1_URL` is unset; removing the alias is MAJOR) (default `http://localhost:5001`): where logout sends the browser when the shell did not pass `onLogout` | The default itself. A production image must set the repository variable |
| Image listen port **8080**, `GET /healthz` (plain `ok`), `GET /` (document with `id="app"`), `GET /remoteEntry.js` (no-cache, CORS, defines `var __platform_mfe_dashboard`), `GET /remote-manifest-entry.json` (the shell's manifest entry with `remoteEntry.js` integrity), hashed files under `/assets/` | nginx config comments, cache headers on files other than the ones named here |
| `package.json` `version` once a tag exists — it must match the Git tag without the `v` | The npm package name. It is not published |

`PUBLIC_*` values are compiled into the browser bundle. They are public. Do not put secrets in them.

### Guarantees

- **Pre-`v1.0.0` (current status):** per [SemVer §4](https://semver.org/#spec-item-4), anything may change at any time while the major version is `0`. This remote has not yet committed to a stable contract via a Git tag. The table above still indicates what is *more* disruptive than what within `v0.x`, but a host should not yet assume `v0.x` compatibility across a MINOR bump the way it could once `v1.0.0` ships.
- **MAJOR (once `v1` ships):** breaking changes to the runtime contract ship as `v2.0.0` with migration notes in the CHANGELOG.
- **MINOR:** safe to roll the image forward without changing the shell's import of `dashboard/App` or the shared React versions, unless you opt into a new capability.
- **PATCH:** drop-in image replacement. Upgrade recommended for security fixes. Every image is CVE-scanned (see below).

## Supported releases

| Version | Status | Image tag | Notes |
|---------|--------|-----------|-------|
| *next* (`v0.3.0`) | Unreleased | — | **Breaking for the shell:** container renamed `app2` → `dashboard`. Needs web-shell with `DASHBOARD_REMOTE = 'dashboard'` and the manifest key `dashboard`; pre-1.0, so a minor version |
| `v0.2.0` | **Current** (pre-1.0) | `0.2.0`, `0.2`, `0`, `latest` | Platform packages `1.0.0-alpha.5`: requires the shell's SDK `^1.0.0-alpha.5`, so web-shell must be on alpha.5. Standalone runtime config (`auth.signInUrl`), logo fix inside the shell |
| `v0.1.1` | Superseded | `0.1.1`, `0.1` | Platform packages `1.0.0-alpha.4` (`^1.0.0-alpha.4`, so it also loads in web-shell on alpha.5; checked by web-shell's contract suite). Logo broken inside the shell |
| `v0.1.0` | **Do not use** | `0.1.0` (unsigned) | The release workflow failed after the push: no GitHub Release, no signature. Same application as `v0.1.1` |

This remote has no formal support-window policy yet, since nothing is running in production against a tagged release. Once a `v1.0.0` ships, this section will define how long a superseded major line receives security-only fixes.

## Consume a release

Do not add this repository as an npm dependency. The shell loads `remoteEntry.js` from the entry its `/remotes/manifest.json` names for `dashboard` (with `integrity` outside local, dev and test). You can also unpack the static tarball from the GitHub Release behind any static host that preserves the paths above.

### Pull and verify the image

```bash
# Git tag v0.2.0 publishes the image as 0.2.0 (the v prefix is not part of the image tag)
docker pull ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard:0.2.0
# the SLSA provenance BuildKit stored in the image index (also attached to the GitHub Release)
docker buildx imagetools inspect ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard:0.2.0 --format '{{ json .Provenance }}'
```

Tagged releases (from `v0.1.1`) and every push to `main` or `master` publish images. Each is signed keylessly via Sigstore/Cosign (no long-lived key). Verify before deploying:

```bash
# main-branch builds (signed by ci.yml's push job)
cosign verify \
  --certificate-identity-regexp "^https://github\.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard/.github/workflows/.*@refs/heads/(main|master)$" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard@<digest>
```

Tagged releases, published by `.github/workflows/release.yml`, use `@refs/tags/` in the identity regexp:

```bash
# tagged releases (signed by release.yml's docker job)
cosign verify \
  --certificate-identity-regexp "^https://github\.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard/.github/workflows/.*@refs/tags/.*$" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard@<digest>
```

### Image tag table

`docker/metadata-action` uses `type=semver,pattern={{version}}`, which **strips** the leading `v` from the Git tag.

| Git tag | Image tags |
|---------|------------|
| `v1.2.3` | `1.2.3`, `1.2`, `1`, `latest` |
| `v1.2.3-rc.1` | `1.2.3-rc.1` only (`latest` is omitted when the tag contains `-`) |
| push to `main` / `master` | branch name and `sha-<short>` (not a release) |

## Cut a release

1. `npm run test:ci` and `npm run build` pass locally.
2. Add `## [X.Y.Z] - YYYY-MM-DD` to [CHANGELOG.md](CHANGELOG.md) and move the `[Unreleased]` notes into it. The release workflow fails when that section is missing or empty.
3. Set `package.json` `version` to `X.Y.Z` (no `v`).
4. Tag the commit: `git tag -a vX.Y.Z -m "vX.Y.Z"` and push the tag. `release.yml` checks that the tag matches `git describe --tags --exact-match`.
5. Set the GitHub Actions variable `PUBLIC_APP1_URL` to the shell origin before the production build. The default is `http://localhost:5001`.

The workflow publishes the image, a CycloneDX SBOM, provenance, and `mfe-dashboard_vX.Y.Z_dist.tar.gz` plus checksums. It does not deploy a cluster.

## Related

- [README.md](README.md) — run it locally and read the contract
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the remote is put together
- [docs/pipeline/README.md](docs/pipeline/README.md) — job order
- [docs/runbook-release.md](docs/runbook-release.md) — a tag that did not publish
