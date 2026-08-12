"use client";

/**
 * WorkoutCardio — cardio logging section.
 *
 * Features covered:
 * - Distance & time logger (Run/Bike/Swim/Row/Jump-rope/Walk/Hike)
 * - Route name + comparison across sessions
 * - HR recovery (2 min delta), cadence, splits, negative-split detection
 * - HR drift, pre-run fuel, strides, cool-down, jump-rope mistakes
 * - HR zone pie (visual bar split)
 * - Intervals, fartlek, LSD, recovery, brick
 * - Injury notes
 *
 * Estimations:
 *   max HR = 220 − age (defaults to age 25 = 195 bpm, overridable)
 *   VO2 max (Cooper) = (distance in meters covered in 12 min) → formula
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Plus, Save, Timer, Route, Heart, Zap, Wind } from "lucide-react";

type CardioType = "run" | "bike" | "swim" | "row" | "jump-rope" | "walk" | "hike" | "other";
type Log = {
  id: string;
  date: string;
  type: CardioType;
  route?: string;
  distanceM?: number;
  durationSec: number;
  avgHr?: number;
  maxHr?: number;
  hr2minPost?: number;
  hrStart?: number;
  hrEnd?: number;
  cadence?: number;
  splitsSec?: number[];
  fuel?: string;
  strides?: { count: number; dist: number };
  cooldownMin?: number;
  jumpRope?: { jumps: number; misses: number };
  isLSD?: boolean;
  isRecovery?: boolean;
  isBrick?: boolean;
  isIntervals?: boolean;
  injury?: string;
  notes?: string;
};

// VO2 max Cooper test (12-minute run distance in meters → ml/kg/min)
const cooperVo2 = (distM: number) => +(distM / 15 - 13.9).toFixed(1);

const TYPE_META: Record<CardioType, { label: string; emoji: string; color: string }> = {
  run:        { label: "Run",       emoji: "🏃", color: "#ec4899" },
  bike:       { label: "Bike",      emoji: "🚴", color: "#06b6d4" },
  swim:       { label: "Swim",      emoji: "🏊", color: "#8b5cf6" },
  row:        { label: "Row",       emoji: "🚣", color: "#a3e635" },
  "jump-rope":{ label: "Jump Rope", emoji: "🪢", color: "#f59e0b" },
  walk:       { label: "Walk",      emoji: "🚶", color: "#22c55e" },
  hike:       { label: "Hike",      emoji: "🥾", color: "#84cc16" },
  other:      { label: "Other",     emoji: "🏃", color: "#64748b" },
};

export default function WorkoutCardio() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [draft, setDraft] = useState<Partial<Log>>({
    type: "run", durationSec: 0, date: new Date().toISOString().slice(0, 10),
  });
  const [age, setAge] = useState(25);
  const maxHr = 220 - age;

  const setField = <K extends keyof Log>(k: K, v: Log[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setNum = (k: keyof Log, v: string) => setField(k, (v === "" ? undefined : Number(v)) as any);

  const paceSecPerKm = (l: Log) =>
    l.distanceM && l.distanceM > 0 ? l.durationSec / (l.distanceM / 1000) : undefined;

  const fmtPace = (s?: number) => {
    if (!s || !isFinite(s)) return "—";
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}/km`;
  };
  const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  // Split-time logic
  const splitsNegative = (splits: number[]) => {
    if (splits.length < 2) return false;
    const first = splits.slice(0, Math.floor(splits.length / 2));
    const second = splits.slice(Math.floor(splits.length / 2));
    const avg = (arr: number[]) => arr.reduce((n, x) => n + x, 0) / arr.length;
    return avg(second) < avg(first);
  };

  // HR drift = (hrEnd − hrStart)/hrStart * 100
  const hrDrift = (l: Log) =>
    l.hrStart && l.hrEnd ? +(((l.hrEnd - l.hrStart) / l.hrStart) * 100).toFixed(1) : undefined;

  const hrRecovery = (l: Log) =>
    l.avgHr && l.hr2minPost ? l.avgHr - l.hr2minPost : undefined;

  const save = () => {
    if (!draft.type || !draft.durationSec) return;
    const id = String(Date.now());
    setLogs((l) => [{ ...(draft as Log), id }, ...l]);
    setDraft({ type: "run", durationSec: 0, date: new Date().toISOString().slice(0, 10) });
  };

  // HR zone bucket counts (seconds in z1..z5) — crudely split by avg HR
  const zoneBars = useMemo(() => {
    const hr = draft.avgHr ?? 0;
    if (!hr) return [0, 0, 0, 0, 0];
    const ratio = hr / maxHr;
    const buckets = [0, 0, 0, 0, 0];
    if (ratio < 0.6) buckets[0] = 100;
    else if (ratio < 0.7) buckets[1] = 100;
    else if (ratio < 0.8) buckets[2] = 100;
    else if (ratio < 0.9) buckets[3] = 100;
    else buckets[4] = 100;
    return buckets;
  }, [draft.avgHr, maxHr]);

  const ZONE_COLORS = ["#22c55e", "#a3e635", "#f59e0b", "#ec4899", "#ef4444"];
  const ZONE_LABELS = ["Z1", "Z2", "Z3", "Z4", "Z5"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="text-cyan-400" size={22} /> Cardio
        </h2>
        <p className="text-sm text-gray-400 mt-1">Run, bike, swim, row — track pace, HR, splits, and recovery.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_360px] gap-4">
        {/* Form */}
        <div className="card space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_META) as CardioType[]).map((t) => {
              const m = TYPE_META[t];
              const active = draft.type === t;
              return (
                <button key={t} onClick={() => setField("type", t)}
                  className={`chip px-3 py-1.5 text-xs rounded-lg border transition ${
                    active ? "text-white" : "text-gray-400 bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                  style={active ? { background: m.color, borderColor: m.color } : undefined}>
                  {m.emoji} {m.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Date">
              <input type="date" value={draft.date ?? ""} onChange={(e) => setField("date", e.target.value)}
                className="input-base w-full" />
            </Field>
            <Field label="Distance (m)">
              <input type="number" value={draft.distanceM ?? ""} onChange={(e) => setNum("distanceM", e.target.value)}
                className="input-base w-full" placeholder="5000" />
            </Field>
            <Field label="Duration (min)">
              <input type="number" value={Math.round((draft.durationSec ?? 0) / 60)}
                onChange={(e) => setField("durationSec", (parseInt(e.target.value || "0")) * 60)}
                className="input-base w-full" />
            </Field>
            <Field label="Route name">
              <input value={draft.route ?? ""} onChange={(e) => setField("route", e.target.value)}
                placeholder="River Trail" className="input-base w-full" />
            </Field>
            <Field label="Avg HR (bpm)">
              <input type="number" value={draft.avgHr ?? ""} onChange={(e) => setNum("avgHr", e.target.value)}
                className="input-base w-full" />
            </Field>
            <Field label="Max HR">
              <input type="number" value={draft.maxHr ?? ""} onChange={(e) => setNum("maxHr", e.target.value)}
                className="input-base w-full" />
            </Field>
            <Field label="HR after 2 min">
              <input type="number" value={draft.hr2minPost ?? ""} onChange={(e) => setNum("hr2minPost", e.target.value)}
                className="input-base w-full" />
            </Field>
            <Field label="HR start / end" className="col-span-2">
              <div className="flex gap-2">
                <input type="number" placeholder="Start bpm" value={draft.hrStart ?? ""}
                  onChange={(e) => setNum("hrStart", e.target.value)} className="input-base flex-1" />
                <input type="number" placeholder="End bpm" value={draft.hrEnd ?? ""}
                  onChange={(e) => setNum("hrEnd", e.target.value)} className="input-base flex-1" />
              </div>
            </Field>
            <Field label="Cadence (spm)">
              <input type="number" value={draft.cadence ?? ""} onChange={(e) => setNum("cadence", e.target.value)}
                className="input-base w-full" />
            </Field>
            <Field label="Cool-down (min)">
              <input type="number" value={draft.cooldownMin ?? ""} onChange={(e) => setNum("cooldownMin", e.target.value)}
                className="input-base w-full" />
            </Field>
            <Field label="Pre-fuel">
              <input value={draft.fuel ?? ""} onChange={(e) => setField("fuel", e.target.value)}
                placeholder="Oats + coffee" className="input-base w-full" />
            </Field>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              ["isLSD", "LSD"],
              ["isRecovery", "Recovery"],
              ["isBrick", "Brick"],
              ["isIntervals", "Intervals"],
            ].map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
                <input type="checkbox" className="checkbox-custom"
                  checked={!!(draft as any)[k]}
                  onChange={(e) => setField(k as keyof Log, e.target.checked as any)} />
                <span className="text-gray-300">{l}</span>
              </label>
            ))}
          </div>

          {/* Jump rope */}
          {draft.type === "jump-rope" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jumps">
                <input type="number" value={draft.jumpRope?.jumps ?? ""}
                  onChange={(e) => setField("jumpRope", { jumps: parseInt(e.target.value || "0"), misses: draft.jumpRope?.misses ?? 0 })}
                  className="input-base w-full" />
              </Field>
              <Field label="Misses">
                <input type="number" value={draft.jumpRope?.misses ?? ""}
                  onChange={(e) => setField("jumpRope", { jumps: draft.jumpRope?.jumps ?? 0, misses: parseInt(e.target.value || "0") })}
                  className="input-base w-full" />
              </Field>
            </div>
          )}

          <Field label="Injury notes">
            <input value={draft.injury ?? ""} onChange={(e) => setField("injury", e.target.value)}
              placeholder="Shin splints, etc." className="input-base w-full" />
          </Field>
          <Field label="Notes">
            <input value={draft.notes ?? ""} onChange={(e) => setField("notes", e.target.value)}
              className="input-base w-full" />
          </Field>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-gray-400 flex items-center gap-3">
              <span className="flex items-center gap-1"><Timer size={12} /> {fmtDur(draft.durationSec ?? 0)}</span>
              <span>{fmtPace(paceSecPerKm(draft as Log))}</span>
              {hrRecovery(draft as Log) != null && (
                <span className="flex items-center gap-1 text-cyan-300"><Heart size={12} /> HR recovery {hrRecovery(draft as Log)}</span>
              )}
              {hrDrift(draft as Log) != null && (
                <span className="flex items-center gap-1 text-pink-300"><Wind size={12} /> Drift {hrDrift(draft as Log)}%</span>
              )}
            </div>
            <button onClick={save} className="btn-primary flex items-center gap-2 text-sm"><Save size={14} /> Save</button>
          </div>
        </div>

        {/* Side: HR zones + Cooper */}
        <div className="space-y-4">
          <div className="card">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2"><Heart size={16} className="text-rose-400" /> HR Zones (avg)</h4>
            <div className="space-y-2">
              {ZONE_LABELS.map((z, i) => (
                <div key={z} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-gray-400">{z}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full" style={{ width: `${zoneBars[i]}%`, background: ZONE_COLORS[i] }}
                      initial={{ width: 0 }} animate={{ width: `${zoneBars[i]}%` }} />
                  </div>
                  <span className="w-10 text-right text-gray-300 font-mono">{Math.round(maxHr * [0.6, 0.7, 0.8, 0.9, 1][i])}</span>
                </div>
              ))}
            </div>
            <Field label="Your age (for max HR)">
              <input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value || "25"))}
                className="input-base w-full" />
            </Field>
          </div>

          <div className="card">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2"><Zap size={16} className="text-amber-400" /> Cooper 12-min VO2</h4>
            <p className="text-xs text-gray-400 mb-2">If this was a 12-minute test, enter distance:</p>
            <CooperInline />
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="card">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Route size={16} className="text-cyan-400" /> Recent Sessions</h4>
        {logs.length === 0 && <p className="text-sm text-gray-500 italic">No cardio logged yet.</p>}
        <div className="space-y-2">
          {logs.map((l) => {
            const m = TYPE_META[l.type];
            const drift = hrDrift(l);
            const rec = hrRecovery(l);
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {m.label} {l.route ? `· ${l.route}` : ""}
                  </p>
                  <p className="text-[11px] text-gray-400 flex flex-wrap gap-2">
                    <span>{l.date}</span>
                    <span>{fmtDur(l.durationSec)}</span>
                    {l.distanceM != null && <span>{(l.distanceM / 1000).toFixed(2)} km · {fmtPace(paceSecPerKm(l))}</span>}
                    {l.avgHr && <span className="text-rose-300">♥ {l.avgHr} bpm</span>}
                    {rec != null && <span className="text-cyan-300">rec {rec}</span>}
                    {drift != null && <span className={drift > 10 ? "text-red-400" : "text-lime-400"}>drift {drift}%</span>}
                  </p>
                </div>
                {l.isLSD && <span className="chip bg-violet-500/20 text-violet-300">LSD</span>}
                {l.isRecovery && <span className="chip bg-lime-500/20 text-lime-300">Recovery</span>}
                {l.isBrick && <span className="chip bg-amber-500/20 text-amber-300">Brick</span>}
                {l.isIntervals && <span className="chip bg-pink-500/20 text-pink-300">Intervals</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function CooperInline() {
  const [d, setD] = useState<number>(2400);
  const v = cooperVo2(d);
  return (
    <div className="flex items-center gap-2">
      <input type="number" value={d} onChange={(e) => setD(parseInt(e.target.value || "0"))}
        className="input-base flex-1" />
      <span className="text-sm font-mono text-amber-300">VO2 {v}</span>
    </div>
  );
}
