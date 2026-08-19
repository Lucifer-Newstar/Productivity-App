# W0 target hardware capture

## Status

**PARTIALLY CAPTURED — USER-SUPPLIED DEVICE SPECIFICATION; LOCAL TELEMETRY PENDING.**

The supplied specification is documented here as a sanitized baseline. Machine-specific expectation files and raw captures remain LOCAL-ONLY.

## Supplied test-device baseline

```text
Device: ASUS TUF Gaming A15 FA506NCR
CPU: AMD Ryzen 7 7435HS, 8C/16T, 3.1–4.5 GHz, 20 MB cache
GPU: NVIDIA GeForce RTX 3050 Laptop GPU
Dedicated VRAM: 4 GB GDDR6
GPU power: 60 W; up to 75 W Dynamic Boost
RAM: 16 GB DDR5, two SO-DIMM slots
Storage: approximately 2.5 TB installed
OS: Windows 11
Adapter: 180 W
```

The 4 GB VRAM / 16 GB RAM limit is a hard model/context/concurrency constraint. Windows shared GPU memory must not be reported as dedicated VRAM.

## Required local fields

The following still require machine-generated capture:

- exact RAM module speed/configured clock and part numbers
- physical drive names, bus/media types, capacities and volume layout
- Windows edition, version and build
- NVIDIA driver, current/default power limits, p-state and idle temperature
- Windows active power-scheme GUID
- ASUS/Armoury Crate thermal profile
- AC/battery state for each run

## Local capture

Run under AC balanced and AC performance modes:

```powershell
cd ai\wave0
python scripts\capture_hardware.py `
  --expected config\hardware.local.json `
  --profile-label "AC balanced" `
  --output results-local\target-hardware-ac-balanced.json
```

Repeat with a different output filename after changing the profile. The capture compares detected CPU, threads, RAM, device model, GPU and dedicated VRAM against the supplied manifest.

## Sandbox observation — not a target result

```text
Environment: Linux KVM sandbox
CPU: 2 logical Intel Xeon vCPUs
RAM: approximately 1.9 GiB
NVIDIA runtime: unavailable
```

Sandbox values validate the harness only and cannot select a local model.

## Benchmark eligibility

Model and thermal results are eligible only when the same run set includes target hardware JSON and records llama.cpp build/hash, model hash, quantization, context size, GPU layers, power mode and ASUS thermal profile.