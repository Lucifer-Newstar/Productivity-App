# Wave 0 technical spike plan

## W0-01 — Domain revision prototype

Validate durable per-domain revision metadata, snapshot consistency, reload survival, restore/import handling and single-writer behavior. Simulate Core, Forge-only, Career-only and Forge→Career transactions. Pass criteria: no relevant mutation can produce an unchanged revision; failed persistence cannot publish a successful snapshot; revisions survive reload.

## W0-02 — Local pairing and transport

Compare HTTP+SSE with WebSocket using mock generation/tool events. Test loopback-only binding, origin allowlist, one-time pairing, short-lived session tokens, token replay, expiry, CSRF-like cross-origin requests, cancellation and reconnect. **Security blocker:** no real Kaizen records cross the boundary until the paired session passes tests.

## W0-03 — Engine lifecycle

Compare independently launched service and app-managed child-process approaches. Measure startup, status detection, model-load cancellation, browser close behavior, idle policy, crash recovery, orphan cleanup and duplicate-process prevention on Windows. Report expected user-visible states through `EngineStatus`.

## W0-04 — Generation runtime/model

Evaluate llama.cpp integration and candidate quantized instruct models without hard-coding a winner. Record TTFT, tokens/sec, RAM/VRAM, context ingestion, schema reliability, tool selection/arguments, grounding, cancellation, crash recovery and thermal soak.

## W0-05 — Embeddings/retrieval

Compare local embedding candidates independently. Evaluate SQLite FTS5 plus replaceable vector options for precision/recall, metadata filters, index size, Windows packaging, migrations, corruption recovery, backup/restore, source deletion and vector deletion.

## W0-06 — Context and agent budgets

Use Kaizen-specific fixtures to find context, output, iteration, tool-call and wall-time limits. Verify minimum-context behavior and deterministic fallback under limits.

## W0-07 — Structured response/evidence UX fixture

Feed mock valid, stale, partially stale, contradictory and invalid responses into the presentation contract. Verify source links, deterministic provenance, uncertainty labels and failure mapping without visual-design commitment.

## W0-08 — Memory lifecycle/storage

Test independent AI-state wipe versus Kaizen-state wipe, backup opt-in/out, restore, schema migration, corruption detection/rebuild, consent revocation, memory deletion and vector deletion. A missing AI store must never damage authoritative Kaizen state; a missing Kaizen source must orphan/expire dependent memory safely.

## W0-09 — Security/adversarial

Test malicious notes/JDs, fabricated IDs, unauthorized domains, session hijack, localhost assumptions, oversized payloads, malformed streams, memory poisoning and attempted action execution. Wave 0 has no write execution.

## Required target-machine manifest

```text
OS/build
CPU exact model
RAM capacity/speed
GPU exact model and VRAM
NVIDIA driver/CUDA compatibility
AC/battery power mode
thermal profile
llama.cpp build/flags
background load
```

## Exit criteria

Every spike has raw evidence, pass/fail, limitations, rejected alternatives and recommendation status. A candidate becomes architecture only through a reviewed selection report and ADR.