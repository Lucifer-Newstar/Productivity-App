# Wave 0 Selection Report

**Status:** `INCOMPLETE — TARGET HARDWARE AND MODEL RESULTS REQUIRED`<br>
**Report version:** 0.1<br>
**Date:** 2026-08-17<br>
**Production `get_today()` authorization:** **BLOCKED**

## Executive decision

Wave 0 infrastructure and synthetic prototypes are viable, but no generation model, quantization, embedding model, vector backend or final transport is selected. The target is now identified as an ASUS TUF Gaming A15 FA506NCR with Ryzen 7 7435HS, RTX 3050 Laptop GPU (4 GB GDDR6, 60 W/75 W Dynamic Boost) and 16 GB DDR5. Machine-generated Windows, driver, memory-speed, storage, model, power and thermal results are still required. Production feature work remains blocked until those measurements are attached and this report is reviewed.

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

The Arena sandbox remains a non-target 2-vCPU/1.9 GiB environment without NVIDIA. See [TARGET-HARDWARE-CAPTURE.md](TARGET-HARDWARE-CAPTURE.md) and [TARGET-RUNBOOK.md](TARGET-RUNBOOK.md).

## Measured prototype results

### Revision/snapshot prototype

- 9 assertions passed.
- Demonstrated per-domain monotonic counters, no-op behavior, cross-domain Forge+Career transaction, failed transaction behavior, reload persistence, revision-vector snapshot IDs, stable-capture retry and epoch rotation after corrupt metadata.
- Limitation: temporary-file prototype; no React/localStorage integration or multi-tab lock yet.

### Pairing/session prototype

- 7 security assertions passed.
- Rejected malicious origin and incorrect code.
- Enforced one-time pairing, authenticated session, token expiry and no unauthenticated session access.
- Tokens are stored as hashes in the prototype.
- Limitation: console-displayed pairing code is a test channel, not a selected product pairing design.

### SQLite FTS5 baseline

Synthetic in-memory corpus: 20,000 Kaizen-like records, 200 domain-filtered queries.

| Metric | Result |
|---|---:|
| Index build | 63.166 ms |
| Mean query | 3.869 ms |
| p50 | 3.836 ms |
| p95 | 3.959 ms |
| Maximum | 6.270 ms |
| Source deletion | verified |

This supports SQLite FTS5 as a serious lexical/structured candidate. It does **not** select SQLite as the vector backend: no embeddings, disk I/O, Windows locking, antivirus behavior, corruption or backup test has run.

### SSE vs WebSocket mock transport

Twenty loopback runs, 200 tiny events per run:

| Metric | SSE | WebSocket |
|---|---:|---:|
| Mean delivery | 4.732 ms | 5.430 ms |
| p50 | 4.441 ms | 5.432 ms |
| p95 | 5.342 ms | 5.664 ms |
| WebSocket bidirectional round trip | — | 0.133 ms mean |

The differences are negligible relative to model latency. This microbenchmark does not select a transport. HTTP+SSE remains the simpler provisional preference because streaming is predominantly server→browser and tool results can use authenticated HTTP callbacks. Browser reconnect, session recovery, pairing, CSP and callback measurements are still required before selection.

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

The evaluation dataset currently checks:

- grounded priority selection with valid IDs
- low confidence/uncertainty when velocity evidence is absent
- prompt injection inside imported content
- minimum-tool `get_today` selection
- refusal to invent unavailable write tools

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

## Final status

**NO SELECTION APPROVAL.** The report records measured synthetic results and the exact blocked gates. Production `get_today()` must not begin until target-machine results complete this report and the resulting recommendations/ADRs receive explicit review.