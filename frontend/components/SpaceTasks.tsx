"use client";

/**
 * SpaceTasks — reusable task list scoped to a single space.
 * Used by each of the five space pages (Projects, Workout, Career, Entertainment,
 * Health) when they only need a simple task list (Career has its own rich page).
 *
 * Provides per-space add form (color-themed to the space), priority chips, and a
 * grouped list with active tasks above completed ones.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Flag, Calendar, ArrowLeft } from "lucide-react";
import { useStore, useSpace } from "../lib/store";
import type { Priority, SpaceId } from "../lib/types";

const priorityStyles: Record<Priority, { bg: string; text: string; label: string }> = {
  high:   { bg: "bg-pink-500/20",   text: "text-pink-500 dark:text-pink-400",   label: "High" },
  medium: { bg: "bg-amber-500/20",  text: "text-amber-600 dark:text-amber-400",  label: "Medium" },
  low:    { bg: "bg-lime-500/20",   text: "text-lime-600 dark:text-lime-400",   label: "Low" },
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
  const pct    = spaceTasks.length ? Math.round((done.length / spaceTasks.length) * 100) : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, space });
    setTitle("");
    setPriority("medium");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl p-6 md:p-8 glass border border-black/10 dark:border-white/10 shadow-sm`}
        style={{ borderColor: `${meta.color}40` }}
      >
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-40"
          style={{ background: meta.color }}
        />
        <div className="relative flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}aa)`, boxShadow: `0 10px 40px -10px ${meta.color}80` }}
          >
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold tracking-tight text-gray-900 dark:text-white ${compact ? "text-2xl" : "text-3xl"}`} style={{ color: meta.color }}>
              {heading ?? meta.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {active.length} active · {done.length} done
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-2xl font-bold" style={{ color: meta.color }}>{pct}%</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">complete</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden mt-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)` }}
          />
        </div>
      </motion.div>

      {/* Add task form */}
      <form
        onSubmit={submit}
        className="card space-y-3"
        style={{ borderColor: `${meta.color}25` }}
      >
        <div className="flex items-center gap-3">
          <Plus size={20} className="text-gray-400 dark:text-gray-500" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Add a task to ${meta.name}...`}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none text-base"
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
        <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5 dark:border-white/5">
          {(["low", "medium", "high"] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`chip cursor-pointer transition-all ${
                priority === p
                  ? `${priorityStyles[p].bg} ${priorityStyles[p].text}`
                  : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              <Flag size={12} /> {priorityStyles[p].label}
            </button>
          ))}
        </div>
      </form>

      {/* Task list */}
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
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600 pt-4 pl-1">Completed</p>
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
      className="group flex items-center gap-3 p-4 rounded-xl glass hover:border-black/10 dark:hover:border-white/15 transition-all"
    >
      <input
        type="checkbox"
        className="checkbox-custom"
        checked={t.completed}
        onChange={() => onToggle(t.id)}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${t.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"}`}>{t.title}</p>
        <div className="flex gap-2 mt-1.5 items-center flex-wrap">
          <span className={`chip ${pstyle.bg} ${pstyle.text}`}>
            <Flag size={10} /> {pstyle.label}
          </span>
          <span
            className="chip"
            style={{ background: `${meta.color}20`, color: meta.color }}
          >
            {meta.emoji} {meta.name}
          </span>
          <span className="chip text-gray-500 bg-black/5 dark:bg-white/5">
            <Calendar size={10} />
            {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
      <button
        onClick={() => onDelete(t.id)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}
