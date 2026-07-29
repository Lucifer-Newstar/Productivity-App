"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import Tasks from "../components/Tasks";
import Pomodoro from "../components/Pomodoro";
import Notes from "../components/Notes";
import Habits from "../components/Habits";
import Calendar from "../components/Calendar";
import ProjectsPage from "../pages/projects/page";
import WorkoutPage from "../pages/workout/page";
import CareerPage from "../pages/career/page";
import EntertainmentPage from "../pages/entertainment/page";
import HealthPage from "../pages/health/page";
import type { View } from "../lib/types";
import { Bell, Search } from "lucide-react";

export default function App() {
  const [view, setView] = useState<View>("dashboard");

  const views: Record<View, React.ReactNode> = {
    dashboard: <Dashboard setView={setView} />,
    tasks: <Tasks />,
    pomodoro: <Pomodoro />,
    notes: <Notes />,
    habits: <Habits />,
    calendar: <Calendar />,
    projects: <ProjectsPage />,
    workout: <WorkoutPage />,
    career: <CareerPage />,
    entertainment: <EntertainmentPage />,
    health: <HealthPage />,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar view={view} setView={setView} />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 px-8 py-4 flex items-center gap-4 backdrop-blur-xl bg-bg/60 border-b border-white/5">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="Search anything..."
              className="w-full bg-bg-card/60 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent/50 transition"
            />
          </div>
          <button className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
            <Bell size={18} className="text-gray-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-pink" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center text-sm font-bold text-white cursor-pointer ring-2 ring-white/10">
            A
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {views[view]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
