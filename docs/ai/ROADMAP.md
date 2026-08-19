# Intelligence Engine roadmap and acceptance gates

Wave 0 is complete with no model selected. Architecture review has authorized a narrowly bounded v0.1.1 deterministic Core Today routing phase; no production runtime implementation is approved beyond the reviewed contract boundary.

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

**Integration result:** Wave 0 closed with no model selected. The provider-neutral deterministic/mock fallback remains authoritative.

## v0.1.1 — Deterministic Core Today interpretation — live accepted

- [x] AI-ADR-019 locks trusted `focus-today → get_today@1.0` routing
- [x] route, interpreter-request and response contracts frozen at `1.0`
- [x] `V011-INT-GATE-1` frozen before implementation
- [x] public synthetic contract/adversarial mutants executable
- [x] production deterministic router and interpreter path
- [x] security/adversarial implementation validation
- [x] deterministic/mock `V011-INT-GATE-1` evaluation
- [x] live integration acceptance through engine, same-origin proxy, pairing, SSE and tool callback
- [x] interpreter-only candidate matrix, run protocol and reporting format frozen
- [x] `I1-SYNTHETIC-1` corpus, manifest and semantic-review worksheet
- [x] disabled production-path runner, scorer, sanitizer and harness QA
- [x] target preflight authorization record and frozen-order PowerShell wrapper
- [ ] target-laptop Qwen3 and Phi preflight outcomes
- [ ] any full candidate run, operations report and selection review

**Current boundary:** preflight-only target execution is authorized and pending. Full/operations are machine-blocked and require later review. No real model is selected.

**Scope freeze:** Core Today only. Do not add memory, retrieval, Health, additional domains, writes, automation, remote processing or v0.2 work.

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