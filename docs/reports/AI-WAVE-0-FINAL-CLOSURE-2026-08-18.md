# Wave 0 final closure — no model selected

## Final control

```text
Candidate:                 Qwen2.5 7B Instruct Q4_K_M
Context:                   4096
Startup:                   15.520 s
Jinja:                     enabled
Structured rate:           50%
Tool rate:                 50%
Metrics/NVIDIA:            available
Cleanup:                   passed
Failures:                  confidence above maximum;
                           get_entertainment_history selected instead of get_today
Passed for full run:       false
```

The public-safe summary contained no raw paths, logs, credentials or personal data.

## Candidate decisions

| Candidate | Structured | Tools | Decision |
|---|---:|---:|---|
| Qwen3 4B | 100% corrected preflight | 50% | Rejected |
| Gemma3 4B | 0% | 0% | Rejected |
| Phi-4 Mini | 100% | 0% | Rejected |
| Qwen2.5 7B control | 50% | 50% | Rejected |

No candidate passed mandatory preflight, so no full candidate benchmark was authorized and no model/context/concurrency/runtime default was selected.

## Final decision

**Wave 0 is complete with no passing local model under W0-GATE-2.**

- Do not test additional models under this cycle.
- Do not weaken frozen gates.
- Do not manufacture a model selection.
- Embedding selection is deferred because no generation candidate passed and production retrieval is outside frozen v0.1.
- Deterministic/mock v0.1 remains valid and tested.

## Required next review

Choose a new, explicitly documented scope before implementation:

1. deterministic-only continuation;
2. v0.1.1 deterministic tool routing with model-as-interpreter;
3. defer local model pending different hardware/runtime;
4. separately consented remote-provider architecture.

Memory, Health, writes, automation, extra domains and v0.2 remain frozen until that review.
