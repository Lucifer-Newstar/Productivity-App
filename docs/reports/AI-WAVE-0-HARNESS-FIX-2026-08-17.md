# Wave 0 harness audit fix pass — 2026-08-17

## Scope

Synthetic/mock-only correction pass. No runtime/model installation, model download, target benchmark, machine-local configuration, personal data or new Intelligence capability.

## Fixes

### Request-level cancellation

The benchmark now closes the individual streaming HTTP request while leaving `llama-server` alive. Client socket closure is recorded separately and is not called native acknowledgement. Cancellation is acknowledged only when a server-observable active-request metric first observes the request and then returns to the pre-request zero baseline. If runtime metrics are unavailable, acknowledgement remains incomplete.

RAM/VRAM baselines are captured before request dispatch. Post-cancellation samples are compared with those pre-request baselines under the existing tolerance/recovery window. The deterministic mock exposes an active-request metric and normal plus delayed-orphan modes. Regression tests prove successful cancellation and detected orphan failure. The separate process termination/crash/restart probe remains intact.

### Cold-load coverage

Every configured context performs at least three independent process start→ready→stop cycles before scenario execution. Raw output retains every sample. `p95Ms` exists only when all required samples are valid, release their port and leave no process-tree member. Missing coverage fails/pends its gates.

### OS-level process verification

Cross-platform process inspection uses Windows `Win32_Process` or Linux procfs. Request cancellation verifies the expected server identity/tree remains stable with no unexpected child process. Normal shutdown, simulated crash, restart and every cold-load teardown verify the launched process tree has fully exited.

### llama-bench

The scorer now requires native `llama-bench` status `ok` for each measured candidate. Missing/unavailable coverage cannot pass.

### Concurrency

Concurrency 1/2 now runs all structured and tool scenarios, not one representative prompt. Concurrency-2 scoring requires coverage, zero transport/request failures, structured reliability, tool reliability and latency-ratio gates. Missing or regressed coverage fails/pends.

### Embedding endpoint

Embedding benchmark accepts only explicit-port plain HTTP on literal `127.0.0.1` or `[::1]`, with no credentials, path, query or fragment. `localhost` and every other hostname are rejected. Remote/unsafe forms are rejected before the optional token is read or a request is made.

## First target-run defect corrections

The first Qwen target aggregate exposed three configuration/harness defects rather than threshold problems:

- `/v1/chat/completions` now uses canonical `response_format.type=json_schema` with nested named/strict `json_schema.schema`.
- `llama-server` commands now always enable `--jinja` for tool-aware chat-template rendering.
- NVIDIA telemetry now accepts `[N/A]` laptop power fields, falls back to a reduced query when necessary, and checks a standard Windows executable location or local `KAIZEN_W0_NVIDIA_SMI` override.

A short 4K LOCAL-ONLY preflight now requires valid structured output, exact tools, active-request metrics, Jinja and NVIDIA samples before the expensive full run begins. No threshold changed.

## Verification

- Wave 0 harness: 38/38 synthetic checks
- Python syntax: pass
- Privacy boundary: preserved
- Raw outputs: LOCAL-ONLY only
- W0-GATE-2 numeric thresholds: unchanged
