# AI v0.1.1 integration acceptance and interpreter-model evaluation design

**Date:** 2026-08-19
**Branch:** `ai`
**Implementation under review:** `df803fd`
**Model execution:** none

## Part A — live integration acceptance

A manual live-process smoke was completed using the actual engine entry point, frontend development server, fixed Next.js proxy, pairing/session flow, authenticated SSE and browser-style tool-result callback.

### Runtime topology

```text
Frontend: http://localhost:3000
Next proxy: /api/ai/[...path]
Engine: http://127.0.0.1:4317
Provider: deterministic mock
```

The one-time pairing credential and session token remained transient and were not written to a file or report.

### Acceptance sequence

| Check | Result |
|---|---|
| Engine entry point starts on loopback | PASS |
| Frontend development entry point starts | PASS |
| Home route returns HTTP 200 | PASS |
| Pairing through fixed same-origin proxy | PASS |
| Unsupported `ask` intent rejected with HTTP 400 / `UNSUPPORTED_INTENT` | PASS |
| Fixed `{ focus-today, localDate }` request accepted | PASS |
| SSE emits exactly `get_today@1.0` | PASS |
| Tool arguments fix local date, `includeCompleted: false`, `maximumItems: 100` | PASS |
| Synthetic `core.today@1.0` result accepted | PASS |
| Response preserves deterministic Next Action | PASS |
| Source ID and freshness snapshot ID match supplied evidence | PASS |
| Session revocation succeeds | PASS |
| Both processes stop without retained engine port | PASS |

No generic prompt, Health, memory, additional domain tool, write or automation path was exercised or exposed.

The live check used direct HTTP/SSE interaction rather than visual browser automation. The fixed-purpose Home control, removal of generic prompt UI, browser source verification and revision-drift rejection remain covered by frontend TypeScript, `qa:ai`, production build and source inspection. Together these satisfy the v0.1.1 integration acceptance boundary.

**Acceptance decision:** PASS — accept v0.1.1 as the deterministic/mock baseline for the next review stage.

## Part B — interpreter-only model evaluation design

The next model-evaluation package is frozen before any model execution.

### Frozen identifiers

| Item | Identifier |
|---|---|
| Candidate matrix | `I1-CANDIDATES-1` |
| Run protocol | `I1-RUN-1` |
| Synthetic dataset design | `I1-SYNTHETIC-1` |
| Quality gate | unchanged `V011-INT-GATE-1@1.0` |
| Report classification | `PUBLIC-SANITIZED-AGGREGATE` |

### Candidate matrix

Included in fixed order:

1. Qwen3 4B Instruct 2507 Q4_K_M
2. Phi-4 Mini Instruct Q4_K_M

Both retain their Wave 0 rejection. Their inclusion is based only on corrected 100% structured preflight evidence and the narrower interpreter role, which removes model-selected tools.

Explicitly excluded:

- Gemma 3 4B IT QAT Q4 — prior HTTP 400 and 0% structured output;
- Qwen2.5 7B Instruct Q4_K_M control — prior 50% structured output, confidence violation and higher resource cost.

No candidate is selected or preferred architecture.

### Protocol boundary

The protocol requires the production deterministic router and orchestrator. Provider requests contain zero tools and zero tool rounds. The 4K/512 context-output configuration, temperature zero and concurrency one are fixed.

The full design has 50 public synthetic scenarios, two repetitions and 100 scored responses per candidate across:

- deterministic clear;
- empty/insufficient/contradictory;
- multiple priorities;
- schedule/attention projections;
- untrusted instructions;
- forbidden-scope/action language.

`V011-INT-GATE-1` is unchanged. Semantic unsupported-claim, precedence, scope and injection judgments require two blinded reviewers and adjudication. Operational ceilings reuse unchanged W0 resource/safety values without reopening Wave 0.

### Stages and stop rules

1. Local identity/hash/license intake
2. Ten-response production-path preflight
3. One-hundred-response frozen-gate run
4. Operations/thermal validation only after quality pass
5. Sanitized aggregate and selection-review report

Any preflight failure stops that candidate. Any harness, privacy, identity or corpus-integrity failure invalidates the intake. A complete pass yields only `PASS-FOR-SELECTION-REVIEW`; no runner may declare a model selected.

### Privacy boundary

- Actual local model/runtime configuration uses ignored `*.local.json` only.
- Raw outputs and telemetry stay in ignored `model-phase/results-local/`.
- Public result files require `PUBLIC-SANITIZED-AGGREGATE`.
- No model path, raw output, prompt, hardware identifier or per-sample log enters Git or chat.

### Design QA

```text
Interpreter-model design QA: 15/15 passed
Execution enabled in public matrix: false
Execution enabled in local template: false
Public model result files: none
Wave 0 reopened: false
V011-INT-GATE-1 changed: false
```

## Deliverables

- `docs/ai/v0.1.1-model-evaluation/CANDIDATE-MATRIX.md`
- `docs/ai/v0.1.1-model-evaluation/RUN-PROTOCOL.md`
- `docs/ai/v0.1.1-model-evaluation/REPORT-TEMPLATE.md`
- `ai/evaluation/v0.1.1/model-phase/candidates.v1.json`
- `ai/evaluation/v0.1.1/model-phase/protocol.v1.json`
- disabled local configuration template
- design-only QA script

## Validation summary

```text
Live engine/frontend/proxy acceptance: passed
Interpreter-model design QA: 15/15 passed
AI TypeScript: passed
AI tests: 24/24 passed
AI build: passed
Frontend ESLint: passed
Documentation QA: 41/41 passed
Source commentary QA: 247/247 passed
Git diff check: passed
```

Staged privacy validation: passed before commit.

## Stop condition

Stop after this design commit. No model was started, downloaded or evaluated. Corpus/runner implementation and target execution require later explicit approval. Memory, retrieval, Health, additional domains, writes, automation, remote providers and v0.2 remain frozen.