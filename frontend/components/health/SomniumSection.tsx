"use client";

/**
 * SomniumSection — sleep journal, sleep bank, circadian checkpoints, routines.
 *
 * Wave 3:
 *  - Quick-log last night (bed/wake times -> auto duration)
 *  - Quality 1-10, latency, wake-ups, dream, hygiene checklist
 *  - Sleep bank visual (credit/debt), nudge thresholds (5h soft / 10h deload)
 *  - 7-day mini history
 *  - Bedtime & wake routine builders (adherence %)
 *  - Circadian checkpoints (first sun, first meal, last meal, caffeine cutoff, screens off)
 */

import { useMemo, useState } from "react";
import { Moon, Sun, Clock, AlertTriangle, Plus, Trash2, CheckCircle2, Sunrise, Sunset, Coffee, X } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  durationHours, computeSleepBank, sleepScore, hygieneScore,
  routineAdherence, avgSleepHours, SLEEP_DEBT_WARN, SLEEP_DEBT_STRONG, formatHours,
} from "../../lib/healthAnalytics";
import type { SleepEntry, SleepHygieneTick, CircadianEntry, RoutineStep } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0,10); }
function yesterdayIso() { const d = new Date(Date.now()-86400000); return d.toISOString().slice(0,10); }
function uid() { return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }

function toLocalInput(iso: string): string {
  // Parse ISO and convert to YYYY-MM-DDTHH:MM for datetime-local input in local TZ
  const d = new Date(iso);
  const pad = (n:number)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultLastNight(): { bed: string; wake: string } {
  // Default: last night 23:00 -> today 07:00 (IST-ish)
  const now = new Date();
  const wake = new Date(now); wake.setHours(7,0,0,0);
  if (now.getHours() < 7) { wake.setDate(wake.getDate()-1); } // early morning
  const bed = new Date(wake); bed.setDate(bed.getDate()-1); bed.setHours(23,0,0,0);
  return { bed: bed.toISOString(), wake: wake.toISOString() };
}

const HYGIENE_ITEMS: { key: keyof SleepHygieneTick; label: string; icon: string }[] = [
  { key: "noCaffeineAfter14",  label: "No caffeine after 2pm",      icon: "☕" },
  { key: "sunlightMorning",    label: "Sunlight within 30m wake",   icon: "🌅" },
  { key: "exercisedToday",     label: "Trained / moved today",      icon: "🏋️" },
  { key: "noHeavyMealLate",    label: "No heavy meal <2h bed",      icon: "🍛" },
  { key: "noAlcohol",          label: "No alcohol tonight",         icon: "🍷" },
  { key: "noScreensBeforeBed", label: "Screens off 30m bed",        icon: "📵" },
  { key: "relaxedBeforeBed",   label: "Wind-down ritual (5m+)",     icon: "🧘" },
  { key: "darkRoom",           label: "Pitch-black room",           icon: "🌑" },
  { key: "coolRoom",           label: "Cool room (22-26°C)",        icon: "❄️" },
  { key: "consistentSchedule", label: "Consistent bed/wake ±30m",   icon: "⏰" },
];

function BankBar({ bankHours }: { bankHours: number }) {
  // Map bank range [-20, +10] to 0-100% width
  const RANGE = 30;
  const zeroPct = (SLEEP_DEBT_STRONG*-1 === -10 ? (20/30) : (20/RANGE))*100; // where the 0 mark sits = 20/30 ≈ 66.6%
  const pct = Math.max(0, Math.min(100, ((bankHours + 20)/RANGE)*100));
  const color = bankHours <= -SLEEP_DEBT_STRONG ? "#ef4444"
    : bankHours <= -SLEEP_DEBT_WARN ? "#f59e0b"
    : bankHours > 0 ? "#a78bfa" : "#10b981";
  return (
    <div style={{position:"relative", height:18, background:"var(--hlth-card2)", borderRadius:4, overflow:"hidden", border:"1px solid var(--hlth-border-soft)"}}>
      {/* zero marker */}
      <div style={{position:"absolute", left:`${zeroPct}%`, top:0, bottom:0, width:1, background:"var(--hlth-muted)", opacity:0.5}}/>
      <div style={{position:"absolute", left: bankHours < 0 ? `${pct}%` : `${zeroPct}%`, right: bankHours < 0 ? `${100-zeroPct}%` : `${100-pct}%`, top:3, bottom:3, background:color, borderRadius:3, transition:"all 0.3s", boxShadow:`0 0 8px ${color}66`}}/>
      {/* tick labels */}
      <div style={{position:"absolute", left:4, top:0, bottom:0, display:"flex",alignItems:"center",fontSize:9,fontFamily:"var(--hlth-font-mono)",color:"var(--hlth-muted)"}}>-20h</div>
      <div style={{position:"absolute", right:4, top:0, bottom:0, display:"flex",alignItems:"center",fontSize:9,fontFamily:"var(--hlth-font-mono)",color:"var(--hlth-muted)"}}>+10h</div>
    </div>
  );
}

function SleepHistory({ entries, idealHours }: { entries: SleepEntry[]; idealHours: number }) {
  const last7 = useMemo(() =>
    [...entries].sort((a,b)=>a.date.localeCompare(b.date)).slice(-7),
    [entries]);
  const maxH = Math.max(idealHours+2, 10);
  return (
    <div style={{display:"flex", alignItems:"flex-end", gap:8, height:120, marginTop:8}}>
      {Array.from({length:7}).map((_, i) => {
        const e = last7[i];
        const h = e?.durationHours ?? 0;
        const ratio = Math.min(1, h/maxH);
        const barH = ratio * 100;
        const ok = e && h >= idealHours - 0.5;
        const color = !e ? "rgba(148,163,184,0.2)"
          : h < idealHours - 2 ? "#ef4444"
          : h < idealHours - 0.5 ? "#f59e0b"
          : ok ? "#a78bfa" : "#10b981";
        return (
          <div key={i} style={{flex:1, display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:9, color:"var(--hlth-muted)", letterSpacing:"0.05em"}}>
              {e ? formatHours(h) : "—"}
            </div>
            <div style={{width:"100%", height:80, display:"flex",alignItems:"flex-end"}}>
              <div style={{width:"100%", height:`${barH}%`, background:color, borderRadius:"4px 4px 0 0", transition:"height 0.4s", boxShadow: e ? `0 0 8px ${color}55` : "none"}}/>
            </div>
            <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:9, color:"var(--hlth-muted)", letterSpacing:"0.05em"}}>
              {e ? new Date(e.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short"}) : ["S","M","T","W","T","F","S"][i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SomniumSection() {
  const { health, updateHealth } = useStore();
  const today = todayIso();
  const [showForm, setShowForm] = useState(false);

  // Last night default target is today's "wake day"
  const defaults = defaultLastNight();
  const [bedTime, setBedTime] = useState(defaults.bed);
  const [wakeTime, setWakeTime] = useState(defaults.wake);
  const [quality, setQuality] = useState(7);
  const [latency, setLatency] = useState(15);
  const [wakeUps, setWakeUps] = useState(0);
  const [dream, setDream] = useState("");
  const [ticks, setTicks] = useState<SleepHygieneTick>({});
  const [dreamOpen, setDreamOpen] = useState<string|null>(null);

  const dur = useMemo(() => durationHours(bedTime, wakeTime), [bedTime, wakeTime]);

  const lastNight = useMemo(() => {
    return [...health.sleep].sort((a,b)=>b.date.localeCompare(a.date))[0];
  }, [health.sleep]);

  const bank = useMemo(() => computeSleepBank(health.sleep, health.profile.idealSleepHours), [health.sleep, health.profile.idealSleepHours]);
  const avg7 = useMemo(() => avgSleepHours(health.sleep, 7), [health.sleep]);
  const lastScore = sleepScore(lastNight, health.profile.idealSleepHours);
  const hyg = hygieneScore(lastNight?.hygiene);

  const todaysCircadian = useMemo(() => {
    return health.circadian.find(c => c.date === today) ?? { date: today };
  }, [health.circadian, today]);

  const saveLastNight = () => {
    if (dur < 2 || dur > 14) { window.alert("Sleep duration looks off — check your times."); return; }
    const wakeDate = new Date(wakeTime).toISOString().slice(0,10);
    const entry: SleepEntry = {
      id: uid(),
      date: wakeDate,
      bedTime, wakeTime,
      durationHours: Math.round(dur*10)/10,
      quality, latencyMin: latency, wakeUps,
      dream: dream.trim() || undefined,
      hygiene: ticks,
    };
    updateHealth(h => {
      const filtered = h.sleep.filter(s => s.date !== wakeDate);
      return { sleep: [...filtered, entry].sort((a,b)=>a.date.localeCompare(b.date)) };
    });
    // reset form
    setDream(""); setTicks({}); setQuality(7); setLatency(15); setWakeUps(0);
    setShowForm(false);
  };

  const deleteEntry = (id: string) => {
    updateHealth(h => ({ sleep: h.sleep.filter(s => s.id !== id) }));
  };

  const toggleStep = (routine: "bedtimeRoutine"|"wakeRoutine", stepId: string) => {
    updateHealth(h => {
      const r = h[routine];
      return {
        [routine]: { ...r, steps: r.steps.map(s => s.id===stepId ? { ...s, doneToday: !s.doneToday } : s) },
      } as any;
    });
  };

  const addStep = (routine: "bedtimeRoutine"|"wakeRoutine") => {
    const label = window.prompt("Step label?");
    if (!label) return;
    updateHealth(h => {
      const r = h[routine];
      return { [routine]: { ...r, steps: [...r.steps, { id: uid(), label }] } } as any;
    });
  };

  const removeStep = (routine: "bedtimeRoutine"|"wakeRoutine", stepId: string) => {
    updateHealth(h => {
      const r = h[routine];
      return { [routine]: { ...r, steps: r.steps.filter(s => s.id !== stepId) } } as any;
    });
  };

  const setCircadian = (key: keyof Omit<CircadianEntry,"date">, val: string) => {
    updateHealth(h => {
      const existing = h.circadian.find(c=>c.date===today);
      const next: CircadianEntry = { ...(existing ?? { date: today }), [key]: val || undefined };
      const others = h.circadian.filter(c=>c.date!==today);
      // prune empty
      const hasAny = Object.entries(next).some(([k,v])=>k!=="date" && v);
      return { circadian: hasAny ? [...others, next] : others };
    });
  };

  const bedAdherence = routineAdherence(health.bedtimeRoutine.steps);
  const wakeAdherence = routineAdherence(health.wakeRoutine.steps);

  const circadianCheckpoints: { key: keyof Omit<CircadianEntry,"date">; label: string; icon: React.ReactNode; tip: string; }[] = [
    { key:"firstSunlight",  label:"First sunlight",     icon:<Sunrise size={12}/>, tip:"Within 30m of waking" },
    { key:"firstMeal",      label:"First meal",        icon:<Coffee size={12}/>,  tip:"Breaking fast" },
    { key:"caffeineCutoff", label:"Caffeine cutoff",   icon:<Coffee size={12}/>,  tip:"Ideally before 2pm" },
    { key:"lastMeal",       label:"Last meal",         icon:<Sunset size={12}/>,  tip:"2-3h before bed" },
    { key:"screenOff",      label:"Screens off",       icon:<Moon size={12}/>,    tip:"30m+ pre-bed" },
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", gap:18}}>
      {/* Header */}
      <div className="hlth-card">
        <div className="hlth-card-h">§03 // SOMNIUM · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}</div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16}}>
          <div>
            <h2 style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:24, letterSpacing:"0.05em", margin:"4px 0 4px", color:"#a78bfa"}}>Sleep bank &amp; rhythm</h2>
            <div className="hlth-subtle" style={{fontSize:11, letterSpacing:"0.1em"}}>
              log last night · track debt · build routines · circadian anchors
            </div>
          </div>
          <div style={{display:"flex", gap:14, flexWrap:"wrap", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
            <Kpi label="last night" value={lastNight ? formatHours(lastNight.durationHours) : "—"} color="#a78bfa"/>
            <Kpi label="7-day avg" value={formatHours(avg7)} color="#60a5fa"/>
            <Kpi label="sleep score" value={lastNight ? `${Math.round(lastScore*100)}/100` : "—"} color="#10b981"/>
            <Kpi label="hygiene" value={hyg ? `${hyg}/10` : "—"} color={hyg>=7?"#10b981":hyg>=4?"#f59e0b":"#ef4444"}/>
          </div>
        </div>

        {/* Sleep bank */}
        <div style={{marginTop:18}}>
          <div style={{display:"flex", justifyContent:"space-between", fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-muted)", letterSpacing:"0.1em", marginBottom:6}}>
            <span>SLEEP BANK (14-day rolling)</span>
            <span style={{color: bank<=-SLEEP_DEBT_STRONG?"#ef4444":bank<=-SLEEP_DEBT_WARN?"#f59e0b":bank>0?"#a78bfa":"#10b981", fontWeight:700}}>
              {bank >= 0 ? `+${bank.toFixed(1)}h credit` : `${Math.abs(bank).toFixed(1)}h debt`}
            </span>
          </div>
          <BankBar bankHours={bank}/>
          {bank <= -SLEEP_DEBT_STRONG && (
            <div style={{display:"flex",alignItems:"flex-start",gap:8, marginTop:10, padding:"10px 12px", borderRadius:6, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
              <AlertTriangle size={14}/>
              <div>
                <b>10h+ sleep debt.</b> Pushing a deload to Workout — drop volume 30-50%, skip heavy compounds, focus on mobility. Don't be a hero.
              </div>
            </div>
          )}
          {bank > -SLEEP_DEBT_STRONG && bank <= -SLEEP_DEBT_WARN && (
            <div style={{display:"flex",alignItems:"flex-start",gap:8, marginTop:10, padding:"10px 12px", borderRadius:6, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
              <AlertTriangle size={14}/>
              <div><b>5h+ debt.</b> Consider skipping PR attempts today. Caffeine will only mask the crash.</div>
            </div>
          )}
        </div>

        <SleepHistory entries={health.sleep} idealHours={health.profile.idealSleepHours}/>
      </div>

      {/* Log last night */}
      <div className="hlth-card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <div className="hlth-card-h">// log last night</div>
          {!showForm && (
            <button className="hlth-btn" onClick={()=>setShowForm(true)} style={{padding:"6px 12px", fontSize:10, display:"inline-flex",alignItems:"center",gap:4}}>
              <Plus size={10}/> LOG SLEEP
            </button>
          )}
        </div>
        {showForm ? (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10}}>
              <Field label="Bed time">
                <input type="datetime-local" value={toLocalInput(bedTime)} onChange={e=>setBedTime(new Date(e.target.value).toISOString())}
                  style={inputStyle}/>
              </Field>
              <Field label="Wake time">
                <input type="datetime-local" value={toLocalInput(wakeTime)} onChange={e=>setWakeTime(new Date(e.target.value).toISOString())}
                  style={inputStyle}/>
              </Field>
              <Field label={`Duration · ${formatHours(dur)}`}>
                <div style={{...inputStyle, color: dur<5?"#ef4444":dur<7?"#f59e0b":"#10b981", fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:16}}>
                  {formatHours(dur)}
                </div>
              </Field>
              <Field label="Quality (1-10)">
                <input type="range" min={1} max={10} value={quality} onChange={e=>setQuality(+e.target.value)} style={{accentColor:"#a78bfa", width:"100%"}}/>
                <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", textAlign:"center"}}>{quality}/10</div>
              </Field>
              <Field label="Latency (min)">
                <input type="number" min={0} max={180} value={latency} onChange={e=>setLatency(+e.target.value)} style={inputStyle}/>
              </Field>
              <Field label="Wake-ups">
                <input type="number" min={0} max={20} value={wakeUps} onChange={e=>setWakeUps(+e.target.value)} style={inputStyle}/>
              </Field>
            </div>

            <Field label="Sleep hygiene (10 checkpoints)">
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:6}}>
                {HYGIENE_ITEMS.map(item => (
                  <label key={item.key} style={{display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:4, background: ticks[item.key] ? "rgba(167,139,250,0.1)" : "var(--hlth-card2)", border:"1px solid var(--hlth-border-soft)", cursor:"pointer", fontSize:11, fontFamily:"var(--hlth-font-mono)"}}>
                    <input type="checkbox" checked={!!ticks[item.key]} onChange={e=>setTicks(t=>({...t, [item.key]: e.target.checked}))} style={{accentColor:"#a78bfa"}}/>
                    <span>{item.icon}</span>
                    <span style={{color:"var(--hlth-fg)"}}>{item.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Dream journal (optional, stored locally)">
              <textarea value={dream} onChange={e=>setDream(e.target.value)} rows={2} placeholder="Weird dreams? Note them..." style={{...inputStyle, resize:"vertical"}}/>
            </Field>

            <div style={{display:"flex", gap:8}}>
              <button className="hlth-btn" onClick={saveLastNight} style={{padding:"8px 14px", fontSize:11}}>SAVE</button>
              <button className="hlth-btn hlth-btn-ghost" onClick={()=>setShowForm(false)} style={{padding:"8px 14px", fontSize:11}}>CANCEL</button>
            </div>
          </div>
        ) : (
          <div style={{padding:"20px", textAlign:"center", fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-muted)", letterSpacing:"0.1em", border:"1px dashed var(--hlth-border-soft)", borderRadius:8}}>
            <Moon size={20} style={{opacity:0.3, margin:"0 auto 6px", display:"block"}}/>
            {lastNight ? `Last logged: ${lastNight.date} · ${formatHours(lastNight.durationHours)} · quality ${lastNight.quality}/10` : "log your first night to start the bank"}
          </div>
        )}
      </div>

      {/* Recent entries */}
      {health.sleep.length > 0 && (
        <div className="hlth-card">
          <div className="hlth-card-h">// recent nights</div>
          <div style={{display:"flex", flexDirection:"column", gap:4, marginTop:8}}>
            {[...health.sleep].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(e => (
              <div key={e.id} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:6, background:"var(--hlth-card2)", border:"1px solid var(--hlth-border-soft)", fontSize:11, fontFamily:"var(--hlth-font-mono)"}}>
                <Moon size={12} style={{color:"#a78bfa"}}/>
                <span style={{color:"var(--hlth-muted)", minWidth:90}}>{e.date}</span>
                <span style={{color:"var(--hlth-fg)", fontWeight:700, minWidth:70}}>{formatHours(e.durationHours)}</span>
                <span style={{color:"var(--hlth-muted)"}}>Q{e.quality}/10</span>
                {e.latencyMin != null && <span style={{color:"var(--hlth-muted)"}}>lat {e.latencyMin}m</span>}
                {e.wakeUps != null && e.wakeUps > 0 && <span style={{color:"#f59e0b"}}>×{e.wakeUps} wakeups</span>}
                {e.hygiene && <Badge label={`hyg ${hygieneScore(e.hygiene)}/10`} color="#a78bfa"/>}
                {e.dream && (
                  <button onClick={()=>setDreamOpen(dreamOpen===e.id?null:e.id)} style={{marginLeft:"auto", background:"transparent", border:"none", color:"#a78bfa", cursor:"pointer", fontSize:10}}>
                    dream
                  </button>
                )}
                <button onClick={()=>deleteEntry(e.id)} style={{marginLeft:e.dream?"0":"auto", background:"transparent", border:"none", color:"var(--hlth-muted)", cursor:"pointer"}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
          {dreamOpen && (
            <div style={{marginTop:8, padding:10, borderRadius:6, background:"var(--hlth-card2)", border:"1px solid var(--hlth-border-soft)", fontSize:12, fontStyle:"italic", color:"var(--hlth-fg)"}}>
              {health.sleep.find(s=>s.id===dreamOpen)?.dream}
            </div>
          )}
        </div>
      )}

      {/* Circadian */}
      <div className="hlth-card">
        <div className="hlth-card-h">// circadian anchors</div>
        <div className="hlth-subtle" style={{fontSize:10, letterSpacing:"0.1em", margin:"0 0 10px"}}>
          daily zeitgebers — lock your circadian rhythm with consistent anchors
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:8}}>
          {circadianCheckpoints.map(c => (
            <label key={c.key} style={{display:"flex", flexDirection:"column", gap:4, padding:"8px 10px", borderRadius:6, background:"var(--hlth-card2)", border:"1px solid var(--hlth-border-soft)"}}>
              <div style={{display:"flex", alignItems:"center", gap:6, fontSize:10, fontFamily:"var(--hlth-font-mono)", color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
                {c.icon} {c.label}
              </div>
              <input type="time" value={todaysCircadian[c.key as keyof CircadianEntry] as string ?? ""}
                onChange={e=>setCircadian(c.key, e.target.value)}
                style={{...inputStyle, padding:"6px 8px"}}/>
              <span style={{fontSize:9, color:"var(--hlth-muted)", letterSpacing:"0.05em"}}>{c.tip}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Routines */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:14}}>
        <RoutineCard title="BEDTIME ROUTINE" icon={<Moon size={14}/>} color="#a78bfa"
          steps={health.bedtimeRoutine.steps}
          windowStart={health.bedtimeRoutine.windowStart}
          windowEnd={health.bedtimeRoutine.windowEnd}
          adherence={bedAdherence}
          onToggle={(sid)=>toggleStep("bedtimeRoutine", sid)}
          onAdd={()=>addStep("bedtimeRoutine")}
          onRemove={(sid)=>removeStep("bedtimeRoutine", sid)}/>
        <RoutineCard title="WAKE ROUTINE" icon={<Sun size={14}/>} color="#fbbf24"
          steps={health.wakeRoutine.steps}
          windowStart={health.wakeRoutine.windowStart}
          windowEnd={health.wakeRoutine.windowEnd}
          adherence={wakeAdherence}
          onToggle={(sid)=>toggleStep("wakeRoutine", sid)}
          onAdd={()=>addStep("wakeRoutine")}
          onRemove={(sid)=>removeStep("wakeRoutine", sid)}/>
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{padding:"8px 12px", border:`1px solid ${color}44`, borderRadius:8, background:`${color}0d`, minWidth:80}}>
      <div style={{fontSize:9, letterSpacing:"0.15em", color:"var(--hlth-muted)", marginBottom:2}}>{label}</div>
      <div style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:16, color}}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{display:"flex", flexDirection:"column", gap:4, fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
      {label}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background:"var(--hlth-card2)", color:"var(--hlth-fg)",
  border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"8px 10px",
  fontFamily:"var(--hlth-font-mono)", fontSize:12, width:"100%", boxSizing:"border-box",
};

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{border:`1px solid ${color}55`, background:`${color}15`, color, padding:"2px 6px", borderRadius:4, fontSize:9, letterSpacing:"0.1em"}}>{label}</span>;
}

function RoutineCard({ title, icon, color, steps, windowStart, windowEnd, adherence, onToggle, onAdd, onRemove }: {
  title: string; icon: React.ReactNode; color: string; steps: RoutineStep[];
  windowStart: string; windowEnd: string; adherence: number;
  onToggle: (id:string)=>void; onAdd: ()=>void; onRemove: (id:string)=>void;
}) {
  return (
    <div className="hlth-card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
        <div className="hlth-card-h" style={{display:"flex", alignItems:"center", gap:6, color}}>
          {icon} {title}
        </div>
        <div style={{display:"flex", gap:6, alignItems:"center", fontFamily:"var(--hlth-font-mono)", fontSize:10}}>
          <Clock size={10}/><span style={{color:"var(--hlth-muted)"}}>{windowStart}–{windowEnd}</span>
          <Badge label={`${adherence}%`} color={adherence>=80?"#10b981":adherence>=50?"#f59e0b":"#ef4444"}/>
        </div>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:4}}>
        {steps.map(s => (
          <div key={s.id} style={{display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:4, background: s.doneToday ? `${color}15` : "var(--hlth-card2)", border:`1px solid ${s.doneToday ? color+"55" : "var(--hlth-border-soft)"}`}}>
            <button onClick={()=>onToggle(s.id)}
              style={{background:"transparent", border:"none", cursor:"pointer", padding:0, color: s.doneToday ? color : "var(--hlth-muted)"}}>
              <CheckCircle2 size={14}/>
            </button>
            <span style={{flex:1, fontSize:11, color:"var(--hlth-fg)", textDecoration: s.doneToday ? "line-through" : "none", opacity: s.doneToday ? 0.7 : 1}}>{s.label}</span>
            <button onClick={()=>onRemove(s.id)} style={{background:"transparent", border:"none", color:"var(--hlth-muted)", cursor:"pointer"}}>
              <X size={10}/>
            </button>
          </div>
        ))}
      </div>
      <button onClick={onAdd} className="hlth-btn hlth-btn-ghost" style={{marginTop:8, width:"100%", fontSize:10, padding:"6px", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:4}}>
        <Plus size={10}/> ADD STEP
      </button>
    </div>
  );
}
