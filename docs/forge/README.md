# Forge ⚒️ — PM-OS (Project Management Operating System)

> The Forge is Kaizen's dedicated **Projects/PM space** — a full-bleed, immersive
> industrial foundry (dark) / drafting-room vellum (light) application mounted at
> `/projects/*`. It is *not* a standalone app — it is one of five Spaces in the
> main Kaizen productivity monorepo (Forge · Workout · Career · Health ·
> Entertainment) and reuses the same `StoreProvider` + `ThemeProvider` root.

---

## 1. Routes & entry points

All five Forge routes opt into **FULLSCREEN** mode via `export { FULLSCREEN } from
"../../components/forge/ForgePage"`, which tells `_app.tsx` to skip `TopNav` and
paint edge-to-edge. `next build` renders every route as a **static page** (○).

| Path                        | Section mounted   | Purpose                                                                 |
| --------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `/projects`                 | `FoundrySection`  | Command center: pulse, velocity, calendar, workload heatmap, resource heatmap, skill gaps, streaks, weekly review, light-forge wizard |
| `/projects/quarry`          | `QuarrySection`   | Task board: kanban, swimlanes, eisenhower, effort matrix, custom columns, batch ops, recurrence, subtasks |
| `/projects/smelter`         | `SmelterSection`  | Think-tank: scratch · decisions · SWOT · pros/cons · 5-whys · scenarios · lessons · retors · parking · pomodoros · personas · decision matrix · ideas + 16 strategy canvases |
| `/projects/vault`           | `VaultSection`    | Archive + I/O: shipped, dead, cold storage, CSV (tasks + projects), JSON backup/restore |
| `/projects/p/[id]`          | `ProjectDrill`    | Single project deep-dive: slip gauge (CPM-lite), resource gauges, task list, burndown, skill-bump on ship |

The common shell (`ForgeShell`) is mounted by `ForgePage.tsx` for every route —
it draws the left I-beam rail, top hazard-stripe beam, temperature gauge, UTC
clock, gears, diamond-plate footer, settings modal, ember soundscape and
⌘K/ActionNav/ActionPanel chrome.

---

## 2. Theme tokens — Foundry (dark) & Drafting Room (light)

Forge has its own design language separate from Workout's imperial obsidian and
Career's night-HUD/blueprint.

### 2.1 Foundry (dark, default)

- Palette: deep iron radial `#0f0d0b → #080706 → #000`
- Accents: molten amber `#f59e0b`, hot-orange `#ea580c`, quench-cyan `#06b6d4`,
  blood-red `#ef4444`, steel `#94a3b8`, violet `#818cf8`, pink `#f472b6`
- Type: **Bebas Neue** (display / headings), **JetBrains Mono** (data / mono),
  **Special Elite** (stamps / labels)
- Chrome: left I-beam rail (68px) with rotating brass gears, stenciled vertical
  §01–§04 labels, 改善 mark, HEAT plate; top beam with 6px 135° chevron
  hazard-stripe; semicircle SVG temperature gauge with animated arc; chamfered
  steel plates (`clip-path`) with dashed `::before` weld seams and pulsing
  rivet dots; diamond-plate exhaust footer.

### 2.2 Drafting Room (light)

- Palette: yellowed vellum `#f3ecdd → #e8dec4 → #d9cba9`, brass grommets `#92400e`,
  burnt-orange `#c2410c` pencil
- Static 20/100 px drafting grid, rotated **APPROVED** rubber stamps, Special Elite
  pencil type, footer reads `kaizen.forge // v1.1 — vellum`.

Toggle via the Sun/Moon button in the top beam — stored in the global
`ThemeProvider` (Forge-specific mode is keyed off the global `theme`).

---

## 3. Architecture & file map

```
frontend/
├── lib/
│   ├── forgeTypes.ts         # All Forge domain types + SEED + migrateForge + buildForgeDemo types
│   ├── forgeUtils.tsx        # Date helpers, statusColor, projectHealthColor, velocity regression
│   ├── forgeDemo.ts          # Demo dataset builder (7 projects, 2 sprints, 5-day streak)
│   └── store.tsx             # Root Zustand store — Forge state + actions live here
│                               (logForgeAction, _applyStreak, setForge, CSV import, etc.)
├── components/forge/
│   ├── ForgePage.tsx         # FULLSCREEN=true wrapper; mounts HammerStrike + ForgeHotkeys + ForgeShell
│   ├── ForgeShell.tsx        # Chrome: rail, beam, gauge, clock, gears, footer, settings ⚙, ember audio
│   ├── ForgeHotkeys.tsx      # Global hotkeys (? / g / n / ⌘K / t / Esc)
│   ├── ActionNav.tsx         # STRIKE ⚡ button with spark particles; ⌘K quick-find
│   ├── ActionPanel.tsx       # §01–§04 quick-tile panel + quick-forge
│   └── sections/
│       ├── FoundrySection.tsx   # Command-center widgets
│       ├── QuarrySection.tsx    # Task board (4 modes + custom columns)
│       ├── SmelterSection.tsx   # Think-tank (15 core tabs + 16 canvases = 31 tabs total)
│       ├── Canvases.tsx         # All 16 canvas tabs (shared ProjPicker / BlockEditor / SectionHeading)
│       ├── VaultSection.tsx     # Archive + I/O (CSV + JSON)
│       └── ProjectDrill.tsx     # Single-project deep-dive
└── pages/projects/
    ├── index.tsx               # → FoundrySection
    ├── quarry.tsx              # → QuarrySection
    ├── smelter.tsx             # → SmelterSection
    ├── vault.tsx               # → VaultSection
    └── p/[id].tsx              # → ProjectDrill
```

---

## 4. State & data contract

Forge state is a single subtree of the global Zustand store (`lib/store.tsx`),
keyed `forge: ForgeState`. The contract is four pieces, all colocated:

1. **`ForgeState`** (`lib/forgeTypes.ts`) — typed shape for *every* collection:
   `projects`, `tasks`, `scratch`, `decisions`, `swot`, `proscons`, `scenarios`,
   `fiveWhys`, `lessons`, `retors`, `parking`, `pomodoros`, `personas`,
   `decisionMatrix`, `ideas`, `fishbones`, `sixHats`, `scamper`, `sprints`,
   `reviews`, `mindmaps`, `canvases`, `voiceNotes`, `bmc`, `vpc`, `lean`,
   `porter`, `pestel`, `userStories`, `eventStorms`, `journeyMaps`,
   `blueprints`, `wireframes`, `buyAFeature`, `paired`, `affinity`,
   `customStatuses`, `auditLog`, `streak`, `settings`.
2. **`SEED_FORGE`** — empty-but-shaped defaults for every collection (prevents
   undefined reads; used when the user first lands or clears data).
3. **`migrateForge(prev)`** — defensive migration that fills in any missing
   collections from `SEED_FORGE` and normalises legacy shapes. Runs on every
   store hydration.
4. **`buildForgeDemo()`** — builds a vivid seeded dataset so the app is useful
   on first load.

> ⚠️ `customStatuses` is a runtime-editable string map — column IDs are free-form
> strings (not TS-union), so all code that switches on status must treat it as
> `string` and use `isDoneStatus()` (last-col = shipped) instead of equality
> checks against `"done"`.

### 4.1 Streaks & audit log

- `_applyStreak(setForge)` wrapper updates `forge.streak` (current + longest +
  365-day capped history) on **every** shipped task.
- `logForgeAction(action, target?, detail?)` appends to `forge.auditLog`
  (capped at 500 entries). Wired to project create, task ship/move, CSV import.

### 4.2 Recurrence & skill-bump

- Setting `task.recurrence` (`daily|weekly|biweekly|monthly`) causes Quarry to
  spawn a cloned task with offset due date on SHIP (`spawnRecurrence`).
- Shipping a task fuzzy-matches its tags against the Career space's skills;
  hits get +0.5 proficiency (cap 10) + a growth point + projectId link. Skill
  gap alerts in the Foundry flag project tags that match no Career skill ≥ 4/10.

---

## 5. Smelter — 31 tabs total

The Smelter hosts two categories, switchable via the tab rail:

### 5.1 Core think-tank tabs (15)
Scratch · Decisions · SWOT · Pros/Cons · 5-Whys · Scenarios · Lessons · Retors ·
Parking Lot · Pomodoros · Personas · Decision Matrix · Ideas · Fishbone · Six
Hats · SCAMPER *(note: 16 in code but SCAMPER is grouped with the core ideation
set)*.

### 5.2 Strategy canvases (16, all in `Canvases.tsx`)

| # | Tab              | What it captures                                                                 |
|---|------------------|----------------------------------------------------------------------------------|
| 1 | BMC              | Business Model Canvas — 9 blocks (KP, KA, KR, VP, CR, CH, CS, C$, R$)            |
| 2 | VPC              | Value Proposition Canvas — customer jobs/pains/gains ↔ products/pain-killers/gain-creators |
| 3 | Lean Canvas     | Lean startup variant of BMC with problem/solution/unfair-advantage/metrics       |
| 4 | Porter           | Porter's Five Forces — threat-of-entrants/substitutes/buyer-power/supplier-power/rivalry |
| 5 | PESTEL           | Political / Economic / Social / Technological / Environmental / Legal            |
| 6 | User Stories     | Persona × as-a / I-want / so-that cards + acceptance criteria                    |
| 7 | Affinity         | Grouped sticky clusters for synthesis                                            |
| 8 | Buy-a-Feature    | Budget-constrained feature voting ($ pool, feature prices, purchases)            |
| 9 | Paired           | Pairwise comparison grid — auto-calculates win-ranks                             |
|10 | Journey Map      | AWARE/CONSIDER/DECIDE/USE/RETAIN stages with actions/thoughts/pains/opps + SVG satisfaction curve |
|11 | Service Blueprint| 5 swimlanes (CUSTOMER / ONSTAGE / BACKSTAGE / SUPPORT / EVIDENCE)                 |
|12 | Event Storming   | Sticky board: events (amber) / commands (cyan) / aggregates (violet) / policies (green) |
|13 | Mindmap          | Radial tree — click + to add child, inline rename, recursive delete, SVG connectors |
|14 | Free Canvas      | 24-px grid with stickies/boxes/dots/notes in 4 colors; hover-✕ to delete         |
|15 | Wireframe        | Per-screen cards with sketch placeholders (nav/hero/CTA/button) + Figma-link notes |
|16 | Voice Notes      | MediaRecorder mic integration: mm:ss timer, pulsing red dot, Blob URLs in `window.__forgeVoice`, inline player, transcript |

Shared helpers exported from `Canvases.tsx`:
- `ProjPicker` — project selector dropdown shared across all canvases
- `BlockEditor` — generic draggable text block with inline edit/delete
- `SectionHeading` — consistent Bebas-styled heading w/ accent bar
- `EventAdder` — the "+ event/command/aggregate/policy" adder used by Event Storming

---

## 6. Quarry — task board

Four view modes, all operating on the same `forge.tasks` collection:

- **Kanban** — BACKLOG / DOING / REVIEW / SHIPPED columns (or custom columns).
- **Swimlanes** — rows per project, columns per status.
- **Eisenhower** — urgent × important 2×2.
- **Effort** — effort × impact 2×2.

Custom columns are runtime-editable via the **COLUMNS** manager (add/rename/
remove/reset). `COLUMN_COLORS` provides a palette. Helper `isDoneStatus()`
returns true only for the **last** column id — that is what drives SHIP.
Batch-select, quick-move buttons, recurrence spawn, subtask indent, difficulty
slider, satisfaction picker all respect the active column set.

---

## 7. Foundry — command center

Widgets mounted on `/projects`:

- **ForgePulse** — aggregate KPI tiles (active projects, open tasks, ship-rate).
- **VelocityPlate** — last-N-weeks throughput with linear-regression trendline SVG.
- **ForgeCalendar** — 14-day compact calendar showing shipments/heat.
- **StreakStrip** — current day-streak with flame animation, longest-streak callout.
- **WorkloadHeatmap** — people × day task-load grid.
- **ResourceHeatmap** (wave 10) — projects × people/budget/equipment/software with
  over-budget red cells.
- **SkillGapAlerts** (wave 10) — fuzzy project tags → Career skills < 4/10.
- **WeeklyReviewLauncher** — kicks off a Sprint Review retro.
- **Light Forge wizard** — step-by-step project bootstrap.
- **StatChip** — reusable stat tile used everywhere.

---

## 8. Vault — archive & I/O

- Three tabs: **Shipped**, **Dead**, **Cold Storage**.
- **CSV I/O** for **both** tasks *and* projects (`projectsToCSV` / `csvToProjects`,
  `tasksToCSV` / `csvToTasks`) via PROJ↓/PROJ↑ and TASK↓/TASK↑ buttons. Project
  CSV headers: `id/codename/title/brief/why/status/priority/color/icon/createdAt/
  deadline/completedAt/tags/budget_est/budget_actual`.
- **JSON backup/restore** — full Forge-state round-trip.

---

## 9. Shell niceties

- **HammerStrike** (ForgePage) — vertical amber sweep animation on every nav.
- **ForgeHotkeys** — `?` help, `g` then 1/2/3/4 quick-nav, `n` new task, `⌘K`
  command palette, `t` today, `Esc` close modals.
- **Ember soundscape** (wave 10) — 🔊 toggle in the top beam generates WebAudio
  brown-noise + random crackle/pop embers (no assets, fully offline).
- **Settings ⚙ modal** — forge name, sprint length (days), work start/end hours.
- **UTC clock** — live seconds ticker in top beam.
- **Temperature gauge** — semicircle SVG with animated arc that breathes with
  activity.

---

## 10. Offline-first

- All Forge state lives in Zustand + `localStorage` (persisted by the root store).
- Backend routes under `/api/forge/*` exist but are intentionally **not wired**
  from the frontend — the PM-OS works fully offline.
- Voice-note Blobs are session-only (stored on `window.__forgeVoice`) — they do
  not persist across reloads (browser security restriction on Blob URLs).

---

## 11. Build & verification

From `frontend/`:

```bash
npx tsc --noEmit    # must be clean (zero errors)
npx next build     # 33/33 static (○) — all Forge routes pre-rendered
```

Shared CSS budget stays around **14.5–14.7 kB** (gzipped First Load JS for the
Smelter route ≈ 26 kB).

---

## 12. Known v1.x gaps (roadmap, not MVP)

- Full CPM float calculation (slip gauge exists but float is stubbed).
- Project comparison view.
- Effort variance report.
- Auto-Eisenhower (matrix view exists but doesn't auto-file on create).
- Stakeholder ↔ `NetworkContact` picker UI (Career integration).
- Drag-to-reposition in Mindmap & Free Canvas (currently click-to-place).
- Drag-drop column reorder + true-dnd on Kanban cards (native HTML5 only today).
- Storyboard canvas.

These are all intentional v1.2+ scope — v1.0 is feature-complete for the
committed waves (1–11).
