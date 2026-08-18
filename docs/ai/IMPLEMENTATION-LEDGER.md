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

The required next artifact remains a **new corrected preflight generated after pulling `fa130e2`/`f0e917b`**, followed by a corrected AC-balanced aggregate only if preflight passes.

## Pending model selection work

1. Corrected Qwen preflight.
2. Corrected Qwen AC-balanced rerun only if preflight passes.
3. Gemma 3 4B AC-balanced preflight/run.
4. Phi-4 Mini AC-balanced preflight/run.
5. AC-performance runs only for passing balanced candidates.
6. Verified local embedding candidate or an explicit no-embedding decision.
7. Complete sanitized coverage bundle.
8. Final model/context/concurrency/runtime recommendation or no-selection result.
9. Real selected-candidate v0.1 integration test.
10. Stop for Wave 1.1/v0.2 scope review.

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
