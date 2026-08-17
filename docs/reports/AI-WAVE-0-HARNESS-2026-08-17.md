# AI Wave 0 harness — 2026-08-17

## Scope

Started technical validation on the persistent `ai` branch without implementing production Intelligence features.

## Added

- Cross-platform hardware/NVIDIA/power capture
- Explicit disabled candidate matrix; no automatic model downloads
- llama-server lifecycle/streaming benchmark harness
- Structured JSON, grounding, prompt-injection and tool-selection scenarios
- NVIDIA thermal/VRAM/power sampling
- SQLite FTS5 synthetic baseline
- SSE/WebSocket loopback protocol probe
- Per-domain revision/epoch/snapshot prototype
- One-time local pairing/session prototype
- Deterministic mock llama-server for end-to-end harness QA
- Incomplete Wave 0 Selection Report with target-hardware blockers

## Sandbox measurements

The target manifest now records an ASUS TUF Gaming A15 FA506NCR with Ryzen 7 7435HS, RTX 3050 Laptop GPU (4 GB GDDR6, 60 W/75 W Dynamic Boost) and 16 GB DDR5. Exact Windows build, memory speed, storage layout, driver, power profile and model telemetry still require local capture. The sandbox remains a 2-vCPU Intel Xeon KVM environment with approximately 1.9 GiB RAM and no NVIDIA runtime, so it is not valid target-model evidence.

Synthetic baselines:

- Revision prototype: 17 assertions
- Pairing prototype: 13 security assertions
- Wave 0 harness: 23 checks
- SQLite FTS5: 20,000 records; p95 approximately 3.96 ms in memory
- 200-event transport microbenchmark: SSE p95 approximately 5.34 ms; WebSocket p95 approximately 5.66 ms

These results validate harness mechanics only. Model, embedding, thermal, Windows lifecycle and final transport selection remain blocked on the target RTX 3050 laptop.

## Boundary

No model, vector store, transport or runtime candidate has been selected. Production `get_today()` remains prohibited pending completed target measurements and explicit review.
