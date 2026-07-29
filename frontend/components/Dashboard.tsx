"use client";

/**
 * Dashboard — landing view.
 * Greets based on time of day, shows an animated overall completion bar,
 * four stat cards, a per-space overview grid (now linking to /<space> routes),
 * recent tasks, and a focus tip.
 *
 * CTAs that switch core views use `onNavigateView`; space cards use next/link
 * to navigate to real pages.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Flame, Target, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { useStore } from "../lib/store";
import { SPACES } from "../lib/types";
import { useEffect, useState } from "react";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard({ onNavigateView }: { onNavigateView?: (v: "tasks" | "pomodoro") => void }) {
  const { tasks } = useStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000 * 30);
    return () => clearInterval(i);
  }, []);

  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - completed;
  const highPri = tasks.filter((t) => !t.completed && t.priority === "high").length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const today = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const stats = [
    { label: "Tasks Done",    value: completed, Icon: CheckCircle2, color: "from-accent to-accent-pink" },
    { label: "Pending",       value: pending,   Icon: Clock,       color: "from-accent-cyan to-accent" },
    { label: "High Priority", value: highPri,   Icon: Target,      color: "from-accent-pink to-accent-amber" },
    { label: "Spaces",        value: SPACES.length, Icon: Zap,    color: "from-accent-lime to-accent-cyan" },
  ];

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 glass border border-black/10 dark:border-white/10 shadow-sm"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent-cyan/20 blur-3xl" />

        <div className="relative">
          <p className="text-sm text-gray-500">{today}</p>
          <h2 className="text-4xl md:text-5xl font-bold mt-2 text-gray-900 dark:text-white">
            {greet()}. <span className="gradient-text">Let's build today.</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl">
            You have <span className="text-gray-900 dark:text-white font-semibold">{pending}</span> pending tasks across{" "}
            <span className="text-gray-900 dark:text-white font-semibold">{SPACES.length}</span> spaces, and{" "}
            <span className="text-gray-900 dark:text-white font-semibold">{highPri}</span> marked high priority. Stay in the flow.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateView?.("tasks")}
              className="btn-primary flex items-center gap-2"
            >
              View all tasks <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigateView?.("pomodoro")}
              className="btn-ghost flex items-center gap-2"
            >
              <Flame size={18} /> Start focus session
            </button>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <TrendingUp size={14} /> Completion rate
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{completion}%</p>
            </div>
            <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-accent via-accent-cyan to-accent-pink"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.Icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="card relative overflow-hidden"
            >
              <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-xl`} />
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${s.color}`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Spaces overview — now links to real routes */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Spaces</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SPACES.map((s, i) => {
            const spaceTasks = tasks.filter((t) => t.space === s.id);
            const active = spaceTasks.filter((t) => !t.completed).length;
            const done = spaceTasks.length - active;
            const pct = spaceTasks.length ? Math.round((done / spaceTasks.length) * 100) : 0;
            return (
              <Link key={s.id} href={`/${s.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="card text-left group hover:-translate-y-1 transition-transform cursor-pointer h-full"
                  style={{ borderColor: `${s.color}30` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{s.emoji}</span>
                    <h4 className="font-semibold" style={{ color: s.color }}>{s.name}</h4>
                  </div>
                  <p className="text-xs text-gray-500">{active} active · {done} done</p>
                  <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: s.color }}
                    />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent tasks + tip */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h3>
            <button
              onClick={() => onNavigateView?.("tasks")}
              className="text-xs text-accent hover:text-accent-cyan transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentTasks.map((t) => {
              const meta = SPACES.find((s) => s.id === t.space);
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-black/[0.03] dark:bg-white/5 hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors"
                >
                  <CheckCircle2 size={18} className={t.completed ? "text-accent-lime" : "text-gray-400 dark:text-gray-600"} />
                  <p className={`flex-1 text-sm ${t.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                    {t.title}
                  </p>
                  {t.priority === "high" && <span className="chip bg-pink-500/20 text-pink-500 dark:text-pink-400">High</span>}
                  {meta && (
                    <span className="chip" style={{ background: `${meta.color}20`, color: meta.color }}>
                      {meta.emoji} {meta.name}
                    </span>
                  )}
                </div>
              );
            })}
            {recentTasks.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No tasks yet — head to a space and add one!</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Focus Tip</h3>
          <div className="rounded-xl p-4 bg-gradient-to-br from-accent/15 to-accent-cyan/10 border border-accent/20">
            <Zap size={22} className="text-accent mb-2" />
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              Try the <span className="text-gray-900 dark:text-white font-semibold">Pomodoro technique</span>: 25 minutes of deep work, then a 5-minute break. Repeat 4 times, then take a longer break.
            </p>
          </div>
          <button
            onClick={() => onNavigateView?.("pomodoro")}
            className="btn-primary w-full mt-4"
          >
            Start 25-min session
          </button>
        </motion.div>
      </div>
    </div>
  );
}
