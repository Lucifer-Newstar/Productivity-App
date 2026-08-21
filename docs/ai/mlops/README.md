# Local-first Intelligence MLOps (proposed)

**Status:** documentation only — awaiting review of [AI-ADR-021](../adrs/AI-ADR-021-LOCAL-MLOPS-EVALUATION-LAYER.md). No code in this package yet.

This package specifies a lightweight MLOps layer **around** the existing v0.1.1 / Wave 0 evaluation infrastructure. It does not select a model and does not change the deterministic application provider.

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Component diagram and data flow |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | File-level plan after ADR approval |
| [VALIDATION-PLAN.md](VALIDATION-PLAN.md) | Gates, tests and stop conditions |

## Reused (do not rewrite)

| Existing asset | Role |
|---|---|
| `ai/evaluation/v0.1.1/evaluate.ts` + `gates.v0.1.1.json` | Deterministic/mock `V011-INT-GATE-1` |
| `ai/evaluation/v0.1.1/model-phase/candidates.v1.json` | Frozen I1 identities |
| `ai/evaluation/v0.1.1/model-phase/protocol.v1.json` | `I1-RUN-1` |
| `ai/evaluation/v0.1.1/model-phase/authorization.v2.json` | All stages closed |
| `ai/evaluation/v0.1.1/model-phase/runner.ts` | Disabled production-path runner |
| `ai/evaluation/v0.1.1/model-phase/scorer.py` | Automatic metrics |
| `ai/evaluation/v0.1.1/model-phase/sanitizer.py` | Public allowlist projection |
| `ai/evaluation/v0.1.1/model-phase/fileHash.ts` | Streaming SHA-256 |
| `ai/evaluation/v0.1.1/model-phase/corpus.v1.json` | `I1-SYNTHETIC-1` |
| `ai/wave0/` | Closed selection harness |
| `ai/src/observability/telemetry.ts` | In-process aggregate counters |
| `ai/src/providers/registry.ts` | Deterministic-only production registry |

## Current measured promotion snapshot

Imported from public I1 aggregates — not a new run:

| Artifact id | Promotion state |
|---|---|
| `qwen3-4b-instruct-2507-q4km` | `preflight-rejected` |
| `phi-4-mini-instruct-q4km` | `preflight-rejected` |
| deterministic mock Core Today | **application authority** (not an MLOps-promoted model) |

## Non-goals

Kubernetes, cloud, distributed training, feature stores, vector databases, production model activation, Health, writes, v0.2, Electron packaging.
