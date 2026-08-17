# Kaizen Intelligence Engine architecture gate — 2026-08-17

## Scope

Consolidated the original AI development brief, architecture review and Kaizen AI Constitution into an official documentation package. This work contains no runtime AI implementation and does not authorize Wave 0.

## Locked direction

- Independent local-first Intelligence Engine
- Client-mediated Domain Bridge while browser state is authoritative
- Versioned typed contracts; no React imports in tools
- Separate generation and embedding providers
- Capability-aware orchestration
- Evidence, uncertainty and freshness in significant responses
- Hybrid retrieval and lifecycle-managed memory
- Bounded agent loop and content-trust boundaries
- Health and remote processing separately opt-in
- Future writes only through stale-safe, approval-bound, idempotent proposals with audit and undo
- Grounded `get_today` first vertical slice
- Formal Career–Forge evidence graph

## Deliberately unresolved

Model, quantization, embedding model, vector/search backend, transport, pairing, snapshot identity, context limits and concurrency remain technical spikes. Remote providers, autonomous actions, multimodality and fine-tuning remain deferred.

## Documentation

The package is indexed at [`../ai/README.md`](../ai/README.md), which maps every one of the 24 architecture-gate deliverables to its defining document.

## Verification

Documentation QA verifies required files, local links, all four decision labels, 24-deliverable coverage, the Constitution/Domain Bridge boundary and the explicit documentation-only gate.
