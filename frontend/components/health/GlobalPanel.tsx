"use client";

/**
 * GlobalPanel — Wave 8G GLOBAL connections (mounted on TRIAGE /health).
 *
 *  - Local nudge alerts ("no food in 5h", "no water in 4h", quiet-hours aware)
 *  - Phase status banner (recomp/cutting/bulking copy on the dashboard)
 *  - Workout check-in: pre (energy+motivation) / post (energy+quality) 1-10 +
 *    soreness area mapping
 *  - Recovery-time estimator from last session + sleep bank + stress
 *  - PR celebration card (S:W ratio improvement %)
 *  - Energy balance (kcal in vs TDEE + workout burn)
 *  - Pre/post-workout meal effectiveness readout
 *  - Health goal dashboard (add/track/complete)
 *  - Competition tracker (meets: date, class, weigh-in, result)
 *  - Habit-break log (no guilt, just reset)
 */

import { useMemo, useState } from "react";
import {
  BellRing, ClipboardCheck, Flag, Medal, RotateCcw, Trash2, Plus, PartyPopper, Scale as ScaleIcon,
} from "lucide-react";
import { useStore } from "../../lib/store";
import {
  bodyCompStatus, recoveryTimeEstimate, prCelebration, energyBalance, mealEffectiveness,
  nudgeAlerts, computeSleepBank, avgMind, tdee, cardioCalorieEstimate,
  type WeightPoint, type PrLike,
} from "../../lib/healthAnalytics";
import type { WorkoutCheckin, SoreArea, HealthGoalItem, CompetitionEntry, HabitBreakEntry } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

const inputStyle: React.CSSProperties = {
  background: "var(--hlth-card2)", color: "var(--hlth-fg)",
  border: "1px solid var(--hlth-border-soft)", borderRadius: 4,
  padding: "4px 6px", fontFamily: "var(--hlth-font-mono)", fontSize: 11,
};

const SORE_AREAS: { id: SoreArea; label: string }[] = [
  { id: "neck", label: "Neck" }, { id: "shoulders", label: "Shoulders" }, { id: "chest", label: "Chest" },
  { id: "upper_back", label: "Upper back" }, { id: "lower_back", label: "Lower back" },
  { id: "biceps", label: "Biceps" }, { id: "triceps", label: "Triceps" }, { id: "forearms", label: "Forearms" },
  { id: "abs", label: "Abs" }, { id: "glutes", label: "Glutes" }, { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hams" }, { id: "calves", label: "Calves" },
];

const PHASE_COPY: Record<string, { color: string; text: string }> = {
  recomp:      { color: "#a78bfa", text: "You're in a recomp phase — weight stable, measurements changing. Rare and valuable, keep the routine." },
  cut:         { color: "#22d3ee", text: "Cutting phase. Strength preserved so far — good job. Protein high, rate ≤1kg/week." },
  bulk:        { color: "#f59e0b", text: "Bulking phase. Watch the weekly rate — muscle is built slowly, fat isn't." },
  maintenance: { color: "#10b981", text: "Maintaining. Base-building — perfect time to push skill work and sleep quality." },
};

function Slider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
      <span style={{ minWidth: 78, letterSpacing: "0.06em" }}>{label}</span>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(+e.target.value)} style={{ flex: 1, accentColor: color }} />
      <b style={{ minWidth: 20, textAlign: "right", color, fontSize: 12 }}>{value}</b>
    </label>
  );
}

export default function GlobalPanel() {
  const { health, updateHealth, workout } = useStore();
  const today = todayIso();
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;

  // ---------- nudges ----------
  const nudges = useMemo(() => health.settings.nudges ? nudgeAlerts({
    meals: health.meals, water: health.water, todayIso: today, nowHours: nowH,
    quietStart: health.settings.reminderQuietStart, quietEnd: health.settings.reminderQuietEnd,
  }) : [], [health.meals, health.water, health.settings, today, nowH]);

  // ---------- phase banner ----------
  const weights: WeightPoint[] = useMemo(() => workout.bodyweight.map(b => ({ date: b.date, weightKg: b.weightKg })), [workout.bodyweight]);
  const waists = useMemo(() => health.measurements.filter(m => !m.pump && m.waistCm != null).map(m => ({ date: m.date, waistCm: m.waistCm! })), [health.measurements]);
  const comp = useMemo(() => bodyCompStatus({ weights, waists, todayIso: today }), [weights, waists, today]);
  const phase = health.phaseOverride ?? comp.phase;
  const phaseCopy = PHASE_COPY[phase];

  // ---------- check-in ----------
  const checkin = useMemo<WorkoutCheckin>(
    () => health.workoutCheckins.find(c => c.date === today) ?? { id: uid(), date: today },
    [health.workoutCheckins, today],
  );
  const patchCheckin = (p: Partial<WorkoutCheckin>) => {
    updateHealth(h => ({
      workoutCheckins: [...h.workoutCheckins.filter(c => c.date !== today), { ...checkin, ...p }],
    }));
  };
  const toggleSore = (a: SoreArea) => {
    const cur = checkin.soreAreas ?? [];
    patchCheckin({ soreAreas: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  };

  // ---------- recovery estimator ----------
  const lastSession = useMemo(
    () => [...workout.sessions].filter(s => s.endedAt).sort((a, b) => b.date.localeCompare(a.date))[0],
    [workout.sessions],
  );
  const sleepBank = computeSleepBank(health.sleep, health.profile.idealSleepHours);
  const stress7 = avgMind(health.mind, "stress", 7);
  const recovery = lastSession ? recoveryTimeEstimate({
    volumeKg: lastSession.totalVolumeKg ?? 0,
    durationMin: (lastSession.durationSeconds ?? 0) / 60,
    sleepBank, stress7: stress7 || 5,
  }) : null;

  // ---------- PR celebration (any PR set in last 7 days) ----------
  const celebration = useMemo(() => {
    const cutoff = new Date(new Date(today).getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
    const LABELS: Record<string, string> = { "w-squat": "Squat", "w-bench": "Bench", "w-dead": "Deadlift", "w-ohp": "OHP" };
    const sw = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    const bwNow = sw.length ? sw[sw.length - 1].weightKg : 0;
    for (const pr of workout.prs as unknown as PrLike[]) {
      if (!LABELS[pr.exerciseId]) continue;
      const recent = (pr.history ?? []).filter(h => h.date >= cutoff);
      if (!recent.length || bwNow <= 0) continue;
      const newBest = Math.max(...recent.map(h => h.value));
      const older = (pr.history ?? []).filter(h => h.date < cutoff);
      if (!older.length) continue;
      const oldBest = Math.max(...older.map(h => h.value));
      const bwOldArr = sw.filter(w => w.date < cutoff);
      const bwOld = bwOldArr.length ? bwOldArr[bwOldArr.length - 1].weightKg : bwNow;
      const c = prCelebration({ liftLabel: LABELS[pr.exerciseId], newE1rm: newBest, oldE1rm: oldBest, bwNow, bwOld });
      if (c) return c;
    }
    return null;
  }, [workout.prs, weights, today]);

  // ---------- energy balance ----------
  const kcalIn = useMemo(() => {
    let k = 0;
    for (const m of health.meals) if (m.date === today) for (const it of m.items) k += it.kcal;
    return Math.round(k);
  }, [health.meals, today]);
  const latestBwKg = weights.length ? [...weights].sort((a, b) => b.date.localeCompare(a.date))[0].weightKg : 70;
  const tdeeKcal = Math.round(tdee(latestBwKg, health.profile));
  const workoutKcal = useMemo(() => {
    const s = workout.sessions.find(x => x.date === today && x.endedAt);
    if (!s) return 0;
    return cardioCalorieEstimate((s.durationSeconds ?? 0) / 60, latestBwKg, 6);
  }, [workout.sessions, today, latestBwKg]);
  const eb = energyBalance({ kcalIn, tdeeKcal, workoutKcal });

  // ---------- meal effectiveness ----------
  const preEff = useMemo(() => mealEffectiveness(health.meals, health.workoutCheckins, "preWorkout"), [health.meals, health.workoutCheckins]);

  // ---------- goals ----------
  const [gTitle, setGTitle] = useState("");
  const [gTarget, setGTarget] = useState("");
  const [gMetric, setGMetric] = useState<HealthGoalItem["metric"]>("weight");
  const addGoal = () => {
    if (!gTitle.trim()) return;
    const g: HealthGoalItem = { id: uid(), title: gTitle.trim(), metric: gMetric, targetValue: gTarget ? +gTarget : undefined, createdAt: Date.now() };
    updateHealth(h => ({ healthGoals: [...h.healthGoals, g] }));
    setGTitle(""); setGTarget("");
  };

  // ---------- competitions ----------
  const [cName, setCName] = useState(""); const [cDate, setCDate] = useState("");
  const addComp = () => {
    if (!cName.trim() || !cDate) return;
    const c: CompetitionEntry = { id: uid(), name: cName.trim(), date: cDate };
    updateHealth(h => ({ competitions: [...h.competitions, c] }));
    setCName(""); setCDate("");
  };

  // ---------- habit breaks ----------
  const [hbHabit, setHbHabit] = useState("");
  const logBreak = () => {
    if (!hbHabit.trim()) return;
    const hb: HabitBreakEntry = { id: uid(), date: today, habit: hbHabit.trim() };
    updateHealth(h => ({ habitBreaks: [...h.habitBreaks, hb] }));
    setHbHabit("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
      {/* Nudges */}
      {nudges.length > 0 && (
        <div className="hlth-card" style={{ padding: "12px 16px", borderLeft: "3px solid #f59e0b" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BellRing size={12} /> GENTLE NUDGES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            {nudges.map((n, i) => (
              <span key={i} style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 11, color: "#f59e0b" }}>· {n}</span>
            ))}
          </div>
        </div>
      )}

      {/* Phase banner + PR celebration */}
      {(phaseCopy || celebration) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {phaseCopy && (
            <div className="hlth-card" style={{ padding: "12px 16px", borderLeft: `3px solid ${phaseCopy.color}` }}>
              <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 11, color: phaseCopy.color }}>
                <b style={{ letterSpacing: "0.1em" }}>{String(phase).toUpperCase()} STATUS</b>
                <span style={{ color: "var(--hlth-fg)", display: "block", marginTop: 4 }}>{phaseCopy.text}</span>
              </div>
            </div>
          )}
          {celebration && (
            <div className="hlth-card" style={{ padding: "12px 16px", borderLeft: "3px solid var(--hlth-accent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--hlth-font-mono)", fontSize: 11, color: "var(--hlth-accent-glow)" }}>
                <PartyPopper size={14} />
                <span><b>PR!</b> {celebration.message}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Check-in + recovery */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ClipboardCheck size={12} /> WORKOUT CHECK-IN · today
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            <Slider label="ENERGY PRE" value={checkin.energyPre ?? 5} onChange={v => patchCheckin({ energyPre: v })} color="#f59e0b" />
            <Slider label="MOTIVATION" value={checkin.motivation ?? 5} onChange={v => patchCheckin({ motivation: v })} color="#22d3ee" />
            <Slider label="ENERGY POST" value={checkin.energyPost ?? 5} onChange={v => patchCheckin({ energyPost: v })} color="#a78bfa" />
            <Slider label="QUALITY" value={checkin.quality ?? 5} onChange={v => patchCheckin({ quality: v })} color="#10b981" />
          </div>
          <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", letterSpacing: "0.1em", margin: "10px 0 6px" }}>SORE AREAS (post-workout)</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {SORE_AREAS.map(a => {
              const on = (checkin.soreAreas ?? []).includes(a.id);
              return (
                <button key={a.id} onClick={() => toggleSore(a.id)}
                  style={{
                    padding: "3px 9px", borderRadius: 999, fontSize: 9, cursor: "pointer",
                    fontFamily: "var(--hlth-font-mono)", letterSpacing: "0.05em",
                    background: on ? "rgba(239,68,68,0.15)" : "var(--hlth-card2)",
                    border: `1px solid ${on ? "#ef4444" : "var(--hlth-border-soft)"}`,
                    color: on ? "#ef4444" : "var(--hlth-muted)",
                  }}>
                  {a.label}
                </button>
              );
            })}
          </div>
          {preEff.n >= 4 && (preEff.withAvg > 0 || preEff.withoutAvg > 0) && (
            <div style={{ marginTop: 10, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
              pre-WO meal days avg quality <b style={{ color: preEff.withAvg >= preEff.withoutAvg ? "#10b981" : "#f59e0b" }}>{preEff.withAvg || "—"}</b> vs <b>{preEff.withoutAvg || "—"}</b> without
            </div>
          )}
        </div>

        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h">RECOVERY + ENERGY BALANCE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, fontFamily: "var(--hlth-font-mono)", fontSize: 11 }}>
            {recovery ? (
              <div style={{ padding: "8px 10px", borderRadius: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)" }}>
                <span style={{ color: "var(--hlth-muted)", fontSize: 9, letterSpacing: "0.1em", display: "block" }}>RECOVERY-TIME ESTIMATE</span>
                <b style={{ color: recovery.hours <= 24 ? "#10b981" : recovery.hours <= 48 ? "#f59e0b" : "#ef4444", fontSize: 16, fontFamily: "var(--hlth-font-display)" }}>{recovery.hours}h</b>
                <span style={{ color: "var(--hlth-fg)", marginLeft: 8 }}>{recovery.label}</span>
                <span style={{ color: "var(--hlth-muted)", fontSize: 9, display: "block", marginTop: 2 }}>
                  last session {Math.round(lastSession!.totalVolumeKg ?? 0)}kg vol · bank {sleepBank.toFixed(1)}h · stress {stress7 ? stress7.toFixed(1) : "—"}
                </span>
              </div>
            ) : (
              <span style={{ color: "var(--hlth-muted)", fontSize: 10 }}>finish a workout session to get a recovery estimate</span>
            )}
            <div style={{ padding: "8px 10px", borderRadius: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)" }}>
              <span style={{ color: "var(--hlth-muted)", fontSize: 9, letterSpacing: "0.1em", display: "block" }}>ENERGY BALANCE TODAY</span>
              <b style={{ color: eb.label === "surplus" ? "#f59e0b" : eb.label === "deficit" ? "#22d3ee" : "#10b981", fontSize: 16, fontFamily: "var(--hlth-font-display)" }}>
                {eb.balance >= 0 ? "+" : ""}{eb.balance} kcal
              </b>
              <span style={{ color: "var(--hlth-fg)", marginLeft: 8 }}>{eb.label}</span>
              <span style={{ color: "var(--hlth-muted)", fontSize: 9, display: "block", marginTop: 2 }}>
                in {kcalIn} − (TDEE {tdeeKcal}{workoutKcal ? ` + workout ${workoutKcal}` : ""})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals + competitions + habit breaks */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {/* Goals */}
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Flag size={12} /> HEALTH GOALS
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <input value={gTitle} onChange={e => setGTitle(e.target.value)} placeholder="e.g. 74kg by Oct" style={{ ...inputStyle, flex: "2 1 120px" }} />
            <select value={gMetric} onChange={e => setGMetric(e.target.value as HealthGoalItem["metric"])} style={inputStyle}>
              <option value="weight">weight</option><option value="bodyfat">bodyfat</option>
              <option value="sleep">sleep</option><option value="water">water</option>
              <option value="protein">protein</option><option value="custom">custom</option>
            </select>
            <input value={gTarget} onChange={e => setGTarget(e.target.value)} placeholder="target #" type="number" style={{ ...inputStyle, width: 70 }} />
            <button className="hlth-btn" onClick={addGoal} style={{ padding: "5px 10px", fontSize: 10 }}><Plus size={10} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {health.healthGoals.length === 0 && <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", textAlign: "center", padding: 8 }}>no goals set</span>}
            {health.healthGoals.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                <input type="checkbox" checked={!!g.done}
                  onChange={() => updateHealth(h => ({ healthGoals: h.healthGoals.map(x => x.id === g.id ? { ...x, done: !x.done } : x) }))}
                  style={{ accentColor: "var(--hlth-accent)" }} />
                <span style={{ flex: 1, color: "var(--hlth-fg)", textDecoration: g.done ? "line-through" : "none", opacity: g.done ? 0.6 : 1 }}>
                  {g.title} {g.targetValue ? `→ ${g.targetValue}` : ""} <span style={{ color: "var(--hlth-muted)" }}>({g.metric})</span>
                </span>
                <button onClick={() => updateHealth(h => ({ healthGoals: h.healthGoals.filter(x => x.id !== g.id) }))}
                  style={{ background: "transparent", border: "none", color: "var(--hlth-muted)", cursor: "pointer", padding: 2 }}><Trash2 size={10} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Competitions */}
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Medal size={12} /> COMPETITIONS
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder="meet / event name" style={{ ...inputStyle, flex: "2 1 120px" }} />
            <input type="date" value={cDate} onChange={e => setCDate(e.target.value)} style={inputStyle} />
            <button className="hlth-btn" onClick={addComp} style={{ padding: "5px 10px", fontSize: 10 }}><Plus size={10} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {health.competitions.length === 0 && <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", textAlign: "center", padding: 8 }}>no competitions tracked</span>}
            {[...health.competitions].sort((a, b) => a.date.localeCompare(b.date)).map(c => {
              const days = Math.ceil((new Date(c.date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86_400_000);
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                  <ScaleIcon size={11} style={{ color: "#a78bfa" }} />
                  <span style={{ flex: 1, color: "var(--hlth-fg)" }}>{c.name} <span style={{ color: "var(--hlth-muted)" }}>· {c.date}</span></span>
                  {days >= 0
                    ? <span style={{ color: days <= 14 ? "#f59e0b" : "var(--hlth-muted)" }}>{days}d out</span>
                    : <input value={c.result ?? ""} placeholder="result?" onChange={e => updateHealth(h => ({ competitions: h.competitions.map(x => x.id === c.id ? { ...x, result: e.target.value } : x) }))} style={{ ...inputStyle, width: 80, padding: "2px 4px", fontSize: 9 }} />}
                  <button onClick={() => updateHealth(h => ({ competitions: h.competitions.filter(x => x.id !== c.id) }))}
                    style={{ background: "transparent", border: "none", color: "var(--hlth-muted)", cursor: "pointer", padding: 2 }}><Trash2 size={10} /></button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit breaks */}
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RotateCcw size={12} /> HABIT-BREAK LOG · no guilt, just reset
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input value={hbHabit} onChange={e => setHbHabit(e.target.value)} placeholder="which habit broke? (e.g. 8 glasses)" style={{ ...inputStyle, flex: 1 }} />
            <button className="hlth-btn hlth-btn-ghost" onClick={logBreak} style={{ padding: "5px 10px", fontSize: 10 }}>LOG + RESET</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, maxHeight: 130, overflow: "auto" }}>
            {health.habitBreaks.length === 0 && <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", textAlign: "center", padding: 8 }}>no breaks logged — streaks intact 💪</span>}
            {[...health.habitBreaks].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(hb => (
              <div key={hb.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                <span style={{ color: "var(--hlth-muted)" }}>{hb.date}</span>
                <span style={{ flex: 1, color: "var(--hlth-fg)" }}>{hb.habit}</span>
                <span style={{ color: "#10b981", fontSize: 9 }}>reset ✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
