# Bugs & Fixes Log

Each entry captures a bug found during QA sweeps, the root cause, the fix, and the date.

---

## BUG-001 — Custom kanban columns broke "shipped" semantics
- **Found:** 2026-08-14 (v1.0 QA pass)
- **Severity:** High — affected stats, streaks, recurrence, visual state, sprint burndown, Foundry chip counts, ProjectDrill counts, Smelter backlog, and Vault archive.
- **Affected:** `/projects/quarry`, `/projects`, `/projects/p/[id]`, `/projects/smelter`, `/projects/vault`, `lib/store.tsx` streak logic.
- **Symptom:** When a user created custom kanban columns (COL manager in Quarry), tasks moved to the final "shipped" column were not counted as shipped by the rest of the app — daily streaks wouldn't fire, the "shipped" counts on Foundry / ForgeShell stat tiles would under-report, SprintBurndown would skip them, line-through styling was missing, recurrence clones wouldn't spawn on ship, and the Smelter backlog filter treated them as still-open.
- **Root cause:** `isDoneStatus()` helper existed **only** as a local closure inside `QuarrySection.tsx`. Every other file hardcoded `t.status === "done"`. The "done" id is only correct for the default 5-col set; when custom columns are active the shipped column id is a `col-xxxx` string. Also, checkbox toggles hardcoded the target as `"done"` when flipping a task to shipped.
- **Fix:**
  1. Promoted `isDoneStatus(status, customStatuses?)` and `effectiveCols(customStatuses?)` to `components/forge/forgeUtils.tsx`. The helper defaults to the 5-col set when no custom columns are present, so all existing callers keep working. Added `DEFAULT_COLS` exported there as the single source of truth.
  2. Removed the duplicate local `isDoneStatus` from QuarrySection; the component now defines `isDoneStatus = (s) => isTaskDone(s, forge.customStatuses)` in its render scope.
  3. Added `shippedId()` helper in QuarrySection returning the effective last-column id (`"done"` or custom). All toggle-on buttons (task checkbox, subtask checkbox, EisenhowerView chip, inline subtask chip, Foundry anvil.today checkbox, ProjectDrill TaskPanel chip) now route to `shippedId()` instead of hardcoded `"done"`.
  4. Threaded `customStatuses` through: FoundrySection sub-components (ForgePulse, VelocityPlate, ForgeCalendar, WeeklyReviewLauncher, SkillGapAlerts, WorkloadHeatmap, ResourceHeatmap, StreakStrip) all read `forge.customStatuses` via their own `useStore()` call and use a shared `isDone` closure.
  5. SprintBurndown and SmelterSection sub-panels accept `customStatuses` as a prop from their parent.
  6. `_applyStreak` in `lib/store.tsx` now passes `next.customStatuses` to `isTaskDone`, so streak counting respects custom columns.
  7. Project-level status checks were **not** changed (project status is a fixed enum `on-track|blocked|off-track|paused|done|dead`), so the helper is only applied to `task.status`, never `project.status`.
- **Files changed:** `components/forge/forgeUtils.tsx`, `components/forge/ForgeShell.tsx`, `components/forge/sections/QuarrySection.tsx`, `components/forge/sections/FoundrySection.tsx`, `components/forge/sections/ProjectDrill.tsx`, `components/forge/sections/SmelterSection.tsx`, `lib/store.tsx`.
- **Verification:** `npx tsc --noEmit` clean; `npx next build` all 33 routes ○ static; manual toggle-to-custom-column flow verified in code path.

---

## BUG-002 — Malplaced import in `lib/store.tsx` from scripted edit
- **Found:** 2026-08-14 (during BUG-001 fix)
- **Severity:** Build-breaking (TS1003/TS1005/TS1109)
- **Root cause:** A naive import-inserter placed `import { isDoneStatus as isTaskDone }` in the middle of an `import type { ... } from "./forgeTypes"` block, breaking the multiline type import.
- **Fix:** Moved the value import **after** the type import closes; type imports stay grouped with their sibling type-only imports.
- **Verification:** `tsc --noEmit` clean.

---

## Notes on v1.0 QA pass (2026-08-14)

- **29/29 routes return HTTP 200** on `next start` (production build).
- **Zero runtime error boundaries** triggered ("Application error" / "Unhandled Runtime Error" / "Internal Server Error" markers all 0 in rendered HTML).
- **TypeScript** clean (`tsc --noEmit` = 0 errors).
- **All 5 `/projects/*` routes** statically prerendered (○) including `/projects/p/[id]`.
- **CSS budget** intact: shared CSS 14.7 kB; Smelter First Load JS 210 kB.
- **No broken relative imports** — automated resolver walk across `components/`+`lib/`+`pages/` found zero missing files.

### Deferred / v1.2 (not regressions, known scope)
- Full CPM float calculation (slip gauge exists, float is stubbed).
- Project comparison view.
- Effort variance report.
- Auto-Eisenhower (matrix view doesn't auto-file on create).
- Stakeholder ↔ NetworkContact picker.
- Drag-to-reposition in Mindmap / Free Canvas (click-to-place only, UI note says "v1.2").
- Drag-reorder of custom columns and full dnd on Kanban (HTML5 native today).
- Storyboard canvas.

---

## BUG-003 — Settings modal showed stale values when re-opened
- **Found:** 2026-08-14 (QA deep-dive)
- **Severity:** Medium (stale UI; could overwrite changed settings)
- **Affected:** `/projects/*` (ForgeShell settings ⚙ modal)
- **Symptom:** Local draft state (`sName/sLen/sStart/sEnd`) was initialised from `forge.settings` only in `useState` initialisers (first render). After opening the modal, editing, cancelling, then re-opening, the modal still showed the cancelled value.
- **Fix:** Added a `useEffect([settingsOpen, forge.settings])` that re-syncs local drafts from live `forge.settings` whenever the modal opens.
- **Files:** `components/forge/ForgeShell.tsx`.

## BUG-004 — Delete-column (COL manager) mishandled shipped-column deletion
- **Found:** 2026-08-14 (QA deep-dive)
- **Severity:** Medium (stale completion timestamps on un-shipped tasks; tasks lost their "done" state incorrectly)
- **Affected:** `/projects/quarry` column manager
- **Symptom:** Deleting the last (SHIPPED) column moved its tasks to `"done"` without ensuring `completedAt`; deleting a non-shipped column moved tasks to `"todo"` without clearing `completedAt`.
- **Fix:** Rewrote `removeColumn(id)` to: (1) if deleting the shipped column, remap tasks to the **new** final column (post-delete) and ensure `completedAt` is set; (2) for non-shipped deleted columns, move tasks to `"todo"` and clear `completedAt`.
- **Files:** `components/forge/sections/QuarrySection.tsx`.

## BUG-005 — Kanban/swimlane/ProjectDrill grids hardcoded `grid-cols-5`, broke with ≠5 custom columns
- **Found:** 2026-08-14 (QA deep-dive)
- **Severity:** Medium (layout breakage if user added/removed custom columns)
- **Affected:** `/projects/quarry` kanban + swimlanes, `/projects/p/[id]` task mini-kanban
- **Symptom:** Tailwind `grid-cols-5` forced exactly 5 equal columns; users with 3 or 7 custom columns got overflow/wrapping/squashed cards.
- **Fix:** Replaced hardcoded `grid-cols-5` / `lg:grid-cols-5` with responsive `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` (wraps naturally for any column count). Swimlanes uses `repeat(N, minmax(0,1fr))` where N = `COLS.length`.
- **Files:** `components/forge/sections/QuarrySection.tsx`, `components/forge/sections/ProjectDrill.tsx`.

---

## v1.0 QA deep-dive follow-up (2026-08-14)

After fixing BUG-001..005 the following were audited and passed:

- **29/29 routes HTTP 200** on production `next start`, zero error-boundary markers.
- **TypeScript** clean (`tsc --noEmit`).
- **33/33 routes ○ static** in `next build`; shared CSS still 14.7 kB; Smelter First Load JS 211 kB.
- **No broken relative imports** across `components/`+`lib/`+`pages/` (automated resolver walk).
- **No `console.log/debug` leftovers** in production code.
- **Hotkeys** correctly ignore typing in `input/textarea/select/contenteditable`.
- **Ember audio** cleans up `AudioContext` + buffer source + gain on toggle-off/unmount.
- **Voice notes** revoke Blob URLs on delete; stop mic tracks on stop; unmount effect calls `stop()`.
- **CSV parser** handles RFC-4180 quoted fields with commas and `""` escapes.
- **Settings modal** re-syncs from live store on open.
- **Custom columns** correctly drive shipped status, grid layout, delete-remap, stat counts, streaks, recurrence, SprintBurndown, Foundry chips, ProjectDrill task panel, and Smelter backlog.
- **Health & Entertainment placeholders** render SpaceTasks correctly through shared TopNav (no crash, 200 OK).

### Deferred / v1.2 (not regressions)
- Full CPM float calculation (slip gauge exists).
- Project comparison view, effort variance report.
- Auto-Eisenhower filing on create.
- Stakeholder ↔ `NetworkContact` picker UI.
- Drag-to-reposition in Mindmap/Free Canvas; drag-reorder of custom columns; true dnd on Kanban (native HTML5 today).
- Storyboard canvas.
- Health + Entertainment full-bleed theme builds (currently SpaceTasks placeholders).
