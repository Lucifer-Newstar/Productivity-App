#!/usr/bin/env python3
"""Capture reproducible local-AI target hardware without third-party packages."""
from __future__ import annotations
import argparse, datetime as dt, json, os, platform, shutil, subprocess, sys
from pathlib import Path


def run(cmd: list[str], timeout: int = 20) -> dict:
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
        return {"command": cmd, "exitCode": p.returncode, "stdout": p.stdout.strip(), "stderr": p.stderr.strip()}
    except Exception as exc:
        return {"command": cmd, "error": f"{type(exc).__name__}: {exc}"}


def powershell(script: str) -> dict:
    exe = shutil.which("powershell") or shutil.which("pwsh")
    return run([exe, "-NoProfile", "-Command", script]) if exe else {"error": "PowerShell not found"}


def total_memory_bytes() -> int | None:
    if sys.platform.startswith("win"):
        r = powershell("(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory")
        try: return int(r.get("stdout", ""))
        except ValueError: return None
    try:
        return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
    except (ValueError, OSError, AttributeError):
        return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True)
    args = ap.parse_args()
    nvidia = shutil.which("nvidia-smi")
    data = {
        "schemaVersion": 1,
        "capturedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "platform": {"system": platform.system(), "release": platform.release(), "version": platform.version(), "machine": platform.machine()},
        "cpu": {"label": platform.processor(), "logicalCores": os.cpu_count()},
        "memory": {"totalBytes": total_memory_bytes()},
        "python": sys.version,
        "power": {},
        "nvidia": {"available": bool(nvidia)},
        "commands": {},
        "requiredManualFields": []
    }
    if sys.platform.startswith("win"):
        data["commands"]["cpu"] = powershell("Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed | ConvertTo-Json -Compress")
        data["commands"]["computer"] = powershell("Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer,Model,TotalPhysicalMemory | ConvertTo-Json -Compress")
        data["power"]["activeScheme"] = run(["powercfg", "/getactivescheme"])
        data["commands"]["battery"] = powershell("Get-CimInstance Win32_Battery | Select-Object BatteryStatus,EstimatedChargeRemaining | ConvertTo-Json -Compress")
    else:
        for name, cmd in {"lscpu": ["lscpu"], "memory": ["free", "-b"], "uname": ["uname", "-a"]}.items():
            if shutil.which(cmd[0]): data["commands"][name] = run(cmd)
    if nvidia:
        query = "name,uuid,memory.total,memory.free,driver_version,power.limit,power.default_limit,temperature.gpu,pstate"
        data["nvidia"]["query"] = run([nvidia, f"--query-gpu={query}", "--format=csv,noheader,nounits"])
        data["nvidia"]["full"] = run([nvidia, "-q"])
    else:
        data["requiredManualFields"].append("Exact RTX 3050 Laptop GPU VRAM cannot be captured: nvidia-smi unavailable")
    data["requiredManualFields"].extend([
        "Record AC and battery benchmark power mode",
        "Record laptop thermal/fan profile",
        "Confirm exact RTX 3050 TGP from OEM specification"
    ])
    out = Path(args.output); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"wrote {out}")
    if not nvidia: print("WARNING: NVIDIA GPU unavailable; this environment cannot produce target-hardware selection evidence.", file=sys.stderr)

if __name__ == "__main__": main()
