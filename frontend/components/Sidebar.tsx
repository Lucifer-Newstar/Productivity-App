"use client";

/**
 * Sidebar — persistent left navigation.
 *
 * - Top section: core productivity tools (Dashboard, Tasks, Pomodoro, Notes, Habits, Calendar)
 * - Middle section: the five life Spaces (Projects, Workout, Career, Entertainment, Health).
 *   Pulled from SPACES so colors/emojis stay in sync with the task model.
 * - Bottom section: Today's Progress widget (completed tasks %) + a Settings placeholder.
 *
 * Uses a single Framer Motion `layoutId` ("nav-pill") shared by both sections so the
 * active highlight slides smoothly between ANY nav item — core or space.
 *
 * State is controlled: parent passes `view`/`setView`, Sidebar just renders buttons.
 */

import { motion } from "framer-motion";
import {
  LayoutGrid,
  CheckSquare,
  Timer,
  StickyNote,
  Flame,
  CalendarDays,
  Sparkles,
  Settings,
} from "lucide-react";
import type { View, SpaceId } from "../lib/types";
import { SPACES } from "../lib/types";
import { useStore } from "../lib/store";

const coreItems: { id: View; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "tasks",     label: "Tasks",     icon: CheckSquare },
  { id: "pomodoro",  label: "Pomodoro",  icon: Timer },
  { id: "notes",     label: "Notes",     icon: StickyNote },
  { id: "habits",    label: "Habits",    icon: Flame },
  { id: "calendar",  label: "Calendar",  icon: CalendarDays },
];

const spaceItems: { id: SpaceId }[] = SPACES.map((s) => ({ id: s.id }));

export default function Sidebar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const { tasks } = useStore();
  const completedToday = tasks.filter((t) => t.completed).length;

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 glass border-r border-white/5 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center glow-violet">
            <Sparkles size={18} className="text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent to-accent-cyan blur-md opacity-40 -z-10" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text tracking-tight">Kaizen</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Continuous growth</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {coreItems.map((item) => {
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
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/20 to-accent-cyan/10 border border-accent/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={18} className={active ? "text-accent relative z-10" : "text-gray-400 group-hover:text-gray-200 relative z-10"} />
              <span className={active ? "text-white relative z-10" : "text-gray-400 group-hover:text-gray-200 relative z-10"}>
                {item.label}
              </span>
            </button>
          );
        })}

        <div className="pt-6 pb-2 px-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Spaces</p>
        </div>

        {spaceItems.map(({ id }) => {
          const meta = SPACES.find((s) => s.id === id)!;
          const active = view === id;
          const count = tasks.filter((t) => t.space === id && !t.completed).length;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className="relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl border"
                  style={{ background: `${meta.color}20`, borderColor: `${meta.color}50` }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className={`text-base relative z-10 ${active ? "" : "grayscale opacity-80"}`}>{meta.emoji}</span>
              <span className={`relative z-10 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                {meta.name}
              </span>
              {count > 0 && (
                <span
                  className="relative z-10 ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: meta.color }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-3">
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-accent-amber" />
            <p className="text-xs font-semibold text-gray-300">Today's Progress</p>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{completedToday}</p>
              <p className="text-[11px] text-gray-500">tasks completed</p>
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent-cyan/20 border border-white/10">
              <span className="text-sm font-bold gradient-text">
                {tasks.length ? Math.round((completedToday / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
}
