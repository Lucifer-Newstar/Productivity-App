"use client";

/**
 * Habits — daily habit tracker.
 * Add habits with icon + color; a 7-day weekly grid lets you check off days and
 * track streaks. Seeded with Hydrate / Workout / Reading examples.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Plus, Check, Droplets, Dumbbell, BookOpen, Moon, X, Sprout, Repeat2, Target, CalendarCheck2 } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";
import { addLocalDays, dateFromLocalKey, localDateKey } from "../lib/localDate";
import { habitStreak, normalizedHabitHistory } from "../lib/habitTracking";

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

const today = () => localDateKey();

const seed: Habit[] = [];
function migrateHabits(value:unknown):Habit[]{
  if(!Array.isArray(value))return seed;
  return value.filter((item):item is Habit=>!!item&&typeof item==="object"&&typeof (item as Habit).id==="string"&&typeof (item as Habit).name==="string").map(item=>{const history=normalizedHabitHistory(item.history);return{...item,history,streak:habitStreak(history)}});
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window === "undefined") return seed;
    try{const stored=localStorage.getItem("kaizen.habits");return stored?migrateHabits(JSON.parse(stored)):seed}catch{return seed}
  });
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("flame");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => { try { localStorage.setItem("kaizen.habits", JSON.stringify(habits)); } catch { window.dispatchEvent(new CustomEvent("kaizen:storage-error", { detail: { key: "kaizen.habits", reason: "quota" } })); } }, [habits]);

  const days = Array.from({ length: 7 }, (_, index) => localDateKey(addLocalDays(new Date(),index-6)));

  const toggle = (id: string, date: string) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== id) return h;
      const has = h.history.includes(date);
      const history=normalizedHabitHistory(has?h.history.filter((day)=>day!==date):[...h.history,date]);
      return { ...h, history, streak: habitStreak(history) };
    }));
  };

  const addHabit = () => {
    if (!name.trim()) return;
    setHabits((prev) => [...prev, { id: Math.random().toString(36).slice(2), name: name.trim(), icon, color, streak: 0, history: [] }]);
    setName(""); setShowNew(false); setIcon("flame"); setColor(COLORS[0]);
  };

  const remove = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));

  return (
    <div className="core-section core-habits">
      <HomeSectionHeader index="05" eyebrow="Consistency system" title="Rhythm Matrix" description="Measure repeatability, not motivation. Keep the daily standard visible." icon={Repeat2} actions={<button onClick={() => setShowNew(true)} className="home-primary"><Plus size={15}/> Add rhythm</button>}/>
      <section className="core-metric-rail" aria-label="Habit summary">
        <div><Target/><span>Active rhythms</span><strong>{habits.length}</strong></div>
        <div><Flame/><span>Best streak</span><strong>{Math.max(0,...habits.map(h=>h.streak))}d</strong></div>
        <div><CalendarCheck2/><span>Done today</span><strong>{habits.filter(h=>h.history.includes(today())).length}/{habits.length}</strong></div>
        <div><Repeat2/><span>7-day marks</span><strong>{habits.reduce((n,h)=>n+h.history.filter(d=>days.includes(d)).length,0)}</strong></div>
      </section>

      {/* Habit rows */}
      <div className="habit-matrix">
        {habits.map((h) => {
          const iconDef = ICONS.find((i) => i.id === h.icon) || ICONS[0];
          const Icon = iconDef.Icon;
          return (
            <motion.div
              key={h.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="habit-matrix-row group"
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
                    const dayLetter = (dateFromLocalKey(d)??new Date()).toLocaleDateString("en-US", { weekday: "narrow" })[0];
                    return (
                      <button
                        key={d}
                        onClick={() => toggle(h.id, d)}
                        aria-label={`${done ? "Clear" : "Mark"} ${h.name} on ${d}`}
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
                aria-label={`Delete ${h.name}`}
                className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Sprout size={34} className="mx-auto mb-3 text-emerald-500" strokeWidth={1.5}/>
            <p className="text-sm">Add the first repeatable action to your matrix.</p>
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
                    aria-label={`Use ${i.label} icon`}
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
                  aria-label={`Use color ${c}`}
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
