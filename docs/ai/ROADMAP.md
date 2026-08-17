# Intelligence Engine roadmap and acceptance gates

Documentation approval is required before Wave 0. Completion of this roadmap document does not authorize implementation.

## Wave 0 — Architecture and feasibility seal

- Approve architecture and ADRs
- Domain Bridge prototype design and contract fixtures
- llama.cpp connectivity/process spike
- generation/embedding provider spike
- local storage/retrieval comparison
- transport/pairing spike
- hardware benchmark protocol and candidate shortlist
- threat model and privacy review

**Exit:** feasibility evidence resolves the required spikes; locked architecture is updated by ADR; no permanent model/backend is chosen without results.

## v0.1 — Local foundation

- independent engine service
- provider registry and capability negotiation
- streaming, cancellation and structured validation
- prompt/Constitution versioning
- minimal Intelligence UI
- `get_today@1.0` Domain Bridge tool
- source-linked “What should I focus on?” response
- baseline evaluation harness

**Exit:** one useful end-to-end local answer uses current browser state and deterministic Next Action, with valid evidence and no state mutation.

## v0.2 — Kaizen Understands

- read-only domain tools
- context orchestration
- hybrid retrieval
- semantic/episodic memory
- candidate pattern memory in shadow mode
- permission and Health-consent controls
- freshness and stale-state behavior

**Exit:** grounded answers use relevant current records and inspectable memory while excluding unrelated/unconsented domains.

## v0.3 — Kaizen Reasons

- bounded agent loop
- Daily Brief, Next Action and Weekly Review
- momentum, conflict and goal-alignment interpretation
- cross-domain evidence UI
- adversarial and constitutional regression gates

**Exit:** Kaizen finds useful cross-domain insights that are difficult to derive from one section, without unsupported claims.

## v0.4 — Kaizen Acts

- proposal and command schemas
- Action Center and policy engine
- snapshot checks, dry run and explicit approval
- idempotent execution, verification, audit and undo

**Exit:** selected approved changes execute once, verify correctly, reject stale/tampered proposals and remain auditable.

## v0.5 — Domain Intelligence

Recommended order:

1. Career
2. Forge
3. Career–Forge evidence graph
4. Workout
5. Health
6. Workout–Health reasoning
7. Afterglow

**Exit:** every enabled domain meets its own grounding, safety and usefulness criteria without duplicating deterministic logic.

## v1.0 — Kaizen Learns

- feedback and outcomes
- memory validation/contradiction handling
- safe pattern promotion
- long-term personalization
- evaluation regression history
- fine-tuning feasibility review only after evidence

**Exit:** the full “What should I do today?” flow retrieves, reasons, explains, proposes, obtains approval, executes, verifies, records and learns from explicit feedback locally by default.

## Release-wide stop conditions

Stop/review when safety thresholds regress, unauthorized data appears, source verification fails, action replay is possible, Health boundaries fail, the target hardware cannot meet agreed latency/resource limits, or deterministic fallback is broken.