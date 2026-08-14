"use client";
/**
 * QuarrySection — /projects/quarry — beefed-up Kanban + Eisenhower + Effort/Impact.
 * Now includes:
 *  - Rich task cards (priority chip, due date, aging, tags, subtask progress, pomodoro count, energy/focus mini-dots)
 *  - Expandable detail panel for editing effort/impact/importance/urgency/energy/focus/due date/tags,
 *    adding subtasks, comments, checkpoints, marking stuck
 *  - Pomodoro +25m quick-log per card
 *  - Batch-add (one-per-line) in the new-task textarea
 *  - Recurring task clone on done (if recurrence set)
 *  - Aging color (older tasks get warmer)
 *  - Today toggle, delete, move-buttons
 */
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pickaxe, Plus, CheckCircle2, AlertTriangle, X, Timer,
  Zap, Target, Flame, Calendar, TrendingUp, Coffee,
  ChevronDown, ChevronRight, MessageSquare, AlertOctagon, ListChecks,
  Clock, Pencil, Copy, Columns,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { ProjectTask, TaskStatus, StatusColumn } from "../../../lib/forgeTypes";

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);
const daysBetween = (a:string,b:string) => Math.round((+new Date(b)-+new Date(a))/86400000);
const ageColor = (createdAt:string) => {
  const d = daysBetween(createdAt, today());
  if (d > 21) return "#ef4444";
  if (d > 10) return "#f59e0b";
  return "var(--fr-fgMuted)";
};

const DEFAULT_COLS: { id: TaskStatus; label: string; color: string; icon: any }[] = [
  { id: "todo",    label: "TO DO",    color: "#94a3b8", icon: Target },
  { id: "doing",   label: "FORGING",  color: "#f59e0b", icon: Flame },
  { id: "review",  label: "QUENCH",  color: "#06b6d4", icon: Coffee },
  { id: "blocked", label: "JAMMED",  color: "#ef4444", icon: AlertTriangle },
  { id: "done",    label: "SHIPPED", color: "#22c55e", icon: CheckCircle2 },
];

const COLUMN_COLORS = ["#94a3b8","#f59e0b","#06b6d4","#ef4444","#22c55e","#a78bfa","#ec4899","#facc15","#fb923c","#818cf8"];

export default function QuarrySection() {
  const { forge, updateForge, logForgeAction } = useStore();
  const [filter, setFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(false);
  const [nextOnly, setNextOnly] = useState(false);
  const [matrixMode, setMatrixMode] = useState<"kanban"|"swimlanes"|"eisenhower"|"effort">("kanban");
  const [adding, setAdding] = useState<{col:string, open:boolean}>({col:"todo",open:false});
  const [batchText, setBatchText] = useState("");
  const [projId, setProjId] = useState<string>("");
  const [openTask, setOpenTask] = useState<string|null>(null);
  const [dragId, setDragId] = useState<string|null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [colManagerOpen, setColManagerOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState("");
  const toggleSel = (id:string) => setSelected(s=>{const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n;});
  const clearSel = () => setSelected(new Set());

  // Columns: user-defined customStatuses map to status via column id; we use `id` as the TaskStatus string
  // Custom columns use a synthetic status id like "col-xxxx"; however Quarry logic keys off TaskStatus.
  // For simplicity, custom columns just extend the 5 defaults — tasks moved there get "custom status" stored as status.
  // Since ProjectTask.status is typed as TaskStatus (todo|doing|review|blocked|done), we keep custom columns cosmetic for wave-10 polish
  // and just surface them as extra labeled buckets whose ids still map to one of 5 underlying statuses.
  // v2: store custom status separately — but we'll honor custom columns as visual add-ons only in this wave; the COLS array is the ground truth.
  const COLS = useMemo(() => {
    const custom = (forge.customStatuses||[]).map((c:StatusColumn,i)=>({ id: c.id as any, label: c.label.toUpperCase(), color: c.color, icon: Columns }));
    // If user has defined custom columns, those replace defaults
    if (custom.length >= 2) return custom;
    return DEFAULT_COLS;
  }, [forge.customStatuses]);

  // Helper: for custom cols, task moves to "todo"/"doing"/etc based on position heuristic? Simplest: middle cols = doing, last = done.
  const statusForColumn = (colId:string): TaskStatus => {
    if ((["todo","doing","review","blocked","done"] as TaskStatus[]).includes(colId as TaskStatus)) return colId as TaskStatus;
    const idx = COLS.findIndex(c=>c.id===colId);
    if (idx === COLS.length-1) return "done";
    if (idx === 0) return "todo";
    return "doing";
  };

  const addColumn = () => {
    if (!newColLabel.trim()) return;
    const col: StatusColumn = { id: "col-"+uid(), label: newColLabel.trim(), color: COLUMN_COLORS[(forge.customStatuses||[]).length % COLUMN_COLORS.length] };
    updateForge(f => ({ customStatuses: [...(f.customStatuses||[]), col] }));
    setNewColLabel("");
  };
  const removeColumn = (id:string) => {
    // Move all tasks with that column's status to "todo"
    const replacement = statusForColumn(id) === "done" ? "done" : "todo";
    updateForge(f => ({
      customStatuses: (f.customStatuses||[]).filter(c=>c.id!==id),
      tasks: f.tasks.map(t => (t.status as any)===id ? { ...t, status: replacement } : t),
    }));
  };
  const renameColumn = (id:string,label:string) => {
    updateForge(f => ({ customStatuses: (f.customStatuses||[]).map(c=>c.id===id?{...c,label}:c) }));
  };
  const batchOp = (patch: Partial<ProjectTask> & { status?: string }) => {
    if (selected.size===0) return;
    const movingToDone = patch.status === "done" || (COLS.length && COLS[COLS.length-1].id === patch.status);
    updateForge(f => ({ tasks: f.tasks.map(t => selected.has(t.id) ? { ...t, ...patch, completedAt: movingToDone?today():t.completedAt } as ProjectTask : t) }));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"BATCH APPLIED",sub:`${selected.size} blocks updated`,color:"#f59e0b",icon:"zap"}}));
    clearSel();
  };
  const batchDelete = () => {
    if (selected.size===0) return;
    if (!confirm(`Delete ${selected.size} blocks?`)) return;
    updateForge(f => ({ tasks: f.tasks.filter(t=>!selected.has(t.id)) }));
    clearSel();
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"BATCH DELETED",sub:`${selected.size} blocks melted down`,color:"#ef4444",icon:"trash"}}));
  };

  const activeProjects = forge.projects.filter(p => !p.archived && p.status!=="dead");

  const visibleTasks = useMemo(() => {
    let ts = forge.tasks;
    if (filter !== "all") ts = ts.filter(t => t.projectId === filter);
    if (todayOnly) ts = ts.filter(t => t.today);
    if (nextOnly) ts = ts.filter(t => t.nextAction);
    return ts;
  }, [forge.tasks, filter, todayOnly, nextOnly]);

  const projectById = useMemo(() => Object.fromEntries(forge.projects.map(p=>[p.id,p])), [forge.projects]);

  const patchTask = (id: string, patch: Partial<ProjectTask>) =>
    updateForge(f => ({ tasks: f.tasks.map(t => t.id===id ? { ...t, ...patch } : t) }));
  const addTasksFromBatch = (status: string) => {
    const usePid = filter!=="all" ? filter : (projId || activeProjects[0]?.id);
    if (!usePid || !batchText.trim()) return;
    const lines = batchText.split("\n").map(l=>l.trim()).filter(Boolean);
    const newTasks: ProjectTask[] = lines.map(title => ({
      id: uid(), projectId: usePid, title, status: status as TaskStatus,
      priority:"P2" as const, pomodoros:0, energy:3, focus:3, tags:[],
      subtaskIds:[], comments:[], createdAt:today(), effort:3, impact:3, importance:5, urgency:5,
    }));
    updateForge(f => ({ tasks: [...newTasks, ...f.tasks] }));
    setBatchText(""); setAdding({col:status,open:false});
    if (newTasks.length === 1) window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#f59e0b",count:14}}));
    else window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#f59e0b",count:14+newTasks.length*3}}));
  };
  const logPomo = (id: string) => {
    patchTask(id, { pomodoros:(forge.tasks.find(t=>t.id===id)?.pomodoros||0)+1, actualMins:(forge.tasks.find(t=>t.id===id)?.actualMins||0)+25 });
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"POMODORO LOGGED",sub:"+25m on the anvil",color:"#f59e0b",icon:"zap"}}));
  };
  const spawnRecurrence = (t: ProjectTask) => {
    if (!t.recurrence) return;
    const days = t.recurrence.freq==="daily"?1:t.recurrence.freq==="weekly"?7:t.recurrence.freq==="biweekly"?14:30;
    const next = new Date(); next.setDate(next.getDate()+days*t.recurrence.interval);
    const dueIso = next.toISOString().slice(0,10);
    const copy: ProjectTask = {
      ...t,
      id: uid(),
      status: "todo",
      completedAt: undefined,
      doneAt: undefined,
      dueDate: dueIso,
      pomodoros: 0, actualMins: 0,
      subtaskIds: [], comments: [],
      createdAt: today(),
      today: false, stuck: false, satisfaction: undefined,
      clonedFrom: t.id,
    };
    updateForge(f => ({ tasks: [...f.tasks, copy] }));
  };
  const isDoneStatus = (s:string) => s === "done" || (COLS.length>0 && COLS[COLS.length-1].id === s);
  const toggleTask = (id: string) => {
    const t = forge.tasks.find(x=>x.id===id); if(!t) return;
    const movingToDone = !isDoneStatus(t.status);
    const target = movingToDone ? (COLS[COLS.length-1]?.id as string || "done") : "todo";
    patchTask(id, {
      status: target as TaskStatus,
      completedAt: movingToDone ? today() : undefined,
    });
    if (movingToDone) {
      if (t.recurrence) spawnRecurrence(t);
      logForgeAction("task.ship", id, t.title.slice(0,60));
      window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#22c55e",count:22}}));
      window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"SHIPPED",sub:t.title.slice(0,50),color:"#22c55e",icon:"check"}}));
    }
  };
  const moveTask = (id: string, status: string) => {
    const t = forge.tasks.find(x=>x.id===id); if(!t) return;
    const movingToDone = isDoneStatus(status);
    patchTask(id, { status: status as TaskStatus, completedAt: movingToDone?today():undefined });
    if (movingToDone) {
      if (t.recurrence) spawnRecurrence(t);
      logForgeAction("task.ship", id, t.title.slice(0,60));
      window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#22c55e",count:22}}));
      window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"SHIPPED",sub:t.title.slice(0,50),color:"#22c55e",icon:"check"}}));
    } else {
      logForgeAction("task.move", id, `→${status}`);
    }
  };
  const delTask = (id: string) => updateForge(f=>({tasks:f.tasks.filter(t=>t.id!==id)}));
  const cloneTask = (id: string) => {
    const src = forge.tasks.find(t=>t.id===id); if (!src) return;
    const copy: ProjectTask = { ...src, id: uid(), title: src.title + " (copy)",
      createdAt: today(), completedAt: undefined, doneAt: undefined, pomodoros: 0,
      subtaskIds: [], comments: [], clonedFrom: id, today: false, stuck: false };
    updateForge(f=>({tasks:[copy,...f.tasks]}));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"CLONED",sub:copy.title.slice(0,40),color:"#06b6d4",icon:"copy",timeout:2200}}));
  };
  const toggleToday = (id: string) => {
    const t = forge.tasks.find(x=>x.id===id); if(!t)return;
    patchTask(id,{today:!t.today});
  };
  const toggleStuck = (id: string) => {
    const t = forge.tasks.find(x=>x.id===id); if(!t)return;
    patchTask(id,{stuck:!t.stuck,stuckNote:!t.stuck?(t.stuckNote||""):t.stuckNote,status:!t.stuck?"blocked":(t.status==="blocked"?"todo":t.status)});
  };
  const addSubtask = (taskId: string, title: string) => {
    const sub: ProjectTask = {
      id: uid(), projectId: forge.tasks.find(t=>t.id===taskId)!.projectId, title,
      status:"todo",priority:"P2",pomodoros:0,energy:2,focus:2,tags:[],subtaskIds:[],comments:[],
      createdAt:today(),effort:2,impact:2,importance:3,urgency:3,parentId:taskId,
    };
    updateForge(f => ({
      tasks: [...f.tasks, sub],
    }));
    patchTask(taskId, { subtaskIds: [...(forge.tasks.find(t=>t.id===taskId)!.subtaskIds||[]), sub.id] });
  };

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
          {(["kanban","swimlanes","eisenhower","effort"] as const).map(m => (
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
          <option value="all">All heats</option>
          {activeProjects.map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
        </select>
        <button onClick={()=>setTodayOnly(v=>!v)}
          className="mono text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm flex items-center gap-1"
          style={{background:todayOnly?"var(--fr-cyan)":"transparent",color:todayOnly?"#000":"var(--fr-fgMuted)",border:`1px solid ${todayOnly?"var(--fr-cyan)":"var(--fr-borderSoft)"}`}}>
          <Calendar size={10}/> TODAY
        </button>
        <button onClick={()=>{setNextOnly(v=>!v);setTodayOnly(false);}}
          className="mono text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm flex items-center gap-1"
          style={{background:nextOnly?"var(--fr-amber)":"transparent",color:nextOnly?"#000":"var(--fr-fgMuted)",border:`1px solid ${nextOnly?"var(--fr-amber)":"var(--fr-borderSoft)"}`}}>
          ▶ NEXT
        </button>
        <div className="flex-1"/>
        <div className="mono text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>
          {visibleTasks.length} BLOCKS · {visibleTasks.filter(t=>isDoneStatus(t.status)).length} SHIPPED
        </div>
        <button onClick={()=>{setBatchMode(v=>!v);clearSel();}}
          className="mono text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm"
          style={{background:batchMode?"var(--fr-orange)":"transparent",color:batchMode?"#000":"var(--fr-fgMuted)",border:`1px solid ${batchMode?"var(--fr-orange)":"var(--fr-borderSoft)"}`}}>
          {batchMode?"EXIT BATCH":"BATCH"}
        </button>
        <button onClick={()=>setColManagerOpen(v=>!v)}
          className="mono text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm flex items-center gap-1"
          style={{background:colManagerOpen?"var(--fr-violet)":"transparent",color:colManagerOpen?"#000":"var(--fr-fgMuted)",border:`1px solid ${colManagerOpen?"var(--fr-violet)":"var(--fr-borderSoft)"}`}}>
          <Columns size={10}/> COLS
        </button>
      </div>

      {/* Column manager */}
      {colManagerOpen && (
        <div className="rounded-sm steel-plate p-3 relative space-y-2" style={{borderColor:"var(--fr-violet)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <div className="mono text-[10px] tracking-widest font-black flex items-center gap-2" style={{color:"var(--fr-violet)"}}>
            <Columns size={11}/> CUSTOM COLUMNS ({(forge.customStatuses||[]).length})
            <span className="mono text-[9px] font-normal" style={{color:"var(--fr-fgMuted)"}}>replace defaults; last col = SHIPPED</span>
          </div>
          <div className="space-y-1">
            {(forge.customStatuses||[]).map(c=>(
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-sm" style={{background:c.color,border:`1px solid ${c.color}`}}/>
                <input value={c.label} onChange={e=>renameColumn(c.id,e.target.value)}
                  className="flex-1 bg-transparent outline-none mono text-xs px-2 py-1 rounded-sm"
                  style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                <button onClick={()=>removeColumn(c.id)} className="mono text-[10px] px-2 py-1 rounded-sm" style={{color:"var(--fr-red)"}}>✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newColLabel} onChange={e=>setNewColLabel(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addColumn();}}
              placeholder="+ new column label..."
              className="flex-1 bg-transparent outline-none mono text-xs px-2 py-1 rounded-sm"
              style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
            <button onClick={addColumn} className="mono text-[10px] font-black px-3 py-1 rounded-sm" style={{background:"var(--fr-violet)",color:"#000"}}>+ ADD</button>
            {(forge.customStatuses||[]).length>0 && (
              <button onClick={()=>updateForge(f=>({customStatuses:[], tasks:f.tasks.map(t=>({...t, status: (["todo","doing","review","blocked","done"] as TaskStatus[]).includes(t.status)?t.status:"todo" as TaskStatus}))}))}
                className="mono text-[10px] px-2 py-1 rounded-sm" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>RESET</button>
            )}
          </div>
        </div>
      )}

      {/* Batch ops bar */}
      {batchMode && (
        <div className="rounded-sm steel-plate p-2 relative flex items-center gap-2 flex-wrap"
          style={{borderColor:"var(--fr-orange)",background:"rgba(234,88,12,0.08)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <span className="mono text-[10px] tracking-widest font-black" style={{color:"var(--fr-orange)"}}>
            SELECTED · {selected.size}
          </span>
          <span className="mono text-[9px]" style={{color:"var(--fr-fgMuted)"}}>click cards to toggle</span>
          <div className="h-6 w-px" style={{background:"var(--fr-borderSoft)"}}/>
          {COLS.map(c=>(
            <button key={c.id} onClick={()=>batchOp({status:c.id})} disabled={selected.size===0}
              className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm disabled:opacity-30"
              style={{background:`${c.color}22`,color:c.color,border:`1px solid ${c.color}55`}}>→{c.label}</button>
          ))}
          {(["P0","P1","P2","P3"] as const).map(p=>(
            <button key={p} onClick={()=>batchOp({priority:p})} disabled={selected.size===0}
              className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm disabled:opacity-30"
              style={{background:"var(--fr-card2)",color:"var(--fr-fg)",border:"1px solid var(--fr-borderSoft)"}}>{p}</button>
          ))}
          <button onClick={()=>batchOp({today:true})} disabled={selected.size===0}
            className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm disabled:opacity-30"
            style={{background:"var(--fr-cyan)",color:"#000"}}>TODAY</button>
          <button onClick={()=>batchOp({nextAction:true})} disabled={selected.size===0}
            className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm disabled:opacity-30"
            style={{background:"var(--fr-amber)",color:"#000"}}>▶NEXT</button>
          <button onClick={batchDelete} disabled={selected.size===0}
            className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm disabled:opacity-30 ml-auto"
            style={{background:"var(--fr-red)",color:"#000"}}>MELT</button>
          <button onClick={clearSel} className="mono text-[9px] tracking-widest px-2 py-1 rounded-sm" style={{color:"var(--fr-fgMuted)"}}>CLEAR</button>
        </div>
      )}

      {matrixMode === "swimlanes" && (
        <div className="space-y-4">
          {(filter==="all" ? activeProjects : activeProjects.filter(p=>p.id===filter)).map(p => {
            const pTasks = visibleTasks.filter(t=>t.projectId===p.id && !t.parentId);
            return (
              <div key={p.id} className="rounded-sm steel-plate p-3" style={{borderColor:`${p.color}66`}}>
                <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{p.icon}</span>
                  <h4 className="text-lg font-black tracking-wide" style={{color:p.color}}>{p.codename} · {p.title}</h4>
                  <span className="ml-auto mono text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>{pTasks.length} blocks</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {COLS.map(col => {
                    const colTasks = pTasks.filter(t=>t.status===col.id);
                    return (
                      <div key={col.id} className="rounded-sm p-2 min-h-[80px]" style={{background:"var(--fr-card2)",border:`1px solid ${col.color}33`}}>
                        <div className="mono text-[9px] tracking-widest mb-1" style={{color:col.color}}>{col.label} ({colTasks.length})</div>
                        <div className="space-y-1">
                          {colTasks.slice(0,5).map(t=>(
                            <div key={t.id} className="p-1 text-[10px] rounded-sm"
                              style={{background:"var(--fr-card)",borderLeft:`2px solid ${t.stuck?"var(--fr-red)":col.color}66`}}>
                              <span className={t.status==="done"?"line-through opacity-60":""}>{t.title}</span>
                            </div>
                          ))}
                          {colTasks.length>5 && <div className="mono text-[9px] text-center" style={{color:"var(--fr-fgMuted)"}}>+{colTasks.length-5}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {matrixMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {COLS.map(col => {
            const tasks = visibleTasks.filter(t => t.status === col.id && !t.parentId);
            return (
              <div key={col.id}
                className="rounded-sm steel-plate p-3 relative"
                style={{borderColor:`${col.color}55`,minHeight:200,outline:dragId?`1px dashed ${col.color}88`:"none"}}
                onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";}}
                onDrop={e=>{e.preventDefault();if(dragId){moveTask(dragId,col.id);setDragId(null);}}}>
                <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                <div className="flex items-center gap-2 mb-3">
                  <col.icon size={12} style={{color:col.color}}/>
                  <span className="mono text-[10px] font-black tracking-widest" style={{color:col.color}}>{col.label}</span>
                  <span className="mono text-[10px] ml-auto" style={{color:"var(--fr-fgMuted)"}}>{tasks.length}</span>
                </div>
                <div className="space-y-2">
                  {tasks.map(t => {
                    const proj = projectById[t.projectId];
                    const subs = (t.subtaskIds||[]).map(sid=>forge.tasks.find(x=>x.id===sid)).filter(Boolean) as ProjectTask[];
                    const doneSubs = subs.filter(s=>s.status==="done").length;
                    const isOpen = openTask === t.id;
                    const dueCol = t.dueDate ? (t.dueDate < today() && col.id!=="done" ? "#ef4444" : t.dueDate === today() ? "#f59e0b" : "var(--fr-fgMuted)") : null;
                    const aged = ageColor(t.createdAt);
                    return (
                      <React.Fragment key={t.id}>
                      <div
                        draggable
                        onDragStart={e=>{setDragId(t.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",t.id);}}
                        onDragEnd={()=>setDragId(null)}
                        className={`rounded-sm text-xs ${dragId===t.id?"opacity-50":"cursor-grab active:cursor-grabbing"}`}
                        style={{background:"var(--fr-card2)",borderLeft:`3px solid ${t.stuck?"#ef4444":proj?.color||"#888"}`}}>
                        <div className="p-2">
                          <div className="flex items-start gap-1.5">
                            {batchMode && (
                              <input type="checkbox" checked={selected.has(t.id)} onChange={()=>toggleSel(t.id)}
                                className="mt-1 accent-amber-500 shrink-0"/>
                            )}
                            <button onClick={()=>toggleTask(t.id)}
                              className="mt-0.5 w-4 h-4 rounded-sm shrink-0 flex items-center justify-center"
                              style={{background:t.status==="done"?col.color:"transparent",border:`1.5px solid ${t.status==="done"?col.color:"var(--fr-fgMuted)"}`}}>
                              {t.status==="done" && <CheckCircle2 size={10} color="#000"/>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className={`flex items-center gap-1.5 ${t.status==="done"?"line-through opacity-60":""}`}>
                                <span className="flex-1 break-words">{t.title}</span>
                                <button onClick={()=>setOpenTask(isOpen?null:t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                                  {isOpen ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                                </button>
                              </div>
                              {t.nextAction && (
                                <div className="mt-1 inline-flex items-center gap-1 mono text-[8px] tracking-widest px-1 py-0.5 rounded-sm"
                                  style={{background:"rgba(245,158,11,0.15)",color:"var(--fr-amber)",border:"1px solid rgba(245,158,11,0.4)"}}>
                                  ▶ NEXT
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5 mono text-[8px] tracking-widest flex-wrap">
                                <span style={{color:t.priority==="P0"?"#ef4444":t.priority==="P1"?"#f59e0b":"var(--fr-fgMuted)"}}>●{t.priority}</span>
                                {t.energy && t.focus && <>
                                  <span style={{color:"var(--fr-fgDim)"}}>·</span>
                                  <span style={{color:t.energy>=4?"#ef4444":t.energy>=3?"#f59e0b":"var(--fr-fgMuted)"}}>E{t.energy}</span>
                                  <span style={{color:t.focus>=4?"#06b6d4":t.focus>=3?"#a78bfa":"var(--fr-fgMuted)"}}>F{t.focus}</span>
                                </>}
                                {t.tags.slice(0,2).map(tg=><span key={tg} style={{color:"var(--fr-fgDim)"}}>#{tg}</span>)}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 mono text-[8px] tracking-widest flex-wrap">
                                <span style={{color:proj?.color}}>{proj?.icon} {proj?.codename}</span>
                                {t.pomodoros>0 && <><span style={{color:"var(--fr-fgDim)"}}>·</span><span style={{color:"#f59e0b"}}>🍅×{t.pomodoros}</span></>}
                                {(t.actualMins||0)>0 && <><span style={{color:"var(--fr-fgDim)"}}>·</span><span style={{color:"var(--fr-fgMuted)"}}>{Math.round((t.actualMins||0)/60*10)/10}h</span></>}
                                {t.dueDate && <>
                                  <span style={{color:"var(--fr-fgDim)"}}>·</span>
                                  <span style={{color:dueCol!, display:"inline-flex",alignItems:"center",gap:2}}><Calendar size={8}/>{t.dueDate}</span>
                                </>}
                                <span style={{color:aged,marginLeft:"auto"}}>{daysBetween(t.createdAt,today())}d</span>
                              </div>
                              {subs.length>0 && (
                                <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{background:"var(--fr-borderSoft)"}}>
                                  <div className="h-full rounded-full" style={{width:`${Math.round(doneSubs/subs.length*100)}%`,background:"var(--fr-amber)",boxShadow:"0 0 4px var(--fr-amber)"}}/>
                                </div>
                              )}
                              {t.stuck && t.stuckNote && (
                                <div className="mt-1 p-1 rounded-sm mono text-[9px] italic" style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px dashed rgba(239,68,68,0.4)"}}>
                                  ⚠ {t.stuckNote}
                                </div>
                              )}
                              {(t.dependsOn||[]).length>0 && (() => {
                                const blockers = (t.dependsOn||[]).map(did=>forge.tasks.find(x=>x.id===did)).filter(Boolean);
                                const openBlockers = blockers.filter(b=>b && b.status!=="done");
                                return (
                                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                                    <span className="mono text-[8px] tracking-widest" style={{color:openBlockers.length?"#ef4444":"var(--fr-green)"}}>
                                      {openBlockers.length?"⛔BLOCKED:":"✓UNBLOCKED:"}
                                    </span>
                                    {blockers.slice(0,2).map(b=>b && (
                                      <span key={b.id} className="mono text-[8px] px-1 py-0.5 rounded-sm truncate max-w-[80px]"
                                        style={{background:b.status==="done"?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)",
                                                color:b.status==="done"?"var(--fr-green)":"#ef4444",
                                                border:`1px solid ${b.status==="done"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"}`}}
                                        title={b.title}>{b.title.slice(0,12)}{b.title.length>12?"…":""}</span>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex gap-0.5 mt-1.5 flex-wrap">
                            {COLS.filter(c=>c.id!==col.id).map(c => (
                              <button key={c.id} onClick={()=>moveTask(t.id,c.id)}
                                className="mono text-[7px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                                style={{color:c.color,border:`1px solid ${c.color}55`,background:"transparent"}}>
                                →{c.label.split(" ")[0]}
                              </button>
                            ))}
                            <button onClick={()=>logPomo(t.id)} title="Log pomodoro (+25m)"
                              className="mono text-[7px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                              style={{color:"#f59e0b",border:"1px solid #f59e0b55"}}><Timer size={8} className="inline -mt-0.5"/>+🍅</button>
                            <button onClick={()=>toggleToday(t.id)}
                              className="mono text-[7px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                              style={{color:t.today?"var(--fr-cyan)":"var(--fr-fgMuted)",border:`1px solid ${t.today?"var(--fr-cyan)":"var(--fr-borderSoft)"}`}}>
                              {t.today?"●":"○"}TODAY
                            </button>
                            <button onClick={()=>toggleStuck(t.id)}
                              className="mono text-[7px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                              style={{color:t.stuck?"#ef4444":"var(--fr-fgMuted)",border:`1px solid ${t.stuck?"#ef4444":"var(--fr-borderSoft)"}`}}>
                              {t.stuck?"UN-JAM":"JAM"}
                            </button>
                            <button onClick={()=>cloneTask(t.id)} title="Clone"
                              className="mono text-[7px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                              style={{color:"#a78bfa"}}><Copy size={8} className="inline -mt-0.5"/></button>
                            <button onClick={()=>delTask(t.id)}
                              className="ml-auto mono text-[7px] font-bold tracking-widest px-1 py-0.5 rounded-sm"
                              style={{color:"var(--fr-red)"}}>✕</button>
                          </div>
                        </div>
                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                              className="overflow-hidden border-t" style={{borderColor:"var(--fr-borderSoft)"}}>
                              <TaskEditor task={t} onPatch={(p)=>patchTask(t.id,p)} onAddSub={(ttl)=>addSubtask(t.id,ttl)} subs={subs} onToggleSub={(sid)=>{const s=forge.tasks.find(x=>x.id===sid);if(s)patchTask(sid,{status:s.status==="done"?"todo":"done",completedAt:s.status==="done"?undefined:today()});}} projectColor={proj?.color||"#f59e0b"}/>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* Inline indented subtasks under parent */}
                      {subs.length>0 && (
                        <div className="pl-5 mt-1 space-y-1 relative">
                          <span aria-hidden className="absolute left-2 top-0 bottom-2 w-px" style={{background:`${proj?.color||"#f59e0b"}55`}}/>
                          {subs.map(s => (
                            <div key={s.id}
                              className="flex items-center gap-1.5 p-1.5 rounded-sm text-[11px]"
                              style={{background:"var(--fr-card2)",borderLeft:`2px solid ${proj?.color||"#f59e0b"}66`}}>
                              <button onClick={()=>{patchTask(s.id,{status:s.status==="done"?"todo":"done",completedAt:s.status==="done"?undefined:today()});}}
                                className="w-3.5 h-3.5 rounded-sm shrink-0 flex items-center justify-center"
                                style={{background:s.status==="done"?col.color:"transparent",border:`1.5px solid ${s.status==="done"?col.color:"var(--fr-fgMuted)"}`}}>
                                {s.status==="done" && <CheckCircle2 size={8} color="#000"/>}
                              </button>
                              <span className={`flex-1 ${s.status==="done"?"line-through opacity-60":""}`}>{s.title}</span>
                              <button onClick={()=>{
                                // delete subtask + remove from parent subtaskIds
                                updateForge(f=>({
                                  tasks: f.tasks
                                    .filter(x=>x.id!==s.id)
                                    .map(x=>x.id===t.id?{...x,subtaskIds:(x.subtaskIds||[]).filter(sid=>sid!==s.id)}:x)
                                }));
                              }}
                                className="opacity-40 hover:opacity-100" style={{color:"var(--fr-red)"}}><X size={9}/></button>
                            </div>
                          ))}
                        </div>
                      )}
                      </React.Fragment>
                    );
                  })}
                  <AnimatePresence>
                    {adding.col===col.id && adding.open ? (
                      <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        className="rounded-sm p-2" style={{background:"var(--fr-card)",border:`1px solid ${col.color}`}}>
                        <textarea autoFocus value={batchText} onChange={e=>setBatchText(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))addTasksFromBatch(col.id);if(e.key==="Escape")setAdding({col:col.id,open:false});}}
                          placeholder={"one block per line..."} rows={3}
                          className="w-full bg-transparent outline-none mono text-[11px] resize-none"
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
                          <button onClick={()=>addTasksFromBatch(col.id)}
                            className="mono text-[9px] font-black tracking-widest px-2 py-0.5 rounded-sm"
                            style={{background:col.color,color:"#000"}}>STRIKE</button>
                          <button onClick={()=>setAdding({col:col.id,open:false})}
                            className="mono text-[9px] px-2 py-0.5 rounded-sm" style={{color:"var(--fr-fgMuted)"}}>ESC</button>
                        </div>
                      </motion.div>
                    ) : (
                      <button onClick={()=>{setAdding({col:col.id,open:true});setProjId(filter!=="all"?filter:"");}}
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

      {matrixMode==="eisenhower" && <EisenhowerView tasks={visibleTasks} projects={projectById} onMove={moveTask}/>}
      {matrixMode==="effort" && <EffortImpactView tasks={visibleTasks.filter(t=>t.status!=="done")} projects={projectById}/>}
    </div>
  );
}

/* -------------------- Task editor (expanded card) -------------------- */
function TaskEditor({task,onPatch,onAddSub,subs,onToggleSub,projectColor}:{
  task: ProjectTask; onPatch:(p:Partial<ProjectTask>)=>void;
  onAddSub:(title:string)=>void; subs:ProjectTask[]; onToggleSub:(id:string)=>void; projectColor:string;
}) {
  const [subText,setSubText] = useState("");
  const [tagText,setTagText] = useState("");
  const Slider = ({label,value,min=1,max=5,onChange,color}:{label:string;value:number;min?:number;max?:number;onChange:(v:number)=>void;color:string}) => (
    <div>
      <div className="flex justify-between mono text-[8px] tracking-widest mb-0.5">
        <span style={{color:"var(--fr-fgMuted)"}}>{label}</span><span style={{color}}>{value}/{max}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="w-full" style={{accentColor:color}}/>
    </div>
  );
  return (
    <div className="p-2 space-y-2" style={{background:"rgba(0,0,0,0.15)"}}>
      <input value={task.title} onChange={e=>onPatch({title:e.target.value})}
        className="w-full bg-transparent outline-none mono text-xs font-bold" style={{color:"var(--fr-fg)"}}/>
      <textarea value={task.notes||""} onChange={e=>onPatch({notes:e.target.value})} rows={2}
        placeholder="notes…"
        className="w-full bg-transparent outline-none pencil text-[11px] resize-none rounded-sm p-1"
        style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <div className="mono text-[8px] tracking-widest mb-0.5" style={{color:"var(--fr-fgMuted)"}}>DUE</div>
          <input type="date" value={task.dueDate||""} onChange={e=>onPatch({dueDate:e.target.value||undefined})}
            className="w-full bg-transparent outline-none mono text-[9px] p-1 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        </div>
        <div>
          <div className="mono text-[8px] tracking-widest mb-0.5" style={{color:"var(--fr-fgMuted)"}}>EST (m)</div>
          <input type="number" value={task.estimateMins||""} onChange={e=>onPatch({estimateMins:e.target.value?Number(e.target.value):undefined})}
            className="w-full bg-transparent outline-none mono text-[9px] p-1 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        </div>
        <div>
          <div className="mono text-[8px] tracking-widest mb-0.5" style={{color:"var(--fr-fgMuted)"}}>ACT (m)</div>
          <input type="number" value={task.actualMins||0} onChange={e=>onPatch({actualMins:Number(e.target.value)||0})}
            className="w-full bg-transparent outline-none mono text-[9px] p-1 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        </div>
        <div>
          <div className="mono text-[8px] tracking-widest mb-0.5" style={{color:"var(--fr-fgMuted)"}}>PRIO</div>
          <select value={task.priority} onChange={e=>onPatch({priority:e.target.value as any})}
            className="w-full bg-transparent outline-none mono text-[9px] p-1 rounded-sm"
            style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Slider label="EFFORT" value={task.effort||3} max={5} onChange={v=>onPatch({effort:v as 1|2|3|4|5})} color="#ef4444"/>
        <Slider label="IMPACT" value={task.impact||3} max={5} onChange={v=>onPatch({impact:v as 1|2|3|4|5})} color="#22c55e"/>
        <Slider label="ENERGY" value={task.energy} max={5} onChange={v=>onPatch({energy:v as 1|2|3|4|5})} color="#f59e0b"/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Slider label="FOCUS" value={task.focus} max={5} onChange={v=>onPatch({focus:v as 1|2|3|4|5})} color="#06b6d4"/>
        <Slider label="IMPORTANCE" value={task.importance||5} max={10} onChange={v=>onPatch({importance:v})} color="#a78bfa"/>
      </div>
      <div>
        <div className="mono text-[8px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>URGENCY: {task.urgency||5}/10</div>
        <input type="range" min={1} max={10} value={task.urgency||5} onChange={e=>onPatch({urgency:Number(e.target.value)})} className="w-full" style={{accentColor:projectColor}}/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Slider label="DIFFICULTY" value={task.difficulty||5} max={10} onChange={v=>onPatch({difficulty:v})} color="#ec4899"/>
        <div>
          <div className="mono text-[8px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>REPEAT</div>
          <select value={task.recurrence?`${task.recurrence.freq}:${task.recurrence.interval}`:"none"}
            onChange={e=>{
              const v=e.target.value;
              if(v==="none") return onPatch({recurrence:undefined});
              const [freq,interval]=v.split(":");
              onPatch({recurrence:{freq:freq as any,interval:Number(interval)}});
            }}
            className="w-full mono text-[10px] px-1 py-0.5 rounded-sm outline-none"
            style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="none">one-off</option>
            <option value="daily:1">daily</option>
            <option value="weekly:1">weekly</option>
            <option value="biweekly:1">biweekly</option>
            <option value="monthly:1">monthly</option>
          </select>
        </div>
      </div>
      {task.status==="done" && (
        <div>
          <div className="mono text-[8px] tracking-widest mb-1" style={{color:"var(--fr-green)"}}>✓ HOW'D IT GO?</div>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>onPatch({satisfaction:n})}
                className="flex-1 py-1 rounded-sm text-sm"
                style={{background:(task.satisfaction||0)>=n?"var(--fr-green)":"var(--fr-card2)",
                        border:"1px solid var(--fr-borderSoft)",
                        color:(task.satisfaction||0)>=n?"#000":"var(--fr-fgMuted)"}}>{["😫","😕","😐","🙂","🔥"][n-1]}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="mono text-[8px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>TAGS</div>
        <div className="flex flex-wrap gap-1 mb-1">
          {task.tags.map(tg=>(
            <span key={tg} className="mono text-[8px] px-1 py-0.5 rounded-sm flex items-center gap-1"
              style={{background:`${projectColor}22`,color:projectColor,border:`1px solid ${projectColor}55`}}>
              #{tg}
              <button onClick={()=>onPatch({tags:task.tags.filter(x=>x!==tg)})} style={{color:"var(--fr-red)"}}>×</button>
            </span>
          ))}
        </div>
        <input value={tagText} onChange={e=>setTagText(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&tagText.trim()){onPatch({tags:[...task.tags,tagText.trim()]});setTagText("");}}}
          placeholder="+tag"
          className="w-full bg-transparent outline-none mono text-[10px] px-1 py-0.5 rounded-sm"
          style={{border:"1px dashed var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      </div>
      <div>
        <div className="mono text-[8px] tracking-widest mb-1 flex items-center gap-1" style={{color:"var(--fr-fgMuted)"}}>
          <ListChecks size={8}/> SUBTASKS ({subs.filter(s=>s.status==="done").length}/{subs.length})
        </div>
        <div className="space-y-0.5 mb-1">
          {subs.map(s=>(
            <div key={s.id} className="flex items-center gap-1 mono text-[10px]">
              <button onClick={()=>onToggleSub(s.id)}
                className="w-3 h-3 rounded-sm shrink-0"
                style={{background:s.status==="done"?"var(--fr-green)":"transparent",border:`1px solid ${s.status==="done"?"var(--fr-green)":"var(--fr-fgMuted)"}`}}>
                {s.status==="done" && <CheckCircle2 size={8} color="#000"/>}
              </button>
              <span className={s.status==="done"?"line-through opacity-60":""}>{s.title}</span>
            </div>
          ))}
        </div>
        <input value={subText} onChange={e=>setSubText(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&subText.trim()){onAddSub(subText.trim());setSubText("");}}}
          placeholder="+subtask"
          className="w-full bg-transparent outline-none mono text-[10px] px-1 py-0.5 rounded-sm"
          style={{border:"1px dashed var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      </div>
      <div>
        <div className="mono text-[8px] tracking-widest mb-1 flex items-center gap-1" style={{color:"var(--fr-fgMuted)"}}>
          <MessageSquare size={8}/> STUCK / NOTE
        </div>
        <textarea value={task.stuckNote||""} onChange={e=>onPatch({stuckNote:e.target.value})} rows={2}
          placeholder="What's blocking? Any notes?"
          className="w-full bg-transparent outline-none pencil text-[11px] p-1 rounded-sm resize-none"
          style={{border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      </div>
      <DependsEditor task={task}/>
      <div className="flex items-center gap-2">
        <button onClick={()=>onPatch({nextAction:!(task.nextAction)})}
          className="flex-1 mono text-[8px] font-bold tracking-widest px-2 py-1 rounded-sm"
          style={{background:task.nextAction?"var(--fr-amber)":"transparent",color:task.nextAction?"#000":"var(--fr-fgMuted)",border:`1px solid ${task.nextAction?"var(--fr-amber)":"var(--fr-borderSoft)"}`}}>
          ▶ NEXT ACTION
        </button>
      </div>
    </div>
  );
}

function DependsEditor({task}:{task:ProjectTask}){
  // Uses setDep in closure via parent; but we don't have direct access to forge/updateForge here.
  // Accept via context: useStore() locally.
  const { forge, updateForge } = useStore();
  const others = forge.tasks.filter(x=>x.projectId===task.projectId && x.id!==task.id && !x.parentId);
  const sel = (task.dependsOn||[]).slice();
  const toggle = (id:string) => {
    const next = sel.includes(id) ? sel.filter(x=>x!==id) : [...sel,id];
    updateForge(f => ({ tasks: f.tasks.map(t => t.id===task.id ? { ...t, dependsOn: next } : t) }));
  };
  return (
    <div>
      <div className="mono text-[8px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>DEPENDS ON ({sel.length})</div>
      <div className="max-h-20 overflow-auto space-y-0.5">
        {others.slice(0,12).map(o=>(
          <label key={o.id} className="flex items-center gap-1 mono text-[9px]">
            <input type="checkbox" checked={sel.includes(o.id)} onChange={()=>toggle(o.id)}/>
            <span className={o.status==="done"?"line-through opacity-50":""}>{o.title.slice(0,36)}</span>
          </label>
        ))}
        {others.length===0 && <div className="mono text-[9px] italic" style={{color:"var(--fr-fgDim)"}}>no other blocks yet</div>}
      </div>
    </div>
  );
}

function EisenhowerView({tasks,projects,onMove}:{tasks:ProjectTask[];projects:Record<string,any>;onMove:(id:string,s:TaskStatus)=>void}) {
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
              const p = projects[t.projectId];
              return (
                <div key={t.id} className="p-2 rounded-sm flex items-center gap-2 text-xs"
                  style={{background:"var(--fr-card2)",borderLeft:`3px solid ${p?.color||"#888"}`}}>
                  <button onClick={()=>onMove(t.id,t.status==="done"?"todo":"done")}
                    className="w-4 h-4 rounded-sm shrink-0"
                    style={{background:t.status==="done"?q.color:"transparent",border:`1.5px solid ${t.status==="done"?q.color:"var(--fr-fgMuted)"}`}}>
                    {t.status==="done" && <CheckCircle2 size={10} color="#000"/>}
                  </button>
                  <span className={`flex-1 ${t.status==="done"?"line-through opacity-60":""}`}>{t.title}</span>
                  <span className="mono text-[8px]" style={{color:"var(--fr-fgMuted)"}}>imp{imp(t)}/urg{urg(t)}</span>
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

function EffortImpactView({tasks,projects}:{tasks:ProjectTask[];projects:Record<string,any>}) {
  const SIZE=480; const PAD=50;
  return (
    <div className="rounded-sm steel-plate p-5 relative" style={{borderColor:"var(--fr-cyan)"}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} style={{color:"var(--fr-cyan)"}}/>
        <h3 className="mono text-[11px] tracking-widest font-black" style={{color:"var(--fr-cyan)"}}>EFFORT × IMPACT</h3>
        <span className="mono text-[10px] ml-auto" style={{color:"var(--fr-fgMuted)"}}>bubbles sized by pomodoros logged</span>
      </div>
      <div className="relative w-full mx-auto" style={{maxWidth:SIZE}}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full">
          <rect x={PAD} y={PAD} width={SIZE-PAD*2} height={SIZE-PAD*2} fill="rgba(6,182,212,0.03)" stroke="var(--fr-borderSoft)"/>
          <line x1={SIZE/2} y1={PAD} x2={SIZE/2} y2={SIZE-PAD} stroke="var(--fr-border)"/>
          <line x1={PAD} y1={SIZE/2} x2={SIZE-PAD} y2={SIZE/2} stroke="var(--fr-border)"/>
          <text x={PAD+4} y={PAD-8} fill="#22c55e" className="mono" fontSize="10" fontFamily="JetBrains Mono,monospace">QUICK WINS</text>
          <text x={SIZE-PAD-4} y={PAD-8} textAnchor="end" fill="#f59e0b" className="mono" fontSize="10" fontFamily="JetBrains Mono,monospace">BIG BETS</text>
          <text x={PAD+4} y={SIZE-PAD+16} fill="#94a3b8" className="mono" fontSize="10" fontFamily="JetBrains Mono,monospace">FILLER</text>
          <text x={SIZE-PAD-4} y={SIZE-PAD+16} textAnchor="end" fill="#ef4444" className="mono" fontSize="10" fontFamily="JetBrains Mono,monospace">THANKLESS</text>
          <text x={SIZE/2} y={SIZE-14} textAnchor="middle" fill="var(--fr-fgMuted)" className="mono" fontSize="10" fontFamily="JetBrains Mono,monospace">EFFORT →</text>
          <text x={14} y={SIZE/2} textAnchor="middle" transform={`rotate(-90 14 ${SIZE/2})`} fill="var(--fr-fgMuted)" className="mono" fontSize="10" fontFamily="JetBrains Mono,monospace">IMPACT →</text>
          {tasks.map(t=>{
            const p = projects[t.projectId];
            const x = PAD + ((t.effort??3)-1)/4*(SIZE-PAD*2);
            const y = SIZE-PAD - ((t.impact??3)-1)/4*(SIZE-PAD*2);
            const score = ((t.impact??3)/(t.effort??3));
            const color = score>=1.5?"#22c55e":score>=0.8?"#f59e0b":"#ef4444";
            const r = 8 + Math.min(12,(t.pomodoros||0)*1.5);
            return (
              <g key={t.id}>
                <circle cx={x} cy={y} r={r+4} fill={`${color}22`} stroke={color} strokeWidth="1.5" style={{filter:`drop-shadow(0 0 6px ${color})`}}>
                  <title>{t.title} ({p?.codename||""}) · E{t.effort}/I{t.impact} · score {score.toFixed(1)}</title>
                </circle>
                <text x={x} y={y+3} textAnchor="middle" fill={color} className="mono" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono,monospace">
                  {p?.icon??"●"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
