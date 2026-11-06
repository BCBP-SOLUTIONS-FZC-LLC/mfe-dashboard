# 0001: Clean Architecture layers and the constitution's folder structure

**Status:** Accepted (2026-11-06)

## Context

The constitution requires Clean Architecture, DDD and Feature-Sliced Design, with a fixed `src/` structure and dependency rules. Before this change `src/` was organised by technical kind (`components/`, `hooks/`, `pages/`, `layouts/`, `mocks/`, `theme/`, `types/`). Business rules (view queues, SLA ordering, the deadline filter, KPI counts) lived in the sample-data module and in a React hook, and pages imported sample data directly.

## Decision

`src/` has exactly the six layers, and a test enforces their direction:

| Layer | Holds | May import |
|---|---|---|
| `app/` | Composition root: `bootstrap/` (`main`, `remote`), `App.tsx` (the exposed `./App`), `routes/`, `layouts/`, `providers/` (builds the use cases on their implementations), `configuration/` (i18n catalog), `styles/` | every layer |
| `presentation/` | Pages, widgets, components, features (hooks that call the injected use cases' `execute`), theme display | application, domain, shared |
| `application/` | Use-case classes (`LoadTicketQueueUseCase`, … with `execute()`) and ports; no React, no browser, no SDK | domain, shared |
| `domain/` | Entities, value objects (`CalendarDay`), rules, repository contracts; pure TypeScript | nothing |
| `infrastructure/` | Repository implementations (fixtures today), runtime configuration (`configuration/standalone.ts`), storage, telemetry, sign-in navigation | application, domain, shared |
| `shared/` | Constants, hooks without business meaning, theme vocabulary, assets, shared types | nothing of ours |

Folders the constitution lists but that have no content yet (`domain/events`, `application/commands`, `application/queries`, `application/services`, `infrastructure/api`, `infrastructure/federation`, `shared/utilities`) are not created empty. Tests stay in the repository's `test/` (as in platform-reactcommon and web-shell), not in `src/tests/`. They appear when there is something to put in them, for example `infrastructure/api` with the first ApiClient repository.

`test/unit/architecture/layers.test.ts` fails on:
- a top-level folder outside the six;
- an import against the table above;
- React, an SDK, any package or a browser API in `domain/` or `application/`;
- `presentation/` using the SDK's storage, metrics or config directly.

## Consequences

- Behaviour and the `./App` contract are unchanged.
- Domain rules have their own tests, and the coverage gate holds every `src/domain/` file above 90% (the constitution's target).
- Some data that used to be read synchronously from sample data now loads asynchronously through repositories: KPI counts, filter options, the right panel, the notification count and the member list. The UI shows them when loaded, as it would with a real API.
