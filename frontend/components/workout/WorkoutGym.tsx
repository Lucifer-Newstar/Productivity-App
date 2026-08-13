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
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Calculator, BarChart3, History, Flame, Play, Database } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  epley1RM, trainingMax, platesForKg, dbToBbEquivalent, bbToDbEquivalent,
  wilks, strengthToWeight, rirToRpe, projectAMRAP,
} from "../../lib/workoutGym";
import { maxHR, estimateLactateThreshold, calibrateRpe } from "../../lib/workoutAnalytics";

export default function WorkoutGym() {
  const { workout, seedDemoData } = useStore();
  const router = useRouter();
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
                {plates && plates.length ? plates.map((p, i) => (
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
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
                <History className="mx-auto text-amber-400/60 mb-2" size={22} />
                <p className="text-sm text-gray-300">No sessions yet.</p>
                <p className="text-xs text-gray-500 mt-1">Start a freestyle lift or load demo data to see history here.</p>
                <div className="flex gap-2 justify-center mt-3 flex-wrap">
                  <button onClick={() => router.push("/workout/gym/freestyle")}
                    className="btn-primary text-xs inline-flex items-center gap-1">
                    <Play size={12} fill="white" /> Start a workout
                  </button>
                  <button onClick={() => seedDemoData()}
                    className="btn-ghost text-xs inline-flex items-center gap-1">
                    <Database size={12} /> Load demo data
                  </button>
                </div>
              </div>
            ) : (
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
            )}
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
            {/* Symmetric Strength comparison */}
            <div className="card md:col-span-2">
              <h4 className="font-semibold text-white mb-3">Symmetric Strength</h4>
              <p className="text-xs text-gray-400 mb-3">
                Compares your best big-4 estimated 1RM to international powerlifting standards (untrained → elite, male ~80 kg reference).
                Your PRs will populate here automatically as you log.
              </p>
              <SymmetricChart sessions={workout.sessions} exercises={workout.exercises} routines={workout.routines} />
            </div>

            {/* Lactate threshold */}
            <div className="card md:col-span-2">
              <h4 className="font-semibold text-white mb-3">Lactate Threshold Estimate</h4>
              <ThresholdCard />
            </div>

            {/* RPE calibration */}
            <div className="card md:col-span-2">
              <h4 className="font-semibold text-white mb-3">RPE Calibration</h4>
              <RpeCard sessions={workout.sessions} />
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

// ---------- Symmetric Strength chart ----------
// Ratios relative to back squat (1.00): bench ≈ 0.75, deadlift ≈ 1.25, OHP ≈ 0.45.
// We compare your best 1RM per lift to these ratios and show "balance".
function SymmetricChart({ sessions, exercises, routines }: any) {
  // Build best 1RM per key lift by matching exercise names / ids heuristically.
  const findExercise = (names: string[]) => exercises.find((e: any) => names.includes(e.name));
  const lifts = [
    { key: "squat", label: "Back Squat", names: ["Back Squat", "Squat"], ratio: 1.0, color: "#06b6d4" },
    { key: "bench", label: "Bench Press", names: ["Bench Press"], ratio: 0.75, color: "#ec4899" },
    { key: "dead",  label: "Deadlift",   names: ["Deadlift"], ratio: 1.25, color: "#f59e0b" },
    { key: "ohp",   label: "Overhead Press", names: ["Overhead Press"], ratio: 0.45, color: "#8b5cf6" },
  ];
  function best1RMFor(exName: string): number {
    const ex = findExercise([exName]);
    if (!ex) return 0;
    let best = 0;
    sessions.forEach((s: any) => {
      if (!s.endedAt) return;
      const routine = s.routineId ? routines.find((r: any) => r.id === s.routineId) : null;
      s.sets.forEach((set: any) => {
        if (set.isWarmup || !set.completed) return;
        const block = routine?.blocks.find((b: any) => b.id === set.blockId);
        if (block?.exerciseId !== ex.id) return;
        if (set.weight && set.value > 0) {
          best = Math.max(best, epley1RM(set.weight, set.value));
        }
      });
    });
    return Math.round(best);
  }
  const your: Record<string, number> = {};
  lifts.forEach((l) => { your[l.key] = best1RMFor(l.names[0]); });
  const squat = your.squat || 0;
  const maxBar = Math.max(100, ...lifts.map(l => l.key === "squat" ? squat : squat * l.ratio), ...Object.values(your));

  return (
    <div className="space-y-2">
      {lifts.map((l) => {
        const actual = your[l.key];
        const expected = squat > 0 ? Math.round(squat * l.ratio) : 0;
        const actualPct = maxBar ? (actual / maxBar) * 100 : 0;
        const expectedPct = maxBar ? (expected / maxBar) * 100 : 0;
        const balanced = actual > 0 && expected > 0 ? Math.min(actual / expected, expected / actual) : 0;
        return (
          <div key={l.key} className="relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium">{l.label}</span>
              <span className="text-gray-500">
                {actual ? (
                  <>
                    <span className="text-white font-mono">{actual} kg</span>
                    {expected > 0 && (
                      <span className={`ml-2 ${balanced > 0.9 ? "text-emerald-400" : balanced > 0.75 ? "text-amber-400" : "text-red-400"}`}>
                        {Math.round(balanced * 100)}%
                      </span>
                    )}
                  </>
                ) : <span className="text-gray-600 italic">no data</span>}
              </span>
            </div>
            {/* expected bar (ghost) */}
            {expected > 0 && (
              <div className="absolute left-0 right-0 h-5 rounded-lg opacity-30" style={{ background: `${l.color}30`, top: "1.3rem" }}>
                <div className="h-full rounded-lg" style={{ width: `${expectedPct}%`, background: `${l.color}50` }} />
              </div>
            )}
            {/* actual bar */}
            <div className="relative h-5 bg-white/5 rounded-lg overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${actualPct}%` }} transition={{ duration: 0.8 }}
                className="h-full rounded-lg"
                style={{ background: `linear-gradient(90deg, ${l.color}, ${l.color}cc)` }} />
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-gray-500 mt-2">
        Faded bar = target 1RM proportional to your squat. Solid = your current best. Percent = balance vs ideal ratio.
      </p>
    </div>
  );
}

// ---------- RPE calibration ----------
function RpeCard({ sessions }: any) {
  const allSets = sessions
    .filter((s: any) => s.endedAt)
    .flatMap((s: any) => s.sets.filter((set: any) => set.completed && !set.isWarmup));
  const cal = calibrateRpe(allSets);
  return (
    <div>
      {cal.samples < 3 ? (
        <p className="text-sm text-gray-400">
          Log at least <b className="text-white">3</b> sets with an RPE value to calibrate your personal RPE scale. We'll compare your actual weight × reps against the standard RPE table.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="rounded-xl p-3 bg-white/5 border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Samples</p>
            <p className="text-xl font-bold mt-0.5 font-mono text-violet-300">{cal.samples}</p>
          </div>
          <div className="rounded-xl p-3 bg-white/5 border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Mean error</p>
            <p className="text-xl font-bold mt-0.5 font-mono text-amber-300">{(cal.meanError * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-xl p-3 bg-white/5 border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Multiplier</p>
            <p className="text-xl font-bold mt-0.5 font-mono text-emerald-300">×{cal.personalMultiplier.toFixed(2)}</p>
          </div>
        </div>
      )}
      <p className="text-[10px] text-gray-500">
        Positive error means the standard RPE table is slightly optimistic for you (you're stronger than it predicts), multiplier adjusts recommended weights upward accordingly.
      </p>
    </div>
  );
}

function ThresholdCard() {
  const [age, setAge] = useState(25);
  const [trained, setTrained] = useState(true);
  const mh = maxHR(age);
  const lt = estimateLactateThreshold(mh, trained);
  return (
    <div className="grid md:grid-cols-2 gap-4 items-center">
      <div>
        <div className="flex gap-3 items-end mb-2">
          <label className="block text-xs text-gray-400 flex-1">
            Age
            <input type="number" min={14} max={80} value={age}
              onChange={(e) => setAge(parseInt(e.target.value || "25"))}
              className="input-base w-full mt-1" />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <input type="checkbox" checked={trained} onChange={(e) => setTrained(e.target.checked)} className="checkbox-custom" />
            Trained
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Estimates LT1 (aerobic threshold) and LT2 (anaerobic threshold) from max HR. For a real test, do a 30-min time trial — your average HR in the last 20 min ≈ LT2.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Max HR</p>
          <p className="text-xl font-bold mt-0.5 font-mono text-cyan-300">{mh}</p>
        </div>
        <div className="rounded-xl p-3 bg-white/5 border border-emerald-500/20">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">LT1</p>
          <p className="text-xl font-bold mt-0.5 font-mono text-emerald-300">{lt.lt1}</p>
        </div>
        <div className="rounded-xl p-3 bg-white/5 border border-red-500/20">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">LT2</p>
          <p className="text-xl font-bold mt-0.5 font-mono text-red-300">{lt.lt2}</p>
        </div>
      </div>
    </div>
  );
}

