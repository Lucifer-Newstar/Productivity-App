"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "../lib/store";
import { SPACES } from "../lib/types";

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const { tasks } = useStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
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

  const tasksOnSelected = tasks.filter((t) => new Date(t.createdAt).toISOString().slice(0, 10) === selected);
  const completedOnSelected = tasksOnSelected.filter((t) => t.completed).length;

  const isSameDate = (d: Date, iso: string) => d.toISOString().slice(0, 10) === iso;
  const todayIso = new Date().toISOString().slice(0, 10);

  const tasksOn = (d: Date) => {
    const iso = d.toISOString().slice(0, 10);
    return tasks.filter((t) => new Date(t.createdAt).toISOString().slice(0, 10) === iso);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Calendar</h2>
        <p className="text-gray-400 mt-1">Visualize your tasks across time.</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">{monthName} <span className="gradient-text">{year}</span></h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5"
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
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5"
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
            const dotColors = [...new Set(dayTasks.map((t) => SPACES.find((s) => s.id === t.space)!.color))].slice(0, 3);
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
                    ? "bg-white/5 hover:bg-white/10 border border-transparent"
                    : "bg-transparent text-gray-700"
                }`}
              >
                <span className={`text-sm font-medium ${isToday ? "w-6 h-6 rounded-full bg-gradient-to-r from-accent to-accent-cyan flex items-center justify-center text-white text-xs" : ""}`}>
                  {cell.date.getDate()}
                </span>
                {count > 0 && cell.inMonth && (
                  <div className="absolute bottom-2 right-2 flex gap-0.5">
                    {dotColors.map((c, idx) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">
              {new Date(selected).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <p className="text-sm text-gray-500">
              {tasksOnSelected.length} tasks · {completedOnSelected} completed
            </p>
          </div>
          <button className="btn-ghost text-sm flex items-center gap-1">
            <Plus size={14} /> Add event
          </button>
        </div>
        {tasksOnSelected.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No tasks scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {tasksOnSelected.map((t) => {
            const meta = SPACES.find((s) => s.id === t.space)!;
            return (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: meta.color }} />
                <p className={`flex-1 text-sm ${t.completed ? "line-through text-gray-500" : "text-gray-200"}`}>{t.title}</p>
                <span className="chip" style={{ background: `${meta.color}20`, color: meta.color }}>
                  {meta.emoji} {meta.name}
                </span>
                {t.completed && <span className="chip bg-accent-lime/20 text-accent-lime">Done</span>}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
