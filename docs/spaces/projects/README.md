# Projects space (a.k.a. "Forge") ⚒️

The **Projects** space lives at `/projects/*`. In the UI it is branded **"Forge"**
(⚒️ in the top nav, "THE FORGE" wordmark, foundry/anvil/quarry/smelter/vault
wording). That is display branding only — it is one of the five Kaizen spaces,
not a standalone app.

## Routes

All five routes opt into **FULLSCREEN** (`Page.fullScreen = true`) so `_app.tsx`
skips `TopNav` and paints edge-to-edge via `ForgeShell`. All routes prerender
statically (○) in `next build`.

| Path | Mounts | Purpose |
|---|---|---|
| `/projects` | `FoundrySection` | Command center: pulse, velocity, calendar, workload heatmap, resource heatmap, skill-gap alerts, streaks, weekly review, light-forge wizard |
| `/projects/quarry` | `QuarrySection` | Task board — KANBAN / SWIMLANES / EISENHOWER / EFFORT modes + runtime custom columns + batch ops + recurrence + subtasks |
| `/projects/smelter` | `SmelterSection` | Think-tank: 15 core tabs + 16 strategy canvases = 31 tabs |
| `/projects/vault` | `VaultSection` | Archive (Shipped/Dead/Cold) + CSV (tasks **and** projects) + JSON backup/restore |
| `/projects/p/[id]` | `ProjectDrill` | Single-project deep-dive: slip gauge (CPM-lite), resource gauges, task kanban, burndown, skill-bump on SHIP, post-mortem, portfolio bridge |

## File map

```
frontend/
├── components/forge/
│   ├── ForgePage.tsx        # FULLSCREEN wrapper: HammerStrike + ForgeHotkeys + ForgeShell
│   ├── ForgeShell.tsx       # Chrome: I-beam rail, hazard beam, temp gauge, UTC clock,
│   │                        #         gears, diamond-plate footer, settings modal, ember audio
│   ├── ForgeHotkeys.tsx     # Global hotkeys: ? / g / n / ⌘K / t / Esc
│   ├── ActionNav.tsx        # STRIKE ⚡ button with spark particles + ⌘K palette
│   ├── ActionPanel.tsx      # §01–§04 quick-tile launcher
│   ├── forgeUtils.tsx       # Date helpers, statusColor, projectHealthColor, velocity
│   │                        # regression, isDoneStatus() [BUG-001 fix], effectiveCols(), DEFAULT_COLS
│   └── sections/
│       ├── FoundrySection.tsx
│       ├── QuarrySection.tsx
│       ├── SmelterSection.tsx
│       ├── Canvases.tsx          # All 16 strategy canvases (shared ProjPicker/BlockEditor)
│       ├── VaultSection.tsx
│       └── ProjectDrill.tsx
├── lib/
│   ├── forgeTypes.ts        # All domain types (40+ collections)
│   ├── forgeDemo.ts         # buildForgeDemo() — vivid seed dataset
│   └── store.tsx            # Zustand root — Forge sub-tree lives here
└── pages/projects/…         # Route entry points (5 files)
```

## Theme tokens

Two distinct visual modes — unique from Workout (imperial obsidian) and Career
(night-HUD / blueprint):

### Foundry (dark, default)
- Palette: deep iron radial `#0f0d0b → #080706 → #000`
- Accents: molten amber `#f59e0b`, hot-orange `#ea580c`, quench-cyan `#06b6d4`,
  blood-red `#ef4444`, steel `#94a3b8`, violet `#818cf8`, pink `#f472b6`
- Type: **Bebas Neue** (display), **JetBrains Mono** (data), **Special Elite** (stamps)
- Chrome: left I-beam rail (68 px) with rotating brass gears, stenciled vertical
  §01–§04 labels, 改善 mark, HEAT plate; 6 px 135° chevron hazard-stripe across the
  top beam; semicircle SVG temperature gauge with animated arc; chamfered steel
  plates (clip-path) with dashed weld-seam `::before` + pulsing rivets; diamond-plate
  exhaust footer.

### Drafting Room (light)
- Palette: yellowed vellum `#f3ecdd → #e8dec4 → #d9cba9`, brass grommets `#92400e`,
  burnt-orange `#c2410c` pencil
- Static 20/100 px drafting grid, rotated **APPROVED** stamps, Special Elite
  pencil type; footer `kaizen.forge // v1.1 — vellum`.

Toggle via the Sun/Moon in the top beam (reuses global `ThemeProvider`).

## Data contract

Forge state is a subtree of the global Zustand store under key `forge: ForgeState`.
The contract is four pieces (all in `lib/forgeTypes.ts` + `lib/store.tsx`):

1. **`ForgeState`** — typed shape for 40+ collections (projects, tasks, scratch,
   decisions, SWOT, pros/cons, scenarios, fiveWhys, lessons, retors, parking,
   pomodoros, personas, decisionMatrix, ideas, fishbones, sixHats, scamper, sprints,
   reviews, mindmaps, canvases, voiceNotes, bmc, vpc, lean, porter, pestel,
   userStories, eventStorms, journeyMaps, blueprints, wireframes, buyAFeature,
   paired, affinity, customStatuses, auditLog, streak, settings).
2. **`SEED_FORGE`** — empty-but-shaped defaults.
3. **`migrateForge(prev)`** — defensive hydration; merges seed with any stored
   state and backfills missing collections.
4. **`buildForgeDemo()`** — vivid demo dataset (7 projects, 5-day streak, 2
   sprints, 2 weekly reviews).

### Streaks & audit log
- `_applyStreak(setForge)` in `lib/store.tsx` updates `forge.streak` (current,
  longest, 365-day capped history) on any shipped task. Honours custom columns
  via `isDoneStatus(..., next.customStatuses)` (BUG-001 fix).
- `logForgeAction(action, target?, detail?)` appends to `forge.auditLog` (capped
  at 500 entries). Wired to project create, task ship/move, CSV import.

### Task statuses (important)
Tasks have a free-form string status id. When `customStatuses` has fewer than 2
entries we fall back to the default 5 columns: `todo / doing (FORGING) / review
(QUENCH) / blocked (JAMMED) / done (SHIPPED)`. When custom columns are present
the **last column is always "shipped"**. Use `isDoneStatus(status, customStatuses)`
from `components/forge/forgeUtils.tsx` — **never** compare `t.status === "done"`
directly (that's what BUG-001 fixed).

### Recurrence & skill-bump
- Setting `task.recurrence` (`daily | weekly | biweekly | monthly`) causes
  Quarry to `spawnRecurrence()` on ship — clones the task with an offset due date.
- Shipping a task fuzzy-matches its tags against Career skills → +0.5 proficiency
  (cap 10), adds a growth point, links `projectId`. SkillGapAlerts in the Foundry
  flag project tags that match no Career skill ≥ 4/10.

## Smelter tabs (31 total)

**Core (15):** Scratch · Decisions · SWOT · Pros/Cons · 5-Whys · Scenarios ·
Lessons · Retrospectives · Parking Lot · Pomodoros · Personas · Decision Matrix ·
Ideas · Fishbone · Six Hats · SCAMPER · Sprints · Reviews *(note: grouped under the
core rail — 15 think-tank tabs + SPRINTS + REVIEWS)*.

**Strategy canvases (16, all in `Canvases.tsx`):**
BMC · VPC · Lean Canvas · Porter's Five Forces · PESTEL · User Stories · Affinity
Grouping · Buy-a-Feature · Paired Comparison · Journey Map (with SVG satisfaction
polyline) · Service Blueprint (5 swimlanes) · Event Storming (4 sticky kinds) ·
Mindmap (radial tree, SVG connectors) · Free Canvas (24-px grid, sticky/box/dot/note)
· Wireframes (lo-fi screen cards) · Voice Notes (MediaRecorder, Blob URLs on
`window.__forgeVoice`, transcripts).

Shared helpers exported from Canvases: `ProjPicker`, `BlockEditor`, `SectionHeading`,
`EventAdder`.

## Shell niceties
- **HammerStrike** (ForgePage) — vertical amber sweep on nav.
- **Ember soundscape** 🔊 — WebAudio brown-noise + random crackle pops (no
  assets; fully offline).
- **Settings modal** (⚙ in rail): forge name, sprint length (days), work
  start/end hours.
- **UTC clock** in top beam (seconds ticker).
- **Temperature gauge** (semicircle SVG, animated arc breathing with activity).
- **STRIKE** ⚡ button — 14 amber spark particles, `⌘K` quick-find palette.

## Offline-first
- All state persists to `localStorage["kaizen.root"]` via Zustand.
- Backend routes under `/api/forge/*` exist but are intentionally **not wired** —
  the Projects space works fully offline.
- Voice-note Blobs are session-only (`window.__forgeVoice[id]` — Blob URLs can't
  cross reloads).

## Known v1.2+ scope (intentional deferrals)
- Storyboard canvas
- Full CPM float calculation (slip gauge exists but float is stubbed)
- Project comparison view
- Effort variance report
- Auto-Eisenhower filing (matrix exists but doesn't auto-file on create)
- Stakeholder ↔ `NetworkContact` picker UI (Career bridge)
- Drag-to-reposition in Mindmap / Free Canvas, drag-reorder of custom columns,
  true-DnD library on Kanban cards (native HTML5 today)
