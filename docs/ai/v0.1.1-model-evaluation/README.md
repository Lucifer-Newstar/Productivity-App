# v0.1.1 interpreter-only local-model evaluation design

**Status:** DESIGN FROZEN — NO MODEL EXECUTION AUTHORIZED

This package defines a new, narrow evaluation of models as interpreters of validated Core Today evidence. It does not reopen Wave 0, change `V011-INT-GATE-1`, grant tool authority or select a model.

## Frozen package

1. [Candidate matrix](CANDIDATE-MATRIX.md) — `I1-CANDIDATES-1`
2. [Run protocol](RUN-PROTOCOL.md) — `I1-RUN-1`
3. [Report template](REPORT-TEMPLATE.md)
4. Machine records:
   - `ai/evaluation/v0.1.1/model-phase/candidates.v1.json`
   - `ai/evaluation/v0.1.1/model-phase/protocol.v1.json`
5. Design QA:

   ```bash
   cd ai
   npm run qa:v0.1.1:model-design
   ```

## Current boundary

The matrix contains only Qwen3 4B Instruct 2507 Q4_K_M and Phi-4 Mini Instruct Q4_K_M. Both retain their Wave 0 rejection. Gemma 3 4B and the Qwen2.5 7B control are explicitly excluded.

No model, runtime binary, local path, hash configuration or raw result belongs in this public design package. Execution remains disabled. A subsequent review must authorize corpus/runner implementation and later target execution; neither follows automatically.

Memory, retrieval, Health, additional domains, writes, automation, remote providers and v0.2 remain outside scope.