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
    ap.add_argument("--expected", help="Optional LOCAL-ONLY expectation manifest to compare against")
    ap.add_argument("--profile-label", required=True, help="Non-identifying label such as 'AC performance'")
    args = ap.parse_args()
    nvidia = shutil.which("nvidia-smi")
    data = {
        "schemaVersion": 1,
        "capturedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "classification": "LOCAL-ONLY-RAW",
        "benchmarkProfileLabel": args.profile_label,
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
        data["commands"]["os"] = powershell("Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture | ConvertTo-Json -Compress")
        data["commands"]["memoryModules"] = powershell("Get-CimInstance Win32_PhysicalMemory | Select-Object BankLabel,Capacity,Speed,ConfiguredClockSpeed,Manufacturer,PartNumber | ConvertTo-Json -Compress")
        data["commands"]["physicalDisks"] = powershell("Get-PhysicalDisk | Select-Object FriendlyName,MediaType,BusType,Size,HealthStatus | ConvertTo-Json -Compress")
        data["commands"]["volumes"] = powershell("Get-Volume | Select-Object DriveLetter,FileSystemLabel,FileSystem,Size,SizeRemaining,HealthStatus | ConvertTo-Json -Compress")
        data["power"]["activeScheme"] = run(["powercfg", "/getactivescheme"])
        data["commands"]["battery"] = powershell("Get-CimInstance Win32_Battery | Select-Object BatteryStatus,EstimatedChargeRemaining | ConvertTo-Json -Compress")
    else:
        for name, cmd in {"lscpu": ["lscpu"], "memory": ["free", "-b"]}.items():
            if shutil.which(cmd[0]): data["commands"][name] = run(cmd)
    if nvidia:
        query = "name,memory.total,memory.free,driver_version,compute_cap,power.limit,power.default_limit,temperature.gpu,pstate"
        data["nvidia"]["query"] = run([nvidia, f"--query-gpu={query}", "--format=csv,noheader,nounits"])
        data["nvidia"]["summary"] = run([nvidia])
    else:
        data["requiredManualFields"].append("Exact RTX 3050 Laptop GPU VRAM cannot be captured: nvidia-smi unavailable")
    data["requiredManualFields"].extend([
        "Record AC and battery benchmark power mode",
        "Record laptop thermal/fan profile",
        "Confirm exact RTX 3050 TGP from OEM specification"
    ])
    if args.expected:
        expected_path=Path(args.expected)
        expected=json.loads(expected_path.read_text(encoding="utf-8"))
        blob=json.dumps(data).lower()
        checks=[]
        def add(name,status,expected_value,detected=None): checks.append({"name":name,"status":status,"expected":expected_value,"detected":detected})
        exp_model=expected.get("device",{}).get("model")
        add("device model", "pass" if exp_model and exp_model.lower() in blob else "unknown", exp_model)
        exp_cpu=expected.get("cpu",{}).get("model")
        add("CPU model", "pass" if exp_cpu and exp_cpu.lower() in blob else "unknown", exp_cpu, data["cpu"].get("label"))
        exp_threads=expected.get("cpu",{}).get("logicalCores"); detected_threads=data["cpu"].get("logicalCores")
        add("logical cores", "pass" if exp_threads==detected_threads else "mismatch", exp_threads, detected_threads)
        exp_ram=expected.get("memory",{}).get("installedGiB"); detected_ram=data["memory"].get("totalBytes")
        ram_ok=bool(exp_ram and detected_ram and abs(detected_ram-exp_ram*1024**3)<1.5*1024**3)
        add("installed RAM", "pass" if ram_ok else "mismatch", f"{exp_ram} GiB", detected_ram)
        exp_gpu=expected.get("gpu",{}).get("model")
        add("GPU model", "pass" if exp_gpu and exp_gpu.lower() in blob else "unknown", exp_gpu)
        exp_vram=expected.get("gpu",{}).get("dedicatedVramMiB");query=data.get("nvidia",{}).get("query",{}).get("stdout","")
        detected_vram=None
        try: detected_vram=float(query.split(",")[1].strip())
        except (ValueError,IndexError): pass
        add("dedicated VRAM", "pass" if detected_vram and abs(detected_vram-exp_vram)<128 else "unknown", f"{exp_vram} MiB", detected_vram)
        data["expectedManifest"]={"path":str(expected_path),"checks":checks,"allDetectedChecksPass":all(x["status"]=="pass" for x in checks)}
    out = Path(args.output); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"wrote {out}")
    if not nvidia: print("WARNING: NVIDIA GPU unavailable; this environment cannot produce target-hardware selection evidence.", file=sys.stderr)

if __name__ == "__main__": main()
