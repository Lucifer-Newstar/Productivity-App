"use client";

/**
 * FreestyleWorkout — free-form logger used when a session has NO attached routine
 * (i.e. Quick Start).  The user builds their workout on the fly:
 *   1. Pick an exercise from the library (search + muscle/equipment quick filters)
 *   2. Log sets (reps + weight if kg), with rest timer between sets
 *   3. Switch between added exercises at any time; previous sets persist
 *
 * Ad-hoc blocks are kept in component state (blockId prefix `adhoc-<sessionId>-`)
 * and are NOT written back to routines — they're session-only.  Sets are logged
 * through the same `logSet(sessionId, entry)` path routine-driven sessions use,
 * so PR detection, volume tracking, CSV export, and history drawers all "just
 * work" without any store changes.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Play, Check, SkipForward, X, Trophy, Volume2, VolumeX,
  Hand, Maximize2, Minimize2, Flame, Dumbbell, Trash2, Clock,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { epley1RM, playBeep, suggestProgression } from "../../lib/workoutAnalytics";
import type {
  WorkoutBlock, WorkoutExercise, StickingPoint, MentalState, CrowdLevel, TrainingPhase,
  Equipment, MuscleGroup,
} from "../../lib/types";
// asymmetry type imported via type-only below
import { MUSCLE_GROUPS, EQUIPMENT } from "../../lib/types";
import Confetti from "./Confetti";
import CelebrationModal from "./CelebrationModal";
import ExerciseHistoryDrawer from "./ExerciseHistoryDrawer";

interface Props {
  sessionId: string;
  onFinish: () => void;
  onDiscard: () => void;
}

/** Local ad-hoc block type with a counter so we know what "set N" means. */
interface AdHocBlock {
  id: string;
  exerciseId: string;
  setsLogged: number; // number of completed sets so far
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export default function FreestyleWorkout({ sessionId, onFinish, onDiscard }: Props) {
  const {
    workout, logSet, logPR, finishSession, discardSession, updateSession,
    updateWorkoutSettings, addAdHocBlock,
  } = useStore();
  const session = workout.sessions.find((s) => s.id === sessionId);
  const settings = workout.settings;

  const glove = settings.gloveMode;
  const minimal = settings.minimalMode;
  const sound = settings.soundEnabled;

  // ---- Ad-hoc block state (hydrated from session.adHocBlocks so refresh-safe) ----
  const [blocks, setBlocks] = useState<AdHocBlock[]>(() =>
    (session?.adHocBlocks ?? []).map((b) => ({ id: b.id, exerciseId: b.exerciseId!, setsLogged: 0 })),
  );
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  // Open picker on arrival only when there are zero blocks yet.
  const [pickerOpen, setPickerOpen] = useState<boolean>(() => (session?.adHocBlocks?.length ?? 0) === 0);

  // Sync setsLogged from the session's completed sets on mount (so refresh resumes correctly)
  // and pick the current block (last touched or first).
  useEffect(() => {
    if (!session) return;
    setBlocks((bs) => {
      const counts: Record<string, number> = {};
      for (const s of session.sets) if (s.completed) counts[s.blockId] = (counts[s.blockId] ?? 0) + 1;
      return bs.map((b) => ({ ...b, setsLogged: counts[b.id] ?? 0 }));
    });
    if (!currentBlockId && session.adHocBlocks?.length) {
      // Pick the block with the most recent completed set, else first.
      const last = [...session.sets].reverse().find((s) => s.completed);
      setCurrentBlockId(last?.blockId ?? session.adHocBlocks[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");
  const [equipFilter, setEquipFilter] = useState<Equipment | "">("");

  // ---- Input state for the CURRENT set ----
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [rir, setRir] = useState<number | undefined>(undefined);
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [isWarmup, setIsWarmup] = useState(false);

  // ---- Timer ----
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resting, setResting] = useState(false);
  const [restRemain, setRestRemain] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running || resting) {
      timerRef.current = setInterval(() => {
        if (resting) setRestRemain((r) => Math.max(0, r - 1));
        else if (startRef.current) setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 250);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, resting]);

  useEffect(() => {
    if (resting && restRemain <= 0) {
      setResting(false);
      if (sound) playBeep(880, 500);
    }
  }, [restRemain, resting, sound]);

  // ---- Post-session + celebration ----
  const [postOpen, setPostOpen] = useState(false);
  const [jointPain, setJointPain] = useState<string[]>([]);
  const [sessionRating, setSessionRating] = useState(7);
  const [sessionNote, setSessionNote] = useState("");
  const [crowd, setCrowd] = useState<CrowdLevel | "">("");
  const [phase, setPhase] = useState<TrainingPhase | "">("");
  const [celebrate, setCelebrate] = useState<{ title: string; subtitle?: string; emoji: string; color: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [historyFor, setHistoryFor] = useState<WorkoutExercise | null>(null);

  // ---- Derived current exercise ----
  const currentBlock = blocks.find((b) => b.id === currentBlockId) ?? null;
  const currentExercise: WorkoutExercise | undefined = useMemo(
    () => currentBlock ? workout.exercises.find((e) => e.id === currentBlock.exerciseId) : undefined,
    [currentBlock, workout.exercises],
  );

  /** Sets logged against the CURRENT block (in this session). */
  const prevLogged = useMemo(() => {
    if (!currentBlock || !session) return [];
    return session.sets
      .filter((s) => s.blockId === currentBlock.id && s.completed)
      .sort((a, b) => a.setIndex - b.setIndex);
  }, [currentBlock, session]);
  const lastLogged = prevLogged[prevLogged.length - 1];
  const nextSetNum = (currentBlock?.setsLogged ?? 0) + 1;
  const suggestion = currentExercise ? suggestProgression(currentExercise, prevLogged) : null;
  const prFor = currentExercise ? workout.prs.find((p) => p.exerciseId === currentExercise.id) : undefined;

  // Auto-prefill from last set for speed.
  useEffect(() => {
    setReps(lastLogged ? String(lastLogged.value) : "");
    setWeight(lastLogged?.weight != null ? String(lastLogged.weight) : "");
    setRir(undefined); setRpe(undefined); setIsWarmup(false);
  }, [currentBlock?.id, lastLogged?.value, lastLogged?.weight]);

  // ---- Exercise picker filtering ----
  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workout.exercises.filter((e) => {
      if (muscleFilter && e.muscleGroup !== muscleFilter) return false;
      if (equipFilter && e.equipment !== equipFilter) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q);
    }).slice(0, 80);
  }, [workout.exercises, search, muscleFilter, equipFilter]);

  function addExercise(ex: WorkoutExercise) {
    // Re-use an existing block for this exercise if already in the session.
    const existing = blocks.find((b) => b.exerciseId === ex.id);
    if (existing) {
      setCurrentBlockId(existing.id);
      setPickerOpen(false);
      setSearch(""); setMuscleFilter(""); setEquipFilter("");
      return;
    }
    const newBlockId = `adhoc-${sessionId.slice(0, 6)}-${uid()}`;
    const newBlock: AdHocBlock = { id: newBlockId, exerciseId: ex.id, setsLogged: 0 };
    // Persist to session so history/CSV/refresh resolves exercise names.
    addAdHocBlock(sessionId, {
      id: newBlockId, exerciseId: ex.id, type: "strength", sets: 0, reps: 0, restSeconds: settings.restSecondsDefault ?? 90,
    });
    setBlocks((bs) => [...bs, newBlock]);
    setCurrentBlockId(newBlockId);
    setPickerOpen(false);
    setSearch(""); setMuscleFilter(""); setEquipFilter("");
  }

  function removeBlock(bid: string) {
    setBlocks((bs) => {
      const out = bs.filter((b) => b.id !== bid);
      if (currentBlockId === bid) setCurrentBlockId(out[0]?.id ?? null);
      return out;
    });
  }

  function isNewPR(w: number | undefined, v: number): boolean {
    if (!currentExercise) return false;
    if (currentExercise.unit === "kg") {
      if (!w || v <= 0) return false;
      return epley1RM(w, v) > (prFor?.estimated1RM ?? prFor?.value ?? 0);
    }
    return v > (prFor?.value ?? 0);
  }

  function handleStartSet() {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    setResting(false);
  }

  function handleDone() {
    if (!currentBlock || !session || !currentExercise) return;
    const isTimed = currentExercise.unit === "seconds" || currentExercise.unit === "meters";
    const value = isTimed ? Math.max(elapsed, 1) : parseInt(reps || "0", 10);
    const w = currentExercise.unit === "kg" ? parseFloat(weight || "0") : undefined;
    if (!isTimed && (!value || value <= 0)) return;

    const setIndex = nextSetNum;
    logSet(sessionId, {
      blockId: currentBlock.id,
      setIndex,
      value,
      weight: w,
      rir, rpe,
      durationSeconds: elapsed || undefined,
      isWarmup,
      completed: true,
    });

    // Bump local counter for warmups too (so set numbers increment naturally),
    // but only flag a "real" PR for non-warmup working sets.
    setBlocks((bs) => bs.map((b) => b.id === currentBlock.id ? { ...b, setsLogged: b.setsLogged + 1 } : b));

    if (!isWarmup && currentExercise && isNewPR(w, value)) {
      if (currentExercise.unit === "kg" && w) logPR(currentExercise.id, w, value, rir, rpe);
      else if (currentExercise.unit !== "kg") logPR(currentExercise.id, value, undefined, rir, rpe);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
      if (sound) { playBeep(1200, 200); setTimeout(() => playBeep(1600, 300), 200); }
      const label = currentExercise.unit === "kg" && w
        ? `${w} kg × ${value}`
        : `${value}${currentExercise.unit === "seconds" ? "s" : currentExercise.unit === "meters" ? "m" : ""}`;
      setCelebrate({ title: "New PR! 🎉", subtitle: `${currentExercise.name}: ${label}`, emoji: "🏆", color: "#f59e0b" });
    }

    setRunning(false); startRef.current = null; setElapsed(0);
    const rest = settings.restSecondsDefault ?? 90;
    if (rest > 0) { setResting(true); setRestRemain(rest); }
  }

  function handleSkipRest() { setResting(false); setRestRemain(0); }

  function handleFinish() { setPostOpen(true); setPhase(settings.phase ?? ""); }
  function handleSubmitPost() {
    updateSession(sessionId, {
      rating: sessionRating, jointPain: jointPain.length ? jointPain : undefined,
      note: sessionNote || undefined, crowdLevel: crowd || undefined, phase: phase || undefined,
    });
    finishSession(sessionId);
    setPostOpen(false);
    onFinish();
  }
  function handleDiscard() {
    if (confirm("Discard this workout? No sets will be saved.")) {
      discardSession(sessionId);
      onDiscard();
    }
  }
  function toggleJoint(j: string) {
    setJointPain((cur) => cur.includes(j) ? cur.filter((x) => x !== j) : [...cur, j]);
  }

  if (!session) return null;
  const big = glove ? "text-5xl" : "text-3xl";
  const btn = glove ? "h-20 text-xl px-10" : "h-14 text-base px-8";
  const showWarmup = session.sets.length === 0 && currentExercise;
  const totalSets = session.sets.filter((s) => s.completed).length;
  const totalVolume = session.totalVolumeKg ?? 0;

  return (
    <div data-stage="freestyle-workout" className="max-w-xl mx-auto">
      <Confetti active={showConfetti} />

      {/* Header */}
      {!minimal && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Freestyle session</p>
            <h2 className="text-2xl font-bold text-white">{session.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalSets} set{totalSets === 1 ? "" : "s"} logged
              {totalVolume > 0 && <span className="ml-2">· {totalVolume} kg volume</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateWorkoutSettings({ soundEnabled: !sound })}
              className={`p-2 rounded-lg border border-white/10 ${sound ? "bg-white/5 text-gray-300" : "bg-red-500/20 text-red-400"}`}>
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button onClick={() => updateWorkoutSettings({ gloveMode: !glove })}
              className={`p-2 rounded-lg border border-white/10 ${glove ? "bg-violet-500/30 text-violet-300" : "bg-white/5 text-gray-400"}`}
              title="Glove mode">
              <Hand size={18} />
            </button>
            <button onClick={() => updateWorkoutSettings({ minimalMode: !minimal })}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">
              {minimal ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button onClick={handleDiscard} className="px-3 rounded-lg bg-red-500/20 text-red-400 text-sm">End</button>
          </div>
        </div>
      )}

      {/* Warm-up card on first set */}
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

      {/* No exercises yet — show picker full screen */}
      {blocks.length === 0 && (
        <ExercisePicker
          open={true}
          search={search} setSearch={setSearch}
          muscleFilter={muscleFilter} setMuscleFilter={setMuscleFilter}
          equipFilter={equipFilter} setEquipFilter={setEquipFilter}
          exercises={filteredExercises}
          onPick={addExercise}
          onClose={() => { /* can't close when empty */ }}
          emptyState
        />
      )}

      {/* Active exercise hero */}
      {blocks.length > 0 && currentBlock && currentExercise && (
        <motion.div key={currentBlock.id + "-" + nextSetNum}
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl p-8 glass border border-pink-500/30 text-center overflow-hidden mb-6">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {resting ? (
            <>
              <p className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Rest</p>
              <p className={`${big} font-bold font-mono text-cyan-300`}>
                {Math.floor(restRemain / 60)}:{String(restRemain % 60).padStart(2, "0")}
              </p>
              <p className="text-sm text-gray-400 mt-3">Next: {currentExercise.name} — set {nextSetNum}</p>
              <button onClick={handleSkipRest} className={`btn-primary mt-6 ${btn}`}>Skip rest</button>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Set {nextSetNum}</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className={`${glove ? "text-4xl" : "text-3xl"} font-bold text-white`}>{currentExercise.name}</h3>
                <button onClick={() => setHistoryFor(currentExercise)} title="View history"
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-violet-300 hover:border-violet-500/40">
                  <Clock size={14} />
                </button>
              </div>
              {prFor && (
                <p className="text-xs text-gray-400 mb-3">
                  PR: <span className="text-amber-400 font-semibold">
                    {currentExercise.unit === "kg"
                      ? `${prFor.value} kg × ${prFor.reps ?? "?"}`
                      : `${prFor.value}${currentExercise.unit === "seconds" ? "s" : currentExercise.unit === "meters" ? "m" : ""}`}
                  </span>
                </p>
              )}

              {currentExercise.cues && !minimal && (
                <div className="text-xs text-gray-400 mb-3 flex flex-wrap justify-center gap-2">
                  {currentExercise.cues.slice(0, 3).map((c) => (
                    <span key={c} className="px-2 py-1 rounded-full bg-white/5 border border-white/10">💡 {c}</span>
                  ))}
                </div>
              )}

              {currentExercise.unit === "seconds" ? (
                <div className={`${big} font-mono font-bold my-4 ${running ? "text-cyan-300" : "text-white"}`}>
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </div>
              ) : (
                <div className={`grid ${currentExercise.unit === "kg" ? "grid-cols-2" : "grid-cols-1"} gap-3 my-6`}>
                  {currentExercise.unit === "kg" && (
                    <BigInput label="Weight (kg)" value={weight} onChange={setWeight} glove={glove} />
                  )}
                  <BigInput label={currentExercise.unit === "meters" ? "Meters" : "Reps"} value={reps} onChange={setReps} glove={glove} />
                </div>
              )}

              {suggestion && !minimal && currentExercise.unit !== "seconds" && (
                <div className="text-xs text-violet-300 mb-3">{suggestion.message}</div>
              )}

              {!minimal && currentExercise.unit !== "seconds" && (
                <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                  <button onClick={() => setIsWarmup(!isWarmup)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border ${isWarmup
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-200"
                      : "border-white/10 bg-white/5 text-gray-400"}`}>Warmup</button>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button key={n} onClick={() => setRir(rir === n ? undefined : n)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold ${rir === n
                        ? "bg-gradient-to-br from-violet-500 to-pink-500 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>{n}</button>
                  ))}
                  <span className="text-[9px] uppercase tracking-widest text-gray-500 ml-1">RIR</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 mt-4">
                {!running ? (
                  <button onClick={handleStartSet} className={`btn-primary ${btn} flex items-center gap-2`}>
                    <Play size={glove ? 24 : 20} /> {currentExercise.unit === "seconds" ? "Start" : "Start set"}
                  </button>
                ) : (
                  <button onClick={handleDone}
                    className={`${btn} rounded-xl font-bold flex items-center gap-2 text-white transition-all
                      bg-gradient-to-r from-lime-500 to-emerald-500 hover:brightness-110 shadow-lg shadow-lime-500/30`}>
                    <Check size={glove ? 24 : 20} /> {currentExercise.unit === "seconds" ? "Stop" : "Done"}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Exercise list + add */}
      {blocks.length > 0 && !minimal && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-gray-500">Exercises</p>
            <button onClick={() => setPickerOpen(true)}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <Plus size={12} /> Add exercise
            </button>
          </div>
          <div className="space-y-1">
            {blocks.map((b) => {
              const ex = workout.exercises.find((e) => e.id === b.exerciseId);
              const isCur = b.id === currentBlockId;
              return (
                <div key={b.id}
                  className={`flex items-center gap-3 p-2 rounded-lg group ${isCur ? "bg-violet-500/10" : "hover:bg-white/5"} cursor-pointer`}
                  onClick={() => setCurrentBlockId(b.id)}>
                  <Dumbbell size={14} className={isCur ? "text-violet-400" : "text-gray-500"} />
                  <span className={`text-sm flex-1 ${isCur ? "text-white font-semibold" : "text-gray-400"}`}>
                    {ex?.name ?? "Exercise"}
                  </span>
                  <span className="text-xs text-gray-500">{b.setsLogged} set{b.setsLogged === 1 ? "" : "s"}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeBlock(b.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={handleFinish}
            className="mt-4 w-full btn-primary !bg-gradient-to-r !from-lime-500 !to-emerald-500 flex items-center justify-center gap-2">
            <Trophy size={16} /> Finish workout
          </button>
        </div>
      )}

      {minimal && <button onClick={handleFinish} className="w-full btn-ghost mt-4">Finish workout</button>}

      {/* Exercise picker modal */}
      <AnimatePresence>
        {pickerOpen && blocks.length > 0 && (
          <ExercisePicker
            open
            search={search} setSearch={setSearch}
            muscleFilter={muscleFilter} setMuscleFilter={setMuscleFilter}
            equipFilter={equipFilter} setEquipFilter={setEquipFilter}
            exercises={filteredExercises}
            onPick={addExercise}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Per-exercise history */}
      <AnimatePresence>
        {historyFor && <ExerciseHistoryDrawer exercise={historyFor} onClose={() => setHistoryFor(null)} />}
      </AnimatePresence>

      {/* PR celebration */}
      <CelebrationModal open={!!celebrate} title={celebrate?.title ?? ""} subtitle={celebrate?.subtitle}
        emoji={celebrate?.emoji} color={celebrate?.color} onClose={() => setCelebrate(null)} />

      {/* Post-session check-in */}
      <AnimatePresence>
        {postOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
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

              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Any joint pain?</p>
                <div className="flex flex-wrap gap-1.5">
                  {["none","shoulders","elbows","wrists","neck","upper back","lower back","hips","knees","ankles","shins"].map((j) => (
                    <button key={j} onClick={() => {
                      if (j === "none") setJointPain([]);
                      else { toggleJoint(j); setJointPain((p) => p.filter((x) => x !== "none")); }
                    }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] capitalize border transition ${
                        (j === "none" && jointPain.length === 0) || jointPain.includes(j)
                          ? "bg-red-500/20 text-red-200 border-red-500/40"
                          : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                      }`}>{j}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Crowd</p>
                  <select value={crowd} onChange={(e) => setCrowd(e.target.value as CrowdLevel | "")} className="input-base w-full text-sm">
                    <option value="">—</option><option value="empty">Empty</option><option value="light">Light</option>
                    <option value="moderate">Moderate</option><option value="packed">Packed</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Phase</p>
                  <select value={phase} onChange={(e) => setPhase(e.target.value as TrainingPhase | "")} className="input-base w-full text-sm">
                    <option value="">—</option><option value="bulking">Bulking</option><option value="cutting">Cutting</option>
                    <option value="maintenance">Maintenance</option><option value="deload">Deload</option><option value="peak">Peak</option>
                  </select>
                </div>
              </div>

              <textarea value={sessionNote} onChange={(e) => setSessionNote(e.target.value)}
                placeholder="Notes for future you..." className="input-base w-full h-24 resize-none text-sm mb-4" />

              <div className="flex gap-2 justify-end">
                <button onClick={() => { finishSession(sessionId); setPostOpen(false); onFinish(); }}
                  className="btn-ghost text-xs">Skip</button>
                <button onClick={handleSubmitPost}
                  className="btn-primary text-sm !bg-gradient-to-r !from-lime-500 !to-emerald-500">Save workout</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Exercise picker modal ----------------

function ExercisePicker({
  open, search, setSearch, muscleFilter, setMuscleFilter, equipFilter, setEquipFilter,
  exercises, onPick, onClose, emptyState,
}: {
  open: boolean;
  search: string; setSearch: (s: string) => void;
  muscleFilter: MuscleGroup | ""; setMuscleFilter: (m: MuscleGroup | "") => void;
  equipFilter: Equipment | ""; setEquipFilter: (e: Equipment | "") => void;
  exercises: WorkoutExercise[];
  onPick: (ex: WorkoutExercise) => void;
  onClose: () => void;
  emptyState?: boolean;
}) {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={emptyState ? "" : "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"}>
      <motion.div
        initial={emptyState ? { opacity: 0, y: 10 } : { scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`w-full glass rounded-2xl border border-white/10 flex flex-col ${emptyState ? "max-w-xl max-h-[75vh]" : "max-w-2xl max-h-[85vh]"}`}>
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="text-violet-400" size={18} />
              <h3 className="text-lg font-bold text-white">{emptyState ? "Pick your first exercise" : "Add exercise"}</h3>
            </div>
            {!emptyState && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X size={18} /></button>
            )}
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bench, squat, run, plank..."
              className="input-base w-full pl-10 text-sm" />
          </div>
          <div className="flex flex-wrap gap-1">
            {MUSCLE_GROUPS.map((m) => (
              <button key={m.id} onClick={() => setMuscleFilter(muscleFilter === m.id ? "" : m.id)}
                className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${muscleFilter === m.id
                  ? "border-white/20 text-white"
                  : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"}`}
                style={muscleFilter === m.id ? { backgroundColor: m.color + "30", borderColor: m.color + "60" } : undefined}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {EQUIPMENT.map((eq) => (
              <button key={eq.id} onClick={() => setEquipFilter(equipFilter === eq.id ? "" : eq.id)}
                className={`px-2 py-0.5 rounded-full text-[10px] border ${equipFilter === eq.id
                  ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-200"
                  : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"}`}>{eq.label}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-2 flex-1">
          {exercises.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">No exercises match those filters.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {exercises.map((ex) => {
                const mg = MUSCLE_GROUPS.find((m) => m.id === ex.muscleGroup);
                return (
                  <button key={ex.id} onClick={() => onPick(ex)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 text-left group">
                    <div>
                      <p className="text-sm text-white group-hover:text-violet-300 font-medium">{ex.name}</p>
                      <p className="text-[10px] text-gray-500 capitalize">
                        {ex.equipment ?? "bodyweight"} · {ex.unit}
                      </p>
                    </div>
                    {mg && <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded"
                      style={{ color: mg.color, backgroundColor: mg.color + "20" }}>{mg.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
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
