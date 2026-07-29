"use client";

/**
 * Habits — daily habit tracker.
 * Add habits with icon + color; a 7-day weekly grid lets you check off days and
 * track streaks. Seeded with Hydrate / Workout / Reading examples.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Plus, Check, Droplets, Dumbbell, BookOpen, Moon, X } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
  history: string[]; // ISO dates YYYY-MM-DD completed
}

const ICONS = [
  { id: "droplet", Icon: Droplets, label: "Hydrate" },
  { id: "dumbbell", Icon: Dumbbell, label: "Exercise" },
  { id: "book", Icon: BookOpen, label: "Read" },
  { id: "moon", Icon: Moon, label: "Sleep" },
  { id: "flame", Icon: Flame, label: "Streak" },
];

const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#a3e635", "#f59e0b"];

const today = () => new Date().toISOString().slice(0, 10);

const seed: Habit[] = [
  { id: "1", name: "Drink 2L water", icon: "droplet", color: "#06b6d4", streak: 5, history: [] },
  { id: "2", name: "Workout 30 min", icon: "dumbbell", color: "#ec4899", streak: 3, history: [] },
  { id: "3", name: "Read 20 pages", icon: "book", color: "#a3e635", streak: 7, history: [] },
];

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window === "undefined") return seed;
    const s = localStorage.getItem("kaizen.habits");
    return s ? JSON.parse(s) : seed;
  });
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("flame");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => { localStorage.setItem("kaizen.habits", JSON.stringify(habits)); }, [habits]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const toggle = (id: string, date: string) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== id) return h;
      const has = h.history.includes(date);
      return {
        ...h,
        history: has ? h.history.filter((d) => d !== date) : [...h.history, date],
        streak: date === today() && !has ? h.streak + 1 : h.streak,
      };
    }));
  };

  const addHabit = () => {
    if (!name.trim()) return;
    setHabits((prev) => [...prev, { id: Math.random().toString(36).slice(2), name: name.trim(), icon, color, streak: 0, history: [] }]);
    setName(""); setShowNew(false); setIcon("flame"); setColor(COLORS[0]);
  };

  const remove = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Habits</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Small daily actions compound into big results.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New habit
        </button>
      </div>

      {/* Streak highlight */}
      <div className="card flex items-center gap-4 bg-gradient-to-r from-amber-500/10 to-pink-500/10 border-amber-500/20">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-amber to-accent-pink flex items-center justify-center">
          <Flame size={26} className="text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Longest active streak</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.max(0, ...habits.map((h) => h.streak))} days 🔥
          </p>
        </div>
      </div>

      {/* Habit rows */}
      <div className="space-y-3">
        {habits.map((h) => {
          const iconDef = ICONS.find((i) => i.id === h.icon) || ICONS[0];
          const Icon = iconDef.Icon;
          return (
            <motion.div
              key={h.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="card flex items-center gap-4 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${h.color}20`, border: `1px solid ${h.color}40` }}
              >
                <Icon size={22} style={{ color: h.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{h.name}</h3>
                  <span className="chip" style={{ background: `${h.color}20`, color: h.color }}>
                    <Flame size={10} /> {h.streak} day streak
                  </span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {days.map((d) => {
                    const done = h.history.includes(d);
                    const isToday = d === today();
                    const dayLetter = new Date(d).toLocaleDateString("en-US", { weekday: "narrow" })[0];
                    return (
                      <button
                        key={d}
                        onClick={() => toggle(h.id, d)}
                        className="flex-1 flex flex-col items-center gap-1 group/day"
                      >
                        <span className="text-[10px] text-gray-500">{dayLetter}</span>
                        <div
                          className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                            done
                              ? ""
                              : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5"
                          } ${isToday ? "ring-2 ring-black/10 dark:ring-white/20" : ""}`}
                          style={done
                            ? { background: `linear-gradient(135deg, ${h.color}, ${h.color}aa)`, boxShadow: `0 4px 16px -4px ${h.color}80` }
                            : undefined}
                        >
                          {done && <Check size={14} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => remove(h.id)}
                className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">🌱</p>
            <p className="text-sm">Start building a habit — it only takes 21 days.</p>
          </div>
        )}
      </div>

      {showNew && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          onClick={() => setShowNew(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 glass border border-black/10 dark:border-white/10"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">New habit</h3>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Habit name (e.g. Meditate 10 minutes)"
              className="w-full input-base mb-4"
            />
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Icon</p>
            <div className="flex gap-2 mb-4">
              {ICONS.map((i) => {
                const I = i.Icon;
                return (
                  <button
                    key={i.id}
                    onClick={() => setIcon(i.id)}
                    className={`p-3 rounded-lg transition ${
                      icon === i.id
                        ? "bg-accent/20 text-accent border border-accent/40"
                        : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-transparent hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <I size={18} />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Color</p>
            <div className="flex gap-2 mb-6">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-black/20 dark:ring-white/60" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
              <button onClick={addHabit} className="btn-primary">Create</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
