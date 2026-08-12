"use client";

/**
 * ActiveWorkout — the "golden rule" in-session screen.
 *
 * Design rules (from the checklist):
 *  - One-thumb navigation (all controls reachable while holding a dumbbell)
 *  - Glove Mode: 2x bigger buttons/text, high contrast
 *  - Minimal Mode: only current-exercise, weight/reps goal, timer
 *  - Built-in rest timer with auto-start + audible/visual alert
 *  - "Beat your last" reminder mid-set
 *  - Form cues displayed for the current exercise
 *  - RIR (reps in reserve) quick-select per set
 *  - Warm-up steps shown before first working set
 *  - PR detection — auto-logs PR via store + fires confetti on new best
 *
 * Controlled component: parent passes the active session id; this component
 * reads/writes via useStore().
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Check, SkipForward, Maximize2, Minimize2, Hand, Flame, Trophy, Volume2, VolumeX,
  X, AlertCircle,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { epley1RM, playBeep, suggestProgression } from "../../lib/workoutAnalytics";
import type { WorkoutBlock, WorkoutExercise, StickingPoint, MentalState, CrowdLevel, TrainingPhase } from "../../lib/types";
import Confetti from "./Confetti";
import CelebrationModal from "./CelebrationModal";

interface Props {
  sessionId: string;
  onFinish: () => void;
  onDiscard: () => void;
}

export default function ActiveWorkout({ sessionId, onFinish, onDiscard }: Props) {
  const {
    workout, logSet, logPR, finishSession, discardSession, updateSession,
    getExerciseForBlock, updateWorkoutSettings,
  } = useStore();
  const session = workout.sessions.find((s) => s.id === sessionId);
  const routine = session?.routineId ? workout.routines.find((r) => r.id === session.routineId) : null;

  const settings = workout.settings;
  const glove = settings.gloveMode;
  const minimal = settings.minimalMode;
  const sound = settings.soundEnabled;

  // ---- Derived position: current block/set ----
  const blocks: WorkoutBlock[] = routine?.blocks ?? [];
  const getLogged = (blockId: string, setIdx: number) =>
    session?.sets.find((s) => s.blockId === blockId && s.setIndex === setIdx);

  let currentBlockIdx = 0;
  let currentSetNum = 1;
  let allDone = false;
  if (session) {
    let found = false;
    outer: for (let i = 0; i < blocks.length; i++) {
      for (let s = 1; s <= blocks[i].sets; s++) {
        const lg = getLogged(blocks[i].id, s);
        if (!lg || !lg.completed) {
          currentBlockIdx = i; currentSetNum = s; found = true; break outer;
        }
      }
    }
    allDone = !found;
  }

  const currentBlock = blocks[currentBlockIdx];
  const currentExercise: WorkoutExercise | undefined =
    currentBlock?.exerciseId ? getExerciseForBlock(currentBlock.id) : undefined;

  // ---- Input state (reps/weight/rir + rich per-set metadata) ----
  const prevLogged = currentBlock
    ? session?.sets.filter((s) => s.blockId === currentBlock.id && s.completed) ?? []
    : [];
  const lastLogged = prevLogged[prevLogged.length - 1];

  const defaultReps = useMemo(() => {
    if (currentBlock?.type === "cardio" || currentBlock?.type === "rest") return "0";
    if (lastLogged) return String(lastLogged.value);
    return String(currentBlock?.reps ?? "");
  }, [currentBlock, lastLogged]);
  const defaultWeight = useMemo(() => String(lastLogged?.weight ?? ""), [lastLogged]);

  const [reps, setReps] = useState<string>(defaultReps);
  const [weight, setWeight] = useState<string>(defaultWeight);
  const [rir, setRir] = useState<number | undefined>(undefined);
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  // Per-set flags
  const [isWarmup, setIsWarmup] = useState(false);
  const [isJoker, setIsJoker] = useState(false);
  const [isDrop, setIsDrop] = useState(false);
  const [isAMRAP, setIsAMRAP] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseSec, setPauseSec] = useState(2);
  const [belt, setBelt] = useState(false);
  const [sleeves, setSleeves] = useState(false);
  const [wraps, setWraps] = useState(false);
  const [grip, setGrip] = useState<"overhand"|"underhand"|"mixed"|"hook"|"straps"|"">("");
  const [quality, setQuality] = useState<""|"perfect"|"good"|"decent"|"bad">("");
  const [speed, setSpeed] = useState<""|"fast"|"normal"|"slow"|"grind">("");
  const [feeling, setFeeling] = useState<""|"fast"|"normal"|"slow"|"grind">("");
  const [pain, setPain] = useState(0);
  const [setNote, setSetNote] = useState("");
  // Advanced per-set metadata
  const [barSpin, setBarSpin] = useState(false);
  const [sticking, setSticking] = useState<StickingPoint | "">("");
  const [mental, setMental] = useState<MentalState | "">("");
  const [tempo, setTempo] = useState<string>("");
  const [showMeta, setShowMeta] = useState(false);

  // Post-session joint-pain + RPE check-in
  const [postOpen, setPostOpen] = useState(false);
  const [jointPain, setJointPain] = useState<string[]>([]);
  const [sessionRating, setSessionRating] = useState(7);
  const [sessionNote, setSessionNote] = useState("");
  const [crowd, setCrowd] = useState<CrowdLevel | "">("");
  const [phase, setPhase] = useState<TrainingPhase | "">("");
  // Celebration modals
  const [celebrate, setCelebrate] = useState<{ title: string; subtitle?: string; emoji: string; color: string } | null>(null);

  // Reset inputs when position changes
  useEffect(() => {
    setReps(defaultReps);
    setWeight(defaultWeight);
    setRir(undefined); setRpe(undefined);
    setIsWarmup(false); setIsJoker(false); setIsDrop(false); setIsAMRAP(false);
    setIsPaused(false); setPauseSec(2); setBelt(false); setSleeves(false); setWraps(false);
    setGrip(""); setQuality(""); setSpeed(""); setFeeling(""); setPain(0); setSetNote("");
    setBarSpin(false); setSticking(""); setMental(""); setTempo("");
    setShowMeta(false);
  }, [defaultReps, defaultWeight, currentBlock?.id, currentSetNum]);

  // ---- Timer (set wall-clock + rest) ----
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsedState] = useState(0);
  const [resting, setResting] = useState(false);
  const [restRemain, setRestRemain] = useState(0);
  const setStartRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running || resting) {
      timerRef.current = setInterval(() => {
        if (resting) setRestRemain((r) => Math.max(0, r - 1));
        else if (setStartRef.current) setElapsedState(Math.floor((Date.now() - setStartRef.current) / 1000));
      }, 250);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, resting]);

  // Auto-end rest when countdown hits 0
  useEffect(() => {
    if (resting && restRemain <= 0) {
      setResting(false);
      if (sound) playBeep(880, 500);
    }
  }, [restRemain, resting, sound]);

  // ---- Suggestion ("beat your last") ----
  const suggestion = currentExercise ? suggestProgression(currentExercise, prevLogged) : null;

  // ---- PR detection / confetti ----
  const [showConfetti, setShowConfetti] = useState(false);
  const prFor = currentExercise ? workout.prs.find((p) => p.exerciseId === currentExercise.id) : undefined;

  // Compare candidate (weight × reps for kg, raw value otherwise) against existing PR.
  function isNewPR(newWeight: number | undefined, newReps: number): boolean {
    if (!currentExercise) return false;
    let candidate = 0;
    let existing = 0;
    if (currentExercise.unit === "kg") {
      if (!newWeight || newReps <= 0) return false;
      candidate = epley1RM(newWeight, newReps);
      existing = prFor?.estimated1RM ?? prFor?.value ?? 0;
    } else {
      // For reps/seconds/meters, more is better
      candidate = newReps;
      existing = prFor?.value ?? 0;
    }
    return candidate > existing;
  }

  function handleStartSet() {
    setStartRef.current = Date.now();
    setElapsedState(0);
    setRunning(true);
    setResting(false);
  }

  function handleDone() {
    if (!currentBlock || !session) return;
    const isTimed = currentBlock.type === "cardio" || currentBlock.type === "rest";
    const value = isTimed ? elapsed : parseInt(reps || "0", 10);
    const w = currentExercise?.unit === "kg" ? parseFloat(weight || "0") : undefined;
    if (!isTimed && (!value || value <= 0)) return;

    const entry = {
      blockId: currentBlock.id,
      setIndex: currentSetNum,
      value,
      weight: w,
      rir,
      rpe,
      durationSeconds: elapsed || undefined,
      isWarmup, isJoker, isDrop, isAMRAP,
      isPaused, pauseSec: isPaused ? pauseSec : undefined,
      belt, kneeSleeves: sleeves, wristWraps: wraps,
      grip: grip || undefined,
      quality: quality || undefined,
      speed: speed || undefined,
      feeling: feeling || undefined,
      mental: mental || undefined,
      barSpinOk: barSpin || undefined,
      stickingPoint: (sticking as StickingPoint) || undefined,
      tempo: tempo || undefined,
      pain: pain > 0 ? pain : undefined,
      notes: setNote || undefined,
    };
    logSet(sessionId, entry);

    // PR auto-log (skip warmups)
    if (!isWarmup && currentBlock.type !== "rest" && currentExercise && isNewPR(w, value)) {
      if (currentExercise.unit === "kg" && w) logPR(currentExercise.id, w, value, rir, rpe);
      else if (currentExercise.unit !== "kg") logPR(currentExercise.id, value, undefined, rir, rpe);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
      if (sound) { playBeep(1200, 200); setTimeout(() => playBeep(1600, 300), 200); }
      // Fire PR celebration
      const valLabel = currentExercise.unit === "kg" && w
        ? `${w} kg × ${value}`
        : `${value}${currentExercise.unit === "seconds" ? "s" : currentExercise.unit === "meters" ? "m" : ""}`;
      setCelebrate({
        title: "New PR! 🎉",
        subtitle: `${currentExercise.name}: ${valLabel}`,
        emoji: "🏆",
        color: "#f59e0b",
      });
    }

    setRunning(false); setStartRef.current = null; setElapsedState(0);
    setRir(undefined); setRpe(undefined);
    if (currentBlock.restSeconds > 0) {
      setResting(true);
      setRestRemain(currentBlock.restSeconds);
    }
  }

  function handleSkipSet() {
    if (!currentBlock || !session) return;
    const isTimed = currentBlock.type === "cardio" || currentBlock.type === "rest";
    const v = isTimed ? elapsed : parseInt(reps || "0") || 0;
    const w = currentExercise?.unit === "kg" ? parseFloat(weight || "0") : undefined;
    // Mark as skipped (completed: false)
    logSet(sessionId, {
      blockId: currentBlock.id,
      setIndex: currentSetNum,
      value: v, weight: w, rir, durationSeconds: elapsed || undefined,
      completed: false,
    });
    setRunning(false); setStartRef.current = null; setElapsedState(0);
  }

  function handleSkipRest() { setResting(false); setRestRemain(0); }

  function handleFinish() {
    // Show post-session check-in (joint pain, rating, crowd, phase, note)
    setPostOpen(true);
    setPhase(settings.phase ?? "");
  }
  function handleSubmitPost() {
    updateSession(sessionId, {
      rating: sessionRating,
      jointPain: jointPain.length ? jointPain : undefined,
      note: sessionNote || undefined,
      crowdLevel: crowd || undefined,
      phase: phase || undefined,
    });
    finishSession(sessionId);
    setPostOpen(false);
    onFinish();
  }
  function handleDiscardClick() {
    if (confirm("Discard this workout? No sets will be saved.")) {
      discardSession(sessionId);
      onDiscard();
    }
  }
  function toggleJoint(j: string) {
    setJointPain((cur) => cur.includes(j) ? cur.filter((x) => x !== j) : [...cur, j]);
  }

  if (!session) return null;
  const isTimed = currentBlock?.type === "cardio" || currentBlock?.type === "rest";
  const big = glove ? "text-5xl" : "text-3xl";
  const btn = glove ? "h-20 text-xl px-10" : "h-14 text-base px-8";

  // Warm-up card: before first working set of the session.
  const showWarmup = session.sets.length === 0 && currentExercise;

  return (
    <div className="max-w-xl mx-auto">
      <Confetti active={showConfetti} />

      {/* Header */}
      {!minimal && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">In session</p>
            <h2 className="text-2xl font-bold text-white">{session.name}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateWorkoutSettings({ soundEnabled: !sound })}
              className={`p-2 rounded-lg border border-white/10 ${sound ? "bg-white/5 text-gray-300" : "bg-red-500/20 text-red-400"}`}
              title={sound ? "Mute beeps" : "Enable beeps"}>
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button onClick={() => updateWorkoutSettings({ gloveMode: !glove })}
              className={`p-2 rounded-lg border border-white/10 ${glove ? "bg-violet-500/30 text-violet-300" : "bg-white/5 text-gray-400"}`}
              title="Glove mode">
              <Hand size={18} />
            </button>
            <button onClick={() => updateWorkoutSettings({ minimalMode: !minimal })}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400"
              title="Minimal mode">
              {minimal ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button onClick={handleDiscardClick} className="px-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
              End
            </button>
          </div>
        </div>
      )}

      {/* Warm-up card */}
      <AnimatePresence>
        {showWarmup && currentExercise && !minimal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card mb-6 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="text-amber-400" size={18} />
              <h3 className="font-semibold text-amber-300">Warm-up</h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• 3 min light cardio (jumping jacks / row)</li>
              <li>• Dynamic stretches for {currentExercise.name}</li>
              {currentExercise.unit === "kg" && parseFloat(weight || "0") > 0 && (
                <>
                  <li>• 2 × 8 @ 50% working weight ({Math.round(parseFloat(weight) * 0.5)} kg)</li>
                  <li>• 1 × 5 @ 75% working weight ({Math.round(parseFloat(weight) * 0.75)} kg)</li>
                </>
              )}
              <li>• Rest 60s — first working set up next</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All-done screen */}
      {allDone && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-10 glass border border-lime-500/30 text-center mb-6">
          <Trophy className="mx-auto text-amber-400 mb-4" size={48} />
          <h3 className="text-3xl font-bold text-white mb-2">All sets done!</h3>
          <p className="text-gray-400 mb-6">Nice work — hit finish to save the session.</p>
          <button onClick={handleFinish}
            className={`btn-primary ${btn} bg-gradient-to-r from-lime-500 to-emerald-500 hover:shadow-lime-500/30`}>
            <Trophy size={glove ? 24 : 20} /> Finish workout
          </button>
        </motion.div>
      )}

      {/* Current exercise hero */}
      {!allDone && currentBlock && (
        <motion.div key={currentBlock.id + "-" + currentSetNum}
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl p-8 glass border border-white/10 text-center overflow-hidden mb-6"
          style={currentExercise ? { borderColor: "#ec489940" } : undefined}>
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {currentBlock.type === "rest" ? (
            <>
              <p className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Rest</p>
              <p className={`${big} font-bold font-mono text-cyan-300`}>
                {Math.floor(restRemain / 60)}:{String(restRemain % 60).padStart(2, "0")}
              </p>
              <p className="text-sm text-gray-400 mt-3">
                Up next: {blocks[currentBlockIdx + 1]
                  ? (getExerciseForBlock(blocks[currentBlockIdx + 1].id)?.name ?? blocks[currentBlockIdx + 1].label ?? "Next")
                  : "Done!"}
              </p>
              <button onClick={handleSkipRest} className={`btn-primary mt-6 ${btn}`}>Skip rest</button>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                {currentBlock.type === "cardio" ? "Cardio" : "Set"} {currentSetNum} of {currentBlock.sets}
              </p>
              <h3 className={`${glove ? "text-4xl" : "text-3xl"} font-bold text-white mb-2`}>
                {currentExercise?.name ?? currentBlock.label ?? "—"}
              </h3>
              {prFor && currentExercise && (
                <p className="text-xs text-gray-400 mb-4">
                  PR: <span className="text-amber-400 font-semibold">
                    {currentExercise.unit === "kg"
                      ? `${prFor.value} kg × ${prFor.reps ?? "?"}`
                      : `${prFor.value}${currentExercise.unit === "seconds" ? "s" : currentExercise.unit === "meters" ? "m" : ""}`}
                  </span>
                  {prFor.date && <span className="ml-1 opacity-70">({new Date(prFor.date).toLocaleDateString()})</span>}
                </p>
              )}

              {/* Form cues */}
              {currentExercise?.cues && !minimal && (
                <div className="text-xs text-gray-400 mb-4 flex flex-wrap justify-center gap-2">
                  {currentExercise.cues.map((c) => (
                    <span key={c} className="px-2 py-1 rounded-full bg-white/5 border border-white/10">💡 {c}</span>
                  ))}
                </div>
              )}

              {/* Big timer (for timed sets) */}
              {isTimed ? (
                <div className={`${big} font-mono font-bold my-4 ${running ? "text-cyan-300" : "text-white"}`}>
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </div>
              ) : (
                <div className={`grid ${currentExercise?.unit === "kg" ? "grid-cols-2" : "grid-cols-1"} gap-3 my-6`}>
                  {currentExercise?.unit === "kg" && (
                    <BigInput label="Weight (kg)" value={weight} onChange={setWeight} glove={glove} />
                  )}
                  <BigInput label="Reps" value={reps} onChange={setReps} glove={glove} />
                </div>
              )}

              {/* Beat your last */}
              {suggestion && !minimal && !isTimed && (
                <div className="flex items-center justify-center gap-2 text-xs text-violet-300 mb-4">
                  {suggestion.message}
                </div>
              )}

              {/* RIR + RPE */}
              {!isTimed && !minimal && (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mr-1">RIR</span>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => setRir(rir === n ? undefined : n)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                          rir === n ? "bg-gradient-to-br from-violet-500 to-pink-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}>{n}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mr-1">RPE</span>
                    {[6, 7, 8, 9, 10].map((n) => (
                      <button key={n} onClick={() => setRpe(rpe === n ? undefined : n)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                          rpe === n ? "bg-gradient-to-br from-amber-500 to-pink-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}>{n}</button>
                    ))}
                  </div>
                  <button onClick={() => setShowMeta(v => !v)}
                    className="text-[10px] text-gray-500 hover:text-gray-300 underline mt-1">
                    {showMeta ? "Hide set details" : "Set details (belt/grip/warmup/drop…)"}
                  </button>
                  <AnimatePresence>
                    {showMeta && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="w-full space-y-2 overflow-hidden">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {[["warmup", isWarmup, setIsWarmup, "Warmup"],
                            ["joker", isJoker, setIsJoker, "Joker"],
                            ["drop", isDrop, setIsDrop, "Drop"],
                            ["amrap", isAMRAP, setIsAMRAP, "AMRAP"],
                            ["paused", isPaused, setIsPaused, "Paused"]]
                            .map(([key, val, setter, label]: any) => (
                              <button key={key} onClick={() => setter(!val)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold border ${val
                                  ? "border-violet-500/50 bg-violet-500/20 text-violet-200"
                                  : "border-white/10 bg-white/5 text-gray-400"}`}>{label}</button>
                            ))}
                        </div>
                        {isPaused && (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[10px] text-gray-400">Pause (s)</span>
                            {[1, 2, 3, 5].map(n => (
                              <button key={n} onClick={() => setPauseSec(n)}
                                className={`w-7 h-7 rounded text-[10px] font-bold ${pauseSec===n?"bg-cyan-500/30 text-cyan-200":"bg-white/5 text-gray-400"}`}>{n}</button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 justify-center">
                          {[["belt", belt, setBelt, "Belt"],
                            ["sleeves", sleeves, setSleeves, "Knee sleeves"],
                            ["wraps", wraps, setWraps, "Wrist wraps"]]
                            .map(([key, val, setter, label]: any) => (
                              <button key={key} onClick={() => setter(!val)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold border ${val
                                  ? "border-amber-500/50 bg-amber-500/20 text-amber-200"
                                  : "border-white/10 bg-white/5 text-gray-400"}`}>{label}</button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(["overhand","underhand","mixed","hook","straps"] as const).map(g => (
                            <button key={g} onClick={() => setGrip(grip===g?"":g)}
                              className={`px-2 py-1 rounded text-[10px] font-semibold capitalize border ${grip===g
                                ? "border-lime-500/50 bg-lime-500/20 text-lime-200"
                                : "border-white/10 bg-white/5 text-gray-400"}`}>{g}</button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <span className="text-[10px] text-gray-400 mr-1">Speed:</span>
                          {(["fast","normal","slow","grind"] as const).map(s => (
                            <button key={s} onClick={() => setSpeed(speed===s?"":s)}
                              className={`px-2 py-1 rounded text-[10px] capitalize ${speed===s?"bg-pink-500/20 text-pink-200":"bg-white/5 text-gray-400"}`}>{s}</button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <span className="text-[10px] text-gray-400 mr-1">Quality:</span>
                          {(["perfect","good","decent","bad"] as const).map(q => (
                            <button key={q} onClick={() => setQuality(quality===q?"":q)}
                              className={`px-2 py-1 rounded text-[10px] capitalize ${quality===q?"bg-emerald-500/20 text-emerald-200":"bg-white/5 text-gray-400"}`}>{q}</button>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[10px] text-gray-400">Pain</span>
                          {[0,1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => setPain(pain===n?0:n)}
                              className={`w-6 h-6 rounded text-[10px] font-bold ${pain===n?"bg-red-500/30 text-red-200":"bg-white/5 text-gray-400"}`}>{n}</button>
                          ))}
                        </div>

                        {/* --- Advanced: bar spin, sticking point, mental, tempo --- */}
                        <div className="flex flex-wrap gap-1 justify-center pt-1 border-t border-white/5">
                          <button onClick={() => setBarSpin(!barSpin)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold border ${barSpin
                              ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-200"
                              : "border-white/10 bg-white/5 text-gray-400"}`}>Bar spin OK</button>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <span className="text-[10px] text-gray-400 mr-1 self-center">Sticking:</span>
                          {(["none","off-floor","mid-range","lockout","transition"] as StickingPoint[]).map(s => (
                            <button key={s} onClick={() => setSticking(sticking===s?"":s)}
                              className={`px-2 py-1 rounded text-[10px] capitalize ${sticking===s?"bg-orange-500/20 text-orange-200":"bg-white/5 text-gray-400"}`}>{s}</button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <span className="text-[10px] text-gray-400 mr-1 self-center">Mental:</span>
                          {(["locked-in","distracted","anxious","tired"] as MentalState[]).map(m => (
                            <button key={m} onClick={() => setMental(mental===m?"":m)}
                              className={`px-2 py-1 rounded text-[10px] capitalize ${mental===m?"bg-fuchsia-500/20 text-fuchsia-200":"bg-white/5 text-gray-400"}`}>{m}</button>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[10px] text-gray-400">Tempo</span>
                          <input value={tempo} onChange={(e) => setTempo(e.target.value)}
                            placeholder="e.g. 3-1-2-1"
                            className="input-base text-[11px] w-28 py-1 text-center" />
                        </div>
                        {/* --- end advanced --- */}

                        <input value={setNote} onChange={e=>setSetNote(e.target.value)}
                          placeholder="Set note…"
                          className="input-base text-[11px] w-full" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Main button(s) */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {!running ? (
                  <button onClick={handleStartSet}
                    className={`btn-primary ${btn} flex items-center gap-2`}>
                    <Play size={glove ? 24 : 20} /> {isTimed ? "Start" : "Start set"}
                  </button>
                ) : (
                  <button onClick={handleDone}
                    className={`${btn} rounded-xl font-bold flex items-center gap-2 text-white transition-all
                      bg-gradient-to-r from-lime-500 to-emerald-500 hover:brightness-110 shadow-lg shadow-lime-500/30`}>
                    <Check size={glove ? 24 : 20} /> {isTimed ? "Stop" : "Done"}
                  </button>
                )}
                <button onClick={handleSkipSet}
                  title="Skip set"
                  className={`p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 ${glove ? "h-20 w-20" : "h-14 w-14"} flex items-center justify-center`}>
                  <SkipForward size={glove ? 24 : 18} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Up next / progress footer */}
      {!minimal && blocks.length > 0 && !allDone && currentBlock && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-gray-500">Upcoming</p>
            <button onClick={handleFinish}
              className="text-xs font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-1">
              <Trophy size={12} /> Finish workout
            </button>
          </div>
          <div className="space-y-1">
            {blocks.slice(currentBlockIdx, currentBlockIdx + 3).map((b, i) => {
              const ex = b.exerciseId ? getExerciseForBlock(b.id) : null;
              const isCur = i === 0;
              return (
                <div key={b.id} className={`flex items-center gap-3 p-2 rounded-lg ${isCur ? "bg-violet-500/10" : ""}`}>
                  <span className={`text-xs font-bold w-6 ${isCur ? "text-violet-400" : "text-gray-500"}`}>
                    {isCur ? "→" : "·"}
                  </span>
                  <span className={`text-sm flex-1 ${isCur ? "text-white font-semibold" : "text-gray-400"}`}>
                    {ex?.name ?? b.label ?? "Block"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {b.sets}×{b.reps}{b.type === "cardio" ? "s" : b.type === "rest" ? " rest" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Minimal mode quick-finish */}
      {minimal && !allDone && (
        <button onClick={handleFinish} className="w-full btn-ghost mt-4">Finish workout</button>
      )}

      {/* PR celebration */}
      <CelebrationModal
        open={!!celebrate}
        title={celebrate?.title ?? ""}
        subtitle={celebrate?.subtitle}
        emoji={celebrate?.emoji}
        color={celebrate?.color}
        onClose={() => setCelebrate(null)} />

      {/* Post-session check-in */}
      <AnimatePresence>
        {postOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg glass rounded-2xl p-6 border border-lime-500/30 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center">
                  <Trophy className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Great session!</h3>
                  <p className="text-xs text-gray-400">Quick check-in before we save</p>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">How'd it feel? <span className="text-white font-mono ml-1">{sessionRating}/10</span></p>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button key={n} onClick={() => setSessionRating(n)}
                      className={`flex-1 h-9 rounded-lg text-xs font-bold transition ${sessionRating >= n
                        ? "bg-gradient-to-t from-pink-500 to-amber-400 text-white"
                        : "bg-white/5 text-gray-500 hover:bg-white/10"}`}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Joint pain */}
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1">
                  <AlertCircle size={11} className="text-red-400" /> Any joint pain?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["none","shoulders","elbows","wrists","neck","upper back","lower back","hips","knees","ankles","shins"].map((j) => (
                    <button key={j} onClick={() => {
                      if (j === "none") setJointPain([]);
                      else { toggleJoint(j); setJointPain(p => p.filter(x => x !== "none")); }
                    }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] capitalize border transition ${
                        (j==="none" && jointPain.length===0) || jointPain.includes(j)
                          ? "bg-red-500/20 text-red-200 border-red-500/40"
                          : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                      }`}>{j}</button>
                  ))}
                </div>
              </div>

              {/* Crowd + phase */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Crowd</p>
                  <select value={crowd} onChange={(e) => setCrowd(e.target.value as CrowdLevel | "")}
                    className="input-base w-full text-sm">
                    <option value="">—</option>
                    <option value="empty">Empty</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="packed">Packed</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Phase</p>
                  <select value={phase} onChange={(e) => setPhase(e.target.value as TrainingPhase | "")}
                    className="input-base w-full text-sm">
                    <option value="">—</option>
                    <option value="bulking">Bulking</option>
                    <option value="cutting">Cutting</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="deload">Deload</option>
                    <option value="peak">Peak</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <textarea value={sessionNote} onChange={(e) => setSessionNote(e.target.value)}
                placeholder="Notes for future you (how it felt, PRs, what sucked, what's next)..."
                className="input-base w-full h-24 resize-none text-sm mb-4" />

              <div className="flex gap-2 justify-end">
                <button onClick={() => { finishSession(sessionId); setPostOpen(false); onFinish(); }}
                  className="btn-ghost text-xs">Skip</button>
                <button onClick={handleSubmitPost}
                  className="btn-primary text-sm !bg-gradient-to-r !from-lime-500 !to-emerald-500">
                  Save workout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BigInput({ label, value, onChange, glove }: {
  label: string; value: string; onChange: (v: string) => void; glove?: boolean;
}) {
  return (
    <label className="block">
      <span className={`block ${glove ? "text-sm" : "text-xs"} uppercase tracking-widest text-gray-400 mb-1`}>{label}</span>
      <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full ${glove ? "text-5xl py-4" : "text-4xl py-3"} text-center font-mono font-bold bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-violet-500/50`} />
    </label>
  );
}

