#!/usr/bin/env python3
"""SQLite FTS5 baseline with deterministic synthetic Kaizen-like records."""
import argparse, json, random, sqlite3, statistics, time
from pathlib import Path

DOMAINS=["core","forge","career","workout","health","entertainment"]
TERMS=["kubernetes authentication terraform portfolio deadline recovery sleep hydration interview project velocity roadmap"]

def percentile(xs,p):
    ys=sorted(xs); return ys[min(len(ys)-1,max(0,round((len(ys)-1)*p)))]

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--output",required=True); ap.add_argument("--records",type=int,default=20000); ap.add_argument("--queries",type=int,default=200); args=ap.parse_args()
    rng=random.Random(42); db=sqlite3.connect(":memory:")
    try: db.execute("CREATE VIRTUAL TABLE docs USING fts5(id UNINDEXED, domain UNINDEXED, title, body, tokenize='unicode61')")
    except sqlite3.OperationalError as e: raise SystemExit(f"FTS5 unavailable: {e}")
    rows=[]
    words=TERMS[0].split()
    for i in range(args.records):
        domain=DOMAINS[i%len(DOMAINS)]; chosen=" ".join(rng.sample(words,k=rng.randint(3,7)))
        rows.append((f"r{i}",domain,f"{domain} record {i}",f"{chosen} evidence note {i}"))
    t=time.perf_counter(); db.executemany("INSERT INTO docs VALUES(?,?,?,?)",rows); db.commit(); index_ms=(time.perf_counter()-t)*1000
    lat=[]; counts=[]
    query_terms=["kubernetes deadline","terraform portfolio","sleep recovery","interview roadmap"]
    for i in range(args.queries):
        q=query_terms[i%len(query_terms)]; domain=DOMAINS[i%len(DOMAINS)]
        t=time.perf_counter(); result=db.execute("SELECT id,bm25(docs) FROM docs WHERE docs MATCH ? AND domain=? ORDER BY bm25(docs) LIMIT 10",(q,domain)).fetchall(); lat.append((time.perf_counter()-t)*1000); counts.append(len(result))
    # deletion guarantee baseline
    db.execute("DELETE FROM docs WHERE id='r0'"); db.commit(); deleted=db.execute("SELECT count(*) FROM docs WHERE id='r0'").fetchone()[0]==0
    out={"schemaVersion":1,"engine":sqlite3.sqlite_version,"fts5":True,"records":args.records,"queries":args.queries,"indexMs":round(index_ms,3),"latencyMs":{"mean":round(statistics.mean(lat),3),"p50":round(percentile(lat,.5),3),"p95":round(percentile(lat,.95),3),"max":round(max(lat),3)},"meanResults":statistics.mean(counts),"deletionVerified":deleted,"limitations":["Synthetic lexical baseline only","No vector backend or embedding model evaluated","In-memory database excludes disk/Windows antivirus effects"]}
    path=Path(args.output); path.parent.mkdir(parents=True,exist_ok=True); path.write_text(json.dumps(out,indent=2),encoding="utf-8"); print(json.dumps(out,indent=2))
if __name__=="__main__": main()
