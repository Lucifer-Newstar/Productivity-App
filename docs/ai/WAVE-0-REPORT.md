# Wave 0 Selection Report

**Status:** `INCOMPLETE — TARGET HARDWARE AND MODEL RESULTS REQUIRED`<br>
**Report version:** 0.2 — privacy boundary and frozen gates<br>
**Date:** 2026-08-17<br>
**Permanent model selection:** **BLOCKED**<br>
**Implementation note:** the user later explicitly authorized provider-neutral v0.1 foundation and read-only `get_today`; this does not complete Wave 0 or approve a model.

## Executive decision

Wave 0 infrastructure and synthetic prototypes are viable, but no generation model, quantization, embedding model, vector backend or final transport is selected. The target is now identified as an ASUS TUF Gaming A15 FA506NCR with Ryzen 7 7435HS, RTX 3050 Laptop GPU (4 GB GDDR6, 60 W/75 W Dynamic Boost) and 16 GB DDR5. Machine-generated Windows, driver, memory-speed, storage, model, power and thermal results are still required. Production feature work remains blocked until those measurements are attached and this report is reviewed.

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
- 4K and 8K context; concurrency 1 and 2.
- AC balanced and AC performance runs recorded separately.
- Three cold loads and 30-minute thermal soak per finalist.
- Structured/tool/grounding/security scoring before speed comparison.
- Candidates failing a hard gate are rejected before weighted interpretation.

## Target environment

| Item | Supplied target | Local confirmation |
|---|---|---|
| Device | ASUS TUF Gaming A15 FA506NCR | Pending |
| CPU | Ryzen 7 7435HS, 8C/16T | Pending |
| RAM | 16 GB DDR5 | Speed/modules pending |
| GPU | RTX 3050 Laptop, 4 GB GDDR6 | Driver/telemetry pending |
| GPU power | 60 W, 75 W Dynamic Boost | Runtime limit pending |
| Storage | ~2.5 TB | Drive layout pending |
| OS | Windows 11 | Edition/build pending |
| Adapter | 180 W | Power-profile capture pending |

The Arena sandbox remains a non-target 2-vCPU/1.9 GiB environment without NVIDIA. See [`wave-0/TARGET-HARDWARE-CAPTURE.md`](wave-0/TARGET-HARDWARE-CAPTURE.md) and [`wave-0/TARGET-RUNBOOK.md`](wave-0/TARGET-RUNBOOK.md).

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

**Not measured.** Dedicated VRAM is confirmed by the user as 4 GB, but the target laptop is not accessible from the sandbox. The disabled target matrix now includes Qwen3 4B Instruct 2507 Q4_K_M, Gemma 3 4B IT QAT Q4_0 and Phi-4 Mini Instruct Q4_K_M, plus one optional 7B–8B spill/control candidate after the 4B baselines. Sources, licenses and artifact hashes must be verified locally. These are benchmark candidates, not architecture or recommendations.

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

**Measured model pass rates: pending target model runs.** No native tool-calling strategy is enabled by architecture until its pass threshold is met. Schema-constrained JSON and prompted/native tools will be compared rather than assumed equivalent.

## Embedding/retrieval status

- Lexical FTS baseline measured.
- Embedding provider harness/model still pending.
- Vector store comparison still pending Windows tests.
- No permanent embedding model or vector technology selected.

## Context, thermal and concurrency status

- Harness matrix supports 4K/8K contexts and concurrency 1/2 by default.
- Exact limits remain unselected.
- NVIDIA sample logger records VRAM, utilization, power, temperature and p-state.
- Thermal soak, AC/battery power modes, KV-cache pressure, cancellation memory release and two-client behavior are pending target execution.

## Target model measurement table

All cells remain `PENDING` until sanitized target exports are reviewed.

| Candidate | Quant | Load p95 | TTFT p50/p95 | tok/s p50 | Total p95 | RAM peak | VRAM peak | GPU util | CPU util | Temp p95/max | Structured | Tools | Hallucination | Injection critical | 4K/8K | C1/C2 | Verdict |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| Qwen3 4B Instruct 2507 | Q4_K_M | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Gemma 3 4B IT QAT | Q4_0 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Phi-4 Mini Instruct | Q4_K_M | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Larger spill/control | TBD | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

## Raw and sanitized evidence inventory

| Artifact | Classification | Status |
|---|---|---|
| Hardware captures by power profile | LOCAL-ONLY raw | Pending target run |
| Model/server raw JSON and logs | LOCAL-ONLY raw | Pending target run |
| Per-second thermal/power CSV | LOCAL-ONLY raw | Pending target run |
| Retrieval raw JSON | LOCAL-ONLY raw | Pending target run |
| Sanitized aggregate JSON | Public allowlist export | Pending target run |
| This report's measured tables | Public sanitized summary | Incomplete |

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

- exact target hardware/power captures
- verified llama.cpp Windows CUDA build and lifecycle tests
- at least two 4B-class candidates and one larger comparison
- structured JSON/tool reliability repetitions
- embedding candidate and retrieval quality tests
- Windows disk/corruption/deletion/backup tests
- authenticated browser transport/reconnect test
- React/localStorage revision integration prototype
- context 4K/8K reliability and memory curves
- 20–30 minute thermal soak per finalist
- concurrency 1/2 and cancellation resource release

## Final selection fields

These remain unresolved until target evidence passes `W0-GATE-1`:

| Decision | Current value |
|---|---|
| Recommended model | No selection |
| Recommended quantization | No selection |
| Recommended runtime/build | llama.cpp is a candidate; no build selected |
| Recommended context budget | No selection; 4K mandatory test, 8K comparison |
| Recommended concurrency | No selection; single client baseline |
| Retrieval | FTS5 baseline under evaluation; vector layer unproven |
| Transport | HTTP+SSE provisional baseline; no selection |
| Pairing/security | One-time pairing + expiring session concept; mechanism unselected |
| Revision/snapshot | Epoch + per-domain vector prototype; browser integration pending |
| Known limitations | 4 GB VRAM, 16 GB RAM; target measurements missing |
| Unresolved | Model/tool reliability, Windows lifecycle, thermals, embeddings/vector need |

## Final status

**NO MODEL SELECTION APPROVAL.** The report records measured synthetic results and blocked target gates. Provider-neutral v0.1 implementation exists under explicit user authorization, but no candidate may become the default/recommended runtime until target results complete this report and receive review.