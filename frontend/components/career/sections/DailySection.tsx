"use client";

/**
 * DailySection — daily workflow journal.
 *   - Standup (3 bullets), work log, free-form notes
 *   - Live focus MM:SS pomodoro (ticks into focusSessionsMinutes)
 *   - Time allocation donut (meetings/coding/writing/emails/planning/other/focus)
 *   - Meetings w/ 1-5 ROI, agenda, discussion, decisions, and a structured
 *     follow-up checklist (owner / due / done toggle).
 *   - Mood/Stress sliders + Wins/Learnings/Challenges quick-lists
 *   - Streak flame, history list of recent days
 *   - HUD themed via CSS variables for night + blueprint light.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, PlusCircle, Smile, Frown, Meh, Flame, BookOpen, Target,
  Calendar, Clock, Play, Pause, RotateCcw, Timer, Users, Trash2, Plus,
  Check, CheckSquare, Square,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { WorkDayEntry, MeetingEntry } from "../../../lib/careerTypes";

const today = () => new Date().toISOString().slice(0,10);
const uid = () => Math.random().toString(36).slice(2,10);
const emptyDay = (d: string): WorkDayEntry => ({
  date: d, standup: "", meetings: [], focusSessionsMinutes: 0,
  timeAllocation: { meetings:0, coding:0, writing:0, emails:0, planning:0, other:0 },
  workLog: "", mood: 5, stress: 5, wins: [], learnings: [], challenges: [],
});

const COLORS = {
  violet: "#818cf8",
  cyan: "var(--cr-accent)",
  green: "var(--cr-accent3)",
  yellow: "#facc15",
  orange: "var(--cr-accent2)",
  pink: "#f472b6",
  red: "#f87171",
  slate: "#94a3b8",
};

export default function DailySection() {
  const { career, updateCareer } = useStore();
  const [day, setDay] = useState<string>(today());

  // Live focus timer
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => { setElapsed(0); setRunning(false); }, [day]);

  useEffect(() => {
    if (running) {
      const start = Date.now() - elapsed * 1000;
      tickRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - start)/1000);
        setElapsed(secs);
        if (secs % 15 === 0) commitFocus(secs);
      }, 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current); tickRef.current = null;
      if (elapsed > 0) commitFocus(elapsed);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

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

  // Meeting CRUD
  const addMeeting = () => {
    const m: MeetingEntry = { id: uid(), title: "New meeting", date: day, durationMin: 30, roiScore: 3, followUps: [] };
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
  const openFollowUps = (entry.meetings||[]).reduce((n,m)=>n+((m.followUps||[]).filter(f=>!f.done).length),0);
  const avgMood = career.days.length ? (career.days.reduce((n,d)=>n+d.mood,0)/career.days.length).toFixed(1) : "—";
  const avgStress = career.days.length ? (career.days.reduce((n,d)=>n+d.stress,0)/career.days.length).toFixed(1) : "—";
  const focusHrs = Math.round(career.days.reduce((n,d)=>n+d.focusSessionsMinutes,0)/60*10)/10;
  const totalMeetings = career.days.reduce((n,d)=>n+(d.meetings?.length||0),0);
  const totalFollowUps = career.days.reduce((n,d)=>n+(d.meetings||[]).reduce((a,m)=>a+((m.followUps||[]).filter(f=>!f.done).length),0),0);
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

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider flex items-center gap-2" style={{color:"var(--cr-fg)"}}>
            <ClipboardList size={22} style={{color:COLORS.violet}}/> daily.standup
          </h2>
          <p className="text-[11px] tracking-widest mt-1" style={{color:"var(--cr-fgMuted)"}}>
            &gt; deep focus · meetings · standup · mood — the daily scroll
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-[11px] tracking-widest font-bold hud-corner relative"
                 style={{background:"var(--cr-card)",border:`1px solid ${COLORS.orange}66`,color:COLORS.orange}}>
              <span className="c-tr"/><span className="c-bl"/>
              <Flame size={12}/> {streak}-DAY STREAK
            </div>
          )}
          <input type="date" value={day} onChange={e=>setDay(e.target.value)}
            className="bg-transparent px-3 py-2 rounded-sm text-xs outline-none font-bold tracking-widest"
            style={{...inputStyle, color:COLORS.violet, borderColor:`${COLORS.violet}66`}}/>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Stat label="Days" value={career.days.length} color={COLORS.violet}/>
        <Stat label="Mood" value={avgMood} color={COLORS.green}/>
        <Stat label="Stress" value={avgStress} color={COLORS.red}/>
        <Stat label="Focus hrs" value={focusHrs} color={COLORS.cyan}/>
        <Stat label="Meetings" value={`${totalMeetings} · ${avgROI}★`} color={COLORS.orange}/>
        <Stat label="Open FU" value={totalFollowUps} color={COLORS.pink}/>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Standup" color={COLORS.violet} icon={<Target size={14}/>}>
          <textarea value={entry.standup??""} onChange={e=>upd({standup:e.target.value})}
            placeholder={"Yesterday…\nToday…\nBlockers…"} rows={4}
            className="w-full bg-transparent outline-none text-sm resize-none p-2 rounded-sm"
            style={{...inputStyle,minHeight:90}}/>
        </Card>

        <Card title="Work Log" color={COLORS.cyan} icon={<BookOpen size={14}/>}>
          <textarea value={entry.workLog??""} onChange={e=>upd({workLog:e.target.value})}
            placeholder="Free-form notes on the day…" rows={4}
            className="w-full bg-transparent outline-none text-sm resize-none p-2 rounded-sm"
            style={{...inputStyle,minHeight:90}}/>
        </Card>

        <Card title="Deep Focus" color={COLORS.green} icon={<Timer size={14}/>}>
          <div className="flex items-center gap-3">
            <div className="font-mono text-4xl font-black tabular-nums"
              style={{color: running ? COLORS.yellow : COLORS.green,
                      textShadow: running ? `0 0 16px ${COLORS.yellow}99` : "none"}}>
              {mm}:{ss}
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={()=>setRunning(r=>!r)} disabled={!isToday}
                className="p-2 rounded-sm transition hover:scale-105 disabled:opacity-40"
                style={{background: running ? `${COLORS.red}22` : `${COLORS.green}22`,
                        color: running ? COLORS.red : COLORS.green,
                        border:`1px solid ${running?`${COLORS.red}66`:`${COLORS.green}66`}`}}>
                {running ? <Pause size={14}/> : <Play size={14}/>}
              </button>
              <button onClick={resetTimer} disabled={!isToday || elapsed===0}
                className="p-2 rounded-sm transition disabled:opacity-40" style={inputStyle}>
                <RotateCcw size={12}/>
              </button>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[9px] tracking-widest font-bold" style={{color:"var(--cr-fgMuted)"}}>TODAY</div>
              <div className="text-xl font-black" style={{color:"var(--cr-fg)"}}>{Math.round(totalFocusMin/60*10)/10}h</div>
            </div>
          </div>
          <div className="flex gap-1 mt-3 flex-wrap">
            {[15,30,60,90].map(n => (
              <button key={n} onClick={()=>addManual(n)} disabled={!isToday}
                className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm disabled:opacity-40"
                style={{background:`${COLORS.green}22`,color:COLORS.green,border:`1px solid ${COLORS.green}44`}}>+{n}m</button>
            ))}
          </div>
          {!isToday && <div className="text-[10px] mt-2" style={{color:"var(--cr-fgMuted)"}}>Timer disabled for past days.</div>}
        </Card>

        <Card title="Time Allocation" color={COLORS.yellow} icon={<Clock size={14}/>}>
          <TimeDonut meetings={totalMeetingMin} coding={entry.timeAllocation?.coding||0} writing={entry.timeAllocation?.writing||0}
                     emails={entry.timeAllocation?.emails||0} planning={entry.timeAllocation?.planning||0}
                     other={entry.timeAllocation?.other||0} focus={totalFocusMin}/>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {([
              ["coding", COLORS.cyan], ["writing", COLORS.yellow], ["emails", COLORS.violet],
              ["planning", COLORS.pink], ["other", COLORS.slate],
            ] as const).map(([k,c]) => (
              <div key={k} className="flex items-center gap-1 text-[10px]">
                <span style={{width:8,height:8,background:c,borderRadius:2}}/>
                <span className="tracking-widest uppercase font-bold flex-1" style={{color:"var(--cr-fgMuted)"}}>{k}</span>
                <input type="number" min={0} value={(entry.timeAllocation as any)?.[k]||0}
                  onChange={e=>{
                    const base = entry.timeAllocation || { meetings:0, coding:0, writing:0, emails:0, planning:0, other:0 };
                    upd({ timeAllocation: { ...base, meetings: totalMeetingMin, [k]: Math.max(0,Number(e.target.value)) } });
                  }}
                  className="w-10 bg-transparent text-right outline-none font-bold" style={{color:"var(--cr-fg)"}}/>
              </div>
            ))}
          </div>
        </Card>

        <Card title="State" color={COLORS.pink} icon={<Smile size={14}/>}>
          <div className="space-y-2">
            <SliderRow label="Mood" value={entry.mood} color={COLORS.green} onChange={v=>upd({mood:v})} icon={entry.mood>=7?<Smile size={12}/>:entry.mood<=3?<Frown size={12}/>:<Meh size={12}/>}/>
            <SliderRow label="Stress" value={entry.stress} color={COLORS.red} onChange={v=>upd({stress:v})}/>
          </div>
        </Card>

        <div className="md:col-span-2 grid md:grid-cols-3 gap-3">
          <QuickList title="Wins" color={COLORS.green} items={entry.wins??[]} onAdd={t=>arrUpd("wins",t)} onDel={i=>arrDel("wins",i)}/>
          <QuickList title="Learnings" color={COLORS.cyan} items={entry.learnings??[]} onAdd={t=>arrUpd("learnings",t)} onDel={i=>arrDel("learnings",i)}/>
          <QuickList title="Challenges" color={COLORS.red} items={entry.challenges??[]} onAdd={t=>arrUpd("challenges",t)} onDel={i=>arrDel("challenges",i)}/>
        </div>

        {/* Meetings */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs tracking-[0.3em] font-bold flex items-center gap-2" style={{color:COLORS.orange}}>
              <Users size={14}/> MEETINGS · {totalMeetingMin}min {openFollowUps>0 && <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold" style={{background:`${COLORS.pink}22`,color:COLORS.pink,border:`1px solid ${COLORS.pink}44`}}>{openFollowUps} OPEN FU</span>}
            </h3>
            <button onClick={addMeeting} disabled={!isToday}
              className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm flex items-center gap-1 disabled:opacity-40"
              style={{background:`${COLORS.orange}22`,color:COLORS.orange,border:`1px solid ${COLORS.orange}66`}}>
              <Plus size={12}/> ADD
            </button>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {(entry.meetings||[]).map(m => <MeetingRow key={m.id} m={m} upd={p=>updMeeting(m.id,p)} del={()=>delMeeting(m.id)} isToday={isToday}/>)}
            </AnimatePresence>
            {(entry.meetings||[]).length === 0 && (
              <div className="rounded-sm p-4 text-center text-xs tracking-wide hud-corner"
                style={{background:"var(--cr-card2)",border:"1px dashed var(--cr-border)"}}>
                <span className="c-tr"/><span className="c-bl"/>
                <p style={{color:"var(--cr-fgMuted)"}}>No meetings logged. Enjoy the silence.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs tracking-[0.3em] font-bold mb-2" style={{color:COLORS.violet}}>RECENT DAYS</h3>
        <div className="space-y-1">
          {career.days.filter(d => d.date !== day).slice(0, 10).map(d => (
            <button key={d.date} onClick={()=>setDay(d.date)}
              className="w-full text-left rounded-sm p-2.5 flex items-center gap-3 text-sm transition hud-corner relative"
              style={{...card}}>
              <span className="c-tr"/><span className="c-bl"/>
              <span className="text-[10px] font-bold tracking-widest" style={{color:"var(--cr-fgMuted)"}}>{d.date}</span>
              <span className="flex-1 truncate" style={{color:"var(--cr-fg)"}}>{(d.standup||d.workLog||"—").split("\n")[0]}</span>
              <span style={{color:COLORS.green}}>● {d.mood}</span>
              <span style={{color:COLORS.orange}}>🔥 {Math.round(d.focusSessionsMinutes/60*10)/10}h</span>
              {(d.meetings?.length||0) > 0 && (
                <span style={{color:COLORS.pink}}>👥 {d.meetings!.length}</span>
              )}
            </button>
          ))}
          {career.days.length <= 1 && <div className="text-xs text-center py-6" style={{color:"var(--cr-fgMuted)"}}>No past entries yet — show up tomorrow.</div>}
        </div>
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------

function Card({title,color,icon,children}:{title:string;color:string;icon:React.ReactNode;children:React.ReactNode}) {
  return (
    <div className="rounded-sm p-4 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${color}55`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="flex items-center gap-2 text-[10px] tracking-widest font-bold mb-2" style={{color}}>{icon}{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function SliderRow({label,value,color,onChange,icon}:{label:string;value:number;color:string;onChange:(v:number)=>void;icon?:React.ReactNode}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] tracking-widest font-bold mb-1">
        <span className="flex items-center gap-1" style={{color:"var(--cr-fgMuted)"}}>{icon}{label.toUpperCase()}</span>
        <span style={{color}}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full" style={{accentColor:color}}/>
    </div>
  );
}

function QuickList({title,color,items,onAdd,onDel}:{title:string;color:string;items:string[];onAdd:(t:string)=>void;onDel:(i:number)=>void}) {
  const [v,setV] = useState("");
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };
  return (
    <div className="rounded-sm p-3 hud-corner relative" style={{background:"var(--cr-card)",border:`1px solid ${color}55`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="text-[10px] tracking-widest font-bold mb-2" style={{color}}>{title.toUpperCase()}</div>
      <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
        {items.length === 0 && <div className="text-[11px]" style={{color:"var(--cr-fgMuted)"}}>None yet.</div>}
        {items.map((it,i) => (
          <div key={i} className="flex items-start gap-2 text-xs group">
            <span style={{color}}>•</span>
            <span className="flex-1" style={{color:"var(--cr-fg)"}}>{it}</span>
            <button onClick={()=>onDel(i)} className="opacity-0 group-hover:opacity-100" style={{color:COLORS.red}}>×</button>
          </div>
        ))}
      </div>
      <form onSubmit={e=>{e.preventDefault();onAdd(v);setV("");}} className="flex gap-1">
        <input value={v} onChange={e=>setV(e.target.value)} placeholder={`Add ${title.toLowerCase()}`}
          className="flex-1 bg-transparent text-[11px] px-2 py-1 rounded-sm outline-none" style={inputStyle}/>
        <button className="px-2 rounded-sm text-xs font-bold" style={{background:`${color}22`,color}}>+</button>
      </form>
    </div>
  );
}

function MeetingRow({ m, upd, del, isToday }: { m: MeetingEntry; upd: (p: Partial<MeetingEntry>)=>void; del: ()=>void; isToday: boolean }) {
  const [open, setOpen] = useState(false);
  const [fuDraft, setFuDraft] = useState("");
  const roiColors = [COLORS.red,"#dc2626",COLORS.orange,"#84cc16",COLORS.green];
  const roi = m.roiScore ?? 3;
  const followUps = m.followUps ?? [];
  const openCount = followUps.filter(f=>!f.done).length;
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  const addFollowUp = () => {
    if (!fuDraft.trim()) return;
    upd({ followUps: [...followUps, { id: uid(), text: fuDraft.trim(), done: false }] });
    setFuDraft("");
  };
  const toggleFu = (id: string) =>
    upd({ followUps: followUps.map(f => f.id === id ? { ...f, done: !f.done } : f) });
  const delFu = (id: string) =>
    upd({ followUps: followUps.filter(f => f.id !== id) });

  return (
    <motion.div layout initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,height:0}}
      className="rounded-sm p-3 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${roiColors[roi-1]}66`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={m.title} onChange={e=>upd({title:e.target.value})} disabled={!isToday}
          className="flex-1 min-w-[120px] bg-transparent font-bold text-sm outline-none" style={{color:"var(--cr-fg)"}}/>
        <input type="number" min={5} step={5} value={m.durationMin} onChange={e=>upd({durationMin:Math.max(0,Number(e.target.value))})}
          disabled={!isToday}
          className="bg-transparent w-14 text-right text-sm outline-none font-bold" style={{color:COLORS.orange}}/>
        <span className="text-[10px] font-bold tracking-widest" style={{color:"var(--cr-fgMuted)"}}>min</span>
        <div className="flex gap-0.5 ml-auto">
          {[1,2,3,4,5].map(n => (
            <button key={n} disabled={!isToday} onClick={()=>upd({roiScore:n})}
              className="w-5 h-5 rounded-sm text-[10px] font-black transition disabled:opacity-50"
              style={{ background: n<=roi ? roiColors[n-1] : "var(--cr-card2)",
                       color: n<=roi ? "var(--cr-bg)" : "var(--cr-fgMuted)",
                       border: `1px solid ${n<=roi ? roiColors[n-1] : "var(--cr-borderSoft)"}` }}>
              {n}
            </button>
          ))}
        </div>
        {openCount > 0 && (
          <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm flex items-center gap-1"
            style={{background:`${COLORS.pink}22`,color:COLORS.pink,border:`1px solid ${COLORS.pink}44`}}>
            <CheckSquare size={9}/>{openCount}
          </span>
        )}
        <button onClick={()=>setOpen(o=>!o)} className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
          style={{background:`${COLORS.orange}22`,color:COLORS.orange,border:`1px solid ${COLORS.orange}44`}}>{open?"HIDE":"NOTES"}</button>
        <button onClick={del} disabled={!isToday} className="p-1 rounded-sm disabled:opacity-40" style={{color:COLORS.red}}><Trash2 size={12}/></button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden mt-2 space-y-2">
            <input value={m.attendees??""} onChange={e=>upd({attendees:e.target.value})} disabled={!isToday}
              placeholder="Attendees" className="w-full bg-transparent text-xs px-2 py-1.5 rounded-sm outline-none" style={inputStyle}/>
            <textarea value={m.plannedAgenda??""} onChange={e=>upd({plannedAgenda:e.target.value})} disabled={!isToday}
              placeholder="Agenda / planned talking points" rows={2}
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded-sm outline-none resize-none" style={inputStyle}/>
            <textarea value={m.actualDiscussion??""} onChange={e=>upd({actualDiscussion:e.target.value})} disabled={!isToday}
              placeholder="Actual discussion / notes" rows={2}
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded-sm outline-none resize-none" style={inputStyle}/>
            <textarea value={m.decisions??""} onChange={e=>upd({decisions:e.target.value})} disabled={!isToday}
              placeholder="Decisions made" rows={2}
              className="w-full bg-transparent text-xs px-2 py-1.5 rounded-sm outline-none resize-none" style={inputStyle}/>

            {/* Structured follow-up checklist */}
            <div className="p-2 rounded-sm" style={{background:"var(--cr-card2)",border:`1px solid ${COLORS.pink}44`}}>
              <div className="text-[9px] tracking-widest font-bold mb-1 flex items-center gap-1" style={{color:COLORS.pink}}>
                <CheckSquare size={10}/> FOLLOW-UPS
              </div>
              <div className="space-y-1">
                {followUps.map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs group">
                    <button disabled={!isToday} onClick={()=>toggleFu(f.id)}
                      style={{color: f.done ? COLORS.green : "var(--cr-fgMuted)"}}>
                      {f.done ? <Check size={12}/> : <Square size={12}/>}
                    </button>
                    <span className={`flex-1 ${f.done?"line-through opacity-60":""}`} style={{color:"var(--cr-fg)"}}>{f.text}</span>
                    {f.due && <span className="text-[9px] tracking-widest font-bold" style={{color:COLORS.orange}}>{f.due}</span>}
                    <button disabled={!isToday} onClick={()=>delFu(f.id)} className="opacity-0 group-hover:opacity-100" style={{color:COLORS.red}}>×</button>
                  </div>
                ))}
                {followUps.length === 0 && <div className="text-[10px]" style={{color:"var(--cr-fgMuted)"}}>No follow-ups yet.</div>}
              </div>
              {isToday && (
                <div className="flex gap-1 mt-2">
                  <input value={fuDraft} onChange={e=>setFuDraft(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addFollowUp()}
                    placeholder="+ Add follow-up (owner · task · due)"
                    className="flex-1 bg-transparent text-[11px] px-2 py-1 rounded-sm outline-none" style={inputStyle}/>
                  <button onClick={addFollowUp} className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
                    style={{background:COLORS.pink,color:"var(--cr-bg)"}}><Plus size={10}/></button>
                </div>
              )}
            </div>
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
    { k: "meetings", v: meetings, c: COLORS.orange },
    { k: "focus",    v: focus,    c: COLORS.green },
    { k: "coding",   v: coding,   c: COLORS.cyan },
    { k: "writing",  v: writing,  c: COLORS.yellow },
    { k: "emails",   v: emails,   c: COLORS.violet },
    { k: "planning", v: planning, c: COLORS.pink },
    { k: "other",    v: other,    c: COLORS.slate },
  ];
  const total = segs.reduce((n,s)=>n+s.v,0);
  const R = 52, C = 2*Math.PI*R;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" width="120" height="120" className="shrink-0">
        <circle cx={70} cy={70} r={R} fill="none" stroke="var(--cr-borderSoft)" strokeWidth={14}/>
        {total === 0 ? (
          <text x={70} y={74} textAnchor="middle" fontSize={9} fill="var(--cr-fgMuted)" fontWeight={700} letterSpacing={2}>NO DATA</text>
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
        <text x={70} y={66} textAnchor="middle" fontSize={9} fill="var(--cr-fgMuted)" fontWeight={700} letterSpacing={2}>TOTAL</text>
        <text x={70} y={82} textAnchor="middle" fontSize={16} fontWeight={900} fill="var(--cr-fg)">{total}m</text>
      </svg>
      <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
        {segs.map(s => (
          <div key={s.k} className="flex items-center gap-1.5">
            <span style={{width:8,height:8,background:s.c,borderRadius:2}}/>
            <span className="tracking-widest uppercase font-bold flex-1" style={{color:"var(--cr-fgMuted)"}}>{s.k}</span>
            <span style={{color:"var(--cr-fg)"}}>{s.v}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({label,value,color}:{label:string;value:number|string;color:string}) {
  return (
    <div className="rounded-sm p-2.5 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${color}55`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="text-[9px] tracking-widest font-bold" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-lg font-black leading-tight mt-0.5 truncate" style={{color:"var(--cr-fg)"}}>{value}</div>
    </div>
  );
}

// Suppress unused imports
void PlusCircle; void Calendar;
