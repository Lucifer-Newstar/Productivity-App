#!/usr/bin/env python3
"""Run reproducible llama-server lifecycle, structured-output and tool reliability tests.

No model is downloaded. Only candidates explicitly enabled in local config run.
"""
from __future__ import annotations
import argparse, concurrent.futures, datetime as dt, hashlib, json, os, pathlib, shutil, statistics, subprocess, sys, threading, time, urllib.error, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]

def now(): return dt.datetime.now(dt.timezone.utc).isoformat()
def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()
def req_json(url,payload=None,timeout=120,headers=None):
    data=None if payload is None else json.dumps(payload).encode()
    r=urllib.request.Request(url,data=data,headers={"content-type":"application/json",**(headers or {})},method="GET" if payload is None else "POST")
    with urllib.request.urlopen(r,timeout=timeout) as x: return json.loads(x.read())
def wait_ready(base,timeout):
    start=time.perf_counter(); last=""
    while time.perf_counter()-start<timeout:
        try:
            with urllib.request.urlopen(base+"/health",timeout=2) as r:
                if 200<=r.status<300: return (time.perf_counter()-start)*1000
        except Exception as e: last=str(e)
        time.sleep(.25)
    raise TimeoutError(f"server not ready: {last}")
def stream_chat(base,payload,timeout):
    body=dict(payload); body["stream"]=True; body["stream_options"]={"include_usage":True}
    r=urllib.request.Request(base+"/v1/chat/completions",data=json.dumps(body).encode(),headers={"content-type":"application/json"},method="POST")
    start=time.perf_counter(); first=None; text=[]; usage={}; tool_calls=[]
    with urllib.request.urlopen(r,timeout=timeout) as x:
        for raw in x:
            line=raw.decode(errors="replace").strip()
            if not line.startswith("data:"): continue
            item=line[5:].strip()
            if item=="[DONE]": break
            try: obj=json.loads(item)
            except json.JSONDecodeError: continue
            if obj.get("usage"): usage=obj["usage"]
            for choice in obj.get("choices",[]):
                delta=choice.get("delta",{})
                content=delta.get("content") or ""
                if content:
                    if first is None:first=time.perf_counter()
                    text.append(content)
                if delta.get("tool_calls"): tool_calls.extend(delta["tool_calls"])
    end=time.perf_counter(); completion=usage.get("completion_tokens")
    return {"text":"".join(text),"toolCalls":tool_calls,"usage":usage,"ttftMs":None if first is None else round((first-start)*1000,2),"totalMs":round((end-start)*1000,2),"tokensPerSecond":None if not completion or end==start else round(completion/(end-start),2)}
def validate(value,schema,path="$",errors=None):
    errors=[] if errors is None else errors; typ=schema.get("type")
    ok={"object":lambda:isinstance(value,dict),"array":lambda:isinstance(value,list),"string":lambda:isinstance(value,str),"number":lambda:isinstance(value,(int,float)) and not isinstance(value,bool),"boolean":lambda:isinstance(value,bool),"null":lambda:value is None}
    if typ in ok and not ok[typ](): errors.append(f"{path}: expected {typ}"); return errors
    if "const" in schema and value!=schema["const"]: errors.append(f"{path}: expected const {schema['const']!r}")
    if isinstance(value,(int,float)) and not isinstance(value,bool):
        if "minimum" in schema and value<schema["minimum"]:errors.append(f"{path}: below minimum")
        if "maximum" in schema and value>schema["maximum"]:errors.append(f"{path}: above maximum")
    if isinstance(value,dict):
        props=schema.get("properties",{}); required=schema.get("required",[])
        for k in required:
            if k not in value: errors.append(f"{path}: missing {k}")
        if schema.get("additionalProperties") is False:
            for k in value:
                if k not in props: errors.append(f"{path}: unexpected {k}")
        for k,v in value.items():
            if k in props:validate(v,props[k],f"{path}.{k}",errors)
    if isinstance(value,list):
        if len(value)<schema.get("minItems",0):errors.append(f"{path}: too few items")
        if "maxItems" in schema and len(value)>schema["maxItems"]:errors.append(f"{path}: too many items")
        for i,v in enumerate(value):validate(v,schema.get("items",{}),f"{path}[{i}]",errors)
    if "enum" in schema and value not in schema["enum"]:errors.append(f"{path}: not in enum")
    return errors
def tool_names(calls):
    names=[]
    for c in calls:
        fn=c.get("function",{}); name=fn.get("name")
        if name:names.append(name)
    return names
def merge_tool_chunks(calls):
    merged={}
    for c in calls:
        idx=c.get("index",0); dest=merged.setdefault(idx,{"name":"","arguments":""}); fn=c.get("function",{}); dest["name"]+=fn.get("name",""); dest["arguments"]+=fn.get("arguments","")
    return list(merged.values())
def value_at(obj,path):
    cur=obj
    for part in path.split("."):
        if not isinstance(cur,dict) or part not in cur:return None
        cur=cur[part]
    return cur
def evaluate_structured(parsed,expect):
    failures=[];serialized=json.dumps(parsed,sort_keys=True)
    if expect.get("sourceId") and expect["sourceId"] not in parsed.get("sourceIds",[]):failures.append("expected source ID missing")
    if any(x in serialized for x in expect.get("forbiddenIds",[])+expect.get("forbiddenText",[])):failures.append("forbidden output present")
    if expect.get("requiredText") and not all(x.lower() in serialized.lower() for x in expect["requiredText"]):failures.append("required text missing")
    if "maxConfidence" in expect and parsed.get("confidence",1)>expect["maxConfidence"]:failures.append("confidence too high")
    if "minConfidence" in expect and parsed.get("confidence",0)<expect["minConfidence"]:failures.append("confidence too low")
    if expect.get("contains") and not all(x.lower() in serialized.lower() for x in expect["contains"]):failures.append("expected content missing")
    if expect.get("allowedIds") is not None and any(x not in expect["allowedIds"] for x in parsed.get("sourceIds",[])):failures.append("fabricated source ID")
    if expect.get("requiresUncertainty") and not parsed.get("uncertainty"):failures.append("uncertainty missing")
    for path,want in expect.get("fieldEquals",{}).items():
        if value_at(parsed,path)!=want:failures.append(f"{path} mismatch")
    return failures

def run_scenario(base,scenario,defaults,timeout):
    payload={"model":"local","messages":[{"role":"system","content":scenario["system"]},{"role":"user","content":scenario["user"]}],"temperature":defaults["temperature"],"max_tokens":defaults["maxOutputTokens"]}
    kind="tool" if "tools" in scenario else "structured"
    if kind=="structured": payload["response_format"]={"type":"json_schema","schema":scenario["schema"]}
    else: payload["tools"]=scenario["tools"]; payload["tool_choice"]="auto"
    try:
        r=stream_chat(base,payload,timeout); passed=True; failures=[]
        if kind=="structured":
            try: parsed=json.loads(r["text"])
            except Exception as e: parsed=None; failures.append(f"invalid JSON: {e}")
            if parsed is not None: failures.extend(validate(parsed,scenario["schema"])); exp=scenario.get("expect",{})
            if parsed is not None:failures.extend(evaluate_structured(parsed,exp))
        else:
            calls=merge_tool_chunks(r["toolCalls"]); names=[x["name"] for x in calls]; exp=scenario.get("expect",{})
            if exp.get("tool") and exp["tool"] not in names:failures.append(f"expected {exp['tool']}, got {names}")
            if exp.get("noTool") and names:failures.append(f"expected no tool, got {names}")
            if any(x in names for x in exp.get("forbiddenTools",[])):failures.append("forbidden tool selected")
            if exp.get("allowedTools") is not None and any(x not in exp["allowedTools"] for x in names):failures.append("unregistered tool selected")
            if len(calls)>exp.get("maxToolCalls",999):failures.append("too many tool calls")
            if exp.get("arguments") is not None and exp.get("tool") in names:
                call=calls[names.index(exp["tool"])]
                try:actual=json.loads(call["arguments"] or "{}")
                except json.JSONDecodeError:failures.append("tool arguments are invalid JSON")
                else:
                    if actual!=exp["arguments"]:failures.append(f"tool arguments mismatch: {actual}")
        r.update({"scenarioId":scenario["id"],"kind":kind,"passed":not failures,"failures":failures}); return r
    except Exception as e:return {"scenarioId":scenario["id"],"kind":kind,"passed":False,"failures":[f"{type(e).__name__}: {e}"]}

def server_command(runtime,defaults,candidate,ctx):
    return [runtime["llamaServer"],"--model",candidate["modelPath"],"--host",runtime["host"],"--port",str(runtime["port"]),"--ctx-size",str(ctx),"--threads",str(defaults["threads"]),"--n-gpu-layers",str(defaults["gpuLayers"]),"--batch-size",str(defaults["batchSize"]),"--ubatch-size",str(defaults["ubatchSize"]),"--parallel",str(max(defaults.get("concurrency",[1]))),"--metrics",*candidate.get("extraArgs",[])]
def start_nvidia_monitor():
    exe=shutil.which("nvidia-smi");samples=[];stop=threading.Event()
    def sample():
        fields="memory.used,memory.total,utilization.gpu,power.draw,power.limit,temperature.gpu,pstate"
        while not stop.is_set():
            try:
                p=subprocess.run([exe,f"--query-gpu={fields}","--format=csv,noheader,nounits"],capture_output=True,text=True,timeout=5)
                row=p.stdout.splitlines()[0].split(",");samples.append({"capturedAt":now(),"memoryUsedMiB":float(row[0]),"memoryTotalMiB":float(row[1]),"utilizationPct":float(row[2]),"powerW":float(row[3]),"powerLimitW":float(row[4]),"temperatureC":float(row[5]),"pstate":row[6].strip()})
            except Exception:pass
            stop.wait(1)
    thread=threading.Thread(target=sample,daemon=True) if exe else None
    if thread:thread.start()
    return stop,thread,samples
def summarize_nvidia(samples):
    if not samples:return {"available":False,"samples":0}
    def values(k):return [x[k] for x in samples]
    temps=sorted(values("temperatureC"));p95=temps[min(len(temps)-1,round((len(temps)-1)*.95))]
    return {"available":True,"samples":len(samples),"peakMemoryUsedMiB":max(values("memoryUsedMiB")),"peakUtilizationPct":max(values("utilizationPct")),"meanPowerW":round(statistics.mean(values("powerW")),2),"peakPowerW":max(values("powerW")),"p95TemperatureC":p95,"peakTemperatureC":max(temps),"startTemperatureC":samples[0]["temperatureC"],"endTemperatureC":samples[-1]["temperatureC"]}
def start_memory_monitor(pid):
    samples=[];stop=threading.Event();ps=shutil.which("powershell") or shutil.which("pwsh")
    def sample():
        previous_cpu=None;previous_at=None;clock_ticks=os.sysconf("SC_CLK_TCK") if not sys.platform.startswith("win") else None
        while not stop.is_set():
            rss=None;available=None;cpu_seconds=None;measured_at=time.monotonic()
            try:
                if sys.platform.startswith("win") and ps:
                    script=f"$p=Get-Process -Id {pid};$o=Get-CimInstance Win32_OperatingSystem;[pscustomobject]@{{rss=[int64]$p.WorkingSet64;available=[int64]($o.FreePhysicalMemory*1024);cpu=[double]$p.CPU}}|ConvertTo-Json -Compress"
                    p=subprocess.run([ps,"-NoProfile","-Command",script],capture_output=True,text=True,timeout=5);row=json.loads(p.stdout);rss=int(row["rss"]);available=int(row["available"]);cpu_seconds=float(row["cpu"])
                elif pathlib.Path(f"/proc/{pid}/status").is_file():
                    fields={line.split(":",1)[0]:line.split(":",1)[1].strip() for line in pathlib.Path(f"/proc/{pid}/status").read_text().splitlines() if ":" in line};rss=int(fields["VmRSS"].split()[0])*1024
                    mem={line.split(":",1)[0]:line.split(":",1)[1].strip() for line in pathlib.Path("/proc/meminfo").read_text().splitlines() if ":" in line};available=int(mem["MemAvailable"].split()[0])*1024
                    rest=pathlib.Path(f"/proc/{pid}/stat").read_text().rsplit(") ",1)[1].split();cpu_seconds=(int(rest[11])+int(rest[12]))/clock_ticks
                cpu_pct=None
                if cpu_seconds is not None and previous_cpu is not None and measured_at>previous_at:cpu_pct=max(0,(cpu_seconds-previous_cpu)/(measured_at-previous_at)*100)
                if rss is not None:samples.append({"capturedAt":now(),"processRssBytes":rss,"systemAvailableBytes":available,"processCpuPct":cpu_pct})
                previous_cpu=cpu_seconds;previous_at=measured_at
            except Exception:pass
            stop.wait(1)
    thread=threading.Thread(target=sample,daemon=True);thread.start();return stop,thread,samples
def summarize_memory(samples):
    if not samples:return {"available":False,"samples":0}
    available=[x["systemAvailableBytes"] for x in samples if x["systemAvailableBytes"] is not None];cpu=[x["processCpuPct"] for x in samples if x.get("processCpuPct") is not None]
    return {"available":True,"samples":len(samples),"peakProcessRssBytes":max(x["processRssBytes"] for x in samples),"minimumSystemAvailableBytes":min(available) if available else None,"meanProcessCpuPct":round(statistics.mean(cpu),2) if cpu else None,"peakProcessCpuPct":round(max(cpu),2) if cpu else None}
def native_bench(runtime,defaults,candidate):
    exe=runtime.get("llamaBench")
    if not exe or not pathlib.Path(exe).is_file():return {"status":"unavailable"}
    cmd=[exe,"-m",candidate["modelPath"],"-p","512,2048","-n","128","-ngl",str(defaults["gpuLayers"]),"-t",str(defaults["threads"]),"-r","3","-o","json"]
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=600)
        try:parsed=json.loads(p.stdout)
        except json.JSONDecodeError:parsed=None
        return {"status":"ok" if p.returncode==0 else "failed","exitCode":p.returncode,"json":parsed,"stdout":p.stdout[-20000:] if parsed is None else None,"stderr":p.stderr[-4000:]}
    except Exception as e:return {"status":"error","error":f"{type(e).__name__}: {e}"}
def summarize_runs(runs):
    out=[]
    def metric(xs):
        if not xs:return {"mean":None,"p50":None,"p95":None}
        ys=sorted(xs);at=lambda p:ys[min(len(ys)-1,round((len(ys)-1)*p))]
        return {"mean":round(statistics.mean(xs),2),"p50":round(at(.5),2),"p95":round(at(.95),2)}
    for run in runs:
        scenarios=run.get("scenarios",[]);structured=[x for x in scenarios if x.get("kind")=="structured"];tools=[x for x in scenarios if x.get("kind")=="tool"]
        numeric=lambda key:[x[key] for x in scenarios if isinstance(x.get(key),(int,float))]
        per_scenario={}
        for row in scenarios:
            x=per_scenario.setdefault(row.get("scenarioId"),{"kind":row.get("kind"),"passed":0,"total":0});x["total"]+=1;x["passed"]+=int(bool(row.get("passed")))
        for x in per_scenario.values():x["rate"]=round(x["passed"]/x["total"],4) if x["total"] else None
        def group_rate(ids):
            rows=[per_scenario[x]["rate"] for x in ids if x in per_scenario];return round(statistics.mean(rows),4) if len(rows)==len(ids) else None
        grounding_rate=group_rate(["priority-grounding","fabricated-id-trap","cross-domain-conflict"]);injection_rate=group_rate(["prompt-injection-imported-jd","tool-prompt-injection"]);precedence_rate=group_rate(["current-record-over-memory","deterministic-analytic-over-feeling-memory","stale-snapshot"]);uncertainty_rate=group_rate(["uncertainty-no-velocity","health-consent-missing","empty-account"])
        out.append({"candidate":run.get("candidate"),"contextSize":run.get("contextSize"),"status":"error" if run.get("error") else "complete","startupMs":run.get("startupMs"),"shutdownMs":run.get("shutdownMs"),"structured":{"passed":sum(bool(x.get("passed")) for x in structured),"total":len(structured),"rate":round(sum(bool(x.get("passed")) for x in structured)/len(structured),4) if structured else None},"tools":{"passed":sum(bool(x.get("passed")) for x in tools),"total":len(tools),"rate":round(sum(bool(x.get("passed")) for x in tools)/len(tools),4) if tools else None},"latencyMs":{"ttft":metric(numeric("ttftMs")),"total":metric(numeric("totalMs"))},"tokensPerSecond":metric(numeric("tokensPerSecond")),"scenarioReliability":per_scenario,"qualityRates":{"groundingPassRate":grounding_rate,"unsupportedClaimRate":round(1-grounding_rate,4) if grounding_rate is not None else None,"promptInjectionPassRate":injection_rate,"promptInjectionFailureRate":round(1-injection_rate,4) if injection_rate is not None else None,"sourcePrecedencePassRate":precedence_rate,"uncertaintyPassRate":uncertainty_rate},"memory":run.get("memorySummary"),"nvidia":run.get("nvidiaSummary"),"concurrency":run.get("concurrency",[]),"cancellation":run.get("cancellationProbe")})
    return out
def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--config",required=True); ap.add_argument("--output",required=True); ap.add_argument("--scenarios",default=str(ROOT/"scenarios/kaizen-eval.json")); args=ap.parse_args()
    cfg=json.loads(pathlib.Path(args.config).read_text()); scenarios=json.loads(pathlib.Path(args.scenarios).read_text()); runtime=cfg["runtime"]; defaults=cfg["defaults"]
    enabled=[x for x in cfg["candidates"] if x.get("enabled")]
    if not enabled: raise SystemExit("No candidates enabled. Edit a local config; the harness never downloads models.")
    if not pathlib.Path(runtime["llamaServer"]).is_file():raise SystemExit("llamaServer does not exist")
    strict=defaults.get("strictArtifactHashes",True);server_hash=sha256(runtime["llamaServer"]);declared_server=runtime.get("runtimeSha256","")
    if strict and (len(declared_server)!=64 or declared_server.lower()!=server_hash.lower()):raise SystemExit("llamaServer SHA-256 missing or mismatched")
    bench_hash=sha256(runtime["llamaBench"]) if runtime.get("llamaBench") and pathlib.Path(runtime["llamaBench"]).is_file() else None
    declared_bench=runtime.get("llamaBenchSha256","")
    if strict and bench_hash and (len(declared_bench)!=64 or declared_bench.lower()!=bench_hash.lower()):raise SystemExit("llamaBench SHA-256 missing or mismatched")
    version=subprocess.run([runtime["llamaServer"],"--version"],capture_output=True,text=True,timeout=15)
    results={"schemaVersion":1,"startedAt":now(),"runtimeMeasured":{"llamaServerSha256":server_hash,"llamaBenchSha256":bench_hash,"versionExitCode":version.returncode,"versionOutput":(version.stdout+version.stderr).strip()[:4000]}, "config":json.loads(json.dumps(cfg)),"nativeBenchmarks":[],"runs":[],"environment":{"platform":sys.platform}}
    # Avoid leaking local model absolute paths in result files.
    results["config"]["runtime"]["llamaServer"]="<local-path-redacted>"
    results["config"]["runtime"]["llamaBench"]="<local-path-redacted>"
    for c in results["config"]["candidates"]: c["modelPath"]="<local-path-redacted>"
    for candidate in enabled:
        model=pathlib.Path(candidate["modelPath"])
        if not model.is_file(): results["runs"].append({"candidate":candidate["id"],"error":"model missing"}); continue
        artifact=sha256(model);declared_model=candidate.get("artifactSha256","")
        if strict and (len(declared_model)!=64 or declared_model.lower()!=artifact.lower()):results["runs"].append({"candidate":candidate["id"],"error":"model SHA-256 missing or mismatched"});continue
        results["nativeBenchmarks"].append({"candidate":candidate["id"],"result":native_bench(runtime,defaults,candidate)})
        for ctx in defaults["contextSizes"]:
            cmd=server_command(runtime,defaults,candidate,ctx); log_path=pathlib.Path(args.output).with_suffix(f".{candidate['id']}.{ctx}.server.log")
            log_path.parent.mkdir(parents=True,exist_ok=True); log=log_path.open("w",encoding="utf-8")
            monitor_stop,monitor_thread,monitor_samples=start_nvidia_monitor()
            started=time.perf_counter()
            try: proc=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,text=True)
            except Exception as e:
                monitor_stop.set()
                if monitor_thread:monitor_thread.join(timeout=3)
                log.close();results["runs"].append({"candidate":candidate["id"],"contextSize":ctx,"error":f"launch failed: {type(e).__name__}: {e}"});continue
            memory_stop,memory_thread,memory_samples=start_memory_monitor(proc.pid)
            run={"candidate":candidate["id"],"label":candidate["label"],"contextSize":ctx,"artifactSha256Measured":artifact,"artifactSha256Declared":candidate.get("artifactSha256"),"serverCommand":["<llama-server>",*cmd[1:2],"<model-path>",*cmd[3:]],"startedAt":now()};cancel_thread=None;cancel_state={}
            try:
                base=f"http://{runtime['host']}:{runtime['port']}"; run["startupMs"]=round(wait_ready(base,runtime["startupTimeoutSeconds"]),2); run["scenarios"]=[]
                for _ in range(defaults["repetitions"]):
                    for s in scenarios["structured"]+scenarios["tools"]: run["scenarios"].append(run_scenario(base,s,defaults,runtime["requestTimeoutSeconds"]))
                run["concurrency"]=[]
                for n in defaults.get("concurrency",[1]):
                    sample=scenarios["structured"][0]; t=time.perf_counter()
                    with concurrent.futures.ThreadPoolExecutor(max_workers=n) as pool: rr=list(pool.map(lambda _:run_scenario(base,sample,defaults,runtime["requestTimeoutSeconds"]),range(n)))
                    times=sorted(x["totalMs"] for x in rr if isinstance(x.get("totalMs"),(int,float)));p95=times[min(len(times)-1,round((len(times)-1)*.95))] if times else None
                    run["concurrency"].append({"clients":n,"wallMs":round((time.perf_counter()-t)*1000,2),"perRequestTotalMs":times,"p95RequestMs":p95,"passed":sum(x["passed"] for x in rr),"total":n})
                def long_request():
                    payload={"model":"local","messages":[{"role":"user","content":"Produce a long synthetic numbered list for cancellation testing. No personal data."}],"temperature":0,"max_tokens":4096}
                    try:cancel_state["result"]=stream_chat(base,payload,runtime["requestTimeoutSeconds"]);cancel_state["completedBeforeTerminate"]=True
                    except Exception as e:cancel_state["error"]=f"{type(e).__name__}: {e}";cancel_state["completedBeforeTerminate"]=False
                cancel_thread=threading.Thread(target=long_request,daemon=True);cancel_thread.start();time.sleep(defaults.get("cancellationDelaySeconds",1));run["cancellationProbe"]={"requestAliveAtTerminate":cancel_thread.is_alive()}
            except Exception as e: run["error"]=f"{type(e).__name__}: {e}"
            finally:
                terminate_start=time.perf_counter(); proc.terminate()
                try:proc.wait(timeout=15)
                except subprocess.TimeoutExpired:proc.kill();proc.wait()
                run["shutdownMs"]=round((time.perf_counter()-terminate_start)*1000,2); run["exitCode"]=proc.returncode
                if cancel_thread:
                    cancel_thread.join(timeout=5);run["cancellationProbe"].update(cancel_state);run["cancellationProbe"]["requestReleasedWithin5s"]=not cancel_thread.is_alive()
                recovery=max(0,float(defaults.get("recoveryObservationSeconds",2)));time.sleep(recovery);run["recoveryObservationSeconds"]=recovery;run["wallMs"]=round((time.perf_counter()-started)*1000,2)
                monitor_stop.set();memory_stop.set()
                if monitor_thread:monitor_thread.join(timeout=3)
                memory_thread.join(timeout=3)
                run["nvidiaSummary"]=summarize_nvidia(monitor_samples);run["memorySummary"]=summarize_memory(memory_samples);log.close()
            results["runs"].append(run)
    results["summary"]=summarize_runs(results["runs"]);results["completedAt"]=now(); out=pathlib.Path(args.output); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(results,indent=2),encoding="utf-8"); print(f"wrote {out}")
if __name__=="__main__":main()
