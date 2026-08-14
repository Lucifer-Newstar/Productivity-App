# Entertainment space 🎮

The **Entertainment** space currently renders `<SpaceTasks space="entertainment" />`
— a reusable scoped task list (add/toggle/delete with priority chips, shared
TopNav). It is a **placeholder** pending a full-bleed cinema / media-backlog
redesign.

- Route: `/entertainment`
- Shell: shared TopNav + padded main column (not FULLSCREEN yet)
- State: uses the cross-space `tasks` collection in the root store (filtered by `space === "entertainment"`)
- Theme: inherits Workout/Kaizen obsidian-gold by default

## Planned v1.0 theme (not yet implemented)
Film-noir / cinema neon aesthetic:
- Deep velvet/midnight background (`#0b0514`→`#000`)
- Magenta `#ec4899` + cyan `#22d3ee` neon marquee
- Marquee chaser lights at the top beam
- Watch / Listen / Read / Play queues with ratings, backlog, now-playing
- Card-style movie-poster / album-covers
- Full-screen (FULLSCREEN flag) when built out

## QA status
- `/entertainment` returns 200 OK, renders SpaceTasks correctly.
- No dedicated Entertainment components, types, or theme yet.
