# Health space ❤️

The **Health** space currently renders `<SpaceTasks space="health" />` — a
reusable scoped task list (add/toggle/delete with priority chips, dark/light
themed, shared TopNav). It is a **placeholder** pending a full-bleed vitals/OS
redesign.

- Route: `/health`
- Shell: shared TopNav + padded main column (not FULLSCREEN yet)
- State: uses the cross-space `tasks` collection in the root store (filtered by `space === "health"`)
- Theme: inherits Workout/Kaizen obsidian-gold by default

## Planned v1.0 theme (not yet implemented)
Medical / vitals-signs OS aesthetic:
- Deep navy + EKG-green `#10b981` + blood-red `#ef4444` + white `#f8fafc`
- Live EKG trace SVG across the top
- Tiles for HRV, resting HR, water, sleep hours/quality, steps, supplements, mood, nutrition log
- 30-day trend sparklines
- Full-screen (FULLSCREEN flag) when built out

## QA status
- `/health` returns 200 OK, renders SpaceTasks correctly, add/toggle/delete work via root store.
- No dedicated Health components, types, or theme yet.
