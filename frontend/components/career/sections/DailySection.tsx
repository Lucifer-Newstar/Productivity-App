"use client";

/**
 * DailySection — daily workflow journal.
 * - Today's card: standup (3 bullets), focus time, meetings, time allocation, mood/stress, wins/learnings/challenges.
 * - History list of previous days.
 * - Auto-creates today's entry on load.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, PlusCircle, Smile, Frown, Meh, Flame, BookOpen, Target, Calendar, Clock } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { WorkDayEntry } from "../../../lib/careerTypes";

const today = () => new Date().toISOString().slice(0,10);
const emptyDay = (d: string): WorkDayEntry => ({
  date: d, standup: "", meetings: [], focusSessionsMinutes: 0,
  timeAllocation: { meetings:0, coding:0, writing:0, emails:0, planning:0, other:0 },
  workLog: "", mood: 5, stress: 5, wins: [], learnings: [], challenges: [],
});

export default function DailySection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [day, setDay] = useState<string>(today());

  // Ensure today's entry exists
  useEffect(() => {
    const t = today();
    if (!career.days.find(d => d.date === t)) {
      updateCareer(c => ({ days: [emptyDay(t), ...c.days] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entry = career.days.find(d => d.date === day) ?? emptyDay(day);

  const upd = (patch: Partial<WorkDayEntry>) => {
    updateCareer(c => {
      const exists = c.days.find(d => d.date === day);
      return { days: exists ? c.days.map(d => d.date === day ? { ...d, ...patch } : d) : [{ ...emptyDay(day), ...patch }, ...c.days] };
    });
  };

  const arrUpd = (key: "wins"|"learnings"|"challenges", text: string) => {
    if (!text.trim()) return;
    upd({ [key]: [...(entry[key] || []), text.trim()] } as any);
  };
  const arrDel = (key: "wins"|"learnings"|"challenges", i: number) => {
    upd({ [key]: (entry[key] || []).filter((_,j)=>j!==i) } as any);
  };

  const avgMood = career.days.length ? (career.days.reduce((n,d)=>n+d.mood,0)/career.days.length).toFixed(1) : "—";
  const avgStress = career.days.length ? (career.days.reduce((n,d)=>n+d.stress,0)/career.days.length).toFixed(1) : "—";
  const focusHrs = Math.round(career.days.reduce((n,d)=>n+d.focusSessionsMinutes,0)/60*10)/10;
  const streak = useMemo(() => {
    let s = 0; let d = new Date();
    for (let i=0; i<365; i++) {
      const iso = d.toISOString().slice(0,10);
      const e = career.days.find(x=>x.date===iso);
      if (e && (e.workLog || e.wins?.length || e.standup)) s++;
      else break;
      d.setDate(d.getDate()-1);
    }
    return s;
  }, [career.days]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Daily Workflow</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>Standup, meetings, focus, mood — the daily scroll.</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={day} onChange={e=>setDay(e.target.value)}
            className="bg-transparent px-3 py-2 rounded-lg text-sm outline-none"
            style={{border:`1px solid ${isDark?"rgba(139,92,246,0.4)":"rgba(139,92,246,0.5)"}`,color:isDark?"#c4b5fd":"#5b21b6"}}/>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Days logged" value={career.days.length} color="#8b5cf6"/>
        <Stat label="Avg mood" value={avgMood} color="#a3e635"/>
        <Stat label="Avg stress" value={avgStress} color="#ef4444"/>
        <Stat label="Focus hrs" value={focusHrs} color="#06b6d4"/>
      </div>

      {streak > 0 && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.4)",color:"#fb923c"}}>
          <Flame size={18}/> <span className="emperor-title text-xs tracking-widest">{streak}-day journal streak</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Standup */}
        <Card title="Standup" color="#8b5cf6" icon={<Target size={14}/>}>
          <textarea value={entry.standup??""} onChange={e=>upd({standup:e.target.value})}
            placeholder="Yesterday…&#10;Today…&#10;Blockers…" rows={4}
            className="w-full bg-transparent outline-none text-sm resize-none serif-body"
            style={{minHeight:90}}/>
        </Card>

        {/* Work log */}
        <Card title="Work Log" color="#06b6d4" icon={<BookOpen size={14}/>}>
          <textarea value={entry.workLog??""} onChange={e=>upd({workLog:e.target.value})}
            placeholder="Free-form notes on the day…" rows={4}
            className="w-full bg-transparent outline-none text-sm resize-none serif-body" style={{minHeight:90}}/>
        </Card>

        {/* Focus timer/input */}
        <Card title="Focus Time" color="#a3e635" icon={<Clock size={14}/>}>
          <div className="flex items-center gap-2">
            <input type="number" min={0} value={Math.round(entry.focusSessionsMinutes/15)*15}
              onChange={e=>upd({focusSessionsMinutes:Math.max(0,Number(e.target.value))})}
              className="bg-transparent text-2xl font-black outline-none w-24" style={{color:"#a3e635"}}/>
            <span className="text-xs emperor-title tracking-widest" style={{color:"#8b9eb0"}}>minutes</span>
            <div className="ml-auto flex gap-1">
              {[15,30,60,90].map(n => (
                <button key={n} onClick={()=>upd({focusSessionsMinutes:(entry.focusSessionsMinutes||0)+n})}
                  className="text-[10px] emperor-title px-2 py-1 rounded" style={{background:"rgba(163,230,53,0.15)",color:"#a3e635"}}>+{n}</button>
              ))}
            </div>
          </div>
        </Card>

        {/* Mood & stress */}
        <Card title="State" color="#ec4899" icon={<Smile size={14}/>}>
          <div className="space-y-2">
            <SliderRow label="Mood" value={entry.mood} color="#a3e635" onChange={v=>upd({mood:v})} icon={entry.mood>=7?<Smile size={12}/>:entry.mood<=3?<Frown size={12}/>:<Meh size={12}/>}/>
            <SliderRow label="Stress" value={entry.stress} color="#ef4444" onChange={v=>upd({stress:v})}/>
          </div>
        </Card>

        {/* Wins / Learnings / Challenges */}
        <div className="md:col-span-2 grid md:grid-cols-3 gap-3">
          <QuickList title="Wins" color="#a3e635" items={entry.wins??[]} onAdd={t=>arrUpd("wins",t)} onDel={i=>arrDel("wins",i)}/>
          <QuickList title="Learnings" color="#06b6d4" items={entry.learnings??[]} onAdd={t=>arrUpd("learnings",t)} onDel={i=>arrDel("learnings",i)}/>
          <QuickList title="Challenges" color="#ef4444" items={entry.challenges??[]} onAdd={t=>arrUpd("challenges",t)} onDel={i=>arrDel("challenges",i)}/>
        </div>
      </div>

      {/* Recent days */}
      <div>
        <h3 className="emperor-title text-xs tracking-[0.3em] mb-2" style={{color:"#8b5cf6"}}>RECENT DAYS</h3>
        <div className="space-y-1">
          {career.days.filter(d => d.date !== day).slice(0, 10).map(d => (
            <button key={d.date} onClick={()=>setDay(d.date)}
              className="w-full text-left rounded-lg p-2.5 flex items-center gap-3 text-sm hover:bg-white/5 transition"
              style={{background:isDark?"rgba(12,26,34,0.5)":"rgba(255,248,228,0.9)",border:"1px solid rgba(255,255,255,0.05)"}}>
              <span className="text-[10px] emperor-title" style={{color:"#8b9eb0"}}>{d.date}</span>
              <span className="flex-1 truncate serif-body italic" style={{color:"#c4cfd9"}}>{(d.standup||d.workLog||"—").split("\n")[0]}</span>
              <span style={{color:"#a3e635"}}>😀 {d.mood}</span>
              <span style={{color:"#fb923c"}}>🔥 {Math.round(d.focusSessionsMinutes/60*10)/10}h</span>
            </button>
          ))}
          {career.days.length <= 1 && <div className="text-xs text-center py-6" style={{color:"#6b7280"}}>No past entries yet — show up tomorrow.</div>}
        </div>
      </div>
    </div>
  );
}

function Card({title,color,icon,children}:{title:string;color:string;icon:React.ReactNode;children:React.ReactNode}) {
  return (
    <div className="rounded-xl p-4" style={{background:"rgba(12,26,34,0.6)",border:`1px solid ${color}44`}}>
      <div className="flex items-center gap-2 text-[10px] emperor-title tracking-widest mb-2" style={{color}}>{icon}{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function SliderRow({label,value,color,onChange,icon}:{label:string;value:number;color:string;onChange:(v:number)=>void;icon?:React.ReactNode}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] emperor-title tracking-widest mb-1">
        <span style={{color:"#8b9eb0"}} className="flex items-center gap-1">{icon}{label.toUpperCase()}</span>
        <span style={{color}}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full" style={{accentColor:color}}/>
    </div>
  );
}

function QuickList({title,color,items,onAdd,onDel}:{title:string;color:string;items:string[];onAdd:(t:string)=>void;onDel:(i:number)=>void}) {
  const [v,setV] = useState("");
  return (
    <div className="rounded-xl p-3" style={{background:"rgba(12,26,34,0.6)",border:`1px solid ${color}44`}}>
      <div className="text-[10px] emperor-title tracking-widest mb-2" style={{color}}>{title.toUpperCase()}</div>
      <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
        {items.length === 0 && <div className="text-[11px] italic" style={{color:"#6b7280"}}>None yet.</div>}
        {items.map((it,i) => (
          <div key={i} className="flex items-start gap-2 text-xs group">
            <span style={{color}}>•</span>
            <span className="flex-1" style={{color:"#c4cfd9"}}>{it}</span>
            <button onClick={()=>onDel(i)} className="opacity-0 group-hover:opacity-100 text-red-400">×</button>
          </div>
        ))}
      </div>
      <form onSubmit={e=>{e.preventDefault();onAdd(v);setV("");}} className="flex gap-1">
        <input value={v} onChange={e=>setV(e.target.value)} placeholder={`Add ${title.toLowerCase()}`}
          className="flex-1 bg-transparent text-[11px] px-2 py-1 rounded outline-none"
          style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
        <button className="px-2 rounded text-xs" style={{background:`${color}22`,color}}>+</button>
      </form>
    </div>
  );
}

function Stat({label,value,color}:{label:string;value:number|string;color:string}) {
  return (
    <div className="rounded-xl p-3" style={{background:"rgba(12,26,34,0.6)",border:`1px solid ${color}33`}}>
      <div className="text-[10px] emperor-title tracking-widest" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-xl font-black mt-1" style={{color:"#f3e9d2"}}>{value}</div>
    </div>
  );
}
