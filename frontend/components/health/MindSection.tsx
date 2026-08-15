"use client";

/**
 * MindSection — mood, stress, energy, anxiety, focus, libido sliders; daily journal;
 * gratitude (3 things); meditation minutes; burnout/overtraining heuristic; Indian
 * crisis helplines panel (Vandrevala / iCall / NIMHANS).
 *
 * Wave 5:
 *  - Daily mood sliders (mood/stress/energy/anxiety/focus/libido) — one MindEntry per day.
 *  - 90-day mood trend sparkline with sleep/calories/caffeine overlays (simple).
 *  - Free-text journal + 3 gratitude bullets + meditation min logged per day.
 *  - Burnout/overtraining flag computed from sleep bank + RHR + mood + libido + injuries.
 *  - Mood context tags.
 *  - Crisis helplines panel — always visible in footer of the page (Indian numbers).
 */

import { useMemo, useState } from "react";
import {
  Brain, Heart, Flame, Wind, Zap, Sparkles, BookOpen, Coffee,
  Plus, Trash2, AlertTriangle, Phone, Smile, Frown, Meh,
} from "lucide-react";
import { useStore } from "../../lib/store";
import {
  avgMind, todayMind, burnoutHeuristic, todayJournal, avgRhr, computeSleepBank,
} from "../../lib/healthAnalytics";
import type { MindEntry, JournalEntry } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0,10); }
function uid() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

const MOOD_TAGS = [
  "productive","calm","motivated","focused","social","grateful","anxious","tired",
  "irritable","sad","excited","lonely","sore","hungry","stressed","rested","creative",
];

/** Crisis helplines for India (user asked for these specifically). */
const CRISIS_HELPLINES = [
  { name: "Vandrevala Foundation (24×7)", phone: "1860-2662-345", text: "Mental-health counselling & crisis support. Free, multilingual.", },
  { name: "iCall — Tata Institute of Social Sciences", phone: "9152987821", text: "Free tele-counselling (Mon-Sat 8am-10pm IST).", },
  { name: "NIMHANS Helpline (24×7)", phone: "080-46110007", text: "National Institute of Mental Health & Neuro Sciences, Bengaluru.", },
  { name: "AASRA (suicide prevention, 24×7)", phone: "9820466726", text: "Confidential suicide-prevention & crisis support.", },
];

function Slider({ label, value, min, max, onChange, hintLeft, hintRight, color, icon: Icon }: {
  label: string; value: number; min: number; max: number; onChange: (v:number)=>void;
  hintLeft?: string; hintRight?: string; color: string; icon?: any;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{padding:"8px 10px",background:"var(--hlth-card2)",borderRadius:6,border:"1px solid var(--hlth-border-soft)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,letterSpacing:"0.1em",color:"var(--hlth-muted)",display:"inline-flex",alignItems:"center",gap:5}}>
          {Icon && <Icon size={12}/>} {label}
        </span>
        <span style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:16,color}}>{value}<span style={{fontSize:10,color:"var(--hlth-muted)",marginLeft:2,fontFamily:"var(--hlth-font-mono)"}}>/{max}</span></span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(clamp(Number(e.target.value),min,max))}
        style={{width:"100%",accentColor:color}}/>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:"var(--hlth-font-mono)",color:"var(--hlth-muted)",letterSpacing:"0.08em",marginTop:2}}>
        <span>{hintLeft ?? min}</span>
        <span>{hintRight ?? max}</span>
      </div>
      <div style={{height:3,background:"var(--hlth-card)",borderRadius:2,marginTop:4,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,transition:"width 0.2s"}}/>
      </div>
    </div>
  );
}

export default function MindSection() {
  const { health, updateHealth } = useStore();
  const today = todayIso();

  // Today's existing entry (or default 5/5/5/5/5/3 so sliders aren't zeroed)
  const existing = todayMind(health.mind);
  const [mood, setMood]     = useState<number>(existing?.mood ?? 5);
  const [stress, setStress] = useState<number>(existing?.stress ?? 5);
  const [energy, setEnergy] = useState<number>(existing?.energy ?? 5);
  const [anxiety, setAnxiety] = useState<number>(existing?.anxiety ?? 5);
  const [focus, setFocus]   = useState<number>(existing?.focus ?? 5);
  const [libido, setLibido] = useState<number>(existing?.libido ?? 3);
  const [mindNote, setMindNote] = useState<string>(existing?.note ?? "");
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);

  // Journal state
  const existingJ = todayJournal(health.journal);
  const [jText, setJText] = useState<string>(existingJ?.text ?? "");
  const [g1, setG1] = useState<string>(existingJ?.gratitude?.[0] ?? "");
  const [g2, setG2] = useState<string>(existingJ?.gratitude?.[1] ?? "");
  const [g3, setG3] = useState<string>(existingJ?.gratitude?.[2] ?? "");
  const [medMin, setMedMin] = useState<string>(existingJ?.meditationMin ? String(existingJ.meditationMin) : "");

  // Averages & aggregates
  const mood7   = avgMind(health.mind, "mood", 7);
  const stress7 = avgMind(health.mind, "stress", 7);
  const energy7 = avgMind(health.mind, "energy", 7);
  const rhr7    = avgRhr(health.vitals, 7);
  const bank = computeSleepBank(health.sleep, health.profile.idealSleepHours);
  const burnout = useMemo(() => burnoutHeuristic({
    sleepEntries: health.sleep, idealHours: health.profile.idealSleepHours,
    vitals: health.vitals, mind: health.mind, injuries: health.injuries,
  }), [health.sleep, health.profile.idealSleepHours, health.vitals, health.mind, health.injuries]);

  // 90-day mood trend sparkline data
  const moodTrend = useMemo(() => {
    const sorted = [...health.mind].sort((a,b)=>a.date.localeCompare(b.date));
    // bucket into last 90 days, one point per day
    const map: Record<string, MindEntry> = {};
    for (const e of sorted) map[e.date] = e;
    const d = new Date();
    const out: { date: string; mood: number; energy: number; stress: number }[] = [];
    for (let i=89;i>=0;i--) {
      const dd = new Date(d); dd.setDate(d.getDate()-i);
      const k = dd.toISOString().slice(0,10);
      const e = map[k];
      out.push({ date: k, mood: e?.mood ?? 0, energy: e?.energy ?? 0, stress: e?.stress ?? 0 });
    }
    return out;
  }, [health.mind]);

  // Meditation streak
  const medStreak = useMemo(() => {
    const days = new Set(health.journal.filter(j => (j.meditationMin ?? 0) > 0).map(j => j.date));
    let streak = 0;
    const d = new Date();
    for (let i=0;i<365;i++) {
      if (days.has(d.toISOString().slice(0,10))) { streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    return streak;
  }, [health.journal]);

  const recentJournal = useMemo(() =>
    [...health.journal].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10),
    [health.journal]);
  const recentMind = useMemo(() =>
    [...health.mind].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10),
    [health.mind]);

  const saveMind = () => {
    const entry: MindEntry = {
      id: existing?.id ?? uid(), date: today,
      mood: clamp(mood,1,10), stress: clamp(stress,1,10), energy: clamp(energy,1,10),
      anxiety: clamp(anxiety,1,10), focus: clamp(focus,1,10), libido: clamp(libido,1,5),
      tags: [...tags], note: mindNote || undefined,
    };
    updateHealth(h => ({
      mind: [entry, ...h.mind.filter(m => m.date !== today && m.id !== entry.id)].slice(0, 365)
    }));
  };

  const saveJournal = () => {
    const gratitude: JournalEntry["gratitude"] = [g1||undefined, g2||undefined, g3||undefined];
    const hasAny = jText.trim() || g1 || g2 || g3 || medMin;
    if (!hasAny) return;
    const entry: JournalEntry = {
      id: existingJ?.id ?? uid(), date: today,
      text: jText.trim(),
      gratitude,
      meditationMin: medMin ? clamp(parseInt(medMin,10)||0, 0, 600) : undefined,
    };
    updateHealth(h => ({
      journal: [entry, ...h.journal.filter(x => x.date !== today && x.id !== entry.id)].slice(0, 365)
    }));
  };

  const delJournal = (id: string) => {
    updateHealth(h => ({ journal: h.journal.filter(j => j.id !== id) }));
  };
  const delMind = (id: string) => {
    updateHealth(h => ({ mind: h.mind.filter(m => m.id !== id) }));
  };

  const toggleTag = (t: string) => {
    setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  };

  // Mood face for today
  const moodFace = mood >= 8 ? <Smile size={48} color="#10b981"/> :
                   mood >= 5 ? <Meh size={48} color="#f59e0b"/> :
                   <Frown size={48} color="#ef4444"/>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {/* Burnout / overtraining banner */}
      {burnout.level !== "ok" && (
        <div className="hlth-card" style={{
          borderColor:`${burnout.color}66`, background:`${burnout.color}0d`,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <AlertTriangle size={14} color={burnout.color}/>
            <span style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:14,letterSpacing:"0.08em",color:burnout.color}}>
              {burnout.level === "overtraining" ? "OVERTRAINING / BURNOUT LIKELY" :
               burnout.level === "warn" ? "WARNING — pushing too hard" :
               "WATCH — early fatigue signals"}
            </span>
            <span style={{marginLeft:"auto",fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)"}}>score {burnout.score}/10</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3,fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
            {burnout.signals.map((s,i) => <div key={i} style={{color:burnout.color}}>● {s}</div>)}
          </div>
          <div style={{marginTop:8,padding:"8px 10px",borderRadius:4,background:"var(--hlth-card2)",fontFamily:"var(--hlth-font-mono)",fontSize:11,color:"var(--hlth-fg)"}}>
            {burnout.level === "overtraining"
              ? "Take a deload week: cut volume 50-60%, drop intensity, 8-9h sleep, no PR attempts. Active recovery only (walks, mobility, zone-2)."
              : burnout.level === "warn"
              ? "Drop 1 heavy session this week, add 30-60 min sleep, prioritise protein + calories, push non-urgent work."
              : "Watch trends. Extra hour of sleep tonight, hydrate, don't chase a heavy PR this session."}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="hlth-card">
        <div className="hlth-card-h">§07 // MIND · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:"var(--hlth-card2)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--hlth-border-soft)"}}>
              {moodFace}
            </div>
            <div>
              <h2 style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:24,letterSpacing:"0.05em",margin:"4px 0 4px",color:"#a78bfa"}}>Mind state</h2>
              <div className="hlth-subtle" style={{fontSize:11,letterSpacing:"0.1em"}}>
                Daily check-in, journal, gratitude, burnout detection
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
            <Kpi label="Mood 7d"  value={mood7?mood7.toFixed(1):"—"} unit="/10" color="#10b981"/>
            <Kpi label="Stress"   value={stress7?stress7.toFixed(1):"—"} unit="/10" color="#ef4444"/>
            <Kpi label="Energy"   value={energy7?energy7.toFixed(1):"—"} unit="/10" color="#f59e0b"/>
            <Kpi label="Sleep bank" value={`${bank>=0?"+":""}${bank.toFixed(1)}`} unit="h" color={bank<=-10?"#ef4444":bank<=-5?"#f59e0b":"#a78bfa"}/>
            <Kpi label="Med streak" value={String(medStreak)} unit="d" color="#22d3ee"/>
          </div>
        </div>
      </div>

      {/* Daily mood sliders */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Brain size={12}/> DAILY CHECK-IN</div>
        <div className="hlth-subtle" style={{fontSize:10,letterSpacing:"0.1em",marginBottom:10}}>
          Slide it, don't overthink. Takes 20 seconds — the trend is what matters, not any single day.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))",gap:8}}>
          <Slider label="MOOD"      value={mood}    min={1} max={10} onChange={setMood}    color="#10b981" icon={Smile}    hintLeft="garbage" hintRight="amazing"/>
          <Slider label="STRESS"    value={stress}  min={1} max={10} onChange={setStress}  color="#ef4444" icon={Flame}    hintLeft="zen"     hintRight="crushing"/>
          <Slider label="ENERGY"    value={energy}  min={1} max={10} onChange={setEnergy}  color="#f59e0b" icon={Zap}      hintLeft="bedridden" hintRight="electric"/>
          <Slider label="ANXIETY"   value={anxiety} min={1} max={10} onChange={setAnxiety} color="#60a5fa" icon={Wind}     hintLeft="calm"    hintRight="panic"/>
          <Slider label="FOCUS"     value={focus}   min={1} max={10} onChange={setFocus}   color="#a78bfa" icon={Sparkles} hintLeft="scatter" hintRight="flow"/>
          <Slider label="LIBIDO"    value={libido}  min={1} max={5}  onChange={setLibido}  color="#ec4899" icon={Heart}    hintLeft="none"    hintRight="high"/>
        </div>

        <div style={{marginTop:12}}>
          <div style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",letterSpacing:"0.1em",marginBottom:4}}>TAGS (tap all that apply)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {MOOD_TAGS.map(t => (
              <button key={t} onClick={()=>toggleTag(t)} style={{
                padding:"4px 8px",borderRadius:4,cursor:"pointer",fontFamily:"var(--hlth-font-mono)",fontSize:9,letterSpacing:"0.05em",
                background: tags.includes(t) ? "rgba(167,139,250,0.2)" : "var(--hlth-card2)",
                border:`1px solid ${tags.includes(t) ? "#a78bfa" : "var(--hlth-border-soft)"}`,
                color: tags.includes(t) ? "#a78bfa" : "var(--hlth-muted)",
              }}>{t}</button>
            ))}
          </div>
        </div>

        <Field label="Note (optional)">
          <input type="text" value={mindNote} onChange={e=>setMindNote(e.target.value)} placeholder="one-liner about today" style={input}/>
        </Field>

        <div style={{marginTop:12,display:"flex",gap:8}}>
          <button className="hlth-btn" onClick={saveMind} style={{padding:"8px 16px",fontSize:11,display:"inline-flex",alignItems:"center",gap:6}}>
            <Plus size={12}/> SAVE CHECK-IN
          </button>
          {existing && <div className="hlth-subtle" style={{fontSize:11,alignSelf:"center"}}>overwrites today's entry</div>}
        </div>
      </div>

      {/* Journal + Gratitude + Meditation */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><BookOpen size={12}/> JOURNAL · GRATITUDE · MEDITATION</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
          <div>
            <Field label="Free journal (today)">
              <textarea value={jText} onChange={e=>setJText(e.target.value)} rows={8} placeholder="What actually happened today? Wins, losses, weird things. Doesn't need to be pretty."
                style={{...input,resize:"vertical",lineHeight:1.5}}/>
            </Field>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",letterSpacing:"0.1em"}}>
              🙏 THREE THINGS YOU'RE GRATEFUL FOR
            </div>
            <Field label="1."><input type="text" value={g1} onChange={e=>setG1(e.target.value)} placeholder="a thing, a person, a win, a meal…" style={input}/></Field>
            <Field label="2."><input type="text" value={g2} onChange={e=>setG2(e.target.value)} placeholder="" style={input}/></Field>
            <Field label="3."><input type="text" value={g3} onChange={e=>setG3(e.target.value)} placeholder="" style={input}/></Field>
            <Field label="🧘 Meditation / breathing (minutes)">
              <input type="number" min={0} max={600} value={medMin} onChange={e=>setMedMin(e.target.value)} placeholder="0" style={input}/>
            </Field>
          </div>
        </div>
        <div style={{marginTop:10,display:"flex",gap:8}}>
          <button className="hlth-btn" onClick={saveJournal} style={{padding:"8px 16px",fontSize:11,display:"inline-flex",alignItems:"center",gap:6}}>
            <Plus size={12}/> SAVE JOURNAL
          </button>
        </div>
      </div>

      {/* Mood trend */}
      {moodTrend.filter(d => d.mood > 0).length >= 2 && (
        <div className="hlth-card">
          <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Coffee size={12}/> 90-DAY MOOD TREND</div>
          <div style={{padding:"10px 0",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <MoodSparkline data={moodTrend}/>
            <div style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",display:"flex",flexDirection:"column",gap:4}}>
              <span><span style={{display:"inline-block" as any,width:10,height:3,background:"#10b981",marginRight:6}}/> Mood</span>
              <span><span style={{display:"inline-block" as any,width:10,height:3,background:"#f59e0b",marginRight:6}}/> Energy</span>
              <span><span style={{display:"inline-block" as any,width:10,height:3,background:"#ef4444",marginRight:6}}/> Stress (inverted)</span>
              <span className="hlth-subtle" style={{marginTop:4,maxWidth:180}}>Trend only — not clinical. Combine with sleep/workouts/caffeine context.</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent mind + journal entries */}
      {(recentMind.length > 0 || recentJournal.length > 0) && (
        <div className="hlth-card">
          <div className="hlth-card-h">// recent entries</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8}}>
            {recentJournal.slice(0,6).map(j => (
              <div key={j.id} style={{padding:"8px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:11,fontFamily:"var(--hlth-font-mono)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{color:"var(--hlth-muted)",minWidth:80}}>{j.date}</span>
                  <span style={{fontWeight:700,color:"#a78bfa"}}>journal</span>
                  {j.meditationMin ? <Badge label={`🧘 ${j.meditationMin}min`} color="#22d3ee"/> : null}
                  <button onClick={()=>delJournal(j.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={11}/></button>
                </div>
                {j.gratitude?.filter(Boolean).length ? (
                  <div style={{fontSize:10,color:"var(--hlth-muted)",marginBottom:4}}>
                    🙏 {j.gratitude.filter(Boolean).join(" · ")}
                  </div>
                ) : null}
                {j.text && <div style={{whiteSpace:"pre-wrap",lineHeight:1.5,color:"var(--hlth-fg)"}}>{j.text}</div>}
              </div>
            ))}
            {recentMind.slice(0,8).map(m => (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:10,fontFamily:"var(--hlth-font-mono)",flexWrap:"wrap"}}>
                <span style={{color:"var(--hlth-muted)",minWidth:80}}>{m.date}</span>
                <Badge label={`mood ${m.mood}`} color="#10b981"/>
                <Badge label={`stress ${m.stress}`} color="#ef4444"/>
                <Badge label={`energy ${m.energy}`} color="#f59e0b"/>
                {m.anxiety && <Badge label={`anx ${m.anxiety}`} color="#60a5fa"/>}
                {m.focus && <Badge label={`focus ${m.focus}`} color="#a78bfa"/>}
                {m.libido != null && <Badge label={`lib ${m.libido}`} color="#ec4899"/>}
                {m.tags && m.tags.slice(0,3).map(t=><span key={t} style={{color:"var(--hlth-muted)"}}>#{t}</span>)}
                {m.note && <span style={{color:"var(--hlth-muted)",opacity:0.7}}>· {m.note}</span>}
                <button onClick={()=>delMind(m.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={10}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crisis helplines */}
      <div className="hlth-card" style={{borderColor:"#a78bfa55",background:"rgba(167,139,250,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <Phone size={13} color="#a78bfa"/>
          <span style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,letterSpacing:"0.08em",fontSize:13,color:"#a78bfa"}}>
            INDIA CRISIS HELPLINES
          </span>
        </div>
        <div className="hlth-subtle" style={{fontSize:11,marginBottom:8}}>
          If you're in crisis — feeling suicidal, overwhelmed, or just need someone to talk to — call.
          These are free, confidential, trained counsellors. There is zero shame in it, commander. ❤️
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))",gap:8}}>
          {CRISIS_HELPLINES.map(h => (
            <div key={h.phone} style={{padding:"10px 12px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid rgba(167,139,250,0.2)"}}>
              <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:12,marginBottom:3}}>{h.name}</div>
              <a href={`tel:${h.phone.replace(/\D/g,"")}`} style={{fontFamily:"var(--hlth-font-mono)",fontSize:15,fontWeight:700,color:"#a78bfa",textDecoration:"none",display:"inline-block",marginBottom:4}}>{h.phone}</a>
              <div style={{fontSize:10,color:"var(--hlth-muted)",fontFamily:"var(--hlth-font-mono)",letterSpacing:"0.05em"}}>{h.text}</div>
            </div>
          ))}
        </div>
        <div className="hlth-subtle" style={{fontSize:10,marginTop:8,fontStyle:"italic"}}>
          If someone is in immediate danger, call 112 (emergency services) first.
        </div>
      </div>
    </div>
  );
}

// ---------------- UI primitives ----------------

function Kpi({ label, value, unit, color }: { label:string; value:string; unit:string; color:string }) {
  return (
    <div style={{padding:"8px 12px",border:`1px solid ${color}44`,borderRadius:8,background:`${color}0d`,minWidth:90}}>
      <div style={{fontSize:9,letterSpacing:"0.15em",color:"var(--hlth-muted)",marginBottom:2}}>{label}</div>
      <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:16,color}}>
        {value}<span style={{fontSize:11,marginLeft:2,opacity:0.7,fontFamily:"var(--hlth-font-mono)"}}>{unit}</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <label style={{display:"flex",flexDirection:"column",gap:3,fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",letterSpacing:"0.1em",marginBottom:6}}>
      {label}
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  background:"var(--hlth-card2)",color:"var(--hlth-fg)",border:"1px solid var(--hlth-border-soft)",
  borderRadius:4,padding:"6px 8px",fontFamily:"var(--hlth-font-mono)",fontSize:12,width:"100%",boxSizing:"border-box",
};

function Badge({ label, color }: { label:string; color:string }) {
  return <span style={{border:`1px solid ${color}55`,background:`${color}15`,color,padding:"2px 6px",borderRadius:4,fontSize:9,letterSpacing:"0.08em",fontWeight:700}}>{label}</span>;
}

function MoodSparkline({ data }: { data: {date:string;mood:number;energy:number;stress:number}[] }) {
  const W = 380, H = 80;
  const last90 = data.slice(-90);
  const n = last90.length;
  const mkPts = (values: number[], invert=false) => {
    return last90.map((d,i) => {
      const x = (i/(n-1))*W;
      if (d.mood === 0) return null;
      const v = invert ? (10 - values[i]) : values[i];
      const y = H - ((v - 1)/9) * (H - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).filter(Boolean).join(" ");
  };
  const moodPts = mkPts(last90.map(d=>d.mood));
  const energyPts = mkPts(last90.map(d=>d.energy));
  const stressPts = mkPts(last90.map(d=>d.stress), true);
  return (
    <svg width={W} height={H} style={{flexShrink:0,background:"var(--hlth-card2)",borderRadius:6}}>
      {/* baseline */}
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke="#ffffff10" strokeWidth={1} strokeDasharray="2,3"/>
      {moodPts   && <polyline points={moodPts}   stroke="#10b981" strokeWidth={1.5} fill="none" opacity={0.95}/>}
      {energyPts && <polyline points={energyPts} stroke="#f59e0b" strokeWidth={1}   fill="none" opacity={0.7}/>}
      {stressPts && <polyline points={stressPts} stroke="#ef4444" strokeWidth={1}   fill="none" opacity={0.6}/>}
      {last90.filter(d=>d.mood>0).length > 0 && (() => {
        // mark today
        const i = n - 1;
        const d = last90[i]; const x = W;
        const y = d.mood>0 ? H - ((d.mood-1)/9)*(H-8) - 4 : H/2;
        return <circle cx={x} cy={y} r={3} fill="#10b981"/>;
      })()}
    </svg>
  );
}
