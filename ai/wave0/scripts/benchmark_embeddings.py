#!/usr/bin/env python3
"""Synthetic embedding retrieval benchmark against a LOCAL-ONLY OpenAI endpoint."""
from __future__ import annotations
import argparse, json, math, os, statistics, time, urllib.request
from pathlib import Path

DOCS=[
 ("gold-forge-auth","Kubernetes authentication deadline blocker dependency"),
 ("gold-career-terraform","Terraform portfolio project evidence skill"),
 ("gold-health-sleep","Sleep recovery readiness trend"),
 ("gold-career-interview","Interview roadmap weak skills questions"),
 ("noise-1","Movie release queue and ratings"),("noise-2","Cardio interval distance pace"),("noise-3","Meal hydration caffeine log"),("noise-4","Project color and icon preferences")
]
QUERIES=[
 ("cluster login security","gold-forge-auth"),
 ("infrastructure code work sample","gold-career-terraform"),
 ("rest quality readiness","gold-health-sleep"),
 ("hiring conversation learning plan","gold-career-interview")
]
def embed(base,texts,timeout):
    token=os.getenv("KAIZEN_W0_EMBEDDING_TOKEN");headers={"content-type":"application/json"}
    if token:headers["authorization"]="Bearer "+token
    body=json.dumps({"model":"local","input":texts}).encode();r=urllib.request.Request(base.rstrip("/")+"/v1/embeddings",data=body,headers=headers,method="POST");start=time.perf_counter()
    with urllib.request.urlopen(r,timeout=timeout) as x:data=json.loads(x.read())
    rows=sorted(data["data"],key=lambda x:x.get("index",0));return [x["embedding"] for x in rows],(time.perf_counter()-start)*1000
def cosine(a,b):
    dot=sum(x*y for x,y in zip(a,b));den=math.sqrt(sum(x*x for x in a))*math.sqrt(sum(y*y for y in b));return dot/den if den else 0

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--base-url",default="http://127.0.0.1:18081");ap.add_argument("--output",required=True);ap.add_argument("--timeout",type=int,default=120);ap.add_argument("--repetitions",type=int,default=10);args=ap.parse_args()
    doc_vectors,doc_ms=embed(args.base_url,[x[1] for x in DOCS],args.timeout);lat=[];ranks=[];dimensions=len(doc_vectors[0])
    for _ in range(args.repetitions):
        query_vectors,ms=embed(args.base_url,[x[0] for x in QUERIES],args.timeout);lat.append(ms)
        for qv,(_,expected) in zip(query_vectors,QUERIES):
            scored=sorted(((cosine(qv,dv),doc_id) for dv,(doc_id,_) in zip(doc_vectors,DOCS)),reverse=True);ids=[x[1] for x in scored];ranks.append(ids.index(expected)+1)
    ys=sorted(lat);p95=ys[min(len(ys)-1,round((len(ys)-1)*.95))]
    out={"schemaVersion":1,"classification":"LOCAL-ONLY-RAW","synthetic":True,"documents":len(DOCS),"queries":len(QUERIES),"repetitions":args.repetitions,"dimensions":dimensions,"documentBatchMs":round(doc_ms,3),"queryBatchLatencyMs":{"mean":round(statistics.mean(lat),3),"p95":round(p95,3)},"ranking":{"hitAt1":round(sum(r==1 for r in ranks)/len(ranks),4),"mrr":round(sum(1/r for r in ranks)/len(ranks),4)},"endpoint":"loopback-redacted"}
    path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2),encoding="utf-8");print(json.dumps(out,indent=2))
if __name__=="__main__":main()
