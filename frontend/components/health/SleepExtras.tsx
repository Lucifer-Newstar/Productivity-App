"use client";

/**
 * SleepExtras — Wave 8D SOMNIUM additions.
 *
 *  - Sleep Bank Statement: weekly report (slept vs needed, delta, avg quality, trend)
 *  - Circadian consistency score (wake-time σ over 14 nights) + social-jetlag flag
 *  - Nap log — duration + time, power vs long classification with circadian note
 *  - Sleep graph 30/90 day (SVG bars vs ideal line)
 *  - Dream-journal PIN lock (set/lock/unlock; FNV hash in profile.pinHash)
 */

import { useMemo, useState } from "react";
import { FileBarChart, Compass, BedDouble, Lock, Unlock, Trash2, Plus } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  sleepStatement, circadianConsistency, classifyNap, pinHash, formatHours,
} from "../../lib/healthAnalytics";
import type { NapEntry } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

const inputStyle: React.CSSProperties = {
  background: "var(--hlth-card2)", color: "var(--hlth-fg)",
  border: "1px solid var(--hlth-border-soft)", borderRadius: 4,
  padding: "5px 8px", fontFamily: "var(--hlth-font-mono)", fontSize: 11,
};

function SleepGraph({ days }: { days: 30 | 90 }) {
  const { health } = useStore();
  const ideal = health.profile.idealSleepHours;
  const data = useMemo(() => {
    const out: { date: string; h: number; q: number }[] = [];
    const today = new Date(todayIso() + "T00:00:00");
    for (let i = days - 1; i >= 0; i--) {
      const iso = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      const e = health.sleep.find(s => s.date === iso);
      out.push({ date: iso, h: e?.durationHours ?? 0, q: e?.quality ?? 0 });
    }
    return out;
  }, [health.sleep, days]);

  const W = 640, H = 120, max = 12;
  const bw = W / days;
  const y = (h: number) => H - (Math.min(h, max) / max) * H;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {/* ideal line */}
      <line x1={0} y1={y(ideal)} x2={W} y2={y(ideal)} stroke="var(--hlth-accent)" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
      <text x={W - 4} y={y(ideal) - 3} textAnchor="end" fontSize="8" fill="var(--hlth-accent-glow)" fontFamily="var(--hlth-font-mono)">{ideal}h ideal</text>
      {data.map((d, i) => d.h > 0 && (
        <rect key={d.date} x={i * bw + bw * 0.15} y={y(d.h)} width={bw * 0.7} height={H - y(d.h)}
          rx={1}
          fill={d.h >= ideal ? "#a78bfa" : d.h >= ideal - 1.5 ? "#f59e0b" : "#ef4444"} opacity={0.85}>
          <title>{d.date}: {d.h}h · Q{d.q}/10</title>
        </rect>
      ))}
      <line x1={0} y1={H} x2={W} y2={H} stroke="var(--hlth-border-soft)" strokeWidth={1} />
      <text x={2} y={H + 12} fontSize="8" fill="var(--hlth-muted)" fontFamily="var(--hlth-font-mono)">{data[0]?.date}</text>
      <text x={W - 2} y={H + 12} textAnchor="end" fontSize="8" fill="var(--hlth-muted)" fontFamily="var(--hlth-font-mono)">{data[data.length - 1]?.date}</text>
    </svg>
  );
}

export default function SleepExtras() {
  const { health, updateHealth } = useStore();
  const ideal = health.profile.idealSleepHours;
  const stmt = useMemo(() => sleepStatement(health.sleep, ideal), [health.sleep, ideal]);
  const circ = useMemo(() => circadianConsistency(health.sleep), [health.sleep]);
  const [range, setRange] = useState<30 | 90>(30);

  // Naps
  const [napMin, setNapMin] = useState(20);
  const [napTime, setNapTime] = useState("");
  const todaysNaps = useMemo(() => health.naps.filter(n => n.date === todayIso()), [health.naps]);
  const napPreview = classifyNap(napMin, napTime || undefined);
  const addNap = () => {
    if (napMin <= 0) return;
    const nap: NapEntry = { id: uid(), date: todayIso(), time: napTime || undefined, durationMin: napMin, kind: classifyNap(napMin, napTime || undefined).kind };
    updateHealth(h => ({ naps: [...h.naps, nap] }));
  };

  // PIN lock
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const hasPin = !!health.profile.pinHash;
  const setPin = () => {
    if (pinInput.length < 4) { window.alert("PIN must be 4+ digits."); return; }
    updateHealth(() => ({ profile: { ...health.profile, pinHash: pinHash(pinInput) } }));
    setPinInput(""); setUnlocked(true);
  };
  const tryUnlock = () => {
    if (pinHash(pinInput) === health.profile.pinHash) { setUnlocked(true); setPinInput(""); }
    else window.alert("Wrong PIN.");
  };
  const removePin = () => {
    updateHealth(() => ({ profile: { ...health.profile, pinHash: undefined } }));
    setUnlocked(false);
  };

  const trendColor = stmt.trend === "improving" ? "#10b981" : stmt.trend === "declining" ? "#ef4444" : "var(--hlth-muted)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Statement + consistency */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FileBarChart size={12} /> SLEEP BANK STATEMENT · last {stmt.nights} nights
          </div>
          {stmt.nights === 0 ? (
            <div style={{ padding: 14, textAlign: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>log nights to generate a statement</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginTop: 10, fontFamily: "var(--hlth-font-mono)" }}>
              {[
                { label: "SLEPT", val: `${stmt.totalSlept}h`, color: "var(--hlth-fg)" },
                { label: "NEEDED", val: `${stmt.totalNeeded}h`, color: "var(--hlth-muted)" },
                { label: "DELTA", val: `${stmt.delta >= 0 ? "+" : ""}${stmt.delta}h`, color: stmt.delta >= 0 ? "#10b981" : "#ef4444" },
                { label: "AVG/NIGHT", val: formatHours(stmt.avgHours), color: "#a78bfa" },
                { label: "AVG QUALITY", val: `${stmt.avgQuality}/10`, color: "#f59e0b" },
                { label: "TREND", val: stmt.trend.toUpperCase(), color: trendColor },
              ].map(k => (
                <div key={k.label}>
                  <div style={{ fontSize: 9, color: "var(--hlth-muted)", letterSpacing: "0.12em" }}>{k.label}</div>
                  <div style={{ fontFamily: "var(--hlth-font-display)", fontWeight: 900, fontSize: 18, color: k.color as string }}>{k.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hlth-card" style={{ padding: "14px 16px" }}>
          <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Compass size={12} /> CIRCADIAN CONSISTENCY · wake-time stability
          </div>
          {circ.score === 0 && circ.sigmaMin === 0 ? (
            <div style={{ padding: 14, textAlign: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>need 3+ logged nights</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "var(--hlth-font-display)", fontWeight: 900, fontSize: 34, color: circ.score >= 75 ? "#10b981" : circ.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {circ.score}<span style={{ fontSize: 14, color: "var(--hlth-muted)" }}>/100</span>
                </div>
                <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", letterSpacing: "0.08em" }}>
                  wake σ ±{circ.sigmaMin}min · ideal ≤30min
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 160, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" }}>
                {circ.flagged ? (
                  <span style={{ color: "#ef4444" }}>⚠ Social jetlag {Math.abs(circ.socialJetlagMin)}min — weekend wake drifts &gt;90min vs weekdays. Keep wake ±30min even on Sunday.</span>
                ) : (
                  <span>Weekend drift {Math.abs(circ.socialJetlagMin)}min — under the 90min social-jetlag threshold. {circ.score >= 75 ? "Rhythm locked. 🔒" : "Tighten wake times to boost the score."}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nap log */}
      <div className="hlth-card" style={{ padding: "14px 16px" }}>
        <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <BedDouble size={12} /> NAP LOG · power ≤30min, long &gt;30min
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 8 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
            MINUTES
            <input type="number" min={5} max={240} value={napMin} onChange={e => setNapMin(+e.target.value)} style={{ ...inputStyle, width: 70 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)" }}>
            START (OPT)
            <input type="time" value={napTime} onChange={e => setNapTime(e.target.value)} style={inputStyle} />
          </label>
          <button className="hlth-btn" onClick={addNap} style={{ padding: "6px 12px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Plus size={10} /> LOG NAP
          </button>
          <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: napPreview.kind === "power" ? "#10b981" : "#f59e0b", flex: "1 1 200px" }}>
            {napPreview.kind.toUpperCase()} — {napPreview.note}
          </span>
        </div>
        {todaysNaps.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {todaysNaps.map(n => (
              <span key={n.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)", borderRadius: 999, padding: "4px 10px", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
                <span style={{ color: n.kind === "power" ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{n.kind.toUpperCase()}</span>
                <span style={{ color: "var(--hlth-fg)" }}>{n.durationMin}min{n.time ? ` @ ${n.time}` : ""}</span>
                <button onClick={() => updateHealth(h => ({ naps: h.naps.filter(x => x.id !== n.id) }))}
                  style={{ background: "transparent", border: "none", color: "var(--hlth-muted)", cursor: "pointer", padding: 0, display: "inline-flex" }}>
                  <Trash2 size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sleep graph */}
      <div className="hlth-card" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div className="hlth-card-h">SLEEP GRAPH · duration vs ideal</div>
          <div style={{ display: "flex", gap: 6 }}>
            {([30, 90] as const).map(r => (
              <button key={r} className="hlth-btn hlth-btn-ghost" onClick={() => setRange(r)}
                style={{ padding: "4px 10px", fontSize: 10, ...(range === r ? { borderColor: "var(--hlth-accent)", color: "var(--hlth-accent-glow)" } : {}) }}>
                {r}D
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <SleepGraph days={range} />
        </div>
      </div>

      {/* Dream journal PIN */}
      <div className="hlth-card" style={{ padding: "14px 16px" }}>
        <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hasPin && !unlocked ? <Lock size={12} /> : <Unlock size={12} />} DREAM JOURNAL LOCK
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8, fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
          {!hasPin && (
            <>
              <span style={{ color: "var(--hlth-muted)" }}>no PIN set — dreams visible to anyone with this browser</span>
              <input type="password" inputMode="numeric" placeholder="4+ digit PIN" value={pinInput} onChange={e => setPinInput(e.target.value)} style={{ ...inputStyle, width: 110 }} />
              <button className="hlth-btn hlth-btn-ghost" onClick={setPin} style={{ padding: "5px 10px", fontSize: 10 }}>SET PIN</button>
            </>
          )}
          {hasPin && !unlocked && (
            <>
              <span style={{ color: "#f59e0b" }}>journal locked — dream text hidden in history until unlocked</span>
              <input type="password" inputMode="numeric" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)} style={{ ...inputStyle, width: 90 }} />
              <button className="hlth-btn" onClick={tryUnlock} style={{ padding: "5px 10px", fontSize: 10 }}>UNLOCK</button>
            </>
          )}
          {hasPin && unlocked && (
            <>
              <span style={{ color: "#10b981" }}>unlocked for this session</span>
              <button className="hlth-btn hlth-btn-ghost" onClick={() => setUnlocked(false)} style={{ padding: "5px 10px", fontSize: 10 }}>LOCK</button>
              <button className="hlth-btn hlth-btn-ghost" onClick={removePin} style={{ padding: "5px 10px", fontSize: 10, color: "#ef4444" }}>REMOVE PIN</button>
            </>
          )}
          <span style={{ color: "var(--hlth-muted)", opacity: 0.7 }}>local honesty-lock only — not encryption</span>
        </div>
      </div>
    </div>
  );
}
