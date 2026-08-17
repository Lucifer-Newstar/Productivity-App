# Kaizen Backend

Minimal Express REST API mirroring the **entire** Kaizen frontend domain —
all 5 spaces (Workout, Career, Projects/Forge, Health, plus Core home
tasks/notes). Runs on port **4000** by default and keeps all data in memory
(no database required). It mirrors the frontend's TypeScript domain model so
that when you're ready to add persistence/auth, you can swap the in-memory
store for Postgres/Prisma without touching the route handlers.

## Quick start

```bash
cd backend
npm install
npm run dev       # tsx watch — auto-reloads on change
# API running at http://localhost:4000
```

For production/network access:

```bash
npm run build
HOST=0.0.0.0 \
KAIZEN_API_KEY='use-a-long-random-secret' \
CORS_ORIGINS='https://kaizen.example.com' \
npm start
```

Do not expose the API without an API key and TLS reverse proxy. See
`docs/security/SECURITY.md` for all controls and accepted limitations.

## What's included

- Loopback-only binding by default (`127.0.0.1`)
- Explicit CORS origin allowlist
- Optional API-key authentication for every data route
- Helmet, read/write rate limits, strict bounded JSON and unsafe-key rejection
- **138 collections** with generic CRUD (list/create/get/patch/delete) +
  **12 singleton documents** (GET/PUT):
  - **Core** — tasks, notes (`/api/core/*`)
  - **Workout** — 25 collections (exercises, PRs, routines, sessions,
    calisthenics chains/skills/flows/GtG/isometrics/intervals/mobility/planche,
    cardio logs, programs, goals, challenges, journal, motivation board,
    rest days, bodyweight, readiness, badges, custom metrics)
  - **Career** — 25 collections (`/api/career/*`)
  - **Forge / Projects** — 37 collections + streak/settings singletons
    (`/api/forge/*`)
  - **Health / VITAL-SIGN** — health collections + profile/settings/routine singletons (`/api/health/*`)
  - **Entertainment / AFTERGLOW** — 16 collections covering library, social and creation studio + settings singleton (`/api/entertainment/*`)
- Session-specific helpers:
  - `POST /api/sessions` — start a new session
  - `POST /api/sessions/:id/sets` — log a set (auto-updates total volume)
  - `PATCH /api/sessions/:id/finish` — finalise a session
- Analytics endpoints running the same math as the frontend:
  - Workout: `/api/analytics/1rm/:exerciseId`, `/api/analytics/weekly-stats`,
    `/api/analytics/streak`
  - Health: `/api/health/analytics/bmr` (Mifflin + Katch-McArdle),
    `/tdee`, `/water-goal` (Chennai climate multiplier), `/navy-bf`,
    `/sleep-bank`, `/daily-summary`
  - Forge: `/api/forge/analytics/summary`
- Exports: `GET /api/export/csv` (workout sessions),
  `GET /api/health/export/csv` (daily health summaries)
- Sync: `GET /api/sync` and `POST /api/sync` for whole-state push/pull backup
  (wrapped `{ tables, singletons }` shape; legacy flat shape still accepted)
- Service liveness: `GET /api/health-check` (legacy alias `GET /api/health`)

See `docs/reference/API.md` for the full route reference, and
`docs/reference/ALGORITHMS.md` for the math used by the analytics endpoints
(Health formulas are §H1–H30).

## Future work

- [ ] JWT auth / signup / login
- [ ] Postgres via Prisma
- [ ] WebSocket for real-time rest-timer sync across devices
- [ ] CSV/JSON import endpoints
- [ ] Apple Health / Google Fit ingestion
