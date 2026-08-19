# v0.1.1 interpreter-only local-model evaluation design

**Status:** TARGET PREFLIGHT AUTHORIZED — FULL/OPERATIONS DISABLED

This package defines a new, narrow evaluation of models as interpreters of validated Core Today evidence. It does not reopen Wave 0, change `V011-INT-GATE-1`, grant tool authority or select a model.

## Frozen package

1. [Candidate matrix](CANDIDATE-MATRIX.md) — `I1-CANDIDATES-1`
2. [Run protocol](RUN-PROTOCOL.md) — `I1-RUN-1`
3. [Report template](REPORT-TEMPLATE.md)
4. [Target preflight runbook](TARGET-PREFLIGHT-RUNBOOK.md)
5. Machine records:
   - `ai/evaluation/v0.1.1/model-phase/candidates.v1.json`
   - `ai/evaluation/v0.1.1/model-phase/protocol.v1.json`
   - `ai/evaluation/v0.1.1/model-phase/authorization.v1.json`
6. Frozen corpus and manifest:
   - `ai/evaluation/v0.1.1/model-phase/corpus.v1.json`
   - `ai/evaluation/v0.1.1/model-phase/corpus.manifest.json`
7. Disabled-by-default production-path runner, scorer and sanitizer
8. Blank 100-row semantic-review worksheet
9. Design and harness QA:

   ```bash
   cd ai
   npm run qa:v0.1.1:model-design
   npm run qa:v0.1.1:model-harness
   ```

## Current boundary

The matrix contains only Qwen3 4B Instruct 2507 Q4_K_M and Phi-4 Mini Instruct Q4_K_M. Both retain their Wave 0 rejection. Gemma 3 4B and the Qwen2.5 7B control are explicitly excluded.

No model, runtime binary, local path, hash configuration or raw result belongs in this public package. Target-laptop preflight is authorized only through `run_target_preflights.ps1`, which preserves candidate order and activates one candidate at a time. Full and operations stages remain hard-blocked by `authorization.v1.json` and require a later explicit review.

Memory, retrieval, Health, additional domains, writes, automation, remote providers and v0.2 remain outside scope.