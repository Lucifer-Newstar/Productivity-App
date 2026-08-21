# Architecture open questions and technical spikes

No item here may be silently guessed during implementation.

## Requires technical spike

| ID | Question | Evidence required |
|---|---|---|
| SPIKE-01 | How should llama.cpp be managed? | Compare server vs child process, startup, health, cancellation, crash recovery and packaging. |
| SPIKE-02 | Which instruct models/quantizations fit the RTX 3050/16 GB laptop? | Reproducible performance, tool/schema, grounding, safety and thermal benchmark. |
| SPIKE-03 | Which local embedding model/runtime? | Retrieval quality, dimensions, RAM/VRAM, batching, license and latency. |
| SPIKE-04 | Which local retrieval store? | SQLite FTS5/vector alternatives on Windows: packaging, filters, speed, migrations, deletion and backup. |
| SPIKE-05 | SSE or WebSocket for agent/tool sessions? | Bidirectional complexity, reconnection, cancellation, CSP and failure behavior. |
| SPIKE-06 | How are local clients paired/authenticated? | Threat model and usable first-run credential lifecycle. |
| SPIKE-07 | Snapshot identity strategy? | Cost and correctness of hash, revision vector or generated ID across large slices. |
| SPIKE-08 | What context/agent limits work locally? | Reliability/latency curves across candidate models and realistic scenarios. |
| SPIKE-09 | Can constrained JSON replace unreliable native tool calling? | Schema and argument accuracy comparison per model. |
| SPIKE-10 | What concurrency is safe? | RAM/VRAM, responsiveness and thermal soak on target hardware. |

## Proposed decisions requiring review

1. TypeScript engine service.
2. JSON Schema as canonical wire schema.
3. Loopback HTTP + SSE initial transport.
4. Structured telemetry without raw prompt retention.
5. Seven-day default conversation retention.
6. Pattern promotion thresholds and whether confirmation is always required.
7. Action audit retention duration.
8. Deterministic compression versus model-assisted long-document compression.
9. AI-ADR-021 local evaluation MLOps: approve metadata/experiment/gate layer, reject, or defer; Docker eval runtime yes/no. Does not include application model activation.

## Deferred decisions

- Remote provider and hybrid routing details
- Cloud sync/multi-user identity
- Autonomous or scheduled agent execution
- Vision/voice
- Fine-tuning/LoRA
- Permanent model and vector backend
- Migration of authoritative state from the browser
- Parallel agents/tools
- Local AI-data encryption and key custody unless moved forward by privacy review

## Questions for architecture review

- Is the initial intelligence service TypeScript-only, or should runtime/model tooling justify another language boundary?
- Must all pattern-memory promotion require user confirmation through v1.0?
- What is an acceptable first-token and complete-answer latency on battery and AC power?
- What exact GPU/VRAM configuration is the target laptop?
- Should Career or Forge ship first after global intelligence?
- Which action classes, if any, should remain permanently non-executable?
- Should AI action audits be included in normal Kaizen backups?
- What retention is acceptable for candidate Health memories?

## Gate

Wave 0 may begin only after this architecture package is reviewed and explicitly approved. Wave 0 exists to answer spikes; it must not convert benchmark candidates into product commitments without a selection report.