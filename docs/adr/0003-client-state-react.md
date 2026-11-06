# 0003: Client UI state in React state, not Zustand

**Status:** Accepted (2026-11-06). A deviation from the constitution's "Client State: Zustand (mandatory)".

## Context

The dashboard's client state is small and local:
- the selected view, the filters and the drawer (in `DashboardPage`);
- the search text (in the layout, passed to pages through the router's outlet context);
- menus open or closed.

The theme preference is persisted with the SDK's `storage()` (`src/infrastructure/storage/themePreference.ts`). Nothing is shared across unrelated components or kept across navigation beyond what the router already holds. Shared cross-MFE state (user, workspace, tenant) comes from the shell through the SDK, as the constitution requires.

## Decision

Keep React state (`useState`, the outlet context) for this UI state, and do not add Zustand.

## Consequences

- No new runtime dependency, and no store to reset per workspace (the SDK's storage already clears on sign-out and workspace switch).
- **Revisit** when state must outlive its component or be shared across distant components, for example a multi-step wizard, saved filters or form drafts. Then add a Zustand store in `presentation/` (or `application/` with no React import), persisted through `storage()`.
