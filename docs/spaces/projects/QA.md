# Projects space — QA

_Current regression baseline (2026-08-16): TypeScript, ESLint and production build pass on `entertainment`; all five Projects routes are included in the 39/39 HTTP smoke. Historical Wave 11 measurements below are retained for traceability._

## Build verification

```bash
cd frontend
npx tsc --noEmit   # ✅ zero errors (post BUG-001..005 fixes)
npm run build      # ✅ current Next 16 build; projects/* routes all ○
```

| Bug | Summary |
|---|---|
| BUG-001 | Custom kanban columns broke shipped semantics (stats/streaks/recurrence/burndown/line-through) — promoted `isDoneStatus()` + `effectiveCols()` to forgeUtils, threaded customStatuses everywhere, shipped to last col id |
| BUG-003 | Settings modal showed stale values on re-open — added re-sync `useEffect` |
| BUG-004 | Column delete mishandled shipped-column tasks — correctly remaps to new final col, clears `completedAt` when un-shipping |
| BUG-005 | Kanban/swimlane/TaskPanel grids hardcoded `grid-cols-5` — switched to `repeat(auto-fit, minmax(240px,1fr))` |

See [`../../bugs/BUGS.md`](../../quality/bugs/BUGS.md) for full root-cause notes.

Route sizes:

| Route | Size | First Load JS |
|---|---|---|
| `/projects` | 11.9 kB | 196 kB |
| `/projects/quarry` | 12.8 kB | 194 kB |
| `/projects/smelter` | 26.3 kB | 210 kB |
| `/projects/vault` | 8.11 kB | 189 kB |
| `/projects/p/[id]` | 15 kB | 199 kB |

Shared CSS: **14.7 kB**.

## HTTP smoke test (production build)

All five projects routes return **200 OK** with no error-boundary markers in the
rendered HTML (`Application error` / `Unhandled Runtime Error` / `Internal Server Error`):

| Route | Status | Body size | Error markers |
|---|---|---|---|
| `/projects` | 200 | 1821 B | 0 |
| `/projects/quarry` | 200 | 1835 B | 0 |
| `/projects/smelter` | 200 | 1915 B | 0 |
| `/projects/vault` | 200 | 1833 B | 0 |
| `/projects/p/<nonexistent>` | 200 | 1839 B | 0 (renders "Heat not found" skull) |
| `/projects/p/proj_demo1` | 200 | 1839 B | 0 (drilldown routes through client hydration) |

Drilldown for non-existent IDs shows the `<Skull/>` "Heat not found" fallback +
back link — no exception.

## Functional checklist (code-path verified)

### ForgeShell chrome
- [x] Left I-beam rail renders with 4 stenciled §01–§04 labels + 改善 mark + HEAT plate
- [x] Top beam 6 px hazard chevron stripe (135°) + "THE FORGE" in Bebas Neue
- [x] Semicircle SVG temperature gauge (animated arc driven by activeCount + tasksDue)
- [x] UTC clock ticking seconds (setInterval)
- [x] Rotating gears on the rail (CSS keyframes)
- [x] Diamond-plate exhaust footer
- [x] STRIKE button fires 14 amber sparks + ⌘K palette
- [x] Sun/Moon theme toggle swaps Foundry ↔ Drafting Room via ThemeProvider
- [x] Settings ⚙ modal: forgeName / sprintLengthDays / workStartHour / workEndHour all persisted through `updateForge({settings})`
- [x] Ember 🔊 soundscape toggle (WebAudio brown-noise + random crackle)
- [x] HammerStrike vertical amber sweep on route change
- [x] StatChip tiles read correct counts from state (active/shipped/tasksDue/blocked)

### Foundry (`/projects`)
- [x] Active/Cold/Shipped project grids render from `forge.projects`
- [x] Stat plates respect project-level fixed status (on-track/blocked/off-track/paused/done/dead)
- [x] ForgePulse satisfaction slider persists to `project.satisfactionLog`
- [x] VelocityPlate 8-week bar chart + linear-regression projection (uses `projectVelocity` helper)
- [x] ForgeCalendar 14-day grid with today marker / due / shipped
- [x] StreakStrip 84-day heat strip reads from `forge.streak.history`
- [x] WorkloadHeatmap (projects × 12 weeks)
- [x] ResourceHeatmap (projects × people/budget/equipment/software) with over-budget red
- [x] SkillGapAlerts fuzzy-matches project tags → career skills <4/10
- [x] WeeklyReviewLauncher (wins/learnings/next/distractions/mood/rating/hours)
- [x] Anvil.today panel — click checkbox ships/unships task to shipped column id (BUG-001)
- [x] Light Forge wizard (BLANK/SAAS/CONTENT/RESEARCH/BUILD templates)
- [x] STOKE FURNACE demo-seed button empty-state (builds 7 projects via buildForgeDemo)
- [x] Print stylesheet (`@media print`) strips chrome/animations

### Quarry (`/projects/quarry`)
- [x] 4 modes (KANBAN / SWIMLANES / EISENHOWER / EFFORT)
- [x] Default 5-col kanban renders (TO DO/FORGING/QUENCH/JAMMED/SHIPPED)
- [x] Custom columns manager: add/rename/remove/reset (COL button)
- [x] Last column = SHIPPED (colored green); moving to it sets `completedAt`
- [x] isDoneStatus() uses shared helper (BUG-001)
- [x] Toggle task ships to `shippedId()` (last custom col, not hardcoded `"done"`)
- [x] Checkbox toggles subtasks same way
- [x] Batch mode: select-many, move-to-col, P0-P3, TODAY/NEXT, MELT (delete)
- [x] Drag-and-drop HTML5 (onDragOver/onDrop on columns, draggable on cards)
- [x] Aging color (10 d amber, 21 d red)
- [x] Recurring task select (daily/weekly/biweekly/monthly); `spawnRecurrence()` on ship
- [x] TaskEditor expanded panel: notes/due/estimate/actual/priority/effort/impact/energy/focus/importance/urgency/difficulty/satisfaction/recurrence/tags/subtasks/stuck note/dependencies
- [x] Eisenhower quadrant (imp≥5 × urg≥5 buckets)
- [x] Effort × Impact scatter SVG (Quick Wins / Big Bets / Fillers / Thankless)
- [x] TODAY filter, ▶ NEXT filter, project filter
- [x] Pomodoro +🍅 button increments pomodoros + actualMins
- [x] Stuck (JAM) toggle moves to blocked
- [x] Clone button
- [x] CSV-adjacent UI (add block button in each column)

### Smelter (`/projects/smelter`)
- [x] All 31 tabs mount without error (15 core + 16 canvases)
- [x] Scratch / Decisions / SWOT / 5-Whys / Lessons / Retros / Pros-Cons / Scenarios / Ideas / Personas / Decision Matrix / Fishbone / Six Hats / SCAMPER
- [x] SPRINTS panel: create/start/close, SprintBurndown SVG (uses `isDoneStatus(status, customStatuses)`, BUG-001)
- [x] All 16 canvas tabs render (BMC/VPC/Lean/Porter/PESTEL/Stories/Affinity/BuyAFeature/Paired/Journey/Blueprint/EventStorm/Mindmap/Canvas/Wireframe/Voice)
- [x] ProjPicker dropdown filters each canvas by project (or global)
- [x] Smelter timer (GO/STOP/RESET mm:ss)
- [x] Backlog filter excludes shipped tasks (respects custom cols, BUG-001)

### Vault (`/projects/vault`)
- [x] SHIPPED / DEAD / COLD tabs
- [x] Shipped (p.status==="done"), Dead (p.status==="dead"), Cold (archived, non-terminal)
- [x] REHEAT button un-archives a project
- [x] JSON backup/restore (BACKUP downloads Blob; RESTORE accepts a file)
- [x] CSV task export/import (TASK↓/TASK↑) — RFC 4180 parser, codename resolution, dedupe
- [x] CSV project export/import (PROJ↓/PROJ↑)

### ProjectDrill (`/projects/p/[id]`)
- [x] Hero plate with icon, codename, health stamp
- [x] SHIP IT / KILL / REHEAT buttons (SHIP marks p.status="done" + completedAt + archive)
- [x] Portfolio bridge → Career (push to case-study vault)
- [x] 6 tabs: Brief, Crew, Risks, Ops, Tasks, Post-mortem
- [x] Task mini-kanban uses `effectiveCols(customStatuses)` (BUG-001)
- [x] Gantt mini-chart SVG for dated milestones
- [x] Resource summary gauges, budget over-budget red
- [x] Stakeholder power × interest SVG matrix
- [x] Stakeholder comms log
- [x] Risk register (probability/impact/mitigation/contingency/status)
- [x] Premortem 5-failure-mode table (≤5 rows)
- [x] Weekly status report generator
- [x] Slip gauge (critical-path-lite)
- [x] Obituary auto-created on KILL

### Data layer
- [x] `_applyStreak` uses `isDoneStatus(t.status, next.customStatuses)` (BUG-001)
- [x] `logForgeAction` appends to auditLog, capped 500
- [x] `migrateForge` backfills missing collections + fills settings defaults
- [x] `buildForgeDemo` returns 7 projects, tasks, 2 sprints, 2 reviews, 5-day streak

### Hotkeys (ForgeHotkeys)
- [x] `?` → help overlay
- [x] `g 1/2/3/4` → Foundry/Quarry/Smelter/Vault
- [x] `n` → new task (STRIKE composer)
- [x] `⌘K` / `Ctrl-K` → command palette
- [x] `t` → jump to today
- [x] `Esc` → close modal
- [x] Ignored while typing in `input/textarea/select/contenteditable`

## Known v1.2 items (not regressions)
See [`../../bugs/BUGS.md`](../../quality/bugs/BUGS.md) "Deferred" list.
