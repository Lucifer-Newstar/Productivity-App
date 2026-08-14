"use client";

/**
 * FastingClock — Wave 8A intermittent-fasting visualiser.
 *
 * 24h SVG ring: eating window drawn in EKG green, fasting arc in deep blue.
 * A "now" needle sweeps the dial; centre shows a live countdown to the next
 * transition (window opens/closes). Preset chips (16:8 / 18:6 / 14:10 / OMAD /
 * custom) write through to health.profile; fast-streak counter shown below.
 */

import { useEffect, useMemo, useState } from "react";
import { Timer, Flame } from "lucide-react";
import { useStore } from "../../lib/store";
import { fastingWindowState, fastStreak } from "../../lib/healthAnalytics";
import { FASTING_PRESETS, type FastingPresetId } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0, 10); }

/** Polar → cartesian on the 24h dial (0h at top, clockwise). */
function pt(cx: number, cy: number, r: number, hour: number) {
  const a = (hour / 24) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, fromH: number, toH: number) {
  const span = ((toH - fromH) % 24 + 24) % 24 || 24;
  const p0 = pt(cx, cy, r, fromH);
  const p1 = pt(cx, cy, r, fromH + span);
  const large = span > 12 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

export default function FastingClock() {
  const { health, updateHealth } = useStore();
  const p = health.profile;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const nowH = now.getHours() + now.getMinutes() / 60;
  const start = p.eatingWindowStart ?? 12;
  const end = p.eatingWindowEnd ?? 20;
  const st = fastingWindowState(start, end, nowH);
  const streak = useMemo(
    () => fastStreak(health.meals, start, end, todayIso()),
    [health.meals, start, end],
  );

  const setPreset = (id: FastingPresetId) => {
    if (id === "custom") { updateHealth(() => ({ profile: { ...p, fastingPreset: "custom" } })); return; }
    const pre = FASTING_PRESETS[id];
    updateHealth(() => ({ profile: { ...p, fastingPreset: id, eatingWindowStart: pre.start, eatingWindowEnd: pre.end } }));
  };
  const setCustomHour = (which: "start" | "end", v: number) => {
    const val = Math.max(0, Math.min(23.5, v));
    updateHealth(() => ({
      profile: {
        ...p, fastingPreset: "custom",
        eatingWindowStart: which === "start" ? val : p.eatingWindowStart,
        eatingWindowEnd: which === "end" ? val : p.eatingWindowEnd,
      },
    }));
  };

  const hh = Math.floor(st.hoursToNext);
  const mm = Math.round((st.hoursToNext - hh) * 60);
  const cx = 90, cy = 90, R = 72;
  const needle = pt(cx, cy, R - 6, nowH);
  const preset = p.fastingPreset ?? "16:8";
  const fmtH = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;

  return (
    <div className="hlth-card" style={{ padding: "14px 16px" }}>
      <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Timer size={12} /> FASTING WINDOW · {FASTING_PRESETS[preset as Exclude<FastingPresetId, "custom">]?.label ?? "CUSTOM"}
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* base ring = fasting */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(59,130,246,0.28)" strokeWidth={13} />
          {/* eating arc */}
          <path d={arcPath(cx, cy, R, start, end)} fill="none" stroke="var(--hlth-accent)" strokeWidth={13}
            strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px rgba(163,230,53,0.5))" }} />
          {/* hour ticks */}
          {[0, 6, 12, 18].map(h => {
            const o = pt(cx, cy, R + 11, h);
            return <text key={h} x={o.x} y={o.y + 3} textAnchor="middle" fontSize="8"
              fill="var(--hlth-muted)" fontFamily="var(--hlth-font-mono)">{String(h).padStart(2, "0")}</text>;
          })}
          {/* now needle */}
          <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="var(--hlth-fg)" strokeWidth={1.5} opacity={0.85} />
          <circle cx={needle.x} cy={needle.y} r={3.5} fill={st.inWindow ? "var(--hlth-accent)" : "#3b82f6"} />
          <circle cx={cx} cy={cy} r={2.5} fill="var(--hlth-muted)" />
          {/* centre readout */}
          <text x={cx} y={cy - 14} textAnchor="middle" fontSize="9" fill="var(--hlth-muted)"
            fontFamily="var(--hlth-font-mono)" letterSpacing="0.15em">
            {st.inWindow ? "EATING" : "FASTING"}
          </text>
          <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="800"
            fill={st.inWindow ? "var(--hlth-accent-glow)" : "#60a5fa"} fontFamily="var(--hlth-font-display)">
            {hh}h {String(mm).padStart(2, "0")}m
          </text>
          <text x={cx} y={cy + 20} textAnchor="middle" fontSize="8" fill="var(--hlth-muted)"
            fontFamily="var(--hlth-font-mono)" letterSpacing="0.12em">
            UNTIL WINDOW {st.next.toUpperCase()}
          </text>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 200, flex: 1 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(Object.keys(FASTING_PRESETS) as Exclude<FastingPresetId, "custom">[]).map(id => (
              <button key={id} className="hlth-btn hlth-btn-ghost" onClick={() => setPreset(id)}
                style={{
                  padding: "5px 10px", fontSize: 10,
                  ...(preset === id ? { borderColor: "var(--hlth-accent)", color: "var(--hlth-accent-glow)", background: "rgba(163,230,53,0.08)" } : {}),
                }}>
                {FASTING_PRESETS[id].label}
              </button>
            ))}
            <button className="hlth-btn hlth-btn-ghost" onClick={() => setPreset("custom")}
              style={{
                padding: "5px 10px", fontSize: 10,
                ...(preset === "custom" ? { borderColor: "var(--hlth-accent)", color: "var(--hlth-accent-glow)", background: "rgba(163,230,53,0.08)" } : {}),
              }}>
              CUSTOM
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.08em" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              OPENS
              <input type="number" min={0} max={23.5} step={0.5} value={start}
                onChange={e => setCustomHour("start", +e.target.value)}
                style={{ width: 64, background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "4px 6px", fontFamily: "var(--hlth-font-mono)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              CLOSES
              <input type="number" min={0} max={23.5} step={0.5} value={end}
                onChange={e => setCustomHour("end", +e.target.value)}
                style={{ width: 64, background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "4px 6px", fontFamily: "var(--hlth-font-mono)" }} />
            </label>
            <span style={{ alignSelf: "flex-end", paddingBottom: 5 }}>
              {fmtH(start)}–{fmtH(end)} · eat {st.eatingHours}h / fast {st.fastingHours}h
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8,
            background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)",
            fontFamily: "var(--hlth-font-mono)", fontSize: 11,
          }}>
            <Flame size={13} style={{ color: streak > 0 ? "#f59e0b" : "var(--hlth-muted)" }} />
            <span style={{ color: "var(--hlth-fg)", fontWeight: 700 }}>{streak}-day fast streak</span>
            <span style={{ color: "var(--hlth-muted)", fontSize: 10 }}>
              {streak > 0 ? "meals kept inside the window" : "log meal times to build the streak"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
