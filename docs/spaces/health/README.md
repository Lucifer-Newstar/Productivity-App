# Health space ❤️ — VITAL-SIGN OS

The **Health** space is Kaizen's non-exercise wellness tracker — nutrition,
hydration, sleep, physique, supplements, vitals, and mental wellness. It is
implemented as the full-bleed **VITAL-SIGN** OS with a deep two-way bridge to Workout. Version 1.1 completed Waves 1–9 and is merged into the stable baseline.

- **Brand color:** `#a3e635` (EKG lime-green)
- **Accent alerts:** blood-red `#ef4444`
- **Dark theme (VITAL-SIGN, default):** deep navy→black (`#0a1628 → #050a14 → #000`), live EKG SVG trace across top, circular gauge readouts, JetBrains Mono data, Chakra Petch/Space Grotesk headers, ICU monitor aesthetic.
- **Light theme (CLINIC):** sterile white/off-white (`#fafafa → #f1f5f9`), slate ink, lime accents, faint chart-grid paper background, soft shadows.
- **Routes (all FULLSCREEN):**
  - `/health` → TRIAGE (daily dashboard + health score)
  - `/health/nutrition` → FUEL
  - `/health/hydration` → HYDRATION
  - `/health/sleep` → SOMNIUM
  - `/health/physique` → SOMA (measurements, body fat, photos)
  - `/health/supplements` → APOTHECARY
  - `/health/vitals` → VITALS
  - `/health/mind` → MIND
  - `/health/sync` → SYNC LAB (profile + workout bridge)
  - `/health/reports` → REPORTS
- **Profile defaults (user):** 20yo male, Chennai TN India — tropical wet-dry
  climate (~70-80% RH, 35+°C 8 months/year); ICMR-aligned micronutrient targets
  flagging Vit D/B12/iron/zinc/calcium/omega-3 as at-risk per regional
  deficiency data; 130 Indian dishes pre-seeded in the food library.
- **State slice:** `health: HealthState` in the root React Context store, localStorage
  key `kaizen.health`, migration `migrateHealth`. Types in `lib/healthTypes.ts`.

## Status at a glance (post-Wave 9 — v1.1 feature-complete)

**Waves 8A–8G (2026-08-15)** added on top of the v1.0 base below:

- **FUEL:** IF ring clock (16:8/18:6/14:10/OMAD/custom + fast streak), macro rough
  sliders (always-100%) with Balanced/Cut/Bulk/Keto presets + gram target bars,
  auto top-20 frequent-foods library (pinnable), social/cheat/pre-WO/post-WO meal
  flags + guilt-reset, meal photos (dataURL), sugar-spike estimator (carb quality ×
  pairing), 7 sub-nutrient trackers vs ICMR/WHO targets, 6-axis micronutrient radar,
  vitamin/mineral RDA chips, antioxidant/probiotic/prebiotic counters, recipe
  storage + nutrition analyzer, 7×4 weekly meal planner with EXEC-day + meal-prep
  checkoffs, restaurant mode 🌏.
- **HYDRATION:** hourly sip pacing card, urine-color 8-shade self-check.
- **SOMNIUM:** sleep-bank weekly statement w/ trend, circadian consistency score +
  social-jetlag flag, dream tags + PIN lock, bedtime-procrastination logger, nap
  log (power/long), 30/90d sleep graph.
- **SOMA:** phase auto-detect (bulk/cut/maint/recomp) + override, muscle-gain/fat-loss
  estimators, rate monitors + INJURY RISK flag, water-weight + plateau detectors,
  body-comp pie, measurement goals + cadence planner, pump measurements, per-part
  sparklines, PR-at-same-BW tracker, lift↔measurement correlations, 90d overlay
  graph, strength-to-size + work-capacity/anabolic/cali indices, IPF weight-class,
  photo compare/slideshow/4-week reminder.
- **GLOBAL (TRIAGE):** quiet-hours nudge alerts, phase status banners, workout
  check-ins + soreness map, recovery-time estimator, PR celebration, energy
  balance, meal-effectiveness readout, health goals, competitions, habit-break log.

Full per-wave plan and completion notes: [`WAVES.md`](WAVES.md). QA: 458 unit
assertions green, 43/43 routes static, bugs H13/H14 found+fixed in the wave-9
sweep (see `docs/quality/bugs/BUGS.md`).

## Status at a glance (post-Wave 3, historical)

- **Docs:** ✅ FEATURES.md (257 features across 10 sections, this README, QA, ALGORITHMS)
- **Shell/components:** ✅ Wave 1 shipped — VITAL-SIGN/CLINIC themes, HealthShell, HealthHotkeys, EkgFlash, 10 FULLSCREEN routes
- **FUEL (Wave 2):** ✅ Meals timeline, 130-entry Indian food DB, macro donut, repeat-yesterday, manual add
- **HYDRATION (Wave 2):** ✅ 8-glass grid, 11 beverages with hydration coefficients, EFSA 400mg caffeine cap + post-4pm warning, electrolytes, undo
- **SOMNIUM (Wave 3):** ✅ Sleep log (bed/wake/quality/latency/wakeups/dream/hygiene), 14-day sleep bank, circadian anchors, bed/wake routine builders with adherence %, 7-night bar history
- **APOTHECARY (Wave 3):** ✅ 13-seed supplement stack, streaks + 30d adherence, 🇮🇳 deficiency risk badges (10 micronutrients, ICMR prevalence), sunlight log for Vit D
- **TRIAGE (Wave 3):** Live KPIs — BW/BMI/BMR/TDEE/water/protein/sleep bank/recovery/supp adherence/deficiency count
- **SOMA (Wave 4):** ✅ Navy BF% (metric men + women with hip, ±input guards), 24-site tape measurements (L/R limbs), LBM/fat mass auto, BMI + lifter caveat, WHtR central-adiposity flag, **S:W ratio tiers** (Beginner→Elite for Squat/Bench/Dead/OHP/Pull-up, pulling live PRs from Workout), bilateral asymmetry detector (≥1cm L/R flag), progress photos (webcam + upload, 9 angle tags, weight+BF stamped), 90-day BF% sparkline, measurement history.
- **Gender-aware Health (2026-08-21):** Female Navy BF% in Soma, ICMR iron 29mg when gender is female, optional cycle log on Profile Health and TRIAGE. Profile + Health now use obviously different male (VITALS, square, EKG green) vs female (CLINIC, rounded, rose) chrome. The other four space OSes are unchanged (ADR-009). Educational, not medical advice.
- **Standing weight (2026-08-21):** Set once on `/profile`. Workout `bodyweight` is the source of truth; BMI, TDEE, water, protein, Soma and Home intelligence keep using the latest value until it changes.
- **Workout bridge contract:** ✅ Documented (directional read-only pull,
  advisory push flags — see ALGORITHMS.md); bodyweight/sessions/PRs/readiness
  consumed live; sleep-debt/recovery/deload flags computed, deeper push wired in wave 7

## Implementation plan (9 waves)

1. **Wave 1 (shell):** types, store slice, migration, seeds, HealthShell, routes, nav, theme tokens, hotkeys.
2. **Wave 2 (food + water core):** meals timeline, macros sliders, food lib (Indian seeded), repeat-yesterday, 8-glass grid, dynamic water goal.
3. **Wave 3 (sleep + supps):** sleep log, sleep bank, routines, supplement log, deficiency badges.
4. **Wave 4 (physique core):** weight sync, Navy BF%, LBM, tape measurements, photo capture.
5. **Wave 5 (vitals + mind):** HR/BP, symptom log, mood/stress, burnout/overtraining flag.
6. **Wave 6 (reports):** timeline, weekly/monthly reports, CSV/JSON export.
7. **Wave 7 (workout bridge deep):** TDEE reverse-eng, pre/post-wo cards, S:W ratios, recovery score, sync toggles.
8. **Wave 8 (v1.1 niceties):** restaurant mode, recipes, meal planner, meal prep, advanced micros, bloodwork.
9. **Wave 9 (QA + polish):** bug sweep, tsc/next build/29+ route smoke, light-theme CLINIC pass, docs finalize, pre-merge QA → `main`.

## Workout ↔ Health bridge (summary)

| Direction | What | How |
|---|---|---|
| Health **reads** Workout | bodyweight (source of truth), sessions, cardio, PRs, readiness, routine focus | Store selectors — no mutation |
| Health **advises** Workout | hydration %, sleep debt, recovery score, injury flags, deload hints, TDEE cal target, supp markers | Advisory props/flags surfaced in Workout UI |
| Forbidden | Health mutating Workout collections directly; circular imports between healthAnalytics and workoutAnalytics | Enforced via code review |

Full contract table and all algorithms live in [`docs/reference/ALGORITHMS.md`](../../reference/ALGORITHMS.md).

## Theme detail — VITAL-SIGN (dark, default)

The visual language is "ICU patient monitor meets cyberpunk medical bay":

- Background: deep navy radial gradient, faint EKG grid (10px dotted)
- Primary: EKG lime `#10b981` / `#34d399` (active traces, healthy values)
- Alert: blood-red `#ef4444` / `#f87171` (warnings, debt, spikes)
- Trace: cyan `#06b6d4` (secondary pulses, sync lines)
- Text: white `#f8fafc`
- Gauges: circular SVG ring gauges for score tiles
- Signature transition: **EkgFlash** — horizontal lime pulse trace sweeping across the screen on route change (distinct from Forge's vertical amber HammerStrike, Career's cyan HudFlash, and Workout's katana SectionSlash)
- Typography: JetBrains Mono for all data/numerals (monospace for readability), Inter for body copy, Chakra Petch or Space Grotesk for display headers
- Sound: optional subtle "monitor blip" (off by default; WebAudio, no assets)

## Theme detail — CLINIC (light)

Sterile, calm, paper-chart feeling:

- Background: off-white `#fafafa → #f1f5f9` with very faint grey chart grid
- Primary: lime-green `#84cc16` for active data
- Alert: red `#dc2626` reserved only for actual warnings
- Typography: same fonts, darker weights
- No glow, no pulse animation by default (restful, non-alarm feel)

## Medical disclaimer

This is an **educational/awareness tool, not a medical device**. A permanent
footer/settings link states: "Educational tool. Not medical advice. Consult
qualified healthcare professionals for medical concerns." No feature claims
to diagnose or treat any condition.

## Sub-pages

- [FEATURES.md](FEATURES.md) — full 257-feature spec (the build checklist)
- [QA.md](QA.md) — per-wave QA checklist + known gaps
- [`docs/quality/bugs/BUGS.md`](../../quality/bugs/BUGS.md) — bugs found & fixed
- [`docs/reference/ALGORITHMS.md`](../../reference/ALGORITHMS.md) — all formulas + bridge contract
