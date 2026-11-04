# Runbook: image scan and smoke

Four different jobs get called "the image check". They fail for different reasons.

| Symptom | Job | What it actually checks |
|---|---|---|
| Hadolint finding | `build-image` | Dockerfile lint. `USER nginx` is DL3066 here; the file uses uid `101` |
| `FROM` is not digest-pinned | `validate-quality` | Every `FROM` matches `image:tag@sha256:…`. The pre-commit hook checks the same pattern |
| Trivy table failed | `trivy` in `ci.yml` | Unfixed **CRITICAL**, **HIGH**, or **UNKNOWN**. `exit-code` is 1 on that scan. The SARIF upload uses `exit-code` 0 |
| Trivy failed on a tag | `docker` in `release.yml` | **CRITICAL** and **HIGH** only. `UNKNOWN` is not in the release scan |
| Smoke failed | `smoke` | Image over 200 MB, `/healthz` missing `ok`, `/` not 200 or missing `id="app"`, `/remoteEntry.js` not 200 or not starting with `var app2`, a source map in the image, a missing security header (`nginx/*-headers.conf`, each `location` must `include` them), `Server` showing the nginx version, or `remoteEntry.js` not gzipped |
| `npm audit` failed | `validate-quality` | `npm audit --omit=dev --audit-level=high`. Dev-only advisories (including `undici` via the federation plugin) do not fail this job |

Allowlist entries belong in [`.trivyignore`](../.trivyignore) with a reason and an expiry, not in a workflow `exit-code: 0` change.

## Reproduce the smoke script

```bash
docker build -t mfe-dashboard-ci-test .
IMAGE=mfe-dashboard-ci-test bash .github/scripts/smoke-tests.sh
```

The container listens on 8080. The script publishes a free localhost port. If 8080 is already taken on the host, that is fine; the mapping is `127.0.0.1:<free>:8080`.
