"use client";

/**
 * ReportsSection — timeline, weekly/monthly aggregates, CSV/JSON export, habit streaks, check-in dashboard.
 * Wave 6:
 *  - 90-day heatmap calendar (GitHub-style) of daily completion score.
 *  - Weekly aggregates (sleep avg, kcal avg, protein avg, hydration avg, workout days, volume, minutes,
 *    mood avg, stress avg, meditation days, completion, streak).
 *  - Monthly roll-up (last 4 weeks).
 *  - Habit streak tiles (meals logged, hydration ≥80%, sleep ≥7h, protein ≥ target, meditation, workouts, supps).
 *  - Timeline feed (last 30 entries across sleep/meals/water/measurements/vitals/symptoms/injuries/PRs read from Workout).
 *  - Export CSV (all 90 daily summaries) and JSON (full health state).
 */

import { useMemo, useState } from "react";
import { FileDown, Calendar, Activity, Flame, Droplet, Moon, Pill, Dumbbell, Brain, Sparkles } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  buildDailySummaries, weeklyReport, habitStreak, exportHealthCSV,
  reverseEngineerTdee, waterGoalMl, proteinTargetG, tdee as tdeeFn,
  projectedSleepRecovery, preWorkoutAdvisory, trainingStatus, avgRhr,
  computeSleepBank, recoveryScore, activeInjuries, burnoutHeuristic, classifyBp,
} from "../../lib/healthAnalytics";

function todayIso(){ return new Date().toISOString().slice(0,10); }
function fmtDate(d: string){ return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",timeZone:"Asia/Kolkata"}); }
function dayOfWeek(d: string){ return new Date(d).toLocaleDateString("en-IN",{weekday:"short",timeZone:"Asia/Kolkata"}); }

export default function ReportsSection() {
  const { health, workout } = useStore();
  const today = todayIso();

  // Latest bodyweight
  const bw = useMemo(() => {
    const sorted = [...workout.bodyweight].sort((a,b)=>b.date.localeCompare(a.date));
    return sorted[0]?.weightKg ?? 70;
  }, [workout.bodyweight]);

  const summaries = useMemo(() => buildDailySummaries(
    health, workout.sessions,
    (w) => waterGoalMl(w, health.profile.climateMult),
    (w) => proteinTargetG(w),
    (w) => tdeeFn(w, health.profile),
    bw, 90,
  ), [health, workout.sessions, bw, health.profile]);

  const week = useMemo(() => weeklyReport(summaries), [summaries]);
  const month = useMemo(() => {
    const last28 = summaries.slice(-28);
    if (!last28.length) return null;
    const avg = (arr:number[]) => arr.length ? arr.reduce((s,x)=>s+x,0)/arr.length : 0;
    return {
      days: last28.length,
      sleep: avg(last28.map(s=>s.sleepHours)),
      kcal: avg(last28.map(s=>s.kcal)),
      protein: avg(last28.map(s=>s.proteinG)),
      water: avg(last28.map(s=>s.hydrationPct)),
      completion: avg(last28.map(s=>s.completed)),
      woDays: last28.filter(s=>s.hasWorkout).length,
      vol: last28.reduce((n,s)=>n+s.workoutVolumeKg,0),
      mins: last28.reduce((n,s)=>n+s.workoutMinutes,0),
      moodAvg: avg(last28.filter(s=>s.mood!=null).map(s=>s.mood!)),
    };
  }, [summaries]);

  // Streaks
  const streaks = useMemo(() => ({
    perfect: habitStreak(summaries, s => s.completed >= 85),
    hydration: habitStreak(summaries, s => s.hydrationPct >= 80),
    sleep: habitStreak(summaries, s => s.sleepHours >= 7),
    protein: habitStreak(summaries, s => s.proteinG >= proteinTargetG(bw)*0.9),
    workouts: habitStreak(summaries, s => s.hasWorkout),
    meditation: habitStreak(summaries, s => s.meditatedMin > 0),
    meals: habitStreak(summaries, s => s.kcal > tdeeFn(bw, health.profile)*0.7),
  }), [summaries, bw, health.profile]);

  // TDEE reverse-engineer
  const tdeeRev = useMemo(() => reverseEngineerTdee(
    health.meals,
    // merge health.measurements (weightKg) + workout.bodyweight for weights series
    [
      ...workout.bodyweight.map(b => ({date:b.date, weightKg:b.weightKg})),
      ...health.measurements.filter(m=>m.weightKg!=null).map(m=>({date:m.date, weightKg:m.weightKg!})),
    ],
    14,
  ), [health.meals, health.measurements, workout.bodyweight]);

  // Sleep projection
  const sleepProj = projectedSleepRecovery(health.sleep, health.profile.idealSleepHours);
  // Today's water
  const todayWater = summaries.find(s=>s.date===today)?.waterMl ?? 0;
  const waterPct = Math.round(Math.min(100, (todayWater / Math.max(1,waterGoalMl(bw, health.profile.climateMult)))*100));
  const bank = computeSleepBank(health.sleep, health.profile.idealSleepHours);
  const lastNight = [...health.sleep].sort((a,b)=>b.date.localeCompare(a.date))[0];
  const injuries = activeInjuries(health.injuries);
  const bpCrisis = (() => {
    const todayV = health.vitals.filter(v=>v.date===today).sort((a,b)=>(b.time||"").localeCompare(a.time||""))[0];
    if (!todayV) return false;
    return classifyBp(todayV.systolic, todayV.diastolic).cat === "crisis";
  })();
  const fever = (() => {
    const todayV = health.vitals.filter(v=>v.date===today).sort((a,b)=>(b.time||"").localeCompare(a.time||""))[0];
    return !!todayV?.tempC && todayV.tempC >= 38;
  })();
  const rhrBaseline = avgRhr(health.vitals, 21);
  const rhr7 = avgRhr(health.vitals, 7);
  const rhrDelta = rhrBaseline>0 && rhr7>0 ? rhr7 - rhrBaseline : 0;
  const burnout = burnoutHeuristic({sleepEntries:health.sleep,idealHours:health.profile.idealSleepHours,vitals:health.vitals,mind:health.mind,injuries:health.injuries});
  const lastRec = recoveryScore(health.sleep, health.profile.idealSleepHours, waterPct);
  const preWO = preWorkoutAdvisory({
    sleepBank: bank, lastNightHrs: lastNight?.durationHours ?? 0, recovery: Math.round(lastRec*100),
    hydrationPct: waterPct, activeInjuries: injuries.length, bpCrisis, fever, rhrDelta,
    burnoutLevel: burnout.level,
  });

  // Training status (last 2w vs prior 4w)
  const tStatus = useMemo(() => {
    const pastVol = (days: number, offset: number) => {
      const start = new Date(); start.setDate(start.getDate() - offset - days);
      const end = new Date(); end.setDate(end.getDate() - offset);
      const set = new Set<string>();
      for (let i=0;i<days;i++){ const d = new Date(start); d.setDate(start.getDate()+i); set.add(d.toISOString().slice(0,10)); }
      return workout.sessions.filter(s => s.endedAt && set.has(s.date)).reduce((n,s)=>n+(s.totalVolumeKg??0),0);
    };
    const recentSess = workout.sessions.filter(s => {
      const d = new Date(s.date); const n = new Date(); n.setDate(n.getDate()-14);
      return s.endedAt && d >= n;
    }).length;
    const priorSess = workout.sessions.filter(s => {
      const d = new Date(s.date); const lo = new Date(); lo.setDate(lo.getDate()-42); const hi = new Date(); hi.setDate(hi.getDate()-14);
      return s.endedAt && d>=lo && d<hi;
    }).length;
    return trainingStatus({
      recentVol: pastVol(14, 0), priorVol: pastVol(28, 14),
      recovery: Math.round(lastRec*100), rhrDelta, sessionsRecent: recentSess, sessionsPrior: priorSess,
    });
  }, [workout.sessions, lastRec, rhrDelta]);

  // Timeline feed (last 30 days merged events)
  type TimelineEvent = { date: string; kind: string; color: string; text: string };
  const timeline = useMemo(() => {
    const ev: TimelineEvent[] = [];
    for (const s of health.sleep.slice(-60)) ev.push({date:s.date,kind:"sleep",color:"#a78bfa",text:`Slept ${s.durationHours.toFixed(1)}h · quality ${s.quality}/10`});
    for (const v of health.vitals.slice(-60)) ev.push({date:v.date,kind:"vitals",color:"#ef4444",text:
      [v.restingHr&&`HR ${v.restingHr}`,v.systolic&&`BP ${v.systolic}/${v.diastolic}`,v.tempC&&`${v.tempC}°C`,v.spo2&&`SpO₂ ${v.spo2}%`].filter(Boolean).join(" · ")
      || (v.note||"vitals logged")});
    for (const m of health.measurements.slice(-30)) ev.push({date:m.date,kind:"measure",color:"#f472b6",text:
      [m.weightKg&&`${m.weightKg}kg`,m.navyBfPct&&`BF ${m.navyBfPct.toFixed(1)}%`,m.waistCm&&`waist ${m.waistCm}cm`].filter(Boolean).join(" · ") ||"measured"});
    for (const m of health.mind.slice(-60)) ev.push({date:m.date,kind:"mind",color:"#10b981",text:`Mood ${m.mood}/10 · stress ${m.stress}/10`});
    for (const s of health.symptoms.slice(-60)) ev.push({date:s.date,kind:"symptom",color:"#f59e0b",text:`Symptom: ${s.symptom} (${s.severity}/5)`});
    for (const i of health.injuries.filter(i=>i.ongoing).slice(-10)) ev.push({date:i.date,kind:"injury",color:"#dc2626",text:`Injury: ${i.bodyPart} (${i.severity}/5)`});
    // PRs from workout
    for (const pr of workout.prs.slice(-20)) ev.push({date:pr.date,kind:"pr",color:"#fbbf24",text:`PR logged`});
    ev.sort((a,b)=>b.date.localeCompare(a.date));
    return ev.slice(0, 40);
  }, [health, workout.prs]);

  // Export handlers
  const doCSV = () => {
    const csv = exportHealthCSV(summaries);
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kaizen-health-${today}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const doJSON = () => {
    const blob = new Blob([JSON.stringify(health, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kaizen-health-full-${today}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  // 90-day heatmap (13 weeks × 7 cols)
  const heatmapData = useMemo(() => {
    const map = new Map(summaries.map(s => [s.date, s.completed]));
    const cells: {date:string,score:number}[] = [];
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate()-90);
    // align to Monday
    const startDay = start.getDay();
    const adjStart = new Date(start); adjStart.setDate(adjStart.getDate() - ((startDay+6)%7));
    for (let i=0;i<98;i++){
      const d = new Date(adjStart); d.setDate(adjStart.getDate()+i);
      const k = d.toISOString().slice(0,10);
      cells.push({date:k, score: map.get(k) ?? -1});
    }
    return cells;
  }, [summaries]);

  const completionColor = (score: number) => {
    if (score < 0) return "#0f172a"; // empty
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#84cc16";
    if (score >= 40) return "#f59e0b";
    if (score >= 20) return "#f97316";
    return "#ef4444";
  };

  const [tab, setTab] = useState<"overview"|"streaks"|"timeline"|"bridge">("overview");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {/* Header */}
      <div className="hlth-card">
        <div className="hlth-card-h">§09 // REPORTS · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14}}>
          <div>
            <h2 style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:24,letterSpacing:"0.05em",margin:"4px 0 4px",color:"#22d3ee"}}>Reports &amp; exports</h2>
            <div className="hlth-subtle" style={{fontSize:11,letterSpacing:"0.1em"}}>
              90-day trends, weekly/monthly aggregates, habit streaks, Workout bridge analytics
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="hlth-btn" onClick={doCSV} style={{padding:"8px 14px",fontSize:11,display:"inline-flex",alignItems:"center",gap:6}}><FileDown size={12}/> EXPORT CSV</button>
            <button className="hlth-btn hlth-btn-ghost" onClick={doJSON} style={{padding:"8px 14px",fontSize:11,display:"inline-flex",alignItems:"center",gap:6}}><FileDown size={12}/> FULL JSON</button>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{display:"flex",gap:4,marginTop:14,borderBottom:"1px solid var(--hlth-border-soft)",flexWrap:"wrap"}}>
          {(["overview","streaks","timeline","bridge"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"8px 14px",fontFamily:"var(--hlth-font-mono)",fontSize:10,letterSpacing:"0.15em",cursor:"pointer",
              background:"transparent",border:"none",borderBottom:`2px solid ${tab===t?"#22d3ee":"transparent"}`,
              color: tab===t?"#22d3ee":"var(--hlth-muted)",textTransform:"uppercase",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <>
          {/* 90d heatmap */}
          <div className="hlth-card">
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <Calendar size={13}/>
              <span className="hlth-card-h" style={{margin:0}}>90-DAY COMPLETION HEATMAP</span>
            </div>
            <div className="hlth-subtle" style={{fontSize:10,letterSpacing:"0.1em",marginBottom:8}}>
              Daily completion score (sleep + macros + hydration + supps + mind + workout + gratitude). Darker = better day.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(14, 1fr)",gap:3}}>
              {heatmapData.map((c,i)=>(
                <div key={c.date+i} title={`${c.date}: ${c.score<0?"no data":c.score+"/100"}`} style={{
                  aspectRatio:"1",borderRadius:2,background:completionColor(c.score),
                  outline: c.date===today?"1px solid #22d3ee":undefined,
                }}/>
              ))}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8,fontFamily:"var(--hlth-font-mono)",fontSize:9,color:"var(--hlth-muted)",letterSpacing:"0.1em"}}>
              <span>less</span>
              {[20,40,60,80].map(s=>(<span key={s} style={{width:10,height:10,borderRadius:2,background:completionColor(s)}}/>))}
              <span>more</span>
              <span style={{width:10,height:10,borderRadius:2,background:"#0f172a",border:"1px solid var(--hlth-border-soft)"}}/>
              <span>no data</span>
            </div>
          </div>

          {/* Weekly + Monthly */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))",gap:12}}>
            <AggCard title="LAST 7 DAYS" sub="weekly roll-up" data={week} kcalTarget={tdeeFn(bw, health.profile)} protTarget={proteinTargetG(bw)}/>
            <AggCard title="LAST 28 DAYS" sub="monthly roll-up" data={month} kcalTarget={tdeeFn(bw, health.profile)} protTarget={proteinTargetG(bw)}/>
          </div>

          {/* Streak tiles quick view */}
          <div className="hlth-card">
            <div className="hlth-card-h" style={{display:"flex",alignItems:"center",gap:6}}><Sparkles size={12}/> HABIT STREAKS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginTop:8}}>
              <StreakTile icon={<Flame size={14}/>} label="All-rounder days" value={streaks.perfect.current} longest={streaks.perfect.longest} color="#f59e0b" predicate="≥85% completion"/>
              <StreakTile icon={<Droplet size={14}/>} label="Hydration ≥80%" value={streaks.hydration.current} longest={streaks.hydration.longest} color="#06b6d4"/>
              <StreakTile icon={<Moon size={14}/>} label="Sleep ≥7h" value={streaks.sleep.current} longest={streaks.sleep.longest} color="#a78bfa"/>
              <StreakTile icon={<Activity size={14}/>} label="Protein ≥90% target" value={streaks.protein.current} longest={streaks.protein.longest} color="#ec4899"/>
              <StreakTile icon={<Dumbbell size={14}/>} label="Workouts" value={streaks.workouts.current} longest={streaks.workouts.longest} color="#f472b6"/>
              <StreakTile icon={<Brain size={14}/>} label="Meditation" value={streaks.meditation.current} longest={streaks.meditation.longest} color="#22d3ee"/>
              <StreakTile icon={<Pill size={14}/>} label="Meals logged" value={streaks.meals.current} longest={streaks.meals.longest} color="#10b981"/>
            </div>
          </div>
        </>
      )}

      {tab === "streaks" && (
        <div className="hlth-card">
          <div className="hlth-card-h">Habit streak detail</div>
          <div className="hlth-subtle" style={{fontSize:11,marginBottom:10}}>
            Consecutive days ending today where the condition was met. Longest is all-time since install.
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
            <thead>
              <tr style={{color:"var(--hlth-muted)",textAlign:"left",letterSpacing:"0.1em"}}>
                <th style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)"}}>habit</th>
                <th style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)"}}>current</th>
                <th style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)"}}>longest</th>
                <th style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)"}}>condition</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["All-rounder days", streaks.perfect, "#f59e0b", "completion ≥ 85%"],
                ["Hydration ≥ 80%", streaks.hydration, "#06b6d4", "water ≥ 80% of goal"],
                ["Sleep ≥ 7h", streaks.sleep, "#a78bfa", "≥ 7h logged"],
                ["Protein ≥ 90%", streaks.protein, "#ec4899", "≥ 90% of protein target"],
                ["Workouts", streaks.workouts, "#f472b6", "≥ 1 session ended"],
                ["Meditation", streaks.meditation, "#22d3ee", "≥ 1 min meditation"],
                ["Meals logged", streaks.meals, "#10b981", "≥ 70% of TDEE logged"],
              ].map(([label,s,color,cond]:any) => (
                <tr key={label}>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)"}}>{label}</td>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)",color,fontWeight:700}}>{s.current}d</td>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)",color:"var(--hlth-muted)"}}>{s.longest}d</td>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid var(--hlth-border-soft)",color:"var(--hlth-muted)"}}>{cond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "timeline" && (
        <div className="hlth-card">
          <div className="hlth-card-h">TIMELINE · last 40 events</div>
          <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:8}}>
            {timeline.length === 0 && <div className="hlth-subtle" style={{fontSize:11}}>No events yet. Log sleep, meals, vitals to populate.</div>}
            {timeline.map((e,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:6,background:"var(--hlth-card2)",border:"1px solid var(--hlth-border-soft)",fontSize:11,fontFamily:"var(--hlth-font-mono)"}}>
                <span style={{width:3,height:24,background:e.color,borderRadius:2,flexShrink:0}}/>
                <span style={{color:"var(--hlth-muted)",minWidth:80}}>{fmtDate(e.date)} {dayOfWeek(e.date)}</span>
                <span style={{textTransform:"uppercase",fontSize:9,color:e.color,letterSpacing:"0.1em",minWidth:60}}>{e.kind}</span>
                <span style={{color:"var(--hlth-fg)"}}>{e.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "bridge" && (
        <>
          {/* Pre-workout advisory */}
          <div className="hlth-card" style={{borderColor:`${preWO.color}55`,background:`${preWO.color}0d`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <Dumbbell size={14} color={preWO.color}/>
              <span style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,letterSpacing:"0.08em",fontSize:14,color:preWO.color}}>PRE-WORKOUT: {preWO.title}</span>
              <span style={{marginLeft:"auto",fontFamily:"var(--hlth-font-mono)",fontSize:10,color:"var(--hlth-muted)"}}>
                suggested intensity ×{preWO.suggestedIntensity.toFixed(2)}
              </span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:3,fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
              {preWO.messages.map((m,i) => <div key={i} style={{color:preWO.color}}>● {m}</div>)}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px,1fr))",gap:12}}>
            <InfoCard title="TDEE reverse-engineering" color="#f59e0b"
              body={tdeeRev
                ? `From ${tdeeRev.days} days of weight + food logs: estimated TDEE ≈ ${tdeeRev.estTdee} kcal (avg intake ${tdeeRev.avgKcal}, Δ ${tdeeRev.deltaKg} kg).`
                : "Log ≥10 days of meals with concurrent bodyweight entries to reverse-engineer your actual TDEE (Wishnofsky 7700 kcal/kg)."}
            />
            <InfoCard title="Training status" color={tStatus.color} body={tStatus.label}
              sub={`Recent vs prior volume ratio; recovery ${Math.round(lastRec*100)}/100, RHR Δ ${rhrDelta>=0?"+":""}${Math.round(rhrDelta)} bpm`}/>
            <InfoCard title="Sleep recovery" color="#a78bfa"
              body={sleepProj.extraHoursNeeded>0
                ? `${sleepProj.extraHoursNeeded}h debt → ~${sleepProj.nightsAtIdeal} nights of ${health.profile.idealSleepHours}+h to clear.`
                : "Sleep bank ≥ 0 — recovery on track."}
              sub="14-day rolling model"/>
            <InfoCard title="Burnout / overtraining" color={burnout.color}
              body={`${burnout.level.toUpperCase()} (score ${burnout.score}/10)`}
              sub={burnout.signals[0] ?? "Looking solid."}/>
            <InfoCard title="Active injuries" color={injuries.length>0?"#ef4444":"#10b981"}
              body={injuries.length>0 ? injuries.map(i=>`${i.bodyPart} (${i.severity}/5)`).join(" · ") : "None logged."}/>
            <InfoCard title="Today's hydration" color="#06b6d4" body={`${waterPct}% of goal`} sub={`${todayWater} ml today`}/>
          </div>

          <div className="hlth-card">
            <div className="hlth-card-h">Bridge contract (Health → Workout)</div>
            <div className="hlth-subtle" style={{fontSize:11,marginTop:4}}>
              Health READS bodyweight/sessions/cardio/PRs/readiness from Workout. Health ADVISES Workout via these signals (surfaced here first;
              auto-insertion into Workout active-session UI ships in v1.1):
            </div>
            <ul style={{fontSize:11,fontFamily:"var(--hlth-font-mono)",color:"var(--hlth-fg)",paddingLeft:18,marginTop:8,lineHeight:1.8}}>
              <li><b style={{color:preWO.color}}>Pre-workout status:</b> {preWO.title} — ×{preWO.suggestedIntensity.toFixed(2)} intensity cap.</li>
              <li><b style={{color:burnout.color}}>Deload hint:</b> {burnout.level==="overtraining"?"PUSHING → deload week recommended":burnout.level==="warn"?"Reduce load this week":"No deload needed."}</li>
              <li><b style={{color:"#a78bfa"}}>Sleep bank:</b> {bank>=0?`+${bank.toFixed(1)}h`:`${bank.toFixed(1)}h debt`}. {sleepProj.extraHoursNeeded>0?`Clear in ${sleepProj.nightsAtIdeal} nights.`:""}</li>
              <li><b style={{color:"#ef4444"}}>Injury restrictions:</b> {injuries.length>0 ? injuries.map(i=>`${i.bodyPart} (${i.severity}/5)`).join(" · ") : "None."}</li>
              <li><b style={{color:"#f59e0b"}}>TDEE target:</b> {Math.round(tdeeFn(bw, health.profile))} kcal (Mifflin×activity){tdeeRev?` · measured ≈${tdeeRev.estTdee}`:""}.</li>
              <li><b style={{color:"#22d3ee"}}>Recovery score:</b> {Math.round(lastRec*100)}/100 (sleep 50% + bank 30% + hydration 20%).</li>
              <li><b style={{color:"#06b6d4"}}>Hydration:</b> {waterPct}% of daily goal.</li>
            </ul>
          </div>
        </>
      )}

      <div className="hlth-card">
        <div className="hlth-card-h">// medical disclaimer</div>
        <p className="hlth-subtle" style={{fontSize:12,margin:0}}>Educational tool. Not medical advice. Consult qualified healthcare professionals for medical concerns. Reverse-TDEE uses the Wishnofsky 7700 kcal/kg approximation which has ±20% individual error.</p>
      </div>
    </div>
  );
}

function AggCard({ title, sub, data, kcalTarget, protTarget }: { title:string; sub:string; data:any; kcalTarget:number; protTarget:number }) {
  if (!data) return <div className="hlth-card"><div className="hlth-card-h">{title}</div><div className="hlth-subtle">No data yet.</div></div>;
  const colorFor = (v:number, target:number) => v>=target*0.9?"#10b981":v>=target*0.7?"#f59e0b":"#ef4444";
  const sleepColor = data.sleep>=7.5?"#10b981":data.sleep>=6.5?"#f59e0b":"#ef4444";
  return (
    <div className="hlth-card">
      <div className="hlth-card-h">{title}</div>
      <div className="hlth-subtle" style={{fontSize:10,letterSpacing:"0.1em",marginBottom:10}}>{sub}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontFamily:"var(--hlth-font-mono)",fontSize:11}}>
        <Metric label="sleep avg" value={data.sleep.toFixed(1)} unit="h" color={sleepColor}/>
        <Metric label="completion" value={Math.round(data.completion)} unit="%" color={data.completion>=70?"#10b981":data.completion>=50?"#f59e0b":"#ef4444"}/>
        <Metric label="kcal avg" value={Math.round(data.kcal).toLocaleString()} unit="" color={colorFor(data.kcal,kcalTarget)}/>
        <Metric label="protein avg" value={Math.round(data.protein)} unit="g" color={colorFor(data.protein,protTarget)}/>
        <Metric label="hydration" value={Math.round(data.water)} unit="%" color={data.water>=80?"#10b981":data.water>=60?"#f59e0b":"#ef4444"}/>
        <Metric label="workout days" value={data.woDays} unit="" color="#f472b6"/>
        <Metric label="volume" value={`${Math.round(data.vol/1000)}k`} unit="kg" color="#f59e0b"/>
        <Metric label="duration" value={Math.round(data.mins)} unit="min" color="#06b6d4"/>
        {data.moodAvg!=null && data.moodAvg>0 && <Metric label="mood avg" value={data.moodAvg.toFixed(1)} unit="/10" color={data.moodAvg>=7?"#10b981":data.moodAvg>=5?"#f59e0b":"#ef4444"}/>}
        {data.stressAvg!=null && data.stressAvg>0 && <Metric label="stress avg" value={data.stressAvg.toFixed(1)} unit="/10" color={data.stressAvg<=4?"#10b981":data.stressAvg<=6?"#f59e0b":"#ef4444"}/>}
        {data.medDays!=null && <Metric label="meditation days" value={data.medDays} unit="/7" color="#22d3ee"/>}
        {data.streak && <Metric label="streak" value={data.streak.current} unit="d" color="#fbbf24"/>}
      </div>
    </div>
  );
}
function Metric({label,value,unit,color}:{label:string;value:any;unit:string;color:string}) {
  return (
    <div style={{padding:"6px 8px",background:"var(--hlth-card2)",borderRadius:4,border:`1px solid ${color}33`}}>
      <div style={{fontSize:9,letterSpacing:"0.1em",color:"var(--hlth-muted)",marginBottom:2}}>{label}</div>
      <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:15,color}}>{value}<span style={{fontSize:10,color:"var(--hlth-muted)",marginLeft:2,fontFamily:"var(--hlth-font-mono)"}}>{unit}</span></div>
    </div>
  );
}
function StreakTile({icon,label,value,longest,color,predicate}:{icon:React.ReactNode;label:string;value:number;longest:number;color:string;predicate?:string}) {
  return (
    <div style={{padding:"10px",borderRadius:8,background:"var(--hlth-card2)",border:`1px solid ${color}44`,textAlign:"center",position:"relative"}}>
      <div style={{position:"absolute",top:6,right:8,color,opacity:0.7}}>{icon}</div>
      <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:24,color}}>{value}<span style={{fontSize:12,fontFamily:"var(--hlth-font-mono)",color:"var(--hlth-muted)",marginLeft:2}}>d</span></div>
      <div style={{fontSize:10,letterSpacing:"0.08em",color:"var(--hlth-muted)",marginTop:2,fontFamily:"var(--hlth-font-mono)"}}>{label}</div>
      <div style={{fontSize:9,color:"var(--hlth-muted)",marginTop:2,fontFamily:"var(--hlth-font-mono)"}}>best {longest}d</div>
    </div>
  );
}
function InfoCard({title,color,body,sub}:{title:string;color:string;body:string;sub?:string}) {
  return (
    <div className="hlth-card" style={{borderColor:`${color}44`}}>
      <div style={{fontFamily:"var(--hlth-font-mono)",fontSize:10,letterSpacing:"0.15em",color:"var(--hlth-muted)",marginBottom:6}}>{title}</div>
      <div style={{fontFamily:"var(--hlth-font-display)",fontWeight:900,fontSize:16,color,lineHeight:1.2}}>{body}</div>
      {sub && <div className="hlth-subtle" style={{fontSize:10,marginTop:4}}>{sub}</div>}
    </div>
  );
}
