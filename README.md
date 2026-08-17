# Kaizen

> Continuous growth. A productivity / life-OS app with a world-class workout
> tracker, career roadmap, projects, entertainment, and health spaces.

## Stack

- **Frontend** — Next.js **16.3.1**, React 19, TypeScript, Tailwind 3,
  Framer Motion, lucide-react.
  - App Router (`/`) for the home dashboard with a left `SideNav`.
  - Pages Router for standalone spaces (`/projects`, `/workout`, `/career`,
    `/entertainment`, `/health`); all five use dedicated full-screen shells.
  - Global local-first notification inbox/settings mounted across Home and every space.
- **Backend** — Express 4 REST API under `backend/`, in-memory store, port 4000.
- **Intelligence** — independent local-first TypeScript engine under `ai/`, paired loopback gateway and read-only `get_today@1.0` vertical slice.
- **Docs** — see [`docs/`](docs):
  - [`architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) — layout, state model, rendering.
  - [`reference/ALGORITHMS.md`](docs/reference/ALGORITHMS.md) — every formula (1RM, Wilks, Epley,
    readiness, HR zones, VO2, plates, etc.)
  - [`reference/FEATURES.md`](docs/reference/FEATURES.md) — cross-space feature status and audits.
  - [`notifications/`](docs/notifications) — global notification rules, settings and scope.
  - [`reference/API.md`](docs/reference/API.md) — backend REST reference.
  - [`security/SECURITY.md`](docs/security/SECURITY.md) — secure deployment and threat model.
  - [`security/AUDIT-2026-08-16.md`](docs/security/AUDIT-2026-08-16.md) — latest full-site audit and remediation report.

## Getting started

```bash
# frontend
cd frontend
npm ci
npm run dev          # http://localhost:3000

# backend (in another tab)
cd backend
npm ci
npm run dev          # http://localhost:4000

# optional local Intelligence Engine (mock provider)
cd ../ai
npm ci
KAIZEN_AI_PROVIDER=mock npm run dev  # http://127.0.0.1:4317
```

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
[`docs/security/SECURITY.md`](docs/security/SECURITY.md).
