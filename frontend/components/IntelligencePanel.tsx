"use client";
/** Fixed Core Today Intelligence surface for pairing, grounded interpretation, and verified evidence. */
import { useMemo, useRef, useState } from "react";
import { BrainCircuit, CheckCircle2, ChevronRight, Link2, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, Unplug, X } from "lucide-react";
import { KaizenAiClient, type AiEngineState, type AiResponse } from "../lib/ai/client";
import type { TodaySnapshot } from "../lib/ai/domainBridge";

export default function IntelligencePanel({buildSnapshot}:{buildSnapshot:()=>TodaySnapshot}){
 const client=useMemo(()=>new KaizenAiClient(),[]),[paired,setPaired]=useState(client.paired),[code,setCode]=useState(""),[state,setState]=useState<AiEngineState>(client.paired?"ready":"pairing"),[response,setResponse]=useState<AiResponse|null>(null),[error,setError]=useState(""),[streaming,setStreaming]=useState(false);const abort=useRef<AbortController|null>(null);
 const pair=async()=>{if(!code.trim())return;setError("");setState("busy");try{await client.pair(code.trim());setPaired(true);setCode("");setState("ready")}catch(e){setState("pairing");setError(e instanceof Error?e.message:"Pairing failed")}};
 const run=async()=>{if(!paired)return;abort.current?.abort();const controller=new AbortController();abort.current=controller;setError("");setResponse(null);setStreaming(false);try{const result=await client.focusToday(buildSnapshot,{signal:controller.signal,onState:setState,onDelta:()=>setStreaming(true)});setResponse(result);setStreaming(false)}catch(e){setStreaming(false);if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Kaizen Intelligence is unavailable")}};
 const cancel=()=>{abort.current?.abort();setState("ready");setStreaming(false)};
 const disconnect=()=>{client.clear();setPaired(false);setState("pairing");setResponse(null)};
 return <section className="intelligence-console home-panel" aria-labelledby="intelligence-title">
  <header className="intelligence-head"><div className="intelligence-mark"><BrainCircuit size={19}/></div><div><span className="home-eyebrow">DETERMINISTIC · READ ONLY</span><h2 id="intelligence-title">Kaizen Intelligence</h2></div><div className={`intelligence-status state-${state}`}><i/>{state==="busy"?"THINKING":state==="ready"?"READY":state==="failed"?"UNAVAILABLE":"PAIRING"}</div></header>
  {!paired?<div className="intelligence-pair"><div><LockKeyhole size={20}/><strong>Pair the local engine</strong><p>Enter the one-time code printed by the independently running Intelligence Engine. The code and session token stay in this browser session.</p></div><div className="intelligence-pair-form"><input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&pair()} placeholder="One-time pairing code" aria-label="One-time pairing code" autoComplete="off"/><button onClick={pair} disabled={!code.trim()||state==="busy"}><ShieldCheck size={14}/>Pair locally</button></div></div>:
  <div className="intelligence-body"><div className="intelligence-quick"><button onClick={()=>void run()} disabled={state==="busy"}><Sparkles size={12}/>Review today&apos;s focus</button><button className="disconnect" onClick={disconnect} aria-label="Disconnect Intelligence Engine"><Unplug size={13}/></button></div><p className="intelligence-scope">Uses current Core Today evidence and Kaizen&apos;s deterministic ranking. No model, remote provider, or write path is active.</p>
   {state==="busy"&&<button className="intelligence-cancel" onClick={cancel} aria-label="Cancel interpretation"><X size={14}/>Cancel</button>}
   {state==="busy"&&!response&&<div className="intelligence-loading"><LoaderCircle size={16}/><span>{streaming?"Verifying deterministic evidence…":"Reading current Core Today evidence…"}</span></div>}
   {response&&<article className="intelligence-response"><div className="intelligence-response-top"><CheckCircle2 size={16}/><span>Deterministic baseline</span><b>{Math.round(response.confidence*100)}% confidence</b></div><h3>{response.title}</h3><p>{response.summary}</p>{response.rationale.length>0&&<div className="intelligence-rationale">{response.rationale.map((r,i)=><div key={`${r.claim}-${i}`}><ChevronRight size={12}/><span>{r.claim}</span></div>)}</div>}<footer><span><Link2 size={11}/>{response.sources.length} verified source{response.sources.length===1?"":"s"}</span>{response.sources.slice(0,3).map(s=><em key={s.sourceId}>{s.label}</em>)}</footer></article>}
  </div>}
  {error&&<div className="intelligence-error" role="alert">{error}</div>}
 </section>
}
