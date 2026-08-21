# Full-page profile and contrast-safe controls

**Date:** 2026-08-21
**Status:** implemented in source
**Electron:** unchanged

## Outcome

The avatar control navigates to `/profile`. Wave 1 (2026-08-21) removed the floating overlay that covered space theme toggles: the avatar now sits in each space header after the theme button. The profile page is an identity hero (avatar ring, chips, ready meter), section pills and one card — not a crowded rail. Native `<select>` option menus use hardcoded dark (`#0d131f` / `#edf3ff`) and light (`#fffdf8` / `#14213d`) ink because Windows Chromium ignores CSS variables on `<option>`. The notification inbox uses the same treatment.

Waves 2–4 (same day) added Glow session keys with `!` help, gender-aware Navy BF% / ICMR iron, optional cycle log, and a subtle Profile + Health accent when gender is female.

## Scope

- `/profile` App Router page; avatar is a `Link`, not a modal.
- Notification center uses theme tokens instead of always-white type.
- Windows package smoke includes `/profile` (40 user routes).
- Five space visual systems were not restyled (ADR-009).

## Non-goals

No Electron/packaging shell edits, no GitHub writes, no Express production persistence, no AI scope change.
