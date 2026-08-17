#!/usr/bin/env node
/** Disposable W0-01 prototype. Not imported by Kaizen runtime. */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const DOMAINS=["core","forge","career","workout","health","entertainment","notifications"];
class RevisionCoordinator {
  constructor(path){this.path=path;this.state=this.#load()}
  #fresh(){return {schemaVersion:1,installationEpoch:randomUUID(),domains:Object.fromEntries(DOMAINS.map(d=>[d,0])),writer:null}}
  #load(){try{const x=JSON.parse(readFileSync(this.path,"utf8"));if(x.schemaVersion!==1||!x.installationEpoch||DOMAINS.some(d=>!Number.isSafeInteger(x.domains?.[d])||x.domains[d]<0))throw Error("invalid");return {...x,writer:x.writer??null}}catch{return this.#fresh()}}
  #persist(next){const tmp=this.path+".tmp";writeFileSync(tmp,JSON.stringify(next));renameSync(tmp,this.path)}
  acquireWriter(owner,now=Date.now(),ttlMs=30_000){assert(owner);const active=this.state.writer&&this.state.writer.expiresAt>now;if(active&&this.state.writer.owner!==owner)return false;const next={...this.state,writer:{owner,expiresAt:now+ttlMs}};this.#persist(next);this.state=next;return true}
  releaseWriter(owner){if(this.state.writer?.owner!==owner)return false;const next={...this.state,writer:null};this.#persist(next);this.state=next;return true}
  begin(domains,reason){const unique=[...new Set(domains)];assert(unique.length&&unique.every(d=>DOMAINS.includes(d)));return {id:randomUUID(),domains:unique,reason,epoch:this.state.installationEpoch,before:{...this.state.domains},done:false}}
  commit(token,{changed=true}={}){assert(!token.done,"transaction already closed");assert.equal(token.epoch,this.state.installationEpoch,"epoch changed");token.done=true;if(!changed)return this.current();const next={...this.state,domains:{...this.state.domains}};for(const d of token.domains)next.domains[d]++;this.#persist(next);this.state=next;return this.current()}
  fail(token){assert(!token.done);token.done=true;return this.current()}
  current(domains=DOMAINS){return {installationEpoch:this.state.installationEpoch,domains:Object.fromEntries(domains.map(d=>[d,this.state.domains[d]]))}}
  snapshot(domains,project){for(let i=0;i<3;i++){const a=this.current(domains);const data=project();const b=this.current(domains);if(JSON.stringify(a)===JSON.stringify(b))return {snapshotId:`${a.installationEpoch}:${domains.map(d=>`${d}.${a.domains[d]}`).join("+")}`,revision:a,data};}throw Error("snapshot changed during capture")}
  isStale(snapshot){const current=this.current(Object.keys(snapshot.revision.domains));return current.installationEpoch!==snapshot.revision.installationEpoch||Object.entries(snapshot.revision.domains).some(([d,n])=>current.domains[d]!==n)}
}

const dir=mkdtempSync(join(tmpdir(),"kaizen-revision-"));const file=join(dir,"revisions.json");
try {
  let c=new RevisionCoordinator(file);const epoch=c.current().installationEpoch;
  assert.equal(c.acquireWriter("tab-a",1000,100),true);
  assert.equal(c.acquireWriter("tab-b",1050,100),false); // concurrent writer rejected
  assert.equal(c.acquireWriter("tab-b",1101,100),true);  // expired lease transfers
  assert.equal(c.releaseWriter("tab-b"),true);
  c.commit(c.begin(["core"],"add task"));assert.equal(c.current().domains.core,1);
  c.commit(c.begin(["core"],"no-op"),{changed:false});assert.equal(c.current().domains.core,1);
  c.commit(c.begin(["forge","career"],"ship to portfolio"));assert.equal(c.current().domains.forge,1);assert.equal(c.current().domains.career,1);
  const before=c.current();c.fail(c.begin(["health"],"failed persistence"));assert.deepEqual(c.current(),before);
  c=new RevisionCoordinator(file);assert.equal(c.current().installationEpoch,epoch);assert.equal(c.current().domains.core,1);
  const snap=c.snapshot(["core","career"],()=>({tasks:2}));assert.match(snap.snapshotId,/core\.1\+career\.1/);assert.equal(c.isStale(snap),false);
  c.commit(c.begin(["career"],"new milestone"));assert.equal(c.isStale(snap),true); // stale vector detected
  let first=true;const retried=c.snapshot(["core"],()=>{if(first){first=false;c.commit(c.begin(["core"],"concurrent"))}return {}});assert.match(retried.snapshotId,/core\.2/);
  writeFileSync(file,"{bad json");const rotated=new RevisionCoordinator(file);assert.notEqual(rotated.current().installationEpoch,epoch);assert.equal(rotated.isStale(snap),true); // corrupt metadata invalidates old epoch
  const result={schemaVersion:1,classification:"LOCAL-ONLY-RAW",passed:true,assertions:17,checks:["writer acquire","concurrent writer rejected","expired lease transfer","writer release","monotonic core revision","no-op stable","cross-domain forge revision","cross-domain career revision","failed transaction stable","epoch reload persistence","revision reload persistence","snapshot vector","fresh snapshot","stale snapshot detection","stable capture retry","corrupt epoch rotation","old snapshot invalidated"]};
  const outputIndex=process.argv.indexOf("--output");if(outputIndex>=0){const output=process.argv[outputIndex+1];assert(output,"--output requires a path");mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2))}
  console.log("W0-01 revision prototype: 17 assertions passed");
} finally {rmSync(dir,{recursive:true,force:true})}
