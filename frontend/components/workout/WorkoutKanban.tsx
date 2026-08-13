"use client";

/**
 * WorkoutKanban — simple kanban board for weekly planning.
 *
 * Columns are fixed (Backlog / This Week / Today / In Progress / Done) to keep
 * it fast; cards are draggable between columns via native HTML5 drag/drop
 * (no extra libraries). Each card has a type (strength/cardio/cali/mobility/
 * rest/other) with a color tag, optional sets × reps × weight, quick notes,
 * and a delete button. The quick-add bar at the top lets you drop new cards
 * onto any column. Everything persists through the store to localStorage.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Kanban as KanbanIcon, Plus, Trash2, Dumbbell, Zap, Target,
  Coffee, Sparkles, MoreHorizontal, CheckCircle2, GripVertical, X,
} from "lucide-react";
import { useStore } from "../../lib/store";
import type { KanbanCardType, KanbanColumn, KanbanCard } from "../../lib/types";

const TYPE_META: Record<KanbanCardType, { label: string; color: string; icon: any }> = {
  strength: { label: "Strength", color: "#ec4899", icon: Dumbbell },
  cardio:   { label: "Cardio",   color: "#06b6d4", icon: Zap },
  cali:     { label: "Cali",     color: "#a3e635", icon: Target },
  mobility: { label: "Mobility", color: "#8b5cf6", icon: Sparkles },
  rest:     { label: "Rest",     color: "#f59e0b", icon: Coffee },
  other:    { label: "Other",    color: "#64748b", icon: MoreHorizontal },
};

const COL_TITLES: Record<KanbanColumn["id"], { title: string; hint: string; accent: string }> = {
  "backlog":     { title: "Backlog",      hint: "Someday",                 accent: "#64748b" },
  "this-week":   { title: "This Week",   hint: "Plan for the week",       accent: "#8b5cf6" },
  "today":       { title: "Today",       hint: "On deck",                 accent: "#06b6d4" },
  "in-progress": { title: "In Progress", hint: "Currently doing",         accent: "#f59e0b" },
  "done":        { title: "Done",        hint: "Completed this week",     accent: "#22c55e" },
};

export default function WorkoutKanban() {
  const { workout, addKanbanCard, deleteKanbanCard, updateKanbanCard, moveKanbanCard, clearKanbanDone } = useStore();
  const cols = workout.kanban;

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<KanbanCardType>("strength");
  const [newCol, setNewCol] = useState<KanbanColumn["id"]>("backlog");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  function addCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addKanbanCard(newCol, { title: newTitle.trim(), type: newType });
    setNewTitle("");
  }

  function onDragStart(id: string) { setDragId(id); }
  function onDragEnd() { setDragId(null); setDragOver(null); }
  function onDrop(col: KanbanColumn["id"], idx?: number) {
    if (!dragId) return;
    moveKanbanCard(dragId, col, idx);
    setDragId(null); setDragOver(null);
  }

  function toggleDone(c: KanbanCard) {
    // If a non-done card is checked, move to done; if unchecked, back to today.
    moveKanbanCard(c.id, "done");
  }
  function openEdit(c: KanbanCard) {
    setEditing(c.id);
    setEditNotes(c.notes ?? "");
  }
  function saveEdit(c: KanbanCard) {
    updateKanbanCard(c.id, { notes: editNotes.trim() || undefined });
    setEditing(null);
  }

  const totalCards = cols.reduce((n, c) => n + c.cards.length, 0);
  const doneCount = cols.find(c => c.id === "done")?.cards.length ?? 0;
  const pct = totalCards ? Math.round((doneCount / totalCards) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <KanbanIcon className="text-pink-400" size={22} /> Workout Board
        </h2>
        <p className="text-sm text-gray-400 mt-1">Drag cards between columns to plan your week. Persists automatically.</p>
      </div>

      {/* Progress bar + quick-add */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>This week's completion</span>
              <span className="font-mono text-lime-300">{doneCount}/{totalCards} · {pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-400" />
            </div>
          </div>
          <button onClick={() => { if (confirm("Clear all Done cards?")) clearKanbanDone(); }}
            className="btn-ghost text-xs">Clear done</button>
        </div>

        <form onSubmit={addCard} className="flex gap-2 flex-wrap">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Add a card (e.g. 'Squat 5×5 @ 90kg', 'Zone 2 run 45min')..."
            className="input-base flex-1 min-w-[200px] text-sm" />
          <div className="flex gap-1">
            {(Object.keys(TYPE_META) as KanbanCardType[]).map(t => {
              const m = TYPE_META[t];
              const Icon = m.icon;
              return (
                <button type="button" key={t} onClick={() => setNewType(t)}
                  title={m.label}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition border ${
                    newType === t ? "border-white/40" : "border-white/5 bg-white/5 text-gray-400"
                  }`}
                  style={newType === t ? { background: `${m.color}25`, color: m.color, borderColor: `${m.color}60` } : undefined}>
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
          <select value={newCol} onChange={e => setNewCol(e.target.value as KanbanColumn["id"])}
            className="input-base text-xs py-1.5">
            {cols.map(c => <option key={c.id} value={c.id}>{COL_TITLES[c.id].title}</option>)}
          </select>
          <button className="btn-primary text-sm flex items-center gap-1"><Plus size={14} /> Add</button>
        </form>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cols.map(col => {
          const meta = COL_TITLES[col.id];
          const isOver = dragOver === col.id;
          return (
            <div key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => onDrop(col.id)}
              className={`rounded-2xl p-3 min-h-[280px] border transition ${
                isOver ? "border-pink-400/60 bg-pink-500/5" : "border-white/5 bg-white/[0.02]"
              }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: meta.accent }} />
                <h4 className="text-sm font-semibold text-white">{meta.title}</h4>
                <span className="text-[10px] text-gray-500 font-mono ml-auto">{col.cards.length}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2 -mt-1">{meta.hint}</p>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {col.cards.map((c) => {
                    const tm = TYPE_META[c.type];
                    const isDragging = dragId === c.id;
                    const isDone = col.id === "done";
                    const Icon = tm.icon;
                    return (
                      <motion.div key={c.id} layout
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        draggable
                        onDragStart={() => onDragStart(c.id)}
                        onDragEnd={onDragEnd}
                        className={`group rounded-xl p-3 border text-sm cursor-grab active:cursor-grabbing transition ${
                          isDone ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/5 hover:border-white/15"
                        }`}
                        style={{ borderLeftWidth: 3, borderLeftColor: tm.color }}>
                        <div className="flex items-start gap-2">
                          <GripVertical size={12} className="text-gray-600 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                          <button onClick={() => {
                            if (isDone) moveKanbanCard(c.id, "today");
                            else moveKanbanCard(c.id, "done");
                          }} className="shrink-0 mt-0.5">
                            <CheckCircle2 size={14}
                              className={isDone ? "text-emerald-400" : "text-gray-600 hover:text-emerald-400"} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-white leading-snug ${isDone ? "line-through text-gray-400" : ""}`}>{c.title}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="chip text-[10px]" style={{ background: `${tm.color}25`, color: tm.color }}>
                                <Icon size={10} /> {tm.label}
                              </span>
                              {c.sets && c.reps && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {c.sets}×{c.reps}{c.weightKg ? ` @ ${c.weightKg}kg` : ""}
                                </span>
                              )}
                            </div>
                            {editing === c.id ? (
                              <div className="mt-2 space-y-1">
                                <textarea autoFocus value={editNotes}
                                  onChange={e => setEditNotes(e.target.value)}
                                  placeholder="Notes…"
                                  className="input-base w-full text-xs h-14" />
                                <div className="flex gap-1">
                                  <button onClick={() => saveEdit(c)} className="btn-primary text-[10px] py-1 px-2">Save</button>
                                  <button onClick={() => setEditing(null)} className="btn-ghost text-[10px] py-1 px-2">Cancel</button>
                                </div>
                              </div>
                            ) : c.notes ? (
                              <p className="text-[11px] text-gray-500 mt-1.5 whitespace-pre-wrap">{c.notes}</p>
                            ) : null}
                          </div>
                          <button onClick={() => deleteKanbanCard(c.id)}
                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {editing !== c.id && (
                          <button onClick={() => openEdit(c)}
                            className="mt-2 text-[10px] text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition">
                            {c.notes ? "Edit notes" : "+ notes"}
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {col.cards.length === 0 && (
                  <div className="text-center text-[11px] text-gray-600 py-6 border border-dashed border-white/5 rounded-xl">
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
