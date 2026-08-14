"use client";
/**
 * FoundrySection — /projects dashboard.
 *   - Furnace header with total heat metric
 *   - Active project grid w/ health traffic light, progress, next task
 *   - "Anvil Today" panel (today's tasks)
 *   - Cold stock (at-risk / cold projects)
 *   - Quick stats: on-track / blocked / dead / shipped / total hrs
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Hammer, Plus, AlertTriangle, CheckCircle2, XCircle, CircleDot,
  Clock, Zap, Skull, Archive, TrendingUp, Target, Activity, BarChart3, X,
  Smile, Frown, Meh, Calendar as CalendarIcon, FlameKindling, Printer,
  ClipboardCheck,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { ForgeProject, ProjectTask } from "../../../lib/forgeTypes";
import { FORGE_NAV } from "../ForgeShell";
import { daysAgo, daysFrom, todayISO, daysBetween, addDays } from "../forgeUtils";
import { useState as useStateHook } from "react";
import { isDoneStatus as isTaskDone, effectiveCols } from "../forgeUtils";

/** Curried helper — task done-check honouring custom columns. */
const taskShipped = (customStatuses?: any[] | null) => (s: string | undefined | null) =>
  isTaskDone(s, customStatuses);

const HEALTH: Record<ForgeProject["status"], { label: string; color: string; Icon: any; ring: string }> = {
  "on-track":  { label: "ON TRACK",  color: "#22c55e", Icon: CheckCircle2,  ring: "rgba(34,197,94,0.4)" },
  "blocked":   { label: "BLOCKED",   color: "#f59e0b", Icon: AlertTriangle, ring: "rgba(245,158,11,0.4)" },
  "off-track": { label: "OFF TRACK", color: "#ef4444", Icon: XCircle,       ring: "rgba(239,68,68,0.4)" },
  "paused":    { label: "PAUSED",    color: "#94a3b8", Icon: CircleDot,    ring: "rgba(148,163,184,0.4)" },
  "done":      { label: "SHIPPED",   color: "#22c55e", Icon: CheckCircle2, ring: "rgba(34,197,94,0.4)" },
  "dead":      { label: "DEAD",      color: "#7f1d1d", Icon: Skull,         ring: "rgba(127,29,29,0.3)" },
};

const uid = () => Math.random().toString(36).slice(2,10);

export default function FoundrySection() {
  const { forge, updateForge, seedForgeDemo, logForgeAction } = useStore();
  const { theme } = useTheme();
  const light = theme === "light";
  const [showForge, setShowForge] = useState(false);
  const [draft, setDraft] = useState({ title: "", codename: "", color: "#f59e0b", icon: "🔥" });

  /** Task-level "is done" respecting custom columns. */
  const isTaskShipped = (s: string | undefined | null) => isTaskDone(s, forge.customStatuses);
  const taskCols = effectiveCols(forge.customStatuses);
  const taskShippedId = taskCols[taskCols.length - 1]?.id || "done";

  // Project-level statuses are a fixed enum (done = shipped) — different from task columns.
  const active = forge.projects.filter(p => !p.archived && p.status !== "dead" && p.status !== "done");
  const cold = forge.projects.filter(p => p.status === "off-track" || p.status === "blocked" || p.status === "paused");
  const shipped = forge.projects.filter(p => p.status === "done" || p.archived);
  const totalHours = forge.tasks.reduce((n,t) => n+(t.actualMins||0),0) / 60;
  const onTrack = active.filter(p => p.status === "on-track").length;
  const blocked = forge.projects.filter(p => p.status === "blocked" || p.status === "off-track").length;

  const todayTasks = forge.tasks.filter(t => t.today && !isTaskShipped(t.status))
    .sort((a,b) => (b.priority < a.priority ? 1 : -1));

  const progressOf = (p: ForgeProject) => {
    const ms = p.milestones;
    if (!ms.length) return 0;
    return Math.round((ms.filter(m=>m.done).length / ms.length) * 100);
  };
  const nextTask = (p: ForgeProject): ProjectTask | undefined =>
    forge.tasks.find(t => t.projectId === p.id && !isTaskShipped(t.status));

  const submitForge = () => {
    if (!draft.title.trim()) return;
    const id = "p-" + uid();
    const today = new Date().toISOString().slice(0,10);
    const T = TEMPLATES.find(x=>x.id===tpl) || TEMPLATES[0];
    const milestones = T.sections.hasMilestones
      ? [{id:uid(),title:"Kickoff",date:today,done:true},{id:uid(),title:"MVP",date:"",done:false},{id:uid(),title:"Ship",date:"",done:false}]
      : [];
    const premortem = T.sections.hasPremortem
      ? [{id:uid(),failure:"Scope creep kills the deadline",mitigation:"Cut features ruthlessly; weekly cut list",likelihood:"med" as const}]
      : [];
    const risks = T.sections.hasRisks
      ? [{id:uid(),description:"Timeline slips",probability:"med" as const,impact:"med" as const,mitigation:"Weekly ship cadence, WIP limits",contingency:"Cut scope to core loop",status:"open" as const}]
      : [];
    const qualityChecks = T.sections.hasQualityChecks
      ? [{id:uid(),label:"tsc --noEmit clean",category:"standards" as const,done:false},
         {id:uid(),label:"Dogfood for 1 day",category:"review" as const,done:false}]
      : [];
    updateForge(f => ({
      projects: [{
        id, codename: draft.codename.trim() || `${T.id.toUpperCase().slice(0,5)}-${String(f.projects.length+1).padStart(2,"0")}`,
        title: draft.title.trim(), brief:"", why:"", successMetrics:"", rejectionCriteria:"",
        status: "on-track", priority: 5, energyDemand: 5, complexity: 5,
        color: draft.color, icon: draft.icon,
        createdAt: today, archived: false, checkinFreq:"weekly",
        budget:{actual:0,currency:"$"},
        stakeholders:[],milestones,premortem,risks,issues:[],qualityChecks,
        comms:[],scope:"",tags:[],links:[],velocityPoints:[],
      },...f.projects],
    }));
    logForgeAction("project.lit", id, draft.title.trim());
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:draft.color,count:40}}));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"NEW HEAT",sub:draft.title,color:draft.color,icon:"zap"}}));
    setShowForge(false);
    setDraft({title:"",codename:"",color:"#f59e0b",icon:"🔥"});
  };

  const COLORS = ["#f59e0b","#ea580c","#ef4444","#06b6d4","#22c55e","#a78bfa","#ec4899","#facc15"];
  const ICONS = ["🔥","⚒️","⚡","🧪","📖","💨","🏗️","🎯","🧱","🪓","🛠️","⚙️"];

  const TEMPLATES = [
    { id:"blank",    name:"BLANK",        icon:"🔥", color:"#f59e0b", sections:{hasMilestones:false,hasPremortem:false,hasRisks:false,hasStakeholders:false,hasQualityChecks:false}, blurb:"Start from zero." },
    { id:"saas",     name:"SAAS LAUNCH",  icon:"🚀", color:"#06b6d4", sections:{hasMilestones:true,hasPremortem:true,hasRisks:true,hasStakeholders:true,hasQualityChecks:true}, blurb:"MVP → launch: risks, QA, stakeholders." },
    { id:"content",  name:"CONTENT DROP", icon:"📝", color:"#ec4899", sections:{hasMilestones:true,hasPremortem:false,hasRisks:false,hasStakeholders:false,hasQualityChecks:true}, blurb:"Blog/newsletter/episode." },
    { id:"research", name:"RESEARCH",     icon:"🧪", color:"#a78bfa", sections:{hasMilestones:true,hasPremortem:true,hasRisks:true,hasStakeholders:true,hasQualityChecks:false}, blurb:"Experiments, premortems, stakeholders." },
    { id:"build",    name:"BUILD / HW",   icon:"🏗️", color:"#ea580c", sections:{hasMilestones:true,hasPremortem:true,hasRisks:true,hasStakeholders:true,hasQualityChecks:true}, blurb:"Hardware/construction: risk-heavy." },
  ];
  const [tpl,setTpl] = useState<string>("blank");
  const applyTemplate = (id:string) => {
    const t = TEMPLATES.find(x=>x.id===id); if(!t) return;
    setDraft(d=>({...d, icon:t.icon, color:t.color}));
    setTpl(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-wider flex items-center gap-2">
            <Flame size={26} style={{color:"var(--fr-amber)"}}/> the.foundry
          </h2>
          <p className="mono text-[11px] tracking-widest mt-1 italic" style={{color:"var(--fr-fgMuted)"}}>
            // strike while the iron is hot — active heats on the anvil
          </p>
        </div>
        <button onClick={()=>setShowForge(v=>!v)}
          className="relative px-4 py-2.5 rounded-sm steel-plate text-[11px] font-black tracking-[0.25em] flex items-center gap-2"
          style={{background:"var(--fr-amber)",color:"#000",borderColor:"var(--fr-amber)",
            boxShadow:"0 10px 30px -12px var(--fr-amber)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <Plus size={14}/> LIGHT FORGE
        </button>
      </div>

      {/* Daily forge pulse */}
      <ForgePulse/>

      {/* Velocity + burndown plate */}
      <VelocityPlate projects={forge.projects} tasks={forge.tasks}/>

      {/* Forge calendar (14-day heat map of dues + completions) */}
      <ForgeCalendar projects={forge.projects} tasks={forge.tasks} streak={forge.streak}/>

      {/* Streak heat strip */}
      <StreakStrip streak={forge.streak}/>

      {/* Quick actions row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={()=>window.print()}
          className="relative rounded-sm steel-plate p-3 flex items-center gap-2 text-[10px] font-black tracking-widest"
          style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <Printer size={12} style={{color:"var(--fr-steel)"}}/> PRINT FORGE
        </button>
        <Link href="/projects/smelter" className="block">
          <div className="relative rounded-sm steel-plate p-3 flex items-center gap-2 text-[10px] font-black tracking-widest"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <FlameKindling size={12} style={{color:"var(--fr-red)"}}/> SMELTER / SPRINTS
          </div>
        </Link>
        <WeeklyReviewLauncher/>
        <Link href="/projects/quarry" className="block">
          <div className="relative rounded-sm steel-plate p-3 flex items-center gap-2 text-[10px] font-black tracking-widest"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <Target size={12} style={{color:"var(--fr-orange)"}}/> QUARRY
          </div>
        </Link>
      </div>

      {/* Quick-forge inline */}
      <AnimatePresence>
        {showForge && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            className="rounded-sm steel-plate p-5 relative" style={{borderColor:"var(--fr-amber)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>TITLE</label>
                <input autoFocus value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&submitForge()}
                  placeholder="e.g. Ship Forge OS v1"
                  className="w-full px-3 py-2 rounded-sm outline-none mono text-sm"
                  style={{background:"var(--fr-card2)",border:"1px solid var(--fr-border)",color:"var(--fr-fg)"}}/>
              </div>
              <div>
                <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>CODENAME</label>
                <input value={draft.codename} onChange={e=>setDraft(d=>({...d,codename:e.target.value.toUpperCase()}))}
                  placeholder="ANVIL"
                  className="w-full px-3 py-2 rounded-sm outline-none mono text-sm uppercase"
                  style={{background:"var(--fr-card2)",border:"1px solid var(--fr-border)",color:"var(--fr-fg)"}}/>
              </div>
              <div className="md:col-span-2">
                <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>TEMPLATE</label>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map(t=>(
                    <button key={t.id} onClick={()=>applyTemplate(t.id)}
                      className="mono text-[10px] font-black tracking-widest px-2 py-1.5 rounded-sm flex items-center gap-1"
                      style={{background:tpl===t.id?`${t.color}33`:"var(--fr-card2)",color:tpl===t.id?t.color:"var(--fr-fgMuted)",border:`1.5px solid ${tpl===t.id?t.color:"var(--fr-borderSoft)"}`}}
                      title={t.blurb}>
                      <span>{t.icon}</span>{t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>HEAT COLOR</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setDraft(d=>({...d,color:c}))}
                      className="w-8 h-8 rounded-sm transition"
                      style={{background:c,border:`2px solid ${draft.color===c?"#fff":"transparent"}`,boxShadow:draft.color===c?`0 0 10px ${c}`:"none"}}/>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mono text-[10px] tracking-widest block mb-1" style={{color:"var(--fr-fgMuted)"}}>ICON</label>
                <div className="flex gap-1 flex-wrap">
                  {ICONS.map(i=>(
                    <button key={i} onClick={()=>setDraft(d=>({...d,icon:i}))}
                      className="w-9 h-9 rounded text-lg transition"
                      style={{background:draft.icon===i?`${draft.color}28`:"var(--fr-card2)",border:`1.5px solid ${draft.icon===i?draft.color:"var(--fr-borderSoft)"}`}}>{i}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setShowForge(false)}
                className="mono text-[10px] tracking-widest px-3 py-2 rounded-sm"
                style={{color:"var(--fr-fgMuted)"}}>CANCEL</button>
              <button onClick={submitForge}
                className="mono text-[10px] font-black tracking-widest px-4 py-2 rounded-sm flex items-center gap-1"
                style={{background:draft.color,color:"#000",boxShadow:`0 0 14px ${draft.color}66`}}>
                <Hammer size={12}/> STRIKE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat plates */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatPlate2 label="HEATS ACTIVE" value={active.length} icon={<Flame size={14}/>} color="#f59e0b" light={light}/>
        <StatPlate2 label="ON TRACK" value={onTrack} icon={<TrendingUp size={14}/>} color="#22c55e" light={light}/>
        <StatPlate2 label="COLD" value={blocked} icon={<AlertTriangle size={14}/>} color="#ef4444" light={light}/>
        <StatPlate2 label="SHIPPED" value={shipped.length} icon={<CheckCircle2 size={14}/>} color="#06b6d4" light={light}/>
        <StatPlate2 label="FORGE HRS" value={Math.round(totalHours)} icon={<Clock size={14}/>} color="#a78bfa" light={light}/>
      </div>

      {/* Today's anvil */}
      {todayTasks.length > 0 && (
        <div className="rounded-sm steel-plate p-5 relative" style={{borderColor:"var(--fr-cyan)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} style={{color:"var(--fr-cyan)"}}/>
            <h3 className="text-lg font-black tracking-widest uppercase" style={{color:"var(--fr-cyan)"}}>anvil.today</h3>
            <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>// {todayTasks.length} tasks on the block</span>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {todayTasks.slice(0,8).map(t => {
              const proj = forge.projects.find(p=>p.id===t.projectId);
              return (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-sm"
                  style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                  <button onClick={()=>updateForge(f=>{
                    const doneId = ((f.customStatuses && f.customStatuses.length>=2)
                      ? f.customStatuses[f.customStatuses.length-1].id
                      : "done") as ProjectTask["status"];
                    const target = f.tasks.find(x=>x.id===t.id);
                    const already = target ? isTaskDone(target.status, f.customStatuses) : false;
                    return {tasks:f.tasks.map(x=>x.id===t.id?{...x,status:already?"todo":doneId,completedAt:already?undefined:new Date().toISOString().slice(0,10)}:x)};
                  })}
                    className="w-5 h-5 rounded shrink-0 flex items-center justify-center"
                    style={{
                      background: isTaskShipped(t.status)?"var(--fr-green)":"transparent",
                      border:`2px solid ${isTaskShipped(t.status)?"var(--fr-green)":"var(--fr-fgMuted)"}`,
                    }}>
                    {isTaskShipped(t.status) && <CheckCircle2 size={12} color="#000"/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${isTaskShipped(t.status)?"line-through opacity-50":""}`}>{t.title}</div>
                    <div className="mono text-[10px] flex items-center gap-2" style={{color:"var(--fr-fgMuted)"}}>
                      <span style={{color:proj?.color}}>{proj?.icon} {proj?.codename}</span>
                      <span>·</span>
                      <span>{t.priority}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active heats */}
      <div>
        <h3 className="text-sm font-black tracking-[0.3em] mb-3 flex items-center gap-2" style={{color:"var(--fr-amber)"}}>
          <span className="h-px flex-1" style={{background:"var(--fr-borderSoft)"}}/>
          ACTIVE HEATS
          <span className="h-px flex-1" style={{background:"var(--fr-borderSoft)"}}/>
        </h3>
        {active.length === 0 ? (
          <div className="rounded-sm steel-plate p-10 text-center relative" style={{borderColor:"var(--fr-borderSoft)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <Flame size={42} className="mx-auto mb-2" style={{color:"var(--fr-fgDim)"}}/>
            <p className="mono text-[11px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>Furnace is cold.</p>
            <p className="mono text-[10px] italic mt-1" style={{color:"var(--fr-fgDim)"}}>Light a forge to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map(p => {
              const h = HEALTH[p.status];
              const prog = progressOf(p);
              const nt = nextTask(p);
              return (
                <Link key={p.id} href={`/projects/p/${p.id}`} className="block group">
                  <motion.button whileHover={{y:-3}}
                    className="relative w-full text-left rounded-sm steel-plate p-5 overflow-hidden"
                    style={{borderColor:`${p.color}66`}}>
                    <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                    {/* heat glow strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-[4px]"
                      style={{background:`linear-gradient(180deg,${p.color},${p.color}80)`,boxShadow:`0 0 10px ${p.color}aa`}}/>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl w-14 h-14 rounded-sm flex items-center justify-center shrink-0"
                        style={{background:`${p.color}22`,border:`2px solid ${p.color}66`}}>{p.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="mono text-[10px] tracking-widest" style={{color:p.color}}>{p.codename}</div>
                            <h4 className="font-black text-lg tracking-wide leading-tight truncate">{p.title}</h4>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-sm"
                            style={{background:`${h.color}22`,color:h.color,border:`1px solid ${h.ring}`}}>
                            <h.Icon size={11}/>
                            <span className="mono text-[9px] font-bold tracking-widest">{h.label}</span>
                          </div>
                        </div>
                        {/* progress */}
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{background:"var(--fr-borderSoft)"}}>
                            <motion.div initial={{width:0}} animate={{width:`${prog}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}}
                              className="h-full rounded-full" style={{background:`linear-gradient(90deg,${p.color},${p.color}cc)`,boxShadow:`0 0 8px ${p.color}`}}/>
                          </div>
                          <div className="flex justify-between mono text-[9px] tracking-widest mt-1" style={{color:"var(--fr-fgMuted)"}}>
                            <span>{p.milestones.filter(m=>m.done).length}/{p.milestones.length} milestones</span>
                            <span style={{color:p.color}}>{prog}%</span>
                          </div>
                        </div>
                        {/* next task */}
                        {nt && (
                          <div className="mt-2 mono text-[10px] flex items-center gap-1.5 truncate" style={{color:"var(--fr-fgMuted)"}}>
                            <Zap size={10} style={{color:"var(--fr-orange)"}}/>
                            <span className="truncate">next: {nt.title}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 mono text-[9px] tracking-widest flex-wrap">
                          <span style={{color:p.color}}>P{p.priority}</span>
                          <span style={{color:"var(--fr-fgDim)"}}>·</span>
                          <span style={{color:"var(--fr-fgMuted)"}}>E{p.energyDemand}/C{p.complexity}</span>
                          {p.deadline && <>
                            <span style={{color:"var(--fr-fgDim)"}}>·</span>
                            <span style={{color:"var(--fr-fgMuted)"}}>⏳ {p.deadline}</span>
                          </>}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* QA seed */}
      {forge.projects.length <= 1 && (
        <div className="rounded-sm steel-plate p-4 relative flex items-center justify-between flex-wrap gap-3" style={{borderColor:"#f472b655"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <div>
            <div className="mono text-[10px] tracking-[0.25em] font-black" style={{color:"#ec4899"}}>// QA.stoke_furnace</div>
            <p className="mono text-[11px] mt-0.5" style={{color:"var(--fr-fgMuted)"}}>Pre-heat the forge with rich demo data (7 projects, 30+ tasks, SWOT, retro, lessons).</p>
          </div>
          <button onClick={()=>{ if(confirm("Replace all forge data with demo?")) seedForgeDemo(); }}
            className="mono text-[10px] tracking-widest font-black px-3 py-2 rounded-sm"
            style={{background:"#ec4899",color:"#000"}}>[ STOKE FURNACE ]</button>
        </div>
      )}

      {/* Career cross-link callout */}
      <Link href="/career" className="block">
        <div className="rounded-sm steel-plate p-4 relative flex items-center gap-4 group"
          style={{borderColor:"#06b6d455", background:"linear-gradient(90deg, rgba(6,182,212,0.08), transparent)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
            style={{background:"rgba(6,182,212,0.15)",border:"1.5px solid #06b6d4",color:"#06b6d4"}}>💼</div>
          <div className="flex-1 min-w-0">
            <div className="mono text-[10px] tracking-widest" style={{color:"#06b6d4"}}>CROSS-LINK::CAREER_BRIDGE</div>
            <p className="text-sm" style={{color:"var(--fr-fg)"}}>Jump to Career hub → map skills, network, and portfolio to your active heats.</p>
          </div>
          <span className="mono text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition" style={{color:"#06b6d4"}}>→</span>
        </div>
      </Link>

      {/* Parking lot */}
      {forge.parking.length > 0 && (
        <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"#94a3b855"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <div className="flex items-center gap-2 mb-2">
            <Archive size={13} style={{color:"#94a3b8"}}/>
            <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color:"#94a3b8"}}>PARKING LOT · {forge.parking.length}</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-1">
            {forge.parking.slice(0,8).map(pi=>{
              const proj = pi.projectId ? forge.projects.find(p=>p.id===pi.projectId) : null;
              return (
                <div key={pi.id} className="flex items-start gap-2 p-1.5 rounded-sm text-xs"
                  style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                  <span style={{color:proj?.color||"var(--fr-fgDim)"}}>{proj?.icon||"•"}</span>
                  <span className="flex-1 pencil italic" style={{color:"var(--fr-fgMuted)"}}>{pi.text}</span>
                  <button onClick={()=>{
                    // Promote to task
                    const pid = pi.projectId || forge.projects.find(p=>!p.archived)?.id;
                    if(pid){
                      updateForge(f=>({tasks:[{id:"t-"+Math.random().toString(36).slice(2,10),projectId:pid,title:pi.text,status:"todo",priority:"P2",pomodoros:0,energy:3,focus:3,tags:[],subtaskIds:[],comments:[],createdAt:new Date().toISOString().slice(0,10),effort:3,impact:3},...f.tasks],parking:f.parking.filter(x=>x.id!==pi.id)}));
                      window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"PROMOTED→QUARRY",sub:pi.text.slice(0,40),color:"#f59e0b",icon:"zap"}}));
                    }
                  }} title="Promote to task"
                    className="opacity-50 hover:opacity-100 mono text-[9px] font-black tracking-widest px-1"
                    style={{color:"var(--fr-amber)"}}>▲TASK</button>
                  <button onClick={()=>updateForge(f=>({parking:f.parking.filter(x=>x.id!==pi.id)}))}
                    className="opacity-50 hover:opacity-100" style={{color:"var(--fr-red)"}}><X size={10}/></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resource utilization heatmap (projects × resources) */}
      <ResourceHeatmap projects={forge.projects}/>

      {/* Skill gap alerts */}
      <SkillGapAlerts projects={forge.projects}/>

      {/* Workload heatmap: active projects × last 12 weeks */}
      <WorkloadHeatmap projects={forge.projects} tasks={forge.tasks}/>

      {/* Cold stock */}
      {cold.length > 0 && (
        <div>
          <h3 className="text-sm font-black tracking-[0.3em] mb-3 flex items-center gap-2" style={{color:"var(--fr-red)"}}>
            <span className="h-px flex-1" style={{background:"var(--fr-borderSoft)"}}/>
            COLD METAL — NEEDS HEAT
            <span className="h-px flex-1" style={{background:"var(--fr-borderSoft)"}}/>
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            {cold.map(p => {
              const h = HEALTH[p.status];
              return (
                <Link key={p.id} href={`/projects/p/${p.id}`} className="block">
                  <div className="rounded-sm steel-plate p-4 relative opacity-85"
                    style={{borderColor:`${h.color}55`}}>
                    <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mono text-[9px] tracking-widest" style={{color:h.color}}>{p.codename} · {h.label}</div>
                        <div className="font-bold text-sm truncate">{p.title}</div>
                      </div>
                    </div>
                    {p.issues.length > 0 && (
                      <div className="mono text-[10px] mt-2 italic" style={{color:"var(--fr-fgMuted)"}}>
                        ⚠ {p.issues[0].description.slice(0,60)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPlate2({label,value,icon,color,light}:{label:string;value:number|string;icon:React.ReactNode;color:string;light:boolean}) {
  return (
    <div className="rounded-sm steel-plate p-3 flex items-center gap-3 relative"
      style={{background:"var(--fr-card2)",borderColor:`${color}55`}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
        style={{background:`${color}22`,color}}>{icon}</div>
      <div>
        <div className="mono text-[9px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>{label}</div>
        <div className="text-xl font-black leading-none">{value}</div>
      </div>
    </div>
  );
}

/* Velocity + burndown mini-dashboard: last 8 weeks of tasks shipped, plus an estimate of total work remaining */
function VelocityPlate({projects,tasks}:{projects:any[];tasks:any[]}) {
  // Compute velocity over last 8 weeks (buckets by completedAt YYYY-Www)
  const weeks:{label:string;shipped:number;created:number}[] = [];
  for (let i=7;i>=0;i--) {
    const d = new Date(); d.setDate(d.getDate()-i*7);
    const yw = d.getFullYear()+"-W"+String(getWeek(d)).padStart(2,"0");
    weeks.push({label: yw.slice(-2), shipped:0, created:0});
  }
  tasks.forEach(t=>{
    if(t.completedAt){
      const d = new Date(t.completedAt);
      const yw = d.getFullYear()+"-W"+String(getWeek(d)).padStart(2,"0");
      const w = weeks.find(x=>x.label===yw.slice(-2));
      if(w) w.shipped++;
    }
    if(t.createdAt){
      const d = new Date(t.createdAt);
      const yw = d.getFullYear()+"-W"+String(getWeek(d)).padStart(2,"0");
      const w = weeks.find(x=>x.label===yw.slice(-2));
      if(w) w.created++;
    }
  });
  const maxShip = Math.max(4,...weeks.map(w=>w.shipped));
  const active = tasks.filter(t=>!isTaskDone(t.status)).length;
  const shipped = tasks.filter(t=>isTaskDone(t.status)).length;
  const burnt = shipped;
  const total = active + shipped;
  const burnPct = total ? Math.round(burnt/total*100) : 0;
  const avgVel = Math.round(weeks.reduce((n,w)=>n+w.shipped,0)/weeks.length*10)/10;
  // Project next week's velocity via linear regression slope
  const xs = weeks.map((_,i)=>i); const n=xs.length;
  const mx = xs.reduce((a,b)=>a+b,0)/n; const my = avgVel;
  let num=0, den=0;
  weeks.forEach((w,i)=>{ num += (xs[i]-mx)*(w.shipped-my); den += (xs[i]-mx)**2; });
  const slope = den?num/den:0;
  const proj = Math.max(0, Math.round((weeks[n-1].shipped+slope)*10)/10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-sm steel-plate p-4 relative md:col-span-2" style={{borderColor:"var(--fr-cyan)"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} style={{color:"var(--fr-cyan)"}}/>
          <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color:"var(--fr-cyan)"}}>VELOCITY · 8W</h3>
          <span className="mono text-[10px] ml-auto" style={{color:"var(--fr-fgMuted)"}}>avg {avgVel} blocks/wk</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {weeks.map((w,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex items-end gap-0.5 w-full justify-center" style={{height:"100%"}}>
                <motion.div initial={{height:0}} animate={{height:`${(w.created/maxShip)*100}%`}}
                  transition={{duration:0.6,delay:i*0.05}}
                  className="w-2.5 rounded-t" style={{background:"rgba(148,163,184,0.4)"}} title={`created: ${w.created}`}/>
                <motion.div initial={{height:0}} animate={{height:`${(w.shipped/maxShip)*100}%`}}
                  transition={{duration:0.6,delay:i*0.05+0.1}}
                  className="w-2.5 rounded-t" style={{background:"var(--fr-amber)",boxShadow:"0 0 8px var(--fr-amber)"}} title={`shipped: ${w.shipped}`}/>
              </div>
              <div className="mono text-[8px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>{w.label}</div>
            </div>
          ))}
          {/* Projection bar (ghost) */}
          <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="flex items-end gap-0.5 w-full justify-center" style={{height:"100%"}}>
              <div className="w-2.5 rounded-t" style={{height:`${(proj/(maxShip||1))*100}%`,background:"repeating-linear-gradient(135deg,var(--fr-cyan) 0 3px,transparent 3px 6px)",opacity:0.55,boxShadow:"0 0 6px var(--fr-cyan)"}} title={`projected: ${proj}`}/>
            </div>
            <div className="mono text-[8px] tracking-widest" style={{color:"var(--fr-cyan)"}}>+1</div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 mono text-[9px] tracking-widest flex-wrap" style={{color:"var(--fr-fgMuted)"}}>
          <span className="flex items-center gap-1"><span className="w-2 h-2" style={{background:"var(--fr-amber)"}}/>SHIPPED</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2" style={{background:"rgba(148,163,184,0.4)"}}/>CREATED</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2" style={{background:"repeating-linear-gradient(135deg,var(--fr-cyan) 0 2px,transparent 2px 4px)"}}/>PROJECTED {proj}</span>
        </div>
      </div>

      <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"var(--fr-green)"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} style={{color:"var(--fr-green)"}}/>
          <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color:"var(--fr-green)"}}>PULSE</h3>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mono text-[9px] tracking-widest mb-1">
              <span style={{color:"var(--fr-fgMuted)"}}>BURNDOWN</span>
              <span style={{color:"var(--fr-green)"}}>{burnPct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--fr-borderSoft)"}}>
              <motion.div initial={{width:0}} animate={{width:`${burnPct}%`}} transition={{duration:1}}
                className="h-full rounded-full" style={{background:"linear-gradient(90deg,var(--fr-amber),var(--fr-green))",boxShadow:"0 0 6px var(--fr-green)"}}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <PulseStat label="BACKLOG" value={active} color="#ef4444"/>
            <PulseStat label="SHIPPED" value={shipped} color="#22c55e"/>
            <PulseStat label="PROJECTS" value={projects.filter(p=>!p.archived).length} color="#f59e0b"/>
            <PulseStat label="AT RISK" value={projects.filter(p=>p.status==="blocked"||p.status==="off-track").length} color="#ea580c"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseStat({label,value,color}:{label:string;value:number;color:string}) {
  return (
    <div className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:`1px solid ${color}55`}}>
      <div className="mono text-[8px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>{label}</div>
      <div className="text-xl font-black leading-none" style={{color}}>{value}</div>
    </div>
  );
}

function getWeek(d:Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return Math.ceil((((+t - +yearStart)/86400000)+1)/7);
}

function ForgePulse(){
  const {forge,updateForge} = useStore();
  const todayStr = new Date().toISOString().slice(0,10);
  const active = forge.projects.filter(p=>!p.archived && p.status!=="dead"&&p.status!=="done");
  const [pid,setPid] = useState<string>(active[0]?.id||"");
  const [score,setScore] = useState<number>(5);
  const loggedToday = active.filter(p=>(p.satisfactionLog||[]).some(s=>s.date===todayStr)).length;
  const submit = () => {
    if(!pid) return;
    updateForge(f=>({projects:f.projects.map(p=>p.id===pid?{...p,satisfactionLog:[{id:"sl-"+Math.random().toString(36).slice(2,8),date:todayStr,score},...(p.satisfactionLog||[]).filter(s=>s.date!==todayStr)]}:p)}));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"PULSE LOGGED",sub:`${score}/10 for today`,color:"#22c55e",icon:"check"}}));
  };
  if(active.length===0) return null;
  return (
    <div className="rounded-sm steel-plate p-4 relative flex items-center gap-3 flex-wrap" style={{borderColor:"#22c55e55"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <Smile size={16} style={{color:"#22c55e"}}/>
      <div className="mono text-[10px] tracking-widest" style={{color:"#22c55e"}}>DAILY PULSE · {loggedToday}/{active.length} logged today</div>
      <select value={pid} onChange={e=>setPid(e.target.value)}
        className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
        style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
        {active.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
      </select>
      <div className="flex gap-0.5">
        {[1,2,3,4,5,6,7,8,9,10].map(n=>{
          const c = n>=8?"#22c55e":n>=5?"#f59e0b":"#ef4444";
          return <button key={n} onClick={()=>setScore(n)}
            className="w-6 h-6 rounded-sm mono text-[9px] font-black"
            style={{background:score===n?c:"transparent",color:score===n?"#000":c,border:`1px solid ${c}55`}}>{n}</button>;
        })}
      </div>
      <button onClick={submit}
        className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm ml-auto"
        style={{background:"#22c55e",color:"#000"}}>LOG</button>
    </div>
  );
}

/* 14-day upcoming calendar heat: dues, milestones, completions, today marker */
function ForgeCalendar({projects,tasks,streak}:{projects:ForgeProject[];tasks:ProjectTask[];streak:{current:number;longest:number;history:string[]}}) {
  const today = todayISO();
  const days: {iso:string;label:string;dow:string;dueTasks:ProjectTask[];doneTasks:ProjectTask[];milestones:{title:string;project:ForgeProject;done:boolean}[];isToday:boolean;isFuture:boolean}[] = [];
  for (let i=-3;i<=10;i++) {
    const iso = addDays(today, i);
    const d = new Date(iso+"T00:00:00");
    const dows = ["S","M","T","W","T","F","S"];
    const dueTasks = tasks.filter(t => t.dueDate === iso && !isTaskDone(t.status));
    const doneTasks = tasks.filter(t => t.completedAt === iso);
    const milestones: {title:string;project:ForgeProject;done:boolean}[] = [];
    projects.forEach(p => p.milestones.forEach(m => { if (m.date === iso) milestones.push({title:m.title,project:p,done:m.done}); }));
    days.push({
      iso, label: String(d.getDate()).padStart(2,"0"), dow: dows[d.getDay()],
      dueTasks, doneTasks, milestones, isToday: iso===today, isFuture: i>0,
    });
  }
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"var(--fr-amber)"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <CalendarIcon size={14} style={{color:"var(--fr-amber)"}}/>
        <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color:"var(--fr-amber)"}}>FORGE HEAT · 14 DAY</h3>
        <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>// dues · ships · milestones</span>
        <div className="ml-auto flex items-center gap-3 mono text-[10px] tracking-widest">
          <span style={{color:"var(--fr-amber)"}}>🔥 STREAK {streak.current}d</span>
          <span style={{color:"var(--fr-fgMuted)"}}>longest {streak.longest}d</span>
        </div>
      </div>
      <div className="grid grid-cols-7 md:grid-cols-14 gap-1.5">
        {days.map((d,i)=>{
          const heat = d.doneTasks.length + d.milestones.filter(m=>m.done).length;
          const hasDue = d.dueTasks.length>0;
          const hasMilestone = d.milestones.length>0;
          let bg = "var(--fr-card2)";
          if (heat>=3) bg="var(--fr-green)";
          else if (heat===2) bg="rgba(34,197,94,0.55)";
          else if (heat===1) bg="rgba(34,197,94,0.22)";
          return (
            <div key={d.iso} className="rounded-sm p-1.5 relative min-h-[72px]"
              style={{background:bg,border:`1px solid ${d.isToday?"var(--fr-amber)":"var(--fr-borderSoft)"}`,
                boxShadow: d.isToday?"0 0 10px var(--fr-amber)":"none"}}>
              <div className="flex items-center justify-between">
                <span className="mono text-[9px] tracking-widest" style={{color:d.isToday?"var(--fr-amber)":"var(--fr-fgMuted)"}}>{d.dow}</span>
                <span className="mono text-[10px] font-black" style={{color:d.isToday?"var(--fr-amber)":"var(--fr-fg)"}}>{d.label}</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {d.dueTasks.slice(0,2).map(t=>{
                  const proj = projects.find(p=>p.id===t.projectId);
                  return <div key={t.id} className="text-[9px] truncate flex items-center gap-1" style={{color:"var(--fr-red)"}}>
                    <span style={{color:proj?.color}}>{proj?.icon}</span>{t.title.slice(0,16)}
                  </div>;
                })}
                {d.milestones.slice(0,1).map(m=>(
                  <div key={m.title} className="text-[9px] truncate flex items-center gap-1" style={{color:m.done?"var(--fr-green)":"var(--fr-orange)"}}>
                    ◆ {m.title.slice(0,16)}
                  </div>
                ))}
                {d.doneTasks.slice(0,1).map(t=>{
                  const proj = projects.find(p=>p.id===t.projectId);
                  return <div key={t.id} className="text-[9px] truncate flex items-center gap-1 opacity-80" style={{color:"var(--fr-green)"}}>
                    <span style={{color:proj?.color}}>{proj?.icon}</span>✓ {t.title.slice(0,14)}
                  </div>;
                })}
                {d.dueTasks.length>2 && <div className="text-[9px] mono" style={{color:"var(--fr-red)"}}>+{d.dueTasks.length-2}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 mono text-[9px] tracking-widest flex-wrap" style={{color:"var(--fr-fgMuted)"}}>
        <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}/>cold</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{background:"rgba(34,197,94,0.22)"}}/>1 ship</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{background:"rgba(34,197,94,0.55)"}}/>2 ships</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{background:"var(--fr-green)"}}/>3+ hot</span>
        <span className="flex items-center gap-1"><span style={{color:"var(--fr-red)"}}>●</span> due</span>
        <span className="flex items-center gap-1"><span style={{color:"var(--fr-orange)"}}>◆</span> milestone</span>
      </div>
    </div>
  );
}

/* Weekly Review launcher + modal */
function WeeklyReviewLauncher() {
  const { forge, updateForge } = useStore();
  const isTaskShipped = taskShipped(forge.customStatuses);
  const projects = forge.projects;
  const [open, setOpen] = useState(false);
  const thisMonday = (() => {
    const d = new Date(); const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow); return d.toISOString().slice(0,10);
  })();
  const existing = forge.reviews.find(r => r.weekOf === thisMonday);
  const [wins,setWins] = useState(existing?.wins||"");
  const [learnings,setLearnings] = useState(existing?.learnings||"");
  const [nextWeek,setNextWeek] = useState(existing?.nextWeekFocus||"");
  const [distractions,setDistractions] = useState(existing?.distractions||"");
  const [mood,setMood] = useState<1|2|3|4|5>(existing?.mood||3);
  const [rating,setRating] = useState<1|2|3|4|5>(existing?.rating||3);
  const [hrs,setHrs] = useState<string>(String(existing?.hoursWorked||""));
  const weekShipped = forge.tasks.filter(t=>{
    if(!isTaskDone(t.status)||!t.completedAt) return false;
    return t.completedAt >= thisMonday;
  });
  const save = () => {
    const id = existing?.id || "wr-"+Math.random().toString(36).slice(2,10);
    const rev = { id, weekOf:thisMonday, mood, rating, wins, learnings, nextWeekFocus:nextWeek, distractions,
      hoursWorked: Number(hrs)||0, shipped:weekShipped.map(t=>t.id), carry:[],
      createdAt: existing?.createdAt||todayISO() };
    updateForge(f => ({ reviews: existing ? f.reviews.map(r=>r.id===id?rev:r) : [rev,...f.reviews] }));
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#22c55e",count:30}}));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"WEEK STAMPED",sub:"review sealed",color:"#22c55e",icon:"check"}}));
    setOpen(false);
  };
  return (
    <>
      <button onClick={()=>setOpen(true)}
        className="relative w-full rounded-sm steel-plate p-3 flex items-center gap-2 text-[10px] font-black tracking-widest text-left"
        style={{background:"var(--fr-card2)",borderColor:existing?"var(--fr-green)":"var(--fr-violet, #a78bfa)",color:"var(--fr-fg)"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <ClipboardCheck size={12} style={{color:existing?"var(--fr-green)":"#a78bfa"}}/>
        {existing ? "WEEK STAMPED" : "STAMP WEEK"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.7)"}}
            onClick={()=>setOpen(false)}>
            <motion.div initial={{scale:0.95,y:10}} animate={{scale:1,y:0}} exit={{scale:0.95,y:10}}
              onClick={e=>e.stopPropagation()}
              className="relative w-full max-w-2xl steel-plate p-6 max-h-[90vh] overflow-y-auto"
              style={{background:"var(--fr-card)",borderColor:"var(--fr-amber)",color:"var(--fr-fg)"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-2xl font-black tracking-widest" style={{color:"var(--fr-amber)"}}>WEEKLY REVIEW</h2>
                  <p className="mono text-[11px] tracking-widest mt-1" style={{color:"var(--fr-fgMuted)"}}>// week of {thisMonday} · {weekShipped.length} blocks shipped</p>
                </div>
                <button onClick={()=>setOpen(false)} className="mono text-[10px] tracking-widest px-2 py-1 rounded-sm" style={{color:"var(--fr-fgMuted)",border:"1px solid var(--fr-borderSoft)"}}>ESC</button>
              </div>
              <div className="space-y-3">
                <LabeledReview label="WINS / SHIPPED" color="var(--fr-green)">
                  <textarea value={wins} onChange={e=>setWins(e.target.value)} rows={3}
                    placeholder="What shipped? What felt like a win?"
                    className="w-full p-2 rounded-sm outline-none mono text-xs"
                    style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                </LabeledReview>
                <LabeledReview label="LEARNINGS" color="var(--fr-amber)">
                  <textarea value={learnings} onChange={e=>setLearnings(e.target.value)} rows={2}
                    placeholder="What did you learn? What sucked?"
                    className="w-full p-2 rounded-sm outline-none mono text-xs"
                    style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                </LabeledReview>
                <LabeledReview label="NEXT WEEK FOCUS" color="var(--fr-cyan)">
                  <textarea value={nextWeek} onChange={e=>setNextWeek(e.target.value)} rows={2}
                    placeholder="Top 1-3 priorities for next week"
                    className="w-full p-2 rounded-sm outline-none mono text-xs"
                    style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                </LabeledReview>
                <LabeledReview label="DISTRACTIONS / LEAKS" color="var(--fr-red)">
                  <textarea value={distractions} onChange={e=>setDistractions(e.target.value)} rows={2}
                    placeholder="What stole time? What to cut?"
                    className="w-full p-2 rounded-sm outline-none mono text-xs"
                    style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                </LabeledReview>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="mono text-[10px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>MOOD</div>
                    <div className="flex gap-1">
                      {([1,2,3,4,5] as const).map(n=>(
                        <button key={n} onClick={()=>setMood(n)}
                          className="w-7 h-7 rounded-sm text-xs"
                          style={{background:mood===n?"var(--fr-amber)":"var(--fr-card2)",color:mood===n?"#000":"var(--fr-fgMuted)",border:"1px solid var(--fr-borderSoft)"}}>
                          {n===1?"💀":n===2?"😒":n===3?"😐":n===4?"🙂":"🔥"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[10px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>RATING</div>
                    <div className="flex gap-1">
                      {([1,2,3,4,5] as const).map(n=>(
                        <button key={n} onClick={()=>setRating(n)}
                          className="w-7 h-7 rounded-sm text-xs font-black"
                          style={{background:rating===n?"var(--fr-green)":"var(--fr-card2)",color:rating===n?"#000":"var(--fr-fgMuted)",border:"1px solid var(--fr-borderSoft)"}}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[10px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>HOURS</div>
                    <input type="number" value={hrs} onChange={e=>setHrs(e.target.value)}
                      className="w-full p-2 rounded-sm outline-none mono text-xs"
                      style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                  </div>
                </div>
                {weekShipped.length>0 && (
                  <div className="p-2 rounded-sm" style={{background:"rgba(34,197,94,0.08)",border:"1px dashed rgba(34,197,94,0.4)"}}>
                    <div className="mono text-[10px] tracking-widest mb-1" style={{color:"var(--fr-green)"}}>✓ AUTO-LOGGED SHIPS THIS WEEK ({weekShipped.length})</div>
                    <ul className="mono text-[10px] space-y-0.5" style={{color:"var(--fr-fgMuted)"}}>
                      {weekShipped.slice(0,10).map(t=>{
                        const p = projects.find(x=>x.id===t.projectId);
                        return <li key={t.id}>{p?.icon} {t.title}</li>;
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={()=>setOpen(false)} className="mono text-[10px] tracking-widest px-3 py-2" style={{color:"var(--fr-fgMuted)"}}>CANCEL</button>
                <button onClick={save}
                  className="mono text-[10px] font-black tracking-widest px-4 py-2 rounded-sm flex items-center gap-1"
                  style={{background:"var(--fr-green)",color:"#000",boxShadow:"0 0 14px rgba(34,197,94,0.5)"}}>
                  <CheckCircle2 size={12}/> STAMP WEEK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LabeledReview({label,color,children}:{label:string;color:string;children:React.ReactNode}) {
  return (
    <div>
      <div className="mono text-[10px] tracking-widest mb-1" style={{color}}>{label}</div>
      {children}
    </div>
  );
}

function WorkloadHeatmap({projects,tasks}:{projects:ForgeProject[];tasks:ProjectTask[]}) {
  const WEEKS = 12;
  const active = projects.filter(p=>!p.archived && p.status!=="dead").slice(0,8);
  // Build week buckets
  const weekStart = (w:number) => {
    const d = new Date(); d.setHours(0,0,0,0);
    const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow);
    d.setDate(d.getDate() - w*7);
    return d;
  };
  const weeks = Array.from({length:WEEKS},(_,i)=>weekStart(WEEKS-1-i));
  const cellFor = (pid:string, d:Date) => {
    const end = new Date(d); end.setDate(end.getDate()+7);
    const n = tasks.filter(t => t.projectId===pid && t.completedAt && new Date(t.completedAt)>=d && new Date(t.completedAt)<end).length;
    return n;
  };
  const weekLabel = (d:Date) => `${d.getMonth()+1}/${d.getDate()}`;
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"var(--fr-cyan)"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <BarChart3 size={14} style={{color:"var(--fr-cyan)"}}/>
        <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color:"var(--fr-cyan)"}}>WORKLOAD · 12W</h3>
        <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>// ships per project per week</span>
      </div>
      {active.length === 0 ? (
        <p className="mono text-[11px] italic text-center py-4" style={{color:"var(--fr-fgDim)"}}>Light the furnace first.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] mono">
            <thead>
              <tr>
                <th className="text-left font-normal pr-2 py-1" style={{color:"var(--fr-fgMuted)"}}>heat</th>
                {weeks.map((w,i)=>(
                  <th key={i} className="font-normal text-center px-0.5" style={{color:"var(--fr-fgMuted)"}}>{weekLabel(w)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.map(p=>(
                <tr key={p.id}>
                  <td className="pr-2 py-0.5 whitespace-nowrap" style={{color:p.color}}>{p.icon} {p.codename}</td>
                  {weeks.map((w,i)=>{
                    const n = cellFor(p.id,w);
                    const intensity = Math.min(1, n/5);
                    const bg = n===0 ? "var(--fr-card2)" : `rgba(245,158,11,${0.15 + intensity*0.85})`;
                    const fg = n>=3 ? "#000" : "var(--fr-fg)";
                    return <td key={i} className="p-0.5 text-center">
                      <div className="w-6 h-6 rounded-sm flex items-center justify-center font-black"
                        style={{background:bg,color:fg,border:"1px solid var(--fr-borderSoft)"}}>{n||""}</div>
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 mono text-[9px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>
        <span>less</span>
        {[0.1,0.3,0.5,0.7,1].map(a=><span key={a} className="w-4 h-4 rounded-sm" style={{background:`rgba(245,158,11,${a})`}}/>)}
        <span>more</span>
      </div>
    </div>
  );
}

function StreakStrip({streak}:{streak:{current:number;longest:number;history:string[]}}) {
  const today = todayISO();
  // last 84 days
  const days: {iso:string;has:boolean}[] = [];
  const hist = new Set(streak.history);
  for (let i=83;i>=0;i--) days.push({ iso: addDays(today,-i), has: hist.has(addDays(today,-i)) });
  return (
    <div className="rounded-sm steel-plate p-3 relative flex items-center gap-3 flex-wrap" style={{borderColor:"var(--fr-green)"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <FlameKindling size={14} style={{color:streak.current>=7?"var(--fr-red)":"var(--fr-amber)"}}/>
      <div className="mono text-[10px] tracking-widest" style={{color:"var(--fr-fg)"}}>
        <span style={{color:"var(--fr-amber)",fontSize:14}} className="font-black">{streak.current}d</span> STREAK · longest {streak.longest}d
      </div>
      <div className="flex gap-0.5 flex-1 flex-wrap justify-end">
        {days.map((d,i)=>{
          const dow = new Date(d.iso+"T00:00:00").getDay();
          const isWeekend = dow===0||dow===6;
          const bg = d.has ? (streak.current>=7?"var(--fr-red)":"var(--fr-green)") : (isWeekend?"var(--fr-borderSoft)":"var(--fr-card2)");
          return <div key={i} title={d.iso} className="w-2.5 h-4 rounded-sm" style={{background:bg,opacity:d.has?1:0.5}}/>;
        })}
      </div>
    </div>
  );
}

/* Cross-project resource utilization heatmap */
function ResourceHeatmap({projects}:{projects:ForgeProject[]}) {
  const active = projects.filter(p=>!p.archived && p.status!=="dead" && p.resources && p.resources.length>0);
  // Collect resource kinds across active projects
  const kinds = ["people","budget","equipment","software"] as const;
  const kindLabel: Record<string,string> = {people:"CREW",budget:"BUDGET",equipment:"GEAR",software:"TOOLS"};
  if (active.length === 0) return null;
  const utilFor = (p: ForgeProject, kind: string) => {
    const rs = (p.resources||[]).filter(r=>r.kind===kind);
    if (!rs.length) return null;
    const all = rs.reduce((a,r)=>{a.allocated+=r.allocated; a.used+=r.used; return a;},{allocated:0,used:0});
    return all.allocated>0 ? Math.round(all.used/all.allocated*100) : 0;
  };
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"var(--fr-orange)"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <BarChart3 size={14} style={{color:"var(--fr-orange)"}}/>
        <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color:"var(--fr-orange)"}}>RESOURCE HEAT · CREW × GEAR × BUDGET</h3>
        <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>// % util per project per kind</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] mono">
          <thead>
            <tr>
              <th className="text-left font-normal pr-2 py-1" style={{color:"var(--fr-fgMuted)"}}>heat</th>
              {kinds.map(k=>(
                <th key={k} className="font-normal text-center px-2 py-1" style={{color:"var(--fr-fgMuted)"}}>{kindLabel[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map(p=>(
              <tr key={p.id}>
                <td className="pr-2 py-0.5 whitespace-nowrap" style={{color:p.color}}>{p.icon} {p.codename}</td>
                {kinds.map(k=>{
                  const u = utilFor(p,k);
                  if (u===null) return <td key={k} className="p-0.5 text-center"><div className="w-20 h-6 rounded-sm flex items-center justify-center" style={{background:"var(--fr-card2)",color:"var(--fr-fgDim)"}}>—</div></td>;
                  const over = u>100;
                  const color = over?"#ef4444":u>=85?"#f59e0b":u>=60?"#22c55e":u>=30?"#06b6d4":"#94a3b8";
                  return <td key={k} className="p-0.5 text-center">
                    <div className="w-20 h-6 rounded-sm flex items-center justify-center font-black"
                      style={{background:`${color}33`,color,border:`1px solid ${color}88`}}>
                      {u}%{over?" !":""}
                    </div>
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Skill gap alerts: when an active project's tags don't match strong career skills (<4 proficiency) nudge user */
function SkillGapAlerts({projects}:{projects:ForgeProject[]}) {
  const { career } = useStore();
  if (!career?.skills?.length) return null;
  const active = projects.filter(p=>!p.archived && p.status!=="dead" && p.status!=="done");
  if (active.length === 0) return null;
  // Normalize tag/skill name for fuzzy match
  const norm = (s:string) => s.toLowerCase().replace(/[^a-z0-9]/g,"");
  const weakSkills = career.skills.filter((s:any)=>(s.proficiency||0)<4);
  const alerts: {project:ForgeProject; skill:any}[] = [];
  active.forEach(p=>{
    (p.tags||[]).forEach(tag=>{
      const t = norm(tag);
      weakSkills.forEach((s:any)=>{
        const n = norm(s.name||"");
        if (n && (t.includes(n)||n.includes(t)) && !alerts.some(a=>a.project.id===p.id&&a.skill.id===s.id)) {
          alerts.push({project:p,skill:s});
        }
      });
    });
  });
  // Also catch generic "skills needed but not tracked"
  const trackedNames = new Set(career.skills.map((s:any)=>norm(s.name)));
  const untracked: {project:ForgeProject; tag:string}[] = [];
  active.forEach(p=>{
    (p.tags||[]).forEach(tag=>{
      const t = norm(tag);
      if (t.length<3) return;
      if (!trackedNames.has(t) && !Array.from(trackedNames).some(n=>n.includes(t)||t.includes(n))) {
        if (!untracked.some(u=>u.project.id===p.id&&u.tag===tag)) untracked.push({project:p,tag});
      }
    });
  });
  if (alerts.length===0 && untracked.length===0) return null;
  return (
    <div className="rounded-sm steel-plate p-4 relative" style={{borderColor:"var(--fr-red)"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={14} style={{color:"var(--fr-red)"}}/>
        <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color:"var(--fr-red)"}}>SKILL GAP ALERTS</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {alerts.slice(0,6).map(({project:p,skill:s})=>(
          <div key={p.id+s.id} className="p-2 rounded-sm flex items-center gap-2 text-xs"
            style={{background:"rgba(239,68,68,0.08)",border:"1px dashed rgba(239,68,68,0.4)"}}>
            <span style={{color:p.color}}>{p.icon}</span>
            <span className="mono" style={{color:p.color}}>{p.codename}</span>
            <span style={{color:"var(--fr-fgMuted)"}}>needs</span>
            <span className="font-black" style={{color:"var(--fr-red)"}}>{s.name}</span>
            <span className="mono ml-auto" style={{color:"var(--fr-fgMuted)"}}>lvl {s.proficiency||0}/10</span>
          </div>
        ))}
        {untracked.slice(0,4).map(({project:p,tag})=>(
          <div key={p.id+tag} className="p-2 rounded-sm flex items-center gap-2 text-xs"
            style={{background:"rgba(245,158,11,0.08)",border:"1px dashed rgba(245,158,11,0.4)"}}>
            <span style={{color:p.color}}>{p.icon}</span>
            <span className="mono" style={{color:p.color}}>{p.codename}</span>
            <span style={{color:"var(--fr-fgMuted)"}}>tag</span>
            <span className="font-black" style={{color:"var(--fr-amber)"}}>#{tag}</span>
            <span className="mono ml-auto" style={{color:"var(--fr-fgMuted)"}}>not in Career</span>
          </div>
        ))}
      </div>
    </div>
  );
}
