import assert from "node:assert/strict";
import { BridgeRevisionTracker, type StorageLike } from "../lib/ai/revisions";

class MemoryStorage implements StorageLike{data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}removeItem(k:string){this.data.delete(k)}}
const local=new MemoryStorage(),session=new MemoryStorage(),tracker=new BridgeRevisionTracker(local,session,()=>1000);
const a=tracker.observe({core:{tasks:[{id:"t1"}]}});assert.equal(a.domains.core,1);const b=tracker.observe({core:{tasks:[{id:"t1"}]}});assert.equal(b.domains.core,1);const c=tracker.observe({core:{tasks:[{id:"t1"},{id:"t2"}]}});assert.equal(c.domains.core,2);assert.equal(tracker.isStale(a),true);assert.equal(tracker.isStale(c),false);tracker.release();
console.log("5 AI Domain Bridge revision checks passed.");
