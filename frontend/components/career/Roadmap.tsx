"use client";

/**
 * Roadmap — the career page's concepts/sub-concepts viewer.
 *
 * - Top-level concepts are displayed as collapsible cards (each tinted by the track color).
 * - Inside each concept, an ordered checklist of sub-concepts with checkboxes.
 * - Both concepts and sub-concepts support add / inline rename / delete.
 * - Accepts an `activeTrackId` prop: when set to a single track it locks to that track;
 *   when "all" it renders a sub-tab bar to switch between tracks.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Check, Trash2, Map, ChevronDown, Pencil, X,
} from "lucide-react";
import { useStore } from "../../lib/store";
import type { CareerConcept, CareerTrack } from "../../lib/types";

export default function Roadmap({ activeTrackId }: { activeTrackId: string | "all" }) {
  const {
    career,
    addConcept, updateConcept, deleteConcept,
    addSubConcept, toggleSubConcept, updateSubConcept, deleteSubConcept,
  } = useStore();

  // Currently selected track (for internal switching when "All" is active)
  const [openTrackId, setOpenTrackId] = useState<string | null>(
    activeTrackId !== "all" ? activeTrackId : career.tracks[0]?.id ?? null,
  );

  // Which concepts are expanded — keyed by concept id
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Inline editing state
  const [editingConcept, setEditingConcept] = useState<string | null>(null);
  const [editConceptText, setEditConceptText] = useState("");
  const [editingSub, setEditingSub] = useState<string | null>(null); // key = `${conceptId}:${subId}`
  const [editSubText, setEditSubText] = useState("");

  // New item input state: trackId -> conceptId -> text
  const [newConceptText, setNewConceptText] = useState("");
  const [newSubText, setNewSubText] = useState<Record<string, string>>({});

  // When parent filter forces a track, sync internal selection
  const visibleTracks = activeTrackId === "all" ? career.tracks : career.tracks.filter((t) => t.id === activeTrackId);
  useEffect(() => {
    if (activeTrackId !== "all") setOpenTrackId(activeTrackId);
    else if (!openTrackId && career.tracks[0]) setOpenTrackId(career.tracks[0].id);
  }, [activeTrackId, career.tracks, openTrackId]);

  const active = visibleTracks.find((t) => t.id === openTrackId) ?? visibleTracks[0];

  if (career.tracks.length === 0) {
    return (
      <EmptyHint icon={<Map size={20} />} text="Add a career track (e.g. DevOps, SRE) to start building roadmaps." />
    );
  }
  if (!active) return null;

  const totalSubs = active.concepts.reduce((n, c) => n + c.subConcepts.length, 0);
  const doneSubs  = active.concepts.reduce((n, c) => n + c.subConcepts.filter((s) => s.done).length, 0);
  const pct = totalSubs ? Math.round((doneSubs / totalSubs) * 100) : 0;

  // ----- helpers -----
  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));
  const startEditConcept = (c: CareerConcept) => { setEditingConcept(c.id); setEditConceptText(c.title); };
  const saveEditConcept = (id: string) => {
    if (editConceptText.trim()) updateConcept(active.id, id, { title: editConceptText.trim() });
    setEditingConcept(null);
  };
  const startEditSub = (cid: string, sid: string, title: string) => {
    setEditingSub(`${cid}:${sid}`); setEditSubText(title);
  };
  const saveEditSub = (cid: string, sid: string) => {
    if (editSubText.trim()) updateSubConcept(active.id, cid, sid, { title: editSubText.trim() });
    setEditingSub(null);
  };

  return (
    <div>
      {/* Track switcher (only when viewing All) */}
      {activeTrackId === "all" && visibleTracks.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {visibleTracks.map((t) => {
            const isActive = t.id === active.id;
            const tDone = t.concepts.reduce((n, c) => n + c.subConcepts.filter((s) => s.done).length, 0);
            const tTotal = t.concepts.reduce((n, c) => n + c.subConcepts.length, 0);
            return (
              <button key={t.id} onClick={() => setOpenTrackId(t.id)}
                className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={isActive
                  ? { background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)`, color: "white", boxShadow: `0 8px 24px -8px ${t.color}80` }
                  : { background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span>{t.name}</span>
                {tTotal > 0 && <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-white/10"}`}>{tDone}/{tTotal}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Track header + progress */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 mb-5" style={{ background: `${active.color}08`, border: `1px solid ${active.color}30` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: `${active.color}30`, color: active.color }}>
            {active.name[0]}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold" style={{ color: active.color }}>{active.name} Roadmap</h4>
            <p className="text-xs text-gray-400">{doneSubs} of {totalSubs} sub-concepts complete across {active.concepts.length} concepts</p>
          </div>
          <span className="text-2xl font-bold" style={{ color: active.color }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${active.color}, ${active.color}80)` }} />
        </div>
      </motion.div>

      {/* Add new concept */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newConceptText.trim()) return;
          addConcept(active.id, newConceptText.trim());
          setNewConceptText("");
        }}
        className="flex items-center gap-2 mb-4"
      >
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 focus-within:border-white/20 transition">
          <Plus size={16} className="text-gray-500" />
          <input value={newConceptText} onChange={(e) => setNewConceptText(e.target.value)}
            placeholder="Add a concept (e.g. Linux Fundamentals, CI/CD)..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <button type="submit" disabled={!newConceptText.trim()}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition hover:-translate-y-0.5"
          style={{ background: active.color }}>Add concept</button>
      </form>

      {/* Concepts list */}
      <div className="space-y-3">
        {active.concepts.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">No concepts yet. Add your first one above ↑</p>
        )}
        <AnimatePresence initial={false}>
          {active.concepts.map((concept, idx) => {
            const subDone = concept.subConcepts.filter((s) => s.done).length;
            const subTotal = concept.subConcepts.length;
            const subPct = subTotal ? Math.round((subDone / subTotal) * 100) : 0;
            const isOpen = expanded[concept.id] ?? (subTotal > 0 && subDone < subTotal); // auto-open incomplete
            const newSubVal = newSubText[concept.id] ?? "";

            return (
              <motion.div key={concept.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl glass overflow-hidden" style={{ borderColor: `${active.color}20` }}>
                {/* Concept header */}
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => toggleExpand(concept.id)}>
                  <button onClick={(e) => { e.stopPropagation(); toggleExpand(concept.id); }}
                    className="shrink-0 p-1 rounded-md hover:bg-white/10 text-gray-400 transition">
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: `${active.color}25`, color: active.color }}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    {editingConcept === concept.id ? (
                      <input autoFocus value={editConceptText}
                        onChange={(e) => setEditConceptText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => saveEditConcept(concept.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEditConcept(concept.id); if (e.key === "Escape") setEditingConcept(null); }}
                        className="w-full bg-white/10 rounded px-2 py-0.5 text-sm text-white outline-none" />
                    ) : (
                      <h5 onDoubleClick={(e) => { e.stopPropagation(); startEditConcept(concept); }}
                        className="text-sm font-semibold text-white cursor-text">{concept.title}</h5>
                    )}
                  </div>
                  {/* mini progress */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${subPct}%`, background: active.color }} />
                    </div>
                    <span className="text-[10px] text-gray-500 tabular-nums w-10 text-right">{subDone}/{subTotal}</span>
                    <button onClick={(e) => { e.stopPropagation(); startEditConcept(concept); }}
                      className="p-1 rounded hover:bg-white/10 text-gray-500 opacity-60 hover:opacity-100 transition" title="Rename">
                      <Pencil size={12} />
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete concept "${concept.title}" and all its sub-concepts?`)) deleteConcept(active.id, concept.id);
                    }} className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-60 hover:opacity-100 transition" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Sub-concepts */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="pl-12 pr-4 pb-4 space-y-1 border-t border-white/5 pt-2">
                        {concept.subConcepts.map((sub) => {
                          const key = `${concept.id}:${sub.id}`;
                          const isEditing = editingSub === key;
                          return (
                            <div key={sub.id} className="group flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.03]">
                              <button onClick={() => toggleSubConcept(active.id, concept.id, sub.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${sub.done ? "" : "border-white/20 hover:border-white/40"}`}
                                style={sub.done ? { background: active.color, borderColor: active.color } : {}}>
                                {sub.done && <Check size={12} className="text-white" />}
                              </button>
                              {isEditing ? (
                                <input autoFocus value={editSubText}
                                  onChange={(e) => setEditSubText(e.target.value)}
                                  onBlur={() => saveEditSub(concept.id, sub.id)}
                                  onKeyDown={(e) => { if (e.key === "Enter") saveEditSub(concept.id, sub.id); if (e.key === "Escape") setEditingSub(null); }}
                                  className="flex-1 bg-white/10 rounded px-2 py-0.5 text-sm text-white outline-none" />
                              ) : (
                                <p onDoubleClick={() => startEditSub(concept.id, sub.id, sub.title)}
                                  className={`flex-1 text-sm cursor-text ${sub.done ? "text-gray-500 line-through" : "text-gray-200"}`}>{sub.title}</p>
                              )}
                              <button onClick={() => deleteSubConcept(active.id, concept.id, sub.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition">
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}

                        {/* Add sub-concept */}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const t = (newSubText[concept.id] ?? "").trim();
                          if (!t) return;
                          addSubConcept(active.id, concept.id, t);
                          setNewSubText((s) => ({ ...s, [concept.id]: "" }));
                        }} className="flex items-center gap-2 mt-2">
                          <Plus size={13} className="text-gray-600 ml-0.5" />
                          <input value={newSubVal}
                            onChange={(e) => setNewSubText((s) => ({ ...s, [concept.id]: e.target.value }))}
                            placeholder="Add a sub-concept..."
                            className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none py-1" />
                          {newSubVal && (
                            <button type="submit" className="text-[10px] font-medium px-2 py-0.5 rounded text-white"
                              style={{ background: active.color }}>Add</button>
                          )}
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-2xl p-8 text-center border border-dashed border-white/10 text-gray-500 text-sm">
      <div className="inline-flex p-3 rounded-xl bg-white/5 mb-3 text-gray-400">{icon}</div>
      <p>{text}</p>
    </div>
  );
}
