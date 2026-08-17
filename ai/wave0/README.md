# Kaizen Intelligence Engine — Wave 0 harness

This directory contains disposable technical-validation tools. It is **not** the production Intelligence Engine and does not implement `get_today()`.

## Safety boundary

- No Kaizen domain state is read or written.
- No model is downloaded automatically.
- All model paths are supplied explicitly.
- All servers must bind to loopback.
- Benchmark candidates remain candidates until the Wave 0 Selection Report is approved.
- Outputs belong under `results/`; model files do not belong in this repository.

## Quick start on the target Windows laptop

```powershell
cd ai\wave0
python scripts\capture_hardware.py --output results\hardware.json
Copy-Item config\candidates.example.json config\candidates.local.json
# Edit model paths and llama-server path in candidates.local.json
python scripts\run_benchmarks.py --config config\candidates.local.json --output results\model-benchmark.json
python scripts\benchmark_retrieval.py --output results\retrieval-fts.json
node prototypes\revision-coordinator.mjs
python prototypes\pairing_server.py --self-test
```

## Required external runtime

Use an explicit, verified `llama-server`/`llama-bench` build. Record its version/hash in local configuration. The harness communicates through loopback OpenAI-compatible endpoints and does not link Kaizen to a particular llama.cpp build.

## Contents

- `config/candidates.example.json` — candidate matrix template
- `scripts/capture_hardware.py` — hardware, NVIDIA and power-mode capture
- `scripts/run_benchmarks.py` — lifecycle, latency, structured JSON, tool-call and concurrency runs
- `scripts/benchmark_retrieval.py` — SQLite FTS5 latency and ranking baseline
- `scripts/monitor_nvidia.py` — sampled VRAM/utilization/power/temperature log
- `prototypes/revision-coordinator.mjs` — revision/epoch/snapshot prototype tests
- `prototypes/pairing_server.py` — isolated pairing/session/origin security prototype
- `scenarios/kaizen-eval.json` — model evaluation cases
- `results/` — ignored measured outputs

## Target-machine requirement

Results measured in the Arena sandbox are not valid RTX 3050 selection evidence. Final hardware/model/thermal results must be generated on the target laptop and attached to the selection report.