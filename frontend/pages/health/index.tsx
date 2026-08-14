/**
 * /health — Triage (daily dashboard).
 *
 * Wave 1 placeholder: shows the shell, a coming-soon hero card, and pulls
 * live BMR/TDEE/water-goal readouts from profile so something real renders.
 * Fuller triage tiles come in later waves.
 */
import HealthPage from "../../components/health/HealthPage";
import { useStore } from "../../lib/store";
import { bmrMifflin, tdee, waterGoalMl, proteinTargetG, bmi, formatMl, formatKcal,
  computeSleepBank, avgSleepHours, formatHours, recoveryScore,
  supplementAdherence, computeDeficiencyBadges } from "../../lib/healthAnalytics";

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
            {today}. Wave 3 online — sleep bank, supplement stack, deficiency badges.
            Recovery score: <b style={{color: recovery>=80?"#10b981":recovery>=60?"#f59e0b":"#ef4444"}}>{recovery}/100</b>.
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

        <div className="hlth-card" style={{ gridColumn: "1 / -1" }}>
          <div className="hlth-card-h">// Section status</div>
          <div className="hlth-grid" style={{ marginTop: 8 }}>
            {[
              ["00", "Triage",     "Dashboard ✓"],
              ["01", "Fuel",       "Wave 2 ✓ meals/macros"],
              ["02", "Hydration",  "Wave 2 ✓ water/caffeine"],
              ["03", "Somnium",    "Wave 3 ✓ sleep bank/rhythm"],
              ["04", "Soma",       "Wave 4 (measurements, BF%)"],
              ["05", "Apothecary", "Wave 3 ✓ supps/badges/sun"],
              ["06", "Vitals",     "Wave 5 (HR, BP, HRV)"],
              ["07", "Mind",       "Wave 5 (mood, stress)"],
              ["08", "Lab",        "Wave 1 ✓ — profile + sync toggles"],
              ["09", "Reports",    "Wave 6"],
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
