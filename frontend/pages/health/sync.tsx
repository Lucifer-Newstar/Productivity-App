/**
 * /health/sync — Lab (profile + workout bridge settings).
 *
 * Wave 1 ships a working profile editor (age, height, weight-ref note,
 * activity level, goal, climate multiplier, ideal sleep, IF window).
 * Bodyweight is READ-ONLY from Workout per the bridge contract; this page
 * notes that and links to /workout/tools for logging.
 */
import { useCallback } from "react";
import HealthPage from "../../components/health/HealthPage";
import { useStore } from "../../lib/store";
import type { ActivityLevel, Gender, HealthGoal } from "../../lib/healthTypes";

const ACTIVITY_OPTS: { id: ActivityLevel; label: string }[] = [
  { id: "sedentary",   label: "Sedentary (desk, no exercise)" },
  { id: "light",       label: "Light (1-3/wk)" },
  { id: "moderate",    label: "Moderate (3-5/wk trained)" },
  { id: "active",      label: "Active (6-7/wk hard)" },
  { id: "very_active", label: "Very active (2x/day)" },
];
const GOAL_OPTS: { id: HealthGoal; label: string }[] = [
  { id: "maintain", label: "Maintain" },
  { id: "bulk",     label: "Bulk (lean gain)" },
  { id: "cut",      label: "Cut (fat loss)" },
  { id: "recomp",   label: "Recomp" },
];

export default function LabPage() {
  const { health, updateHealth, workout } = useStore();
  const p = health.profile;
  const s = health.settings;

  const latestBw = [...workout.bodyweight].sort((a, b) => b.date.localeCompare(a.date))[0];
  const weightKg = latestBw?.weightKg ?? null;

  const set = useCallback((patch: Partial<typeof p>) => {
    updateHealth(h => ({ profile: { ...h.profile, ...patch } }));
  }, [updateHealth]);

  const setSetting = useCallback((patch: Partial<typeof s>) => {
    updateHealth(h => ({ settings: { ...h.settings, ...patch } }));
  }, [updateHealth]);

  return (
    <HealthPage section="lab">
      <div className="hlth-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        {/* -------- Profile card -------- */}
        <div className="hlth-card">
          <div className="hlth-card-h">§08 // PROFILE</div>
          <h2 style={h2}>Your constants</h2>

          <Grid>
            <Field label="Gender">
              <select value={p.gender} onChange={e => set({ gender: e.target.value as Gender })} style={selectCss}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Age (years)">
              <input type="number" min={10} max={100} value={p.ageYears}
                onChange={e => set({ ageYears: +e.target.value || 0 })} style={inputCss}/>
            </Field>
            <Field label="Height (cm)">
              <input type="number" min={100} max={230} step={0.5} value={p.heightCm}
                onChange={e => set({ heightCm: +e.target.value || 0 })} style={inputCss}/>
            </Field>
            <Field label="Weight (kg)">
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <span style={monoVal}>{weightKg ?? "—"}</span>
                <span className="hlth-subtle" style={{fontSize:11}}>
                  {weightKg ? "synced from Workout" : "log in Workout → Tools to set"}
                </span>
              </div>
            </Field>
            <Field label="Activity level">
              <select value={p.activityLevel} onChange={e => set({ activityLevel: e.target.value as ActivityLevel })} style={selectCss}>
                {ACTIVITY_OPTS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Goal">
              <select value={p.goal} onChange={e => set({ goal: e.target.value as HealthGoal })} style={selectCss}>
                {GOAL_OPTS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="City (climate)">
              <input type="text" value={p.city} onChange={e => set({ city: e.target.value })} style={inputCss}/>
            </Field>
            <Field label={`Climate multiplier (${p.climateMult.toFixed(2)}×)`}>
              <input type="range" min={0.9} max={1.25} step={0.025} value={p.climateMult}
                onChange={e => set({ climateMult: +e.target.value })} style={sliderCss}/>
            </Field>
          </Grid>
        </div>

        {/* -------- Sleep & IF -------- */}
        <div className="hlth-card">
          <div className="hlth-card-h">§08 // DAILY CONSTANTS</div>
          <h2 style={h2}>Sleep &amp; fasting</h2>
          <Grid>
            <Field label={`Ideal sleep (${p.idealSleepHours} h)`}>
              <input type="range" min={5} max={10} step={0.5} value={p.idealSleepHours}
                onChange={e => set({ idealSleepHours: +e.target.value })} style={sliderCss}/>
            </Field>
            <Field label="Eating window start (24h)">
              <input type="number" min={0} max={22} step={1} value={p.eatingWindowStart}
                onChange={e => set({ eatingWindowStart: +e.target.value })} style={inputCss}/>
            </Field>
            <Field label="Eating window end (24h)">
              <input type="number" min={2} max={24} step={1} value={p.eatingWindowEnd}
                onChange={e => set({ eatingWindowEnd: Math.max(+e.target.value, p.eatingWindowStart + 2) })} style={inputCss}/>
            </Field>
            <Field label="Fasting length">
              <span style={monoVal}>{24 - (p.eatingWindowEnd - p.eatingWindowStart)} h fast · {(p.eatingWindowEnd - p.eatingWindowStart)} h feed</span>
            </Field>
            <Field label="Units">
              <select value={p.units} onChange={e => set({ units: e.target.value as "metric"|"imperial" })} style={selectCss}>
                <option value="metric">Metric (kg/cm)</option>
                <option value="imperial">Imperial (lb/in)</option>
              </select>
            </Field>
            <Field label="Target weight (kg, optional)">
              <input type="number" min={30} max={200} step={0.1}
                value={p.targetWeightKg ?? ""} placeholder="—"
                onChange={e => set({ targetWeightKg: e.target.value === "" ? null : +e.target.value })} style={inputCss}/>
            </Field>
          </Grid>
        </div>

        {/* -------- Bridge toggles -------- */}
        <div className="hlth-card">
          <div className="hlth-card-h">§08 // WORKOUT BRIDGE</div>
          <h2 style={h2}>Sync toggles</h2>
          <p className="hlth-subtle" style={{fontSize:12, marginTop:0}}>
            Health reads bodyweight/sessions/PRs from Workout as source of truth
            and pushes advisory flags (hydration, sleep debt, injury, deload).
          </p>
          <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:10, fontFamily:"var(--hlth-font-mono)", fontSize:12}}>
            <Toggle label="Read bodyweight from Workout"  value={s.syncReadBodyweight} onChange={v => setSetting({syncReadBodyweight: v})} />
            <Toggle label="Read sessions for TDEE/hydration" value={s.syncReadSessions}   onChange={v => setSetting({syncReadSessions: v})} />
            <Toggle label="Read cardio logs"             value={s.syncReadCardio}     onChange={v => setSetting({syncReadCardio: v})} />
            <Toggle label="Read PRs for S:W ratios"      value={s.syncReadPRs}        onChange={v => setSetting({syncReadPRs: v})} />
            <Toggle label="Read readiness sliders"       value={s.syncReadReadiness}  onChange={v => setSetting({syncReadReadiness: v})} />
            <Toggle label="Push hydration warnings"      value={s.syncPushHydration}  onChange={v => setSetting({syncPushHydration: v})} />
            <Toggle label="Push sleep-debt warnings"     value={s.syncPushSleep}      onChange={v => setSetting({syncPushSleep: v})} />
            <Toggle label="Push injury restrictions"     value={s.syncPushInjuries}   onChange={v => setSetting({syncPushInjuries: v})} />
            <Toggle label="Push recovery score"          value={s.syncPushRecovery}   onChange={v => setSetting({syncPushRecovery: v})} />
            <Toggle label="Push deload suggestion"       value={s.syncPushDeload}     onChange={v => setSetting({syncPushDeload: v})} />
          </div>
        </div>

        {/* -------- Prefs -------- */}
        <div className="hlth-card">
          <div className="hlth-card-h">§08 // PREFERENCES</div>
          <h2 style={h2}>Behaviour</h2>
          <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:10, fontFamily:"var(--hlth-font-mono)", fontSize:12}}>
            <Toggle label="Gentle in-app nudges" value={s.nudges} onChange={v => setSetting({nudges: v})} />
            <Toggle label="Monitor blip sounds" value={s.soundEnabled} onChange={v => setSetting({soundEnabled: v})} />
            <Toggle label="Alcohol tracker (opt-in)" value={s.alcoholOptIn} onChange={v => setSetting({alcoholOptIn: v})} />
          </div>
        </div>

        <div className="hlth-card" style={{gridColumn: "1 / -1"}}>
          <div className="hlth-card-h">// Note on the bridge</div>
          <p className="hlth-subtle" style={{fontSize:12, margin:0}}>
            Bodyweight is owned by the Workout space (log it from /workout/tools
            or after sessions). Health consumes it for BMR/TDEE/BFI calculations
            but does not duplicate entries — one source of truth. This matches
            the contract in <code style={{color:"var(--hlth-accent-glow)"}}>docs/ALGORITHMS.md</code>.
          </p>
        </div>
      </div>
    </HealthPage>
  );
}

const h2: React.CSSProperties = {
  fontFamily: "var(--hlth-font-display)", fontWeight: 900, fontSize: 20,
  letterSpacing: "0.05em", margin: "4px 0 12px", color: "var(--hlth-accent-glow)",
};
const inputCss: React.CSSProperties = {
  width: "100%", background: "var(--hlth-card2)", color: "var(--hlth-fg)",
  border: "1px solid var(--hlth-border-soft)", borderRadius: 6, padding: "8px 10px",
  fontFamily: "var(--hlth-font-mono)", fontSize: 12,
};
const selectCss: React.CSSProperties = { ...inputCss };
const sliderCss: React.CSSProperties = { width: "100%", accentColor: "#10b981" };
const monoVal: React.CSSProperties = { fontFamily: "var(--hlth-font-mono)", fontSize: 14, color: "var(--hlth-accent-glow)", fontWeight: 700 };

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap: 12}}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{display:"flex", flexDirection:"column", gap:4}}>
      <span style={{fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--hlth-muted)", fontFamily:"var(--hlth-font-mono)"}}>{label}</span>
      {children}
    </label>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v:boolean)=>void }) {
  return (
    <label style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, cursor:"pointer", padding:"6px 0", borderBottom:"1px solid var(--hlth-border-soft)"}}>
      <span style={{color:"var(--hlth-fg)"}}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 20, position: "relative",
          background: value ? "var(--hlth-accent)" : "var(--hlth-border-soft)",
          border: "none", cursor: "pointer", transition: "background 0.15s",
          flexShrink: 0,
        }} aria-pressed={value}>
        <span style={{
          position:"absolute", top:2, left: value ? 18 : 2, width:16, height:16,
          background:"#fff", borderRadius:"50%", transition:"left 0.15s",
          boxShadow:"0 1px 3px rgba(0,0,0,0.4)",
        }}/>
      </button>
    </label>
  );
}

// FULLSCREEN — VITAL-SIGN shell paints edge-to-edge (skips shared TopNav, like /workout /projects /career)
LabPage.fullScreen = true;
