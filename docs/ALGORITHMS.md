# Algorithms & Formulas

All math used by Kaizen Workout lives in `frontend/lib/workoutAnalytics.ts` and
`frontend/lib/workoutGym.ts`. This document catalogs every formula so future
you (or anyone auditing the code) doesn't have to reverse-engineer it.

---

## 1. One-Rep-Max (1RM) estimates

Two common estimators are implemented; Epley is the default because it tracks
slightly better for ≥5 rep sets (the range most people actually train in).

### Epley (1985)

```
1RM = weight × (1 + reps / 30)
```

- `reps` ≤ 1 returns the weight itself.
- Used by: `epley1RM()`, `set1RM()`, `best1RMForExercise()`, `logPR()` PR
  detection, AMRAP projection, warm-up weight derivation, plate calculator
  defaults, and Wilks/strength-ratio inputs.

### Brzycki (1993)

```
1RM = weight × 36 / (37 − reps)
```

- Tends to be slightly more conservative than Epley at high reps; exposed as
  `brzycki1RM()` for users who prefer it. Not used in auto-logic.

## 2. Training Max

```
trainingMax = 0.90 × 1RM
```

The 90% rule popularised by Jim Wendler's 5/3/1. Used as the working-weight
anchor for the warm-up generator.

## 3. AMRAP projection

Inverted Epley:

```
predictedReps = (1RM / weight − 1) × 30
```

## 4. RPE ↔ RIR

RPE (Rate of Perceived Exertion, 1–10) and RIR (Reps In Reserve, 0–10+) are
linearly related:

```
RPE = 10 − RIR
RIR = 10 − RPE
```

RPE 8 = "2 reps left in the tank" (RIR 2).

## 5. Plate calculator (greedy fit)

Given a total bar + loaded weight, and a bar weight (20 kg men's Olympic bar
by default), compute plates per side:

```
side = (total − barKg) / 2
for plate in [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25]:
    while side ≥ plate:
        take plate
        side -= plate
```

Greedy works here because the plate set is canonical (each plate divides the
remainder appropriately for practical loading). Micro-plates as small as
0.25 kg are included to support 0.5 kg total micro-loading.

A parallel `platesForLb()` is exported using a 45 lb bar and the standard
pound plate set [45, 35, 25, 10, 5, 2.5, 1.25].

## 6. Wilks 2020 coefficient

The modern (post-2020) Wilks polynomial uses five coefficients, sex-specific:

```
coeffs = [a, b, c, d, e, f]
denom  = a + b·x + c·x² + d·x³ + e·x⁴ + f·x⁵
wilks  = 600 / denom × totalKg / 100
```

where `x = bodyweightKg`. Coefficients (stored in `workoutGym.ts`):

|         | a           | b          | c           | d            | e             | f          |
|---------|-------------|------------|-------------|--------------|---------------|------------|
| Male    | −125.42554  | 13.74243   | −0.34857    | 0.00460      | −0.000020     | 0          |
| Female  | −255.05052  | 20.72709   | −0.49028    | 0.00667      | −0.000045     | 0.00000011 |

## 7. Dumbbell ↔ Barbell equivalence

Empirical ballpark used by gym regulars for pressing movements: two dumbbells
are ~15% harder than a barbell at the same total load because of stabiliser
demand:

```
BB ≈ DB_per_hand × 2 × 0.85
DB ≈ BB / 2 / 0.85
```

## 8. Strength-to-weight ratio

```
ratio = 1RM / bodyweightKg
```

## 9. Readiness score (0–100)

Three daily 1–10 sliders, weighted:

| Factor  | Direction      | Weight |
|---------|----------------|--------|
| Soreness | 1 = fresh … 10 = crippling | 30% (inverted) |
| Sleep   | 1 = terrible … 10 = great   | 45% |
| Stress  | 1 = calm … 10 = max         | 25% (inverted) |

```
score = ((11 − soreness) / 10) × 0.30
      + (sleep / 10)           × 0.45
      + ((11 − stress) / 10)   × 0.25
```

Yields a 0–1 number, multiplied by 100 for display.

### Intensity multiplier

| Readiness | Multiplier | Recommendation |
|-----------|------------|----------------|
| ≥ 80      | 1.05       | Push for a PR  |
| 65–79     | 1.00       | Normal work    |
| 50–64     | 0.90       | Pull back 10%  |
| 35–49     | 0.80       | Light session  |
| < 35      | 0.70       | Deload         |

## 10. Weekly muscle volume

For each completed set in the last 7 days with a known weight:

```
volume += weight × reps       # credited to primary muscle (100%)
volume += weight × reps × 0.4 # credited to each secondary muscle
```

Heatmap color ramps from slate (#cbd5e1) → pink (#f43f5e) → deep red (#b91c1c),
saturating at 2000 kg/week for any single group.

## 11. Streaks

- A streak increments when sessions are logged on consecutive calendar days.
- Same-day sessions do not increment.
- A gap > 1 day resets the streak to 1.
- Streak freezes (Duolingo-style) absorb one missed day; configured in
  `settings.streakFreezes`.

## 12. Deload detector

Flags a deload if either:

- 12+ "hard" (non-deload, non-rest) sessions have been logged since the last
  deload, **or**
- 6+ weeks have elapsed since the last deload.

## 13. Warm-up set generator

For a working weight `W` (or training max `0.9 × 1RM`):

| Set            | Weight          | Reps |
|----------------|-----------------|------|
| Empty bar      | 20 kg           | 10   |
| 50% work       | round(0.50 × W) | 8    |
| 65% work       | round(0.65 × W) | 5    |
| 75% work       | round(0.75 × W) | 3    |
| 85% work       | round(0.85 × W) | 1    |

## 14. Heart-rate zones

Max HR estimated by the classic Fox formula:

```
maxHR = 220 − age
```

Five zones based on % of max HR:

| Zone | Name        | %max HR | Color     |
|------|-------------|---------|-----------|
| Z1   | Recovery    | < 60%   | #22c55e   |
| Z2   | Aerobic     | 60–70%  | #a3e635   |
| Z3   | Tempo       | 70–80%  | #f59e0b   |
| Z4   | Threshold   | 80–90%  | #ec4899   |
| Z5   | Anaerobic   | 90%+    | #ef4444   |

## 15. HR recovery

```
recovery = HR_end_of_session − HR_2min_post
```

Higher = better aerobic fitness. A drop < 12 bpm after 2 minutes is a red
flag (used qualitatively in the UI, not enforced).

## 16. HR drift

```
drift% = (HR_end − HR_start) / HR_start × 100
```

> 10% drift in an aerobic session typically indicates accumulating fatigue,
> heat stress, or insufficient fueling.

## 17. Negative splits

```
avg(second_half_splits) < avg(first_half_splits)
```

## 18. VO2 max — Cooper 12-minute test

```
VO2_max (ml/kg/min) = distance_in_meters / 15 − 13.9
```

(Ken Cooper, 1968). Reasonable estimate for recreational runners; not lab
grade.

## 19. Running economy

```
economy = pace_sec_per_km / avg_HR
```

Lower = better (fewer beats to hold a pace). Tracked per-session to surface
aerobic improvement.

## 20. Consistency score

```
consistency% = sessions_completed / sessions_planned (last 4 weeks) × 100
```

`planned = routines.length × 4` (one routine-slot per week × 4 weeks).

## 21. Time preference

Buckets sessions into morning (hour < 11), afternoon (11 ≤ hour < 17),
evening (≥ 17) and returns the bucket with the most completed sessions.

## 22. Weakness analysis (calisthenics)

Fail-log reasons are keyword-matched against a small expert table:

| Keywords in reason                  | Suggested accessory                               |
|-------------------------------------|---------------------------------------------------|
| core, tension, hollow               | 3×30s hollow body + planks before skill work      |
| grip, hand, slip                    | Dead hangs, fat-bar, plate pinches 2×/week        |
| tricep, lockout, dip                | Weighted dips 3×6 + tri extensions 3×12           |
| pull, explosive, transition         | High-pulls, clap pull-ups, weighted negatives     |
| wrist, shoulder, mobility           | 5 min wrist + shoulder prehab                     |
| balance, handstand                  | Wall holds 4×30s + frog-to-wall daily             |
| leg, squat, pistol                  | Shrimp squats 3×8 + single-leg RDLs               |

Returns up to 6 deduplicated tips keyed by skill name.

## 23. Progressive-overload suggestion

If the last block of sets shows `avgReps ≥ target + 1` with average RIR ≥ 1,
bump weight by 2.5 kg. If reps fell below 4, drop weight by 2.5 kg and aim
for 5 clean reps. Otherwise stay at the same weight and add 1 rep.

## 24. Plateau detection

A PR is flagged as a plateau if no improvement for ≥ 14 days and the last
3 attempts are non-monotonic (slope ≤ 0).

---

## Audio

The WebAudio beep (`playBeep(freq, ms, vol)`) synthesises a simple sine
oscillator with an exponential gain ramp-down so it doesn't click. Used for
rest-timer expiry and PR celebration (880 Hz × 220 ms and a follow-up 1600 Hz
× 300 ms respectively). No audio assets are shipped with the app.

---

# Health OS algorithms

All Health math lives in `frontend/lib/healthAnalytics.ts` (to be created).

## H1. Daily Health Score (0–100)

Weighted composite of five pillars, each normalised to 0–1:

| Pillar      | Weight | Inputs |
|-------------|--------|--------|
| Sleep       | 30%    | `actualHours/goalHours` × `sleepQuality/10`, clamped 0–1 |
| Nutrition   | 25%    | `0.5×(kcalHit + proteinHit) + 0.25×fibreHit + 0.25×macroBalance`, all 0–1 |
| Hydration   | 20%    | `waterIntakeMl / dynamicWaterGoalMl`, capped at 1.0 |
| Movement    | 15%    | `1.0` if workout logged that day OR ≥8000 steps; 0.5 if movement but no wo; 0 otherwise |
| Mind        | 10%    | `((mood/10) + (1 − stress/10)) / 2` |

`score = (pillars × weights).sum × 100`, rounded to integer. Used by TRIAGE
tile and weekly reports.

## H2. Dynamic Water Goal

```
base_ml = 35 × weight_kg
climateMult = 1.0 | 1.1 for Chennai / coastal-tropical (default) | 1.05 temperate | 1.15 dry-hot
workoutAdj_ml = 500 × ceil(durationMin / 30) for each resistance/cardio session today
humidityAdj_ml = 200 if RH ≥ 70%
heatAdj_ml = 300 if T_ambient ≥ 32°C
goal_ml = base_ml × climateMult + workoutAdj + humidityAdj + heatAdj
```

- 35 ml/kg baseline = EFSA adequate intake for sedentary adult men.
- Climate multiplier informed by tropical-exercise hydration literature
  (Rivera-Brown &amp; Quiñones, 2020; Frontiers 2025 humid-heat sweat study).
- Workout sync: pulls duration from WorkoutSession.durationSeconds today.

## H3. Beverage hydration coefficients

Not all fluids are equal net hydrators. Used for "net hydration" tally:

| Beverage        | Coefficient |
|-----------------|-------------|
| Water           | 1.00        |
| Coconut water   | 0.98        |
| Milk / lassi    | 0.95        |
| Juice           | 0.90        |
| Tea             | 0.85        |
| Coffee          | 0.85 (acute diuretic tolerance in habitual drinkers) |
| Sports drink    | 0.95        |
| Soda            | 0.85        |
| ORS             | 1.00        |
| Alcohol         | −1.0 (per unit, dehydrating) — optional opt-in |

`netHydrationMl = Σ(volume × coeff)` across beverages.

## H4. Body Fat % — US Navy Method (men, metric)

```
BF% = 495 / (1.0324 − 0.19077 × log10(waist_cm − neck_cm)
             + 0.15456 × log10(height_cm))
     − 450
```

- Waist measured at navel, neck measured at narrowest point, both cm.
- Standard error ±3-4% vs DEXA; adequate for tracking trends.
- Fat mass = weight × BF/100; Lean mass = weight − fat mass.
- Women's formula (for future profile support):
  `BF% = 495/(1.29579 − 0.35004 × log10(waist+hip−neck) + 0.221 × log10(height)) − 450`.

## H5. BMR — Mifflin-St Jeor (men)

```
BMR = 10 × weight_kg + 6.25 × height_cm − 5 × age_years + 5
```

Most-validated equation for healthy adults (Mifflin 1990, ±10%). Default for
TDEE when BF% not logged.

### H5b. Katch-McArdle (when BF% is known)

```
BMR = 370 + 21.6 × LBM_kg
```

LBM = `weight × (1 − BF%)`. More accurate for trained/lean individuals; used
automatically whenever ≥1 BF measurement exists in the last 30 days.

## H6. TDEE

```
TDEE = BMR × activityMult
```

| Level | Mult | Profile |
|-------|------|---------|
| Sedentary      | 1.20 | Desk job, no formal exercise |
| Light          | 1.375 | Light exercise 1–3/wk |
| Moderate       | 1.55 | Trained 3–5 days/wk (DEFAULT for a 20yo lifter) |
| Active         | 1.725 | Hard training 6–7/wk, physical job |
| Very active    | 1.90 | Elite/twice-daily training |

### H6b. TDEE reverse-engineering (self-correcting)

Every 14 days of consistent logging (≥10 days weight + ≥10 days nutrition +
≥5 workouts), the model refines TDEE:

```
avgKcalIn = mean(daily kcal) over window
avgDeltaKgPerDay = linearRegressSlope(weight over window)
kcalPerKg = 7700  (approx; pure adipose ≈7700 kcal/kg but mixed tissue ~6500-7800)
measuredTDEE = avgKcalIn − avgDeltaKgPerDay × kcalPerKg
```

Displayed alongside the Mifflin estimate; user can choose which drives the
calorie target.

## H7. Calorie Target by Phase

| Phase        | Target                     |
|--------------|----------------------------|
| Cut          | TDEE − 300 kcal (0.3–0.5 kg/week) |
| Maintenance  | TDEE                        |
| Bulk         | TDEE + 250 kcal (0.25 kg/week lean bulk) |
| Recomp       | TDEE (protein 2.0 g/kg LBM, training priority) |

## H8. Protein Target by Phase

- Maintenance: 1.6 g/kg BW (ACSM baseline for trained)
- Cut: 2.0–2.4 g/kg LBM (muscle-sparing, per Helms et al.)
- Bulk: 1.6–2.2 g/kg BW
- Recomp: 2.0 g/kg LBM minimum

Capped at 2.4 g/kg BW (evidence of diminishing returns above).

## H9. Sugar Spike Risk (heuristic)

Inputs per meal: carbQuality ∈ {simple, complex, mixed}, pairing (fat+protein
present: none / some / high).

| Carbs     | No P/F | Some P/F | High P/F |
|-----------|--------|----------|----------|
| Simple    | HIGH   | MEDIUM   | MEDIUM   |
| Mixed     | MEDIUM | MEDIUM   | LOW      |
| Complex   | MEDIUM | LOW      | LOW      |

Educational heuristic only — not a glycemic-index calculator.

## H10. Sleep Bank (implemented Wave 3)

```
window = last 14 nights with valid duration (0 < duration < 16)
bank = 0
for each night in window:
  delta = durationHours − idealHours
  if delta < 0:   bank += delta                 # debit 1:1
  else:           bank += min(delta × 0.5, 1.0) # credit accrues half-rate, capped +1h/night
bank = clamp(bank, −20h, +10h)
```

- Credit is half-rate because you can't "bank" sleep the way you accrue debt
  (empirical: sleep extension has diminishing returns beyond ~9h, per Basner &
  Dinges 2009; banking 8h of surplus doesn't erase a week of 5h nights).
- Capping credit at +1h/night prevents gaming the metric.
- Global caps of [−20h, +10h] match the 14-day window: worst case ≈ 2 × all-nighter
  equivalent worth of chronic debt; best case ≈ a long weekend's worth of recovery.
- Thresholds (implemented):
  - `bank ≤ −5h` → amber nudge on Somnium "Sleep debt ≥5h — skip PR attempts today."
  - `bank ≤ −10h` → red banner "Pushing deload to Workout — drop volume 30-50%."
    Sets the flag for Workout to read (wave 7 full bridge integration; triage
    surfaces today).
- 7-day bar history on Somnium shows hours vs ideal; bank bar visualises position.

### H10a. Single-night sleep score (0–1)

```
durationFrac = min(1, durationHours / idealHours)
qualityFrac  = quality / 10     # user-subjective 1-10
score = 0.6 × durationFrac + 0.4 × qualityFrac
```

Duration weighted slightly higher than subjective quality because you can feel
"8/10 refreshed" on 5h of sleep due to caffeine masking.

### H10b. Sleep hygiene score (0–10)

Ten boolean checkpoints; each tick = 1 point:

1. No caffeine after 2pm (☕ half-life ~6h — even 2pm dose is ~25% circulating at 8pm)
2. Morning sunlight within 30 min of waking (circadian anchor)
3. Trained / moved today
4. No heavy meal <2h before bed
5. No alcohol tonight
6. Screens off 30 min before bed
7. Wind-down ritual ≥5 min
8. Pitch-black room
9. Cool room (22-26°C for Chennai ambient AC/cross-vent)
10. Consistent bed/wake ±30 min of schedule

### H10c. Duration hours

`durationHours = (wakeTime − bedTime) / 3.6e6` on ISO datetimes. Wake time earlier
than bed time (shouldn't happen with the datetime-local pair because bed is
"last night" and wake "this morning" by construction) returns 0 and UI rejects
<2h or >14h.

## H11. Recovery Quality Score (v1, implemented Wave 3)

Wave 3 ships a simplified composite that doesn't yet need Vitals/Mind data:

```
lastScore    = sleepScore(lastNightEntry, idealHours)   # 0-1
bankHours    = computeSleepBank(all entries, idealHours)
bankNorm     = clamp(1 − max(0, -bankHours) / 10, 0, 1) # 1 = no debt, 0 = ≥10h debt
hydrationFrac= min(1, todayWaterMl / waterGoalMl)
recovery     = 0.5 × lastScore + 0.3 × bankNorm + 0.2 × hydrationFrac
```

- Returns **0** if there are zero sleep entries (no data = no bogus score).
- Output 0–1, displayed ×100 on triage.
- Thresholds (display-only in wave 3):
  - ≥80 green (good to push), 60–79 amber (normal), <60 red (pull back).
- Vitals (HRV/RHR) + Mind (mood/stress) multipliers arrive in wave 5 to bring
  this in line with the full multi-factor spec above.

### H11a. Deload push hint

```
shouldDeload = computeSleepBank(sleep, ideal) ≤ −10
```

Simple binary flag for Workout to consume. Wave 7 layers in HRV/RHR/soreness
for a multi-factor overreaching detector.

## H12. Training Status classifier

Combines Recovery Score, strength trend (4-week PR slope), sleep bank, RHR
deviation, mood:

| State | Trigger pattern |
|-------|-----------------|
| Fitness improving | Recovery ≥ 65 + strength slope ≥ 0 + sleep bank ≥ −2 |
| Maintaining       | 50 ≤ Recovery &lt; 75 + strength flat + bank ≥ −5 |
| Fatigue accum.    | Recovery 40–55 for 5+ days OR bank &lt; −8 OR RHR +&gt;7bpm |
| Overreaching      | Recovery &lt; 40 + bank &lt; −10 + strength ↓ + mood ↓ for &gt;7 days → suggest deload |

## H13. Macro balance error

```
error = |actualCarbsPct − targetCarbsPct|
      + |actualProteinPct − targetProteinPct|
      + |actualFatPct − targetFatPct|
macroBalance = 1 − min(error / 200, 1)
```

(Each % is expressed 0–100; maximum total deviation = 200% since the three
always sum to 100%.)

## H14. Bulk/Cut/Recomp auto-detection

Rolling 28-day window:

| Phase | Weight trend | Waist trend | Strength trend |
|-------|--------------|-------------|----------------|
| Bulk  | +&gt;0.25 kg/wk | ↑ or stable | ↑ or stable |
| Cut   | −&gt;0.25 kg/wk | ↓           | stable or ↑ (good cut) / ↓ (too fast) |
| Recomp | ±1 kg/mo    | ↓           | ↑              |
| Maintenance | ±0.5 kg/mo | stable     | stable         |

User can override manually at any time.

## H15. Supplement adherence & streaks (implemented Wave 3)

```
30d adherence% = days_taken_in_last_30 / 30 × 100   (per-suppId)
streak(suppId) = consecutive days with a "taken" log ending today, max 365
```

- Streaks walk backwards from today via `Date.setDate(d-1)` so missed days break
  the streak; 0 if today not taken.
- Overall adherence displayed on Apothecary & triage is 7d adherence across all
  supplements (percent of supp×day slots taken).

## H16. Micronutrient deficiency badges (heuristic, Wave 3)

Per nutrient (10 tracked: D3, B12, iron, zinc, calcium, omega-3, magnesium,
vitC, folate, potassium) over a trailing 7-day window:

```
totalIntake = Σ foodContributions(items logged)        // rough keyword hints (see FOOD_MICRO_HINTS)
             + Σ suppDoses(supplementLog "taken")       // per-suppId doses in SUPP_MICRO_DOSE
             + sunContribution(sunlight)                // vitamin D only: 80 IU/min midday, cap 3000 IU/wk
fraction = totalIntake / (RDA × 7)
level    = "ok"        if fraction ≥ 0.9
         | "watch"     if 0.6 ≤ fraction < 0.9
         | "at_risk"   if 0.3 ≤ fraction < 0.6
         | "deficient" if fraction < 0.3
```

- RDAs use ICMR 2020 values for adult men (D3 600 IU, B12 2.4 mcg, iron 19mg,
  zinc 12mg, calcium 600mg, omega-3 250mg EPA+DHA, magnesium 420mg, vitC 80mg,
  folate 300mcg, potassium 3500mg).
- Food hints are coarse keyword matches (e.g. "fish curry" → 400mg omega-3,
  300 IU D3, 2.0 mcg B12). Wave 8 replaces this with a proper nutrient DB.
- Sunlight→D3 is a very rough synthesis estimate for South Indian skin type V
  at noon (Chennai 13°N, UV index high year-round). Midday sun = best D3;
  morning/evening = primarily circadian, negligible D3. The 80 IU/min figure
  is a conservative midpoint across skin-type-IV/V synthesis studies
  (spring/summer midday UV in Chennai = ~10-20 min = ~1000-3000 IU).
- Prevalence context for India (ICMR/NIN 2019-2024 urban surveys) shown under
  each badge so the user understands why D3/omega3 default to "deficient"
  for a new Chennai user.
- **Always shows tip:** "estimates, not diagnosis — get bloodwork". Wave 8
  lets users pin bloodwork results to override estimates.

## H17. Routine adherence %

```
adherence% = steps_done_today / total_steps × 100
```

Per routine (bedtime / wake). Steps are ordered checklists; toggling flips
`doneToday` boolean, reset is implicit when the day rolls over (no cron; the
adherence number is "today so far").

---

# Health ↔ Workout bridge contract

The two spaces share the root Zustand store but own separate state slices.
Access happens via selectors — no cross-slice mutation.

## Health READS from Workout (pull)

| Health reads | Workout source | Frequency |
|---|---|---|
| Bodyweight entries | `workout.bodyweight[]` | live on mount; Workout is source of truth |
| Active/completed sessions today | `workout.sessions[] filtered by today` | live |
| Session duration for water goal | `WorkoutSession.durationSeconds` | on session end |
| Cardio logs (distance, duration, avg HR, hr2minPost) | `workout.cardioLogs[]` | live |
| PRs for S:W ratio | `workout.prs[]` | live |
| Hydration pre/post (workout measures) | `WorkoutSession.hydrationPreMl/PostMl` | per-session |
| Readiness sliders (soreness, sleep, stress) | `workout.readiness[]` | daily |
| Caffeine mg logged pre-wo | `WorkoutSession.caffeineMg` | per-session |
| Training phase (bulk/cut/etc.) | `workout.settings.phase` | live |
| Joint pain tags | `WorkoutSession.jointPain[]` | per-session |
| Routine focus (push/pull/legs/etc.) for targeted measurement hints | derived from routine blocks' muscle groups | per-session |

## Health WRITES to Workout (push)

These are advisory signals surfaced in Workout UI, not forced state mutations:

| Health pushes | Workout consumption |
|---|---|
| Sleep bank value + sleep score | WorkoutsReadiness view shows "Sleep debt −6h — consider lighter session" |
| Hydration status (% of goal) | Pre-workout warning card if &lt;60% hydrated |
| TDEE + calorie target | Nutrition view's surplus/deficit chart |
| Injury/symptom flags | Session-start nudge ("Left shoulder flagged in Health — skip OHP?") |
| Recovery score | Readiness view incorporates into composite |
| Supplement markers (creatine taken today, pre-wo dosed) | Stamped onto WorkoutSession.metadata (when session created while supp logged) |
| Deload suggestion (H12 Overreaching) | Workout deload-detector incorporates Health flag |

## No circular imports allowed

- `lib/healthAnalytics.ts` may import from `lib/workoutAnalytics.ts` (Epley 1RM reused)
- `lib/workoutAnalytics.ts` MUST NOT import from healthAnalytics (read-only via selectors)
- Both slices live under `lib/store.tsx` root; migration functions `migrateHealth` / `migrateWorkout` / `migrateCareer` / `migrateForge` are independent.

## Event bus (future, v1.1+)

For v1.0 all cross-space reads are synchronous store selectors. An event bus
(`health:workout_event` / `workout:session_complete` etc.) is a v1.2 nicety
for decoupled push notifications (e.g., session-complete → Health prompt for
post-wo water).
