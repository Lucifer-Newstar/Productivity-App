# Full-page profile and contrast-safe controls

**Date:** 2026-08-21
**Status:** implemented in source
**Electron:** unchanged

## Outcome

The avatar control navigates to `/profile`, a Home-themed full page with a section rail, identity hero and the same per-space constants previously edited in the overlay drawer. Native `<select>` option menus and the notification inbox now use explicit light/dark ink so dropdown labels remain readable in Daily Edition and in dark mode.

## Scope

- `/profile` App Router page; avatar is a `Link`, not a modal.
- Notification center uses theme tokens instead of always-white type.
- Windows package smoke includes `/profile` (40 user routes).
- Five space visual systems were not restyled (ADR-009).

## Non-goals

No Electron/packaging shell edits, no GitHub writes, no Express production persistence, no AI scope change.
