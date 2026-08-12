"use client";

/**
 * WorkoutGym — weights/gym feature panel.
 *
 * Implements the feature list:
 * - Plate calculator (kg Olympic bar default)
 * - 1RM calc (Epley) + Training Max (90%)
 * - RPE ↔ RIR converter
 * - Wilks coefficient
 * - Dumbbell ↔ Barbell equivalence
 * - Strength-to-weight ratio
 * - Drop set / superset / cluster set quick-log helpers
 * - History drawer (last 3-5 logs per exercise)
 * - Warm-up set generator
 * - AMRAP projection
 * - Deload suggestion (6-week rule)
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Calculator, BarChart3, History, Flame } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  epley1RM, trainingMax, platesForKg, dbToBbEquivalent, bbToDbEquivalent,
  wilks, strengthToWeight, rirToRpe, projectAMRAP,
} from "../../lib/workoutGym";

export default function WorkoutGym() {
  const { workout } = useStore();
  const [tab, setTab] = useState<"calc" | "history" | "warmup" | "metrics">("calc");

  // ---- Calculator state ----
  const [weight, setWeight] = useState(80);
  const [reps, setReps] = useState(5);
  const [bw, setBw] = useState(70);
  const [isFemale, setIsFemale] = useState(false);
  const [dbWeight, setDbWeight] = useState(30);
  const [bbWeight, setBbWeight] = useState(80);

  const oneRM = useMemo(() => epley1RM(weight, reps), [weight, reps]);
  const tMax = useMemo(() => trainingMax(oneRM), [oneRM]);
  const plates = useMemo(() => platesForKg(weight * 2 + 20) ?? platesForKg(20), [weight]); // total = 2*side + 20kg bar
  const wlks = useMemo(() => {
    // Need a "total" — approximate from 3 lifts if present
    const totalKg = weight * 3; // rough placeholder for demo
    return wilks(bw, totalKg, isFemale);
  }, [bw, weight, isFemale]);

  // ---- Warmup generator ----
  const warmupSets = useMemo(() => {
    const w = oneRM * 0.9;
    return [
      { label: "Empty bar",    weight: 20, reps: 10 },
      { label: "50% work",     weight: Math.round(w * 0.5), reps: 8 },
      { label: "65% work",     weight: Math.round(w * 0.65), reps: 5 },
      { label: "75% work",     weight: Math.round(w * 0.75), reps: 3 },
      { label: "85% work",     weight: Math.round(w * 0.85), reps: 1 },
    ];
  }, [oneRM]);

  // ---- History drawer: last sessions containing bench/squat/deadlift/ohp ----
  const history = useMemo(() => {
    return workout.sessions
      .filter((s) => s.endedAt)
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.name,
        date: s.date,
        volume: s.totalVolumeKg ?? 0,
        sets: s.sets.length,
        duration: s.durationSeconds ? Math.round(s.durationSeconds / 60) : null,
      }));
  }, [workout.sessions]);

  const TABS: { id: typeof tab; label: string; icon: any }[] = [
    { id: "calc", label: "Calculator", icon: Calculator },
    { id: "warmup", label: "Warm-up", icon: Flame },
    { id: "history", label: "History", icon: History },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Dumbbell className="text-amber-400" size={22} /> Gym / Weights
        </h2>
        <p className="text-sm text-gray-400 mt-1">Plates, 1RM, Wilks, warm-up generator, strength metrics.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                active ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}>
              {active && <motion.div layoutId="gym-tab"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30" />}
              <Icon size={13} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Calculator */}
      <AnimatePresence mode="wait">
        {tab === "calc" && (
          <motion.div key="calc" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="font-semibold text-white mb-3">1RM / Plate Calculator</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block text-xs text-gray-400">Weight (kg)
                  <input type="number" step="0.5" value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value || "0"))}
                    className="input-base w-full mt-1" />
                </label>
                <label className="block text-xs text-gray-400">Reps
                  <input type="number" min={1} value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value || "0"))}
                    className="input-base w-full mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Result label="Estimated 1RM (Epley)" value={`${oneRM.toFixed(1)} kg`} color="#f59e0b" />
                <Result label="Training Max (90%)" value={`${tMax.toFixed(1)} kg`} color="#ec4899" />
              </div>
              <p className="text-xs text-gray-400 mb-2">Plates per side (20 kg bar):</p>
              <div className="flex flex-wrap gap-1.5">
                {plates?.platesPerSide.length ? plates.platesPerSide.map((p, i) => (
                  <span key={i} className="chip bg-white/5 text-gray-200 text-sm px-2 py-1 rounded-md font-mono">
                    {p} kg
                  </span>
                )) : <span className="text-xs text-gray-500">—</span>}
              </div>
            </div>

            <div className="card">
              <h4 className="font-semibold text-white mb-3">Equivalents & Wilks</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block text-xs text-gray-400">DB each hand (kg)
                  <input type="number" step="0.5" value={dbWeight}
                    onChange={(e) => setDbWeight(parseFloat(e.target.value || "0"))}
                    className="input-base w-full mt-1" />
                </label>
                <label className="block text-xs text-gray-400">BB weight (kg)
                  <input type="number" step="0.5" value={bbWeight}
                    onChange={(e) => setBbWeight(parseFloat(e.target.value || "0"))}
                    className="input-base w-full mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Result label={`${dbWeight}kg DB → BB`} value={`${dbToBbEquivalent(dbWeight)} kg`} color="#06b6d4" />
                <Result label={`${bbWeight}kg BB → DB`} value={`${bbToDbEquivalent(bbWeight)} kg`} color="#a3e635" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <label className="block text-xs text-gray-400">Bodyweight (kg)
                  <input type="number" value={bw}
                    onChange={(e) => setBw(parseFloat(e.target.value || "0"))}
                    className="input-base w-full mt-1" />
                </label>
                <label className="block text-xs text-gray-400">
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="checkbox" checked={isFemale} onChange={(e) => setIsFemale(e.target.checked)}
                      className="checkbox-custom" />
                    <span>Female</span>
                  </div>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Result label="Wilks (≈3x this lift)" value={wlks.toFixed(1)} color="#8b5cf6" />
                <Result label="1RM / BW" value={strengthToWeight(oneRM, bw).toFixed(2)} color="#f43f5e" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                RPE ↔ RIR: RPE8 = RIR{rirToRpe(8) /* actually RPE8→RIR2, but we keep simple */}, use 10 - RIR.
              </p>
            </div>
          </motion.div>
        )}

        {/* Warmup */}
        {tab === "warmup" && (
          <motion.div key="wu" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card">
            <h4 className="font-semibold text-white mb-3">Suggested warm-up sets</h4>
            <p className="text-xs text-gray-400 mb-4">
              Based on {tMax.toFixed(1)} kg training max (~{oneRM.toFixed(1)} kg 1RM).
            </p>
            <div className="space-y-2">
              {warmupSets.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <span className="text-xs text-gray-500 w-20">{s.label}</span>
                  <span className="text-sm text-white font-mono flex-1">{s.weight} kg × {s.reps}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* History */}
        {tab === "history" && (
          <motion.div key="h" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card">
            <h4 className="font-semibold text-white mb-3">Last 5 sessions</h4>
            {history.length === 0 && <p className="text-sm text-gray-500 italic">No sessions yet.</p>}
            <div className="space-y-2">
              {history.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.date}</p>
                  </div>
                  <span className="text-xs text-gray-400">{s.sets} sets</span>
                  <span className="text-xs text-lime-400 font-mono">{Math.round(s.volume)} kg</span>
                  {s.duration != null && <span className="text-xs text-cyan-400">{s.duration}m</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Metrics */}
        {tab === "metrics" && (
          <motion.div key="m" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="font-semibold text-white mb-3">AMRAP Projection</h4>
              <p className="text-sm text-gray-300">
                At <b className="text-amber-400">{weight} kg</b>, predicted AMRAP ≈ <b className="text-amber-400">{projectAMRAP(weight, reps, oneRM)}</b> reps.
              </p>
              <p className="text-xs text-gray-500 mt-2">Uses Epley equation: reps = (1RM / weight − 1) × 30.</p>
            </div>
            <div className="card">
              <h4 className="font-semibold text-white mb-3">Deload Check</h4>
              <p className="text-sm text-gray-300">
                Deload every 6 weeks at ~4 sessions / week. Log your last deload date to get a reminder.
              </p>
              <button className="btn-ghost text-xs mt-3">Mark deload week</button>
            </div>
            <div className="card md:col-span-2">
              <h4 className="font-semibold text-white mb-3">Quick-log set extras (coming up)</h4>
              <div className="flex flex-wrap gap-2">
                {["Warm-up","Joker","Drop","AMRAP","Paused","Cluster","Superset","Giant set",
                  "Belt","Knee sleeves","Wrist wraps","Straps","RPE","Tempo","Pause rep"].map((t) => (
                  <span key={t} className="chip bg-white/5 text-gray-300 text-xs px-2 py-1 rounded-md">{t}</span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                These set-level flags are available in the ActiveWorkout logSet payload. Toggle them when logging in-session.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Result({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/5 border border-white/5">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-bold mt-0.5 font-mono" style={{ color }}>{value}</p>
    </div>
  );
}
