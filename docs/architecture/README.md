# Architecture diagrams

The fences in [ARCHITECTURE.md](../../ARCHITECTURE.md) are the rendered copies. Edit the `.mmd` file and the fence together; `test/unit/docs/diagrams.test.ts` fails when they differ.

| File | Diagram |
|---|---|
| [mermaid/layer-model.mmd](mermaid/layer-model.mmd) | Shell, expose, layout, pages, hooks, fixtures, and what comes from the SDK |
| [mermaid/routing.mmd](mermaid/routing.mmd) | Host router versus own `BrowserRouter` at the workspace basename; user-management access |
| [mermaid/ticket-load.mmd](mermaid/ticket-load.mmd) | Ticket load through the SDK's `useApi`, refresh, and the search filter |
