# Kaizen Intelligence Engine — architecture gate

**Status:** deterministic v0.1.1 authoritative application baseline; AI scope closed<br>
**Architecture package version:** 1.0-v0.1.1-application-baseline<br>
**Intelligence permissions:** READ / ANALYZE / SUGGEST only

The canonical future-development authority is [`MASTER-SPECIFICATION.md`](MASTER-SPECIFICATION.md), interpreted together with KAC-1, locked ADRs, versioned contracts and the current `ai` branch. Execution follows [`DELIVERY-PLAYBOOK.md`](DELIVERY-PLAYBOOK.md), and every completed step updates the living [`IMPLEMENTATION-LEDGER.md`](IMPLEMENTATION-LEDGER.md). Fragmented later instructions do not silently replace these sources.

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

## Active review milestone

- [`IMPLEMENTATION-LEDGER.md`](IMPLEMENTATION-LEDGER.md) — current status, completed work, blockers and next steps.
- [AI-ADR-019](adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md) — approved deterministic `get_today` routing and interpreter-only model authority.
- [AI-ADR-020](adrs/AI-ADR-020-DETERMINISTIC-APPLICATION-PROVIDER.md) — deterministic-only application provider composition after no-model closure.
- [AI-ADR-021](adrs/AI-ADR-021-LOCAL-MLOPS-EVALUATION-LAYER.md) — **proposed** local-first evaluation MLOps layer; not implemented; does not select a model.
- [`mlops/`](mlops/README.md) — architecture diagram, file-level plan and validation plan for that proposal.
- [`V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md`](V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md) — frozen route, evidence and output contracts.
- [`V0.1.1-INTERPRETER-EVALUATION.md`](V0.1.1-INTERPRETER-EVALUATION.md) — frozen interpreter-only gates and deterministic/mock result.
- [`../reports/AI-V0.1.1-IMPLEMENTATION-2026-08-19.md`](../reports/AI-V0.1.1-IMPLEMENTATION-2026-08-19.md) — implementation, security and evaluation closeout.
- [`v0.1.1-model-evaluation/`](v0.1.1-model-evaluation/README.md) — frozen candidate matrix, run protocol and report format; execution disabled.
- [`../reports/AI-V0.1.1-ACCEPTANCE-AND-MODEL-EVAL-DESIGN-2026-08-19.md`](../reports/AI-V0.1.1-ACCEPTANCE-AND-MODEL-EVAL-DESIGN-2026-08-19.md) — live acceptance and evaluation-design report.
- [`../reports/AI-V0.1.1-MODEL-HARNESS-2026-08-19.md`](../reports/AI-V0.1.1-MODEL-HARNESS-2026-08-19.md) — corpus/harness implementation and no-execution evidence.
- [`../reports/AI-V0.1.1-PREFLIGHT-AUTHORIZATION-2026-08-19.md`](../reports/AI-V0.1.1-PREFLIGHT-AUTHORIZATION-2026-08-19.md) — target preflight authorization; results pending.
- [`../reports/AI-V0.1.1-PREFLIGHT-INTAKE-HASH-FIX-2026-08-19.md`](../reports/AI-V0.1.1-PREFLIGHT-INTAKE-HASH-FIX-2026-08-19.md) — no-inference intake defect and streaming hash correction.
- [`../reports/AI-V0.1.1-PREFLIGHT-ATTACHMENT-MISMATCH-2026-08-19.md`](../reports/AI-V0.1.1-PREFLIGHT-ATTACHMENT-MISMATCH-2026-08-19.md) — incorrect attachments and safe local classifier workflow.
- [`../reports/AI-V0.1.1-PREFLIGHT-FINAL-2026-08-19.md`](../reports/AI-V0.1.1-PREFLIGHT-FINAL-2026-08-19.md) — final classified rejections and no-model closure.
- [`../reports/AI-V0.1.1-APPLICATION-INTEGRATION-REVIEW-2026-08-19.md`](../reports/AI-V0.1.1-APPLICATION-INTEGRATION-REVIEW-2026-08-19.md) — authoritative deterministic composition and live review.
- [`../reports/AI-BRANCH-PR-INTEGRATION-REVIEW-2026-08-19.md`](../reports/AI-BRANCH-PR-INTEGRATION-REVIEW-2026-08-19.md) — complete `ai`→`main` pre-merge review and PR body.
- [`DELIVERY-PLAYBOOK.md`](DELIVERY-PLAYBOOK.md) — mandatory pull/scope/test/privacy/docs/commit procedure.
- [`V0.1-INTEGRATION-VALIDATION.md`](V0.1-INTEGRATION-VALIDATION.md) — deterministic/mock foundation validated; real model unavailable.
- [`WAVE-0-REPORT.md`](WAVE-0-REPORT.md) — final no-model Selection Report.
- [`wave-0/PASS-FAIL-CRITERIA.md`](wave-0/PASS-FAIL-CRITERIA.md) — frozen pre-measurement gates.
- [`wave-0/CANDIDATE-MATRIX.md`](wave-0/CANDIDATE-MATRIX.md) — candidate identities, estimates and rationale.
- [`PRIVACY.md`](PRIVACY.md#public-repository-vs-local-only-boundary) — PUBLIC vs LOCAL-ONLY contract.

## Active implementation boundary

Deterministic Core Today is the authoritative application AI path. The server composition root exposes no model provider, model settings fail closed, and Home discloses deterministic/read-only operation. Wave 0 and I1 are closed with no model selected. AI capability scope is closed; ordinary non-AI application work may continue.