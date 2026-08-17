#!/usr/bin/env python3
"""Combine reviewed public aggregates and report Wave 0 coverage/blockers.

Input must already be allowlist-sanitized. This script never reads results-local.
"""
from __future__ import annotations
import argparse, json, re
from collections import defaultdict
from pathlib import Path

ALLOWED_PROFILES={"AC balanced","AC performance","Battery balanced"}

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--input-dir",default="results-public");ap.add_argument("--output",required=True);ap.add_argument("--minimum-candidates",type=int,default=3);args=ap.parse_args();root=Path(args.input_dir);output=Path(args.output).resolve();items=[]
    for path in sorted(root.glob("*.json")):
        if path.resolve()==output:continue
        data=json.loads(path.read_text(encoding="utf-8"))
        if data.get("classification")!="PUBLIC-SANITIZED-AGGREGATE":raise SystemExit(f"non-sanitized input refused: {path.name}")
        if data.get("models") and data.get("hardware"):items.append(data)
    candidates=defaultdict(lambda:{"profiles":set(),"contexts":set(),"runs":[],"scoreStates":[],"soakDurations":[],"lifecycle":[]})
    blockers=[]
    for item in items:
        profile=item.get("hardware",{}).get("benchmarkProfileLabel")
        if profile not in ALLOWED_PROFILES:blockers.append("missing or nonstandard power-profile label");continue
        for row in item.get("models",{}).get("summaries",[]):
            cid=row.get("candidate")
            if not cid or not re.fullmatch(r"[A-Za-z0-9._-]+",cid):blockers.append("invalid candidate identifier");continue
            c=candidates[cid];c["profiles"].add(profile);c["contexts"].add(row.get("contextSize"));c["runs"].append({"profile":profile,"contextSize":row.get("contextSize"),"structured":row.get("structured"),"tools":row.get("tools"),"qualityRates":row.get("qualityRates"),"latencyMs":row.get("latencyMs"),"tokensPerSecond":row.get("tokensPerSecond"),"memory":row.get("memory"),"nvidia":row.get("nvidia"),"concurrency":row.get("concurrency"),"cancellation":row.get("cancellation")})
            c["scoreStates"].append(item.get("score",{}).get("overall"));c["soakDurations"].append(item.get("soak",{}).get("actualDurationSeconds"));c["lifecycle"].append(item.get("lifecycle",{}).get("passed"))
    required_profiles={"AC balanced","AC performance"}
    if len(candidates)<args.minimum_candidates:blockers.append(f"need at least {args.minimum_candidates} measured candidates")
    public_candidates={}
    for cid,c in sorted(candidates.items()):
        missing_profiles=sorted(required_profiles-c["profiles"]);missing_contexts=sorted({4096,8192}-c["contexts"])
        if missing_profiles:blockers.append(f"{cid}: missing profiles {missing_profiles}")
        if missing_contexts:blockers.append(f"{cid}: missing contexts {missing_contexts}")
        if not c["soakDurations"] or any(not x or x<1800 for x in c["soakDurations"]):blockers.append(f"{cid}: missing 30-minute soak")
        if not c["lifecycle"] or not all(c["lifecycle"]):blockers.append(f"{cid}: lifecycle gate incomplete")
        if not c["scoreStates"] or any(x!="pass" for x in c["scoreStates"]):blockers.append(f"{cid}: frozen gate score not fully passing")
        public_candidates[cid]={"profiles":sorted(c["profiles"]),"contexts":sorted(x for x in c["contexts"] if x is not None),"scoreStates":c["scoreStates"],"minimumSoakSeconds":min((x or 0 for x in c["soakDurations"]),default=0),"lifecycleAllPassed":bool(c["lifecycle"] and all(c["lifecycle"])),"runs":c["runs"]}
    blockers=sorted(set(blockers));out={"schemaVersion":1,"classification":"PUBLIC-SANITIZED-AGGREGATE","kind":"wave0-review-bundle","inputAggregates":len(items),"selectionReady":not blockers,"blockers":blockers,"candidates":public_candidates,"note":"Coverage/readiness only; architecture selection still requires human review."};output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(out,indent=2),encoding="utf-8");print(json.dumps({"selectionReady":out["selectionReady"],"candidates":len(candidates),"blockers":blockers},indent=2))
if __name__=="__main__":main()
