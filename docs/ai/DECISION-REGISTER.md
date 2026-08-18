# Architecture decision register

This register prevents exploratory choices from becoming accidental architecture.

## Locked decisions

| ID | Decision | Rationale |
|---|---|---|
| AI-ADR-001 | Independent Intelligence Engine process | Model/runtime replacement and AI testing must not depend on Next.js. |
| AI-ADR-002 | Client-mediated Domain Bridge for V1 | Current truth lives in browser Context/local persistence; avoid premature state migration. |
| AI-ADR-003 | Tools use versioned plain contracts, never React imports | Decouples tools from UI and storage implementation. |
| AI-ADR-004 | Separate generation and embedding providers | Different workloads, models and lifecycles. |
| AI-ADR-005 | Capability-aware orchestration | Never assume tool calling, schema or context capability. |
| AI-ADR-006 | Local-first with LOCAL/HYBRID/REMOTE architecture | Local is initial mode; future modes must not require an engine rewrite. |
| AI-ADR-007 | Deterministic analytics remain authoritative | Models interpret; they do not replace existing formulas. |
| AI-ADR-008 | Evidence/freshness in significant responses | Recommendations must be auditable. |
| AI-ADR-009 | Hybrid retrieval | Exact structure, full text, semantics, recency and relationships have distinct value. |
| AI-ADR-010 | Pattern memory starts in shadow mode | Unsupported patterns must not become user facts. |
| AI-ADR-011 | Bounded agent loop | Hard caps on iterations, tools, context and execution time. |
| AI-ADR-012 | Writes unavailable before v0.4 and always approval-gated | No direct model-to-store path. |
| AI-ADR-013 | Health and remote processing require separate opt-in | Sensitive-domain and trust-boundary consent must be explicit. |
| AI-ADR-014 | First slice is grounded `get_today`, not generic chat | Proves the real architecture and user value. |
| AI-ADR-015 | Career–Forge evidence graph is formal | Project work becomes verified career evidence without invented outcomes. |
| AI-ADR-016 | Constitution is versioned and provider-independent | Shared behavior cannot live only in mutable prompts. |
| AI-ADR-017 | Source-of-truth precedence is explicit | Memory and model inference can never override current authoritative records or deterministic analytics. |
| AI-ADR-018 | v0.1 may ship provider-neutral before model selection | Explicit user authorization allows contracts/gateway/read-only vertical slice; no model candidate becomes architecture and all writes remain prohibited. |
| [AI-ADR-019](adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md) | v0.1.1 routes Core Today deterministically and limits the model to evidence interpretation | Wave 0 proved model-selected tools unreliable; trusted Kaizen code selects `get_today@1.0`, while the provider receives no tools or extra context. |

## Source-of-truth precedence

**LOCKED DECISION**

```text
Current authoritative domain record
    > deterministic derived analytics from current records
    > explicit current user instruction/confirmation
    > user-confirmed AI memory
    > system-generated episodic memory
    > candidate/pattern memory
    > AI inference
    > AI recommendation
```

This order is about factual conflict, not authorization: the Constitution and hard policy still govern whether an operation is permitted. A confirmed memory can guide interpretation but cannot overwrite a newer domain record. When a record and memory conflict, Kaizen uses the record, marks the memory for validation/contest, and discloses the conflict when relevant. Deterministic analytics must identify their input snapshot; analytics from stale records do not outrank newer records.

Example: a Forge record says the deadline is August 22 while a confirmed memory says the user intended August 20. August 22 is the current deadline; August 20 may be presented only as an earlier intention.

## Proposed decisions

| ID | Proposal | Review concern |
|---|---|---|
| AI-PROP-001 | TypeScript for gateway/orchestration service | Strong repository fit; compare runtime ecosystem needs during Wave 0. |
| AI-PROP-002 | JSON Schema as wire-schema source | Must generate or validate TypeScript consistently. |
| AI-PROP-003 | Loopback HTTP/SSE transport initially | Compare SSE with WebSocket for bidirectional tool requests. |
| AI-PROP-004 | Structured telemetry without raw prompt retention by default | Confirm debugging and evaluation workflow. |
| AI-PROP-005 | Seven-day default conversation retention | Requires product/privacy review. |

## Requires technical spike

- `llama.cpp` integration and process lifecycle on the target RTX 3050 laptop
- Candidate instruct models and quantizations
- Local embedding model/runtime
- SQLite FTS5 and replaceable vector-layer options
- SSE versus WebSocket tool-session transport
- Context budget that remains reliable under 16 GB RAM
- GPU offload, concurrency and thermal behavior
- JSON-constrained generation/tool reliability on candidate models
- Browser snapshot hashing/version strategy at scale

## Deferred decisions

- Remote provider implementation
- Multi-user tenancy and cloud synchronization
- Autonomous/background actions
- Vision and voice modalities
- Fine-tuning/LoRA
- Permanent vector technology
- Permanent default generation or embedding model
- Moving authoritative Kaizen state out of the browser
- Parallel agents or parallel tool execution

## Change process

A locked decision changes only through a new ADR containing context, alternatives, decision, security/privacy effect, migration impact and evaluation updates.