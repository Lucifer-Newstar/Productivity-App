"use client";

/**
 * GlobalSection — /career/command meta-view.
 *   - Timeline (aggregates achievements + projects + manual events)
 *   - Wellbeing: weekly satisfaction 1-10 + Maslach burnout 6-subscale check
 *   - Vision board (quotes / goals)
 *   - Freedom: retirement targets + sabbatical plans
 *   - HUD themed (CSS vars, blueprint-compatible).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Plus, Sparkles, Trash2, Calendar, Target, Flame, TrendingUp,
  TreePine, Landmark, Zap, DollarSign, Clock, Mic, FileKey,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type {
  VisionBoardItem, BurnoutCheck, TimelineEvent, TimelineEventType,
} from "../../../lib/careerTypes";

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
  { id: "milestone",   label: "Milestone",   color: "var(--cr-accent)"  },
  { id: "job",         label: "Job",         color: "var(--cr-accent2)" },
  { id: "promotion",   label: "Promotion",   color: "var(--cr-accent3)" },
  { id: "cert",        label: "Cert",        color: "#22d3ee" },
  { id: "project",     label: "Project",     color: "#facc15" },
  { id: "skill",       label: "Skill",       color: "#a78bfa" },
  { id: "speaking",    label: "Speaking",    color: "#f472b6" },
  { id: "side-hustle", label: "Side Hustle", color: "#8b5cf6" },
  { id: "other",       label: "Other",       color: "#94a3b8" },
];

const TABS = [
  { id: "timeline",  label: "Timeline",  icon: <Calendar size={12}/>, color: "var(--cr-fg)" },
  { id: "wellbeing", label: "Wellbeing", icon: <Flame size={12}/>,    color: "var(--cr-accent3)" },
  { id: "vision",    label: "Vision",    icon: <Sparkles size={12}/>, color: "#f472b6" },
  { id: "hustle",    label: "Hustle",    icon: <Zap size={12}/>,      color: "#fb923c" },
  { id: "ip",        label: "IP",        icon: <FileKey size={12}/>,  color: "#22d3ee" },
  { id: "speaking",  label: "Speaking",  icon: <Mic size={12}/>,      color: "#a78bfa" },
  { id: "freedom",   label: "Freedom",   icon: <Landmark size={12}/>, color: "#facc15" },
] as const;

export default function GlobalSection() {
  const { career, updateCareer } = useStore();
  const [visionText, setVisionText] = useState("");
  const [eventDraft, setEventDraft] = useState<Partial<TimelineEvent>>({ title:"", type:"milestone", date: today() });
  const [sat, setSat] = useState(7);
  const [burnout, setBurnout] = useState({ workload:5, control:5, rewards:5, community:5, fairness:5, values:5 });
  const [tab, setTab] = useState<"timeline"|"wellbeing"|"vision"|"hustle"|"ip"|"speaking"|"freedom">("timeline");
  const [hustleDraft, setHustleDraft] = useState({ name:"", revenue:0, hoursPerWeek:0, goal:"", stage:"idea" as "idea"|"building"|"launched"|"scaling" });
  const [ipDraft, setIpDraft] = useState({ type:"patent" as "patent"|"copyright"|"trademark"|"idea", title:"", notes:"" });
  const [speakDraft, setSpeakDraft] = useState({ title:"", event:"", date:"", notes:"" });

  const timeline: TimelineEvent[] = useMemo(() => {
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
    updateCareer(c => ({ visionBoard: [{ id: uid(), type, content: visionText.trim() }, ...c.visionBoard] }));
    setVisionText("");
  };
  const delVision = (id: string) => updateCareer(c => ({ visionBoard: c.visionBoard.filter(v => v.id !== id) }));

  const addEvent = () => {
    if (!eventDraft.title?.trim() || !eventDraft.date) return;
    const ev: TimelineEvent = { id: uid(), date: eventDraft.date!, type: eventDraft.type || "other",
      title: eventDraft.title!, description: eventDraft.description };
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
  const burnoutColor = burnoutScore>=7 ? "#f87171" : burnoutScore>=5 ? "#fb923c" : burnoutScore>=3.5 ? "#facc15" : "var(--cr-accent3)";

  const logBurnout = () => {
    const entry: BurnoutCheck = { date: today(), ...burnout, score: burnoutScore };
    updateCareer(c => ({ burnoutChecks: [entry, ...c.burnoutChecks] }));
  };

  const avgSat = career.satisfaction.length ? (career.satisfaction.reduce((n,s)=>n+s.score,0)/career.satisfaction.length).toFixed(1) : "—";
  const latestBurnout = career.burnoutChecks[0];

  const updateRetirement = (patch: Record<string, any>) => updateCareer(c => ({ retirement: { ...(c.retirement || {}), ...patch } }));
  const updateSabbatical = (id: string, patch: Record<string, any>) =>
    updateCareer(c => ({ sabbaticals: c.sabbaticals.map(s => s.id===id?{...s,...patch}:s) }));
  const addSabbatical = () => updateCareer(c => ({ sabbaticals: [{ id: uid(), targetDate: today() }, ...c.sabbaticals] }));

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider flex items-center gap-2"
            style={{ color: "var(--cr-fg)" }}>
            <Globe size={22} style={{color:"var(--cr-fgMuted)"}}/> command.center
          </h2>
          <p className="text-[11px] tracking-widest mt-1 italic" style={{color:"var(--cr-fgMuted)"}}>
            &gt; timeline · wellbeing · vision · freedom — career at altitude
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className="text-[10px] md:text-xs tracking-widest font-bold px-3 py-2 rounded-sm flex items-center gap-1.5 transition"
            style={{background:tab===t.id?`${t.color}33`:"var(--cr-card2)",
                    color:tab===t.id?t.color:"var(--cr-fgMuted)",
                    border:`1px solid ${tab===t.id?`${t.color}88`:"var(--cr-borderSoft)"}`}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Events" value={timeline.length} color="var(--cr-fg)"/>
        <Stat label="Avg sat" value={avgSat} color="var(--cr-accent3)"/>
        <Stat label="Check-ins" value={career.burnoutChecks.length} color="#a78bfa"/>
        <Stat label="Burnout" value={latestBurnout?burnoutRisk:"—"} color={burnoutColor}/>
      </div>

      <AnimatePresence mode="wait">
        {tab === "timeline" && (
          <motion.div key="tl" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-sm p-3 grid md:grid-cols-6 gap-2 hud-corner relative"
              style={{...card, borderColor:"var(--cr-border)"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <input type="date" value={eventDraft.date} onChange={e=>setEventDraft(d=>({...d,date:e.target.value}))}
                className="bg-transparent text-xs px-2 py-2 rounded-sm outline-none md:col-span-1" style={inputStyle}/>
              <select value={eventDraft.type} onChange={e=>setEventDraft(d=>({...d,type:e.target.value as TimelineEventType}))}
                className="bg-transparent text-xs px-2 py-2 rounded-sm outline-none md:col-span-1" style={inputStyle}>
                {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <input value={eventDraft.title??""} onChange={e=>setEventDraft(d=>({...d,title:e.target.value}))} placeholder="Event title"
                className="bg-transparent text-xs px-2 py-2 rounded-sm outline-none md:col-span-3" style={inputStyle}/>
              <button onClick={addEvent}
                className="text-xs tracking-widest font-bold px-3 py-2 rounded-sm"
                style={{background:"var(--cr-accent)",color:"var(--cr-bg)"}}>Add</button>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px"
                style={{background:"linear-gradient(to bottom, var(--cr-accent), #facc1555, transparent)"}}/>
              {timeline.slice(0, 50).map(ev => {
                const meta = EVENT_TYPES.find(t=>t.id===ev.type) || EVENT_TYPES[EVENT_TYPES.length-1];
                const manual = ev.id.length < 20 || !ev.id.startsWith("ach-") && !ev.id.startsWith("proj-");
                return (
                  <motion.div key={ev.id} layout className="relative rounded-sm p-3 mb-2 hud-corner"
                    style={{...card, borderColor:`${meta.color}66`}}>
                    <span className="c-tr"/><span className="c-bl"/>
                    <div className="absolute -left-[22px] top-4 w-3 h-3 rounded-full"
                      style={{background:meta.color,boxShadow:`0 0 8px ${meta.color}`}}/>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[10px] tracking-widest font-bold" style={{color:meta.color}}>{meta.label.toUpperCase()}</span>
                          <span className="text-[10px]" style={{color:"var(--cr-fgMuted)"}}>{ev.date}</span>
                        </div>
                        <h4 className="font-bold text-sm mt-0.5" style={{color:"var(--cr-fg)"}}>{ev.title}</h4>
                        {ev.description && <p className="text-[11px] mt-0.5 italic" style={{color:"var(--cr-fgMuted)"}}>{ev.description}</p>}
                      </div>
                      {manual && (
                        <button onClick={()=>delEvent(ev.id)} className="p-1 rounded-sm" style={{color:"#f87171"}}><Trash2 size={11}/></button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {timeline.length === 0 && (
                <div className="text-center py-10 text-sm italic" style={{color:"var(--cr-fgMuted)"}}>No events yet.</div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "wellbeing" && (
          <motion.div key="wb" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="grid md:grid-cols-2 gap-4">
            <div className="rounded-sm p-4 space-y-3 hud-corner relative"
              style={{...card, borderColor:"var(--cr-accent3)"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <h3 className="text-sm tracking-widest font-bold flex items-center gap-2" style={{color:"var(--cr-accent3)"}}>
                <TrendingUp size={14}/> WEEKLY SATISFACTION
              </h3>
              <div>
                <div className="flex items-center justify-between text-[10px] tracking-widest font-bold mb-1">
                  <span style={{color:"var(--cr-fgMuted)"}}>THIS WEEK</span>
                  <span style={{color:"var(--cr-accent3)"}}>{sat}/10</span>
                </div>
                <input type="range" min={1} max={10} value={sat} onChange={e=>setSat(Number(e.target.value))}
                  className="w-full" style={{accentColor:"var(--cr-accent3)"}}/>
              </div>
              <button onClick={logSatisfaction}
                className="text-xs tracking-widest font-bold px-3 py-2 rounded-sm"
                style={{background:"var(--cr-accent3)",color:"var(--cr-bg)"}}>Log this week</button>
              {career.satisfaction.length > 0 && (
                <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
                  {career.satisfaction.slice(0,10).map(s => (
                    <div key={s.date} className="flex items-center justify-between text-xs">
                      <span style={{color:"var(--cr-fgMuted)"}}>{s.date}</span>
                      <span style={{color:s.score>=7?"var(--cr-accent3)":s.score>=5?"#facc15":"#f87171"}}>{s.score}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-sm p-4 space-y-2 hud-corner relative"
              style={{...card, borderColor:`${burnoutColor}88`}}>
              <span className="c-tr"/><span className="c-bl"/>
              <h3 className="text-sm tracking-widest font-bold flex items-center gap-2" style={{color:burnoutColor}}>
                <Flame size={14}/> BURNOUT CHECK (Maslach)
              </h3>
              {([
                ["workload","Workload"],["control","Control"],["rewards","Rewards"],
                ["community","Community"],["fairness","Fairness"],["values","Values"],
              ] as const).map(([k,lbl]) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-[10px] tracking-widest font-bold mb-0.5">
                    <span style={{color:"var(--cr-fgMuted)"}}>{lbl.toUpperCase()}</span>
                    <span style={{color:burnoutColor}}>{burnout[k]}/10</span>
                  </div>
                  <input type="range" min={1} max={10} value={burnout[k]}
                    onChange={e=>setBurnout(b=>({...b,[k]:Number(e.target.value)}))}
                    className="w-full" style={{accentColor:burnoutColor}}/>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t" style={{borderColor:"var(--cr-borderSoft)"}}>
                <div>
                  <div className="text-[10px] tracking-widest font-bold" style={{color:"var(--cr-fgMuted)"}}>SCORE</div>
                  <div className="text-xl font-black" style={{color:burnoutColor}}>{burnoutScore}/10 · {burnoutRisk}</div>
                </div>
                <button onClick={logBurnout}
                  className="text-xs tracking-widest font-bold px-3 py-2 rounded-sm"
                  style={{background:burnoutColor,color:"var(--cr-bg)"}}>Log</button>
              </div>
            </div>

            {/* Burnout history sparkline */}
            {career.burnoutChecks.length > 1 && (() => {
              const hist = career.burnoutChecks.slice(0, 30).reverse();
              const W = 280, H = 70, PAD = 8;
              const pts = hist.map((b,i) => {
                const x = PAD + (i/(hist.length-1||1))*(W-PAD*2);
                const y = PAD + (1 - (b.score??5)/10)*(H-PAD*2);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(" ");
              const areaPts = `${PAD},${H-PAD} ${pts} ${W-PAD},${H-PAD}`;
              return (
                <div className="rounded-sm p-3 hud-corner relative" style={{...card,borderColor:`${burnoutColor}55`}}>
                  <span className="c-tr"/><span className="c-bl"/>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[10px] tracking-widest font-bold" style={{color:burnoutColor}}>
                      <TrendingUp size={10} className="inline mr-1"/> BURNOUT::HISTORY ({Math.min(hist.length,30)} checks)
                    </h4>
                    <span className="text-[9px] font-mono" style={{color:"var(--cr-fgMuted)"}}>lower = better</span>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{height:70}}>
                    <defs>
                      <linearGradient id="bfill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={burnoutColor} stopOpacity="0.35"/>
                        <stop offset="100%" stopColor={burnoutColor} stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {[0,0.25,0.5,0.75,1].map(t => (
                      <line key={t} x1={PAD} x2={W-PAD} y1={PAD+t*(H-PAD*2)} y2={PAD+t*(H-PAD*2)}
                        stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3"/>
                    ))}
                    <polygon points={areaPts} fill="url(#bfill)"/>
                    <polyline points={pts} fill="none" stroke={burnoutColor} strokeWidth="1.5" style={{filter:`drop-shadow(0 0 4px ${burnoutColor})`}}/>
                    {hist.map((b,i) => {
                      const x = PAD + (i/(hist.length-1||1))*(W-PAD*2);
                      const y = PAD + (1 - (b.score??5)/10)*(H-PAD*2);
                      return <circle key={i} cx={x} cy={y} r={i===hist.length-1?3:1.5} fill={burnoutColor}/>;
                    })}
                  </svg>
                </div>
              );
            })()}
          </motion.div>
        )}

        {tab === "hustle" && (
          <motion.div key="hu" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-sm p-3 hud-corner relative space-y-2" style={{...card, borderColor:"#fb923c66"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <h3 className="text-sm tracking-widest font-bold flex items-center gap-2" style={{color:"#fb923c"}}>
                <Zap size={14}/> SIDE_HUSTLE.forge
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                <input value={hustleDraft.name} onChange={e=>setHustleDraft(d=>({...d,name:e.target.value}))} placeholder="Hustle name"
                  className="bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}/>
                <select value={hustleDraft.stage} onChange={e=>setHustleDraft(d=>({...d,stage:e.target.value as any}))}
                  className="bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}>
                  <option value="idea" className="bg-gray-900">Idea</option>
                  <option value="building" className="bg-gray-900">Building</option>
                  <option value="launched" className="bg-gray-900">Launched</option>
                  <option value="scaling" className="bg-gray-900">Scaling</option>
                </select>
                <label className="flex items-center gap-2 px-2 py-1.5 rounded text-xs" style={inputStyle}>
                  <DollarSign size={11} style={{color:"#34d399"}}/>
                  <input type="number" value={hustleDraft.revenue||""} onChange={e=>setHustleDraft(d=>({...d,revenue:Number(e.target.value)||0}))}
                    placeholder="$/mo" className="bg-transparent outline-none flex-1"/>
                </label>
                <label className="flex items-center gap-2 px-2 py-1.5 rounded text-xs" style={inputStyle}>
                  <Clock size={11} style={{color:"#fb923c"}}/>
                  <input type="number" value={hustleDraft.hoursPerWeek||""} onChange={e=>setHustleDraft(d=>({...d,hoursPerWeek:Number(e.target.value)||0}))}
                    placeholder="h/wk" className="bg-transparent outline-none flex-1"/>
                </label>
              </div>
              <input value={hustleDraft.goal} onChange={e=>setHustleDraft(d=>({...d,goal:e.target.value}))} placeholder="Goal / next milestone"
                className="w-full bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}/>
              <button onClick={()=>{
                if(!hustleDraft.name.trim()) return;
                updateCareer(c=>({sideHustles:[{id:uid(),name:hustleDraft.name.trim(),hoursPerWeek:hustleDraft.hoursPerWeek,monthlyIncome:hustleDraft.revenue,notes:hustleDraft.goal||undefined},...c.sideHustles]}));
                setHustleDraft({name:"",revenue:0,hoursPerWeek:0,goal:"",stage:"idea"});
              }} className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm"
                style={{background:"#fb923c",color:"#000"}}>[ + ADD_HUSTLE ]</button>
            </div>
            {career.sideHustles.length === 0 && <p className="text-xs italic" style={{color:"var(--cr-fgMuted)"}}>No side hustles logged. Ideas → revenue → freedom.</p>}
            <div className="grid md:grid-cols-2 gap-2">
              {career.sideHustles.map(h => {
                const rate = h.hoursPerWeek>0 ? Math.round((h.monthlyIncome/(h.hoursPerWeek*4.33))*100)/100 : 0;
                return (
                  <div key={h.id} className="rounded-sm p-3 hud-corner relative group"
                    style={{...card, borderColor:"#fb923c44"}}>
                    <span className="c-tr"/><span className="c-bl"/>
                    <div className="flex items-start gap-2">
                      <Zap size={13} className="mt-0.5 shrink-0" style={{color:"#fb923c"}}/>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm" style={{color:"var(--cr-fg)"}}>{h.name}</div>
                        <div className="flex gap-3 mt-1 text-[10px] font-mono flex-wrap">
                          <span style={{color:"#34d399"}}>${h.monthlyIncome}/mo</span>
                          <span style={{color:"#fb923c"}}>{h.hoursPerWeek}h/wk</span>
                          {rate>0 && <span style={{color:"#a78bfa"}}>${rate}/hr</span>}
                        </div>
                        {h.notes && <p className="text-[11px] mt-1" style={{color:"var(--cr-fgMuted)"}}>{h.notes}</p>}
                      </div>
                      <button onClick={()=>updateCareer(c=>({sideHustles:c.sideHustles.filter(x=>x.id!==h.id)}))}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition" style={{color:"var(--cr-red,#f87171)"}}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Total revenue/hours */}
            {career.sideHustles.length > 0 && (
              <div className="rounded-sm p-3 flex items-center justify-around hud-corner" style={{background:"var(--cr-card2)",border:"1px solid #34d39955"}}>
                <span className="c-tr"/><span className="c-bl"/>
                <Stat label="TOTAL REV" value={`$${career.sideHustles.reduce((n,h)=>n+h.monthlyIncome,0)}/mo`} color="#34d399"/>
                <Stat label="TOTAL TIME" value={`${career.sideHustles.reduce((n,h)=>n+h.hoursPerWeek,0)}h/wk`} color="#fb923c"/>
                <Stat label="AVG $/HR" value={`$${Math.round(career.sideHustles.reduce((n,h)=>n+(h.hoursPerWeek>0?(h.monthlyIncome/(h.hoursPerWeek*4.33)):0),0)/Math.max(1,career.sideHustles.filter(h=>h.hoursPerWeek>0).length))}`} color="#a78bfa"/>
              </div>
            )}
          </motion.div>
        )}

        {tab === "vision" && (
          <motion.div key="vb" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-sm p-3 flex gap-2 hud-corner relative"
              style={{...card, borderColor:"#f472b666"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <input value={visionText} onChange={e=>setVisionText(e.target.value)} placeholder="Drop a quote, goal, or idea…"
                className="flex-1 bg-transparent px-2 py-2 rounded-sm text-sm outline-none" style={inputStyle}/>
              <button onClick={()=>addVision("quote")}
                className="text-[10px] tracking-widest font-bold px-2 py-2 rounded-sm"
                style={{background:"#f472b633",color:"#f472b6",border:`1px solid #f472b666`}}>+ Quote</button>
              <button onClick={()=>addVision("goal")}
                className="text-[10px] tracking-widest font-bold px-2 py-2 rounded-sm"
                style={{background:"#facc1533",color:"#facc15",border:`1px solid #facc1566`}}>+ Goal</button>
            </div>
            {career.visionBoard.length === 0 && (
              <div className="rounded-sm p-10 text-center hud-corner relative"
                style={{background:"var(--cr-card2)",border:"1px dashed var(--cr-border)"}}>
                <span className="c-tr"/><span className="c-bl"/>
                <Sparkles size={28} className="mx-auto mb-2" style={{color:"#f472b6"}}/>
                <p className="text-xs tracking-widest font-bold" style={{color:"#f472b6"}}>Your board is blank.</p>
                <p className="text-[11px] mt-1 tracking-wide italic" style={{color:"var(--cr-fgMuted)"}}>
                  What do you want to build? Speak it into existence.
                </p>
              </div>
            )}
            <div className="columns-1 md:columns-2 gap-3 [column-fill:_balance]">
              {career.visionBoard.map(v => (
                <motion.div key={v.id} layout
                  className="break-inside-avoid rounded-sm p-4 mb-3 relative hud-corner"
                  style={{...card, borderColor: v.type==="goal"?"#facc1566":"#f472b655"}}>
                  <span className="c-tr"/><span className="c-bl"/>
                  <div className="text-[9px] tracking-widest font-bold mb-1" style={{color:v.type==="goal"?"#facc15":"#f472b6"}}>{v.type.toUpperCase()}</div>
                  <p className="italic" style={{color:"var(--cr-fg)"}}>{v.type==="quote" ? `"${v.content}"` : v.content}</p>
                  <button onClick={()=>delVision(v.id)}
                    className="absolute top-2 right-2 p-1 rounded-sm opacity-60 hover:opacity-100" style={{color:"#f87171"}}>
                    <Trash2 size={11}/>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "ip" && (
          <motion.div key="ip" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-sm p-3 hud-corner relative space-y-2" style={{...card,borderColor:"#22d3ee66"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <h3 className="text-sm tracking-widest font-bold flex items-center gap-2" style={{color:"var(--cr-accent)"}}>
                <FileKey size={14}/> IP_REGISTRY
              </h3>
              <div className="grid md:grid-cols-3 gap-2">
                <select value={ipDraft.type} onChange={e=>setIpDraft(d=>({...d,type:e.target.value as any}))}
                  className="bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}>
                  <option value="patent" className="bg-gray-900">Patent</option>
                  <option value="copyright" className="bg-gray-900">Copyright</option>
                  <option value="trademark" className="bg-gray-900">Trademark</option>
                  <option value="idea" className="bg-gray-900">Idea (seed)</option>
                </select>
                <input value={ipDraft.title} onChange={e=>setIpDraft(d=>({...d,title:e.target.value}))} placeholder="Title / ID" className="md:col-span-2 bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}/>
              </div>
              <textarea value={ipDraft.notes} onChange={e=>setIpDraft(d=>({...d,notes:e.target.value}))} rows={2} placeholder="Notes, filing #, dates…"
                className="w-full bg-transparent px-2 py-1.5 rounded text-xs outline-none resize-none" style={inputStyle}/>
              <button onClick={()=>{
                if(!ipDraft.title.trim()) return;
                updateCareer(c=>({ip:[{id:uid(),type:ipDraft.type,title:ipDraft.title.trim(),notes:ipDraft.notes||undefined,date:today()},...c.ip]}));
                setIpDraft({type:"patent",title:"",notes:""});
              }} className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm" style={{background:"var(--cr-accent)",color:"var(--cr-bg)"}}>[ + LOG_IP ]</button>
            </div>
            {career.ip.length === 0 && <p className="text-xs italic" style={{color:"var(--cr-fgMuted)"}}>No IP logged. Patents, TM, ©, raw ideas.</p>}
            <div className="grid md:grid-cols-2 gap-2">
              {career.ip.map(ip => {
                const color = ip.type==="patent"?"var(--cr-accent)":ip.type==="trademark"?"#a78bfa":ip.type==="copyright"?"#34d399":"#facc15";
                return (
                  <div key={ip.id} className="rounded-sm p-3 hud-corner relative group" style={{...card,borderColor:`${color}44`}}>
                    <span className="c-tr"/><span className="c-bl"/>
                    <div className="flex items-start gap-2">
                      <FileKey size={13} className="mt-0.5 shrink-0" style={{color}}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] tracking-widest font-bold" style={{color}}>{ip.type.toUpperCase()}{ip.date?` · ${ip.date}`:""}</div>
                        <div className="font-bold text-sm" style={{color:"var(--cr-fg)"}}>{ip.title}</div>
                        {ip.notes && <div className="text-[11px] mt-0.5" style={{color:"var(--cr-fgMuted)"}}>{ip.notes}</div>}
                      </div>
                      <button onClick={()=>updateCareer(c=>({ip:c.ip.filter(x=>x.id!==ip.id)}))} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition" style={{color:"var(--cr-red,#f87171)"}}><Trash2 size={11}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab === "speaking" && (
          <motion.div key="sp" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
            <div className="rounded-sm p-3 hud-corner relative space-y-2" style={{...card,borderColor:"#a78bfa66"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <h3 className="text-sm tracking-widest font-bold flex items-center gap-2" style={{color:"#a78bfa"}}>
                <Mic size={14}/> SPEAKING_EVENTS
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                <input value={speakDraft.title} onChange={e=>setSpeakDraft(d=>({...d,title:e.target.value}))} placeholder="Talk title" className="bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}/>
                <input value={speakDraft.event} onChange={e=>setSpeakDraft(d=>({...d,event:e.target.value}))} placeholder="Event / venue" className="bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}/>
                <input type="date" value={speakDraft.date} onChange={e=>setSpeakDraft(d=>({...d,date:e.target.value}))} className="bg-transparent px-2 py-1.5 rounded text-xs outline-none" style={inputStyle}/>
              </div>
              <textarea value={speakDraft.notes} onChange={e=>setSpeakDraft(d=>({...d,notes:e.target.value}))} rows={2} placeholder="Notes / key takeaways"
                className="w-full bg-transparent px-2 py-1.5 rounded text-xs outline-none resize-none" style={inputStyle}/>
              <button onClick={()=>{
                if(!speakDraft.title.trim()) return;
                updateCareer(c=>({speaking:[{id:uid(),title:speakDraft.title.trim(),event:speakDraft.event,date:speakDraft.date||today(),notes:speakDraft.notes||undefined},...c.speaking]}));
                setSpeakDraft({title:"",event:"",date:"",notes:""});
              }} className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm" style={{background:"#a78bfa",color:"#000"}}>[ + ADD_EVENT ]</button>
            </div>
            {career.speaking.length === 0 && <p className="text-xs italic" style={{color:"var(--cr-fgMuted)"}}>No talks logged. Track conferences, meetups, podcasts.</p>}
            <div className="space-y-2">
              {[...career.speaking].sort((a,b)=>b.date.localeCompare(a.date)).map(sp => (
                <div key={sp.id} className="rounded-sm p-3 hud-corner relative group flex items-start gap-2" style={{...card,borderColor:"#a78bfa44"}}>
                  <span className="c-tr"/><span className="c-bl"/>
                  <Mic size={13} className="mt-0.5 shrink-0" style={{color:"#a78bfa"}}/>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{color:"var(--cr-fg)"}}>{sp.title}</div>
                    <div className="text-[10px] font-mono mt-0.5" style={{color:"#a78bfa"}}>
                      {sp.event}{sp.event && sp.date ? " · ":""}{sp.date}
                    </div>
                    {sp.notes && <div className="text-[11px] mt-0.5" style={{color:"var(--cr-fgMuted)"}}>{sp.notes}</div>}
                  </div>
                  <button onClick={()=>updateCareer(c=>({speaking:c.speaking.filter(x=>x.id!==sp.id)}))} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition" style={{color:"var(--cr-red,#f87171)"}}><Trash2 size={11}/></button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "freedom" && (
          <motion.div key="fr" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="grid md:grid-cols-2 gap-4">
            <div className="rounded-sm p-4 space-y-2 hud-corner relative"
              style={{...card, borderColor:"#facc1566"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <h3 className="text-sm tracking-widest font-bold flex items-center gap-2" style={{color:"#facc15"}}>
                <Landmark size={14}/> RETIREMENT
              </h3>
              <NumField label="Current savings ($)" value={career.retirement?.currentSavings} onChange={v=>updateRetirement({currentSavings:v})} inputStyle={inputStyle}/>
              <NumField label="Target annual spend ($)" value={career.retirement?.targetAnnual} onChange={v=>updateRetirement({targetAnnual:v})} inputStyle={inputStyle}/>
              <NumField label="Target age" value={career.retirement?.targetAge} onChange={v=>updateRetirement({targetAge:v})} inputStyle={inputStyle}/>
              <NumField label="Projected age" value={career.retirement?.projectedAge} onChange={v=>updateRetirement({projectedAge:v})} inputStyle={inputStyle}/>
              <textarea defaultValue={career.retirement?.notes??""} onBlur={e=>updateRetirement({notes:e.target.value})} placeholder="Notes / strategy…" rows={2}
                className="w-full bg-transparent px-2 py-2 rounded-sm text-xs outline-none resize-none mt-1" style={inputStyle}/>
            </div>
            <div className="rounded-sm p-4 space-y-2 hud-corner relative"
              style={{...card, borderColor:"#a78bfa66"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <div className="flex items-center justify-between">
                <h3 className="text-sm tracking-widest font-bold flex items-center gap-2" style={{color:"#a78bfa"}}>
                  <TreePine size={14}/> SABBATICALS
                </h3>
                <button onClick={addSabbatical}
                  className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
                  style={{background:"#a78bfa22",color:"#a78bfa",border:"1px solid #a78bfa66"}}>+ Plan</button>
              </div>
              {career.sabbaticals.length === 0 && <p className="text-xs italic" style={{color:"var(--cr-fgMuted)"}}>No sabbatical plans yet.</p>}
              {career.sabbaticals.map(s => (
                <div key={s.id} className="rounded-sm p-2 space-y-1 hud-corner relative"
                  style={{background:"var(--cr-card2)",border:"1px solid var(--cr-borderSoft)"}}>
                  <span className="c-tr"/><span className="c-bl"/>
                  <input type="date" value={s.targetDate??""} onChange={e=>updateSabbatical(s.id,{targetDate:e.target.value})}
                    className="bg-transparent text-xs px-2 py-1 rounded-sm outline-none w-full" style={inputStyle}/>
                  <div className="grid grid-cols-2 gap-1">
                    <input type="number" placeholder="Savings target" value={s.savingsTarget??""}
                      onChange={e=>updateSabbatical(s.id,{savingsTarget:Number(e.target.value)||undefined})}
                      className="bg-transparent text-xs px-2 py-1 rounded-sm outline-none" style={inputStyle}/>
                    <input type="number" placeholder="Current savings" value={s.savingsCurrent??""}
                      onChange={e=>updateSabbatical(s.id,{savingsCurrent:Number(e.target.value)||undefined})}
                      className="bg-transparent text-xs px-2 py-1 rounded-sm outline-none" style={inputStyle}/>
                  </div>
                  <input type="number" placeholder="Duration (weeks)" value={s.durationWeeks??""}
                    onChange={e=>updateSabbatical(s.id,{durationWeeks:Number(e.target.value)||undefined})}
                    className="bg-transparent text-xs px-2 py-1 rounded-sm outline-none w-full" style={inputStyle}/>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NumField({label,value,onChange,inputStyle}:{label:string;value:number|undefined;onChange:(v:number|undefined)=>void;inputStyle:React.CSSProperties}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-widest font-bold mb-0.5" style={{color:"var(--cr-fgMuted)"}}>{label.toUpperCase()}</div>
      <input type="number" value={value??""} onChange={e=>onChange(e.target.value?Number(e.target.value):undefined)}
        className="w-full bg-transparent px-2 py-1.5 rounded-sm text-sm outline-none" style={inputStyle}/>
    </label>
  );
}

function Stat({label,value,color}:{label:string;value:number|string;color:string}) {
  return (
    <div className="rounded-sm p-2.5 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${typeof color === "string" && color.startsWith("var") ? "var(--cr-borderSoft)" : `${color}55`}`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="text-[9px] tracking-widest font-bold" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-lg font-black leading-tight mt-0.5 truncate" style={{color:"var(--cr-fg)"}}>{value}</div>
    </div>
  );
}
