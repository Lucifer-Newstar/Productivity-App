"use client";

/**
 * WorkoutCardio — cardio logging section.
 *
 * Logs are persisted to `workout.cardioLogs` via addCardioLog / deleteCardioLog
 * so they survive refresh and show up in CSV exports. Supports 8 activity
 * types with distance, duration, HR metrics, HR zones, negative-split / drift /
 * recovery calculations, jump-rope counters, training-flavor toggles, and a
 * Cooper 12-min VO2 inline calculator.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Save, Timer, Route, Heart, Zap, Wind, Footprints, Trash2,
  Bike, Waves, ShipWheel, Mountain, CircleEllipsis,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../../lib/store";
import type { CardioType, CardioLog } from "../../lib/types";

// VO2 max Cooper test (12-minute run distance in meters → ml/kg/min).
const cooperVo2 = (distM: number) => +(distM / 15 - 13.9).toFixed(1);

const TYPE_META: Record<CardioType, { label: string; icon: LucideIcon; color: string }> = {
  run:          { label: "Run",       icon: Activity,       color: "#ec4899" },
  bike:         { label: "Bike",      icon: Bike,           color: "#06b6d4" },
  swim:         { label: "Swim",      icon: Waves,          color: "#8b5cf6" },
  row:          { label: "Row",       icon: ShipWheel,      color: "#a3e635" },
  "jump-rope": { label: "Jump Rope", icon: Zap,            color: "#f59e0b" },
  walk:         { label: "Walk",      icon: Footprints,     color: "#22c55e" },
  hike:         { label: "Hike",      icon: Mountain,       color: "#84cc16" },
  other:        { label: "Other",     icon: CircleEllipsis, color: "#64748b" },
};

export default function WorkoutCardio() {
  const { workout, addCardioLog, deleteCardioLog } = useStore();
  const logs = workout.cardioLogs;

  const [draft, setDraft] = useState<Partial<CardioLog>>({
    type: "run", durationSec: 0, date: new Date().toISOString().slice(0, 10),
  });
  const [jumps, setJumps] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [age, setAge] = useState(25);
  const maxHr = 220 - age;

  const setField = <K extends keyof CardioLog>(k: K, v: CardioLog[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const setNum = (k: keyof CardioLog, v: string) =>
    setField(k, (v === "" ? undefined : Number(v)) as any);

  /** Pace = seconds per km. */
  const paceSecPerKm = (l: { distanceMeters?: number; durationSec?: number }) =>
    l.distanceMeters && l.distanceMeters > 0 && l.durationSec
      ? l.durationSec / (l.distanceMeters / 1000)
      : undefined;

  const fmtPace = (s?: number) => {
    if (!s || !isFinite(s)) return "—";
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}/km`;
  };
  const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  /** HR drift = (hrEnd − hrStart)/hrStart × 100. */
  const hrDrift = (l: Pick<CardioLog, "hrStart" | "hrEnd">) =>
    l.hrStart && l.hrEnd ? +((((l.hrEnd ?? 0) - (l.hrStart ?? 0)) / (l.hrStart ?? 1)) * 100).toFixed(1) : undefined;

  const hrRecovery = (l: Pick<CardioLog, "avgHr" | "hr2minPost">) =>
    l.avgHr && l.hr2minPost ? l.avgHr - l.hr2minPost : undefined;

  /** Reset the form after save. */
  function resetDraft() {
    setDraft({ type: "run", durationSec: 0, date: new Date().toISOString().slice(0, 10) });
    setJumps(0); setMisses(0);
  }

  function save() {
    if (!draft.type || !draft.durationSec) return;
    const entry: Omit<CardioLog, "id"> = {
      date: draft.date ?? new Date().toISOString().slice(0, 10),
      type: draft.type,
      durationSec: draft.durationSec,
      routeName: draft.routeName,
      distanceMeters: draft.distanceMeters,
      avgHr: draft.avgHr,
      maxHr: draft.maxHr,
      hr2minPost: draft.hr2minPost,
      hrStart: draft.hrStart,
      hrEnd: draft.hrEnd,
      hrDriftPct: hrDrift(draft),
      cadenceSpm: draft.cadenceSpm,
      cooldownMin: draft.cooldownMin,
      fuel: draft.fuel,
      isLSD: draft.isLSD,
      isRecovery: draft.isRecovery,
      isBrick: draft.isBrick,
      intervals: draft.intervals,
      injuryNotes: draft.injuryNotes,
      notes: draft.notes,
      paceSecPerKm: paceSecPerKm(draft),
      jumpRope: draft.type === "jump-rope" ? { jumps, misses } : undefined,
    };
    addCardioLog(entry);
    resetDraft();
  }

  // HR zone preview for the draft (just a visual hint while filling).
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
        <p className="text-sm text-gray-400 mt-1">Run, bike, swim, row — track pace, HR, splits, and recovery. Logs persist across refresh.</p>
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
                  <m.icon size={14}/> {m.label}
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
              <input type="number" value={draft.distanceMeters ?? ""} onChange={(e) => setNum("distanceMeters", e.target.value)}
                className="input-base w-full" placeholder="5000" />
            </Field>
            <Field label="Duration (min)">
              <input type="number" value={Math.round((draft.durationSec ?? 0) / 60)}
                onChange={(e) => setField("durationSec", (parseInt(e.target.value || "0")) * 60)}
                className="input-base w-full" />
            </Field>
            <Field label="Route name">
              <input value={draft.routeName ?? ""} onChange={(e) => setField("routeName", e.target.value)}
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
              <input type="number" value={draft.cadenceSpm ?? ""} onChange={(e) => setNum("cadenceSpm", e.target.value)}
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

          {/* Training flavor toggles */}
          <div className="flex flex-wrap gap-2 text-xs">
            {([
              ["isLSD", "LSD"],
              ["isRecovery", "Recovery"],
              ["isBrick", "Brick"],
            ] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
                <input type="checkbox" className="checkbox-custom"
                  checked={!!(draft as any)[k]}
                  onChange={(e) => setField(k, e.target.checked as any)} />
                <span className="text-gray-300">{l}</span>
              </label>
            ))}
          </div>

          {/* Jump rope */}
          {draft.type === "jump-rope" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jumps">
                <input type="number" value={jumps} onChange={(e) => setJumps(parseInt(e.target.value || "0"))}
                  className="input-base w-full" />
              </Field>
              <Field label="Misses">
                <input type="number" value={misses} onChange={(e) => setMisses(parseInt(e.target.value || "0"))}
                  className="input-base w-full" />
              </Field>
            </div>
          )}

          <Field label="Injury notes">
            <input value={draft.injuryNotes ?? ""} onChange={(e) => setField("injuryNotes", e.target.value)}
              placeholder="Shin splints, etc." className="input-base w-full" />
          </Field>
          <Field label="Notes">
            <input value={draft.notes ?? ""} onChange={(e) => setField("notes", e.target.value)}
              className="input-base w-full" />
          </Field>

          <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
            <div className="text-xs text-gray-400 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><Timer size={12} /> {fmtDur(draft.durationSec ?? 0)}</span>
              <span>{fmtPace(paceSecPerKm(draft))}</span>
              {hrRecovery(draft) != null && (
                <span className="flex items-center gap-1 text-cyan-300"><Heart size={12} /> HR recovery {hrRecovery(draft)}</span>
              )}
              {hrDrift(draft) != null && (
                <span className="flex items-center gap-1 text-pink-300"><Wind size={12} /> Drift {hrDrift(draft)}%</span>
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
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
            <Footprints className="mx-auto text-cyan-400/60 mb-2" size={22} />
            <p className="text-sm text-gray-300">No cardio logged yet.</p>
            <p className="text-xs text-gray-500 mt-1">Fill in a session above and hit Save to start your log.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 20).map((l) => {
              const m = TYPE_META[l.type];
              const drift = l.hrDriftPct ?? hrDrift(l);
              const rec = hrRecovery(l);
              return (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 group">
                  <span className="w-9 h-9 rounded-lg grid place-items-center" style={{background:`${m.color}18`,color:m.color}}><m.icon size={18}/></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {m.label} {l.routeName ? `· ${l.routeName}` : ""}
                    </p>
                    <p className="text-[11px] text-gray-400 flex flex-wrap gap-2">
                      <span>{l.date}</span>
                      <span>{fmtDur(l.durationSec)}</span>
                      {l.distanceMeters != null && <span>{(l.distanceMeters / 1000).toFixed(2)} km · {fmtPace(l.paceSecPerKm ?? paceSecPerKm(l))}</span>}
                      {l.avgHr && <span className="text-rose-300">♥ {l.avgHr} bpm</span>}
                      {rec != null && <span className="text-cyan-300">rec {rec}</span>}
                      {drift != null && <span className={drift > 10 ? "text-red-400" : "text-lime-400"}>drift {drift}%</span>}
                    </p>
                  </div>
                  {l.isLSD && <span className="chip bg-violet-500/20 text-violet-300">LSD</span>}
                  {l.isRecovery && <span className="chip bg-lime-500/20 text-lime-300">Recovery</span>}
                  {l.isBrick && <span className="chip bg-amber-500/20 text-amber-300">Brick</span>}
                  <button onClick={() => deleteCardioLog(l.id)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
