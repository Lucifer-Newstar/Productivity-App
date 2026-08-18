# Intelligence Engine Implementation Ledger

Living record of what is implemented, validated, measured, blocked and next. Update this file at the end of every AI step.

_Last updated: 2026-08-18_

## Current milestone

> **Complete Wave 0 model selection and real-model v0.1 integration validation. Then stop for scope review.**

v0.1 capability scope is frozen. No memory, Health context, write actions, automation, new domains or v0.2 functionality.

## Completed architecture and foundation

| Area | Status | Evidence |
|---|---|---|
| Canonical Master Specification | Complete | `MASTER-SPECIFICATION.md` |
| KAC-1 Constitution and precedence | Complete | Constitution + ADR register |
| Independent TypeScript engine | Complete | `ai/src/` build/typecheck |
| Provider/capability abstraction | Complete | llama.cpp + deterministic mock adapters |
| Structured/tool validation | Complete | AJV and executable tests |
| Bounded read-only orchestration | Complete | One `get_today@1.0` tool call maximum |
| Secure loopback gateway | Complete | Pairing, hashed sessions, Origin/Host/rate/body controls |
| SSE and cancellation | Complete for mock | Gateway integration tests |
| Browser Domain Bridge | Complete for v0.1 | `core.today@1.0`, revisions, redactions |
| Same-origin fixed proxy | Complete | `/api/ai/[...path]` |
| Home Intelligence UI | Complete | Local/read-only paired panel |
| Source/evidence/freshness envelope | Complete | Schema and source-ID verification |
| Privacy-safe observability | Complete | Aggregate in-memory `/v1/metrics` |
| Public vs LOCAL-ONLY boundary | Complete | Ignore rules, sanitizer, pre-commit scanner |

## v0.1 integration validation

| Gate | Status |
|---|---|
| Mock provider end-to-end | PASS |
| llama.cpp HTTP/SSE adapter protocol mock | PASS |
| Task/notification/scheduled injection fixtures | PASS |
| Write/second-tool escalation rejection | PASS |
| `core.today@1.0` remains read-only/minimum-context | PASS |
| Real candidate through Wave 0 direct benchmark | One failed Qwen configuration received |
| Real candidate through production gateway/Domain Bridge | PENDING |

See [`V0.1-INTEGRATION-VALIDATION.md`](V0.1-INTEGRATION-VALIDATION.md).

## Wave 0 harness

| Area | Status |
|---|---|
| Hardware capture and public sanitizer | Complete |
| Frozen W0-GATE-2 scorer | Complete; thresholds unchanged |
| Five context sizes | Complete in harness |
| Three cold loads/context | Complete in harness |
| Native llama-bench requirement | Complete in harness |
| Full concurrency structured/tool scoring | Complete in harness |
| Server-observed request cancellation | Complete in harness |
| RAM/VRAM pre-request recovery comparison | Complete in harness |
| Windows/Linux process-tree checks | Complete in harness |
| Literal-loopback embedding endpoint security | Complete in harness |
| Schema/tool/GPU preflight | Complete in harness |
| Correct canonical response schema | Complete |
| Guaranteed `--jinja` tool template | Complete |
| `[N/A]`-tolerant NVIDIA sampling | Complete |

Synthetic harness status: **38/38 passed** before the first target result intake; corrected rerun remains pending.

## Received target evidence

### Qwen3 4B Instruct 2507 Q4_K_M — AC balanced

Status: **REJECT CURRENT CONFIGURATION / CORRECTED RERUN PENDING**

Measured strengths:

- 41.62–51.51 median output tokens/sec
- 55–67 ms median TTFT
- 2.36–3.37 s cold-load p95
- cold-load, native-bench, cancellation, lifecycle and soak operational checks passed
- 1,093/1,093 soak requests with 97.68% throughput retention

Measured blockers:

- structured output 0% versus 98% threshold,
- tool reliability 85.71% versus 95%,
- grounding/source precedence/uncertainty/injection gates failed,
- system headroom below 3 GiB at every context,
- NVIDIA model/soak telemetry absent,
- embeddings absent,
- AC performance absent.

Verified harness defects were subsequently fixed: canonical schema wrapper, guaranteed `--jinja`, and NVIDIA `[N/A]` handling. Corrected AC-balanced preflight/rerun is next.

### Latest attachment intake — no new result

A later attachment batch contained raw hardware/model/score/soak/lifecycle/server-log files plus a public aggregate. The public aggregate was JSON-equivalent to the already recorded pre-fix run (same capture timestamp and measurements; only whitespace padding differed) and contained no preflight section. It was not added as new evidence and milestone status did not change. Raw attachments were not inspected beyond minimum metadata/aggregate comparison and were deleted from the public workspace after validation.

### Corrected Qwen preflight

The corrected 4K preflight is now measured:

```text
Jinja:                 enabled
Structured:            100%
Tools:                 50%
Metrics/NVIDIA:        available
Cleanup:               passed
Failure:               expected get_today, got no tool call
passedForFullRun:       false
```

The schema and telemetry defects are fixed, but the model still fails the required tool behavior. Qwen is rejected for this selection cycle; no corrected full or AC-performance run should be performed.

### Gemma 3 4B preflight

```text
Jinja:                 enabled
Structured:            0%
Tools:                 0%
Metrics/NVIDIA:        available
Cleanup:               passed
Failures:              HTTP 400; get_project/get_today not called
passedForFullRun:       false
```

Gemma is rejected for this selection cycle. The exact HTTP 400 cause is unavailable in the public-safe summary and is not guessed. No full/performance run should be performed.

### Phi-4 Mini preflight

```text
Jinja:                 enabled
Structured:            100%
Tools:                 0%
Metrics/NVIDIA:        available
Cleanup:               passed
Failures:              get_project/get_today not called
passedForFullRun:       false
```

Phi is rejected. All three compact candidates failed the frozen tool/schema compatibility gate; no full or performance run is authorized.

## Pending model selection work

1. Run one final preflight-only control: Qwen2.5 7B Instruct Q4_K_M at 4K.
2. If it fails, close Wave 0 with no passing local model; do not test more models or weaken gates.
3. If it passes, stop for review before any full resource-risk benchmark.
4. Record an explicit no-embedding decision unless a verified small local embedding endpoint is separately approved.
5. Final model/context/concurrency/runtime recommendation or no-selection result.
6. Real selected-candidate v0.1 integration only if a candidate passes.
7. Stop for Wave 1.1/v0.2 scope review.

## Deferred by freeze

- additional domain tools,
- production memory,
- Health access,
- production hybrid/vector retrieval,
- cross-domain reasoning expansion,
- write/action proposals,
- automation,
- v0.2 and later capabilities.

## Latest relevant commits

```text
fa130e2 fix(ai): correct Wave 0 schema and GPU telemetry
f0e917b docs(ai): publish corrected Qwen rerun checklist
6ab4181 test(ai): add first sanitized target benchmark
95f5276 docs(ai): assess first Qwen target result
```
