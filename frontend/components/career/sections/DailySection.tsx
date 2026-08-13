"use client";

/**
 * DailySection — daily workflow journal.
 * - Today's card: standup (3 bullets), focus time (live pomodori), meetings (with ROI),
 *   time allocation doughnut, mood/stress, wins/learnings/challenges.
 * - History list of previous days.
 * - Auto-creates today's entry on load.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, PlusCircle, Smile, Frown, Meh, Flame, BookOpen, Target,
  Calendar, Clock, Play, Pause, RotateCcw, Timer, Users, Trash2, Plus,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { WorkDayEntry, MeetingEntry } from "../../../lib/careerTypes";

const today = () => new Date().toISOString().slice(0,10);
const uid = () => Math.random().toString(36).slice(2,10);
const emptyDay = (d: string): WorkDayEntry => ({
  date: d, standup: "", meetings: [], focusSessionsMinutes: 0,
  timeAllocation: { meetings:0, coding:0, writing:0, emails:0, planning:0, other:0 },
  workLog: "", mood: 5, stress: 5, wins: [], learnings: [], challenges: [],
});

export default function DailySection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [day, setDay] = useState<string>(today());

  // Live focus timer (runs via setInterval; persists to the day's focusSessionsMinutes on tick+stop).
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds in current session
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset live timer when switching days.
    setElapsed(0); setRunning(false);
  }, [day]);

  useEffect(() => {
    if (running) {
      const start = Date.now() - elapsed * 1000;
      tickRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - start)/1000);
        setElapsed(secs);
        // Persist every 15 seconds so a refresh doesn't eat time.
        if (secs % 15 === 0) commitFocus(secs);
      }, 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current); tickRef.current = null;
      if (elapsed > 0) commitFocus(elapsed);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

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

  // Persist a live-timer session into focusSessionsMinutes (round seconds down to minutes conservatively).
  const commitFocus = (secs: number) => {
    const addMin = Math.max(0, Math.floor(secs/60));
    if (addMin <= 0) return;
    upd({ focusSessionsMinutes: (entry.focusSessionsMinutes||0) + addMin });
    setElapsed(0);
  };

  const resetTimer = () => { setRunning(false); setElapsed(0); };
  const addManual = (n: number) => upd({ focusSessionsMinutes: (entry.focusSessionsMinutes||0) + n });

  const arrUpd = (key: "wins"|"learnings"|"challenges", text: string) => {
    if (!text.trim()) return;
    upd({ [key]: [...(entry[key] || []), text.trim()] } as any);
  };
  const arrDel = (key: "wins"|"learnings"|"challenges", i: number) => {
    upd({ [key]: (entry[key] || []).filter((_,j)=>j!==i) } as any);
  };

  // --- Meeting CRUD ---
  const addMeeting = () => {
    const m: MeetingEntry = { id: uid(), title: "New meeting", date: day, durationMin: 30, roiScore: 3 };
    upd({ meetings: [...(entry.meetings||[]), m] });
  };
  const updMeeting = (id: string, patch: Partial<MeetingEntry>) => {
    upd({ meetings: (entry.meetings||[]).map(m => m.id===id ? {...m,...patch} : m) });
  };
  const delMeeting = (id: string) => {
    upd({ meetings: (entry.meetings||[]).filter(m => m.id !== id) });
  };

  const totalFocusMin = (entry.focusSessionsMinutes||0) + Math.floor(elapsed/60);
  const totalMeetingMin = (entry.meetings||[]).reduce((n,m)=>n+(m.durationMin||0),0);
  const avgMood = career.days.length ? (career.days.reduce((n,d)=>n+d.mood,0)/career.days.length).toFixed(1) : "—";
  const avgStress = career.days.length ? (career.days.reduce((n,d)=>n+d.stress,0)/career.days.length).toFixed(1) : "—";
  const focusHrs = Math.round(career.days.reduce((n,d)=>n+d.focusSessionsMinutes,0)/60*10)/10;
  const totalMeetings = career.days.reduce((n,d)=>n+(d.meetings?.length||0),0);
  const avgROI = (() => {
    const all = career.days.flatMap(d => d.meetings||[]).map(m=>m.roiScore).filter((v): v is number => typeof v === "number");
    return all.length ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(1) : "—";
  })();

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

  const isToday = day === today();
  const mm = String(Math.floor(elapsed/60)).padStart(2,"0");
  const ss = String(elapsed%60).padStart(2,"0");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Daily Workflow</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>Standup, meetings, deep work, mood — the daily scroll.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] emperor-title tracking-widest"
                 style={{background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.4)",color:"#fb923c"}}>
              <Flame size={12}/> {streak}-DAY
            </div>
          )}
          <input type="date" value={day} onChange={e=>setDay(e.target.value)}
            className="bg-transparent px-3 py-2 rounded-lg text-sm outline-none"
            style={{border:`1px solid ${isDark?"rgba(139,92,246,0.4)":"rgba(139,92,246,0.5)"}`,color:isDark?"#c4b5fd":"#5b21b6"}}/>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Days logged" value={career.days.length} color="#8b5cf6"/>
        <Stat label="Avg mood" value={avgMood} color="#a3e635"/>
        <Stat label="Avg stress" value={avgStress} color="#ef4444"/>
        <Stat label="Focus hrs" value={focusHrs} color="#06b6d4"/>
        <Stat label="Meetings / avg ROI" value={`${totalMeetings} · ${avgROI}`} color="#f59e0b"/>
      </div>

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
        <Card title="Deep Focus" color="#a3e635" icon={<Timer size={14}/>}>
          <div className="flex items-center gap-3">
            <div className="font-mono text-4xl font-black tabular-nums" style={{color: running ? "#fbbf24" : "#a3e635", textShadow: running ? "0 0 16px rgba(251,191,36,0.6)" : "none"}}>
              {mm}:{ss}
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={()=>setRunning(r=>!r)} disabled={!isToday}
                className="p-2 rounded-lg transition hover:scale-105 disabled:opacity-40"
                style={{background: running ? "rgba(239,68,68,0.2)" : "rgba(163,230,53,0.2)", color: running ? "#f87171" : "#a3e635", border:`1px solid ${running?"rgba(239,68,68,0.4)":"rgba(163,230,53,0.4)"}`}}>
                {running ? <Pause size={14}/> : <Play size={14}/>}
              </button>
              <button onClick={resetTimer} disabled={!isToday || elapsed===0}
                className="p-2 rounded-lg transition disabled:opacity-40"
                style={{background:"rgba(255,255,255,0.05)",color:"#8b9eb0",border:"1px solid rgba(255,255,255,0.08)"}}>
                <RotateCcw size={12}/>
              </button>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[9px] emperor-title tracking-widest" style={{color:"#8b9eb0"}}>TODAY</div>
              <div className="text-xl font-black" style={{color:"#f3e9d2"}}>{Math.round(totalFocusMin/60*10)/10}h</div>
            </div>
          </div>
          <div className="flex gap-1 mt-3 flex-wrap">
            {[15,30,60,90].map(n => (
              <button key={n} onClick={()=>addManual(n)} disabled={!isToday}
                className="text-[10px] emperor-title px-2 py-1 rounded disabled:opacity-40"
                style={{background:"rgba(163,230,53,0.15)",color:"#a3e635"}}>+{n}m</button>
            ))}
          </div>
          {!isToday && <div className="text-[10px] mt-2" style={{color:"#6b7280"}}>Timer disabled for past days.</div>}
        </Card>

        {/* Time allocation doughnut */}
        <Card title="Time Allocation" color="#d4af37" icon={<Clock size={14}/>}>
          <TimeDonut meetings={totalMeetingMin} coding={entry.timeAllocation?.coding||0} writing={entry.timeAllocation?.writing||0}
                     emails={entry.timeAllocation?.emails||0} planning={entry.timeAllocation?.planning||0}
                     other={entry.timeAllocation?.other||0} focus={totalFocusMin}/>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {([
              ["coding","#06b6d4"], ["writing","#d4af37"], ["emails","#8b5cf6"],
              ["planning","#ec4899"], ["other","#94a3b8"],
            ] as const).map(([k,c]) => (
              <div key={k} className="flex items-center gap-1 text-[10px]">
                <span style={{width:8,height:8,background:c,borderRadius:2}}/>
                <span style={{color:"#8b9eb0"}} className="emperor-title tracking-widest uppercase flex-1">{k}</span>
                <input type="number" min={0} value={(entry.timeAllocation as any)?.[k]||0}
                  onChange={e=>{
                    const base = entry.timeAllocation || { meetings:0, coding:0, writing:0, emails:0, planning:0, other:0 };
                    upd({ timeAllocation: { ...base, meetings: totalMeetingMin, [k]: Math.max(0,Number(e.target.value)) } });
                  }}
                  className="w-10 bg-transparent text-right outline-none" style={{color:"#f3e9d2"}}/>
              </div>
            ))}
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

        {/* Meetings */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="emperor-title text-xs tracking-[0.3em] flex items-center gap-2" style={{color:"#f59e0b"}}>
              <Users size={14}/> MEETINGS · {totalMeetingMin}min
            </h3>
            <button onClick={addMeeting} disabled={!isToday}
              className="text-[10px] emperor-title tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-40"
              style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24",border:"1px solid rgba(245,158,11,0.4)"}}>
              <Plus size={12}/> ADD
            </button>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {(entry.meetings||[]).map(m => <MeetingRow key={m.id} m={m} upd={p=>updMeeting(m.id,p)} del={()=>delMeeting(m.id)} isToday={isToday}/>)}
            </AnimatePresence>
            {(entry.meetings||[]).length === 0 && (
              <div className="rounded-xl p-4 text-center text-xs italic serif-body" style={{color:"#6b7280",border:"1px dashed rgba(245,158,11,0.25)"}}>
                No meetings logged. Enjoy the silence.
              </div>
            )}
          </div>
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
              <span className="flex-1 truncate serif-body italic" style={{color:"#c4cfd9"}}>{(d.standup||d.workLog||"—").split("\
")[0]}</span>
              <span style={{color:"#a3e635"}}>😀 {d.mood}</span>
              <span style={{color:"#fb923c"}}>🔥 {Math.round(d.focusSessionsMinutes/60*10)/10}h</span>
              {(d.meetings?.length||0) > 0 && <span style={{color:"#f59e0b"}}>👥 {d.meetings!.length}</span>}
            </button>
          ))}
          {career.days.length <= 1 && <div className="text-xs text-center py-6" style={{color:"#6b7280"}}>No past entries yet — show up tomorrow.</div>}
        </div>
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------

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

function MeetingRow({ m, upd, del, isToday }: { m: MeetingEntry; upd: (p: Partial<MeetingEntry>)=>void; del: ()=>void; isToday: boolean }) {
  const [open, setOpen] = useState(false);
  const roiColors = ["#7f1d1d","#b91c1c","#f59e0b","#84cc16","#10b981"];
  const roi = m.roiScore ?? 3;
  return (
    <motion.div layout initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,height:0}}
      className="rounded-xl p-3" style={{background:"rgba(12,26,34,0.45)",border:`1px solid ${roiColors[roi-1]}55`}}>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={m.title} onChange={e=>upd({title:e.target.value})} disabled={!isToday}
          className="flex-1 min-w-[120px] bg-transparent font-bold text-sm outline-none" style={{color:"#fde68a"}}/>
        <input type="number" min={5} step={5} value={m.durationMin} onChange={e=>upd({durationMin:Math.max(0,Number(e.target.value))})}
          disabled={!isToday}
          className="bg-transparent w-14 text-right text-sm outline-none" style={{color:"#fbbf24"}}/>
        <span className="text-[10px] emperor-title" style={{color:"#8b9eb0"}}>min</span>
        <div className="flex gap-0.5 ml-auto">
          {[1,2,3,4,5].map(n => (
            <button key={n} disabled={!isToday} onClick={()=>upd({roiScore:n})}
              className="w-5 h-5 rounded-sm text-[10px] font-black transition disabled:opacity-50"
              style={{ background: n<=roi ? roiColors[n-1] : "rgba(255,255,255,0.06)", color: n<=roi ? "#0a0709" : "#6b7280" }}>
              {n}
            </button>
          ))}
        </div>
        <button onClick={()=>setOpen(o=>!o)} className="text-[10px] emperor-title tracking-widest px-2 py-1 rounded"
          style={{background:"rgba(245,158,11,0.12)",color:"#fbbf24"}}>{open?"HIDE":"NOTES"}</button>
        <button onClick={del} disabled={!isToday} className="p-1 text-red-400 hover:bg-red-500/20 rounded disabled:opacity-40"><Trash2 size={12}/></button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden mt-2 space-y-2">
            <input value={m.attendees??""} onChange={e=>upd({attendees:e.target.value})} disabled={!isToday}
              placeholder="Attendees" className="w-full bg-transparent text-xs px-2 py-1.5 rounded outline-none"
              style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
            <textarea value={m.plannedAgenda??""} onChange={e=>upd({plannedAgenda:e.target.value})} disabled={!isToday}
              placeholder="Agenda / planned talking points" rows={2}
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded outline-none resize-none"
              style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
            <textarea value={m.actualDiscussion??""} onChange={e=>upd({actualDiscussion:e.target.value})} disabled={!isToday}
              placeholder="Actual discussion / notes" rows={2}
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded outline-none resize-none"
              style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
            <textarea value={m.decisions??""} onChange={e=>upd({decisions:e.target.value})} disabled={!isToday}
              placeholder="Decisions made" rows={2}
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded outline-none resize-none"
              style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
            <textarea value={m.actionItems??""} onChange={e=>upd({actionItems:e.target.value})} disabled={!isToday}
              placeholder="Action items (owner · task · due)" rows={2}
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded outline-none resize-none"
              style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimeDonut({meetings, coding, writing, emails, planning, other, focus}: {
  meetings:number; coding:number; writing:number; emails:number; planning:number; other:number; focus:number;
}) {
  const segs = [
    { k: "meetings", v: meetings, c: "#f59e0b" },
    { k: "focus",    v: focus,    c: "#a3e635" },
    { k: "coding",   v: coding,   c: "#06b6d4" },
    { k: "writing",  v: writing,  c: "#d4af37" },
    { k: "emails",   v: emails,   c: "#8b5cf6" },
    { k: "planning", v: planning, c: "#ec4899" },
    { k: "other",    v: other,    c: "#94a3b8" },
  ];
  const total = segs.reduce((n,s)=>n+s.v,0);
  const R = 52, C = 2*Math.PI*R;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" width="120" height="120" className="shrink-0">
        <circle cx={70} cy={70} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={14}/>
        {total === 0 ? (
          <text x={70} y={74} textAnchor="middle" fontSize={10} fill="#6b7280" className="emperor-title" letterSpacing={2}>NO DATA</text>
        ) : segs.map((s,i) => {
          if (s.v <= 0) return null;
          const frac = s.v/total;
          const len = frac*C;
          const el = <circle key={i} cx={70} cy={70} r={R} fill="none" stroke={s.c} strokeWidth={14}
                     strokeDasharray={`${len} ${C-len}`} strokeDashoffset={-offset}
                     transform="rotate(-90 70 70)" style={{filter:`drop-shadow(0 0 6px ${s.c}66)`}}/>;
          offset += len;
          return el;
        })}
        <text x={70} y={66} textAnchor="middle" fontSize={9} fill="#8b9eb0" className="emperor-title" letterSpacing={2}>TOTAL</text>
        <text x={70} y={82} textAnchor="middle" fontSize={16} fontWeight={900} fill="#f3e9d2">{total}m</text>
      </svg>
      <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
        {segs.map(s => (
          <div key={s.k} className="flex items-center gap-1.5">
            <span style={{width:8,height:8,background:s.c,borderRadius:2}}/>
            <span className="emperor-title tracking-widest uppercase flex-1" style={{color:"#8b9eb0"}}>{s.k}</span>
            <span style={{color:"#f3e9d2"}}>{s.v}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({label,value,color}:{label:string;value:number|string;color:string}) {
  return (
    <div className="rounded-xl p-3" style={{background:"rgba(12,26,34,0.6)",border:`1px solid ${color}33`}}>
      <div className="text-[10px] emperor-title tracking-widest" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-lg md:text-xl font-black mt-1 truncate" style={{color:"#f3e9d2"}}>{value}</div>
    </div>
  );
}
