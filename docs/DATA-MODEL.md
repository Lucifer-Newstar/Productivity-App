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

## Health (VITAL-SIGN OS) — planned

Health state lives under `health: HealthState` in `frontend/lib/healthTypes.ts`
(created when Wave 1 ships). Hydrated through `migrateHealth`; seeded with
profile defaults for a 20yo male lifter in Chennai.

```
HealthState
 ├── profile: HealthProfile
 │    └── {gender, age, heightCm, weightKg, targetWeightKg, bfGoalPct,
 │         activityLevel, goal (bulk|cut|maintain|recomp), city,
 │         climateMultOverride, units, theme, dreamJournalPin}
 ├── meals:             MealEntry[]           # Breakfast/Lunch/Dinner/Snack entries
 │    └── items:        MealItem[]            # individual foods within meal (linked to foodDb)
 ├── foodLibrary:       FoodLibraryItem[]     # user's 20 frequent meals (auto-tracked + pinned)
 ├── recipes:           Recipe[]              # ingredients[] + kcal/macros per serving
 ├── restaurants:       RestaurantEntry[]     # saved Chennai eatery presets
 ├── mealPlans:         MealPlan[]            # 7-day meal planner grids
 ├── mealPrep:          MealPrepWeek[]        # weekly prep checklists
 ├── waterLog:          WaterEntry[]          # ml + beverage type + electrolytes flag
 ├── caffeineLog:       CaffeineEntry[]       # mg + source + time
 ├── sleep:             SleepEntry[]          # bed/wake/duration/quality/latency/wakeups
 ├── dreams:            DreamEntry[]          # PIN-protected entries
 ├── sleepRoutines:     SleepRoutine[]        # bedtime/wakeup routines (checklist)
 ├── circadian:         CircadianLog[]        # first light, meals, caffeine cutoff, screen-off
 ├── bodyMeasurements:  MeasurementEntry[]    # waist/neck/chest/arm/thigh/etc. in cm
 ├── bodyFat:           BodyFatEstimate[]     # Navy-method BF% (waist/neck/height)
 ├── progressPhotos:    ProgressPhoto[]       # dataURL/IndexDB references (offline)
 ├── supplements:       Supplement[]          # defs: name, dose, schedule
 ├── supplementLog:     SupplementDose[]      # per-day taken/missed
 ├── sunlight:          SunlightLog[]         # minutes + time + skin exposure
 ├── bloodwork:         BloodworkResult[]     # manual entries w/ reference ranges
 ├── vitals:            VitalsEntry[]         # RHR, BP, HRV, temp, SpO2, resp rate
 ├── symptoms:          SymptomEntry[]        # illness/symptom logs
 ├── injuries:          InjuryEntry[]         # body part + severity + dates
 ├── medications:       MedicationEntry[]     # OTC/Rx
 ├── mental:            MindEntry[]           # mood/stress/energy/anxiety/focus/ libido 1-10
 ├── journal:           JournalEntry[]        # free-text daily entries
 ├── meditation:        MeditationEntry[]     # minutes
 ├── gratitude:         GratitudeEntry[]      # 3 things/day
 ├── steps:             StepsEntry[]          # manual count
 ├── healthScores:      DailyScore[]          # cached 0–100 composite
 ├── habits:            HealthHabitState[]    # per-habit streaks for water/sleep/protein/etc.
 ├── goals:             HealthGoal[]          # target weight/BF/waist/macros/step/etc.
 └── settings:          HealthSettings        # nudges, reminder schedule, workout sync toggles
```

### Key entity notes

- **MealItem.foodId** links into either `foodLibrary`, the seed `healthFoodDb.ts`
  (80+ Indian dishes pre-seeded), or a free-text entry. Kcal/macros default from
  the DB but are overridable per entry (user rough-log override always wins).
- **Macros are tracked as grams** (carbs, protein, fat) + kcal; sliders are a
  convenience UI over grams — the slider normalises to logged kcal, so users
  never have to use a food scale.
- **Bodyweight is NOT duplicated** — Health reads `workout.bodyweight[]` as the
  source of truth via selector. `health.bodyMeasurements` is for tape-only data.
- **Photos** are stored offline (dataURL in localStorage up to size cap,
  IndexedDB for larger sets in v1.2). No network upload, fully offline-first.
- **PIN protection** for dream journal + bloodwork uses a local salted SHA-256
  hash (not a secure auth system — deterring casual shoulder-surfing only).
- **IDs** are `h_${nanoid()}` (or typed prefix `meal_`, `sleep_`, etc.).

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
