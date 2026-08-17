"use client";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleDot,
  Clock3,
  Crosshair,
  Focus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SPACES } from "../lib/types";
import { useEffect, useState } from "react";
import SpaceIcon from "./SpaceIcon";
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
};
export default function Dashboard({
  onNavigateView,
}: {
  onNavigateView?: (v: "tasks" | "pomodoro") => void;
}) {
  const { tasks } = useStore(),
    { theme } = useTheme(),
    [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const done = tasks.filter((t) => t.completed).length,
    open = tasks.length - done,
    priority = tasks.filter(
      (t) => !t.completed && t.priority === "high",
    ).length,
    pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    recent = tasks.slice(0, 5),
    dark = theme === "dark",
    date = time.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  const stats = [
    { label: "Completed", value: done, Icon: Check },
    { label: "Open", value: open, Icon: CircleDot },
    { label: "Priority", value: priority, Icon: Crosshair },
    { label: "Spaces", value: SPACES.length, Icon: Sparkles },
  ];
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="home-dashboard"
    >
      <motion.section variants={item} className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            {date.toUpperCase()} ·{" "}
            {time.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <h1>
            {dark ? (
              <>
                Move with <em>precision.</em>
              </>
            ) : (
              <>
                Make room for <em>what matters.</em>
              </>
            )}
          </h1>
          <p>
            {dark
              ? `One command surface for ${open} open commitments across ${SPACES.length} focused systems.`
              : `A calmer editorial view of today — ${open} open items, ${priority} asking for your attention.`}
          </p>
          <div className="home-hero-actions">
            <button
              onClick={() => onNavigateView?.("tasks")}
              className="home-primary"
            >
              Open task queue <ArrowRight size={15} />
            </button>
            <button
              onClick={() => onNavigateView?.("pomodoro")}
              className="home-secondary"
            >
              <Focus size={15} /> Start focus
            </button>
          </div>
        </div>
        <div className="home-completion-orbit">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="49" pathLength="100" />
            <motion.circle
              cx="60"
              cy="60"
              r="49"
              pathLength="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - pct }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div>
            <strong>{pct}%</strong>
            <span>resolved</span>
          </div>
        </div>
        <div className="home-hero-grid" aria-hidden />
      </motion.section>
      <motion.div variants={item} className="home-stat-grid">
        {stats.map(({ label, value, Icon }, i) => (
          <motion.article
            key={label}
            whileHover={{ y: -5, rotateX: 2 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="home-stat"
          >
            <span>
              <Icon size={16} />
            </span>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>{label}</small>
            <i>0{i + 1}</i>
          </motion.article>
        ))}
      </motion.div>
      <motion.section variants={item} className="home-section">
        <div className="home-section-head">
          <div>
            <span className="home-eyebrow">SYSTEMS</span>
            <h2>Your spaces</h2>
          </div>
          <p>Each system has its own visual language, data model and rhythm.</p>
        </div>
        <div className="home-space-grid">
          {SPACES.map((space, i) => {
            const list = tasks.filter((t) => t.space === space.id),
              active = list.filter((t) => !t.completed).length,
              complete = list.length - active,
              progress = list.length
                ? Math.round((complete / list.length) * 100)
                : 0;
            return (
              <Link href={`/${space.id}`} key={space.id}>
                <motion.article
                  whileHover={{ y: -7, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="home-space-card"
                  style={
                    { "--space-color": space.color } as React.CSSProperties
                  }
                >
                  <div className="home-space-card-top">
                    <span className="home-space-icon">
                      <SpaceIcon space={space.id} size={20} />
                    </span>
                    <span className="home-space-number">0{i + 1}</span>
                  </div>
                  <h3>{space.name}</h3>
                  <p>
                    {active} active · {complete} complete
                  </p>
                  <div className="home-space-progress">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.65 }}
                    />
                  </div>
                  <div className="home-space-enter">
                    Enter system <ArrowRight size={12} />
                  </div>
                </motion.article>
              </Link>
            );
          })}
        </div>
      </motion.section>
      <div className="home-lower-grid">
        <motion.section variants={item} className="home-panel">
          <div className="home-section-head compact">
            <div>
              <span className="home-eyebrow">RECENT</span>
              <h2>Latest activity</h2>
            </div>
            <Clock3 size={18} />
          </div>
          <div className="home-task-list">
            {recent.map((task, i) => {
              const meta = SPACES.find((s) => s.id === task.space)!;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.24 + i * 0.04 }}
                  className="home-task-row"
                >
                  <span className={task.completed ? "is-done" : ""}>
                    {task.completed ? (
                      <Check size={12} />
                    ) : (
                      <CircleDot size={12} />
                    )}
                  </span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      <SpaceIcon space={meta.id} size={10} />
                      {meta.name}
                    </small>
                  </div>
                  <i>{task.priority}</i>
                </motion.div>
              );
            })}
            {!recent.length && (
              <p className="home-empty">
                No activity yet. Add one clear next action.
              </p>
            )}
          </div>
        </motion.section>
        <motion.section variants={item} className="home-panel home-focus-card">
          <span className="home-eyebrow">FOCUS SIGNAL</span>
          <TrendingUp size={25} />
          <h2>
            {priority
              ? `${priority} priority item${priority > 1 ? "s" : ""} need a decision.`
              : "Your priority lane is clear."}
          </h2>
          <p>
            {priority
              ? "Choose the smallest meaningful next step, then protect twenty-five minutes for it."
              : "Use the space to move one important project forward without interruption."}
          </p>
          <button
            onClick={() => onNavigateView?.(priority ? "tasks" : "pomodoro")}
          >
            {priority ? "Review priorities" : "Begin focus block"}
            <ArrowRight size={13} />
          </button>
        </motion.section>
      </div>
    </motion.div>
  );
}
