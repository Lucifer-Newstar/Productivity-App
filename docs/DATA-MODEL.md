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
