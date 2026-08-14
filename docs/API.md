# Backend API

The backend is an Express REST server (`backend/src/server.ts`) that mirrors
the **entire** frontend domain model — all 5 spaces plus the home dashboard.
It is intentionally minimal: in-memory store out of the box, no DB, no auth.
The offline-first frontend does not depend on it; it exists so local data can
be pushed/pulled to a server (`/api/sync`) and as the reference contract for a
future production implementation (Postgres/Prisma, JWT auth).

Base URL: `http://localhost:4000/api`

## Common

- All request/response bodies are JSON (`express.json`, 8 MB limit — progress
  photos are dataURLs).
- All resources expose the same shape as the TypeScript types in
  `frontend/lib/types.ts`, `careerTypes.ts`, `forgeTypes.ts`, `healthTypes.ts`.
- Every collection gets the same generic CRUD:
  `GET /x` (list) · `POST /x` (create; server assigns `id` unless provided) ·
  `GET /x/:id` · `PATCH /x/:id` (partial merge) · `DELETE /x/:id` (204).
- **Singleton documents** (profile/settings-style objects) use `GET` / `PUT`
  instead — `PUT` merges the body into the stored object.
- Errors use standard HTTP status codes; body is `{ "error": "message" }`.
- CORS is enabled for `http://localhost:3000`.

## Service health

| Method | Path             | Description                                     |
|--------|------------------|-------------------------------------------------|
| GET    | `/health-check`  | `{ ok, time, tables, singletons }`              |
| GET    | `/health`        | Legacy liveness alias (predates the Health space; kept for compatibility) |

## Core (home dashboard)

| Collection | Path           |
|------------|----------------|
| tasks      | `/core/tasks`  |
| notes      | `/core/notes`  |

## Workout space

### Collections (generic CRUD)

| Collection          | Path                        |
|---------------------|-----------------------------|
| exercises           | `/exercises` (+ `/exercises/by-muscle/:muscle`) |
| prs                 | `/prs`                      |
| skills              | `/skills`                   |
| routines            | `/routines`                 |
| readiness           | `/readiness`                |
| badges              | `/badges`                   |
| bodyweight          | `/bodyweight`               |
| caliChains          | `/cali/chains`              |
| caliSkills          | `/cali/skills`              |
| caliFlows           | `/cali/flows`               |
| gtg                 | `/cali/gtg`                 |
| isometricLogs       | `/cali/iso`                 |
| intervalLogs        | `/cali/intervals`           |
| mobilityDrills      | `/cali/mobility/drills`     |
| mobilitySessions    | `/cali/mobility/sessions`   |
| plancheEntries      | `/cali/planche`             |
| cardioLogs          | `/cardio`                   |
| programs            | `/programs`                 |
| goals               | `/goals`                    |
| customMetrics       | `/custom-metrics`           |
| customMetricEntries | `/custom-metric-entries`    |
| challenges          | `/challenges`               |
| journal             | `/journal`                  |
| board               | `/board`                    |
| restDays            | `/rest-days`                |

### Sessions (special routes)

| Method | Path                    | Description                              |
|--------|-------------------------|------------------------------------------|
| GET    | `/sessions`             | List sessions                            |
| POST   | `/sessions`             | Start a session (`{name, routineId, readinessScore}`) |
| GET    | `/sessions/:id`         | Get one                                  |
| POST   | `/sessions/:id/sets`    | Log a set (recomputes `totalVolumeKg`)   |
| PATCH  | `/sessions/:id/finish`  | Finish (sets `endedAt` + `durationSeconds`) |
| PATCH  | `/sessions/:id`         | Update session metadata                  |
| DELETE | `/sessions/:id`         | Discard session                          |

### Workout analytics

| Method | Path                          | Description                                |
|--------|-------------------------------|--------------------------------------------|
| GET    | `/analytics/1rm/:exerciseId`  | Best Epley 1RM across completed sessions   |
| GET    | `/analytics/weekly-stats`     | `{ workouts, volumeKg, minutes, avgIntensity }` (last 7d) |
| GET    | `/analytics/streak`           | `{ current, longest }`                     |

### Export

| Method | Path           | Description                                       |
|--------|----------------|---------------------------------------------------|
| GET    | `/export/csv`  | All completed sessions as CSV (frontend-compatible schema) |

## Career space

Generic CRUD under `/career/*`:

| Collection         | Path                        |
|--------------------|-----------------------------|
| roadmaps           | `/career/roadmaps`          |
| careerSkills       | `/career/skills`            |
| courses            | `/career/courses`           |
| contacts           | `/career/contacts`          |
| applications       | `/career/applications`      |
| companies          | `/career/companies`         |
| questions          | `/career/questions`         |
| careerAchievements | `/career/achievements`      |
| projects           | `/career/projects`          |
| resumes            | `/career/resumes`           |
| bullets            | `/career/bullets`           |
| testimonials       | `/career/testimonials`      |
| days               | `/career/days`              |
| meetings           | `/career/meetings`          |
| timeline           | `/career/timeline`          |
| satisfaction       | `/career/satisfaction`      |
| burnoutChecks      | `/career/burnout`           |
| sabbaticals        | `/career/sabbaticals`       |
| sideHustles        | `/career/side-hustles`      |
| ip                 | `/career/ip`                |
| speaking           | `/career/speaking`          |
| visionBoard        | `/career/vision-board`      |
| tracks (legacy)    | `/career/tracks`            |
| careerGoals        | `/career/goals`             |
| careerNotes        | `/career/notes`             |

## Projects space (Forge)

Generic CRUD under `/forge/*` — mirrors `ForgeState` collections
(`frontend/lib/forgeTypes.ts`):

| Collection          | Path                      |
|---------------------|---------------------------|
| forgeProjects       | `/forge/projects`         |
| forgeTasks          | `/forge/tasks`            |
| forgeScratch        | `/forge/scratch`          |
| forgeDecisions      | `/forge/decisions`        |
| forgeSwot           | `/forge/swot`             |
| forgeProsCons       | `/forge/pros-cons`        |
| forgeScenarios      | `/forge/scenarios`        |
| forgeFiveWhys       | `/forge/five-whys`        |
| forgeLessons        | `/forge/lessons`          |
| forgeRetros         | `/forge/retros`           |
| forgeParking        | `/forge/parking`          |
| forgePomodoros      | `/forge/pomodoros`        |
| forgePersonas       | `/forge/personas`         |
| forgeDecisionMatrix | `/forge/decision-matrix`  |
| forgeIdeas          | `/forge/ideas`            |
| forgeFishbones      | `/forge/fishbones`        |
| forgeSixHats        | `/forge/six-hats`         |
| forgeScamper        | `/forge/scamper`          |
| forgeSprints        | `/forge/sprints`          |
| forgeReviews        | `/forge/reviews`          |
| forgeMindmaps       | `/forge/mindmaps`         |
| forgeCanvases       | `/forge/canvases`         |
| forgeVoiceNotes     | `/forge/voice-notes`      |
| forgeBmc            | `/forge/bmc`              |
| forgeVpc            | `/forge/vpc`              |
| forgeLean           | `/forge/lean`             |
| forgePorter         | `/forge/porter`           |
| forgePestel         | `/forge/pestel`           |
| forgeUserStories    | `/forge/user-stories`     |
| forgeEventStorms    | `/forge/event-storms`     |
| forgeJourneyMaps    | `/forge/journey-maps`     |
| forgeBlueprints     | `/forge/blueprints`       |
| forgeWireframes     | `/forge/wireframes`       |
| forgeBuyAFeature    | `/forge/buy-a-feature`    |
| forgePaired         | `/forge/paired`           |
| forgeAffinity       | `/forge/affinity`         |
| forgeCustomStatuses | `/forge/custom-statuses`  |
| forgeAuditLog       | `/forge/audit-log`        |

### Forge singletons (GET / PUT)

| Singleton     | Path              |
|---------------|-------------------|
| streak        | `/forge/streak`   |
| settings      | `/forge/settings` |

### Forge analytics

| Method | Path                       | Description                                  |
|--------|----------------------------|----------------------------------------------|
| GET    | `/forge/analytics/summary` | `{ projects, tasks, byStatus, sprints, ideas }` |

## Health space (VITAL-SIGN)

Generic CRUD under `/health/*` — mirrors `HealthState` collections
(`frontend/lib/healthTypes.ts`):

| Collection           | Path                        |
|----------------------|-----------------------------|
| healthScores         | `/health/scores`            |
| healthMeals          | `/health/meals`             |
| healthWater          | `/health/water`             |
| healthSleep          | `/health/sleep`             |
| healthMeasurements   | `/health/measurements`      |
| healthPhotos         | `/health/photos`            |
| healthSupplementDefs | `/health/supplement-defs`   |
| healthSupplementLog  | `/health/supplement-log`    |
| healthVitals         | `/health/vitals`            |
| healthMind           | `/health/mind`              |
| healthSymptoms       | `/health/symptoms`          |
| healthIllnesses      | `/health/illnesses`         |
| healthInjuries       | `/health/injuries`          |
| healthMedications    | `/health/medications`       |
| healthAllergies      | `/health/allergies`         |
| healthOrthostatic    | `/health/orthostatic`       |
| healthJournal        | `/health/journal`           |
| healthCircadian      | `/health/circadian`         |
| healthSunlight       | `/health/sunlight`          |

### Health singletons (GET / PUT)

| Singleton      | Path                       |
|----------------|----------------------------|
| profile        | `/health/profile`          |
| settings       | `/health/settings`         |
| bedtimeRoutine | `/health/bedtime-routine`  |
| wakeRoutine    | `/health/wake-routine`     |

### Health analytics

Server-side mirrors of `frontend/lib/healthAnalytics.ts`
(formulas documented in `docs/ALGORITHMS.md` §H1–H23):

| Method | Path                                | Query params | Returns |
|--------|-------------------------------------|--------------|---------|
| GET | `/health/analytics/bmr`           | `weight, height, age[, gender, bf]` | `{ mifflin, katch }` (Katch-McArdle only when `bf` given) |
| GET | `/health/analytics/tdee`          | `weight, height, age[, activity, gender]` | `{ tdee, activityMult }` |
| GET | `/health/analytics/water-goal`    | `weight[, climateMult=1.1, workoutMl=0]` | `{ goalMl }` |
| GET | `/health/analytics/navy-bf`       | `waist, neck, height[, gender, hip]` | `{ bfPct }` (US Navy method; `hip` required for female) |
| GET | `/health/analytics/sleep-bank`    | `[ideal=8]` | `{ bankHours, nights, ideal }` over stored last-14 sleep rows |
| GET | `/health/analytics/daily-summary` | `[date=today]` | `{ kcal, proteinG, carbsG, fatG, waterMl, caffeineMg, sleepH, suppsTaken, mealCount }` |

### Health export

| Method | Path                  | Description                              |
|--------|-----------------------|-------------------------------------------|
| GET    | `/health/export/csv`  | Daily summaries for every date with data (same columns as the frontend Reports CSV) |

## Sync

Full-state push/pull backup:

- `GET /sync` → `{ tables: { <table>: { <id>: row } }, singletons: {...} }`
- `POST /sync` accepts either the wrapped `{ tables, singletons }` shape or the
  legacy flat `{ <table>: rows }` shape. Table payloads may be arrays or
  id-keyed objects; rows are re-keyed by `id`. Provided tables **replace**
  server state; omitted tables are untouched.

## Running

```bash
cd backend
npm install
npm run dev     # tsx watch — http://localhost:4000
npm run build && npm start   # production
```
