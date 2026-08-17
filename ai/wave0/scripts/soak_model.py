#!/usr/bin/env python3
"""Sustained synthetic model load with thermal/resource/throughput drift metrics."""
from __future__ import annotations
import argparse, json, pathlib, statistics, subprocess, time
from run_benchmarks import server_command, sha256, start_memory_monitor, start_nvidia_monitor, stream_chat, summarize_memory, summarize_nvidia, wait_ready

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--config",required=True);ap.add_argument("--candidate",required=True);ap.add_argument("--context",type=int,default=4096);ap.add_argument("--duration",type=float,default=1800);ap.add_argument("--output",required=True);args=ap.parse_args();cfg=json.loads(pathlib.Path(args.config).read_text());runtime=cfg["runtime"];defaults=cfg["defaults"];candidate=next((x for x in cfg["candidates"] if x["id"]==args.candidate),None)
    if not candidate:raise SystemExit("candidate not found")
    if runtime["host"]!="127.0.0.1":raise SystemExit("soak requires loopback")
    if defaults.get("strictArtifactHashes",True):
        if sha256(runtime["llamaServer"]).lower()!=runtime.get("runtimeSha256","").lower():raise SystemExit("runtime hash mismatch")
        if sha256(candidate["modelPath"]).lower()!=candidate.get("artifactSha256","").lower():raise SystemExit("model hash mismatch")
    output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);log=output.with_suffix(".server.log").open("w",encoding="utf-8");nstop,nthread,nsamples=start_nvidia_monitor();proc=subprocess.Popen(server_command(runtime,defaults,candidate,args.context),stdout=log,stderr=subprocess.STDOUT,text=True);mstop,mthread,msamples=start_memory_monitor(proc.pid);base=f"http://{runtime['host']}:{runtime['port']}";startup=wait_ready(base,runtime["startupTimeoutSeconds"]);started=time.monotonic();requests=[]
    try:
        while time.monotonic()-started<args.duration:
            at=time.monotonic()-started
            payload={"model":"local","messages":[{"role":"user","content":"Synthetic sustained-load request. Return a concise numbered plan with no personal data."}],"temperature":0,"max_tokens":128}
            try:r=stream_chat(base,payload,runtime["requestTimeoutSeconds"]);requests.append({"atSeconds":round(at,3),"totalMs":r["totalMs"],"ttftMs":r["ttftMs"],"tokensPerSecond":r["tokensPerSecond"],"ok":True})
            except Exception as e:requests.append({"atSeconds":round(at,3),"ok":False,"errorType":type(e).__name__})
    finally:
        stop_at=time.perf_counter();proc.terminate()
        try:proc.wait(timeout=15)
        except subprocess.TimeoutExpired:proc.kill();proc.wait()
        shutdown=(time.perf_counter()-stop_at)*1000;time.sleep(max(0,float(defaults.get("recoveryObservationSeconds",30))));nstop.set();mstop.set();nthread.join(timeout=3) if nthread else None;mthread.join(timeout=3);log.close()
    good=[x for x in requests if x["ok"] and x.get("tokensPerSecond")];split=max(1,len(good)//4);first=good[:split];last=good[-split:];first_tps=statistics.mean(x["tokensPerSecond"] for x in first) if first else None;last_tps=statistics.mean(x["tokensPerSecond"] for x in last) if last else None
    out={"schemaVersion":1,"classification":"LOCAL-ONLY-RAW","candidate":candidate["id"],"context":args.context,"requestedDurationSeconds":args.duration,"actualDurationSeconds":round(time.monotonic()-started,3),"startupMs":round(startup,2),"shutdownMs":round(shutdown,2),"requests":requests,"summary":{"totalRequests":len(requests),"successfulRequests":len(good),"firstWindowMeanTokensPerSecond":round(first_tps,2) if first_tps else None,"finalWindowMeanTokensPerSecond":round(last_tps,2) if last_tps else None,"finalToInitialThroughputRatio":round(last_tps/first_tps,4) if first_tps and last_tps else None,"nvidia":summarize_nvidia(nsamples),"memory":summarize_memory(msamples)}};output.write_text(json.dumps(out,indent=2),encoding="utf-8");print(json.dumps({"candidate":candidate["id"],"summary":out["summary"]},indent=2))
if __name__=="__main__":main()
