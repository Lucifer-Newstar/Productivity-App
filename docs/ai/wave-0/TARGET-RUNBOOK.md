# Target laptop Wave 0 runbook

## Test device baseline

The following user-supplied specification defines the expected device class only. It is **not** the authoritative benchmark environment. The LOCAL-ONLY machine capture generated immediately before benchmark execution is authoritative.

User-supplied specification:

```text
ASUS TUF Gaming A15 FA506NCR
AMD Ryzen 7 7435HS — 8C/16T, 3.1–4.5 GHz, 20 MB cache
NVIDIA RTX 3050 Laptop GPU — 4 GB GDDR6, 60 W, up to 75 W Dynamic Boost
16 GB DDR5 — exact speed pending local capture
~2.5 TB storage — exact drive layout pending local capture
Windows 11 — edition/build pending local capture
180 W adapter
```

The public repository stores only a generic `hardware.local.example.json`. Copy it to ignored `hardware.local.json` and fill the supplied target expectations locally. Raw machine data never enters Git.

## Preferred one-command execution

After filling ignored local configs and enabling exactly one candidate, set the desired Windows/ASUS profile and run:

```powershell
cd ai\wave0
.\run_target_wave0.ps1 -ProfileLabel "AC performance"
```

The orchestrator requires confirmation, executes capture/retrieval/transport/pairing/revision/model/lifecycle/soak/scoring, keeps raw files in a candidate/profile-specific `results-local/` directory, creates one allowlist-sanitized aggregate, and rebuilds a public coverage bundle. Run it again for AC balanced and for each candidate. It never downloads a model, selects architecture, or stages a file.

Use `-EmbeddingBaseUrl http://127.0.0.1:18081` only after starting a verified local embedding candidate. `-SkipSoak` is for harness troubleshooting only and leaves final gates incomplete.

## Phase A — capture

In PowerShell:

```powershell
cd <repo>\ai\wave0
python scripts\capture_hardware.py `
  --expected config\hardware.local.json `
  --profile-label "AC balanced" `
  --output results-local\target-hardware-ac-balanced.json
```

Record the ASUS/Armoury Crate profile and active Windows power scheme. Repeat as `target-hardware-ac-performance.json` after selecting the intended performance profile.

## Phase B — prepare verified candidates

1. Obtain a current Windows CUDA build of `llama-server.exe` and `llama-bench.exe` from the official llama.cpp project.
2. Record binary versions and SHA-256 values.
3. Review each upstream model license/model card.
4. Download candidate GGUFs manually; Wave 0 scripts intentionally do not download models.
5. Compute hashes:

```powershell
Get-FileHash C:\tools\llama.cpp\llama-server.exe -Algorithm SHA256
Get-FileHash C:\models\MODEL.gguf -Algorithm SHA256
```

6. Copy `config\candidates.local.example.json` to ignored `config\candidates.local.json`, update paths/hashes/licenses, and enable one candidate at a time.

## Phase C — baseline and inference

For each power profile and candidate:

```powershell
python scripts\run_benchmarks.py `
  --config config\candidates.local.json `
  --output results-local\MODEL-ac-performance.json

python scripts\probe_lifecycle.py `
  --config config\candidates.local.json `
  --candidate CANDIDATE_ID `
  --context 4096 `
  --output results-local\MODEL-lifecycle.json
```

The runner executes native llama-bench when configured, model startup/shutdown, 2K/4K/8K/12K/16K contexts, 20 repetitions of every structured/tool scenario, concurrency 1/2, cancellation/recovery and NVIDIA/RAM/CPU sampling.

Run retrieval and protocol baselines on the same profile:

```powershell
python scripts\benchmark_retrieval.py --output results-local\retrieval-fts.json
# Only after reviewing the measured lexical paraphrase gap, run a separately launched local embedding candidate:
python scripts\benchmark_embeddings.py --base-url http://127.0.0.1:18081 --output results-local\embedding-candidate.json
python scripts\transport_probe.py --messages 200 --runs 50 --output results-local\transport.json
python prototypes\pairing_server.py --self-test --output results-local\pairing.json
node prototypes\revision-coordinator.mjs --output results-local\revision.json
```

Run each finalist under continuous synthetic load for at least 30 minutes. The soak runner sends repeated requests while sampling NVIDIA/process resources, avoiding an invalid idle-only thermal test:

```powershell
python scripts\soak_model.py `
  --config config\candidates.local.json `
  --candidate CANDIDATE_ID `
  --context 4096 `
  --duration 1800 `
  --output results-local\MODEL-soak-30m.json
```

Apply the frozen gates without editing them:

```powershell
python scripts\score_results.py `
  --models results-local\MODEL-ac-performance.json `
  --retrieval results-local\retrieval-fts.json `
  --embeddings results-local\embedding-candidate.json `
  --lifecycle results-local\MODEL-lifecycle.json `
  --pairing results-local\pairing.json `
  --revision results-local\revision.json `
  --soak results-local\MODEL-soak-30m.json `
  --output results-local\MODEL-score.json
```

## Required results per candidate

- model identity, source, license, hash and quantization
- llama.cpp build/hash and flags
- startup/shutdown and cancellation behavior
- prompt-processing and generation tokens/sec
- first-token and complete-response latency
- peak RAM and dedicated VRAM
- structured response and tool accuracy over 20 repetitions per scenario
- tool selection/arguments pass rate
- 2K/4K/8K/12K/16K context behavior
- concurrency 1 versus 2
- peak/sustained GPU temperature, power and throttling; CPU temperature only from a trusted local sensor tool and sanitized before review
- AC profile and Windows/ASUS power mode

## Stop rules

Stop a candidate when it repeatedly causes out-of-memory behavior, severe system swapping, unresponsive UI, unsafe temperatures, orphan processes, invalid schema/tool behavior below threshold, or requires unreviewed remote execution.

## Phase D — sanitize for public review

Raw files stay in `results-local/`. After local inspection:

```powershell
python scripts\sanitize_results.py `
  --hardware results-local\target-hardware-ac-performance.json `
  --models results-local\MODEL-ac-performance.json `
  --retrieval results-local\retrieval-fts.json `
  --embeddings results-local\embedding-candidate.json `
  --lifecycle results-local\MODEL-lifecycle.json `
  --pairing results-local\pairing.json `
  --revision results-local\revision.json `
  --score results-local\MODEL-score.json `
  --soak results-local\MODEL-soak-30m.json `
  --transport results-local\transport.json `
  --output results-public\wave0-aggregate.json

python scripts\privacy_scan.py --mode staged
```

Review the sanitized JSON manually before staging. It must contain aggregates only, never raw prompts/responses, local paths, host/user/device identifiers or per-sample logs.

## Production boundary

These commands produce selection evidence only. They do not expose Kaizen records or select a permanent model. Provider-neutral v0.1 exists separately; stop after updating `docs/ai/WAVE-0-REPORT.md` and wait for explicit review before selecting a default model or starting v0.2.