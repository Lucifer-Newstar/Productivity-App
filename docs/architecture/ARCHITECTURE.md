# Kaizen architecture

_Last synchronized: 2026-08-16 on branch `entertainment`._

## System overview

```text
Browser
 ├── Next.js 16 / React 19 UI
 │    ├── App Router: / and /api/entertainment/*
 │    ├── Pages Router: all five full product spaces
 │    ├── React Context root store
 │    ├── global NotificationCenter + pure rule engine
 │    └── localStorage/sessionStorage persistence
 └── optional same-origin provider calls
      └── fixed Next.js server adapters → MAL/AniList/TMDB/Books/Comic Vine/NYT

Optional Express reference API (127.0.0.1:4000)
 ├── 138 in-memory collection tables
 ├── 12 singleton documents
 ├── generic CRUD + sync + analytics + CSV
 └── optional service API key; not called by the normal frontend
```

Kaizen is one application, not five separately deployed apps. “Forge,” “VITAL-SIGN” and “AFTERGLOW” are product-space brands inside the same frontend.

## Repository layout

```text
Productivity-App/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    # Home dashboard
│   │   ├── layout.tsx                  # App Router providers
│   │   ├── globals.css                 # Shared Tailwind/utilities
│   │   └── api/entertainment/          # Same-origin provider BFF routes
│   ├── pages/
│   │   ├── _app.tsx                    # Pages Router providers/fullScreen switch
│   │   ├── workout/                    # 12 training routes
│   │   ├── projects/                   # 5 Forge routes
│   │   ├── career/                     # 10 career routes including redirect
│   │   ├── health/                     # 10 VITAL-SIGN routes
│   │   └── entertainment/              # AFTERGLOW route
│   ├── components/
│   │   ├── workout/
│   │   ├── forge/
│   │   ├── career/
│   │   ├── health/
│   │   └── entertainment/
│   ├── lib/
│   │   ├── store.tsx                   # React Context root and actions
│   │   ├── theme.tsx                   # Global dark/light preference
│   │   ├── types.ts                    # Core + Workout legacy types
│   │   ├── careerTypes.ts
│   │   ├── forgeTypes.ts
│   │   ├── healthTypes.ts
│   │   ├── entertainmentTypes.ts
│   │   ├── *Analytics.ts               # Pure domain formulas
│   │   └── security.ts                 # URL/import/image/CSV helpers
│   └── scripts/                        # Health, Entertainment and security QA
├── backend/
│   ├── src/server.ts                   # Express reference API
│   └── scripts/security-smoke.mjs
└── docs/
```

## Rendering model

### App Router

`/` uses `frontend/app/layout.tsx` and the home `SideNav`. The layout installs `ThemeProvider`, `StoreProvider` and the storage-quota warning.

The App Router also hosts five dynamic server routes:

- `/api/entertainment/search`
- `/api/entertainment/trending`
- `/api/entertainment/details`
- `/api/entertainment/providers`
- `/api/entertainment/image`

These routes form a small backend-for-frontend boundary: browser code cannot select an arbitrary upstream host and provider credentials remain server-side or session-only request headers.

### Pages Router

`pages/_app.tsx` installs the same providers. A page with static `fullScreen = true` bypasses `TopNav` and the shared constrained column so its own immersive shell can paint edge to edge.

Full-screen spaces:

- Workout — imperial obsidian/gold shell
- Projects / Forge — Foundry dark and Drafting Room light
- Career — Night HUD and Blueprint
- Health — VITAL-SIGN and Clinic
- Entertainment — AFTERGLOW Midnight Screening and Matinee

## State management

The actual implementation is **React Context plus `useState`/functional updaters**, not Zustand.

`StoreProvider` owns seven persisted domains:

```text
Core:          tasks, notes
Career:        CareerState
Workout:       WorkoutState
Forge:         ForgeState
Health:        HealthState
Entertainment: EntertainmentState (schema v6)
Notifications: NotificationState (schema v2)
```

High-growth domains expose generic functional mutators:

- `updateCareer(c => patch)`
- `updateForge(f => patch)`
- `updateHealth(h => patch)`
- `updateEntertainment(e => patch)`

Functional updates are required for multi-field/batched writes to prevent stale-closure data loss.

## Persistence

Persistence is local-first and slice-specific:

| Key | Owner |
|---|---|
| `kaizen.tasks` | Core tasks |
| `kaizen.notes` | Core notes |
| `kaizen.career` | Career |
| `kaizen.workout` | Workout |
| `kaizen.forge` | Projects / Forge |
| `kaizen.health` | Health |
| `kaizen.entertainment` | Entertainment |
| `kaizen.notifications` | Global notification inbox/settings |
| `kaizen.habits` | Home Habits component |
| `kaizen.theme` | Global theme |

Every major slice has a defensive migration. Persistence failures are caught and surfaced through `StorageErrorBanner`; media-heavy data should eventually move to IndexedDB.

Entertainment provider overrides use `sessionStorage` and are intentionally excluded from state and exports.

## Cross-space contracts

- Forge project shipping can create a Career portfolio project.
- Career and Forge share project/skill-oriented links and identifiers through the root store.
- Health reads Workout sessions, PRs, bodyweight and settings for readiness, energy and body-composition analysis.
- Workout reads Health sleep, hydration, injuries, vitals and burnout signals for pre-workout advice.
- Entertainment is currently independent except for global theme and home navigation.

Cross-space reads occur through root-store selectors/updaters. Avoid circular imports: shared algorithms should remain pure and lower-level.

## Themes and styling

- Tailwind 3 supplies shared utility classes and base tokens.
- Space shells layer local CSS variables and inline React styles for their branded systems.
- Global dark/light preference is stored once in `kaizen.theme`.
- External fonts were removed; system/local fallback stacks avoid a third-party CSS/font trust boundary.
- AFTERGLOW honors `prefers-reduced-motion`.

## Security boundaries

- Frontend security headers are defined in `frontend/next.config.js`.
- Provider route guards enforce same-site browser requests, per-process limits and bounded maps.
- Upstream JSON and image responses are streamed under hard byte ceilings.
- User URLs are restricted to HTTP(S); image data is raster-only and bounded.
- Express binds to loopback by default and requires explicit configuration for network exposure.

See [`SECURITY.md`](../security/SECURITY.md) and [`SECURITY-AUDIT-2026-08-16.md`](../security/AUDIT-2026-08-16.md).

## Backend boundary

The Express API is a development/reference contract, not the active frontend data source. It provides:

- Generic CRUD for all modeled collections
- GET/PUT singleton resources
- Whole-state `/api/sync`
- Workout, Forge and Health analytics mirrors
- Workout/Health CSV exports
- Security controls described in `docs/security/SECURITY.md`

It is in-memory, has no user accounts and must not be presented as a public multi-user API.

## Current build baseline

- Next.js 16.3.1 / React 19.2.8
- 39/39 user routes HTTP 200
- Five dynamic same-origin Entertainment API routes
- TypeScript clean
- ESLint clean
- Frontend/backend dependency audits: zero known vulnerabilities
- See [`guides/TESTING.md`](../guides/TESTING.md) for all gates.
