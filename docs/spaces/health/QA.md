# Health Space QA

Last audited: 2026-08-14 (Wave 3 shipped on `health` branch).

## Current state

- `/health/*` routes live (10 FULLSCREEN routes): triage, fuel, hydration, somnium, soma, apothecary, vitals, mind, lab, reports.
- Wave 1 (shell) shipped: types, store slice (`kaizen.health`), VITAL-SIGN dark + CLINIC light themes, HealthShell with left rail + EKG trace, EkgFlash transition, HealthHotkeys (g-chord, t, ?), mounted-guard bootsplash.
- Wave 2 (fuel+hydration) shipped: meal timeline, 90-dish Indian food DB, manual quick-add, macro donut SVG, repeat-yesterday, TDEE target; 8-glass visual grid, 11 beverages with hydration coefficients, caffeine tally with EFSA 400mg cap + post-4pm sleep warning, electrolytes flag, undo, chronological log.
- Wave 3 (somnium+apothecary) shipped: sleep log (bed/wake datetimes with auto duration, quality 1-10, latency, wakeups, dream journal, 10-item hygiene checklist), 14-day rolling sleep bank (capped [-20h, +10h], 0.5× credit accrual), deload hint pushed to Workout at ≥10h debt; bedtime/wake routine builders (ordered checklists with per-step add/remove + adherence %); circadian zeitgeber anchors (first sun, first meal, caffeine cutoff, last meal, screen-off times); 13-seed supplement stack (whey, creatine, multivit, D3, B12, omega-3, magnesium, zinc, calcium, ashwagandha, pre-workout, EAA, probiotic) with quick-toggle tiles, streak counts, 30-day adherence %, custom add/remove; India-specific micronutrient deficiency badges (10 nutrients: D3, B12, iron, zinc, calcium, omega-3, magnesium, vitC, folate, potassium) computed from 7-day food+supp+sunlight intake with ICMR/NIN prevalence context; sunlight exposure log with time-of-day; recovery score 0-100 on triage (50% last-night + 30% bank + 20% hydration); triage KPI row extended with sleep bank, recovery, supp adherence, deficiency count.
- Lab (§08) is fully functional: profile editor (gender/age/height/activity/goal/climate mult/sleep/IF window/units/target weight) + 10 Workout bridge toggles.

## QA gates per wave

Each wave must satisfy before commit:

1. `cd frontend && ./node_modules/.bin/tsc --noEmit` — zero errors, strict mode.
2. `cd frontend && ./node_modules/.bin/next build` — all `/health/*` routes ○ static.
3. `/tmp/smoke.sh` extended for all routes — all 200, zero error-boundary markers.
4. Hydration guard: mount-flag pattern (mirrors Forge/Career/Workout), no `useLayoutEffect`/client-only code pre-mount.
5. localStorage: `migrateHealth()` idempotent; refresh doesn't double-seed or wipe data.
6. No `console.log`/`console.debug` leftovers.
7. Hotkeys respect input/textarea/select/contenteditable guard; chord timeout 1200ms.
8. Food picker modal: Esc closes, clicking backdrop closes, search works, servings multiplier respected.
9. Hydration 8-glass: click toggles/undos, glass size selector changes fill threshold.
10. Repeat-Yesterday: copies yesterday's meals with fresh IDs, doesn't double-count, doesn't corrupt other days.
11. Workout bridge: bodyweight reads from Workout (source of truth), no mutation of Workout state from Health.
12. India/Chennai defaults verified: climateMult 1.1, filter coffee 90mg/chai 40mg, coconut water as electrolyte, ICMR-aligned deficiency badges when implemented, IST timestamps.
13. Medical disclaimer visible in shell footer.
14. CLINIC light-theme pass before merge to main.

## Wave 1+2 QA (2026-08-14)

- [x] tsc strict: 0 errors
- [x] `next build`: 43/43 routes ○ static (10 health routes all static; heaviest `/health/nutrition` 184 kB, `/health/hydration` 180 kB)
- [x] Smoke test: **38/38 PASS, 0 FAIL**
- [x] Unit QA (`scripts/qa-health.js`): **98 assertions ALL GREEN**
  - BMR Mifflin-St Jeor male/female
  - Katch-McArdle BF%-based BMR
  - Dynamic water goal (weight × climate × workout adj)
  - TDEE activity multipliers
  - BMI categories
  - Navy body-fat (men, metric) formula
  - Protein target
  - Beverage hydration coefficients + caffeine content (filter coffee 90mg, chai 40mg)
  - Alcohol opt-in gate
  - Food DB: 90 entries, no duplicate IDs, all entries have kcal/carbs/protein/fat/category, 48 essential dishes present, macro/kcal drift within tolerance (only beer/whiskey drift because alcohol kcal ≠ C/P/F; expected)
  - WaterEntry.caffeineMg field exists, WaterBeverage includes alcohol, bridge toggles present
  - Store wiring (health slice, migrateHealth, updateHealth, kaizen.health key)
  - All 10 pages exist and wrap in HealthPage with FULLSCREEN=true
  - Hotkeys input guard present, g-chord arming present, `g h` → home
  - Both VITAL-SIGN dark and CLINIC light theme tokens present
  - Permanent medical disclaimer in footer, IST/Asia-Kolkata date display
  - Sync lab uses updateHealth and exposes bridge toggles + profile fields
  - No console.log/debug in health components
- [x] Bugs found and fixed (4) — see `docs/bugs/BUGS.md` BUG-H01..H04:
  - H01 quick-add tiles now set active beverage for custom LOG
  - H02 beverage lookup memoized with safe fallback (no `!` assertion crash)
  - H03 Repeat-Yesterday spread bug fixed (was corrupting meals array)
  - H04 Fuel TDEE target replaced with real `tdee()` import
- [x] Smoke-tested routes: /health, /health/nutrition, /health/hydration, /health/sync all render the correct section titles (TRIAGE, FUEL, HYDRATION, Lab/bridge)

## Wave 3 QA (2026-08-14) — Somnium + Apothecary

- [x] tsc strict: 0 errors
- [x] `next build`: **42/42 routes ○ static** (sleep 8.27 kB / 185 kB First Load JS, supplements 6.61 kB / 183 kB, triage 4.29 kB / 181 kB)
- [x] Smoke test: **38/38 PASS, 0 FAIL** (sleep + supplements no-longer-placeholder routes)
- [x] Unit QA (`scripts/qa-health.js`): **148 assertions ALL GREEN** (50 new for wave 3: duration math, sleep bank edges/perfect/short/capped, sleep score, hygiene score, avg sleep, routine adherence, supplement streaks/adherence, new types, seed stacks, migrations, component presence, analytics exports, triage KPIs)
- [x] Mock-data scenario tests (`/tmp/wave3-mock.mjs`, 29 scenarios): empty-state deficiency badges, ideal-week badges (fish+D3+sun clears D3/omega3 risk), sleep bank edges (empty/short/14-day/caps at ±20/+10), recovery score (empty/good/bad), deload hint trigger, duration across midnight, seed shapes, adherence/hygiene math, streak calc, bank floor at -20h.
- [x] Bugs found and fixed (2) — see `docs/bugs/BUGS.md` BUG-H05..H06:
  - H05 recoveryScore returned inflated 0.5 with zero sleep history → added early return 0 on empty.
  - H06 datetime-local round-trip logic verified (works in IST browsers; UTC-offset edge case documented for v1.2).
- [x] `migrateHealth()` updated to handle new collections (circadian, sunlight, bedtimeRoutine, wakeRoutine) and merge seed supplement defs with any user-added defs (no data loss on pre-wave3 localStorage).
- [x] No `console.log/debug` in new components.
- [x] Alcohol opt-in gate unchanged; no new unsafe non-null assertions.
- [x] India-specific micronutrient prevalence data cited from ICMR/NIN 2019-2024 surveys.
- [x] Seed defaults tuned for 20yo Chennai lifter (stack: creatine 5g morning, D3 1000IU, B12, omega-3 1g with dinner, magnesium glycinate 300mg night, ashwagandha 600mg night, whey post-WO; routines: 22:30-23:30 bedtime wind-down, 06:00-07:00 sunrise + hydration + creatine + mobility).
- [x] Permanent medical disclaimer remains visible in footer; deficiency badge section explicitly states "estimates, not diagnosis — get bloodwork".

## Backlog (pre-implementation)

- No backend sync (offline-first; `/api/health/*` stubs deferred to v1.2)
- Notifications (in-app gentle nudges only for v1, no push)
- No wearables/Bluetooth (manual entry only)
- Photo storage uses dataURL; IndexedDB migration in later wave for larger sets
- AI food photo recognition out of scope for v1
- Women's menstrual cycle hidden by default (male profile) but types exist
- Alcohol tracker opt-in (TN legal age 21; hidden by default)

## Wave 4 QA (2026-08-14) — Soma (physique)

- [x] tsc strict: 0 errors
- [x] `next build`: **42/42 routes ○ static** (`/health/physique` 6.78 kB / 187 kB)
- [x] Smoke test: **38/38 PASS, 0 FAIL**
- [x] Unit QA (`scripts/qa-health.js`): **183 assertions ALL GREEN** (+35 wave-4)
- [x] Mock-data scenarios (`/tmp/wave4-mock.mjs`): **28/28 PASS** — BF% edge cases, LBM/fat math, BMI tiers, strength classes for 5 lifts, WHtR, asymmetries, measurement sorting/cache-precedence, photo-label shapes, seed preservation, Katch BMR
- [x] Bugs found+fixed (2):
  - H07 template-literal typo in live-BF panel (backtick misplaced → TS1005; fixed)
  - H08 Navy BF% input-guards added (waist>neck, positive inputs, clamped output range)
- [x] Progress photo flow: file upload works, webcam uses facingMode:user with graceful fallback, tags 9 presets, photos persisted to `health.photos[]`, capped at 200 entries
- [x] S:W ratios pull live PRs (w-squat/w-bench/w-dead/w-ohp/w-pullup), kg lifts use estimated1RM, pullup uses raw reps; tiering Beginner/Novice/Intermediate/Advanced/Elite per ExRx/Kilgore/Rippetoe tables
- [x] Asymmetry detector flags ≥1.0cm L-R differences pre-save; pairs are Arms/Forearms/Thighs/Calves
- [x] Triage KPI row extended with BF% and asymmetry count tiles when data present; §04 marked ✓
