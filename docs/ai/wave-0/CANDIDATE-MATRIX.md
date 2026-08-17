# Wave 0 model candidate matrix

**Candidate set frozen before target inference measurements — matrix version `W0-CANDIDATES-1`.** Candidates are not recommendations or architecture.

All model files are manually obtained, locally hashed and kept outside Git. The exact GGUF converter/build metadata and upstream license acceptance must be recorded in LOCAL-ONLY configuration before a run is eligible.

## Shared test configuration

| Setting | Value |
|---|---|
| Runtime candidate | Current verified Windows CUDA `llama.cpp` build |
| Quantization class | 4-bit baseline |
| Contexts | 4,096 mandatory; 8,192 comparison |
| Output cap | 256 tokens for standard scenarios |
| Temperature | 0 |
| Repetitions | 20 per structured/tool scenario |
| Concurrency | 1 and 2 |
| Power profiles | AC balanced and AC performance |
| Thermal soak | 30 minutes per finalist |

## Candidates

### C1 — Qwen3 4B Instruct 2507 Q4_K_M

| Field | Pre-benchmark record |
|---|---|
| Parameters | 4.0B total / 3.6B non-embedding per [upstream card](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) |
| Quantization | Q4_K_M |
| Public GGUF source page | `bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF` |
| Upstream context | 262,144 native; local GGUF/runtime metadata must confirm |
| Context under test | 4K / 8K because target memory, not advertised maximum, controls selection |
| Estimated model-file band | **ESTIMATE:** approximately 2.4–3.0 GiB |
| Estimated target VRAM | **ESTIMATE:** likely near 4 GB after KV/runtime overhead; measure full/partial offload |
| Estimated process RAM | **ESTIMATE:** 4–8 GiB depending on offload/context |
| Candidate rationale | Current compact instruction model; likely strong structured reasoning/tool baseline for 4 GB VRAM |

### C2 — Gemma 3 4B IT QAT Q4_0

| Field | Pre-benchmark record |
|---|---|
| Parameters | 4B class; verify exact GGUF metadata locally |
| Quantization | QAT Q4_0 |
| Public GGUF source page | `google/gemma-3-4b-it-qat-q4_0-gguf` |
| Upstream context | 128K for Gemma 3 models above 1B per [Google](https://developers.googleblog.com/gemma-explained-whats-new-in-gemma-3/) |
| Context under test | 4K / 8K because target memory controls selection |
| Estimated model-file band | **ESTIMATE:** approximately 2.4–3.0 GiB |
| Estimated target VRAM | **ESTIMATE:** likely near 4 GB with context/KV pressure |
| Estimated process RAM | **ESTIMATE:** 4–8 GiB depending on offload/context |
| Candidate rationale | First-party quantized artifact; useful quality, schema and runtime-efficiency comparison |

### C3 — Phi-4 Mini Instruct Q4_K_M

| Field | Pre-benchmark record |
|---|---|
| Parameters | 3.8B dense per [Microsoft model card](https://huggingface.co/microsoft/Phi-4-mini-instruct) |
| Quantization | Q4_K_M |
| Public GGUF source page | `bartowski/microsoft_Phi-4-mini-instruct-GGUF` |
| Upstream context | 128K; local GGUF/runtime metadata must confirm |
| Context under test | 4K / 8K because target memory controls selection |
| Estimated model-file band | **ESTIMATE:** approximately 2.4–3.0 GiB |
| Estimated target VRAM | **ESTIMATE:** likely near 4 GB after overhead |
| Estimated process RAM | **ESTIMATE:** 4–8 GiB depending on offload/context |
| Candidate rationale | Compact instruction model and independent structured-output/tool comparison |

### C4 — 7B–8B Q4_K_M spill/control

| Field | Pre-benchmark record |
|---|---|
| Parameters | 7B–8B; exact family selected only after C1–C3 baselines |
| Quantization | Q4_K_M |
| Context under test | 4K first; 8K only if safe |
| Estimated model-file band | **ESTIMATE:** approximately 4.5–5.5 GiB |
| Estimated target VRAM | **ESTIMATE:** cannot fully fit 4 GB dedicated VRAM; partial offload required |
| Estimated process RAM | **ESTIMATE:** 8–12 GiB with system-RAM/PCIe spill |
| Candidate rationale | Quantify whether added quality justifies latency, RAM, thermal and responsiveness cost; not expected default |

## Measurement rules

- Estimates above are never copied into measured-result columns.
- `llama-bench`/server metadata and SHA-256 establish the actual file/build.
- A candidate is rejected if license/source/hash is unresolved.
- GPU offload settings must be recorded per run; do not compare different offload silently.
- If C1–C3 all fail hard gates, report “no passing model” rather than automatically escalating model size.
- C4 identity must be documented by a matrix amendment before its results are opened.

## Why no final model yet

The 4 GB VRAM boundary makes KV cache, runtime allocation, Windows display usage and partial offload material. Model popularity or third-party throughput cannot replace measurements on the authoritative target environment.