"use client";

/**
 * CareerNotes — track-scoped notes panel.
 * Sticky-note cards per track with a modal editor (title + free-form text + delete).
 * Respects activeTrackId filter; when 'All' is selected provides internal track tabs.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, StickyNote, Trash2, X } from "lucide-react";
import { useStore } from "../../lib/store";
import type { CareerNote as CareerNoteType } from "../../lib/types";

export default function CareerNotes({ activeTrackId }: { activeTrackId: string | "all" }) {
  const { career, addCareerNote, updateCareerNote, deleteCareerNote } = useStore();
  const visibleTracks = activeTrackId === "all" ? career.tracks : career.tracks.filter((t) => t.id === activeTrackId);

  const [activeInternalId, setActiveInternalId] = useState<string | null>(
    visibleTracks[0]?.id ?? null,
  );
  const [editing, setEditing] = useState<{ trackId: string; id: string } | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeTrackId !== "all") setActiveInternalId(activeTrackId);
    else if (!activeInternalId && visibleTracks[0]) setActiveInternalId(visibleTracks[0].id);
  }, [activeTrackId, visibleTracks, activeInternalId]);

  // use the visible tracks; when "all" allow switching via sub-tabs
  const active =
    (activeTrackId === "all"
      ? visibleTracks.find((t) => t.id === activeInternalId) ?? visibleTracks[0]
      : visibleTracks[0]) ?? null;

  const openNote = editing && active && editing.trackId === active.id
    ? active.notes.find((n) => n.id === editing.id) ?? null
    : null;

  if (visibleTracks.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center border border-dashed border-white/10 text-gray-500 text-sm">
        <StickyNote size={20} className="mx-auto mb-2 text-gray-400" />
        Add a track to start writing notes.
      </div>
    );
  }

  return (
    <div>
      {activeTrackId === "all" && visibleTracks.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {visibleTracks.map((t) => {
            const isActive = active?.id === t.id;
            return (
              <button key={t.id} onClick={() => setActiveInternalId(t.id)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition"
                style={isActive
                  ? { background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)`, color: "white" }
                  : { background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.05)" }}>
                {t.name} <span className="ml-1 text-[10px] opacity-80">({t.notes.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <motion.button whileHover={{ scale: 1.02 }}
              onClick={() => setCreating(true)}
              className="rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 text-gray-500 hover:text-gray-300 p-6 flex flex-col items-center justify-center gap-2 min-h-[180px] transition">
              <Plus size={24} />
              <span className="text-sm font-medium">New note{activeTrackId === "all" ? ` in ${active.name}` : ""}</span>
            </motion.button>

            {active.notes.map((n) => (
              <NoteCard key={n.id} note={n} color={active.color} onClick={() => setEditing({ trackId: active.id, id: n.id })} />
            ))}
          </div>

          <AnimatePresence>
            {(creating || openNote) && (
              <NoteModal
                color={active.color}
                trackId={active.id}
                note={openNote}
                creating={creating}
                onClose={() => { setEditing(null); setCreating(false); }}
                onSave={(title, content) => {
                  if (creating) addCareerNote(active.id, title || "Untitled", content);
                  else if (openNote) updateCareerNote(active.id, openNote.id, { title: title || "Untitled", content });
                  setEditing(null); setCreating(false);
                }}
                onDelete={(id) => { deleteCareerNote(active.id, id); setEditing(null); }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function NoteCard({ note, color, onClick }: { note: CareerNoteType; color: string; onClick: () => void }) {
  return (
    <motion.button layout whileHover={{ y: -3 }} onClick={onClick}
      className="rounded-2xl p-4 text-left transition overflow-hidden relative min-h-[180px] flex flex-col"
      style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)`, border: `1px solid ${color}30` }}>
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: color }} />
      <h5 className="font-semibold text-white truncate mb-2">{note.title || "Untitled"}</h5>
      <p className="text-sm text-gray-400 line-clamp-5 whitespace-pre-wrap flex-1">
        {note.content || <span className="text-gray-600 italic">Click to write...</span>}
      </p>
      <p className="text-[10px] text-gray-600 mt-3">
        {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
    </motion.button>
  );
}

/**
 * NoteModal — popover editor for a career track note.
 * Props:
 *  - `onSave(title, content)` fires when the user clicks Save/Create
 *  - `onDelete(id)` fires when the user clicks the delete trash icon
 */
function NoteModal({
  color, note, creating, onClose, onSave, onDelete,
}: {
  color: string;
  trackId: string;
  note: CareerNoteType | null;
  creating: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-6" style={{ background: `linear-gradient(135deg, ${color}1a, #12121a)`, border: `1px solid ${color}40` }}>
        <div className="flex items-center justify-between mb-4">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="flex-1 bg-transparent text-xl font-semibold text-white placeholder:text-gray-600 outline-none mr-2" />
          <div className="flex gap-1">
            {!creating && note && (
              <button onClick={() => onDelete(note.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400"><X size={18} /></button>
          </div>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..." rows={10}
          className="w-full bg-white/5 rounded-lg p-3 text-sm text-white placeholder:text-gray-600 outline-none border border-white/5 focus:border-white/20 resize-none leading-relaxed" />
        <div className="flex justify-end mt-4 gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => onSave(title, content)} className="px-5 py-2 rounded-xl text-sm font-medium text-white transition hover:-translate-y-0.5" style={{ background: color }}>
            {creating ? "Create note" : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
