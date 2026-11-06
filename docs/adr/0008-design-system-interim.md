# 0008: Tailwind + daisyUI until `platform-design-system` exists

**Status:** Accepted (2026-11-06). Interim.

## Context

The constitution requires every UI component to come from `platform-design-system`. That repository does not exist yet. The dashboard uses Tailwind 4 and daisyUI 5 with an "Aura" theme, and the same fonts and Tailwind configuration as web-shell (a rule in `.claude/CLAUDE.md`). Its components are few and plain: buttons, a table, menus, a drawer and cards. They are built in `src/presentation/components` and `widgets`.

## Decision

Keep the current components and do not grow a domain-specific component library. When `platform-design-system` is published, replace these components with its equivalents, one at a time, behind the same props.

## Consequences

- A visual difference between remotes is possible until the design system exists. web-shell and this remote share fonts and Tailwind configuration to limit it.
- Theme and CSS ownership with web-shell is still open (LLD §15 item 8), and is part of the same work.
