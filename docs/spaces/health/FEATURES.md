# Health OS (Vitals / VITAL-SIGN) — Feature Specification v1.0

Space color: `#a3e635` (EKG lime green) · Icon: ❤️ (stylised EKG heartbeat)
Theme codename: **VITAL-SIGN** (dark: deep navy + EKG green + blood red; light: sterile clinical white + slate + lime accents).
Profile context: 20yo male, Chennai TN, India (tropical wet-dry, ~70–80% RH year-round,
summer peaks 38–42 °C, NE monsoon Oct–Dec). All climate-specific and India-specific
features are flagged 🌏.

Health IS the single source of truth for **non-exercise** wellness data. It reads
exercise data from the Workout space (read-only join) and pushes derived metrics
(readiness/hydration/TDEE adjustments) back into Workout for smarter logging. Two-way
but governed: Health owns `nutrition/sleep/body/vitals/mind/biometrics`; Workout owns
`sets/PRs/sessions/volume`. A documented bridge contract appears in
[`ALGORITHMS.md`](#algorithms-contract-summary) and in `docs/ALGORITHMS.md`.

---

## Sections

| § | Codename     | Route                       | Status | Domain covered                                              |
|---|--------------|-----------------------------|--------|-------------------------------------------------------------|
| 0 | TRIAGE       | `/health`                   | ❌     | Daily triage dashboard — composite score, tiles, alerts     |
| 1 | FUEL    | `/health/nutrition`         | ❌     | Meals, macros, fasting, micronutrients, recipes, food lib   |
| 2 | HYDRATION    | `/health/hydration`         | ❌     | Water, caffeine, electrolytes, urine color, climate adj     |
| 3 | SOMNIUM      | `/health/sleep`             | ❌     | Sleep journal, debt bank, circadian rhythm, routines        |
| 4 | SOMA         | `/health/physique`          | ❌     | Measurements, body fat, photos, strength-to-weight, trends  |
| 5 | APOTHECARY   | `/health/supplements`       | ❌     | Supps stack, adherence, drug-interaction warnings, 🇮🇳 def.  |
| 6 | VITALS       | `/health/vitals`            | ❌     | Heart rate, HRV (manual entry), BP, temp, SpO2, symptoms    |
| 7 | MIND         | `/health/mind`              | ❌     | Mood, stress, energy, libido, anxiety, journal              |
| 8 | SYNC LAB     | `/health/sync`              | ❌     | Workout↔Health bridge controls, TDEE model, settings        |
| 9 | REPORTS      | `/health/reports`           | ❌     | Weekly/Monthly/Annual health reports, CSV export, timeline  |

Legend: ✅ = shipped, 🟡 = partial/MVP, ❌ = planned v1.0.

---

# §0 — TRIAGE (daily landing dashboard) `/health`

The first page a user hits. It's a vitals-signs OS in dark navy with a live EKG trace
across the top. Think ICU monitor meets cyberpunk.

| #  | Feature                                                                                 | Status |
|----|-----------------------------------------------------------------------------------------|--------|
| 01 | Live EKG SVG trace across top (animating heartbeat pulse when data logged today)        | ❌     |
| 02 | Daily Health Score composite 0–100 (Sleep + Nutrition + Hydration + Movement + Mind)    | ❌     |
| 03 | Triage stat tiles: SLEEP / CALORIES IN / MACROS / WATER / STEPS / READINESS             | ❌     |
| 04 | "What's next?" nudge panel (smart suggestions based on logged gaps)                     | ❌     |
| 05 | Quick-log row: +MEAL / +WATER / +SUPP / +MOOD / +WEIGHT (one-tap)                       | ❌     |
| 06 | Today timeline — chronological feed of all logged entries (vertical rail)               | ❌     |
| 07 | Active alerts panel (dehydration nudge, sleep debt high, missing supp)                  | ❌     |
| 08 | 7-day health-score sparkline (mini)                                                     | ❌     |
| 09 | Chennai climate widget (outdoor temp/humidity fetched if possible; hydration bump) 🌏   | ❌     |
| 10 | Workout bridge card: pulls today's planned/active workout from Workout space            | ❌     |
| 11 | Pre-workout checklist card (hydration, carbs, caffeine, sleep score)                    | ❌     |
| 12 | Post-workout recovery card (protein window, sleep projection, soreness prompt)          | ❌     |
| 13 | Streak badge (days with ≥5 data points logged)                                          | ❌     |

---

# §1 — FUEL (Nutrition &amp; Meals) `/health/nutrition`

Everything about food. Built with a lazy-20yo-lifter UX: don't require food-scale
precision. "Rough sliders" for macros, repeat-from-yesterday one-click, 20-item food
library saved from history, common South Indian meals pre-seeded.

| #  | Feature                                                                                 | Status | Notes |
|----|-----------------------------------------------------------------------------------------|--------|-------|
| 01 | Daily meals timeline — Breakfast / Lunch / Dinner / Snacks (any order, add/remove slots) | ❌     | |
| 02 | Per-meal: food name, kcal, meal time, photo attach (local, dataURL)                     | ❌     | |
| 03 | "Repeat yesterday" button — copies previous day's meals &amp; kcal in one tap             | ❌     | |
| 04 | "Repeat last week same day" button                                                      | ❌     | |
| 05 | Custom Food Library — 20 most-frequent meals auto-tracked, pinable                      | ❌     | Pick from dropdown to pre-fill kcal+macros |
| 06 | 🇮🇳 **Indian Food Database** — 80+ pre-seeded common dishes (idli, dosa, sambar rice, biryani, parotta, chappathi, kurma, pongal, poori, curd rice, lemon rice, rasam rice, chaat, chai/filter coffee, lassi, sweets, chicken 65, mutton curry, egg curry, fish curry, thali sets, etc.) with rough kcal+macros per serving | ❌ | 🌏 Chennai / TN essentials pre-seeded |
| 07 | **Restaurant Mode** — save meals from specific Chennai eateries (Saravana Bhavan, Murugan Idli, local messes, Domino's, KFC) with rough kcal 🌏 | ❌ | Next visit auto-fills |
| 08 | **Macro rough sliders** — 3 sliders (Carbs/Protein/Fats g) that auto-total to logged kcal. Drag one, the others readjust proportionally to kcal target | ❌ | Core "no food scale" UX |
| 09 | Macro pie/donut chart — actual vs target                                                | ❌     | |
| 10 | Macro target presets: Balanced (40/30/30), Cut (30/40/30), Bulk (50/30/20), Keto (10/25/65), Custom | ❌     | |
| 11 | Fiber target &amp; tracker (g) against goal (default 30g/day, ICMR)                       | ❌     | |
| 12 | Added sugar tracker (g) against WHO goal (&lt;25g/day)                                    | ❌     | |
| 13 | Sodium tracker (mg) against 2300 mg cap; warn &gt; 1500 mg with Chennai sweating note    | ❌     | 🌏 Electrolyte loss in sweat → need Na intake |
| 14 | Cholesterol tracker (mg, cap 300 mg)                                                    | ❌     | |
| 15 | Saturated fat tracker (g, cap &lt;10% kcal)                                               | ❌     | |
| 16 | Trans-fat tracker (g, alert on any &gt;0 from package foods)                              | ❌     | |
| 17 | **Omega-3 (EPA/DHA)** tracker (mg, goal 500+ mg/day) — flags need for fish/fish oil; extra importance for vegetarians 🌏 | ❌ | |
| 18 | **Micronutrient Awareness** radar (1-10 sliders) — Sodium, Potassium, Magnesium, Iron, Vit C, Omega-3 | ❌ | No food-scale precision; conscious awareness tool |
| 19 | Expanded micronutrient log (preset quick-add buttons with 🇮🇳 RDA targets): Iron (19mg), Calcium (1000mg), Zinc (12mg), Magnesium (400mg), Potassium (4700mg), Vit D (600IU), Vit B12 (2.4µg), Folate (400µg), Vit A, Vit C, Vit E, Vit K | ❌ | 🌏 Vit D, B12, Iron, Zinc flagged as common IN deficiencies per ICMR/NIN |
| 20 | Water-soluble vitamins tracker: C, B1, B2, B3, B5, B6, B7, B9, B12                      | ❌     | |
| 21 | Fat-soluble vitamins tracker: A, D, E, K                                                | ❌     | |
| 22 | Minerals tracker: Ca, Mg, K, Zn, Fe, Se, Cu, Mn                                         | ❌     | |
| 23 | Antioxidant tracker — berries/dark chocolate/green tea/turmeric/dark greens quick-log   | ❌     | 🌏 Turmeric = Indian dietary staple, track for awareness |
| 24 | Probiotic tracker — curd/yogurt, lassi, kefir, sauerkraut, kanji, pickles                | ❌     | 🌏 Curd rice / thayir sadam staple |
| 25 | Prebiotic tracker — onion, garlic, raw banana, leek, asparagus, oats, bananas            | ❌     | |
| 26 | **Intermittent Fasting timer/clock** — visual 24h ring with eating window colored green, fasting blue. Set start/end hours (default 12:00–20:00 = 16:8). Shows countdown to next meal or window close | ❌ | TRE 16/8 evidence-supported as fat-loss w/ muscle retention for trained young males (Moro 2016) |
| 27 | Fasting window presets: 16:8, 18:6, 14:10, OMAD 23:1, Custom                            | ❌     | |
| 28 | Fast-streak counter (consecutive days meeting window)                                   | ❌     | |
| 29 | **Sugar Spike Estimator** — per meal log Carb Quality (Simple / Complex / Mixed) + Protein/Fat pairing (none/some/high) → Low/Med/High spike risk score | ❌ | Uses glycemic-load heuristic, not medical grade |
| 30 | Glycemic awareness nudge: "Complex carb + protein = lower spike"                        | ❌     | |
| 31 | Social meal flag (ate with others checkbox) — mood/social correlation                   | ❌     | |
| 32 | Cheat meal flag + reason tag (celebratory / stress / craving / social)                  | ❌     | |
| 33 | Cheat-day guilt-reset button ("No guilt. Log it. Move on.")                              | ❌     | Psychology-first |
| 34 | **Recipe storage** — name, ingredients list, portions, prep time, kcal/macros/serving   | ❌     | Pick recipe from library → pre-fills meal entry |
| 35 | Recipe Nutrition Analyzer — paste ingredients+quantities → totals per serving (uses built-in food DB) | ❌ | |
| 36 | **Meal Prep Planner** — weekly view to plan meals, check off when prepped, prep-day template (Sunday common for students/workers) | ❌ | |
| 37 | Weekly Meal Planner — 7 days × 3–4 meals grid. "Execute" copies to today's daily log    | ❌     | |
| 38 | Meal-time-of-day analytics — shows which meals are most consistent/erratic              | ❌     | |
| 39 | **Calorie budget** — Surplus/Deficit vs TDEE (pulled dynamically from SYNC LAB engine)  | ❌     | |
| 40 | Auto-adjust TDEE on workout days (+calories from exercise volume via Workout bridge)    | ❌     | Workout sync |
| 41 | Pre-workout meal flag + post-workout meal flag; auto-assigns post-workout window (1-2h post) | ❌  | Workout sync |
| 42 | Pre-workout meal effectiveness tracker — logs perceived workout energy (1-10) correlating with pre-wo macros | ❌ | Workout sync |
| 43 | Post-workout meal timing tracker — did protein hit within 2h window                      | ❌     | Evidence: full-day protein dominates over "anabolic window" for trained lifters; tracker kept as awareness not prescription |
| 44 | Food photography attachment — local file storage (dataURL/IndexedDB); one-tap per meal   | ❌     | Offline-first |
| 45 | Photo timestamp + meal-tag; gallery view                                                | ❌     | |
| 46 | Calorie/Macro "weekly average" view (smoothes out day-to-day noise)                     | ❌     | |
| 47 | Macro timing overlay — shows macros distribution across day vs workout time              | ❌     | Workout sync |
| 48 | Digestive symptom log per meal (bloating / acidity / gas / none) 🌏                      | ❌     | Acidity/GERD common with spicy food schedules; useful pattern detection |
| 49 | Hunger scale 1-10 log before meal — awareness of satiety signals                        | ❌     | |
| 50 | Satiety scale 1-10 log 2h post-meal                                                     | ❌     | |

---

# §2 — HYDRATION (Water, Caffeine, Electrolytes) `/health/hydration`

Chennai makes hydration NON-NEGOTIABLE. 70-80% RH, 35+ °C 8 months/year = 1.5–2.5 L/hour
sweat loss during lifting, heavy sodium loss in sweat. Hard-coded climate multiplier
for Chennai region, but user-configurable.

| #  | Feature                                                                                 | Status | Notes |
|----|-----------------------------------------------------------------------------------------|--------|-------|
| 01 | 8-glass visual grid (click to fill blue, reset at midnight Chennai-time IST)            | ❌     | Default 250ml per glass; customize size |
| 02 | Water intake total (ml) with customizable daily goal (default computed: weight-based)   | ❌     | 35ml × weight kg baseline; +10% Chennai climate multiplier 🌏 |
| 03 | **Dynamic hydration target** — weight (kg) × 35ml + workout + climate multiplier        | ❌     | Algorithm: base 35ml/kg; +500ml per 30min cardio/resistance; +300ml if temp &gt;32°C; +200ml if humidity &gt;70% |
| 04 | Hourly sip suggestion card ("Drink ~250ml by 3pm" based on gap from last log)           | ❌     | |
| 05 | Beverage types logged separately: Water / Coconut water / Coffee / Tea / Juice / Soda / Sports drink / Milk / Lassi / Other 🌏 | ❌     | Hydration coefficients (coffee ~0.85 net, alcohol negative, etc.) |
| 06 | Net hydration tally (water − diuretic-adjusted)                                         | ❌     | |
| 07 | **Electrolyte toggle** per drink (did it contain electrolytes? coconut water = yes, ORS = yes, sports drink = yes) | ❌ | Critical for Chennai lifting |
| 08 | Electrolyte pill / ORS packet quick-log button                                          | ❌     | |
| 09 | Sweat-loss estimator for workouts (based on duration, HR, Chennai climate multiplier) → post-wo rehydration target 🌏 | ❌ | Workout sync |
| 10 | Pre/post-workout hydration check (pulls `hydrationPreMl`/`hydrationPostMl` from WorkoutSession) | ❌ | Workout sync — reads existing field |
| 11 | Caffeine tracker — mg per drink, daily total, half-life clock (5.7h half-life)         | ❌     | Pre-seeded: filter coffee ~90mg, chai ~40mg, espresso shot ~70mg, Red Bull ~80mg, pre-workout ~150-300mg |
| 12 | Caffeine cutoff warning — "Caffeine after 4pm may disturb sleep tonight"                | ❌     | |
| 13 | Daily caffeine cap warning (400mg = EFSA safe limit; alert at &gt;350mg)                 | ❌     | |
| 14 | Urine color self-check card (1-8 scale; pale yellow = good, dark = dehydrated)         | ❌     | Evidence-based self-monitor per WHO/EFSA |
| 15 | Hydration history chart (30-day) with workout-day overlay                               | ❌     | Workout sync |
| 16 | Streak for hitting water goal                                                           | ❌     | |
| 17 | Gentle local nudges: "You haven't logged water in 4 hours"                              | ❌     | |
| 18 | Post-wo rehydration alert after Workout session ends                                    | ❌     | Workout sync — listens for session end event |
| 19 | "Dehydration risk" flag: if pre-wo weight &lt; 0.5kg below recent avg AND/OR urine color ≥6 | ❌ | |
| 20 | Alcohol tracker (optional) — units consumed, net hydration penalty (–100ml per unit)    | ❌     | Legal age in TN = 21; kept off by default, opt-in in settings |

---

# §3 — SOMNIUM (Sleep &amp; Circadian) `/health/sleep`

Young male lifter needs 7-9h. Chennai's heat/AC cycles and late-night studying/working
make sleep debt real.

| #  | Feature                                                                                 | Status | Notes |
|----|-----------------------------------------------------------------------------------------|--------|-------|
| 01 | Bedtime + wake-time fields (time pickers). Auto-calculates duration                     | ❌     | |
| 02 | Sleep quality 1–10 slider                                                               | ❌     | |
| 03 | **Dream Journal** — password-hashed text area; tags: Lucid / Nightmare / Bizarre / Prophetic / None | ❌ | Simple PIN, local only |
| 04 | **Sleep Bank** — tracks cumulative debt vs ideal (default 8h/night, configurable 7–9). "+1" credit for over-sleep, "−1" debt for under-sleep | ❌ | Visual piggy-bank; nudges when debt ≥5h "You owe 5h. Go to bed early." |
| 05 | Sleep debt repayment plan projection (e.g., +30min/night for 10 nights to clear 5h)     | ❌     | |
| 06 | Sleep Bank Statement — weekly report (avg hours, total debt/credit, trend)              | ❌     | |
| 07 | Sleep latency (minutes to fall asleep) field                                            | ❌     | |
| 08 | Wake-ups during night count                                                             | ❌     | |
| 09 | Nap log — duration, time; whether it was power nap vs long nap (affects circadian note) | ❌     | |
| 10 | **Circadian Rhythm tracker** — logs first sunlight exposure, first meal, last meal, caffeine cutoff, screen-off time | ❌ | Builds rhythm profile over 2 weeks |
| 11 | Circadian score — alignment score vs consistent rhythm (ideal range: wake ±30min)       | ❌     | |
| 12 | **Bedtime Procrastination logger** — when you delayed despite being tired + reason (Scrolling / Work / Anxiety / Gaming / Social / Other) | ❌ | |
| 13 | **Sleep Hygiene Score** — checklist (1 = yes, 0 = no): dark room, cool temp (ideal 18–22°C but Chennai AC ~24–26), no caffeine after 4pm, no screens 30min pre-bed, no heavy meal 2h pre-bed, shower/warm bath, consistent wake time | ❌ | Score 1–10; Chennai AC/heat considerations noted |
| 14 | Bedtime Routine Builder — ordered checklist of custom steps; track adherence %          | ❌     | |
| 15 | Wake-up Routine Builder — same for morning (sunlight, water, stretching, no phone 15m) | ❌     | |
| 16 | Sleep environment tags: AC / Fan / Open window / Mosquito coil/mat / Humidifier / White noise | ❌ | 🌏 Mosquito concern is Chennai-real; coils release particulate so flagged |
| 17 | Bedtime mood &amp; anxiety 1–10                                                           | ❌     | |
| 18 | Readiness contribution — sleep score feeds into Workout readiness                       | ❌     | Workout sync |
| 19 | Sleep graph (30/90/365 day)                                                             | ❌     | |
| 20 | Sleep goal setting (target bedtime / target wake)                                       | ❌     | |
| 21 | Ideal bedtime calculator — based on wake-time + desired duration, suggests wind-down start | ❌   | |
| 22 | Jet-lag / late-night study mode — temporary adjusted schedule                           | ❌     | Exam/onsite weeks common |
| 23 | Workout-correlation overlay: "On 7h sleep your avg volume was 10% lower than 8h+ nights" | ❌     | Workout sync |
| 24 | Next-morning projected wake-time given bedtime ("If you sleep now, you'll get 6.5h")    | ❌     | |
| 25 | Sleep consistency score (weekday vs weekend variance; &gt; 90min social-jetlag flagged)   | ❌     | |

---

# §4 — SOMA (Physique, Measurements, Body Comp) `/health/physique`

Tied tightly to Workout — reads `bodyweight` and `sessions` from Workout state, enriches
with body fat, tape measurements, and photos.

| #  | Feature                                                                                 | Status | Notes |
|----|-----------------------------------------------------------------------------------------|--------|-------|
| 01 | Bodyweight log — manual entry; also reads Workout.bodyweight[] as source of truth (sync read) | ❌ | Workout owns weight entries; Health can display and suggest logging but doesn't duplicate |
| 02 | Weight chart (30/90/365 day) with 7/30-day SMA, min/max annotations                     | ❌     | |
| 03 | **Navy Method body fat %** (men, metric): `BF% = 495 / (1.0324 − 0.19077×log10(waist_cm − neck_cm) + 0.15456×log10(height_cm)) − 450` | ❌ | Evidence: circumference method ±3-4% vs DEXA; acceptable for tracking trend |
| 04 | Waist, neck, height (cm) inputs for Navy method; hip optional for future                | ❌     | |
| 05 | BF% trendline (30/90/365) — each measurement date stamped                              | ❌     | |
| 06 | **Lean Body Mass** auto: `weight × (1 − BF%)`                                           | ❌     | |
| 07 | Fat mass auto: `weight × BF%`                                                           | ❌     | |
| 08 | **Muscle/Fat/Other pie** (fat mass, lean mass, residual ~8% as bone/water)              | ❌     | Visual |
| 09 | BMI auto-computed (not flagged as "overweight" for lifters — annotated with "athletes often register 'overweight' BMI due to muscle") | ❌ | Anti-bad-psychology guard |
| 10 | **Strength-to-Weight Ratio (S:W)** tracker — key ratio per major lift vs bodyweight. Pulls PRs from Workout | ❌ | Workout sync |
| 11 | 1RM ÷ bodyweight for: Deadlift / Squat / Bench / OHP / Row / Pull-up (bodyweight rep-max estimate) | ❌ | |
| 12 | S:W class tags for each lift: Novice / Intermediate / Advanced / Elite (standards based on bodyweight multiples) | ❌ | |
| 13 | Muscle-gain estimator — over rolling 4-week window: if weight ↑ AND waist ↓/stable AND strength ≥ previous → "+X kg likely lean" | ❌ | Heuristic, not diagnostic |
| 14 | Fat-loss estimator — over 4-week window: weight ↓ AND strength stable/↑ → "−X kg likely fat" | ❌ | Heuristic |
| 15 | Recomp detector — weight stable (±1kg) but waist ↓ AND strength ↑ → "Recomp phase detected" | ❌ | |
| 16 | Bulk / Cut / Maintenance / Recomp phase auto-detection with manual override             | ❌     | |
| 17 | Bulk rate monitor: warns if &gt; 0.75 kg/week for 2+ weeks running → "You may be gaining too much fat" | ❌ | |
| 18 | Cut rate monitor: warns if &gt; 1 kg/week → "Rapid cut — muscle loss risk"                  | ❌     | |
| 19 | Rapid-weight-loss alert + strength drop → INJURY RISK flag                              | ❌     | |
| 20 | Water-weight retention detector — weight spike &gt;1.5kg in 1 day after high-carb day OR hard workout → "Likely water retention (glycogen+water), not fat gain" | ❌ | |
| 21 | **Full tape measurements** (cm) with relaxed/flexed where applicable: Neck, Shoulders, Chest (relaxed/inhaled/flexed), Waist (navel), Hip/Glute, Arms (L/R flexed/relaxed), Forearms (L/R), Thighs (L/R), Calves (L/R), Wrists, Ankles | ❌ | |
| 22 | Per-body-part progress chart (each measurement on its own sparkline)                    | ❌     | |
| 23 | **Asymmetry detector** — if L vs R arm/thigh/calf difference &gt;1cm, highlights with color + unilateral-exercise nudge | ❌ | |
| 24 | Target measurements per body part + % progress bar                                      | ❌     | |
| 25 | Measurement frequency planner (weekly = cutting, bi-weekly = maintenance, monthly = bulking) | ❌ | |
| 26 | Measurement day reminder — suggests consistent day/time (Monday post-workout)          | ❌     | |
| 27 | Flexed vs relaxed mode toggle                                                           | ❌     | |
| 28 | Post-workout "pump" measurement log (immediately post-session)                          | ❌     | Workout sync |
| 29 | **Measurement ↔ Workout correlation** overlay — "Bench PR up 10kg, chest up 2cm"        | ❌     | Workout sync |
| 30 | Targeted measurement hints — on push day, prompt chest/arms; pull day → back/biceps; leg day → thighs/glutes | ❌ | Workout sync — reads routine focus |
| 31 | Body-part priority suggestion: "Your chest measurement trails relative to your bench S:W" | ❌     | |
| 32 | Strength-standards comparison — per-lift classification (Beginner/Intermediate/Advanced/Elite) for current BW | ❌ | |
| 33 | Calisthenics skill vs bodyweight visualizer — e.g., "At 75kg a muscle-up needs ≈ 1.10 S:W pull+push ratio" | ❌ | Workout sync — reads cali skills |
| 34 | Weight class visualizer (for powerlifting-style class goals, BW-class strength)        | ❌     | |
| 35 | **Progress Photos** — take/store locally (dataURL/IndexedDB), date+tag (front/back/side × relaxed/flexed) | ❌ | Offline-first |
| 36 | Photo angle presets: Front relaxed, Front flexed, Back relaxed, Back flexed, Side relaxed, Side flexed | ❌ | 6-preset consistency |
| 37 | "Same lighting" + "Same time" consistency reminders                                     | ❌     | |
| 38 | Photo reminder every 4–6 weeks                                                          | ❌     | |
| 39 | Post-workout photo prompt (on PR, on measurement day)                                   | ❌     | Workout sync — listens for PR event |
| 40 | Before/after program photos — start/end tagged photos for specific workout program      | ❌     | Workout sync |
| 41 | Side-by-side photo comparison tool (any two dates)                                      | ❌     | |
| 42 | Photo slideshow mode (transformations over time)                                        | ❌     | |
| 43 | Photo annotation (mark-up with lines/text)                                              | ❌     | v1.2+ optional |
| 44 | Measurement trend vs strength trend overlay                                             | ❌     | Workout sync |
| 45 | Strength-to-size ratio per body part (e.g., "Chest strength-to-size 1.2 — top 20%")     | ❌     | |
| 46 | **Gym fit / apparel size predictor** — chest/waist/hip/arm → T-shirt/jeans size estimate | ❌     | Indian apparel size charts 🌏 |
| 47 | Workout performance overlay graph (PRs + BW + BF% on same timeline)                     | ❌     | Workout sync |
| 48 | PR-at-same-weight tracker — "You deadlifted +20kg at the same BW. Pure strength!"       | ❌     | Workout sync |
| 49 | Plateau detector — measurements unchanged 4 weeks + consistent logging → "Consider routine change" nudge | ❌ | |
| 50 | **TDEE reverse-engineering** — uses actual weight change over 2–4 weeks + logged intake + logged workout volume → auto-refine TDEE estimate | ❌ | Workout sync, key algorithm |
| 51 | Maintenance calories auto-adjust — smoothed 14-day trend                                 | ❌     | |
| 52 | Caloric intake target (bulk +250/cut −300/maintain) based on phase                      | ❌     | |
| 53 | Weekly weight-change rate vs target; compliance chip                                    | ❌     | |

---

# §5 — APOTHECARY (Supplements, Vitamins, Deficiencies) `/health/supplements`

🇮🇳 Special emphasis: Vitamin D &amp; B12 &amp; Iron &amp; Zinc &amp; Calcium deficiencies are EPIDEMIC
among urban Indians per ICMR/NIN studies (70-90% Vit D insufficient, widespread B12
even in non-vegetarians due to bioavailability, iron-deficiency anemia, zinc below RDA
in ~50%). The app should gently nudge, not diagnose.

| #  | Feature                                                                                 | Status | Notes |
|----|-----------------------------------------------------------------------------------------|--------|-------|
| 01 | Supplement logger with quick-add: Whey protein, Creatine monohydrate, Multivitamin, Vit D3, B12 (methylcobalamin), Omega-3 fish oil, Magnesium glycinate/citrate, Zinc, Calcium, Ashwagandha, Pre-workout, BCAA/EAA, Glutamine, Collagen, Probiotic, Custom | ❌ | |
| 02 | Dose + time-of-day per supplement                                                       | ❌     | |
| 03 | Daily checkmarks (taken/missed)                                                         | ❌     | |
| 04 | Adherence streak per supplement                                                         | ❌     | |
| 05 | Stack schedule view (morning / pre-wo / post-wo / night)                                | ❌     | |
| 06 | **🇮🇳 Deficiency risk badge** — flags nutrients commonly low in Indian diets (Vit D, B12, Iron, Zinc, Calcium, Omega-3, Magnesium) based on logged food + supplement adherence 🌏 | ❌ | Awareness, not diagnosis |
| 07 | "Get bloodwork" nudge — reminder for annual lipid panel, CBC, Vit D, B12, fasting glucose | ❌     | |
| 08 | Bloodwork result storage (manual entry: date + values + reference ranges)              | ❌     | |
| 09 | Bloodwork trend chart (key markers over time)                                           | ❌     | |
| 10 | Simple drug-interaction warning (caffeine + pre-workout, iron + calcium spacing, etc.)  | ❌     | Heuristic only; disclaimer |
| 11 | Supplement cycle tracking (creatine loading/maintenance, pre-wo tolerance breaks)      | ❌     | |
| 12 | Supplement cost tracker (monthly spend)                                                 | ❌     | |
| 13 | "Sunlight exposure" log for Vit D synthesis (minutes + time of day, skin exposure) 🌏   | ❌     | Chennai = good UV most of year; urban indoor lifestyle paradox |
| 14 | "Skin type" (Fitzpatrick I-VI) — darker skin = more synthesis time needed, flagged for Vit D | ❌     | Most South Indians Type IV-V |

---

# §6 — VITALS (Heart, BP, Biometrics) `/health/vitals`

Manual entry (no wearables required). Vitals feed into readiness and recovery scores.

| #  | Feature                                                                                 | Status | Notes |
|----|-----------------------------------------------------------------------------------------|--------|-------|
| 01 | Resting Heart Rate (bpm) — daily/AM entry                                               | ❌     | AM baseline most consistent |
| 02 | Resting HR trendline; elevated HR (&gt;10bpm above avg) flagged as overtraining/illness  | ❌     | Workout sync |
| 03 | Blood Pressure (Systolic/Diastolic mmHg)                                                | ❌     | Classification chips (Normal/Elevated/Stage1/Stage2) per AHA 2024 |
| 04 | Blood Pressure chart with color bands                                                   | ❌     | |
| 05 | Heart Rate Variability (manual entry from watch/phone if available) — ms                 | ❌     | Optional; not required; higher = better recovery |
| 06 | Body temperature (°C) — fever flag if &gt;99.5°F / 37.5°C                                  | ❌     | |
| 07 | SpO2 (%; if user has pulse oximeter)                                                    | ❌     | Optional, &lt;94% warning |
| 08 | Respiratory rate (breaths/min; optional)                                                | ❌     | |
| 09 | Symptom log: headache, fever, cold/cough, sore throat, body ache, nausea, injury, skin, digestive, other | ❌ | |
| 10 | Illness episode log (start/end date, symptoms, severity)                                | ❌     | |
| 11 | Injury log — body part, severity, date, ongoing/recovered, notes                         | ❌     | Workout sync — surfaces as joint pain cross-check |
| 12 | Symptom-injury → workout restriction nudge ("Left shoulder injury logged — consider skipping OHP today") | ❌ | Workout sync |
| 13 | Medication log (OTC / prescription) — name, dose, start/end, notes                     | ❌     | |
| 14 | Allergies list (food / drug / environmental)                                            | ❌     | |
| 15 | Vitals dashboard with 7-day overview and anomaly highlighting                           | ❌     | |
| 16 | Post-workout HR recovery (reads hr2minPost from CardioLog if present)                    | ❌     | Workout sync |
| 17 | Morning orthostatic HR test (optional): stand up, log HR after 1 min. Elevated = fatigue | ❌     | |
| 18 | Cycle/sexual health — libido 1-5, erectile quality 1-5 (optional, for overtraining flag) | ❌   | Dropping libido = classic overtraining symptom |

---

# §7 — MIND (Mood, Stress, Mental Wellness) `/health/mind`

Cross-links with Career daily mood/stress and Workout readiness.

| #  | Feature                                                                                 | Status | Notes |
|----|-----------------------------------------------------------------------------------------|--------|-------|
| 01 | Daily mood 1–10 slider (morning + evening?)                                             | ❌     | Shared scale with career & workout |
| 02 | Daily stress 1–10 slider                                                                | ❌     | |
| 03 | Daily energy 1–10 slider (morning + evening)                                            | ❌     | |
| 04 | Motivation 1–10                                                                         | ❌     | |
| 05 | Anxiety 1–10                                                                            | ❌     | |
| 06 | Focus 1–10                                                                              | ❌     | |
| 07 | Mood trend graph (90 day) with correlation overlays (sleep, workouts, caffeine, steps) | ❌     | |
| 08 | Daily journal free-text entry                                                           | ❌     | |
| 09 | Gratitude log (3 things/day — optional)                                                 | ❌     | |
| 10 | Meditation/mindfulness minutes                                                          | ❌     | |
| 11 | **Burnout/overtraining flag** — heuristic combining sleep debt, resting HR, mood, stress, motivation, libido, workout performance drop | ❌ | Cross-space algorithm |
| 12 | Mood tag picker: happy/calm/focused/tired/anxious/irritable/sad/motivated/hungover/other | ❌ | |
| 13 | Menstrual cycle (NOT applicable to user profile; still added as non-gendered feature flag — hidden by default for male profile but present in settings for any future user) | ❌ | Profile-aware |
| 14 | Mental wellness resource list — crisis lines for India (Vandrevala 1860-2662-345, iCall 9152987821, NIMHANS) 🌏 | ❌ | Real Indian helplines |
| 15 | Habit/alcohol/caffeine/nicotine tracker (opt-in)                                        | ❌     | |
| 16 | Steps / physical activity (manual entry or from workout.cardio walk)                     | ❌     | Workout sync |
| 17 | Sunlight exposure minutes (also appears in APOTHECARY for Vit D)                        | ❌     | Cross-linked |

---

# §8 — SYNC LAB (Bridge &amp; Settings) `/health/sync`

This is where Health and Workout connect. User explicitly configures what syncs. The
**Health ↔ Workout contract** is documented in `docs/ALGORITHMS.md` — see the
"Health-Workout Bridge Contract" section.

| #  | Feature                                                                                 | Status |
|----|-----------------------------------------------------------------------------------------|--------|
| 01 | Profile: gender, age, height (cm), weight (kg), target weight, body-fat goal, activity level, goal (bulk/cut/maintain/recomp) | ❌ |
| 02 | TDEE engine (Mifflin-St Jeor men: `BMR = 10×weight + 6.25×height − 5×age + 5`; multipliers: 1.2 sedentary, 1.375 light, 1.55 moderate, 1.725 active, 1.9 very active) | ❌ |
| 03 | Katch-McArdle override when BF% known: `BMR = 370 + 21.6 × LBM_kg`                     | ❌     |
| 04 | Protein target calculator: 1.6–2.2 g/kg BW (maintenance), 2.0–2.4 g/kg LBM (cut), 1.6–2.0 (bulk) based on phase | ❌ |
| 05 | **Workout ↔ Health sync toggles** (all default ON):                                      | ❌     |
| 06 |   ← Read bodyweight from Workout space (source of truth)                                | ❌     |
| 07 |   ← Read workout sessions for caloric burn estimate                                     | ❌     |
| 08 |   ← Read cardio logs for calorie burn + hydration                                       | ❌     |
| 09 |   ← Read readiness inputs from Workout (soreness, sleep, stress already there? dedupe)  | ❌     |
| 10 |   ← Read PRs for strength-to-weight ratios                                              | ❌     |
| 11 |   → Push TDEE-adjusted daily caloric target to Nutrition view                           | ❌     |
| 12 |   → Push sleep score to Workout readiness                                               | ❌     |
| 13 |   → Push hydration status to Workout pre-session warning                                | ❌     |
| 14 |   → Push injury/symptom flags to Workout as session warnings                            | ❌     |
| 15 |   → Push supplement taken markers (creatine/pre-wo) to Workout session metadata         | ❌     |
| 16 | Climate setting: city (default Chennai) + manual temp/humidity override                 | ❌     |
| 17 | Units: metric / imperial                                                                 | ❌     |
| 18 | Theme (VITAL-SIGN dark = navy/EKG; light = clinical white; auto)                         | ❌     |
| 19 | Reminder schedule settings (gentle nudges on/off, frequency)                            | ❌     |
| 20 | Data export (JSON + CSV of all health data)                                             | ❌     |
| 21 | Data import (JSON)                                                                       | ❌     |
| 22 | Reset health state (with confirm)                                                       | ❌     |
| 23 | **Caloric Adjustment Engine** — per workout, adds estimated kcal burned via MET × bodyweight × duration | ❌ |
| 24 | Sleep Recovery Projection — "After today's {volume} workout, aim for {X}h sleep tonight" | ❌     |
| 25 | Recovery Quality Score (1-100) = weighted combo of sleep, HR deviation, stress, soreness, nutrition 24h | ❌ |
| 26 | Training Status classifier: Fitness improving / Maintaining / Fatigue accumulating / Overreaching | ❌ |
| 27 | Deload suggestion trigger (plateau + sleep bad + stress high + strength drop)           | ❌     |
| 28 | Chennai climate hydration multiplier (1.1 default) 🌏                                    | ❌     |
| 29 | Password/PIN for dream journal + bloodwork (optional)                                   | ❌     |

---

# §9 — REPORTS (Timeline, Trends, Exports) `/health/reports`

| #  | Feature                                                                                 | Status |
|----|-----------------------------------------------------------------------------------------|--------|
| 01 | Daily Health Score (0-100) composite — formula TBD (weighted)                           | ❌     |
| 02 | Health Score trend (7/30/90/365 day)                                                    | ❌     |
| 03 | Weekly health summary — avg sleep, calorie avg, weight delta, stress, workouts, alcohol, steps | ❌ |
| 04 | Monthly health report with trend charts                                                 | ❌     |
| 05 | Goal progress dashboard (target weight, BF%, macros, sleep)                             | ❌     |
| 06 | **Health Timeline** — unified chronological feed of ALL logs across every section (meals/water/sleep/weight/stress/symptoms/measurements/photos/workouts) | ❌ |
| 07 | Healthy-habit streak tracker (multiple habits: water 8 cups, 8h sleep, protein goal, steps, no cheat meals, supps taken) | ❌ |
| 08 | Habit-break logger ("I broke X habit. No guilt.")                                       | ❌     |
| 09 | CSV export — one-click, all sections                                                    | ❌     |
| 10 | JSON export/backup                                                                      | ❌     |
| 11 | PDF weekly report (v1.2+, use print view first)                                         | 🟡     |
| 12 | **Check-in dashboard** — weight + sleep + mood on same graph                            | ❌     |
| 13 | Workouts overlay on every trend chart — vertical line markers                            | ❌     |
| 14 | "Anabolic Index" — `(weight_kg_gain_strength_lb_gain) / weeks` for bulking phases       | ❌     |
| 15 | "Work Capacity Score" — `(volume × intensity) / bodyweight` (reads from Workout)         | ❌     |
| 16 | "Health vs PRs" correlation graph                                                       | ❌     |
| 17 | "Nutrient gaps" report — which micronutrients you've missed most this week               | ❌     |
| 18 | "Perfect day" recap — days you hit all targets                                          | ❌     |

---

# Cross-cutting

| Area | Plan |
|---|---|
| Theme — **VITAL-SIGN** (dark default) | Deep navy→black gradient (`#0a1628 → #050a14 → #000`), EKG lime-green primary (`#10b981` / `#34d399`), blood-red (`#ef4444`/`#f87171`) for alerts, white (`#f8fafc`) for text, cyan trace accents (`#06b6d4`). Live EKG SVG trace across top (horizontal pulse), circular gauges for score tiles, monospace data readouts like a patient monitor. Fonts: JetBrains Mono for data, Inter for body, a display font for headers (e.g., Chakra Petch / Space Grotesk — tech-medical). |
| Theme — **CLINIC** (light) | Sterile white/off-white (`#fafafa` → `#f1f5f9`), slate grey (`#334155`), lime green accents, soft shadows, chart-grid-paper background, red/alarm color reserved for alerts. Feels clean, medical, paper-chart. |
| Full-screen shell (`Page.fullScreen = true`) | Yes — edge-to-edge, no TopNav (like Forge & Workout). Left rail nav with 10 sectors (TRIAGE + 9 sections), EKG-style section indicator. |
| LocalStorage persistence | `kaizen.health` key, migration `migrateHealth()`, defensive seed |
| Hydration-safe mount guard | Yes, mirror Forge/Career pattern |
| Hotkeys | `?` help, `g`-chord navigation, `n` quick-log, `Esc` closes, `t` theme toggle |
| Soundscape toggle | Hospital-monitor subtle blip (optional, off by default) |
| Offline-first | 100% — no backend required for v1; CRUD routes `/api/health/*` stubbed for future |
| All routes static-prerendered | ✅ Target (like other fullscreen spaces) |
| **🇮🇳 India/Chennai specifics baked in everywhere** | Hydration +10% climate multiplier, pre-seeded Indian food DB (80+ dishes), restaurant mode for local eateries, coconut water as default electrolyte drink, ICMR micronutrient RDA targets, Vit D/B12/Iron/Zinc deficiency risk badges, Chennai mosquito coil sleep-environment tag, Fitzpatrick skin type for Vit D synthesis, Indian crisis helplines, IST timezone for reset, filter coffee/chai caffeine presets, turmeric/curd rice/kanji pre-seeded as probiotic/antioxidant foods |
| Medical disclaimer | Footer/settings permanent link: "Educational tool. Not medical advice. Consult qualified professionals for medical concerns." Not a diagnostic device. |
| Workout bridge | Bidirectional, governed. See §8. All cross-space reads done via selectors over root state. No circular imports. |
| Male 20yo defaults | Default protein ~130g/day for ~70kg, BMR ~1650 kcal, TDEE ~2500 (moderate), sleep goal 8h, water ~2.75L (with Chennai mult), Vit D sun exposure 10-15min arms+face mid-morning, no menstrual module visible. |

---

# Algorithms contract summary (also in `docs/ALGORITHMS.md`)

| Algorithm | Formula | Source |
|---|---|---|
| Daily Health Score | Weighted: 30% sleep quality × (duration/goal), 25% nutrition (kcal macro hit %, protein hit %, fiber hit %), 20% hydration (% of dynamic goal), 15% movement/wo, 10% mood/stress | Custom composite (inspired by WHO-5 + composite wellness scores) |
| Dynamic water goal (ml) | `35 × weight_kg × climateMult + workoutAdj + humidityAdj`; climateMult = 1.1 for Chennai/coastal-tropical default; workoutAdj = 500ml per 30 min wo; humidityAdj = 200ml if RH ≥ 70% | EFSA + ACSM + tropical-exercise lit |
| BMR (Mifflin-St Jeor, men) | `10w + 6.25h − 5a + 5` (kg, cm, years) | Mifflin 1990, most-validated for healthy adults |
| BMR (Katch-McArdle) | `370 + 21.6 × w × (1 − bf%)` (bf% decimal) | When BF% measured |
| TDEE | `BMR × activityMult`; 1.2 sedentary, 1.375 light, 1.55 moderate (trained 3-4/wk), 1.725 active (5-7/wk), 1.9 very active | Standard |
| BF% (Navy, men, metric) | `495/(1.0324 − 0.19077×log10(waist−neck) + 0.15456×log10(height)) − 450` | US Navy / NHRC |
| Sugar Spike Risk | Simple + low p/f → High; Simple + high p/f → Medium; Complex + low p/f → Medium; Complex + high p/f → Low | Glycemic-load heuristic |
| Sleep debt | `idealHours − actualHours`, rolling accumulation, capped at ±20h | Standard sleep-bank model |
| Recovery Quality Score | `0.30×sleep + 0.25×restingHR_dev + 0.15×mood + 0.15×nutrition + 0.15×soreness_rev` | Composite, adapted from readiness-score literature |
| 1RM (Epley) | `weight × (1 + reps/30)` — already in `workoutAnalytics.ts` | Reused from Workout space |

---

# Feature count

- §0 Triage: 13
- §1 Nutrition: 50
- §2 Hydration: 20
- §3 Sleep: 25
- §4 Physique: 53
- §5 Supplements: 14
- §6 Vitals: 18
- §7 Mind: 17
- §8 Sync Lab: 29
- §9 Reports: 18
- **Total: ~257 features** v1.0 scope.

Phased implementation waves (planned):

- **Wave 1 (shell, TRIAGE, SYNC LAB, types, store)** — routes, nav, theme boilerplate, profile, localStorage, migrations, health score gauge.
- **Wave 2 (FUEL core + HYDRATION core)** — meals timeline, food library (Indian seeded), macros sliders, kcal/deficit, repeat-yesterday, 8-glass grid, dynamic water goal.
- **Wave 3 (SOMNIUM + APOTHECARY)** — sleep log, sleep bank, routines, supplement log, deficiency badges 🌏.
- **Wave 4 (SOMA core measurements + photos)** — weight sync, Navy BF%, LBM, tape measurements, photo capture.
- **Wave 5 (VITALS + MIND)** — HR/BP, symptom log, mood/stress, burnout flag.
- **Wave 6 (REPORTS + all trend charts + CSV)** — timeline, weekly/monthly reports, export.
- **Wave 7 (deep Workout bridge + advanced analytics)** — TDEE reverse-eng, pre/post-wo cards, S:W ratios, sync toggles, recovery score.
- **Wave 8 (restaurant mode, recipes, meal planner, meal prep, advanced vits/micros, bloodwork)** — v1.1 features.
- **Wave 9 (QA, polish, a11y, light theme Clinic pass)** — bug sweep, visual polish, a11y, documentation, branch QA before merge.

---

*This doc is the source of truth for Health v1.0 scope. Each wave ships as an
incremental commit to the `health` branch, merge to `main` only after user approval.*

---

## Build status

| Wave | Name | Status | Commit |
|---|---|---|---|
| 0 (docs) | Spec, research, arch/algorithms/data-model docs | ✅ | `9ac7369`, `de125c5` |
| 1 (shell) | types, store slice, HealthShell, 10 FULLSCREEN routes, EkgFlash, HealthHotkeys, Triage live-KPIs, Lab profile editor | ✅ | `c8f0b10` |
| 2 (core food+water) | meals timeline, macros sliders, 80-dish Indian food lib, repeat-yesterday, 8-glass hydration, dynamic water goal | ❌ next |
| 3 (sleep+supps) | sleep log, sleep bank, routines, supp log, 🇮🇳 deficiency badges | ❌ |
| 4 (physique core) | Navy BF%, tape measurements, photo capture | ❌ |
| 5 (vitals+mind) | HR/BP, symptom log, mood/stress, burnout flag | ❌ |
| 6 (reports) | timeline, weekly/monthly reports, CSV/JSON export | ❌ |
| 7 (workout bridge deep) | TDEE reverse-eng, pre/post-wo cards, S:W ratios, recovery score, sync toggle wiring | ❌ |
| 8 (v1.1 niceties) | restaurant mode, recipes, meal planner, meal prep, advanced micros, bloodwork | ❌ |
| 9 (QA+polish) | bug sweep, tsc/build/smoke gates, CLINIC light pass, a11y, pre-merge QA → main | ❌ |
