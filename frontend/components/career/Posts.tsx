"use client";

/**
 * Posts — LinkedIn / Portfolio / Resume section on the career page.
 * - LinkedIn: editable URL input that persists + open-in-new-tab link.
 * - Portfolio: placeholder card locked for later.
 * - Resume: per-track editable bullet list (add/double-click to edit/delete).
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, FileText, ExternalLink, Lock, Link as LinkIcon } from "lucide-react";
import { useStore } from "../../lib/store";
import { safeExternalUrl } from "../../lib/security";

export default function Posts({ activeTrackId }: { activeTrackId: string | "all" }) {
  const { career, setLinkedin } = useStore();
  const [liValue, setLiValue] = useState(career.linkedin ?? "");
  useEffect(() => { setLiValue(career.linkedin ?? ""); }, [career.linkedin]);
  const saveLi = () => setLinkedin(liValue ?? "");

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* LinkedIn */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: "#0A66C230", color: "#0A66C2" }}>
            in
          </div>
          <div>
            <h4 className="font-semibold">LinkedIn</h4>
            <p className="text-xs text-gray-500">Profile URL</p>
          </div>
        </div>
        <div className="space-y-3">
          <input value={liValue} onChange={(e) => setLiValue(e.target.value)} onBlur={saveLi}
            placeholder="https://linkedin.com/in/yourhandle"
            className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#0A66C2]/50" />
          {safeExternalUrl(career.linkedin) ? (
            <a href={safeExternalUrl(career.linkedin)!} target="_blank" rel="noopener noreferrer"
              className="btn-ghost w-full flex items-center justify-center gap-2 text-sm" style={{ borderColor: "#0A66C240", color: "#0A66C2" }}>
              <ExternalLink size={14} /> Open profile
            </a>
          ) : (
            <p className="text-xs text-gray-500 text-center py-1">Paste your LinkedIn URL above.</p>
          )}
        </div>
      </motion.div>

      {/* Portfolio */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card opacity-70">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-gray-400">
            <Briefcase size={20} />
          </div>
          <div>
            <h4 className="font-semibold">Portfolio</h4>
            <p className="text-xs text-gray-500">Coming later</p>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
          <Lock size={20} className="opacity-60" />
          We'll build this section later.
        </div>
      </motion.div>

      {/* Resume */}
      <ResumeSection activeTrackId={activeTrackId} />
    </div>
  );
}

function ResumeSection({ activeTrackId }: { activeTrackId: string | "all" }) {
  const { career, addResumeBullet, updateResumeBullet, deleteResumeBullet } = useStore();
  const visibleTracks = activeTrackId === "all" ? career.tracks : career.tracks.filter((t) => t.id === activeTrackId);

  const [openTrackId, setOpenTrackId] = useState<string | null>(visibleTracks[0]?.id ?? null);
  const [newBullet, setNewBullet] = useState("");

  useEffect(() => {
    if (activeTrackId !== "all") setOpenTrackId(activeTrackId);
    else if (!openTrackId && visibleTracks[0]) setOpenTrackId(visibleTracks[0].id);
  }, [activeTrackId, visibleTracks, openTrackId]);

  const active = visibleTracks.find((t) => t.id === openTrackId) ?? visibleTracks[0];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f59e0b30", color: "#f59e0b" }}>
          <FileText size={20} />
        </div>
        <div>
          <h4 className="font-semibold">Resume</h4>
          <p className="text-xs text-gray-500">Editable bullet points</p>
        </div>
      </div>

      {visibleTracks.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">Add a track to write resume bullets for it.</p>
      ) : (
        <>
          {activeTrackId === "all" && visibleTracks.length > 1 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {visibleTracks.map((t) => (
                <button key={t.id} onClick={() => setOpenTrackId(t.id)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition"
                  style={active && t.id === active.id
                    ? { background: t.color, color: "white" }
                    : { background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {active && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); if (newBullet.trim()) { addResumeBullet(active.id, newBullet.trim()); setNewBullet(""); } }}
                className="flex gap-2 mb-3">
                <input value={newBullet} onChange={(e) => setNewBullet(e.target.value)}
                  placeholder="Add resume bullet..."
                  className="flex-1 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-white/20" />
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: active.color }}>Add</button>
              </form>
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {active.resumeBullets.length === 0 && <p className="text-xs text-gray-600 italic text-center py-2">No bullets yet for {active.name}.</p>}
                {active.resumeBullets.map((b) => (
                  <BulletEditor key={b.id} text={b.text} color={active.color}
                    onSave={(txt) => updateResumeBullet(active!.id, b.id, txt)}
                    onDelete={() => deleteResumeBullet(active!.id, b.id)} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

function BulletEditor({ text, color, onSave, onDelete }: { text: string; color: string; onSave: (t: string) => void; onDelete: () => void }) {
  const [val, setVal] = useState(text);
  const [editing, setEditing] = useState(false);
  return (
    <li className="group flex items-start gap-2 p-2 rounded-md hover:bg-white/5 text-sm">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {editing ? (
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
          onBlur={() => { onSave(val); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="flex-1 bg-white/10 rounded px-2 py-0.5 text-sm outline-none" />
      ) : (
        <p onDoubleClick={() => setEditing(true)} className="flex-1 text-gray-200 cursor-text">{text}</p>
      )}
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 text-xs">✕</button>
    </li>
  );
}
