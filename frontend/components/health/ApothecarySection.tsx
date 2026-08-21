"use client";

/**
 * ApothecarySection — supplements, adherence, deficiency badges, sunlight log.
 *
 * Wave 3:
 *  - Today's stack tiles (click to toggle taken)
 *  - Per-supplement streak & 30-day adherence
 *  - India-specific deficiency risk badges (D3, B12, Iron, Zinc, Calcium, Omega-3)
 *    derived from 7-day food + supp logs + sunlight minutes
 *  - Sunlight exposure log for D3 synthesis estimate
 *  - Add custom supplement to stack
 */

import { useMemo, useState } from "react";
import { Pill, Sun, AlertTriangle, Plus, Trash2, CheckCircle2, Sparkles, Droplet } from "lucide-react";
import { useStore } from "../../lib/store";
import { computeDeficiencyBadges, supplementStreaks, supplementAdherence, hasDeficiencyRisk } from "../../lib/healthAnalytics";
import type { SupplementDef, SunlightEntry } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0,10); }
function uid() { return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }

const TIME_LABELS: Record<string,string> = {
  morning: "MORNING", preworkout: "PRE-WO", postworkout: "POST-WO",
  evening: "EVENING", night: "NIGHT", any: "ANY",
};

const LEVEL_COLORS = {
  ok:         { color: "#10b981", label: "OK" },
  watch:      { color: "#f59e0b", label: "WATCH" },
  at_risk:    { color: "#ef4444", label: "AT RISK" },
  deficient:  { color: "#7c3aed", label: "DEFICIENT — CONSULT DOC" },
} as const;

export default function ApothecarySection() {
  const { health, updateHealth } = useStore();
  const today = todayIso();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDose, setNewDose] = useState<number>(0);
  const [newUnits, setNewUnits] = useState("mg");
  const [newTime, setNewTime] = useState<SupplementDef["timeOfDay"]>("any");
  const [sunMin, setSunMin] = useState(15);
  const [sunTimeOfDay, setSunTimeOfDay] = useState<SunlightEntry["timeOfDay"]>("morning");

  const defsById = useMemo(() => {
    const m: Record<string, SupplementDef> = {};
    for (const d of health.supplementDefs) m[d.id] = d;
    return m;
  }, [health.supplementDefs]);

  const takenToday = useMemo(() => {
    const set = new Set<string>();
    for (const l of health.supplementLog) if (l.date === today && l.taken) set.add(l.suppId);
    return set;
  }, [health.supplementLog, today]);

  const streaks = useMemo(() => supplementStreaks(health.supplementLog), [health.supplementLog]);
  const overallAdh = supplementAdherence(health.supplementLog, null, 7);
  const badges = useMemo(() => computeDeficiencyBadges({
    meals: health.meals, supplementLog: health.supplementLog, sunlight: health.sunlight,
  }, health.profile.gender), [health.meals, health.supplementLog, health.sunlight, health.profile.gender]);
  const atRisk = hasDeficiencyRisk(badges);

  const todaysSun = health.sunlight.filter(s=>s.date===today).reduce((n,s)=>n+s.minutes, 0);
  const weekSun = health.sunlight.slice(-7).reduce((n,s)=>n+s.minutes,0);

  const toggleSupp = (suppId: string) => {
    const isTaken = takenToday.has(suppId);
    updateHealth(h => {
      if (isTaken) {
        return { supplementLog: h.supplementLog.filter(l => !(l.date===today && l.suppId===suppId)) };
      }
      const entry = { id: uid(), date: today, suppId, taken: true, time: new Date().toTimeString().slice(0,5) };
      return { supplementLog: [...h.supplementLog.filter(l => !(l.date===today && l.suppId===suppId)), entry] };
    });
  };

  const removeDef = (id: string) => {
    if (!window.confirm("Remove this supplement from your stack?")) return;
    updateHealth(h => ({
      supplementDefs: h.supplementDefs.filter(d => d.id !== id),
      supplementLog: h.supplementLog.filter(l => l.suppId !== id),
    }));
  };

  const addSupp = () => {
    if (!newName.trim()) return;
    const def: SupplementDef = {
      id: "cust-"+uid(),
      name: newName.trim(),
      shortName: newName.trim().slice(0,4).toUpperCase(),
      color: "#64748b",
      doseMg: newDose || undefined,
      doseUnits: newUnits || undefined,
      timeOfDay: newTime,
    };
    updateHealth(h => ({ supplementDefs: [...h.supplementDefs, def] }));
    setNewName(""); setNewDose(0); setNewUnits("mg"); setNewTime("any"); setShowAdd(false);
  };

  const addSun = () => {
    if (sunMin <= 0) return;
    const entry: SunlightEntry = { id: uid(), date: today, minutes: sunMin, timeOfDay: sunTimeOfDay };
    updateHealth(h => ({ sunlight: [...h.sunlight, entry] }));
    setSunMin(15);
  };

  const removeSun = (id: string) => {
    updateHealth(h => ({ sunlight: h.sunlight.filter(s => s.id !== id) }));
  };

  // Group defs by timeOfDay for nice ordering
  const ORDER: SupplementDef["timeOfDay"][] = ["morning","preworkout","postworkout","evening","night","any"];
  const sortedDefs = [...health.supplementDefs].sort((a,b) => ORDER.indexOf(a.timeOfDay) - ORDER.indexOf(b.timeOfDay));

  return (
    <div style={{display:"flex", flexDirection:"column", gap:18}}>
      {/* Header */}
      <div className="hlth-card">
        <div className="hlth-card-h">§05 // APOTHECARY · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}</div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16}}>
          <div>
            <h2 style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:24, letterSpacing:"0.05em", margin:"4px 0 4px", color:"#22d3ee"}}>Stack &amp; deficiency badges</h2>
            <div className="hlth-subtle" style={{fontSize:11, letterSpacing:"0.1em"}}>
              log supps daily · track adherence · catch India-common deficiencies early
            </div>
          </div>
          <div style={{display:"flex", gap:10, flexWrap:"wrap", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
            <Kpi label="7d adherence" value={`${overallAdh}%`} color={overallAdh>=75?"#10b981":overallAdh>=50?"#f59e0b":"#ef4444"}/>
            <Kpi label="taken today" value={`${takenToday.size}/${health.supplementDefs.length}`} color="#22d3ee"/>
            <Kpi label="sun today" value={`${todaysSun} min`} color="#fbbf24"/>
          </div>
        </div>
        {atRisk && (
          <div style={{display:"flex",alignItems:"flex-start",gap:8, marginTop:14, padding:"10px 12px", borderRadius:6, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
            <AlertTriangle size={14}/>
            <div>
              <b>Deficiency signals detected.</b> Badges below are estimated from food+supp+sun logs — consider getting bloodwork done. This tool doesn't replace a doctor.
            </div>
          </div>
        )}
      </div>

      {/* Deficiency badges */}
      <div className="hlth-card">
        <div className="hlth-card-h">// india micronutrient risk badges (7d window)</div>
        <div className="hlth-subtle" style={{fontSize:10, letterSpacing:"0.1em", marginBottom:10}}>
          prevalence data from ICMR/NIN 2019-2024 urban India surveys · estimates, not diagnosis
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:10}}>
          {badges.map(b => {
            const meta = LEVEL_COLORS[b.level];
            return (
              <div key={b.id} style={{padding:"10px 12px", borderRadius:8, background:"var(--hlth-card2)", border:`1px solid ${meta.color}44`, position:"relative", overflow:"hidden"}}>
                <div style={{position:"absolute", top:0, right:0, width:3, height:"100%", background:meta.color}}/>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4}}>
                  <span style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:14, color:"var(--hlth-fg)", letterSpacing:"0.05em"}}>{b.label}</span>
                  <Badge label={meta.label} color={meta.color}/>
                </div>
                <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.05em", marginBottom:4}}>{b.indiaPrevalence}</div>
                <div style={{fontSize:11, color:"var(--hlth-fg)", opacity:0.9}}>{b.tip}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sunlight */}
      <div className="hlth-card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <div>
            <div className="hlth-card-h" style={{display:"flex", alignItems:"center", gap:6, color:"#fbbf24"}}>
              <Sun size={12}/> SUNLIGHT EXPOSURE
            </div>
            <div className="hlth-subtle" style={{fontSize:10, letterSpacing:"0.1em"}}>
              10-30 min unprotected midday Chennai sun → ~1000-3000 IU Vit D synthesis (skin type V adjustment)
            </div>
          </div>
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
          <input type="number" min={1} max={180} value={sunMin} onChange={e=>setSunMin(+e.target.value)}
            style={{width:60, background:"var(--hlth-card2)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px"}}/>
          <span style={{color:"var(--hlth-muted)"}}>minutes</span>
          <select value={sunTimeOfDay} onChange={e=>setSunTimeOfDay(e.target.value as any)}
            style={{background:"var(--hlth-card2)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px"}}>
            <option value="morning">morning (best for circadian)</option>
            <option value="midday">midday (best for D3)</option>
            <option value="afternoon">afternoon</option>
            <option value="evening">evening</option>
          </select>
          <button className="hlth-btn" onClick={addSun} style={{padding:"6px 12px", fontSize:10, display:"inline-flex",alignItems:"center",gap:4}}>
            <Plus size={10}/> LOG
          </button>
          <span style={{marginLeft:"auto", color:"var(--hlth-muted)"}}>this week: {weekSun} min</span>
        </div>
        {health.sunlight.length>0 && (
          <div style={{display:"flex", flexDirection:"column", gap:4, marginTop:10}}>
            {[...health.sunlight].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(s => (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
                <Sun size={12} style={{color:"#fbbf24"}}/>
                <span style={{color:"var(--hlth-muted)", minWidth:90}}>{s.date}</span>
                <span style={{color:"var(--hlth-fg)", fontWeight:700}}>{s.minutes} min</span>
                <span style={{color:"var(--hlth-muted)"}}>{s.timeOfDay}</span>
                <button onClick={()=>removeSun(s.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's stack */}
      <div className="hlth-card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <div className="hlth-card-h" style={{display:"flex", alignItems:"center", gap:6, color:"#22d3ee"}}>
            <Pill size={12}/> TODAY'S STACK
          </div>
          <button className="hlth-btn hlth-btn-ghost" onClick={()=>setShowAdd(s=>!s)} style={{padding:"6px 10px", fontSize:10, display:"inline-flex",alignItems:"center",gap:4}}>
            <Plus size={10}/> CUSTOM
          </button>
        </div>

        {showAdd && (
          <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:8, marginBottom:10, padding:10, background:"var(--hlth-card2)", borderRadius:8, border:"1px dashed var(--hlth-border)"}}>
            <input placeholder="Name (e.g. Collagen)" value={newName} onChange={e=>setNewName(e.target.value)}
              style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontFamily:"var(--hlth-font-mono)", fontSize:11}}/>
            <input type="number" min={0} placeholder="dose" value={newDose||""} onChange={e=>setNewDose(+e.target.value)}
              style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontFamily:"var(--hlth-font-mono)", fontSize:11}}/>
            <select value={newUnits} onChange={e=>setNewUnits(e.target.value)}
              style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
              {["mg","mcg","g","IU","ml","tab","scoop","B CFU"].map(u=><option key={u} value={u}>{u}</option>)}
            </select>
            <select value={newTime} onChange={e=>setNewTime(e.target.value as any)}
              style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
              {Object.entries(TIME_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
            <button className="hlth-btn" onClick={addSupp} style={{padding:"6px 12px", fontSize:10}}>ADD</button>
          </div>
        )}

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10}}>
          {sortedDefs.map(d => {
            const taken = takenToday.has(d.id);
            const color = d.color ?? "#22d3ee";
            const str = streaks[d.id] ?? 0;
            const adh = supplementAdherence(health.supplementLog, d.id, 30);
            return (
              <button key={d.id} onClick={()=>toggleSupp(d.id)}
                style={{
                  textAlign:"left", cursor:"pointer", position:"relative",
                  padding:"12px", borderRadius:10,
                  background: taken ? `${color}15` : "var(--hlth-card2)",
                  border:`1px solid ${taken ? color+"66" : "var(--hlth-border-soft)"}`,
                  transition:"all 0.15s",
                  boxShadow: taken ? `inset 0 0 24px ${color}22` : "none",
                }}>
                <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:4}}>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <span style={{
                      width:26, height:26, borderRadius:6, display:"inline-flex", alignItems:"center", justifyContent:"center",
                      background:`${color}22`, color,
                    }}>
                      {taken ? <CheckCircle2 size={14}/> : <Pill size={14}/>}
                    </span>
                    <div>
                      <div style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:12, color:"var(--hlth-fg)", letterSpacing:"0.05em", lineHeight:1.1}}>{d.name}</div>
                      <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:9, color:"var(--hlth-muted)", letterSpacing:"0.1em", marginTop:2}}>
                        {d.doseMg ? `${d.doseMg}${d.doseUnits ?? "mg"} · ` : ""}{TIME_LABELS[d.timeOfDay]}
                      </div>
                    </div>
                  </div>
                  <button onClick={(e)=>{e.stopPropagation(); removeDef(d.id);}}
                    style={{background:"transparent", border:"none", color:"var(--hlth-muted)", cursor:"pointer", padding:2}}>
                    <Trash2 size={10}/>
                  </button>
                </div>
                <div style={{display:"flex", gap:10, fontFamily:"var(--hlth-font-mono)", fontSize:9, color:"var(--hlth-muted)", letterSpacing:"0.1em", marginTop:6}}>
                  <span>🔥 {str}d streak</span>
                  <span>30d {adh}%</span>
                  {taken && <span style={{color, fontWeight:700}}>✓ taken</span>}
                </div>
                {d.notes && (
                  <div style={{fontSize:10, color:"var(--hlth-muted)", marginTop:6, lineHeight:1.3}}>{d.notes}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Disclaimer footer context note */}
      <div className="hlth-subtle" style={{fontSize:10, letterSpacing:"0.1em", textAlign:"center", opacity:0.7, display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <Droplet size={10}/> deficiency badges are intake-only estimates; bloodwork is the ground truth · supplement doses are personal — talk to a doc
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{padding:"8px 12px", border:`1px solid ${color}44`, borderRadius:8, background:`${color}0d`, minWidth:90}}>
      <div style={{fontSize:9, letterSpacing:"0.15em", color:"var(--hlth-muted)", marginBottom:2}}>{label}</div>
      <div style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:16, color}}>{value}</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{border:`1px solid ${color}55`, background:`${color}15`, color, padding:"3px 8px", borderRadius:4, fontSize:9, letterSpacing:"0.1em", fontWeight:700, fontFamily:"var(--hlth-font-mono)"}}>{label}</span>;
}
