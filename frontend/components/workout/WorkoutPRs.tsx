"use client";

/**
 * WorkoutPRs — Personal Records section of the workout page.
 *
 * Lists every exercise with its current PR (peak weight/reps/time/distance) and
 * the date it was achieved. Supports quick-logging a new attempt from here
 * (auto-updates the PR if the new number is higher), deleting a PR, opening
 * a per-exercise history drawer, and opening a small inline form to add a new PR.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Trash2, Flame, History } from "lucide-react";
import { useStore } from "../../lib/store";
import { MUSCLE_GROUPS, formatWorkoutValue } from "../../lib/types";
import type { WorkoutExercise } from "../../lib/types";
import ExerciseHistoryDrawer from "./ExerciseHistoryDrawer";

export default function WorkoutPRs() {
  const { workout, logPR, deletePR } = useStore();
  const { prs, exercises } = workout;
  const [logging, setLogging] = useState<string | null>(null); // exerciseId being logged
  const [value, setValue] = useState("");
  const [reps, setReps] = useState("");
  const [historyFor, setHistoryFor] = useState<WorkoutExercise | null>(null);

  // Show exercises that have at least one PR, plus a "new PR" dropdown for others.
  const exercisesWithPR = new Set(prs.map((p) => p.exerciseId));
  const noPRexercises = exercises.filter((e) => !exercisesWithPR.has(e.id));

  const submit = (exerciseId: string) => {
    const v = parseFloat(value);
    if (!value || isNaN(v) || v <= 0) { setLogging(null); return; }
    const r = reps ? parseInt(reps, 10) : undefined;
    logPR(exerciseId, v, r);
    setLogging(null);
    setValue(""); setReps("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="text-amber-500" size={22} /> Personal Records
          </h2>
          <p className="text-sm text-gray-500 mt-1">Your all-time peaks — new attempts auto-update the record.</p>
        </div>
      </div>

      {/* Existing PRs grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence initial={false}>
          {prs.map((p) => {
            const ex = exercises.find((e) => e.id === p.exerciseId);
            if (!ex) return null;
            const muscle = ex.muscleGroup ? MUSCLE_GROUPS.find((m) => m.id === ex.muscleGroup) : null;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card group relative"
                style={{ borderColor: `${muscle?.color ?? "#8b5cf6"}30` }}
              >
                <button
                  onClick={() => deletePR(p.id)}
                  className="absolute top-3 right-3 p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  title="Delete PR"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  {muscle && (
                    <span className="w-2 h-2 rounded-full" style={{ background: muscle.color }} />
                  )}
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{muscle?.label ?? "Exercise"}</p>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{ex.name}</h4>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold gradient-text">
                    {formatWorkoutValue(p.value, ex.unit)}
                  </p>
                  {p.reps && ex.unit === "kg" && (
                    <p className="text-sm text-gray-500 mb-1">× {p.reps} reps</p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Set on {formatDate(p.date)}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistoryFor(ex)}
                      title="History"
                      className="p-1.5 rounded text-gray-400 hover:text-violet-300 hover:bg-violet-500/10 transition">
                      <History size={13} />
                    </button>
                    <button
                      onClick={() => { setLogging(p.exerciseId); setValue(""); setReps(""); }}
                      className="text-xs font-medium text-accent hover:text-accent-cyan transition flex items-center gap-1"
                    >
                      <Flame size={12} /> Log attempt
                    </button>
                  </div>
                </div>

                {/* Quick log inline form */}
                <AnimatePresence>
                  {logging === p.exerciseId && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={(e) => { e.preventDefault(); submit(p.exerciseId); }}
                      className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          autoFocus
                          type="number"
                          step="any"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder={ex.unit === "kg" ? "Weight (kg)" : ex.unit === "reps" ? "Reps" : ex.unit === "seconds" ? "Seconds" : "Meters"}
                          className="input-base flex-1 min-w-[80px] py-1.5 text-sm"
                        />
                        {ex.unit === "kg" && (
                          <input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            placeholder="Reps"
                            className="input-base w-20 py-1.5 text-sm"
                          />
                        )}
                        <button type="submit" className="btn-primary py-1.5 px-4 text-sm">Save</button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Log a new PR */}
      {noPRexercises.length > 0 && (
        <div className="card bg-dashed border-dashed">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Log a PR for another exercise</p>
          <div className="flex flex-wrap gap-2">
            {noPRexercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { setLogging(ex.id); setValue(""); setReps(""); }}
                className="chip bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              >
                <Plus size={12} /> {ex.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {prs.length === 0 && noPRexercises.length === 0 && (
        <EmptyHint text="Add exercises in the Library to start logging PRs." />
      )}

      {/* Exercise history drawer */}
      <AnimatePresence>
        {historyFor && <ExerciseHistoryDrawer exercise={historyFor} onClose={() => setHistoryFor(null)} />}
      </AnimatePresence>
    </div>
  );
}

/** Format ISO date -> "Jan 5, 2026" */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-2xl p-8 text-center border border-dashed border-gray-300 dark:border-white/10 text-gray-500 text-sm">
      {text}
    </div>
  );
}
