"use client";

/**
 * Tasks — aggregate to-do view.
 * Add new tasks with priority selection; supports text search, status filter
 * (all/active/completed), and per-space filter chips. Task rows show completion
 * checkbox, priority badge, space chip (emoji + name), date, and delete on hover.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Calendar, Trash2, Search, SearchX, Plus } from "lucide-react";
import Link from "next/link";
import { useStore } from "../lib/store";
import { SPACES } from "../lib/types";
import SpaceIcon from "./SpaceIcon";
import type { Priority, SpaceId } from "../lib/types";

const priorityStyles: Record<Priority, { bg: string; text: string; label: string }> = {
  high:   { bg: "bg-pink-500/20",  text: "text-pink-500 dark:text-pink-400",  label: "High" },
  medium: { bg: "bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", label: "Medium" },
  low:    { bg: "bg-lime-500/20",  text: "text-lime-600 dark:text-lime-400",  label: "Low" },
};

type Filter = "all" | "active" | "completed";

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [spaceFilter, setSpaceFilter] = useState<SpaceId | "all">("all");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const filtered = tasks.filter((t) => {
    if (filter === "active" && t.completed) return false;
    if (filter === "completed" && !t.completed) return false;
    if (spaceFilter !== "all" && t.space !== spaceFilter) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, space: spaceFilter === "all" ? "projects" : spaceFilter });
    setTitle("");
    setPriority("medium");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">All Tasks</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {activeCount} active · {tasks.length - activeCount} completed — across all spaces
        </p>
      </div>

      {/* Add task */}
      <form onSubmit={submit} className="card space-y-3">
        <div className="flex items-center gap-3">
          <Plus size={20} className="text-gray-400 dark:text-gray-500" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none text-base"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="btn-primary disabled:hover:translate-y-0"
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
                  : "bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              <Flag size={12} /> {priorityStyles[p].label}
            </button>
          ))}
        </div>
      </form>

      {/* Search + status filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full input-base pl-10"
          />
        </div>
        <div className="flex gap-1 p-1 bg-black/5 dark:bg-bg-card/60 rounded-xl border border-black/5 dark:border-white/5">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                filter === f
                  ? "bg-gradient-to-r from-accent to-accent-cyan text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Space chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSpaceFilter("all")}
          className={`chip cursor-pointer transition-all ${
            spaceFilter === "all"
              ? "bg-black/10 dark:bg-white/20 text-gray-900 dark:text-white"
              : "bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          All spaces
        </button>
        {SPACES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSpaceFilter(s.id)}
            className={`chip cursor-pointer transition-all ${spaceFilter === s.id ? "ring-1 ring-black/20 dark:ring-white/40" : "hover:opacity-80"}`}
            style={spaceFilter === s.id
              ? { background: `${s.color}30`, color: s.color }
              : { background: `${s.color}15`, color: s.color }}
          >
            <SpaceIcon space={s.id} size={12}/> {s.name}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((t) => {
            const meta = SPACES.find((s) => s.id === t.space)!;
            const pstyle = priorityStyles[t.priority];
            return (
              <motion.div
                key={t.id}
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
                  onChange={() => toggleTask(t.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                    {t.title}
                  </p>
                  <div className="flex gap-2 mt-1.5 items-center flex-wrap">
                    <span className={`chip ${pstyle.bg} ${pstyle.text}`}>
                      <Flag size={10} /> {pstyle.label}
                    </span>
                    <Link href={`/${meta.id}`} className="chip hover:opacity-80" style={{ background: `${meta.color}20`, color: meta.color }}>
                      <SpaceIcon space={meta.id} size={10}/> {meta.name}
                    </Link>
                    <span className="chip text-gray-500 bg-black/5 dark:bg-white/5">
                      <Calendar size={10} />
                      {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <SearchX size={34} className="mx-auto mb-3 text-slate-400" strokeWidth={1.5}/>
            <p className="text-sm">No tasks match these filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
