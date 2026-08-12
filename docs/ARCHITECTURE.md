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
│   │   ├── career/              # Career page
│   │   ├── projects/
│   │   ├── entertainment/
│   │   └── health/
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
│   └── lib/
│       ├── store.tsx            # React Context + localStorage hydration
│       ├── theme.tsx            # Dark/light (no-flash)
│       ├── types.ts             # All domain types (tasks, career, workout)
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
- `/workout` opts out of `TopNav` via the static `WorkoutPage.fullScreen = true`
  flag, which `_app.tsx` checks; it renders its own rail/top-bar/ambient-blob
  chrome in `WorkoutShell`. This is intentional — the workout page behaves
  like a native fitness app with its own navigation and one-thumb session UI.

## State management

- Single React Context store (`lib/store.tsx`) with `useLocalState` providing
  SSR-safe localStorage persistence:
  - First render returns the seed (matches SSR output).
  - `useEffect` hydrates from `localStorage` on mount.
  - Subsequent writes re-persist automatically.
- Seeds are module-level IIFEs anchored at `A = Date.now()` so that relative
  dates ("yesterday", "2 hours ago") are stable for a single page load but
  don't cause hydration mismatches.
- Migration functions (`migrateCareer`, `migrateWorkout`) are applied on
  hydration to handle schema changes (e.g. older `milestones` → `concepts`,
  new calisthenics/cardio/global state slices defaulting to seed values).

## Theme

- Dark mode is default; the workout page forces `dark` at its root.
- Accent palette is defined in `tailwind.config.js`: violet #8b5cf6, cyan
  #06b6d4, pink #ec4899, lime #a3e635, amber #f59e0b.
- `ThemeProvider` reads `kaizen.theme` from localStorage and sets `.dark` on
  `<html>` before paint to avoid flashes.

## Animation

- Framer Motion `layoutId` is used for sliding pills (nav, tabs).
- `AnimatePresence` wraps section content for the fade/slide/scale page
  transition (0.28 s, cubic-bezier 0.22, 1, 0.36, 1).
- Ambient mesh blobs in WorkoutShell float slowly (18–22 s loops) using keyframe
  animations.

## Persistence & keys

| localStorage key          | Shape                    |
|---------------------------|--------------------------|
| `kaizen.tasks`            | `Task[]`                 |
| `kaizen.notes`            | `Note[]`                 |
| `kaizen.career`           | `CareerState`            |
| `kaizen.workout`          | `WorkoutState` (entire)  |
| `kaizen.theme`            | `"dark" \| "light"`      |

`sessionStorage`:
- `kaizen.bw.ack` — ISO date of last weigh-in acknowledgement (suppresses
  the daily bodyweight popup until tomorrow).

Old keys (`prod.tasks`, `prod.notes`, etc.) are swept on mount.

## Git

- `main` — stable base.
- `career` — career feature branch.
- `workout` — active workout development.
- All commits authored as `Lucifer-Newstar <navin.jairam@gmail.com>` (enforced
  via `filter-branch` env-filter in the rebase that landed the immersive
  shell). Push with `--force-with-lease` after any history rewrite.

## Backend

The backend is a minimal Express skeleton providing REST endpoints for the
workout domain. It runs on port 4000, uses an in-memory store by default (so
the frontend can run against it without a DB setup), and documents every
route in `backend/README.md`. Long-term, swapping in SQLite/Prisma/Postgres
is a drop-in — the handlers are pure functions over a repository interface.
