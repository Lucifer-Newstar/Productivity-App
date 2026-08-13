"use client";

/**
 * Goals — career goals list.
 * Each goal has a checkbox, double-click-to-rename title, optional track assignment
 * (dropdown), and optional deadline date. Completed goals collapse into an
 * 'Achieved' section. Respects the activeTrackId filter.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trash2, Check } from "lucide-react";
import { useStore } from "../../lib/store";

export default function Goals({ activeTrackId }: { activeTrackId: string | "all" }) {
  const { career, addGoal, toggleGoal, updateGoal, deleteGoal } = useStore();
  const [title, setTitle] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal(title.trim());
    setTitle("");
  };

  const visible = activeTrackId === "all"
    ? career.goals
    : career.goals.filter((g) => g.trackId === activeTrackId || !g.trackId);

  const active = visible.filter((g) => !g.done);
  const done = visible.filter((g) => g.done);

  const trackName = (id?: string) => career.tracks.find((t) => t.id === id)?.name;
  const trackColor = (id?: string) => career.tracks.find((t) => t.id === id)?.color ?? "#8b5cf6";

  return (
    <div>
      <form onSubmit={submit} className="card flex items-center gap-3 mb-4">
        <Plus size={18} className="text-gray-500" />
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={activeTrackId === "all"
            ? "Add a career goal..."
            : `Add a goal for ${career.tracks.find((t) => t.id === activeTrackId)?.name ?? "this track"}...`}
          className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none" />
        <button type="submit" disabled={!title.trim()} className="btn-primary text-sm disabled:opacity-40">Add goal</button>
      </form>

      {visible.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Target size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No goals for this filter yet.</p>
        </div>
      )}

      <ul className="space-y-2">
        <AnimatePresence>
          {active.map((g) => (
            <motion.li key={g.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className="group flex items-start gap-3 p-4 rounded-xl glass">
              <button onClick={() => toggleGoal(g.id)} className="mt-0.5">
                <div className="w-5 h-5 rounded-full border-2 border-white/20 hover:border-accent transition flex items-center justify-center" />
              </button>
              <div className="flex-1 min-w-0">
                <GoalEditor goal={g} onSave={(patch) => updateGoal(g.id, patch)} />
                <div className="flex gap-2 mt-1.5 items-center flex-wrap">
                  {g.trackId && (
                    <span className="chip" style={{ background: `${trackColor(g.trackId)}20`, color: trackColor(g.trackId) }}>
                      {trackName(g.trackId)}
                    </span>
                  )}
                  {activeTrackId === "all" && (
                    <select value={g.trackId ?? ""}
                      onChange={(e) => updateGoal(g.id, { trackId: e.target.value || undefined })}
                      className="chip bg-white/5 text-gray-400 cursor-pointer outline-none border-0">
                      <option value="">No track</option>
                      {career.tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                  {g.deadline ? (
                    <span className="chip bg-amber-500/20 text-amber-400">📅 {g.deadline}</span>
                  ) : (
                    <input type="date" onChange={(e) => updateGoal(g.id, { deadline: e.target.value })}
                      className="chip bg-white/5 text-gray-500 outline-none border-0 cursor-pointer" />
                  )}
                </div>
              </div>
              <button onClick={() => deleteGoal(g.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition">
                <Trash2 size={15} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {done.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-widest text-gray-600 mt-8 mb-3 pl-1">Achieved</p>
          <ul className="space-y-1.5">
            {done.map((g) => (
              <li key={g.id} className="group flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <button onClick={() => toggleGoal(g.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a3e635,#06b6d4)" }}>
                  <Check size={12} className="text-white" />
                </button>
                <p className="flex-1 text-sm text-gray-500 line-through">{g.title}</p>
                <button onClick={() => deleteGoal(g.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 text-xs">✕</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function GoalEditor({ goal, onSave }: { goal: any; onSave: (p: any) => void }) {
  const [val, setVal] = useState(goal.title);
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
        onBlur={() => { onSave({ title: val }); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-full bg-white/10 rounded px-2 py-0.5 text-sm outline-none" />
    );
  }
  return <p onDoubleClick={() => setEditing(true)} className="text-sm text-gray-100 cursor-text">{goal.title}</p>;
}
