"use client";

/**
 * Dashboard — Kaizer throne-room landing view.
 * Greets the emperor, shows animated completion bar, four imperial stat cards,
 * a per-realm overview grid linking to /<space> routes, recent campaigns, and
 * a focus tip. Uses the obsidian-lacquer + parchment card system from globals.css.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Flame, Target, Zap, TrendingUp, ArrowRight, Swords,
} from "lucide-react";
import { useStore } from "../lib/store";
import { SPACES } from "../lib/types";
import { useEffect, useState } from "react";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "The dawn breaks";
  if (h < 18) return "The sun is high";
  return "Torches lit";
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
    { label: "Conquests",  value: completed,        Icon: CheckCircle2, color: "from-accent to-accent-pink" },
    { label: "Campaigns",  value: pending,          Icon: Clock,        color: "from-accent-cyan to-accent" },
    { label: "Sieges",     value: highPri,          Icon: Target,       color: "from-accent-pink to-accent-amber" },
    { label: "Realms",     value: SPACES.length,    Icon: Zap,          color: "from-accent-lime to-accent-cyan" },
  ];

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero — obsidian throne */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 card-lacquer"
      >
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.35), transparent 70%)" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(185,28,28,0.35), transparent 70%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 scale-pattern opacity-40" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[11px] font-imperial uppercase tracking-[0.4em]"
              style={{ color: "var(--k-gold-deep, #d4af37)" }}>
              <Swords size={12} /> {today} <Swords size={12} />
            </div>
            <h2 className="text-4xl md:text-6xl imperial-name mt-3 leading-[1.05] animate-crown-glow"
              style={{
                background: "linear-gradient(135deg, #fde68a 0%, #d4af37 40%, #b91c1c 80%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
              {greet()}, Emperor.
            </h2>
            <p className="serif-body italic mt-4 max-w-xl" style={{ color: "var(--k-gold-deep, #9c7a1a)" }}>
              Your realm awaits. You hold <b>{pending}</b> pending campaigns across{" "}
              <b>{SPACES.length}</b> realms — <b>{highPri}</b> of them are sieges to storm today.
              Sharpen your blade and conquer.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateView?.("tasks")}
                className="btn-primary flex items-center gap-2"
              >
                Command the realm <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigateView?.("pomodoro")}
                className="btn-ghost flex items-center gap-2"
              >
                <Flame size={16} /> Enter the forge
              </button>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-imperial uppercase tracking-widest flex items-center gap-2"
                  style={{ color: "var(--k-gold-deep, #d4af37)" }}>
                  <TrendingUp size={14} /> Dominion
                </p>
                <p className="text-sm font-bold gold-text">{completion}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(0,0,0,0.15)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #b91c1c, #d4af37, #ec4899)",
                    boxShadow: "0 0 12px rgba(212,175,55,0.6)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Decorative crown/K sigil block */}
          <div aria-hidden className="hidden md:flex items-center justify-center shrink-0">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #b91c1c, #6f0f0f)",
                border: "2px solid rgba(253,230,138,0.5)",
                boxShadow: "0 10px 40px -10px rgba(185,28,28,0.8), inset 0 1px 0 rgba(253,230,138,0.3)",
              }}>
              <div className="text-6xl imperial-name text-amber-100 animate-crown-glow"
                style={{ textShadow: "0 0 20px rgba(253,230,138,0.7)" }}>K</div>
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #fde68a, #d4af37)",
                  border: "2px solid #7f1d1d",
                  boxShadow: "0 4px 12px -2px rgba(212,175,55,0.7)",
                }}>
                <Swords size={18} className="text-red-900" />
              </div>
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
              className="card-lacquer relative overflow-hidden p-5 hover:-translate-y-1 transition"
            >
              <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-xl`} />
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${s.color}`}
                style={{ boxShadow: `0 6px 16px -6px rgba(0,0,0,0.5)` }}>
                <Icon size={18} className="text-amber-50" />
              </div>
              <p className="text-3xl font-imperial font-bold mt-3 gold-text">{s.value}</p>
              <p className="text-xs font-imperial uppercase tracking-[0.2em] mt-1"
                style={{ color: "var(--k-gold-deep, #d4af37)" }}>{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Realms overview */}
      <div>
        <h3 className="text-xl font-imperial uppercase tracking-[0.25em] mb-4 flex items-center gap-2"
          style={{ color: "var(--k-gold, #fde68a)" }}>
          <span className="k-blade flex-1" /> Your Realms <span className="k-blade flex-1" />
        </h3>
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
                  className="card-lacquer text-left group hover:-translate-y-1 transition-transform cursor-pointer h-full p-5"
                  style={{ borderColor: `${s.color}55` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{s.emoji}</span>
                    <h4 className="font-imperial font-bold uppercase tracking-[0.15em] text-sm" style={{ color: s.color }}>
                      {s.name}
                    </h4>
                  </div>
                  <p className="text-xs serif-body italic" style={{ color: "var(--k-gold-deep, #9c7a1a)" }}>
                    {active} active · {done} conquered
                  </p>
                  <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ background: "rgba(0,0,0,0.15)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent campaigns + focus tip */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2 card-lacquer p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-imperial uppercase tracking-[0.2em]"
              style={{ color: "var(--k-gold, #fde68a)" }}>Recent Campaigns</h3>
            <button
              onClick={() => onNavigateView?.("tasks")}
              className="text-xs font-imperial uppercase tracking-widest transition hover:underline"
              style={{ color: "var(--k-gold-deep, #d4af37)" }}
            >
              Command all →
            </button>
          </div>
          <div className="space-y-2">
            {recentTasks.map((t) => {
              const meta = SPACES.find((s) => s.id === t.space);
              return (
                <div key={t.id}
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                  style={{
                    background: "rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}>
                  <CheckCircle2 size={18} className={t.completed ? "text-emerald-500" : "text-gray-500"} />
                  <p className={`flex-1 text-sm ${t.completed ? "line-through text-gray-500" : "text-ink dark:text-amber-50"}`}>
                    {t.title}
                  </p>
                  {t.priority === "high" && <span className="chip chip-red">Siege</span>}
                  {meta && (
                    <span className="chip" style={{ background: `${meta.color}25`, color: meta.color }}>
                      {meta.emoji} {meta.name}
                    </span>
                  )}
                </div>
              );
            })}
            {recentTasks.length === 0 && (
              <p className="text-sm serif-body italic text-center py-6" style={{ color: "var(--k-gold-deep, #9c7a1a)" }}>
                No campaigns forged yet — issue your first decree.
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-lacquer p-6"
        >
          <h3 className="text-lg font-imperial uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--k-gold, #fde68a)" }}>Forge Tip</h3>
          <div className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(185,28,28,0.15), rgba(212,175,55,0.12))",
              border: "1px solid rgba(212,175,55,0.3)",
            }}>
            <Zap size={22} style={{ color: "#d4af37" }} className="mb-2" />
            <p className="text-sm serif-body leading-relaxed">
              Twenty-five minutes of hammering steel, five minutes of breath.
              Repeat four times, then rest like a king. The blade remembers.
            </p>
          </div>
          <button
            onClick={() => onNavigateView?.("pomodoro")}
            className="btn-primary w-full mt-4"
          >
            Enter the forge
          </button>
        </motion.div>
      </div>
    </div>
  );
}
