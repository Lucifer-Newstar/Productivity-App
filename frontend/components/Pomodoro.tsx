"use client";
/** Focus protocol timer with bounded work/reset cycles and session telemetry. */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, SkipForward, Volume2, VolumeX, TimerReset, ShieldCheck, Activity } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

type Mode = "focus" | "short" | "long";
const MODES: Record<Mode,{label:string;minutes:number;icon:typeof Brain;tagline:string;signal:string}>={
 focus:{label:"Deep focus",minutes:25,icon:Brain,tagline:"One outcome. No context switching.",signal:"WORK"},
 short:{label:"Short reset",minutes:5,icon:Coffee,tagline:"Move, hydrate, and clear the buffer.",signal:"RESET"},
 long:{label:"Long reset",minutes:15,icon:Coffee,tagline:"Step away before the next cycle.",signal:"RECOVER"},
};
export default function Pomodoro(){
 const [mode,setMode]=useState<Mode>("focus"),[secondsLeft,setSecondsLeft]=useState(1500),[running,setRunning]=useState(false),[sessions,setSessions]=useState<number>(()=>{if(typeof window==="undefined")return 0;try{const value=JSON.parse(localStorage.getItem("kaizen.focus")||"{}");return Number.isInteger(value.sessions)&&value.sessions>=0?value.sessions:0}catch{return 0}}),[muted,setMuted]=useState(true); const intervalRef=useRef<NodeJS.Timeout|null>(null);
 const total=MODES[mode].minutes*60,progress=1-secondsLeft/total,minutes=Math.floor(secondsLeft/60),seconds=secondsLeft%60;
 useEffect(()=>{setSecondsLeft(MODES[mode].minutes*60);setRunning(false)},[mode]);
 useEffect(()=>{try{localStorage.setItem("kaizen.focus",JSON.stringify({sessions,focusedMinutes:sessions*25}))}catch(error){window.dispatchEvent(new CustomEvent("kaizen:storage-error",{detail:{key:"kaizen.focus",reason:error instanceof Error?error.name:"storage-error"}}))}},[sessions]);
 useEffect(()=>{if(!running)return;intervalRef.current=setInterval(()=>setSecondsLeft(s=>{if(s<=1){clearInterval(intervalRef.current!);setRunning(false);if(!muted)try{const C=window.AudioContext||(window as any).webkitAudioContext,ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=760;g.gain.value=.12;o.start();o.stop(ctx.currentTime+.3)}catch{} if(mode==="focus"){setSessions(n=>n+1);setMode((sessions+1)%4===0?"long":"short")}else setMode("focus");return 0}return s-1}),1000);return()=>clearInterval(intervalRef.current!)},[running,mode,sessions,muted]);
 const reset=()=>{setSecondsLeft(total);setRunning(false)},skip=()=>{setRunning(false);setMode(mode==="focus"?"short":"focus")}, ModeIcon=MODES[mode].icon,circ=2*Math.PI*142;
 return <div className="core-section core-focus">
  <HomeSectionHeader index="03" eyebrow="Attention protocol" title="Focus Chamber" description="A deliberate operating mode for work that deserves uninterrupted attention." icon={TimerReset} actions={<button className="core-icon-action" onClick={()=>setMuted(m=>!m)} aria-label={muted?"Enable sound":"Mute sound"}>{muted?<VolumeX/>:<Volume2/>}<span>{muted?"Silent":"Sound on"}</span></button>}/>
  <section className={`focus-console mode-${mode} ${running?"is-running":""}`}>
   <div className="focus-console-top"><span className="focus-live"><i/>{running?"SESSION LIVE":"SYSTEM READY"}</span><span>Cycle {sessions+1} · {sessions%4}/4 complete</span></div>
   <div className="focus-mode-rail">{(Object.keys(MODES) as Mode[]).map(m=>{const I=MODES[m].icon;return <button key={m} onClick={()=>setMode(m)} className={mode===m?"is-active":""}><I/><span>{MODES[m].label}</span><b>{MODES[m].minutes}:00</b></button>})}</div>
   <div className="focus-stage">
    <div className="focus-dial"><svg viewBox="0 0 320 320"><circle cx="160" cy="160" r="142"/><motion.circle cx="160" cy="160" r="142" pathLength="1" animate={{pathLength:progress}} transition={{duration:.5,ease:"linear"}}/></svg><div><span>{MODES[mode].signal}</span><strong>{String(minutes).padStart(2,"0")}<i>:</i>{String(seconds).padStart(2,"0")}</strong><p>{MODES[mode].tagline}</p></div></div>
    <aside className="focus-protocol"><div><ShieldCheck/><span>Session rule</span><strong>Protect one outcome</strong><p>Close unrelated tabs. Silence inbound alerts. Write down distractions instead of following them.</p></div><div><Activity/><span>Today</span><strong>{sessions} cycles closed</strong><p>{sessions*25} focused minutes retained in this browser profile.</p></div></aside>
   </div>
   <div className="focus-controls"><button onClick={reset}><RotateCcw/>Reset</button><button className="focus-primary" onClick={()=>setRunning(r=>!r)}>{running?<Pause/>:<Play/>}{running?"Pause protocol":"Begin focus"}</button><button onClick={skip}><SkipForward/>Skip phase</button></div>
  </section>
 </div>
}
