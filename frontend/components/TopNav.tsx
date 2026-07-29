"use client";

/**
 * TopNav — horizontal top navigation bar.
 *
 * Replaces the old left Sidebar. Sections:
 *   - Brand logo (Kaizen) with sparkles icon
 *   - Core tool links (Dashboard, Tasks, Pomodoro, Notes, Habits, Calendar) — these
 *     are in-SPA views; an `activeView` prop + callback highlights the current one.
 *   - Spaces (Projects, Workout, Career, Entertainment, Health) — these navigate to
 *     standalone pages at `/<space>` via next/link.
 *   - Right side: search, theme toggle (sun/moon), notifications, avatar.
 *
 * A single shared Framer Motion `layoutId` ("nav-pill") slides across ALL nav items
 * so the active highlight animates smoothly between core tools and spaces.
 *
 * Used by both the App Router shell (app/page.tsx) and the Pages Router wrapper
 * (pages/_app.tsx) so standalone `/career`, `/workout`, etc. pages get the same nav.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid, CheckSquare, Timer, StickyNote, Flame, CalendarDays,
  Sparkles, Bell, Search, Sun, Moon,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SPACES } from "../lib/types";
import type { View } from "../lib/types";
import { useState } from "react";

// Core in-app tools — these stay as SPA views inside app/page.tsx
const coreItems: { id: View; label: string; icon: any; route: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid,   route: "/" },
  { id: "tasks",     label: "Tasks",     icon: CheckSquare,  route: "/?view=tasks" },
  { id: "pomodoro",  label: "Pomodoro",  icon: Timer,        route: "/?view=pomodoro" },
  { id: "notes",     label: "Notes",     icon: StickyNote,   route: "/?view=notes" },
  { id: "habits",    label: "Habits",    icon: Flame,        route: "/?view=habits" },
  { id: "calendar",  label: "Calendar",  icon: CalendarDays, route: "/?view=calendar" },
];

interface TopNavProps {
  /** Currently-active SPA view (only meaningful when on the "/" page). */
  activeView?: View;
  /** Navigate to an in-app view (SPA). */
  onNavigateView?: (v: View) => void;
}

export default function TopNav({ activeView = "dashboard", onNavigateView }: TopNavProps) {
  const { tasks } = useStore();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  // The "active" id is derived from the URL for spaces, or the activeView for core
  const activeId: string =
    pathname && pathname !== "/"
      ? pathname.replace(/^\//, "").replace(/\/$/, "") // e.g. "/workout" -> "workout"
      : activeView;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-bg/70 dark:bg-bg/70 border-b border-black/5 dark:border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group" onClick={() => onNavigateView?.("dashboard")}>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center glow-violet transition-transform group-hover:scale-105">
            <Sparkles size={18} className="text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent to-accent-cyan blur-md opacity-40 -z-10" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold gradient-text tracking-tight leading-none">Kaizen</h1>
            <p className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-widest mt-0.5">Continuous growth</p>
          </div>
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-black/10 dark:bg-white/10 hidden md:block" />

        {/* Core nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {coreItems.map((item) => {
            const Icon = item.icon;
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (pathname !== "/") router.push(item.route);
                  else onNavigateView?.(item.id);
                }}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors group"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/20 to-accent-cyan/10 border border-accent/30 dark:border-accent/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon size={16} className={`relative z-10 ${active ? "text-accent" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"}`} />
                <span className={`relative z-10 ${active ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-6 w-px bg-black/10 dark:bg-white/10 hidden lg:block" />

        {/* Spaces */}
        <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {SPACES.map((s) => {
            const active = activeId === s.id;
            const count = tasks.filter((t) => t.space === s.id && !t.completed).length;
            return (
              <Link
                key={s.id}
                href={`/${s.id}`}
                onClick={() => onNavigateView?.(s.id as View)}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors group shrink-0"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg border"
                    style={{ background: `${s.color}20`, borderColor: `${s.color}50` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative z-10 text-base ${active ? "" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition"}`}>
                  {s.emoji}
                </span>
                <span className={`relative z-10 ${active ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"}`}>
                  {s.name}
                </span>
                {count > 0 && (
                  <span
                    className="relative z-10 ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: s.color }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-44 md:w-56 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-accent/50 transition"
            />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition"
          >
            {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-gray-700" />}
          </button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition"
          >
            <Bell size={17} className="text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-pink" />
          </button>

          {/* Avatar */}
          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10 dark:ring-white/10 hover:scale-105 transition shrink-0">
            A
          </button>
        </div>
      </div>
    </header>
  );
}
