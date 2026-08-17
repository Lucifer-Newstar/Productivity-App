# Target laptop Wave 0 runbook

## Test device baseline

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
```

The runner executes native llama-bench when configured, model startup/shutdown, 4K/8K contexts, structured/tool scenarios, concurrency 1/2, and NVIDIA sampling.

Run each finalist for a 30-minute sustained sample while monitoring NVIDIA metrics:

```powershell
python scripts\monitor_nvidia.py `
  --duration 1800 `
  --interval 1 `
  --output results-local\MODEL-thermal-30m.csv
```

A separate repeated model request/load must run during the same interval; an idle monitor is not a thermal test.

## Required results per candidate

- model identity, source, license, hash and quantization
- llama.cpp build/hash and flags
- startup/shutdown and cancellation behavior
- prompt-processing and generation tokens/sec
- first-token and complete-response latency
- peak RAM and dedicated VRAM
- structured response pass rate over five repetitions
- tool selection/arguments pass rate
- 4K versus 8K context behavior
- concurrency 1 versus 2
- peak/sustained temperature, power and throttling
- AC profile and Windows/ASUS power mode

## Stop rules

Stop a candidate when it repeatedly causes out-of-memory behavior, severe system swapping, unresponsive UI, unsafe temperatures, orphan processes, invalid schema/tool behavior below threshold, or requires unreviewed remote execution.

## Production boundary

These commands produce selection evidence only. They do not start `get_today()`, expose Kaizen records or select a permanent model.