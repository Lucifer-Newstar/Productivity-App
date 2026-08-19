# Kaizen project continuity blueprint

**Purpose:** durable handoff from the project's beginning through current state to local release
**Current branch:** `ai`
**Current product direction:** local/offline, browser-authoritative, deterministic Intelligence, no cloud/model expansion
**Read this first if another assistant, maintainer or session must continue the work.**

## 1. Canonical source order

When sources disagree, use this order:

1. Current committed code on `ai`
2. Locked architecture decisions in `docs/architecture/DECISIONS.md`
3. AI Constitution, ADRs, contracts and `docs/ai/MASTER-SPECIFICATION.md`
4. `docs/ai/IMPLEMENTATION-LEDGER.md`
5. Current release audit/backlog reports
6. Current testing/configuration guides
7. Historical wave reports

Historical reports explain why decisions were made. They do not override current product state.

## 2. The project story

### Stage A — local productivity dashboard

Kaizen began as a browser-first productivity application with Home tasks, notes, focus, habits and calendar. React Context and localStorage became the authority because the product was single-user, offline-first and did not need account/cloud infrastructure.

### Stage B — full-screen product spaces

The application expanded into distinct full-screen operating spaces:

- Workout — training, routines, sessions, PRs, cardio, calisthenics and analytics
- Career — roadmaps, skills, courses, network, jobs, portfolio and daily workflow
- Forge / Projects — projects, tasks, decisions, risks, retrospectives and canvases
- Health / VITAL-SIGN — nutrition, hydration, sleep, physique, supplements, vitals, mind and reports
- Entertainment / AFTERGLOW — local media tracking, discovery, analytics, offline social logs and creation tools

Each space gained a unique visual system while continuing to share the root store, theme preference, navigation and notification infrastructure.

### Stage C — product hardening

Security and UX passes added:

- fixed same-origin provider routes;
- URL, image, CSV and restore validation;
- CSP separation;
- local notification rules/settings/setup;
- self-hosted fonts and Lucide iconography;
- structurally distinct Home themes;
- source commentary and documentation QA;
- storage quota warnings and per-space import/export.

The optional Express server expanded to mirror the domain model, but remained in-memory reference code. The frontend never began consuming it.

### Stage D — Intelligence architecture

The AI work intentionally started with architecture rather than “AI everywhere”:

```text
browser authority
  → versioned Domain Bridge
  → independent loopback engine
  → bounded read-only tools
  → source/freshness verification
```

KAC-1 established that application records and deterministic analytics outrank model inference. Health, writes, memory, remote processing and automation were frozen.

### Stage E — Wave 0 model evaluation

Wave 0 built a privacy-safe local-model harness and tested Qwen3, Gemma 3, Phi-4 Mini and a Qwen2.5 7B control. Every candidate failed frozen preflight requirements. Wave 0 closed with no model selected; gates were not weakened.

### Stage F — deterministic v0.1.1

AI-ADR-019 moved tool routing into trusted code:

```text
focus-today
  → deterministic route
  → get_today@1.0
  → validated core.today@1.0
  → interpretation boundary
```

The browser and engine gained pairing, authenticated SSE, cancellation, exact schemas, source verification, revisions and stale-state handling.

A narrower interpreter-model cycle retested Qwen3 and Phi without model tool authority. Both were rejected at preflight with `PROVIDER_HTTP_400` and resource-gate failure. No full or operations run occurred.

AI-ADR-020 then removed model providers from application composition. Deterministic Core Today became the authoritative application AI path. Historical llama.cpp code remains unreachable evaluation/protocol infrastructure.

### Stage G — whole-product truth audit

A later audit correctly separated “the AI chain works” from “the whole product is finished.” It proved:

- 39 user routes are implemented;
- most screens are functional and persisted;
- the frontend consumes zero Express data endpoints;
- Express is in-memory/reference-only;
- first-run production state contained fabricated personal history;
- calendar/habit correctness, CI, backup/recovery and release authority needed work.

The findings became an evidence-based P0/P1/P2 backlog.

### Stage H — completion and CI work

The application then gained:

- four-job GitHub CI with no model/GPU work;
- live deterministic frontend↔engine integration automation;
- timezone-safe local date keys;
- history-derived habit streaks;
- empty fresh user history with retained catalogs/templates;
- build-time-gated demo tools;
- browser-only v1 authority decision;
- non-loopback Express API-key hard fail;
- whole-product backup, rollback restore and corrupt-storage recovery;
- correct entered-total Wilks calculation;
- persisted focus-cycle totals;
- explicit session-only/downloadable Forge voice audio;
- route error/loading boundaries;
- Home URL/history navigation;
- trusted local profile at-rest risk decision.

## 3. Current application architecture

```text
Next.js application
  ├── App Router Home + server routes
  ├── Pages Router product spaces
  ├── React Context root store
  ├── eleven authoritative localStorage keys
  ├── deterministic analytics
  ├── Entertainment provider BFF routes
  └── fixed /api/ai proxy
          │
          ▼
Deterministic Intelligence Engine
  ├── loopback only
  ├── one-time pairing
  ├── hashed expiring session
  ├── focus-today router
  ├── one get_today@1.0 read
  ├── deterministic provider
  └── schema/source/freshness validation

Express reference API
  └── development/reference only; not packaged or consumed
```

There is no current model process, cloud backend, user account, AI memory, retrieval, Health AI or write automation.

## 4. Authoritative browser data

The whole-product backup contract covers:

```text
kaizen.tasks
kaizen.notes
kaizen.career
kaizen.workout
kaizen.forge
kaizen.health
kaizen.entertainment
kaizen.notifications
kaizen.habits
kaizen.focus
kaizen.theme
```

AI session tokens and provider session overrides are deliberately excluded.

Fresh production profiles contain no fabricated user history. Product catalogs/templates remain available:

- exercises and routines;
- roadmap templates;
- Health food/supplement references;
- calisthenics progression definitions.

Demo fixtures require `NEXT_PUBLIC_KAIZEN_DEMO_TOOLS=1` and are hidden/no-op otherwise.

## 5. Current screen map

```text
/                                  Home: Command, Tasks, Focus, Notes, Habits, Calendar
/career/*                          10 routes including redirect
/projects/*                        5 routes including project drilldown
/workout/*                         12 routes including redirect
/health/*                          10 routes
/entertainment                     1 full-screen multi-view application
```

Total user routes: 39.

Use `docs/reports/APPLICATION-GAP-AUDIT-2026-08-19.md` for per-screen functional/persistence details.

## 6. Current service boundaries

### Frontend

Depends on local persistence, Next.js Entertainment APIs and the fixed deterministic AI proxy. It does not call Express.

### Express

Implements 138 in-memory tables, 12 singletons, CRUD, sync and analytics mirrors. Data disappears on restart. ADR-012 excludes it from local v1 release authority. Non-loopback bind requires `KAIZEN_API_KEY`.

### Intelligence

Application configuration accepts deterministic provider only. Model settings fail closed. All historical model stages are authorization-closed.

## 7. Security boundaries

- Local OS account and trusted browser profile are the v1 at-rest boundary.
- Browser data is not encrypted; never claim otherwise.
- Store backups in encrypted user-controlled storage.
- Express is loopback by default and refuses unauthenticated network bind.
- AI is loopback, paired, session-bound and read-only.
- Provider credentials stay server-side or tab-session only.
- Imports/restores are untrusted and bounded.
- Production CSP has no `unsafe-eval`.

## 8. CI architecture

`.github/workflows/ci.yml` contains four CPU-only jobs:

1. Frontend application
2. Reference API
3. Deterministic Intelligence
4. Frontend to deterministic Core Today

CI never downloads/runs models, uses GPUs or exposes a personal laptop. The live integration script is `scripts/ci/core-today-integration.mjs`.

The workflow is implemented and locally reproduced. Hosted runs 1 and 2 exposed and closed stale Entertainment seed assertions plus deprecated action runtimes. Hosted run 3 (`32255861421`) passed all four jobs at `6a2c885`: Frontend application, Reference API, Deterministic Intelligence, and Frontend to deterministic Core Today. The hosted-CI gate is satisfied; create the `ai` → `main` PR and leave it unmerged for human review.

## 9. Current completion status

### Completed locally

- Whole-product audit/backlog
- CI implementation
- Deterministic integration automation
- First-run production data cleanup
- Local-date/calendar and habit correctness
- Browser-only authority ADR
- Express network-bind hardening
- Whole-product backup/recovery
- Demo-tool gating
- Wilks/focus/voice correctness
- Route recovery and Home history
- AI/model closure

### Still required before PR/merge

1. Commit and push the green-CI evidence and regenerated PR review.
2. Create `ai`→`main` PR from an authenticated GitHub session.
3. Human review; do not merge automatically.

The current release matrix and final local regression are complete.

### After merge only

1. Build local Windows packaging.
2. Verify clean install/update/uninstall behavior.
3. Verify offline operation.
4. Verify browser-data location and backup restore.
5. Verify loopback deterministic engine startup/pairing.
6. Produce release notes and local installation guide.
7. Release.

No cloud deployment is planned.

## 10. Deferred features

Deferred is not broken:

- Career advanced visualizations/planners/image uploads
- Forge advanced CPM/comparison/drag polish
- Health 63 post-v1.1 nice-to-haves
- Entertainment public sharing and complete deep-form translation
- PWA push/background notifications

See the completion backlog for IDs and decisions.

## 11. Prohibited work without new approval

- model provider or model evaluation;
- remote provider/cloud fallback;
- AI memory/retrieval/vector database;
- Health AI;
- AI writes/automation;
- v0.2 Intelligence;
- cloud deployment;
- MLOps/GPU CI/personal-laptop runner;
- wiring Express as production persistence without a new ADR.

## 12. Recovery procedure for a new assistant/session

Run before any change:

```bash
git switch ai
git pull --rebase
git status --short --branch
```

If remote configuration disappeared:

```bash
git remote add origin https://github.com/Lucifer-Newstar/Productivity-App.git
git fetch origin --prune
git branch --set-upstream-to=origin/ai ai
git pull --rebase
```

Restore executable modes from the index if the sandbox changed them. Never request GitHub credentials, `.env`, private backups, raw benchmark outputs, local paths or personal data.

Install dependencies only when missing:

```bash
cd frontend && npm ci
cd ../backend && npm ci
cd ../ai && npm ci
```

Read next:

1. `docs/reports/APPLICATION-COMPLETION-BACKLOG-2026-08-19.md`
2. `docs/ai/IMPLEMENTATION-LEDGER.md`
3. `docs/guides/CI.md`
4. `docs/guides/TESTING.md`
5. latest Git log

## 13. Required local gates

```bash
# Frontend
cd frontend
npx tsc --noEmit
npm run lint
npm run qa:core
npm run qa:baseline
npm run qa:backup
npm run qa:resilience
npm run qa:docs
npm run qa:comments
npm run build

# Backend
cd ../backend
npm run build
npm run security:startup
# start with test key, then npm run security:test

# Intelligence
cd ../ai
npm run typecheck
npm test
npm run qa:v0.1.1
npm run qa:v0.1.1:model-design
npm run qa:v0.1.1:model-harness
npm run build
```

Use the full matrix in `docs/guides/TESTING.md` before a PR or release.

## 14. Commit and documentation discipline

- Work in focused conventional commits.
- Do not create a branch per wave; continue on `ai` until the reviewed merge.
- Update source, tests and governing docs together.
- Update the implementation ledger at every material step.
- Run docs/comment/privacy/diff checks before each commit.
- Never weaken gates to make a result pass.
- Never infer missing evidence.

Use the repository-approved Git identity from the Delivery Playbook before committing; do not place credentials or private identity data in handoff notes.

## 15. Final definition of done

```text
hosted CI green
  → local full regression green
  → current release matrix approved
  → ai→main PR created
  → human review approved
  → merge
  → Windows/local packaging
  → clean/offline/backup verification
  → local release
```

If a step is not evidenced, it is not complete.