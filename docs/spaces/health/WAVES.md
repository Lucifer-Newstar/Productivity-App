# Health OS — v1.1 wave plan (waves 8A–8G + 9)

Status after waves 1–7: **47/140 features done, 21 partial, 72 pending** (audit
2026-08-15 against the master feature list). The remaining work is split into
seven feature waves + one QA/merge wave. Work proceeds **one wave at a time**;
each wave ends with `tsc --noEmit` clean, `next build` all-static, QA script
green, and a conventional commit on the `health` branch.

Legend: 🆕 = new build · 🔁 = upgrade of a partial.

---

## Wave 8A — FUEL core UX (nutrition daily-driver)

The features a user touches every single day.

| # | Feature | Kind |
|---|---------|------|
| 1 | **Macro rough sliders** — 3 sliders (C/P/F %) that always sum to 100, mapped to logged kcal; live donut | 🔁 |
| 2 | Macro target presets — Balanced 40/30/30, Cut 30/40/30, Bulk 50/30/20, Keto 10/25/65, Custom; actual-vs-target bars | 🔁 |
| 3 | **Intermittent-fasting 24h ring clock** — eating window green / fasting blue, countdown to open/close | 🆕 |
| 4 | Fasting presets 16:8, 18:6, 14:10, OMAD, Custom + fast-streak counter | 🆕 |
| 5 | Social-meal checkbox UI (schema already exists) | 🔁 |
| 6 | Cheat-meal checkbox + reason tag (celebratory/stress/craving/social) + guilt-reset button | 🔁 |
| 7 | Meal photo attach (dataURL, camera/file) + gallery strip | 🆕 |
| 8 | **Custom food library** — auto top-20 most-frequent meals + pin; one-tap re-log | 🔁 |
| 9 | Hourly sip suggestion card in HYDRATION ("~250ml by 3pm" from gap since last log) | 🔁 |

## Wave 8B — FUEL nutrient depth

| # | Feature | Kind |
|---|---------|------|
| 1 | Per-day sub-nutrient trackers vs targets: fiber (30g), added sugar (<25g WHO), sodium (2300mg cap), cholesterol (300mg), sat-fat (<10% kcal), trans-fat (alert >0), omega-3 (500mg goal) | 🆕 |
| 2 | **Micronutrient awareness radar** — 6-axis SVG (Na/K/Mg/Fe/VitC/Ω-3), 1–10 sliders | 🆕 |
| 3 | Water-soluble vitamin quick-log (C, B1-B12) + fat-soluble (A/D/E/K) | 🆕 |
| 4 | Minerals quick-log (Ca/Mg/K/Zn/Fe/Se/Cu/Mn) with 🇮🇳 RDA chips | 🆕 |
| 5 | Antioxidant / probiotic / prebiotic food quick-logs (curd rice 🌏, turmeric 🌏) | 🆕 |
| 6 | **Sugar-Spike estimator** — carb quality × protein/fat pairing → Low/Med/High + nudge | 🆕 |

## Wave 8C — FUEL planning (recipes, planner, restaurant)

| # | Feature | Kind |
|---|---------|------|
| 1 | **Recipe storage** — ingredients, portions, kcal/macros per serving; log-from-recipe | 🆕 |
| 2 | Recipe nutrition analyzer — ingredients resolved against food DB → totals/serving | 🆕 |
| 3 | **Weekly meal planner** — 7×4 grid, "Execute day" copies to daily log | 🆕 |
| 4 | Meal-prep planner — check off when prepped, Sunday prep template | 🆕 |
| 5 | **Restaurant mode** — save meals per eatery (Saravana Bhavan, Murugan Idli…) 🌏, one-tap refill | 🆕 |

## Wave 8D — SOMNIUM + HYDRATION polish

| # | Feature | Kind |
|---|---------|------|
| 1 | Bedtime-procrastination logger (reason: scrolling/work/anxiety/gaming/social) | 🆕 |
| 2 | Sleep-bank weekly **statement** (hours slept vs needed, trend) | 🔁 |
| 3 | Dream journal tags (Lucid/Nightmare/Bizarre/Prophetic) + PIN lock | 🔁 |
| 4 | Nap log (power vs long, circadian note) | 🆕 |
| 5 | Sleep graph 30/90d | 🆕 |
| 6 | Urine-color self-check card (1–8 scale) + dehydration flag | 🆕 |
| 7 | Circadian consistency score (wake ±30min; social-jetlag flag) | 🆕 |

## Wave 8E — SOMA intelligence (body-comp detectors)

| # | Feature | Kind |
|---|---------|------|
| 1 | **Muscle-gain estimator** (weight↑ + waist stable/↓ + strength≥ → "+X kg likely lean") | 🆕 |
| 2 | **Fat-loss estimator** (weight↓ + strength stable/↑ → "−X kg likely fat") | 🆕 |
| 3 | Recomp / Bulk / Cut / Maintenance **auto-detection** + status banner + manual override | 🆕 |
| 4 | Bulk-rate (>0.75kg/wk) & cut-rate (>1kg/wk) warnings; rapid-loss + strength-drop → INJURY RISK | 🆕 |
| 5 | Water-weight detector (spike >1.5kg/day post-carbs/workout) | 🆕 |
| 6 | Plateau detector (4wk static measurements → routine-change nudge) | 🆕 |
| 7 | Measurement goals per body part + % progress bars | 🆕 |
| 8 | Measurement frequency planner (weekly/bi-weekly/monthly) + day reminder + consistency note | 🆕 |
| 9 | Pump-measurement log (post-workout vs baseline) + flexed-vs-relaxed toggle surfaced | 🔁 |
| 10 | Per-body-part progress sparkline charts | 🔁 |
| 11 | Muscle/Fat/Other pie (lean/fat/residual) | 🔁 |

## Wave 8F — SOMA × Workout correlation + photo tools

| # | Feature | Kind |
|---|---------|------|
| 1 | PR-at-same-weight tracker ("+20kg DL at same BW — pure strength") | 🆕 |
| 2 | Measurement ↔ PR correlation ("Bench +10kg, chest +2cm") | 🆕 |
| 3 | Performance-vs-bodycomp overlay graph (PRs + BW + BF% one timeline) | 🆕 |
| 4 | Weight-trend vs strength-trend overlay + targeted-measurement hints per workout day | 🆕 |
| 5 | Strength-to-size ratio per body part; weight-class visualizer; cali-skill vs BW difficulty | 🆕 |
| 6 | Work-capacity score, anabolic index, calisthenics strength index | 🆕 |
| 7 | Photo comparison (side-by-side any two) + slideshow + 4–6wk reminder + lighting/time consistency notes | 🔁 |
| 8 | Photo↔PR / photo↔workout / photo↔measurement links; before/after program pairs | 🆕 |

## Wave 8G — GLOBAL connections (check-ins, goals, alerts)

| # | Feature | Kind |
|---|---------|------|
| 1 | Workout energy / motivation / quality check-ins (pre+post 1–10) with sleep/food overlay | 🔁 |
| 2 | Muscle-soreness mapping post-workout | 🔁 |
| 3 | Recovery-time estimator (intensity + sleep + stress) | 🔁 |
| 4 | PR celebration ("New PR at BW X — ratio +Y%") | 🔁 |
| 5 | Health goal dashboard (set + track goals) | 🆕 |
| 6 | Energy-balance tracker (in vs out, auto from diet+workout) | 🔁 |
| 7 | Pre/post-workout meal effectiveness + macro-timing impact | 🆕 |
| 8 | Local nudge alerts ("no food in 5h", "no water in 4h", quiet hours) | 🆕 |
| 9 | Habit-break log (no-guilt reset) | 🔁 |
| 10 | Weight-class goal + competition tracking | 🆕 |
| 11 | Recomp/cutting/bulking status banners on TRIAGE | 🆕 |

## Wave 9 — QA, docs, merge

- Full QA sweep (unit script + route smoke + manual per-page checklists)
- CLINIC light-theme pass across all new UI
- `FEATURES.md` status column refresh (fix stale ❌s)
- `DATA-MODEL.md` / `ALGORITHMS.md` / per-space docs final sync
- Pre-merge review → merge `health` → `main`

---

### Ground rules (all waves)

- Types in `lib/healthTypes.ts`, math in `lib/healthAnalytics.ts` (pure,
  unit-testable), UI in `components/health/*`, migrations via `migrateHealth`.
- No circular imports between `healthAnalytics` and `workoutAnalytics`.
- Every new pure function gets cases in `frontend/scripts/qa-health.js`.
- Backend mirrors new collections under `/api/health/*` as they appear.
