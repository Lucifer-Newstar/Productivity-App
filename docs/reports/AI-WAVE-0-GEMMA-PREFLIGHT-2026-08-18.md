# Gemma 3 4B QAT Q4 preflight — rejected

## Evidence received

User supplied a public-safe preflight summary; no raw logs, local paths, configuration or model artifact entered the repository.

```text
Candidate:                 gemma-3-4b-it-qat-q4
Context:                   4096
Jinja:                     enabled
Structured rate:           0.0
Tool rate:                 0.0
Metrics:                   available
NVIDIA telemetry:          available
Port released:             true
Process tree exited:       true
Passed for full run:       false
```

Failure categories:

```text
HTTP 400 Bad Request
expected get_project, got no tool call
expected get_today, got no tool call
```

## Interpretation

Runtime lifecycle, metrics, NVIDIA telemetry and cleanup are healthy. The candidate/configuration fails both mandatory compatibility classes: structured requests receive HTTP 400 and neither required tool is called. Without a public-safe server error category, the exact server rejection is unknown; no assumption is promoted to fact.

## Decision

Reject this Gemma configuration for the current selection cycle. Do not run the full AC-balanced or AC-performance benchmark. Do not weaken schema/tool gates. Proceed to Phi-4 Mini preflight. If every compact candidate fails, the correct Wave 0 result may be “no passing local model/configuration.”
