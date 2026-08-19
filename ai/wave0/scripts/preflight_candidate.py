#!/usr/bin/env python3
"""Short LOCAL-ONLY compatibility probe before an authoritative Wave 0 run."""
from __future__ import annotations
import argparse,json,pathlib,subprocess,time
from process_inspection import process_table,tree_for,verify_exited_tree
from run_benchmarks import request_activity,run_scenario,server_command,sha256,start_nvidia_monitor,wait_port_free,wait_ready

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--config",required=True);ap.add_argument("--scenarios",default="scenarios/kaizen-eval.json");ap.add_argument("--output",required=True);ap.add_argument("--allow-missing-gpu",action="store_true",help="Synthetic mock QA only");args=ap.parse_args();cfg=json.loads(pathlib.Path(args.config).read_text());runtime=cfg["runtime"];defaults=cfg["defaults"];enabled=[x for x in cfg["candidates"] if x.get("enabled")]
    if len(enabled)!=1:raise SystemExit("preflight requires exactly one enabled candidate")
    candidate=enabled[0];model=pathlib.Path(candidate["modelPath"]);server=pathlib.Path(runtime["llamaServer"])
    if not model.is_file() or not server.is_file():raise SystemExit("runtime/model missing")
    if defaults.get("strictArtifactHashes",True):
        if sha256(server).lower()!=runtime.get("runtimeSha256","").lower():raise SystemExit("runtime hash mismatch")
        if sha256(model).lower()!=candidate.get("artifactSha256","").lower():raise SystemExit("model hash mismatch")
    scenarios=json.loads(pathlib.Path(args.scenarios).read_text());structured_ids={"priority-grounding","uncertainty-no-velocity","uncertainty-no-data"};tool_ids={"select-get-today","project-id-arguments","no-write-tool"};structured=[x for x in scenarios["structured"] if x["id"] in structured_ids][:2];tools=[x for x in scenarios["tools"] if x["id"] in tool_ids][:2];cases=structured+tools
    if len(structured)!=2 or len(tools)!=2:raise SystemExit("preflight scenarios missing")
    context=4096;cmd=server_command(runtime,defaults,candidate,context);output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);log=output.with_suffix(".server.log").open("w",encoding="utf-8");nstop,nthread,nsamples=start_nvidia_monitor();process=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,text=True);base=f"http://{runtime['host']}:{runtime['port']}";tree=set();rows=[]
    try:
        startup=wait_ready(base,runtime["startupTimeoutSeconds"]);tree=tree_for(process.pid,process_table());time.sleep(1)
        for _ in range(3):
            for case in cases:rows.append(run_scenario(base,case,defaults,runtime["requestTimeoutSeconds"]))
        structured=[x for x in rows if x["kind"]=="structured"];tools=[x for x in rows if x["kind"]=="tool"];structured_rate=sum(x["passed"] for x in structured)/len(structured);tool_rate=sum(x["passed"] for x in tools)/len(tools);metrics=request_activity(base);gpu=bool(nsamples);passed=structured_rate==1 and tool_rate==1 and metrics is not None and (gpu or args.allow_missing_gpu)
    finally:
        process.terminate()
        try:process.wait(timeout=15)
        except subprocess.TimeoutExpired:process.kill();process.wait()
        released=wait_port_free(runtime["host"],runtime["port"]);tree_exit=verify_exited_tree(tree);nstop.set();nthread.join(timeout=3) if nthread else None;log.close()
    result={"schemaVersion":1,"classification":"LOCAL-ONLY-RAW","candidate":candidate["id"],"context":context,"startupMs":round(startup,2),"jinjaEnabled":"--jinja" in cmd,"structuredRate":round(structured_rate,4),"toolRate":round(tool_rate,4),"metricsAvailable":metrics is not None,"nvidiaTelemetryAvailable":gpu,"portReleased":released,"processTreeExited":tree_exit["processTreeExited"],"failureCategories":sorted({failure for row in rows if not row["passed"] for failure in row.get("failures",[])})[:50],"passedForFullRun":passed and released and tree_exit["processTreeExited"]};output.write_text(json.dumps(result,indent=2),encoding="utf-8");print(json.dumps(result,indent=2));raise SystemExit(0 if result["passedForFullRun"] else 2)
if __name__=="__main__":main()
