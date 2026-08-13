# Kaizen Feature Status

Last audited against code on `career` branch. Two independent spaces ship today:
**Workout** (battle-tested on `main`) and **Career** (active build on `career`).
Both use the same Kaizen obsidian/gold/crimson imperial theme, the floating
command-button nav pattern (⚔ BATTLE for workout, ⚔ COMMAND for career), the
inline (non-modal) GoldenDragon card with katana slashes, and `SectionSlash`
katana-flash transitions between sub-pages.

Legend:

- ✅ Shipped, wired to the store, persists across refresh
- 🟡 Present in the UI but scaffold/local-only or missing a calculation
- ❌ Not yet implemented

---

# Workout Feature Status

Audited against the 149-feature checklist (35 cali + 45 gym + 22 cardio +
47 global).

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
|25 | EMOM Tracker | ✅ Running MM:SS timer, per-minute rep input, perMinuteReps persisted to intervalLogs, WebAudio beep each minute |
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
| 2 | Route Name & Comparison | 🟡 Route stored; no side-by-side comparison view |
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

## Global workout (47)

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
|25 | Completion Timeline | ✅ "Recent sessions" timeline on Overview shows last 10 completed sessions reverse-chronological with volume/duration/sets/rating; full history via exercise drawers + CSV export |
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
|36 | Trend Analysis | ✅ 52-week heatmap + 12-week volume sparkline on Overview (with avg/this-week/Δ); RPE trend + per-session volume bars in Exercise History drawer; Charts page adds 12-week area, 14-day muscle donut, weekday freq, duration histogram, RPE distribution, split bars, bodyweight line, PR grid |
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

## Workout routes shipped

| URL | File | Purpose |
|---|---|---|
| `/workout` | `pages/workout/index.tsx` | redirect → `/workout/overview` |
| `/workout/overview` | `pages/workout/overview.tsx` | Today at a glance (heatmap, badges, next-workout, recent timeline, 12-wk trend) |
| `/workout/library` | `pages/workout/library.tsx` | Exercise library + mini muscle-map + pattern browser |
| `/workout/calisthenics` | `pages/workout/calisthenics.tsx` | Chains, skills, iso/AMRAP/EMOM/GtG/flows/mobility/rest-day |
| `/workout/gym` | `pages/workout/gym.tsx` | Weights logging + calculators (1RM/plate/DB-BB/Wilks/LT/RPE/symmetric) |
| `/workout/cardio` | `pages/workout/cardio.tsx` | 8 cardio types + zones/VO2/economy/injury tags |
| `/workout/charts` | `pages/workout/charts.tsx` | 10-panel SVG analytics dashboard |
| `/workout/kanban` | `pages/workout/kanban.tsx` | 5-column weekly planner (Backlog/This Week/Today/In Progress/Done) with HTML5 DnD |
| `/workout/prs` | `pages/workout/prs.tsx` | Personal records by exercise |
| `/workout/skills` | `pages/workout/skills.tsx` | Hierarchical skill-tree SVG |
| `/workout/schedule` | `pages/workout/schedule.tsx` | Routines/splits + program manager + block reorder |
| `/workout/tools` | `pages/workout/tools.tsx` | Timers, journal, challenges, quotes, CSV import/export, demo-data loader |

## Career routes shipped

| URL | File | Purpose |
|---|---|---|
| `/career` | `pages/career/index.tsx` | redirect → `/career/roadmaps` |
| `/career/roadmaps` | `pages/career/roadmaps.tsx` | Roadmap forge + parallel trackers (5 templates, donuts, dependency locks, celebration) |
| `/career/skills` | `pages/career/skills.tsx` | Skill inventory + radar chart + growth sparkline + top-5 leaderboard |
| `/career/certs` | `pages/career/certs.tsx` | Courses/certifications tracker with expiry countdown |
| `/career/network` | `pages/career/network.tsx` | Contacts, favor bank, interaction log, gold nuggets, reach-out queue |
| `/career/jobs` | `pages/career/jobs.tsx` | Kanban pipeline + interview Q bank + company dossiers |
| `/career/portfolio` | `pages/career/portfolio.tsx` | Achievement vault + projects + resume bullets + ATS scanner + testimonials |
| `/career/daily` | `pages/career/daily.tsx` | Standup, live focus timer, meetings w/ ROI, time-allocation donut, mood/stress |
| `/career/command` | `pages/career/command.tsx` | Global: timeline, weekly satisfaction, Maslach burnout, vision, sabbatical/retirement |

All routes use the shared `components/career/CareerPage.tsx` HOC, which mounts
`CareerShell` + `CommandNav` + `CommandCard` + `HudFlash` (the career analog of
`WorkoutPage.tsx` / `WorkoutShell` / `BattleNav` / `BattleCard` / `SectionSlash`).

## Workout remaining backlog (intentionally deferred)

- Hormonal cycle sync
- Side-by-side workout comparison
- Cloud backup/sync UI (backend `/api/sync` exists; no UI planned)
- GtG 30/90-day long-horizon trend (7-day sparkline ships)
- Auto assistance-reduction suggester for cali progressions
- Keyboard shortcuts during ActiveWorkout (snoozed)
- Notifications dropdown / bell logic (snoozed)
- Run power / Stryd `.fit` import (field reserved, no importer)
- Cardio route comparison view (route name logged, no side-by-side chart)

---

# Career Feature Status

The `/career` space ships 8 module subpages under a cyber/HUD COMMAND shell. The
floating `> cmd_` trigger opens an inline terminal-styled CommandCard which
presents the 8 modules as numbered 01–08 tiles. A horizontal cyan scan-flash
transitions between routes; Escape closes the card; the ACTIVE dot uses Framer
Motion `layoutId`. Auto-seeded on first visit: 5 pre-built roadmap templates
(DevOps, Networking, Linux, MLOps, Cloud) cloned with full phases, milestones,
resources, projects, labs, and hours. Career uses its own HUD theme (navy/cyan/
indigo/green mono) distinct from workout's imperial Japanese aesthetic.

Routes: `/career` → redirect to `/career/roadmaps`; `/career/roadmaps`,
`/career/skills`, `/career/certs`, `/career/network`, `/career/jobs`,
`/career/portfolio`, `/career/daily`, `/career/command`.

## 1. Roadmaps (template forge + parallel trackers)

| # | Feature | Status |
|---|---|---|
| 1 | Template forge (5 curated templates) | ✅ DevOps (8 phases), Networking (6), Linux (7), MLOps (8), Cloud (8) — full phases/milestones/resources/projects/labs/hours/proficiency targets in `lib/careerRoadmaps.ts`, `cloneTemplate()` re-IDs all children |
| 2 | Parallel roadmaps | ✅ Any number active simultaneously; list + drilldown |
| 3 | Weekly hours allocation (donut) | ✅ `HoursDonut` SVG multi-segment ring across all active roadmaps + per-roadmap weekly-hours slider |
| 4 | Priority 1-10 | ✅ Shown as badge; 🟡 no drag-rank UI yet (numeric input future) |
| 5 | Phases | ✅ Collapsible chevron per phase; per-phase progress `done/total · h` |
| 6 | Milestones | ✅ Title, est/actual hours, before/after self-rating 1-10, resources, projects, lab checklist, mastery quiz |
| 7 | Dependencies + locking | ✅ `dependsOn[]`; locked milestones render 🔒 with disabled checkbox + prereq note |
| 8 | Dependency graph/edges | ❌ Lock works; no visual edge lines between milestones yet |
| 9 | Resources toggle | ✅ Checkbox per resource marks complete |
|10 | Projects toggle | ✅ Checkbox per project marks complete |
|11 | Lab checklist | ✅ Per-item toggle |
|12 | Mastery self-check (quiz) | ✅ Default 3-question yes/partial/no seeded on expand; % score color-coded |
|13 | Log hours | ✅ Input + +0.5/+1/+2 quick add; persists to `hoursActual` |
|14 | Before/after proficiency | ✅ Two 1-10 sliders with small bar viz |
|15 | Estimated vs actual hours | ✅ `hoursEstimated` in templates; actual accumulated via log |
|16 | Donut progress ring per roadmap | ✅ SVG ring top-left of each card shows % complete |
|17 | 4-tile stat header | ✅ ACTIVE / COMPLETE / TOTAL HRS / MILESTONES |
|18 | Completion celebration | ✅ Fixed-overlay `Celebration` modal with trophy, katana slash, "CLAIM VICTORY" button; fires on 100% via effect |
|19 | Next Action button | ✅ Scrolls to `#ms-<id>` and auto-opens the first undone milestone's phase |
|20 | Archive / delete | ✅ `archiveRoadmap` / `deleteRoadmap` actions wired |
|21 | Skill cross-links | 🟡 `skillTags[]` field exists on milestones; no auto-bump UI when milestone completes yet |
|22 | Global resources library | ❌ |
|23 | Drag-rank priority UI | ❌ Priority number displayed but not draggable |

## 2. Skills inventory

| # | Feature | Status |
|---|---|---|
| 1 | 1-10 proficiency slider | ✅ |
| 2 | Confidence slider | ✅ |
| 3 | Interest slider | ✅ |
| 4 | Usage frequency | ✅ daily/weekly/monthly/rarely dropdown |
| 5 | Category grouping | ✅ Technical/Leadership/Communication/Design/Domain/Other |
| 6 | "Used today" touch | ✅ Button stamps `lastUsedAt = now` |
| 7 | Decay 90-day warning | ✅ Yellow STALE badge >90d, red ROTTING >180d with days-ago |
| 8 | Radar/spider chart | ✅ `SkillRadar` SVG, up to 8 axes (sorted by proficiency), concentric decagons, dashed gold confidence overlay, hover tooltips |
| 9 | Mind-map graph | ❌ Radar done; graph links deferred |
|10 | Growth chart | ✅ `GrowthChart` 21-day sparkline with peak/avg/low band, carry-forward interpolation |
|11 | Top skills leaderboard | ✅ `TopSkills` ranked top-5 with ▲/▼ delta since first growth point |
|12 | Growth history | ✅ Daily growth points deduped by date; auto-appended when proficiency changes |
|13 | Confidence | ✅ (on radar overlay) |
|14 | Interest | ✅ Slider; not yet visualized in its own chart |
|15 | Mentor field | 🟡 Field typed in `CareerSkill`; no UI yet |
|16 | Portfolio links | 🟡 Field typed; no UI yet |
|17 | Gap analysis (desiredLevel) | 🟡 Field typed; no viz yet |
|18 | Cert/project linking | ❌ |
|19 | Decay recommendation | ❌ No recommended-action text yet |

## 3. Certs & Courses

| # | Feature | Status |
|---|---|---|
| 1 | Add/edit/delete | ✅ |
| 2 | Provider | ✅ |
| 3 | Start/end date | ✅ |
| 4 | Cert-received toggle | ✅ Checkbox in add form |
| 5 | Expiry date | ✅ |
| 6 | Expiry countdown <90d | ✅ Yellow warning; <30d/expired red; warning pill on each card |
| 7 | Expiry warning stat | ✅ 5th stat chip shows count of certs in warning window |
| 8 | Hours invested | ✅ |
| 9 | Rating 1-10 | ✅ Dropdown in add form; ⭐ shown on card |
|10 | Key takeaways | ✅ Field on add form + displayed on card |
|11 | Application notes | ✅ Field on add form + displayed on card (amber label) |
|12 | Notes | ✅ Field + italic serif rendering |
|13 | Visual countdown timer (progress bar) | ❌ Text only; bar future |

## 4. Network

| # | Feature | Status |
|---|---|---|
| 1 | Add/edit/delete contacts | ✅ |
| 2 | Relationship groups filter | ✅ Mentor/Peer/Report/Client/Prospect/Recruiter/Friend + All chip |
| 3 | Health score 1-10 | ✅ Slider + pill |
| 4 | Influence score 1-10 | ✅ Slider + pill |
| 5 | Last-contact staleness | ✅ STALE >90d amber; COLD >180d red; days-ago shown |
| 6 | Favor bank (given/received) | ✅ +1 Given / +1 Received buttons; imbalance ≥3 highlighted red/amber |
| 7 | Interaction log | ✅ Per-contact entries: date, type, summary, gold nuggets; last 5 shown |
| 8 | Gold nuggets | ✅ Quoted amber italic "💬 ..." |
| 9 | Company/role fields | ✅ Inline inputs in expanded card |
|10 | "Touch base today" quick button | ✅ Stamps `lastContactAt = now` |
|11 | Reach-out priority queue | ✅ Auto top-5 ranked by `daysSince*2 - health*3`, red/amber chips, click opens card |
|12 | Birthday | ❌ Field not in schema yet |
|13 | Preferred comms | ❌ |
|14 | Interests/hobbies | ❌ |
|15 | Follow-up reminders | 🟡 `nextFollowUpAt` not in schema |
|16 | Referral log | ❌ |
|17 | Job-change tracking | ❌ |
|18 | Network graph viz | ❌ |
|19 | Next-talk prep notes | ❌ (use interaction summary for now) |

## 5. Jobs campaign

| # | Feature | Status |
|---|---|---|
| 1 | 8-stage kanban | ✅ Researching/Applied/Phone/Tech/Onsite/Offer/Rejected/Ghosted |
| 2 | Auto-ghost 14d | ✅ 14 days with no `lastContactAt` update → ghost column (visual move; doesn't mutate stage) |
| 3 | Stage chips in card | ✅ 8 chips to advance/retreat stage; "Heard back" button stamps today |
| 4 | Notes | ✅ textarea per app |
| 5 | Salary tracker (base/bonus/final TC) | ✅ Three numeric inputs; Best-offer stat card |
| 6 | Vibe score 1-5 stars | ✅ ⭐ row on each card |
| 7 | Ghost badge | ✅ Ghost icon + days-since on auto-ghosted cards |
| 8 | Recruiter field | ✅ |
| 9 | Days-since contact | ✅ `Xd` shown in meta row |
|10 | Interview Q bank | ✅ Dedicated tab: add Q with tags, search, tag-filter chips, frequency stars (1-3), answer area, green-check when answer >20 chars, "+ Question" on app card auto-jumps to bank pre-tagged |
|11 | Company dossiers | ✅ Dedicated tab, auto-created on new app (deduped by name): products, funding, recent news, competitors, culture notes, pros, cons; deep-link from app card |
|12 | Stats (active/offers/ghosted/conv/best offer) | ✅ 5-chip stat row |
|13 | Offer/negotiation log | 🟡 Final TC field only; counter-offer/rejection feedback fields typed but no UI |
|14 | Weighted decision matrix | ❌ `decisionWeight` typed; no UI yet |
|15 | Culture check survey | ❌ `cultureChecks[]` typed; no UI yet |
|16 | Time-spent tracking | 🟡 `timeSpentMin` typed; no timer/input |

## 6. Portfolio

| # | Feature | Status |
|---|---|---|
| 1 | Achievement vault timeline | ✅ Vertical timeline with colored dot per category, icon, title, date, impact line, category chip |
| 2 | 7 categories | ✅ Technical/Leadership/Sales/Product/Process/Personal/Other with color chips + filter |
| 3 | Icon picker (14 icons) | ✅ Icon palette in add form |
| 4 | Impact metric field | ✅ ⚡ gold line per achievement |
| 5 | Date picker | ✅ |
| 6 | Projects grid | ✅ Title, role, URL, summary, results, tech tags, private toggle, private eye badge |
| 7 | Project tech-tag chips | ✅ Inline add with Enter |
| 8 | Resume bullet vault | ✅ Dedicated BULLETS tab; inline-edit textareas, comma tags, one-click COPY to clipboard |
| 9 | ATS keyword scanner | ✅ Sticky side panel: paste comma-separated JD keywords → scored 0-100% against bullets+achievements+projects; color-coded progress bar; missing-keyword chips; glowing % |
|10 | Testimonials | ✅ Dedicated tab; from/role/quote cards with large pink quote-mark; date stamp |
|11 | Project categories | ❌ (all projects in one grid for now) |
|12 | Resume versioning | 🟡 `ResumeVersion` typed with tailored-checklist; no UI yet |
|13 | ATS score resume-specific | 🟡 Global ATS against vault works; version-specific not yet |
|14 | Auto case-study builder | ❌ |
|15 | Challenges/learnings fields per project | 🟡 Fields typed; not yet surfaced in project card |
|16 | Project sorting | ❌ |

## 7. Daily workflow

| # | Feature | Status |
|---|---|---|
| 1 | Auto-create today | ✅ useEffect seeds empty day on first load |
| 2 | Day navigator (date picker) | ✅ Jump to any date; timer disabled on past days |
| 3 | Streak counter | ✅ Flame badge in header, counts consecutive days with content |
| 4 | Standup (3 bullets) | ✅ Y/T/B textarea |
| 5 | Deep-work live timer | ✅ MM:SS monospaced, Play/Pause/Reset, gold glow running, auto-persist every 15s and on pause; disabled for past days |
| 6 | Focus minutes manual +quick-add | ✅ Read-only total + +15/+30/+60/+90 |
| 7 | Meeting entries | ✅ Add/delete per day: title, duration, attendees, agenda, discussion, decisions, action items |
| 8 | Meeting ROI 1-5 | ✅ Color-coded buttons per meeting; card border color reflects ROI |
| 9 | Time-allocation doughnut | ✅ 7-segment SVG (meetings/focus/coding/writing/emails/planning/other) with inline minute editors |
|10 | Mood 1-10 slider | ✅ Icon swaps smile/meh/frown based on value |
|11 | Stress 1-10 slider | ✅ |
|12 | Wins quick-list | ✅ Add/delete items; autoscroll |
|13 | Learnings quick-list | ✅ |
|14 | Challenges quick-list | ✅ |
|15 | Work log free-text | ✅ |
|16 | Recent days history | ✅ Last 10 days listed with preview, mood, focus hrs, meeting count |
|17 | Avg mood/stress stats | ✅ Across all days |
|18 | Meeting minutes template editor | 🟡 Agenda/discussion/decisions/action-items textareas exist per meeting; no saved template |
|19 | Live deep-work session history graph | ❌ Cumulative total works; per-session graph deferred |
|20 | Focus-block planner / agenda tracker | ❌ |
|21 | Meeting ROI stat in header | ✅ Meetings count + avg ROI chip |

## 8. Global career

| # | Feature | Status |
|---|---|---|
| 1 | Timeline | ✅ Auto-aggregates achievements + projects + manual events; typed 9 event kinds |
| 2 | Weekly satisfaction | ✅ `WeekSatisfaction[]` typed + UI in Global tab |
| 3 | Maslach burnout inventory (6 subscales) | ✅ 6 sliders → LOW/MILD/MOD/HIGH classification |
| 4 | Sabbatical planner | ✅ Target date + duration fields |
| 5 | Retirement planner | ✅ Target age + monthly contribution fields |
| 6 | Vision board masonry | ✅ Image-item grid + add |
| 7 | Wellbeing tab | ✅ Satisfaction + burnout together |
| 8 | Freedom tab | ✅ Sabbatical + retirement |
| 9 | IP log | ❌ Schema field; no UI |
|10 | Speaking events | ❌ Schema field; no UI |
|11 | Side-hustles | ❌ Schema field; no UI |
|12 | Vision board images | 🟡 URL-based items; no file upload |
|13 | Pro photos | ❌ |
|14 | Work-life balance aggregate | ❌ (would combine daily stress/mood + satisfaction) |

## Cross-cutting

| Area | Status |
|---|---|
| Theme (cyber HUD) | ✅ Distinct from workout: dark-navy gradient, animated cyan grid, scanlines, sweep beam, corner brackets, mono font, blinking cursors, cyan/indigo/acid-green/violet accents, horizontal scan-flash transitions (no katana slash, no crown, no kanji) |
| Parchment/light mode | ❌ Career forces dark HUD; light mode doesn't fit the aesthetic (toggle present but neutral-styled) |
| LocalStorage persistence (`kaizen.*` keys) | ✅ Via `useLocalState` in `StoreProvider` |
| Hydration safety | ✅ Mounted guard in `/career` index prevents SSR/client `Date.now()` mismatches; boot splash shown pre-mount |
| Backend CRUD routes | ✅ `/api/career/*` prefixed in Express (roadmaps/skills/courses/contacts/applications/companies/questions/achievements/projects/resumes/bullets/testimonials/days/timeline/satisfaction/burnout/sabbaticals/side-hustles/ip/speaking/vision-board/tracks/goals/notes) — untested (no node_modules in sandbox); frontend does not yet call them (offline-first) |
| Migration `migrateCareer` | ✅ Seeds 5 roadmap templates on first visit for legacy users, normalizes achievements, lifts legacy `resumeBullets` to `bullets[]` deduplicated |
| Section transitions | ✅ HudFlash horizontal cyan scan-sweep on route change (no katana slash in career) |
| COMMAND button + card | ✅ Terminal `> cmd_` prompt with blinking caret; inline `> select_module()` card with 01–08 numbered tiles, scanlines, corner brackets, rotating CPU icon — no GoldenDragon/kanji in career |
| Typography (career) | ✅ Mono (JetBrains Mono) enforced across career via `.career-root` scoped overrides; imperial serif fonts only used inside `/workout` |
| 8-module COMMAND nav | ✅ Code-prefixed tiles 01..08, color-coded, stagger animations, ACTIVE layoutId dot |
| Subpage routes | ✅ Real Next.js pages `/career/roadmaps|skills|certs|network|jobs|portfolio|daily|command`; `/career` redirects to `/career/roadmaps`; shared `CareerPage` HOC (mirrors `WorkoutPage`) |
| Hotkeys | ✅ Escape closes command card |
| Projects hub page (connecting cross-space projects) | ❌ Roadmaps/projects/portfolio/jobs reference projects but no unified hub yet |

---

# Docs index

| File | Covers |
|---|---|
| `docs/FEATURES.md` | This file — shipped/partial/missing for Workout + Career |
| `docs/CAREER.md` | Career data model, 8-section spec, palette, typography, migration notes, roadmap dependency graph |
| `docs/API.md` | Backend REST reference for both `/api/exercises|sessions|...` (workout) and `/api/career/*` (career) |
| `docs/ARCHITECTURE.md` | Frontend stack, state model, store shape |
| `docs/ALGORITHMS.md` | 1RM/Wilks/RPE/volume/etc formulas |
| `docs/DATA-MODEL.md` | Workout domain model |
| `docs/qa/TEST-REPORT.md` | QA walkthrough, build status, bug log |
