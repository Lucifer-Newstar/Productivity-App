# Interpreter-model public aggregates

`I1-PREFLIGHT` is complete. Both frozen candidates were rejected before full evaluation:

| Candidate | Outcome | Safe failure code |
|---|---|---|
| Qwen3 4B Instruct 2507 Q4_K_M | `REJECTED-PREFLIGHT` | `PROVIDER_HTTP_400` |
| Phi-4 Mini Instruct Q4_K_M | `REJECTED-PREFLIGHT` | `PROVIDER_HTTP_400` |

Both aggregates declare `PUBLIC-SANITIZED-AGGREGATE`, contain ten retained attempts, and confirm `modelSelected: false` and `wave0Reopened: false`. No full corpus or operations stage ran.

Raw prompts, outputs, paths, machine identifiers and per-sample telemetry remain under the ignored `results-local/` boundary and must never be committed or shared in public chat.
