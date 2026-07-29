"use client";

/**
 * TrackTabs — add/edit/delete chips for career tracks (DevOps, SRE, etc.).
 * Used at the top of the career page and accepts activeTrackId / onChange so the
 * parent controls which track is selected. Includes an 'All' chip and an 8-color
 * palette for new/editing tracks.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Pencil, Trash2 } from "lucide-react";
import { useStore } from "../../lib/store";

const TRACK_COLORS = ["#06b6d4", "#8b5cf6", "#ec4899", "#a3e635", "#f59e0b", "#3b82f6", "#f43f5e", "#14b8a6"];

export default function TrackTabs({
  activeTrackId,
  onChange,
}: {
  activeTrackId: string | "all";
  onChange: (id: string | "all") => void;
}) {
  const { career, addTrack, updateTrack, deleteTrack } = useStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TRACK_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(TRACK_COLORS[0]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ALL */}
      <button
        onClick={() => onChange("all")}
        className="relative px-4 py-2 rounded-xl text-sm font-medium transition"
        style={
          activeTrackId === "all"
            ? { background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", color: "white", boxShadow: "0 8px 24px -8px rgba(139,92,246,0.5)" }
            : { background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.05)" }
        }
      >
        All
      </button>

      {career.tracks.map((t) =>
        editingId === t.id ? (
          <TrackEditor
            key={t.id}
            color={editColor}
            setColor={setEditColor}
            name={editName}
            setName={setEditName}
            onSave={() => {
              if (editName.trim()) updateTrack(t.id, { name: editName.trim(), color: editColor });
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <TrackChip
            key={t.id}
            track={t}
            active={activeTrackId === t.id}
            onClick={() => onChange(t.id)}
            onEdit={() => { setEditingId(t.id); setEditName(t.name); setEditColor(t.color); }}
            onDelete={() => {
              if (confirm(`Delete "${t.name}" track? Its milestones/notes/bullets will be removed.`)) {
                deleteTrack(t.id);
                if (activeTrackId === t.id) onChange("all");
              }
            }}
          />
        )
      )}

      <AnimatePresence>
        {adding ? (
          <TrackEditor
            color={newColor}
            setColor={setNewColor}
            name={newName}
            setName={setNewName}
            onSave={() => {
              if (newName.trim()) {
                // addTrack returns nothing; find the new track by name to auto-select it
                addTrack(newName.trim(), newColor);
                // select after state update — defer so career.tracks updates
                setTimeout(() => {
                  // fallback: keep "all" — user can click the new chip
                }, 0);
                setNewName(""); setAdding(false);
              }
            }}
            onCancel={() => { setAdding(false); setNewName(""); }}
          />
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition"
          >
            <Plus size={14} /> Add track
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrackChip({
  track, active, onClick, onEdit, onDelete,
}: {
  track: { id: string; name: string; color: string; milestones?: any[]; notes?: any[]; resumeBullets?: any[] };
  active: boolean; onClick: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div
      className="group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer"
      onClick={onClick}
      style={
        active
          ? { background: `linear-gradient(135deg, ${track.color}, ${track.color}cc)`, color: "white", boxShadow: `0 8px 24px -8px ${track.color}80` }
          : { background: `${track.color}18`, color: track.color, border: `1px solid ${track.color}40` }
      }
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "white" : track.color }} />
      {track.name}
      <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
        <button onClick={onEdit} className="p-0.5 rounded hover:bg-white/10" title="Rename">
          <Pencil size={11} />
        </button>
        <button onClick={onDelete} className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-200" title="Delete">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function TrackEditor({
  color, setColor, name, setName, onSave, onCancel,
}: {
  color: string; setColor: (c: string) => void;
  name: string; setName: (n: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/10 border border-white/20"
    >
      <div className="flex gap-1">
        {TRACK_COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-3.5 h-3.5 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white/60" : "hover:scale-110"}`}
            style={{ background: c }} />
        ))}
      </div>
      <input
        autoFocus value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
        placeholder="Track name"
        className="bg-transparent text-sm text-white placeholder:text-gray-500 outline-none w-28" />
      <button onClick={onSave} className="p-0.5 rounded hover:bg-white/10 text-accent-lime"><Check size={12} /></button>
      <button onClick={onCancel} className="p-0.5 rounded hover:bg-white/10 text-gray-400"><X size={12} /></button>
    </motion.div>
  );
}
