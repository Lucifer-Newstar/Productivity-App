"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, PinOff, Trash2, X, StickyNote, Search } from "lucide-react";
import { useStore } from "../lib/store";

const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#a3e635", "#f59e0b", "#f43f5e"];

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftColor, setDraftColor] = useState(COLORS[0]);

  const filtered = notes
    .filter((n) => !query || (n.title + n.content).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);

  const current = notes.find((n) => n.id === editing);

  const createNote = () => {
    if (!draftTitle.trim() && !draftContent.trim()) { setShowNew(false); return; }
    addNote({
      title: draftTitle.trim() || "Untitled",
      content: draftContent,
      color: draftColor,
    });
    setDraftTitle("");
    setDraftContent("");
    setDraftColor(COLORS[0]);
    setShowNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Notes</h2>
          <p className="text-gray-400 mt-1">{notes.length} notes · Capture thoughts fast.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-bg-card/60 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent/50 w-64"
            />
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New note
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setEditing(n.id)}
            className="group relative rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${n.color}22, ${n.color}08)`,
              border: `1px solid ${n.color}30`,
              boxShadow: `0 8px 32px -12px ${n.color}40`,
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: n.color }} />
            {n.pinned && (
              <Pin size={14} className="absolute top-3 right-3" style={{ color: n.color }} />
            )}
            <div className="flex items-start gap-2 mb-2">
              <StickyNote size={16} style={{ color: n.color }} className="mt-0.5 shrink-0" />
              <h3 className="font-semibold text-white truncate flex-1">{n.title}</h3>
            </div>
            <p className="text-sm text-gray-400 line-clamp-5 whitespace-pre-wrap leading-relaxed">{n.content || "No content yet..."}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {new Date(n.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePinNote(n.id); }}
                  className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  {n.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                  className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !showNew && (
          <div onClick={() => setShowNew(true)} className="sm:col-span-2 lg:col-span-3 rounded-2xl border-2 border-dashed border-white/10 p-12 text-center cursor-pointer hover:border-accent/40 transition-colors">
            <Plus size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500">No notes yet — click to create your first note</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl p-6 glass border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">New note</h3>
                <button onClick={() => setShowNew(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <input
                autoFocus
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-gray-600 outline-none mb-3"
              />
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Start writing..."
                rows={8}
                className="w-full bg-white/5 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 outline-none resize-none border border-white/5 focus:border-white/10"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setDraftColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${draftColor === c ? "scale-110 ring-2 ring-white/60" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <button onClick={createNote} className="btn-primary">Create note</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl p-6"
              style={{
                background: `linear-gradient(135deg, ${current.color}22, #12121a)`,
                border: `1px solid ${current.color}40`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: current.color }} />
                  <input
                    value={current.title}
                    onChange={(e) => updateNote(current.id, { title: e.target.value })}
                    className="flex-1 bg-transparent text-xl font-semibold text-white outline-none"
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePinNote(current.id)} className="p-2 rounded-lg hover:bg-white/10 text-gray-300">
                    {current.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button onClick={() => { deleteNote(current.id); setEditing(null); }} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/10 text-gray-300">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <textarea
                value={current.content}
                onChange={(e) => updateNote(current.id, { content: e.target.value })}
                placeholder="Start writing..."
                rows={12}
                className="w-full bg-white/5 rounded-lg p-4 text-sm text-white placeholder:text-gray-500 outline-none resize-none border border-white/5 focus:border-white/10 leading-relaxed"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateNote(current.id, { color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${current.color === c ? "scale-110 ring-2 ring-white/60" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Last edited {new Date(current.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
