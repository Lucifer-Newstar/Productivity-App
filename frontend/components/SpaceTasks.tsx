"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Flag, Calendar, CheckCircle2 } from "lucide-react";
import { useStore, useSpace } from "../lib/store";
import type { Priority, SpaceId } from "../lib/types";

const priorityStyles: Record<Priority, { bg: string; text: string; label: string }> = {
  high:   { bg: "bg-pink-500/20",   text: "text-pink-400",   label: "High" },
  medium: { bg: "bg-amber-500/20",  text: "text-amber-400",  label: "Medium" },
  low:    { bg: "bg-lime-500/20",   text: "text-lime-400",   label: "Low" },
};

interface SpaceTasksProps {
  space: SpaceId;
  heading?: string;
  compact?: boolean;
}

export default function SpaceTasks({ space, heading, compact = false }: SpaceTasksProps) {
  const { tasks, addTask, toggleTask, deleteTask } = useStore();
  const meta = useSpace(space);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const spaceTasks = tasks.filter((t) => t.space === space);
  const active = spaceTasks.filter((t) => !t.completed);
  const done   = spaceTasks.filter((t) => t.completed);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, space });
    setTitle("");
    setPriority("medium");
  };

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-4 ${compact ? "" : "mt-2"}`}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}aa)`, boxShadow: `0 10px 40px -10px ${meta.color}80` }}
        >
          {meta.emoji}
        </div>
        <div>
          <h2 className={`font-bold tracking-tight ${compact ? "text-2xl" : "text-3xl"}`} style={{ color: meta.color }}>
            {heading ?? meta.name}
          </h2>
          <p className="text-sm text-gray-400">
            {active.length} active · {done.length} done
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="card space-y-3"
        style={{ borderColor: `${meta.color}30` }}
      >
        <div className="flex items-center gap-3">
          <Plus size={20} className="text-gray-500" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Add a task to ${meta.name}...`}
            className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-base"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`, boxShadow: `0 8px 24px -8px ${meta.color}80` }}
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          {(["low", "medium", "high"] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`chip cursor-pointer transition-all ${
                priority === p
                  ? `${priorityStyles[p].bg} ${priorityStyles[p].text}`
                  : "bg-white/5 text-gray-500 hover:text-gray-300"
              }`}
            >
              <Flag size={12} /> {priorityStyles[p].label}
            </button>
          ))}
        </div>
      </form>

      <div className="space-y-2">
        {active.length === 0 && done.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">{meta.emoji}</p>
            <p className="text-sm">No tasks yet in {meta.name}. Add your first one above!</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {active.map((t) => (
            <TaskRow key={t.id} t={t} onToggle={toggleTask} onDelete={deleteTask} />
          ))}
        </AnimatePresence>

        {done.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-widest text-gray-600 pt-4 pl-1">Completed</p>
            <AnimatePresence mode="popLayout">
              {done.map((t) => (
                <TaskRow key={t.id} t={t} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  t,
  onToggle,
  onDelete,
}: {
  t: ReturnType<typeof useStore>["tasks"][number];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = useSpace(t.space);
  const pstyle = priorityStyles[t.priority];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center gap-3 p-4 rounded-xl glass hover:border-white/15 transition-all"
    >
      <input
        type="checkbox"
        className="checkbox-custom"
        checked={t.completed}
        onChange={() => onToggle(t.id)}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${t.completed ? "text-gray-500 line-through" : "text-gray-100"}`}>{t.title}</p>
        <div className="flex gap-2 mt-1.5 items-center">
          <span className={`chip ${pstyle.bg} ${pstyle.text}`}>
            <Flag size={10} /> {pstyle.label}
          </span>
          <span
            className="chip text-gray-400"
            style={{ background: `${meta.color}20`, color: meta.color }}
          >
            {meta.emoji} {meta.name}
          </span>
          <span className="chip text-gray-500 bg-white/5">
            <Calendar size={10} />
            {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
      <button
        onClick={() => onDelete(t.id)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}
