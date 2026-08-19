"use client";
/** Renders the cross-space Command Center and its minimum-context Intelligence bridge. */
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Crosshair,
  Focus,
  Gauge,
  Minus,
  Route,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SPACES, type SpaceId } from "../lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpaceIcon from "./SpaceIcon";
import IntelligencePanel from "./IntelligencePanel";
import { buildHomeIntelligence } from "../lib/homeIntelligence";
import { BridgeRevisionTracker } from "../lib/ai/revisions";
import { buildTodaySnapshot } from "../lib/ai/domainBridge";
import { localDateKey } from "../lib/localDate";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055 } },
};
const reveal: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};
const sectionSpace = (section: string): SpaceId | null =>
  section === "projects"
    ? "projects"
    : section === "workout" ||
        section === "career" ||
        section === "health" ||
        section === "entertainment"
      ? section
      : null;

export default function Dashboard({
  onNavigateView,
}: {
  onNavigateView?: (v: "tasks" | "pomodoro") => void;
}) {
  const store = useStore();
  const { theme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [habits, setHabits] = useState<any[]>([]);
  const revisionTracker = useRef<BridgeRevisionTracker | null>(null);
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000);
    try {
      setHabits(JSON.parse(localStorage.getItem("kaizen.habits") || "[]"));
    } catch {}
    return () => clearInterval(id);
  }, []);
  useEffect(() => () => revisionTracker.current?.release(), []);
  const intel = useMemo(
    () => buildHomeIntelligence({ ...store, habits }, time),
    [
      store.tasks,
      store.career,
      store.workout,
      store.forge,
      store.health,
      store.entertainment,
      store.notifications,
      habits,
      time,
    ],
  );
  const buildAiSnapshot = useCallback(() => {
    revisionTracker.current ??= new BridgeRevisionTracker(localStorage, sessionStorage);
    return buildTodaySnapshot({
      tasks: store.tasks,
      forgeTasks: store.forge.tasks.map((task) => ({ id: task.id, title: task.title })),
      notifications: store.notifications.items,
      intelligence: intel,
      now: new Date(),
      tracker: revisionTracker.current,
    });
  }, [store.tasks, store.forge.tasks, store.notifications.items, intel]);
  const dark = theme === "dark";
  const date = time.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const greeting =
    time.getHours() < 12
      ? "Good morning"
      : time.getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  const activeProjects = store.forge.projects.filter(
    (p) => !p.archived && !["done", "dead"].includes(p.status),
  );
  const activeRoadmap = store.career.roadmaps.find(
    (r) => r.status === "active",
  );
  const roadmapMilestones =
    activeRoadmap?.phases.flatMap((p) => p.milestones) ?? [];
  const roadmapPct = roadmapMilestones.length
    ? Math.round(
        (roadmapMilestones.filter((m) => m.done).length /
          roadmapMilestones.length) *
          100,
      )
    : 0;
  const routine = store.workout.routines.find(
    (r) => r.dayOfWeek === time.getDay(),
  );
  const readiness = [...store.workout.readiness].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0]?.score;
  const latestSleep = [...store.health.sleep].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  const water = store.health.water
    .filter((w) => w.date === localDateKey(time))
    .reduce((n, w) => n + w.ml, 0);
  const queue = store.entertainment.items.filter(
    (i) => i.status === "planned" && !i.archived,
  );
  const continuing = store.entertainment.items.find(
    (i) => i.status === "in-progress" && !i.archived,
  );
  const spaceCards = [
    {
      id: "projects" as const,
      title: "Forge",
      headline: `${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"}`,
      meta: `${activeProjects.filter((p) => p.status === "blocked").length} blocked · ${store.forge.tasks.filter((t) => !t.completedAt).length} open tasks`,
      next:
        store.forge.tasks.find((t) => t.nextAction)?.title ||
        store.forge.tasks.find((t) => !t.completedAt)?.title ||
        "Create the next action",
      href: "/projects",
    },
    {
      id: "career" as const,
      title: "Career",
      headline: activeRoadmap?.name || "Set your primary roadmap",
      meta: `${roadmapPct}% roadmap · ${store.career.contacts.filter((c) => c.nextFollowUpAt && c.nextFollowUpAt <= time.getTime()).length} follow-ups`,
      next:
        roadmapMilestones.find((m) => !m.done)?.title ||
        "Review career direction",
      href: "/career/projects",
    },
    {
      id: "workout" as const,
      title: "Workout",
      headline: routine?.name || "No session scheduled",
      meta: `Readiness ${readiness != null ? Math.round(readiness) : "—"} · ${store.workout.sessions.filter((s) => s.endedAt && Date.now() - s.startedAt < 7 * 86400000).length} sessions this week`,
      next: store.workout.prs[0]
        ? `Latest PR · ${store.workout.exercises.find((e) => e.id === store.workout.prs[0].exerciseId)?.name || "Training"}`
        : "Log the next session",
      href: "/workout/overview",
    },
    {
      id: "health" as const,
      title: "Health",
      headline: `Sleep ${latestSleep?.durationHours?.toFixed(1) || "—"}h`,
      meta: `${water}ml water · stress ${[...store.health.mind].sort((a, b) => b.date.localeCompare(a.date))[0]?.stress ?? "—"}/10`,
      next:
        intel.pulse.find((p) => p.key === "health")?.detail ||
        "Review today's signals",
      href: "/health",
    },
    {
      id: "entertainment" as const,
      title: "Afterglow",
      headline: `${queue.length} queued`,
      meta: `${store.entertainment.items.filter((i) => i.status === "in-progress").length} continuing · ${store.entertainment.items.filter((i) => i.status === "completed").length} completed`,
      next: continuing?.title || queue[0]?.title || "Discover something new",
      href: "/entertainment",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="home-dashboard home-command-dashboard"
    >
      <motion.section variants={reveal} className="home-hero command-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            {date.toUpperCase()} ·{" "}
            {time.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <h1>
            {greeting}.<br />
            <em>
              {dark
                ? "Here’s the state of your system."
                : "Here’s what matters today."}
            </em>
          </h1>
          <p className="command-brief">
            <Sparkles size={15} />
            {intel.brief}
          </p>
        </div>
        <div className="command-metrics">
          <div>
            <small>TODAY’S LOAD</small>
            <strong>{intel.today.length + intel.attention.length}</strong>
            <span>signals</span>
          </div>
          <div>
            <small>LIFE PULSE</small>
            <strong>{intel.overall}</strong>
            <span>/ 100</span>
          </div>
        </div>
        <div className="home-hero-grid" aria-hidden />
      </motion.section>

      <motion.section variants={reveal} className="next-action-card">
        <div className="next-action-label">
          <Crosshair size={15} /> NEXT ACTION
        </div>
        {intel.next ? (
          <>
            <div className="next-action-copy">
              <span>{intel.next.space}</span>
              <h2>{intel.next.title}</h2>
              <p>
                {intel.next.reason}
                {intel.next.minutes
                  ? ` · ${intel.next.minutes} min estimated`
                  : ""}
              </p>
            </div>
            <div className="next-action-buttons">
              <button onClick={() => onNavigateView?.("pomodoro")}>
                <Focus size={14} /> Start focus
              </button>
              <Link href={intel.next.href}>
                Open source <ArrowRight size={13} />
              </Link>
            </div>
          </>
        ) : (
          <div className="next-action-copy">
            <h2>Your immediate queue is clear.</h2>
            <p>Choose one meaningful direction and create its next action.</p>
          </div>
        )}
      </motion.section>

      <motion.div variants={reveal}>
        <IntelligencePanel buildSnapshot={buildAiSnapshot} />
      </motion.div>

      <motion.section variants={reveal} className="today-strip home-panel">
        <div className="home-section-head compact">
          <div>
            <span className="home-eyebrow">TODAY</span>
            <h2>Your day</h2>
          </div>
          <CalendarClock size={18} />
        </div>
        <div className="today-grid">
          {intel.today.length ? (
            intel.today.map((entry, i) => (
              <Link
                href={entry.href}
                key={`${entry.title}-${i}`}
                className={`today-item priority-${entry.priority}`}
              >
                <time>{entry.time || "—"}</time>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.space}</span>
                </div>
                <ChevronRight size={13} />
              </Link>
            ))
          ) : (
            <p className="home-empty">
              No dated commitments found. Use the calendar or section planners
              to shape today.
            </p>
          )}
        </div>
      </motion.section>

      <motion.section variants={reveal} className="life-pulse home-panel">
        <div className="home-section-head">
          <div>
            <span className="home-eyebrow">WHERE AM I?</span>
            <h2>Life pulse</h2>
          </div>
          <p>
            Every score is derived from visible data. Hover a row to see its
            formula.
          </p>
        </div>
        <div className="pulse-list">
          {intel.pulse.map((pulse) => (
            <div className="pulse-row" key={pulse.key} title={pulse.formula}>
              <div>
                <strong>{pulse.label}</strong>
                <span>{pulse.detail}</span>
              </div>
              <div className="pulse-track">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${pulse.score}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <b>{pulse.score}</b>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={reveal} className="home-section">
        <div className="home-section-head">
          <div>
            <span className="home-eyebrow">FIVE SYSTEMS</span>
            <h2>What is happening now</h2>
          </div>
          <p>One useful state, one next move — no duplicate dashboards.</p>
        </div>
        <div className="intelligent-space-grid">
          {spaceCards.map((card, i) => {
            const meta = SPACES.find((s) => s.id === card.id)!;
            return (
              <Link href={card.href} key={card.id}>
                <motion.article
                  whileHover={{ y: -6 }}
                  className="intelligent-space-card"
                  style={{ "--space-color": meta.color } as React.CSSProperties}
                >
                  <header>
                    <span>
                      <SpaceIcon space={card.id} size={19} />
                    </span>
                    <i>0{i + 1}</i>
                  </header>
                  <h3>{card.title}</h3>
                  <strong>{card.headline}</strong>
                  <p>{card.meta}</p>
                  <footer>
                    <span>{card.next}</span>
                    <ArrowRight size={13} />
                  </footer>
                </motion.article>
              </Link>
            );
          })}
        </div>
      </motion.section>

      <div className="command-two-column">
        <motion.section
          variants={reveal}
          className="home-panel attention-panel"
        >
          <div className="home-section-head compact">
            <div>
              <span className="home-eyebrow">WHAT NEEDS ATTENTION?</span>
              <h2>Needs attention</h2>
            </div>
            <AlertTriangle size={18} />
          </div>
          <div>
            {intel.attention.length ? (
              intel.attention.map((alert: any) => {
                const sid = sectionSpace(alert.section);
                return (
                  <Link
                    href={alert.actionHref || "/"}
                    key={alert.id}
                    className={`attention-row ${alert.priority}`}
                  >
                    <span>
                      {sid ? (
                        <SpaceIcon space={sid} size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                    </span>
                    <div>
                      <small>
                        {alert.section} · {alert.priority}
                      </small>
                      <strong>{alert.title}</strong>
                      <p>{alert.body}</p>
                    </div>
                    <ArrowRight size={13} />
                  </Link>
                );
              })
            ) : (
              <p className="home-empty">
                No high-priority alerts. The system is stable.
              </p>
            )}
          </div>
        </motion.section>
        <motion.section variants={reveal} className="home-panel timeline-panel">
          <div className="home-section-head compact">
            <div>
              <span className="home-eyebrow">WHAT HAPPENED?</span>
              <h2>Recent growth</h2>
            </div>
            <Clock3 size={18} />
          </div>
          <div>
            {intel.timeline.length ? (
              intel.timeline.slice(0, 6).map((event, i) => (
                <Link
                  href={event.href}
                  key={`${event.title}-${i}`}
                  className="timeline-row"
                >
                  <span />
                  <div>
                    <strong>{event.title}</strong>
                    <small>
                      {event.space} ·{" "}
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </small>
                  </div>
                </Link>
              ))
            ) : (
              <p className="home-empty">
                Significant events will appear as you use the spaces.
              </p>
            )}
          </div>
        </motion.section>
      </div>

      <div className="command-two-column">
        <motion.section variants={reveal} className="home-panel momentum-panel">
          <div className="home-section-head compact">
            <div>
              <span className="home-eyebrow">AM I ACCELERATING?</span>
              <h2>Seven-day momentum</h2>
            </div>
            <Gauge size={18} />
          </div>
          {intel.momentum.map((m) => (
            <div className="momentum-row" key={m.label}>
              <span>{m.label}</span>
              {m.direction === "up" ? (
                <TrendingUp />
              ) : m.direction === "down" ? (
                <TrendingDown />
              ) : (
                <Minus />
              )}
              <strong>
                {m.value > 0 ? "+" : ""}
                {m.value}%
              </strong>
            </div>
          ))}
        </motion.section>
        <motion.section variants={reveal} className="home-panel journey-panel">
          <div className="home-section-head compact">
            <div>
              <span className="home-eyebrow">WHERE AM I GOING?</span>
              <h2>12-week activity arc</h2>
            </div>
            <Route size={18} />
          </div>
          <Trajectory rows={intel.trajectory} />
        </motion.section>
      </div>
    </motion.div>
  );
}

function Trajectory({ rows }: { rows: { label: string; values: number[] }[] }) {
  const colors = ["#38bdf8", "#a78bfa", "#bef264", "#fb7185"];
  return (
    <div className="trajectory">
      <svg viewBox="0 0 600 180" preserveAspectRatio="none">
        {rows.map((row, ri) => {
          const max = Math.max(1, ...row.values);
          const points = row.values
            .map(
              (v, i) =>
                `${(i / 11) * 590 + 5},${155 - (v / max) * 110 - ri * 5}`,
            )
            .join(" ");
          return (
            <motion.polyline
              key={row.label}
              points={points}
              fill="none"
              stroke={colors[ri]}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: ri * 0.1, duration: 0.8 }}
            />
          );
        })}
      </svg>
      <div>
        {rows.map((r, i) => (
          <span key={r.label} style={{ color: colors[i] }}>
            <i />
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
