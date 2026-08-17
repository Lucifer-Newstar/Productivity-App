import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BridgeRevisionTracker, type StorageLike } from "../lib/ai/revisions";
import { buildTodaySnapshot } from "../lib/ai/domainBridge";

class MemoryStorage implements StorageLike{data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}removeItem(k:string){this.data.delete(k)}}
let pass=0;const check=(label:string,condition:boolean)=>{assert.ok(condition,label);pass++;console.log(`✓ ${label}`)};
const local=new MemoryStorage(),session=new MemoryStorage(),tracker=new BridgeRevisionTracker(local,session,()=>1000);
const a=tracker.observe({core:{tasks:[{id:"t1"}]}});check("first observation increments core revision",a.domains.core===1);const b=tracker.observe({core:{tasks:[{id:"t1"}]}});check("unchanged observation preserves revision",b.domains.core===1);const c=tracker.observe({core:{tasks:[{id:"t1"},{id:"t2"}]}});check("changed state increments revision",c.domains.core===2);check("old vector becomes stale",tracker.isStale(a));check("current vector remains fresh",!tracker.isStale(c));tracker.release();
const intelligence:any={pulse:[],overall:70,next:{title:"Ship auth",space:"Forge",href:"/projects",reason:"Due today",priority:100,minutes:45},today:[],attention:[],timeline:[],momentum:[],brief:"",trajectory:[]};
const snapshot=buildTodaySnapshot({tasks:[{id:"t1",title:"Ship auth",completed:false,priority:"high",space:"projects",createdAt:1}],forgeTasks:[{id:"t1",title:"Ship auth"}],notifications:[],intelligence,now:new Date("2026-08-17T08:00:00+05:30"),tracker:new BridgeRevisionTracker(new MemoryStorage(),new MemoryStorage(),()=>1000)});
check("today adapter emits versioned contract",snapshot.contract==="core.today"&&snapshot.contractVersion==="1.0");check("deterministic next action retains real source ID",snapshot.data.deterministicNextAction?.sourceId==="t1");check("snapshot excludes note and health payloads",!("health" in snapshot.data)&&!("notes" in snapshot.data));
const root=path.resolve(__dirname,"..");const client=fs.readFileSync(path.join(root,"lib/ai/client.ts"),"utf8"),proxy=fs.readFileSync(path.join(root,"app/api/ai/[...path]/route.ts"),"utf8"),panel=fs.readFileSync(path.join(root,"components/IntelligencePanel.tsx"),"utf8");
check("client keeps token in sessionStorage and authorization header",client.includes("sessionStorage")&&client.includes("authorization:`Bearer"));check("same-origin proxy pins loopback gateway",proxy.includes("KAIZEN_AI_GATEWAY_URL")&&proxy.includes("127.0.0.1")&&!proxy.includes("request.nextUrl.searchParams.get(\"url\")"));check("Intelligence UI is explicitly local and read-only",panel.includes("LOCAL · READ ONLY")&&panel.includes("One-time pairing code"));
console.log(`\n${pass} AI frontend foundation checks passed.`);
