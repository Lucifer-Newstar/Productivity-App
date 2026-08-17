"use client";

/**
 * VitalsSection — HR, BP, HRV, temp, SpO2, symptoms, illness/injury/meds/allergies, orthostatic test.
 *
 * Wave 5:
 *  - Quick-log form for AM/post-workout vitals (RHR, systolic/diastolic, HRV, temp, SpO2, resp rate, context).
 *  - Auto-classification chips for BP (AHA 2024), temp, SpO2, RHR.
 *  - Symptom quick-tag with severity slider.
 *  - Illness episodes (start/end/severity).
 *  - Injury log with body-part + category, ongoing/recovered, workout-restriction hint.
 *  - Medication log (OTC/Rx/Ayurveda).
 *  - Allergies list.
 *  - Orthostatic HR test form (lying / 1min / 3min).
 *  - 7-day vitals history table + averages.
 *  - Active injury alerts surface as workout restrictions.
 */

import { useMemo, useState } from "react";
import {
  Activity, Heart, Thermometer, Plus, Trash2, AlertTriangle,
  Stethoscope, Pill, Bandage, Shield, Clipboard, Brain, Wind, AudioLines,
  Waves, RefreshCw, BatteryLow, Utensils, Bone, Zap, Flower2, CircleHelp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  classifyBp, classifyTemp, classifySpo2, classifyRhr, latestVitals, avgRhr,
  activeInjuries, injuryRestrictionHints, classifyOrthostatic,
} from "../../lib/healthAnalytics";
import type {
  VitalsEntry, SymptomEntry, SymptomId, IllnessEpisode, InjuryEntry,
  MedicationEntry, AllergyEntry, OrthostaticTest,
} from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0,10); }
function uid() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
function toNum(v: string): number | undefined {
  const n = parseFloat(v);
  return isFinite(n) ? n : undefined;
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

const SYMPTOM_META: { id: SymptomId; label: string; icon: LucideIcon }[] = [
  { id: "headache",    label: "Headache",     icon: Brain },
  { id: "fever",       label: "Fever",        icon: Thermometer },
  { id: "cold_cough",  label: "Cold / Cough", icon: Wind },
  { id: "sore_throat", label: "Sore throat",  icon: AudioLines },
  { id: "body_ache",   label: "Body ache",    icon: Activity },
  { id: "nausea",      label: "Nausea",       icon: Waves },
  { id: "dizziness",   label: "Dizziness",    icon: RefreshCw },
  { id: "fatigue",     label: "Fatigue",      icon: BatteryLow },
  { id: "skin",        label: "Skin issue",   icon: Bandage },
  { id: "digestive",   label: "Digestive",    icon: Utensils },
  { id: "joint_pain",  label: "Joint pain",   icon: Bone },
  { id: "cramping",    label: "Cramping",     icon: Zap },
  { id: "allergies",   label: "Allergies",    icon: Flower2 },
  { id: "other",       label: "Other",        icon: CircleHelp },
];

const INJURY_CATEGORIES: { id: NonNullable<InjuryEntry["category"]>; label: string }[] = [
  { id: "shoulder", label: "Shoulder" },
  { id: "elbow",    label: "Elbow" },
  { id: "wrist",    label: "Wrist" },
  { id: "back",     label: "Back" },
  { id: "hip",      label: "Hip" },
  { id: "knee",     label: "Knee" },
  { id: "ankle",    label: "Ankle" },
  { id: "neck",     label: "Neck" },
  { id: "other",    label: "Other" },
];

export default function VitalsSection() {
  const { health, updateHealth } = useStore();
  const today = todayIso();

  // Quick-log vitals form state
  const [vDate, setVDate] = useState<string>(today);
  const [vTime, setVTime] = useState<string>(nowHHMM());
  const [rhr, setRhr]       = useState("");
  const [sys, setSys]       = useState("");
  const [dia, setDia]       = useState("");
  const [hrv, setHrv]       = useState("");
  const [temp, setTemp]     = useState("");
  const [spo2, setSpo2]     = useState("");
  const [rr, setRr]         = useState("");
  const [ctx, setCtx]       = useState<VitalsEntry["context"]>("waking");
  const [vNote, setVNote]   = useState("");

  const last = useMemo(() => latestVitals(health.vitals), [health.vitals]);
  const bp = useMemo(() => classifyBp(toNum(sys), toNum(dia)), [sys, dia]);
  const tmp = useMemo(() => classifyTemp(toNum(temp)), [temp]);
  const sp  = useMemo(() => classifySpo2(toNum(spo2)), [spo2]);
  const rh  = useMemo(() => classifyRhr(toNum(rhr)), [rhr]);

  // Quick-live last classification (for KPI header)
  const lastBp = useMemo(() => classifyBp(last?.systolic, last?.diastolic), [last]);
  const lastTmp = useMemo(() => classifyTemp(last?.tempC), [last]);
  const lastSpo = useMemo(() => classifySpo2(last?.spo2), [last]);
  const lastRhr = useMemo(() => classifyRhr(last?.restingHr), [last]);
  const rhr7 = avgRhr(health.vitals, 7);

  // Symptom state
  const [selSym, setSelSym] = useState<SymptomId | null>(null);
  const [symSev, setSymSev] = useState<number>(2);
  const [symNote, setSymNote] = useState("");

  // Illness state
  const [illStart, setIllStart] = useState(today);
  const [illEnd, setIllEnd] = useState("");
  const [illLabel, setIllLabel] = useState("");
  const [illSev, setIllSev] = useState<number>(2);

  // Injury state
  const [injBody, setInjBody] = useState("");
  const [injCat, setInjCat]   = useState<InjuryEntry["category"]>("other");
  const [injSev, setInjSev]   = useState<number>(2);
  const [injOngoing, setInjOngoing] = useState(true);

  // Medication state
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medDoseMg, setMedDoseMg] = useState("");
  const [medType, setMedType] = useState<MedicationEntry["type"]>("otc");

  // Allergy state
  const [algName, setAlgName] = useState("");
  const [algSev, setAlgSev]   = useState<AllergyEntry["severity"]>("mild");

  // Orthostatic state
  const [oDate, setODate]     = useState(today);
  const [oTime, setOTime]     = useState(nowHHMM());
  const [oSupine, setOSupine] = useState("");
  const [oSt1, setOSt1]       = useState("");
  const [oSt3, setOSt3]       = useState("");
  const ortho = useMemo(() => classifyOrthostatic({ hrSupine: toNum(oSupine) ?? 0, hrStanding1min: toNum(oSt1) ?? 0 }), [oSupine, oSt1]);

  const todaySymptoms = health.symptoms.filter(s => s.date === today);
  const ongoingIll = health.illnesses.filter(i => !i.endDate);
  const injuries = activeInjuries(health.injuries);
  const restrictions = injuryRestrictionHints(injuries);

  const recentVitals = useMemo(() =>
    [...health.vitals].sort((a,b)=>(b.date+"T"+(b.time||"00:00")).localeCompare(a.date+"T"+(a.time||"00:00"))).slice(0,10),
    [health.vitals]);
  const recentSymp = useMemo(() =>
    [...health.symptoms].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15),
    [health.symptoms]);
  const recentMeds = useMemo(() =>
    [...health.medications].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10),
    [health.medications]);

  // ---------- saves ----------
  const saveVitals = () => {
    const entry: VitalsEntry = {
      id: uid(), date: vDate, time: vTime || nowHHMM(),
      restingHr: toNum(rhr), systolic: toNum(sys), diastolic: toNum(dia),
      hrvMs: toNum(hrv) ? Math.round(toNum(hrv)!) : undefined,
      tempC: toNum(temp) ? Math.round(toNum(temp)!*10)/10 : undefined,
      spo2: toNum(spo2),
      respRate: toNum(rr),
      context: ctx,
      note: vNote || undefined,
    };
    if (entry.restingHr==null && entry.systolic==null && entry.tempC==null && entry.spo2==null && entry.hrvMs==null) {
      window.alert("Enter at least one vital to log.");
      return;
    }
    updateHealth(h => ({ vitals: [entry, ...h.vitals].slice(0, 500) }));
    setRhr(""); setSys(""); setDia(""); setHrv(""); setTemp(""); setSpo2(""); setRr(""); setVNote("");
  };

  const addSymptom = () => {
    if (!selSym) return;
    const entry: SymptomEntry = { id: uid(), date: today, symptom: selSym, severity: symSev as 1|2|3|4|5, note: symNote || undefined };
    updateHealth(h => ({ symptoms: [entry, ...h.symptoms].slice(0, 500) }));
    setSelSym(null); setSymSev(2); setSymNote("");
  };

  const addIllness = () => {
    if (!illLabel.trim()) return;
    const entry: IllnessEpisode = { id: uid(), startDate: illStart, endDate: illEnd || undefined, label: illLabel.trim(), severity: illSev as 1|2|3|4|5 };
    updateHealth(h => ({ illnesses: [entry, ...h.illnesses].slice(0, 200) }));
    setIllLabel(""); setIllEnd(""); setIllSev(2);
  };

  const endIllness = (id: string) => {
    updateHealth(h => ({ illnesses: h.illnesses.map(i => i.id===id ? { ...i, endDate: today } : i) }));
  };

  const addInjury = () => {
    if (!injBody.trim()) return;
    const entry: InjuryEntry = {
      id: uid(), date: today, bodyPart: injBody.trim(), category: injCat,
      severity: injSev as 1|2|3|4|5, ongoing: injOngoing,
    };
    updateHealth(h => ({ injuries: [entry, ...h.injuries].slice(0, 200) }));
    setInjBody(""); setInjSev(2); setInjOngoing(true); setInjCat("other");
  };

  const toggleInjury = (id: string) => {
    updateHealth(h => ({ injuries: h.injuries.map(i => i.id===id ? { ...i, ongoing: !i.ongoing } : i) }));
  };

  const addMed = () => {
    if (!medName.trim()) return;
    const entry: MedicationEntry = {
      id: uid(), date: today, time: nowHHMM(), name: medName.trim(),
      doseMg: toNum(medDoseMg) ? Math.round(toNum(medDoseMg)!) : undefined,
      dose: medDose.trim() || undefined,
      type: medType,
    };
    updateHealth(h => ({ medications: [entry, ...h.medications].slice(0, 300) }));
    setMedName(""); setMedDose(""); setMedDoseMg(""); setMedType("otc");
  };

  const addAllergy = () => {
    if (!algName.trim()) return;
    const entry: AllergyEntry = { id: uid(), name: algName.trim(), severity: algSev };
    updateHealth(h => ({ allergies: [...h.allergies, entry] }));
    setAlgName(""); setAlgSev("mild");
  };

  const addOrtho = () => {
    const supine = toNum(oSupine), st1 = toNum(oSt1);
    if (!supine || !st1) { window.alert("Need supine and standing (1 min) HR."); return; }
    const entry: OrthostaticTest = {
      id: uid(), date: oDate, time: oTime, hrSupine: Math.round(supine),
      hrStanding1min: Math.round(st1),
      hrStanding3min: toNum(oSt3) ? Math.round(toNum(oSt3)!) : undefined,
    };
    updateHealth(h => ({ orthostatic: [entry, ...h.orthostatic].slice(0, 200) }));
    setOSupine(""); setOSt1(""); setOSt3("");
  };

  const del = (key: "vitals"|"symptoms"|"illnesses"|"injuries"|"medications"|"allergies"|"orthostatic", id: string) => {
    updateHealth(h => ({ [key]: (h[key] as any[]).filter((x: any) => x.id !== id) } as any));
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {/* Active alerts: crisis BP / fever / SpO2 / injury restrictions */}
      {(bp.warn || tmp.warn || sp.warn || (lastBp.warn && vDate===today) || injuries.length>0 || ongoingIll.length>0) && (
        <div className="hlth-card" style={{borderColor:"#ef444455", background:"rgba(239,68,68,0.06)"}}>
          <div className="hlth-card-h" style={{color:"#ef4444"}}><AlertTriangle size={12}/> ACTIVE ALERTS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8,fontSize:11,fontFamily:"var(--hlth-font-mono)"}}>
            {bp.warn && <div style={{color:bp.color}}>● BP preview: {bp.label} ({sys}/{dia}) — re-check; if ≥180/120 treat as emergency.</div>}
            {tmp.warn && <div style={{color:tmp.color}}>● Temp preview: {tmp.label} ({temp}°C).</div>}
            {sp.warn && <div style={{color:sp.color}}>● SpO₂ preview: {sp.label} ({spo2}%).</div>}
            {ongoingIll.length > 0 && <div style={{color:"#f59e0b"}}>● Ongoing illness: {ongoingIll.map(i=>i.label).join(", ")} — train easy or rest.</div>}
            {injuries.length > 0 && <div style={{color:"#ef4444"}}>● {injuries.length} active injury(ies): {injuries.map(i=>i.bodyPart).join(", ")}.</div>}
            {restrictions.map((r,i) => <div key={i} style={{color:"#f59e0b",paddingLeft:10}}>→ {r}</div>)}
          </div>
        </div>
      )}

      {/* Header KPIs */}
      <div className="hlth-card">
        <div className="hlth-card-h">§06 // VITALS · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
          <div>
            <h2 style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:24,letterSpacing:"0.05em",margin:"4px 0 4px",color:"#ef4444"}}>Cardio &amp; vitals</h2>
            <div className="hlth-subtle" style={{fontSize:11,letterSpacing:"0.1em"}}>
              Resting HR, BP, HRV, temperature, SpO₂ — AHA 2024 / ACSM bands
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
            <Kpi label="RHR" value={last?.restingHr ? String(last.restingHr) : "—"} unit="bpm" color={lastRhr.color} hint={lastRhr.label}/>
            <Kpi label="BP" value={last?.systolic ? `${last.systolic}/${last.diastolic}` : "—"} unit="" color={lastBp.color} hint={lastBp.label}/>
            <Kpi label="Temp" value={last?.tempC ? last.tempC.toFixed(1) : "—"} unit="°C" color={lastTmp.color} hint={lastTmp.label}/>
            <Kpi label="SpO₂" value={last?.spo2 ? `${last.spo2}` : "—"} unit="%" color={lastSpo.color} hint={lastSpo.label}/>
            {rhr7>0 && <Kpi label="7d avg RHR" value={String(rhr7)} unit="bpm" color="#60a5fa"/>}
          </div>
        </div>
        <div className="hlth-subtle" style={{marginTop:8,fontSize:11}}>
          Best time to log RHR/BP: first thing waking, before coffee/phone, seated after 5 minutes rest.
          Chennai heat can push BP slightly lower and HR slightly higher — establish your own baseline.
        </div>
      </div>

      {/* Quick-log vitals */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Heart size={12}/> QUICK-LOG VITALS</div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:10,fontFamily:"var(--hlth-font-mono)",fontSize:10}}>
          <label style={{color:"var(--hlth-muted)"}}>date <input type="date" value={vDate} onChange={e=>setVDate(e.target.value)} style={input}/></label>
          <label style={{color:"var(--hlth-muted)"}}>time <input type="time" value={vTime} onChange={e=>setVTime(e.target.value)} style={input}/></label>
          <label style={{color:"var(--hlth-muted)"}}>context
            <select value={ctx||"waking"} onChange={e=>setCtx(e.target.value as VitalsEntry["context"])} style={input}>
              <option value="waking">Waking</option>
              <option value="resting">Resting</option>
              <option value="pre_workout">Pre-workout</option>
              <option value="post_workout">Post-workout</option>
              <option value="bedtime">Bedtime</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))",gap:8}}>
          <Field label="Resting HR (bpm)">
            <NumInput value={rhr} onChange={setRhr} placeholder="e.g. 62"/>
            {rhr && <Chip label={rh.label} color={rh.color} warn={rh.warn}/>}
          </Field>
          <Field label="Systolic (mmHg)">
            <NumInput value={sys} onChange={setSys} placeholder="e.g. 118"/>
          </Field>
          <Field label="Diastolic (mmHg)">
            <NumInput value={dia} onChange={setDia} placeholder="e.g. 76"/>
            {(sys||dia) && <Chip label={bp.label} color={bp.color} warn={bp.warn}/>}
          </Field>
          <Field label="HRV (ms, optional)">
            <NumInput value={hrv} onChange={setHrv} placeholder="from watch"/>
          </Field>
          <Field label="Temp (°C)">
            <NumInput value={temp} onChange={setTemp} step="0.1" placeholder="36.8"/>
            {temp && <Chip label={tmp.label} color={tmp.color} warn={tmp.warn}/>}
          </Field>
          <Field label="SpO₂ (%)">
            <NumInput value={spo2} onChange={setSpo2} placeholder="98"/>
            {spo2 && <Chip label={sp.label} color={sp.color} warn={sp.warn}/>}
          </Field>
          <Field label="Resp rate (br/min)">
            <NumInput value={rr} onChange={setRr} placeholder="12-16"/>
          </Field>
          <Field label="Note">
            <input type="text" value={vNote} onChange={e=>setVNote(e.target.value)} placeholder="post-cold, good sleep, etc" style={input}/>
          </Field>
        </div>

        <div style={{marginTop:12,display:"flex",gap:8}}>
          <button className="hlth-btn" onClick={saveVitals} style={{padding:"8px 16px",fontSize:11,display:"inline-flex",alignItems:"center",gap:6}}>
            <Plus size={12}/> LOG VITALS
          </button>
        </div>
      </div>

      {/* Orthostatic test */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Activity size={12}/> ORTHOSTATIC HR TEST (autonomic/recovery signal)</div>
        <div className="hlth-subtle" style={{fontSize:10,letterSpacing:"0.1em",marginBottom:8}}>
          Lie 5+ min → record HR → stand → record at 1 min and 3 min. Rise ≤12 normal; ≥20 bpm = possible fatigue/dehydration/dysautonomia.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))",gap:8,alignItems:"end"}}>
          <Field label="date"><input type="date" value={oDate} onChange={e=>setODate(e.target.value)} style={input}/></Field>
          <Field label="time"><input type="time" value={oTime} onChange={e=>setOTime(e.target.value)} style={input}/></Field>
          <Field label="HR supine (lying)"><NumInput value={oSupine} onChange={setOSupine} placeholder="bpm"/></Field>
          <Field label="HR standing @1min"><NumInput value={oSt1} onChange={setOSt1} placeholder="bpm"/></Field>
          <Field label="HR standing @3min"><NumInput value={oSt3} onChange={setOSt3} placeholder="optional"/></Field>
          <div>
            <button className="hlth-btn" onClick={addOrtho} style={{padding:"8px 14px",fontSize:11,display:"inline-flex",alignItems:"center",gap:6,width:"100%"}}>
              <Plus size={12}/> SAVE TEST
            </button>
          </div>
        </div>
        {(oSupine || oSt1) && (
          <div style={{marginTop:8,fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
            <Chip label={ortho.delta ? `Δ +${ortho.delta} bpm — ${ortho.level}` : "—"} color={ortho.color}/>
          </div>
        )}
        {health.orthostatic.length > 0 && (
          <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:4}}>
            {[...health.orthostatic].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(o => {
              const r = classifyOrthostatic(o);
              return (
                <div key={o.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:11,fontFamily:"var(--hlth-font-mono)"}}>
                  <span style={{color:"var(--hlth-muted)",minWidth:80}}>{o.date}</span>
                  <span>supine {o.hrSupine}</span>
                  <span>1min {o.hrStanding1min}</span>
                  {o.hrStanding3min && <span>3min {o.hrStanding3min}</span>}
                  <Chip label={`Δ +${r.delta} ${r.level}`} color={r.color}/>
                  <button onClick={()=>del("orthostatic",o.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={11}/></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Symptoms */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Stethoscope size={12}/> SYMPTOMS · TODAY</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(130px,1fr))",gap:6,marginBottom:10}}>
          {SYMPTOM_META.map(s => (
            <button key={s.id} onClick={()=>setSelSym(s.id)}
              style={{padding:"6px 8px",borderRadius:4,cursor:"pointer",textAlign:"left",
                background: selSym===s.id ? "rgba(239,68,68,0.15)" : "var(--hlth-card2)",
                border:`1px solid ${selSym===s.id ? "#ef4444" : "var(--hlth-border-soft)"}`,
                color: selSym===s.id ? "#ef4444" : "var(--hlth-fg)",fontFamily:"var(--hlth-font-mono)",fontSize:10,letterSpacing:"0.05em"}}>
              <s.icon size={13} style={{marginRight:4}}/>{s.label}
            </button>
          ))}
        </div>
        {selSym && (
          <div style={{padding:10,borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",marginBottom:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)"}}>severity</span>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={()=>setSymSev(n)} style={{
                padding:"4px 8px",borderRadius:4,cursor:"pointer",
                background:symSev===n?`rgba(239,68,68,${0.1+n*0.1})`:"var(--hlth-card)",
                border:`1px solid ${symSev===n?"#ef4444":"var(--hlth-border-soft)"}`,
                color:symSev===n?"#ef4444":"var(--hlth-muted)",fontSize:10,fontFamily:"var(--hlth-font-mono)"}}>
                {n}
              </button>
            ))}
            <input type="text" value={symNote} onChange={e=>setSymNote(e.target.value)} placeholder="note (optional)" style={{...input,flex:1,minWidth:150}}/>
            <button className="hlth-btn" onClick={addSymptom} style={{padding:"6px 12px",fontSize:10}}>TAG</button>
          </div>
        )}
        {todaySymptoms.length === 0 ? (
          <div className="hlth-subtle" style={{fontSize:11}}>No symptoms logged today. Tap a tag above if something's off.</div>
        ) : (
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {todaySymptoms.map(s => {
              const meta = SYMPTOM_META.find(m=>m.id===s.symptom)!;
              return (
                <span key={s.id} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:4,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#ef4444",fontFamily:"var(--hlth-font-mono)",fontSize:10}}>
                  <meta.icon size={12}/> {meta.label} · {s.severity}/5
                  <button onClick={()=>del("symptoms",s.id)} style={{background:"transparent",border:"none",color:"inherit",cursor:"pointer"}}>×</button>
                </span>
              );
            })}
          </div>
        )}
        {recentSymp.filter(s=>s.date!==today).length > 0 && (
          <div style={{marginTop:10}}>
            <div className="hlth-subtle" style={{fontSize:10,letterSpacing:"0.1em",marginBottom:4}}>RECENT</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {recentSymp.filter(s=>s.date!==today).slice(0,8).map(s=>{
                const meta = SYMPTOM_META.find(m=>m.id===s.symptom)!;
                return <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px",borderRadius:4,background:"var(--hlth-card2)",fontSize:10,fontFamily:"var(--hlth-font-mono)"}}>
                  <span style={{color:"var(--hlth-muted)",minWidth:75}}>{s.date}</span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5}}><meta.icon size={12}/>{meta.label}</span>
                  <span style={{color:"var(--hlth-muted)"}}>({s.severity}/5)</span>
                  {s.note && <span style={{color:"var(--hlth-muted)",opacity:0.7}}>· {s.note}</span>}
                  <button onClick={()=>del("symptoms",s.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={10}/></button>
                </div>;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Illness episodes */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Thermometer size={12}/> ILLNESS EPISODES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(150px,1fr))",gap:8,alignItems:"end",marginBottom:8}}>
          <Field label="start"><input type="date" value={illStart} onChange={e=>setIllStart(e.target.value)} style={input}/></Field>
          <Field label="end (leave blank if ongoing)"><input type="date" value={illEnd} onChange={e=>setIllEnd(e.target.value)} style={input}/></Field>
          <Field label="label"><input type="text" value={illLabel} onChange={e=>setIllLabel(e.target.value)} placeholder="viral fever, food poisoning…" style={input}/></Field>
          <Field label="severity">
            <select value={illSev} onChange={e=>setIllSev(Number(e.target.value))} style={input}>
              <option value={1}>1 mild</option><option value={2}>2</option><option value={3}>3 moderate</option>
              <option value={4}>4</option><option value={5}>5 severe</option>
            </select>
          </Field>
          <div><button className="hlth-btn" onClick={addIllness} style={{padding:"8px 14px",fontSize:11,width:"100%"}}><Plus size={12}/> ADD</button></div>
        </div>
        {health.illnesses.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {[...health.illnesses].sort((a,b)=>b.startDate.localeCompare(a.startDate)).map(i => (
              <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:11,fontFamily:"var(--hlth-font-mono)",flexWrap:"wrap"}}>
                <Badge label={i.endDate ? "recovered" : "ONGOING"} color={i.endDate ? "#10b981" : "#ef4444"}/>
                <span style={{fontWeight:700}}>{i.label}</span>
                <span style={{color:"var(--hlth-muted)"}}>{i.startDate}{i.endDate?` → ${i.endDate}`:""}</span>
                <span style={{color:"var(--hlth-muted)"}}>({i.severity}/5)</span>
                {!i.endDate && <button onClick={()=>endIllness(i.id)} className="hlth-btn hlth-btn-ghost" style={{padding:"3px 8px",fontSize:9}}>MARK RECOVERED</button>}
                <button onClick={()=>del("illnesses",i.id)} style={{marginLeft:i.endDate?"auto":0,background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={11}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Injuries */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Bandage size={12}/> INJURY LOG</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))",gap:8,alignItems:"end",marginBottom:8}}>
          <Field label="body part"><input type="text" value={injBody} onChange={e=>setInjBody(e.target.value)} placeholder="e.g. right shoulder" style={input}/></Field>
          <Field label="category">
            <select value={injCat||"other"} onChange={e=>setInjCat(e.target.value as InjuryEntry["category"])} style={input}>
              {INJURY_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="severity">
            <select value={injSev} onChange={e=>setInjSev(Number(e.target.value))} style={input}>
              <option value={1}>1 nag</option><option value={2}>2</option><option value={3}>3 modifies</option>
              <option value={4}>4 stops lifts</option><option value={5}>5 ER-worthy</option>
            </select>
          </Field>
          <Field label="status">
            <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,cursor:"pointer"}}>
              <input type="checkbox" checked={injOngoing} onChange={e=>setInjOngoing(e.target.checked)}/> ongoing
            </label>
          </Field>
          <div><button className="hlth-btn" onClick={addInjury} style={{padding:"8px 14px",fontSize:11,width:"100%"}}><Plus size={12}/> LOG</button></div>
        </div>
        {health.injuries.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {[...health.injuries].sort((a,b)=>b.date.localeCompare(a.date)).map(i => (
              <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:11,fontFamily:"var(--hlth-font-mono)",flexWrap:"wrap"}}>
                <Badge label={i.ongoing ? "ACTIVE" : "healed"} color={i.ongoing ? "#ef4444" : "#10b981"}/>
                <span style={{fontWeight:700}}>{i.bodyPart}</span>
                {i.category && i.category!=="other" && <span style={{color:"var(--hlth-muted)"}}>({i.category})</span>}
                <span style={{color:"var(--hlth-muted)"}}>since {i.date} · {i.severity}/5</span>
                <button onClick={()=>toggleInjury(i.id)} className="hlth-btn hlth-btn-ghost" style={{padding:"3px 8px",fontSize:9}}>{i.ongoing?"MARK HEALED":"REACTIVATE"}</button>
                <button onClick={()=>del("injuries",i.id)} style={{marginLeft:0,background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={11}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medications */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Pill size={12}/> MEDICATION LOG</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))",gap:8,alignItems:"end",marginBottom:8}}>
          <Field label="name"><input type="text" value={medName} onChange={e=>setMedName(e.target.value)} placeholder="paracetamol, azithro…" style={input}/></Field>
          <Field label="dose (text)"><input type="text" value={medDose} onChange={e=>setMedDose(e.target.value)} placeholder="1 tab, 5ml…" style={input}/></Field>
          <Field label="dose (mg, optional)"><NumInput value={medDoseMg} onChange={setMedDoseMg} placeholder="500"/></Field>
          <Field label="type">
            <select value={medType} onChange={e=>setMedType(e.target.value as MedicationEntry["type"])} style={input}>
              <option value="otc">OTC</option><option value="rx">Rx</option>
              <option value="ayurveda">Ayurveda / herbal</option><option value="other">Other</option>
            </select>
          </Field>
          <div><button className="hlth-btn" onClick={addMed} style={{padding:"8px 14px",fontSize:11,width:"100%"}}><Plus size={12}/> DOSE</button></div>
        </div>
        {recentMeds.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {recentMeds.map(m => (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px",borderRadius:4,background:"var(--hlth-card2)",fontSize:10,fontFamily:"var(--hlth-font-mono)"}}>
                <span style={{color:"var(--hlth-muted)",minWidth:75}}>{m.date} {m.time||""}</span>
                <span style={{fontWeight:700}}>{m.name}</span>
                {m.dose && <span style={{color:"var(--hlth-muted)"}}>{m.dose}</span>}
                {m.doseMg && <span style={{color:"var(--hlth-muted)"}}>{m.doseMg}mg</span>}
                <Badge label={m.type} color={m.type==="rx"?"#ef4444":m.type==="ayurveda"?"#10b981":"#60a5fa"}/>
                <button onClick={()=>del("medications",m.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={10}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allergies */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Shield size={12}/> KNOWN ALLERGIES</div>
        <div style={{display:"flex",gap:8,alignItems:"end",flexWrap:"wrap",marginBottom:8}}>
          <Field label="name"><input type="text" value={algName} onChange={e=>setAlgName(e.target.value)} placeholder="peanuts, sulfa, dust mites…" style={{...input,width:220}}/></Field>
          <Field label="severity">
            <select value={algSev} onChange={e=>setAlgSev(e.target.value as AllergyEntry["severity"])} style={input}>
              <option value="mild">mild</option><option value="moderate">moderate</option><option value="severe">severe</option>
            </select>
          </Field>
          <button className="hlth-btn" onClick={addAllergy} style={{padding:"8px 14px",fontSize:11}}><Plus size={12}/> ADD</button>
        </div>
        {health.allergies.length === 0 ? (
          <div className="hlth-subtle" style={{fontSize:11}}>No allergies listed. Add any drug/food/environmental allergies so they're handy in a crisis.</div>
        ) : (
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {health.allergies.map(a => (
              <span key={a.id} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:4,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontFamily:"var(--hlth-font-mono)",fontSize:10}}>
                {a.name}
                <Badge label={a.severity} color={a.severity==="severe"?"#ef4444":a.severity==="moderate"?"#f59e0b":"#60a5fa"}/>
                <button onClick={()=>del("allergies",a.id)} style={{background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Vitals history */}
      {recentVitals.length > 0 && (
        <div className="hlth-card">
          <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Clipboard size={12}/> RECENT VITALS LOG</div>
          <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:8}}>
            {recentVitals.map(v => {
              const b = classifyBp(v.systolic, v.diastolic);
              const t = classifyTemp(v.tempC);
              const s = classifySpo2(v.spo2);
              const r = classifyRhr(v.restingHr);
              return (
                <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:11,fontFamily:"var(--hlth-font-mono)",flexWrap:"wrap"}}>
                  <span style={{color:"var(--hlth-muted)",minWidth:115}}>{v.date} {v.time}</span>
                  {v.restingHr && <Badge label={`HR ${v.restingHr}`} color={r.color}/>}
                  {v.systolic && <Badge label={`${v.systolic}/${v.diastolic}`} color={b.color}/>}
                  {v.tempC && <Badge label={`${v.tempC}°C`} color={t.color}/>}
                  {v.spo2 && <Badge label={`${v.spo2}%`} color={s.color}/>}
                  {v.hrvMs && <span style={{color:"var(--hlth-muted)"}}>HRV {v.hrvMs}ms</span>}
                  {v.context && <span style={{color:"var(--hlth-muted)",opacity:0.7}}>· {v.context}</span>}
                  {v.note && <span style={{color:"var(--hlth-muted)",opacity:0.7}}>· {v.note}</span>}
                  <button onClick={()=>del("vitals",v.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}><Trash2 size={11}/></button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- UI primitives ----------------

function Kpi({ label, value, unit, color, hint }: { label:string; value:string; unit:string; color:string; hint?:string }) {
  return (
    <div style={{padding:"8px 12px",border:`1px solid ${color}44`,borderRadius:8,background:`${color}0d`,minWidth:90}}>
      <div style={{fontSize:9,letterSpacing:"0.15em",color:"var(--hlth-muted)",marginBottom:2}}>{label}</div>
      <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:16,color}}>
        {value}{unit && <span style={{fontSize:11,marginLeft:2,opacity:0.7,fontFamily:"var(--hlth-font-mono)"}}>{unit}</span>}
      </div>
      {hint && <div style={{fontSize:9,letterSpacing:"0.05em",color:"var(--hlth-muted)",marginTop:2}}>{hint}</div>}
    </div>
  );
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <label style={{display:"flex",flexDirection:"column",gap:3,fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",letterSpacing:"0.1em"}}>
      {label}
      {children}
    </label>
  );
}

function NumInput({ value, onChange, step, placeholder }: { value:string; onChange:(v:string)=>void; step?:string; placeholder?:string }) {
  return <input type="number" step={step||"1"} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={input}/>;
}

const input: React.CSSProperties = {
  background:"var(--hlth-card2)",color:"var(--hlth-fg)",border:"1px solid var(--hlth-border-soft)",
  borderRadius:4,padding:"6px 8px",fontFamily:"var(--hlth-font-mono)",fontSize:12,width:"100%",boxSizing:"border-box",
};

function Badge({ label, color }: { label:string; color:string }) {
  return <span style={{border:`1px solid ${color}55`,background:`${color}15`,color,padding:"2px 6px",borderRadius:4,fontSize:9,letterSpacing:"0.08em",fontWeight:700}}>{label.toUpperCase()}</span>;
}

function Chip({ label, color, warn }: { label:string; color:string; warn?:boolean }) {
  return <span style={{display:"inline-block",marginTop:4,padding:"2px 6px",borderRadius:3,background:`${color}22`,color,border:`1px solid ${color}55`,fontSize:9,letterSpacing:"0.08em",fontWeight:700}}>{label}{warn?" ⚠":""}</span>;
}
