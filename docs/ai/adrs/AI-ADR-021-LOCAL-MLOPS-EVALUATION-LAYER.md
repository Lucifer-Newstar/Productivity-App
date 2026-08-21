# AI-ADR-021 — Lightweight local-first MLOps for Intelligence evaluation only

**Status:** PROPOSED DECISION — awaiting architecture review. Do not implement code until this ADR is approved.
**Drafted:** 2026-08-21
**Applies to:** Intelligence Engine evaluation/metadata only (not application composition)
**Does not supersede:** [AI-ADR-019](AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md), [AI-ADR-020](AI-ADR-020-DETERMINISTIC-APPLICATION-PROVIDER.md), `I1-PREFLIGHT-CLOSURE-1`
**Related:** [`../EVALUATION.md`](../EVALUATION.md), [`../v0.1.1-model-evaluation/README.md`](../v0.1.1-model-evaluation/README.md), [`../mlops/README.md`](../mlops/README.md)

## Context

v0.1.1 already has a frozen interpreter-model evaluation package:

- candidate matrix `I1-CANDIDATES-1` (`ai/evaluation/v0.1.1/model-phase/candidates.v1.json`)
- run protocol `I1-RUN-1` and machine authorization `authorization.v2.json` (all stages `false`)
- disabled production-path runner, scorer, sanitizer, streaming SHA-256, corpus `I1-SYNTHETIC-1`
- public aggregates only after allowlist sanitization
- application composition locked to the deterministic provider (AI-ADR-020)

What is missing is a **single local-first MLOps vocabulary** over that package: artifact registry metadata, reproducible experiment records, automated evaluation orchestration, quality/resource/security gates, promotion *states*, and privacy-safe metrics. Operators currently reconstruct lineage from several JSON files and scripts.

The user requested this layer for the Intelligence Engine only. Production model activation, Kubernetes, cloud, distributed training, feature stores, vector databases, Health AI, writes, and v0.2 remain prohibited.

## Alternatives considered

1. **Activate llama.cpp in `ProviderRegistry` and treat MLOps as production serving.** Rejected. AI-ADR-020 and `I1-PREFLIGHT-CLOSURE-1` close application model paths. Both I1 candidates are `REJECTED-PREFLIGHT`.
2. **Adopt a cloud MLOps stack (MLflow/Kubeflow/feature store/vector DB).** Rejected. Conflicts with local-first, public-repo privacy, and the explicit non-goals.
3. **Rewrite Wave 0 / I1 harnesses.** Rejected. Frozen gates, corpus hashes and closed authorization must remain reproducible.
4. **Metadata + experiment + gate + promotion-state layer that wraps existing I1/Wave 0 artifacts; Docker/Compose only for isolated evaluation runtimes.** Selected (proposed).

## Decision (proposed)

Add a lightweight **evaluation MLOps layer** that records and gates Intelligence evaluation. It must not change what the application runs.

### In scope

- Artifact registry **metadata** (family, parameters, quantization, license, SHA-256, source URI class). No weights in Git.
- Reproducible **experiment records** (protocol id, corpus hash, runtime hash, authorization id, stage, timestamps).
- Automated evaluation by **calling existing** `evaluate.ts`, `runner.ts`, `scorer.py`, `sanitizer.py`, Wave 0 harness — not replacing them.
- Quality, resource and security **gates** (`V011-INT-GATE-1`, `W0-GATE-2`, identity/hash, loopback, license, execution-disabled).
- Promotion **states** that never include application activation.
- Privacy-safe **metrics** (PUBLIC-SANITIZED-AGGREGATE only in Git).
- Docker/Compose **only** for optional reproducible evaluation/runtime isolation (loopback llama-server + harness). Not packaged Windows/desktop production.

### Out of scope / forbidden

- Changing `ai/src/providers/registry.ts` or `ai/src/config.ts` fail-closed rules
- Setting `authorization.v2.json` stages to `true` or reopening `I1-CANDIDATES-1`
- Kubernetes, cloud, distributed training, feature stores, vector databases
- Production model activation, remote providers, Health, writes, memory, retrieval, v0.2
- Electron / `packaging/desktop/main.cjs`
- Committing weights, raw attempts, host paths, or unsanitized telemetry

### Promotion states (proposed)

```text
catalogued
  → hash-verified
  → stage-blocked          # current I1 default (authorization false)
  → preflight-rejected     # Qwen3 and Phi already here
  → preflight-passed       # still not application-eligible
  → full-eval-rejected
  → full-eval-passed       # still not application-eligible
  → archived
```

There is **no** `application-active` or `production-promoted` state. Moving a model into application composition requires a **new** ADR that explicitly supersedes AI-ADR-020, plus a new matrix/protocol/authorization. This MLOps layer cannot perform that promotion.

### Deterministic authority

The application Intelligence path remains Mock/deterministic Core Today. MLOps metadata must not be read by the gateway composition root.

## Security and privacy effect

- Extends the existing PUBLIC vs LOCAL-ONLY boundary with `ai/mlops/results-local/` (gitignored) if implementation is later approved.
- Docker evaluation runtime binds **127.0.0.1 only**; no credentials, user Kaizen state, or model weights in images.
- Sanitizer allowlist remains the only path into `results-public/`.
- No new network destination, no remote processing, no Health consent change.

## Migration and compatibility

- Existing I1 files stay frozen and authoritative for that cycle.
- New schemas version independently (`mlops.artifact@1.0`, `mlops.experiment@1.0`).
- Historical public aggregates remain valid inputs to registry import (read-only).
- Application startup, pairing, SSE and Home disclosure are unchanged.

## Evaluation and acceptance (when implementation is later authorized)

See [`../mlops/VALIDATION-PLAN.md`](../mlops/VALIDATION-PLAN.md). Minimum:

- deterministic provider still the sole application registry entry
- model env vars still fail closed
- I1 authorization stages remain false unless a *future* reviewed authorization file says otherwise
- no Docker in the Windows installer or desktop shell
- privacy scan and `qa:docs` green
- new MLOps QA does not spawn models unless disabled-by-default gates match today’s runner

## Change rule

Approval of this ADR authorizes **implementation of the metadata/evaluation layer only**. It does not authorize model execution, candidate expansion, or application provider changes. Those still need a separate ADR and machine authorization.
