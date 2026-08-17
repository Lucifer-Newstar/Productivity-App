# Kaizen

> Continuous growth. A productivity / life-OS app with a world-class workout
> tracker, career roadmap, projects, entertainment, and health spaces.

## Stack

- **Frontend** — Next.js **16.3.1**, React 19, TypeScript, Tailwind 3,
  Framer Motion, lucide-react.
  - App Router (`/`) for the home dashboard with a left `SideNav`.
  - Pages Router for standalone space routes (`/projects`, `/workout`,
    `/career`, `/entertainment`, `/health`). TopNav is shared across spaces;
    `/workout` opts into a full-screen immersive shell (its own rail, top
    strip, and page-transition animations) via `WorkoutPage.fullScreen`.
- **Backend** — Express 4 REST API under `backend/`, in-memory store, port 4000.
- **Docs** — see [`docs/`](./docs):
  - [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — layout, state model, rendering.
  - [`ALGORITHMS.md`](./docs/ALGORITHMS.md) — every formula (1RM, Wilks, Epley,
    readiness, HR zones, VO2, plates, etc.)
  - [`FEATURES.md`](./docs/FEATURES.md) — checklist status of all 149 workout
    features.
  - [`API.md`](./docs/API.md) — backend REST reference.
  - [`SECURITY.md`](./docs/SECURITY.md) — secure deployment and threat model.
  - [`SECURITY-AUDIT-2026-08-16.md`](./docs/SECURITY-AUDIT-2026-08-16.md) — latest full-site audit and remediation report.

## Getting started

```bash
# frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# backend (in another tab)
cd backend
npm install
npm run dev          # http://localhost:4000
```

Git credentials for this repo are configured as
`Lucifer-Newstar <navin.jairam@gmail.com>`. When pushing rewritten history
(after `filter-branch`), use `--force-with-lease`.

## Scripts

```bash
cd frontend && ./node_modules/.bin/next build     # production build
cd frontend && ./node_modules/.bin/tsc --noEmit   # type check
cd backend  && npm run build                      # compile backend
cd frontend && npm audit --omit=dev                # production dependency audit
cd backend  && npm audit --omit=dev
```

The API binds to `127.0.0.1` by default. Before intentionally exposing it on a
network, set `KAIZEN_API_KEY` and an explicit `CORS_ORIGINS` allowlist; see
[`docs/SECURITY.md`](./docs/SECURITY.md).
