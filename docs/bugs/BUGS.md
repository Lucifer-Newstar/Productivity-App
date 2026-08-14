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
