"use client";

/**
 * ExerciseHistoryDrawer — show all sets, PRs and progression for a given exercise.
 *
 * - Pulls every completed working set (non-warmup) from completed sessions
 *   that used this exercise (resolved via the session's routine blocks).
 * - Pulls PR history.
 * - Charts estimated 1RM (kg) or raw value (reps/sec/m) over time as a sparkline.
 * - Best set + total volume + total sets summary.
 * - Recent sets list with weight × reps @ RPE/RIR and set flags.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Activity, Hash, Clock } from "lucide-react";
import { useStore } from "../../lib/store";
import { epley1RM } from "../../lib/workoutAnalytics";
import { formatWorkoutValue } from "../../lib/types";
import type { WorkoutExercise, WorkoutSetLog } from "../../lib/types";

interface Props {
  exercise: WorkoutExercise;
  onClose: () => void;
}

interface SetPoint {
  date: string;
  set: WorkoutSetLog;
  value: number;
  weight?: number;
  reps: number;
  isAMRAP?: boolean;
}

export default function ExerciseHistoryDrawer({ exercise, onClose }: Props) {
  const { workout } = useStore();

  const data = useMemo<{ points: SetPoint[]; best: SetPoint | null; totalSets: number; totalVolume: number }>(() => {
    const pts: SetPoint[] = [];
    let bestValue = 0;
    let bestSet: SetPoint | null = null;
    let totalVol = 0;
    let setCount = 0;

    /** Resolve a set.blockId to an exercise id, checking routines AND ad-hoc blocks. */
    const blockToEx = (sid: string, bid: string): string | undefined => {
      for (const r of workout.routines) {
        const b = r.blocks.find((bb) => bb.id === bid);
        if (b?.exerciseId) return b.exerciseId;
      }
      const sess = workout.sessions.find((s) => s.id === sid);
      const b = sess?.adHocBlocks?.find((bb) => bb.id === bid);
      return b?.exerciseId;
    };

    workout.sessions.forEach((session) => {
      if (!session.endedAt) return;
      session.sets.forEach((set) => {
        if (!set.completed || set.isWarmup) return;
        const exId = blockToEx(session.id, set.blockId);
        if (exId !== exercise.id) return;
        const w = set.weight ?? 0;
        const reps = set.value;
        const v = exercise.unit === "kg" && w > 0 ? epley1RM(w, reps) : reps;
        const point: SetPoint = { date: session.date, set, value: v, weight: w, reps, isAMRAP: !!set.isAMRAP };
        if (v > bestValue) { bestValue = v; bestSet = point; }
        totalVol += w * reps;
        setCount += 1;
        pts.push(point);
      });
    });

    // Fold in PR attempt history
    const pr = workout.prs.find((p) => p.exerciseId === exercise.id);
    (pr?.history ?? []).forEach((h) => {
      const w = h.weight;
      const reps = h.reps ?? h.value;
      const v = exercise.unit === "kg" && w ? epley1RM(w, reps) : h.value;
      const fakeSet: WorkoutSetLog = {
        blockId: "pr", setIndex: 0, value: reps, weight: w, rpe: h.rpe, rir: h.rir, completed: true,
      };
      pts.push({ date: h.date, set: fakeSet, value: v, weight: w, reps });
    });

    pts.sort((a, b) => a.date.localeCompare(b.date));
    return { points: pts, best: bestSet, totalSets: setCount, totalVolume: Math.round(totalVol) };
  }, [workout.sessions, workout.routines, workout.prs, exercise.id, exercise.unit]);

  const { points, best, totalSets, totalVolume } = data;

  const spark = useMemo(() => {
    if (points.length < 2) return null;
    const w = 480, h = 90;
    const vs = points.map((p) => p.value);
    const max = Math.max(...vs);
    const min = Math.min(...vs);
    const range = Math.max(1, max - min);
    const step = w / Math.max(1, points.length - 1);
    const coords = points.map((p, i) => {
      const x = i * step;
      const y = h - ((p.value - min) / range) * (h - 16) - 8;
      return { x, y, p };
    });
    return { coords, min, max };
  }, [points]);

  // RPE-over-time trend (only points with an explicit RPE logged).
  const rpeSeries = useMemo(() => {
    const rpePts = points.filter((p) => p.set.rpe != null);
    if (rpePts.length < 2) return null;
    const w = 480, h = 60;
    const step = w / Math.max(1, points.length - 1);
    // Map every point in the full series; leave gaps where RPE is missing.
    const dots: { x: number; y: number; rpe: number }[] = [];
    points.forEach((p, i) => {
      if (p.set.rpe == null) return;
      const x = i * step;
      const y = h - ((p.set.rpe - 6) / 4) * (h - 14) - 7; // RPE 6→bottom, 10→top
      dots.push({ x, y, rpe: p.set.rpe });
    });
    return { dots };
  }, [points]);

  // RIR-over-time trend (reps in reserve; 0 = failure → top, 4 = easy → bottom).
  const rirSeries = useMemo(() => {
    const rirPts = points.filter((p) => p.set.rir != null);
    if (rirPts.length < 2) return null;
    const w = 480, h = 60;
    const step = w / Math.max(1, points.length - 1);
    const dots: { x: number; y: number; rir: number }[] = [];
    points.forEach((p, i) => {
      if (p.set.rir == null) return;
      const x = i * step;
      // RIR 0 (failure) → top, RIR 4 → bottom; clamp to [0,4].
      const clamped = Math.max(0, Math.min(4, p.set.rir));
      const y = 7 + ((clamped) / 4) * (h - 14);
      dots.push({ x, y, rir: p.set.rir });
    });
    return { dots };
  }, [points]);

  // Volume-per-session (kg) bars
  const volBySession = useMemo(() => {
    if (exercise.unit !== "kg") return null;
    const map = new Map<string, number>();
    points.forEach((p) => {
      map.set(p.date, (map.get(p.date) ?? 0) + ((p.weight ?? 0) * p.reps));
    });
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
    if (entries.length < 2) return null;
    return entries;
  }, [points, exercise.unit]);

  // AMRAP history: max reps achieved per session at any logged weight where isAMRAP=true.
  const amrapSeries = useMemo(() => {
    const amraps = points.filter((p) => p.isAMRAP);
    if (amraps.length < 1) return null;
    // Group by date: take max reps for the day.
    const map = new Map<string, number>();
    amraps.forEach((p) => {
      const cur = map.get(p.date) ?? 0;
      if (p.reps > cur) map.set(p.date, p.reps);
    });
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-15);
    return entries;
  }, [points]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={onClose}>
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl glass border border-white/10 p-6"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {exercise.equipment} · {exercise.level} · {exercise.pattern}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat icon={<Hash size={14} />} label="Sets logged" value={String(totalSets)} color="#8b5cf6" />
            <Stat
              icon={<Activity size={14} />} label="Best set"
              value={best
                ? (exercise.unit === "kg" && best.weight ? `${best.weight} kg × ${best.reps}` : formatWorkoutValue(best.reps, exercise.unit))
                : "—"}
              color="#ec4899" />
            <Stat icon={<TrendingUp size={14} />} label="Total volume" value={`${totalVolume} kg`} color="#a3e635" />
          </div>

          {/* Sparkline */}
          {spark && (
            <div className="card !p-4 mb-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                {exercise.unit === "kg" ? "Estimated 1RM over time (Epley)" : "Performance over time"}
              </p>
              <svg viewBox="0 0 480 90" className="w-full h-24">
                <defs>
                  <linearGradient id="eh-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M${spark.coords[0].x} ${spark.coords[0].y} ${spark.coords
                    .map((s) => `L${s.x} ${s.y}`).join(" ")} L${spark.coords[spark.coords.length - 1].x} 90 L${spark.coords[0].x} 90 Z`}
                  fill="url(#eh-grad)" />
                <polyline
                  points={spark.coords.map((s) => `${s.x},${s.y}`).join(" ")}
                  stroke="#8b5cf6" strokeWidth="2" fill="none"
                  strokeLinejoin="round" strokeLinecap="round" />
                {spark.coords.map((s, i) => {
                  const v = s.p.value;
                  const isPR = v === Math.max(...points.slice(0, i + 1).map((p) => p.value));
                  return isPR ? (
                    <circle key={i} cx={s.x} cy={s.y} r="3.5" fill="#f59e0b" stroke="#0b0b10" strokeWidth="1.5" />
                  ) : null;
                })}
              </svg>
            </div>
          )}

          {/* RPE trend */}
          {rpeSeries && (
            <div className="card !p-4 mb-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">RPE trend (6 = easy, 10 = failure)</p>
              <svg viewBox="0 0 480 60" className="w-full h-16">
                {/* RPE band lines */}
                {[6, 7, 8, 9, 10].map((r) => {
                  const y = 53 - ((r - 6) / 4) * 46;
                  return (
                    <g key={r}>
                      <line x1={0} x2={480} y1={y} y2={y} stroke="#ffffff08" />
                      <text x={2} y={y - 2} className="fill-gray-600" style={{ fontSize: 8 }}>{r}</text>
                    </g>
                  );
                })}
                {rpeSeries.dots.map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r={d.rpe >= 9 ? 4 : 3} fill={d.rpe >= 9 ? "#ef4444" : d.rpe >= 8 ? "#f59e0b" : "#a3e635"} />
                ))}
              </svg>
            </div>
          )}

          {/* RIR trend */}
          {rirSeries && (
            <div className="card !p-4 mb-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">RIR trend (0 = failure, 4 = easy)</p>
              <svg viewBox="0 0 480 60" className="w-full h-16">
                {[0, 1, 2, 3, 4].map((r) => {
                  const y = 7 + ((r) / 4) * 46;
                  return (
                    <g key={r}>
                      <line x1={0} x2={480} y1={y} y2={y} stroke="#ffffff08" />
                      <text x={2} y={y + 8} className="fill-gray-600" style={{ fontSize: 8 }}>{r}</text>
                    </g>
                  );
                })}
                {rirSeries.dots.map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r={d.rir <= 1 ? 4 : 3}
                    fill={d.rir <= 0 ? "#ef4444" : d.rir <= 1 ? "#f59e0b" : "#06b6d4"} />
                ))}
              </svg>
            </div>
          )}

          {/* AMRAP history */}
          {amrapSeries && (
            <div className="card !p-4 mb-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">AMRAP sets (max reps/session)</p>
              <div className="flex items-end gap-1 h-16">
                {amrapSeries.map(([date, reps]) => {
                  const max = Math.max(...amrapSeries.map(([, r]) => r));
                  const h = max > 0 ? (reps / max) * 50 : 0;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="text-[8px] text-pink-300 mb-0.5 opacity-0 group-hover:opacity-100">{reps}</div>
                      <div className="w-full rounded-t bg-gradient-to-t from-pink-500 to-amber-400" style={{ height: `${h}px` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                <span>{amrapSeries[0][0].slice(5)}</span>
                <span>{amrapSeries[amrapSeries.length-1][0].slice(5)}</span>
              </div>
            </div>
          )}

          {/* Volume-per-session bars */}
          {volBySession && (
            <div className="card !p-4 mb-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Last {volBySession.length} sessions (kg volume)</p>
              <div className="flex items-end gap-1 h-20">
                {volBySession.map(([date, v], i) => {
                  const max = Math.max(...volBySession.map(([, vv]) => vv));
                  const h = max > 0 ? (v / max) * 64 : 0;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="relative w-full">
                        <div className="rounded-t bg-gradient-to-t from-cyan-500 to-pink-500 transition-all"
                          style={{ height: `${h}px` }} />
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-white bg-black/70 px-1 rounded whitespace-nowrap">
                          {Math.round(v)} kg
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* recent sets */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Recent sets</p>
            {points.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No sets logged yet for this exercise.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {points.slice(-20).reverse().map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <Clock size={12} className="text-gray-500 shrink-0" />
                    <span className="text-[10px] text-gray-500 font-mono w-20 shrink-0">{pt.date.slice(5)}</span>
                    <span className="text-sm text-white font-mono flex-1">
                      {exercise.unit === "kg" && pt.weight
                        ? `${pt.weight} kg × ${pt.reps}`
                        : formatWorkoutValue(pt.reps, exercise.unit)}
                    </span>
                    {pt.set.rpe != null && <Tag color="#f59e0b">RPE {pt.set.rpe}</Tag>}
                    {pt.set.rir != null && <Tag color="#06b6d4">RIR {pt.set.rir}</Tag>}
                    {pt.set.isWarmup && <Tag color="#64748b">WU</Tag>}
                    {pt.set.isDrop && <Tag color="#ef4444">Drop</Tag>}
                    {pt.set.isAMRAP && <Tag color="#a3e635">AMRAP</Tag>}
                    {pt.set.isPaused && <Tag color="#ec4899">Pause</Tag>}
                    {pt.set.isJoker && <Tag color="#f97316">Joker</Tag>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/5 border border-white/5">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">{icon}{label}</p>
      <p className="text-lg font-bold mt-1 truncate" style={{ color }}>{value}</p>
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0"
      style={{ background: `${color}25`, color }}>{children}</span>
  );
}
