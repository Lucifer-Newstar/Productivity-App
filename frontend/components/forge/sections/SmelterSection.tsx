"use client";
/**
 * SmelterSection — /projects/smelter — brainstorming & retrospectives.
 * Tabs: SCRATCHPAD · DECISIONS · SWOT · 5 WHYS · LESSONS · RETRO
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Plus, Trash2, ScrollText, Lightbulb, Search,
  Target, HelpCircle, History, Scale, Zap, Users,
  Grid3x3, Brain, ThumbsUp, ThumbsDown, Timer as TimerIcon,
  Sparkles, Shuffle, Palette, Shapes, Flag, CheckCircle2, Play,
  Building2, Landmark, Network, MessageSquare, Mic, Workflow,
  Layers, PenTool, DollarSign, BarChart2, Compass, Route, Map,
  BrainCircuit, Palette as PaletteIcon, AudioLines, Layout,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { DecisionMatrixRow, Fishbone, SixHats, Persona, Scamper, Sprint, ProjectTask } from "../../../lib/forgeTypes";
import { addDays, todayISO } from "../forgeUtils";
import { BMCTab, VPCTab, LeanTab, PorterTab, PestelTab, StoriesTab, AffinityTab, BuyAFeatureTab, PairedTab, JourneyTab, BlueprintTab, EventStormTab, MindmapTab, CanvasTab, WireframeTab, VoiceTab } from "./Canvases";

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

const TABS = [
  { id: "scratch", label: "SCRATCH", icon: ScrollText, color: "#f59e0b" },
  { id: "ideas", label: "IDEAS", icon: Sparkles, color: "#facc15" },
  { id: "personas", label: "PERSONAS", icon: Users, color: "#ec4899" },
  { id: "decisions", label: "DECISIONS", icon: Target, color: "#06b6d4" },
  { id: "matrix", label: "DEC-MATRIX", icon: Grid3x3, color: "#a78bfa" },
  { id: "fishbone", label: "FISHBONE", icon: Brain, color: "#fb923c" },
  { id: "sixhats", label: "6 HATS", icon: Palette, color: "#22d3ee" },
  { id: "scamper", label: "SCAMPER", icon: Shapes, color: "#f472b6" },
  { id: "swot", label: "SWOT", icon: Search, color: "#a78bfa" },
  { id: "proscons", label: "PRO/CON", icon: Scale, color: "#06b6d4" },
  { id: "scenarios", label: "SCENARIOS", icon: Zap, color: "#f59e0b" },
  { id: "whys", label: "5 WHYS", icon: HelpCircle, color: "#ec4899" },
  { id: "lessons", label: "LESSONS", icon: Lightbulb, color: "#22c55e" },
  { id: "retro", label: "RETRO", icon: History, color: "#ef4444" },
  { id: "sprints", label: "SPRINTS", icon: Flag, color: "#f59e0b" },
  // Wave-10: strategy / UX / research canvases
  { id: "bmc", label: "BMC", icon: Building2, color: "#f59e0b" },
  { id: "vpc", label: "VPC", icon: Landmark, color: "#22c55e" },
  { id: "lean", label: "LEAN", icon: BarChart2, color: "#a78bfa" },
  { id: "porter", label: "PORTER", icon: Network, color: "#ef4444" },
  { id: "pestel", label: "PESTEL", icon: Compass, color: "#06b6d4" },
  { id: "stories", label: "STORIES", icon: MessageSquare, color: "#ec4899" },
  { id: "affinity", label: "AFFINITY", icon: Layers, color: "#06b6d4" },
  { id: "buyafeature", label: "BUY·FEAT", icon: DollarSign, color: "#22c55e" },
  { id: "paired", label: "PAIRED", icon: Scale, color: "#a78bfa" },
  { id: "journey", label: "JOURNEY", icon: Map, color: "#fb923c" },
  { id: "blueprint", label: "BLUEPRINT", icon: Route, color: "#facc15" },
  { id: "eventstorm", label: "EVENT·STORM", icon: Workflow, color: "#f472b6" },
  { id: "mindmap", label: "MINDMAP", icon: BrainCircuit, color: "#818cf8" },
  { id: "canvas", label: "CANVAS", icon: PaletteIcon, color: "#f59e0b" },
  { id: "wireframe", label: "WIREFRAME", icon: Layout, color: "#94a3b8" },
  { id: "voice", label: "VOICE", icon: AudioLines, color: "#f472b6" },
] as const;

const SWOT_Q: { k:"S"|"W"|"O"|"T"; label:string; color:string }[] = [
  { k:"S", label:"STRENGTHS", color:"#22c55e" },
  { k:"W", label:"WEAKNESSES", color:"#ef4444" },
  { k:"O", label:"OPPORTUNITIES", color:"#06b6d4" },
  { k:"T", label:"THREATS", color:"#f59e0b" },
];

export default function SmelterSection() {
  const { forge, updateForge } = useStore();
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("scratch");
  const [projFilter, setProjFilter] = useState<string>("all");

  const activeProjects = forge.projects.filter(p=>!p.archived);
  const byProj = <T extends { projectId?: string }>(arr: T[]) =>
    projFilter==="all" ? arr : arr.filter(x=>x.projectId===projFilter);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-wider flex items-center gap-2">
            <Flame size={26} style={{color:"var(--fr-red)"}}/> the.smelter
          </h2>
          <p className="mono text-[11px] tracking-widest mt-1 italic" style={{color:"var(--fr-fgMuted)"}}>
            // melt the ore. sift decisions, lessons, future scenarios — everything that doesn't fit in a card
          </p>
        </div>
        <SmelterTimer/>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="mono text-[10px] md:text-xs tracking-widest font-black px-3 py-2 rounded-sm flex items-center gap-1.5 transition"
            style={{
              background: tab===t.id ? `${t.color}33` : "var(--fr-card2)",
              color: tab===t.id ? t.color : "var(--fr-fgMuted)",
              border: `1px solid ${tab===t.id?`${t.color}88`:"var(--fr-borderSoft)"}`,
            }}>
            <t.icon size={11}/>{t.label}
          </button>
        ))}
        <select value={projFilter} onChange={e=>setProjFilter(e.target.value)}
          className="mono text-[10px] ml-auto px-2 py-2 rounded-sm outline-none"
          style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <option value="all">All heats</option>
          {activeProjects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
        </select>
      </div>

      <AnimatePresence mode="wait">
        {tab==="scratch" && (
          <motion.div key="s" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <ScratchAdd onAdd={(text,pid)=>updateForge(f=>({scratch:[{id:uid(),text,projectId:pid||undefined,createdAt:Date.now()},...f.scratch]}))} projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
            <div className="columns-1 md:columns-2 gap-3 [column-fill:_balance]">
              {byProj(forge.scratch).sort((a,b)=>b.createdAt-a.createdAt).map(n => {
                const p = forge.projects.find(x=>x.id===n.projectId);
                return (
                  <div key={n.id} className="break-inside-avoid rounded-sm steel-plate p-4 mb-3 relative"
                    style={{borderColor:p?.color?"var(--fr-borderSoft)":"var(--fr-border)"}}>
                    <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="mono text-[9px] tracking-widest flex items-center gap-1" style={{color:p?.color||"var(--fr-fgMuted)"}}>
                        {p ? <><span>{p.icon}</span>{p.codename}</> : "// unfiled"}
                      </div>
                      <button onClick={()=>updateForge(f=>({scratch:f.scratch.filter(x=>x.id!==n.id)}))}
                        className="opacity-60 hover:opacity-100" style={{color:"var(--fr-red)"}}><Trash2 size={10}/></button>
                    </div>
                    <p className="pencil text-sm leading-relaxed whitespace-pre-wrap" style={{color:"var(--fr-fg)"}}>{n.text}</p>
                    <div className="mono text-[9px] mt-2 text-right" style={{color:"var(--fr-fgDim)"}}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab==="decisions" && (
          <motion.div key="d" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <DecisionAdd onAdd={(d)=>updateForge(f=>({decisions:[{id:uid(),...d},...f.decisions]}))} projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
            <div className="space-y-2">
              {byProj(forge.decisions).sort((a,b)=>b.date.localeCompare(a.date)).map(d=>{
                const p = forge.projects.find(x=>x.id===d.projectId);
                return (
                  <div key={d.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#06b6d455"}}>
                    <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mono text-[10px] tracking-widest" style={{color:p?.color||"#06b6d4"}}>
                          {p?.icon} {p?.codename||"GLOBAL"} · {d.date}
                          {d.approvals && <span className="forge-stamp text-[9px]" style={{color:"#22c55e",borderColor:"#22c55e"}}>APPROVED</span>}
                        </div>
                        <h4 className="font-black text-lg mt-1">{d.decision}</h4>
                      </div>
                      <button onClick={()=>updateForge(f=>({decisions:f.decisions.filter(x=>x.id!==d.id)}))}
                        className="opacity-60 hover:opacity-100" style={{color:"var(--fr-red)"}}><Trash2 size={12}/></button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>ALTERNATIVES REJECTED</div>
                        <p className="pencil text-sm italic" style={{color:"var(--fr-fg)"}}>{d.alternatives||"—"}</p>
                      </div>
                      <div>
                        <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>WHY</div>
                        <p className="pencil text-sm" style={{color:"var(--fr-fg)"}}>{d.why||"—"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {forge.decisions.length===0 && <EmptyState icon={Target} label="No decisions logged yet." sub="Log the forks in the road. Future-you will thank present-you."/>}
            </div>
          </motion.div>
        )}

        {tab==="ideas" && (
          <motion.div key="id" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <IdeasPanel projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
          </motion.div>
        )}

        {tab==="personas" && (
          <motion.div key="pn" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <PersonasPanel projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
          </motion.div>
        )}

        {tab==="matrix" && (
          <motion.div key="mx" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <DecisionMatrixPanel projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
          </motion.div>
        )}

        {tab==="fishbone" && (
          <motion.div key="fb" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <FishbonePanel projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
          </motion.div>
        )}

        {tab==="sixhats" && (
          <motion.div key="sh" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SixHatsPanel projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
          </motion.div>
        )}

        {tab==="scamper" && (
          <motion.div key="sc" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <ScamperPanel projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}/>
          </motion.div>
        )}

        {tab==="swot" && (
          <motion.div key="sw" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SWOT_Q.map(q=>(
                <SwotQuad key={q.k} q={q}
                  items={forge.swot.filter(s=>s.quadrant===q.k && (projFilter==="all"||s.projectId===projFilter))}
                  projectId={projFilter!=="all"?projFilter:undefined}
                  onAdd={(text)=>updateForge(f=>({swot:[{id:uid(),quadrant:q.k,text,projectId:projFilter!=="all"?projFilter:undefined},...f.swot]}))}
                  onDel={(id)=>updateForge(f=>({swot:f.swot.filter(x=>x.id!==id)}))}/>
              ))}
            </div>
          </motion.div>
        )}

        {tab==="whys" && (
          <motion.div key="w" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <WhyAdd projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}
              onAdd={(w)=>updateForge(f=>({fiveWhys:[{id:uid(),...w},...f.fiveWhys]}))}/>
            <div className="space-y-3">
              {byProj(forge.fiveWhys).map(w=>{
                const p = forge.projects.find(x=>x.id===w.projectId);
                return (
                  <div key={w.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#ec489955"}}>
                    <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                    <div className="flex items-center justify-between gap-2">
                      <div className="mono text-[10px] tracking-widest" style={{color:p?.color||"#ec4899"}}>{p?.icon} {p?.codename||"GLOBAL"}</div>
                      <button onClick={()=>updateForge(f=>({fiveWhys:f.fiveWhys.filter(x=>x.id!==w.id)}))}
                        className="opacity-60 hover:opacity-100" style={{color:"var(--fr-red)"}}><Trash2 size={12}/></button>
                    </div>
                    <div className="mono text-[10px] mt-2" style={{color:"var(--fr-fgMuted)"}}>PROBLEM</div>
                    <p className="pencil text-base font-bold" style={{color:"var(--fr-fg)"}}>{w.problem}</p>
                    <ol className="mt-2 space-y-1">
                      {w.whys.map((why,i)=>(
                        <li key={i} className="mono text-xs flex gap-2">
                          <span style={{color:"#ec4899"}}>{i+1}.</span>
                          <span className="pencil" style={{color:"var(--fr-fg)"}}>{why||"(blank)"}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
              {forge.fiveWhys.length===0 && <EmptyState icon={HelpCircle} label="No 5-whys yet." sub="When something breaks, chase root cause like a bloodhound."/>}
            </div>
          </motion.div>
        )}

        {tab==="lessons" && (
          <motion.div key="l" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-sm steel-plate p-3 flex items-center gap-2" style={{borderColor:"#22c55e55"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <input id="lesson-text" placeholder="What did you learn today?"
                className="flex-1 bg-transparent outline-none mono text-sm"
                style={{color:"var(--fr-fg)"}}
                onKeyDown={e=>{
                  if(e.key==="Enter"){
                    const v = (e.target as HTMLInputElement).value.trim();
                    if(!v)return;
                    updateForge(f=>({lessons:[{id:uid(),date:today(),category:"general",text:v,tags:[]},...f.lessons]}));
                    (e.target as HTMLInputElement).value="";
                  }
                }}/>
              <button onClick={e=>{
                const inp = document.getElementById("lesson-text") as HTMLInputElement;
                const v = inp?.value.trim(); if(!v)return;
                updateForge(f=>({lessons:[{id:uid(),date:today(),category:"general",text:v,tags:[]},...f.lessons]}));
                inp.value="";
              }} className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
                style={{background:"#22c55e",color:"#000"}}>LOG</button>
            </div>
            <div className="space-y-2">
              {forge.lessons.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(l=>{
                const p = forge.projects.find(x=>x.id===l.projectId);
                const catColor = l.category==="well"?"#22c55e":l.category==="poorly"?"#ef4444":l.category==="improve"?"#f59e0b":"#a78bfa";
                return (
                  <div key={l.id} className="rounded-sm steel-plate p-3 relative flex items-start gap-3" style={{borderColor:`${catColor}55`}}>
                    <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                    <div className="w-2 h-2 mt-2 rounded-full shrink-0" style={{background:catColor,boxShadow:`0 0 6px ${catColor}`}}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mono text-[9px] tracking-widest" style={{color:p?.color||catColor}}>
                        {p?.icon} {p?.codename||"GLOBAL"} · {l.date} · {l.category.toUpperCase()}
                      </div>
                      <p className="pencil text-sm mt-0.5" style={{color:"var(--fr-fg)"}}>{l.text}</p>
                    </div>
                    <button onClick={()=>updateForge(f=>({lessons:f.lessons.filter(x=>x.id!==l.id)}))}
                      className="opacity-60 hover:opacity-100" style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
                  </div>
                );
              })}
              {forge.lessons.length===0 && <EmptyState icon={Lightbulb} label="Lessons ledger empty." sub="Start each entry with a hard lesson. Build a playbook."/>}
            </div>
          </motion.div>
        )}

        {tab==="proscons" && (
          <motion.div key="pc" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ProsCons side="pro" color="#22c55e" items={forge.proscons.filter(x=>x.side==="pro"&&(projFilter==="all"||x.projectId===projFilter))}
                onAdd={(text,weight)=>updateForge(f=>({proscons:[{id:uid(),side:"pro",text,weight,projectId:projFilter!=="all"?projFilter:undefined},...f.proscons]}))}
                onDel={(id)=>updateForge(f=>({proscons:f.proscons.filter(x=>x.id!==id)}))}
                onWeight={(id,w)=>updateForge(f=>({proscons:f.proscons.map(x=>x.id===id?{...x,weight:w}:x)}))}
                projFilter={projFilter}/>
              <ProsCons side="con" color="#ef4444" items={forge.proscons.filter(x=>x.side==="con"&&(projFilter==="all"||x.projectId===projFilter))}
                onAdd={(text,weight)=>updateForge(f=>({proscons:[{id:uid(),side:"con",text,weight,projectId:projFilter!=="all"?projFilter:undefined},...f.proscons]}))}
                onDel={(id)=>updateForge(f=>({proscons:f.proscons.filter(x=>x.id!==id)}))}
                onWeight={(id,w)=>updateForge(f=>({proscons:f.proscons.map(x=>x.id===id?{...x,weight:w}:x)}))}
                projFilter={projFilter}/>
            </div>
            <div className="mt-3 rounded-sm steel-plate p-3 relative" style={{borderColor:"var(--fr-amber)"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="mono text-[10px] tracking-widest mb-1" style={{color:"var(--fr-amber)"}}>WEIGHTED VERDICT</div>
              {(() => {
                const list = forge.proscons.filter(x=>projFilter==="all"||x.projectId===projFilter);
                const proScore = list.filter(x=>x.side==="pro").reduce((n,x)=>n+x.weight,0);
                const conScore = list.filter(x=>x.side==="con").reduce((n,x)=>n+x.weight,0);
                const total = proScore+conScore || 1;
                const verdict = proScore>conScore ? "GO" : proScore===conScore ? "TOSS-UP" : "NO-GO";
                const vColor = proScore>conScore ? "#22c55e" : proScore===conScore ? "#f59e0b" : "#ef4444";
                return (
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{color:"#22c55e"}}>PRO {proScore}</span>
                      <span className="forge-stamp text-xs" style={{color:vColor}}>{verdict}</span>
                      <span style={{color:"#ef4444"}}>CON {conScore}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-sm flex overflow-hidden" style={{background:"var(--fr-borderSoft)"}}>
                      <div style={{width:`${proScore/total*100}%`,background:"#22c55e"}}/>
                      <div style={{width:`${conScore/total*100}%`,background:"#ef4444"}}/>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {tab==="scenarios" && (
          <motion.div key="sc" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-sm steel-plate p-3 relative" style={{borderColor:"#f59e0b55"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <ScenarioAdd projects={activeProjects} defaultProj={projFilter!=="all"?projFilter:undefined}
                onAdd={(s)=>updateForge(f=>({scenarios:[{id:uid(),...s},...f.scenarios]}))}/>
            </div>
            <div className="space-y-2">
              {forge.scenarios.filter(s=>projFilter==="all"||s.projectId===projFilter).map(s=>{
                const p = forge.projects.find(x=>x.id===s.projectId);
                return (
                  <div key={s.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#f59e0b44"}}>
                    <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mono text-[10px] tracking-widest" style={{color:p?.color||"#f59e0b"}}>
                          <Zap size={10}/>{p?.icon} {p?.codename||"GLOBAL"}
                        </div>
                        <div className="font-black text-base mt-1" style={{color:"var(--fr-fg)"}}>{s.title}</div>
                        <div className="pencil text-xs mt-1 italic" style={{color:"var(--fr-orange)"}}>IF: {s.trigger}</div>
                        <div className="pencil text-xs mt-1" style={{color:"var(--fr-fgMuted)"}}>THEN: {s.response}</div>
                      </div>
                      <button onClick={()=>updateForge(f=>({scenarios:f.scenarios.filter(x=>x.id!==s.id)}))}
                        style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
                    </div>
                  </div>
                );
              })}
              {forge.scenarios.filter(s=>projFilter==="all"||s.projectId===projFilter).length===0 && <EmptyState icon={Zap} label="No scenarios yet." sub="Plan for failure and success before they happen."/>}
            </div>
          </motion.div>
        )}

        {tab==="retro" && (
          <motion.div key="r" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <RetroAdd onAdd={(r)=>updateForge(f=>({retors:[{id:uid(),...r},...f.retors]}))}/>
            <div className="space-y-3">
              {forge.retors.sort((a,b)=>b.date.localeCompare(a.date)).map(r=>(
                <div key={r.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#ef444455"}}>
                  <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                  <div className="flex items-center justify-between">
                    <div className="mono text-[10px] tracking-widest" style={{color:"#ef4444"}}>RETRO · {r.date}</div>
                    <button onClick={()=>updateForge(f=>({retors:f.retors.filter(x=>x.id!==r.id)}))}
                      className="opacity-60 hover:opacity-100" style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 mt-3">
                    {([["start","START", "#22c55e"],["stop","STOP", "#ef4444"],["continue","CONTINUE","#06b6d4"]] as const).map(([k,lbl,c])=>(
                      <div key={k}>
                        <div className="mono text-[9px] tracking-widest mb-1" style={{color:c}}>{lbl}</div>
                        <ul className="space-y-0.5">
                          {(r as any)[k]?.map((t:string,i:number)=>(
                            <li key={i} className="pencil text-sm flex gap-2" style={{color:"var(--fr-fg)"}}>
                              <span style={{color:c}}>▸</span>{t}
                            </li>
                          ))}
                          {(!(r as any)[k]||(r as any)[k].length===0) && <li className="pencil text-sm italic" style={{color:"var(--fr-fgDim)"}}>—</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {forge.retors.length===0 && <EmptyState icon={History} label="No retros yet." sub="Start / Stop / Continue. Weekly, at minimum."/>}
            </div>
          </motion.div>
        )}

        {tab==="sprints" && (
          <motion.div key="sp" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
            <SprintsPanel/>
          </motion.div>
        )}

        {tab==="bmc" && (
          <motion.div key="bmc" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Building2} color="#f59e0b" kicker="STRATEGY" title="Business Model Canvas" sub="9-block map of how you create, deliver & capture value."/>
            <BMCTab/>
          </motion.div>
        )}
        {tab==="vpc" && (
          <motion.div key="vpc" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Landmark} color="#22c55e" kicker="STRATEGY" title="Value Proposition Canvas" sub="Map customer jobs/pains/gains against your product."/>
            <VPCTab/>
          </motion.div>
        )}
        {tab==="lean" && (
          <motion.div key="ln" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={BarChart2} color="#a78bfa" kicker="STRATEGY" title="Lean Canvas" sub="Ash Maurya — startup-in-1-page, problems → unfair advantage."/>
            <LeanTab/>
          </motion.div>
        )}
        {tab==="porter" && (
          <motion.div key="pt" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Network} color="#ef4444" kicker="STRATEGY" title="Porter's Five Forces" sub="Industry rivalry map — don't compete blind."/>
            <PorterTab/>
          </motion.div>
        )}
        {tab==="pestel" && (
          <motion.div key="pe" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Compass} color="#06b6d4" kicker="STRATEGY" title="PESTEL Analysis" sub="Macro-environmental forces shaping your heat."/>
            <PestelTab/>
          </motion.div>
        )}
        {tab==="stories" && (
          <motion.div key="st" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={MessageSquare} color="#ec4899" kicker="UX / DEV" title="User Stories" sub="As a [role], I want [feature], so that [outcome]. Kanban flow inside."/>
            <StoriesTab/>
          </motion.div>
        )}
        {tab==="affinity" && (
          <motion.div key="af" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Layers} color="#06b6d4" kicker="RESEARCH" title="Affinity Grouping" sub="Cluster sticky notes into themes from interviews/notes."/>
            <AffinityTab/>
          </motion.div>
        )}
        {tab==="buyafeature" && (
          <motion.div key="bf" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={DollarSign} color="#22c55e" kicker="PRIORITIZATION" title="Buy-a-Feature" sub="Give stakeholders a budget; what they buy is what ships."/>
            <BuyAFeatureTab/>
          </motion.div>
        )}
        {tab==="paired" && (
          <motion.div key="pr" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Scale} color="#a78bfa" kicker="PRIORITIZATION" title="Paired Comparison" sub="Head-to-head votes rank options cleanly."/>
            <PairedTab/>
          </motion.div>
        )}
        {tab==="journey" && (
          <motion.div key="jm" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Map} color="#fb923c" kicker="UX" title="Customer Journey Map" sub="Stages / thoughts / pains / opportunities end-to-end."/>
            <JourneyTab/>
          </motion.div>
        )}
        {tab==="blueprint" && (
          <motion.div key="bp" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Route} color="#facc15" kicker="UX" title="Service Blueprint" sub="Customer actions, onstage/backstage, support, evidence."/>
            <BlueprintTab/>
          </motion.div>
        )}
        {tab==="eventstorm" && (
          <motion.div key="es" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Workflow} color="#f472b6" kicker="DDD" title="Event Storming" sub="Domain events, commands, aggregates, policies."/>
            <EventStormTab/>
          </motion.div>
        )}
        {tab==="mindmap" && (
          <motion.div key="mm" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={BrainCircuit} color="#818cf8" kicker="THINKING" title="Mindmap" sub="Radial tree — click + to branch out, edit text inline."/>
            <MindmapTab/>
          </motion.div>
        )}
        {tab==="canvas" && (
          <motion.div key="cv" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={PaletteIcon} color="#f59e0b" kicker="FREEFORM" title="Drawing Canvas" sub="Stickies, boxes, arrows — infinite desk."/>
            <CanvasTab/>
          </motion.div>
        )}
        {tab==="wireframe" && (
          <motion.div key="wf" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={Layout} color="#94a3b8" kicker="UX" title="Wireframes" sub="Link Figma/Sketch files, sketch screen flows."/>
            <WireframeTab/>
          </motion.div>
        )}
        {tab==="voice" && (
          <motion.div key="vo" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <SectionHeading icon={AudioLines} color="#f472b6" kicker="CAPTURE" title="Voice Notes" sub="Raw thoughts captured fast — transcribe, tag, triage."/>
            <VoiceTab/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SprintsPanel() {
  const { forge, updateForge } = useStore();
  const [name,setName] = useState("");
  const [goal,setGoal] = useState("");
  const [len,setLen] = useState(forge.settings.sprintLengthDays||14);
  const [pid,setPid] = useState<string>("");
  const [velocity,setVelocity] = useState<number>(12);
  const activeProjects = forge.projects.filter(p=>!p.archived);

  const addSprint = () => {
    if (!name.trim()) return;
    const t = todayISO();
    const sp: Sprint = {
      id: "sp-"+uid(), name: name.trim(), goal: goal.trim(),
      startDate: t, endDate: addDays(t,len-1), status:"planning",
      projectId: pid||undefined, velocityTarget: velocity, taskIds: [],
    };
    updateForge(f => ({
      sprints: [sp, ...f.sprints],
      settings: { ...f.settings, sprintLengthDays: len },
    }));
    setName(""); setGoal("");
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"SPRINT PLANNED",sub:sp.name,color:"#f59e0b",icon:"flag"}}));
  };
  const startSprint = (id:string) => {
    // Close any currently-active sprint
    updateForge(f => ({ sprints: f.sprints.map(s => s.id===id ? { ...s, status: "active" as const } : s.status==="active" ? { ...s, status: "closed" as const, completedAt: todayISO() } : s) }));
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#f59e0b",count:25}}));
  };
  const closeSprint = (id:string) => {
    updateForge(f => ({ sprints: f.sprints.map(s => s.id===id ? { ...s, status: "closed" as const, completedAt: todayISO() } : s) }));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"SPRINT CLOSED",sub:"locked",color:"#22c55e",icon:"check"}}));
  };
  const toggleTask = (sid:string, tid:string) => {
    updateForge(f => ({ sprints: f.sprints.map(s => s.id===sid ? { ...s, taskIds: s.taskIds.includes(tid) ? s.taskIds.filter(x=>x!==tid) : [...s.taskIds,tid] } : s) }));
  };
  const deleteSprint = (id:string) => updateForge(f => ({ sprints: f.sprints.filter(s=>s.id!==id) }));

  const backlog = forge.tasks.filter(t => t.status!=="done" && !forge.sprints.some(s => s.taskIds.includes(t.id) && s.status!=="closed"));
  const sorted = [...forge.sprints].sort((a,b)=>(a.status==="active"?-1:b.status==="active"?1:b.startDate.localeCompare(a.startDate)));

  return (
    <>
      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#f59e0b55"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#f59e0b"}}>+ NEW SPRINT</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="S3 · CRUCIBLE"
            className="px-3 py-2 rounded-sm outline-none mono text-xs"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <select value={pid} onChange={e=>setPid(e.target.value)}
            className="px-3 py-2 rounded-sm outline-none mono text-xs"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="">ALL HEATS (cross-project)</option>
            {activeProjects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
          </select>
          <div className="flex gap-1">
            <input type="number" min={3} max={30} value={len} onChange={e=>setLen(Number(e.target.value))}
              className="w-20 px-2 py-2 rounded-sm outline-none mono text-xs"
              style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
            <span className="mono text-[10px] flex items-center" style={{color:"var(--fr-fgMuted)"}}>days</span>
            <input type="number" min={1} value={velocity} onChange={e=>setVelocity(Number(e.target.value))}
              className="w-20 px-2 py-2 rounded-sm outline-none mono text-xs ml-2"
              style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
            <span className="mono text-[10px] flex items-center" style={{color:"var(--fr-fgMuted)"}}>target</span>
          </div>
          <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="sprint goal (1-line, sharp)"
            className="md:col-span-3 px-3 py-2 rounded-sm outline-none mono text-xs"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        </div>
        <div className="flex justify-end mt-2">
          <button onClick={addSprint}
            className="mono text-[10px] font-black tracking-widest px-4 py-2 rounded-sm flex items-center gap-1"
            style={{background:"#f59e0b",color:"#000"}}><Flag size={11}/> PLAN SPRINT</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map(s => {
          const proj = s.projectId ? forge.projects.find(p=>p.id===s.projectId) : null;
          const cStatus = s.status==="active"?"#f59e0b":s.status==="closed"?"#22c55e":"#94a3b8";
          const sprintTasks = forge.tasks.filter(t => s.taskIds.includes(t.id));
          const doneCount = sprintTasks.filter(t=>t.status==="done").length;
          const pct = sprintTasks.length?Math.round(doneCount/sprintTasks.length*100):0;
          const totalDays = Math.max(1, Math.ceil((new Date(s.endDate).getTime()-new Date(s.startDate).getTime())/86400000)+1);
          const elapsed = Math.min(totalDays, Math.max(0, Math.ceil((Date.now()-new Date(s.startDate).getTime())/86400000)+1));
          const idealPct = s.status==="closed"?100:Math.round(elapsed/totalDays*100);
          const tasksToShow = proj ? sprintTasks.filter(t=>t.projectId===s.projectId||!s.projectId).concat(
            forge.tasks.filter(t=>t.projectId===s.projectId&&t.status!=="done"&&!s.taskIds.includes(t.id)).slice(0,12)
          ) : sprintTasks.concat(backlog.filter(t=>!s.taskIds.includes(t.id)).slice(0,10));
          return (
            <div key={s.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:`${cStatus}66`}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="mono text-[10px] tracking-widest" style={{color:cStatus}}>
                      {s.status==="active"?"▶ ACTIVE":s.status==="closed"?"✓ CLOSED":"◌ PLANNING"}
                    </span>
                    {proj && <span className="mono text-[9px] tracking-widest" style={{color:proj.color}}>{proj.icon} {proj.codename}</span>}
                  </div>
                  <h4 className="text-lg font-black tracking-wide leading-tight mt-0.5">{s.name}</h4>
                  {s.goal && <p className="pencil italic text-xs mt-0.5" style={{color:"var(--fr-fgMuted)"}}>{s.goal}</p>}
                  <div className="mono text-[10px] tracking-widest mt-1" style={{color:"var(--fr-fgMuted)"}}>
                    {s.startDate} → {s.endDate} · {doneCount}/{sprintTasks.length} shipped · target {s.velocityTarget||"—"}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {s.status==="planning" && <button onClick={()=>startSprint(s.id)} title="Start sprint"
                    className="p-1.5 rounded-sm" style={{background:"#f59e0b",color:"#000"}}><Play size={11}/></button>}
                  {s.status==="active" && <button onClick={()=>closeSprint(s.id)} title="Close sprint"
                    className="p-1.5 rounded-sm" style={{background:"#22c55e",color:"#000"}}><CheckCircle2 size={11}/></button>}
                  <button onClick={()=>deleteSprint(s.id)} className="p-1.5 rounded-sm" style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
                </div>
              </div>

              <div className="mt-3 h-2 rounded-full overflow-hidden relative" style={{background:"var(--fr-borderSoft)"}}>
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8}}
                  className="h-full" style={{background:"linear-gradient(90deg,var(--fr-amber),var(--fr-green))",boxShadow:"0 0 6px var(--fr-amber)"}}/>
                <div className="absolute top-0 bottom-0 w-px" style={{left:`${idealPct}%`,background:"var(--fr-red)",boxShadow:"0 0 4px var(--fr-red)"}} title="ideal burndown"/>
              </div>
              <div className="flex justify-between mono text-[9px] tracking-widest mt-1" style={{color:"var(--fr-fgMuted)"}}>
                <span>{pct}% shipped</span>
                <span style={{color:"var(--fr-amber)"}}>ideal {idealPct}%</span>
              </div>

              {/* Burndown mini-chart */}
              <SprintBurndown sprint={s} tasks={sprintTasks}/>

              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                {tasksToShow.slice(0,12).map(t => {
                  const p = forge.projects.find(x=>x.id===t.projectId);
                  const selected = s.taskIds.includes(t.id);
                  return (
                    <label key={t.id} className="flex items-center gap-2 p-1.5 rounded-sm cursor-pointer text-xs"
                      style={{background:selected?"rgba(245,158,11,0.08)":"var(--fr-card2)",border:`1px solid ${selected?"rgba(245,158,11,0.4)":"var(--fr-borderSoft)"}`}}>
                      <input type="checkbox" checked={selected} onChange={()=>toggleTask(s.id,t.id)} className="accent-amber-500"/>
                      <span className={t.status==="done"?"line-through opacity-60":""}>{t.title}</span>
                      <span className="ml-auto mono text-[9px] tracking-widest" style={{color:p?.color||"var(--fr-fgDim)"}}>{p?.icon}{p?.codename}</span>
                    </label>
                  );
                })}
                {tasksToShow.length===0 && <div className="mono text-[10px] italic p-2 text-center" style={{color:"var(--fr-fgDim)"}}>Pick tasks from the backlog.</div>}
              </div>
            </div>
          );
        })}
        {sorted.length===0 && <EmptyState icon={Flag} label="No sprints yet." sub="Plan your first sprint — 1-2 weeks, one sharp goal."/>}
      </div>
    </>
  );
}

function SectionHeading({icon:Icon,color,kicker,title,sub}:{icon:any;color:string;kicker:string;title:string;sub:string}) {
  return (
    <div className="steel-plate rounded-sm p-4 flex items-start gap-3 relative" style={{borderColor:`${color}55`}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0" style={{background:`${color}22`,border:`1.5px solid ${color}88`,color}}>
        <Icon size={18}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="mono text-[9px] tracking-widest" style={{color}}>{kicker}</div>
        <h3 className="text-xl font-black tracking-wide leading-tight" style={{color:"var(--fr-fg)"}}>{title}</h3>
        <p className="pencil text-xs italic mt-0.5" style={{color:"var(--fr-fgMuted)"}}>{sub}</p>
      </div>
    </div>
  );
}

function EmptyState({icon:Icon,label,sub}:{icon:any;label:string;sub:string}) {
  return (
    <div className="rounded-sm steel-plate p-10 text-center" style={{borderColor:"var(--fr-borderSoft)"}}>
      <Icon size={34} className="mx-auto mb-2" style={{color:"var(--fr-fgDim)"}}/>
      <p className="mono text-[11px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>{label}</p>
      <p className="pencil text-[11px] italic mt-1" style={{color:"var(--fr-fgDim)"}}>{sub}</p>
    </div>
  );
}

function ScratchAdd({onAdd,projects,defaultProj}:{onAdd:(text:string,pid?:string)=>void;projects:any[];defaultProj?:string}) {
  const [text,setText] = useState(""); const [pid,setPid] = useState<string>(defaultProj||"");
  return (
    <div className="rounded-sm steel-plate p-3 relative" style={{borderColor:"#f59e0b55"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
        placeholder="// stream of consciousness. `---` draws a divider."
        className="w-full bg-transparent outline-none pencil text-sm resize-none"
        style={{color:"var(--fr-fg)"}}/>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <select value={pid} onChange={e=>setPid(e.target.value)}
          className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
          style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <option value="">unfiled</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
        </select>
        <div className="flex-1"/>
        <button onClick={()=>{if(!text.trim())return;onAdd(text.trim(),pid||undefined);setText("");}}
          className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm flex items-center gap-1"
          style={{background:"#f59e0b",color:"#000"}}><Plus size={11}/> LOG</button>
      </div>
    </div>
  );
}

function DecisionAdd({onAdd,projects,defaultProj}:{onAdd:(d:any)=>void;projects:any[];defaultProj?:string}) {
  const [decision,setDecision] = useState(""); const [alternatives,setAlt] = useState(""); const [why,setWhy] = useState("");
  const [approvals,setApprovals] = useState(""); const [date,setDate] = useState(today()); const [pid,setPid] = useState(defaultProj||"");
  return (
    <div className="rounded-sm steel-plate p-4 space-y-2 relative" style={{borderColor:"#06b6d455"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="mono text-[10px] tracking-widest mb-1" style={{color:"#06b6d4"}}>+ LOG DECISION</div>
      <input value={decision} onChange={e=>setDecision(e.target.value)} placeholder="The decision made"
        className="w-full bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
        style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      <div className="grid md:grid-cols-2 gap-2">
        <input value={alternatives} onChange={e=>setAlt(e.target.value)} placeholder="Alternatives rejected"
          className="w-full bg-transparent outline-none pencil text-xs px-2 py-1.5 rounded-sm italic"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <input value={why} onChange={e=>setWhy(e.target.value)} placeholder="Why this path"
          className="w-full bg-transparent outline-none pencil text-xs px-2 py-1.5 rounded-sm"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          className="bg-transparent outline-none mono text-[10px] px-2 py-1 rounded-sm"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <select value={pid} onChange={e=>setPid(e.target.value)}
          className="bg-transparent outline-none mono text-[10px] px-2 py-1 rounded-sm"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <option value="">global</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
        </select>
        <label className="flex items-center gap-1 mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>
          <input type="checkbox" checked={!!approvals} onChange={e=>setApprovals(e.target.checked?"ok":"")}/> Approved
        </label>
        <div className="flex-1"/>
        <button onClick={()=>{if(!decision.trim())return;onAdd({date,decision,alternatives,why,approvals:approvals||undefined,projectId:pid||undefined});setDecision("");setAlt("");setWhy("");}}
          className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
          style={{background:"#06b6d4",color:"#000"}}>STAMP</button>
      </div>
    </div>
  );
}

function SwotQuad({q,items,projectId,onAdd,onDel}:{q:{k:"S"|"W"|"O"|"T";label:string;color:string};items:any[];projectId?:string;onAdd:(t:string)=>void;onDel:(id:string)=>void}) {
  const [text,setText] = useState("");
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:`${q.color}55`}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="mono text-[11px] font-black tracking-widest mb-3" style={{color:q.color}}>{q.label}</div>
      <div className="space-y-1 mb-2">
        {items.map(it=>(
          <div key={it.id} className="pencil text-sm flex items-start gap-2 group">
            <span style={{color:q.color}}>▸</span>
            <span className="flex-1" style={{color:"var(--fr-fg)"}}>{it.text}</span>
            <button onClick={()=>onDel(it.id)} className="opacity-0 group-hover:opacity-100 text-[10px]" style={{color:"var(--fr-red)"}}>✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&text.trim()){onAdd(text.trim());setText("");}}}
          placeholder="+ add"
          className="flex-1 bg-transparent outline-none mono text-xs px-2 py-1 rounded-sm"
          style={{border:`1px dashed ${q.color}66`,color:"var(--fr-fg)"}}/>
      </div>
    </div>
  );
}

function WhyAdd({onAdd,projects,defaultProj}:{onAdd:(w:any)=>void;projects:any[];defaultProj?:string}) {
  const [problem,setProblem] = useState(""); const [pid,setPid] = useState(defaultProj||"");
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#ec489955"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#ec4899"}}>+ NEW 5-WHYS DRILL</div>
      <div className="flex gap-2 flex-wrap">
        <input value={problem} onChange={e=>setProblem(e.target.value)} placeholder="Problem statement"
          className="flex-1 bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm min-w-[200px]"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <select value={pid} onChange={e=>setPid(e.target.value)}
          className="bg-transparent outline-none mono text-[10px] px-2 py-1 rounded-sm"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <option value="">global</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
        </select>
        <button onClick={()=>{if(!problem.trim())return;onAdd({projectId:pid||undefined,problem,whys:["","","","",""]});setProblem("");}}
          className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
          style={{background:"#ec4899",color:"#000"}}>DRILL</button>
      </div>
    </div>
  );
}

function RetroAdd({onAdd}:{onAdd:(r:any)=>void}) {
  const [s,setS] = useState(""); const [st,setSt] = useState(""); const [c,setC] = useState("");
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#ef444455"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#ef4444"}}>+ NEW RETRO</div>
      <div className="grid md:grid-cols-3 gap-2">
        {([["start","START", "#22c55e", s, setS],["stop","STOP","#ef4444",st,setSt],["continue","CONTINUE","#06b6d4",c,setC]] as const).map(([k,lbl,col,val,setter]:any)=>(
          <textarea key={k} value={val} onChange={e=>setter(e.target.value)} rows={3}
            placeholder={`${lbl} (one per line)`}
            className="w-full bg-transparent outline-none pencil text-xs px-2 py-1.5 rounded-sm resize-none"
            style={{border:`1px solid ${col}55`,color:"var(--fr-fg)"}}/>
        ))}
      </div>
      <div className="flex justify-end mt-2">
        <button onClick={()=>{
          const start=s.split("\n").map(x=>x.trim()).filter(Boolean);
          const stop=st.split("\n").map(x=>x.trim()).filter(Boolean);
          const cont=c.split("\n").map(x=>x.trim()).filter(Boolean);
          if(!start.length&&!stop.length&&!cont.length)return;
          onAdd({date:today(),start,stop,continue:cont});
          setS("");setSt("");setC("");
        }} className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
          style={{background:"#ef4444",color:"#000"}}>STAMP RETRO</button>
      </div>
    </div>
  );
}

function ProsCons({side,color,items,onAdd,onDel,onWeight,projFilter}:{side:"pro"|"con";color:string;items:{id:string;text:string;weight:number}[];onAdd:(text:string,weight:number)=>void;onDel:(id:string)=>void;onWeight:(id:string,w:number)=>void;projFilter:string}) {
  const [text,setText] = useState(""); const [w,setW] = useState(3);
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:`${color}55`}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="mono text-[11px] font-black tracking-widest mb-3" style={{color}}>{side.toUpperCase()}S</div>
      <div className="flex gap-1 mb-2">
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&text.trim()){onAdd(text.trim(),w);setText("");}}}
          placeholder={`+ ${side}`}
          className="flex-1 bg-transparent outline-none pencil text-xs p-1.5 rounded-sm"
          style={{border:`1px dashed ${color}55`,color:"var(--fr-fg)"}}/>
        <select value={w} onChange={e=>setW(Number(e.target.value))}
          className="bg-transparent outline-none mono text-[10px] p-1 rounded-sm"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          {[1,2,3,4,5].map(n=><option key={n} value={n}>×{n}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        {items.map(it=>(
          <div key={it.id} className="flex items-center gap-2 p-1.5 rounded-sm text-xs"
            style={{background:"var(--fr-card2)",borderLeft:`3px solid ${color}`}}>
            <span className="mono text-[9px] font-black w-4" style={{color}}>×{it.weight}</span>
            <button onClick={()=>onWeight(it.id,Math.max(1,it.weight-1))} className="mono text-[9px] opacity-60 hover:opacity-100" style={{color:"var(--fr-fgMuted)"}}>−</button>
            <button onClick={()=>onWeight(it.id,Math.min(5,it.weight+1))} className="mono text-[9px] opacity-60 hover:opacity-100" style={{color:"var(--fr-fgMuted)"}}>+</button>
            <span className="pencil flex-1">{it.text}</span>
            <button onClick={()=>onDel(it.id)} style={{color:"var(--fr-red)"}}><Trash2 size={10}/></button>
          </div>
        ))}
        {items.length===0 && <div className="mono text-[10px] italic text-center py-4" style={{color:"var(--fr-fgDim)"}}>— list empty —</div>}
      </div>
    </div>
  );
}

function ScenarioAdd({projects,defaultProj,onAdd}:{projects:any[];defaultProj?:string;onAdd:(s:any)=>void}) {
  const [title,setTitle] = useState(""); const [trigger,setTrigger] = useState(""); const [response,setResponse] = useState(""); const [pid,setPid] = useState(defaultProj||"");
  return (
    <div className="space-y-2">
      <div className="mono text-[10px] tracking-widest font-black" style={{color:"#f59e0b"}}>+ FUTURE SCENARIO</div>
      <div className="grid md:grid-cols-2 gap-2">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title (e.g. Zero traction)"
          className="bg-transparent outline-none mono text-xs p-2 rounded-sm"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <select value={pid} onChange={e=>setPid(e.target.value)}
          className="bg-transparent outline-none mono text-[10px] p-2 rounded-sm"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <option value="">global</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
        </select>
      </div>
      <input value={trigger} onChange={e=>setTrigger(e.target.value)} placeholder="IF: trigger condition..."
        className="w-full bg-transparent outline-none pencil text-xs italic p-2 rounded-sm"
        style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      <textarea value={response} onChange={e=>setResponse(e.target.value)} rows={2} placeholder="THEN: response plan..."
        className="w-full bg-transparent outline-none pencil text-xs p-2 rounded-sm resize-none"
        style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      <button onClick={()=>{if(!title.trim()||!trigger.trim()||!response.trim())return;onAdd({title,trigger,response,projectId:pid||undefined});setTitle("");setTrigger("");setResponse("");}}
        className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
        style={{background:"#f59e0b",color:"#000"}}>STAMP SCENARIO</button>
    </div>
  );
}

function IdeasPanel({projects,defaultProj}:{projects:any[];defaultProj?:string}){
  const {forge,updateForge} = useStore();
  const [text,setText] = useState(""); const [pid,setPid] = useState(defaultProj||"");
  const [bucket,setBucket] = useState<"idea"|"worst"|"reverse"|"mood"|"kano">("idea");
  const [kanoCat,setKanoCat] = useState<"must"|"perf"|"delight"|"indiff"|"reverse">("perf");
  const ideas = forge.ideas.filter(i=>defaultProj?i.projectId===defaultProj:true).sort((a,b)=>b.createdAt-a.createdAt);
  const add = () => {
    if(!text.trim()) return;
    updateForge(f=>({ideas:[{id:uid(),text:text.trim(),projectId:pid||undefined,kind:bucket,kanoCat:bucket==="kano"?kanoCat:undefined,votes:0,bucket,createdAt:Date.now()},...f.ideas]}));
    setText("");
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#facc15",count:12}}));
  };
  const vote = (id:string,dir:1|-1)=>updateForge(f=>({ideas:f.ideas.map(x=>x.id===id?{...x,votes:(x.votes||0)+dir}:x)}));
  const colorFor = (k:string,c?:string) => k==="worst"?"#ef4444":k==="reverse"?"#a78bfa":k==="mood"?"#ec4899":k==="kano"?"#22c55e":"#facc15";
  const labelFor = (k:string,c?:string) => k==="worst"?"WORST":k==="reverse"?"REVERSE":k==="mood"?"MOOD":k==="kano"?`KANO·${(c||"perf").toUpperCase()}`:"IDEA";
  return (
    <>
      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#facc1555"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#facc15"}}>+ MOLTEN IDEA</div>
        <div className="flex gap-2 flex-wrap mb-2">
          {(["idea","worst","reverse","mood","kano"] as const).map(b=>(
            <button key={b} onClick={()=>setBucket(b)}
              className="mono text-[9px] tracking-widest px-2 py-1 rounded-sm font-black"
              style={{background:bucket===b?colorFor(b):"transparent",color:bucket===b?"#000":colorFor(b),border:`1px solid ${colorFor(b)}66`}}>
              {b==="idea"?"💡 NORMAL":b==="worst"?"💀 WORST":b==="reverse"?"🔄 REVERSE":b==="mood"?"🎨 MOOD":"✨ KANO"}
            </button>
          ))}
        </div>
        {bucket==="kano" && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {(["must","perf","delight","indiff","reverse"] as const).map(c=>(
              <button key={c} onClick={()=>setKanoCat(c)}
                className="mono text-[8px] tracking-widest px-1.5 py-0.5 rounded-sm"
                style={{background:kanoCat===c?"#22c55e":"transparent",color:kanoCat===c?"#000":"#22c55e",border:"1px solid #22c55e66"}}>
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={2}
          onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))add();}}
          placeholder={bucket==="worst"?"What's the worst possible way to do this?":bucket==="reverse"?"How would you achieve the OPPOSITE?":bucket==="mood"?"Vibe / aesthetic / feeling to capture…":bucket==="kano"?"A feature idea + how it delights…":"One idea per strike…"}
          className="w-full bg-transparent outline-none pencil text-sm p-2 rounded-sm resize-none"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <select value={pid} onChange={e=>setPid(e.target.value)}
            className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="">global</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
          </select>
          <button onClick={()=>{
            const trigger = document.getElementById("idea-random") as HTMLButtonElement|null;
            const WORDS = ["kaizen","forge","strike","anvil","ember","quench","spark","obsidian","hammer","molten","rivet","grain","copper","temper","crucible","blade","smelt","kiln","foundry"];
            setText(`What if we ${WORDS[Math.floor(Math.random()*WORDS.length)]} it with ${WORDS[Math.floor(Math.random()*WORDS.length)]}?`);
          }} id="idea-random"
            className="mono text-[10px] tracking-widest px-2 py-1 rounded-sm flex items-center gap-1"
            style={{border:"1px dashed #a78bfa66",color:"#a78bfa"}}><Shuffle size={10}/> RANDOM SEED</button>
          <div className="flex-1"/>
          <button onClick={add}
            className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm flex items-center gap-1"
            style={{background:"#facc15",color:"#000"}}><Sparkles size={11}/> STRIKE</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {ideas.map(i=>(
          <div key={i.id} className="p-3 rounded-sm steel-plate relative" style={{borderColor:`${colorFor(i.kind,i.kanoCat)}55`}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <div className="flex items-center gap-2 mb-1">
              <span className="mono text-[8px] tracking-widest font-black px-1.5 py-0.5 rounded-sm"
                style={{background:`${colorFor(i.kind,i.kanoCat)}22`,color:colorFor(i.kind,i.kanoCat),border:`1px solid ${colorFor(i.kind,i.kanoCat)}55`}}>
                {labelFor(i.kind,i.kanoCat)}
              </span>
              <span className="mono text-[8px] ml-auto flex items-center gap-1" style={{color:"var(--fr-fgMuted)"}}>
                <button onClick={()=>vote(i.id,1)} style={{color:"var(--fr-green)"}}><ThumbsUp size={9}/></button>
                {(i.votes||0)}
                <button onClick={()=>vote(i.id,-1)} style={{color:"var(--fr-red)"}}><ThumbsDown size={9}/></button>
                <button onClick={()=>updateForge(f=>({ideas:f.ideas.filter(x=>x.id!==i.id)}))} style={{color:"var(--fr-red)"}}><Trash2 size={9}/></button>
              </span>
            </div>
            <p className="pencil text-sm" style={{color:"var(--fr-fg)"}}>{i.text}</p>
          </div>
        ))}
        {ideas.length===0 && <div className="md:col-span-2 mono text-[11px] italic text-center py-8" style={{color:"var(--fr-fgDim)"}}>No ideas smelted yet. Diverge first, converge later.</div>}
      </div>
    </>
  );
}

function PersonasPanel({projects,defaultProj}:{projects:any[];defaultProj?:string}){
  const {forge,updateForge} = useStore();
  const list = forge.personas.filter(p=>defaultProj?p.projectId===defaultProj:true);
  const [draft,setDraft] = useState({name:"",role:"",goal:"",pain:"",pid:defaultProj||""});
  const add = () => {
    if(!draft.name.trim()) return;
    updateForge(f=>({personas:[{id:uid(),name:draft.name,role:draft.role,goal:draft.goal,pain:draft.pain,projectId:draft.pid||undefined},...f.personas]}));
    setDraft({name:"",role:"",goal:"",pain:"",pid:draft.pid});
  };
  return (
    <>
      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#ec489955"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#ec4899"}}>+ FORGE PERSONA</div>
        <div className="grid md:grid-cols-2 gap-2">
          <input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Name (e.g. Tired Tina)"
            className="bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <input value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})} placeholder="Role / job-to-be-done"
            className="bg-transparent outline-none pencil text-xs px-2 py-1.5 rounded-sm italic"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <input value={draft.goal} onChange={e=>setDraft({...draft,goal:e.target.value})} placeholder="Goal"
            className="bg-transparent outline-none pencil text-xs px-2 py-1.5 rounded-sm md:col-span-1"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <input value={draft.pain} onChange={e=>setDraft({...draft,pain:e.target.value})} placeholder="Biggest pain"
            className="bg-transparent outline-none pencil text-xs px-2 py-1.5 rounded-sm md:col-span-1"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <select value={draft.pid} onChange={e=>setDraft({...draft,pid:e.target.value})}
            className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="">global</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
          </select>
          <button onClick={add} className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm ml-auto"
            style={{background:"#ec4899",color:"#000"}}>FORGE</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {list.map(p=>{
          const proj = projects.find(x=>x.id===p.projectId);
          return (
            <div key={p.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#ec489944"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{background:"rgba(236,72,153,0.15)",border:"1.5px solid #ec489955"}}>👤</div>
                <div className="flex-1">
                  <div className="font-black text-lg">{p.name||"Unnamed"}</div>
                  <div className="mono text-[9px] tracking-widest" style={{color:proj?.color||"#ec4899"}}>{proj?`${proj.icon} ${proj.codename} · `:""}{p.role||"no role"}</div>
                </div>
                <button onClick={()=>updateForge(f=>({personas:f.personas.filter(x=>x.id!==p.id)}))} style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 mono text-[10px]">
                <div>
                  <div style={{color:"#22c55e"}}>WANTS</div>
                  <p className="pencil text-xs mt-1" style={{color:"var(--fr-fg)"}}>{p.goal||"—"}</p>
                </div>
                <div>
                  <div style={{color:"#ef4444"}}>PAIN</div>
                  <p className="pencil text-xs mt-1" style={{color:"var(--fr-fg)"}}>{p.pain||"—"}</p>
                </div>
              </div>
            </div>
          );
        })}
        {list.length===0 && <div className="md:col-span-2 mono text-[11px] italic text-center py-8" style={{color:"var(--fr-fgDim)"}}>No personas forged. Who are you building for?</div>}
      </div>
    </>
  );
}

function DecisionMatrixPanel({projects,defaultProj}:{projects:any[];defaultProj?:string}){
  const {forge,updateForge} = useStore();
  const list = forge.decisionMatrix.filter(d=>defaultProj?d.projectId===defaultProj:true);
  const [title,setTitle] = useState(""); const [crit,setCrit] = useState(""); const [pid,setPid] = useState(defaultProj||"");
  const [activeId,setActiveId] = useState<string|null>(null);
  const add = () => {
    if(!title.trim()) return;
    const row:DecisionMatrixRow = {id:uid(),title,projectId:pid||undefined,criteria:[]};
    updateForge(f=>({decisionMatrix:[row,...f.decisionMatrix]}));
    setTitle(""); setActiveId(row.id);
  };
  const addCrit = (id:string) => {
    if(!crit.trim()) return;
    updateForge(f=>({decisionMatrix:f.decisionMatrix.map(d=>d.id===id?{...d,criteria:[...d.criteria,{label:crit,weight:3,score:0}]}:d)}));
    setCrit("");
  };
  return (
    <>
      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#a78bfa55"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#a78bfa"}}>+ DECISION MATRIX</div>
        <div className="flex gap-2 flex-wrap">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Decision title (e.g. Pick framework)"
            className="flex-1 bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <select value={pid} onChange={e=>setPid(e.target.value)}
            className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="">global</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
          </select>
          <button onClick={add} className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
            style={{background:"#a78bfa",color:"#000"}}>ADD</button>
        </div>
      </div>
      <div className="space-y-3">
        {list.map(d=>{
          const total = d.criteria.reduce((n,c)=>n+c.weight*c.score,0);
          const max = d.criteria.reduce((n,c)=>n+c.weight*10,0)||1;
          return (
            <div key={d.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#a78bfa44"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-black text-lg">{d.title}</h4>
                <div className="flex items-center gap-2 mono text-[10px]">
                  <span style={{color:"#a78bfa"}}>SCORE: {total}</span>
                  <button onClick={()=>updateForge(f=>({decisionMatrix:f.decisionMatrix.filter(x=>x.id!==d.id)}))} style={{color:"var(--fr-red)"}}><Trash2 size={10}/></button>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{background:"var(--fr-borderSoft)"}}>
                <div className="h-full" style={{width:`${total/max*100}%`,background:"#a78bfa",boxShadow:"0 0 6px #a78bfa"}}/>
              </div>
              <div className="mt-3 space-y-1.5">
                {d.criteria.map((c,i)=>(
                  <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 mono text-[10px]">
                    <input value={c.label} onChange={e=>updateForge(f=>({decisionMatrix:f.decisionMatrix.map(x=>x.id===d.id?{...x,criteria:x.criteria.map((y,j)=>j===i?{...y,label:e.target.value}:y)}:x)}))}
                      className="bg-transparent outline-none pencil text-xs" style={{color:"var(--fr-fg)"}}/>
                    <span style={{color:"var(--fr-fgMuted)"}}>W{c.weight}</span>
                    <input type="range" min={1} max={5} value={c.weight} onChange={e=>updateForge(f=>({decisionMatrix:f.decisionMatrix.map(x=>x.id===d.id?{...x,criteria:x.criteria.map((y,j)=>j===i?{...y,weight:Number(e.target.value)}:y)}:x)}))}
                      style={{accentColor:"#a78bfa"}} className="w-16"/>
                    <span style={{color:"var(--fr-fgMuted)"}}>S{c.score}</span>
                    <input type="range" min={0} max={10} value={c.score} onChange={e=>updateForge(f=>({decisionMatrix:f.decisionMatrix.map(x=>x.id===d.id?{...x,criteria:x.criteria.map((y,j)=>j===i?{...y,score:Number(e.target.value)}:y)}:x)}))}
                      style={{accentColor:"#22c55e"}} className="w-20"/>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <input value={activeId===d.id?crit:""} onChange={e=>{setCrit(e.target.value);setActiveId(d.id);}}
                  onKeyDown={e=>{if(e.key==="Enter"){addCrit(d.id);}}}
                  placeholder="+ criteria"
                  className="flex-1 bg-transparent outline-none mono text-[10px] px-2 py-1 rounded-sm"
                  style={{border:"1px dashed #a78bfa66",color:"var(--fr-fg)"}}/>
                <button onClick={()=>addCrit(d.id)} className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm"
                  style={{background:"#a78bfa",color:"#000"}}>+CRIT</button>
              </div>
            </div>
          );
        })}
        {list.length===0 && <div className="mono text-[11px] italic text-center py-8" style={{color:"var(--fr-fgDim)"}}>No matrices yet. When two choices look equal, weight criteria.</div>}
      </div>
    </>
  );
}

function SmelterTimer(){
  const [secs,setSecs] = useState(0); const [running,setRunning] = useState(false);
  useEffect(()=>{
    if(!running) return;
    const id = setInterval(()=>setSecs(s=>s+1),1000);
    return ()=>clearInterval(id);
  },[running]);
  const mm = String(Math.floor(secs/60)).padStart(2,"0");
  const ss = String(secs%60).padStart(2,"0");
  return (
    <div className="flex items-center gap-2 mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>
      <TimerIcon size={11}/>
      <button onClick={()=>setRunning(r=>!r)} className="mono text-[10px] font-black tracking-widest px-2 py-0.5 rounded-sm"
        style={{background:running?"var(--fr-red)":"var(--fr-green)",color:"#000"}}>{running?"STOP":"GO"}</button>
      <span>{mm}:{ss}</span>
      <button onClick={()=>{setSecs(0);setRunning(false);}} className="opacity-60">reset</button>
    </div>
  );
}

function FishbonePanel({projects,defaultProj}:{projects:any[];defaultProj?:string}){
  const {forge,updateForge} = useStore();
  const list = forge.fishbones.filter(f=>defaultProj?f.projectId===defaultProj:true);
  const [problem,setProblem] = useState(""); const [pid,setPid] = useState(defaultProj||"");
  const BONES = ["People","Process","Tools","Materials","Environment","Measurement"];
  const add = () => {
    if(!problem.trim()) return;
    const fb: Fishbone = {id:uid(),problem,projectId:pid||undefined,categories:BONES.map(n=>({name:n,causes:[]}))};
    updateForge(f=>({fishbones:[fb,...f.fishbones]}));
    setProblem("");
  };
  return (
    <>
      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#fb923c55"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#fb923c"}}>+ FISHBONE / ISHIKAWA</div>
        <div className="flex gap-2 flex-wrap">
          <input value={problem} onChange={e=>setProblem(e.target.value)} placeholder="Problem/effect to diagnose"
            className="flex-1 bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <select value={pid} onChange={e=>setPid(e.target.value)}
            className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="">global</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
          </select>
          <button onClick={add} className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
            style={{background:"#fb923c",color:"#000"}}>FORGE BONES</button>
        </div>
      </div>
      <div className="space-y-3">
        {list.map(f=>{
          const proj = projects.find(x=>x.id===f.projectId);
          return (
            <div key={f.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#fb923c44"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-center gap-2 mb-2">
                <Brain size={13} style={{color:"#fb923c"}}/>
                <h4 className="font-black text-base flex-1">{f.problem}</h4>
                {proj && <span className="mono text-[9px] tracking-widest" style={{color:proj.color}}>{proj.icon} {proj.codename}</span>}
                <button onClick={()=>updateForge(ff=>({fishbones:ff.fishbones.filter(x=>x.id!==f.id)}))} style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {f.categories.map((cat,ci)=>{
                  const COLORS = ["#ef4444","#f59e0b","#22c55e","#06b6d4","#a78bfa","#ec4899"];
                  const c = COLORS[ci%COLORS.length];
                  return (
                    <div key={ci} className="p-2 rounded-sm" style={{background:"var(--fr-card2)",borderLeft:`3px solid ${c}`}}>
                      <div className="mono text-[10px] tracking-widest font-black" style={{color:c}}>{cat.name.toUpperCase()} ({cat.causes.length})</div>
                      <ul className="mt-1 space-y-0.5">
                        {cat.causes.map((cc,i)=>(
                          <li key={i} className="pencil text-xs flex gap-2 group">
                            <span>▸</span><span className="flex-1">{cc}</span>
                            <button onClick={()=>updateForge(ff=>({fishbones:ff.fishbones.map(x=>x.id===f.id?{...x,categories:x.categories.map((y,j)=>j===ci?{...y,causes:y.causes.filter((_,k)=>k!==i)}:y)}:x)}))}
                              className="opacity-0 group-hover:opacity-100 text-[9px]" style={{color:"var(--fr-red)"}}>✕</button>
                          </li>
                        ))}
                      </ul>
                      <input placeholder="+ cause" className="w-full bg-transparent outline-none mono text-[10px] mt-1 px-1 py-0.5 rounded-sm"
                        style={{border:`1px dashed ${c}55`,color:"var(--fr-fg)"}}
                        onKeyDown={e=>{
                          if(e.key==="Enter"&&(e.target as HTMLInputElement).value.trim()){
                            const v = (e.target as HTMLInputElement).value.trim();
                            updateForge(ff=>({fishbones:ff.fishbones.map(x=>x.id===f.id?{...x,categories:x.categories.map((y,j)=>j===ci?{...y,causes:[...y.causes,v]}:y)}:x)}));
                            (e.target as HTMLInputElement).value="";
                          }
                        }}/>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {list.length===0 && <div className="mono text-[11px] italic text-center py-8" style={{color:"var(--fr-fgDim)"}}>No fishbones. When something breaks, draw the skeleton.</div>}
      </div>
    </>
  );
}

function SixHatsPanel({projects,defaultProj}:{projects:any[];defaultProj?:string}){
  const {forge,updateForge} = useStore();
  const list = forge.sixHats.filter(s=>defaultProj?s.projectId===defaultProj:true);
  const [topic,setTopic] = useState(""); const [pid,setPid] = useState(defaultProj||"");
  const HATS:{k:keyof Omit<SixHats,"id"|"projectId"|"topic"|"date">;label:string;color:string;icon:string}[] = [
    {k:"white",label:"FACTS",color:"#f1f5f9",icon:"◻"},
    {k:"red",label:"FEELINGS",color:"#ef4444",icon:"♥"},
    {k:"black",label:"RISKS",color:"#1f2937",icon:"■"},
    {k:"yellow",label:"BENEFITS",color:"#facc15",icon:"★"},
    {k:"green",label:"CREATIVITY",color:"#22c55e",icon:"✦"},
    {k:"blue",label:"PROCESS",color:"#3b82f6",icon:"◎"},
  ];
  const add = () => {
    if(!topic.trim()) return;
    const s:SixHats = {id:uid(),topic,projectId:pid||undefined,date:today(),white:"",red:"",black:"",yellow:"",green:"",blue:""};
    updateForge(f=>({sixHats:[s,...f.sixHats]}));
    setTopic("");
  };
  return (
    <>
      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#22d3ee55"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#22d3ee"}}>+ SIX THINKING HATS (de Bono)</div>
        <div className="flex gap-2 flex-wrap">
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic/decision to think through"
            className="flex-1 bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <select value={pid} onChange={e=>setPid(e.target.value)}
            className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="">global</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
          </select>
          <button onClick={add} className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
            style={{background:"#22d3ee",color:"#000"}}>DON HATS</button>
        </div>
      </div>
      <div className="space-y-3">
        {list.map(s=>{
          const proj = projects.find(x=>x.id===s.projectId);
          return (
            <div key={s.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#22d3ee44"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Palette size={13} style={{color:"#22d3ee"}}/>
                <h4 className="font-black text-base flex-1">{s.topic}</h4>
                <span className="mono text-[9px]" style={{color:"var(--fr-fgMuted)"}}>{s.date}</span>
                {proj && <span className="mono text-[9px] tracking-widest" style={{color:proj.color}}>{proj.icon} {proj.codename}</span>}
                <button onClick={()=>updateForge(ff=>({sixHats:ff.sixHats.filter(x=>x.id!==s.id)}))} style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {HATS.map(h=>(
                  <div key={h.k} className="p-2 rounded-sm" style={{background:"var(--fr-card2)",borderTop:`3px solid ${h.color}`}}>
                    <div className="mono text-[10px] tracking-widest font-black flex items-center gap-1" style={{color:(h.color==="#f1f5f9"||h.color==="#1f2937")?"var(--fr-fg)":h.color}}>
                      <span>{h.icon}</span>{h.label}
                    </div>
                    <textarea value={(s as any)[h.k]} onChange={e=>updateForge(ff=>({sixHats:ff.sixHats.map(x=>x.id===s.id?{...x,[h.k]:e.target.value}:x)}))}
                      rows={2} placeholder={`${h.label.toLowerCase()}...`}
                      className="w-full bg-transparent outline-none pencil text-xs mt-1 resize-none"
                      style={{color:"var(--fr-fg)"}}/>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {list.length===0 && <div className="mono text-[11px] italic text-center py-8" style={{color:"var(--fr-fgDim)"}}>No hats yet. Think deeply, one color at a time.</div>}
      </div>
    </>
  );
}


function ScamperPanel({projects,defaultProj}:{projects:any[];defaultProj?:string}){
  const {forge,updateForge} = useStore();
  const list = forge.scamper.filter(s=>defaultProj?s.projectId===defaultProj:true);
  const [topic,setTopic] = useState(""); const [pid,setPid] = useState(defaultProj||"");
  const PROMPTS:{k:keyof Omit<Scamper,"id"|"projectId"|"topic"|"date">;label:string;color:string;prompt:string}[] = [
    {k:"substitute",label:"SUBSTITUTE",color:"#ef4444",prompt:"What can be swapped? Materials? People? Process?"},
    {k:"combine",label:"COMBINE",color:"#f59e0b",prompt:"Merge with another idea, product, or process?"},
    {k:"adapt",label:"ADAPT",color:"#22c55e",prompt:"What else is like this? What can we copy or adjust?"},
    {k:"modify",label:"MODIFY",color:"#06b6d4",prompt:"Magnify? Minify? Change shape, color, sound, meaning?"},
    {k:"put",label:"PUT TO OTHER USE",color:"#a78bfa",prompt:"New contexts? New users? Waste used for something?"},
    {k:"eliminate",label:"ELIMINATE",color:"#ec4899",prompt:"What to remove? Simplify? Understate?"},
    {k:"reverse",label:"REARRANGE/REVERSE",color:"#facc15",prompt:"Reverse order? Flip roles? Turn upside-down?"},
  ];
  const add = () => {
    if(!topic.trim()) return;
    const s: Scamper = {id:uid(),topic,projectId:pid||undefined,date:today(),substitute:"",combine:"",adapt:"",modify:"",put:"",eliminate:"",reverse:""};
    updateForge(f=>({scamper:[s,...f.scamper]}));
    setTopic("");
  };
  return (
    <>
      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#f472b655"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest mb-2" style={{color:"#f472b6"}}>+ SCAMPER · SUBSTITUTE · COMBINE · ADAPT · MODIFY · PUT · ELIMINATE · REARRANGE</div>
        <div className="flex gap-2 flex-wrap">
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Product/idea to SCAMPER"
            className="flex-1 bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm min-w-[200px]"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
          <select value={pid} onChange={e=>setPid(e.target.value)}
            className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="">global</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
          </select>
          <button onClick={add} className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
            style={{background:"#f472b6",color:"#000"}}>SCAMPER</button>
        </div>
      </div>
      <div className="space-y-3">
        {list.map(s=>{
          const proj = projects.find(x=>x.id===s.projectId);
          return (
            <div key={s.id} className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#f472b644"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Shapes size={13} style={{color:"#f472b6"}}/>
                <h4 className="font-black text-base flex-1">{s.topic}</h4>
                <span className="mono text-[9px]" style={{color:"var(--fr-fgMuted)"}}>{s.date}</span>
                {proj && <span className="mono text-[9px] tracking-widest" style={{color:proj.color}}>{proj.icon} {proj.codename}</span>}
                <button onClick={()=>updateForge(ff=>({scamper:ff.scamper.filter(x=>x.id!==s.id)}))} style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {PROMPTS.map(p=>(
                  <div key={p.k} className="p-2 rounded-sm" style={{background:"var(--fr-card2)",borderLeft:`3px solid ${p.color}`}}>
                    <div className="mono text-[10px] tracking-widest font-black flex items-center gap-1" style={{color:p.color}}>{p.label}</div>
                    <div className="pencil text-[10px] italic" style={{color:"var(--fr-fgMuted)"}}>{p.prompt}</div>
                    <textarea value={(s as any)[p.k]} onChange={e=>updateForge(ff=>({scamper:ff.scamper.map(x=>x.id===s.id?{...x,[p.k]:e.target.value}:x)}))}
                      rows={2} placeholder="..."
                      className="w-full bg-transparent outline-none pencil text-xs mt-1 resize-none"
                      style={{color:"var(--fr-fg)"}}/>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {list.length===0 && <div className="mono text-[11px] italic text-center py-8" style={{color:"var(--fr-fgDim)"}}>No SCAMPERs yet. The 7 prompts turn one idea into seven.</div>}
      </div>
    </>
  );
}

function SprintBurndown({sprint,tasks}:{sprint:Sprint;tasks:ProjectTask[]}){
  // Compute per-day cumulative completions from startDate through today (or endDate if closed)
  const start = new Date(sprint.startDate+"T00:00:00").getTime();
  const end = new Date(sprint.endDate+"T00:00:00").getTime();
  const total = Math.max(1, tasks.length);
  const days = Math.max(1, Math.round((end-start)/86400000)+1);
  const today = new Date(new Date().toISOString().slice(0,10)+"T00:00:00").getTime();
  const lastDay = sprint.status==="closed" ? end : Math.min(end, today);
  const visibleDays = Math.max(1, Math.round((lastDay-start)/86400000)+1);

  // Cumulative done per day
  const completionsByDay: Record<string,number> = {};
  tasks.forEach(t=>{
    if(t.status==="done" && t.completedAt){
      const d = t.completedAt;
      if(new Date(d+"T00:00:00").getTime()>=start && new Date(d+"T00:00:00").getTime()<=end){
        completionsByDay[d] = (completionsByDay[d]||0)+1;
      }
    }
  });
  let cum = 0;
  const points: {x:number;y:number;done:number}[] = [];
  for (let i=0;i<visibleDays;i++){
    const iso = new Date(start+i*86400000).toISOString().slice(0,10);
    cum += completionsByDay[iso]||0;
    points.push({x:i, y: cum/total, done: cum});
  }
  const W=260, H=62, pad=6;
  const xScale = (i:number) => pad + (i/(days-1))*(W-2*pad);
  const yScale = (v:number) => H-pad - v*(H-2*pad);
  const actual = points.map((p,i)=>`${i===0?"M":"L"}${xScale(p.x)},${yScale(p.y)}`).join(" ");
  const ideal = `M${xScale(0)},${yScale(0)} L${xScale(days-1)},${yScale(1)}`;
  return (
    <div className="mt-3 relative">
      <svg width="100%" viewBox={`0 0 ${W} ${H+10}`} className="overflow-visible">
        {/* grid */}
        {[0,0.25,0.5,0.75,1].map(v=>(
          <line key={v} x1={pad} x2={W-pad} y1={yScale(v)} y2={yScale(v)} stroke="var(--fr-borderSoft)" strokeDasharray="2 3" strokeWidth={0.8}/>
        ))}
        {/* ideal */}
        <path d={ideal} stroke="var(--fr-red)" strokeWidth={1.2} fill="none" opacity={0.6} strokeDasharray="3 3"/>
        {/* actual */}
        <path d={actual} stroke="var(--fr-green)" strokeWidth={2} fill="none"
          style={{filter:"drop-shadow(0 0 3px rgba(34,197,94,0.7))"}}/>
        {points.map((p,i)=>(
          <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={2} fill="var(--fr-green)"/>
        ))}
        {/* today marker */}
        {sprint.status==="active" && visibleDays>1 && visibleDays<days && (
          <line x1={xScale(visibleDays-1)} x2={xScale(visibleDays-1)} y1={pad} y2={H-pad}
            stroke="var(--fr-amber)" strokeWidth={1} strokeDasharray="2 2"/>
        )}
        {/* labels */}
        <text x={pad} y={H+8} fontSize={8} fill="var(--fr-fgMuted)" fontFamily="monospace">{sprint.startDate.slice(5)}</text>
        <text x={W-pad} y={H+8} fontSize={8} fill="var(--fr-fgMuted)" textAnchor="end" fontFamily="monospace">{sprint.endDate.slice(5)}</text>
      </svg>
      <div className="flex items-center gap-3 mono text-[9px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>
        <span className="flex items-center gap-1"><span style={{width:12,height:2,background:"var(--fr-green)"}}/>actual</span>
        <span className="flex items-center gap-1"><span style={{width:12,height:0,borderTop:"1.5px dashed var(--fr-red)"}}/>ideal</span>
        <span className="flex items-center gap-1"><span style={{width:2,height:10,background:"var(--fr-amber)"}}/>today</span>
      </div>
    </div>
  );
}
