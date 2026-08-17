#!/usr/bin/env python3
"""Probe llama-server normal shutdown, simulated crash, port release and restart."""
from __future__ import annotations
import argparse, json, pathlib, socket, subprocess, time
from run_benchmarks import server_command, sha256, wait_ready

def port_free(host,port):
    s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
    try:s.bind((host,port));return True
    except OSError:return False
    finally:s.close()
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--config",required=True);ap.add_argument("--candidate",required=True);ap.add_argument("--context",type=int,default=4096);ap.add_argument("--output",required=True);args=ap.parse_args()
    cfg=json.loads(pathlib.Path(args.config).read_text());runtime=cfg["runtime"];defaults=cfg["defaults"];candidate=next((x for x in cfg["candidates"] if x["id"]==args.candidate),None)
    if not candidate:raise SystemExit("candidate not found")
    if runtime["host"]!="127.0.0.1":raise SystemExit("lifecycle probe requires loopback")
    if not pathlib.Path(runtime["llamaServer"]).is_file() or not pathlib.Path(candidate["modelPath"]).is_file():raise SystemExit("runtime/model missing")
    if defaults.get("strictArtifactHashes",True):
        if sha256(runtime["llamaServer"]).lower()!=runtime.get("runtimeSha256","").lower():raise SystemExit("runtime hash mismatch")
        if sha256(candidate["modelPath"]).lower()!=candidate.get("artifactSha256","").lower():raise SystemExit("model hash mismatch")
    cmd=server_command(runtime,defaults,candidate,args.context);cycles=[]
    for mode in ("normal-shutdown","simulated-crash","restart-after-crash"):
        log=pathlib.Path(args.output).with_suffix(f".{mode}.server.log").open("w",encoding="utf-8");start=time.perf_counter();p=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,text=True)
        try:startup=wait_ready(f"http://{runtime['host']}:{runtime['port']}",runtime["startupTimeoutSeconds"])
        except Exception:
            p.kill();p.wait();log.close();raise
        stop=time.perf_counter();p.kill() if mode=="simulated-crash" else p.terminate()
        try:p.wait(timeout=15)
        except subprocess.TimeoutExpired:p.kill();p.wait()
        shutdown=(time.perf_counter()-stop)*1000;released=False;deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            if port_free(runtime["host"],runtime["port"]):released=True;break
            time.sleep(.1)
        cycles.append({"mode":mode,"startupMs":round(startup,2),"shutdownMs":round(shutdown,2),"exitCode":p.returncode,"portReleasedWithin10s":released,"wallMs":round((time.perf_counter()-start)*1000,2)});log.close()
    startups=sorted(x["startupMs"] for x in cycles);shutdowns=sorted(x["shutdownMs"] for x in cycles);out={"schemaVersion":1,"classification":"LOCAL-ONLY-RAW","candidate":candidate["id"],"context":args.context,"cycles":cycles,"summary":{"startupP95Ms":startups[-1],"shutdownP95Ms":shutdowns[-1],"allPortsReleased":all(x["portReleasedWithin10s"] for x in cycles)},"passed":all(x["portReleasedWithin10s"] for x in cycles)};path=pathlib.Path(args.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2),encoding="utf-8");print(json.dumps(out,indent=2))
if __name__=="__main__":main()
