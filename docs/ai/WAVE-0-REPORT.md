# Wave 0 Selection Report

**Status:** `INCOMPLETE — QWEN AND GEMMA PREFLIGHTS FAILED; PHI REQUIRED`<br>
**Report version:** 0.5 — Gemma preflight decision<br>
**Date:** 2026-08-18<br>
**Permanent model selection:** **BLOCKED**<br>
**Implementation note:** the user later explicitly authorized provider-neutral v0.1 foundation and read-only `get_today`; this does not complete Wave 0 or approve a model.

## Executive decision

Qwen and Gemma have both failed corrected 4K preflight. Qwen passes schema but reaches only 50% tools; Gemma reaches 0% schema/tools with HTTP 400 on structured requests. Neither may proceed to a full run. Phi-4 Mini is the remaining compact candidate. No model, context, runtime, vector backend or transport is selected.

## Evidence and privacy rules

This report uses three explicitly labeled layers:

1. **MEASURED FACT** — produced by the versioned harness from LOCAL-ONLY raw artifacts.
2. **INTERPRETATION** — what the measurement means under the frozen gates.
3. **RECOMMENDATION** — proposed selection; never presented as measurement.

Raw hardware captures, prompts/outputs, telemetry, logs, paths and machine configuration remain under ignored `ai/wave0/results-local/`. Public figures come only from the allowlist sanitizer and must be independently traceable to the owner's retained raw run. No personal Kaizen data is used.

Frozen criteria: [`wave-0/PASS-FAIL-CRITERIA.md`](wave-0/PASS-FAIL-CRITERIA.md).<br>
Candidate inventory: [`wave-0/CANDIDATE-MATRIX.md`](wave-0/CANDIDATE-MATRIX.md).<br>
Target method: [`wave-0/TARGET-RUNBOOK.md`](wave-0/TARGET-RUNBOOK.md).

## Methodology

- One verified llama.cpp Windows CUDA build/hash for all candidates.
- Identical synthetic Kaizen scenarios, temperature, output cap and repetitions.
- 2K, 4K, 8K, 12K and 16K context; concurrency 1 and 2.
- AC balanced and AC performance runs recorded separately.
- Three cold loads and 30-minute thermal soak per finalist.
- Structured/tool/grounding/security scoring before speed comparison.
- Candidates failing a hard gate are rejected before weighted interpretation.

## Target environment

| Item | Supplied target | Local confirmation |
|---|---|---|
| Device | ASUS TUF Gaming A15 FA506NCR | Sanitized run confirms expected CPU/GPU class; device model intentionally omitted |
| CPU | Ryzen 7 7435HS, 8C/16T | Confirmed: AMD Ryzen 7 7435HS, 8C/16T |
| RAM | 16 GB DDR5 | 16,987,074,560 bytes, one published module count, DDR5-4800 configured |
| GPU | RTX 3050 Laptop, 4 GB GDDR6 | Confirmed: 4,096 MiB; 2,970 MiB free at capture; driver 596.49; compute 8.6; CUDA 13.2 |
| GPU power | 60 W, 75 W Dynamic Boost | Default limit 60 W; current limit unavailable in sanitized capture |
| Storage | ~2.5 TB | Intentionally absent from public aggregate; not needed for model scoring |
| OS | Windows 11 | Home Single Language, 64-bit, version 10.0.26200/build 26200 |
| Adapter | 180 W | Run labeled AC balanced; adapter value remains supplied, not machine-measured |

The Arena sandbox remains a non-target environment. Target claims below come only from the accepted sanitized aggregate at `ai/wave0/results-public/qwen3-4b-instruct-2507-q4km-AC-balanced.json`.

## First target result — Qwen3 4B Q4_K_M / AC balanced

### MEASURED FACT

| Context | Cold-load p95 | TTFT p50 / p95 | tok/s p50 | Total p95 | Process RAM peak | Minimum system available | Structured | Tools |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2K | 2.358 s | 55 / 109 ms | 51.51 | 4.695 s | 3.36 GiB | 1.65 GiB | 0% | 85.71% |
| 4K | 2.614 s | 58 / 110 ms | 46.70 | 5.320 s | 3.35 GiB | 2.17 GiB | 0% | 85.71% |
| 8K | 3.132 s | 56 / 91 ms | 46.87 | 5.285 s | 3.29 GiB | 1.99 GiB | 0% | 85.71% |
| 12K | 2.849 s | 67 / 127 ms | 42.50 | 5.997 s | 3.98 GiB | 1.50 GiB | 0% | 85.71% |
| 16K | 3.375 s | 65 / 147 ms | 41.62 | 6.053 s | 4.65 GiB | 0.81 GiB | 0% | 85.71% |

Additional measured results:

- Frozen score: **FAIL** — 181 pass, 55 fail, 30 pending gates.
- Native `llama-bench` requirement: pass; runtime build 10472 / commit `60eeeb608`.
- Three cold loads at every required context: pass.
- Concurrency transport failures: zero, but structured/tool reliability still fails at concurrency 2.
- Request cancellation: server-observed start/termination, zero active request, stable process tree and RAM recovery pass at every context.
- VRAM recovery: pending because per-request NVIDIA monitoring was unavailable.
- Lifecycle normal/crash/restart: pass; all ports and process trees released.
- 30-minute soak: 1,093/1,093 requests, 97.68% throughput retention; temperature/power gates pending.
- FTS5 target p95 at 50K records: 6.384 ms; exact ranking/filter/deletion gates pass; paraphrase Hit@10 remains 0.
- Embedding benchmark: not supplied.

### INTERPRETATION

The candidate is fast and operationally stable under this configuration, including at larger contexts. It does not meet the minimum intelligence-quality contract: schema reliability is 0%, exact tool reliability is 85.71%, critical grounding/source-precedence/uncertainty gates fail, and prompt-injection failure rate is 50%. The identical quality rates at every context indicate a systematic model/template/schema/tool configuration issue or candidate limitation rather than context pressure alone; raw LOCAL-ONLY failure categories must be inspected on the target machine without uploading raw outputs. System-memory headroom also fails the 3 GiB minimum at every context, worsening to 0.81 GiB at 16K.

### RECOMMENDATION

Do not select the pre-fix run as the default model. The corrected preflight below determines whether a rerun is allowed.

## Corrected Qwen preflight

### MEASURED FACT

```text
Context:                     4096
Startup:                     3.157 s
Jinja enabled:               yes
Structured reliability:     100%
Tool reliability:           50%
Request metrics:             available
NVIDIA telemetry:           available
Port/process-tree cleanup:   passed
Failure:                     expected get_today, got no tool call
Full-run permission:         false
```

Public aggregate: `ai/wave0/results-public/qwen3-fixed-preflight.json`.

### INTERPRETATION

The canonical schema and NVIDIA fixes worked. The remaining blocker is now isolated to actual tool behavior: the model completed one of two preflight tool scenarios but did not invoke the required zero-argument `get_today` tool. This is no longer attributable to missing Jinja or invalid schema wrapping. A 50% preflight tool rate cannot satisfy the frozen 95% full-run gate.

### RECOMMENDATION

Reject this Qwen candidate/configuration for the current selection cycle and do not run its corrected full AC-balanced or AC-performance benchmark. Preserve the result as a measured rejection. No threshold or scenario should be weakened to rescue Qwen.

## Gemma 3 4B corrected preflight

### MEASURED FACT

```text
Context:                     4096
Jinja enabled:               yes
Structured reliability:     0%
Tool reliability:           0%
Request metrics:             available
NVIDIA telemetry:           available
Port/process-tree cleanup:   passed
Failures:                    HTTP 400; get_project/get_today not called
Full-run permission:         false
```

### INTERPRETATION

Gemma's local runtime and telemetry boundaries work, but the candidate/configuration fails both mandatory compatibility classes. Structured requests are rejected with HTTP 400 and required tools are not called. The exact reason for the 400 response is not available in the public-safe summary, so it remains unknown rather than guessed.

### RECOMMENDATION

Reject the measured Gemma configuration. Do not run its full balanced or performance benchmark and do not weaken frozen gates. Proceed to Phi-4 Mini preflight. If Phi also fails, record that no compact candidate passed instead of forcing a selection.

## Measured prototype results

### Revision/snapshot prototype

**MEASURED FACT:** 17 assertions passed for monotonic/no-op revisions, Forge+Career transaction vectors, failed transaction behavior, reload persistence, stale detection, stable-capture retry, epoch rotation and single-writer lease rejection/transfer.

**INTERPRETATION:** epoch + per-domain vectors are viable in an isolated file prototype. React/localStorage persistence health and browser lock behavior remain unmeasured.

**RECOMMENDATION:** retain the strategy for browser integration prototyping; do not mark it production-ready.

### Pairing/session prototype

**MEASURED FACT:** 13 security assertions passed for loopback bind, malicious origin/host, incorrect/replayed pairing code, missing/valid/revoked/expired sessions and restart invalidation. Session tokens are stored as hashes.

**INTERPRETATION:** one-time pairing with expiring sessions is viable as a security baseline. Console-displayed pairing is only a test channel.

**RECOMMENDATION:** continue this design into browser transport validation; do not expose real Kaizen data until the final pairing UX/channel passes review.

### SQLite FTS5 baseline

**MEASURED FACT — non-target sandbox, synthetic corpus:**

| Records | Index build | Query p50 | Query p95 | Exact Hit@1 | MRR@10 | Paraphrase Hit@10 | Filter leakage | Deletion |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1,000 | 3.520 ms | 0.169 ms | 0.224 ms | 1.00 | 1.00 | 0.00 | 0 | verified |
| 10,000 | 34.649 ms | 1.420 ms | 1.739 ms | 1.00 | 1.00 | 0.00 | 0 | verified |
| 50,000 | 204.984 ms | 7.469 ms | 13.039 ms | 1.00 | 1.00 | 0.00 | 0 | verified |

Public sanitized aggregate: `ai/wave0/results-public/sandbox-retrieval-aggregate.json`.

**INTERPRETATION:** structured domain filters + FTS5 BM25 + bounded recency/importance passed exact queries with substantial latency headroom, but lexical retrieval missed all four intentionally non-overlapping paraphrases. Target Windows disk/locking/antivirus, corruption and backup remain unmeasured.

**RECOMMENDATION:** retain SQLite FTS5 for exact/filtered retrieval. The measured paraphrase gap justifies benchmarking an embedding provider, but does not yet justify selecting a vector database; compare embedding quality/latency first and keep storage replaceable.

### SSE vs WebSocket mock transport

**MEASURED FACT — non-target sandbox:** twenty loopback runs, 200 tiny events per run.

| Metric | SSE | WebSocket |
|---|---:|---:|
| Mean delivery | 4.732 ms | 5.430 ms |
| p50 | 4.441 ms | 5.432 ms |
| p95 | 5.342 ms | 5.664 ms |
| WebSocket bidirectional round trip | — | 0.133 ms mean |

**INTERPRETATION:** protocol overhead is negligible relative to model latency; this mock does not test browser reconnect, session recovery, pairing, CSP or SSE callback cost.

**RECOMMENDATION:** keep authenticated HTTP+SSE as the simpler baseline and WebSocket as the comparison candidate. Do not select either until target browser/session tests complete.

## llama.cpp integration status

A model-agnostic harness now supports:

- explicit local `llama-server` executable/model paths
- loopback-only launch
- startup health timing
- streamed TTFT, total latency and token usage
- schema-constrained response requests
- tool-call scenarios and fabricated-ID checks
- configurable context sizes and concurrency
- cancellation/shutdown timing
- model/runtime SHA-256 metadata
- separate NVIDIA monitoring

The harness never downloads a model and fails closed when no candidate is enabled. The official [`llama-server` documentation](https://github.com/ggml-org/llama.cpp/tree/master/tools/server) makes it an appropriate runtime candidate because it exposes local OpenAI-compatible chat/streaming, embeddings, schema-constrained output and tool use; capability claims still require testing on each candidate model.

### Model/quantization results

Qwen3 4B Instruct 2507 Q4_K_M has one measured AC-balanced run and fails the frozen quality/headroom gates in its current configuration. Gemma 3 4B IT QAT Q4_0, Phi-4 Mini Instruct Q4_K_M and the optional larger control remain unmeasured. No candidate is architecture or selected.

## Structured output and tool reliability

The public synthetic evaluation dataset now checks:

- structured schema compliance and grounded priority selection,
- exact tool selection and argument generation,
- uncertainty when velocity/evidence is absent,
- prompt injection in imported text and tool requests,
- current-record and deterministic-analytic precedence over memory,
- stale snapshot classification,
- fabricated source-ID traps,
- Health consent exclusion,
- empty-account behavior,
- cross-domain Forge/Workout/readiness conflict reasoning,
- deterministic deadline-forecast tool selection,
- refusal to invent unavailable write or Health tools.

The first target run measures 0% structured reliability and 85.71% tool reliability at every context, below the frozen 98%/95% thresholds. Failure-category diagnosis remains LOCAL-ONLY. No native tool-calling strategy is approved by these results.

## Embedding/retrieval status

- Lexical FTS baseline measured.
- Embedding harness is wired and restricted to literal loopback endpoints, but no verified local embedding model/runtime endpoint was supplied; therefore it was correctly not run.
- Vector store comparison remains deferred until an embedding candidate proves the measured paraphrase need and resource cost.
- No permanent embedding model or vector technology selected.

## Context, thermal and concurrency status

- Harness matrix supports 2K/4K/8K/12K/16K contexts and concurrency 1/2 by default.
- Exact limits remain unselected.
- NVIDIA sample logger records VRAM, utilization, power, temperature and p-state.
- AC-balanced context/concurrency/RAM/cancellation/soak behavior is measured for one candidate. GPU VRAM/utilization/power/temperature telemetry is missing, AC performance is missing, and no second/third candidate exists.

## Target model measurement table

All cells remain `PENDING` until sanitized target exports are reviewed.

| Candidate | Quant | Load p95 | TTFT p50/p95 | tok/s p50 | Total p95 | RAM peak | VRAM peak | GPU util | CPU util | Temp p95/max | Structured | Tools | Hallucination | Injection critical | 2K→16K | C1/C2 | Verdict |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| Qwen3 4B Instruct 2507 | Q4_K_M | 2.36–3.37 s | 55–67 / 91–147 ms | 41.62–51.51 | 4.69–6.05 s | 3.29–4.65 GiB | corrected preflight available | PENDING full run | ~99–133% mean | PENDING | corrected preflight 100% | corrected preflight 50% FAIL | pre-fix only | corrected schema; tool FAIL | complete | preflight blocked full rerun | REJECT CANDIDATE | PENDING |
| Gemma 3 4B IT QAT | Q4_0 | preflight only | PENDING | PENDING | PENDING | PENDING | preflight available | PENDING | PENDING | PENDING | 0% FAIL | 0% FAIL | PENDING | structured HTTP 400 | 4K preflight | preflight blocked | REJECT CANDIDATE |
| Phi-4 Mini Instruct | Q4_K_M | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Larger spill/control | TBD | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

## Raw and sanitized evidence inventory

| Artifact | Classification | Status |
|---|---|---|
| Hardware captures by power profile | LOCAL-ONLY raw | Pending target run |
| Model/server raw JSON and logs | LOCAL-ONLY raw | Pending target run |
| Per-second thermal/power CSV | LOCAL-ONLY raw | Pending target run |
| Retrieval raw JSON | LOCAL-ONLY raw | Pending target run |
| Sanitized aggregate JSON | Public allowlist export | 1 Qwen AC-balanced result received |
| Public review bundle | Sanitized coverage summary | Incomplete: 1 candidate, 1 profile, frozen score failing |
| This report's measured tables | Public sanitized summary | Partially populated |

## Trade-offs and rejected candidates

| Candidate | Current status | Reason |
|---|---|---|
| Browser-state migration to server database | Rejected for V1 | Unnecessary migration and stale/sync complexity; Domain Bridge retained. |
| Unauthenticated localhost engine | Rejected | Localhost is not a trust boundary. |
| Automatic model download | Rejected | Supply-chain, disk, license and accidental architecture risk. |
| Vector-only retrieval | Rejected | Structured IDs/filters and exact lexical matches are essential. |
| Context-free chatbot first | Rejected | Does not prove grounding or Domain Bridge. |
| WebSocket selected solely for “realtime AI” | Rejected | Mock results show protocol overhead is irrelevant; complexity must be justified by session semantics. |
| SSE permanently selected from sandbox microbenchmark | Rejected | Browser/pairing/reconnect measurements incomplete. |
| Any model selected from third-party RTX 3050 anecdotes | Rejected | Exact VRAM/TGP/context/runtime differ; target measurement required. |

## Provisional architecture recommendations

These are recommendations, not locked selections:

1. Continue with an external `llama-server` process behind the existing provider contract for target testing; compare child-process ownership during lifecycle tests.
2. Retain epoch + per-domain revision vectors and stable double-read snapshots for integration prototyping.
3. Retain one-time pairing plus short-lived per-session bearer credentials; design a stronger user-visible pairing channel before real data.
4. Keep HTTP+SSE as the transport baseline and WebSocket as the comparison candidate.
5. Keep SQLite FTS5 as the lexical baseline while evaluating a replaceable vector layer separately.
6. Prioritize three 4B-class 4-bit candidates for the confirmed 4 GB VRAM limit; include one 7B–8B spill comparison only after those baselines to quantify system-RAM/PCIe cost. This is a benchmark plan, not a model recommendation.

## Remaining selection gates

- restore NVIDIA sampling inside the model/soak process environment, then capture VRAM/utilization/power/temperature and cancellation recovery
- Phi-4 Mini corrected preflight; AC-balanced full run only if it passes
- AC-performance only if Phi passes balanced quality/resource prerequisites
- if Phi fails, record no passing compact candidate rather than weakening gates
- documented larger-control decision after compact candidates
- passing structured JSON, tool, grounding, injection, source-precedence and uncertainty reliability
- embedding candidate benchmark; FTS exact retrieval is already passing
- retain three independent cold loads, request-level cancellation and separate lifecycle tests for every remaining candidate/profile
- Windows disk/corruption/deletion/backup tests
- authenticated browser transport/reconnect test
- React/localStorage revision integration prototype
- context 2K/4K/8K/12K/16K reliability and memory curves
- 20–30 minute thermal soak per finalist
- concurrency 1/2 and cancellation resource release

## Final selection fields

These remain unresolved until target evidence passes `W0-GATE-2`:

| Decision | Current value |
|---|---|
| Recommended model | No selection |
| Recommended quantization | No selection |
| Recommended runtime/build | llama.cpp is a candidate; no build selected |
| Recommended context budget | No selection; 2K/4K/8K/12K/16K are measured variables under W0-GATE-2 |
| Recommended concurrency | No selection; single client baseline |
| Retrieval | FTS5 baseline under evaluation; vector layer unproven |
| Transport | HTTP+SSE provisional baseline; no selection |
| Pairing/security | One-time pairing + expiring session concept; mechanism unselected |
| Revision/snapshot | Epoch + per-domain vector prototype; browser integration pending |
| Known limitations | 4 GB VRAM/16 GB RAM; Qwen and Gemma rejected at corrected preflight |
| Unresolved | Phi result, whether any compact candidate passes, full thermal/resource data, embeddings/vector need |

## Final status

**NO MODEL SELECTION APPROVAL.** The report records measured synthetic results and blocked target gates. Provider-neutral v0.1 implementation exists under explicit user authorization, but no candidate may become the default/recommended runtime until target results complete this report and receive review.