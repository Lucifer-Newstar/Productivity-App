"use client";
/** Cross-space Priority Desk for capture, filtering, due dates, and completion. */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, CalendarDays, Trash2, Search, SearchX, Plus, ListChecks, CircleDot, CheckCircle2, Gauge } from "lucide-react";
import Link from "next/link";
import { useStore } from "../lib/store";
import { SPACES } from "../lib/types";
import SpaceIcon from "./SpaceIcon";
import HomeSectionHeader from "./HomeSectionHeader";
import { localDateKey } from "../lib/localDate";
import type { Priority, SpaceId } from "../lib/types";

const priorityStyles: Record<Priority, { label: string; rank: string }> = {
  high: { label: "High", rank: "P1" }, medium: { label: "Medium", rank: "P2" }, low: { label: "Low", rank: "P3" },
};
type Filter = "all" | "active" | "completed";

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore();
  const [filter, setFilter] = useState<Filter>("active");
  const [spaceFilter, setSpaceFilter] = useState<SpaceId | "all">("all");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const filtered = tasks.filter((t) => (filter !== "active" || !t.completed) && (filter !== "completed" || t.completed) && (spaceFilter === "all" || t.space === spaceFilter) && (!query || t.title.toLowerCase().includes(query.toLowerCase())));
  const activeCount = tasks.filter((t) => !t.completed).length;
  const completed = tasks.length - activeCount;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < localDateKey()).length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!title.trim()) return; addTask({ title: title.trim(), priority, dueDate: dueDate || undefined, space: spaceFilter === "all" ? "projects" : spaceFilter }); setTitle(""); setPriority("medium"); setDueDate(""); };

  return <div className="core-section core-tasks">
    <HomeSectionHeader index="02" eyebrow="Execution queue" title="Priority Desk" description="Capture work, remove noise, and keep the next commitment obvious." icon={ListChecks} />
    <section className="core-metric-rail" aria-label="Task summary">
      <div><CircleDot/><span>Open</span><strong>{activeCount}</strong></div>
      <div><CheckCircle2/><span>Closed</span><strong>{completed}</strong></div>
      <div className={overdue ? "is-alert" : ""}><Flag/><span>Overdue</span><strong>{overdue}</strong></div>
      <div><Gauge/><span>Resolution</span><strong>{completion}%</strong></div>
    </section>

    <form onSubmit={submit} className="core-capture">
      <div className="core-capture-main"><Plus size={18}/><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Capture a concrete next action" aria-label="Task title"/><button type="submit" disabled={!title.trim()}>Add to queue</button></div>
      <div className="core-capture-options">
        <span>Priority</span>{(["high","medium","low"] as Priority[]).map(p=><button key={p} type="button" onClick={()=>setPriority(p)} className={priority===p?"is-active":""}><b>{priorityStyles[p].rank}</b> {priorityStyles[p].label}</button>)}
        <label><CalendarDays size={13}/><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} aria-label="Due date"/></label>
      </div>
    </form>

    <section className="core-workbench">
      <aside className="core-filter-panel">
        <div className="core-filter-title"><span>View</span><b>{filtered.length} shown</b></div>
        <div className="core-filter-stack">{(["all","active","completed"] as Filter[]).map(f=><button key={f} onClick={()=>setFilter(f)} className={filter===f?"is-active":""}><span>{f}</span><b>{f==="all"?tasks.length:f==="active"?activeCount:completed}</b></button>)}</div>
        <div className="core-filter-title"><span>Space</span></div>
        <div className="core-filter-stack"><button onClick={()=>setSpaceFilter("all")} className={spaceFilter==="all"?"is-active":""}><span>All spaces</span></button>{SPACES.map(s=><button key={s.id} onClick={()=>setSpaceFilter(s.id)} className={spaceFilter===s.id?"is-active":""}><SpaceIcon space={s.id} size={13}/><span>{s.name}</span></button>)}</div>
      </aside>
      <div className="core-queue">
        <div className="core-queue-toolbar"><div><h2>Action queue</h2><p>Ordered by priority and commitment.</p></div><label><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter queue" aria-label="Search tasks"/></label></div>
        <div className="core-task-list"><AnimatePresence mode="popLayout">{filtered.map(t=>{const meta=SPACES.find(s=>s.id===t.space)!; return <motion.article key={t.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-16}} className={`core-task-row priority-${t.priority} ${t.completed?"is-done":""}`}>
          <button className="core-task-check" onClick={()=>toggleTask(t.id)} aria-label={t.completed?"Reopen task":"Complete task"}>{t.completed?<CheckCircle2/>:<span/>}</button>
          <div className="core-task-copy"><strong>{t.title}</strong><p><Link href={`/${meta.id}`} style={{color:meta.color}}><SpaceIcon space={meta.id} size={11}/>{meta.name}</Link>{t.dueDate&&<span><CalendarDays size={11}/>Due {new Date(`${t.dueDate}T00:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}</p></div>
          <span className="core-priority-code">{priorityStyles[t.priority].rank}</span><button className="core-delete" onClick={()=>deleteTask(t.id)} aria-label="Delete task"><Trash2 size={15}/></button>
        </motion.article>})}</AnimatePresence>{filtered.length===0&&<div className="core-empty"><SearchX/><strong>Queue clear</strong><span>No actions match the current view.</span></div>}</div>
      </div>
    </section>
  </div>;
}
