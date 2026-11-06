# Versioning and releases

This repository is a **deployed micro-frontend remote**, not an npm library other apps install. `package.json` is `"private": true`, and its `name` (`mfe-dashboard`) identifies the repository; nothing installs it. Three things are versioned here:
- the **container image** `ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard`;
- the **static bundle** and **remote manifest entry** attached to each GitHub Release;
- the **runtime contract** that web-shell (container `app1`), browsers and operators depend on.

Versions are published with **Git tags** and described in [CHANGELOG.md](./CHANGELOG.md).

This document follows the same SemVer / image-tag / maintainer-process layout as [`iam-org-membership/VERSIONING.md`](https://github.com/BCBP-SOLUTIONS-FZC-LLC/iam-org-membership/blob/main/VERSIONING.md). There is no Helm chart and no deploy job here: an environment deploys this remote by publishing the release's manifest entry to web-shell (see [Deploy a release](#deploy-a-release)).

## Semantic versioning (SemVer)

We use [SemVer 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH` (e.g. `v1.2.3`).

| Bump | When you change | Examples |
|------|-----------------|----------|
| **MAJOR** | Breaking change in the runtime contract (§ below) | Renaming the container (`dashboard`) or its global (`__platform_mfe_dashboard`); removing `./App` or making one of its props required; consuming a shared module or SDK subpath the shell does not provide, or raising its required range beyond what the shell offers; moving to platform packages the current web-shell cannot load; removing or renaming a route or a `runtime.json` key it reads; renaming a `portal_dashboard_*` metric or a label value; changing the image's port, `/healthz` or `/remote-manifest-entry.json` |
| **MINOR** | New backward-compatible capability | A new optional prop on `./App`; a new page or route that removes none; a new optional `runtime.json` key; a new permission that only adds a capability; a new metric or label value; consuming the real ticket, notification or membership APIs behind the same UI |
| **PATCH** | Backward-compatible fix | A UI, filter, theme, accessibility or navigation fix; copy changes; a dependency bump inside the shared ranges with no observable change; a security header tightened; documentation |

A platform-package upgrade is never a PATCH. The shell must move in step (see [Platform-package coupling](#platform-package-coupling)). Before `v1.0.0` it is at least a MINOR; after `v1.0.0` it is a MAJOR, unless the shell's current release already provides the new range.

### What counts as the runtime contract

This remote has no package another app imports. Its public contract is what the shell, a browser and an operator can rely on once the image is deployed.

| In scope (SemVer applies) | Out of scope (may change without MAJOR) |
|---------------------------|------------------------------------------|
| **Container**: name `dashboard`, `remoteEntry.js`, the global `var __platform_mfe_dashboard` defined synchronously, and `exposes['./App']` (`rsbuild.config.ts`, `pluginPlatform`) | The file layout under `src/`, the layers, component and hook names, CSS classes |
| **`./App` props**: optional `userLabel` (string), optional `onLogout` (function) | How `./App` builds its dependencies (`createDependencies`), the use cases and repositories |
| **Shared modules consumed**, with their required ranges: `react` and `react/jsx-runtime` `^19.0.0`; the SDK subpaths `auth`, `config`, `i18n`, `logging`, `metrics`, `problem`, `react`, `storage` at `^<platform version>`, `import: false`. `react-router-dom` is not shared | Patch and minor upgrades inside those ranges |
| **Routes**: inside web-shell, `/t/<slug>/dashboard` and `/t/<slug>/dashboard/user-management`; under a host router, the index and `user-management`; standalone, `/` → `/dashboard` and `/dashboard/*` | Page layout, copy, KPI wording, the order of views |
| **Permissions it asks for**: `read:tender`, `read:members`, `manage:members` (and `useReadOnly`, `useStepUp`) | Which control a permission shows or hides inside a page |
| **Runtime config** read by the standalone page: `/config/runtime.json` `environment` and `auth.signInUrl` | Each environment's file; the image's default file (web-shell's) |
| **Image**: port **8080**, `GET /healthz` (`ok`), `GET /` (document with `id="app"`), `GET /remoteEntry.js` (no-cache, CORS), hashed chunks and `/assets/*` (immutable, CORS), `GET /remote-manifest-entry.json`, `/config/runtime.json` mount point `/usr/share/nginx/html/config/runtime.json`, uid 101 | nginx internals, headers on other paths, the base image |
| **Release assets**: `mfe-dashboard_vX.Y.Z_dist.tar.gz` (+ `.sha256`), `mfe-dashboard_vX.Y.Z_remote-manifest-entry.json` (`entry`, `version`, `ownerDomain` `portal`, sha384 `integrity`), `checksums.txt`, `sbom.cyclonedx.json`, `provenance.slsa.json` | Release-note wording |
| **Metrics**: the names `portal_dashboard_ticket_loads_total`, `portal_dashboard_ticket_load_duration_seconds`, `portal_dashboard_step_up_requests_total`, their labels and label values ([docs/observability/metrics.md](docs/observability/metrics.md)) | Log message text; histogram buckets the SDK chooses |
| **Storage keys** in SDK `storage('dashboard')`: `appTheme`, `themeMode` (a rename resets users' themes) | Theme ids added or removed in the picker |
| `package.json` `version` equal to the Git tag without the `v` | The npm package name (never published) |

`runtime.json` is served to every browser, so it is public. Do not put secrets in it.

**Retired names are never reused:**
- the container name `app2` and its global (up to `v0.2.0`);
- the build variables `PUBLIC_APP1_URL` and `VITE_APP1_URL` (removed in favour of `runtime.json`; ADR 0006).

A new container or variable gets a new name, so that a stale manifest or deployment fails loudly instead of loading the wrong thing.

### Platform-package coupling

The three platform packages are `@bcbp-solutions-fzc-llc/frontend-sdk`, `webpack-preset` and `eslint-plugin`. They are always the same version as each other and as web-shell's:
- **Name and global:** the preset names the container and its global (`containerName('dashboard')`).
- **Version check:** the preset's `SdkVersionPlugin` fails a build whose packages differ.
- **Loadability:** a remote built with another preset major or pre-release cannot be loaded by the shell.
- **Peer range:** the SDK is a peer dependency at `^<version>` and is never bundled. A release built on alpha.N therefore needs a shell that provides alpha.N or a later version inside that range.

This coupling is part of the contract. The [compatibility matrix](#compatibility-matrix) lists, for every release, the shell it needs. Dependabot ignores these packages; they are upgraded by hand, together with web-shell.

### Guarantees

- **Pre-`v1.0.0` (current status):** per [SemVer §4](https://semver.org/#spec-item-4), anything may change at any time while the major version is `0`. The table above still shows what is more disruptive than what, but a shell should not assume compatibility across a `v0.x` MINOR. `v0.3.0`, for example, renamed the container.
- **MAJOR (once `v1` ships):** breaking changes to the runtime contract ship as `v2.0.0`, with migration notes in the CHANGELOG and a coordinated web-shell release.
- **MINOR:** safe to roll forward without changing the shell's manifest key, mount point or shared ranges, unless you opt into a new capability.
- **PATCH:** a drop-in replacement of the image or bundle (update the manifest entry's `entry` and `integrity`). Upgrading is recommended for security fixes; every image is CVE-scanned.

## Supported releases

| Version | Status | Image tags | Notes |
|---------|--------|------------|-------|
| *next* (`main`) | Unreleased | `main`, `sha-<short>` (not a release) | See `[Unreleased]` in the CHANGELOG |
| `v0.4.0` | **Current** (pre-1.0) | `0.4.0`, `0.4`, `0`, `latest` | Platform packages `1.0.0-alpha.6`: needs a shell SDK `^1.0.0-alpha.6` (web-shell #44 or later). Constitution layers, arch-lint, metrics, the standalone environment from `runtime.json`, visible failure states, `PUBLIC_APP1_URL` removed |
| `v0.3.0` | Superseded | `0.3.0`, `0.3` | **Breaking for the shell:** remote renamed `app2` → `dashboard` (global `__platform_mfe_dashboard`, manifest key `dashboard`). Platform packages alpha.5; needs web-shell #35 or later |
| `v0.2.0` | Superseded | `0.2.0`, `0.2` | Container `app2`. Platform packages `1.0.0-alpha.5`, so web-shell must be on alpha.5. Standalone runtime config (`auth.signInUrl`), logo fix inside the shell |
| `v0.1.1` | Superseded | `0.1.1`, `0.1` | Container `app2`. Platform packages `1.0.0-alpha.4` (`^1.0.0-alpha.4`, so it also loads in web-shell on alpha.5). Logo broken inside the shell |
| `v0.1.0` | **Withdrawn** | — (deleted from GHCR on 2026-11-05) | The release workflow failed after the push: no GitHub Release and no signature, so the unsigned image was deleted. Same application as `v0.1.1` |

**Before deploying `v0.4.0`:**
- web-shell must be on alpha.6 in every environment that will load it;
- each environment's standalone `runtime.json` needs `environment` and `auth.signInUrl` ([LLD §15](docs/lld/mfe-dashboard-lld.md#15-open-items), items 14 and 16).

There is no support-window policy yet, since nothing runs in production against a tagged release. Once `v1.0.0` ships, this section will say how long a superseded major line receives security-only fixes. Expect the platform convention: security fixes only, for a period the platform team sets.

## Consume a release

Do not add this repository as an npm dependency. A release is consumed in one of three ways:
- **web-shell**, through its `/remotes/manifest.json` entry for `dashboard` (with `integrity` outside local, dev and test);
- **the container image**;
- **the static tarball** behind any host that preserves the paths in the contract.

### Pull and verify the image

```bash
# Git tag v0.4.0 publishes the image as 0.4.0 (no v prefix)
docker pull ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard:0.4.0

# Resolve the digest you will deploy and verify
docker buildx imagetools inspect ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard:0.4.0 --format '{{ json .Manifest }}' | jq -r .digest

# The SLSA provenance BuildKit stored in the image index (also attached to the GitHub Release)
docker buildx imagetools inspect ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard:0.4.0 --format '{{ json .Provenance }}'
```

Every image is signed keylessly with Sigstore/Cosign (no long-lived key). That covers tagged releases (from `v0.1.1`) and every push to `main` or `master`. Verify before deploying:

```bash
# tagged releases (signed by release.yml's docker job)
cosign verify \
  --certificate-identity-regexp "^https://github\.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard/.github/workflows/.*@refs/tags/.*$" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard@<digest>

# main-branch builds (signed by ci.yml's push job)
cosign verify \
  --certificate-identity-regexp "^https://github\.com/BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard/.github/workflows/.*@refs/heads/(main|master)$" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/bcbp-solutions-fzc-llc/mfe-dashboard@<digest>
```

### Verify the bundle

```bash
gh release download v0.4.0 -R BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard
sha256sum -c checksums.txt
```

`checksums.txt` covers the tarball and the manifest entry. The manifest entry's `integrity` is the sha384 of the `remoteEntry.js` inside that tarball and that image: the CI smoke test compares it with the served file.

### Image tag scheme

`release.yml`'s `docker/metadata-action` uses `type=semver`, which **strips** the leading `v`. The image is pushed by digest; the tags are added only after the scan, the provenance export and the signature (`tag-signed-image.sh` checks that each tag resolves to the signed digest).

| Git tag | Image tags |
|---------|------------|
| `v1.2.3` | `1.2.3`, `1.2`, `1`, `latest` |
| `v1.2.3-rc.1` | `1.2.3-rc.1` only (no `latest`: the tag contains `-`) |
| Push to `main` / `master` (`ci.yml`) | The branch name and `sha-<short>`. Not a release |

| Pin style | Use when |
|-----------|----------|
| `@sha256:<digest>` | Production: what you verified is what runs |
| `X.Y.Z` | Production, when your tooling cannot pin digests; check the signature first |
| `X.Y` | Accept PATCH updates automatically |
| `X` | Accept MINOR and PATCH updates. Not recommended before `v1.0.0` |
| `latest`, `main`, `sha-…` | Local or dev experiments only; never production |

### Deploy a release

There is no Helm chart or deploy job. To deploy a release to an environment:

1. **Serve the release.** Run the image, or unpack the tarball, at a stable URL, for example `https://<cdn>/remotes/dashboard/<version>/`. Keep `remoteEntry.js` uncached and the hashed files immutable, as `nginx/default.conf` does.
2. **Register it.** Copy `mfe-dashboard_vX.Y.Z_remote-manifest-entry.json` into the environment's web-shell `/remotes/manifest.json`, under `dashboard`, with an absolute `entry`. Never recompute or edit the `integrity`.
3. **Allow its origin.** Make sure web-shell's runtime config lists the remote's origin in `remotes.allowedOrigins`, and that the shell is on the platform packages the [compatibility matrix](#compatibility-matrix) requires.
4. **Standalone page only:** mount the environment's `runtime.json`, with `environment` and `auth.signInUrl`, over `/usr/share/nginx/html/config/runtime.json`. Check it as in the [release runbook](docs/runbook-release.md#standalone-runtime-config-authsigninurl).
5. **Roll back** by pointing the manifest entry back to the previous version. Old versions stay where they are served. The shell's kill switch (`remotes.killSwitch`) disables the remote entirely.

## Maintainer release process

`.github/workflows/release.yml` runs validate → build → docker (push by digest, scan, SBOM, provenance, sign, tag) → publish. Before you tag:

1. **Merge** everything for the release to `main`, and check the blockers under [Supported releases](#supported-releases). Tagging a release that needs a newer shell than the environments run ships a remote they cannot load.

2. **Update `CHANGELOG.md`.** Move the `[Unreleased]` entries into a new `## [X.Y.Z] - YYYY-MM-DD` section. `verify-changelog-entry.sh` fails the release when that section is missing or empty. For a MINOR or MAJOR, say what the shell or an operator must do.

3. **Set `package.json` `version`** to `X.Y.Z` (no `v`). The release itself takes its version from the tag (`BUILD_VERSION`), so no workflow checks this; it keeps local builds and `npm_package_version` honest.

4. **Run the gates locally:**
   ```bash
   npm run lint && npm run arch-lint && npm run test:ci && npm run test:browser
   ```

5. **Create and push an annotated tag.** This is what triggers `release.yml`:
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
   A failed run can be retried with `workflow_dispatch` (input `tag`) at the same tag.

6. **The workflow runs these jobs:**
   - **`validate-test` / `validate-quality`:** the same reusable gates as `ci.yml`, at the tagged commit:
     - tests with the 95% coverage gate and the domain gate;
     - the type check and build;
     - lint and arch-lint;
     - `npm audit`;
     - workflow hygiene.
   - **`build`:**
     - `verify-release-tag.sh`: the tag equals `git describe --tags --exact-match`;
     - `verify-changelog-entry.sh`;
     - `prepare-release-asset.sh`: `npm ci`, then `BUILD_VERSION=X.Y.Z npm run build`, then source maps deleted, then the tarball, its `.sha256` and the manifest entry.
   - **`docker`:**
     - build with `BUILD_VERSION` and `SOURCE_DATE_EPOCH`, and push by digest only;
     - Trivy fails the release on CRITICAL or HIGH (fixed) findings, and uploads SARIF to GitHub Security;
     - CycloneDX SBOM;
     - export the SLSA provenance from the image index;
     - Cosign sign and verify;
     - tag the signed digest (the [tag scheme](#image-tag-scheme)).
   - **`publish`:** a GitHub Release with the CHANGELOG section as its notes, attaching the tarball, the manifest entry, `checksums.txt`, the SBOM and the provenance. A tag containing `-` is marked as a pre-release.

7. **Deploy.** Publish the manifest entry to each environment, together with a web-shell on the same platform packages (see [Deploy a release](#deploy-a-release)).

8. **Notify** the web-shell owners, and whoever runs each environment, with upgrade notes for a MINOR or MAJOR: the manifest key, the shell version needed, and `runtime.json` changes.

A release that fails after the push is fixed with the **next patch version**, never by moving the tag: moving a tag needs a force push, and a rerun checks out the same scripts. `v0.1.0` is the example. Runbook: [docs/runbook-release.md](docs/runbook-release.md).

### Pre-release tags (optional)

| Tag pattern | Meaning |
|-------------|---------|
| `v1.1.0-rc.1` | Release candidate; not for production unless approved |
| `v1.1.0-beta.1` | Early integration testing with a shell |

Both match `release.yml`'s `v[0-9]*.[0-9]*.[0-9]*-*` trigger, and produce a signed, scanned image and a GitHub pre-release. They never get `latest`, `X.Y` or `X` tags.

## Compatibility matrix

| mfe-dashboard | Container / manifest key | Platform packages | Needs web-shell | Shared React |
|---|---|---|---|---|
| *next* (`main`) | `dashboard` | `1.0.0-alpha.6` | #44 or later (alpha.6) | `^19.0.0` |
| `v0.4.0` | `dashboard` | `1.0.0-alpha.6` | #44 or later (alpha.6) | `^19.0.0` |
| `v0.3.0` | `dashboard` | `1.0.0-alpha.5` | #35 or later (alpha.5) | `^19.0.0` |
| `v0.2.0` | `app2` | `1.0.0-alpha.5` | on alpha.5, before #35 | `^19.0.0` |
| `v0.1.1` | `app2` | `1.0.0-alpha.4` | on alpha.4 or alpha.5, before #35 | `^19.0.0` |

None of the platform packages is re-exported. A shell needs only its own SDK, at a version inside this remote's peer range. The remote bundles React Router and its own UI dependencies; they are not part of the contract.

## Related files

| File | Purpose |
|------|---------|
| [CHANGELOG.md](./CHANGELOG.md) | User-facing history per version; `[Unreleased]` for `main` |
| [README.md](./README.md) | Mental model, integrating with web-shell, local development, CI |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers, mount flow, failure domains, invariants, threat model, contract lifecycle |
| [docs/lld/mfe-dashboard-lld.md](./docs/lld/mfe-dashboard-lld.md) | The runtime contract in full; §12 build, image and release; §15 open items |
| [docs/pipeline/README.md](./docs/pipeline/README.md) | CI and release job map |
| [docs/runbook-release.md](./docs/runbook-release.md) | A tag that did not publish; the standalone `runtime.json` check |
| [.github/workflows/release.yml](./.github/workflows/release.yml) | Tag-triggered release (validate → build → docker → publish) |
| [.github/workflows/ci.yml](./.github/workflows/ci.yml) | Pull-request gates; the signed `main` image |
| [config/remote-manifest-entry.mjs](./config/remote-manifest-entry.mjs) | Writes the manifest entry (version from `BUILD_VERSION` or `package.json`, sha384 integrity) |
| [rsbuild.config.ts](./rsbuild.config.ts) | The container, `./App` and the two build environments |
| [package.json](./package.json) | `version`, the peer range of the SDK, the pinned platform packages |
