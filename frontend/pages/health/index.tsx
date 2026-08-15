/**
 * /health — Triage (daily dashboard).
 *
 * Wave 1 placeholder: shows the shell, a coming-soon hero card, and pulls
 * live BMR/TDEE/water-goal readouts from profile so something real renders.
 * Fuller triage tiles come in later waves.
 */
import HealthPage from "../../components/health/HealthPage";
import GlobalPanel from "../../components/health/GlobalPanel";
import { useStore } from "../../lib/store";
import { bmrMifflin, tdee, waterGoalMl, proteinTargetG, bmi, formatMl, formatKcal,
  computeSleepBank, avgSleepHours, formatHours, recoveryScore,
  supplementAdherence, computeDeficiencyBadges, currentBfPct, lbmKg, detectAsymmetries, latestMeasurement,
  classifyBp, classifyRhr, classifyTemp, classifySpo2, latestVitals, avgRhr, avgMind,
  burnoutHeuristic, activeInjuries } from "../../lib/healthAnalytics";

export default function TriagePage() {
  const { health, workout } = useStore();
  // Read latest bodyweight from Workout (source of truth); fall back to a
  // sensible 20yo-lifter default if none logged yet so the math renders.
  const latestBw = [...workout.bodyweight].sort((a, b) => b.date.localeCompare(a.date))[0];
  const weightKg = latestBw?.weightKg ?? 70;

  const bmr = Math.round(bmrMifflin(weightKg, health.profile.heightCm, health.profile.ageYears, health.profile.gender));
  const tdeeVal = Math.round(tdee(weightKg, health.profile));
  const water = waterGoalMl(weightKg, health.profile.climateMult);
  const protein = proteinTargetG(weightKg);
  const bmiVal = bmi(weightKg, health.profile.heightCm).toFixed(1);

  // Wave 3 KPIs
  const sleepBank = computeSleepBank(health.sleep, health.profile.idealSleepHours);
  const avgSleep = avgSleepHours(health.sleep, 7);
  const todayWaterMl = health.water.filter(w=>w.date===new Date().toISOString().slice(0,10))
    .reduce((s,e)=>s+e.ml,0);
  const waterPct = Math.round((todayWaterMl / Math.max(1, water)) * 100);
  const recovery = Math.round(recoveryScore(health.sleep, health.profile.idealSleepHours, waterPct) * 100);
  const suppAdh = supplementAdherence(health.supplementLog, null, 7);
  const badges = computeDeficiencyBadges({ meals: health.meals, supplementLog: health.supplementLog, sunlight: health.sunlight });
  const deficiencyCount = badges.filter(b => b.level==="deficient" || b.level==="at_risk").length;

  // Wave 4 KPIs
  const bfPct = currentBfPct(health.measurements, health.profile.heightCm);
  const lastM = latestMeasurement(health.measurements);
  const asym = lastM ? detectAsymmetries(lastM) : [];
  const lbm = bfPct > 0 ? Math.round(lbmKg(weightKg, bfPct)*10)/10 : 0;

  // Wave 5 KPIs
  const lastV = latestVitals(health.vitals);
  const rhr7 = avgRhr(health.vitals, 7);
  const mood7 = avgMind(health.mind, "mood", 7);
  const stress7 = avgMind(health.mind, "stress", 7);
  const bpCat = classifyBp(lastV?.systolic, lastV?.diastolic);
  const rhrCat = classifyRhr(lastV?.restingHr);
  const tmpCat = classifyTemp(lastV?.tempC);
  const spoCat = classifySpo2(lastV?.spo2);
  const inj = activeInjuries(health.injuries);
  const ongoingIll = health.illnesses.filter(i => !i.endDate);
  const burnout = burnoutHeuristic({
    sleepEntries: health.sleep, idealHours: health.profile.idealSleepHours,
    vitals: health.vitals, mind: health.mind, injuries: health.injuries,
  });

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <HealthPage section="triage">
      <div className="hlth-grid">
        <div className="hlth-card" style={{ gridColumn: "1 / -1" }}>
          <div className="hlth-card-h">// Vitals OS · Triage</div>
          <h2 style={{
            fontFamily: "var(--hlth-font-display)",
            fontSize: 28, fontWeight: 900, letterSpacing: "0.04em",
            margin: "4px 0 8px", color: "var(--hlth-accent-glow)",
          }}>
            Good day, commander.
          </h2>
          <p className="hlth-subtle" style={{ fontSize: 13, margin: 0 }}>
            {today}. Wave 5 online — HR/BP/temp/SpO₂, symptom & injury log, burnout detection,
            journal & gratitude, Indian crisis helplines.
            Recovery <b style={{color: recovery>=80?"#10b981":recovery>=60?"#f59e0b":"#ef4444"}}>{recovery}/100</b>
            {bfPct > 0 && <> · BF <b style={{color:bfPct>20?"#ef4444":bfPct>12?"#f59e0b":"#10b981"}}>{bfPct.toFixed(1)}%</b></>}
            {mood7>0 && <> · Mood <b style={{color:mood7>=6?"#10b981":mood7>=4?"#f59e0b":"#ef4444"}}>{mood7.toFixed(1)}/10</b></>}
            {burnout.level!=="ok" && <> · <b style={{color:burnout.color}}>{burnout.signals.length>0?"WATCH":burnout.level.toUpperCase()}</b></>}
            {inj.length>0 && <> · <b style={{color:"#ef4444"}}>{inj.length} active injury</b></>}.
            Profile tuned for a 20yo lifter in Chennai; adjust in <strong style={{ color: "var(--hlth-fg)" }}>§08 Lab</strong>.
          </p>
        </div>

        <Kpi label="Weight" value={weightKg.toFixed(1)} unit="kg" hint={`BMI ${bmiVal}`} />
        <Kpi label="BMR" value={bmr.toString()} unit="kcal" hint="Mifflin-St Jeor" />
        <Kpi label="TDEE" value={tdeeVal.toString()} unit="kcal" hint={`activity × ${health.profile.activityLevel}`} />
        <Kpi label="Water goal" value={formatMl(water)} unit="" hint={`climate ×${health.profile.climateMult}`} />
        <Kpi label="Protein target" value={protein.toString()} unit="g" hint="ACSM trained" />
        <Kpi label="Sleep goal" value={health.profile.idealSleepHours.toString()} unit="h" hint="per night" />
        <Kpi label="7d avg sleep" value={avgSleep ? formatHours(avgSleep) : "—"} unit="" hint={sleepBank>=0?`+${sleepBank.toFixed(1)}h bank`:`${Math.abs(sleepBank).toFixed(1)}h debt`}
             color={sleepBank<=-10?"#ef4444":sleepBank<=-5?"#f59e0b":"#a78bfa"}/>
        <Kpi label="Recovery" value={recovery.toString()} unit="/100" hint="sleep + water composite"
             color={recovery>=80?"#10b981":recovery>=60?"#f59e0b":"#ef4444"}/>
        <Kpi label="Supps (7d)" value={`${suppAdh}%`} unit="" hint={`${health.supplementDefs.length} in stack`} color="#22d3ee"/>
        <Kpi label="Deficiency risk" value={deficiencyCount.toString()} unit="" hint={deficiencyCount?`${deficiencyCount} flagged`:"all clear"}
             color={deficiencyCount?"#ef4444":"#10b981"}/>
        {bfPct > 0 && <Kpi label="Body fat" value={bfPct.toFixed(1)} unit="%" hint={`Navy · ${lbm}kg LBM`} color={bfPct>20?"#ef4444":bfPct>12?"#f59e0b":"#10b981"}/>}
        {asym.length>0 && <Kpi label="Asymmetry" value={asym.length.toString()} unit="" hint={asym.map(a=>`${a.site} ${a.diff}cm`).join(", ")} color="#ef4444"/>}
        <Kpi label="RHR" value={lastV?.restingHr ? String(lastV.restingHr) : "—"} unit="bpm"
             hint={lastV ? rhrCat.label : "no reading"} color={rhrCat.color}/>
        {rhr7>0 && <Kpi label="RHR 7d" value={String(rhr7)} unit="bpm" hint="avg" color="#60a5fa"/>}
        <Kpi label="BP" value={lastV?.systolic ? `${lastV.systolic}/${lastV.diastolic}` : "—"} unit=""
             hint={bpCat.label} color={bpCat.color}/>
        {lastV?.spo2 && <Kpi label="SpO₂" value={`${lastV.spo2}`} unit="%" hint={spoCat.label} color={spoCat.color}/>}
        {lastV?.tempC && <Kpi label="Temp" value={lastV.tempC.toFixed(1)} unit="°C" hint={tmpCat.label} color={tmpCat.color}/>}
        {mood7>0 && <Kpi label="Mood 7d" value={mood7.toFixed(1)} unit="/10" hint="avg" color={mood7>=6?"#10b981":mood7>=4?"#f59e0b":"#ef4444"}/>}
        {stress7>0 && <Kpi label="Stress 7d" value={stress7.toFixed(1)} unit="/10" hint="avg" color={stress7<=4?"#10b981":stress7<=6?"#f59e0b":"#ef4444"}/>}
        <Kpi label="Burnout" value={burnout.level.toUpperCase()} unit="" hint={`score ${burnout.score}/10`} color={burnout.color}/>
        {inj.length>0 && <Kpi label="Injuries" value={inj.length.toString()} unit="" hint={inj.map(i=>i.bodyPart).slice(0,2).join(", ")} color="#ef4444"/>}
        {ongoingIll.length>0 && <Kpi label="Illness" value={ongoingIll.length.toString()} unit="" hint={ongoingIll.map(i=>i.label).join(", ")} color="#f59e0b"/>}

        <div className="hlth-card" style={{ gridColumn: "1 / -1" }}>
          <div className="hlth-card-h">// Section status</div>
          <div className="hlth-grid" style={{ marginTop: 8 }}>
            {[
              ["00", "Triage",     "Dashboard ✓"],
              ["01", "Fuel",       "Wave 2 ✓ meals/macros"],
              ["02", "Hydration",  "Wave 2 ✓ water/caffeine"],
              ["03", "Somnium",    "Wave 3 ✓ sleep bank/rhythm"],
              ["04", "Soma",       "Wave 4 ✓ Navy BF, tape, S:W, photos"],
              ["05", "Apothecary", "Wave 3 ✓ supps/badges/sun"],
              ["06", "Vitals",     "Wave 5 ✓ HR/BP/temp/SpO₂/symptoms/injuries/meds/orthostatic"],
              ["07", "Mind",       "Wave 5 ✓ mood/stress/energy/journal/gratitude/burnout/helplines"],
              ["08", "Lab",        "Wave 1 ✓ — profile + sync toggles"],
              ["09", "Reports",    "Wave 6+7 ✓ heatmap/streaks/bridge/CSV+JSON"],
            ].map(([code, label, status]) => (
              <div key={code} className="hlth-card" style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ color: "var(--hlth-muted)", fontFamily: "var(--hlth-font-mono)", fontSize: 10, letterSpacing: "0.2em" }}>§{code}</span>
                  <span style={{ fontFamily: "var(--hlth-font-display)", fontWeight: 900, letterSpacing: "0.08em", fontSize: 14 }}>{label.toUpperCase()}</span>
                </div>
                <div className="hlth-subtle" style={{ marginTop: 4, fontSize: 11 }}>{status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hlth-card" style={{ gridColumn: "1 / -1" }}>
          <div className="hlth-card-h">// Medical disclaimer</div>
          <p className="hlth-subtle" style={{ fontSize: 12, margin: 0 }}>
            Educational tool. Not medical advice. All formulas are approximations
            (Mifflin-St Jeor BMR, Navy BF% when measurements added, ACSM protein
            baselines). Consult qualified healthcare professionals for medical
            concerns.
          </p>
        </div>
      </div>

      {/* Wave 8G — global connections: nudges, check-ins, recovery, goals, comps */}
      <GlobalPanel />
    </HealthPage>
  );
}

function Kpi({ label, value, unit, hint, color }: { label: string; value: string; unit: string; hint?: string; color?: string }) {
  return (
    <div className="hlth-card" style={color ? { borderColor: `${color}55` } : undefined}>
      <div className="hlth-card-h">// {label}</div>
      <div className="hlth-kpi" style={color ? { color } : undefined}>
        {value}<span className="hlth-kpi-unit">{unit}</span>
      </div>
      {hint && <div className="hlth-subtle" style={{ marginTop: 2 }}>{hint}</div>}
    </div>
  );
}
