"use client";

/**
 * Calendar — month view of tasks.
 * Navigation for prev/next month + Today button; per-day dots colored by which spaces
 * have tasks. Selecting a day lists that day's tasks with space-colored left bars.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarRange, CircleDot, CheckCircle2, Layers3 } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";
import { useStore } from "../lib/store";
import { SPACES } from "../lib/types";
import SpaceIcon from "./SpaceIcon";

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const { tasks } = useStore();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string>(new Date().toISOString().slice(0, 10));

  const { monthMatrix, monthName, year } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    for (let i = 0; i < startDay; i++) {
      cells.push({ date: new Date(year, month, i - startDay + 1), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return { monthMatrix: cells, monthName: first.toLocaleString("en-US", { month: "long" }), year };
  }, [cursor]);

  const tasksOnSelected = tasks.filter((t) => (t.dueDate || new Date(t.createdAt).toISOString().slice(0, 10)) === selected);
  const completedOnSelected = tasksOnSelected.filter((t) => t.completed).length;
  const todayIso = new Date().toISOString().slice(0, 10);

  const tasksOn = (d: Date) => {
    const iso = d.toISOString().slice(0, 10);
    return tasks.filter((t) => (t.dueDate || new Date(t.createdAt).toISOString().slice(0, 10)) === iso);
  };

  return (
    <div className="core-section core-calendar">
      <HomeSectionHeader index="06" eyebrow="Time allocation" title="Commitment Map" description="See where obligations land and inspect the load before the week controls you." icon={CalendarRange} />
      <section className="core-metric-rail" aria-label="Calendar summary">
        <div><CircleDot/><span>Open commitments</span><strong>{tasks.filter(t=>!t.completed).length}</strong></div>
        <div><CheckCircle2/><span>Closed</span><strong>{tasks.filter(t=>t.completed).length}</strong></div>
        <div><CalendarRange/><span>This month</span><strong>{tasks.filter(t=>{const d=new Date(t.dueDate ? `${t.dueDate}T00:00:00` : t.createdAt);return d.getMonth()===cursor.getMonth()&&d.getFullYear()===cursor.getFullYear()}).length}</strong></div>
        <div><Layers3/><span>Active spaces</span><strong>{new Set(tasks.filter(t=>!t.completed).map(t=>t.space)).size}</strong></div>
      </section>

      <div className="calendar-board">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthName} <span className="gradient-text">{year}</span>
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); setSelected(new Date().toISOString().slice(0, 10)); }}
              className="btn-ghost text-sm"
            >
              Today
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Next month"
              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekdayNames.map((d) => (
            <div key={d} className="text-center text-xs uppercase tracking-widest text-gray-500 font-semibold py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthMatrix.map((cell, i) => {
            const iso = cell.date.toISOString().slice(0, 10);
            const isToday = iso === todayIso;
            const isSelected = iso === selected;
            const dayTasks = tasksOn(cell.date);
            const count = dayTasks.length;
            // Up to 3 distinct space-color dots per day (de-duped without Set spread)
            const seen: string[] = [];
            for (const dt of dayTasks) {
              const space = SPACES.find((s) => s.id === dt.space);
              if (space && !seen.includes(space.color)) seen.push(space.color);
              if (seen.length >= 3) break;
            }
            return (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(iso)}
                className={`aspect-square rounded-xl p-2 flex flex-col items-start justify-start text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "bg-gradient-to-br from-accent/30 to-accent-cyan/20 border border-accent/50 shadow-lg shadow-accent/20"
                    : cell.inMonth
                    ? "bg-black/[0.03] dark:bg-white/5 hover:bg-black/[0.06] dark:hover:bg-white/10 border border-transparent"
                    : "bg-transparent text-gray-400 dark:text-gray-700"
                }`}
              >
                <span className={`text-sm font-medium ${
                  isToday
                    ? "w-6 h-6 rounded-full bg-gradient-to-r from-accent to-accent-cyan flex items-center justify-center text-white text-xs shadow"
                    : cell.inMonth ? "text-gray-900 dark:text-white" : ""
                }`}>
                  {cell.date.getDate()}
                </span>
                {count > 0 && cell.inMonth && (
                  <div className="absolute bottom-2 right-2 flex gap-0.5">
                    {seen.map((c, idx) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="calendar-agenda">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {new Date(selected).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <p className="text-sm text-gray-500">
              {tasksOnSelected.length} tasks · {completedOnSelected} completed
            </p>
          </div>
          <span className="calendar-agenda-label">SELECTED DAY</span>
        </div>
        {tasksOnSelected.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No tasks scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {tasksOnSelected.map((t) => {
              const meta = SPACES.find((s) => s.id === t.space)!;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/[0.03] dark:bg-white/5">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: meta.color }} />
                  <p className={`flex-1 text-sm ${t.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>{t.title}</p>
                  <span className="chip" style={{ background: `${meta.color}20`, color: meta.color }}>
                    <SpaceIcon space={meta.id} size={10}/> {meta.name}
                  </span>
                  {t.completed && <span className="chip bg-lime-500/20 text-lime-600 dark:text-accent-lime">Done</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
