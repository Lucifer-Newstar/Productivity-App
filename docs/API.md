# Backend API

The backend is an Express REST server (`backend/src/server.ts`) that mirrors
the workout domain model on the frontend. It is intentionally minimal —
in-memory store out of the box, no DB, no auth. It exists so the frontend
can sync data to a server when ready.

Base URL: `http://localhost:4000/api`

## Common

- All request/response bodies are JSON.
- All resources expose the same shape as the TypeScript types in
  `frontend/lib/types.ts`.
- Errors use standard HTTP status codes; body is `{ "error": "message" }`.

## Exercises

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/exercises`          | List all exercises                   |
| POST   | `/exercises`          | Create exercise                      |
| GET    | `/exercises/:id`      | Get one                              |
| PATCH  | `/exercises/:id`      | Update exercise                      |
| DELETE | `/exercises/:id`      | Delete exercise                      |
| GET    | `/exercises/by-muscle/:muscle` | Exercises targeting a muscle (primary OR secondary) |

## PRs

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/prs`                | List all PRs                         |
| POST   | `/prs`                | Log a new PR attempt                 |
| DELETE | `/prs/:id`            | Delete PR                            |

## Routines

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/routines`           | List routines                        |
| POST   | `/routines`           | Create routine                       |
| PATCH  | `/routines/:id`       | Update routine (incl. blocks)        |
| DELETE | `/routines/:id`       | Delete routine                       |

## Sessions

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/sessions`           | List sessions (default: last 50)     |
| POST   | `/sessions`           | Start a new session                  |
| POST   | `/sessions/:id/sets`  | Log a set (with full per-set metadata)|
| PATCH  | `/sessions/:id`       | Update session (finish, metadata)    |
| DELETE | `/sessions/:id`       | Discard session                      |

## Wellness

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | `/readiness`          | Log daily readiness                  |
| GET    | `/readiness`          | Readiness history                    |
| POST   | `/bodyweight`         | Log bodyweight                       |
| GET    | `/bodyweight`         | Bodyweight history                   |

## Calisthenics

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET/POST/PATCH/DELETE | `/cali/chains/:id?`   | Progression chains                   |
| GET/POST/DELETE       | `/cali/skills/:id?`   | Skills + attempts/fails              |
| POST                  | `/cali/flows`         | Add a flow                           |
| GET/POST              | `/cali/gtg`           | GtG entries                          |
| POST                  | `/cali/iso`           | Isometric log                        |
| POST                  | `/cali/mobility`      | Mobility session                     |
| POST                  | `/cali/planche`       | Pseudo-planche entry                 |

## Cardio

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/cardio`             | List cardio logs                     |
| POST   | `/cardio`             | Add a cardio log                     |
| DELETE | `/cardio/:id`         | Delete a cardio log                  |

## Global

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET/POST/DELETE | `/goals/:id?`     | Workout goals                        |
| GET/POST/DELETE | `/challenges/:id?`| Challenges                           |
| GET/POST/DELETE | `/journal/:id?`   | Journal entries                      |
| GET/POST/DELETE | `/board/:id?`     | Motivation board items               |
| POST            | `/rest-days`      | Log a rest day                       |
| GET/POST/DELETE | `/programs/:id?`  | Programs                             |

## Analytics helpers

These endpoints run the same algorithms as the frontend but return JSON:

| Method | Path                        | Description                             |
|--------|-----------------------------|-----------------------------------------|
| GET    | `/analytics/weekly-volume`  | Per-muscle kg-volume for last 7 days    |
| GET    | `/analytics/weekly-stats`   | { workouts, volumeKg, minutes, intensity } |
| GET    | `/analytics/streak`         | { current, longest }                    |
| GET    | `/analytics/onerm/:eid`     | Best 1RM for exercise                   |
| GET    | `/analytics/wilks`          | Wilks coefficient (bodyweight, total, sex query params) |

## Export

| Method | Path             | Description                           |
|--------|------------------|---------------------------------------|
| GET    | `/export/csv`    | Download all completed sessions as CSV (same schema the frontend imports) |

## Career routes

Generic CRUD (`GET / POST / GET:id / PATCH:id / DELETE:id`) is exposed for each
career table under `/api/career/*`:

| Table              | Path                          |
|--------------------|-------------------------------|
| roadmaps           | `/api/career/roadmaps`        |
| skills             | `/api/career/skills`          |
| courses            | `/api/career/courses`         |
| contacts           | `/api/career/contacts`        |
| applications       | `/api/career/applications`    |
| companies          | `/api/career/companies`       |
| questions          | `/api/career/questions`       |
| achievements       | `/api/career/achievements`    |
| projects           | `/api/career/projects`        |
| resumes            | `/api/career/resumes`         |
| bullets            | `/api/career/bullets`         |
| testimonials       | `/api/career/testimonials`    |
| days               | `/api/career/days`            |
| meetings           | `/api/career/meetings`        |
| timeline           | `/api/career/timeline`        |
| satisfaction       | `/api/career/satisfaction`    |
| burnoutChecks      | `/api/career/burnout`         |
| sabbaticals        | `/api/career/sabbaticals`     |
| sideHustles        | `/api/career/side-hustles`    |
| ip                 | `/api/career/ip`              |
| speaking           | `/api/career/speaking`        |
| visionBoard        | `/api/career/vision-board`    |
| tracks (legacy)    | `/api/career/tracks`          |
| goals (legacy)     | `/api/career/goals`           |
| notes (legacy)     | `/api/career/notes`           |

`/api/sync` accepts both workout and career tables in one push.

## Sync

`POST /sync` accepts a full state JSON blob and replaces the server
state. Used for "push all local data up" backup.
`GET  /sync` returns the current server state for "pull" restore.

## Running

```bash
cd backend
npm install
npm run dev     # http://localhost:4000
```

The server starts with CORS enabled for `http://localhost:3000` (the Next.js
dev server) so the frontend can hit it directly in development.
