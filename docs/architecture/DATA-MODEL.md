# Kaizen data-model reference

_Last synchronized: 2026-08-16 on branch `entertainment`._

## Root state

```text
StoreState
 ├── tasks: Task[]
 ├── notes: Note[]
 ├── career: CareerState
 ├── workout: WorkoutState
 ├── forge: ForgeState
 ├── health: HealthState
 ├── entertainment: EntertainmentState
 └── notifications: NotificationState
```

Types are split by domain:

- `frontend/lib/types.ts` — Core and legacy Workout shapes/re-exports.
- `frontend/lib/careerTypes.ts` — Career entities.
- `frontend/lib/forgeTypes.ts` — Projects/Forge entities.
- `frontend/lib/healthTypes.ts` — Health entities.
- `frontend/lib/entertainmentTypes.ts` — AFTERGLOW schema v6.

All runtime IDs are local strings. Relationships use IDs rather than nested copies unless a historical snapshot is intentionally required.

## Core

### Task

Core fields: `id`, `title`, `space`, `priority`, `completed`, `createdAt`, plus optional planning metadata. Tasks are shared by the home dashboard and generic space task components.

### Note

Core fields: `id`, `title`, `content`, `pinned`, `updatedAt`.

Persistence: `kaizen.tasks`, `kaizen.notes`.

## Workout

```text
WorkoutState
 ├── exercises: WorkoutExercise[]
 ├── prs: WorkoutPR[]
 ├── skills: WorkoutSkill[]
 ├── routines: WorkoutRoutine[]
 ├── sessions: WorkoutSession[]
 │    ├── sets: WorkoutSetLog[]
 │    └── adHocBlocks?: WorkoutBlock[]
 ├── readiness: WorkoutReadiness[]
 ├── badges: WorkoutBadge[]
 ├── bodyweight: WorkoutBodyweight[]
 ├── settings: WorkoutSettings
 ├── caliChains / caliSkills / caliFlows
 ├── gtg / isometricLogs / intervalLogs
 ├── mobilityDrills / mobilitySessions / plancheEntries
 ├── cardioLogs / programs / goals / challenges
 ├── customMetrics / customMetricEntries
 ├── journal / board / restDays / kanban
 └── activeSessionId + streak metadata
```

### Atomic set log

`WorkoutSetLog` records block/set identity, reps or duration, weight, RPE/RIR, completion and optional training metadata: warm-up/joker/drop/AMRAP flags, unilateral values, equipment, quality/speed/feeling, pain, sticking point, asymmetry and notes.

### Session

`WorkoutSession` owns date/time, routine/ad-hoc blocks, sets, duration, volume and optional phase, crowd, playlist, rating, hydration, caffeine, soreness, joint pain, nutrition and program metadata.

Persistence: `kaizen.workout`. Migration: `migrateWorkout()`.

## Projects / Forge

```text
ForgeState
 ├── projects: ForgeProject[]
 ├── tasks: ProjectTask[]
 ├── scratch / decisions / swot / prosCons / scenarios / fiveWhys
 ├── lessons / retros / parking / pomodoros
 ├── personas / decisionMatrix / ideas / fishbones / sixHats / scamper
 ├── sprints / reviews / mindmaps / canvases / voiceNotes
 ├── bmc / vpc / lean / porter / pestel
 ├── userStories / eventStorms / journeyMaps / blueprints / wireframes
 ├── buyAFeature / paired / affinity
 ├── customStatuses / auditLog
 ├── streak
 └── settings
```

### Project and task relationship

`ProjectTask.projectId` points to `ForgeProject.id`. Dependencies use task IDs. Custom status IDs are interpreted through `effectiveCols()` / `isDoneStatus()` rather than hardcoded `done` checks.

### Strategy canvases

Canvas rows are independent collections so each method can evolve without creating one untyped mega-object. See [`spaces/projects/CANVASES.md`](../spaces/projects/CANVASES.md).

Persistence: `kaizen.forge`. Migration: `migrateForge()`.

## Career

```text
CareerState
 ├── roadmaps: CareerRoadmap[]
 │    └── phases[] → milestones[] → resources/projects/labs/quiz
 ├── skills: CareerSkill[]
 ├── courses: CareerCourse[]
 ├── contacts: NetworkContact[]
 ├── applications: JobApplication[]
 ├── companies / questions
 ├── achievements / projects / resumes / bullets / testimonials
 ├── days / meetings / timeline
 ├── satisfaction / burnoutChecks / sabbaticals / retirement
 ├── sideHustles / ip / speaking / visionBoard
 └── legacy tracks / goals / notes / linkedin
```

Roadmap dependencies use milestone IDs. Portfolio projects can be created by Forge ship actions. Skill growth, contact interactions, applications and daily records remain normalized top-level collections.

Persistence: `kaizen.career`. Migration: `migrateCareer()`.

## Health / VITAL-SIGN

```text
HealthState
 ├── profile / settings / healthMeta fields
 ├── scores
 ├── meals / nutrients / recipes / mealPlan / restaurantMeals
 ├── water / urineChecks
 ├── sleep / naps / circadian / sunlight
 ├── bedtimeRoutine / wakeRoutine
 ├── measurements / photos / measurement goals
 ├── supplementDefs / supplementLog
 ├── vitals / orthostatic
 ├── mind / journal
 ├── symptoms / illnesses / injuries / medications / allergies
 ├── workoutCheckins / goals / competitions / habitBreaks
 └── phase, cadence and pinned-food metadata
```

### Health profile and settings

Profile owns demographic/body constants used by BMR, TDEE, hydration and body-composition formulas. Settings own targets, climate/alcohol choices, quiet hours and Workout bridge toggles.

### Nutrition and hydration

Meals contain slots and item snapshots so historical totals do not change when the food database changes. Nutrient rows, recipes, planner rows and restaurant presets are separate collections. Water rows store beverage type, effective hydration and caffeine.

### Sleep and recovery

Sleep rows own bed/wake ISO values, quality and hygiene. Naps, circadian anchors, sunlight and routines are independent collections used to derive sleep bank and consistency.

### Body composition

Measurement rows contain weight, circumference sites, pump flag and calculated Navy body-fat values. Progress photos are local raster data URLs and should eventually move to IndexedDB.

### Vitals and mind

Vitals contain heart rate, blood pressure, temperature, SpO₂, respiration and context. Mind rows contain mood, energy, stress, motivation and related wellness ratings. Symptoms, illnesses, injuries, medications and allergies remain distinct records.

Persistence: `kaizen.health`. Migration: `migrateHealth()`.

Detailed health specification: [`spaces/health/FEATURES.md`](../spaces/health/FEATURES.md).

## Entertainment / AFTERGLOW

`EntertainmentState` is currently schema **v6**.

```text
EntertainmentState
 ├── items: EntertainmentItem[]
 ├── collections: EntertainmentCollection[]
 ├── events: EntertainmentEvent[]
 ├── friends / recommendations / groups / gifts / loans
 ├── reviewDrafts / fanArt / fanFiction / cosplay
 ├── quotes / moodBoards / dreamCast / whatIfs
 ├── settings
 └── lastRolloverMonth
```

### Entertainment item

An item separates provider metadata from personal tracking:

- Identity: local ID, provider/provider ID, media type.
- Metadata: titles, description, cover proxy/data URL, release, genres, creators, cast, studios, countries.
- Personal state: status, type-aware progress, rating/review/notes, dates, repeats, priority/order, tags, favorite/archive, time/cost.
- Discovery: franchise/order and favorite talent.
- Deep detail objects:
  - `BookDetails` — format, edition, narrator, reading logs.
  - `ComicDetails` — format and volume ownership/read state.
  - `SeriesDetails` — platform, audio, seasons, episode logs and alerts.
  - `MovieDetails` — venue, version, acting/cinematography scores.
  - `AnimeDetails` — audio, source, seiyuu and OP/ED markers.

Metadata refreshes update catalogue fields but preserve personal tracking.

### Collections and events

Collections own item IDs. Events form the local activity timeline and include add/start/progress/complete/pause/drop/repeat/rate/update/archive/restore/rollover actions.

### Social and creation

Offline social records use item/friend IDs. Creation records use item IDs and local bounded raster images. Backups pass through safe JSON parsing and `migrateEntertainment()` revalidates restored image sources.

Persistence: `kaizen.entertainment`. Detailed model: [`spaces/entertainment/DATA-MODEL.md`](../spaces/entertainment/DATA-MODEL.md).

## Notifications

```text
NotificationState (schema v1)
 ├── items: KaizenNotification[]
 ├── settings: NotificationSettings
 └── lastEvaluatedAt
```

Notifications have stable `sourceKey` deduplication, section/kind/priority, title/body, optional action route, read/dismiss/browser-delivery timestamps and schedule metadata. Settings own global enablement, frequency, quiet hours, DND/snooze, browser/sound channels and per-section category toggles.

Persistence: `kaizen.notifications`. Migration: `migrateNotifications()`.

Detailed rules/settings: [`notifications/README.md`](../notifications/README.md).

## Migrations and compatibility

Every persisted domain must supply defaults for new arrays/scalars. Migration rules:

1. Never discard personal ratings, notes, progress or history when adding metadata.
2. Normalize absent arrays to `[]` and nested objects to safe defaults.
3. Cap untrusted/restored collections where storage exhaustion is plausible.
4. Revalidate security-sensitive values such as image/data/proxy URLs.
5. Use functional state updates for multi-record changes.
6. Add executable migration fixtures for schema changes.

## Backend mapping

The Express API mirrors frontend domains as **138 collection tables and 12 singleton documents**. It does not import frontend TypeScript types at runtime; `docs/reference/API.md` and `docs/architecture/SYNC-CONTRACT.md` define the mapping contract.
