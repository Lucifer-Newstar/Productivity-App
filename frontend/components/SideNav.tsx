"use client";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListChecks,
  TimerReset,
  NotebookPen,
  Activity,
  CalendarRange,
  Gauge,
} from "lucide-react";
import type { View } from "../lib/types";
import { useStore } from "../lib/store";
const items: { id: View; label: string; caption: string; icon: any }[] = [
  {
    id: "dashboard",
    label: "Overview",
    caption: "Daily command",
    icon: LayoutDashboard,
  },
  { id: "tasks", label: "Tasks", caption: "Execution queue", icon: ListChecks },
  {
    id: "pomodoro",
    label: "Focus",
    caption: "Deep-work timer",
    icon: TimerReset,
  },
  { id: "notes", label: "Notes", caption: "Working memory", icon: NotebookPen },
  { id: "habits", label: "Habits", caption: "Consistency", icon: Activity },
  {
    id: "calendar",
    label: "Calendar",
    caption: "Time map",
    icon: CalendarRange,
  },
];
export { items as HOME_NAV_ITEMS };
export default function SideNav({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  const { tasks } = useStore(),
    completed = tasks.filter((t) => t.completed).length,
    pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  return (
    <aside className="home-sidenav">
      <div className="home-sidenav-kicker">WORKSPACE</div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon,
            active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`home-side-link ${active ? "is-active" : ""}`}
            >
              {active && (
                <motion.span
                  layoutId="home-side-active"
                  className="home-side-active"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="home-side-icon">
                <Icon size={17} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.caption}</small>
              </span>
            </button>
          );
        })}
      </nav>
      <div className="home-progress">
        <div className="home-progress-head">
          <Gauge size={15} />
          <span>DAILY OUTPUT</span>
        </div>
        <div className="home-progress-value">
          <strong>{pct}%</strong>
          <span>
            {completed}/{tasks.length} resolved
          </span>
        </div>
        <div className="home-progress-track">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </aside>
  );
}
