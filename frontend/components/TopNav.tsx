"use client";

/**
 * TopNav — horizontal top navigation bar for cross-page navigation.
 *
 * Lives at the top of every page. Contains:
 *   - Kaizen brand logo (links home)
 *   - The five Spaces (Projects, Workout, Career, Entertainment, Health) as real
 *     next/link routes — these are the "pages" you navigate between.
 *   - Right cluster: search, theme toggle (sun/moon), notifications, avatar.
 *
 * In-app section switching (Dashboard / Tasks / Pomodoro / ...) lives in the
 * SideNav component, which is only rendered on the home ("/") page.
 *
 * A single shared Framer Motion `layoutId` ("nav-pill") slides between spaces
 * so the active highlight animates smoothly.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Bell, Search, Sun, Moon } from "lucide-react";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SPACES } from "../lib/types";
import { useState } from "react";

export default function TopNav() {
  const { tasks } = useStore();
  const { theme, toggle } = useTheme();
  const pathname = usePathname() || "/";
  const [query, setQuery] = useState("");

  // Active space derived from URL; "/" means home (no space active)
  const activeSpace: string = pathname === "/" ? "" : pathname.replace(/^\//, "").replace(/\/$/, "");

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-bg/70 border-b border-gray-200/60 dark:border-white/5 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
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
        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 hidden md:block" />

        {/* Spaces (cross-page nav) */}
        <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {/* Home link on non-home pages so users can jump back visually */}
          {pathname !== "/" && (
            <Link
              href="/"
              className="hidden md:inline-flex relative items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors group shrink-0 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              🏠 Home
            </Link>
          )}
          {SPACES.map((s) => {
            const active = activeSpace === s.id;
            const count = tasks.filter((t) => t.space === s.id && !t.completed).length;
            return (
              <Link
                key={s.id}
                href={`/${s.id}`}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors group shrink-0"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg border"
                    style={{ background: `${s.color}20`, borderColor: `${s.color}50` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative z-10 text-base ${active ? "" : "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition"}`}>
                  {s.emoji}
                </span>
                <span className={`relative z-10 ${active ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
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
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-40 md:w-52 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:border-accent/50 transition"
            />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition text-gray-700 dark:text-gray-300"
          >
            {theme === "dark" ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-xl bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition text-gray-700 dark:text-gray-300"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-pink" />
          </button>

          {/* Avatar */}
          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/50 dark:ring-white/10 hover:scale-105 transition shrink-0">
            A
          </button>
        </div>
      </div>
    </header>
  );
}
