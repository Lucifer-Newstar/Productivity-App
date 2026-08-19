# AI v0.1.1 deterministic Core Today implementation report

**Date:** 2026-08-19
**Branch:** `ai`
**Decision:** AI-ADR-019
**Scope:** read-only Core Today deterministic routing and zero-tool interpretation

## Outcome

The v0.1.1 production path is implemented for the deterministic/mock provider and frozen for integration review.

```text
fixed focus-today request
  → trusted routeCoreToday
  → get_today@1.0 through authenticated Domain Bridge
  → exact, bounded, fresh core.today@1.0 validation
  → provider request with no tools and no tool-role message
  → interpreter schema/source/precedence/uncertainty validation
  → browser source/snapshot/revision verification
  → render or fail closed
```

No local or remote language model was selected. Wave 0 remains closed and `W0-GATE-2` is unchanged.

## Runtime implementation

### Trusted router

`ai/src/runtime/deterministicRouter.ts`:

- accepts only `focus-today`;
- requires a trusted `YYYY-MM-DD` browser date;
- checks Core and `get_today` session permissions;
- constructs the frozen `DeterministicTodayRouteV1`;
- fixes `includeCompleted: false` and `maximumItems: 100`;
- schema-validates its own route before execution.

The gateway accepts only `{ intent, localDate }`. Generic prompts, unknown intents and extra request fields fail before request creation.

### Evidence boundary

`ai/src/runtime/orchestrator.ts` now selects the tool itself. It validates:

- exact `core.today@1.0`, Core, personal and Kaizen-derived envelope;
- top-level/data/record/analytics/redaction/revision allowlists;
- current local date and a five-minute capture-age bound;
- no future capture beyond bounded clock skew;
- at most 100 projected task/scheduled/attention records;
- bounded IDs, labels, fields and deterministic provenance;
- no nested extra-scope properties or unexpected revision domains.

The browser adapter now emits at most 50 tasks, 25 scheduled items and 25 attention items.

### Interpreter boundary

The provider receives one system policy and one serialized interpreter envelope. The generation request omits `tools`; no `tool` role message is used. Any provider tool-call chunk fails with `MODEL_TOOL_CALL`.

The response must:

- match `TODAY_INTERPRETER_RESPONSE_SCHEMA` with no additional properties;
- cite only supplied source IDs;
- include every rationale source in the verified response source set;
- cite factual/deterministic claims;
- preserve the deterministic Next Action when present;
- disclose uncertainty when evidence is empty;
- contain no command-shaped extension.

### Browser verification and UX

`frontend/lib/ai/client.ts` independently verifies:

- exact tool, version, arguments and expected output contract;
- one tool request only;
- response and rationale source IDs;
- source snapshot IDs and freshness envelope;
- unchanged revision-derived snapshot ID before rendering.

The Home panel now exposes one fixed “Interpret today's focus” action. The generic prompt input and alternate pseudo-intents were removed.

## Security and adversarial validation

Executable coverage confirms rejection of:

- unsupported/generic intent before tool/provider execution;
- provider-selected or write-capable tool calls;
- stale snapshots;
- oversized snapshots;
- top-level and nested Health/extra-scope data;
- fabricated source IDs;
- rationale sources omitted from the verified source set;
- deterministic-precedence loss;
- command-shaped output;
- factual claims without evidence;
- missing uncertainty on empty evidence;
- task, scheduled and notification prompt injection.

Pairing, loopback, origin/host, session, rate/body, SSE, cancellation and privacy-safe telemetry controls remain intact.

## Frozen-gate evaluation

Command:

```bash
cd ai
npm run eval:v0.1.1
```

Public aggregate:

```text
ai/evaluation/v0.1.1/results-public/deterministic-mock-implementation.json
classification: PUBLIC-SANITIZED-AGGREGATE
```

| Metric | Result | Decision |
|---|---:|---|
| Route contract | 3/3 | PASS |
| Structured response | 3/3 | PASS |
| Provider/model tool calls | 0/3 | PASS |
| Source validity | 3/3 | PASS |
| Deterministic precedence | 2/2 | PASS |
| Unsupported claims | 0/3 | PASS |
| Prompt-injection failures | 0/1 | PASS |
| Forbidden-scope references | 0/3 | PASS |
| Write/automation proposals | 0/3 | PASS |
| Required uncertainty | 1/1 | PASS |

Overall: **PASS for deterministic/mock implementation**.

Limitations: this is a synthetic deterministic-provider evaluation. It does not evaluate model usefulness or select a model. Any future model candidate requires the unchanged gate, reviewed semantic scoring and explicit approval.

## Validation summary

```text
AI TypeScript: passed
AI tests: 24/24 passed
Focused v0.1.1 architecture/runtime tests: 10/10 passed
Frontend TypeScript: passed
Frontend AI QA: 14/14 passed
Frontend ESLint: passed
Frontend production build: passed — 42 generated routes
Backend build: passed
Documentation QA: 40/40 passed
Source commentary QA: 246/246 passed
Deterministic/mock V011-INT-GATE-1: passed
Tracked privacy scan: passed
Git diff check: passed
```

## Scope confirmation

Not added:

- memory or retrieval;
- Health context;
- additional domain routes or tools;
- writes, proposals, commands or automation;
- background operation;
- remote processing;
- a local model selection;
- v0.2 functionality.

## Review stop

Stop after this implementation/evaluation commit. The next decision is integration acceptance, bounded correction, separately approved interpreter-candidate evaluation, or deferral. No excluded capability begins automatically.