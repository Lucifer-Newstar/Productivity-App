"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import TopNav from "../components/TopNav";
import SideNav, { HOME_NAV_ITEMS } from "../components/SideNav";
import Dashboard from "../components/Dashboard";
import Tasks from "../components/Tasks";
import Pomodoro from "../components/Pomodoro";
import Notes from "../components/Notes";
import Habits from "../components/Habits";
import Calendar from "../components/Calendar";
import type { View } from "../lib/types";
import { useTheme } from "../lib/theme";
type CoreView = Exclude<
  View,
  "projects" | "workout" | "career" | "entertainment" | "health"
>;
const VALID: CoreView[] = [
  "dashboard",
  "tasks",
  "pomodoro",
  "notes",
  "habits",
  "calendar",
];
export default function AppShell() {
  const params = useSearchParams(),
    initial = (params?.get("view") as CoreView | null) ?? "dashboard",
    [view, setView] = useState<CoreView>(
      VALID.includes(initial) ? initial : "dashboard",
    ),
    [direction, setDirection] = useState(1),
    { theme } = useTheme();
  useEffect(() => {
    const v = params?.get("view") as CoreView | null;
    if (v && VALID.includes(v)) navigate(v);
  }, [params]);
  const navigate = (next: CoreView) => {
    const a = VALID.indexOf(view),
      b = VALID.indexOf(next);
    setDirection(b >= a ? 1 : -1);
    setView(next);
  };
  const views: Record<CoreView, React.ReactNode> = {
    dashboard: <Dashboard onNavigateView={navigate} />,
    tasks: <Tasks />,
    pomodoro: <Pomodoro />,
    notes: <Notes />,
    habits: <Habits />,
    calendar: <Calendar />,
  };
  return (
    <div className="home-root" data-theme={theme}>
      <TopNav />
      <div className="home-layout">
        <SideNav
          view={view}
          setView={(v) =>
            VALID.includes(v as CoreView) && navigate(v as CoreView)
          }
        />
        <div
          className="home-mobile-nav"
          role="navigation"
          aria-label="Dashboard sections"
        >
          {HOME_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id as CoreView)}
                className={view === item.id ? "is-active" : ""}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <main className="home-main" id="home-main">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.section
              key={view}
              custom={direction}
              variants={{
                enter: (d: number) => ({
                  opacity: 0,
                  x: d * 24,
                  filter: "blur(8px)",
                  scale: 0.99,
                }),
                center: { opacity: 1, x: 0, filter: "blur(0px)", scale: 1 },
                exit: (d: number) => ({
                  opacity: 0,
                  x: d * -18,
                  filter: "blur(6px)",
                  scale: 0.995,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="home-view"
            >
              <div className="home-view-index">
                0{VALID.indexOf(view) + 1} / 0{VALID.length}
              </div>
              {views[view]}
            </motion.section>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
