# Intelligence MLOps evaluation layer — architecture plan

**Date:** 2026-08-21
**Status:** proposed documentation; no engine/application code changed
**Branch:** `docs/ai-mlops-evaluation-layer`
**Electron:** unchanged

## Outcome

Inspected the v0.1.1 evaluation harness, closed I1 authorization, deterministic provider lock (AI-ADR-020), and privacy-safe sanitizer. Produced:

- Proposed [AI-ADR-021](../ai/adrs/AI-ADR-021-LOCAL-MLOPS-EVALUATION-LAYER.md)
- Architecture diagram and boundaries: [`../ai/mlops/ARCHITECTURE.md`](../ai/mlops/ARCHITECTURE.md)
- File-level implementation plan: [`../ai/mlops/IMPLEMENTATION-PLAN.md`](../ai/mlops/IMPLEMENTATION-PLAN.md)
- Validation plan: [`../ai/mlops/VALIDATION-PLAN.md`](../ai/mlops/VALIDATION-PLAN.md)

No TypeScript, Python, Docker, or packaging files were added. The deterministic provider remains the sole production authority. I1 stages stay closed.

## Inspection notes (measured from source)

- `ai/src/providers/registry.ts` constructs only `MockGenerationProvider`.
- `authorization.v2.json` is `CLOSED-NO-PASSING-CANDIDATE` with all stages false.
- `runner.ts` fails with `STAGE_NOT_AUTHORIZED` / `I1_EXECUTION_DISABLED` unless future authorization, local `*.local.json`, and `KAIZEN_I1_EXECUTION_ACK=I1-RUN-1` all agree.
- Public I1 aggregates already record `modelSelected: false`.
- No Dockerfile or Compose exists in the repository today.
- Telemetry is in-process counters (`ai/src/observability/telemetry.ts`); raw prompts are not retained.

## Review ask

Approve or reject AI-ADR-021 before any `ai/mlops/` source, Compose files, or npm scripts are added. Approval of the ADR still does **not** reopen model execution or application provider selection.
