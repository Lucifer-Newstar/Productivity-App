# AI v0.1.1 interpreter-model preflight authorization

**Date:** 2026-08-19
**Authorization:** `I1-PREFLIGHT-AUTH-1`
**Protocol:** `I1-RUN-1`
**Matrix:** `I1-CANDIDATES-1`
**Evidence status:** no target result received

## Decision

Target-laptop preflight execution is authorized in this exact order:

1. Qwen3 4B Instruct 2507 Q4_K_M
2. Phi-4 Mini Instruct Q4_K_M

Authorization covers ten retained production-path attempts per candidate only. Full corpus, operations/thermal stage, integration and model selection remain prohibited.

This authorization does not reverse either candidate's Wave 0 rejection and does not reopen `W0-GATE-2`.

## Machine enforcement

Created `authorization.v1.json` with:

```json
{
  "stages": {
    "preflight": true,
    "full": false,
    "operations": false
  }
}
```

The runner loads this record before execution gates. A `full` request fails with `STAGE_NOT_AUTHORIZED` regardless of local configuration, preflight score, CLI or environment acknowledgement.

The committed config template and both candidates remain disabled. Authorized execution requires the target wrapper to create a transient ignored config that enables exactly one candidate.

## Target wrapper

`run_target_preflights.ps1`:

- reruns design and harness QA before model startup;
- verifies frozen candidate order;
- verifies license completion before each run;
- activates Qwen3 only, then Phi only;
- calls the production-path runner with preflight stage only;
- requires runner/scorer/sanitizer success;
- refuses to overwrite prior public evidence;
- removes transient config and execution acknowledgement;
- stops on runtime/harness/integrity failures;
- continues to Phi after a valid candidate-level Qwen rejection;
- never invokes full or operations.

## Target runbook

The complete procedure is maintained in:

```text
docs/ai/v0.1.1-model-evaluation/TARGET-PREFLIGHT-RUNBOOK.md
```

Local configuration records runtime/model paths and hashes, verified licenses, NVIDIA telemetry path and fixed loopback endpoint. Those files remain ignored and must never be uploaded, committed or pasted into chat.

## Public evidence boundary

Only these sanitizer-produced files may be returned for intake:

```text
qwen3-4b-instruct-2507-q4km-preflight.json
phi-4-mini-instruct-q4km-preflight.json
```

Every accepted file must declare `PUBLIC-SANITIZED-AGGREGATE`. Raw attempts, outputs, logs, paths, machine data and telemetry remain LOCAL-ONLY.

## Current measured status

```text
Qwen3 preflight: RETRY PENDING — first intake stopped before inference on fixed >2 GiB hash defect
Phi preflight:   PENDING — not run because wrapper stopped at Qwen intake
```

No pass or rejection is inferred. Both decisions will be documented only after valid sanitized aggregates are received. See `AI-V0.1.1-PREFLIGHT-INTAKE-HASH-FIX-2026-08-19.md`.

## Validation before authorization commit

- AI TypeScript: PASS
- AI tests: 24/24 PASS
- AI build: PASS
- Design QA: 16/16 PASS
- Harness QA: 18/18 PASS
- Documentation QA: 44/44 PASS
- Source commentary QA: 254/254 PASS
- Git diff check: PASS
- Staged privacy scan: PASS

## Stop condition

This repository step stops after publishing the authorization, hard stage block and target runbook. The final user-approved objective—both documented preflight decisions—remains pending target execution and sanitized result intake. Do not run or authorize full/operations based on this commit.