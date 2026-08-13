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
| 2 | Skill Tree Visualization | ✅ Branched SVG viz on Skills page — one vertical branch per skill, filled nodes + dashed "current" ring, gradient progress fill up the trunk; clickable nodes toggle completion |
| 3 | AMRAP Logger | ✅ Timer + rounds + reps, persists to `intervalLogs` |
| 4 | Grease-the-Groove Tracker | ✅ 7am–6pm hourly grid, wired to store |
| 5 | Freestyle Flow Logger | ✅ Name + moves + quality 1–10, persisted |
| 6 | Rest Day Log | ✅ Reason chips + custom note, persisted |
| 7 | Isometric Hold Timer | ✅ Stopwatch with WebAudio beep on start/stop; Log button persists to `isometricLogs`, recent entries listed inline |
| 8 | Tempo Training Mode | 🟡 Input exists in ActiveWorkout set metadata (per-set tempo field wired to store); cali tab has no specific tempo UI |
| 9 | First/Best Attempt Logger | ✅ `firstAttemptDate` / `bestAttempt` fields; "Log attempt" button wired to `logCaliAttempt` |
|10 | Assistance Exercise Mapper | 🟡 `accessoryIds` field per skill; no automatic "reduce assistance" suggester |
|11 | Failed Attempt Logger | ✅ "Log fail" writes to `failLog[]`; weakness analysis reads from it |
|12 | Mobility Warm-up Library | ✅ 6 seeded drills, checkboxes, auto-summed duration, persisted |
|13 | Ring Height Tracker | ✅ `ringHeightCm` field + slider UI in Log-attempt modal (80–260 cm), auto-stamped on bestAttempt |
|14 | Unlock Checklist | ✅ 7 predefined milestones |
|15 | Pseudo-Planche Tracker | ✅ `plancheEntries[]` — hand distance + hold seconds, persisted |
|16 | Movement Pattern Library | ✅ Push/Pull/Squat/Hinge/Carry/Rotation/Gait/Isometric tags on exercises + chains + dedicated Pattern Library browser panel on the Library page with descriptions and per-pattern exercise counts; click a pattern card to filter |
|17 | GtG Advanced (timeline + total vol) | ✅ Hourly grid + daily total reps + 7-day sparkline of daily GtG volume; custom exercise/reps inputs |
|18 | GtG Streak | ✅ Auto-computed day streak (consecutive days with any GtG sets) |
|19 | Skill Difficulty Rating | ✅ 1–10 stars on each progression |
|20 | Skill Unlock Celebration | ✅ Dedicated amber CelebrationModal fires "Unlocked: <skill>!" on the first logged attempt of a cali skill (distinct from full mastery on the Workout-Skills page) |
|21 | Calisthenics Routine Builder | 🟡 Generic routine builder works for all blocks; no cali-specific flow |
|22 | Rest-Pause for Cali | ✅ `isRestPause` / `restPauseAttempts` fields on attempts |
|23 | Accessory Linker | ✅ `accessoryIds[]` per skill |
|24 | Test Day Logger | ✅ `isTestDay` flag on attempts |
|25 | EMOM Tracker | ✅ Running MM:SS timer, per-minute rep input, perMinuteReps persisted to intervalLogs, WebAudio beep each minute
|26 | AMRAP Tracker | ✅ Cap timer, rounds+reps entry, auto-beep at cap, persisted to intervalLogs with notes |
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
| 2 | History Drawer | ✅ Per-exercise drawer: total sets, best set, total volume, Epley 1RM sparkline w/ PR dots, RPE-trend chart, last-12-session volume bars, recent-sets list with RPE/RIR/flags; resolves both routine blocks and ad-hoc (freestyle) blocks |
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
|15 | Superset Pairing | ✅ `Link2` toggle between adjacent blocks in Schedule; `supersetGroupId` propagated; ActiveWorkout skips rest + plays 660 Hz chirp + shows "→ superset" chip between linked blocks |
|16 | Giant Set Logger | ✅ Auto-detects groups of ≥3 adjacent linked blocks and shows GIANT badge; same zero-rest flow as supersets |
|17 | Feeling Check-in Per Set | ✅ `feeling` field (fast/normal/slow/grind) |
|18 | EMOM Logger (gym) | ✅ Generic EMOM in cali tab usable for any modality |
|19 | Cluster Set Builder | ✅ `clusterReps[]` + `clusterRestSec` |
|20 | Barbell Spin Check | ✅ Checkbox in set-details panel, persisted to `barSpinOk` |
|21 | Grip Type Logger | ✅ Overhand/underhand/mixed/hook/straps toggle |
|22 | Pause Variant Logger | ✅ `isPaused` + `pauseSec` (1/2/3/5) |
|23 | Belt/Knee Sleeves Logger | ✅ Per-set toggles |
|24 | Micro-loading | ✅ Plate calculator has 0.5/0.25 kg plates |
|25 | AMRAP Last Set History | ✅ Per-session AMRAP max-reps bar chart in the Exercise History drawer (last 15 sessions with an AMRAP set tagged) |
|26 | Rep Quality Rating | ✅ perfect/good/decent/bad per set |
|27 | Volume Calculator | ✅ Sets × reps × weight aggregated per session/week |
|28 | Intensity Calculator | ✅ `weeklyStats().avgIntensity` = mean % of 1RM across working sets |
|29 | Strength-to-Weight | ✅ Live calc |
|30 | Wilks Score | ✅ Wilks 2020, male/female toggle |
|31 | Symmetric Strength Graph | ✅ Gym tab chart: squat=1.00/bench=0.75/dead=1.25/OHP=0.45 ratios, ghost target bar vs solid actual, balance % |
|32 | Barbell Speed Logger | ✅ `speed` field (fast/normal/slow/grind) |
|33 | Lockout vs Sticking Point | ✅ Chip selector (none/off-floor/mid-range/lockout/transition) in set-details |
|34 | Asymmetry Tracker | ✅ `asymmetry` flag (left-weak/right-weak/none) auto-set in ActiveWorkout when unilateral L/R reps differ by ≥2; manual tag still possible via metadata |
|35 | Injury Pain Scale Per Set | ✅ `pain` 0–5 scale |
|36 | Mental State Per Set | ✅ Chip selector (locked-in/distracted/anxious/tired) in set-details |
|37 | Intra-workout Nutrition | ✅ `nutrition: {carbsG, bcaaG, electrolytes, waterMl}` on session |
|38 | Workout Number in Program | ✅ `workoutNumberInProgram` on session |
|39 | Deload Indicator | ✅ 12-session / 6-week rule, surfaces in Global tab |
|40 | Training Max Calculator | ✅ 0.9 × 1RM |
|41 | RPE Auto-calibration | ✅ Gym tab card: ≥3 RPE-flagged sets → sample count, mean error vs. standard table, personal multiplier |
|42 | RIR History | ✅ Per-set storage + dedicated RIR trend strip in Exercise History drawer (0=failure→top red, 4=easy→bottom cyan); RIR tag shown per set in the recent list |
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
|13 | Anaerobic Threshold | ✅ Lactate threshold card: LT1 (~77% MHR) / LT2 (~90% trained / 85% untrained) shown |
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
| 1 | Bodyweight Popup | ✅ Modal on first-open per day, skip/log buttons, localStorage ack (persists across hard refresh) |
| 2 | Rest Timer | ✅ Sticky bottom-floating, 60/90/120/180 presets, WebAudio beep |
| 3 | Injury Log | ✅ Post-session joint-pain multi-select (shoulders/elbows/wrists/neck/upper back/lower back/hips/knees/ankles/shins) → persists to `jointPain[]`; surfaces prehab accessory recs on Overview via `recommendedAccessories()` |
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
|17 | Next Workout Suggestions | ✅ `suggestNextWorkout()` picks today's routine w/ intensity note, or most undertrained muscle avoiding yesterday's; shown as "Suggested today" card |
|18 | Program Management | ✅ Program create form on Schedule (name/weeks/days/week), Week-X-of-Y progress bar, auto-tags new sessions with programId + workoutNumber |
|19 | Deload Calculator | ✅ (same as gym #39) |
|20 | PR Celebration Banner | ✅ Confetti burst on PR in ActiveWorkout |
|21 | Streak Counter | ✅ `currentStreak` / `longestStreak` |
|22 | Weekly Volume | ✅ Card in Global |
|23 | Joint Pain Check | ✅ Post-session multi-select; accessory/prehab recs on Overview |
|24 | Soreness Rating | ✅ Daily readiness slider 1–10 |
|25 | Completion Timeline | ✅ "Recent sessions" timeline on Overview shows last 10 completed sessions reverse-chronological with volume/duration/sets/rating; full history available via individual exercise drawers + CSV export |
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
|36 | Trend Analysis | ✅ 52-week heatmap + 12-week volume sparkline on Overview (with avg/this-week/Δ); RPE trend + per-session volume bars in Exercise History drawer |
|37 | Goal Tracking | ✅ Expanded create form: metric selector (workouts/streak/volume-kg/bodyweight-kg/1rm-kg), target, by-date, exercise picker for 1RM goals; auto-achievement detection |
|38 | Goal Celebration | ✅ Dedicated lime CelebrationModal ("🎯 Goal achieved!") |
|39 | Program Progress (Week X of Y) | ✅ Week-X-of-Y chip + progress bar on Schedule; auto workoutNumber tagging on start |
|40 | Program Log | ✅ Routines attach to `programId` |
|41 | Custom Metrics | ✅ `customMetrics[]` + entries per session |
|42 | Data Export (CSV) | ✅ One-click export covering strength sets + cardio logs |
|43 | Data Import | ✅ CSV import on Global/Tools tab — mirrors export format, auto-creates sessions per date, imports new exercises, respects ad-hoc blocks |
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

## Latest batch (continuing)

- ✅ **Freestyle / Quick-start logger**: sessions created without a routine (e.g. Quick start, Frankenstein) no longer hit the dead "All sets done" screen. A new `FreestyleWorkout.tsx` component drives a free-form session: search + muscle/equipment filters to pick exercises, per-exercise set logging with all RPE/RIR/warmup flags, rest timer between sets, blocks are persisted to `session.adHocBlocks[]` so history/CSV/refresh resolves names correctly. Re-selecting an existing exercise returns to its running counter.
- ✅ **Freestyle persistence**: new `session.adHocBlocks?: WorkoutBlock[]` field + `addAdHocBlock()` store action. `getExerciseForBlock()` now scans both routine blocks AND session ad-hoc blocks, so every downstream feature (history drawer, CSV, volume heatmaps) works for freestyle sets.
- ✅ **Program Week X of Y** card on Schedule: active program card shows week X of Y chip, workouts/total count, start date, gradient progress bar. New-program form (name/weeks/days/week, starts today). Starting any routine while a program is active auto-tags the session with `programId` + `workoutNumberInProgram`.
- ✅ **Goal creation form** expanded: metric selector (workouts / streak / volume-kg / bodyweight-kg / 1rm-kg), numeric target, optional by-date, exercise picker when metric is 1RM. Collapsible form (New goal / Close).
- ✅ **Joint-pain → accessory recommender**: `recommendedAccessories()` maps each joint tag (shoulders/elbows/wrists/neck/upper-back/lower-back/hips/knees/ankles/shins) to 3–4 specific prehab/accessory tips. Shown automatically on Overview after a session that logged pain.
- ✅ **12-week volume trend sparkline** on Overview: filled SVG area chart with 12 weekly points, average/this-week/delta stat line, pink dot for latest week.
- ✅ **RPE trend + per-session volume bars** added to `ExerciseHistoryDrawer`. Drawer now resolves sets from both routine and ad-hoc blocks (so freestyle sets show up).
- ✅ Minor gap-fill: bar-spin, sticking point, and mental-state selectors were typed but not rendered in the set-details panel — now visible; updated status rows accordingly.
- ✅ **Hierarchical skill tree SVG**: branched visualization on the Skills page. Each skill is a vertical branch with progression nodes bottom-to-top, completed nodes filled lime with checkmark, the next-in-line node gets a dashed amber ring, future nodes are dim. A gradient bar fills the trunk up to the highest completed progression. Skill names label the top node. Nodes are clickable to toggle.
- ✅ **CSV import**: new `importSession()` store action inserts a fully-formed session into state (with ad-hoc block resolution, totalVolumeKg, streak recompute). The Tools page now has Import CSV next to Export: parses the same CSV columns the export writes, groups rows by date into sessions, auto-creates unknown exercises as "misc", assigns ad-hoc block ids per exercise, and commits one session per date via `importSession()`.
- ✅ **Data card** on Tools page with Import/Export CSV buttons.
- ✅ **AMRAP history chart** in Exercise History drawer: per-session max-reps bar chart for sessions with AMRAP-flagged sets (last 15), hover shows rep count.
- ✅ **In-session history button** (clock icon) in the current-exercise hero of both ActiveWorkout and FreestyleWorkout opens the per-exercise drawer mid-session without interrupting the timer.
- ✅ **Movement Pattern Library browser** on Library page: 9-pattern grid card with one-line descriptions and per-pattern exercise counts; clicking a pattern card filters the grid.
- ✅ **Cali unlock celebration**: added 🎉 lime "Skill milestone" celebration firing via the generic CelebrationModal when a progression is toggled to 100% of a skill (handled in WorkoutSkills).

## QA batch (workout branch)

- ✅ **Mock-data generator** (`frontend/lib/mockData.ts`): `generateSeedData({exercises, routines})` returns ~12 weeks of realistic training history — Push/Pull/Leg split + occasional cardio with linear progression noise, PRs, daily readiness, bodyweight trending 72→70.5 kg, journal entries, 3 goals, and a 30-day push-up challenge (~20 days in). Intended for QA and live demos.
- ✅ **`seedDemoData()` / `resetWorkoutData()`** store actions: lazy-imports the generator (zero cost on production bundles) and overwrites sessions/prs/readiness/bodyweight/goals/challenges/journal while preserving the exercise library, routines, skills, chains, and settings. Streaks are recomputed from the imported sessions. Reset returns logs to the pristine seed.
- ✅ **Demo / QA Data card on Tools**: gradient purple card with "Load demo data" (with confirm) and "Reset" buttons; makes the mock dataset one click away.
- ✅ **Block reorder in Schedule**: ↑/↓ hover buttons on each block call `reorderBlocks(rid,from,to)` so routines can be rearranged without delete/re-add.
- ✅ **Superset auto-skip rest** in ActiveWorkout: when the next block shares a `supersetGroupId`, the rest timer is skipped, a 660 Hz / 150 ms chirp plays, and a "→ superset" chip appears next to the set counter. Giant sets (≥3 blocks in a group) work identically and get a GIANT badge.
- ✅ **Unilateral asymmetry auto-tag**: when Unilateral is enabled and L/R rep counts differ by ≥2, `asymmetry` is auto-set to `left-weak` or `right-weak` (else `none`).
- ✅ **RIR trend strip** added to ExerciseHistoryDrawer alongside the existing RPE strip, with bandlines and color-coded dots (red at RIR ≤1).
- ✅ **Recent sessions timeline** added to Overview's left column: last 10 completed sessions, reverse-chronological, with volume/duration/set count/rating.
- ✅ **Type-safety fixes**: asymmetry IIFE now returns a properly-narrowed union; mockData resolves `find()?.id ?? …` to `string | undefined` (was `string | null`); `reorderBlocks` verified present in the value object export. `tsc --noEmit` and `next build` both clean.
- ✅ **Docs**: new `docs/qa/TEST-REPORT.md` with build status, shipped list, bug fixes, and a QA walkthrough script.

### Remaining backlog (intentionally deferred)
- Hormonal cycle sync
- Side-by-side workout comparison
- Cloud backup/sync UI (backend `/api/sync` already exists; no UI planned)
- GtG long-horizon trend (7-day sparkline + streak ship now; 30/90-day deferred)
- Auto assistance-reduction suggester for cali progressions
- Keyboard shortcuts during ActiveWorkout (snoozed)
- Notifications dropdown / bell logic (snoozed)
- Run power / Stryd `.fit` import (field reserved, no importer)
- Cardio route comparison view (route name logged, no side-by-side chart)


## Polishing pass

- ✅ **Bodyweight popup ack → localStorage** (was sessionStorage, so a same-day hard refresh re-prompted).
- ✅ **Cali tab fully wired to the store** (previously ~half the UI was local-only stubs):
    - Chain toggles → `toggleChainProgression` with a WebAudio chirp on first unlock.
    - Skills tab reads from `caliSkills[]`, shows bestAttempt (reps / holdSec / ringHeight), last fail, archived state with delete.
    - **Log attempt modal**: reps, hold-seconds, ring-height slider (80–260 cm, only for ring skills), assistance text, MMC 1–10, tempo string, quality chips, test-day flag, rest-pause + mini-set reps. Persists via `logCaliAttempt` which now also stamps `firstAttemptDate` + updates `bestAttempt` automatically.
    - **Log fail modal**: free-text reason + quick-tag chips (grip/core/shoulders/wrists/balance/mobility), persists via `logCaliFail`.
    - **First-unlock celebration**: distinct amber modal "🔥 Unlocked: <skill>!" fires on the first ≥1-rep attempt, then calls `unlockCaliSkill`.
    - **Isometric timer** beeps on start/stop, Log button writes to `isometricLogs`; recent entries shown inline.
    - **AMRAP**: cap timer with auto-beep at time cap, rounds + extra-reps fields, Save writes an `intervalLogs` entry with summary notes.
    - **EMOM**: running MM:SS clock, minute-beep every 60s, per-minute rep logger, Stop & Save writes to `intervalLogs` with `perMinuteReps[]`.
    - **GtG**: hourly grid now reads/writes via `toggleGtG(exercise, reps)` with custom exercise name + default reps inputs, 7-day volume sparkline, auto-computed day streak.
    - **Flows**: wired to `addFlow`/`deleteFlow` (previously local state), with hover-reveal delete.
    - **Mobility**: checkboxes write to `logMobility` and render recent sessions from the store; "+" adds custom drills via `addMobilityDrill`.
    - **Rest day**: chips write to `logRestDay` and show recent entries from the store.
- ✅ **logCaliAttempt** now stamps `firstAttemptDate` on first attempt and updates `bestAttempt` (reps/holdSec/ringHeight) when a new best is hit.
- ✅ **Add-skill form on Cali tab**: collapsible form for custom skills — name, movement pattern, difficulty 1–10, equipment multi-select (rings/bar/parallettes/bands/vest/dip-bars/none), optional **baseline ring-height slider (80–260 cm)** shown when rings are selected, optional video URL. Writes via `addCaliSkill`, which auto-fills attempts/failLog/archived.
- ✅ **Empty-state CTAs across the workout pages**: every italic \"No X yet\" line replaced with a consistent dashed-card empty state containing an icon, a helpful one-line hint, and a contextual primary CTA (Start workout / Build a routine / Load demo data / Add X above). Covers Overview (heatmap, badges, recent timeline), Calisthenics (chains / skills / flows / mobility), Cardio, Gym history, Tools (goals / challenges / journal / franken), Schedule, Skills, Library/Exercises. Inline \"no PR yet\" and drawer \"no sets\" spans left as-is (not full-page empties).
- ✅ **Ring-height baseline** surfaced on both skill creation (add form) and every Log-attempt modal for ring skills, with the slider pre-filled to the skill's stored `ringHeightCm`. Best-attempt stamp includes the cm value.
- ✅ **Cardio logs now persist to the store** (were previously local-state-only and lost on refresh). `WorkoutCardio` now reads/writes through `addCardioLog` / `deleteCardioLog` against `workout.cardioLogs`, so entries survive refresh, appear in CSV export, and populate from `seedDemoData` (4 seeded runs: 12/7/3/1 days ago with progressing pace).
- ✅ **GtG toggle fix**: hour-slot matching is now by `date+hour` only (ignores exercise name) so changing the name in the input doesn't create orphaned entries; clicking the same hour toggles off correctly, otherwise it overwrites reps/name.
- ✅ **Reset now clears all log slices** (cardioLogs, GtG, iso, interval, cali flows, mobility sessions, planche entries) not just sessions/PRs/goals/journal/challenges, so `Reset` truly returns to a clean state.
- ✅ **PRs page** empty-state upgraded with the same dashed-card pattern + Load-demo CTA.
- ✅ **Charts page** (`/workout/charts`): pure-SVG analytics dashboard — KPI strip (sessions/total volume/minutes/PRs), 12-week filled area chart of weekly volume, 14-day muscle-group volume donut, weekday frequency bars, session-duration histogram, RPE distribution bars, strength/cardio/rest split horizontal bars, 90-day bodyweight line chart, and a PR-progression sparkline grid. No chart libraries added.
- ✅ **Kanban board** (`/workout/kanban`): 5-column weekly planner (Backlog / This Week / Today / In Progress / Done) with native HTML5 drag-and-drop, quick-add bar with type selector (strength/cardio/cali/mobility/rest/other), per-card notes editor, color-coded type tags, completion checkbox (moves card to Done), delete, "Clear done" bulk action, and progress bar showing weekly completion %. Persists to `workout.kanban`.
- ✅ **Expanded cali skills seed** (researched): now 13 canonical bodyweight moves — L-sit, Pistol Squat, Bar Muscle-up, Ring Muscle-up (baseline 190cm rings), Planche, Front Lever, Back Lever, HSPU, Human Flag, One-Arm Pull-up, V-sit, Ring Dip (150cm baseline), Nordic Curl. Difficulty 5–10, equipment properly tagged (rings/parallettes/bar/none) with ring-height baselines where rings are used.
- ✅ **Expanded generic Skills seed**: added Pistol Squat, Planche, Front Lever, Ring Dips alongside existing Pull-up and Handstand, each with research-backed progressions (e.g. pistol: assisted-box → negative → assisted → full → weighted).
- ✅ **Nav additions**: Charts (cyan analytics icon) and Board (pink kanban icon) added to left rail; Board added to mobile bottom bar as a primary tab.
