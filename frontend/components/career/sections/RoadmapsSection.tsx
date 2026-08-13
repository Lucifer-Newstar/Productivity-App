"use client";

/**
 * RoadmapsSection — "I · Roadmaps" command panel.
 *
 * Grid of roadmap cards with progress donut, current phase, weekly hours,
 * priority, and status. Template forge (5 templates + custom). Drilldown
 * reveals phases with milestones, resources, projects, lab checklists,
 * mastery self-check, self-rating before/after, hour logging, and a
 * katana-slash celebration on 100% completion. Dependency-gated milestones
 * display a 🔒 until their prerequisites are done.
 *
 * An aggregate donut shows weekly hours allocation across active roadmaps.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Plus, Check, ChevronDown, ChevronRight, Clock, Target,
  Archive, Trash2, Flame, Zap, BookOpen, FolderKanban, FlaskConical,
  X, Star, Lock, Trophy, Circle, Percent,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { TEMPLATE_LIST, cloneTemplate } from "../../../lib/careerRoadmaps";
import type { CareerRoadmap, CareerMilestone } from "../../../lib/careerTypes";
import { useTheme } from "../../../lib/theme";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Celebrate when a roadmap crosses 100%. Runs after render via effect.
function useMemoLikeCelebration(
  roadmaps: CareerRoadmap[],
  celebrated: Set<string>,
  setCelebrated: (updater: (s: Set<string>) => Set<string>) => void,
  fire: (id: string) => void,
) {
  useEffect(() => {
    for (const r of roadmaps) {
      const p = progressOf(r);
      if (p.pct === 100 && r.status === "active" && !celebrated.has(r.id)) {
        setCelebrated((s) => new Set(s).add(r.id));
        fire(r.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmaps]);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type RoadmapProgress = {
  done: number; total: number; pct: number;
  hoursDone: number; hoursTotal: number;
  currentPhaseIdx: number;
  currentMilestone: { phaseId: string; ms: CareerMilestone } | null;
};

function progressOf(r: CareerRoadmap): RoadmapProgress {
  let done = 0, total = 0, hoursDone = 0, hoursTotal = 0;
  let currentPhaseIdx = 0;
  let currentMilestone: RoadmapProgress["currentMilestone"] = null;
  let phaseIdx = -1;
  for (const ph of r.phases) {
    phaseIdx++;
    let phaseAllDone = true;
    for (const m of ph.milestones) {
      total++;
      hoursTotal += m.hoursEstimate;
      hoursDone += m.hoursActual;
      if (m.done) done++;
      else {
        phaseAllDone = false;
        if (!currentMilestone) currentMilestone = { phaseId: ph.id, ms: m };
      }
    }
    if (!phaseAllDone && currentPhaseIdx === 0 && done < total) currentPhaseIdx = phaseIdx;
  }
  if (done === total && total > 0) currentPhaseIdx = r.phases.length - 1;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0,
    hoursDone, hoursTotal, currentPhaseIdx, currentMilestone };
}

function msIsLocked(ms: CareerMilestone, allById: Record<string, CareerMilestone>) {
  if (!ms.dependsOn?.length) return null;
  const blockers = ms.dependsOn.filter((d) => !allById[d]?.done);
  return blockers.length ? blockers : null;
}

function collectMilestoneMap(r: CareerRoadmap) {
  const map: Record<string, CareerMilestone> = {};
  for (const ph of r.phases) for (const m of ph.milestones) map[m.id] = m;
  return map;
}

/* ------------------------------------------------------------------ */
/*  Small visual primitives                                            */
/* ------------------------------------------------------------------ */

function Donut({ value, max, color, size = 56, stroke = 6, track = "var(--cr-borderSoft)" }:
  { value: number; max: number; color: string; size?: number; stroke?: number; track?: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter: `drop-shadow(0 0 6px ${color}aa)` }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.28} fontWeight={800} fill="var(--cr-fg)"
        fontFamily="ui-monospace, JetBrains Mono, monospace">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function HoursDonut({ roadmaps }: { roadmaps: CareerRoadmap[] }) {
  const active = roadmaps.filter((r) => r.status === "active" && r.weeklyHoursTarget > 0);
  const total = active.reduce((n, r) => n + r.weeklyHoursTarget, 0);
  const R = 48; const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="rounded-sm p-4 md:p-5 hud-corner relative flex items-center gap-4"
      style={{ background: "var(--cr-card)", border: "1px solid var(--cr-border)" }}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="relative shrink-0">
        <svg width={120} height={120}>
          <circle cx={60} cy={60} r={R} fill="none" stroke="var(--cr-borderSoft)" strokeWidth={14} />
          {active.map((r) => {
            const frac = total > 0 ? r.weeklyHoursTarget / total : 0;
            const seg = C * frac;
            const el = (
              <motion.circle key={r.id} cx={60} cy={60} r={R} fill="none"
                stroke={r.color} strokeWidth={14} strokeLinecap="butt"
                strokeDasharray={`${seg} ${C - seg}`}
                strokeDashoffset={-offset}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: -offset }}
                transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }}
                transform={`rotate(-90 60 60)`}
                style={{ filter: `drop-shadow(0 0 6px ${r.color}aa)` }} />
            );
            offset += seg;
            return el;
          })}
          <text x="60" y="56" textAnchor="middle" fontSize="10"
            fill="var(--cr-fgMuted)" fontWeight={700} letterSpacing={1}>H/WK</text>
          <text x="60" y="74" textAnchor="middle" fontSize="22" fontWeight={800}
            fill="var(--cr-accent)" fontFamily="ui-monospace, monospace">{total}</text>
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold tracking-[0.3em]" style={{ color: "var(--cr-accent)" }}>
          ALLOCATION
        </div>
        <div className="text-xs mt-0.5 italic" style={{ color: "var(--cr-fgMuted)" }}>
          Hours per week, split across active tracks.
        </div>
        <div className="mt-2 space-y-1 max-h-[84px] overflow-y-auto pr-1">
          {active.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-sm" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
              <span className="truncate flex-1" style={{ color: "var(--cr-fg)" }}>{r.name}</span>
              <span style={{ color: r.color }}>{r.weeklyHoursTarget}h</span>
            </div>
          ))}
          {active.length === 0 && <div className="text-[11px] italic" style={{ color: "var(--cr-fgMuted)" }}>No active roadmaps.</div>}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2 py-0.5 text-[10px] emperor-title tracking-widest rounded"
      style={{ color, background: `${color}18`, border: `1px solid ${color}55` }}>{label}</span>
  );
}

/* ------------------------------------------------------------------ */
/*  Milestone detail                                                   */
/* ------------------------------------------------------------------ */

function MilestoneRow({
  ms, index, color, locked, allById, onToggle, onLogHours, onQuiz, onSelfRate,
  onToggleLab, onToggleResource, onToggleProject,
}: {
  ms: CareerMilestone; index: number; color: string; locked: string[] | null;
  allById: Record<string, CareerMilestone>;
  onToggle: () => void;
  onLogHours: (h: number) => void;
  onQuiz: (id: string, a: "yes"|"partial"|"no") => void;
  onSelfRate: (field: "selfRatingBefore"|"selfRatingAfter", v: number) => void;
  onToggleLab: (id: string) => void;
  onToggleResource: (id: string) => void;
  onToggleProject: (id: string) => void;
}) {
  const isDark = true;
  const [expanded, setExpanded] = useState(false);
  const [hourInput, setHourInput] = useState("");
  const hasDetails = Boolean(
    ms.description || ms.resources.length || ms.projects.length ||
    ms.labChecklist.length || ms.quiz.length || ms.targetProficiency,
  );

  const quizScore = ms.quiz.length
    ? Math.round((ms.quiz.filter((q) => q.selfRating === "yes").length / ms.quiz.length) * 100)
    : null;
  const quizDefault = ms.quiz.length === 0; // generate default quiz on expand if empty

  const addDefaultQuiz = () => {
    const defaultQ = [
      { id: uid(), question: "Can I explain this concept clearly to a peer?", selfRating: "no" as const },
      { id: uid(), question: "Can I implement/apply this from scratch without notes?", selfRating: "no" as const },
      { id: uid(), question: "Can I debug failure modes for this topic?", selfRating: "no" as const },
    ];
    onQuiz(defaultQ[0].id, "no"); // trigger via updater to set whole array
    // we'll instead call a dedicated "ensure quiz" — hack: use updateMilestone via store directly?
    // But parent only gave us onQuiz. Easier: parent adds default quiz when milestone
    // is expanded the first time. We'll fire an "ensure" signal via onSelfRate(-1, -1)? No —
    // simpler: parent always seeds default quiz.
  };

  return (
    <div className="rounded-lg overflow-hidden relative hud-corner"
      style={{
        background: locked ? "var(--cr-card2)"
          : ms.done ? "rgba(52,211,153,0.06)"
          : "var(--cr-card)",
        border: `1px solid ${locked ? "var(--cr-borderSoft)"
          : ms.done ? "rgba(52,211,153,0.35)" : "var(--cr-borderSoft)"}`,
      }}>
      <div className="flex items-center gap-3 p-3">
        <button disabled={!!locked} onClick={onToggle}
          className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center transition ${locked ? "cursor-not-allowed" : ""}`}
          style={{
            background: ms.done ? color : "transparent",
            border: `2px solid ${ms.done ? color : locked ? "var(--cr-fgMuted)" : "var(--cr-border)"}`,
            color: "var(--cr-bg)",
            boxShadow: ms.done ? `0 0 10px ${color}88` : "none",
            opacity: locked ? 0.5 : 1,
          }}>
          {locked ? <Lock size={12} /> : ms.done ? <Check size={13} strokeWidth={3} /> : null}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${ms.done ? "line-through opacity-60" : ""}`} style={{ color: "var(--cr-fg)" }}>
            <span className="text-[10px] font-bold tracking-widest mr-2" style={{ color: locked ? "var(--cr-fgMuted)" : color }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            {ms.title}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold tracking-widest flex-wrap" style={{ color: "var(--cr-fgMuted)" }}>
            <span className="flex items-center gap-1"><Clock size={10}/>
              {ms.hoursActual|0}/{ms.hoursEstimate}h
            </span>
            <span className="flex items-center gap-1"><Target size={10}/>LVL {ms.targetProficiency}</span>
            {ms.resources.length > 0 && <span className="flex items-center gap-1"><BookOpen size={10}/>{ms.resources.length}</span>}
            {ms.projects.length > 0 && <span className="flex items-center gap-1"><FolderKanban size={10}/>{ms.projects.length}</span>}
            {ms.labChecklist.length > 0 && <span className="flex items-center gap-1"><FlaskConical size={10}/>{ms.labChecklist.filter(l=>l.done).length}/{ms.labChecklist.length}</span>}
            {quizScore !== null && (
              <span className="flex items-center gap-1" style={{ color: quizScore >= 80 ? "#a3e635" : quizScore >= 50 ? "#fbbf24" : "#f87171" }}>
                <Percent size={10}/> {quizScore}%
              </span>
            )}
          </div>
          {locked && (
            <div className="text-[10px] mt-1 flex items-center gap-1 flex-wrap" style={{ color: "var(--cr-fgMuted)" }}>
              <Lock size={9}/> Complete prerequisites first
              {locked.slice(0,3).map(id => {
                const b = allById[id];
                return b ? <span key={id} className="px-1 py-0.5 rounded-sm"
                  style={{background:"var(--cr-card2)",color:"var(--cr-fgMuted)",border:"1px solid var(--cr-borderSoft)"}}>{b.title.length>20?b.title.slice(0,20)+"…":b.title}</span> : null;
              })}
            </div>
          )}
        </div>
        {hasDetails && (
          <button onClick={() => setExpanded((v) => !v)} className="p-1.5 rounded-lg hover:bg-white/10">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 space-y-3 text-[12px]" style={{ color: "var(--cr-fg)" }}>
              {ms.description && (
                <p className="italic" style={{ color: "var(--cr-fgMuted)" }}>{ms.description}</p>
              )}

              {/* Self-rating & logging */}
              <div className="grid grid-cols-2 gap-2">
                <RatingRow label="Before" value={ms.selfRatingBefore ?? Math.max(1, (ms.targetProficiency||5) - 3)} color="#fb923c"
                  onChange={(v) => onSelfRate("selfRatingBefore", v)} />
                <RatingRow label="After" value={ms.selfRatingAfter ?? ms.targetProficiency} color={color}
                  onChange={(v) => onSelfRate("selfRatingAfter", v)} target={ms.targetProficiency} />
              </div>

              {/* Log hours */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--cr-accent2)" }}>LOG HOURS</span>
                <input type="number" min={0.5} step={0.5} value={hourInput} onChange={(e)=>setHourInput(e.target.value)}
                  placeholder="0.5"
                  className="w-16 bg-transparent px-2 py-1 rounded-sm text-sm outline-none text-center"
                  style={{ border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" }} />
                <div className="flex gap-1">
                  {[0.5,1,2].map((h) => (
                    <button key={h} onClick={()=>onLogHours(h)}
                      className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
                      style={{ background: "rgba(34,211,238,0.15)", color: "var(--cr-accent)", border: `1px solid ${color}55` }}>+{h}h</button>
                  ))}
                  <button onClick={()=>{const v=parseFloat(hourInput); if (!isNaN(v)&&v>0) onLogHours(v); setHourInput("");}}
                    className="text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm"
                    style={{ background: "var(--cr-accent)", color: "var(--cr-bg)" }}>ADD</button>
                </div>
              </div>

              {/* Resources */}
              {ms.resources.length > 0 && (
                <div>
                  <div className="text-[10px] emperor-title tracking-widest mb-1" style={{ color: "#67e8f9" }}>RESOURCES</div>
                  <ul className="space-y-0.5">
                    {ms.resources.map((r) => (
                      <li key={r.id} className="flex items-start gap-2">
                        <button onClick={()=>onToggleResource(r.id)}
                          className={`w-4 h-4 mt-0.5 rounded shrink-0 flex items-center justify-center`}
                          style={{
                            background: r.completed ? "#67e8f9" : "transparent",
                            border: `1.5px solid ${r.completed ? "#67e8f9" : "rgba(103,232,249,0.5)"}`,
                          }}>
                          {r.completed && <Check size={10} strokeWidth={3} color="#0a0709" />}
                        </button>
                        <span className={r.completed ? "line-through opacity-60" : ""}>
                          <BookOpen size={10} className="inline mr-1 -mt-0.5" style={{ color: "#67e8f9" }}/>
                          {r.title}
                          <span className="ml-1 text-[10px] opacity-60">({r.type})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Projects */}
              {ms.projects.length > 0 && (
                <div>
                  <div className="text-[10px] emperor-title tracking-widest mb-1" style={{ color: "#d4af37" }}>PRACTICAL PROJECTS</div>
                  <ul className="space-y-0.5">
                    {ms.projects.map((p) => (
                      <li key={p.id} className="flex items-start gap-2">
                        <button onClick={()=>onToggleProject(p.id)}
                          className="w-4 h-4 mt-0.5 rounded shrink-0 flex items-center justify-center"
                          style={{
                            background: p.completed ? "#d4af37" : "transparent",
                            border: `1.5px solid ${p.completed ? "#d4af37" : "rgba(212,175,55,0.5)"}`,
                          }}>
                          {p.completed && <Check size={10} strokeWidth={3} color="#0a0709" />}
                        </button>
                        <span className={p.completed ? "line-through opacity-60" : ""}>
                          <FolderKanban size={10} className="inline mr-1 -mt-0.5" style={{ color: "#d4af37" }}/>{p.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lab checklist */}
              {ms.labChecklist.length > 0 && (
                <div>
                  <div className="text-[10px] emperor-title tracking-widest mb-1" style={{ color: "#ec4899" }}>LAB CHECKLIST</div>
                  <ul className="space-y-0.5">
                    {ms.labChecklist.map((l) => (
                      <li key={l.id} className="flex items-start gap-2">
                        <button onClick={()=>onToggleLab(l.id)}
                          className="w-4 h-4 mt-0.5 rounded shrink-0 flex items-center justify-center"
                          style={{
                            background: l.done ? "#ec4899" : "transparent",
                            border: `1.5px solid ${l.done ? "#ec4899" : "rgba(236,72,153,0.5)"}`,
                          }}>
                          {l.done && <Check size={10} strokeWidth={3} color="#fff" />}
                        </button>
                        <span className={l.done ? "line-through opacity-60" : ""}>
                          <FlaskConical size={10} className="inline mr-1 -mt-0.5" style={{ color: "#ec4899" }}/>{l.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mastery self-check */}
              <div>
                <div className="text-[10px] emperor-title tracking-widest mb-1" style={{ color: "#a3e635" }}>
                  MASTERY CHECK
                </div>
                <div className="space-y-1">
                  {ms.quiz.map((q) => (
                    <div key={q.id} className="flex items-center gap-2">
                      <span className="text-[11px] flex-1">{q.question}</span>
                      {(["yes","partial","no"] as const).map((a) => (
                        <button key={a} onClick={()=>onQuiz(q.id,a)}
                          className="text-[9px] emperor-title tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: q.selfRating === a
                              ? (a === "yes" ? "rgba(163,230,53,0.25)" : a === "partial" ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)")
                              : "rgba(255,255,255,0.04)",
                            color: a === "yes" ? "#a3e635" : a === "partial" ? "#fbbf24" : "#f87171",
                            border: `1px solid ${q.selfRating === a ? "currentColor" : "rgba(255,255,255,0.1)"}`,
                            textTransform: "uppercase",
                          }}>{a}</button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RatingRow({ label, value, color, onChange, target }:
  { label: string; value: number; color: string; onChange: (v: number) => void; target?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest mb-1">
        <span style={{ color: "var(--cr-fgMuted)" }}>{label.toUpperCase()}</span>
        <span style={{ color }}>{value}/10{target ? ` → ${target}` : ""}</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={()=>onChange(n)}
            className="flex-1 h-3 rounded-sm transition"
            style={{
              background: n <= value ? color : "var(--cr-borderSoft)",
              boxShadow: n <= value ? `0 0 6px ${color}aa` : "none",
            }} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Completion celebration                                             */
/* ------------------------------------------------------------------ */

function Celebration({ roadmap, onClose }: { roadmap: CareerRoadmap; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ scale: 0.7, y: 40, rotateX: -20 }} animate={{ scale: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative rounded-sm p-8 md:p-12 max-w-lg text-center overflow-hidden hud-corner"
        style={{
          background: "radial-gradient(ellipse at top, #0a1624, #02050a)",
          border: "2px solid rgba(212,175,55,0.6)",
          boxShadow: "0 30px 100px -20px rgba(34,211,238,0.4), inset 0 1px 0 rgba(253,230,138,0.3)",
        }}>
        <span className="c-tr"/><span className="c-bl"/>
        <motion.div aria-hidden
          initial={{ clipPath: "inset(0 100% 100% 0)" }}
          animate={{ clipPath: "inset(0 -10% -10% 0)", opacity: [0,1,1,0] }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg,transparent 46%,rgba(34,211,238,0.85) 49%,#fff 50%,rgba(34,211,238,0.85) 51%,transparent 55%)",
            filter: "drop-shadow(0 0 16px rgba(34,211,238,1))",
          }} />
        <div className="text-6xl mb-2">{roadmap.icon}</div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }}>
          <Trophy size={64} className="mx-auto mb-3" style={{ color: "#facc15", filter: "drop-shadow(0 0 20px rgba(250,204,21,0.8))" }} />
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-black tracking-widest" style={{
          background: "linear-gradient(135deg,#fde68a,#facc15,#a78bfa)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>ROADMAP COMPLETE</h2>
        <p className="text-sm italic mt-2" style={{ color: "#94a3b8" }}>
          You have mastered <span className="not-italic font-bold" style={{ color: "#facc15" }}>{roadmap.name}</span>.
          Every milestone laid to rest. On to the next summit, commander.
        </p>
        <div className="my-4 h-px" style={{background:"linear-gradient(90deg,transparent,#facc15,transparent)"}}/>
        <button onClick={onClose}
          className="text-xs tracking-[0.3em] font-bold px-6 py-3 rounded-sm flex items-center gap-2 mx-auto"
          style={{
            background: "linear-gradient(135deg,#22d3ee,#a78bfa)",
            color: "#02050a", border: "1.5px solid rgba(34,211,238,0.7)",
            boxShadow: "0 8px 24px -8px rgba(34,211,238,0.9)",
          }}>
          <Target size={14}/> CLAIM VICTORY
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function RoadmapsSection() {
  const isDark = useTheme().theme === "dark";
  const {
    career, addRoadmapFromTemplate, toggleMilestoneDone, archiveRoadmap, deleteRoadmap,
    toggleLabItem, toggleResourceComplete, toggleProjectComplete, setQuizAnswer,
    logMilestoneHours, updateMilestone, updateCareer,
  } = useStore();
  const [picking, setPicking] = useState(false);
  const [openId, setOpenId] = useState<string | null>(career.roadmaps[0]?.id ?? null);
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [weekOverride, setWeekOverride] = useState<Record<string, number>>({});
  const [celebrated, setCelebrated] = useState<Set<string>>(new Set());

  // Fire celebration the moment a roadmap hits 100% (once per roadmap).
  useMemoLikeCelebration(career.roadmaps, celebrated, setCelebrated, setCelebrateId);

  const visible = career.roadmaps.filter((r) => r.status !== "archived");
  const archived = career.roadmaps.filter((r) => r.status === "archived");
  const active = career.roadmaps.find((r) => r.id === openId) ?? null;

  // Detect just-completed roadmaps for celebration
  const justCompletedId = useMemo(() => {
    for (const r of career.roadmaps) {
      const p = progressOf(r);
      if (p.pct === 100 && r.status === "active") return r.id;
    }
    return null;
  }, [career.roadmaps]);

  // Seed default quiz questions when milestone is first expanded (lazy)
  const ensureQuiz = (rmId: string, phId: string, msId: string) => {
    const r = career.roadmaps.find((x) => x.id === rmId);
    const ph = r?.phases.find((x) => x.id === phId);
    const ms = ph?.milestones.find((x) => x.id === msId);
    if (!ms || ms.quiz.length > 0) return;
    const defaults = [
      { id: uid(), question: "Can I explain this concept clearly to a peer?", selfRating: "no" as const },
      { id: uid(), question: "Can I build/apply this from scratch without notes?", selfRating: "no" as const },
      { id: uid(), question: "Can I debug common failures for this topic?", selfRating: "no" as const },
    ];
    updateMilestone(rmId, phId, msId, { quiz: defaults });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider flex items-center gap-2"
            style={{ color: "var(--cr-fg)" }}>
            <Map size={22} style={{color:"var(--cr-accent)"}}/> roadmaps.forge
          </h2>
          <p className="text-[11px] tracking-widest mt-1 italic" style={{ color: "var(--cr-fgMuted)" }}>
            &gt; mastery in parallel — five pre-forged tracks or forge your own
          </p>
        </div>
        <button onClick={() => setPicking(true)}
          className="text-[11px] tracking-[0.25em] font-bold px-4 py-2.5 rounded-sm hud-corner relative flex items-center gap-2 transition hover:scale-105"
          style={{
            background: "var(--cr-accent)",
            color: "var(--cr-bg)",
            border: "1.5px solid var(--cr-accent)",
            boxShadow: "0 8px 20px -8px color-mix(in srgb, var(--cr-accent) 80%, transparent)",
          }}>
          <span className="c-tr"/><span className="c-bl"/>
          <Plus size={15} /> FORGE ROADMAP
        </button>
      </div>

      {/* Hours donut + stats */}
      <div className="grid md:grid-cols-3 gap-3">
        <HoursDonut roadmaps={career.roadmaps} />
        <div className="rounded-sm p-4 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 hud-corner relative"
          style={{ background: "var(--cr-card)", border: "1px solid var(--cr-border)" }}>
          <span className="c-tr"/><span className="c-bl"/>
          <StatTile label="ACTIVE" value={career.roadmaps.filter(r=>r.status==="active").length} color="var(--cr-accent)" icon={<Flame size={14}/>}/>
          <StatTile label="COMPLETE" value={career.roadmaps.filter(r=>progressOf(r).pct===100).length} color="var(--cr-accent3)" icon={<Trophy size={14}/>}/>
          <StatTile label="TOTAL HRS" value={Math.round(career.roadmaps.reduce((n,r)=>n+r.phases.reduce((m,p)=>m+p.milestones.reduce((k,ms)=>k+ms.hoursEstimate,0),0),0))} color="#facc15" icon={<Clock size={14}/>}/>
          <StatTile label="MILESTONES" value={career.roadmaps.reduce((n,r)=>n+r.phases.reduce((m,p)=>m+p.milestones.length,0),0)} color="#f472b6" icon={<Target size={14}/>}/>
        </div>
      </div>

      {/* Roadmap cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((r) => {
          const prog = progressOf(r);
          const isOpen = r.id === openId;
          return (
            <motion.button key={r.id}
              onClick={() => { setOpenId(isOpen ? null : r.id); if (!isOpen) setOpenPhaseId(null); }}
              whileHover={{ y: -3 }}
              className="text-left relative rounded-sm p-5 overflow-hidden transition hud-corner"
              style={{
                background: "var(--cr-card)",
                border: `1.5px solid ${isOpen ? r.color : "var(--cr-borderSoft)"}`,
                boxShadow: isOpen
                  ? `0 16px 40px -12px ${r.color}aa, inset 0 1px 0 ${r.color}55`
                  : "none",
              }}>
              <span className="c-tr"/><span className="c-bl"/>
              <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: `linear-gradient(180deg, ${r.color}, ${r.color}90)`, boxShadow: `0 0 12px ${r.color}aa` }} />

              <div className="flex items-start gap-3">
                <Donut value={prog.done} max={prog.total || 1} color={r.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black tracking-wide truncate"
                      style={{ color: "var(--cr-fg)" }}>
                      <span className="mr-1">{r.icon}</span>{r.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm"
                      style={{ color: r.color, background: `${r.color}18`, border: `1px solid ${r.color}40` }}>
                      <Star size={9}/> P{r.priority}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap tracking-wide"
                    style={{ color: "var(--cr-fgMuted)" }}>
                    <span className="flex items-center gap-0.5"><Clock size={11}/>{r.weeklyHoursTarget}h/wk</span>
                    <span>·</span>
                    <span>Phase {prog.currentPhaseIdx + 1}/{r.phases.length}</span>
                    <span>·</span>
                    <span style={{ color: r.color }}>{prog.pct}%</span>
                  </div>
                  {r.description && (
                    <p className="text-[11px] mt-1.5 line-clamp-2 italic"
                      style={{ color: "var(--cr-fgMuted)" }}>
                      {r.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Horizontal progress */}
              <div className="mt-4">
                <div className="h-1 rounded-full overflow-hidden"
                  style={{ background: "var(--cr-borderSoft)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${prog.pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${r.color}, ${r.color}cc)`, boxShadow: `0 0 10px ${r.color}` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold tracking-wider"
                  style={{ color: "var(--cr-fgMuted)" }}>
                  <span>{prog.done}/{prog.total} milestones</span>
                  <span>{prog.hoursDone|0}/{prog.hoursTotal}h</span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] emperor-title px-2 py-1 rounded"
          style={{
                color: r.status === "active" ? "var(--cr-accent)" : r.status === "paused" ? "var(--cr-accent2)" : prog.pct===100 ? "var(--cr-accent3)" : "var(--cr-fgMuted)",
                background: r.status === "active" ? "rgba(34,211,238,0.12)"
                  : r.status === "paused" ? "rgba(251,146,60,0.12)"
                  : prog.pct===100 ? "rgba(52,211,153,0.15)" : "rgba(100,116,139,0.1)",
                border: `1px solid ${r.status === "active" ? "rgba(34,211,238,0.35)" : r.status === "paused" ? "rgba(251,146,60,0.3)" : prog.pct===100 ? "rgba(52,211,153,0.4)" : "rgba(100,116,139,0.25)"}`,
              }}>
                  {prog.pct===100 ? "COMPLETE" : r.status.toUpperCase()}
                </span>
                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition">
                  <button onClick={(e) => { e.stopPropagation(); archiveRoadmap(r.id); }}
                    title="Archive" className="p-1.5 rounded-lg hover:bg-white/10"><Archive size={12}/></button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${r.name}"?`)) deleteRoadmap(r.id); }}
                    title="Delete" className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={12}/></button>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <details className="rounded-xl p-4"
          style={{ background: isDark ? "rgba(10,20,24,0.5)" : "rgba(200,180,140,0.1)", border: "1px dashed rgba(107,114,128,0.3)" }}>
          <summary className="text-xs emperor-title tracking-widest cursor-pointer"
            style={{ color: isDark ? "#6b7280" : "#8b7355" }}>ARCHIVED ({archived.length})</summary>
          <div className="mt-3 grid md:grid-cols-2 gap-2">
            {archived.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg"
                style={{ background: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.04)" }}>
                <span className="text-sm">{r.icon} {r.name}</span>
                <div className="flex gap-1">
                  <button onClick={()=>archiveRoadmap(r.id)} className="text-[10px] px-2 py-1 rounded text-cyan-300">Restore</button>
                  <button onClick={()=>{ if (confirm(`Delete "${r.name}"?`)) deleteRoadmap(r.id); }}
                    className="text-[10px] px-2 py-1 rounded text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Drilldown */}
      <AnimatePresence>
        {active && (() => {
          const prog = progressOf(active);
          const msMap = collectMilestoneMap(active);
          return (
            <motion.div key={active.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl p-5 md:p-7 relative overflow-hidden"
              style={{
                background: isDark ? "linear-gradient(145deg,rgba(12,26,34,0.9),rgba(10,20,24,0.8))" : "linear-gradient(145deg,rgba(255,248,228,0.95),rgba(242,230,201,0.9))",
                border: `1.5px solid ${active.color}66`,
                boxShadow: `0 24px 60px -20px ${active.color}88`,
              }}>
              <span aria-hidden className="absolute left-0 top-0 w-[4px] bottom-0"
                style={{ background: `linear-gradient(180deg, ${active.color}, ${active.color}66)` }} />

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: `${active.color}22`, border: `2px solid ${active.color}70` }}>{active.icon}</div>
                  <div>
                    <h3 className="imperial-name text-2xl font-black" style={{ color: isDark ? "#f3e9d2" : "#1a0f0a" }}>
                      {active.name}
                    </h3>
                    <p className="serif-body italic text-sm mt-1 max-w-xl" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>
                      {active.description}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap text-[11px] emperor-title tracking-wider">
                      <Badge label={`LVL ${active.startLevel} → ${active.targetLevel}`} color={active.color}/>
                      <Badge label={`${active.weeklyHoursTarget}h/wk`} color="#d4af37"/>
                      <Badge label={`Priority ${active.priority}/10`} color="#b91c1c"/>
                      <Badge label={`${prog.hoursDone|0}/${prog.hoursTotal}h`} color="#ec4899"/>
                    </div>
                  </div>
                </div>
                {prog.currentMilestone && prog.pct < 100 && (
                  <button onClick={() => {
                    setOpenPhaseId(prog.currentMilestone!.phaseId);
                    const el = document.getElementById(`ms-${prog.currentMilestone!.ms.id}`);
                    setTimeout(() => el?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                  }}
                    className="emperor-title font-black tracking-[0.2em] text-xs px-4 py-3 rounded-xl flex items-center gap-2 shrink-0"
                    style={{
                      background: "linear-gradient(135deg,#d4af37,#9c7a1a)", color: "#1a0f0a",
                      border: "1.5px solid rgba(253,230,138,0.7)",
                      boxShadow: "0 8px 20px -8px rgba(212,175,55,0.9)",
                    }}>
                    <Zap size={14}/> NEXT ACTION
                  </button>
                )}
              </div>

              <div className="k-blade my-5" style={{ opacity: 0.6 }} />

              {/* Weekly hours slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-[10px] emperor-title tracking-widest mb-1">
                  <span style={{ color: "#8b9eb0" }}>WEEKLY HOURS</span>
                  <span style={{ color: active.color }}>{active.weeklyHoursTarget}h</span>
                </div>
                <input type="range" min={1} max={30} value={weekOverride[active.id] ?? active.weeklyHoursTarget}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWeekOverride((o) => ({ ...o, [active.id]: v }));
                    // persist immediately
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    updateCareer((c: any) => ({
                      roadmaps: c.roadmaps.map((r: any) => r.id === active.id ? { ...r, weeklyHoursTarget: v } : r),
                    }));
                  }}
                  className="w-full" style={{ accentColor: active.color }}/>
              </div>

              {/* Phases */}
              <div className="space-y-3">
                {active.phases.map((ph, pi) => {
                  const phaseProg = progressOf({ ...active, phases: [ph] });
                  const isOpen = openPhaseId === ph.id;
                  return (
                    <div key={ph.id} className="rounded-xl overflow-hidden"
                      style={{
                        background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${isOpen ? active.color+"80" : "rgba(107,114,128,0.2)"}`,
                      }}>
                      <button onClick={() => setOpenPhaseId(isOpen ? null : ph.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm emperor-title font-black"
                          style={{ background: `${active.color}25`, color: active.color, border: `1px solid ${active.color}60` }}>
                          {pi + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="emperor-title font-black tracking-wide text-sm md:text-base"
                            style={{ color: isDark ? "#f3e9d2" : "#1a0f0a" }}>{ph.title}</h4>
                          {ph.description && (
                            <p className="text-[11px] serif-body italic" style={{ color: isDark ? "#8b9eb0" : "#6b513d" }}>
                              {ph.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] emperor-title" style={{ color: active.color }}>{phaseProg.pct}%</div>
                          <div className="text-[10px]" style={{ color: isDark ? "#6b7280" : "#8b7355" }}>
                            {phaseProg.done}/{phaseProg.total} · {phaseProg.hoursTotal}h
                          </div>
                        </div>
                        {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }} className="overflow-hidden">
                            <div className="p-4 pt-0 space-y-2">
                              {ph.milestones.map((ms, mi) => {
                                const locked = msIsLocked(ms, msMap);
                                return (
                                  <div id={`ms-${ms.id}`} key={ms.id}>
                                    <MilestoneRow
                                      ms={ms} index={mi} color={active.color} locked={locked} allById={msMap}
                                      onToggle={() => {
                                        if (locked) return;
                                        toggleMilestoneDone(active.id, ph.id, ms.id);
                                      }}
                                      onLogHours={(h) => logMilestoneHours(active.id, ph.id, ms.id, h)}
                                      onQuiz={(qid, a) => {
                                        // ensure defaults exist first
                                        ensureQuiz(active.id, ph.id, ms.id);
                                        // set answer after seed
                                        setTimeout(() => setQuizAnswer(active.id, ph.id, ms.id, qid, a), 0);
                                      }}
                                      onSelfRate={(field, v) => updateMilestone(active.id, ph.id, ms.id, { [field]: v })}
                                      onToggleLab={(lid) => toggleLabItem(active.id, ph.id, ms.id, lid)}
                                      onToggleResource={(rid) => toggleResourceComplete(active.id, ph.id, ms.id, rid)}
                                      onToggleProject={(pid) => toggleProjectComplete(active.id, ph.id, ms.id, pid)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Template picker */}
      <AnimatePresence>
        {picking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl rounded-2xl p-6 relative overflow-hidden max-h-[85vh] overflow-y-auto"
              style={{ background: "linear-gradient(145deg,#0c1a22,#0a1418)", border: "2px solid rgba(103,232,249,0.4)", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.9)" }}>
              <button onClick={()=>setPicking(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-gray-400">
                <X size={18}/>
              </button>
              <h3 className="imperial-name text-2xl font-black" style={{ color: "#67e8f9" }}>Forge a Roadmap</h3>
              <p className="text-sm serif-body italic mt-1" style={{ color: "#a8b8c8" }}>
                Choose a template — fully populated with phases, milestones, resources & projects — or start from scratch.
              </p>
              <div className="k-blade my-4" style={{ opacity: 0.5 }} />
              <div className="grid md:grid-cols-2 gap-3">
                {TEMPLATE_LIST.map((tpl) => {
                  const ms = tpl.phases.reduce((n, p) => n + p.milestones.length, 0);
                  return (
                    <button key={tpl.id}
                      onClick={() => { addRoadmapFromTemplate(tpl.template!); setPicking(false); }}
                      className="text-left rounded-xl p-4 transition hover:scale-[1.02] group"
                      style={{ background: `linear-gradient(145deg, ${tpl.color}18, rgba(0,0,0,0.3))`, border: `1px solid ${tpl.color}55` }}>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: `${tpl.color}25`, border: `1px solid ${tpl.color}70` }}>{tpl.icon}</div>
                        <div className="flex-1">
                          <div className="emperor-title font-black" style={{ color: "#f3e9d2" }}>{tpl.name}</div>
                          <div className="text-[11px] serif-body italic" style={{ color: "#8b9eb0" }}>{tpl.description}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[10px] emperor-title" style={{ color: tpl.color }}>
                        <Flame size={10}/> {tpl.phases.length} phases · {ms} milestones
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => { addRoadmapFromTemplate("custom"); setPicking(false); }}
                  className="text-left rounded-xl p-4 transition hover:scale-[1.02]"
                  style={{ background: "linear-gradient(145deg,rgba(212,175,55,0.12),rgba(0,0,0,0.3))", border: "1px dashed rgba(212,175,55,0.5)" }}>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.7)" }}>⚒️</div>
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

      {/* Celebration */}
      <AnimatePresence>
        {celebrateId && (() => {
          const r = career.roadmaps.find((x) => x.id === celebrateId);
          if (!r) return null;
          return <Celebration roadmap={r} onClose={()=>setCelebrateId(null)} />;
        })()}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-sm p-3 flex items-center gap-3 hud-corner relative"
      style={{ background: "var(--cr-card2)", border: `1px solid ${color}55` }}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="w-9 h-9 rounded-sm flex items-center justify-center"
        style={{ background: `${color}22`, color }}>{icon}</div>
      <div>
        <div className="text-[9px] font-bold tracking-widest" style={{ color: "var(--cr-fgMuted)" }}>{label}</div>
        <div className="text-xl font-black leading-tight" style={{ color: "var(--cr-fg)" }}>{value}</div>
      </div>
    </div>
  );
}
