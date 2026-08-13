"use client";

/**
 * WorkoutSchedule — routines/schedules builder.
 *
 * - Routines are named workouts (e.g. Push Day, Leg Day, Cardio) optionally
 *   assigned to a day of the week. Each routine contains an ordered list of
 *   blocks (exercises or rest periods) with sets × reps × rest.
 * - Blocks can be strength/cardio/rest; cardio/rest use seconds; strength uses reps.
 * - "Start workout" fires `startSession(...)` which switches the page into the
 *   ActiveWorkout one-thumb session screen (the parent page renders it when
 *   `workout.activeSessionId` is set, in place of the tabbed view).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, Trash2, Play, X, Dumbbell, Coffee, ChevronDown, Target,
  Link2, ArrowUp, ArrowDown,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { MUSCLE_GROUPS } from "../../lib/types";
import type { WorkoutBlock, WorkoutBlockType } from "../../lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type BlockDraft = {
  exerciseId: string;
  label: string;
  type: WorkoutBlockType;
  sets: number;
  reps: number;
  restSeconds: number;
};

export default function WorkoutSchedule() {
  const { workout, addRoutine, deleteRoutine, addBlock, updateBlock, deleteBlock, reorderBlocks, startSession, addProgram, updateProgram, deleteProgram, updateSession } = useStore();
  const { routines, exercises, activeSessionId, programs, sessions } = workout;

  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineDay, setNewRoutineDay] = useState<number | undefined>(undefined);
  const [newProgName, setNewProgName] = useState("");
  const [newProgWeeks, setNewProgWeeks] = useState(8);
  const [newProgDays, setNewProgDays] = useState(4);

  // Active program = the one currently in progress (most recent startDate), for auto-tagging sessions.
  const activeProgram = useMemo(() => {
    const started = programs.filter((p) => p.startDate);
    if (!started.length) return undefined;
    return [...started].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))[0];
  }, [programs]);

  const startWorkout = (routineId: string) => {
    const r = routines.find((x) => x.id === routineId);
    if (!r) return;
    const today = new Date().toISOString().slice(0, 10);
    const ready = workout.readiness.find((rd) => rd.date === today);
    const sid = startSession(r.name, routineId, ready?.score);
    if (activeProgram) {
      const completed = sessions.filter((s) => s.programId === activeProgram.id && s.endedAt).length;
      // Patch immediately — startSession is synchronous set-state, but React will batch the patch fine
      // because updateSession is also a state-setter call (both operate on the same reducer).
      updateSession(sid, { programId: activeProgram.id, workoutNumberInProgram: completed + 1 });
    }
  };

  // Sort routines by day-of-week for nicer display
  const sorted = [...routines].sort((a, b) => {
    const ad = a.dayOfWeek ?? 99, bd = b.dayOfWeek ?? 99;
    return ad - bd;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Calendar className="text-cyan-400" size={22} /> Schedule
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Build routines, assign them to days, and tap Start to jump into a one-thumb workout.
        </p>
      </div>

      {/* New routine form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newRoutineName.trim()) return;
          addRoutine(newRoutineName.trim(), newRoutineDay);
          setNewRoutineName("");
          setNewRoutineDay(undefined);
        }}
        className="card flex flex-wrap items-center gap-2"
      >
        <Plus size={18} className="text-gray-400" />
        <input
          value={newRoutineName}
          onChange={(e) => setNewRoutineName(e.target.value)}
          placeholder="New routine (e.g. Pull Day, Morning Cardio)"
          className="flex-1 min-w-[200px] bg-transparent outline-none text-gray-100 placeholder:text-gray-500"
        />
        <select
          value={newRoutineDay ?? ""}
          onChange={(e) => setNewRoutineDay(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
          className="input-base py-1.5 text-sm"
        >
          <option value="">No day</option>
          {DAYS.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
        <button disabled={!newRoutineName.trim()} className="btn-primary py-1.5 px-4 text-sm">Add</button>
      </form>

      {/* Active programs */}
      {programs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <Target size={14} /> Programs
          </h3>
          {programs.map((p) => {
            // Workouts completed against this program = sessions whose programId matches AND that have endedAt.
            const completed = sessions.filter((s) => s.programId === p.id && s.endedAt).length;
            const total = p.weeks * p.daysPerWeek;
            const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            const week = Math.min(p.weeks, Math.floor(completed / Math.max(1, p.daysPerWeek)) + 1);
            return (
              <div key={p.id} className="card border-violet-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center shrink-0">
                    <Target size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white">{p.name}</h4>
                      <span className="chip bg-violet-500/20 text-violet-200">Week {week} of {p.weeks}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {completed}/{total} workouts · {p.daysPerWeek} days/week
                      {p.startDate && <span className="ml-2">· started {p.startDate}</span>}
                    </p>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button onClick={() => { if (confirm(`Delete program "${p.name}"?`)) deleteProgram(p.id); }}
                    className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Routines */}
      <div className="space-y-4">
        {sorted.map((r) => (
          <RoutineCard
            key={r.id}
            routine={r}
            onDelete={() => { if (confirm(`Delete routine "${r.name}"?`)) deleteRoutine(r.id); }}
            onStart={() => startWorkout(r.id)}
            onAddBlock={(b) => addBlock(r.id, b)}
            onUpdateBlock={(bid, patch) => updateBlock(r.id, bid, patch)}
            onDeleteBlock={(bid) => deleteBlock(r.id, bid)}
            onReorder={(from, to) => reorderBlocks(r.id, from, to)}
            isActive={activeSessionId !== undefined}
            exercises={exercises}
          />
        ))}
        {routines.length === 0 && (
          <div className="rounded-2xl p-10 text-center border border-dashed border-white/10 text-gray-500 text-sm">
            No routines yet. Add your first one above (e.g. &quot;Push Day&quot; on Monday).
          </div>
        )}
      </div>

      {/* Add program */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newProgName.trim()) return;
          addProgram({
            name: newProgName.trim(),
            weeks: newProgWeeks,
            daysPerWeek: newProgDays,
            routineIds: [],
            startDate: new Date().toISOString().slice(0, 10),
          });
          setNewProgName(""); setNewProgWeeks(8); setNewProgDays(4);
        }}
        className="card flex flex-wrap items-center gap-2 border-dashed"
      >
        <Target size={18} className="text-violet-400" />
        <input value={newProgName} onChange={(e) => setNewProgName(e.target.value)}
          placeholder="New program (e.g. nSuns 5/3/1, 5x5, Starting Strength)"
          className="flex-1 min-w-[200px] bg-transparent outline-none text-gray-100 placeholder:text-gray-500 text-sm" />
        <label className="text-xs text-gray-400 flex items-center gap-1">
          Weeks
          <input type="number" min={1} max={52} value={newProgWeeks}
            onChange={(e) => setNewProgWeeks(parseInt(e.target.value) || 1)}
            className="input-base w-14 py-1 text-xs text-center ml-1" />
        </label>
        <label className="text-xs text-gray-400 flex items-center gap-1">
          Days/wk
          <input type="number" min={1} max={7} value={newProgDays}
            onChange={(e) => setNewProgDays(parseInt(e.target.value) || 1)}
            className="input-base w-12 py-1 text-xs text-center ml-1" />
        </label>
        <button disabled={!newProgName.trim()} className="btn-primary py-1.5 px-4 text-sm">Start program</button>
      </form>
    </div>
  );
}

/** A single routine card with collapsible block editor */
function RoutineCard({ routine, onDelete, onStart, onAddBlock, onUpdateBlock, onDeleteBlock, onReorder, isActive, exercises }: {
  routine: any;
  onDelete: () => void;
  onStart: () => void;
  onAddBlock: (b: Omit<WorkoutBlock, "id">) => void;
  onUpdateBlock: (bid: string, patch: Partial<WorkoutBlock>) => void;
  onDeleteBlock: (bid: string) => void;
  onReorder: (from: number, to: number) => void;
  isActive: boolean;
  exercises: any[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BlockDraft>({
    exerciseId: "", label: "", type: "strength", sets: 3, reps: 10, restSeconds: 90,
  });
  // Superset/giant-set groups: adjacent blocks with matching non-empty supersetGroupId
  // are considered linked (zero-rest transition). We model groups as a string id
  // starting at the first block and toggled via the link button.
  const supersetStartIdx = useMemo(() => {
    const starts = new Set<number>();
    let cur: string | null = null;
    routine.blocks.forEach((b: WorkoutBlock, i: number) => {
      const sid = (b as any).supersetGroupId as string | undefined;
      if (sid && sid !== cur) { starts.add(i); cur = sid; }
      else if (!sid) cur = null;
    });
    return starts;
  }, [routine.blocks]);
  const isGiant = useMemo(() => {
    // giant = group of >=3 blocks
    const counts = new Map<string, number>();
    routine.blocks.forEach((b: any) => {
      if (b.supersetGroupId) counts.set(b.supersetGroupId, (counts.get(b.supersetGroupId) ?? 0) + 1);
    });
    return (id: string) => (counts.get(id) ?? 0) >= 3;
  }, [routine.blocks]);
  function toggleLink(i: number) {
    // Toggle the block after i into i's superset group.
    if (i >= routine.blocks.length - 1) return;
    const a = routine.blocks[i] as any;
    const b = routine.blocks[i + 1] as any;
    const gid = a.supersetGroupId ?? `ss-${a.id}`;
    if (a.supersetGroupId && b.supersetGroupId === a.supersetGroupId) {
      // Break link: remove group from b (and any later blocks with same id only reachable through it)
      onUpdateBlock(b.id, { supersetGroupId: undefined } as any);
      return;
    }
    onUpdateBlock(a.id, { supersetGroupId: gid } as any);
    onUpdateBlock(b.id, { supersetGroupId: gid, restSeconds: 0 } as any);
  }

  return (
    <motion.div layout className="card">
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen((o) => !o)}
          className="p-1 rounded hover:bg-white/10 text-gray-400">
          <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={16} /></motion.div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-white">{routine.name}</h4>
            {routine.dayOfWeek !== undefined && (
              <span className="chip bg-cyan-500/20 text-cyan-300">{DAYS[routine.dayOfWeek]}</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {routine.blocks.length} blocks · {routine.blocks.reduce((n: number, b: any) => n + b.sets, 0)} total sets
          </p>
        </div>
        <button onClick={onDelete}
          className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition">
          <Trash2 size={14} />
        </button>
        <button onClick={onStart} disabled={isActive}
          className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1 disabled:opacity-50">
          <Play size={14} /> Start
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {routine.blocks.map((b: WorkoutBlock, i: number) => {
                const ex = b.exerciseId ? exercises.find((e: any) => e.id === b.exerciseId) : null;
                const color = ex?.muscleGroup
                  ? MUSCLE_GROUPS.find((m) => m.id === ex.muscleGroup)?.color
                  : "#64748b";
                const isLinked = !!(b as any).supersetGroupId;
                const isNextLinked = i < routine.blocks.length - 1
                  && (routine.blocks[i + 1] as any)?.supersetGroupId === (b as any).supersetGroupId
                  && isLinked;
                const giant = isLinked && isGiant((b as any).supersetGroupId!);
                return (
                  <div key={b.id} className="flex items-center gap-2">
                    {/* Superset connector */}
                    {i > 0 && (routine.blocks[i - 1] as any).supersetGroupId === (b as any).supersetGroupId && (b as any).supersetGroupId ? (
                      <span className="w-2 h-2 rounded-full bg-pink-500/60 shrink-0" title="Superset" />
                    ) : (
                      <span className="w-5 text-[10px] font-bold text-gray-500 text-center shrink-0">{i + 1}</span>
                    )}
                    <div className={`group flex items-center gap-2 p-2 rounded-lg flex-1 ${
                      isLinked ? "bg-pink-500/10 border border-pink-500/20" : "bg-white/5"
                    }`}>
                      {ex ? (<span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />) : null}
                      <span className="flex-1 text-sm text-white truncate">
                        {ex?.name ?? b.label ?? (b.type === "rest" ? "Rest" : "Block")}
                      </span>
                      {giant && <span className="chip bg-fuchsia-500/20 text-fuchsia-200 !text-[9px]">GIANT</span>}
                      {isLinked && !giant && <span className="chip bg-pink-500/20 text-pink-200 !text-[9px]">SUPERSET</span>}
                      <span className="text-xs text-gray-400">
                        {b.sets}×{b.reps}{b.type === "cardio" || b.type === "rest" ? "s" : ""}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:inline">· {b.restSeconds}s rest</span>
                      {i > 0 && (
                        <button onClick={() => onReorder(i, i - 1)} title="Move up"
                          className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100">
                          <ArrowUp size={12} />
                        </button>
                      )}
                      {i < routine.blocks.length - 1 && (
                        <>
                          <button onClick={() => toggleLink(i)} title="Link as superset/giant"
                            className={`p-1 rounded opacity-0 group-hover:opacity-100 ${isNextLinked ? "text-pink-300 bg-pink-500/20" : "text-gray-500 hover:text-pink-300 hover:bg-pink-500/10"}`}>
                            <Link2 size={12} />
                          </button>
                          <button onClick={() => onReorder(i, i + 1)} title="Move down"
                            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100">
                            <ArrowDown size={12} />
                          </button>
                        </>
                      )}
                      <button onClick={() => onDeleteBlock(b.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add block form */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <select value={draft.type}
                    onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as WorkoutBlockType }))}
                    className="input-base py-1.5 text-sm">
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio/Timed</option>
                    <option value="rest">Rest</option>
                  </select>
                  {draft.type !== "rest" ? (
                    <select value={draft.exerciseId}
                      onChange={(e) => setDraft((d) => ({ ...d, exerciseId: e.target.value, label: "" }))}
                      className="input-base py-1.5 text-sm flex-1 min-w-[150px]">
                      <option value="">Select exercise...</option>
                      {exercises.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  ) : (
                    <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                      placeholder="Rest" className="input-base py-1.5 text-sm flex-1 min-w-[150px]" />
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <label className="text-xs flex items-center gap-1 text-gray-400">
                    Sets
                    <input type="number" min={1} value={draft.sets}
                      onChange={(e) => setDraft((d) => ({ ...d, sets: parseInt(e.target.value) || 1 }))}
                      className="input-base w-16 py-1 text-xs text-center ml-1" />
                  </label>
                  <label className="text-xs flex items-center gap-1 text-gray-400">
                    {draft.type === "cardio" || draft.type === "rest" ? "Seconds" : "Reps"}
                    <input type="number" min={1} value={draft.reps}
                      onChange={(e) => setDraft((d) => ({ ...d, reps: parseInt(e.target.value) || 1 }))}
                      className="input-base w-16 py-1 text-xs text-center ml-1" />
                  </label>
                  <label className="text-xs flex items-center gap-1 text-gray-400">
                    Rest (s)
                    <input type="number" min={0} value={draft.restSeconds}
                      onChange={(e) => setDraft((d) => ({ ...d, restSeconds: parseInt(e.target.value) || 0 }))}
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
                    className="btn-primary py-1 px-3 text-xs ml-auto flex items-center gap-1"
                  >
                    <Plus size={12} /> Add block
                  </button>
                </div>
                {/* onUpdateBlock reserved for future inline block editing */}
                <input type="hidden" value={routine.id} readOnly />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini icon legend */}
      <div className="hidden">
        <Dumbbell size={0} /><Coffee size={0} />
      </div>
    </motion.div>
  );
}
