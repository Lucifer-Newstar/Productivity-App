#!/usr/bin/env node
/** Disposable W0-01 prototype. Not imported by Kaizen runtime. */
import { mkdtempSync, readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const DOMAINS=["core","forge","career","workout","health","entertainment","notifications"];
class RevisionCoordinator {
  constructor(path){this.path=path;this.state=this.#load()}
  #fresh(){return {schemaVersion:1,installationEpoch:randomUUID(),domains:Object.fromEntries(DOMAINS.map(d=>[d,0]))}}
  #load(){try{const x=JSON.parse(readFileSync(this.path,"utf8"));if(x.schemaVersion!==1||!x.installationEpoch||DOMAINS.some(d=>!Number.isSafeInteger(x.domains?.[d])||x.domains[d]<0))throw Error("invalid");return x}catch{return this.#fresh()}}
  #persist(next){const tmp=this.path+".tmp";writeFileSync(tmp,JSON.stringify(next));renameSync(tmp,this.path)}
  begin(domains,reason){const unique=[...new Set(domains)];assert(unique.length&&unique.every(d=>DOMAINS.includes(d)));return {id:randomUUID(),domains:unique,reason,epoch:this.state.installationEpoch,before:{...this.state.domains},done:false}}
  commit(token,{changed=true}={}){assert(!token.done,"transaction already closed");assert.equal(token.epoch,this.state.installationEpoch,"epoch changed");token.done=true;if(!changed)return this.current();const next={...this.state,domains:{...this.state.domains}};for(const d of token.domains)next.domains[d]++;this.#persist(next);this.state=next;return this.current()}
  fail(token){assert(!token.done);token.done=true;return this.current()}
  current(domains=DOMAINS){return {installationEpoch:this.state.installationEpoch,domains:Object.fromEntries(domains.map(d=>[d,this.state.domains[d]]))}}
  snapshot(domains,project){for(let i=0;i<3;i++){const a=this.current(domains);const data=project();const b=this.current(domains);if(JSON.stringify(a)===JSON.stringify(b))return {snapshotId:`${a.installationEpoch}:${domains.map(d=>`${d}.${a.domains[d]}`).join("+")}`,revision:a,data};}throw Error("snapshot changed during capture")}
}

const dir=mkdtempSync(join(tmpdir(),"kaizen-revision-"));const file=join(dir,"revisions.json");
try{
  let c=new RevisionCoordinator(file);const epoch=c.current().installationEpoch;
  c.commit(c.begin(["core"],"add task"));assert.equal(c.current().domains.core,1);
  c.commit(c.begin(["core"],"no-op"),{changed:false});assert.equal(c.current().domains.core,1);
  c.commit(c.begin(["forge","career"],"ship to portfolio"));assert.equal(c.current().domains.forge,1);assert.equal(c.current().domains.career,1);
  const before=c.current();c.fail(c.begin(["health"],"failed persistence"));assert.deepEqual(c.current(),before);
  c=new RevisionCoordinator(file);assert.equal(c.current().installationEpoch,epoch);assert.equal(c.current().domains.core,1);
  const snap=c.snapshot(["core","career"],()=>({tasks:2}));assert.match(snap.snapshotId,/core\.1\+career\.1/);
  let first=true;const retried=c.snapshot(["core"],()=>{if(first){first=false;c.commit(c.begin(["core"],"concurrent"))}return {}});assert.match(retried.snapshotId,/core\.2/);
  // Corrupt metadata rotates epoch and invalidates old snapshot namespace.
  writeFileSync(file,"{bad json");const rotated=new RevisionCoordinator(file);assert.notEqual(rotated.current().installationEpoch,epoch);assert.equal(rotated.current().domains.core,0);
  console.log("W0-01 revision prototype: 9 assertions passed");
} finally {rmSync(dir,{recursive:true,force:true})}
