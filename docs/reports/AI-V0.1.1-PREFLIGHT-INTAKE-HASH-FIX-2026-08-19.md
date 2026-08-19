# AI v0.1.1 preflight intake — large-artifact hash fix

**Date:** 2026-08-19
**Authorization:** `I1-PREFLIGHT-AUTH-1`
**Candidate reached:** Qwen3 first, as frozen
**Inference executed:** no
**Candidate decision:** none

## Sanitized intake evidence

The target wrapper passed both pre-execution QA gates and activated Qwen3 first. Intake stopped before llama-server startup or inference with:

```text
ERR_FS_FILE_TOO_LARGE: File size (2497280736) is greater than 2 GiB
```

The Qwen GGUF size was 2,497,280,736 bytes. The wrapper stopped as required. Phi was not started, no attempt record was scored and no public candidate aggregate was produced.

No local model path, local configuration, machine identifier or raw log is recorded in this report.

## Diagnosis

The runner's independent hash verification used:

```ts
readFileSync(modelPath)
```

Node attempts to place the entire artifact into one buffer. Files above Node's approximately 2 GiB `readFile` ceiling fail before SHA-256 can be calculated. This is a runner filesystem-intake defect, not model output and not evidence about schema, grounding, safety, resources or usefulness.

## Correction

Added `fileHash.ts`, which computes SHA-256 incrementally with `createReadStream`. Runtime and model artifacts now use the streaming verifier:

```text
artifact stream → incremental SHA-256 → exact expected-hash comparison
```

The small public corpus continues to use bounded synchronous hashing. Hash requirements, expected values and failure behavior are unchanged.

## Regression coverage

Harness QA now proves:

- the streaming utility matches an independently calculated SHA-256;
- the runner routes both runtime and model artifact verification through the streaming utility;
- execution remains disabled without all gates;
- remote endpoints remain rejected;
- full execution remains hard-blocked;
- no public result is created by QA.

## Evaluation interpretation

```text
Qwen3 preflight: NOT RUN — RETRY PENDING AFTER RUNNER FIX
Phi preflight:   NOT RUN — WAITING FOR QWEN RETRY/RESOLUTION
```

Do not record `REJECTED-PREFLIGHT`, `PASS`, or `INVALID-RUN` as a candidate outcome. No inference measurement exists. `V011-INT-GATE-1`, `I1-CANDIDATES-1`, corpus content and operational ceilings are unchanged.

## Retry authorization

The existing preflight-only authorization remains applicable because the failure occurred before model startup and has been corrected without changing candidate or gate scope. After pulling this fix and passing updated QA, rerun the same target wrapper. It will start again with Qwen3 and proceed to Phi only under the original stop rules.

Full and operations stages remain prohibited.

## Validation summary

```text
AI TypeScript: PASS
AI tests: 24/24 PASS
AI build: PASS
Interpreter-model design QA: 16/16 PASS
Interpreter-model harness QA: 18/18 PASS
Documentation QA: 44/44 PASS
Source commentary QA: 254/254 PASS
Model inference during fix validation: none
Public candidate aggregate: none
Git diff check: PASS
Staged privacy scan: PASS
```