# Runbook: a tag that did not publish

`release.yml` runs on tags `vX.Y.Z` and `vX.Y.Z-*`, and on `workflow_dispatch` with a tag input.

## Tag does not match HEAD

`verify-release-tag.sh` fails unless `RELEASE_TAG` equals `git describe --tags --exact-match`. The tag has to point at the commit the workflow checked out. A lightweight retag of an older commit, or a dispatch input that is not the current HEAD tag, fails here.

## Changelog section missing or empty

`extract-release-notes.sh` prints the body under `## [X.Y.Z]` until the next `## [` heading. An empty body fails the build job. Add the section, including the date (`## [X.Y.Z] - YYYY-MM-DD`), on the tagged commit. `[Unreleased]` alone is not enough once you are tagging.

## `PUBLIC_APP1_URL` not set

`PUBLIC_APP1_URL` is a build arg for the image and the tarball. The build job's "Verify PUBLIC_APP1_URL is set for releases" step fails unless the repository variable is an `https://` URL, so a release can no longer send logout to localhost. Set the variable (Settings → Secrets and variables → Actions → Variables) and re-run the workflow. A variable still named `VITE_APP1_URL` (the deprecated name) is accepted, with a warning, until you rename it. The value is public in the bundle.

## Image tag looks wrong

The Git tag keeps the `v`. `docker/metadata-action` `{{version}}` strips it. `v1.2.3` publishes `1.2.3`, `1.2`, `1`, and `latest`. A pre-release `v1.2.3-rc.1` publishes `1.2.3-rc.1` only.

## Export SLSA provenance failed

`build-push-action` (`provenance: mode=max`) stores provenance as a BuildKit attestation in the image index. `export-image-provenance.sh` reads it with `docker buildx imagetools inspect <image>@<digest> --format '{{ json .Provenance }}'` and fails when the result is empty. Run the same command locally (after `docker login ghcr.io`) to see what the image has. `cosign download attestation` finds nothing here: Cosign attestations are a different store.

## The docker job failed after the push

The docker job pushes the image **by digest only**, then scans, exports provenance and signs; `tag-signed-image.sh` adds `X.Y.Z`, `X.Y`, `X` and `latest` last. A failure before that step leaves an untagged version in GHCR and no GitHub Release; nothing a consumer pulls by tag changed. Delete the untagged package version if you want it gone.

- **A flaky step (registry, Sigstore, Trivy DB download):** re-run the failed jobs.
- **Trivy found a fixable CRITICAL/HIGH:** see [runbook-image-scan.md](runbook-image-scan.md); the fix is a code change, so it ships as the next patch version.
- **A bug in the workflow or scripts:** a rerun checks out the same tag with the same scripts, and moving a tag needs a force push. Fix it on `main`, add `## [X.Y.Z+1]`, and tag that. Mark the failed version "do not use" in VERSIONING (`v0.1.0`, from before tags were added last, is the example).

## `Tag the signed image` failed

A tag resolved to a digest other than the signed one. `docker buildx imagetools create` with one source should copy the index unchanged; inspect it with `docker buildx imagetools inspect <tag>`. Do not re-tag by hand with a different digest: the Cosign signature covers only the signed one.

## Publish did not create the GitHub Release

`publish` waits for the docker job. A Trivy failure, a Cosign failure, or an empty changelog section stops it. The release asset name is `mfe-dashboard_<tag>_dist.tar.gz`. There is no cluster deploy after publish.

Cosign identity for tags:

```text
^https://github\.com/<owner>/<repo>/.github/workflows/.*@refs/tags/.*$
```

OIDC issuer: `https://token.actions.githubusercontent.com`.

## Standalone runtime config (`auth.signInUrl`)

The standalone image serves `/config/runtime.json` (web-shell's defaults, no `signInUrl`). For logout to return to that environment's sign-in page, mount the environment's file over `/usr/share/nginx/html/config/runtime.json`, with `auth.signInUrl` an absolute `https` URL. The SDK validates it strictly: an unknown key or an `http` origin outside local and dev makes the page ignore the whole file.

Check after each deploy:

```bash
curl -fsS https://<standalone-host>/config/runtime.json | jq -e '.auth.signInUrl | startswith("https://")'
```

A failure in the browser shows as a console warning `[dashboard] runtime config unavailable; logout uses the build-time sign-in URL`. In test, staging and prod that console line is the only trace: the standalone page sends no telemetry.

## Web-shell's manifest entry

Each release attaches `mfe-dashboard_<tag>_remote-manifest-entry.json` (also inside the dist tarball and served by the image at `/remote-manifest-entry.json`): `entry`, `version` (the tag without `v`), `ownerDomain` and the sha384 `integrity` of that release's `remoteEntry.js`. Copy the `dashboard` object into the environment's `/remotes/manifest.json` and set `entry` to the absolute URL the release is served from. A rebuilt `remoteEntry.js` has a different hash; always take the entry from the same release as the files.
