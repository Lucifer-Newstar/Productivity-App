# Career space — QA

_Current regression baseline (2026-08-17): TypeScript, ESLint and production build pass on merged `main`; all Career routes are included in the 39/39 HTTP smoke. Historical module/build details below retain their original measurements._

## Theme
- **Night HUD (dark, default):** deep navy→black radial `#0a1624→#05080d→#02050a`, animated cyan grid, scanlines, sweep beam, vignette; cyan `#22d3ee` / violet `#a78bfa` / acid-green `#34d399` / pink `#f472b6` / orange `#fb923c` / yellow `#facc15` accents; JetBrains Mono; `> cmd_` terminal prompt; `USR::K` seal; HudFlash horizontal cyan transition.
- **Blueprint (light):** cream engineering-paper `#f5f1e6`, static two-layer blue grid (20 px + 100 px), deep cyan-blue `#0c4a6e` ink, burnt-orange `#c2410c` pencil marks, registration corners, Terminal icon, footer `kaizen.career // v2.0 — blueprint`.

## Routes

| Path | Sector |
|---|---|
| `/career` → redirect | `/career/projects` |
| `/career/projects` | SECTOR::09 Projects Hub (default landing) |
| `/career/roadmaps` | SECTOR::01 Roadmaps (template forge + parallel trackers) |
| `/career/skills` | SECTOR::02 Skills inventory |
| `/career/certs` | SECTOR::03 Certs & courses |
| `/career/network` | SECTOR::04 Network contacts |
| `/career/jobs` | SECTOR::05 Jobs campaign |
| `/career/portfolio` | SECTOR::06 Portfolio + resume builder |
| `/career/daily` | SECTOR::07 Daily workflow (standup, focus timer, meetings, mood, burnout) |
| `/career/command` | SECTOR::08 Global command (timeline, Maslach burnout, sabbatical, retirement, vision, side-hustles, IP, speaking) |

## Build verification (2026-08-14)

```
/career             517 B   163 kB
/career/projects    5.97 kB 187 kB
/career/roadmaps    14 kB   195 kB
/career/skills      7.78 kB 189 kB
/career/certs       4.46 kB 185 kB
/career/network     8.1 kB  189 kB
/career/jobs        8.05 kB 189 kB
/career/portfolio   9.31 kB 190 kB
/career/daily       8.23 kB 189 kB
/career/command     8.31 kB 189 kB
```

All routes ○ static. `tsc --noEmit` clean.

## HTTP smoke (production build)

| Route | Status | Error markers |
|---|---|---|
| `/career` | 200 | 0 |
| `/career/projects` | 200 | 0 |
| `/career/roadmaps` | 200 | 0 |
| `/career/skills` | 200 | 0 |
| `/career/certs` | 200 | 0 |
| `/career/network` | 200 | 0 |
| `/career/jobs` | 200 | 0 |
| `/career/portfolio` | 200 | 0 |
| `/career/daily` | 200 | 0 |
| `/career/command` | 200 | 0 |

No error boundaries triggered. Redirect from `/career` → `/career/projects` is a client-side `useRouter` push (renders command landing briefly; harmless).

## Feature status
See `docs/reference/FEATURES.md` § "Career Feature Status" for the per-sector checklist. All 9 sectors are shipped; remaining TODOs are niceties (drag-rank priority, global resources library, decay recommendation text, mind-map/force-graph).
