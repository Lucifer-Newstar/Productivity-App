# Corrected Qwen preflight — rejected on tool behavior

## Intake

Accepted one small LOCAL-ONLY preflight only long enough to validate and sanitize it. The raw file contained synthetic aggregate fields and no sensitive-pattern hit, was converted to `PUBLIC-SANITIZED-AGGREGATE`, then deleted from uploads.

## Result

```text
Candidate:                    Qwen3 4B Instruct 2507 Q4_K_M
Context:                      4096
Startup:                      3157.16 ms
Jinja:                        enabled
Structured rate:              1.0
Tool rate:                    0.5
Metrics:                      available
NVIDIA telemetry:             available
Port/process tree:            released
Failure category:             expected get_today, got []
Passed for full run:           false
```

## Interpretation

The corrected canonical schema and NVIDIA collection work. The remaining failure is actual tool behavior: Qwen did not call the required `get_today` tool in one of two compatibility scenarios. The 50% preflight result is below the frozen 95% tool threshold and blocks the expensive full run.

## Decision

Reject Qwen3 4B Instruct 2507 Q4_K_M for this selection cycle. Do not weaken the scenario, force a passing score or run AC performance. Continue with Gemma 3 4B preflight, then Phi-4 Mini as needed.
