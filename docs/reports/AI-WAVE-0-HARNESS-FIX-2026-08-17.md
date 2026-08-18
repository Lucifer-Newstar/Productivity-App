# Wave 0 harness audit fix pass — 2026-08-17

## Scope

Synthetic/mock-only correction pass. No runtime/model installation, model download, target benchmark, machine-local configuration, personal data or new Intelligence capability.

## Fixes

### Request-level cancellation

The benchmark now closes the individual streaming HTTP request while leaving `llama-server` alive. It records acknowledgement, acknowledgement latency, request-termination latency, thread termination, server liveness, active-request metrics, orphan status, recovery window and RAM/VRAM recovery. The existing process termination/crash/restart probe remains separate.

The deterministic mock exposes an active-request metric and has normal plus delayed-orphan modes. Regression tests prove successful cancellation and detected orphan failure. W0-GATE-2 now requires acknowledged/terminated/orphan-free request cancellation, live server, zero active requests and RAM/VRAM recovery.

### Cold-load coverage

Every configured context performs at least three independent process start→ready→stop cycles before scenario execution. Raw output retains every sample. `p95Ms` exists only when all required samples are valid and release their port. Missing coverage fails/pends its gates.

### llama-bench

The scorer now requires native `llama-bench` status `ok` for each measured candidate. Missing/unavailable coverage cannot pass.

### Concurrency

Concurrency 1/2 now runs all structured and tool scenarios, not one representative prompt. Concurrency-2 scoring requires coverage, zero transport/request failures, structured reliability, tool reliability and latency-ratio gates. Missing or regressed coverage fails/pends.

### Embedding endpoint

Embedding benchmark accepts only explicit-port plain HTTP on `127.0.0.1`, `localhost` or `::1`, with no credentials, path, query or fragment. Remote/unsafe forms are rejected before the optional token is read or a request is made.

## Verification

- Wave 0 harness: 33/33 synthetic checks
- Python syntax: pass
- Privacy boundary: preserved
- Raw outputs: LOCAL-ONLY only
- W0-GATE-2 numeric thresholds: unchanged
