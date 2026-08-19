# Kaizen documentation

_Last synchronized on 2026-08-18 from the persistent `ai` branch._

Kaizen is a local-first productivity and life OS built as one Next.js application with five dedicated spaces. The frontend uses React Context state slices persisted under separate browser-storage keys; the Express service is an optional in-memory reference/sync API and is not required for normal frontend use.

## Product status

| Space | Routes | Shell | Current status |
|---|---|---|---|
| Home | `/` | App Router + SideNav | Dashboard, tasks, notes, habits, Pomodoro and calendar |
| Workout | `/workout/*` | Full-screen imperial training OS | Shipped; 12 routes |
| Projects / Forge | `/projects/*` | Full-screen Foundry/Drafting Room | v1.0 shipped; 5 routes, 31 Smelter tabs |
| Career | `/career/*` | Full-screen Night HUD/Blueprint | Shipped; 10 routes including redirect |
| Health / VITAL-SIGN | `/health/*` | Full-screen medical OS | v1.1 shipped; 10 routes; detailed audit maintained in space docs |
| Entertainment / AFTERGLOW | `/entertainment` | Full-screen cinema OS | v1.0 Waves 0–9 shipped; detailed audit maintained in space docs |

A global local-first NotificationCenter is mounted across Home and every full-screen space, with section/category controls and an initial high-value rule catalog.

**Kaizen Intelligence v0.1** now provides a provider-neutral local engine, paired loopback gateway, read-only `get_today@1.0` Domain Bridge and source-linked Home Intelligence panel. No permanent model/vector backend, Health context, memory or write tool is selected. See [`ai/README.md`](ai/README.md).

Current production verification: **39/39 user routes return HTTP 200**, five Entertainment provider routes plus the fixed AI proxy are dynamic, all user pages remain statically prerendered, TypeScript and ESLint pass, and dependency audits are clean.

## Documentation map

### Core reference

| Document | Purpose |
|---|---|
| [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | Routers, providers, shells, state, rendering and system boundaries |
| [`architecture/DATA-MODEL.md`](architecture/DATA-MODEL.md) | State slices, major entities, relationships and migrations |
| [`reference/API.md`](reference/API.md) | Express resources, fixed provider routes and Intelligence Engine gateway |
| [`reference/FEATURES.md`](reference/FEATURES.md) | Cross-space feature audit and links to detailed specifications |
| [`reference/ALGORITHMS.md`](reference/ALGORITHMS.md) | Workout, Forge and Health formulas |
| [`security/SECURITY.md`](security/SECURITY.md) | Threat model, secure deployment and verification commands |
| [`security/AUDIT-2026-08-16.md`](security/AUDIT-2026-08-16.md) | Latest full-site audit, remediations and residual risks |
| [`reports/DOCS-SYNC-2026-08-16.md`](reports/DOCS-SYNC-2026-08-16.md) | Source-vs-doc verification and corrections |
| [`reports/CLEANUP-2026-08-17.md`](reports/CLEANUP-2026-08-17.md) | Dead-code removal and documentation reorganization |
| [`reports/UI-REFRESH-2026-08-17.md`](reports/UI-REFRESH-2026-08-17.md) | Icon, typography, theme and motion foundation |
| [`reports/HOME-COMMAND-CENTER-2026-08-17.md`](reports/HOME-COMMAND-CENTER-2026-08-17.md) | Cross-space home intelligence redesign |
| [`reports/AI-ARCHITECTURE-GATE-2026-08-17.md`](reports/AI-ARCHITECTURE-GATE-2026-08-17.md) | Intelligence Engine architecture package and review boundary |
| [`reports/AI-V0.1.1-ARCHITECTURE-2026-08-19.md`](reports/AI-V0.1.1-ARCHITECTURE-2026-08-19.md) | Deterministic Core Today routing contracts, gates and synthetic tests |
| [`reports/AI-V0.1.1-IMPLEMENTATION-2026-08-19.md`](reports/AI-V0.1.1-IMPLEMENTATION-2026-08-19.md) | Trusted router, zero-tool runtime, security tests and deterministic/mock evaluation |
| [`reports/AI-V0.1.1-ACCEPTANCE-AND-MODEL-EVAL-DESIGN-2026-08-19.md`](reports/AI-V0.1.1-ACCEPTANCE-AND-MODEL-EVAL-DESIGN-2026-08-19.md) | Live acceptance and frozen interpreter-model evaluation design |
| [`reports/AI-V0.1.1-MODEL-HARNESS-2026-08-19.md`](reports/AI-V0.1.1-MODEL-HARNESS-2026-08-19.md) | Frozen corpus, disabled production-path runner and privacy-safe scoring harness |
| [`reports/AI-V0.1.1-PREFLIGHT-AUTHORIZATION-2026-08-19.md`](reports/AI-V0.1.1-PREFLIGHT-AUTHORIZATION-2026-08-19.md) | Preflight-only target authorization and hard full/operations block |
| [`notifications/README.md`](notifications/README.md) | Global inbox, rule catalog, settings and scope decisions |

### Kaizen Intelligence Engine

- [`ai/MASTER-SPECIFICATION.md`](ai/MASTER-SPECIFICATION.md) — canonical product, architecture, privacy, MLOps and phase specification.
- [`ai/DELIVERY-PLAYBOOK.md`](ai/DELIVERY-PLAYBOOK.md) — mandatory start/scope/test/privacy/documentation/commit procedure.
- [`ai/IMPLEMENTATION-LEDGER.md`](ai/IMPLEMENTATION-LEDGER.md) — living completed/pending/blocker/next-step status.
- [`ai/README.md`](ai/README.md) — architecture and implementation index.
- [`ai/CONSTITUTION.md`](ai/CONSTITUTION.md) — versioned behavioral and authority rules.
- [`ai/ARCHITECTURE.md`](ai/ARCHITECTURE.md) — independent engine and client-mediated Domain Bridge boundary.
- [`ai/DECISION-REGISTER.md`](ai/DECISION-REGISTER.md) — locked, proposed, spike-required and deferred decisions.
- [`ai/OPEN-QUESTIONS.md`](ai/OPEN-QUESTIONS.md) — unresolved choices that must not be guessed.
- [`ai/ROADMAP.md`](ai/ROADMAP.md) — documentation gate through v1.0 acceptance criteria.

Wave 0 is complete with no passing local model selected. The v0.1 provider-neutral read-only foundation remains deterministic/mock-backed pending an explicit next-scope review.

### Design

- [`design/THEME-SYSTEMS.md`](design/THEME-SYSTEMS.md) — distinct light/dark visual identities.
- [`design/ICONOGRAPHY.md`](design/ICONOGRAPHY.md) — icon mapping and emoji policy.
- [`design/MOTION.md`](design/MOTION.md) — route and interaction motion.

### Guides

- [`guides/LOCAL-DEVELOPMENT.md`](guides/LOCAL-DEVELOPMENT.md) — install, run and troubleshoot.
- [`guides/CONFIGURATION.md`](guides/CONFIGURATION.md) — environment variables and provider credentials.
- [`guides/DEPLOYMENT.md`](guides/DEPLOYMENT.md) — production topology and security requirements.
- [`guides/DATA-BACKUP-RESTORE.md`](guides/DATA-BACKUP-RESTORE.md) — browser data, exports and recovery.
- [`guides/TESTING.md`](guides/TESTING.md) — every automated and runtime QA gate.
- [`guides/CONTRIBUTING.md`](guides/CONTRIBUTING.md) — branches, commits, migrations and review expectations.

### Architecture notes

- [`architecture/DECISIONS.md`](architecture/DECISIONS.md) — key architectural decisions and trade-offs.
- [`architecture/SYNC-CONTRACT.md`](architecture/SYNC-CONTRACT.md) — frontend slices ↔ Express tables/singletons.

### Reference indexes

- [`reference/ROUTES.md`](reference/ROUTES.md) — user and API route inventory.
- [`reference/PERSISTENCE-KEYS.md`](reference/PERSISTENCE-KEYS.md) — local/session storage ownership.
- [`reference/GLOSSARY.md`](reference/GLOSSARY.md) — Kaizen product names and internal terminology.

### Per-space documentation

| Space | Documentation |
|---|---|
| Home | [`spaces/home/README.md`](spaces/home/README.md), [`QA.md`](spaces/home/QA.md) |
| Workout | [`spaces/workout/README.md`](spaces/workout/README.md), [`QA.md`](spaces/workout/QA.md) |
| Projects / Forge | [`spaces/projects/README.md`](spaces/projects/README.md), [`CANVASES.md`](spaces/projects/CANVASES.md), [`QA.md`](spaces/projects/QA.md) |
| Career | [`spaces/career/README.md`](spaces/career/README.md), [`QA.md`](spaces/career/QA.md) |
| Health | [`spaces/health/README.md`](spaces/health/README.md), [`FEATURES.md`](spaces/health/FEATURES.md), [`WAVES.md`](spaces/health/WAVES.md), [`QA.md`](spaces/health/QA.md) |
| Entertainment | [`spaces/entertainment/README.md`](spaces/entertainment/README.md), [`APIS.md`](spaces/entertainment/APIS.md), [`DATA-MODEL.md`](spaces/entertainment/DATA-MODEL.md), [`FEATURES.md`](spaces/entertainment/FEATURES.md), [`WAVES.md`](spaces/entertainment/WAVES.md), [`QA.md`](spaces/entertainment/QA.md) |

### Quality history

- [`quality/qa/README.md`](quality/qa/README.md) — current QA index.
- [`quality/qa/TEST-REPORT.md`](quality/qa/TEST-REPORT.md) — historical pre-Entertainment baseline.
- [`quality/bugs/BUGS.md`](quality/bugs/BUGS.md) — chronological root-cause/fix record; historical counts remain intentionally unchanged.

## Quick verification

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run lint
npm run qa:entertainment
npm run qa:entertainment:intelligence
npm run qa:entertainment:reports
npm run qa:entertainment:social
npm run qa:entertainment:migration
npm run qa:security
npm run qa:ai
npm run qa:comments
npm run qa:docs
node scripts/qa-health.js
npm run build

cd ../ai
npm ci
npm run typecheck
npm test
npm run build

cd ../backend
npm ci
npm run build
KAIZEN_API_KEY=security-test-key npm start
# second terminal
KAIZEN_API_KEY=security-test-key npm run security:test
```

## Git and documentation workflow

- `main` remains the stable product baseline.
- Intelligence work continues on the persistent `ai` branch; do not create a branch per wave.
- Start every step with `git pull --rebase`.
- End every step by updating the governing docs and `ai/IMPLEMENTATION-LEDGER.md`, running documentation QA and creating focused commits.
- Configure repository-owner identity outside tracked files.

See [`ai/DELIVERY-PLAYBOOK.md`](ai/DELIVERY-PLAYBOOK.md) and [`guides/CONTRIBUTING.md`](guides/CONTRIBUTING.md).
