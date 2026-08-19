# Hosted CI run 1 intake

**Date:** 2026-08-19
**Run:** `32250769632`
**Commit:** `ae62224`
**Outcome:** failed frontend structural suite on stale branch head

## Failure

Entertainment structural QA reported 167 pass / 1 fail. The run used `ae62224`, before the later production-baseline commit updated the historical “first-run seed covers all sections” assertion. Current QA instead requires an empty fresh production library while preserving support for all six media types and passes 168/168 locally.

No test or product gate was weakened; the assertion was updated to the approved production-data contract.

## Runner warnings

GitHub warned that old JavaScript action majors used the deprecated Node 20 action runtime:

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/setup-python@v5`

Workflow actions were upgraded to Node 24-compatible majors:

- `actions/checkout@v5`
- `actions/setup-node@v6`
- `actions/setup-python@v6`

The application test runtime remains Node 20.19 as declared; action runtime and application runtime are separate.

## Required rerun

Push the current `ai` head and require all four jobs to pass. Run 1 is useful evidence that hosted CI triggers correctly, but it does not satisfy the hosted-green release gate.