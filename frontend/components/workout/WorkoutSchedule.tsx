"use client";

/**
 * WorkoutSchedule — routines/schedules + an in-session set timer.
 *
 * - Routines are named workouts (e.g. Push Day, Leg Day, Cardio) optionally
 *   assigned to a day of the week. Each routine contains an ordered list of blocks
 *   (exercises or rest periods) with sets × reps × rest.
 * - Blocks can be strength/cardio/rest; cardio/rest use seconds as the unit
 *   (treated as duration), strength uses reps.
 * - "Start workout" launches an active session with a per-set timer: press
 *   "Start set" to begin timing, "Done" logs the set (auto-captures duration for
 *   timed sets or wall-time for strength), then counts down rest. Finish saves
 *   the session to history.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, Trash2, Play, Pause, Square, Check, X, Dumbbell, Timer as TimerIcon,
  Coffee, ChevronDown, Edit3,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { formatWorkoutValue, MUSCLE_GROUPS } from "../../lib/types";
import type { WorkoutBlock, WorkoutBlockType } from "../../lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type BlockDraft = { exerciseId: string; label: string; type: WorkoutBlockType; sets: number; reps: number; restSeconds: number };

export default function WorkoutSchedule() {
  const { workout, addRoutine, deleteRoutine, addBlock, updateBlock, deleteBlock, startSession, logSet, finishSession, discardSession } = useStore();
  const { routines, exercises, sessions, activeSessionId } = workout;

  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineDay, setNewRoutineDay] = useState<number | undefined>(undefined);
  const [addingBlockFor, setAddingBlockFor] = useState<string | null>(null);

  // Active session UI state
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [currentSetNum, setCurrentSetNum] = useState(1);
  const [setRunning, setSetRunning] = useState(false);
  const [setStart, setSetStart] = useState<number | null>(null);
  const [setElapsed, setSetElapsed] = useState(0);
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [loggedValue, setLoggedValue] = useState("");
  const [loggedWeight, setLoggedWeight] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // If there's an active session, resume at the first uncompleted block
  useEffect(() => {
    if (activeSession) {
      const routine = routines.find((r) => r.id === activeSession.routineId);
      if (routine) {
        // Find first incomplete block/set
        let bi = 0, si = 1;
        outer: for (let i = 0; i < routine.blocks.length; i++) {
          for (let s = 1; s <= routine.blocks[i].sets; s++) {
            const done = activeSession.sets.find((x) => x.blockId === routine.blocks[i].id && x.setIndex === s);
            if (!done || !done.completed) { bi = i; si = s; break outer; }
          }
        }
        setCurrentBlockIdx(bi);
        setCurrentSetNum(si);
      }
    }
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-set ticking timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (setRunning || resting) {
      intervalRef.current = setInterval(() => {
        if (resting) {
          setRestRemaining((r) => Math.max(0, r - 1));
        } else if (setStart) {
          setSetElapsed(Math.floor((Date.now() - setStart) / 1000));
        }
      }, 250);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [setRunning, resting, setStart]);

  const routine = activeSession ? routines.find((r) => r.id === activeSession.routineId) : null;
  const currentBlock: WorkoutBlock | null = routine ? routine.blocks[currentBlockIdx] ?? null : null;
  const currentExercise = currentBlock?.exerciseId ? exercises.find((e) => e.id === currentBlock.exerciseId) : null;

  const startWorkout = (routineId: string) => {
    const r = routines.find((x) => x.id === routineId);
    if (!r) return;
    startSession(r.name, routineId);
    setCurrentBlockIdx(0); setCurrentSetNum(1);
    setSetRunning(false); setSetStart(null); setSetElapsed(0); setResting(false);
  };

  const handleStartSet = () => {
    if (!currentBlock) return;
    if (currentBlock.type === "cardio" || currentBlock.type === "rest") {
      setSetStart(Date.now());
      setSetRunning(true);
      setResting(false);
    } else {
      // Strength set — wall clock starts but user will enter reps/weight
      setSetStart(Date.now());
      setSetRunning(true);
    }
  };

  const handleDoneSet = () => {
    if (!activeSession || !currentBlock) return;
    let value = 0;
    let weight: number | undefined;
    if (currentBlock.type === "cardio" || currentBlock.type === "rest") {
      value = setElapsed || currentBlock.reps;
    } else {
      const v = parseFloat(loggedValue);
      if (isNaN(v) || v <= 0) { alert("Enter reps/value for this set"); return; }
      value = v;
      const w = parseFloat(loggedWeight);
      if (!isNaN(w) && w > 0) weight = w;
    }
    logSet(activeSession.id, {
      blockId: currentBlock.id,
      setIndex: currentSetNum,
      value,
      weight,
      durationSeconds: setElapsed || undefined,
    });
    // Move to next set/block
    const totalSets = currentBlock.sets;
    const isLastSet = currentSetNum >= totalSets;
    if (isLastSet) {
      // Next block
      const nextIdx = currentBlockIdx + 1;
      if (nextIdx >= (routine?.blocks.length ?? 0)) {
        // Finished routine
        setSetRunning(false); setSetStart(null); setSetElapsed(0); setResting(false);
        setLoggedValue(""); setLoggedWeight("");
        finishSession(activeSession.id);
        return;
      }
      setCurrentBlockIdx(nextIdx); setCurrentSetNum(1);
    } else {
      setCurrentSetNum((n) => n + 1);
    }
    // Rest countdown
    if (currentBlock.restSeconds > 0) {
      setResting(true);
      setRestRemaining(currentBlock.restSeconds);
      setSetRunning(false); setSetStart(null); setSetElapsed(0);
    } else {
      setSetRunning(false); setSetStart(null); setSetElapsed(0);
    }
    setLoggedValue(""); setLoggedWeight("");
  };

  const skipRest = () => { setResting(false); setRestRemaining(0); };

  const endSession = () => {
    if (!activeSession) return;
    if (confirm("Finish this workout and save it?")) finishSession(activeSession.id);
    else if (confirm("Discard this workout without saving?")) discardSession(activeSession.id);
    setSetRunning(false); setSetStart(null); setSetElapsed(0); setResting(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Sort routines by day-of-week for nicer display
  const sorted = [...routines].sort((a, b) => {
    const ad = a.dayOfWeek ?? 99, bd = b.dayOfWeek ?? 99;
    return ad - bd;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="text-cyan-500" size={22} /> Schedule
        </h2>
        <p className="text-sm text-gray-500 mt-1">Build workout routines, assign them to days, and run them with a live set timer.</p>
      </div>

      {/* Active session overlay */}
      <AnimatePresence>
        {activeSession && currentBlock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-3xl p-6 glass border-2 border-accent/40 shadow-lg shadow-accent/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent font-semibold">Now working out</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeSession.name}</h3>
              </div>
              <button onClick={endSession} className="btn-ghost text-sm flex items-center gap-1 text-red-500">
                <Square size={14} /> End
              </button>
            </div>

            <div className="rounded-2xl p-6 bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: currentExercise
                      ? `${MUSCLE_GROUPS.find((m) => m.id === currentExercise.muscleGroup)?.color ?? "#8b5cf6"}20`
                      : "rgba(236,72,153,0.15)",
                  }}>
                  {currentBlock.type === "rest"
                    ? <Coffee className="text-pink-500" size={22} />
                    : <Dumbbell size={22} style={{ color: MUSCLE_GROUPS.find((m) => m.id === currentExercise?.muscleGroup)?.color ?? "#8b5cf6" }} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white">
                    {currentExercise?.name ?? currentBlock.label ?? "Block"}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Set {currentSetNum} of {currentBlock.sets}
                    {currentBlock.type !== "rest" && <> · {currentBlock.reps} {currentExercise?.unit === "kg" ? "reps" : currentExercise?.unit === "seconds" ? "seconds" : "reps"}</>}
                  </p>
                </div>
              </div>

              {/* Timer display */}
              <div className="text-center my-6">
                {resting ? (
                  <>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Rest</p>
                    <p className="text-6xl font-bold font-mono text-cyan-500">{fmt(restRemaining)}</p>
                    <button onClick={skipRest} className="mt-3 text-xs text-accent hover:text-accent-cyan">Skip rest</button>
                  </>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                      {setRunning ? (currentBlock.type === "strength" ? "Set in progress" : "Timing...") : "Ready"}
                    </p>
                    <p className="text-6xl font-bold font-mono text-gray-900 dark:text-white">{fmt(setElapsed)}</p>
                  </>
                )}
              </div>

              {/* Inputs for strength sets */}
              {!resting && currentBlock.type === "strength" && (
                <div className="flex gap-2 max-w-sm mx-auto mb-4">
                  {currentExercise?.unit === "kg" ? (
                    <>
                      <input
                        type="number" step="any" value={loggedWeight} onChange={(e) => setLoggedWeight(e.target.value)}
                        placeholder="Weight (kg)"
                        className="input-base flex-1 text-center"
                      />
                      <input
                        type="number" value={loggedValue} onChange={(e) => setLoggedValue(e.target.value)}
                        placeholder="Reps"
                        className="input-base flex-1 text-center"
                      />
                    </>
                  ) : (
                    <input
                      type="number" value={loggedValue} onChange={(e) => setLoggedValue(e.target.value)}
                      placeholder={`${currentExercise?.unit === "seconds" ? "Seconds" : "Reps"}`}
                      className="input-base flex-1 text-center"
                    />
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center gap-3">
                {!resting && (
                  setRunning ? (
                    <button onClick={handleDoneSet} className="btn-primary flex items-center gap-2 px-8">
                      <Check size={18} /> Done
                    </button>
                  ) : (
                    <button onClick={handleStartSet} className="btn-primary flex items-center gap-2 px-8">
                      <Play size={18} /> Start set
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Remaining blocks preview */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {routine?.blocks.map((b, i) => {
                const ex = b.exerciseId ? exercises.find((e) => e.id === b.exerciseId) : null;
                const done = i < currentBlockIdx;
                const active = i === currentBlockIdx;
                return (
                  <div key={b.id}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                      active ? "bg-accent/20 border-accent/50 text-accent" :
                      done ? "bg-black/5 dark:bg-white/5 border-transparent text-gray-400 line-through" :
                      "bg-transparent border-black/10 dark:border-white/10 text-gray-500"
                    }`}>
                    {ex?.name ?? b.label ?? "Block"} · {b.sets}×{b.reps}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New routine form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!newRoutineName.trim()) return;
        addRoutine(newRoutineName.trim(), newRoutineDay);
        setNewRoutineName(""); setNewRoutineDay(undefined);
      }} className="card flex flex-wrap items-center gap-2">
        <Plus size={18} className="text-gray-500" />
        <input
          value={newRoutineName}
          onChange={(e) => setNewRoutineName(e.target.value)}
          placeholder="New routine (e.g. Pull Day, Morning Cardio)"
          className="flex-1 min-w-[200px] bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        <select
          value={newRoutineDay ?? ""}
          onChange={(e) => setNewRoutineDay(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
          className="input-base py-1.5 text-sm"
        >
          <option value="">No day</option>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <button disabled={!newRoutineName.trim()} className="btn-primary py-1.5 px-4 text-sm">Add</button>
      </form>

      {/* Routines */}
      <div className="space-y-4">
        {sorted.map((r) => (
          <RoutineCard
            key={r.id} routine={r}
            onDelete={() => { if (confirm(`Delete routine "${r.name}"?`)) deleteRoutine(r.id); }}
            onStart={() => startWorkout(r.id)}
            onAddBlock={(b) => addBlock(r.id, b)}
            onUpdateBlock={(bid, patch) => updateBlock(r.id, bid, patch)}
            onDeleteBlock={(bid) => deleteBlock(r.id, bid)}
            isActive={activeSession?.routineId === r.id}
          />
        ))}
        {routines.length === 0 && (
          <div className="rounded-2xl p-10 text-center border border-dashed border-gray-300 dark:border-white/10 text-gray-500 text-sm">
            No routines yet. Add your first one above (e.g. "Push Day" on Monday).
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {sessions.filter((s) => s.endedAt).length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent sessions</h3>
          <div className="space-y-2">
            {sessions.filter((s) => s.endedAt).slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/[0.03] dark:bg-white/5">
                <Check size={18} className="text-lime-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.date} · {s.sets.length} sets · {s.durationSeconds ? fmt(s.durationSeconds) : ""}</p>
                </div>
                {s.totalVolumeKg ? <p className="text-xs text-gray-500">{s.totalVolumeKg} kg vol</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** A single routine card with collapsible block editor */
function RoutineCard({ routine, onDelete, onStart, onAddBlock, onUpdateBlock, onDeleteBlock, isActive }: {
  routine: any;
  onDelete: () => void;
  onStart: () => void;
  onAddBlock: (b: Omit<WorkoutBlock, "id">) => void;
  onUpdateBlock: (bid: string, patch: Partial<WorkoutBlock>) => void;
  onDeleteBlock: (bid: string) => void;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BlockDraft>({ exerciseId: "", label: "", type: "strength", sets: 3, reps: 10, restSeconds: 90 });
  const { workout } = useStore();
  const exercises = workout.exercises;

  return (
    <motion.div layout className="card" style={isActive ? { borderColor: "#8b5cf650" } : undefined}>
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen((o) => !o)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-500">
          <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={16} /></motion.div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{routine.name}</h4>
            {routine.dayOfWeek !== undefined && (
              <span className="chip bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">{DAYS[routine.dayOfWeek]}</span>
            )}
          </div>
          <p className="text-xs text-gray-500">{routine.blocks.length} blocks · {routine.blocks.reduce((n: number, b: any) => n + b.sets, 0)} total sets</p>
        </div>
        <button onClick={onDelete} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition">
          <Trash2 size={14} />
        </button>
        <button onClick={onStart} disabled={isActive} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1 disabled:opacity-50">
          <Play size={14} /> Start
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-2">
              {routine.blocks.map((b: WorkoutBlock, i: number) => {
                const ex = b.exerciseId ? exercises.find((e) => e.id === b.exerciseId) : null;
                return (
                  <div key={b.id} className="group flex items-center gap-2 p-2 rounded-lg bg-black/[0.03] dark:bg-white/5">
                    <span className="w-5 text-[10px] font-bold text-gray-400 text-center">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">
                      {ex?.name ?? b.label ?? (b.type === "rest" ? "Rest" : "Block")}
                    </span>
                    <span className="text-xs text-gray-500">{b.sets}×{b.reps} {b.type === "cardio" || b.type === "rest" ? "s" : ""}</span>
                    <span className="text-xs text-gray-500">· {b.restSeconds}s rest</span>
                    <button onClick={() => onDeleteBlock(b.id)} className="p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}

              {/* Add block form */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as WorkoutBlockType }))}
                    className="input-base py-1.5 text-sm"
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio/Timed</option>
                    <option value="rest">Rest</option>
                  </select>
                  {draft.type !== "rest" ? (
                    <select
                      value={draft.exerciseId}
                      onChange={(e) => setDraft((d) => ({ ...d, exerciseId: e.target.value, label: "" }))}
                      className="input-base py-1.5 text-sm flex-1 min-w-[150px]"
                    >
                      <option value="">Select exercise...</option>
                      {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  ) : (
                    <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                      placeholder="Rest" className="input-base py-1.5 text-sm flex-1 min-w-[150px]" />
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <label className="text-xs flex items-center gap-1 text-gray-500">
                    Sets <input type="number" min={1} value={draft.sets} onChange={(e) => setDraft((d) => ({ ...d, sets: parseInt(e.target.value) || 1 }))}
                      className="input-base w-16 py-1 text-xs text-center ml-1" />
                  </label>
                  <label className="text-xs flex items-center gap-1 text-gray-500">
                    {draft.type === "cardio" || draft.type === "rest" ? "Seconds" : "Reps"}
                    <input type="number" min={1} value={draft.reps} onChange={(e) => setDraft((d) => ({ ...d, reps: parseInt(e.target.value) || 1 }))}
                      className="input-base w-16 py-1 text-xs text-center ml-1" />
                  </label>
                  <label className="text-xs flex items-center gap-1 text-gray-500">
                    Rest (s)
                    <input type="number" min={0} value={draft.restSeconds} onChange={(e) => setDraft((d) => ({ ...d, restSeconds: parseInt(e.target.value) || 0 }))}
                      className="input-base w-20 py-1 text-xs text-center ml-1" />
                  </label>
                  <button
                    onClick={() => {
                      if (draft.type !== "rest" && !draft.exerciseId) return;
                      onAddBlock({
                        type: draft.type,
                        exerciseId: draft.type === "rest" ? undefined : draft.exerciseId,
                        label: draft.type === "rest" ? (draft.label || "Rest") : undefined,
                        sets: draft.sets, reps: draft.reps, restSeconds: draft.restSeconds,
                      });
                      setDraft({ exerciseId: "", label: "", type: "strength", sets: 3, reps: 10, restSeconds: 90 });
                    }}
                    className="btn-primary py-1 px-3 text-xs ml-auto"
                  >
                    <Plus size={12} /> Add block
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
