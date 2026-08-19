# Evidence-based application completion backlog

**Date:** 2026-08-19
**Source:** [`APPLICATION-GAP-AUDIT-2026-08-19.md`](APPLICATION-GAP-AUDIT-2026-08-19.md)
**Rule:** no AI capability expansion, model work, cloud deployment or MLOps

## Classification rules

| Category | Action |
|---|---|
| Broken | Fix |
| Incomplete | Implement or make an explicit release decision |
| Mock/placeholder | Replace, isolate behind explicit demo mode, or label accurately |
| Already complete | Protect with CI; do not redesign |
| AI-scope violation | Reject |
| Documentation drift | Correct against code/current release scope |
| Security issue | Fix or explicitly accept before release |
| Nice-to-have | Defer |

Priorities:

- **P0:** blocks CI/merge/release sequence
- **P1:** required before local production packaging/release
- **P2:** post-baseline improvement or explicitly accepted limitation

## P0 — merge/release blockers

| ID | Category | Evidence | Required action | Exit evidence |
|---|---|---|---|---|
| APP-001 | Incomplete | No `.github/workflows`; green results are local/manual | Add CI foundation for frontend, backend, AI, docs/privacy and deterministic integration; no model/GPU jobs | PR workflow green on clean runner |
| APP-002 | Mock/placeholder | Production first run seeds personal-looking tasks, notes, achievements, goals, Forge project, PRs and media | Separate immutable product catalogs/templates from user records; default user logs to empty or explicit onboarding sample workspace | Fresh profile contains no fabricated personal history; migrations preserve existing users |
| APP-003 | Broken | Calendar creates local dates then uses `toISOString()`, shifting days in positive-offset timezones such as IST | Introduce shared local-date utility and regression tests across Home/task/schedule date paths | IST and negative-offset calendar/task tests pass |
| APP-004 | Incomplete architecture | Frontend uses localStorage only; Express is unused/in-memory; release durability promise is undefined | Decide and document one release authority: browser-only with complete backup/recovery, or durable integrated backend. Do not wire the in-memory API as production persistence | Approved architecture decision plus executable durability test |
| APP-005 | Incomplete | No automated process test starts frontend + deterministic engine and exercises pairing/SSE/tool callback/source verification | Add a CI-safe deterministic integration runner; no model process | Integration job passes through fixed Next proxy on Ubuntu/Node 20 |
| APP-006 | Documentation drift | Current status is spread across historical wave tables with contradictory early ❌ and later ✅ rows | Create one current release matrix and label historical tables as evidence, not current backlog | Docs QA enforces current-state matrix links/status |

## P1 — required before local packaging/release

| ID | Category | Evidence | Required action | Exit evidence |
|---|---|---|---|---|
| APP-101 | Broken | Habit streak increments when today is checked, never decrements, and is not computed from consecutive history; seed streak/history conflict | Derive streak from history on every mutation/migration; add timezone-safe tests | Add/remove/past-day/consecutive/broken-streak tests pass |
| APP-102 | Mock/placeholder | Wilks uses `weight × 3` as “rough placeholder for demo” | Require real squat/bench/deadlift total or relabel/remove Wilks output; never present placeholder as measured metric | Formula tests and UI copy match actual inputs |
| APP-103 | Mock/placeholder | Career/Forge/Workout destructive demo seeding is visible in ordinary production UI | Gate behind explicit demo/developer mode, with clear destructive boundary; remove from standard navigation | Production build hides demo controls by default |
| APP-104 | Incomplete | Pomodoro sessions/minutes are component-memory only | Decide whether session history is product data; if yes persist/migrate, if no label as current-session only and fix paused Skip behavior | Reload/navigation behavior and tests match documented contract |
| APP-105 | Incomplete | Forge voice recordings use runtime Blob URLs and disappear on reload | Persist safely in an approved storage layer or label/export as session-only; revoke Blob URLs correctly | Reload/export lifecycle test |
| APP-106 | Fragile persistence | Corrupt localStorage is silently ignored; hydration/persist sequencing lacks direct regression coverage | Add schema-aware parse failure handling, recovery/export prompt and hydration tests that prove stored data is not clobbered | Corrupt/legacy/quota/hydration tests pass |
| APP-107 | Security issue | Express allows non-loopback bind without API key and only warns | Fail startup for non-loopback without key, or remove network bind from release config | Startup security test proves refusal |
| APP-108 | Security decision | Health/career/private records live unencrypted in browser localStorage | Explicitly accept for trusted-profile local release or implement encrypted packaged storage; make product copy/export threat model accurate | Signed release decision and packaging test |
| APP-109 | Incomplete | No whole-product backup proves all keys, habits, notifications and media restore together | Implement/version global export/restore with size/schema/security checks, or explicitly scope per-space backups | Round-trip fixture across every authoritative key |
| APP-110 | Incomplete UX | No custom top-level route error/loading boundary; provider setup fetch errors are swallowed | Add mature route/offline/recovery states and telemetry-safe diagnostics | Error/offline/empty interaction tests |
| APP-111 | Incomplete architecture | Express generic CRUD lacks domain schemas, transactions and durable persistence | If Express is included in release authority, add versioned schemas, durable DB, migrations, conflict strategy and tests; otherwise mark/exclude it as dev/reference | Decision from APP-004 implemented |
| APP-112 | Incomplete navigation | Home internal views do not update URL/history; browser Back cannot traverse sections | Synchronize `?view=` or choose documented single-page behavior | Deep-link/back/forward tests |
| APP-113 | Documentation drift | Health “sync” can be mistaken for server sync; backend source/docs had mixed production/reference language | Rename or clearly label profile/bridge lab; consistently mark Express as unused reference until integrated | UI/docs terminology QA |

## P2 — accepted/deferred product gaps

| ID | Category | Decision |
|---|---|---|
| APP-201 | Nice-to-have | Career drag ranking, global resources, force graph, decay coaching, deep links, focus blocks, image board and WLB aggregate remain deferred |
| APP-202 | Nice-to-have | Forge v1.2 backlog: advanced CPM, comparison, richer canvas dragging, stakeholder/network sync and polish |
| APP-203 | Nice-to-have | Health 63 post-v1.1 rows remain deferred; do not relabel as release blockers without scope approval |
| APP-204 | Nice-to-have | Entertainment public sharing/privacy and complete deep-form translation remain intentional partials |
| APP-205 | Nice-to-have | Closed-app push, badges, vibration and scheduled digests require PWA/service worker and remain deferred |
| APP-206 | Nice-to-have | Client-side Career/Workout redirect flash can be replaced with server redirect later |
| APP-207 | Nice-to-have | Provider-status setup fetch can gain retry/detail after baseline error handling exists |

## Already complete — protect, do not redesign

| ID | Area | Evidence |
|---|---|---|
| DONE-001 | 39 route implementations and navigation shells | Production build, route smoke and per-space QA |
| DONE-002 | Local CRUD and deterministic analytics across all spaces | Store actions and domain suites |
| DONE-003 | Entertainment optional provider adapters/security | 168 structural + 42 executable + 8 security tests |
| DONE-004 | Express reference API mechanics/security baseline | Build, runtime health, 13 security checks |
| DONE-005 | Deterministic Core Today chain | Live proxy/SSE flow, 24 AI tests, 15 frontend AI checks |
| DONE-006 | AI pairing/session/source/freshness boundaries | Gateway/adversarial/browser verification tests |
| DONE-007 | Model execution closure | AI-ADR-020, `I1-PREFLIGHT-CLOSURE-1`, deterministic-only registry |
| DONE-008 | CSP, URL, image, restore and CSV defenses | Security/CSP suites |
| DONE-009 | Current documentation/commentary integrity system | docs links/contracts and source-comment QA |

## AI-scope violations — reject

| Request | Decision |
|---|---|
| Re-enable llama/model provider | Rejected |
| Evaluate another model | Rejected |
| Career auto case-study via LLM | Rejected; manual fields remain |
| Memory, retrieval, vector database | Rejected |
| Health AI | Rejected |
| AI writes or automation | Rejected |
| Remote provider/cloud fallback | Rejected |
| MLOps/GPU CI/personal-laptop runner | Rejected |
| v0.2 capability work | Rejected |

## CI foundation specification — next phase

CI should run on ordinary hosted CPU infrastructure and never start rejected models.

```text
pull_request / push(ai, main)
  ├── frontend
  │    ├── npm ci
  │    ├── tsc + eslint
  │    ├── domain/security/AI/docs/comment QA
  │    └── production build
  ├── backend
  │    ├── npm ci + build
  │    ├── start loopback with test key
  │    └── 13 security checks
  ├── intelligence
  │    ├── npm ci + typecheck + 24 tests + build
  │    ├── deterministic v0.1.1 QA
  │    ├── closed model-harness QA (no model)
  │    └── privacy scan
  └── integration
       ├── start deterministic engine + frontend
       └── pair → fixed route → tool callback → verified response
```

CI must assert:

- model provider configuration fails;
- model-stage authorization remains closed;
- no GPU/model download or network model runtime occurs;
- no private/local result path is tracked;
- all authoritative route/persistence contracts remain synchronized.

## Recommended execution order

```text
1. APP-002 production data/onboarding truth
2. APP-003 calendar timezone correctness
3. APP-101 habit streak correctness
4. APP-004 storage/backend authority decision
5. APP-001 CI foundation
6. APP-005 deterministic integration CI
7. APP-107 backend exposure hard-fail
8. Remaining P1 persistence/error/backup work
9. Full regression + documentation release matrix
10. Re-review PR ai → main; do not merge before gates pass
```

## Current release gate

**BLOCKED.** The AI chain is complete, but application release/merge readiness is not established until the P0 decisions/fixes and CI foundation are complete. This backlog supersedes “green suites imply finished product” assumptions.