"use client";

/**
 * WorkoutSkills — progressive skill tracker.
 *
 * Each skill is a "target move" (e.g. Pull-up, Handstand) with an ordered list of
 * progressions. Progressions track whether they are completed and their current
 * best. Add/rename/delete at both levels. The skill card shows a progress bar
 * based on completed progressions.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Check, Target, ChevronDown } from "lucide-react";
import { useStore } from "../../lib/store";

export default function WorkoutSkills() {
  const { workout, addSkill, deleteSkill, addProgression, toggleProgressionDone, deleteProgression, updateProgression } = useStore();
  const [newSkillName, setNewSkillName] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Keyed by progression id: track editing "current best"
  const [loggingBest, setLoggingBest] = useState<Record<string, string>>({});
  // Inline add-progression form per skill
  const [newProg, setNewProg] = useState<Record<string, string>>({});

  const createSkill = () => {
    if (!newSkillName.trim()) return;
    addSkill(newSkillName.trim());
    setNewSkillName("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="text-violet-500" size={22} /> Skills
        </h2>
        <p className="text-sm text-gray-500 mt-1">Progressions toward a target move — unlock the next level when you hit your target.</p>
      </div>

      {/* New skill form */}
      <form onSubmit={(e) => { e.preventDefault(); createSkill(); }} className="card flex items-center gap-2">
        <Plus size={18} className="text-gray-500" />
        <input
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          placeholder="Add a skill to work toward (e.g. Muscle-up, Planche, Pistol squat)"
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        <button disabled={!newSkillName.trim()} className="btn-primary py-1.5 px-4 text-sm disabled:hover:translate-y-0">Add</button>
      </form>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {workout.skills.map((skill) => {
            const total = skill.progressions.length;
            const done = skill.progressions.filter((p) => p.done).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const isOpen = expanded[skill.id] ?? true;

            return (
              <motion.div
                key={skill.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card"
              >
                {/* Skill header */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [skill.id]: !isOpen }))}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-500"
                  >
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h4>
                    <p className="text-xs text-gray-500">{done}/{total} progressions</p>
                  </div>
                  <span className="text-sm font-bold text-violet-500">{pct}%</span>
                  <button
                    onClick={() => { if (confirm(`Delete skill "${skill.name}"?`)) deleteSkill(skill.id); }}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Skill progress bar */}
                <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-cyan"
                  />
                </div>

                {/* Progressions */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-1">
                        {skill.progressions.map((p, i) => (
                          <div key={p.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/5">
                            <button
                              onClick={() => toggleProgressionDone(skill.id, p.id)}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                                p.done
                                  ? "bg-gradient-to-br from-accent to-accent-cyan border-transparent"
                                  : "border-gray-300 dark:border-white/20 hover:border-accent"
                              }`}
                            >
                              {p.done && <Check size={14} className="text-white" />}
                            </button>
                            <span className="w-6 text-[10px] font-bold text-gray-400 tabular-nums">{i + 1}</span>
                            <span className={`flex-1 text-sm ${p.done ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
                              {p.title}
                            </span>
                            {p.target && (
                              <span className="text-xs text-gray-500 shrink-0">
                                {loggingBest[p.id] !== undefined ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const v = parseInt(loggingBest[p.id] ?? "0", 10);
                                      if (!isNaN(v)) updateProgression(skill.id, p.id, { currentBest: v, done: v >= (p.target ?? 0) });
                                      setLoggingBest((l) => { const n = { ...l }; delete n[p.id]; return n; });
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <input
                                      autoFocus
                                      type="number"
                                      value={loggingBest[p.id]}
                                      onChange={(e) => setLoggingBest((l) => ({ ...l, [p.id]: e.target.value }))}
                                      className="w-14 bg-black/5 dark:bg-white/10 rounded px-2 py-0.5 text-xs outline-none"
                                    />
                                    <span className="text-[10px] text-gray-400">/ {p.target}</span>
                                  </form>
                                ) : (
                                  <button
                                    onClick={() => setLoggingBest((l) => ({ ...l, [p.id]: String(p.currentBest ?? "") }))}
                                    className="hover:text-accent transition"
                                  >
                                    {p.currentBest ?? 0} / {p.target}
                                  </button>
                                )}
                              </span>
                            )}
                            <button
                              onClick={() => deleteProgression(skill.id, p.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}

                        {/* Add progression form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const t = (newProg[skill.id] ?? "").trim();
                            if (!t) return;
                            addProgression(skill.id, t);
                            setNewProg((s) => ({ ...s, [skill.id]: "" }));
                          }}
                          className="flex items-center gap-2 pl-10 pt-1"
                        >
                          <Plus size={13} className="text-gray-500" />
                          <input
                            value={newProg[skill.id] ?? ""}
                            onChange={(e) => setNewProg((s) => ({ ...s, [skill.id]: e.target.value }))}
                            placeholder="Next progression..."
                            className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white placeholder:text-gray-400 outline-none py-1"
                          />
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {workout.skills.length === 0 && (
          <div className="rounded-2xl p-8 text-center border border-dashed border-gray-300 dark:border-white/10 text-gray-500 text-sm">
            No skills yet. Add your first target move above (e.g. "Pull-up").
          </div>
        )}
      </div>
    </div>
  );
}
