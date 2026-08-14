"use client";
/**
 * QuarrySection — /projects/quarry — Kanban board + Eisenhower + Effort/Impact.
 * Tasks are grouped by status (todo/doing/review/blocked/done). Drag to move
 * (click-based — no HTML5 DnD for reliability). Filter by project + today.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pickaxe, Plus, CheckCircle2, AlertTriangle, X, Timer,
  Zap, Target, Flame, Calendar, TrendingUp,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { ProjectTask, TaskStatus } from "../../../lib/forgeTypes";

const uid = () => Math.random().toString(36).slice(2,10);
const COLS: { id: TaskStatus; label: string; color: string; icon: any }[] = [
  { id: "todo",    label: "TO DO",    color: "#94a3b8", icon: Target },
  { id: "doing",   label: "FORGING",  color: "#f59e0b", icon: Flame },
  { id: "review",  label: "QUENCH",  color: "#06b6d4", icon: Timer },
  { id: "blocked", label: "JAMMED",  color: "#ef4444", icon: AlertTriangle },
  { id: "done",    label: "SHIPPED", color: "#22c55e", icon: CheckCircle2 },
];

export default function QuarrySection() {
  const { forge, updateForge } = useStore();
  const [filter, setFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(false);
  const [matrixMode, setMatrixMode] = useState<"kanban"|"eisenhower"|"effort">("kanban");
  const [adding, setAdding] = useState<{col:TaskStatus, open:boolean}>({col:"todo",open:false});
  const [newTitle, setNewTitle] = useState("");
  const [projId, setProjId] = useState<string>("");

  const activeProjects = forge.projects.filter(p => !p.archived && p.status!=="dead");

  const visibleTasks = useMemo(() => {
    let ts = forge.tasks;
    if (filter !== "all") ts = ts.filter(t => t.projectId === filter);
    if (todayOnly) ts = ts.filter(t => t.today);
    return ts;
  }, [forge.tasks, filter, todayOnly]);

  const addTask = (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    const usePid = filter!=="all" ? filter : (projId || (activeProjects[0]?.id ?? ""));
    if (!usePid) return;
    updateForge(f => ({
      tasks: [{
        id: uid(), projectId: usePid, title: newTitle.trim(),
        status, priority:"P2", pomodoros:0, energy:3, focus:3, tags:[],
        subtaskIds:[], comments:[], createdAt:new Date().toISOString().slice(0,10),
        effort:3, impact:3, today:false,
      } as any, ...f.tasks],
    }));
    setNewTitle(""); setAdding({col:status, open:false});
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#f59e0b",count:14}}));
  };

  const moveTask = (id: string, status: TaskStatus) => {
    updateForge(f => ({
      tasks: f.tasks.map(t => t.id===id ? {
        ...t, status,
        completedAt: status==="done" ? new Date().toISOString().slice(0,10) : undefined,
      } : t),
    }));
    if (status === "done") {
      window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#22c55e",count:22}}));
      window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"SHIPPED",sub:"task struck from the anvil",color:"#22c55e",icon:"check"}}));
    }
  };

  const toggleToday = (id: string) => updateForge(f=>({tasks:f.tasks.map(t=>t.id===id?{...t,today:!t.today}:t)}));
  const delTask = (id: string) => updateForge(f=>({tasks:f.tasks.filter(t=>t.id!==id)}));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-wider flex items-center gap-2">
            <Pickaxe size={26} style={{color:"var(--fr-orange)"}}/> the.quarry
          </h2>
          <p className="mono text-[11px] tracking-widest mt-1 italic" style={{color:"var(--fr-fgMuted)"}}>
            // stone, ore, tasks — break them down, move them through the heat
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-sm steel-plate p-3 relative flex flex-wrap items-center gap-2" style={{borderColor:"var(--fr-borderSoft)"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="flex gap-1">
          {(["kanban","eisenhower","effort"] as const).map(m => (
            <button key={m} onClick={()=>setMatrixMode(m)}
              className="mono text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm"
              style={{background:matrixMode===m?"var(--fr-amber)":"transparent",color:matrixMode===m?"#000":"var(--fr-fgMuted)",border:`1px solid ${matrixMode===m?"var(--fr-amber)":"var(--fr-borderSoft)"}`}}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="h-6 w-px" style={{background:"var(--fr-borderSoft)"}}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          className="mono text-[11px] px-2 py-1.5 rounded-sm outline-none"
          style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <option value="all">All projects</option>
          {activeProjects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
        </select>
        <button onClick={()=>setTodayOnly(v=>!v)}
          className="mono text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm flex items-center gap-1"
          style={{background:todayOnly?"var(--fr-cyan)":"transparent",color:todayOnly?"#000":"var(--fr-fgMuted)",border:`1px solid ${todayOnly?"var(--fr-cyan)":"var(--fr-borderSoft)"}`}}>
          <Calendar size={10}/> TODAY
        </button>
        <div className="flex-1"/>
        <div className="mono text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>
          {visibleTasks.length} BLOCKS
        </div>
      </div>

      {matrixMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {COLS.map(col => {
            const tasks = visibleTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="rounded-sm steel-plate p-3 relative" style={{borderColor:`${col.color}55`,minHeight:200}}>
                <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                <div className="flex items-center gap-2 mb-3">
                  <col.icon size={12} style={{color:col.color}}/>
                  <span className="mono text-[10px] tracking-widest font-black" style={{color:col.color}}>{col.label}</span>
                  <span className="mono text-[10px] ml-auto" style={{color:"var(--fr-fgMuted)"}}>{tasks.length}</span>
                </div>
                <div className="space-y-2">
                  {tasks.map(t => {
                    const proj = forge.projects.find(p=>p.id===t.projectId);
                    return (
                      <motion.div key={t.id} layout
                        className="rounded-sm p-2 relative"
                        style={{background:"var(--fr-card2)",border:`1px solid var(--fr-borderSoft)`,borderLeft:`3px solid ${proj?.color||"#888"}`}}>
                        <div className="flex items-start gap-1.5">
                          <button onClick={()=>moveTask(t.id, col.id==="done"?"todo":"done")}
                            className="mt-0.5 w-4 h-4 rounded-sm shrink-0 flex items-center justify-center"
                            style={{background:t.status==="done"?col.color:"transparent",border:`1.5px solid ${t.status==="done"?col.color:"var(--fr-fgMuted)"}`}}>
                            {t.status==="done" && <CheckCircle2 size={10} color="#000"/>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs leading-tight ${t.status==="done"?"line-through opacity-60":""}`}>{t.title}</div>
                            <div className="flex items-center gap-1.5 mt-1.5 mono text-[9px] tracking-widest flex-wrap">
                              <span style={{color:proj?.color}}>{proj?.icon} {proj?.codename}</span>
                              <span style={{color:t.priority==="P0"?"#ef4444":t.priority==="P1"?"#f59e0b":"var(--fr-fgMuted)"}}>{t.priority}</span>
                              {t.dueDate && <span style={{color:"var(--fr-fgMuted)"}}>⏰ {t.dueDate}</span>}
                            </div>
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {COLS.filter(c=>c.id!==col.id).map(c => (
                                <button key={c.id} onClick={()=>moveTask(t.id,c.id)}
                                  className="mono text-[8px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                                  style={{color:c.color,border:`1px solid ${c.color}55`,background:"transparent"}}>
                                  →{c.label.split(" ")[0]}
                                </button>
                              ))}
                              <button onClick={()=>toggleToday(t.id)}
                                className="mono text-[8px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                                style={{color:t.today?"var(--fr-cyan)":"var(--fr-fgMuted)",border:`1px solid ${t.today?"var(--fr-cyan)":"var(--fr-borderSoft)"}`}}>
                                {t.today?"●TODAY":"○TODAY"}
                              </button>
                              <button onClick={()=>delTask(t.id)}
                                className="ml-auto mono text-[8px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                                style={{color:"var(--fr-red)"}}>✕</button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <AnimatePresence>
                    {adding.col===col.id && adding.open ? (
                      <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        className="rounded-sm p-2" style={{background:"var(--fr-card)",border:`1px solid ${col.color}`}}>
                        <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")addTask(col.id);if(e.key==="Escape")setAdding({col:col.id,open:false});}}
                          placeholder="new block..."
                          className="w-full bg-transparent outline-none mono text-xs"
                          style={{color:"var(--fr-fg)"}}/>
                        {filter==="all" && activeProjects.length>1 && (
                          <select value={projId} onChange={e=>setProjId(e.target.value)}
                            className="mono text-[9px] mt-1 w-full px-1 py-0.5 rounded-sm outline-none"
                            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
                            <option value="">pick heat…</option>
                            {activeProjects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
                          </select>
                        )}
                        <div className="flex gap-1 mt-1">
                          <button onClick={()=>addTask(col.id)}
                            className="mono text-[9px] font-black tracking-widest px-2 py-0.5 rounded-sm"
                            style={{background:col.color,color:"#000"}}>STRIKE</button>
                          <button onClick={()=>setAdding({col:col.id,open:false})}
                            className="mono text-[9px] px-2 py-0.5 rounded-sm" style={{color:"var(--fr-fgMuted)"}}>ESC</button>
                        </div>
                      </motion.div>
                    ) : (
                      <button onClick={()=>setAdding({col:col.id,open:true})}
                        className="w-full py-1.5 rounded-sm mono text-[9px] tracking-widest flex items-center justify-center gap-1"
                        style={{color:col.color,border:`1px dashed ${col.color}55`}}>
                        <Plus size={10}/> ADD BLOCK
                      </button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {matrixMode === "eisenhower" && <EisenhowerView tasks={visibleTasks} projects={forge.projects} onMove={moveTask}/>}
      {matrixMode === "effort" && <EffortImpactView tasks={visibleTasks} projects={forge.projects}/>}
    </div>
  );
}

function EisenhowerView({tasks,projects,onMove}:{tasks:ProjectTask[];projects:any[];onMove:(id:string,s:TaskStatus)=>void}) {
  const imp = (t:ProjectTask) => (t.importance ?? 5);
  const urg = (t:ProjectTask) => (t.urgency ?? 5);
  const quads = [
    { key:"do",     title:"DO · urgent+important",    color:"#ef4444", filter:(t:ProjectTask)=>urg(t)>=5&&imp(t)>=5 },
    { key:"plan",   title:"PLAN · !urg+important",    color:"#f59e0b", filter:(t:ProjectTask)=>urg(t)<5&&imp(t)>=5 },
    { key:"delegate",title:"DELEGATE · urg+!important",color:"#06b6d4",filter:(t:ProjectTask)=>urg(t)>=5&&imp(t)<5 },
    { key:"drop",   title:"DROP · !urg+!important",   color:"#94a3b8", filter:(t:ProjectTask)=>urg(t)<5&&imp(t)<5 },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {quads.map(q=>(
        <div key={q.key} className="rounded-sm steel-plate p-4 relative min-h-[220px]" style={{borderColor:`${q.color}66`}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <div className="mono text-[10px] font-black tracking-widest mb-3" style={{color:q.color}}>{q.title}</div>
          <div className="space-y-1.5">
            {tasks.filter(q.filter).map(t=>{
              const p = projects.find(x=>x.id===t.projectId);
              return (
                <div key={t.id} className="p-2 rounded-sm flex items-center gap-2"
                  style={{background:"var(--fr-card2)",borderLeft:`3px solid ${p?.color||"#888"}`}}>
                  <button onClick={()=>onMove(t.id,"done")}
                    className="w-4 h-4 rounded-sm shrink-0"
                    style={{background:t.status==="done"?"var(--fr-green)":"transparent",border:`1.5px solid ${t.status==="done"?"var(--fr-green)":"var(--fr-fgMuted)"}`}}/>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs ${t.status==="done"?"line-through opacity-50":""}`}>{t.title}</div>
                    <div className="mono text-[9px] mt-0.5" style={{color:"var(--fr-fgMuted)"}}>{p?.icon} {p?.codename} · imp{imp(t)}/urg{urg(t)}</div>
                  </div>
                </div>
              );
            })}
            {tasks.filter(q.filter).length===0 && (
              <div className="mono text-[10px] italic text-center py-6" style={{color:"var(--fr-fgDim)"}}>— quarry empty —</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EffortImpactView({tasks,projects}:{tasks:ProjectTask[];projects:any[]}) {
  const SIZE=420; const PAD=40;
  return (
    <div className="rounded-sm steel-plate p-5 relative" style={{borderColor:"var(--fr-cyan)"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} style={{color:"var(--fr-cyan)"}}/>
        <h3 className="mono text-[11px] tracking-widest font-black" style={{color:"var(--fr-cyan)"}}>EFFORT × IMPACT</h3>
      </div>
      <div className="relative w-full mx-auto" style={{maxWidth:SIZE}}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full">
          {/* axes + quadrants */}
          <rect x={PAD} y={PAD} width={SIZE-PAD*2} height={SIZE-PAD*2} fill="rgba(6,182,212,0.03)" stroke="var(--fr-borderSoft)"/>
          <line x1={SIZE/2} y1={PAD} x2={SIZE/2} y2={SIZE-PAD} stroke="var(--fr-border)"/>
          <line x1={PAD} y1={SIZE/2} x2={SIZE-PAD} y2={SIZE/2} stroke="var(--fr-border)"/>
          <text x={PAD+4} y={PAD-6} fill="#22c55e" className="mono" fontSize="10">QUICK WINS (low effort / high impact)</text>
          <text x={SIZE-PAD-4} y={PAD-6} textAnchor="end" fill="#f59e0b" className="mono" fontSize="10">BIG BETS</text>
          <text x={PAD+4} y={SIZE-PAD+14} fill="#94a3b8" className="mono" fontSize="10">FILLER</text>
          <text x={SIZE-PAD-4} y={SIZE-PAD+14} textAnchor="end" fill="#ef4444" className="mono" fontSize="10">THANKLESS</text>
          {/* axis labels */}
          <text x={SIZE/2} y={SIZE-8} textAnchor="middle" fill="var(--fr-fgMuted)" className="mono" fontSize="9">EFFORT →</text>
          <text x={10} y={SIZE/2} textAnchor="middle" transform={`rotate(-90 10 ${SIZE/2})`} fill="var(--fr-fgMuted)" className="mono" fontSize="9">IMPACT →</text>
          {/* points */}
          {tasks.filter(t=>t.status!=="done").map(t=>{
            const p = projects.find(x=>x.id===t.projectId);
            const x = PAD + ((t.effort??3)-1)/4*(SIZE-PAD*2);
            const y = SIZE-PAD - ((t.impact??3)-1)/4*(SIZE-PAD*2);
            const score = ((t.impact??3)/(t.effort??3));
            const color = score>=1.5?"#22c55e":score>=0.8?"#f59e0b":"#ef4444";
            return (
              <g key={t.id}>
                <circle cx={x} cy={y} r={10} fill={`${color}33`} stroke={color} strokeWidth="1.5" style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
                <text x={x} y={y+3} textAnchor="middle" fill={color} className="mono" fontSize="9" fontWeight="800">
                  {(p?.icon??"●")}
                </text>
                <title>{t.title} ({p?.codename??""})</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
