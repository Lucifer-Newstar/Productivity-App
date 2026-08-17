#!/usr/bin/env python3
"""Convert LOCAL-ONLY Wave 0 artifacts into an allowlisted public aggregate.

The output intentionally excludes raw prompts/responses, paths, host/user/device IDs,
serials, UUIDs, MACs, logs, and per-sample telemetry.
"""
from __future__ import annotations
import argparse, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/"results-public"

def load(path): return json.loads(Path(path).read_text(encoding="utf-8")) if path else None
def command_json(hardware,name):
    raw=hardware.get("commands",{}).get(name,{}).get("stdout","")
    try:return json.loads(raw)
    except Exception:return None
def safe_hardware(h):
    if not h:return None
    cpu=command_json(h,"cpu") or {};computer=command_json(h,"computer") or {};os_info=command_json(h,"os") or {};memory=command_json(h,"memoryModules") or []
    if isinstance(memory,dict):memory=[memory]
    nvidia=h.get("nvidia",{}).get("query",{}).get("stdout","").splitlines();nvidia_summary=h.get("nvidia",{}).get("summary",{}).get("stdout","")
    gpu={}
    if nvidia:
        cols=[x.strip() for x in nvidia[0].split(",")]
        # Capture schema: name,memory.total,memory.free,driver,compute capability,power limits,temp,pstate
        keys=["name","memoryTotalMiB","memoryFreeMiB","driver","computeCapability","powerLimitW","defaultPowerLimitW","temperatureC","pstate"]
        gpu=dict(zip(keys,cols));cuda=re.search(r"CUDA Version:\s*([0-9.]+)",nvidia_summary);gpu["cudaVersion"]=cuda.group(1) if cuda else None
    return {
      "platform":{"system":h.get("platform",{}).get("system"),"release":h.get("platform",{}).get("release")},
      "cpu":{"model":cpu.get("Name") or h.get("cpu",{}).get("label"),"physicalCores":cpu.get("NumberOfCores"),"logicalCores":cpu.get("NumberOfLogicalProcessors") or h.get("cpu",{}).get("logicalCores")},
      "memory":{"totalBytes":computer.get("TotalPhysicalMemory") or h.get("memory",{}).get("totalBytes"),"moduleCount":len(memory),"configuredSpeedsMTs":sorted({x.get("ConfiguredClockSpeed") for x in memory if x.get("ConfiguredClockSpeed")})},
      "gpu":gpu,
      "os":{"caption":os_info.get("Caption"),"version":os_info.get("Version"),"build":os_info.get("BuildNumber"),"architecture":os_info.get("OSArchitecture")},
      "benchmarkProfileLabel":h.get("benchmarkProfileLabel"),
      "capturedAt":h.get("capturedAt")
    }
def safe_models(m):
    if not m:return None
    candidates={x.get("id"):x.get("label") for x in m.get("config",{}).get("candidates",[])}
    native=[]
    for item in m.get("nativeBenchmarks",[]):
        rows=item.get("result",{}).get("json")
        if not isinstance(rows,list):continue
        safe_rows=[]
        for row in rows:
            safe_rows.append({k:row.get(k) for k in ("model","size","params","backend","ngl","test","t_s") if k in row})
        native.append({"candidate":item.get("candidate"),"rows":safe_rows})
    summaries=[]
    for row in m.get("summary",[]):
        summaries.append({
          "candidate":row.get("candidate"),"label":candidates.get(row.get("candidate")),"contextSize":row.get("contextSize"),"status":row.get("status"),
          "startupMs":row.get("startupMs"),"shutdownMs":row.get("shutdownMs"),"structured":row.get("structured"),"tools":row.get("tools"),
          "latencyMs":row.get("latencyMs"),"tokensPerSecond":row.get("tokensPerSecond"),"scenarioReliability":row.get("scenarioReliability"),"qualityRates":row.get("qualityRates"),"memory":row.get("memory"),"nvidia":row.get("nvidia"),"concurrency":row.get("concurrency"),"cancellation":row.get("cancellation")
        })
    runtime=m.get("runtimeMeasured",{})
    return {"runtime":{"llamaServerSha256":runtime.get("llamaServerSha256"),"llamaBenchSha256":runtime.get("llamaBenchSha256"),"versionOutput":runtime.get("versionOutput")},"nativeBenchmarks":native,"summaries":summaries}
def safe_retrieval(r):
    if not r:return None
    safe_runs=[]
    for x in r.get("runs",[]):safe_runs.append({k:x.get(k) for k in ("records","queries","indexMs","latencyMs","ranking","deletionVerified")})
    return {"engine":r.get("engine"),"fts5":r.get("fts5"),"method":r.get("method"),"synthetic":r.get("synthetic"),"runs":safe_runs,"passSummary":r.get("passSummary")}
def safe_embeddings(e):
    if not e:return None
    return {k:e.get(k) for k in ("synthetic","documents","queries","repetitions","dimensions","documentBatchMs","queryBatchLatencyMs","ranking")}
def safe_score(x):
    if not x:return None
    return {"gateVersion":x.get("gateVersion"),"overall":x.get("overall"),"counts":x.get("counts"),"gates":[{k:r.get(k) for k in ("gate","status","measured","operator","threshold")} for r in x.get("gates",[])]}
def safe_assertion_result(x):
    if not x:return None
    return {k:x.get(k) for k in ("passed","assertions","checks")}
def safe_soak(x):
    if not x:return None
    return {"candidate":x.get("candidate"),"context":x.get("context"),"requestedDurationSeconds":x.get("requestedDurationSeconds"),"actualDurationSeconds":x.get("actualDurationSeconds"),"startupMs":x.get("startupMs"),"shutdownMs":x.get("shutdownMs"),"summary":x.get("summary")}
def safe_lifecycle(x):
    if not x:return None
    return {"candidate":x.get("candidate"),"context":x.get("context"),"cycles":[{k:r.get(k) for k in ("mode","startupMs","shutdownMs","exitCode","portReleasedWithin10s","wallMs")} for r in x.get("cycles",[])],"summary":x.get("summary"),"passed":x.get("passed")}
def safe_transport(t):
    if not t:return None
    return {k:t.get(k) for k in ("messagesPerRun","runs","sseDeliveryMs","sseHttpCallbackRoundTripMs","webSocketDeliveryMs","webSocketBidirectionalRoundTripMs")}
def safe_thermal(path):
    if not path:return None
    # Thermal aggregates must be generated by the benchmark runner; raw CSV is never copied.
    raise SystemExit("Raw thermal CSV cannot be sanitized directly; use model result nvidia summaries")
def reject_sensitive_text(text):
    patterns=[r"C:[\\/]Users[\\/]",r"/home/[^/<\s]+",r"-----BEGIN .*PRIVATE KEY-----",r"\b(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}\b",r"\bGPU-[0-9a-f-]{20,}\b",r"@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"]
    hits=[p for p in patterns if re.search(p,text,re.I)]
    if hits:raise SystemExit(f"sanitized output still matches sensitive patterns: {hits}")
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--hardware");ap.add_argument("--models");ap.add_argument("--retrieval");ap.add_argument("--embeddings");ap.add_argument("--lifecycle");ap.add_argument("--pairing");ap.add_argument("--revision");ap.add_argument("--score");ap.add_argument("--soak");ap.add_argument("--transport");ap.add_argument("--output",required=True);args=ap.parse_args()
    out=Path(args.output).resolve();public=PUBLIC.resolve()
    if public not in out.parents:raise SystemExit(f"public export must be under {PUBLIC}")
    result={"schemaVersion":1,"classification":"PUBLIC-SANITIZED-AGGREGATE","warning":"No raw prompts, outputs, paths, identifiers or per-sample logs","hardware":safe_hardware(load(args.hardware)),"models":safe_models(load(args.models)),"retrieval":safe_retrieval(load(args.retrieval)),"embeddings":safe_embeddings(load(args.embeddings)),"lifecycle":safe_lifecycle(load(args.lifecycle)),"pairing":safe_assertion_result(load(args.pairing)),"revision":safe_assertion_result(load(args.revision)),"score":safe_score(load(args.score)),"soak":safe_soak(load(args.soak)),"transport":safe_transport(load(args.transport))}
    text=json.dumps(result,indent=2);reject_sensitive_text(text);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(text,encoding="utf-8");print(f"wrote sanitized aggregate {out}")
if __name__=="__main__":main()
