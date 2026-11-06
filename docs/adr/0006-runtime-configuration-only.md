# 0006: Runtime configuration only: no environment-specific build values

**Status:** Accepted (2026-11-06)

## Context

The constitution requires "build once, deploy everywhere" and forbids `PUBLIC_APP_URL`-style variables. Until now the standalone page compiled in `PUBLIC_APP1_URL` (with the deprecated `VITE_APP1_URL`), the sign-in URL logout falls back to. The release built it from a repository variable, which baked `https://app.dev.bcbpsolutions.com` into every image. SDK `1.0.0-alpha.5` and `1.0.0-alpha.6` added `auth.signInUrl` and `environment` to `/config/runtime.json`.

## Decision

- **Removed:** `PUBLIC_APP1_URL` and `VITE_APP1_URL`, from `config/app1Url.ts`, `rsbuild.config.ts`, the Dockerfile `ARG`s, and the CI and release build args and check.
- **Logout without a shell** (`src/infrastructure/auth/signIn.ts`) goes to the runtime config's `auth.signInUrl`; without one, it goes to the page root `/`.
- **The standalone page's environment** comes from `runtime.json` (`src/infrastructure/configuration/standalone.ts`).
- **The dev server** serves `config/runtime.local.json` at `/config/runtime.json`, with environment `local` and `auth.signInUrl` `http://localhost:5001`.
- `test/integration/remote-entry.test.tsx` builds with the old variables set and fails if any of their values reaches the bundle.

## Consequences

- One image and one tarball serve every environment.
- Each deployed standalone `runtime.json` must set `environment` and `auth.signInUrl`; the runbook has the check.
- The repository variable `PUBLIC_APP1_URL` became unused and was deleted on 2026-11-06.
- Inside web-shell nothing changes: the shell signs out.
