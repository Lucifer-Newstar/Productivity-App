# v0.1.1 interpreter-only candidate matrix

**Matrix:** `I1-CANDIDATES-1`
**Status:** FROZEN BEFORE MODEL EXECUTION
**Frozen:** 2026-08-19
**Machine record:** `ai/evaluation/v0.1.1/model-phase/candidates.v1.json`

## Scope

This matrix evaluates whether a compact local model can interpret validated Core Today evidence. It does not evaluate tool selection, reopen Wave 0, reverse prior rejections or authorize integration.

The candidates are deliberately limited to models whose corrected Wave 0 public evidence showed 100% structured-output success at 4K but failed model-selected tools. The new role removes tool authority while retaining the frozen v0.1.1 response, grounding, precedence, uncertainty and safety requirements.

## Included candidates

### I1-C1 — Qwen3 4B Instruct 2507 Q4_K_M

| Field | Frozen value |
|---|---|
| Candidate ID | `qwen3-4b-instruct-2507-q4km` |
| Artifact family | Qwen3-4B-Instruct-2507 |
| Quantization | Q4_K_M |
| Role | Primary compact interpreter candidate |
| Prior corrected structured rate | 100% |
| Prior corrected tool rate | 50% |
| Wave 0 status | Rejected; unchanged |
| Inclusion rationale | Structured output succeeded; the measured blocker was omitted model-selected `get_today`, which v0.1.1 no longer delegates to the model. |

### I1-C2 — Phi-4 Mini Instruct Q4_K_M

| Field | Frozen value |
|---|---|
| Candidate ID | `phi-4-mini-instruct-q4km` |
| Artifact family | Phi-4-mini-instruct |
| Quantization | Q4_K_M |
| Role | Compact comparator |
| Prior corrected structured rate | 100% |
| Prior corrected tool rate | 0% |
| Wave 0 status | Rejected; unchanged |
| Inclusion rationale | Structured output succeeded; zero tool reliability caused rejection but does not establish evidence-only interpretation quality. |

Candidate order is fixed. Both remain candidates only; neither is preferred architecture.

## Explicit exclusions

### Gemma 3 4B IT QAT Q4

Excluded because corrected preflight produced HTTP 400, 0% structured output and 0% tools. The public-safe evidence does not establish compatibility with the structured interpreter request.

### Qwen2.5 7B Instruct Q4_K_M control

Excluded because its control preflight produced only 50% structured output, violated confidence bounds and carries materially greater target-hardware load. The narrower role does not justify repeating a candidate with an already-measured response-schema blocker.

## Freeze rules

1. No candidate may be added, removed, reordered, requantized or substituted after any interpreter-model output is opened.
2. A necessary change creates `I1-CANDIDATES-2`, records why, and requires explicit review before execution.
3. Model files remain outside the repository. Local paths, hashes, runtime paths and licenses are recorded only in ignored local configuration and sanitized aggregates.
4. Inclusion does not alter `WAVE 0 COMPLETE — NO MODEL SELECTED`.
5. A candidate pass means only “eligible for selection review.” It does not select or integrate the model.

## Final preflight outcomes

| Candidate | Outcome | Safe failure code | Full eligible |
|---|---|---|---|
| Qwen3 4B Instruct 2507 Q4_K_M | `REJECTED-PREFLIGHT` | `PROVIDER_HTTP_400` | No |
| Phi-4 Mini Instruct Q4_K_M | `REJECTED-PREFLIGHT` | `PROVIDER_HTTP_400` | No |

Both retained ten attempts and passed route, zero-tool, token-budget, telemetry, shutdown and port-release checks. Both failed attempt completion, structured response, source validity and resource-ceiling requirements. `I1-CANDIDATES-1` is closed with no candidate eligible for full evaluation.
