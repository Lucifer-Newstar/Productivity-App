"use client";

/**
 * WorkoutExercises — exercise library with unit-aware quick logger.
 *
 * - Add new exercises with a name, unit (reps/seconds/meters/kg), and muscle group.
 * - Cardio exercises are tagged cardio and use seconds/meters; strength uses reps/kg.
 * - Each card shows the current PR (pulled from the PRs slice) and has a quick "log set"
 *   input that also updates the PR if the logged number is a new best.
 * - Supports filter by muscle group and by unit type.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Plus, Search, Trash2, X } from "lucide-react";
import { useStore } from "../../lib/store";
import { MUSCLE_GROUPS, EQUIPMENT, LEVELS, formatWorkoutValue } from "../../lib/types";
import type { WorkoutUnit, MuscleGroup, Equipment, Level } from "../../lib/types";

const UNITS: { id: WorkoutUnit; label: string }[] = [
  { id: "reps",    label: "Reps" },
  { id: "seconds", label: "Seconds (timed)" },
  { id: "meters",  label: "Meters (distance)" },
  { id: "kg",      label: "kg (weight)" },
];

export default function WorkoutExercises() {
  const { workout, addExercise, deleteExercise, logPR } = useStore();
  const { exercises, prs } = workout;
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<WorkoutUnit>("reps");
  const [muscle, setMuscle] = useState<MuscleGroup>("chest");
  const [equipment, setEquipment] = useState<Equipment>("bodyweight");
  const [level, setLevel] = useState<Level>("beginner");
  const [cuesText, setCuesText] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [equipFilter, setEquipFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  // Quick-log inputs keyed by exerciseId
  const [logValue, setLogValue] = useState<Record<string, string>>({});
  const [logReps, setLogReps] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (filter !== "all" && e.muscleGroup !== filter) return false;
      if (equipFilter !== "all" && e.equipment !== equipFilter) return false;
      if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [exercises, filter, equipFilter, q]);

  const getPR = (eid: string) => prs.find((p) => p.exerciseId === eid);

  const submit = () => {
    if (!name.trim()) return;
    const cues = cuesText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    addExercise({
      name: name.trim(),
      unit,
      muscleGroup: muscle,
      equipment,
      level,
      cues: cues.length ? cues : undefined,
    });
    setName(""); setUnit("reps"); setCuesText("");
    setEquipment("bodyweight"); setLevel("beginner");
    setShowNew(false);
  };

  const quickLog = (eid: string) => {
    const ex = exercises.find((e) => e.id === eid);
    if (!ex) return;
    const v = parseFloat(logValue[eid] ?? "");
    if (isNaN(v) || v <= 0) return;
    const r = (ex.unit === "kg" && logReps[eid]) ? parseInt(logReps[eid], 10) : undefined;
    logPR(eid, v, r);
    setLogValue((s) => ({ ...s, [eid]: "" }));
    setLogReps((s) => ({ ...s, [eid]: "" }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="text-pink-500" size={22} /> Exercises
          </h2>
          <p className="text-sm text-gray-500 mt-1">Your exercise library — pick the unit that matches the movement.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> New exercise
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="input-base pl-9 w-full" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`chip cursor-pointer ${filter === "all" ? "bg-white text-gray-900" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >All muscles</button>
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m.id}
              onClick={() => setFilter(m.id)}
              className="chip cursor-pointer transition"
              style={filter === m.id ? { background: m.color, color: "white" } : { background: `${m.color}20`, color: m.color }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setEquipFilter("all")}
            className={`chip cursor-pointer ${equipFilter === "all" ? "bg-white text-gray-900" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >Any equipment</button>
          {EQUIPMENT.map((eq) => (
            <button key={eq.id} onClick={() => setEquipFilter(eq.id)}
              className={`chip cursor-pointer transition ${equipFilter === eq.id ? "bg-violet-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
              {eq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence initial={false}>
          {filtered.map((ex) => {
            const mg = ex.muscleGroup ? MUSCLE_GROUPS.find((m) => m.id === ex.muscleGroup) : null;
            const pr = getPR(ex.id);
            return (
              <motion.div
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card group"
                style={{ borderColor: `${mg?.color ?? "#64748b"}30` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {mg && <span className="w-2 h-2 rounded-full" style={{ background: mg.color }} />}
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{ex.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="chip text-xs" style={{ background: `${mg?.color ?? "#64748b"}20`, color: mg?.color ?? "#64748b" }}>
                        {UNITS.find((u) => u.id === ex.unit)?.label}
                      </span>
                      {ex.equipment && (
                        <span className="chip text-xs bg-white/5 text-gray-400">
                          {EQUIPMENT.find((e) => e.id === ex.equipment)?.label}
                        </span>
                      )}
                      {ex.level && (
                        <span className="chip text-xs bg-violet-500/15 text-violet-300 capitalize">
                          {ex.level}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm(`Delete exercise "${ex.name}"?`)) deleteExercise(ex.id); }}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* PR display */}
                <div className="mt-3 rounded-lg bg-black/[0.03] dark:bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Current PR</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {pr
                      ? formatWorkoutValue(pr.value, ex.unit) + (pr.reps && ex.unit === "kg" ? ` × ${pr.reps}` : "")
                      : <span className="text-gray-400 text-base font-normal">No PR yet</span>}
                  </p>
                </div>

                {/* Quick log */}
                <form onSubmit={(e) => { e.preventDefault(); quickLog(ex.id); }} className="mt-3 flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={logValue[ex.id] ?? ""}
                    onChange={(e) => setLogValue((s) => ({ ...s, [ex.id]: e.target.value }))}
                    placeholder={
                      ex.unit === "kg" ? "Weight (kg)" :
                      ex.unit === "reps" ? "Reps" :
                      ex.unit === "seconds" ? "Seconds" : "Meters"
                    }
                    className="input-base flex-1 py-1.5 text-sm"
                  />
                  {ex.unit === "kg" && (
                    <input
                      type="number"
                      value={logReps[ex.id] ?? ""}
                      onChange={(e) => setLogReps((s) => ({ ...s, [ex.id]: e.target.value }))}
                      placeholder="Reps"
                      className="input-base w-20 py-1.5 text-sm"
                    />
                  )}
                  <button type="submit" className="btn-primary py-1.5 px-3 text-sm">Log</button>
                </form>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl p-10 text-center border border-dashed border-gray-300 dark:border-white/10 text-gray-500 text-sm">
          {exercises.length === 0 ? "No exercises yet. Add your first one!" : "No exercises match those filters."}
        </div>
      )}

      {/* New exercise modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-6 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New exercise</h3>
                <button onClick={() => setShowNew(false)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-500">
                  <X size={18} />
                </button>
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Exercise name (e.g. Incline Dumbbell Press)"
                className="input-base w-full mb-4"
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              />
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Unit</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {UNITS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUnit(u.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      unit === u.id
                        ? "bg-gradient-to-r from-accent to-accent-pink text-white shadow"
                        : "bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >{u.label}</button>
                ))}
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Muscle group</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {MUSCLE_GROUPS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMuscle(m.id)}
                    className="chip cursor-pointer transition"
                    style={muscle === m.id ? { background: m.color, color: "white" } : { background: `${m.color}20`, color: m.color }}
                  >{m.label}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Equipment</p>
                  <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}
                    className="input-base w-full">
                    {EQUIPMENT.map((eq) => <option key={eq.id} value={eq.id}>{eq.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Level</p>
                  <select value={level} onChange={(e) => setLevel(e.target.value as Level)}
                    className="input-base w-full">
                    {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Form cues (comma-separated)</p>
              <input
                value={cuesText}
                onChange={(e) => setCuesText(e.target.value)}
                placeholder="Brace core, Elbows 45°, Drive through heels"
                className="input-base w-full mb-5"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
                <button onClick={submit} className="btn-primary" disabled={!name.trim()}>Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
