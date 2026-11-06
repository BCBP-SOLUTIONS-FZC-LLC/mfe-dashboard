# 0002: Server state through the platform SDK's `useApi`, not TanStack Query

**Status:** Accepted (2026-11-06). A deviation from the constitution's "Server State: TanStack Query (mandatory)".

## Context

The platform SDK (`@bcbp-solutions-fzc-llc/frontend-sdk`, owned by platform-reactcommon) is this platform's API and runtime layer (the constitution's `platform-api-sdk` role). Its `useApi` runs a load on mount and on change, aborts the superseded load, and keeps data while it reloads. Its `ApiClient` adds:
- correlation and trace headers;
- the gateway's problem+json errors (`ProblemError`, `problemMessage`);
- the shell's token;
- retries with backoff;
- per-remote labels on logs and metrics.

This repository's rule is to use the SDK and never reimplement it (`test/unit/sdk/dependency-rules.test.ts` rejects `@tanstack/react-query`). Adding TanStack Query would put a second request lifecycle and cache beside the SDK's in every remote, and the shell does not provide a `QueryClient`.

## Decision

- Use cases (`src/application/use-cases`) call repository contracts and are framework-free.
- Presentation features run them through `useApi` (`src/presentation/features/*`).
- Repositories that talk to an API will use the SDK's `ApiClient` (`useApiClient` / `createApiClient`).
- TanStack Query is not added.

## Consequences

- The constitution's intent is met: server state is separate from UI state, with cancellation and reload, and no component calls `fetch`.
- No client-side cache is shared between views. With fixtures that costs nothing. When the APIs exist, a cache would come from the SDK, so every remote gets it: raise it with platform-reactcommon.
- **Revisit** if the platform adopts TanStack Query in the SDK or the shell. The use cases and repositories would stay, and only the presentation hooks would change.
