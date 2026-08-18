#!/usr/bin/env python3
"""Wave 0 harness regression gate; uses only synthetic data and temporary files."""
import json, pathlib, py_compile, subprocess, sys, tempfile, time
from run_benchmarks import probe_request_cancellation, start_memory_monitor, start_nvidia_monitor, wait_ready
ROOT=pathlib.Path(__file__).resolve().parents[1]
passed=0

def check(label,condition):
    global passed
    if not condition: raise AssertionError(label)
    passed+=1;print(f"✓ {label}")
def run(cmd):
    p=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=30)
    if p.returncode:raise AssertionError(f"{' '.join(cmd)} failed\n{p.stdout}\n{p.stderr}")
    return p
def cancellation_fixture(port,orphan_seconds):
    process=subprocess.Popen([sys.executable,"prototypes/mock_llama_server.py","--host","127.0.0.1","--port",str(port),"--orphan-cancel-seconds",str(orphan_seconds)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);base=f"http://127.0.0.1:{port}";nstop,nthread,nsamples=start_nvidia_monitor();mstop,mthread,msamples=start_memory_monitor(process.pid)
    try:
        wait_ready(base,5);time.sleep(.1);payload={"model":"local","messages":[{"role":"user","content":"Synthetic request-level cancellation testing"}],"max_tokens":4096};return probe_request_cancellation(base,payload,.05,.3,process,nsamples,msamples,5)
    finally:
        process.terminate();process.wait(timeout=5);nstop.set();mstop.set();nthread.join(timeout=1) if nthread else None;mthread.join(timeout=1)

def main():
    cfg=json.loads((ROOT/"config/candidates.example.json").read_text())
    check("example candidates disabled",all(not x["enabled"] for x in cfg["candidates"]))
    check("runtime binds loopback",cfg["runtime"]["host"]=="127.0.0.1")
    check("artifact hashes required by default",cfg["defaults"]["strictArtifactHashes"] is True)
    check("model artifacts absent",not any(ROOT.rglob("*.gguf")))
    source=(ROOT/"scripts/run_benchmarks.py").read_text()
    check("benchmark has no downloader",all(x not in source for x in ["urlretrieve(","huggingface_hub","requests.get("]))
    check("benchmark redacts model paths",'"<local-path-redacted>"' in source)
    orchestrator=(ROOT/"run_target_wave0.ps1").read_text();check("target orchestrator preserves Wave 0 boundary",all(x in orchestrator for x in ["results-local","sanitize_results.py","score_results.py","Exactly one candidate","starting v0.2"]) and "get_today" not in orchestrator)
    run(["node","prototypes/revision-coordinator.mjs"]);check("revision prototype passes",True)
    run([sys.executable,"prototypes/pairing_server.py","--self-test"]);check("pairing prototype passes",True)
    cancelled=cancellation_fixture(18994,0);check("request-level cancellation acknowledges and terminates without killing server",cancelled["cancellationAcknowledged"] and cancelled["requestTerminated"] and cancelled["processAlive"] and cancelled["orphanFree"] and cancelled["resourcesRecovered"] is True and cancelled["acknowledgementLatencyMs"]>=0 and cancelled["requestTerminationLatencyMs"]>=0)
    orphaned=cancellation_fixture(18995,1);check("request-level cancellation detects mock orphan failure",orphaned["cancellationAcknowledged"] and orphaned["requestTerminated"] and orphaned["processAlive"] and orphaned["orphanFree"] is False)
    for p in list((ROOT/"scripts").glob("*.py"))+list((ROOT/"prototypes").glob("*.py")):py_compile.compile(str(p),doraise=True)
    check("Python scripts compile",True)
    with tempfile.TemporaryDirectory() as d:
        d=pathlib.Path(d)
        run([sys.executable,"scripts/capture_hardware.py","--expected","config/hardware.local.example.json","--profile-label","synthetic-test","--output",str(d/"hardware.json")]);hardware=json.loads((d/"hardware.json").read_text());check("hardware capture emits LOCAL-ONLY schema",hardware["schemaVersion"]==1 and hardware["classification"]=="LOCAL-ONLY-RAW");check("hardware capture compares local expectation",len(hardware["expectedManifest"]["checks"])>=6)
        run(["node","prototypes/revision-coordinator.mjs","--output",str(d/"revision.json")]);run([sys.executable,"prototypes/pairing_server.py","--self-test","--output",str(d/"pairing.json")])
        run([sys.executable,"scripts/benchmark_retrieval.py","--records","1000","--queries","20","--output",str(d/"retrieval.json")]);r=json.loads((d/"retrieval.json").read_text());check("FTS ranking/filter/deletion verified",r["passSummary"]["allDeletionVerified"] and r["passSummary"]["minimumHitAt1"]==1 and r["passSummary"]["filterLeakage"]==0)
        run([sys.executable,"scripts/transport_probe.py","--messages","20","--runs","3","--output",str(d/"transport.json")]);t=json.loads((d/"transport.json").read_text());check("transport probe covers SSE and WebSocket","sseDeliveryMs" in t and "webSocketDeliveryMs" in t)
        model=d/"mock.gguf";model.write_bytes(b"mock");mock_cfg=json.loads(json.dumps(cfg));mock_cfg["runtime"].update({"llamaServer":str(ROOT/"prototypes/mock_llama_server.py"),"port":18992,"startupTimeoutSeconds":5,"requestTimeoutSeconds":5});mock_cfg["defaults"].update({"repetitions":1,"contextSizes":[1024],"concurrency":[1,2],"cancellationDelaySeconds":0.05,"recoveryObservationSeconds":0.1,"strictArtifactHashes":False});mock_cfg["candidates"]=[{"id":"mock","label":"Mock","modelPath":str(model),"artifactSha256":"","license":"test","enabled":True,"extraArgs":[]}];(d/"config.json").write_text(json.dumps(mock_cfg))
        run([sys.executable,"scripts/run_benchmarks.py","--config",str(d/"config.json"),"--scenarios","scenarios/harness-smoke.json","--output",str(d/"model.json")]);model_result=json.loads((d/"model.json").read_text());check("model harness passes deterministic mock",all(x["passed"] for x in model_result["runs"][0]["scenarios"]));check("model harness summarizes reliability",model_result["summary"][0]["structured"]["rate"]==1 and model_result["summary"][0]["tools"]["rate"]==1);check("model harness records cancellation/recovery","cancellation" in model_result["summary"][0] and "memory" in model_result["summary"][0])
        run([sys.executable,"scripts/probe_lifecycle.py","--config",str(d/"config.json"),"--candidate","mock","--context","1024","--output",str(d/"lifecycle.json")]);check("lifecycle probe restarts and releases port",json.loads((d/"lifecycle.json").read_text())["passed"])
        run([sys.executable,"scripts/soak_model.py","--config",str(d/"config.json"),"--candidate","mock","--context","1024","--duration","0.3","--output",str(d/"soak.json")]);check("soak harness records throughput windows",json.loads((d/"soak.json").read_text())["summary"]["totalRequests"]>0)
        for unsafe in ("https://127.0.0.1:18081","http://example.com:18081","http://0.0.0.0:18081","http://user:token@127.0.0.1:18081","http://127.0.0.1:18081/unsafe"):
            rejected=subprocess.run([sys.executable,"scripts/benchmark_embeddings.py","--base-url",unsafe,"--output",str(d/"unsafe-embedding.json")],cwd=ROOT,capture_output=True,text=True,timeout=5);assert rejected.returncode!=0 and not (d/"unsafe-embedding.json").exists()
        check("embedding benchmark rejects remote and unsafe endpoints",True)
        embedding_server=subprocess.Popen([sys.executable,"prototypes/mock_llama_server.py","--host","127.0.0.1","--port","18993"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.2)
        try:run([sys.executable,"scripts/benchmark_embeddings.py","--base-url","http://127.0.0.1:18993","--repetitions","2","--output",str(d/"embeddings.json")])
        finally:embedding_server.terminate();embedding_server.wait(timeout=5)
        embedding_result=json.loads((d/"embeddings.json").read_text());check("embedding harness ranks synthetic paraphrases",embedding_result["ranking"]["hitAt1"]==1)
        def score_model(model_path,output_path):run([sys.executable,"scripts/score_results.py","--models",str(model_path),"--retrieval",str(d/"retrieval.json"),"--embeddings",str(d/"embeddings.json"),"--lifecycle",str(d/"lifecycle.json"),"--pairing",str(d/"pairing.json"),"--revision",str(d/"revision.json"),"--soak",str(d/"soak.json"),"--output",str(output_path)]);return json.loads(pathlib.Path(output_path).read_text())
        score=score_model(d/"model.json",d/"score.json");check("frozen gate scorer reports incomplete synthetic run",score["gateVersion"]=="W0-GATE-2" and score["overall"] in ("incomplete","fail"));gates={x["gate"]:x["status"] for x in score["gates"]};check("sufficient cold-load and concurrency coverage pass their gates",gates["model:mock:1024:cold-load-coverage"]=="pass" and gates["model:mock:1024:cold-load-samples"]=="pass" and gates["model:mock:1024:cold-load-p95"]=="pass" and gates["model:mock:1024:concurrency2:coverage"]=="pass" and gates["model:mock:1024:concurrency2:failed-requests"]=="pass" and gates["model:mock:1024:concurrency2:structured"]=="pass" and gates["model:mock:1024:concurrency2:tools"]=="pass");check("missing llama-bench cannot pass",gates["model:mock:llama-bench"] in ("pending","fail"))
        insufficient=json.loads(json.dumps(model_result));insufficient["summary"][0]["coldLoad"]={"requiredSamples":3,"validSamples":2,"sufficientCoverage":False,"p95Ms":None,"samples":[]};insufficient["summary"][0]["concurrency"]=[];(d/"insufficient.json").write_text(json.dumps(insufficient));insufficient_score=score_model(d/"insufficient.json",d/"insufficient-score.json");insufficient_gates={x["gate"]:x["status"] for x in insufficient_score["gates"]};check("insufficient cold-load and concurrency coverage cannot pass",insufficient_gates["model:mock:1024:cold-load-coverage"]=="fail" and insufficient_gates["model:mock:1024:cold-load-p95"]=="pending" and insufficient_gates["model:mock:1024:concurrency2:coverage"]=="fail")
        failed_concurrency=json.loads(json.dumps(model_result));c2=next(x for x in failed_concurrency["summary"][0]["concurrency"] if x["clients"]==2);c2["failedRequests"]=1;c2["structured"]["rate"]=.5;c2["tools"]["rate"]=.5;(d/"failed-concurrency.json").write_text(json.dumps(failed_concurrency));failed_score=score_model(d/"failed-concurrency.json",d/"failed-score.json");failed_gates={x["gate"]:x["status"] for x in failed_score["gates"]};check("concurrency failures and reliability regressions fail",failed_gates["model:mock:1024:concurrency2:failed-requests"]=="fail" and failed_gates["model:mock:1024:concurrency2:structured"]=="fail" and failed_gates["model:mock:1024:concurrency2:tools"]=="fail")
        failed_cancel=json.loads(json.dumps(model_result));failed_cancel["summary"][0]["cancellation"].update({"cancellationAcknowledged":True,"acknowledgementLatencyMs":10,"requestTerminationLatencyMs":20,"requestTerminated":True,"processAlive":True,"activeRequestsAfterCancel":1,"orphanFree":False,"vramRecovered":True,"ramRecovered":True,"resourcesRecovered":True});(d/"failed-cancel.json").write_text(json.dumps(failed_cancel));cancel_score=score_model(d/"failed-cancel.json",d/"failed-cancel-score.json");cancel_gates={x["gate"]:x["status"] for x in cancel_score["gates"]};check("orphaned request fails cancellation scoring",cancel_gates["model:mock:1024:cancel-orphan-free"]=="fail" and cancel_gates["model:mock:1024:cancel-active-requests"]=="fail")
        public=ROOT/"results-public/.qa-sanitized.json"
        try:
            run([sys.executable,"scripts/sanitize_results.py","--hardware",str(d/"hardware.json"),"--models",str(d/"model.json"),"--retrieval",str(d/"retrieval.json"),"--embeddings",str(d/"embeddings.json"),"--lifecycle",str(d/"lifecycle.json"),"--pairing",str(d/"pairing.json"),"--revision",str(d/"revision.json"),"--score",str(d/"score.json"),"--soak",str(d/"soak.json"),"--transport",str(d/"transport.json"),"--output",str(public)]);sanitized=json.loads(public.read_text());check("sanitizer emits allowlisted public aggregate",sanitized["classification"]=="PUBLIC-SANITIZED-AGGREGATE" and "runs" not in sanitized.get("models",{}) and sanitized["embeddings"]["ranking"]["hitAt1"]==1 and sanitized["pairing"]["passed"] and sanitized["revision"]["passed"] and sanitized["score"]["gateVersion"]=="W0-GATE-2" and sanitized["soak"]["summary"]["totalRequests"]>0)
        finally: public.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory() as bundle_dir:
        bundle_dir=pathlib.Path(bundle_dir)
        for candidate in ("a","b","c"):
            for profile in ("AC balanced","AC performance"):
                aggregate={"classification":"PUBLIC-SANITIZED-AGGREGATE","hardware":{"benchmarkProfileLabel":profile},"models":{"summaries":[{"candidate":candidate,"contextSize":context} for context in (2048,4096,8192,12288,16384)]},"score":{"overall":"pass"},"soak":{"actualDurationSeconds":1800},"lifecycle":{"passed":True}}
                (bundle_dir/f"{candidate}-{profile.replace(' ','-')}.json").write_text(json.dumps(aggregate))
        run([sys.executable,"scripts/build_review_bundle.py","--input-dir",str(bundle_dir),"--output",str(bundle_dir/"bundle.json")]);bundle=json.loads((bundle_dir/"bundle.json").read_text());check("review bundle enforces complete candidate/profile coverage",bundle["selectionReady"] and len(bundle["candidates"])==3)
    run([sys.executable,"scripts/privacy_scan.py","--mode","tracked"]);check("tracked public files pass privacy scan",True)
    production_markers=("def get_today", '"/get_today"', "'/get_today'")
    check("Wave 0 harness contains no production get_today implementation",not any(any(m in p.read_text(errors="ignore") for m in production_markers) for p in ROOT.rglob("*.py") if p.name!="qa_wave0.py"))
    print(f"\n{passed} Wave 0 harness checks passed")
if __name__=="__main__":main()
