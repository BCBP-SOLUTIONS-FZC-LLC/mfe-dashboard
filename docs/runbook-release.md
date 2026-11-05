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

## The image was pushed but the release failed

The docker job pushes the tags first, then scans, exports provenance and signs. If a later step fails, `X.Y.Z` (and `latest` for a final version) point at an unsigned image and there is no GitHub Release. A rerun checks out the same tag with the same scripts, and moving a tag needs a force push. Fix the cause on `main`, add `## [X.Y.Z+1]`, and tag that. The next release moves `latest`, `X.Y` and `X`. Mark the failed version "do not use" in VERSIONING (`v0.1.0` is the example).

## Publish did not create the GitHub Release

`publish` waits for the docker job. A Trivy failure, a Cosign failure, or an empty changelog section stops it. The release asset name is `mfe-dashboard_<tag>_dist.tar.gz`. There is no cluster deploy after publish.

Cosign identity for tags:

```text
^https://github\.com/<owner>/<repo>/.github/workflows/.*@refs/tags/.*$
```

OIDC issuer: `https://token.actions.githubusercontent.com`.

## Web-shell's manifest entry

Each release attaches `mfe-dashboard_<tag>_remote-manifest-entry.json` (also inside the dist tarball and served by the image at `/remote-manifest-entry.json`): `entry`, `version` (the tag without `v`), `ownerDomain` and the sha384 `integrity` of that release's `remoteEntry.js`. Copy the `app2` object into the environment's `/remotes/manifest.json` and set `entry` to the absolute URL the release is served from. A rebuilt `remoteEntry.js` has a different hash; always take the entry from the same release as the files.
