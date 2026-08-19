# Application gap audit

**Date:** 2026-08-19
**Scope:** `frontend/`, `backend/`, `ai/`, `docs/`
**Purpose:** establish current product truth before CI, completion work or merge
**AI scope expansion:** none

## Executive conclusion

Kaizen is a large, working local-first browser application—not a collection of static mockups. All 39 user routes build, the five product spaces have functional state mutations and deterministic analytics, and the Core Today AI chain passes end to end.

It is not release-complete.

The frontend is almost entirely browser-authoritative and does not consume the Express reference API. The Express service is real executable CRUD/analytics code but in-memory, optional and non-durable. First-run production state contains extensive demo/personal-looking seed records. Several concrete correctness and release gaps remain, including calendar timezone handling, habit streak semantics, an approximate Wilks calculation presented as a metric, no CI, no automated whole-chain integration job, and unresolved product architecture around durable storage/sync.

The earlier AI integration review remains valid for Core Today. It did not establish completion of every non-AI feature.

## Evidence reviewed

- 39 frontend user routes and six Home views
- 91 maintained frontend component/modules
- React Context store and every persisted key/migration
- all frontend `fetch()` call sites
- Express route registration, handlers, security middleware and runtime health count
- Intelligence contracts, proxy, pairing/session, deterministic provider and browser bridge
- per-space feature audits and QA documents
- full frontend, backend and AI builds/tests/security suites
- live frontend→proxy→engine→browser-tool→response flow

## Frontend route and screen inventory

### Home — `/`

Home is one App Router page with six stateful views selected inside `AppShell`.

| View | Functional status | Persistence / source | Important gaps |
|---|---|---|---|
| Command Center | Functional derived dashboard across every store slice; links to all spaces; deterministic Next Action and AI panel | React Context + `kaizen.*` local state | Seeded personal-looking records make first-run analytics look real; Home view navigation does not update browser history |
| Tasks | Functional add/edit/toggle/delete/filter queue | `kaizen.tasks` | Starts with ten demo tasks instead of an empty/onboarding state |
| Focus Chamber | Functional 25/5/15 timer, sound and cycle switching | Component memory only | Sessions/minutes disappear on navigation/reload; Skip while paused can leave a zero timer without advancing |
| Notes | Functional add/edit/search/pin/delete | `kaizen.notes` | Starts with three demo notes |
| Habits | Functional CRUD and seven-day marks | separate `kaizen.habits` localStorage | Streak is not derived from history; unchecking today does not decrement; seed streaks conflict with empty histories |
| Commitment Map | Functional month navigation and task agenda | derives from `kaizen.tasks` | Uses UTC `toISOString()` for local calendar cells; positive-offset timezones can map a day to the previous date |

Home also includes notifications, setup guidance, storage-error banner, mobile navigation and theme handling.

### Career — 10 routes

| Route | Screen | Status |
|---|---|---|
| `/career` | Client redirect to Projects Hub | Functional; brief client-side landing flash |
| `/career/projects` | Cross-module mission-control hub | Functional derived screen |
| `/career/roadmaps` | Templates, phases, milestones, resources, labs, hours | Functional; drag-rank is button-based, global resource library absent |
| `/career/skills` | Skills, confidence, interest, decay and radar | Functional; force graph, recommendation copy and deep cert/project links incomplete |
| `/career/certs` | Courses/certifications/expiry tracking | Functional |
| `/career/network` | Contacts, interactions, referrals, follow-ups and graph | Functional |
| `/career/jobs` | Application kanban, dossiers, interviews, offers | Functional |
| `/career/portfolio` | Achievements, projects, bullets, ATS scan, resume snapshots | Functional; auto case study rejected as AI scope, image upload absent |
| `/career/daily` | Standup, focus, meetings, allocation, mood/stress | Functional; no agenda time-block planner |
| `/career/command` | Timeline, burnout, sabbatical, retirement, side work, IP/speaking | Functional; vision is text-only and WLB has no single aggregate |

Career persists under `kaizen.career`. Five roadmap templates and multiple personal-looking achievements/goals/bullets are automatically seeded. A destructive “SEED DEMO” tool is visible in ordinary UI.

### Forge / Projects — 5 routes

| Route | Screen | Status |
|---|---|---|
| `/projects` | Foundry dashboard, templates, calendar, velocity, resources and reviews | Functional |
| `/projects/p/[id]` | Full project drilldown, risks, crew, tasks, ops and postmortem | Functional; safe missing-project fallback |
| `/projects/quarry` | Kanban/swimlane/Eisenhower/effort task system | Functional |
| `/projects/smelter` | Brainstorms, retros, sprints and 31 canvas tabs | Functional; some interactions remain MVP-level |
| `/projects/vault` | Shipped/dead/cold archive, backup and CSV I/O | Functional |

Forge persists under `kaizen.forge`. It automatically starts with a personal-looking “Forge OS” project and also exposes demo seeding. Voice recordings use runtime Blob URLs (`window.__forgeVoice`) and are not durable across reload.

### Workout — 12 routes

| Route | Screen | Status |
|---|---|---|
| `/workout` | Client redirect to overview | Functional redirect |
| `/workout/overview` | Readiness, weekly state and active-session launch | Functional |
| `/workout/gym` | Strength calculator, warmups, metrics and history | Functional except Wilks uses `weight × 3` as an explicit rough placeholder |
| `/workout/calisthenics` | Chains, skills, GtG, isometrics, flows and mobility | Functional |
| `/workout/cardio` | Cardio logging and zones | Functional |
| `/workout/charts` | Derived history/analytics | Functional derived screen |
| `/workout/kanban` | Workout planning board | Functional |
| `/workout/library` | Exercise library CRUD | Functional |
| `/workout/prs` | PR logging/history | Functional |
| `/workout/schedule` | Routine schedule | Functional |
| `/workout/skills` | Skill progression | Functional |
| `/workout/tools` | Settings, exports, goals, programs and demo tools | Functional |

Workout persists under `kaizen.workout`. Curated exercises/routines are legitimate product templates, but seeded PRs/skills/board items and production-visible “Load demo data” controls are demo state, not user evidence.

### Health / VITAL-SIGN — 10 routes

| Route | Screen | Status |
|---|---|---|
| `/health` | Triage/global dashboard | Functional derived screen |
| `/health/nutrition` | Meals, macros, recipes, planner and restaurant mode | Functional |
| `/health/hydration` | Beverage/hydration logging | Functional |
| `/health/sleep` | Sleep, routines, circadian, naps and dream journal | Functional |
| `/health/physique` | Measurements, body composition, photos and correlation | Functional |
| `/health/supplements` | Supplement definitions/logs and deficiency awareness | Functional |
| `/health/vitals` | Vitals, symptoms, illness, injury, medications and allergies | Functional |
| `/health/mind` | Mood/stress/journal and burnout | Functional |
| `/health/sync` | Profile, settings and bridge controls | Functional; despite its name, it is not Express/server sync |
| `/health/reports` | Local reports, heatmaps and export | Functional derived/export screen |

Health persists under `kaizen.health`. Logs start empty, while food/supplement/reference catalogs and routines are templates. The accepted v1.1 scope is 216 complete, 2 partial and 63 explicitly deferred items. Health data is stored unencrypted in browser localStorage; this is disclosed but requires release-level risk acceptance.

### Entertainment / AFTERGLOW — 1 route plus 5 API routes

`/entertainment` is a full application with library, discovery, organization, intelligence, stats, offline social logs and studio tools. It is functional and persists under `kaizen.entertainment`.

- 94/96 approved features are complete.
- Public sharing/privacy mode and full deep-form translation are intentional partials.
- Manual mode works without providers.
- Optional provider search/trending/details use real same-origin Next.js routes.
- The initial library is seeded with demo media records.
- “Social” is an offline personal log, not a live network service.

### Navigation and cross-space flows

- All 39 user routes build and render.
- Every full-screen shell has notification access and Home links.
- Home links to every space; Forge→Career portfolio bridge and Workout↔Health derived bridges are implemented.
- Career and Workout root redirects are client-side, causing a harmless intermediate render.
- Home section navigation is component state; it supports `?view=` on load but does not update URL/history when the user switches sections.
- No broken route was found by build/smoke/structural QA.

## Frontend persistence truth

### Durable browser keys

| Key | Data |
|---|---|
| `kaizen.tasks` | Core tasks |
| `kaizen.notes` | Notes |
| `kaizen.career` | Entire Career state |
| `kaizen.workout` | Entire Workout state |
| `kaizen.forge` | Entire Forge state |
| `kaizen.health` | Entire Health state |
| `kaizen.entertainment` | Entire Entertainment state |
| `kaizen.notifications` | Notifications/settings/setup |
| `kaizen.habits` | Home habits, outside the root store |
| `kaizen.theme` | Theme preference |
| `kaizen.ai.bridge-revisions` / writer metadata | Domain revision tracking |

AI session credentials and provider overrides use `sessionStorage`. Pomodoro cycles and Forge Blob voice media are transient.

There is no IndexedDB, SQLite, filesystem database or automatic server persistence in the frontend.

### Seed/static classification

**Product reference content — keep:** exercise library, roadmap templates, health food database, supplement definitions, routine templates and deterministic formulas.

**Mock/personal-looking state — replace or explicitly isolate:** initial tasks, notes, career achievements/goals/resume bullets, Forge project, Workout PRs/skills/board, Entertainment library items and all optional demo generators.

The Data Setup assistant correctly refuses to treat seeds as confirmed user data, but seeds still populate dashboards and can be mistaken for real history.

## Frontend network dependency truth

Runtime browser code consumes:

1. `/api/ai/*` — fixed proxy to the local deterministic Intelligence Engine.
2. `/api/entertainment/providers`
3. `/api/entertainment/search`
4. `/api/entertainment/trending`
5. `/api/entertainment/details`
6. `/api/entertainment/image`

It consumes **zero** Express endpoints on port 4000. There is no frontend `/api/sync` client and no CRUD call to `/api/core`, `/api/forge`, `/api/career`, `/api/workout` or `/api/health`.

## Frontend state completeness

### Present

- Local CRUD/derived empty states across all spaces
- AI pairing/busy/cancel/error/response states
- Entertainment provider loading/error/empty/manual fallback
- Storage quota banner
- Safe missing-project fallback
- Setup checklist for distinguishing real user data from seeds
- Offline operation for all core local features

### Incomplete or fragile

- No application-level custom error boundary or loading shell for route failures
- Corrupt localStorage JSON is silently ignored; no recovery/export prompt
- Rich seeds hide true first-run empty states
- Focus timer and voice Blob media are not persistent
- Notification provider-status fetch failures are swallowed
- No automated browser E2E test of localStorage hydration/navigation/editing
- No global product backup that proves every local key can be restored together

## Backend audit

### Express reference API

The Express server is real executable code, not a visual placeholder:

- 138 in-memory collection tables
- 12 singleton documents
- generic list/create/get/patch/delete handlers
- singleton get/put
- specialized workout sessions, analytics and CSV
- Health analytics/export
- Forge summary
- full-state `/api/sync`
- liveness endpoints

Runtime health confirmed `tables: 138`, `singletons: 12`. Build and 13 security checks passed.

### Reference/in-memory limitations

- All state disappears on process restart.
- The frontend does not call it.
- Authentication is one optional service-wide key, not user/session identity.
- A non-loopback bind without a key logs a warning instead of refusing startup.
- Validation is structural/security-oriented, not full domain schema validation.
- Generic PATCH accepts arbitrary fields.
- `/api/sync` replaces supplied tables and silently skips malformed rows; no transaction/version/conflict contract.
- No database migrations, backups, encryption, concurrency control or multi-user authorization.

The API is a reference and local experiment surface. It must not be described as production persistence.

### CRUD completeness

Generic CRUD is mechanically complete for registered tables. Specialized routes compile and smoke-test. “Complete CRUD” does not mean production-ready domain semantics because cross-entity integrity and versioned schema validation are absent.

No obviously dead registered route was found. From the current frontend's perspective, every Express data route is unused.

## Authentication/session boundaries

| Component | Boundary |
|---|---|
| Browser product | Single local browser profile; no user login |
| Browser persistence | Unencrypted localStorage |
| Express API | Optional service-level API key; liveness bypass only when configured |
| AI engine | Loopback, exact Host/Origin, one-time pairing, hashed expiring session token |
| AI browser token | `sessionStorage` only; never URL/localStorage |
| Entertainment providers | Server environment keys or tab-session header overrides |

AI pairing/session design is complete for the current local scope. Product/user authentication and durable encrypted storage do not exist.

## End-to-end integration chain

```text
Browser React state/localStorage
  → deterministic Home analytics
  → TodaySnapshot builder + revision tracker
  → fixed same-origin Next.js proxy
  → paired loopback Intelligence Engine
  → trusted focus-today router
  → one get_today@1.0 browser callback
  → exact/fresh/bounded snapshot validation
  → deterministic provider
  → response/source/precedence validation
  → browser source + revision re-verification
  → Home render
```

This chain was exercised live and is correctly connected. The Express server is intentionally not in this chain. Documentation or diagrams that show `frontend → Express → AI` as current behavior are incorrect.

## Security review

### Passing controls

- Frontend URL/image/CSV/restore/request guards
- Production CSP separation
- Express auth/CORS/rate/body/depth/unsafe-key/ID/CSV controls
- AI loopback/origin/host/rate/body/pairing/session/source/freshness controls
- Deterministic-only application provider
- No model, remote provider, AI write or Health AI path

### Release decisions still required

1. Whether unencrypted browser storage is acceptable for Health/career data in the packaged local product.
2. Whether Express is excluded from release, remains reference-only, or must become durable and integrated.
3. Whether network bind without `KAIZEN_API_KEY` should hard-fail instead of warn.
4. What global backup/restore and corruption recovery guarantee the release promises.

## Documentation audit

Current product-state docs are generally strong, but several ambiguities/drifts were confirmed:

- Master Specification mixed the current deterministic runtime with a future llama.cpp architecture diagram; corrected in this audit.
- `docs/reference/FEATURES.md` contains earlier ❌ rows later superseded by Forge wave tables, making current status hard to read.
- Some docs say backend CRUD is present while others mark it ❌; the accurate statement is “server routes exist, frontend integration does not.”
- Backend source header claimed no auth/validation despite optional auth and structural validation; corrected.
- Historical Wave/model evidence is correctly retained, but must stay clearly separated from current product state.
- Several per-space audit dates and “ships on main” statements are historical and should not drive current release claims.

## Post-audit corrections

- APP-003 local-calendar handling is fixed and covered by `qa:core`.
- APP-101 habit streak semantics are fixed and covered by `qa:core`.
- APP-002 automatic personal-looking seed history is removed; catalogs/templates remain and demo tools are production-gated.
- APP-004/107 browser-only authority and reference API bind security are resolved.
- APP-102/104/105 placeholder/transient-state gaps are resolved.
- APP-106/109 whole-product backup and corrupt-storage recovery are implemented.
- APP-108/110/112/113 security scope, route recovery, Home history and terminology are resolved.
- CI and the deterministic live integration job are implemented; first hosted proof remains pending.

The remaining backlog, rather than the original finding text, is authoritative for current status.

## Audit validation

The audit was performed against source/runtime evidence and the same full green baseline recorded by the pre-merge review: frontend TypeScript/ESLint/build, 458 Health assertions, 168 Entertainment structural checks, 42 Entertainment executable checks, security/CSP/notification/UI/Home/AI suites, backend build plus 13 security checks, AI 24 tests plus closed harness QA, live Core Today flow, 59 documentation checks and 268 commentary checks.

Green regression suites establish that existing implemented behavior still works. They do not negate the product gaps classified below.

## Audit decision

- Core Today deterministic integration: **complete**
- Non-AI route implementation: **substantial and functional**
- Frontend→Express integration: **not implemented**
- Durable backend persistence: **not implemented**
- Production first-run/onboarding data truth: **not acceptable yet**
- CI: **not implemented**
- Release readiness: **blocked by the prioritized completion backlog**

Proceed to the evidence-based backlog and CI foundation. Do not merge `ai` into `main` solely because the AI chain is green.