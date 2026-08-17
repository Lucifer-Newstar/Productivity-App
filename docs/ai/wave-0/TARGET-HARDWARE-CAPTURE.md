# W0 target hardware capture

## Status

**BLOCKED on target laptop execution.** The Arena sandbox is not the Ryzen 7 / RTX 3050 laptop and cannot produce selection evidence.

## Sandbox observation — not a target result

Captured 2026-08-17:

```text
Environment: Linux KVM sandbox
CPU: 2 logical Intel Xeon vCPUs @ reported 2.60 GHz
RAM: approximately 1.9 GiB
NVIDIA runtime: unavailable; nvidia-smi not installed
```

These numbers are useful only to prove that GPU/model benchmarks must not run here.

## Required target capture

Run from the repository on the target Windows laptop:

```powershell
cd ai\wave0
python scripts\capture_hardware.py --output results\target-hardware-ac.json
```

Repeat under each intended power mode, including AC high-performance and the normal balanced profile. Record manually:

- exact CPU model
- installed/available RAM
- exact GPU name
- dedicated VRAM
- NVIDIA driver
- default and current power limit where exposed
- OEM GPU TGP
- Windows active power scheme
- laptop thermal/fan profile
- AC or battery state

Use `nvidia-smi`, not aggregated Windows “GPU memory,” for dedicated VRAM.

## Benchmark eligibility

Model and thermal results are eligible for the selection report only when their run references a hardware-capture JSON from the same machine/configuration and records llama.cpp build/hash, model hash, quantization, context, GPU layers and power mode.