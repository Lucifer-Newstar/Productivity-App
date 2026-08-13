"use client";

/**
 * AppShell — the main SPA layout (rendered at "/").
 *
 * Layout:
 *   - TopNav: cross-page navigation (Spaces, brand, theme, search, avatar).
 *   - SideNav (only on "/"): in-app section switcher for the home experience
 *     (Dashboard, Tasks, Pomodoro, Notes, Habits, Calendar).
 *   - Main: animated view swap via AnimatePresence.
 *
 * On standalone space pages (/projects, /workout, ...), `pages/_app.tsx` renders
 * its own shell: TopNav at the top + the space page content (no SideNav).
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import TopNav from "../components/TopNav";
import SideNav from "../components/SideNav";
import Dashboard from "../components/Dashboard";
import Tasks from "../components/Tasks";
import Pomodoro from "../components/Pomodoro";
import Notes from "../components/Notes";
import Habits from "../components/Habits";
import Calendar from "../components/Calendar";
import type { View } from "../lib/types";

// In-app sections of the home page (SideNav switches between these)
type CoreView = Exclude<View, "projects" | "workout" | "career" | "entertainment" | "health">;
const VALID_CORE: CoreView[] = ["dashboard", "tasks", "pomodoro", "notes", "habits", "calendar"];

export default function AppShell() {
  const searchParams = useSearchParams();
  const initialView = (searchParams?.get("view") as CoreView | null) ?? "dashboard";

  const [view, setView] = useState<CoreView>(
    VALID_CORE.includes(initialView) ? initialView : "dashboard",
  );

  useEffect(() => {
    const v = (searchParams?.get("view") as CoreView | null) ?? null;
    if (v && VALID_CORE.includes(v)) setView(v);
  }, [searchParams]);

  const goTo = (v: CoreView) => setView(v);

  const views: Record<CoreView, React.ReactNode> = {
    dashboard: <Dashboard onNavigateView={goTo} />,
    tasks: <Tasks />,
    pomodoro: <Pomodoro />,
    notes: <Notes />,
    habits: <Habits />,
    calendar: <Calendar />,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <div className="flex flex-1 w-full">
        {/* Left SideNav: in-app sections (only on home) */}
        <SideNav view={view} setView={(v) => {
          if ((VALID_CORE as string[]).includes(v)) setView(v as CoreView);
        }} />

        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {views[view]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
