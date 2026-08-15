"use client";

/**
 * SomaCorrelation — Wave 8F SOMA × Workout correlation + photo tools.
 *
 *  - PR-at-same-weight tracker ("+20kg DL at same BW — pure strength!")
 *  - Measurement ↔ PR correlation cards ("Bench +10kg · chest +2cm")
 *  - Performance-vs-bodycomp overlay graph (BW line + BF% line + PR dots, 90d SVG)
 *  - Strength-to-size ratios (e1RM per cm of relevant site)
 *  - Work capacity, anabolic index, calisthenics strength index + skill S:W needs
 *  - IPF weight-class visualizer
 *  - Photo tools: 4-week reminder, lighting/time consistency notes,
 *    side-by-side comparison (any two), slideshow mode
 */

import { useEffect, useMemo, useState } from "react";
import { Link2, TrendingUp, Images, Play, Pause, Scale, Zap } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  prAtSameWeight, liftMeasurementCorrelation, strengthToSize, workCapacity,
  anabolicIndex, caliStrengthIndex, caliSkillRequirement, weightClass, photoReminder,
  weightSlopeKgPerWeek, LIFT_SITE_MAP, type WeightPoint, type PrLike,
} from "../../lib/healthAnalytics";

function todayIso() { return new Date().toISOString().slice(0, 10); }

const LIFT_LABEL: Record<string, string> = { "w-squat": "Squat", "w-bench": "Bench", "w-dead": "Deadlift", "w-ohp": "OHP" };

// ---------- overlay graph ----------

function OverlayGraph() {
  const { health, workout } = useStore();
  const today = todayIso();
  const start = new Date(new Date(today).getTime() - 90 * 86_400_000).toISOString().slice(0, 10);
  const W = 640, H = 140;

  const x = (date: string) => {
    const t = (new Date(date).getTime() - new Date(start).getTime()) / (90 * 86_400_000);
    return Math.max(0, Math.min(1, t)) * W;
  };

  const bw = workout.bodyweight.filter(b => b.date >= start).sort((a, b) => a.date.localeCompare(b.date));
  const bf = health.measurements.filter(m => !m.pump && m.navyBfPct != null && m.date >= start).sort((a, b) => a.date.localeCompare(b.date));
  const prDots: { date: string; label: string }[] = [];
  for (const pr of workout.prs) {
    for (const h of pr.history ?? []) {
      if (h.date >= start && LIFT_LABEL[pr.exerciseId]) prDots.push({ date: h.date, label: `${LIFT_LABEL[pr.exerciseId]} ${h.value}kg` });
    }
  }

  if (bw.length < 2 && bf.length < 2 && prDots.length === 0) {
    return <div style={{ padding: 14, textAlign: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
      needs 90d of bodyweight / BF% / PR data — log consistently to unlock
    </div>;
  }

  const yScale = (vals: number[], v: number) => {
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = max - min || 1;
    return H - 14 - ((v - min) / span) * (H - 34);
  };
  const bwVals = bw.map(b => b.weightKg);
  const bfVals = bf.map(m => m.navyBfPct!);
  const bwPts = bw.map(b => `${x(b.date)},${yScale(bwVals, b.weightKg)}`).join(" ");
  const bfPts = bf.map(m => `${x(m.date)},${yScale(bfVals, m.navyBfPct!)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <line x1={0} y1={H - 14} x2={W} y2={H - 14} stroke="var(--hlth-border-soft)" strokeWidth={1} />
      {bw.length >= 2 && <polyline points={bwPts} stroke="#3b82f6" strokeWidth={2} fill="none" style={{ filter: "drop-shadow(0 0 3px #3b82f666)" }} />}
      {bf.length >= 2 && <polyline points={bfPts} stroke="#f472b6" strokeWidth={2} fill="none" strokeDasharray="5 3" />}
      {prDots.map((d, i) => (
        <g key={i}>
          <circle cx={x(d.date)} cy={16} r={4} fill="#a3e635" style={{ filter: "drop-shadow(0 0 4px #a3e63588)" }}>
            <title>{d.date}: {d.label}</title>
          </circle>
        </g>
      ))}
      <text x={4} y={12} fontSize="9" fill="#3b82f6" fontFamily="var(--hlth-font-mono)">— bodyweight</text>
      <text x={90} y={12} fontSize="9" fill="#f472b6" fontFamily="var(--hlth-font-mono)">--- BF%</text>
      <text x={150} y={12} fontSize="9" fill="#a3e635" fontFamily="var(--hlth-font-mono)">● PR set</text>
      <text x={W - 4} y={H - 3} textAnchor="end" fontSize="8" fill="var(--hlth-muted)" fontFamily="var(--hlth-font-mono)">90 days → today</text>
    </svg>
  );
}

// ---------- photo tools ----------

function PhotoTools() {
  const { health } = useStore();
  const today = todayIso();
  const photos = useMemo(() => [...health.photos].sort((a, b) => a.date.localeCompare(b.date)), [health.photos]);
  const rem = photoReminder(photos, today);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [slide, setSlide] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (!slide || photos.length === 0) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % photos.length), 1200);
    return () => clearInterval(t);
  }, [slide, photos.length]);

  const a = photos.find(p => p.id === aId) ?? photos[0];
  const b = photos.find(p => p.id === bId) ?? photos[photos.length - 1];

  return (
    <div className="hlth-card" style={{ padding: "14px 16px" }}>
      <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Images size={12} /> PHOTO TOOLS · compare · slideshow · reminders
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
        <div style={{ padding: "6px 10px", borderRadius: 6, background: rem.due ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.08)", border: `1px solid ${rem.due ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.25)"}`, color: rem.due ? "#f59e0b" : "#10b981" }}>
          {rem.daysSince == null
            ? "No progress photos yet — take your baseline set today (6 angles)."
            : rem.due
              ? `It's been ${rem.daysSince} days since your last photos — time for a new set (4-6 week cadence).`
              : `Last photos ${rem.daysSince} days ago — next set in ~${28 - rem.daysSince} days.`}
        </div>
        <span style={{ color: "var(--hlth-muted)", opacity: 0.8 }}>
          consistency: same lighting (bathroom/tube light), same time (morning pre-food), same 6 angles.
        </span>
      </div>

      {photos.length >= 2 && (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12, fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
            <span style={{ color: "var(--hlth-muted)" }}>COMPARE</span>
            <select value={a?.id ?? ""} onChange={e => setAId(e.target.value)}
              style={{ background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "4px 6px", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
              {photos.map(p => <option key={p.id} value={p.id}>{p.date} · {p.tags[0] ?? "photo"}</option>)}
            </select>
            <span style={{ color: "var(--hlth-muted)" }}>vs</span>
            <select value={b?.id ?? ""} onChange={e => setBId(e.target.value)}
              style={{ background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "4px 6px", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
              {photos.map(p => <option key={p.id} value={p.id}>{p.date} · {p.tags[0] ?? "photo"}</option>)}
            </select>
            <button className="hlth-btn hlth-btn-ghost" onClick={() => { setSlide(s => !s); setSlideIdx(0); }}
              style={{ padding: "4px 10px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {slide ? <Pause size={10} /> : <Play size={10} />} {slide ? "STOP" : "SLIDESHOW"}
            </button>
          </div>

          {!slide && a && b && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, maxWidth: 560 }}>
              {[a, b].map((p, i) => (
                <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--hlth-border-soft)", background: "var(--hlth-card2)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt={p.date} style={{ width: "100%", display: "block", aspectRatio: "3/4", objectFit: "cover" }} />
                  <div style={{ padding: "5px 8px", fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", display: "flex", justifyContent: "space-between" }}>
                    <span>{p.date}</span>
                    <span>{p.weightKg ? `${p.weightKg}kg` : ""}{p.bfPct ? ` · ${p.bfPct.toFixed(1)}%` : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide && photos[slideIdx] && (
            <div style={{ marginTop: 10, maxWidth: 280 }}>
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--hlth-accent)", background: "var(--hlth-card2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[slideIdx].dataUrl} alt={photos[slideIdx].date} style={{ width: "100%", display: "block", aspectRatio: "3/4", objectFit: "cover" }} />
                <div style={{ padding: "5px 8px", fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-accent-glow)", textAlign: "center" }}>
                  {photos[slideIdx].date} · {slideIdx + 1}/{photos.length}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- main ----------

export default function SomaCorrelation() {
  const { health, workout } = useStore();
  const today = todayIso();

  const weights: WeightPoint[] = useMemo(
    () => workout.bodyweight.map(b => ({ date: b.date, weightKg: b.weightKg })),
    [workout.bodyweight],
  );
  const latestBw = weights.length ? [...weights].sort((a, b) => b.date.localeCompare(a.date))[0].weightKg : 70;
  const prs: PrLike[] = workout.prs as unknown as PrLike[];

  const pureGains = useMemo(() => prAtSameWeight(prs, weights, today), [prs, weights, today]);
  const correlations = useMemo(() => liftMeasurementCorrelation(prs, health.measurements, today), [prs, health.measurements, today]);

  // strength-to-size
  const lastM = useMemo(() => [...health.measurements].filter(m => !m.pump).sort((a, b) => b.date.localeCompare(a.date))[0], [health.measurements]);
  const s2s = useMemo(() => {
    if (!lastM) return [];
    const out: { label: string; ratio: number }[] = [];
    for (const [id, map] of Object.entries(LIFT_SITE_MAP)) {
      if (id === "w-pullup") continue;
      const pr = prs.find(p => p.exerciseId === id);
      const site = lastM[map.site] as number | undefined;
      if (!pr || !site) continue;
      out.push({ label: `${map.liftLabel} / ${map.siteLabel}`, ratio: strengthToSize(pr.estimated1RM ?? pr.value, site) });
    }
    return out;
  }, [prs, lastM]);

  // work capacity (last 7d sessions)
  const wc = useMemo(() => {
    const cutoff = new Date(new Date(today).getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
    const sessions = workout.sessions.filter(s => s.date >= cutoff && s.endedAt);
    const vol = sessions.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
    return workCapacity(vol, 1, latestBw);
  }, [workout.sessions, latestBw, today]);

  // anabolic index (28d)
  const anab = useMemo(() => {
    const cutoff = new Date(new Date(today).getTime() - 28 * 86_400_000).toISOString().slice(0, 10);
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    const w28 = sorted.filter(w => w.date >= cutoff);
    const wGain = w28.length >= 2 ? w28[w28.length - 1].weightKg - w28[0].weightKg : 0;
    let sGain = 0;
    for (const id of Object.keys(LIFT_LABEL)) {
      const pr = prs.find(p => p.exerciseId === id);
      if (!pr) continue;
      const now = pr.estimated1RM ?? pr.value ?? 0;
      const past = (pr.history ?? []).filter(h => h.date <= cutoff);
      sGain += now - (past.length ? Math.max(...past.map(h => h.value)) : now);
    }
    return anabolicIndex(Math.round(wGain * 10) / 10, Math.round(sGain * 10) / 10, 4);
  }, [weights, prs, today]);

  // calisthenics
  const cali = useMemo(() => {
    const unlocked = workout.caliSkills.filter(s => s.unlocked);
    const hardest = unlocked.length ? Math.max(...unlocked.map(s => s.difficulty)) : 0;
    const next = workout.caliSkills.filter(s => !s.unlocked && !s.archived).sort((a, b) => a.difficulty - b.difficulty)[0];
    return {
      index: caliStrengthIndex(latestBw, hardest),
      hardest,
      next: next ? { name: next.name, need: caliSkillRequirement(next.difficulty) } : null,
    };
  }, [workout.caliSkills, latestBw]);

  const wClass = weightClass(latestBw);
  const slope = weightSlopeKgPerWeek(weights.slice(-8));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* PR at same weight + correlations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={12} /> PR AT SAME BODYWEIGHT · 28d
          </div>
          {pureGains.length === 0 ? (
            <div style={{ padding: 12, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", textAlign: "center" }}>no new PRs in the window — log PRs in Workout to track</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {pureGains.map(g => (
                <div key={g.lift} style={{ padding: "7px 10px", borderRadius: 6, background: g.pure ? "rgba(163,230,53,0.08)" : "var(--hlth-card2)", border: `1px solid ${g.pure ? "var(--hlth-accent)" : "var(--hlth-border-soft)"}`, fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                  <b style={{ color: "var(--hlth-fg)" }}>{LIFT_LABEL[g.lift] ?? g.lift} +{g.prDeltaKg}kg</b>
                  <span style={{ color: "var(--hlth-muted)" }}> at {g.bwDeltaKg >= 0 ? "+" : ""}{g.bwDeltaKg}kg BW — </span>
                  {g.pure
                    ? <span style={{ color: "var(--hlth-accent-glow)", fontWeight: 700 }}>pure strength gain! 🔥</span>
                    : <span style={{ color: "#f59e0b" }}>partly bodyweight-driven</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link2 size={12} /> LIFT ↔ MEASUREMENT · 28d
          </div>
          {correlations.length === 0 ? (
            <div style={{ padding: 12, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", textAlign: "center" }}>needs PR deltas + tape logs in the same window</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {correlations.map(c => (
                <div key={c.liftLabel} style={{ padding: "7px 10px", borderRadius: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                  <b style={{ color: c.prDelta > 0 ? "#10b981" : "#ef4444" }}>{c.liftLabel} {c.prDelta > 0 ? "+" : ""}{c.prDelta}kg</b>
                  <span style={{ color: "var(--hlth-muted)" }}> · {c.siteLabel} </span>
                  {c.siteDelta == null
                    ? <span style={{ color: "var(--hlth-muted)" }}>no tape data</span>
                    : <b style={{ color: c.siteDelta > 0 ? "#10b981" : c.siteDelta < 0 ? "#22d3ee" : "var(--hlth-muted)" }}>{c.siteDelta > 0 ? "+" : ""}{c.siteDelta}cm</b>}
                  {c.prDelta > 0 && (c.siteDelta ?? 0) > 0 && <span style={{ color: "var(--hlth-accent-glow)" }}> — size + strength moving together. progress!</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay graph */}
      <div className="hlth-card" style={{ padding: "14px 16px" }}>
        <div className="hlth-card-h">PERFORMANCE VS BODY-COMP · 90d overlay</div>
        <div style={{ marginTop: 10 }}><OverlayGraph /></div>
      </div>

      {/* Indices row */}
      <div className="hlth-card" style={{ padding: "14px 16px" }}>
        <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={12} /> PERFORMANCE INDICES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: 10 }}>
          {[
            { label: "WORK CAPACITY", val: wc ? String(wc) : "—", hint: "7d volume ÷ BW", color: "#f59e0b" },
            { label: "ANABOLIC INDEX", val: anab ? String(anab) : "—", hint: "(Δkg × Δstr) / wk — bulk only", color: "#10b981" },
            { label: "CALI INDEX", val: cali.index ? String(cali.index) : "—", hint: `BW ÷ (diff ${cali.hardest}×10) — lower = better`, color: "#22d3ee" },
            { label: "WEIGHT CLASS", val: wClass.current, hint: wClass.distanceDown != null ? `${wClass.distanceDown}kg above -${wClass.nextDown}` : "top class", color: "#a78bfa" },
            { label: "BW TREND", val: `${slope >= 0 ? "+" : ""}${slope}`, hint: "kg/week (8-entry regression)", color: "#3b82f6" },
          ].map(k => (
            <div key={k.label} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)" }}>
              <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", letterSpacing: "0.12em" }}>{k.label}</div>
              <div style={{ fontFamily: "var(--hlth-font-display)", fontWeight: 900, fontSize: 22, color: k.color }}>{k.val}</div>
              <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 8.5, color: "var(--hlth-muted)" }}>{k.hint}</div>
            </div>
          ))}
        </div>
        {cali.next && (
          <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 6, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
            <Scale size={11} style={{ display: "inline", verticalAlign: "-2px" }} /> Next skill: <b>{cali.next.name}</b> needs ≈{cali.next.need}× S:W at {latestBw.toFixed(1)}kg — every kg dropped makes it cheaper.
          </div>
        )}
        {s2s.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {s2s.map(r => (
              <span key={r.label} style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", border: "1px solid var(--hlth-border-soft)", borderRadius: 999, padding: "3px 10px" }}>
                {r.label}: <b style={{ color: "var(--hlth-fg)" }}>{r.ratio} kg/cm</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Photo tools */}
      <PhotoTools />
    </div>
  );
}
