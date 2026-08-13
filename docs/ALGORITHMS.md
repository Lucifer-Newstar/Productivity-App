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
