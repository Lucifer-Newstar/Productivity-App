# Phi-4 Mini preflight — rejected on tool behavior

## Evidence received

User supplied a public-safe preflight summary. No raw logs, local configuration, paths or model artifact entered the repository.

```text
Candidate:                 phi-4-mini-instruct-q4km
Context:                   4096
Jinja:                     enabled
Structured rate:           1.0
Tool rate:                 0.0
Metrics:                   available
NVIDIA telemetry:          available
Port released:             true
Process tree exited:       true
Passed for full run:       false
```

Failure categories:

```text
expected get_project, got no tool call
expected get_today, got no tool call
```

## Interpretation

Corrected structured output, runtime metrics, GPU telemetry and cleanup all work. Phi does not call either mandatory tool and therefore fails the frozen compatibility gate.

## Decision

Reject Phi-4 Mini for this selection cycle. Do not run full AC-balanced or AC-performance. Qwen, Gemma and Phi are all rejected. The next step is an explicit review decision between one optional larger spill/control preflight and a Wave 0 no-model result.
