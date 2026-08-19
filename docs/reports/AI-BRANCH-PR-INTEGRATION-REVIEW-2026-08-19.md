# `ai` → `main` pre-merge application integration review

**Date:** 2026-08-19
**Base:** `origin/main` at `cc8155d265f8752e20c294f4a6fd51f36d5ea291`
**Head branch:** `ai`
**Merge performed:** no
**Review decision:** HOLD PR CREATION/MERGE — APPLICATION COMPLETION BACKLOG REQUIRED

## Executive summary

The Core Today integration review found no unresolved AI-chain blocker. Frontend, Express reference API and Intelligence Engine remain separate and correctly composed; deterministic Core Today is the only application AI provider.

The later whole-product gap audit established that this is not sufficient evidence for release or merge. Production seed data, calendar timezone correctness, storage/backend authority, absent CI and other P0/P1 items remain. This report now defers to [`APPLICATION-GAP-AUDIT-2026-08-19.md`](APPLICATION-GAP-AUDIT-2026-08-19.md) and [`APPLICATION-COMPLETION-BACKLOG-2026-08-19.md`](APPLICATION-COMPLETION-BACKLOG-2026-08-19.md).

## PR diff summary

```text
Commits from main: 58
Files changed: 236
Additions: 18905
Deletions: 253
Merge base: cc8155d265f8752e20c294f4a6fd51f36d5ea291
Merge topology: origin/main is an ancestor of ai; no conflict expected
```

Complete per-file status and line counts: [`AI-BRANCH-PR-CHANGED-FILES-2026-08-19.md`](AI-BRANCH-PR-CHANGED-FILES-2026-08-19.md).

## Reviewed system composition

```text
Browser-authoritative Next.js application
  ├── React Context + local persistence
  ├── deterministic Home intelligence
  ├── Core Today Domain Bridge
  └── fixed same-origin /api/ai proxy
          │
          ▼
Independent Intelligence Engine — loopback only
  ├── pairing + hashed expiring session
  ├── deterministic focus-today router
  ├── one get_today@1.0 browser read
  ├── exact Core Today validation
  ├── deterministic provider only
  └── schema/source/freshness response verification

Optional Express reference/sync API — separate service
  ├── in-memory domain mirror
  ├── service API-key auth
  └── never an AI source of truth
```

## End-to-end Core Today flow

1. Home creates one bounded `core.today@1.0` snapshot builder from current React state.
2. The browser sends only `{ intent: "focus-today", localDate }` to `/api/ai/v1/requests`.
3. The Next.js proxy validates same-host browser origin, pins loopback gateway URL and forwards only allowed headers.
4. The engine validates loopback socket, Host, Origin, rate/body limits and hashed session bearer token.
5. Trusted `routeCoreToday()` selects exactly `get_today@1.0` with `includeCompleted: false` and `maximumItems: 100`.
6. SSE emits one correlated tool request. The browser validates tool, version, arguments and expected contract before returning the snapshot.
7. The engine validates exact fields, revision domains, local date, five-minute freshness, 100-record cap, unique IDs, redactions and no extra-scope payload.
8. The deterministic provider receives no tool definitions or tool-role message and cannot request another read.
9. Response schema, supplied-source subset, deterministic precedence and empty-evidence uncertainty are enforced.
10. The browser independently verifies source/snapshot IDs and rejects revision/local-date drift before rendering.
11. No state mutation, Health state, notes, memory, retrieval, remote provider or background action occurs.

## Frontend review

| Area | Finding |
|---|---|
| State authority | React Context/local persistence remains authoritative; AI never owns state. |
| Request shape | Client sends fixed intent/date only; no generic prompt. |
| Tool execution | Exact `get_today@1.0` contract validated before snapshot submission. |
| Freshness | Snapshot ID and date are checked again before render. |
| Evidence | Response and rationale IDs must exist in supplied snapshot. |
| UI scope | “DETERMINISTIC · READ ONLY”; no model/remote/write path disclosed. |
| Proxy | Fixed loopback target, same-host check, header allowlist, 1 MB body cap. |
| Existing spaces | Production build and all Health/Entertainment/Home/UI/notification/security suites passed. |

## Backend and API review

### Express reference API

- Remains optional, loopback-first and in-memory.
- Does not become AI authority or participate in Core Today requests.
- Service API-key, CORS, body/rate/complexity limits and CSV protections passed 13 security checks.
- Existing 138 collection tables and 12 singleton documents remain documented and build-clean.

### Intelligence Engine API

| Boundary | Verified contract |
|---|---|
| Pairing | One-time code header → random expiring bearer token; engine stores token hash only. |
| Request | Exact intent/date, no extra fields. |
| SSE | Authenticated fetch, token never in URL. |
| Tool | One correlated `get_today@1.0`; stale/mismatched results rejected. |
| Response | Frozen recommendation schema plus source/freshness envelope. |
| Cancellation | Authenticated request ownership and abort propagation. |
| Metrics | Aggregate counts/timing/error codes only; no prompt/snapshot content. |

## Deterministic provider review

- `loadConfig()` defaults to deterministic `mock`.
- `KAIZEN_AI_PROVIDER=llama` fails startup.
- Every `KAIZEN_LLAMA_*` application variable fails startup.
- Application `ProviderRegistry` imports no llama adapter.
- Deterministic provider declares `nativeToolCalling: false`.
- Tool-bearing generation requests are rejected.
- Llama adapter remains isolated protocol-test/evaluation code; all model execution authorizations are closed.

## Authentication and session review

| Boundary | Result |
|---|---|
| Engine network bind | Literal loopback only |
| Browser origin/Host | Exact allowlist and host validation |
| Pairing | One-time, TTL-bound, rate-limited |
| Session token | Random, hashed engine-side, browser `sessionStorage` only |
| Session ownership | Request/tool-result/cancel scoped to derived session ID |
| Revocation/expiry | Verified |
| Express API auth | Separate service key; liveness-only bypass |
| Secrets in URL/log/model context | None |

## Contract and schema review

No unresolved mismatch was found among:

- frontend `TodaySnapshot`;
- engine `DomainSnapshot<TodayContextV1>`;
- `GET_TODAY_TOOL@1.0`;
- `DeterministicTodayRouteV1`;
- `TODAY_INTERPRETER_RESPONSE_SCHEMA`;
- SSE `EngineEvent` envelopes;
- frontend `AiResponse` verification;
- documented API request/response boundaries.

## Stale assumption review

| Finding | Resolution |
|---|---|
| Application defaulted to llama unless env forced mock | Fixed by AI-ADR-020; deterministic is default/only provider. |
| Registry retained live llama branch | Removed from application registry. |
| Legacy llama variables documented as supported | Replaced with explicit fail-closed guidance. |
| Deterministic provider advertised native tools | Set false; tool-bearing requests rejected. |
| Home implied model interpreter | Reworded to deterministic/read-only/no-model. |
| Testing guide called final Wave 0 report incomplete | Corrected to closed historical cycle. |

## Scope and security regression review

Verified absent/unavailable:

- generic chat;
- additional AI tools or domains;
- Health payload or consent activation;
- notes content;
- memory/retrieval/vector store;
- writes/proposals/automation;
- remote provider/fallback;
- model selection or application model environment;
- raw private evaluation artifacts.

Production CSP remains free of `unsafe-eval`; external URLs, restored images, CSV and provider routes retain existing validation.

## Validation matrix

| Suite | Result |
|---|---|
| AI TypeScript | PASS |
| AI tests | 24/24 PASS |
| AI build | PASS |
| I1 design QA | 16/16 PASS |
| I1 harness QA | 18/18 PASS |
| Default-config live AI proxy/SSE flow | PASS |
| Model-provider startup rejection | PASS |
| Frontend TypeScript | PASS |
| Frontend ESLint | PASS |
| Frontend production build | PASS — 42 generated routes |
| Frontend AI QA | 15/15 PASS |
| Health QA | PASS — 458 assertions |
| Entertainment structural | 168/168 PASS |
| Entertainment executable suites | 42/42 PASS |
| Frontend security | 8/8 PASS |
| CSP QA | 6/6 PASS |
| Notifications | 16/16 PASS |
| UI foundation | 23/23 PASS |
| Home intelligence | 10/10 PASS |
| Backend TypeScript build | PASS |
| Backend security smoke | 13/13 PASS |
| Documentation QA | 56/56 PASS |
| Source commentary QA | 268/268 PASS |
| Staged privacy scan | PASS |
| Git diff check | PASS |
| Main ancestry / merge conflict precheck | PASS |

## Product-level constraints found after AI review

- Browser persistence is local and unencrypted; release risk acceptance is unresolved.
- Express is unused, in-memory reference code rather than durable application persistence.
- Production first-run state contains mock personal history.
- Calendar and habit correctness gaps require fixes.
- No CI or automated whole-chain integration job exists.
- Historical model adapters/harnesses remain application-unreachable and authorization-closed.

See the current completion backlog for priority and exit evidence.

## PR creation status

No open `ai`→`main` PR existed when checked through the public GitHub API. This workspace also has no authenticated GitHub tooling. More importantly, the product gap audit now blocks PR creation under the approved sequence.

The future comparison URL remains:

```text
https://github.com/Lucifer-Newstar/Productivity-App/compare/main...ai?expand=1
```

Do not open or merge it until the P0 backlog and CI foundation pass.

## PR recommendation

**HOLD.** Complete the product-truth backlog, add CI and rerun the full release gate. Then regenerate this diff/review and create the PR for human review.

### Proposed PR title

```text
feat(ai): integrate deterministic Core Today intelligence baseline
```

### Proposed PR body

```text
- integrates read-only deterministic Core Today through the independent engine
- adds secure pairing/session/SSE and fixed same-origin proxy
- validates bounded browser snapshots, sources, revisions and freshness
- closes Wave 0 and interpreter-model evaluation with no model selected
- locks application provider composition to deterministic and rejects model settings
- preserves all existing frontend/backend flows and security gates

No new domains, memory, Health AI, writes, automation, remote provider or v0.2 capability.
```
