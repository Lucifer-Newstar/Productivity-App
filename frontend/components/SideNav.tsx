"use client";

/**
 * SideNav — left vertical navigation shown ONLY on the home ("/") page.
 *
 * Lets the user switch between the in-app "sections" of the main page:
 * Dashboard, Tasks, Pomodoro, Notes, Habits, Calendar. These are sub-views of
 * the Kaizen home experience, not separate pages.
 *
 * Bottom: Today's Progress widget (completed-tasks %) + a Settings placeholder.
 *
 * Uses a single Framer Motion `layoutId` ("sidenav-pill") so the active
 * highlight slides smoothly between items.
 */

import { motion } from "framer-motion";
import {
  LayoutGrid, CheckSquare, Timer, StickyNote, Flame, CalendarDays,
  Sparkles, Settings,
} from "lucide-react";
import type { View } from "../lib/types";
import { useStore } from "../lib/store";

const items: { id: View; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "tasks",     label: "Tasks",     icon: CheckSquare },
  { id: "pomodoro",  label: "Pomodoro",  icon: Timer },
  { id: "notes",     label: "Notes",     icon: StickyNote },
  { id: "habits",    label: "Habits",    icon: Flame },
  { id: "calendar",  label: "Calendar",  icon: CalendarDays },
];

export default function SideNav({
  view, setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  const { tasks } = useStore();
  const completedToday = tasks.filter((t) => t.completed).length;

  return (
    <aside className="hidden md:flex w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 flex-col glass border-r border-gray-200/60 dark:border-white/5">
      {/* Mini section header */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Menu</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group"
            >
              {active && (
                <motion.div
                  layoutId="sidenav-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/20 to-accent-cyan/10 border border-accent/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={18} className={`relative z-10 ${active ? "text-accent" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"}`} />
              <span className={`relative z-10 ${active ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-3">
        <div className="glass rounded-xl p-4 border border-gray-200/60 dark:border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-accent-amber" />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Today's Progress</p>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedToday}</p>
              <p className="text-[11px] text-gray-500">tasks completed</p>
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent-cyan/20 border border-gray-200 dark:border-white/10">
              <span className="text-sm font-bold gradient-text">
                {tasks.length ? Math.round((completedToday / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
}
