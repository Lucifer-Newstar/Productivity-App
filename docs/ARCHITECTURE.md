# Architecture

Kaizen is a Next.js 14.2.15 (pinned, not Turbopack) monorepo-style app:

```
productivity-app/
├── frontend/                    # Next.js 14 (App Router + Pages Router)
│   ├── app/                     # App Router shell (home "/")
│   │   ├── page.tsx             # Dashboard w/ SideNav
│   │   ├── globals.css          # Tailwind layers + glass/card/chip/btn utilities
│   │   └── layout.tsx
│   ├── pages/                   # Pages Router — standalone space routes
│   │   ├── _app.tsx             # Custom App (providers; supports Page.fullScreen)
│   │   ├── workout/index.tsx    # Workout (full-screen immersive shell)
│   │   ├── career/              # Career (cyber-terminal dark / blueprint light)
│   │   ├── projects/            # Forge PM-OS (foundry dark / drafting-room light, FULLSCREEN)
│   │   │   ├── index.tsx        # Foundry (command center)
│   │   │   ├── quarry.tsx       # Task board (kanban/swimlanes/eisenhower/effort)
│   │   │   ├── smelter.tsx      # Think-tank (15 core tabs + 16 strategy canvases)
│   │   │   ├── vault.tsx        # Archive + CSV/JSON I/O
│   │   │   └── p/[id].tsx       # Single project deep-dive
│   │   ├── entertainment/       # Placeholder (SpaceTasks)
│   │   └── health/              # Placeholder (SpaceTasks)
│   ├── components/
│   │   ├── TopNav.tsx           # Cross-space top nav (Spaces, search, theme, avatar)
│   │   ├── SideNav.tsx          # Home-only left nav (Dashboard/Tasks/Pomodoro/...)
│   │   ├── workout/             # ALL workout UI lives here
│   │   │   ├── WorkoutShell.tsx         # Immersive rail+top+page-transition chrome
│   │   │   ├── ActiveWorkout.tsx        # One-thumb in-session screen
│   │   │   ├── MuscleHeatmap.tsx        # 89-region anatomical SVG
│   │   │   ├── body-muscles-data.ts     # Inlined SVG path data (Apache-2.0)
│   │   │   ├── Confetti.tsx             # Canvas particle burst
│   │   │   ├── WorkoutCalisthenics.tsx  # Chains/skills/GtG/iso/EMOM/AMRAP/flow/mobility
│   │   │   ├── WorkoutGym.tsx           # Plates/1RM/Wilks/warmup/history/metrics
│   │   │   ├── WorkoutCardio.tsx        # Run/bike/swim/row/jump-rope logging
│   │   │   ├── WorkoutGlobal.tsx        # Bodyweight/rest-timer/calendar/journal/challenges
│   │   │   ├── WorkoutPRs.tsx
│   │   │   ├── WorkoutSkills.tsx
│   │   │   ├── WorkoutExercises.tsx
│   │   │   └── WorkoutSchedule.tsx
│   │   └── career/...
│   │   └── forge/                # Forge PM-OS (all Forge UI)
│   │       ├── ForgePage.tsx     # FULLSCREEN wrapper (HammerStrike + hotkeys + shell)
│   │       ├── ForgeShell.tsx    # Rail + hazard beam + temp gauge + UTC clock + gears + footer + settings + ember audio
│   │       ├── ForgeHotkeys.tsx  # ? g n ⌘K t Esc
│   │       ├── ActionNav.tsx     # STRIKE ⚡ button (spark particles + ⌘K palette)
│   │       ├── ActionPanel.tsx   # §01–§04 quick-tile launcher
│   │       └── sections/
│   │           ├── FoundrySection.tsx
│   │           ├── QuarrySection.tsx
│   │           ├── SmelterSection.tsx
│   │           ├── Canvases.tsx           # All 16 strategy canvases
│   │           ├── VaultSection.tsx
│   │           └── ProjectDrill.tsx
│   └── lib/
│       ├── store.tsx            # Zustand root store — all 5 Spaces + forge sub-tree
│       ├── theme.tsx            # Dark/light (no-flash)
│       ├── types.ts             # Shared types (Task/Note/Space/SPACES + Workout + legacy Career re-exports)
│       ├── careerTypes.ts       # Career data model (jobs/skills/roadmaps/certs/portfolio/network/...)
│       ├── forgeTypes.ts        # Forge PM-OS domain types + ForgeState shape (40+ collections)
│       ├── forgeUtils.tsx       # Forge date helpers, statusColor, projectHealthColor, velocity regression
│       ├── forgeDemo.ts         # buildForgeDemo() — vivid seed dataset for first load
│       ├── workoutAnalytics.ts  # Pure math helpers (see ALGORITHMS.md)
│       └── workoutGym.ts        # Plates, Wilks 2020, DB↔BB, etc.
├── backend/                     # REST API skeleton (Express)
│   ├── src/
│   │   └── server.ts
│   └── README.md
└── docs/                        # You are here
```

## Rendering model

- **App Router (`/`)** is the home dashboard with a `SideNav` switching views
  client-side.
- **Spaces** are standalone pages on the Pages Router (`/projects`, `/workout`,
  `/career`, `/entertainment`, `/health`), each with the shared `TopNav`.
- **FULLSCREEN pages** opt out of `TopNav` via the static `Page.fullScreen = true`
  flag (`_app.tsx` checks it):
  - `/workout/*` — `WorkoutShell` (imperial obsidian, rail + top-bar + ambient blobs).
  - `/projects/*` — `ForgeShell` v2 (industrial foundry, I-beam rail, hazard
    stripe, temp gauge, UTC clock, gears, diamond-plate footer, settings,
    ember soundscape).
  - Career has its own FULLSCREEN shells (night-HUD dark / blueprint light).
  Health & Entertainment still use the shared `SpaceTasks` stub + `TopNav` and
  are queued for full-bleed makeovers next.

## State management

- Single Zustand store (`lib/store.tsx`) with localStorage persistence
  (`"kaizen.root"`) and SSR-safe hydration:
  - First render returns the seed (matches SSR output).
  - `useEffect` hydrates from `localStorage` on mount.
  - Subsequent writes re-persist automatically.
- Seeds are built by builder functions (`buildWorkoutDemo`, `buildForgeDemo`,
  `buildCareerDemo`) anchored at `A = Date.now()` so relative dates stay
  stable within a page load and avoid hydration mismatches.
- Migration functions (`migrateCareer`, `migrateWorkout`, `migrateForge`) are
  applied on hydration to fill in missing collections with seed defaults and
  to normalise legacy shapes (e.g. old column names → new, missing fields on
  new canvas types).
- The root store exposes typed actions for every space; Forge additionally
  exposes `logForgeAction(action, target?, detail?)` (audit log, capped 500)
  and a `_applyStreak(setForge)` wrapper that updates daily streaks on any
  shipped task.

## Theme

- Dark mode is default; Workout forces dark at its root, Forge/Career each
  respond to the global theme but ship two distinct visual languages:
  - Workout: imperial obsidian (`#0a0709`) + crimson `#b91c1c` + emperor gold
    `#d4af37` (Cinzel/Cormorant/Shippori Mincho; GoldenDragon 改善+善 kanji;
    katana slashes, crown, damascus/grille/k-blade).
  - Career dark ("Night HUD"): deep navy→black radial (`#0a1624→#05080d→#02050a`),
    animated cyan grid, scanlines, sweep beam, cyan/indigo/acid-green/pink/
    orange/yellow/violet accents, JetBrains Mono, `USR::K` seal.
  - Career light ("Blueprint"): cream blueprint paper (`#f5f1e6→#ebe4d0→#ddd3ba`),
    static blue grid, deep cyan-blue `#0c4a6e` ink, burnt-orange pencil.
  - Forge dark ("Foundry"): deep iron (`#0f0d0b→#080706→#000`), molten amber
    `#f59e0b`, hot-orange `#ea580c`, quench-cyan `#06b6d4`, blood-red `#ef4444`,
    steel `#94a3b8`, violet `#818cf8`, pink `#f472b6`; Bebas Neue headings;
    I-beam rail, hazard chevron, temp gauge, diamond-plate footer.
  - Forge light ("Drafting Room"): yellowed vellum (`#f3ecdd→#e8dec4→#d9cba9`),
    brass grommets `#92400e`, burnt-orange pencil, 20/100 px grid, APPROVED stamps.
- Accent palette is defined in `tailwind.config.js` + per-space CSS variables.
- `ThemeProvider` reads `kaizen.theme` from localStorage and sets `.dark` on
  `<html>` before paint to avoid flashes.

## Animation

- Framer Motion `layoutId` is used for sliding pills (nav, tabs).
- `AnimatePresence` wraps section content for the fade/slide/scale page
  transition (0.28 s, cubic-bezier 0.22, 1, 0.36, 1).
- Ambient mesh blobs in WorkoutShell float slowly (18–22 s loops) using keyframe
  animations.

## Persistence & keys

| localStorage key          | Shape                          |
|---------------------------|--------------------------------|
| `kaizen.root`             | `RootState` (all 5 Spaces) — consolidated root |
| `kaizen.theme`            | `"dark" \| "light"`            |

Older per-space keys (`kaizen.tasks`, `kaizen.notes`, `kaizen.career`,
`kaizen.workout`, `prod.*`) are swept/migrated into `kaizen.root` on mount.

`sessionStorage`:
- `kaizen.bw.ack` — ISO date of last weigh-in acknowledgement (suppresses
  the daily bodyweight popup until tomorrow).

In-memory only (not persisted):
- `window.__forgeVoice: Record<string, string>` — Blob object URLs for the
  current session's voice notes (Blob URLs can't cross reloads).

## Git

- `main` — stable base.
- `career` — career feature branch (merged in past).
- `workout` — workout feature branch (merged in past).
- `projects` — Forge PM-OS (merged into `main` at v1.0; see docs/forge/).
- All commits authored as `Lucifer-Newstar <navin.jairam@gmail.com>` (enforced
  via `-c user.name/email` on every commit). No remote is configured
  (`fatal: 'origin' does not appear to be a git repository`) — repo is
  local-only by design.

## Backend

The backend is a minimal Express skeleton providing REST endpoints for the
workout domain. It runs on port 4000, uses an in-memory store by default (so
the frontend can run against it without a DB setup), and documents every
route in `backend/README.md`. Long-term, swapping in SQLite/Prisma/Postgres
is a drop-in — the handlers are pure functions over a repository interface.
