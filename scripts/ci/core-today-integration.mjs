#!/usr/bin/env node
/** CI-safe live integration smoke for frontend proxy → deterministic engine → Core Today bridge. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const managed=[];
function start(name,command,args,cwd){
  const child=spawn(command,args,{cwd,env:{...process.env},stdio:["ignore","pipe","pipe"],shell:process.platform==="win32",detached:process.platform!=="win32"});
  let log="";const collect=chunk=>{log=(log+chunk.toString()).slice(-20_000)};child.stdout.on("data",collect);child.stderr.on("data",collect);
  managed.push({name,child,log:()=>log.replace(/one-time pairing code: \S+/g,"one-time pairing code: [REDACTED]")});return{child,getLog:()=>log};
}
async function waitFor(url,timeoutMs=60_000){const end=Date.now()+timeoutMs;while(Date.now()<end){try{const response=await fetch(url,{signal:AbortSignal.timeout(2_000)});if(response.ok)return response}catch{}await new Promise(r=>setTimeout(r,250))}throw new Error(`Timed out waiting for ${url}`)}
function signal(child,name){if(!child.pid||child.exitCode!==null)return;try{if(process.platform==="win32")child.kill(name);else process.kill(-child.pid,name)}catch{}}
async function stopAll(){for(const {child} of [...managed].reverse())signal(child,"SIGTERM");await new Promise(r=>setTimeout(r,750));for(const {child} of managed)signal(child,"SIGKILL");await Promise.all(managed.map(({child})=>child.exitCode!==null?Promise.resolve():new Promise(resolve=>{const timer=setTimeout(resolve,1000);child.once("exit",()=>{clearTimeout(timer);resolve()})})))}
async function json(url,options={}){const response=await fetch(url,options);let body={};try{body=await response.json()}catch{}return{response,body}}
function localDate(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}

try{
  const ai=start("Intelligence Engine",process.execPath,["dist/src/server.js"],path.join(root,"ai"));
  await waitFor("http://127.0.0.1:4317/health");
  const pairingDeadline=Date.now()+10_000;let pairingCode;
  while(Date.now()<pairingDeadline&&!pairingCode){pairingCode=ai.getLog().match(/one-time pairing code: (\S+)/)?.[1];if(!pairingCode)await new Promise(r=>setTimeout(r,50))}
  assert.ok(pairingCode,"engine did not emit pairing code");
  start("Frontend","npm",["run","dev","--","--hostname","127.0.0.1"],path.join(root,"frontend"));
  await waitFor("http://127.0.0.1:3000/");
  const base="http://127.0.0.1:3000/api/ai";
  const crossSite=await fetch(`${base}/v1/pair`,{method:"POST",headers:{origin:"https://evil.example","x-kaizen-pairing-code":pairingCode}});assert.equal(crossSite.status,403);
  const paired=await json(`${base}/v1/pair`,{method:"POST",headers:{"x-kaizen-pairing-code":pairingCode}});assert.equal(paired.response.status,200);const token=paired.body.sessionToken;assert.equal(typeof token,"string");const auth={authorization:`Bearer ${token}`};
  const status=await json(`${base}/v1/status`,{headers:auth});assert.equal(status.response.status,200);assert.equal(status.body.model.providerId,"kaizen-mock");assert.equal(status.body.capabilities.nativeToolCalling,false);
  const unsupported=await json(`${base}/v1/requests`,{method:"POST",headers:{...auth,"content-type":"application/json"},body:JSON.stringify({intent:"ask",localDate:localDate()})});assert.equal(unsupported.response.status,400);assert.equal(unsupported.body.error.code,"UNSUPPORTED_INTENT");
  const created=await json(`${base}/v1/requests`,{method:"POST",headers:{...auth,"content-type":"application/json"},body:JSON.stringify({intent:"focus-today",localDate:localDate()})});assert.equal(created.response.status,202);const requestId=created.body.requestId;
  const stream=await fetch(`${base}/v1/requests/${requestId}/events`,{headers:auth});assert.equal(stream.status,200);assert.ok(stream.body);const reader=stream.body.getReader(),decoder=new TextDecoder();let buffer="",eventName="",completed;
  for(;;){const{value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});const lines=buffer.split("\n");buffer=lines.pop()??"";for(const raw of lines){const line=raw.trim();if(line.startsWith("event:"))eventName=line.slice(6).trim();else if(line.startsWith("data:")){const event=JSON.parse(line.slice(5).trim());if(eventName==="tool.requested"){
          const request=event.request;assert.equal(request.tool,"get_today");assert.equal(request.toolVersion,"1.0");assert.deepEqual(request.arguments,{localDate:localDate(),includeCompleted:false,maximumItems:100});
          const snapshot={contract:"core.today",contractVersion:"1.0",domain:"core",snapshotId:"ci:core.1",revision:{installationEpoch:"ci",domains:{core:1}},capturedAt:new Date().toISOString(),timezone:"UTC",sensitivity:"personal",trust:"kaizen-derived",data:{localDate:localDate(),tasks:[{id:"ci-task",title:"Verify deterministic integration",space:"core",priority:"high",completed:false}],scheduled:[],attention:[],deterministicNextAction:{sourceId:"ci-task",title:"Verify deterministic integration",reason:"CI fixed-route evidence",algorithmVersion:"ci-1"}},analytics:[],redactions:[{field:"health",reason:"consent"}]};
          const submitted=await fetch(`${base}/v1/requests/${requestId}/tool-results`,{method:"POST",headers:{...auth,"content-type":"application/json"},body:JSON.stringify({requestId,callId:request.callId,status:"ok",snapshot})});assert.equal(submitted.status,204);
        }else if(eventName==="response.completed")completed=event.response;else if(eventName==="request.failed")throw new Error(`request failed: ${event.code}`)}}if(completed||done)break}
  assert.ok(completed,"SSE ended without response");assert.equal(completed.title,"Verify deterministic integration");assert.equal(completed.sources[0].sourceId,"ci-task");assert.equal(completed.freshness.snapshots[0].snapshotId,"ci:core.1");assert.equal(completed.model.providerId,"kaizen-mock");
  const metrics=await json(`${base}/v1/metrics`,{headers:auth});assert.equal(metrics.response.status,200);assert.equal(metrics.body.requestsCompleted,1);assert.equal(JSON.stringify(metrics.body).includes("Verify deterministic integration"),false);
  const revoked=await fetch(`${base}/v1/session`,{method:"DELETE",headers:auth});assert.equal(revoked.status,204);const denied=await fetch(`${base}/v1/status`,{headers:auth});assert.equal(denied.status,401);
  console.log("Core Today live integration: PASS");
}catch(error){for(const item of managed)console.error(`\n--- ${item.name} log ---\n${item.log()}`);throw error}finally{await stopAll()}
