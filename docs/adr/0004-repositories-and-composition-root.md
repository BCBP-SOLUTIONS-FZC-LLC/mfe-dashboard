# 0004: Repository contracts in the domain, fixtures in infrastructure, one composition root

**Status:** Accepted (2026-11-06)

## Context

The constitution requires all API access to go through repositories (`TenderRepository` / `TenderApiRepository`), and forbids presentation from calling `fetch` or reading storage. The dashboard has no backend yet: tickets, dashboard information and members are in-repo samples (LLD §15 item 1).

## Decision

- **Contracts** live in `src/domain/repositories`: `TicketRepository`, `DashboardInfoRepository` and `MemberRepository`. They are asynchronous and cancellable (`{ signal }`), as an API is.
- **Implementations** live in `src/infrastructure/fixtures`: `FixtureTicketRepository`, which keeps the simulated latency, `FixtureDashboardInfoRepository` and `FixtureMemberRepository`. When the APIs exist, `infrastructure/api/*ApiRepository` classes built on the SDK's `ApiClient` replace them.
- **Telemetry** is a port in `src/application/ports/telemetry.ts`, implemented by `src/infrastructure/telemetry/metrics.ts`.
- **Use cases** are classes with `execute()` (`LoadTicketQueueUseCase`, `LoadDashboardSummaryUseCase`, `GetDashboardInfoUseCase`, `ListMembersUseCase`), constructed with their repositories.
- **Composition root:** `src/app/providers/dependencies.ts` chooses the implementations and builds the use cases on them. `App` provides `{ useCases, telemetry }` through `DependenciesProvider` (`src/presentation/dependencies.tsx`), and presentation calls `useDependencies().useCases.<name>.execute(...)`, as the constitution's `getTendersUseCase.execute()`. Presentation never sees a repository. An outer provider (a test) wins: `createDependencies({ tickets: failing })` builds the same use cases on a failing or slow repository, without mocking modules.

## Consequences

- Swapping fixtures for APIs changes one file in `app/providers` plus the new repositories. Pages, use cases and rules stay as they are.
- `./App`'s props are unchanged; the provider is internal.
