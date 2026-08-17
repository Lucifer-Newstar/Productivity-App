#!/usr/bin/env python3
"""Wave 0 harness regression gate; uses only synthetic data and temporary files."""
import json, pathlib, py_compile, subprocess, sys, tempfile, time
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

def main():
    cfg=json.loads((ROOT/"config/candidates.example.json").read_text())
    check("example candidates disabled",all(not x["enabled"] for x in cfg["candidates"]))
    check("runtime binds loopback",cfg["runtime"]["host"]=="127.0.0.1")
    check("artifact hashes required by default",cfg["defaults"]["strictArtifactHashes"] is True)
    check("model artifacts absent",not any(ROOT.rglob("*.gguf")))
    source=(ROOT/"scripts/run_benchmarks.py").read_text()
    check("benchmark has no downloader",all(x not in source for x in ["urlretrieve(","huggingface_hub","requests.get("]))
    check("benchmark redacts model paths",'"<local-path-redacted>"' in source)
    run(["node","prototypes/revision-coordinator.mjs"]);check("revision prototype passes",True)
    run([sys.executable,"prototypes/pairing_server.py","--self-test"]);check("pairing prototype passes",True)
    for p in list((ROOT/"scripts").glob("*.py"))+list((ROOT/"prototypes").glob("*.py")):py_compile.compile(str(p),doraise=True)
    check("Python scripts compile",True)
    with tempfile.TemporaryDirectory() as d:
        d=pathlib.Path(d)
        run([sys.executable,"scripts/capture_hardware.py","--expected","config/hardware.local.example.json","--profile-label","synthetic-test","--output",str(d/"hardware.json")]);hardware=json.loads((d/"hardware.json").read_text());check("hardware capture emits LOCAL-ONLY schema",hardware["schemaVersion"]==1 and hardware["classification"]=="LOCAL-ONLY-RAW");check("hardware capture compares local expectation",len(hardware["expectedManifest"]["checks"])>=6)
        run(["node","prototypes/revision-coordinator.mjs","--output",str(d/"revision.json")]);run([sys.executable,"prototypes/pairing_server.py","--self-test","--output",str(d/"pairing.json")])
        run([sys.executable,"scripts/benchmark_retrieval.py","--records","1000","--queries","20","--output",str(d/"retrieval.json")]);r=json.loads((d/"retrieval.json").read_text());check("FTS ranking/filter/deletion verified",r["passSummary"]["allDeletionVerified"] and r["passSummary"]["minimumHitAt1"]==1 and r["passSummary"]["filterLeakage"]==0)
        run([sys.executable,"scripts/transport_probe.py","--messages","20","--runs","3","--output",str(d/"transport.json")]);t=json.loads((d/"transport.json").read_text());check("transport probe covers SSE and WebSocket","sseDeliveryMs" in t and "webSocketDeliveryMs" in t)
        model=d/"mock.gguf";model.write_bytes(b"mock");mock_cfg=json.loads(json.dumps(cfg));mock_cfg["runtime"].update({"llamaServer":str(ROOT/"prototypes/mock_llama_server.py"),"port":18992,"startupTimeoutSeconds":5,"requestTimeoutSeconds":5});mock_cfg["defaults"].update({"repetitions":1,"contextSizes":[1024],"concurrency":[1],"cancellationDelaySeconds":0.05,"recoveryObservationSeconds":0.1,"strictArtifactHashes":False});mock_cfg["candidates"]=[{"id":"mock","label":"Mock","modelPath":str(model),"artifactSha256":"","license":"test","enabled":True,"extraArgs":[]}];(d/"config.json").write_text(json.dumps(mock_cfg))
        run([sys.executable,"scripts/run_benchmarks.py","--config",str(d/"config.json"),"--scenarios","scenarios/harness-smoke.json","--output",str(d/"model.json")]);model_result=json.loads((d/"model.json").read_text());check("model harness passes deterministic mock",all(x["passed"] for x in model_result["runs"][0]["scenarios"]));check("model harness summarizes reliability",model_result["summary"][0]["structured"]["rate"]==1 and model_result["summary"][0]["tools"]["rate"]==1);check("model harness records cancellation/recovery","cancellation" in model_result["summary"][0] and "memory" in model_result["summary"][0])
        run([sys.executable,"scripts/probe_lifecycle.py","--config",str(d/"config.json"),"--candidate","mock","--context","1024","--output",str(d/"lifecycle.json")]);check("lifecycle probe restarts and releases port",json.loads((d/"lifecycle.json").read_text())["passed"])
        run([sys.executable,"scripts/soak_model.py","--config",str(d/"config.json"),"--candidate","mock","--context","1024","--duration","0.3","--output",str(d/"soak.json")]);check("soak harness records throughput windows",json.loads((d/"soak.json").read_text())["summary"]["totalRequests"]>0)
        embedding_server=subprocess.Popen([sys.executable,"prototypes/mock_llama_server.py","--host","127.0.0.1","--port","18993"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.2)
        try:run([sys.executable,"scripts/benchmark_embeddings.py","--base-url","http://127.0.0.1:18993","--repetitions","2","--output",str(d/"embeddings.json")])
        finally:embedding_server.terminate();embedding_server.wait(timeout=5)
        embedding_result=json.loads((d/"embeddings.json").read_text());check("embedding harness ranks synthetic paraphrases",embedding_result["ranking"]["hitAt1"]==1)
        run([sys.executable,"scripts/score_results.py","--models",str(d/"model.json"),"--retrieval",str(d/"retrieval.json"),"--embeddings",str(d/"embeddings.json"),"--lifecycle",str(d/"lifecycle.json"),"--pairing",str(d/"pairing.json"),"--revision",str(d/"revision.json"),"--soak",str(d/"soak.json"),"--output",str(d/"score.json")]);score=json.loads((d/"score.json").read_text());check("frozen gate scorer reports incomplete synthetic run",score["gateVersion"]=="W0-GATE-1" and score["overall"] in ("incomplete","fail"))
        public=ROOT/"results-public/.qa-sanitized.json"
        try:
            run([sys.executable,"scripts/sanitize_results.py","--hardware",str(d/"hardware.json"),"--models",str(d/"model.json"),"--retrieval",str(d/"retrieval.json"),"--embeddings",str(d/"embeddings.json"),"--lifecycle",str(d/"lifecycle.json"),"--pairing",str(d/"pairing.json"),"--revision",str(d/"revision.json"),"--score",str(d/"score.json"),"--soak",str(d/"soak.json"),"--transport",str(d/"transport.json"),"--output",str(public)]);sanitized=json.loads(public.read_text());check("sanitizer emits allowlisted public aggregate",sanitized["classification"]=="PUBLIC-SANITIZED-AGGREGATE" and "runs" not in sanitized.get("models",{}) and sanitized["embeddings"]["ranking"]["hitAt1"]==1 and sanitized["pairing"]["passed"] and sanitized["revision"]["passed"] and sanitized["score"]["gateVersion"]=="W0-GATE-1" and sanitized["soak"]["summary"]["totalRequests"]>0)
        finally: public.unlink(missing_ok=True)
    run([sys.executable,"scripts/privacy_scan.py","--mode","tracked"]);check("tracked public files pass privacy scan",True)
    production_markers=("def get_today", '"/get_today"', "'/get_today'")
    check("no production get_today implementation",not any(any(m in p.read_text(errors="ignore") for m in production_markers) for p in ROOT.rglob("*.py") if p.name!="qa_wave0.py"))
    print(f"\n{passed} Wave 0 harness checks passed")
if __name__=="__main__":main()
