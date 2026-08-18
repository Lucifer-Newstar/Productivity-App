"use client";
/** Read-only local Intelligence UI for pairing, requests, evidence, and failure states. */
import { useMemo, useRef, useState } from "react";
import { BrainCircuit, CheckCircle2, ChevronRight, Link2, LoaderCircle, LockKeyhole, Send, ShieldCheck, Sparkles, Unplug, X } from "lucide-react";
import { KaizenAiClient, type AiEngineState, type AiResponse } from "../lib/ai/client";
import type { TodaySnapshot } from "../lib/ai/domainBridge";

const QUICK=["What should I focus on?","Plan my day","What needs attention?"];
export default function IntelligencePanel({buildSnapshot}:{buildSnapshot:()=>TodaySnapshot}){
 const client=useMemo(()=>new KaizenAiClient(),[]),[paired,setPaired]=useState(client.paired),[code,setCode]=useState(""),[prompt,setPrompt]=useState(QUICK[0]),[state,setState]=useState<AiEngineState>(client.paired?"ready":"pairing"),[response,setResponse]=useState<AiResponse|null>(null),[error,setError]=useState(""),[streaming,setStreaming]=useState(false);const abort=useRef<AbortController|null>(null);
 const pair=async()=>{if(!code.trim())return;setError("");setState("busy");try{await client.pair(code.trim());setPaired(true);setCode("");setState("ready")}catch(e){setState("pairing");setError(e instanceof Error?e.message:"Pairing failed")}};
 const ask=async(text=prompt)=>{if(!text.trim()||!paired)return;abort.current?.abort();abort.current=new AbortController();setError("");setResponse(null);setStreaming(false);try{const result=await client.ask(text,buildSnapshot,{signal:abort.current.signal,onState:setState,onDelta:()=>setStreaming(true)});setResponse(result);setStreaming(false)}catch(e){setStreaming(false);setError(e instanceof Error?e.message:"Kaizen Intelligence is unavailable")}};
 const cancel=()=>{abort.current?.abort();setState("ready");setStreaming(false)};
 const disconnect=()=>{client.clear();setPaired(false);setState("pairing");setResponse(null)};
 return <section className="intelligence-console home-panel" aria-labelledby="intelligence-title">
  <header className="intelligence-head"><div className="intelligence-mark"><BrainCircuit size={19}/></div><div><span className="home-eyebrow">LOCAL · READ ONLY</span><h2 id="intelligence-title">Kaizen Intelligence</h2></div><div className={`intelligence-status state-${state}`}><i/>{state==="busy"?"THINKING":state==="ready"?"READY":state==="failed"?"UNAVAILABLE":"PAIRING"}</div></header>
  {!paired?<div className="intelligence-pair"><div><LockKeyhole size={20}/><strong>Pair the local engine</strong><p>Enter the one-time code printed by the independently running Intelligence Engine. The code and session token stay in this browser session.</p></div><div className="intelligence-pair-form"><input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&pair()} placeholder="One-time pairing code" aria-label="One-time pairing code" autoComplete="off"/><button onClick={pair} disabled={!code.trim()||state==="busy"}><ShieldCheck size={14}/>Pair locally</button></div></div>:
  <div className="intelligence-body"><div className="intelligence-quick">{QUICK.map(x=><button key={x} onClick={()=>{setPrompt(x);void ask(x)}} disabled={state==="busy"}><Sparkles size={12}/>{x}</button>)}<button className="disconnect" onClick={disconnect} aria-label="Disconnect Intelligence Engine"><Unplug size={13}/></button></div><div className="intelligence-ask"><input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&state!=="busy"&&ask()} placeholder="Ask about today's priorities" aria-label="Ask Kaizen Intelligence"/><button onClick={()=>state==="busy"?cancel():ask()} aria-label={state==="busy"?"Cancel request":"Ask Kaizen"}>{state==="busy"?<X size={16}/>:<Send size={16}/>}</button></div>
   {state==="busy"&&!response&&<div className="intelligence-loading"><LoaderCircle size={16}/><span>{streaming?"Validating a grounded response…":"Requesting current Kaizen context…"}</span></div>}
   {response&&<article className="intelligence-response"><div className="intelligence-response-top"><CheckCircle2 size={16}/><span>{response.model.providerId}</span><b>{Math.round(response.confidence*100)}% confidence</b></div><h3>{response.title}</h3><p>{response.summary}</p>{response.rationale.length>0&&<div className="intelligence-rationale">{response.rationale.map((r,i)=><div key={`${r.claim}-${i}`}><ChevronRight size={12}/><span>{r.claim}</span></div>)}</div>}<footer><span><Link2 size={11}/>{response.sources.length} verified source{response.sources.length===1?"":"s"}</span>{response.sources.slice(0,3).map(s=><em key={s.sourceId}>{s.label}</em>)}</footer></article>}
  </div>}
  {error&&<div className="intelligence-error" role="alert">{error}</div>}
 </section>
}
