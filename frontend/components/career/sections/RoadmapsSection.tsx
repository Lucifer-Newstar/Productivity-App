"use client";

/**
 * RoadmapsSection — the "I · Roadmaps" panel.
 *
 * MVP:
 *  - Grid of roadmap cards (name / icon / color / progress% / current phase /
 *    priority / weekly hours / status chip).
 *  - "+ Add Roadmap" button opens a picker of the 5 templates + "custom".
 *  - Clicking a card opens a detailed drilldown: phases accordion with
 *    milestones (check-box to complete, hours est vs actual, resources,
 *    projects, labs, target proficiency).
 *  - "Next Action" jumps to the first undone milestone.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Plus, Check, ChevronDown, ChevronRight, Clock, Target,
  Archive, Trash2, Flame, Play, BookOpen, FolderKanban, FlaskConical,
  X, Star, Zap,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { TEMPLATE_LIST } from "../../../lib/careerRoadmaps";
import type { CareerRoadmap, CareerMilestone } from "../../../lib/careerTypes";
import { useTheme } from "../../../lib/theme";

function progressOfRoadmap(r: CareerRoadmap): { done: number; total: number; pct: number; hoursDone: number; hoursTotal: number; currentPhaseIdx: number } {
  let done = 0, total = 0, hoursDone = 0, hoursTotal = 0;
  let currentPhaseIdx = 0;
  let phaseIdx = -1;
  for (const ph of r.phases) {
    phaseIdx++;
    let phaseAllDone = true;
    for (const m of ph.milestones) {
      total++;
      hoursTotal += m.hoursEstimate;
      hoursDone += m.hoursActual;
      if (m.done) done++;
      else phaseAllDone = false;
    }
    if (!phaseAllDone && currentPhaseIdx === 0 && done < total) currentPhaseIdx = phaseIdx;
  }
  if (done === total && total > 0) currentPhaseIdx = r.phases.length - 1;
  return { done, total, pct: total ? Math.round((done/total)*100) : 0, hoursDone, hoursTotal, currentPhaseIdx };
}

function findNextMilestone(r: CareerRoadmap): { phaseId: string; ms: CareerMilestone } | null {
  for (const ph of r.phases) {
    for (const ms of ph.milestones) {
      if (!ms.done) return { phaseId: ph.id, ms };
    }
  }
  return null;
}

export default function RoadmapsSection() {
  const isDark = useTheme().theme === "dark";
  const { career, addRoadmapFromTemplate, toggleMilestoneDone, archiveRoadmap, deleteRoadmap } = useStore();
  const [picking, setPicking] = useState(false);
  const [openId, setOpenId] = useState<string | null>(career.roadmaps[0]?.id ?? null);
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null);

  const active = career.roadmaps.find(r => r.id === openId) ?? null;
  const visible = career.roadmaps.filter(r => r.status !== "archived");
  const archived = career.roadmaps.filter(r => r.status === "archived");

  const nextAction = active ? findNextMilestone(active) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>
            Roadmaps
          </h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>
            Mastery in parallel — five pre-built tracks, or forge your own.
          </p>
        </div>
        <button onClick={() => setPicking(true)}
          className="emperor-title text-xs tracking-[0.25em] px-4 py-2.5 rounded-xl flex items-center gap-2 font-black transition hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #0e7490, #164e63)",
            color: "#cffafe",
            border: "1.5px solid rgba(103,232,249,0.6)",
            boxShadow: "0 8px 20px -8px rgba(6,182,212,0.8)",
          }}>
          <Plus size={15} /> FORGE ROADMAP
        </button>
      </div>

      {/* Roadmap cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((r) => {
          const prog = progressOfRoadmap(r);
          const isOpen = r.id === openId;
          return (
            <motion.button key={r.id}
              onClick={() => setOpenId(isOpen ? null : r.id)}
              whileHover={{ y: -3 }}
              className="text-left relative rounded-2xl p-5 overflow-hidden transition"
              style={{
                background: isDark
                  ? "linear-gradient(145deg, rgba(12,26,34,0.95), rgba(10,20,24,0.85))"
                  : "linear-gradient(145deg, rgba(255,248,228,0.95), rgba(242,230,201,0.9))",
                border: `1.5px solid ${isOpen ? r.color : (isDark ? "rgba(103,232,249,0.22)" : "rgba(6,182,212,0.25)")}`,
                boxShadow: isOpen
                  ? `0 16px 40px -12px ${r.color}aa, inset 0 1px 0 ${r.color}55`
                  : "0 6px 18px -10px rgba(0,0,0,0.7)",
              }}>
              <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: `linear-gradient(180deg, ${r.color}, ${r.color}90)`, boxShadow: `0 0 12px ${r.color}aa` }} />

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${r.color}25`, border: `1px solid ${r.color}70` }}>
                  {r.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="emperor-title text-base font-black tracking-wide truncate"
                      style={{ color: isDark ? "#f3e9d2" : "#1a0f0a" }}>{r.name}</h3>
                    <div className="flex items-center gap-0.5 text-[10px] emperor-title px-1.5 py-0.5 rounded"
                      style={{ color: r.color, background: `${r.color}18`, border: `1px solid ${r.color}40` }}>
                      <Star size={9} /> {r.priority}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: isDark ? "#8b9eb0" : "#6b513d" }}>
                    <Clock size={11} /> {r.weeklyHoursTarget}h/wk
                    <span>·</span>
                    <span>{prog.pct}%</span>
                  </div>
                  <p className="text-[11px] mt-1 line-clamp-2 serif-body italic" style={{ color: isDark ? "#8b9eb0" : "#6b513d" }}>
                    {r.description}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${prog.pct}%` }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${r.color}, ${r.color}cc)`, boxShadow: `0 0 10px ${r.color}` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] emperor-title tracking-wider" style={{ color: isDark ? "#8b9eb0" : "#6b513d" }}>
                  <span>{prog.done}/{prog.total} milestones</span>
                  <span>Phase {r.phases.length > 0 ? Math.min(prog.currentPhaseIdx+1, r.phases.length) : 0}/{r.phases.length}</span>
                  <span>{prog.hoursDone|0}/{prog.hoursTotal}h</span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] emperor-title px-2 py-1 rounded"
                  style={{ color: r.status === "active" ? "#67e8f9" : r.status === "paused" ? "#f59e0b" : "#6b7280",
                    background: r.status === "active" ? "rgba(103,232,249,0.12)" : r.status === "paused" ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.1)",
                    border: `1px solid ${r.status === "active" ? "rgba(103,232,249,0.35)" : r.status === "paused" ? "rgba(245,158,11,0.3)" : "rgba(107,114,128,0.25)"}` }}>
                  {r.status.toUpperCase()}
                </span>
                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition">
                  <button onClick={(e) => { e.stopPropagation(); archiveRoadmap(r.id); }} title="Archive"
                    className="p-1.5 rounded-lg hover:bg-white/10"><Archive size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${r.name}"?`)) deleteRoadmap(r.id); }} title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <details className="rounded-xl p-4" style={{ background: isDark ? "rgba(10,20,24,0.5)" : "rgba(200,180,140,0.1)", border: "1px dashed rgba(107,114,128,0.3)" }}>
          <summary className="text-xs emperor-title tracking-widest cursor-pointer" style={{ color: isDark ? "#6b7280" : "#8b7355" }}>
            ARCHIVED ({archived.length})
          </summary>
          <div className="mt-3 grid md:grid-cols-2 gap-2">
            {archived.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.04)" }}>
                <span className="text-sm">{r.icon} {r.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => archiveRoadmap(r.id)} className="text-[10px] px-2 py-1 rounded text-cyan-300">Restore</button>
                  <button onClick={() => { if (confirm(`Delete "${r.name}"?`)) deleteRoadmap(r.id); }} className="text-[10px] px-2 py-1 rounded text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Drilldown */}
      <AnimatePresence>
        {active && (
          <motion.div key={active.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-5 md:p-7 relative overflow-hidden"
            style={{
              background: isDark ? "linear-gradient(145deg, rgba(12,26,34,0.9), rgba(10,20,24,0.8))" : "linear-gradient(145deg, rgba(255,248,228,0.95), rgba(242,230,201,0.9))",
              border: `1.5px solid ${active.color}66`,
              boxShadow: `0 24px 60px -20px ${active.color}88`,
            }}>
            <span aria-hidden className="absolute left-0 top-0 w-[4px] bottom-0" style={{ background: `linear-gradient(180deg, ${active.color}, ${active.color}66)` }} />

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: `${active.color}22`, border: `2px solid ${active.color}70` }}>{active.icon}</div>
                <div>
                  <h3 className="imperial-name text-2xl font-black" style={{ color: isDark ? "#f3e9d2" : "#1a0f0a" }}>{active.name}</h3>
                  <p className="serif-body italic text-sm mt-1 max-w-xl" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>{active.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap text-[11px] emperor-title tracking-wider">
                    <Badge label={`LVL ${active.startLevel} → ${active.targetLevel}`} color={active.color} />
                    <Badge label={`${active.weeklyHoursTarget}h/wk`} color="#d4af37" />
                    <Badge label={`Priority ${active.priority}/10`} color="#b91c1c" />
                  </div>
                </div>
              </div>
              {nextAction && (
                <button onClick={() => setOpenPhaseId(nextAction.phaseId)}
                  className="emperor-title font-black tracking-[0.2em] text-xs px-4 py-3 rounded-xl flex items-center gap-2 shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #d4af37, #9c7a1a)",
                    color: "#1a0f0a",
                    border: "1.5px solid rgba(253,230,138,0.7)",
                    boxShadow: "0 8px 20px -8px rgba(212,175,55,0.9)",
                  }}>
                  <Zap size={14} /> NEXT ACTION
                </button>
              )}
            </div>

            <div className="k-blade my-5" style={{ opacity: 0.6 }} />

            {/* Phases */}
            <div className="space-y-3">
              {active.phases.map((ph, pi) => {
                const phaseProg = progressOfRoadmap({ ...active, phases: [ph] });
                const isOpen = openPhaseId === ph.id;
                return (
                  <div key={ph.id} className="rounded-xl overflow-hidden"
                    style={{ background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)", border: `1px solid ${isOpen ? active.color+"80" : "rgba(107,114,128,0.2)"}` }}>
                    <button onClick={() => setOpenPhaseId(isOpen ? null : ph.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm emperor-title font-black"
                        style={{ background: `${active.color}25`, color: active.color, border: `1px solid ${active.color}60` }}>
                        {pi + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="emperor-title font-black tracking-wide text-sm md:text-base" style={{ color: isDark ? "#f3e9d2" : "#1a0f0a" }}>
                          {ph.title}
                        </h4>
                        {ph.description && <p className="text-[11px] serif-body italic" style={{ color: isDark ? "#8b9eb0" : "#6b513d" }}>{ph.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] emperor-title" style={{ color: active.color }}>{phaseProg.pct}%</div>
                        <div className="text-[10px]" style={{ color: isDark ? "#6b7280" : "#8b7355" }}>
                          {phaseProg.done}/{phaseProg.total} · {phaseProg.hoursTotal}h
                        </div>
                      </div>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="p-4 pt-0 space-y-2">
                            {ph.milestones.map((ms, mi) => (
                              <MilestoneRow key={ms.id} ms={ms} index={mi} color={active.color}
                                done={ms.done}
                                onToggle={() => toggleMilestoneDone(active.id, ph.id, ms.id)} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template picker modal */}
      <AnimatePresence>
        {picking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl rounded-2xl p-6 relative overflow-hidden max-h-[85vh] overflow-y-auto"
              style={{ background: "linear-gradient(145deg, #0c1a22, #0a1418)", border: "2px solid rgba(103,232,249,0.4)", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.9)" }}>
              <button onClick={() => setPicking(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-gray-400"><X size={18} /></button>
              <h3 className="imperial-name text-2xl font-black" style={{ color: "#67e8f9" }}>Forge a Roadmap</h3>
              <p className="text-sm serif-body italic mt-1" style={{ color: "#a8b8c8" }}>Choose a template — fully populated with phases, milestones, resources & projects — or start from scratch.</p>
              <div className="k-blade my-4" style={{ opacity: 0.5 }} />
              <div className="grid md:grid-cols-2 gap-3">
                {TEMPLATE_LIST.map((tpl) => (
                  <button key={tpl.id} onClick={() => { addRoadmapFromTemplate(tpl.template!); setPicking(false); }}
                    className="text-left rounded-xl p-4 transition hover:scale-[1.02] group"
                    style={{ background: `linear-gradient(145deg, ${tpl.color}18, rgba(0,0,0,0.3))`, border: `1px solid ${tpl.color}55` }}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${tpl.color}25`, border: `1px solid ${tpl.color}70` }}>{tpl.icon}</div>
                      <div className="flex-1">
                        <div className="emperor-title font-black" style={{ color: "#f3e9d2" }}>{tpl.name}</div>
                        <div className="text-[11px] serif-body italic" style={{ color: "#8b9eb0" }}>{tpl.description}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] emperor-title" style={{ color: tpl.color }}>
                      <Flame size={10} /> {tpl.phases.length} phases · {tpl.phases.reduce((n,p) => n+p.milestones.length, 0)} milestones
                    </div>
                  </button>
                ))}
                <button onClick={() => { addRoadmapFromTemplate("custom"); setPicking(false); }}
                  className="text-left rounded-xl p-4 transition hover:scale-[1.02]"
                  style={{ background: "linear-gradient(145deg, rgba(212,175,55,0.12), rgba(0,0,0,0.3))", border: "1px dashed rgba(212,175,55,0.5)" }}>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.7)" }}>⚒️</div>
                    <div className="flex-1">
                      <div className="emperor-title font-black" style={{ color: "#fde68a" }}>Custom Roadmap</div>
                      <div className="text-[11px] serif-body italic" style={{ color: "#8b9eb0" }}>Empty canvas — add your own phases & milestones.</div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2 py-1 rounded" style={{ color, background: `${color}15`, border: `1px solid ${color}40` }}>{label}</span>
  );
}

function MilestoneRow({ ms, index, color, done, onToggle }: { ms: CareerMilestone; index: number; color: string; done: boolean; onToggle: () => void }) {
  const isDark = true;
  const [expanded, setExpanded] = useState(false);
  const hasDetails = ms.resources.length || ms.projects.length || ms.labChecklist.length || ms.description;
  return (
    <div className="rounded-lg overflow-hidden"
      style={{ background: done ? "rgba(163,230,53,0.06)" : (isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)"), border: `1px solid ${done ? "rgba(163,230,53,0.3)" : "rgba(255,255,255,0.05)"}` }}>
      <div className="flex items-center gap-3 p-3">
        <button onClick={onToggle}
          className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center transition"
          style={{
            background: done ? color : "transparent",
            border: `2px solid ${done ? color : "rgba(255,255,255,0.25)"}`,
            color: "#0a0709",
            boxShadow: done ? `0 0 10px ${color}88` : "none",
          }}>
          {done && <Check size={13} strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${done ? "line-through opacity-60" : ""}`} style={{ color: isDark ? "#f3e9d2" : "#1a0f0a" }}>
            <span className="text-[10px] emperor-title mr-2" style={{ color }}>{String(index+1).padStart(2,"0")}</span>
            {ms.title}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] emperor-title" style={{ color: isDark ? "#6b7280" : "#8b7355" }}>
            <span className="flex items-center gap-1"><Clock size={10}/>{ms.hoursEstimate}h</span>
            <span className="flex items-center gap-1"><Target size={10}/>LVL {ms.targetProficiency}</span>
            {ms.resources.length > 0 && <span className="flex items-center gap-1"><BookOpen size={10}/>{ms.resources.length}</span>}
            {ms.projects.length > 0 && <span className="flex items-center gap-1"><FolderKanban size={10}/>{ms.projects.length}</span>}
            {ms.labChecklist.length > 0 && <span className="flex items-center gap-1"><FlaskConical size={10}/>{ms.labChecklist.length}</span>}
          </div>
        </div>
        {hasDetails && (
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-white/10">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>
      {expanded && hasDetails && (
        <div className="px-4 pb-3 pt-1 space-y-2 text-[12px]" style={{ color: isDark ? "#c4cfd9" : "#3a2a1d" }}>
          {ms.description && <p className="serif-body italic" style={{ color: isDark ? "#8b9eb0" : "#6b513d" }}>{ms.description}</p>}
          {ms.resources.length > 0 && (
            <div>
              <div className="text-[10px] emperor-title tracking-widest mb-1" style={{ color: "#67e8f9" }}>RESOURCES</div>
              <ul className="space-y-0.5">
                {ms.resources.map(r => (
                  <li key={r.id} className="flex items-start gap-2"><BookOpen size={11} className="mt-0.5 shrink-0" style={{ color: "#67e8f9" }} /> <span>{r.title} <span className="text-[10px] opacity-60">({r.type})</span></span></li>
                ))}
              </ul>
            </div>
          )}
          {ms.projects.length > 0 && (
            <div>
              <div className="text-[10px] emperor-title tracking-widest mb-1" style={{ color: "#d4af37" }}>PRACTICAL PROJECTS</div>
              <ul className="space-y-0.5">
                {ms.projects.map(p => (
                  <li key={p.id} className="flex items-start gap-2"><FolderKanban size={11} className="mt-0.5 shrink-0" style={{ color: "#d4af37" }} /> {p.title}</li>
                ))}
              </ul>
            </div>
          )}
          {ms.labChecklist.length > 0 && (
            <div>
              <div className="text-[10px] emperor-title tracking-widest mb-1" style={{ color: "#ec4899" }}>LAB CHECKLIST</div>
              <ul className="space-y-0.5">
                {ms.labChecklist.map(l => (
                  <li key={l.id} className="flex items-start gap-2"><FlaskConical size={11} className="mt-0.5 shrink-0" style={{ color: "#ec4899" }} /> {l.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
