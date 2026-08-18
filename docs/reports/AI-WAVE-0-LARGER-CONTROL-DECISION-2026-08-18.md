# Wave 0 larger-control decision — Qwen2.5 7B

## Decision

Authorize exactly one final **preflight-only** larger control:

```text
Qwen2.5 7B Instruct
Quantization: Q4_K_M
Context: 4096
Runtime: verified existing llama.cpp build with --jinja
```

Public candidate source is documented as `bartowski/Qwen2.5-7B-Instruct-GGUF`; the local owner must verify the upstream Apache 2.0 license/model card, exact GGUF metadata and SHA-256.

## Why this control

- Qwen, Gemma and Phi compact candidates all failed required tool behavior.
- Qwen2.5 7B has a mature llama.cpp tool-template path and can test whether the ceiling is compact-model behavior rather than the engine contract.
- It is a control, not an expected default or permanent selection.

## Resource risk

The Q4_K_M artifact is estimated around 4.5–5.0 GiB and cannot fully fit 4 GiB dedicated VRAM. Partial offload/system-memory spill is expected. Therefore only the short 4K preflight is authorized now.

## Stop rules

- If preflight fails: close Wave 0 with no passing local model.
- If preflight passes: stop for review before any full benchmark.
- Do not test additional models, lower gates or run AC performance automatically.
