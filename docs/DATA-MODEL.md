# Data Model Reference

Every persisted entity lives in `frontend/lib/types.ts`. This document
describes the entities and their relationships at a high level so a new
contributor can orient themselves quickly.

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
