# File-level implementation plan (after ADR review)

**Status:** not authorized to land code. This is the review artifact required before any `ai/mlops/**` source.

Implementation must follow `architecture → contract → implementation → tests → docs → focused commit` ([DELIVERY-PLAYBOOK](../DELIVERY-PLAYBOOK.md)).

## Phase 0 — already done (this branch)

Documentation only:

- `docs/ai/adrs/AI-ADR-021-LOCAL-MLOPS-EVALUATION-LAYER.md`
- `docs/ai/mlops/*`
- `docs/reports/AI-MLOPS-EVALUATION-LAYER-PLAN-2026-08-21.md`
- index / ledger / register updates

No TypeScript, Python, Docker, or packaging files in Phase 0.

## Phase 1 — contracts (after approval)

Create schemas and types. Do not spawn models.

| Path | Purpose |
|---|---|
| `ai/mlops/README.md` | Engine-side pointer to docs |
| `ai/mlops/contracts/artifact.v1.json` | JSON Schema: id, family, params, quant, license, sha256, sourceClass=`local-file` |
| `ai/mlops/contracts/experiment.v1.json` | protocolId, matrixId, authorizationId, corpusSha256, runtimeSha256, stage, startedAt |
| `ai/mlops/contracts/gate-verdict.v1.json` | gateId, passed, metric allowlist |
| `ai/mlops/contracts/promotion-state.v1.json` | enum without `application-active` |
| `ai/src/contracts/mlops.ts` | TypeScript types generated/kept in sync with schemas |

Import adapters (read-only) from:

- `ai/evaluation/v0.1.1/model-phase/candidates.v1.json`
- `ai/evaluation/v0.1.1/model-phase/results-public/*.json`
- `ai/evaluation/v0.1.1/results-public/deterministic-mock-implementation.json`

## Phase 2 — registry and experiments

| Path | Purpose |
|---|---|
| `ai/mlops/registry.ts` | Load catalog; refuse missing sha256/license |
| `ai/mlops/experiments.ts` | Append-only experiment index under `results-local/` |
| `ai/mlops/promotion.ts` | Pure state machine; cannot emit application-active |
| `ai/mlops/gates.ts` | Wrap `gates.v0.1.1.json` + identity/loopback/authorization checks |
| `ai/mlops/metrics.ts` | Call existing sanitizer; never copy raw text |

**Forbidden edits in this phase:** `ai/src/providers/registry.ts`, `ai/src/config.ts`, `authorization.v2.json`, `candidates.v1.json`, `packaging/desktop/main.cjs`.

## Phase 3 — CLI glue over existing harness

| Path | Purpose |
|---|---|
| `ai/mlops/cli.ts` | `catalog`, `record-experiment`, `show-promotion` |
| `ai/package.json` scripts | `qa:mlops` only (no `run:model` that bypasses I1_EXECUTION_DISABLED) |

The CLI may *invoke* `npm run qa:v0.1.1:model-harness` and `eval:v0.1.1`. It must not set `KAIZEN_I1_EXECUTION_ACK` or flip authorization stages.

## Phase 4 — optional Docker eval runtime

| Path | Purpose |
|---|---|
| `ai/mlops/docker/Dockerfile.eval-runtime` | Hash-pinned base + llama-server install **or** copy from ignored local cache; no GGUF |
| `ai/mlops/docker/compose.eval.yml` | `llama-eval` + `harness`; `127.0.0.1:PORT:PORT`; profiles `eval` |
| `ai/mlops/docker/.dockerignore` | Exclude results-local, weights, Kaizen state |
| `.gitignore` | `ai/mlops/results-local/`, `ai/mlops/config/*.local.json` |

Compose is developer-optional. CI must not pull models or start GPU containers. Hosted CI stays CPU, no model execution (existing workflow rule).

## Phase 5 — tests

| Path | Purpose |
|---|---|
| `ai/test/mlopsRegistry.test.ts` | Import I1 public aggregates → `preflight-rejected` |
| `ai/test/mlopsPromotion.test.ts` | State machine rejects `application-active` |
| `ai/test/mlopsIsolation.test.ts` | registry.ts source does not import mlops |
| `ai/mlops/qa_mlops.py` or `qa_mlops.ts` | Docker file binds loopback; no k8s YAML in repo |

## Explicit non-files

Do not add:

- `k8s/`, Helm, Terraform, cloud Docker registry configs
- feature-store or vector-db containers
- training jobs
- frontend MLOps UI in v0.1.1
- Health evaluation datasets

## Suggested commits after approval (not this branch)

1. `feat(ai): add MLOps evaluation contracts and promotion states`
2. `test(ai): lock MLOps isolation from application registry`
3. `feat(ai): optional loopback Compose for eval runtime`
4. `docs(ai): record MLOps implementation closeout`

Phase 0 on this branch is docs-only: `docs(ai): propose local MLOps evaluation layer`.
