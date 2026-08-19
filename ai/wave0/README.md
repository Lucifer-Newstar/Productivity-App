# Kaizen Intelligence Engine — Wave 0 harness

This directory contains disposable technical-validation tools. It is **not** the production Intelligence Engine and does not implement `get_today()`.

## Public/local safety boundary

- No Kaizen domain state is read or written.
- No model is downloaded automatically.
- All model/runtime paths are supplied through ignored local configuration.
- All servers bind to loopback.
- Benchmark candidates remain candidates until the final Wave 0 report is approved.
- Raw captures, logs, outputs and machine configuration belong under ignored `results-local/` and `*.local.json` files.
- Only allowlist-sanitized aggregates may enter `results-public/`.
- Model files never belong in this repository.
- If a file might identify a person or machine, keep it local.

See [`../../docs/ai/PRIVACY.md`](../../docs/ai/PRIVACY.md).

## Quick start on the target Windows laptop

```powershell
cd ai\wave0
Copy-Item config\hardware.local.example.json config\hardware.local.json
Copy-Item config\candidates.local.example.json config\candidates.local.json
# Fill both LOCAL-ONLY files; enable exactly one candidate; never commit them.
# Set the requested Windows/ASUS profile first, then run the complete pipeline:
.\run_target_wave0.ps1 -ProfileLabel "AC performance"

# Individual commands remain available for debugging:
python scripts\capture_hardware.py `
  --expected config\hardware.local.json `
  --profile-label "AC performance" `
  --output results-local\hardware-ac-performance.json

python scripts\run_benchmarks.py `
  --config config\candidates.local.json `
  --output results-local\model-benchmark.json

python scripts\benchmark_retrieval.py --output results-local\retrieval-fts.json
node prototypes\revision-coordinator.mjs
python prototypes\pairing_server.py --self-test
```

After review, create a minimal public aggregate:

```powershell
python scripts\sanitize_results.py `
  --hardware results-local\hardware-ac-performance.json `
  --models results-local\model-benchmark.json `
  --retrieval results-local\retrieval-fts.json `
  --output results-public\wave0-aggregate.json

python scripts\privacy_scan.py --mode staged
```

## Required external runtime

Use an explicit, verified `llama-server`/`llama-bench` build. Record version and SHA-256 locally. The harness communicates through loopback OpenAI-compatible endpoints and does not link Kaizen to a permanent llama.cpp build.

## Contents

- `run_target_wave0.ps1` — complete target profile/candidate pipeline
- `config/*.local.example.json` — public placeholder templates
- `scripts/capture_hardware.py` — LOCAL-ONLY hardware/NVIDIA/power capture
- `scripts/run_benchmarks.py` — latency, resource, structured/tool, concurrency and cancellation runs
- `scripts/probe_lifecycle.py` — normal shutdown, simulated crash, port release and restart
- `scripts/benchmark_retrieval.py` — SQLite FTS5 scale/ranking/recency baseline
- `scripts/benchmark_embeddings.py` — optional synthetic paraphrase retrieval against a local embedding endpoint
- `scripts/monitor_nvidia.py` — LOCAL-ONLY standalone VRAM/power/thermal log
- `scripts/soak_model.py` — sustained request load with thermal/resource drift
- `scripts/score_results.py` — applies frozen `W0-GATE-2` thresholds
- `scripts/build_review_bundle.py` — checks candidate/profile/context/soak coverage
- `scripts/sanitize_results.py` — allowlist aggregate exporter
- `scripts/privacy_scan.py` — staged/tracked privacy and secret gate
- `prototypes/` — isolated revision, pairing and mock-runtime tests
- `scenarios/kaizen-eval.json` — synthetic Kaizen workloads
- `results-local/` — ignored raw artifacts; remains on owner machine
- `results-public/` — reviewed sanitized aggregates only

## Target-machine requirement

Arena sandbox measurements cannot select a model. Final hardware/model/thermal results must be generated locally, sanitized for review, and incorporated into `docs/ai/WAVE-0-REPORT.md`.