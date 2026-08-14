"use client";

/**
 * SomaSection — body composition, measurements, Navy BF%, progress photos, S:W ratios.
 *
 * Wave 4:
 *  - Tape measurement form (24 bilateral sites: neck/chest/chestFlexed/shoulder/waist/hip
 *    + L/R arm/forearm/thigh/calf/wrist/ankle); weightKg snapshot (defaults to latest
 *    from Workout). Saves dated MeasurementEntry, auto-computes Navy BF%.
 *  - Navy BF% live preview as you type. Lean mass + fat mass computed. Waist-to-height.
 *  - Strength-to-weight ratios for 5 lifts (bench/squat/dead/OHP/pull-up) pulling live
 *    PRs from Workout. Classifies beginner/novice/intermediate/advanced/elite.
 *  - BMI + category (with "lifters often land here" caveat).
 *  - Asymmetry detector (>1cm L-R difference flagged red).
 *  - Progress photos: file upload + webcam capture, angle tags (6-preset: front/side/back
 *    × relaxed/flexed + progress/pump/other), stored as dataURL.
 *  - History: last 10 measurements listed, 90-day sparkline for waist/bf%/weight.
 */

import { useMemo, useState, useRef } from "react";
import { Ruler, Scale, Target, Camera, Upload, Trash2, Plus, AlertTriangle, TrendingDown, TrendingUp, User, Dumbbell } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  navyBF_m, bmi, bmiCategory, lbmKg, fatMassKg, whtr, detectAsymmetries,
  latestMeasurement, currentBfPct, strengthClass, SW_STANDARDS, bmrKatch,
} from "../../lib/healthAnalytics";
import { PROGRESS_PHOTO_LABELS, type MeasurementEntry, type ProgressPhoto, type ProgressPhotoTag } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0,10); }
function uid() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }

// Tape sites displayed in order. Pairs render L/R side-by-side.
type Site = { key: keyof MeasurementEntry; label: string; placeholder?: string; pair?: boolean };
const SITES: Site[] = [
  { key: "neckCm",        label: "Neck (cm)" },
  { key: "shoulderCm",    label: "Shoulders (cm)" },
  { key: "chestCm",       label: "Chest relaxed (cm)" },
  { key: "chestFlexedCm", label: "Chest flexed (cm)" },
  { key: "waistCm",       label: "Waist (navel, cm)" },
  { key: "hipCm",         label: "Hips (cm)" },
  { key: "armLeftCm",     label: "Left arm (cm)",      pair: true },
  { key: "armRightCm",    label: "Right arm (cm)",     pair: true },
  { key: "forearmLeftCm", label: "Left forearm (cm)",  pair: true },
  { key: "forearmRightCm",label: "Right forearm (cm)", pair: true },
  { key: "thighLeftCm",   label: "Left thigh (cm)",    pair: true },
  { key: "thighRightCm",  label: "Right thigh (cm)",   pair: true },
  { key: "calfLeftCm",    label: "Left calf (cm)",     pair: true },
  { key: "calfRightCm",   label: "Right calf (cm)",    pair: true },
  { key: "wristCm",       label: "Wrist (cm)" },
  { key: "ankleCm",       label: "Ankle (cm)" },
];

const PHOTO_TAGS: ProgressPhotoTag[] = [
  "front_relaxed","front_flexed","side_relaxed","side_flexed","back_relaxed","back_flexed",
  "progress","pump","other",
];

function toNum(v: string): number | undefined {
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? Math.round(n*10)/10 : undefined;
}

export default function SomaSection() {
  const { health, updateHealth, workout } = useStore();
  const today = todayIso();

  // Latest bodyweight from Workout (source of truth)
  const latestBw = useMemo(() => {
    const sorted = [...workout.bodyweight].sort((a,b)=>b.date.localeCompare(a.date));
    return sorted[0]?.weightKg ?? 70;
  }, [workout.bodyweight]);

  const last = useMemo(() => latestMeasurement(health.measurements), [health.measurements]);

  // Form state — pre-fill with last measurement for easy "measure weekly" workflow
  const [mdate, setMdate] = useState<string>(today);
  const [weight, setWeight] = useState<string>(latestBw.toFixed(1));
  const [vals, setVals] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    if (last) {
      for (const s of SITES) if (last[s.key] != null) init[s.key] = String(last[s.key]);
    }
    return init;
  });
  const [note, setNote] = useState("");

  // Live previews
  const bf = useMemo(() => {
    const waist = toNum(vals.waistCm);
    const neck  = toNum(vals.neckCm);
    if (waist && neck) return Math.round(navyBF_m(waist, neck, health.profile.heightCm)*10)/10;
    if (last?.navyBfPct) return last.navyBfPct;
    return 0;
  }, [vals, last, health.profile.heightCm]);

  const w = toNum(weight) ?? latestBw;
  const bmiVal = bmi(w, health.profile.heightCm);
  const bmiCat = bmiCategory(bmiVal);
  const lb = bf > 0 ? Math.round(lbmKg(w, bf)*10)/10 : 0;
  const fm = bf > 0 ? Math.round(fatMassKg(w, bf)*10)/10 : 0;
  const whtrVal = vals.waistCm ? Math.round(whtr(toNum(vals.waistCm)!, health.profile.heightCm)*100)/100 : 0;
  const asyms = useMemo(() => {
    const partial: MeasurementEntry = { id:"_live", date:today };
    for (const s of SITES) {
      const v = toNum(vals[s.key]);
      if (v != null) (partial as any)[s.key] = v;
    }
    return detectAsymmetries(partial);
  }, [vals, today]);

  // S:W ratios
  const ratios = useMemo(() => {
    const prByEx: Record<string, number> = {};
    for (const pr of workout.prs) {
      // best value — for reps-based bodyweight lifts use reps; for kg lifts use estimated 1RM
      const ex = workout.exercises.find(e => e.id === pr.exerciseId);
      if (!ex) continue;
      const key =
        pr.exerciseId === "w-squat"   ? "back_squat"    :
        pr.exerciseId === "w-bench"   ? "bench_press"   :
        pr.exerciseId === "w-dead"    ? "deadlift"      :
        pr.exerciseId === "w-ohp"     ? "overhead_press":
        pr.exerciseId === "w-pullup"  ? "pullup"        : null;
      if (!key) continue;
      // Track best estimated 1RM (kg lifts) or best reps (pullup)
      if (key === "pullup") {
        // reps-based — take best raw reps
        if (!prByEx[key] || pr.value > prByEx[key]) prByEx[key] = pr.value;
      } else {
        if (!prByEx[key] || (pr.estimated1RM ?? pr.value) > prByEx[key]) prByEx[key] = pr.estimated1RM ?? pr.value;
      }
    }
    const out: { key: keyof typeof SW_STANDARDS; label: string; value: number; ratio: number|string; unit: string; tier: string; color: string }[] = [];
    const map: [keyof typeof SW_STANDARDS,string,string][] = [
      ["back_squat","Back Squat","kg"],
      ["bench_press","Bench Press","kg"],
      ["deadlift","Deadlift","kg"],
      ["overhead_press","Overhead Press","kg"],
      ["pullup","Pull-ups","reps"],
    ];
    for (const [key,label,unit] of map) {
      const v = prByEx[key];
      if (v == null) { out.push({key,label,value:0,ratio:"—",unit,tier:"No PR",color:"#64748b"}); continue; }
      const ratio = key === "pullup" ? v : Math.round((v/w)*100)/100;
      const cls = strengthClass(key === "pullup" ? v : v/w, key);
      out.push({key,label,value:key==="pullup"?Math.round(v):Math.round(v*10)/10,ratio,unit,tier:cls.tier,color:cls.color});
    }
    return out;
  }, [workout.prs, workout.exercises, w]);

  // Save measurement
  const save = () => {
    const entry: MeasurementEntry = { id: uid(), date: mdate, weightKg: w, note: note || undefined };
    for (const s of SITES) {
      const v = toNum(vals[s.key]);
      if (v != null) (entry as any)[s.key] = v;
    }
    if (entry.waistCm && entry.neckCm) {
      entry.navyBfPct = navyBF_m(entry.waistCm, entry.neckCm, health.profile.heightCm);
    }
    updateHealth(h => ({
      measurements: [...h.measurements.filter(x => x.date !== mdate), entry]
        .sort((a,b)=>a.date.localeCompare(b.date)),
    }));
    setNote("");
  };

  const removeMeasurement = (id: string) => {
    updateHealth(h => ({ measurements: h.measurements.filter(m => m.id !== id) }));
  };

  // Progress photos
  const [photoTags, setPhotoTags] = useState<ProgressPhotoTag[]>(["front_relaxed"]);
  const [photoNote, setPhotoNote] = useState("");
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [camActive, setCamActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);

  const stopCam = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCamActive(false);
  };

  const startCam = async () => {
    setCamActive(true);
    setPreviewUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      window.alert("Could not access camera — you can still upload a photo from your gallery.");
      setCamActive(false);
    }
  };

  const snap = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    const W = 480, H = Math.round(W * (v.videoHeight / v.videoWidth));
    c.width = W; c.height = H;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.drawImage(v, 0, 0, W, H);
    setPreviewUrl(c.toDataURL("image/jpeg", 0.75));
    stopCam();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const savePhoto = () => {
    if (!previewUrl) return;
    const photo: ProgressPhoto = {
      id: uid(), date: today, tags: [...photoTags], dataUrl: previewUrl,
      weightKg: w, bfPct: bf > 0 ? bf : undefined, note: photoNote || undefined,
    };
    updateHealth(h => ({ photos: [photo, ...h.photos].slice(0, 200) }));
    setPreviewUrl(null); setPhotoNote(""); setPhotoTags(["front_relaxed"]);
  };

  const removePhoto = (id: string) => {
    updateHealth(h => ({ photos: h.photos.filter(p => p.id !== id) }));
  };

  const recentPhotos = useMemo(() => [...health.photos].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12), [health.photos]);
  const recentM = useMemo(() => [...health.measurements].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8), [health.measurements]);

  // 90-day BF% trend (simple ASCII mini)
  const bfTrend = useMemo(() => {
    const last90 = [...health.measurements].filter(m => m.navyBfPct != null).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
    return last90;
  }, [health.measurements]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {/* Header */}
      <div className="hlth-card">
        <div className="hlth-card-h">§04 // SOMA · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
          <div>
            <h2 style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:24,letterSpacing:"0.05em",margin:"4px 0 4px",color:"#f472b6"}}>Body composition</h2>
            <div className="hlth-subtle" style={{fontSize:11,letterSpacing:"0.1em"}}>
              Navy BF%, tape measurements, S:W ratios, progress photos
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
            <Kpi label="Weight"    value={w.toFixed(1)} unit="kg" color="#3b82f6"/>
            <Kpi label="Body fat"   value={bf ? bf.toFixed(1) : "—"} unit="%" color={bf>20?"#ef4444":bf>12?"#f59e0b":"#10b981"}/>
            <Kpi label="BMI"        value={bmiVal.toFixed(1)} unit="" color={bmiCat.color}/>
            <Kpi label="Lean mass"  value={lb ? lb.toFixed(1) : "—"} unit="kg" color="#10b981"/>
            <Kpi label="Fat mass"   value={fm ? fm.toFixed(1) : "—"} unit="kg" color="#f59e0b"/>
            {whtrVal>0 && <Kpi label="WHtR" value={whtrVal.toFixed(2)} unit="" color={whtrVal>0.55?"#ef4444":whtrVal>0.5?"#f59e0b":"#10b981"}/>}
          </div>
        </div>
        {bmiCat.caveat && (
          <div style={{marginTop:10,padding:"6px 10px",borderRadius:4,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b",fontFamily:"var(--hlth-font-mono)",fontSize:10,letterSpacing:"0.05em"}}>
            ⚠ BMI category: {bmiCat.label}. {bmiCat.caveat}.
          </div>
        )}
      </div>

      {/* Measurement form */}
      <div className="hlth-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,flexWrap:"wrap"}}>
          <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Ruler size={12}/> TAPE MEASUREMENTS</div>
          <div style={{display:"flex",gap:6,alignItems:"center",fontFamily:"var(--hlth-font-mono)",fontSize:10}}>
            <label style={{color:"var(--hlth-muted)",display:"flex",alignItems:"center",gap:4}}>
              date
              <input type="date" value={mdate} onChange={e=>setMdate(e.target.value)} style={input}/>
            </label>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))",gap:8}}>
          <Field label={`Weight (kg) — pulled from Workout`}>
            <input type="number" step="0.1" min={30} max={200} value={weight} onChange={e=>setWeight(e.target.value)} style={input}/>
          </Field>
          {SITES.map(s => (
            <Field key={String(s.key)} label={s.label}>
              <input type="number" step="0.1" min={0} max={300} placeholder="cm"
                value={vals[String(s.key)] ?? ""}
                onChange={e=>setVals(v=>({...v,[s.key]:e.target.value}))}
                style={{...input, borderColor: s.pair && vals[String(s.key)] ? "var(--hlth-border-soft)" : undefined}}/>
            </Field>
          ))}
          <Field label="Note (optional)">
            <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="post-bulk, week 6 cut, etc." style={input}/>
          </Field>
        </div>

        {/* Live BF readout */}
        <div style={{marginTop:12, padding:12, borderRadius:8, background: bf>0 ? `${bf>20?"#ef4444":bf>12?"#f59e0b":"#10b981"}12` : "var(--hlth-card2)", border:`1px solid ${bf>0?(bf>20?"#ef4444":bf>12?"#f59e0b":"#10b981")+"55":"var(--hlth-border-soft)"}`}}>
          {bf > 0 ? (
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",fontFamily:"var(--hlth-font-mono)",fontSize:12}}>
              <span style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:20,color:bf>20?"#ef4444":bf>12?"#f59e0b":"#10b981"}}>{bf.toFixed(1)}%</span>
              <span style={{color:"var(--hlth-fg)"}}>Navy BF → {lb.toFixed(1)} kg LBM, {fm.toFixed(1)} kg fat</span>
              {whtrVal>0 && <Badge label={`WHtR ${whtrVal.toFixed(2)}`} color={whtrVal>0.55?"#ef4444":whtrVal>0.5?"#f59e0b":"#10b981"}/>}
              {asyms.length > 0 && (
                <span style={{display:"inline-flex",alignItems:"center",gap:4,color:"#ef4444",marginLeft:"auto",fontSize:10}}>
                  <AlertTriangle size={12}/> asymmetry: {asyms.map(a=>`${a.site} ${a.diff}cm`).join(", ")}
                </span>
              )}
            </div>
          ) : (
            <div className="hlth-subtle" style={{fontSize:11,margin:0}}>
              Enter neck + waist to see live Navy BF% estimate.
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          <button className="hlth-btn" onClick={save} style={{padding:"8px 16px",fontSize:11,display:"inline-flex",alignItems:"center",gap:6}}>
            <Plus size={12}/> SAVE MEASUREMENT
          </button>
        </div>
      </div>

      {/* S:W ratios */}
      <div className="hlth-card">
        <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Dumbbell size={12}/> STRENGTH-TO-WEIGHT RATIOS (pulled from Workout PRs)</div>
        <div className="hlth-subtle" style={{fontSize:10,letterSpacing:"0.1em",marginBottom:10}}>
          standards approximate (kg/kg BW, natural lifters 18-35yo; ExRx / Kilgore / Rippetoe tiers)
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
          {ratios.map(r => (
            <div key={r.key} style={{padding:"10px 12px",borderRadius:8,background:"var(--hlth-card2)",border:`1px solid ${r.color}44`,position:"relative"}}>
              <div style={{position:"absolute",top:0,right:0,width:3,height:"100%",background:r.color}}/>
              <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:13,letterSpacing:"0.05em"}}>{r.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:4}}>
                <span style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:20,color:r.color}}>
                  {r.key==="pullup" ? r.value : `${r.value}${r.unit}`}
                </span>
                <span style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)"}}>
                  {r.key==="pullup" ? "reps" : `${r.ratio}× BW`}
                </span>
              </div>
              <div style={{marginTop:4,fontFamily:"var(--hlth-font-mono)",fontSize:10,color:r.color,letterSpacing:"0.1em"}}>{r.tier.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress photos */}
      <div className="hlth-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Camera size={12}/> PROGRESS PHOTOS</div>
          <div style={{display:"flex",gap:6}}>
            <button className="hlth-btn hlth-btn-ghost" onClick={startCam} style={{padding:"6px 10px",fontSize:10,display:"inline-flex",alignItems:"center",gap:4}}>
              <Camera size={10}/> WEBCAM
            </button>
            <button className="hlth-btn hlth-btn-ghost" onClick={()=>fileRef.current?.click()} style={{padding:"6px 10px",fontSize:10,display:"inline-flex",alignItems:"center",gap:4}}>
              <Upload size={10}/> UPLOAD
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
          </div>
        </div>

        {(camActive || previewUrl) && (
          <div style={{padding:12,borderRadius:8,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",marginBottom:10}}>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-start"}}>
              <div style={{width:240,flexShrink:0}}>
                {camActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",borderRadius:6,background:"#000",transform:"scaleX(-1)"}}/>
                    <button onClick={snap} className="hlth-btn" style={{width:"100%",marginTop:6,padding:"6px",fontSize:10}}>SNAP</button>
                    <button onClick={stopCam} className="hlth-btn hlth-btn-ghost" style={{width:"100%",marginTop:4,padding:"6px",fontSize:10}}>CANCEL</button>
                  </>
                ) : previewUrl ? (
                  <>
                    <img src={previewUrl} alt="preview" style={{width:"100%",borderRadius:6,display:"block"}}/>
                    <div style={{display:"flex",gap:4,marginTop:6}}>
                      <button onClick={savePhoto} className="hlth-btn" style={{flex:1,padding:"6px",fontSize:10}}>SAVE</button>
                      <button onClick={()=>setPreviewUrl(null)} className="hlth-btn hlth-btn-ghost" style={{padding:"6px 10px",fontSize:10}}>✕</button>
                    </div>
                  </>
                ) : null}
                <canvas ref={canvasRef} style={{display:"none"}}/>
              </div>
              <div style={{flex:1,minWidth:200,display:"flex",flexDirection:"column",gap:8}}>
                <div>
                  <div style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",letterSpacing:"0.1em",marginBottom:4}}>TAGS (select all that apply)</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {PHOTO_TAGS.map(t => (
                      <button key={t} onClick={()=>setPhotoTags(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t])}
                        style={{
                          padding:"4px 8px",borderRadius:4,fontSize:9,cursor:"pointer",fontFamily:"var(--hlth-font-mono)",letterSpacing:"0.05em",
                          background: photoTags.includes(t) ? "rgba(244,114,182,0.2)" : "var(--hlth-card)",
                          border:`1px solid ${photoTags.includes(t) ? "#f472b6" : "var(--hlth-border-soft)"}`,
                          color: photoTags.includes(t) ? "#f472b6" : "var(--hlth-muted)",
                        }}>
                        {PROGRESS_PHOTO_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Note (optional)">
                  <input type="text" value={photoNote} onChange={e=>setPhotoNote(e.target.value)} placeholder="e.g. week 8 of cut" style={input}/>
                </Field>
              </div>
            </div>
          </div>
        )}

        {recentPhotos.length === 0 && !camActive && !previewUrl ? (
          <div style={{padding:"20px",textAlign:"center",fontFamily:"var(--hlth-font-mono)",fontSize:11,color:"var(--hlth-muted)",letterSpacing:"0.1em",border:"1px dashed var(--hlth-border-soft)",borderRadius:8}}>
            <Camera size={20} style={{opacity:0.3,margin:"0 auto 6px",display:"block"}}/>
            snap your first progress photo — 6 angles, same lighting, same time (morning post-piss pre-meal)
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
            {recentPhotos.map(p => (
              <div key={p.id} style={{position:"relative",borderRadius:6,overflow:"hidden",border:"1px solid var(--hlth-border-soft)",background:"var(--hlth-card2)"}}>
                <img src={p.dataUrl} alt="" style={{width:"120%",height:140,objectFit:"cover",display:"block"}}/>
                <div style={{padding:6,fontSize:9,fontFamily:"var(--hlth-font-mono)",color:"var(--hlth-muted)",letterSpacing:"0.05em"}}>
                  <div style={{color:"var(--hlth-fg)",fontWeight:700}}>{p.date}</div>
                  <div>{p.tags.slice(0,2).map(t=>PROGRESS_PHOTO_LABELS[t]).join(" · ")}{p.tags.length>2?"…":""}</div>
                  {p.weightKg && <div>{p.weightKg}kg{p.bfPct?` · ${p.bfPct.toFixed(1)}%`:""}</div>}
                </div>
                <button onClick={()=>removePhoto(p.id)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.6)",border:"none",color:"#f87171",borderRadius:4,padding:3,cursor:"pointer"}}>
                  <Trash2 size={10}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Measurement history */}
      {recentM.length > 0 && (
        <div className="hlth-card">
          <div className="hlth-card-h">// recent measurements</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8}}>
            {recentM.map(m => (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:11,fontFamily:"var(--hlth-font-mono)",flexWrap:"wrap"}}>
                <span style={{color:"var(--hlth-muted)",minWidth:90}}>{m.date}</span>
                {m.weightKg && <span style={{color:"var(--hlth-fg)",fontWeight:700}}>{m.weightKg}kg</span>}
                {m.navyBfPct && <Badge label={`BF ${m.navyBfPct.toFixed(1)}%`} color={m.navyBfPct>20?"#ef4444":m.navyBfPct>12?"#f59e0b":"#10b981"}/>}
                {m.waistCm && <span style={{color:"var(--hlth-muted)"}}>waist {m.waistCm}</span>}
                {m.armRightCm && <span style={{color:"var(--hlth-muted)"}}>arm {m.armRightCm}</span>}
                {m.chestCm && <span style={{color:"var(--hlth-muted)"}}>chest {m.chestCm}</span>}
                {m.thighRightCm && <span style={{color:"var(--hlth-muted)"}}>thigh {m.thighRightCm}</span>}
                {m.note && <span style={{color:"var(--hlth-fg)",opacity:0.7}}>· {m.note}</span>}
                <button onClick={()=>removeMeasurement(m.id)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--hlth-muted)",cursor:"pointer"}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
          {bfTrend.length >= 2 && (
            <div style={{marginTop:10,padding:"8px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)"}}>
              <div style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",letterSpacing:"0.1em",marginBottom:4}}>BF% TREND ({bfTrend[0].date} → {bfTrend[bfTrend.length-1].date})</div>
              <Sparkline data={bfTrend.map(m => m.navyBfPct!)} color="#f472b6" label="BF%"/>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, unit, color }: { label:string; value:string; unit:string; color:string }) {
  return (
    <div style={{padding:"8px 12px",border:`1px solid ${color}44`,borderRadius:8,background:`${color}0d`,minWidth:80}}>
      <div style={{fontSize:9,letterSpacing:"0.15em",color:"var(--hlth-muted)",marginBottom:2}}>{label}</div>
      <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:16,color}}>
        {value}{unit && <span style={{fontSize:11,marginLeft:2,opacity:0.7,fontFamily:"var(--hlth-font-mono)"}}>{unit}</span>}
      </div>
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

const input: React.CSSProperties = {
  background:"var(--hlth-card2)",color:"var(--hlth-fg)",border:"1px solid var(--hlth-border-soft)",
  borderRadius:4,padding:"6px 8px",fontFamily:"var(--hlth-font-mono)",fontSize:12,width:"100%",boxSizing:"border-box",
};

function Badge({ label, color }: { label:string; color:string }) {
  return <span style={{border:`1px solid ${color}55`,background:`${color}15`,color,padding:"2px 6px",borderRadius:4,fontSize:9,letterSpacing:"0.1em",fontWeight:700}}>{label}</span>;
}

function Sparkline({ data, color, label }: { data:number[]; color:string; label:string }) {
  if (data.length < 2) return null;
  const W=300,H=40;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max-min || 1;
  const pts = data.map((v,i)=>{
    const x = (i/(data.length-1))*W;
    const y = H - ((v-min)/range)*H*0.8 - 4;
    return `${x},${y}`;
  }).join(" ");
  const first = data[0], last = data[data.length-1];
  const diff = last - first;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <svg width={W} height={H} style={{flexShrink:0}}>
        <polyline points={pts} stroke={color} strokeWidth={2} fill="none" style={{filter:`drop-shadow(0 0 4px ${color}55)`}}/>
      </svg>
      <div style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)",display:"flex",alignItems:"center",gap:6}}>
        {diff<0 ? <TrendingDown size={12} style={{color:"#10b981"}}/> : diff>0 ? <TrendingUp size={12} style={{color:"#ef4444"}}/> : null}
        <span style={{color: diff<0?"#10b981":diff>0?"#ef4444":"var(--hlth-muted)",fontWeight:700}}>
          {diff>0?"+":""}{diff.toFixed(1)}%
        </span>
        <span>({first.toFixed(1)}% → {last.toFixed(1)}%)</span>
      </div>
    </div>
  );
}
