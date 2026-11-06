# Architecture diagrams

The fences in [ARCHITECTURE.md](../../ARCHITECTURE.md) are the rendered copies. Edit the `.mmd` file and the fence together; `test/unit/docs/diagrams.test.ts` fails when they differ.

| File | ARCHITECTURE.md section | Diagram |
|---|---|---|
| [mermaid/layer-model.mmd](mermaid/layer-model.mmd) | Layer model | Host and SDK, the six layers with their modules, injection and implementation edges |
| [mermaid/module-dependencies.mmd](mermaid/module-dependencies.mmd) | Module dependency graph | Folder-level imports inside `src/`, as dependency-cruiser sees them |
| [mermaid/mount-flow.mmd](mermaid/mount-flow.mmd) | Mount flow | web-shell → `remoteEntry.js` → `init` / `get('./App')` → router and pages |
| [mermaid/routing.mmd](mermaid/routing.mmd) | Routing | Host router versus own `BrowserRouter` at the workspace basename; user-management access |
| [mermaid/ticket-load.mmd](mermaid/ticket-load.mmd) | Data flow | Hook → `useApi` → use case → repository, telemetry, refresh, search |
| [mermaid/domain-model.mmd](mermaid/domain-model.mmd) | Domain model | Entities, `CalendarDay`, repository contracts, use cases |
| [mermaid/observability.mmd](mermaid/observability.mmd) | Observability | Metrics and logs from the remote through the SDK to the shell's export |
| [mermaid/documentation.mmd](mermaid/documentation.mmd) | Documentation assets | Doc sources, the checks that keep them in step, where they are read |
