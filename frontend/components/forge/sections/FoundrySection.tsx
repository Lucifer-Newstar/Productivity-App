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
  Clock, Zap, Skull, Archive, TrendingUp, Target,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { ForgeProject, ProjectTask } from "../../../lib/forgeTypes";
import { FORGE_NAV } from "../ForgeShell";

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
  const { forge, updateForge, seedForgeDemo } = useStore();
  const { theme } = useTheme();
  const light = theme === "light";
  const [showForge, setShowForge] = useState(false);
  const [draft, setDraft] = useState({ title: "", codename: "", color: "#f59e0b", icon: "🔥" });

  const active = forge.projects.filter(p => !p.archived && p.status !== "dead" && p.status !== "done");
  const cold = forge.projects.filter(p => p.status === "off-track" || p.status === "blocked" || p.status === "paused");
  const shipped = forge.projects.filter(p => p.status === "done" || p.archived);
  const totalHours = forge.tasks.reduce((n,t) => n+(t.actualMins||0),0) / 60;
  const onTrack = active.filter(p => p.status === "on-track").length;
  const blocked = forge.projects.filter(p => p.status === "blocked" || p.status === "off-track").length;

  const todayTasks = forge.tasks.filter(t => t.today && t.status !== "done")
    .sort((a,b) => (b.priority < a.priority ? 1 : -1));

  const progressOf = (p: ForgeProject) => {
    const ms = p.milestones;
    if (!ms.length) return 0;
    return Math.round((ms.filter(m=>m.done).length / ms.length) * 100);
  };
  const nextTask = (p: ForgeProject): ProjectTask | undefined =>
    forge.tasks.find(t => t.projectId === p.id && t.status !== "done");

  const submitForge = () => {
    if (!draft.title.trim()) return;
    const id = "p-" + uid();
    const today = new Date().toISOString().slice(0,10);
    updateForge(f => ({
      projects: [{
        id, codename: draft.codename.trim() || `BLANK-${String(f.projects.length+1).padStart(2,"0")}`,
        title: draft.title.trim(), brief:"", why:"", successMetrics:"", rejectionCriteria:"",
        status: "on-track", priority: 5, energyDemand: 5, complexity: 5,
        color: draft.color, icon: draft.icon,
        createdAt: today, archived: false, checkinFreq:"weekly",
        budget:{actual:0,currency:"$"},
        stakeholders:[],milestones:[],premortem:[],risks:[],issues:[],qualityChecks:[],
        comms:[],scope:"",tags:[],links:[],velocityPoints:[],
      },...f.projects],
    }));
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:draft.color,count:40}}));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"NEW HEAT",sub:draft.title,color:draft.color,icon:"zap"}}));
    setShowForge(false);
    setDraft({title:"",codename:"",color:"#f59e0b",icon:"🔥"});
  };

  const COLORS = ["#f59e0b","#ea580c","#ef4444","#06b6d4","#22c55e","#a78bfa","#ec4899","#facc15"];
  const ICONS = ["🔥","⚒️","⚡","🧪","📖","💨","🏗️","🎯","🧱","🪓","🛠️","⚙️"];

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
                  <button onClick={()=>updateForge(f=>({tasks:f.tasks.map(x=>x.id===t.id?{...x,status:x.status==="done"?"todo":"done",completedAt:x.status==="done"?undefined:new Date().toISOString().slice(0,10)}:x)}))}
                    className="w-5 h-5 rounded shrink-0 flex items-center justify-center"
                    style={{
                      background: t.status==="done"?"var(--fr-green)":"transparent",
                      border:`2px solid ${t.status==="done"?"var(--fr-green)":"var(--fr-fgMuted)"}`,
                    }}>
                    {t.status==="done" && <CheckCircle2 size={12} color="#000"/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${t.status==="done"?"line-through opacity-50":""}`}>{t.title}</div>
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
