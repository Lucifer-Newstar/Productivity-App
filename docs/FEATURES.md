# Workout Feature Status

Last audited against the 149-feature checklist (35 cali + 45 gym + 22 cardio +
47 global). Legend:

- ✅ Shipped, wired to the store, persists across refresh
- 🟡 Present in the UI but local-state-only, or scaffold/placeholder, or missing a calculation
- ❌ Not yet implemented

## Calisthenics (35)

| # | Feature | Status |
|---|---|---|
| 1 | Progression Chain Tracker | ✅ 4 seeded chains, click-to-toggle, auto-suggest on PR triggered via ActiveWorkout |
| 2 | Skill Tree Visualization | 🟡 Flat skill cards; hierarchical tree visual not yet drawn |
| 3 | AMRAP Logger | ✅ Timer + rounds + reps, persists to `intervalLogs` |
| 4 | Grease-the-Groove Tracker | ✅ 7am–6pm hourly grid, wired to store |
| 5 | Freestyle Flow Logger | ✅ Name + moves + quality 1–10, persisted |
| 6 | Rest Day Log | ✅ Reason chips + custom note, persisted |
| 7 | Isometric Hold Timer | ✅ Stopwatch + log button, persists to `isometricLogs` |
| 8 | Tempo Training Mode | 🟡 Input exists in ActiveWorkout set metadata (per-set tempo field wired to store); cali tab has no specific tempo UI |
| 9 | First/Best Attempt Logger | ✅ `firstAttemptDate` / `bestAttempt` fields; "Log attempt" button wired to `logCaliAttempt` |
|10 | Assistance Exercise Mapper | 🟡 `accessoryIds` field per skill; no automatic "reduce assistance" suggester |
|11 | Failed Attempt Logger | ✅ "Log fail" writes to `failLog[]`; weakness analysis reads from it |
|12 | Mobility Warm-up Library | ✅ 6 seeded drills, checkboxes, auto-summed duration, persisted |
|13 | Ring Height Tracker | ✅ `ringHeightCm` field exists on attempts |
|14 | Unlock Checklist | ✅ 7 predefined milestones |
|15 | Pseudo-Planche Tracker | ✅ `plancheEntries[]` — hand distance + hold seconds, persisted |
|16 | Movement Pattern Library | ✅ Push/Pull/Squat/Hinge/Carry/Rotation/Gait/Isometric tags on exercises + chains |
|17 | GtG Advanced (timeline + total vol) | ✅ Hourly grid + daily total reps; per-set timestamps implicit from hour grid |
|18 | GtG Streak | ✅ Day counter |
|19 | Skill Difficulty Rating | ✅ 1–10 stars on each progression |
|20 | Skill Unlock Celebration | 🟡 Unlock flag; no dedicated celebration modal yet (uses confetti path) |
|21 | Calisthenics Routine Builder | 🟡 Generic routine builder works for all blocks; no cali-specific flow |
|22 | Rest-Pause for Cali | ✅ `isRestPause` / `restPauseAttempts` fields on attempts |
|23 | Accessory Linker | ✅ `accessoryIds[]` per skill |
|24 | Test Day Logger | ✅ `isTestDay` flag on attempts |
|25 | EMOM Tracker | ✅ Per-minute input grid |
|26 | AMRAP Tracker | ✅ (same as #3) |
|27 | Flow Sequence + Quality | ✅ (same as #5) |
|28 | Mind-Muscle Connection | ✅ `mmc` 1–10 field on attempts |
|29 | Cali Equipment Logger | ✅ `equipmentNeeded[]` per skill (bar/rings/parallettes/bands/vest/dip-bars) |
|30 | Progression Video Link | ✅ `videoUrl` field |
|31 | Tempo for Cali | 🟡 Per-set tempo field in ActiveWorkout |
|32 | Warm-up Specific Checklist | ✅ Mobility section includes wrists, dislocates, scap pushups, hollow, cat-cow, 90/90 |
|33 | Skill Archive | ✅ `archived` flag + toggle |
|34 | Cali PR History | ✅ Per-skill `attempts[]` sorted by date |
|35 | Weakness Analysis | ✅ `weaknessAnalysis()` reads `failLog[]` and returns targeted accessory tips |

## Gym / Weights (45)

| # | Feature | Status |
|---|---|---|
| 1 | Progressive Overload | ✅ Core logging via ActiveWorkout (weight × reps × sets, RIR, RPE) |
| 2 | History Drawer | ✅ Last 5 sessions card (per session; per-exercise drawer pending) |
| 3 | 1RM Calculator (Epley) | ✅ Live |
| 4 | Plate Calculator | ✅ Greedy kg Olympic plate fit incl. 0.25 kg microplates |
| 5 | Warm-up Set Toggle | ✅ `isWarmup` per-set flag + generated warm-up list in Gym tab; warmup sets excluded from 1RM math |
| 6 | Joker Sets | ✅ `isJoker` flag |
| 7 | Myo-Reps / Rest-Pause | 🟡 `isMyo` typed; cluster UI uses `clusterReps[]` / `clusterRestSec` |
| 8 | DB↔BB Conversion | ✅ x2 × 0.85 both directions |
| 9 | Left/Right Imbalance | ✅ `leftWeight/rightWeight/leftReps/rightReps` fields |
|10 | Workout Templates | ✅ Routines serve as templates (`isTemplate` flag exists) |
|11 | RPE Logger | ✅ 6–10 RPE buttons per set, persisted |
|12 | RIR Tracker | ✅ 0–4 RIR buttons per set, persisted |
|13 | AMRAP Last Set Mode | ✅ `isAMRAP` flag |
|14 | Drop Set Logger | ✅ `isDrop` flag + `dropFromWeight` |
|15 | Superset Pairing | 🟡 `isSuperset` / `supersetGroupId` fields; UI toggle pending |
|16 | Giant Set Logger | 🟡 `isGiant` flag |
|17 | Feeling Check-in Per Set | ✅ `feeling` field (fast/normal/slow/grind) |
|18 | EMOM Logger (gym) | ✅ Generic EMOM in cali tab usable for any modality |
|19 | Cluster Set Builder | ✅ `clusterReps[]` + `clusterRestSec` |
|20 | Barbell Spin Check | 🟡 Not yet surfaced as a checkbox |
|21 | Grip Type Logger | ✅ Overhand/underhand/mixed/hook/straps toggle |
|22 | Pause Variant Logger | ✅ `isPaused` + `pauseSec` (1/2/3/5) |
|23 | Belt/Knee Sleeves Logger | ✅ Per-set toggles |
|24 | Micro-loading | ✅ Plate calculator has 0.5/0.25 kg plates |
|25 | AMRAP Last Set History | 🟡 History exists in PR history table; dedicated AMRAP-only view pending |
|26 | Rep Quality Rating | ✅ perfect/good/decent/bad per set |
|27 | Volume Calculator | ✅ Sets × reps × weight aggregated per session/week |
|28 | Intensity Calculator | ✅ `weeklyStats().avgIntensity` = mean % of 1RM across working sets |
|29 | Strength-to-Weight | ✅ Live calc |
|30 | Wilks Score | ✅ Wilks 2020, male/female toggle |
|31 | Symmetric Strength Graph | ❌ |
|32 | Barbell Speed Logger | ✅ `speed` field (fast/normal/slow/grind) |
|33 | Lockout vs Sticking Point | 🟡 `stickingPoint` typed; selector pending UI |
|34 | Asymmetry Tracker | ✅ `asymmetry` flag (left-weak/right-weak/none) |
|35 | Injury Pain Scale Per Set | ✅ `pain` 0–5 scale |
|36 | Mental State Per Set | ✅ `mental` field; UI for locked-in/distracted/anxious/tired pending |
|37 | Intra-workout Nutrition | ✅ `nutrition: {carbsG, bcaaG, electrolytes, waterMl}` on session |
|38 | Workout Number in Program | ✅ `workoutNumberInProgram` on session |
|39 | Deload Indicator | ✅ 12-session / 6-week rule, surfaces in Global tab |
|40 | Training Max Calculator | ✅ 0.9 × 1RM |
|41 | RPE Auto-calibration | ❌ |
|42 | RIR History | 🟡 Stored per set; no dedicated chart |
|43 | AMRAP Projection | ✅ Inverted Epley in Gym tab |
|44 | Workout Comparison | ❌ Side-by-side not implemented |
|45 | Gym Music Playlist Logger | ✅ Session-level playlist field in Global metadata card |

## Cardio (22)

| # | Feature | Status |
|---|---|---|
| 1 | Distance & Time | ✅ All 8 type chips + distance + duration |
| 2 | Route Name & Comparison | ✅ Route stored; comparison view coming |
| 3 | HR Recovery | ✅ avgHR − 2min-post computed live |
| 4 | Cadence Tracker | ✅ SPM field |
| 5 | Negative Split Tracker | ✅ `isNegativeSplit()` helper + `splitsSec[]` field |
| 6 | HR Drift Calculator | ✅ (end − start)/start × 100 live |
| 7 | Fueling Pre-Run | ✅ Text field |
| 8 | Strides Tracker | ✅ `strides: {count, distanceM}` |
| 9 | Cool-Down Duration | ✅ Cooldown min field |
|10 | Jump Rope Logger | ✅ Jumps + misses |
|11 | HR Zone Bars | ✅ Z1–Z5 colored bars |
|12 | Max HR Calculator | ✅ 220 − age |
|13 | Anaerobic Threshold | ❌ Estimation not exposed |
|14 | VO2 Max | ✅ Cooper 12-min inline |
|15 | Running Economy | ✅ `runningEconomy()` (pace/HR ratio) |
|16 | Run Power | 🟡 Field present; no Stryd import |
|17 | Intervals | ✅ Toggles + `intervals[]` shape |
|18 | Fartlek | ✅ `fartlek[]` field |
|19 | LSD Logger | ✅ Toggle + chip |
|20 | Recovery Run | ✅ Toggle + chip |
|21 | Brick Workout | ✅ Toggle + chip + `brickNextType` |
|22 | Cardio Injury Notes | ✅ Free-text + `injuryTags[]` (shin/ITB/achilles/plantar) |

## Global (47)

| # | Feature | Status |
|---|---|---|
| 1 | Bodyweight Popup | ✅ Modal on first-open per day, skip/log buttons, sessionStorage ack |
| 2 | Rest Timer | ✅ Sticky bottom-floating, 60/90/120/180 presets, WebAudio beep |
| 3 | Injury Log | 🟡 Per-session `jointPain[]` post-workout prompt coming |
| 4 | Hormonal Cycle Sync | ❌ |
| 5 | Frankenstein Workout | ✅ 3 random exercises from library |
| 6 | Year Heatmap | ✅ 365-day GitHub-style, 5 intensity levels |
| 7 | Warm-up Library | ✅ Auto-generated in ActiveWorkout; user-library drills in Mobility |
| 8 | Cooldown Library | ✅ `suggestCooldown()` returns muscles hit |
| 9 | Duration Tracker | ✅ Auto-tracked wall-clock per session |
|10 | Gym Crowdedness | ✅ 4-level select, persisted to last session |
|11 | Playlist Logger | ✅ Text input, persisted to session |
|12 | Time of Day | ✅ Bucketed auto from `startedAt` (morning/afternoon/evening) |
|13 | Hydration Pre/Post | ✅ Two number inputs, persisted to session |
|14 | Pre-Workout Supplement | ✅ Checkbox + caffeine mg field |
|15 | Training Phase Tag | ✅ Bulking/Cutting/Maintenance/Deload/Peak, persisted to settings |
|16 | Workout Rating 1–10 | ✅ Selector, persisted to session |
|17 | Next Workout Suggestions | 🟡 Readiness intensity multiplier surfaces a recommendation; routine-level next suggestion pending |
|18 | Program Management | ✅ `programs[]` CRUD actions exist in store |
|19 | Deload Calculator | ✅ (same as gym #39) |
|20 | PR Celebration Banner | ✅ Confetti burst on PR in ActiveWorkout |
|21 | Streak Counter | ✅ `currentStreak` / `longestStreak` |
|22 | Weekly Volume | ✅ Card in Global |
|23 | Joint Pain Check | 🟡 Post-session check pending |
|24 | Soreness Rating | ✅ Daily readiness slider 1–10 |
|25 | Completion Timeline | ❌ |
|26 | Calendar View | ✅ Month view with prev/next, pink workout-day cells |
|27 | Global Streak | ✅ |
|28 | Consistency Score | ✅ `consistencyScore()` shows % in stat card |
|29 | Weekly Volume | ✅ |
|30 | Weekly Intensity | ✅ `weeklyStats().avgIntensity` |
|31 | Weekly Duration | ✅ Stat card |
|32 | Frequency by Day | ✅ `frequencyByDay()` summary line |
|33 | Time Preference | ✅ `timePreference()` shows most common bucket |
|34 | Unified Journal | ✅ Add/delete/search entries |
|35 | Notes Search | ✅ Client-side full-text filter |
|36 | Trend Analysis | 🟡 52-week heatmap shows volume trends; dedicated chart pending |
|37 | Goal Tracking | ✅ Create/delete goal cards; achievement badge fires on `achieved: true` |
|38 | Goal Celebration | 🟡 Uses generic badge path |
|39 | Program Progress (Week X of Y) | ❌ Dedicated UI pending |
|40 | Program Log | ✅ Routines attach to `programId` |
|41 | Custom Metrics | ✅ `customMetrics[]` + entries per session |
|42 | Data Export (CSV) | ✅ One-click export covering strength sets + cardio logs |
|43 | Data Import | ❌ |
|44 | Backup | ❌ |
|45 | Rest Day Logger | ✅ 5 reason chips + custom note |
|46 | Motivation Board | ✅ Add/delete custom quotes/PRs/goals, seeded with 3 entries |
|47 | Challenge Logger | ✅ Create 30-day challenges, toggle days, persisted |

## Core workout features (pre-existing)

All of the "Ultimate Workout App Checklist" tier-0 items are shipped: PRs with
history + 1RM, skills/progressions, multi-unit exercises (reps / seconds /
meters / kg) with equipment/level/pattern filters, schedule w/ sets × reps, per-set
timer + rest timer w/ beep, RIR, 7-day muscle heatmap, CSV export, warm-up
generator, cooldown, achievement badges with confetti, streaks, readiness,
dark mode, glove mode, minimal mode, one-thumb nav during sessions, 3D muscle
model (89-region anatomical SVG).

## Updated this session

- ✅ **Real sub-pages**: `/workout/overview`, `/workout/library`, `/workout/calisthenics`, `/workout/gym`, `/workout/cardio`, `/workout/prs`, `/workout/skills`, `/workout/schedule`, `/workout/tools` — each is its own file in `pages/workout/` using the `WorkoutPage` HOC with `fullScreen = true`; index redirects to `/overview`. AnimatePresence cross-fades between them; left-rail + mobile bottom-tab nav uses `router.push` with `scroll:false` for instant feel.
- ✅ **Expanded exercise library**: ~120 seeded movements across chest / back / shoulders / arms / legs / core / cali skills / cardio. Each tagged with primary + secondary muscles, equipment, level, movement pattern, and 2–4 form cues. Replaces the previous 15-exercise seed.
- ✅ **Mini muscle-map on the Library**: compact (200px) sticky sidebar rendering of the anatomical SVG. Clicking a region filters the grid to exercises targeting that muscle (primary OR secondary). Hovering an exercise card highlights its primary muscle on the map via the `highlight` prop. Quick-filter chips + equipment/level/pattern chips + search sit below.
- ✅ **Back muscle SVG bug fixed**: `<g transform="translate(-34,0)">` on the back group + widened viewBox `-8 -28 48 125` so back muscles (authored at x≈32..67) render in frame.
- ✅ **UI comfort pass**: cards bumped to p-6 with gap-7 between sections, hero panels have 8 px internal padding, larger 28px hero icons, ambient colored blobs tuned, hover glow on exercise cards matches the muscle color, transitions 0.2–0.28s eased.
- ✅ **Backend** Express server (port 4000): `/api/health`, full CRUD on `/api/exercises`, session helpers (`/api/sessions/:id/sets` auto-tallies volume; `PATCH /api/sessions/:id/finish` sets duration), `/api/analytics/*`, `/api/sync`. CORS open to :3000. `tsc` passes.
- ✅ **ActiveWorkout Set Details**: bar-spin OK, sticking-point selector (off-floor/mid-range/lockout/transition), mental state (locked-in/distracted/anxious/tired), tempo string (e.g. 3-1-2-1), superset/giant/cluster/myo-rep/unilateral toggles (cluster accepts comma-separated micro-set reps + inter-set rest; myo-rep RPE stop selector; unilateral captures L/R reps).
- ✅ **Post-session check-in** modal pops on finish: 1–10 session rating, joint-pain multi-select, crowd level, training phase, free-text note — all persisted to the session.
- ✅ **Per-exercise history drawer** (clock icon on library cards): total sets, best set, total volume, sparkline of estimated 1RM over time with PR dots, recent-sets list with RPE/RIR/flags.
- ✅ **Next-workout suggestion engine** (`suggestNextWorkout()`): picks today's scheduled routine with an intensity note (deload/easy/normal/push/PR based on readiness + deload detection), otherwise picks the most undertrained major muscle group from last 5 days avoiding yesterday's muscles; shown as "Suggested today" card on overview.
- ✅ **CelebrationModal** reusable spring-animated full-screen overlay used for PRs and goal achievement.
- ✅ **Symmetric Strength chart** on Gym tab: best squat/bench/deadlift/OHP 1RM vs powerlifting-standard ratios (1.00/0.75/1.25/0.45), animated fill, balance percentage color-coded.
- ✅ **Lactate threshold** card: age input + trained toggle → Max HR, LT1 (~77%), LT2 (~90% trained).
- ✅ **RPE auto-calibration** card: after 3+ sets logged with RPE, shows sample count, mean error vs. standard RPE table, and a personal multiplier.
- ✅ **Goal progress bars + auto-achievement**: each goal shows current/target with progress bar; progress computed via `goalProgress()` for workouts/streak/volume/bodyweight/1RM; when a goal flips to achieved it's stamped with `achievedAt`, crossed out in lime, and triggers the celebration modal.
- ✅ **Dependencies** bumped within the pinned React 18 / Next 14 line: next 14.2.35 (latest 14.x patch, fixes many GHSAs), postcss 8.5.26, lucide-react & framer-motion latest. Removed unused `body-muscles` package.

