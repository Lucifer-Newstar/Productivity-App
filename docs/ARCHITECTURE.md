# Architecture

Kaizen is a **Next.js 16.3.1** monorepo-style app (Pages Router + an App Router
home). It is a single codebase hosting 5 spaces — Workout, Projects (branded
"Forge" in UI), Career, Health ("VITAL-SIGN" medical OS), Entertainment —
not 5 separate apps.

```
productivity-app/
├── frontend/                      # Next.js frontend
│   ├── app/                       # App Router shell (home "/")
│   │   ├── page.tsx               # Dashboard w/ SideNav
│   │   ├── globals.css            # Tailwind layers + shared utilities (.steel-plate, .riv-tl/tr/bl/br, etc.)
│   │   └── layout.tsx
│   ├── pages/                     # Pages Router — all 5 space routes
│   │   ├── _app.tsx               # Custom App (providers; supports Page.fullScreen)
│   │   ├── _document.tsx          # (if present)
│   │   ├── projects/              # Projects space (Forge branding)
│   │   │   ├── index.tsx          # → FoundrySection
│   │   │   ├── quarry.tsx         # → QuarrySection (kanban + 4 modes)
│   │   │   ├── smelter.tsx        # → SmelterSection (31 tabs: 15 core + 16 canvases)
│   │   │   ├── vault.tsx          # → VaultSection (archive + CSV/JSON I/O)
│   │   │   └── p/[id].tsx         # → ProjectDrill (single-project deep-dive)
│   │   ├── workout/               # Workout space (12 routes)
│   │   ├── career/                # Career space (9 SECTORs)
│   │   ├── health/                # Health space (VITAL-SIGN OS; 10 routes under construction)
│   │   │   ├── index.tsx          # → TRIAGE dashboard
│   │   │   ├── nutrition.tsx      # → MessHallSection (meals, macros, fasting)
│   │   │   ├── hydration.tsx      # → HydrationSection
│   │   │   ├── sleep.tsx          # → SomniumSection
│   │   │   ├── physique.tsx       # → SomaSection (measurements, BF%, photos)
│   │   │   ├── supplements.tsx    # → ApothecarySection
│   │   │   ├── vitals.tsx         # → VitalsSection
│   │   │   ├── mind.tsx           # → MindSection
│   │   │   ├── sync.tsx           # → SyncLabSection (bridge + profile)
│   │   │   └── reports.tsx        # → ReportsSection
│   │   └── entertainment/         # AFTERGLOW media OS (full-screen, v1.0 Waves 0–9)
│   ├── components/
│   │   ├── TopNav.tsx             # Cross-space top nav (Spaces, search, theme, avatar)
│   │   ├── SideNav.tsx            # Home-only left nav (Dashboard/Tasks/Pomodoro/...)
│   │   ├── Dashboard.tsx / Tasks.tsx / Notes.tsx / Habits.tsx /
│   │   │   Pomodoro.tsx / Calendar.tsx / SpaceTasks.tsx   # home + shared components
│   │   ├── workout/               # Workout UI (WorkoutShell, ActiveWorkout, MuscleHeatmap, ...)
│   │   ├── career/                # Career UI (CareerShell, CareerFx, 9 SECTOR sections)
│   │   ├── health/                # Health UI (planned — see health branch)
│   │   │   ├── HealthPage.tsx     # FULLSCREEN wrapper (EkgFlash + HealthHotkeys + HealthShell)
│   │   │   ├── HealthShell.tsx    # EKG rail, vitals tiles, score gauge, clock, heart-trace footer
│   │   │   ├── HealthHotkeys.tsx  # ? / g / n / t / Esc
│   │   │   ├── healthUtils.ts     # Date helpers, Navy BF%, Mifflin/Katch BMR, TDEE, spike risk
│   │   │   ├── healthFoodDb.ts    # Seeded Indian food library (80+ dishes)
│   │   │   └── sections/          # Triage/MessHall/Hydration/Somnium/Soma/Apothecary/Vitals/Mind/SyncLab/Reports
│   │   └── forge/                 # Projects UI
│   │       ├── ForgePage.tsx      # FULLSCREEN wrapper (HammerStrike + ForgeHotkeys + ForgeShell)
│   │       ├── ForgeShell.tsx     # I-beam rail, hazard beam, temp gauge, UTC clock, gears,
│   │       │                      # diamond-plate footer, settings modal, ember audio
│   │       ├── ForgeHotkeys.tsx   # ? / g / n / ⌘K / t / Esc
│   │       ├── ActionNav.tsx      # STRIKE ⚡ (14 sparks + ⌘K palette)
│   │       ├── ActionPanel.tsx    # §01–§04 quick-tile launcher
│   │       ├── forgeUtils.tsx     # Date helpers, DEFAULT_COLS, isDoneStatus(), effectiveCols(),
│   │       │                      # statusColor, projectHealthColor, velocity regression
│   │       └── sections/
│   │           ├── FoundrySection.tsx
│   │           ├── QuarrySection.tsx
│   │           ├── SmelterSection.tsx
│   │           ├── Canvases.tsx   # All 16 strategy canvases
│   │           ├── VaultSection.tsx
│   │           └── ProjectDrill.tsx
│   └── lib/
│       ├── store.tsx              # Zustand root — all 5 spaces + forge sub-tree
│       ├── theme.tsx              # Dark/light (no-flash, persists kaizen.theme)
│       ├── types.ts               # Shared types (Task, Note, Space, SPACES, Workout re-exports)
│       ├── careerTypes.ts         # Career data model
│       ├── forgeTypes.ts          # Projects data model (40+ collections, ForgeState)
│       ├── forgeDemo.ts           # buildForgeDemo() — vivid first-load seed
│       ├── careerRoadmaps.ts      # Career roadmap templates (DevOps/Net/Linux/MLOps/Cloud)
│       ├── exerciseLibrary.ts     # Workout default exercises
│       ├── workoutAnalytics.ts    # Pure math (1RM, Wilks 2020, readiness scoring)
│       └── workoutGym.ts          # Plate math, DB↔BB, etc.
├── backend/                       # Express REST skeleton (in-memory; not called by frontend, offline-first)
└── docs/                          # You are here
```

## Rendering model
- **App Router (`/`)** — home dashboard with `SideNav` switching views client-side.
- **Spaces** live on the **Pages Router**. Non-FULLSCREEN pages get `TopNav` + a padded `max-w-[1600px]` main column. FULLSCREEN pages paint edge-to-edge with their own shell.
- **FULLSCREEN pages** set `Page.fullScreen = true`:
  - `/workout/*` — `WorkoutShell` (imperial obsidian; rail + top-bar + ambient blobs)
  - `/projects/*` — `ForgeShell` v2 (industrial foundry; I-beam rail, hazard stripe, temp gauge, UTC clock, gears, diamond-plate footer, settings, ember soundscape)
  - `/career/*` — `CareerShell` (night-HUD / blueprint dual themes with HudFlash transition)
  - `/health/*` — `HealthShell` (VITAL-SIGN: deep navy + EKG-green + blood-red; EKG trace, circular gauge readouts, ICU-monitor aesthetic; CLINIC light mode) — under construction on `health` branch.
  - `/entertainment` currently uses the shared `SpaceTasks` component through `TopNav` and is queued for a full-bleed cinema/neon redesign.

## State management
- **Zustand** root store in `lib/store.tsx` with localStorage persistence to `kaizen.root`. SSR-safe:
  - First render returns seed data (matches SSR output).
  - Mount effect hydrates from `localStorage`.
  - Subsequent writes re-persist automatically.
- Seeds are built by builder functions (`buildWorkoutDemo`, `buildForgeDemo`, `buildCareerDemo`) anchored at `A = Date.now()` so relative dates stay fresh per page load without hydration mismatches.
- Migrations (`migrateCareer`, `migrateWorkout`, `migrateForge`, `migrateHealth`) run on hydration to backfill missing collections with seed defaults and normalize legacy shapes.
- **Health ↔ Workout bridge:** Health reads bodyweight/sessions/cardio/PRs/readiness from Workout as source of truth (selectors, no mutation). Health pushes advisory flags (hydration warnings, sleep-debt nudges, recovery score, injury flags, deload hints) that Workout surfaces but does not enforce. See `docs/ALGORITHMS.md` §"Health ↔ Workout bridge contract" for the full directional table. Circular imports between health and workout analytics are forbidden; `healthAnalytics` may import workout utilities (Epley 1RM) but never the reverse.
- The root store exposes typed actions per space. The Projects space additionally:
  - `logForgeAction(action, target?, detail?)` — audit log, capped 500 entries.
  - `_applyStreak(setForge)` wrapper — increments `forge.streak` on any shipped task (uses `isDoneStatus(status, customStatuses)` to honour custom columns — see BUG-001).
- Career skill-bump fires automatically when a project is SHIPPed (fuzzy tag-match +0.5 prof, cap 10, +growth point, links `projectId`).

## Theme
Dark mode is default. Each FULLSCREEN space ships **two distinct visual languages** — nothing bleeds across spaces:

| Space | Dark | Light |
|---|---|---|
| Workout | Imperial obsidian `#0a0709` + crimson `#b91c1c` + emperor gold `#d4af37`; Cinzel/Cormorant/Shippori Mincho; kanji 改善+善; crown sigil; katana slashes; damascus/grille/k-blade; ambient mesh blobs | Parchment + burgundy + bronze |
| Career ("Night HUD") | Deep navy→black radial (`#0a1624→#05080d→#02050a`), animated cyan grid, scanlines, sweep beam, cyan/indigo/acid-green/pink/orange/yellow accents, JetBrains Mono, `USR::K` seal, HudFlash transitions | Blueprint paper `#f5f1e6→#ebe4d0→#ddd3ba`, static 2-layer blue grid, deep cyan-blue `#0c4a6e` ink, burnt-orange `#c2410c` pencil, registration corners, Terminal icon |
| Projects ("Forge", "Foundry") | Deep iron `#0f0d0b→#080706→#000` radial, molten amber `#f59e0b`, hot-orange `#ea580c`, quench-cyan `#06b6d4`, blood-red `#ef4444`, steel `#94a3b8`, violet `#818cf8`, pink `#f472b6`; Bebas Neue headings; I-beam rail, 6 px 135° chevron hazard stripe, temp gauge, diamond-plate footer, weld seams, rivets | Drafting Room: yellowed vellum `#f3ecdd→#e8dec4→#d9cba9`, brass grommets `#92400e`, burnt-orange `#c2410c` pencil, 20/100 px grid, rotated APPROVED stamps, Special Elite pencil type |
| Health ("VITAL-SIGN") | Deep navy→black (`#0a1628→#050a14→#000`), EKG lime-green `#10b981`/`#34d399` primary, blood-red `#ef4444`/`#f87171` alerts, cyan `#06b6d4` trace accents, white `#f8fafc` readouts; JetBrains Mono data, Chakra Petch/Space Grotesk headers; live EKG SVG top trace, circular gauge tiles, ICU monitor aesthetic | CLINIC: sterile white/off-white `#fafafa→#f1f5f9`, slate `#334155` ink, lime-green accents, faint chart-grid paper background, soft shadows, red reserved for alarms |

Non-FULLSCREEN pages (home, `/entertainment`) use the shared TopNav with an obsidian/parchment dual theme. (`/health/*` is FULLSCREEN VITAL-SIGN — all 10 routes set `Page.fullScreen = true` and paint edge-to-edge via `HealthShell`.)

`ThemeProvider` reads `kaizen.theme` from localStorage and sets `.dark` on `<html>` before paint.

## Animation
- Framer Motion `layoutId` for sliding pills (nav, tabs).
- `AnimatePresence` wraps section content for fade/slide/scale transitions.
- Each space has a signature page transition: Workout (section-slash katana), Career (HudFlash cyan sweep), Projects (HammerStrike vertical amber line + radial heat bloom), Health (EkgFlash horizontal lime-green pulse trace).
- CSS keyframes for: ambient mesh blobs (18–22 s), gear rotation, ember crackle, rivet pulse, gauge arc, stamp slam, spark spray.

## Persistence & keys

| localStorage key | Shape |
|---|---|
| `kaizen.root` | `RootState` (all 5 spaces, consolidated root) |
| `kaizen.theme` | `"dark" \| "light"` |
| `kaizen.habits` | Home-dashboard Habits[] (legacy, separate from root store) |
| `kaizen.bw.ack` | ISO date of last bodyweight acknowledgement (suppresses daily popup) |

Old per-space keys (`kaizen.tasks`, `kaizen.notes`, `kaizen.career`, `kaizen.workout`, `prod.*`) are swept/migrated into `kaizen.root` on mount.

In-memory only (not persisted):
- `window.__forgeVoice: Record<string, string>` — Blob object URLs for the current session's voice notes (Blob URLs can't survive reload; revoked on delete).

## Git
- `main` — stable. Feature branches (`projects`, `career`, `workout`) are merged in after explicit approval and kept as historical markers.
- Author: `Lucifer-Newstar <navin.jairam@gmail.com>` (enforced via `-c user.name/email` on every commit).
- **No remote configured** — repo is local-only.

## Backend
Minimal Express skeleton on port 4000 providing REST endpoints per domain. It is
**not wired to the frontend** — Kaizen is fully offline-first. Long-term,
SQLite/Prisma/Postgres is a drop-in because handlers are pure functions over a
repository interface.

## Build & verify

```bash
cd frontend
npx tsc --noEmit      # must be clean
npx next build        # all routes should be ○ static
```

Last-known-good (2026-08-14): 33/33 routes ○ static; shared CSS 14.7 kB; zero TS errors.
