# 0009: Browser journeys and WCAG 2.1 AA checks with Playwright and axe-core

**Status:** Accepted (2026-11-06)

## Context

The constitution requires Playwright end-to-end tests of critical journeys and WCAG 2.1 AA, including colour contrast. This repo's e2e tests ran in happy-dom, which has no layout and no colour. That let two real defects through:
- **Ticket row layout:** at 1280px every ticket's title column collapsed to zero width. The row used viewport breakpoints, but the list shares the row with the right panel.
- **Contrast:** several brand-colour texts and small labels were below 4.5:1, worst in the dark theme (down to 1.15:1).

## Decision

- **Playwright (Chromium)** runs `test/browser/` against the production build of the standalone page (`rsbuild preview`). Each test serves the environment's `runtime.json` itself, as a deployment mounts it. The journeys are:
  - the views;
  - filters, with Escape and focus return;
  - clear and search;
  - a nested-route reload, where an unknown path returns to the dashboard;
  - logout to the runtime config's `auth.signInUrl`.
- **axe-core** checks WCAG 2.1 A and AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) on the dashboard, the open filter drawer and the dark theme. Any violation fails.
- **CI:** the `Browser (Playwright, axe)` job in `ci.yml`. It runs on every PR, and the image push waits for it.
- **The fixes it drove:**
  - `TicketRow` lays out by its own width (container queries);
  - text "ink" tokens in `aura.css` (`--aura-primary-ink`, `--aura-secondary-ink`, `--aura-*-on-soft`) for brand-coloured text, while the brand fills stay for backgrounds and icons;
  - `text-slate-500` labels, and dark-theme overrides on the KPI cards and the error text;
  - the notifications button's accessible name includes its visible count.
- **The runtime config files' schema:** a unit test checks both shipped `runtime.json` files against the SDK's `RuntimeConfigSchema`. The browser run found that `"http://localhost:5001"` (without the `/` that `new URL().href` adds) made the SDK reject the dev config.

## Consequences

- Layout, contrast and runtime-config regressions now fail CI before an image is pushed.
- The standalone page runs anonymously, so User management is not part of the browser journeys. It is covered by the happy-dom e2e tests and by web-shell's contract suite, which mounts this remote.
- Only Chromium runs. Firefox and WebKit can be added as projects when needed (web-shell runs all three).
