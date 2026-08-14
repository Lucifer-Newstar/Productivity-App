# Data Model Reference

Kaizen's state is split across typed modules:

- `frontend/lib/types.ts` — shared Task, Note, Habit, Space, SPACES, and the
  legacy re-exports of Workout + Career shapes.
- `frontend/lib/careerTypes.ts` — Career data model (9 sectors).
- `frontend/lib/forgeTypes.ts` — Projects space data model (40+ collections in
  ForgeState).
- `frontend/lib/healthTypes.ts` — Health space data model (nutrition, hydration,
  sleep, physique, supplements, vitals, mind, settings). See below.
- Workout types live in `types.ts` for legacy reasons and are being incrementally
  split out.

Per-space deep dives live under `docs/spaces/<space>/`. This document covers
the entity shapes and relationships at a high level so a new contributor can
orient themselves quickly.

```
WorkoutState
 ├── exercises:      WorkoutExercise[]      # library of known movements
 ├── prs:            WorkoutPR[]            # personal records w/ history[]
 ├── skills:         WorkoutSkill[]         # high-level bodyweight skills
 ├── routines:       WorkoutRoutine[]       # routines / templates (blocks[])
 ├── sessions:       WorkoutSession[]       # completed & in-progress sessions
 │    └── sets:      WorkoutSetLog[]        # every logged set (rich metadata)
 ├── readiness:      WorkoutReadiness[]     # daily 1-10 check-ins
 ├── badges:         WorkoutBadge[]         # achievement unlocks
 ├── bodyweight:     WorkoutBodyweight[]    # daily weigh-ins
 ├── settings:       WorkoutSettings        # glove/minimal/sound/phase/units
 ├── caliChains:     CalisthenicsChain[]    # progression chains
 ├── caliSkills:     CalisthenicsSkill[]    # cali skills (attempts[], failLog[])
 ├── caliFlows:      CalisthenicsFlow[]
 ├── gtg:            GtGEntry[]             # grease-the-groove micro-sets
 ├── isometricLogs:  IsometricLog[]
 ├── intervalLogs:   IntervalLog[]          # EMOM/AMRAP/intervals/fartlek
 ├── mobilityDrills:    MobilityDrill[]
 ├── mobilitySessions:  MobilitySession[]
 ├── plancheEntries: PseudoPlancheEntry[]
 ├── cardioLogs:     CardioLog[]
 ├── programs:       Program[]
 ├── goals:          WorkoutGoal[]
 ├── customMetrics:  CustomMetric[]
 ├── customMetricEntries: CustomMetricEntry[]
 ├── challenges:     ChallengeEntry[]
 ├── journal:        WorkoutNote[]
 ├── board:          MotivationBoardItem[]
 ├── restDays:       RestDayEntry[]
 └── (streaks, activeSessionId, etc.)
```

## Key shapes

### WorkoutSetLog — the atomic unit

Every completed set stores rich metadata for serious post-hoc analysis:

- Core: `blockId`, `setIndex`, `value` (reps or seconds), `weight?`, `rpe?`,
  `rir?`, `durationSeconds?`, `completed`
- Variation flags: `isWarmup`, `isJoker`, `isDrop`, `isAMRAP`, `isPaused` (+
  `pauseSec`), `isCluster` (+ `clusterReps[]`, `clusterRestSec`),
  `isSuperset` (+ `supersetGroupId`), `isGiant`, `isMyo`
- Unilateral: `unilateral`, `leftValue/rightValue`, `leftWeight/rightWeight`
- Equipment: `belt`, `kneeSleeves`, `wristWraps`, `barSpinOk`, `grip`
- Feedback: `quality` (perfect/good/decent/bad), `speed`, `feeling`, `mental`,
  `pain` (0-10), `stickingPoint`, `asymmetry`, `notes`

### Session-level metadata

`playlist?`, `crowdLevel?`, `phase?`, `rating?`, `isDeload?`, `isRestDay?`,
`restReason?`, `bodyweightKg?`, `timeOfDay?`, `hydrationPreMl/PostMl?`,
`preworkout?`, `caffeineMg?`, `soreness?`, `jointPain?`, `warmupDrillIds?`,
`warmupDurationSec?`, `cooldownDurationSec?`, `nutrition?` (carbs/BCAA/
electrolytes/water), `programId?`, `workoutNumberInProgram?`.

### Muscle groups

Coarse (filter chips): chest, back, shoulders, arms, core, legs, cardio, other.

Fine-grained (heatmap regions): upperChest, abs, obliques, biceps, triceps,
forearms, frontDelt, sideDelt, rearDelt, traps, lats, upperBack, lowerBack,
quads, hamstrings, glutes, calves. The 89-region anatomical SVG further
sub-divides these (e.g. serratus, brachioradialis, soleus). See
`components/workout/MuscleHeatmap.tsx` for the full SVG path mapping.

### Persistence

Everything is serialised to `localStorage["kaizen.workout"]` by the
hydration-safe `useLocalState` hook. The backend exposes an equivalent
in-memory representation plus a `/api/sync` endpoint for future cloud sync.

---

## Forge (Project/PM OS)

Forge state lives under `forge: ForgeState` in `frontend/lib/forgeTypes.ts`
(separated from the legacy `types.ts` because the PM model grew well beyond
simple todos). It is hydrated through `migrateForge` (store.tsx) and
seeded with a vivid dataset by `buildForgeDemo` (forgeDemo.ts).

```
ForgeState
 ├── projects:          Project[]             # codename / title / brief / why / color / icon / deadline / budget
 ├── tasks:             ForgeTask[]           # status, priority, effort, difficulty, satisfaction, recurrence, parentId, projectId, tags
 ├── scratch:           Scratch[]             # quick free-text buckets
 ├── decisions:         Decision[]            # decider / options / recommendation / madeAt
 ├── swot:              Swot[]                # SWOT grids
 ├── proscons:          ProsCons[]            # weighted pros/cons
 ├── scenarios:         Scenario[]            # best/base/worst cases
 ├── fiveWhys:          FiveWhy[]             # root-cause chains
 ├── lessons:           Lesson[]              # lessons learned log
 ├── retors:            Retor[]               # retrospect entries
 ├── parking:           ParkingItem[]         # parking-lot ideas
 ├── pomodoros:         Pomodoro[]            # focus-session log
 ├── personas:          Persona[]             # user/customer personas
 ├── decisionMatrix:    DecisionMatrix[]      # weighted-option matrices
 ├── ideas:             Idea[]                # idea backlog
 ├── fishbones:         Fishbone[]            # Ishikawa diagrams
 ├── sixHats:           SixHats[]             # de Bono hats
 ├── scamper:           Scamper[]             # SCAMPER substitutions/combine/adapt/etc.
 ├── sprints:           Sprint[]              # sprint/iteration cadence + burndown
 ├── reviews:           Review[]              # weekly reviews & action items
 ├── mindmaps:          Mindmap[]             # radial trees (root + nodes[])
 ├── canvases:          IdeaCanvas[]          # free grid canvas (sticky/box/dot/note)
 ├── voiceNotes:        VoiceNote[]           # voice memo metadata (Blob stored in-memory only)
 ├── bmc:               Record<Bmc>           # Business Model Canvases keyed by projectId|"global"
 ├── vpc:               Record<Vpc>           # Value Prop Canvases
 ├── lean:              Record<LeanCanvas>    # Lean Canvases
 ├── porter:            Record<PorterFive>    # Porter Five Forces
 ├── pestel:            Record<Pestel>        # PESTEL analyses
 ├── userStories:       UserStory[]
 ├── eventStorms:       EventStorm[]
 ├── journeyMaps:       JourneyMap[]
 ├── blueprints:        ServiceBlueprint[]
 ├── wireframes:        Wireframe[]
 ├── buyAFeature:       BuyAFeature[]
 ├── paired:            PairedCompare[]
 ├── affinity:          AffinityGroup[]
 ├── customStatuses:    StatusColumn[]        # runtime-editable kanban columns (id/name/color)
 ├── auditLog:          AuditEntry[]          # logForgeAction entries, capped at 500
 ├── streak:            StreakState           # current/longest/daily history (capped 365)
 └── settings:          ForgeSettings         # forgeName / sprintLengthDays / workStartHour / workEndHour
```

### IDs & keys

- `project.id` — `proj_${nanoid()}`.
- `task.id` — `task_${nanoid()}`; `parentId` points to another task for subtasks;
  `projectId` is nullable (backlog tasks).
- Canvas records are keyed by `projectId | "global"` so one canvas can live per
  project and there is one "global" canvas for cross-project thinking.
- `customStatuses` ids are free-form strings (runtime editable) — never hardcode
  `"done"`; use `isDoneStatus(id)` which treats the **last** column as shipped.

### Persistence

Same Zustand + localStorage root (`"kaizen.root"`) as the rest of the app —
Forge is fully offline-first; `/api/forge/*` backend routes exist but are not
wired from the frontend. Voice-note audio Blobs are session-only (stored on
`window.__forgeVoice[id]` as object URLs, revoked on delete) because Blob URLs
cannot survive page reload.

## Career

Career state is split out into `frontend/lib/careerTypes.ts` with a parallel
set of collections (skills, jobs, roadmap, certs, portfolio, network, daily
log, etc.). The legacy `types.ts` still re-exports the shapes it used to own
via `Legacy*` aliases for back-compat — see `docs/CAREER.md` for the full
breakdown.

---

## Health (VITAL-SIGN OS) — shipped state (Waves 1-3)

Health state lives under `health: HealthState` in `frontend/lib/healthTypes.ts`.
Hydrated through `migrateHealth` (idempotent); seeded with profile defaults for
a 20yo male lifter in Chennai (175cm, moderate activity, maintain, climate×1.1,
8h ideal sleep, 12-20 IF window). Persisted at localStorage key `kaizen.health`.

```
HealthState (as of Wave 3)
 ├── profile:            HealthProfile      # gender/age/height/targets/activity/goal/city/climateMult/units/idealSleep/eatingWindow
 ├── scores:             DailyScore[]       # wave 6 — cached 0-100 composite
 ├── meals:              MealEntry[]        # Breakfast/Lunch/Dinner/Snack (Wave 2 ✓)
 │    └── items:         MealItem[]         # name+kcal+C/P/F (linked to 90-dish Indian food DB or manual)
 ├── water:              WaterEntry[]       # ml + beverage + electrolytes + caffeineMg (Wave 2 ✓)
 ├── sleep:              SleepEntry[]       # bed/wake ISO / durationH / quality 1-10 / latencyMin / wakeUps / dream? / hygiene? / note?
 ├── measurements:       MeasurementEntry[] # Wave 4 (multi-site tape)
 ├── supplementDefs:     SupplementDef[]    # 13 seeded + user customs (whey/creatine/multivit/D3/B12/omega3/Mg/Zn/Ca/ashwa/pre/eaa/probiotic)
 ├── supplementLog:      SupplementLog[]    # per-day per-suppId taken? + time + dose
 ├── vitals:             VitalsEntry[]      # Wave 5 (HR/BP/HRV/temp/SpO2)
 ├── mind:               MindEntry[]        # Wave 5 (mood/stress/energy/anxiety/focus/libido + journal)
 ├── circadian:          CircadianEntry[]   # per-date firstSunlight/firstMeal/lastMeal/caffeineCutoff/screenOff (HH:MM)
 ├── sunlight:           SunlightEntry[]    # id/date/minutes/timeOfDay(morning|midday|afternoon|evening)
 ├── bedtimeRoutine:     BedtimeRoutine     # windowStart/End + steps[] (ordered checklist)
 ├── wakeRoutine:        WakeRoutine        # windowStart/End + steps[] (ordered checklist)
 └── settings:           HealthSettings     # nudges/sound/quietHours/alcoholOptIn + 10 Workout bridge toggles
```

### Key entity notes (Waves 1-3)

- **MealItem** has optional food-link; manual quick-adds are free-text. 90-dish
  seed DB in `healthFoodDb.ts` (South/ North/ street/ sweets/ drinks/ gym/ fruit).
- **WaterEntry.beverage** drives hydration coefficient & caffeine tally (EFSA
  400mg/day cap, post-4pm warning, coconut water default electrolyte beverage).
- **SleepEntry.date** is the wake-day (YYYY-MM-DD IST). One entry per wake day;
  re-logging overwrites. Hygiene is a 10-boolean tick map (see H10b).
- **SupplementDef.seed merge:** migrateHealth unions pre-wave-3 defs with
  `SEED_SUPPLEMENT_DEFS` keyed by id so new seeds appear without wiping customs.
- **CircadianEntry** is sparse (only filled-in fields persisted; empty entries
  are pruned so the array doesn't grow unboundedly).
- **BedtimeRoutine/WakeRoutine** each carry an ordered `steps[]` of
  `{id, label, doneToday}`. Done flags are day-scoped and reset when the day
  rolls over (no cron — "today" is implicit via the current date on render).
- **Bodyweight is NOT duplicated** — Health reads `workout.bodyweight[]` via
  selector as source of truth. `measurements[]` is for tape-only data.
- **PIN protection** for dream journal is deferred (dreams stored plaintext
  locally; PIN lock comes in a later wave).
- **IDs** are random via the shared `uid()` helper (36-rad chars).

### Deferred (Wave 4+):

- Recipes, restaurants, meal planner, meal prep (Wave 8 v1.1 niceties).
- Progress photos, Navy BF%, weight-class charts (Wave 4 Soma).
- HR/BP/HRV/temp/SpO2, symptoms/illness/injury/meds (Wave 5 Vitals).
- Mood/stress/energy/anxiety/focus/libido sliders, free journal, crisis
  helplines (Vandrevala 1860-2662-345 / iCall 9152987821 / NIMHANS) (Wave 5 Mind).
- Timeline, weekly/monthly/annual reports, CSV/JSON export, streaks (Wave 6 Reports).
- Full workout bridge (reverse TDEE, pre/post-wo cards, S:W from PRs, recovery
  wired into Workout deload detector) (Wave 7).
- Restaurant mode, recipe analyzer, IF clock visualizer, sugar-spike estimator,
  bloodwork pinning to override deficiency estimates (Wave 8).

### Workout bridge (directional)

Health **reads** from Workout: bodyweight, sessions, cardioLogs, PRs, readiness,
routine muscle focus, caffeine/hydration fields on sessions.
Health **advises** Workout via: hydration warning %, sleep-debt flags, recovery
score, injury restrictions, deload suggestions, TDEE-derived calorie target.
Health never mutates Workout collections directly. See ALGORITHMS.md for the
full contract table.

### Persistence

Same Zustand + localStorage root (`"kaizen.health"`) — health is fully
offline-first. No backend calls in v1.

### Workout bridge (directional)

Health **reads** from Workout: bodyweight, sessions, cardioLogs, PRs, readiness,
routine muscle focus, caffeine/hydration fields on sessions.
Health **advises** Workout via: hydration warning %, sleep-debt flags, recovery
score, injury restrictions, deload suggestions, TDEE-derived calorie target.
Health never mutates Workout collections directly. See ALGORITHMS.md for the
full contract table.

### Persistence

Same Zustand + localStorage root (`"kaizen.root"`) — health is fully
offline-first. Voice Blob URL session-only pattern is reused for meal/photo
preview URLs where applicable. `/api/health/*` backend routes are a future
drop-in, not wired in v1.0.
