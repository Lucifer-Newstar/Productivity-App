# Kaizen Backend

Minimal Express REST API for the Kaizen Workout tracker. Runs on port **4000**
by default and keeps all data in memory (no database required). It mirrors the
frontend's TypeScript domain model so that when you're ready to add
persistence/auth, you can swap the in-memory store for Postgres/Prisma
without touching the route handlers.

## Quick start

```bash
cd backend
npm install
npm run dev       # tsx watch — auto-reloads on change
# API running at http://localhost:4000
```

For production:

```bash
npm run build
npm start
```

## What's included

- CORS enabled for `http://localhost:3000` (Next.js dev server)
- JSON body parser (2 mb limit)
- Full CRUD for every workout entity (exercises, PRs, routines, sessions,
  calisthenics chains/skills/flows/GtG/isometrics/intervals/mobility/planche,
  cardio logs, programs, goals, challenges, journal, motivation board,
  rest days, bodyweight, readiness, badges)
- Session-specific helpers:
  - `POST /api/sessions` — start a new session
  - `POST /api/sessions/:id/sets` — log a set (auto-updates total volume)
  - `PATCH /api/sessions/:id/finish` — finalise a session
- Analytics endpoints running the same math as the frontend:
  - `/api/analytics/1rm/:exerciseId` (Epley 1RM)
  - `/api/analytics/weekly-stats` (workouts/volume/minutes/intensity)
  - `/api/analytics/streak` (current streak)
- Sync endpoint: `GET /api/sync` and `POST /api/sync` for whole-state
  push/pull backup.
- Health: `GET /api/health`

See `docs/API.md` in the repo root for the full route reference, and
`docs/ALGORITHMS.md` for the math used by the analytics endpoints.

## Future work

- [ ] JWT auth / signup / login
- [ ] Postgres via Prisma
- [ ] WebSocket for real-time rest-timer sync across devices
- [ ] CSV/JSON import endpoints
- [ ] Apple Health / Google Fit ingestion
