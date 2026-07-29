"use client";

/**
 * AchievementVault — timeline of wins.
 * Add achievements with emoji (12 preset icons), title, description, date, optional
 * track link. Rendered as a vertical timeline colored per track. Respects
 * activeTrackId filter.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trophy, Trash2, X, Calendar } from "lucide-react";
import { useStore } from "../../lib/store";

const ICON_CHOICES = ["🏆", "🎓", "💼", "⭐", "🚀", "✅", "🎯", "📜", "💡", "🔥", "🥇", "🌟"];

export default function AchievementVault({ activeTrackId }: { activeTrackId: string | "all" }) {
  const { career, addAchievement, deleteAchievement } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [icon, setIcon] = useState("🏆");
  const [trackId, setTrackId] = useState<string>(activeTrackId === "all" ? "" : activeTrackId);

  const submit = () => {
    if (!title.trim()) return;
    addAchievement({
      title: title.trim(),
      description: description.trim() || undefined,
      date, icon,
      trackId: trackId || undefined,
    });
    setTitle(""); setDescription(""); setIcon("🏆"); setTrackId(activeTrackId === "all" ? "" : activeTrackId);
    setOpen(false);
  };

  const visible = activeTrackId === "all"
    ? career.achievements
    : career.achievements.filter((a) => a.trackId === activeTrackId);

  const sorted = [...visible].sort((a, b) => b.date.localeCompare(a.date));
  const trackColor = (id?: string) => career.tracks.find((t) => t.id === id)?.color ?? "#8b5cf6";
  const trackName  = (id?: string) => career.tracks.find((t) => t.id === id)?.name;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">Celebrate the wins — big and small.</p>
        <button onClick={() => { setTrackId(activeTrackId === "all" ? "" : activeTrackId); setOpen(true); }}
          className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> Add achievement
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border border-dashed border-white/10">
          <Trophy size={36} className="mx-auto mb-3 text-accent-amber opacity-60" />
          <p className="text-gray-400 text-sm">Nothing in the vault yet for this filter. Log a win!</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-accent-amber/40 via-accent/40 to-transparent" />
          <ul className="space-y-3">
            <AnimatePresence>
              {sorted.map((a) => (
                <motion.li key={a.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="relative flex gap-4 group ml-2">
                  <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${trackColor(a.trackId)}30, ${trackColor(a.trackId)}10)`, border: `1px solid ${trackColor(a.trackId)}40` }}>
                    {a.icon}
                  </div>
                  <div className="flex-1 glass rounded-xl p-4 hover:border-white/15 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-semibold text-white">{a.title}</h5>
                        {a.description && <p className="text-sm text-gray-400 mt-1">{a.description}</p>}
                        <div className="flex gap-2 mt-2 items-center flex-wrap">
                          <span className="chip text-gray-500 bg-white/5"><Calendar size={10} />
                            {new Date(a.date).toLocaleDateString("en-US", { month: "long", year: "numeric", day: "numeric" })}
                          </span>
                          {a.trackId && (
                            <span className="chip" style={{ background: `${trackColor(a.trackId)}20`, color: trackColor(a.trackId) }}>
                              {trackName(a.trackId)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteAchievement(a.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 glass border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Trophy size={18} className="text-accent-amber" /> New achievement</h3>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10"><X size={18} /></button>
              </div>

              <label className="text-xs text-gray-400 uppercase tracking-wider">Icon</label>
              <div className="flex flex-wrap gap-1.5 my-2 mb-4">
                {ICON_CHOICES.map((i) => (
                  <button key={i} onClick={() => setIcon(i)}
                    className={`w-9 h-9 rounded-lg text-xl transition ${icon === i ? "bg-accent/30 ring-1 ring-accent" : "bg-white/5 hover:bg-white/10"}`}>
                    {i}
                  </button>
                ))}
              </div>

              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Achievement title"
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-accent/50 mb-2" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-accent/50 resize-none mb-3" />
              <div className="flex gap-2 mb-4">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                <select value={trackId} onChange={(e) => setTrackId(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none">
                  <option value="" className="bg-bg-card">No track</option>
                  {career.tracks.map((t) => <option key={t.id} value={t.id} className="bg-bg-card">{t.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
                <button onClick={submit} disabled={!title.trim()} className="btn-primary disabled:opacity-40">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
