# Architecture Decision Records

Decisions taken to bring mfe-dashboard in line with the Frontend Architecture Constitution 1.0. Each record states the context, the decision, and its consequences. The assessment they come from is [`../architecture/constitution-assessment.md`](../architecture/constitution-assessment.md).

| # | Decision | Status |
|---|---|---|
| [0001](0001-layered-structure.md) | Clean Architecture layers and the constitution's folder structure | Accepted |
| [0002](0002-server-state-platform-sdk.md) | Server state through the platform SDK's `useApi`, not TanStack Query | Accepted (deviation) |
| [0003](0003-client-state-react.md) | Client UI state in React state, not Zustand | Accepted (deviation) |
| [0004](0004-repositories-and-composition-root.md) | Repository contracts in the domain, fixtures in infrastructure, one composition root | Accepted |
| [0005](0005-localization-platform-sdk.md) | Localization through the platform SDK (`useT`), as the approved framework | Accepted |
| [0006](0006-runtime-configuration-only.md) | Runtime configuration only: no environment-specific build values | Accepted |
| [0007](0007-observability-platform-sdk.md) | Observability through the platform SDK; the shell owns the telemetry provider | Accepted |
| [0008](0008-design-system-interim.md) | Tailwind + daisyUI until `platform-design-system` exists | Accepted (interim) |
