"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Calendar, Trash2, Search } from "lucide-react";
import { useStore, useSpace } from "../lib/store";
import { SPACES } from "../lib/types";
import type { Priority, SpaceId } from "../lib/types";

const priorityStyles: Record<Priority, { bg: string; text: string; label: string }> = {
  high:   { bg: "bg-pink-500/20",   text: "text-pink-400",   label: "High" },
  medium: { bg: "bg-amber-500/20",  text: "text-amber-400",  label: "Medium" },
  low:    { bg: "bg-lime-500/20",   text: "text-lime-400",   label: "Low" },
};

type Filter = "all" | "active" | "completed";

export default function Tasks() {
  const { tasks, toggleTask, deleteTask } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [spaceFilter, setSpaceFilter] = useState<SpaceId | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = tasks.filter((t) => {
    if (filter === "active" && t.completed) return false;
    if (filter === "completed" && !t.completed) return false;
    if (spaceFilter !== "all" && t.space !== spaceFilter) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">All Tasks</h2>
        <p className="text-gray-400 mt-1">{activeCount} active · {tasks.length - activeCount} completed — across all spaces</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-bg-card/60 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent/50 transition"
          />
        </div>
        <div className="flex gap-1 p-1 bg-bg-card/60 rounded-xl border border-white/5">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                filter === f
                  ? "bg-gradient-to-r from-accent to-accent-cyan text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSpaceFilter("all")}
          className={`chip cursor-pointer transition-all ${
            spaceFilter === "all" ? "bg-white/20 text-white" : "bg-white/5 text-gray-400 hover:text-gray-200"
          }`}
        >
          All spaces
        </button>
        {SPACES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSpaceFilter(s.id)}
            className={`chip cursor-pointer transition-all ${spaceFilter === s.id ? "ring-1 ring-white/40" : "hover:opacity-80"}`}
            style={spaceFilter === s.id
              ? { background: `${s.color}30`, color: s.color }
              : { background: `${s.color}15`, color: s.color }}
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

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
                className="group flex items-center gap-3 p-4 rounded-xl glass hover:border-white/15 transition-all"
              >
                <input
                  type="checkbox"
                  className="checkbox-custom"
                  checked={t.completed}
                  onChange={() => toggleTask(t.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.completed ? "text-gray-500 line-through" : "text-gray-100"}`}>{t.title}</p>
                  <div className="flex gap-2 mt-1.5 items-center">
                    <span className={`chip ${pstyle.bg} ${pstyle.text}`}>
                      <Flag size={10} /> {pstyle.label}
                    </span>
                    <span className="chip" style={{ background: `${meta.color}20`, color: meta.color }}>
                      {meta.emoji} {meta.name}
                    </span>
                    <span className="chip text-gray-500 bg-white/5">
                      <Calendar size={10} />
                      {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">No tasks match these filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
