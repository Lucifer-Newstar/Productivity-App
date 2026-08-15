"use client";

/**
 * SomaIntel — Wave 8E SOMA intelligence.
 *
 *  - Phase auto-detection banner (bulk/cut/maintenance/recomp) w/ manual override
 *  - Muscle-gain / fat-loss estimators (+X kg likely lean / −X kg likely fat)
 *  - Bulk-rate (>0.75kg/wk) & cut-rate (>1kg/wk) warnings, INJURY RISK flag
 *  - Water-weight spike detector (≥1.5kg in ≤1 day)
 *  - Plateau detector (4wk static measurements → routine-change nudge)
 *  - Muscle/Fat/Other body-comp pie (lean / fat / residual)
 *  - Measurement goals per body part + % progress bars
 *  - Measurement frequency planner (weekly/biweekly/monthly) + due reminder
 *    + same-time-of-day consistency note
 *  - Per-body-part progress sparklines (all tracked sites)
 *
 * Strength proxy for the detectors: sum of best e1RM (squat+bench+dead+OHP)
 * from Workout PRs — "now" vs the values 4 weeks ago (PR history dates).
 */

import { useMemo, useState } from "react";
import { Activity, Target, CalendarClock, TrendingUp, AlertTriangle, Droplets, Gauge } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  bodyCompStatus, waterWeightSpike, measurementPlateau, nextMeasureDue, goalProgress,
  currentBfPct, lbmKg, fatMassKg,
  type WeightPoint,
} from "../../lib/healthAnalytics";
import type { MeasurementEntry, MeasurementGoals, MeasureFrequency, PhysiquePhase } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0, 10); }

const inputStyle: React.CSSProperties = {
  background: "var(--hlth-card2)", color: "var(--hlth-fg)",
  border: "1px solid var(--hlth-border-soft)", borderRadius: 4,
  padding: "4px 6px", fontFamily: "var(--hlth-font-mono)", fontSize: 11,
};

const PHASE_META: Record<PhysiquePhase | "unknown", { label: string; color: string; blurb: string }> = {
  bulk:        { label: "BULKING",     color: "#f59e0b", blurb: "Weight trending up. Keep rate ≤0.75 kg/week to stay lean." },
  cut:         { label: "CUTTING",     color: "#22d3ee", blurb: "Weight trending down. Strength holding = fat loss, good." },
  maintenance: { label: "MAINTAINING", color: "#10b981", blurb: "Weight stable. Base-building phase." },
  recomp:      { label: "RECOMP",      color: "#a78bfa", blurb: "Weight stable, waist down, strength up. Best-case body recomposition." },
  unknown:     { label: "NO DATA",     color: "#64748b", blurb: "Log bodyweight (Workout space) + waist for 2+ weeks to unlock detection." },
};

/** Goal fields → which measurement sites they read. */
const GOAL_SITES: { key: keyof MeasurementGoals; label: string; read: (m: MeasurementEntry) => number | undefined; below?: boolean }[] = [
  { key: "chestCm",    label: "Chest",     read: m => m.chestCm },
  { key: "shoulderCm", label: "Shoulders", read: m => m.shoulderCm },
  { key: "armCm",      label: "Arm",       read: m => Math.max(m.armLeftCm ?? 0, m.armRightCm ?? 0) || undefined },
  { key: "forearmCm",  label: "Forearm",   read: m => Math.max(m.forearmLeftCm ?? 0, m.forearmRightCm ?? 0) || undefined },
  { key: "waistCm",    label: "Waist",     read: m => m.waistCm, below: true },
  { key: "thighCm",    label: "Thigh",     read: m => Math.max(m.thighLeftCm ?? 0, m.thighRightCm ?? 0) || undefined },
  { key: "calfCm",     label: "Calf",      read: m => Math.max(m.calfLeftCm ?? 0, m.calfRightCm ?? 0) || undefined },
  { key: "neckCm",     label: "Neck",      read: m => m.neckCm },
];

const SPARK_SITES: { key: keyof MeasurementEntry; label: string; color: string }[] = [
  { key: "chestCm",     label: "Chest",     color: "#f59e0b" },
  { key: "shoulderCm",  label: "Shoulders", color: "#22d3ee" },
  { key: "waistCm",     label: "Waist",     color: "#ef4444" },
  { key: "armRightCm",  label: "Arm R",     color: "#10b981" },
  { key: "armLeftCm",   label: "Arm L",     color: "#34d399" },
  { key: "thighRightCm",label: "Thigh R",   color: "#a78bfa" },
  { key: "thighLeftCm", label: "Thigh L",   color: "#c4b5fd" },
  { key: "calfRightCm", label: "Calf R",    color: "#fb7185" },
];

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>need 2+ logs</span>;
  const W = 120, H = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / span) * (H - 4) - 2}`).join(" ");
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline points={pts} stroke={color} strokeWidth={1.5} fill="none" style={{ filter: `drop-shadow(0 0 3px ${color}66)` }} />
    </svg>
  );
}

function CompPie({ leanKg, fatKg, weightKg }: { leanKg: number; fatKg: number; weightKg: number }) {
  // residual ≈ bone/water bucket = weight − (lean + fat) is 0 by construction with
  // LBM formulas, so present lean split visually: fat vs lean-minus-residual vs residual(8%).
  const residual = Math.round(weightKg * 0.08 * 10) / 10;
  const muscleish = Math.max(0, Math.round((leanKg - residual) * 10) / 10);
  const segs = [
    { label: "Lean (muscle+organ)", val: muscleish, color: "#10b981" },
    { label: "Fat", val: fatKg, color: "#ef4444" },
    { label: "Bone/water residual", val: residual, color: "#64748b" },
  ];
  const total = segs.reduce((n, s) => n + s.val, 0) || 1;
  const R = 40, cx = 48, cy = 48, circ = 2 * Math.PI * R;
  let off = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={12} />
        {segs.map((s, i) => {
          const dash = (s.val / total) * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth={12}
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off}
              transform={`rotate(-90 ${cx} ${cy})`} />
          );
          off += dash;
          return el;
        })}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--hlth-fg)" fontFamily="var(--hlth-font-display)">
          {weightKg.toFixed(0)}kg
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} />
            <span style={{ color: "var(--hlth-fg)", minWidth: 130 }}>{s.label}</span>
            <span style={{ color: s.color, fontWeight: 700 }}>{s.val.toFixed(1)}kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SomaIntel() {
  const { health, updateHealth, workout } = useStore();
  const today = todayIso();

  // ---- inputs for detectors ----
  const weights: WeightPoint[] = useMemo(
    () => workout.bodyweight.map(b => ({ date: b.date, weightKg: b.weightKg })),
    [workout.bodyweight],
  );
  // Baseline (non-pump) measurements only — pump logs would skew trends.
  const baseline = useMemo(() => health.measurements.filter(m => !m.pump), [health.measurements]);
  const waists = useMemo(
    () => baseline.filter(m => m.waistCm != null).map(m => ({ date: m.date, waistCm: m.waistCm! })),
    [baseline],
  );
  // Strength proxy: sum best e1RM of big-4 now vs ≥28d ago (from PR history)
  const { sNow, sPrior } = useMemo(() => {
    const cutoff = new Date(new Date(today).getTime() - 28 * 86_400_000).toISOString().slice(0, 10);
    const KEYS = ["w-squat", "w-bench", "w-dead", "w-ohp"];
    let now = 0, prior = 0;
    for (const k of KEYS) {
      const pr = workout.prs.find(p => p.exerciseId === k);
      if (!pr) continue;
      now += pr.estimated1RM ?? pr.value ?? 0;
      const past = (pr.history ?? []).filter(h => h.date <= cutoff);
      if (past.length) prior += Math.max(...past.map(h => (h as any).estimated1RM ?? h.value ?? 0));
      else prior += pr.estimated1RM ?? pr.value ?? 0; // no history → treat as flat
    }
    return { sNow: now, sPrior: prior };
  }, [workout.prs, today]);

  const comp = useMemo(
    () => bodyCompStatus({ weights, waists, strengthNow: sNow, strengthPrior: sPrior, todayIso: today }),
    [weights, waists, sNow, sPrior, today],
  );
  const spike = useMemo(() => waterWeightSpike(weights), [weights]);
  const plateau = useMemo(() => measurementPlateau(baseline, today), [baseline, today]);

  const lastM = useMemo(
    () => [...baseline].sort((a, b) => b.date.localeCompare(a.date))[0],
    [baseline],
  );
  const due = nextMeasureDue(lastM?.date, health.measureFrequency ?? "biweekly", today);

  const latestBw = weights.length ? [...weights].sort((a, b) => b.date.localeCompare(a.date))[0].weightKg : 70;
  const bf = currentBfPct(health.measurements, health.profile.heightCm);
  const lean = bf > 0 ? lbmKg(latestBw, bf) : 0;
  const fat = bf > 0 ? fatMassKg(latestBw, bf) : 0;

  const effectivePhase: PhysiquePhase | "unknown" = health.phaseOverride ?? comp.phase;
  const meta = PHASE_META[effectivePhase];

  // ---- goals ----
  const goals = health.measurementGoals ?? {};
  const firstM = useMemo(
    () => [...baseline].sort((a, b) => a.date.localeCompare(b.date))[0],
    [baseline],
  );
  const setGoal = (key: keyof MeasurementGoals, v: string) => {
    updateHealth(h => ({ measurementGoals: { ...(h.measurementGoals ?? {}), [key]: v === "" ? undefined : Math.max(0, +v) } }));
  };

  // ---- sparkline data ----
  const sparks = useMemo(() => {
    const sorted = [...baseline].sort((a, b) => a.date.localeCompare(b.date));
    return SPARK_SITES.map(s => ({
      ...s,
      values: sorted.map(m => m[s.key] as number | undefined).filter((v): v is number => v != null),
    })).filter(s => s.values.length > 0);
  }, [baseline]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Phase banner + estimators */}
      <div className="hlth-card" style={{ padding: "14px 16px", borderLeft: `3px solid ${meta.color}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Gauge size={16} style={{ color: meta.color }} />
            <span style={{ fontFamily: "var(--hlth-font-display)", fontWeight: 900, fontSize: 20, letterSpacing: "0.08em", color: meta.color }}>
              {meta.label}
            </span>
            {health.phaseOverride && <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>(manual override)</span>}
            <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>{meta.blurb}</span>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
            OVERRIDE
            <select value={health.phaseOverride ?? ""} onChange={e => updateHealth(() => ({ phaseOverride: (e.target.value || null) as PhysiquePhase | null }))} style={inputStyle}>
              <option value="">auto ({comp.phase})</option>
              <option value="bulk">bulk</option><option value="cut">cut</option>
              <option value="maintenance">maintenance</option><option value="recomp">recomp</option>
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
          <span style={{ color: "var(--hlth-muted)" }}>28d: <b style={{ color: "var(--hlth-fg)" }}>{comp.weightChangeKg >= 0 ? "+" : ""}{comp.weightChangeKg}kg</b> @ {comp.weeklyRateKg >= 0 ? "+" : ""}{comp.weeklyRateKg}kg/wk</span>
          <span style={{ color: "var(--hlth-muted)" }}>waist: <b style={{ color: comp.waistChangeCm <= 0 ? "#10b981" : "#f59e0b" }}>{comp.waistChangeCm >= 0 ? "+" : ""}{comp.waistChangeCm}cm</b></span>
          <span style={{ color: "var(--hlth-muted)" }}>big-4 strength: <b style={{ color: comp.strengthDelta >= 0 ? "#10b981" : "#ef4444" }}>{comp.strengthDelta >= 0 ? "+" : ""}{comp.strengthDelta}kg</b></span>
          {comp.muscleGainKg != null && (
            <span style={{ color: "#10b981", fontWeight: 700 }}><TrendingUp size={10} style={{ display: "inline" }} /> Estimated muscle gain: +{comp.muscleGainKg}kg (weight ↑, waist held, strength held)</span>
          )}
          {comp.fatLossKg != null && (
            <span style={{ color: "#22d3ee", fontWeight: 700 }}>Estimated fat loss: −{comp.fatLossKg}kg (strength preserved — good cut)</span>
          )}
        </div>

        {(comp.warnings.length > 0 || spike.spike || plateau.plateau) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {comp.warnings.map((wmsg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: wmsg.startsWith("INJURY") ? "rgba(220,38,38,0.12)" : "rgba(245,158,11,0.1)", border: `1px solid ${wmsg.startsWith("INJURY") ? "rgba(220,38,38,0.4)" : "rgba(245,158,11,0.3)"}`, color: wmsg.startsWith("INJURY") ? "#f87171" : "#f59e0b", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                <AlertTriangle size={12} /> {wmsg}
              </div>
            ))}
            {spike.spike && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                <Droplets size={12} /> +{spike.deltaKg}kg overnight — likely water retention (glycogen + sodium), not fat gain. Re-weigh in 2-3 days.
              </div>
            )}
            {plateau.plateau && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                <Activity size={12} /> Measurements flat for {plateau.weeks} weeks — consider a routine change: new rep ranges, +1 set per muscle, or a specialization block.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pie + measurement cadence */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h">BODY COMPOSITION SPLIT</div>
          {bf > 0 ? (
            <div style={{ marginTop: 10 }}>
              <CompPie leanKg={lean} fatKg={fat} weightKg={latestBw} />
            </div>
          ) : (
            <div style={{ padding: 14, textAlign: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
              log waist + neck (Navy method) to unlock the pie
            </div>
          )}
        </div>

        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarClock size={12} /> MEASUREMENT CADENCE
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {(["weekly", "biweekly", "monthly"] as MeasureFrequency[]).map(f => (
              <button key={f} className="hlth-btn hlth-btn-ghost" onClick={() => updateHealth(() => ({ measureFrequency: f }))}
                style={{ padding: "5px 10px", fontSize: 10, ...(health.measureFrequency === f ? { borderColor: "var(--hlth-accent)", color: "var(--hlth-accent-glow)", background: "rgba(163,230,53,0.08)" } : {}) }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <span>weekly = cutting · bi-weekly = maintenance · monthly = bulking</span>
            <span style={{ color: due.overdue ? "#ef4444" : "#10b981", fontWeight: 700 }}>
              {due.overdue
                ? `Measurement due${lastM ? ` — last was ${lastM.date}` : " — none logged yet"}. Monday post-workout is a solid anchor.`
                : `Next measurement in ${due.dueInDays} day${due.dueInDays === 1 ? "" : "s"}.`}
            </span>
            <span style={{ opacity: 0.7 }}>consistency: same time of day, morning after bathroom, before food.</span>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="hlth-card" style={{ padding: "14px 16px" }}>
        <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={12} /> MEASUREMENT GOALS · target cm per body part
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginTop: 8 }}>
          {GOAL_SITES.map(g => {
            const target = goals[g.key];
            const current = lastM ? g.read(lastM) : undefined;
            const start = firstM ? g.read(firstM) : undefined;
            const pct = target != null && current != null && start != null ? goalProgress(start, current, target) : null;
            return (
              <div key={g.key} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-fg)", fontWeight: 700 }}>{g.label}{g.below ? " ↓" : " ↑"}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
                    now {current != null ? current.toFixed(1) : "—"} →
                    <input type="number" min={0} step={0.5} value={target ?? ""} placeholder="goal"
                      onChange={e => setGoal(g.key, e.target.value)}
                      style={{ ...inputStyle, width: 56, padding: "2px 4px", fontSize: 10 }} />
                  </span>
                </div>
                {pct != null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(148,163,184,0.15)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#10b981" : "var(--hlth-accent)" }} />
                    </div>
                    <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: pct >= 100 ? "#10b981" : "var(--hlth-muted)", fontWeight: 700 }}>{pct}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-part sparklines */}
      {sparks.length > 0 && (
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h">PER-BODY-PART PROGRESS · all logged measurements</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10, marginTop: 8 }}>
            {sparks.map(s => {
              const delta = s.values.length >= 2 ? Math.round((s.values[s.values.length - 1] - s.values[0]) * 10) / 10 : 0;
              return (
                <div key={String(s.key)} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                    <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
                    <span style={{ color: "var(--hlth-fg)" }}>{s.values[s.values.length - 1].toFixed(1)}cm
                      <span style={{ color: delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "var(--hlth-muted)", marginLeft: 4 }}>
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    </span>
                  </div>
                  <div style={{ marginTop: 4 }}><Spark values={s.values} color={s.color} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
