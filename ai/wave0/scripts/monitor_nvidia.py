#!/usr/bin/env python3
"""Sample NVIDIA utilization/VRAM/power/temperature during a benchmark."""
import argparse, csv, datetime as dt, subprocess, time
from pathlib import Path
from run_benchmarks import nvidia_smi_executable

FIELDS = "timestamp,name,memory.used,memory.total,utilization.gpu,power.draw,power.limit,temperature.gpu,pstate"

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--output",required=True); ap.add_argument("--interval",type=float,default=1); ap.add_argument("--duration",type=float,default=300); args=ap.parse_args()
    exe=nvidia_smi_executable()
    if not exe: raise SystemExit("nvidia-smi not found")
    out=Path(args.output); out.parent.mkdir(parents=True,exist_ok=True)
    end=time.monotonic()+args.duration
    with out.open("w",newline="",encoding="utf-8") as f:
        writer=csv.writer(f); writer.writerow(["capturedAtUtc",*FIELDS.split(",")])
        while time.monotonic()<end:
            p=subprocess.run([exe,f"--query-gpu={FIELDS}","--format=csv,noheader,nounits"],capture_output=True,text=True)
            now=dt.datetime.now(dt.timezone.utc).isoformat()
            for line in p.stdout.splitlines(): writer.writerow([now,*[x.strip() for x in line.split(",")]])
            f.flush(); time.sleep(max(.2,args.interval))
    print(f"wrote {out}")
if __name__=="__main__": main()
