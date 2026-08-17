# Home core sections refresh — 2026-08-17

The five Home subpages were redesigned to match the Command Center instead of relying on generic cards, gradients, and tutorial copy.

## Updated sections

- **Tasks → Priority Desk:** operational summary, due-date capture, priority codes, scoped filters, and a denser action queue.
- **Focus → Focus Chamber:** session-state console, mode rail, progress instrument, session protocol, and useful cycle telemetry. The generic “How it works” card was removed.
- **Notes → Reference Desk:** note inventory metrics, integrated search, refined desk cards, and a theme-safe editor.
- **Habits → Rhythm Matrix:** consistency metrics and a denser seven-day execution matrix.
- **Calendar → Commitment Map:** monthly load metrics, due-date-aware placement, and a selected-day commitment agenda. The non-functional “Add event” control was removed.

## Theme behavior

Dark mode uses a technical control-system language: instrument rails, status signals, telemetry labels, rounded consoles, and luminous accents.

Light mode uses the Daily Edition language: editorial typography, square paper panels, ruled textures, ink borders, coral print accents, and offset shadows.

## Shared foundation

`frontend/components/HomeSectionHeader.tsx` provides a consistent information hierarchy without making the five tools identical. Shared styling lives in `frontend/app/globals.css` under `Home core sections`.

## Quality

The UI QA suite now verifies that all five sections use the mature header, that the operational sections expose summary metrics, and that Focus no longer includes generic tutorial filler.
