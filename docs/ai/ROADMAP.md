# Intelligence Engine roadmap and acceptance gates

Architecture review has authorized Wave 0 preparation and controlled feasibility spikes. Production AI feature implementation remains blocked until the Wave 0 selection report is reviewed.

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

## v0.1 — Local foundation — implemented

- [x] independent engine service
- [x] provider registry and capability negotiation
- [x] streaming, cancellation and structured validation
- [x] prompt/Constitution versioning
- [x] paired local Intelligence UI
- [x] `get_today@1.0` Domain Bridge tool
- [x] source-linked “What should I focus on?” response
- [x] baseline and Wave 0 evaluation harnesses
- [x] fixed same-origin Next.js transport proxy
- [x] loopback pairing/session/origin security

**Exit status:** executable mock-backed end-to-end flow uses current browser state and deterministic Next Action with verified sources and no state mutation. Real candidate quality/performance remains gated by the incomplete Wave 0 report.

**Integration freeze:** Wave 0 closed with no model selected. Do not start v0.2 tools, memory, retrieval, Health or cross-domain work until the no-model result and deterministic-routing/defer/remote alternatives receive explicit scope review.

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