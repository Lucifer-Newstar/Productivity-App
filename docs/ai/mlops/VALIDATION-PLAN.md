# Validation plan (proposed MLOps layer)

Run after implementation is authorized. Phase 0 (this branch) only needs documentation QA.

## Phase 0 — this documentation branch

```bash
cd frontend
npx tsc --noEmit
npm run qa:docs
```

Must remain true:

- `docs/ai/README.md` still contains `no model selected`
- `authorization.v2.json` stages all `false`
- `ai/src/providers/registry.ts` still constructs only `MockGenerationProvider`
- no new Docker/Kubernetes/source files

## After implementation — isolation

| Check | Expected |
|---|---|
| `ai/src/providers/registry.ts` imports | No `mlops` module |
| `ai/src/config.ts` | `provider: "mock"`; llama env fail-closed |
| Home Intelligence copy | DETERMINISTIC · READ ONLY · no-model |
| `KAIZEN_AI_PROVIDER=llama` | startup error |
| `authorization.v2.json` | preflight/full/operations false |
| `candidates.v1.json` | `executionEnabled: false` |
| `runner.ts` without ACK | `I1_EXECUTION_DISABLED` |
| Packaging | no Compose/Dockerfile in `packaging/` |

## After implementation — functional (no model spawn)

```bash
cd ai
npm run typecheck
npm test
npm run qa:v0.1.1
npm run eval:v0.1.1
npm run qa:v0.1.1:model-design
npm run qa:v0.1.1:model-harness
npm run qa:mlops          # new, after Phase 5
```

MLOps tests:

1. Catalog import of the two public I1 aggregates yields `preflight-rejected`.
2. Deterministic mock aggregate is labeled application-authority, not a promoted model.
3. Promotion parser throws on `application-active`.
4. Experiment record requires protocolId + corpusSha256 + authorizationId.
5. Metrics writer refuses objects with `rawText`, home paths, or missing `PUBLIC-SANITIZED-AGGREGATE`.
6. Privacy scan of staged files passes.

## Docker (optional, local only)

If Compose files exist:

- `docker compose config` shows host binds `127.0.0.1`
- no `deploy:` / k8s keys
- image build does not `COPY *.gguf`
- CI workflows do not run `docker compose up`

Do **not** require Docker in hosted CI.

## Security / privacy

- `.gitignore` covers `ai/mlops/results-local/` and `*.local.json`
- `privacy_scan.py` still blocks weights and results-local
- PUBLIC aggregates contain no prompts, nvidia UUIDs, or absolute paths
- Health snapshots remain redacted in I1 corpus (`redactions: health`)

## Stop conditions

Stop and do not merge implementation if:

- any PR edits `registry.ts` to construct `LlamaCppProvider`
- authorization stages become true without a new reviewed authorization id
- Kubernetes or cloud files appear
- a model process starts in CI
- Electron/packaging is touched
- docs claim a model is selected

## Traceability

Evidence after a future implementation closeout goes in a new dated file under `docs/reports/`, plus ledger and EVALUATION.md updates. This plan file is not itself a pass result.
