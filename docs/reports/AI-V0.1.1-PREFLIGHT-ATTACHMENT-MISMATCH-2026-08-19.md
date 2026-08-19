# AI v0.1.1 preflight attachment intake mismatch

**Date:** 2026-08-19
**Expected:** two `I1-RUN-1` preflight aggregates
**Accepted new results:** none

## User-reported status

The target operator reported that Qwen3 and Phi each completed ten retained preflight attempts, were sanitized as `REJECTED-PREFLIGHT`, and exposed `UNCLASSIFIED` as the only public failure code. No full or operations stage ran, and no model was selected.

This statement is recorded as reported status only. Exact candidate metrics and classified failure evidence remain pending valid aggregate intake.

## Attachment verification

The four attached JSON files were classified as public sanitized aggregates, but SHA-256 comparison showed they are byte-for-byte copies of already tracked Wave 0 files:

- legacy Phi-4 Mini Wave 0 preflight;
- legacy Qwen2.5 7B control preflight;
- legacy Qwen3 corrected Wave 0 preflight;
- legacy Qwen3 AC-balanced Wave 0 aggregate.

They do not contain `protocolId: I1-RUN-1`, `stage: preflight`, the new outcome field or retained-attempt requirements. They are not the two new interpreter-only aggregates and were not added, modified or interpreted as new evidence.

No private target files were inspected or requested.

## `UNCLASSIFIED` diagnosis

The production provider adapter throws ordinary errors for HTTP, transport and stream parsing failures. The runner preserved those failures but assigned `UNCLASSIFIED` whenever the error lacked an explicit Kaizen code. The public sanitizer correctly withheld private messages, leaving an unhelpful generic code.

The private message must remain local. Classification should occur locally before sanitization, not by uploading raw evidence.

## Correction

The scorer now maps retained LOCAL-ONLY messages into bounded public categories:

- `PROVIDER_HTTP_<status>`
- `PROVIDER_TRANSPORT`
- `PROVIDER_TIMEOUT`
- `PROVIDER_STREAM_PARSE`
- `TOKENIZER_FAILURE`

Known existing Kaizen error codes remain unchanged. Unknown messages remain `UNCLASSIFIED` and cannot be automatically published as a classified decision.

Added `reclassify_target_preflights.ps1`, which:

1. reruns harness QA without inference;
2. locates the latest retained preflight attempts for Qwen3 and Phi;
3. re-scores the same attempts locally;
4. refuses to proceed if classification remains generic;
5. regenerates each sanitizer aggregate;
6. verifies outcome, attempt counts and requirement fields did not change.

No generation request or model process is started.

## Current decision state

```text
Qwen3: REPORTED REJECTED-PREFLIGHT / CLASSIFIED AGGREGATE PENDING
Phi:   REPORTED REJECTED-PREFLIGHT / CLASSIFIED AGGREGATE PENDING
```

Do not authorize full or operations. Final documented candidate decisions require the two correct `I1-RUN-1` sanitizer outputs after local reclassification.

## Privacy action

Do not provide attempts, raw output, server logs, local paths, telemetry or local configuration. Return only:

```text
qwen3-4b-instruct-2507-q4km-preflight.json
phi-4-mini-instruct-q4km-preflight.json
```

with `PUBLIC-SANITIZED-AGGREGATE`, `protocolId: I1-RUN-1`, `stage: preflight`, and a non-generic safe failure code.

## Validation summary

```text
AI TypeScript: PASS
AI tests: 24/24 PASS
AI build: PASS
Interpreter-model design QA: 16/16 PASS
Interpreter-model harness QA: 18/18 PASS
Documentation QA: 45/45 PASS
Source commentary QA: 255/255 PASS
No inference during classification implementation: confirmed
Attached legacy duplicates removed from workspace after comparison
Git diff check: PASS
Staged privacy scan: PASS
```