# AI v0.1.1 interpreter-model preflight final report

**Date:** 2026-08-19
**Protocol:** `I1-RUN-1`
**Matrix:** `I1-CANDIDATES-1`
**Gate:** unchanged `V011-INT-GATE-1@1.0`
**Decision:** PREFLIGHT COMPLETE — NO CANDIDATE ELIGIBLE FOR FULL

## Intake validation

Two sanitizer-produced aggregates were received and validated:

| Candidate | Received SHA-256 | Repository LF-normalized SHA-256 |
|---|---|---|
| Qwen3 4B Instruct 2507 Q4_K_M | `d65d042c6f50484c93717a8c3b5ae954649528d810cfaddb2832549db7922c6b` | `2c1c96a367e2e4f99848e6d477f07d9ee7248652c02c6e4198a32118928efc97` |
| Phi-4 Mini Instruct Q4_K_M | `443efb93905fc4318a9e91c0829e077ba0312c8085d587690ad61a15ddd0aea2` | `aba9fc043ca46aebe48b55076f392bf73b9bbb942d8aea4b2b0ab14cbe4016d2` |

Only line endings were normalized for repository consistency; parsed JSON content was unchanged.

Both files passed the public intake contract:

- `classification: PUBLIC-SANITIZED-AGGREGATE`;
- `protocolId: I1-RUN-1`;
- `matrixId: I1-CANDIDATES-1`;
- `gateId: V011-INT-GATE-1`;
- `stage: preflight`;
- 10 attempts and 10 retained attempts;
- frozen `I1-SYNTHETIC-1` corpus/hash;
- sanitized 64-character runtime/model SHA-256 values;
- `modelSelected: false`;
- `wave0Reopened: false`;
- no raw prompt/output/path/telemetry fields.

The previously attached legacy Wave 0 duplicates were not used.

## Qwen3 preflight

**Outcome:** `REJECTED-PREFLIGHT`

| Requirement | Result |
|---|---|
| Route contract | PASS |
| Zero provider tool calls | PASS |
| Input token budget | PASS |
| Telemetry available | PASS |
| Shutdown | PASS |
| Port release | PASS |
| Attempts complete | FAIL |
| Structured output | FAIL |
| Source validity | FAIL |
| Resource ceilings | FAIL |

Safe failure code:

```text
PROVIDER_HTTP_400
```

The aggregate establishes an HTTP 400 provider failure and at least one resource-ceiling failure. It does not expose which private request/runtime detail caused HTTP 400 or which specific resource ceiling failed. No causal explanation is inferred.

## Phi preflight

**Outcome:** `REJECTED-PREFLIGHT`

| Requirement | Result |
|---|---|
| Route contract | PASS |
| Zero provider tool calls | PASS |
| Input token budget | PASS |
| Telemetry available | PASS |
| Shutdown | PASS |
| Port release | PASS |
| Attempts complete | FAIL |
| Structured output | FAIL |
| Source validity | FAIL |
| Resource ceilings | FAIL |

Safe failure code:

```text
PROVIDER_HTTP_400
```

The same interpretation boundary applies: the aggregate supports HTTP 400 and resource-ceiling failure only. It does not justify guessing a template, schema, runtime-build, memory, VRAM or model-specific cause.

## Frozen-gate decision

Preflight required all ten attempts to complete with valid structured/source-grounded output, zero tool calls, valid telemetry/resources and clean lifecycle handling. Both candidates failed mandatory requirements.

Therefore:

```text
Qwen3: REJECTED-PREFLIGHT
Phi:   REJECTED-PREFLIGHT
```

Neither candidate is eligible for:

- the 100-response full corpus;
- semantic review;
- operations/thermal validation;
- selection;
- integration.

No additional candidate is authorized under `I1-CANDIDATES-1`.

## Authorization closure

`I1-PREFLIGHT-CLOSURE-1` supersedes the preflight authorization and sets:

```json
{
  "preflight": false,
  "full": false,
  "operations": false
}
```

The runner now rejects every model stage with `STAGE_NOT_AUTHORIZED`. Any future model work requires a new reviewed matrix, protocol, gate/authorization decision and privacy review. The current failures must not be bypassed by rerunning, changing schema behavior, weakening resource ceilings or adding an ad hoc model.

## Wave 0 relationship

Wave 0 remains closed with no selected model. This separate interpreter-only result does not reopen or rescore `W0-GATE-2`. It independently reaches the same product-level conclusion: the deterministic/mock v0.1.1 baseline remains authoritative and no local model is approved.

## Privacy closeout

- Only the two reviewed public aggregates were copied into the repository.
- Uploaded copies were deleted from the workspace after validation.
- No LOCAL-ONLY attempt, prompt, output, path, log or telemetry was requested or persisted.

## Final conclusion

> **I1-PREFLIGHT COMPLETE — BOTH CANDIDATES REJECTED — NO MODEL SELECTED.**

Stop for scope review. Full corpus, operations, model integration, additional model testing, memory, retrieval, Health, writes, automation, remote providers and v0.2 remain unauthorized.

## Validation summary

```text
Public aggregate intake: 2/2 PASS
AI TypeScript: PASS
AI tests: 24/24 PASS
AI build: PASS
Interpreter-model design QA: 16/16 PASS
Interpreter-model harness QA: 18/18 PASS
Documentation QA: 46/46 PASS
Source commentary QA: 255/255 PASS
Git diff check: PASS
Staged privacy scan: PASS
```