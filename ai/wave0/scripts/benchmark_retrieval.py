#!/usr/bin/env python3
"""SQLite FTS5 structured/lexical/recency benchmark using synthetic Kaizen data only."""
from __future__ import annotations
import argparse, json, random, sqlite3, statistics, time
from pathlib import Path

DOMAINS=["core","forge","career","workout","health","entertainment"]
WORDS="kubernetes authentication terraform portfolio deadline recovery sleep hydration interview project velocity roadmap blocker milestone focus training skill".split()
CASES=[
 {"query":"kubernetes authentication","domain":"forge","expected":"gold-forge-auth"},
 {"query":"terraform portfolio","domain":"career","expected":"gold-career-terraform"},
 {"query":"sleep recovery","domain":"health","expected":"gold-health-sleep"},
 {"query":"interview roadmap","domain":"career","expected":"gold-career-interview"},
]
PARAPHRASE_CASES=[
 {"query":"cluster login security","domain":"forge","expected":"gold-forge-auth"},
 {"query":"infrastructure code work sample","domain":"career","expected":"gold-career-terraform"},
 {"query":"rest quality readiness","domain":"health","expected":"gold-health-sleep"},
 {"query":"hiring conversation learning plan","domain":"career","expected":"gold-career-interview"},
]
GOLD=[
 ("gold-forge-auth","forge","Kubernetes authentication critical path","Kubernetes authentication deadline blocker dependency",1000,10),
 ("gold-career-terraform","career","Terraform portfolio evidence","Terraform portfolio project evidence skill",1000,10),
 ("gold-health-sleep","health","Sleep recovery trend","Sleep recovery readiness trend",1000,10),
 ("gold-career-interview","career","Interview roadmap","Interview roadmap weak skills questions",1000,10),
]
def pct(xs,p):
    ys=sorted(xs);return ys[min(len(ys)-1,max(0,round((len(ys)-1)*p)))]
def one_scale(records,queries,seed=42):
    rng=random.Random(seed);db=sqlite3.connect(":memory:")
    db.execute("CREATE VIRTUAL TABLE docs USING fts5(id UNINDEXED, domain UNINDEXED, title, body, createdDay UNINDEXED, importance UNINDEXED, tokenize='unicode61')")
    rows=list(GOLD)
    for i in range(max(0,records-len(rows))):
        domain=DOMAINS[i%len(DOMAINS)];chosen=" ".join(rng.sample(WORDS,k=rng.randint(3,8)));rows.append((f"r{i}",domain,f"{domain} synthetic record {i}",f"{chosen} synthetic evidence",rng.randint(1,999),rng.randint(1,9)))
    t=time.perf_counter();db.executemany("INSERT INTO docs VALUES(?,?,?,?,?,?)",rows);db.commit();index_ms=(time.perf_counter()-t)*1000
    lat=[];ranks=[];leaks=0
    for i in range(queries):
        case=CASES[i%len(CASES)];t=time.perf_counter()
        result=db.execute("SELECT id,domain,bm25(docs) AS lexical,createdDay,importance FROM docs WHERE docs MATCH ? AND domain=? ORDER BY (bm25(docs) - (CAST(createdDay AS REAL)/1000.0)*0.02 - (CAST(importance AS REAL)/10.0)*0.01) LIMIT 10",(case["query"],case["domain"])).fetchall();lat.append((time.perf_counter()-t)*1000)
        leaks+=sum(1 for x in result if x[1]!=case["domain"]);ids=[x[0] for x in result];ranks.append(ids.index(case["expected"])+1 if case["expected"] in ids else None)
    paraphrase_hits=0
    for case in PARAPHRASE_CASES:
        result=db.execute("SELECT id FROM docs WHERE docs MATCH ? AND domain=? ORDER BY bm25(docs) LIMIT 10",(case["query"],case["domain"])).fetchall();paraphrase_hits+=int(case["expected"] in [x[0] for x in result])
    db.execute("DELETE FROM docs WHERE id='gold-forge-auth'");db.commit();deleted=db.execute("SELECT count(*) FROM docs WHERE id='gold-forge-auth'").fetchone()[0]==0
    valid=[r for r in ranks if r]
    return {"records":records,"queries":queries,"indexMs":round(index_ms,3),"latencyMs":{"mean":round(statistics.mean(lat),3),"p50":round(pct(lat,.5),3),"p95":round(pct(lat,.95),3),"max":round(max(lat),3)},"ranking":{"hitAt1":round(sum(r==1 for r in ranks)/len(ranks),4),"hitAt10":round(len(valid)/len(ranks),4),"mrrAt10":round(sum(1/r for r in valid)/len(ranks),4),"filterLeakage":leaks,"paraphraseHitAt10":round(paraphrase_hits/len(PARAPHRASE_CASES),4)},"deletionVerified":deleted}
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--output",required=True);ap.add_argument("--records",type=int,help="Single scale (QA compatibility)");ap.add_argument("--scales",default="1000,10000,50000");ap.add_argument("--queries",type=int,default=200);args=ap.parse_args()
    scales=[args.records] if args.records else [int(x) for x in args.scales.split(",") if x.strip()]
    runs=[one_scale(n,args.queries) for n in scales]
    out={"schemaVersion":2,"engine":sqlite3.sqlite_version,"fts5":True,"method":"structured domain filter + FTS5 BM25 + bounded recency/importance adjustment","synthetic":True,"runs":runs,"passSummary":{"allDeletionVerified":all(x["deletionVerified"] for x in runs),"minimumHitAt1":min(x["ranking"]["hitAt1"] for x in runs),"minimumMrrAt10":min(x["ranking"]["mrrAt10"] for x in runs),"minimumParaphraseHitAt10":min(x["ranking"]["paraphraseHitAt10"] for x in runs),"filterLeakage":sum(x["ranking"]["filterLeakage"] for x in runs),"maximumP95Ms":max(x["latencyMs"]["p95"] for x in runs)},"limitations":["Synthetic corpus and judgments","Paraphrase cases measure lexical gaps but do not test an embedding model","In-memory database excludes Windows disk, locking and antivirus effects","Recency and importance weights are benchmark parameters, not selected architecture"]}
    path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2),encoding="utf-8");print(json.dumps(out,indent=2))
if __name__=="__main__":main()
