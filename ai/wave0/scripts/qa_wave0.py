#!/usr/bin/env python3
"""Wave 0 harness regression gate; uses only synthetic data and temporary files."""
import json, pathlib, py_compile, subprocess, sys, tempfile
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
        run([sys.executable,"scripts/capture_hardware.py","--output",str(d/"hardware.json")]);check("hardware capture emits schema",json.loads((d/"hardware.json").read_text())["schemaVersion"]==1)
        run([sys.executable,"scripts/benchmark_retrieval.py","--records","1000","--queries","20","--output",str(d/"retrieval.json")]);r=json.loads((d/"retrieval.json").read_text());check("FTS deletion verified",r["deletionVerified"])
        run([sys.executable,"scripts/transport_probe.py","--messages","20","--runs","3","--output",str(d/"transport.json")]);t=json.loads((d/"transport.json").read_text());check("transport probe covers SSE and WebSocket","sseDeliveryMs" in t and "webSocketDeliveryMs" in t)
        model=d/"mock.gguf";model.write_bytes(b"mock");mock_cfg=json.loads(json.dumps(cfg));mock_cfg["runtime"].update({"llamaServer":str(ROOT/"prototypes/mock_llama_server.py"),"port":18992,"startupTimeoutSeconds":5,"requestTimeoutSeconds":5});mock_cfg["defaults"].update({"repetitions":1,"contextSizes":[1024],"concurrency":[1]});mock_cfg["candidates"]=[{"id":"mock","label":"Mock","modelPath":str(model),"artifactSha256":"","license":"test","enabled":True,"extraArgs":[]}];(d/"config.json").write_text(json.dumps(mock_cfg))
        run([sys.executable,"scripts/run_benchmarks.py","--config",str(d/"config.json"),"--output",str(d/"model.json")]);model_result=json.loads((d/"model.json").read_text());check("model harness passes deterministic mock",all(x["passed"] for x in model_result["runs"][0]["scenarios"]))
    production_markers=("def get_today", '"/get_today"', "'/get_today'")
    check("no production get_today implementation",not any(any(m in p.read_text(errors="ignore") for m in production_markers) for p in ROOT.rglob("*.py") if p.name!="qa_wave0.py"))
    print(f"\n{passed} Wave 0 harness checks passed")
if __name__=="__main__":main()
