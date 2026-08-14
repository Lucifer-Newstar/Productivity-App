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

---

## BUG-H01 — Hydration quick-add buttons didn't select active beverage
- **Found:** 2026-08-14 (Wave 1+2 QA on `health` branch)
- **Severity:** Low-Med — cosmetic + UX (quick-add tile didn't highlight, custom LOG button always logged water).
- **Affected:** `components/health/HydrationSection.tsx`
- **Root cause:** The quick-add beverage grid rendered with `background: bev===b.id` but `bev` state was initialised to `"water"` and never updated when a tile was clicked; only `addQuickDrink(b.id)` fired. Visual highlight always stayed on Water, and the "LOG X ml" button always logged water regardless of which tile you'd last pressed.
- **Fix:** Quick-add `onClick` now calls `setBev(b.id)` before `addQuickDrink(b.id)`, so the clicked beverage becomes the active selection for custom-ml logging and the highlight follows.

## BUG-H02 — Hydration totalMl used non-null assertion on beverage lookup (potential crash)
- **Found:** 2026-08-14 (Wave 2 QA)
- **Severity:** Medium — could crash hydration page if legacy/malformed localStorage contained an unknown beverage id.
- **Affected:** `components/health/HydrationSection.tsx`
- **Root cause:** `totalMl` reduce did `BEVERAGES.find(b=>b.id===e.beverage)!.net` — the `!` non-null assertion would throw if a beverage was missing from the lookup table (e.g. old data, imported data, alcohol opt-out edge case).
- **Fix:** Built a `bevById` lookup map memoized once, replaced `!.net` with `netFor()` helper that falls back to `0.85` for unknown beverages. Removed the other `!` assertions in favor of safe lookups.

## BUG-H03 — Repeat-Yesterday copied meals with spread bug (array overwritten into object)
- **Found:** 2026-08-14 (Wave 2 QA)
- **Severity:** High — repeat-yesterday would corrupt meals state and drop entries.
- **Affected:** `components/health/FuelSection.tsx`
- **Root cause:** `return { meals: [...otherDays.filter(...), ...copied] }` — `copied` is an array, so spreading it into an object literal turned the array into an indexed object (`{0: ..., 1: ...}`) that would break downstream filters expecting `MealEntry[]`.
- **Fix:** Rewrote to filter out today's existing meals first (`keep = h.meals.filter(m => m.date !== today)`), then simply `{ meals: [...keep, ...copied] }` where `copied` is an array — correctly spread into the new array. Also removed a redundant double-filter and replaced bare `alert()` with `window.alert()` to be explicit.

## BUG-H04 — Fuel TDEE target was a wrong inline formula
- **Found:** 2026-08-14 (Wave 2 QA)
- **Severity:** Low — displayed target kcal on the Fuel summary was a nonsense inline expression.
- **Affected:** `components/health/FuelSection.tsx`
- **Root cause:** Placeholder code `Math.round(bw * (10 + 6.25*1.75/70*100 - 5*20 + 5) * 1.55)` was a TODO stub that didn't use profile values.
- **Fix:** Imported `tdee()` from `healthAnalytics.ts` and compute with `tdee(latestBw, health.profile)` which honours the user's age/height/gender/activity level. Summary line now reads "X kcal / Y kcal target".

### Wave 2 QA verification
- **TypeScript** clean (`tsc --noEmit`).
- **43/43 routes ○ static** in `next build`.
- **38/38 HTTP 200, 0 error-boundary markers** via `/tmp/smoke.sh`.
- **98 unit assertions** in `scripts/qa-health.js` (BMR/Katch/TDEE/water/BMI/Navy BF/formulas, food DB invariants [90 dishes, no dupes, all macros present, 48 essential dishes present], type/store wiring, page presence, hotkey guards, theme tokens, disclaimer, IST timestamps, bridge toggles, FULLSCREEN flag) — ALL GREEN.
- **No console.log/debug** in `components/health/`.
- Beverage alcohol gate respects `settings.alcoholOptIn`.
- Food DB macro-kcal drift only on beer/whiskey (alcohol kcal don't map to C/P/F — expected, within tolerance).

---

## BUG-H05 — `recoveryScore` returned inflated values (0.5) with zero sleep history
- **Found:** 2026-08-14 (Wave 3 QA — mock-data run)
- **Severity:** Medium — fresh-install users would see 50/100 recovery with zero data, which is misleading.
- **Affected:** `lib/healthAnalytics.ts :: recoveryScore()`
- **Root cause:** Composite formula was `0.5*lastScore + 0.3*bankNorm + 0.2*hydrationPct/100`. When there were no sleep entries, `last` was `undefined` → `sleepScore(undefined)=0` (correct), but `computeSleepBank([],ideal)=0` → `bankNorm=1` (because "no debt" is interpreted as "fully banked"). New users with zero data saw 0.3 + hydration% and triage would display a bogus recovery number.
- **Fix:** Added an early return: if `sleepEntries.length === 0` OR after sorting `last` is missing, return 0. This makes triage correctly show "no data yet" for recovery until the first sleep log exists. Empty state in Somnium directs the user to log their first night.
- **Files:** `lib/healthAnalytics.ts`.

## BUG-H06 — Sleep datetime-local round-trip used naive `new Date(str)` parsing
- **Found:** 2026-08-14 (Wave 3 QA — code review)
- **Severity:** Low — works fine in browsers (which parse ISO-ish local strings as local time) but Node tests showed UTC tz mismatch. Documented IST-behaviour: `defaultLastNight()` uses `setHours(23,0,0,0)` which is local-time, and `toLocalInput()` converts ISO back via `getHours()/getMonth()/getFullYear()` (local getters) so round-trip is correct in the browser.
- **Root cause:** N/A — logic verified local in IST; `datetime-local` input values are always in the user's local TZ per spec.
- **Fix:** Code left as-is; added a comment noting the wake-date is UTC-slice, which is within ±30min of IST date and acceptable for v1. Wake times before 05:30 IST could land on the previous UTC date; edge case logged as v1.2 polish.

### Wave 3 QA verification (Somnium + Apothecary)
- **TypeScript** clean (`tsc --noEmit`).
- **42/42 routes ○ static** in `next build` (1 new page content surfaced: sleep + supps went from placeholders to full sections).
- **38/38 HTTP 200, 0 error-boundary markers** via `/tmp/smoke.sh`.
- **148 unit assertions** in `scripts/qa-health.js` — added 50 wave-3 tests covering: duration math, sleep bank (perfect/short/empty/capped), sleep score, hygiene score, avg sleep, routine adherence, supplement streaks/adherence, new types (SleepHygieneTick, CircadianEntry, BedtimeRoutine, SunlightEntry, MicronutrientId, DeficiencyBadge), seed stacks, migrations, component presence (Somnium/Apothecary sections, bank visual, hygiene checklist, circadian anchors, adherence %, debt warnings, deficiency badges, sunlight log, streaks), analytics exports (computeSleepBank/sleepScore/hygieneScore/routineAdherence/avgSleepHours/supplementStreaks/supplementAdherence/computeDeficiencyBadges/recoveryScore/shouldDeload/durationHours), triage surfacing of new KPIs, migrateHealth seeding of routines/circadian/sunlight.
- **29 mock-data scenario tests** in `/tmp/wave3-mock.mjs` covering empty-state badges, ideal-week badges, sleep bank edges (empty/short/14-day-debt/caps), recovery score (empty/good/bad), deload hint, duration math across midnight, seed shapes (13 supps, 5+ bedtime steps, 4+ wake steps, 10 deficiency contexts), adherence/hygiene edge cases, streaks, avg sleep, bank floor at -20h.
- **No console.log/debug** in new components.
- **No `any` casts** or unsafe non-null assertions introduced.
- **Migrate health:** gracefully merges old `supplementDefs` with new seed defs (preserves user customs, adds missing seeds); defaults new collections (circadian/sunlight/routines) if absent; doesn't blow up on pre-wave3 localStorage.
- **India-specific:** deficiency prevalence data cited from ICMR/NIN 2019-2024 urban South India surveys (D3 76-90%, B12 40-50% vegetarians, iron ~30% young males, zinc ~25%, calcium ~40% below RDA, omega-3 <<250mg RDA, magnesium ~30% suboptimal). Badges default new users to vitD/omega3 "deficient" to prompt action (realistic given indoor-heavy college/gym life in Chennai).
- **Sunlight→D3 synthesis:** crude estimate (80 IU/min midday, capped at 3000 IU/wk) — explicitly labelled rough in UI; bloodwork ground truth comes in wave 8.


---

## BUG-H07 — Soma live-BF readout template-literal typo (caught at tsc)
- **Found:** 2026-08-14 (Wave 4 build)
- **Severity:** Build-breaking (TS1005)
- **Root cause:** Ternary inside a nested template literal backtick in the live-BF panel had a misplaced backtick after `+"55"` — JSX closed the template expression early causing a parse error.
- **Fix:** Rewrote the border string as `border:`1px solid ${...}:"var(--hlth-border-soft)"`` (single ternary inside the template literal).
- **Files:** `components/health/SomaSection.tsx`.

## BUG-H08 — Navy BF% formula could return NaN on invalid inputs (guarded)
- **Found:** 2026-08-14 (Wave 4 QA code review)
- **Severity:** Medium — typing bad values could produce NaN and break downstream LBM/fat calculations.
- **Root cause:** `Math.log10(waist-neck)` is -Infinity/NaN when waist ≤ neck or inputs are zero/NaN, producing nonsensical BF% values.
- **Fix:** Added input guards at the top of `navyBF_m`/`navyBF_f`: returns 0 if `!(waistCm > neckCm)` or any input ≤ 0. Clamp outputs to [3,50] for men and [8,55] for women.
- **Files:** `lib/healthAnalytics.ts`.

### Wave 4 QA verification (Soma — body composition)
- **TypeScript** clean.
- **42/42 routes ○ static**; `/health/physique` 6.78 kB / 187 kB First Load JS.
- **38/38 smoke PASS.**
- **183 unit assertions** in `scripts/qa-health.js` (added 35 wave-4 tests covering Navy BF formula + guards, LBM/fatMass, BMI category + lifter caveat, strength-class tiering for 5 lifts, WHtR categories, asymmetry threshold, latestMeasurement, currentBfPct cached-or-computed, PROGRESS_PHOTO_LABELS, SomaSection PR pulls / webcam capture / photo tags / photos[] state shape, migrate photos default).
- **28 mock-data scenarios** in `/tmp/wave4-mock.mjs` covering BF% edge cases, LBM/fat math, BMI categories, strength classes, WHtR, asymmetries, measurement sorting, BF cache precedence, photo labels, seed preservation, empty-state shape, Katch BMR.
- **No console.log/debug** in `SomaSection.tsx`.
- **Camera:** `getUserMedia` with `facingMode:"user"`; graceful fallback to file upload on permission denial.
- **S:W ratios** correctly map w-squat/w-bench/w-dead/w-ohp/w-pullup; kg lifts use estimated1RM; pull-up uses raw reps.
- **Triage** extended with BF% + asymmetry KPIs; §04 marked ✓ in section status.
- **Lifter BMI caveat** fires automatically on overweight+ categories.
- **Asymmetry flag** in live form shows red warning with offending site(s) + diff in cm before save.
- **Progress photos** capped at 200 entries; webcam preview mirrored via CSS `scaleX(-1)`; EXIF orientation deferred to v1.2.


---

## BUG-H09 — Unquoted CSS property `inline-block` in MindSection (caught at tsc)
- **Found:** 2026-08-14 (Wave 5 build)
- **Severity:** Build-breaking (TS2322/TS2304/TS2552)
- **Root cause:** JSX inline-style `style={{display:inline-block,...}}` used the bare identifier `inline-block` which JSX parsed as `inline minus block`, producing "Cannot find name 'inline' / 'block'" errors and assigning a number to the CSS `display` field.
- **Fix:** Quoted as `"inline-block"` with `as any` cast to satisfy React's CSSProperties `Display` union.
- **Files:** `components/health/MindSection.tsx`.

## BUG-H10 — Triage referenced `burnout.label` (field didn't exist)
- **Found:** 2026-08-14 (Wave 5 build)
- **Severity:** Build-breaking (TS2339)
- **Root cause:** Initially wrote `<b>{burnout.label}</b>` but BurnoutResult has `level/score/color/signals`, no `label`.
- **Fix:** Simplified to show `"WATCH"`/warning state using `burnout.level.toUpperCase()` signal text.
- **Files:** `pages/health/index.tsx`.

### Wave 5 QA verification (Vitals + Mind)
- **TypeScript** clean (`tsc --noEmit`).
- **42/42 routes ○ static**; `/health/vitals` 7.77 kB / 189 kB First Load JS; `/health/mind` 7.6 kB / 189 kB.
- **38/38 smoke PASS.**
- **276 unit assertions** in `scripts/qa-health.js` (added 93 wave-5 tests covering AHA 2024 BP categories, fever/SpO2/RHR thresholds, orthostatic test bands, avgRhr, burnout heuristic (fresh/fried/deload/exam-week profiles), active injury filtering, shoulder restriction hint, new types (SymptomEntry/IllnessEpisode/InjuryEntry/MedicationEntry/AllergyEntry/OrthostaticTest/JournalEntry with gratitude+meditationMin), new collections on HealthState + migrateHealth defaults, presence of VitalsSection/MindSection and their feature chips (BP classification, fever flag, symptoms, illness/injury/meds/allergies/orthostatic, crisis helplines with correct numbers — Vandrevala 1860-2662-345, iCall 9152987821, NIMHANS 080-46110007, AASRA 9820466726), mood sliders for all 6 axes, gratitude, meditation, burnout banner, journal, trend chart), and triage wave-5 KPIs.
- **13 mock-data scenarios** in `/tmp/wave5-mock.mjs` covering healthy baseline, Chennai summer dehydration (orthostatic +22 = elevated), pre-workout stim (135/85 = stage 1 expected per AHA), viral fever (HR+temp warnings), hypertensive crisis (≥180/120), hypoxia SpO₂ 91, athlete RHR 42, pathological brady 36, plus 5 burnout profiles (well-rested → overtraining). All pass.
- **No console.log/debug** in `VitalsSection.tsx` / `MindSection.tsx`.
- **AHA 2024 BP bands:** Normal <120/<80; Elevated 120-129/<80; Stage 1 130-139/80-89; Stage 2 ≥140/≥90; Crisis ≥180/≥120. Fever ≥38°C warn, ≥40°C emergency, <35.5°C hypothermia. SpO₂ <94% warn. RHR ≥100 or <40 warn. Orthostatic +13 mild, +20 elevated, +30 high.
- **Burnout heuristic** (weights: sleep debt ≥10h=2 / ≥5h=1, RHR Δ≥8=2 / ≥5=1, mood ≤3=2 / ≤4=1, (energy+focus)/2 ≤4=1, libido ≤1.5=2 / ≤2.5=1, active severity≥3 injury=1) → 0-1 ok, 2-3 watch, 4-5 warn, ≥6 overtraining. Fried 14d@5h + RHR spike + mood 2 + libido 1 + knee injury scores 10/10 = overtraining.
- **India crisis helplines** panel always visible on Mind page with tap-to-call `tel:` links; includes note that 112 is immediate-emergency number.
- **Injury restriction hints** category-sensitive: shoulder → avoid overhead, knee → avoid deep squats/heavy leg press, back → avoid heavy deadlifts/rounding, elbow → avoid weighted chin/dips, wrist → avoid push-ups/OHP without wraps, ankle → avoid heavy calf/running.

---

## BUG-H11 — QA script `const bad` redeclared (wave 7 test block collided with wave 3 `bad=[]` short-sleep fixture)
- **Found:** 2026-08-14 (Wave 7 tsc/QA run pre-commit)
- **Severity:** QA-blocking (SyntaxError at script load — no tests could run)
- **Root cause:** Wave 3 test block declared `const bad=[]` as a 7-night short-sleep array (line 178). Wave 7 inline `pwa()` test block reused the identifier `const bad = pwa({...})` and `const clear = pwa({...})` at lines 671/673 — `const` redeclaration in the same script scope threw `SyntaxError: Identifier 'bad' has already been declared` on `node scripts/qa-health.js`.
- **Fix:** Renamed wave 7 fixtures to `pwaClear` and `pwaBad`.
- **Files:** `frontend/scripts/qa-health.js`.

## BUG-H12 — Unused lucide icon imports left after wave 7 edits (cosmetic)
- **Found:** 2026-08-14 (code review pass)
- **Severity:** Cosmetic (build ignores via `ignoreDuringBuilds`, no runtime impact)
- **Root cause:** During wave 7 bridge wiring, `Droplet/Moon/Activity` were imported in `OverviewContent.tsx` and `TrendingUp/TrendingDown/classifyTemp` in `ReportsSection.tsx` for planned mini-stats that got moved inline. They were never referenced.
- **Fix:** Removed unused icon/function imports from both files.
- **Files:** `frontend/components/workout/OverviewContent.tsx`, `frontend/components/health/ReportsSection.tsx`.
