# Kaizen Intelligence Engine — architecture gate

**Status:** architecture approved with review conditions resolved; Wave 0 preparation active<br>
**Architecture package version:** 0.2-review<br>
**Production AI implementation:** not started

The Kaizen Intelligence Engine is an independent, local-first intelligence layer above Kaizen's deterministic domains. Kaizen data and algorithms remain authoritative; models interpret, plan and propose through controlled tools; the user remains the final authority.

## Decision labels

Every design choice in this package uses one of four labels:

| Label | Meaning |
|---|---|
| **LOCKED DECISION** | Approved architecture; changing it requires an ADR. |
| **PROPOSED DECISION** | Recommended design awaiting architecture review. |
| **REQUIRES TECHNICAL SPIKE** | Must be measured or prototyped before selection. |
| **DEFERRED DECISION** | Intentionally outside the current release. |

## Architecture-gate deliverables

| # | Deliverable | Document |
|---:|---|---|
| 1 | Product vision and boundaries | [PRODUCT-VISION.md](PRODUCT-VISION.md) |
| 2 | AI Constitution | [CONSTITUTION.md](CONSTITUTION.md) |
| 3 | Architecture decisions | [DECISION-REGISTER.md](DECISION-REGISTER.md) |
| 4 | Domain Bridge contracts | [DOMAIN-BRIDGE.md](DOMAIN-BRIDGE.md) |
| 5 | Snapshot/versioning rules | [DOMAIN-BRIDGE.md](DOMAIN-BRIDGE.md#snapshot-and-version-contract) |
| 6 | Generation provider | [PROVIDERS.md](PROVIDERS.md) |
| 7 | Embedding provider | [PROVIDERS.md](PROVIDERS.md#embedding-provider) |
| 8 | Capability registry | [PROVIDERS.md](PROVIDERS.md#capability-registry) |
| 9 | Streaming/transport | [ARCHITECTURE.md](ARCHITECTURE.md#transport-and-session-flow) |
| 10 | Structured responses | [RESPONSES.md](RESPONSES.md), [UX-CONTRACTS.md](UX-CONTRACTS.md) |
| 11 | Evidence/freshness | [RESPONSES.md](RESPONSES.md#evidence-and-freshness), [UX-CONTRACTS.md](UX-CONTRACTS.md#intelligence-response-presentation) |
| 12 | Tools and permissions | [TOOLS.md](TOOLS.md) |
| 13 | Context orchestration | [CONTEXT-ORCHESTRATION.md](CONTEXT-ORCHESTRATION.md) |
| 14 | Memory lifecycle | [MEMORY.md](MEMORY.md) |
| 15 | Hybrid retrieval | [RETRIEVAL.md](RETRIEVAL.md) |
| 16 | Agent loop | [AGENT-LOOP.md](AGENT-LOOP.md) |
| 17 | Content trust and policy | [SECURITY.md](SECURITY.md#content-trust-boundaries), [POLICIES.md](POLICIES.md) |
| 18 | Privacy/consent | [PRIVACY.md](PRIVACY.md) |
| 19 | Actions/approval | [ACTION-CENTER.md](ACTION-CENTER.md) |
| 20 | Audit/undo | [ACTION-CENTER.md](ACTION-CENTER.md#audit-verification-and-undo) |
| 21 | Evaluation | [EVALUATION.md](EVALUATION.md) |
| 22 | Model benchmark | [EVALUATION.md](EVALUATION.md#runtime-benchmark) |
| 23 | Release acceptance | [ROADMAP.md](ROADMAP.md) |
| 24 | Career–Forge graph | [DOMAIN-INTELLIGENCE.md](DOMAIN-INTELLIGENCE.md#careerforge-evidence-graph) |

## Review order

1. [PRODUCT-VISION.md](PRODUCT-VISION.md)
2. [CONSTITUTION.md](CONSTITUTION.md)
3. [DECISION-REGISTER.md](DECISION-REGISTER.md)
4. [ARCHITECTURE.md](ARCHITECTURE.md)
5. Contracts: Domain Bridge, providers, responses and tools
6. State: context, retrieval and memory
7. Controls: agent, security, privacy and actions
8. Evaluation, [observability](OBSERVABILITY.md), domain intelligence, roadmap and [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md)

## Gate rule

Architecture review authorizes **Wave 0 preparation and controlled benchmark/prototype spikes only** under [`wave-0/README.md`](wave-0/README.md). It does not authorize production AI features, user-state mutation, permanent model/vector/transport/runtime selection, or changes to authoritative application architecture. Any candidate selection requires a reviewed selection report and ADR before production implementation.