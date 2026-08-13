"use client";

/**
 * GlobalSection — career meta-view.
 * - Career timeline (aggregate of milestones + achievements + jobs).
 * - Weekly satisfaction slider + burnout check (6 subscales).
 * - Vision board (quotes/goals/ideas).
 * - Retirement / sabbatical planner basics.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Plus, Sparkles, Trash2, Calendar, Target, Flame, TrendingUp, TreePine, Landmark } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { VisionBoardItem, WeekSatisfaction, BurnoutCheck, TimelineEvent, TimelineEventType } from "../../../lib/careerTypes";

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);
const weekId = (d = new Date()) => {
  const copy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(),0,1));
  const w = Math.ceil((((+copy - +yearStart)/86400000)+1)/7);
  return `${copy.getUTCFullYear()}-W${String(w).padStart(2,"0")}`;
};

const EVENT_TYPES: { id: TimelineEventType; label: string; color: string }[] = [
  { id: "milestone", label: "Milestone", color: "#67e8f9" },
  { id: "job", label: "Job", color: "#f59e0b" },
  { id: "promotion", label: "Promotion", color: "#a3e635" },
  { id: "cert", label: "Cert", color: "#06b6d4" },
  { id: "project", label: "Project", color: "#d4af37" },
  { id: "speaking", label: "Speaking", color: "#ec4899" },
  { id: "side-hustle", label: "Side Hustle", color: "#8b5cf6" },
  { id: "other", label: "Other", color: "#94a3b8" },
];

export default function GlobalSection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [visionText, setVisionText] = useState("");
  const [eventDraft, setEventDraft] = useState<Partial<TimelineEvent>>({ title:"", type:"milestone", date: today() });
  const [sat, setSat] = useState(7);
  const [burnout, setBurnout] = useState({ workload:5, control:5, rewards:5, community:5, fairness:5, values:5 });
  const [tab, setTab] = useState<"timeline"|"wellbeing"|"vision"|"freedom">("timeline");

  const timeline: TimelineEvent[] = useMemo(() => {
    // Compose timeline from achievements, projects, plus manual events.
    const fromAch: TimelineEvent[] = career.achievements.map(a => ({
      id: `ach-${a.id}`, date: a.date, type: a.category === "leadership" ? "promotion" : "milestone",
      title: a.title, description: a.impact, icon: a.icon,
    }));
    const fromProj: TimelineEvent[] = career.projects.map(p => ({
      id: `proj-${p.id}`, date: today(), type: "project", title: p.title, description: p.results,
    }));
    const all = [...fromAch, ...fromProj, ...career.timeline];
    return all.sort((a,b) => b.date.localeCompare(a.date));
  }, [career.achievements, career.projects, career.timeline]);

  const addVision = (type: VisionBoardItem["type"]) => {
    if (!visionText.trim()) return;
    const item: VisionBoardItem = { id: uid(), type, content: visionText.trim() };
    updateCareer(c => ({ visionBoard: [item, ...c.visionBoard] }));
    setVisionText("");
  };
  const delVision = (id: string) => updateCareer(c => ({ visionBoard: c.visionBoard.filter(v => v.id !== id) }));

  const addEvent = () => {
    if (!eventDraft.title?.trim() || !eventDraft.date) return;
    const ev: TimelineEvent = { id: uid(), date: eventDraft.date!, type: eventDraft.type || "other", title: eventDraft.title!, description: eventDraft.description };
    updateCareer(c => ({ timeline: [ev, ...c.timeline] }));
    setEventDraft({ title:"", type:"milestone", date:today() });
  };
  const delEvent = (id: string) => updateCareer(c => ({ timeline: c.timeline.filter(e => e.id !== id) }));

  const logSatisfaction = () => {
    const wid = weekId();
    updateCareer(c => ({ satisfaction: [{ date: wid, score: sat }, ...c.satisfaction.filter(s => s.date !== wid)] }));
  };

  const burnoutScore = Math.round((Object.values(burnout).reduce((n,v)=>n+v,0)/6)*10)/10;
  const burnoutRisk = burnoutScore >= 7 ? "HIGH" : burnoutScore >= 5 ? "MODERATE" : burnoutScore >= 3.5 ? "MILD" : "LOW";
  const burnoutColor = burnoutScore>=7 ? "#ef4444" : burnoutScore>=5 ? "#f59e0b" : burnoutScore>=3.5 ? "#eab308" : "#a3e635";

  const logBurnout = () => {
    const entry: BurnoutCheck = { date: today(), ...burnout, score: burnoutScore };
    updateCareer(c => ({ burnoutChecks: [entry, ...c.burnoutChecks] }));
  };

  const avgSat = career.satisfaction.length ? (career.satisfaction.reduce((n,s)=>n+s.score,0)/career.satisfaction.length).toFixed(1) : "—";
  const latestBurnout = career.burnoutChecks[0];

  const updateRetirement = (patch: Record<string, any>) => updateCareer(c => ({ retirement: { ...(c.retirement || {}), ...patch } }));
  const updateSabbatical = (id: string, patch: Record<string, any>) => updateCareer(c => ({ sabbaticals: c.sabbaticals.map(s => s.id===id?{...s,...patch}:s) }));
  const addSabbatical = () => {
    updateCareer(c => ({ sabbaticals: [{ id: uid(), targetDate: today() }, ...c.sabbaticals] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Command Center</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>Your career at altitude — timeline, burnout, vision, freedom.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id:"timeline", label:"Timeline", icon:<Calendar size={12}/>, color:"#cbd5e1" },
          { id:"wellbeing", label:"Wellbeing", icon:<Flame size={12}/>, color:"#a3e635" },
          { id:"vision", label:"Vision Board", icon:<Sparkles size={12}/>, color:"#ec4899" },
          { id:"freedom", label:"Freedom", icon:<Landmark size={12}/>, color:"#d4af37" },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className="emperor-title text-[10px] md:text-xs tracking-widest px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
            style={{background:tab===t.id?`${t.color}22`:"rgba(12,26,34,0.5)",color:tab===t.id?t.color:"#8b9eb0",border:`1px solid ${tab===t.id?t.color+"88":"rgba(255,255,255,0.08)"}`}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Timeline events" value={timeline.length} color="#cbd5e1"/>
        <Stat label="Avg satisfaction" value={avgSat} color="#a3e635"/>
        <Stat label="Check-ins" value={career.burnoutChecks.length} color="#8b5cf6"/>
        <Stat label="Burnout risk" value={latestBurnout?(latestBurnout.score>=7?"HIGH":latestBurnout.score>=5?"MOD":latestBurnout.score>=3.5?"MILD":"LOW"):"—"} color={burnoutColor}/>
      </div>

      <AnimatePresence mode="wait">
        {tab === "timeline" && (
          <motion.div key="tl" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            {/* Add event */}
            <div className="rounded-xl p-3 grid md:grid-cols-6 gap-2"
              style={{background:isDark?"rgba(12,26,34,0.7)":"rgba(255,248,228,0.9)",border:"1px solid rgba(203,213,225,0.25)"}}>
              <input type="date" value={eventDraft.date} onChange={e=>setEventDraft(d=>({...d,date:e.target.value}))}
                className="bg-transparent text-sm px-2 py-2 rounded outline-none md:col-span-1"
                style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
              <select value={eventDraft.type} onChange={e=>setEventDraft(d=>({...d,type:e.target.value as TimelineEventType}))}
                className="bg-transparent text-sm px-2 py-2 rounded outline-none md:col-span-1"
                style={{border:"1px solid rgba(255,255,255,0.1)"}}>
                {EVENT_TYPES.map(t => <option key={t.id} value={t.id} style={{background:"#0a0709"}}>{t.label}</option>)}
              </select>
              <input value={eventDraft.title??""} onChange={e=>setEventDraft(d=>({...d,title:e.target.value}))} placeholder="Event title"
                className="bg-transparent text-sm px-2 py-2 rounded outline-none md:col-span-3"
                style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
              <button onClick={addEvent} className="emperor-title text-xs tracking-widest px-3 py-2 rounded-lg" style={{background:"#0e7490",color:"#cffafe"}}>Add</button>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px" style={{background:"linear-gradient(to bottom, rgba(203,213,225,0.6), rgba(212,175,55,0.3), transparent)"}}/>
              {timeline.slice(0, 50).map(ev => {
                const meta = EVENT_TYPES.find(t=>t.id===ev.type) || EVENT_TYPES[EVENT_TYPES.length-1];
                return (
                  <motion.div key={ev.id} layout className="relative rounded-xl p-3 mb-2"
                    style={{background:isDark?"rgba(12,26,34,0.6)":"rgba(255,248,228,0.9)",border:`1px solid ${meta.color}44`}}>
                    <div className="absolute -left-[22px] top-4 w-3 h-3 rounded-full" style={{background:meta.color,boxShadow:`0 0 8px ${meta.color}`}}/>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[10px] emperor-title tracking-widest" style={{color:meta.color}}>{meta.label.toUpperCase()}</span>
                          <span className="text-[10px]" style={{color:"#6b7280"}}>{ev.date}</span>
                        </div>
                        <h4 className="font-bold text-sm mt-0.5" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}>{ev.title}</h4>
                        {ev.description && <p className="text-[11px] mt-0.5 serif-body italic" style={{color:"#8b9eb0"}}>{ev.description}</p>}
                      </div>
                      {ev.id.startsWith("tl-") || ev.id.length > 10 ? (
                        <button onClick={()=>delEvent(ev.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400"><Trash2 size={11}/></button>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
              {timeline.length === 0 && <div className="text-center py-10 text-sm italic" style={{color:"#6b7280"}}>No events yet.</div>}
            </div>
          </motion.div>
        )}

        {tab === "wellbeing" && (
          <motion.div key="wb" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 space-y-3" style={{background:isDark?"rgba(12,26,34,0.7)":"rgba(255,248,228,0.9)",border:"1px solid rgba(163,230,53,0.3)"}}>
              <h3 className="emperor-title text-sm tracking-widest flex items-center gap-2" style={{color:"#a3e635"}}><TrendingUp size={14}/> WEEKLY SATISFACTION</h3>
              <div>
                <div className="flex items-center justify-between text-[10px] emperor-title mb-1"><span style={{color:"#8b9eb0"}}>THIS WEEK</span><span style={{color:"#a3e635"}}>{sat}/10</span></div>
                <input type="range" min={1} max={10} value={sat} onChange={e=>setSat(Number(e.target.value))} className="w-full" style={{accentColor:"#a3e635"}}/>
              </div>
              <button onClick={logSatisfaction} className="emperor-title text-xs tracking-widest px-3 py-2 rounded" style={{background:"#4d7c0f",color:"#d9f99d"}}>Log this week</button>
              {career.satisfaction.length > 0 && (
                <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
                  {career.satisfaction.slice(0,10).map(s => (
                    <div key={s.date} className="flex items-center justify-between text-xs">
                      <span style={{color:"#8b9eb0"}}>{s.date}</span>
                      <span style={{color:s.score>=7?"#a3e635":s.score>=5?"#eab308":"#ef4444"}}>{s.score}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{background:isDark?"rgba(12,26,34,0.7)":"rgba(255,248,228,0.9)",border:`1px solid ${burnoutColor}55`}}>
              <h3 className="emperor-title text-sm tracking-widest flex items-center gap-2" style={{color:burnoutColor}}><Flame size={14}/> BURNOUT CHECK</h3>
              {([
                ["workload","Workload"],["control","Control"],["rewards","Rewards"],
                ["community","Community"],["fairness","Fairness"],["values","Values alignment"],
              ] as const).map(([k,lbl]) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-[10px] emperor-title mb-0.5"><span style={{color:"#8b9eb0"}}>{lbl.toUpperCase()}</span><span style={{color:"#8b9eb0"}}>{burnout[k]}/10</span></div>
                  <input type="range" min={1} max={10} value={burnout[k]} onChange={e=>setBurnout(b=>({...b,[k]:Number(e.target.value)}))} className="w-full" style={{accentColor:burnoutColor}}/>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                <div>
                  <div className="text-[10px] emperor-title" style={{color:"#8b9eb0"}}>SCORE</div>
                  <div className="text-xl font-black" style={{color:burnoutColor}}>{burnoutScore}/10 · {burnoutRisk}</div>
                </div>
                <button onClick={logBurnout} className="emperor-title text-xs tracking-widest px-3 py-2 rounded" style={{background:burnoutColor,color:"#0a0709"}}>Log</button>
              </div>
            </div>
          </motion.div>
        )}

        {tab === "vision" && (
          <motion.div key="vb" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-xl p-3 flex gap-2" style={{background:isDark?"rgba(12,26,34,0.7)":"rgba(255,248,228,0.9)",border:"1px solid rgba(236,72,153,0.35)"}}>
              <input value={visionText} onChange={e=>setVisionText(e.target.value)} placeholder="Drop a quote, goal, or image URL…"
                className="flex-1 bg-transparent px-2 py-2 rounded text-sm outline-none"
                style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
              <button onClick={()=>addVision("quote")} className="text-[10px] emperor-title px-2 py-2 rounded" style={{background:"rgba(236,72,153,0.2)",color:"#fbcfe8"}}>+ Quote</button>
              <button onClick={()=>addVision("goal")} className="text-[10px] emperor-title px-2 py-2 rounded" style={{background:"rgba(212,175,55,0.2)",color:"#fde68a"}}>+ Goal</button>
            </div>
            {career.visionBoard.length === 0 && (
              <div className="rounded-2xl p-10 text-center" style={{background:"rgba(12,26,34,0.4)",border:"1px dashed rgba(236,72,153,0.25)"}}>
                <Sparkles size={28} className="mx-auto mb-2" style={{color:"#ec4899"}}/>
                <p className="imperial-title tracking-widest text-sm" style={{color:"#fbcfe8"}}>Your board is blank.</p>
                <p className="serif-body italic text-xs mt-1" style={{color:"#8b9eb0"}}>What do you want to build? Speak it into existence.</p>
              </div>
            )}
            <div className="columns-1 md:columns-2 gap-3 [column-fill:_balance]">
              {career.visionBoard.map(v => (
                <motion.div key={v.id} layout
                  className="break-inside-avoid rounded-xl p-4 mb-3 relative"
                  style={{background:isDark?"rgba(12,26,34,0.6)":"rgba(255,248,228,0.9)",
                    border:`1px solid ${v.type==="goal"?"rgba(212,175,55,0.4)":"rgba(236,72,153,0.35)"}`}}>
                  <div className="text-[9px] emperor-title tracking-widest mb-1" style={{color:v.type==="goal"?"#d4af37":"#ec4899"}}>{v.type.toUpperCase()}</div>
                  <p className="serif-body italic" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}>{v.type==="quote" ? `"${v.content}"` : v.content}</p>
                  <button onClick={()=>delVision(v.id)} className="absolute top-2 right-2 p-1 rounded hover:bg-red-500/20 text-red-400 opacity-60 hover:opacity-100"><Trash2 size={11}/></button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "freedom" && (
          <motion.div key="fr" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 space-y-2" style={{background:isDark?"rgba(12,26,34,0.7)":"rgba(255,248,228,0.9)",border:"1px solid rgba(212,175,55,0.3)"}}>
              <h3 className="emperor-title text-sm tracking-widest flex items-center gap-2" style={{color:"#d4af37"}}><Landmark size={14}/> RETIREMENT</h3>
              <NumField label="Current savings ($)" value={career.retirement?.currentSavings} onChange={v=>updateRetirement({currentSavings:v})}/>
              <NumField label="Target annual spend ($)" value={career.retirement?.targetAnnual} onChange={v=>updateRetirement({targetAnnual:v})}/>
              <NumField label="Target age" value={career.retirement?.targetAge} onChange={v=>updateRetirement({targetAge:v})}/>
              <NumField label="Projected age" value={career.retirement?.projectedAge} onChange={v=>updateRetirement({projectedAge:v})}/>
              <textarea defaultValue={career.retirement?.notes??""} onBlur={e=>updateRetirement({notes:e.target.value})} placeholder="Notes / strategy…" rows={2}
                className="w-full bg-transparent px-2 py-2 rounded text-xs outline-none resize-none mt-1"
                style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
            </div>
            <div className="rounded-xl p-4 space-y-2" style={{background:isDark?"rgba(12,26,34,0.7)":"rgba(255,248,228,0.9)",border:"1px solid rgba(139,92,246,0.3)"}}>
              <div className="flex items-center justify-between">
                <h3 className="emperor-title text-sm tracking-widest flex items-center gap-2" style={{color:"#c4b5fd"}}><TreePine size={14}/> SABBATICALS</h3>
                <button onClick={addSabbatical} className="text-[10px] emperor-title px-2 py-1 rounded" style={{background:"rgba(139,92,246,0.2)",color:"#c4b5fd"}}>+ Plan</button>
              </div>
              {career.sabbaticals.length === 0 && <p className="text-xs italic" style={{color:"#8b9eb0"}}>No sabbatical plans yet.</p>}
              {career.sabbaticals.map(s => (
                <div key={s.id} className="rounded-lg p-2 space-y-1" style={{background:"rgba(0,0,0,0.2)"}}>
                  <input type="date" value={s.targetDate??""} onChange={e=>updateSabbatical(s.id,{targetDate:e.target.value})}
                    className="bg-transparent text-xs px-2 py-1 rounded outline-none w-full" style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                  <div className="grid grid-cols-2 gap-1">
                    <input type="number" placeholder="Savings target" value={s.savingsTarget??""} onChange={e=>updateSabbatical(s.id,{savingsTarget:Number(e.target.value)||undefined})}
                      className="bg-transparent text-xs px-2 py-1 rounded outline-none" style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                    <input type="number" placeholder="Current savings" value={s.savingsCurrent??""} onChange={e=>updateSabbatical(s.id,{savingsCurrent:Number(e.target.value)||undefined})}
                      className="bg-transparent text-xs px-2 py-1 rounded outline-none" style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                  </div>
                  <input type="number" placeholder="Duration (weeks)" value={s.durationWeeks??""} onChange={e=>updateSabbatical(s.id,{durationWeeks:Number(e.target.value)||undefined})}
                    className="bg-transparent text-xs px-2 py-1 rounded outline-none w-full" style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NumField({label,value,onChange}:{label:string;value:number|undefined;onChange:(v:number|undefined)=>void}) {
  return (
    <label className="block">
      <div className="text-[10px] emperor-title tracking-widest mb-0.5" style={{color:"#8b9eb0"}}>{label.toUpperCase()}</div>
      <input type="number" value={value??""} onChange={e=>onChange(e.target.value?Number(e.target.value):undefined)}
        className="w-full bg-transparent px-2 py-1.5 rounded text-sm outline-none"
        style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
    </label>
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
