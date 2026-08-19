"use client";

/**
 * WorkoutCalisthenics — calisthenics/bodyweight feature section.
 *
 * Every tab now reads/writes through the global store (useStore) so data
 * persists across refresh and shows up in analytics / CSV / heatmaps:
 *   - Progression chain tracker (uses caliChains + toggleChainProgression)
 *   - Skill cards with real Log attempt / Log fail modals (logCaliAttempt/logCaliFail)
 *     including ring-height slider, assistance text, MMC rating, tempo, test-day
 *   - First-unlock celebration distinct from full mastery
 *   - Isometric hold timer → logIsometric
 *   - EMOM / AMRAP timers → addIntervalLog
 *   - GtG hourly grid → toggleGtG, plus 7-day sparkline of daily volume
 *   - Freestyle flow logger → addFlow
 *   - Mobility/warmup library → logMobility + addMobilityDrill
 *   - Rest/deload day → logRestDay
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Play, Square, Save, Target, Flame, Award, Zap, Timer,
  Hand, RefreshCw, X, Database,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { DEMO_TOOLS_ENABLED } from "../../lib/demoMode";
import { playBeep } from "../../lib/workoutAnalytics";
import CelebrationModal from "./CelebrationModal";
import type { CalisthenicsSkill, CaliEquipment, MovementPattern, RepQuality } from "../../lib/types";

export default function WorkoutCalisthenics() {
  const {
    workout,
    toggleChainProgression, unlockCaliSkill,
    logCaliAttempt, logCaliFail, toggleCaliSkillArchived, addCaliSkill,
    toggleGtG, logIsometric, addIntervalLog, addFlow, deleteFlow,
    logMobility, logRestDay, addMobilityDrill, seedDemoData,
  } = useStore();
  const router = useRouter();

  const [tab, setTab] = useState<
    "chains" | "skills" | "gtg" | "iso" | "emom-amrap" | "flow" | "mobility" | "rest"
  >("chains");

  // Pull everything cali from the store (falls back to empty arrays if
  // running against a freshly-migrated store that predates these slices).
  const chains = workout.caliChains ?? [];
  const skills = workout.caliSkills ?? [];
  const gtgEntries = workout.gtg ?? [];
  const isoLogs = workout.isometricLogs ?? [];
  const intervalLogs = workout.intervalLogs ?? [];
  const flows = workout.caliFlows ?? [];
  const mobDrills = workout.mobilityDrills ?? [];
  const mobSessions = workout.mobilitySessions ?? [];

  // ---------- Celebration for first-unlock ----------
  const [celebrate, setCelebrate] = useState<{ title: string; subtitle?: string; emoji: string; color: string } | null>(null);

  // ---------- Skill attempt / fail modals ----------
  const [attemptSkill, setAttemptSkill] = useState<CalisthenicsSkill | null>(null);
  const [failSkill, setFailSkill] = useState<CalisthenicsSkill | null>(null);
  const [attReps, setAttReps] = useState("");
  const [attHold, setAttHold] = useState("");
  const [attRing, setAttRing] = useState<number>(180);
  const [attAssist, setAttAssist] = useState("");
  const [attMmc, setAttMmc] = useState(7);
  const [attTempo, setAttTempo] = useState("");
  const [attQuality, setAttQuality] = useState<RepQuality>("good");
  const [attTest, setAttTest] = useState(false);
  const [attRP, setAttRP] = useState(false);
  const [attRPAttempts, setAttRPAttempts] = useState("3,3,2");
  const [failReason, setFailReason] = useState("");

  function openAttempt(s: CalisthenicsSkill) {
    setAttemptSkill(s);
    setAttReps(""); setAttHold("");
    setAttRing(s.ringHeightCm ?? 180);
    setAttAssist(""); setAttMmc(7); setAttTempo("");
    setAttQuality("good"); setAttTest(false); setAttRP(false); setAttRPAttempts("3,3,2");
  }
  function submitAttempt() {
    if (!attemptSkill) return;
    const reps = attReps ? parseInt(attReps, 10) : undefined;
    const hold = attHold ? parseInt(attHold, 10) : undefined;
    if ((!reps || reps <= 0) && (!hold || hold <= 0)) return;
    const isFirst = !attemptSkill.unlocked && (reps ?? 0) >= 1;
    logCaliAttempt(attemptSkill.id, {
      reps: reps || undefined,
      holdSec: hold || undefined,
      ringHeightCm: attRing,
      assistance: attAssist || undefined,
      mmc: attMmc,
      tempo: attTempo || undefined,
      quality: attQuality,
      isTestDay: attTest,
      isRestPause: attRP,
      restPauseAttempts: attRP ? attRPAttempts.split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => n > 0) : undefined,
    });
    // First-unlock celebration (distinct from full mastery).
    if (isFirst) {
      unlockCaliSkill(attemptSkill.id);
      setCelebrate({
        title: `Unlocked: ${attemptSkill.name}! 🎉`,
        subtitle: "First clean rep — keep the momentum going.",
        emoji: "🔥",
        color: "#f59e0b",
      });
    }
    setAttemptSkill(null);
  }
  function submitFail() {
    if (!failSkill || !failReason.trim()) return;
    logCaliFail(failSkill.id, failReason.trim());
    setFailSkill(null); setFailReason("");
  }

  // ---------- Chain progression unlock celebration ----------
  function handleChainToggle(cid: string, pid: string) {
    const chain = chains.find((c) => c.id === cid);
    const p = chain?.progressions.find((x) => x.id === pid);
    const firstTime = p && !p.achieved;
    toggleChainProgression(cid, pid);
    if (firstTime && chain) {
      // light first-unlock toast; we don't have full mastery detection here
      // but the chain progressions map to the unlock checklist anyway.
      playBeep(880, 180);
    }
  }

  // ---------- Isometric timer ----------
  const [isoSec, setIsoSec] = useState(0);
  const [isoRunning, setIsoRunning] = useState(false);
  const [isoName, setIsoName] = useState("Plank");
  useInterval(isoRunning, () => setIsoSec((s) => s + 1));
  function saveIso() {
    if (!isoSec || !isoName.trim()) return;
    logIsometric(isoName.trim(), isoSec);
    setIsoSec(0); setIsoRunning(false);
  }

  // ---------- AMRAP ----------
  const [amrapCap, setAmrapCap] = useState(600);
  const [amrapName, setAmrapName] = useState("AMRAP");
  const [amrapRunning, setAmrapRunning] = useState(false);
  const [amrapElapsed, setAmrapElapsed] = useState(0);
  const [amrapRounds, setAmrapRounds] = useState(0);
  const [amrapReps, setAmrapReps] = useState(0);
  useInterval(amrapRunning, () => {
    setAmrapElapsed((s) => {
      if (s + 1 >= amrapCap) { setAmrapRunning(false); playBeep(660, 400); }
      return Math.min(s + 1, amrapCap);
    });
  });
  function saveAmrap() {
    if (!amrapName.trim()) return;
    addIntervalLog({
      type: "amrap",
      name: amrapName.trim(),
      timeCapSec: amrapCap,
      rounds: amrapRounds,
      reps: amrapRounds + amrapReps,
      notes: `${amrapRounds} rounds + ${amrapReps} reps in ${Math.floor(amrapElapsed/60)}:${String(amrapElapsed%60).padStart(2,"0")}`,
    });
    setAmrapRunning(false); setAmrapElapsed(0); setAmrapRounds(0); setAmrapReps(0);
  }

  // ---------- EMOM ----------
  const [emomName, setEmomName] = useState("EMOM");
  const [emomMinutes, setEmomMinutes] = useState(10);
  const [emomRunning, setEmomRunning] = useState(false);
  const [emomSec, setEmomSec] = useState(0);
  const [emomReps, setEmomReps] = useState<number[]>([]);
  const [emomInput, setEmomInput] = useState("");
  const beepedRef = useRef(false);
  useInterval(emomRunning, () => {
    setEmomSec((s) => {
      const next = s + 1;
      if (next >= 60) {
        playBeep(960, 180);
        return 0;
      }
      return next;
    });
  });
  function emomLog() {
    const n = parseInt(emomInput || "0", 10);
    if (n <= 0) return;
    setEmomReps((r) => [...r, n]);
    setEmomInput("");
  }
  function emomFinish() {
    if (!emomName.trim()) return;
    addIntervalLog({
      type: "emom",
      name: emomName.trim(),
      intervals: emomReps.map((reps) => ({ reps, workSec: 60, restSec: 0 })),
      perMinuteReps: emomReps,
      notes: `${emomReps.length} minutes logged`,
    });
    setEmomRunning(false); setEmomSec(0); setEmomReps([]); setEmomInput("");
  }

  // ---------- GtG ----------
  const todayIso = new Date().toISOString().slice(0, 10);
  const hours = Array.from({ length: 12 }, (_, i) => 7 + i);
  const gtgDayMap = useMemo(() => {
    const m = new Map<string, Map<number, { reps: number }>>();
    gtgEntries.forEach((g) => {
      if (!m.has(g.date)) m.set(g.date, new Map());
      m.get(g.date)!.set(g.hour, { reps: g.reps });
    });
    return m;
  }, [gtgEntries]);
  const gtgToday = gtgDayMap.get(todayIso);
  const gtgTotal = useMemo(() => {
    let n = 0;
    gtgDayMap.get(todayIso)?.forEach((v) => (n += v.reps));
    return n;
  }, [gtgDayMap, todayIso]);
  // 7-day sparkline data (daily totals)
  const gtgWeek = useMemo(() => {
    const DAY = 86_400_000;
    const out: { label: string; reps: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      let n = 0;
      gtgDayMap.get(d)?.forEach((v) => (n += v.reps));
      out.push({ label: d.slice(5), reps: n });
    }
    return out;
  }, [gtgDayMap]);
  const gtgStreak = useMemo(() => {
    let streak = 0;
    const DAY = 86_400_000;
    for (let i = 0; i < 60; i++) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      const total = Array.from(gtgDayMap.get(d)?.values() ?? []).reduce((n, v) => n + v.reps, 0);
      if (total > 0) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [gtgDayMap]);
  const [gtgExercise, setGtgExercise] = useState("Push-up");
  const [gtgReps, setGtgReps] = useState(5);

  // ---------- Flow ----------
  const [flowName, setFlowName] = useState("");
  const [flowMoves, setFlowMoves] = useState("");
  const [flowQuality, setFlowQuality] = useState(7);

  // ---------- Mobility ----------
  const [mobChecked, setMobChecked] = useState<Record<string, boolean>>({});
  const [newDrillName, setNewDrillName] = useState("");
  const [newDrillDur, setNewDrillDur] = useState(60);

  // ---------- Rest ----------
  const [restReason, setRestReason] = useState("");

  // ---------- Add-skill form ----------
  const [newSkillOpen, setNewSkillOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillPattern, setNewSkillPattern] = useState<MovementPattern>("Pull");
  const [newSkillDiff, setNewSkillDiff] = useState(6);
  const [newSkillEquip, setNewSkillEquip] = useState<CaliEquipment[]>(["pull-up-bar"]);
  const [newSkillRingH, setNewSkillRingH] = useState(180);
  const [newSkillVideo, setNewSkillVideo] = useState("");
  function toggleEquip(eq: CaliEquipment) {
    setNewSkillEquip((cur) => cur.includes(eq) ? cur.filter(x => x !== eq) : [...cur, eq]);
  }
  function submitNewSkill() {
    if (!newSkillName.trim()) return;
    addCaliSkill({
      name: newSkillName.trim(),
      pattern: newSkillPattern,
      difficulty: newSkillDiff,
      videoUrl: newSkillVideo || undefined,
      accessoryIds: [],
      equipmentNeeded: newSkillEquip,
      ringHeightCm: newSkillEquip.includes("rings") ? newSkillRingH : undefined,
    });
    setNewSkillName(""); setNewSkillVideo(""); setNewSkillEquip(["pull-up-bar"]);
    setNewSkillDiff(6); setNewSkillPattern("Pull"); setNewSkillRingH(180);
    setNewSkillOpen(false);
  }

  // Auto-stop the iso timer on unmount
  useEffect(() => () => setIsoRunning(false), []);

  const TABS: { id: typeof tab; label: string; icon: any }[] = [
    { id: "chains",     label: "Chains",    icon: Target },
    { id: "skills",     label: "Skills",    icon: Award },
    { id: "gtg",        label: "GtG",       icon: Hand },
    { id: "iso",        label: "Isometric", icon: Timer },
    { id: "emom-amrap", label: "EMOM/AMRAP", icon: Flame },
    { id: "flow",       label: "Flow",      icon: RefreshCw },
    { id: "mobility",   label: "Mobility",  icon: Zap },
    { id: "rest",       label: "Rest",      icon: Flame },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🤸</span> Calisthenics
        </h2>
        <p className="text-sm text-gray-400 mt-1">Progressions, skills, timers, grease-the-groove, flows, and mobility.</p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                active ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}>
              {active && <motion.div layoutId="cali-tab"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-lime-500/20 to-emerald-500/20 border border-lime-500/30" />}
              <Icon size={13} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chains */}
      {tab === "chains" && (
        <div className="space-y-4">
          {chains.length === 0 && (
            <EmptyState icon={<Target size={20} />} title="No progression chains yet"
              subtitle="No progression templates are currently available."
              actionLabel={DEMO_TOOLS_ENABLED?"Reset demo data":undefined}
              onAction={DEMO_TOOLS_ENABLED?() => { if (confirm("Reset workout data to seed? This clears logs.")) seedDemoData(); }:undefined} />
          )}
          {chains.map((chain) => {
            const achieved = chain.progressions.filter((p) => p.achieved).length;
            const pct = Math.round((achieved / Math.max(1, chain.progressions.length)) * 100);
            return (
              <div key={chain.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-semibold text-white flex-1">{chain.name}</h4>
                  <span className="text-xs text-gray-400">{achieved}/{chain.progressions.length}</span>
                  <span className="text-sm font-bold text-lime-400">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
                  <motion.div className="h-full bg-gradient-to-r from-lime-500 to-emerald-500" animate={{ width: `${pct}%` }} />
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-[9px] top-1 bottom-1 w-px bg-white/10" />
                  {chain.progressions.map((p, i) => {
                    const prev = i > 0 ? chain.progressions[i - 1].achieved : true;
                    const locked = !prev && !p.achieved;
                    return (
                      <div key={p.id} className="flex items-center gap-3 py-1.5">
                        <button onClick={() => handleChainToggle(chain.id, p.id)}
                          className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                            p.achieved
                              ? "bg-lime-500 border-lime-500 text-white"
                              : locked ? "bg-white/5 border-white/10" : "border-white/20 hover:border-lime-400"
                          }`}>
                          {p.achieved && "✓"}
                        </button>
                        <span className={`text-sm flex-1 ${p.achieved ? "text-white" : locked ? "text-gray-600" : "text-gray-300"}`}>
                          {p.name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {"★".repeat(p.difficulty)}{"☆".repeat(Math.max(0, 10 - p.difficulty))}
                        </span>
                        {p.bestReps != null && <span className="text-xs text-lime-400">{p.bestReps} reps</span>}
                        {p.bestHoldSec != null && <span className="text-xs text-lime-400">{p.bestHoldSec}s</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skills */}
      {tab === "skills" && (
        <div className="space-y-3">
          {/* Add-skill form */}
          <div className="card">
            <button onClick={() => setNewSkillOpen((v) => !v)}
              className="w-full flex items-center gap-2 text-sm font-medium text-white">
              <Plus size={16} className="text-lime-400" />
              {newSkillOpen ? "Close" : "Add a new skill"}
            </button>
            <AnimatePresence>
              {newSkillOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="pt-4 space-y-2">
                    <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Skill name (e.g. Muscle-up, Planche, Pistol squat)" className="input-base w-full text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-gray-400">Pattern
                        <select value={newSkillPattern} onChange={(e) => setNewSkillPattern(e.target.value as MovementPattern)}
                          className="input-base w-full mt-1 text-xs">
                          {["Pull","Push","Squat","Hinge","Isometric","Carry","Rotation","Gait","Other"].map(p =>
                            <option key={p} value={p}>{p}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-gray-400">Difficulty (1–10)
                        <input type="number" min={1} max={10} value={newSkillDiff}
                          onChange={(e) => setNewSkillDiff(Math.max(1, Math.min(10, parseInt(e.target.value || "1", 10))))}
                          className="input-base w-full mt-1 text-center text-xs" />
                      </label>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Equipment</p>
                      <div className="flex flex-wrap gap-1">
                        {(["pull-up-bar","rings","parallettes","resistance-bands","weighted-vest","dip-bars","none"] as CaliEquipment[]).map(eq => (
                          <button key={eq} onClick={() => toggleEquip(eq)}
                            className={`px-2 py-1 rounded text-[10px] capitalize font-semibold border ${
                              newSkillEquip.includes(eq) ? "border-pink-500/50 bg-pink-500/20 text-pink-200" : "border-white/10 bg-white/5 text-gray-400"
                            }`}>{eq.replace("-", " ")}</button>
                        ))}
                      </div>
                    </div>
                    {newSkillEquip.includes("rings") && (
                      <label className="block text-xs text-gray-400">Baseline ring height (cm) — {newSkillRingH}
                        <input type="range" min={80} max={260} value={newSkillRingH}
                          onChange={(e) => setNewSkillRingH(parseInt(e.target.value, 10))}
                          className="w-full accent-pink-500 mt-1" />
                      </label>
                    )}
                    <label className="block text-xs text-gray-400">Video URL (optional)
                      <input value={newSkillVideo} onChange={(e) => setNewSkillVideo(e.target.value)}
                        placeholder="https://..." className="input-base w-full mt-1 text-xs" />
                    </label>
                    <button onClick={submitNewSkill} disabled={!newSkillName.trim()}
                      className="btn-primary w-full text-sm disabled:opacity-40">Add skill</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {skills.filter((s) => !s.archived).length === 0 && (
            <EmptyState
              icon={<Award size={20} />}
              title="No skills yet"
              subtitle="Add your first target skill (e.g. Muscle-up, Planche) above." />
          )}

          <div className="grid md:grid-cols-2 gap-3">
          {skills.filter((s) => !s.archived).map((s) => {
            const best = s.bestAttempt;
            const lastFail = s.failLog[s.failLog.length - 1];
            return (
              <div key={s.id} className="card">
                <div className="flex items-start gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.unlocked ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-500"}`}>
                    {s.unlocked ? "🏆" : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white">{s.name}</h4>
                    <p className="text-xs text-gray-400">
                      Difficulty {s.difficulty}/10 · {s.equipmentNeeded.join(", ") || "no equipment"}
                    </p>
                  </div>
                  <button onClick={() => toggleCaliSkillArchived(s.id)} title="Archive"
                    className="text-gray-500 hover:text-gray-300 p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
                {s.unlockedAt && <p className="text-[11px] text-amber-300 mt-2">🔥 Unlocked {s.unlockedAt}</p>}
                {s.firstAttemptDate && <p className="text-xs text-gray-500">First attempt: {s.firstAttemptDate}</p>}
                {best && (
                  <p className="text-xs text-lime-400 mt-1">
                    Best: {best.reps ? `${best.reps} reps` : ""}{best.holdSec ? `${best.holdSec}s` : ""}
                    {best.ringHeightCm ? ` @ ${best.ringHeightCm}cm` : ""} · {best.date}
                  </p>
                )}
                {s.accessoryIds.length > 0 && (
                  <p className="text-[11px] text-violet-300 mt-2">Accessories: {s.accessoryIds.join(", ")}</p>
                )}
                {lastFail && (
                  <div className="mt-2 text-[11px] text-red-400 bg-red-500/10 rounded px-2 py-1">
                    Last fail ({lastFail.date}): {lastFail.reason}
                  </div>
                )}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => openAttempt(s)} className="btn-primary text-xs py-1 px-3">Log attempt</button>
                  <button onClick={() => setFailSkill(s)} className="btn-ghost text-xs py-1 px-3">Log fail</button>
                  {s.attempts.length > 0 && (
                    <span className="text-[10px] text-gray-500 self-center">{s.attempts.length} attempts logged</span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* GtG */}
      {tab === "gtg" && (
        <div className="card">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-white">Grease the Groove</h4>
            <input value={gtgExercise} onChange={(e) => setGtgExercise(e.target.value)}
              className="input-base text-xs py-1 flex-1 min-w-[140px]" placeholder="Exercise" />
            <label className="text-xs text-gray-400 flex items-center gap-1">
              Reps
              <input type="number" min={1} value={gtgReps} onChange={(e) => setGtgReps(parseInt(e.target.value || "1", 10))}
                className="input-base w-12 py-1 text-center text-xs" />
            </label>
          </div>
          <p className="text-xs text-gray-400 mb-4">Tap a cell when you bang out a micro-set. Total tallies across the day.</p>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {hours.map((h) => {
              const done = gtgToday?.has(h);
              const reps = gtgToday?.get(h)?.reps ?? gtgReps;
              return (
                <button key={h}
                  onClick={() => toggleGtG(todayIso, h, gtgExercise, done ? 0 : gtgReps)}
                  className={`p-3 rounded-xl border text-sm font-mono transition ${
                    done
                      ? "bg-lime-500/20 border-lime-500/40 text-lime-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                  }`}>
                  {h}:00{done ? ` · ${reps}` : ""}
                </button>
              );
            })}
          </div>
          {/* 7-day sparkline */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Last 7 days (GtG reps)</p>
            <div className="flex items-end gap-1 h-14">
              {gtgWeek.map((d) => {
                const max = Math.max(1, ...gtgWeek.map((x) => x.reps));
                const h = (d.reps / max) * 48;
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center justify-end group">
                    <div className="text-[9px] text-lime-300 opacity-0 group-hover:opacity-100">{d.reps}</div>
                    <div className="w-full rounded-t bg-gradient-to-t from-lime-500 to-emerald-400" style={{ height: `${h}px` }} />
                    <div className="text-[8px] text-gray-500 mt-1">{d.label.slice(3)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="text-gray-400">Today: <b className="text-lime-400">{gtgTotal} reps</b></span>
            <span className="text-gray-400">Streak: <b className="text-amber-400">{gtgStreak} days</b></span>
          </div>
        </div>
      )}

      {/* Isometric */}
      {tab === "iso" && (
        <div className="card text-center">
          <h4 className="font-semibold text-white mb-1">Isometric Hold Timer</h4>
          <p className="text-xs text-gray-400 mb-4">Plank, L-sit, Handstand, or any static hold. Save writes to your log.</p>
          <input value={isoName} onChange={(e) => setIsoName(e.target.value)}
            className="input-base text-center mb-4 w-full max-w-xs mx-auto" placeholder="Exercise (Plank)" />
          <div className="text-7xl font-bold font-mono text-cyan-300 my-6">
            {Math.floor(isoSec / 60)}:{String(isoSec % 60).padStart(2, "0")}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!isoRunning ? (
              <button onClick={() => { setIsoRunning(true); if (isoSec === 0) playBeep(660, 120); }} className="btn-primary flex items-center gap-2"><Play size={16} /> Start</button>
            ) : (
              <button onClick={() => { setIsoRunning(false); playBeep(880, 300); }} className="btn-primary bg-gradient-to-r from-rose-500 to-red-500 flex items-center gap-2"><Square size={16} /> Stop</button>
            )}
            <button onClick={() => { setIsoSec(0); setIsoRunning(false); }} className="btn-ghost flex items-center gap-2">Reset</button>
            <button onClick={saveIso} disabled={!isoSec} className="btn-ghost flex items-center gap-2 disabled:opacity-40"><Save size={14} /> Log</button>
          </div>
          {isoLogs.length > 0 && (
            <div className="mt-6 text-left">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Recent</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {isoLogs.slice(0, 8).map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-2 rounded bg-white/5 text-xs">
                    <span className="text-gray-200">{l.name}</span>
                    <span className="text-gray-400">{l.date} · {Math.floor(l.seconds/60)}:{String(l.seconds%60).padStart(2,"0")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMOM / AMRAP */}
      {tab === "emom-amrap" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h4 className="font-semibold text-white mb-1">AMRAP</h4>
            <p className="text-xs text-gray-400 mb-3">As many rounds/reps as possible in a time cap.</p>
            <input value={amrapName} onChange={(e) => setAmrapName(e.target.value)}
              className="input-base w-full text-sm mb-2" placeholder="Name (e.g. Cindy)" />
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-gray-400">Cap (min)</label>
              <input type="number" min={1} value={Math.round(amrapCap / 60)}
                onChange={(e) => setAmrapCap((parseInt(e.target.value || "0", 10)) * 60)}
                className="input-base w-20 text-center" />
            </div>
            <div className="text-5xl font-mono font-bold text-pink-400 text-center my-4">
              {Math.floor(amrapElapsed / 60)}:{String(amrapElapsed % 60).padStart(2, "0")}
            </div>
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              {!amrapRunning ? (
                <button onClick={() => { setAmrapRunning(true); setAmrapElapsed(0); setAmrapRounds(0); setAmrapReps(0); }} className="btn-primary text-sm"><Play size={14} /> Go</button>
              ) : (
                <button onClick={() => { setAmrapRunning(false); playBeep(880, 300); }} className="btn-primary text-sm">Stop</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-400">Rounds
                <input type="number" value={amrapRounds} onChange={(e) => setAmrapRounds(parseInt(e.target.value || "0", 10))} className="input-base w-full mt-1" />
              </label>
              <label className="text-xs text-gray-400">Extra reps
                <input type="number" value={amrapReps} onChange={(e) => setAmrapReps(parseInt(e.target.value || "0", 10))} className="input-base w-full mt-1" />
              </label>
            </div>
            <button onClick={saveAmrap} disabled={amrapRunning || amrapRounds + amrapReps === 0}
              className="btn-primary w-full mt-3 text-sm disabled:opacity-40"><Save size={13} /> Save score</button>
          </div>

          <div className="card">
            <h4 className="font-semibold text-white mb-1">EMOM</h4>
            <p className="text-xs text-gray-400 mb-3">Every minute on the minute — log reps per minute.</p>
            <input value={emomName} onChange={(e) => setEmomName(e.target.value)}
              className="input-base w-full text-sm mb-2" placeholder="Name (e.g. 10min burpees)" />
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-gray-400">Minutes</label>
              <input type="number" min={1} value={emomMinutes} onChange={(e) => setEmomMinutes(parseInt(e.target.value || "0", 10))} className="input-base w-20 text-center" />
            </div>
            <div className="text-5xl font-mono font-bold text-cyan-400 text-center my-4">
              {String(emomReps.length).padStart(2, "0")}:{String(emomSec).padStart(2, "0")}
            </div>
            {!emomRunning ? (
              <button onClick={() => { setEmomRunning(true); setEmomSec(0); setEmomReps([]); setEmomInput(""); }}
                className="btn-primary w-full text-sm"><Play size={14} /> Start</button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" value={emomInput} onChange={(e) => setEmomInput(e.target.value)}
                    placeholder={`Minute ${emomReps.length + 1} reps`}
                    className="input-base flex-1" />
                  <button onClick={emomLog} className="btn-primary px-3 text-sm">Log</button>
                </div>
                <button onClick={emomFinish} className="btn-ghost w-full text-sm">Stop & save</button>
              </div>
            )}
            {emomReps.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {emomReps.map((r, i) => (
                  <span key={i} className="chip bg-cyan-500/20 text-cyan-300">M{i + 1}: {r}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flow */}
      {tab === "flow" && (
        <div className="space-y-3">
          <div className="card">
            <h4 className="font-semibold text-white mb-3">Log a Freestyle Flow</h4>
            <input value={flowName} onChange={(e) => setFlowName(e.target.value)} placeholder="Flow name (optional)"
              className="input-base w-full mb-2" />
            <textarea value={flowMoves} onChange={(e) => setFlowMoves(e.target.value)}
              placeholder="Sequence: e.g. Muscle-up → 3 dips → L-sit → roll to planche …"
              className="input-base w-full h-20 mb-2" />
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-xs text-gray-400">Quality:</span>
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button key={n} onClick={() => setFlowQuality(n)}
                  className={`w-7 h-7 rounded text-xs font-bold ${flowQuality === n ? "bg-violet-500 text-white" : "bg-white/5 text-gray-400"}`}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => {
              if (!flowMoves.trim()) return;
              addFlow({ name: flowName.trim() || "Flow", moves: flowMoves.trim(), quality: flowQuality });
              setFlowName(""); setFlowMoves(""); setFlowQuality(7);
            }} className="btn-primary text-sm"><Save size={13} /> Save flow</button>
          </div>
          {flows.slice(0, 10).map((f) => (
            <div key={f.id} className="card group relative">
              <button onClick={() => deleteFlow(f.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400">
                <Trash2 size={12} />
              </button>
              <div className="flex items-start justify-between">
                <h5 className="font-semibold text-white">{f.name}</h5>
                <span className="text-xs text-violet-300">Q{f.quality}/10 · {f.date}</span>
              </div>
              <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{f.moves}</p>
            </div>
          ))}
          {flows.length === 0 && (
            <EmptyState icon={<RefreshCw size={20} />} title="No flows yet"
              subtitle="String together a few moves and log your first freestyle flow above." />
          )}
        </div>
      )}

      {/* Mobility */}
      {tab === "mobility" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h4 className="font-semibold text-white mb-3">Warm-up Library</h4>
            <div className="space-y-1.5">
              {mobDrills.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox-custom"
                    checked={!!mobChecked[m.id]}
                    onChange={(e) => setMobChecked((c) => ({ ...c, [m.id]: e.target.checked }))} />
                  <span className="flex-1 text-gray-300">{m.name}</span>
                  <span className="text-xs text-gray-500">
                    {m.durationSec}s
                    {m.tags?.length ? <span className="ml-1 text-gray-600">· {m.tags.join(",")}</span> : null}
                  </span>
                </label>
              ))}
            </div>
            <button onClick={() => {
              const ids = Object.entries(mobChecked).filter(([, v]) => v).map(([k]) => k);
              if (ids.length === 0) return;
              logMobility(ids);
              setMobChecked({});
            }} className="btn-primary w-full mt-4 text-sm">Log warm-up</button>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Add drill</p>
              <div className="flex gap-2">
                <input value={newDrillName} onChange={(e) => setNewDrillName(e.target.value)}
                  placeholder="Name" className="input-base flex-1 text-xs py-1.5" />
                <input type="number" min={10} step={5} value={newDrillDur}
                  onChange={(e) => setNewDrillDur(parseInt(e.target.value || "30", 10))}
                  className="input-base w-16 text-xs py-1.5 text-center" />
                <button onClick={() => {
                  if (!newDrillName.trim()) return;
                  // addMobilityDrill typed as (name,sec,tags?) => void
                  addMobilityDrill(newDrillName.trim(), newDrillDur);
                  setNewDrillName(""); setNewDrillDur(60);
                }} className="btn-primary text-xs px-3">+</button>
              </div>
            </div>
          </div>
          <div className="card">
            <h4 className="font-semibold text-white mb-3">Recent sessions</h4>
            {mobSessions.length === 0 && (
              <EmptyState icon={<Zap size={20} />} title="No warm-ups logged yet"
                subtitle="Check a few drills on the left and hit Log warm-up to save today's prep." />
            )}
            {mobSessions.slice(0, 10).map((s) => (
              <div key={s.id} className="p-2 rounded-lg bg-white/5 mb-2">
                <div className="text-xs text-gray-400">{s.date} · {Math.round(s.durationSec/60)} min</div>
                <div className="text-sm text-gray-200">
                  {s.drillIds.map((id) => mobDrills.find((m) => m.id === id)?.name).filter(Boolean).join(" · ")}
                </div>
                {s.notes && <div className="text-[11px] text-gray-500 mt-1">{s.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest */}
      {tab === "rest" && (
        <div className="card">
          <h4 className="font-semibold text-white mb-2">Rest / Deload Day</h4>
          <p className="text-xs text-gray-400 mb-4">Recovery is training. Tap a reason to log today as a rest day (persists across refresh).</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {["soreness","fatigue","injury","life","deload"].map((r) => (
              <button key={r} onClick={() => logRestDay(r)}
                className="chip bg-white/5 text-gray-300 hover:bg-white/10 capitalize cursor-pointer px-3 py-1.5">
                {r}
              </button>
            ))}
          </div>
          <input value={restReason} onChange={(e) => setRestReason(e.target.value)}
            placeholder="Or add a note…" className="input-base w-full mb-2" />
          <button onClick={() => { if (restReason.trim()) { logRestDay(restReason.trim()); setRestReason(""); } }}
            className="btn-primary text-sm" disabled={!restReason.trim()}>Log note</button>
          {workout.restDays.length > 0 && (
            <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
              {workout.restDays.slice(0, 8).map((r, i) => (
                <div key={i} className="text-sm text-gray-400 flex justify-between">
                  <span>{r.date}</span>
                  <span className="text-gray-300">{r.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------- Modals ------- */}
      <AnimatePresence>
        {attemptSkill && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setAttemptSkill(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-6 border border-amber-500/30 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Log attempt: {attemptSkill.name}</h3>
                  <button onClick={() => setAttemptSkill(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-gray-400">Reps
                      <input type="number" min={0} value={attReps} onChange={(e) => setAttReps(e.target.value)}
                        className="input-base w-full mt-1" autoFocus />
                    </label>
                    <label className="text-xs text-gray-400">Hold (s)
                      <input type="number" min={0} value={attHold} onChange={(e) => setAttHold(e.target.value)}
                        className="input-base w-full mt-1" />
                    </label>
                  </div>
                  {attemptSkill.equipmentNeeded.includes("rings") && (
                    <label className="block text-xs text-gray-400">Ring height (cm) — {attRing}
                      <input type="range" min={80} max={260} value={attRing}
                        onChange={(e) => setAttRing(parseInt(e.target.value, 10))}
                        className="w-full accent-pink-500 mt-1" />
                    </label>
                  )}
                  <label className="block text-xs text-gray-400">Assistance (band / spotter / none)
                    <input value={attAssist} onChange={(e) => setAttAssist(e.target.value)}
                      placeholder="e.g. purple band, 2kg counterweight"
                      className="input-base w-full mt-1 text-sm" />
                  </label>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">MMC (mind-muscle connection)</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <button key={n} onClick={() => setAttMmc(n)}
                          className={`flex-1 h-7 rounded text-xs font-bold ${attMmc === n ? "bg-violet-500 text-white" : "bg-white/5 text-gray-400"}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <label className="block text-xs text-gray-400">Tempo (e.g. 3-1-2-1)
                    <input value={attTempo} onChange={(e) => setAttTempo(e.target.value)}
                      className="input-base w-full mt-1 text-sm" />
                  </label>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Quality</p>
                    <div className="flex gap-1 flex-wrap">
                      {(["perfect","good","decent","bad"] as RepQuality[]).map((q) => (
                        <button key={q} onClick={() => setAttQuality(q)}
                          className={`px-2 py-1 rounded text-[10px] capitalize font-semibold border ${attQuality === q ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200" : "border-white/10 bg-white/5 text-gray-400"}`}>{q}</button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" className="checkbox-custom" checked={attTest} onChange={(e) => setAttTest(e.target.checked)} />
                    Test day (all-out attempt)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" className="checkbox-custom" checked={attRP} onChange={(e) => setAttRP(e.target.checked)} />
                    Rest-pause set
                  </label>
                  {attRP && (
                    <input value={attRPAttempts} onChange={(e) => setAttRPAttempts(e.target.value)}
                      placeholder="Reps per mini-set (e.g. 3,3,2)" className="input-base w-full text-sm" />
                  )}
                </div>
                <button onClick={submitAttempt}
                  className="btn-primary w-full mt-5 !bg-gradient-to-r !from-amber-500 !to-pink-500">
                  Save attempt
                </button>
              </motion.div>
            </motion.div>
        )}

        {failSkill && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setFailSkill(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-6 border border-red-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Log fail: {failSkill.name}</h3>
                  <button onClick={() => setFailSkill(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                </div>
                <p className="text-xs text-gray-400 mb-3">What held you back? We'll use this to suggest accessories.</p>
                <textarea value={failReason} onChange={(e) => setFailReason(e.target.value)}
                  placeholder="e.g. grip failed, couldn't lock out at bottom, scaps winging…"
                  className="input-base w-full h-24 text-sm mb-3" autoFocus />
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["grip","core","shoulders","wrists","balance","mobility"].map((r) => (
                    <button key={r} onClick={() => setFailReason((cur) => (cur ? cur + ", " + r : r))}
                      className="chip bg-white/5 text-gray-300 hover:bg-white/10 text-[10px] capitalize">{r}</button>
                  ))}
                </div>
                <button onClick={submitFail} className="btn-primary w-full !bg-gradient-to-r !from-red-500 !to-rose-500">Save fail</button>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <CelebrationModal
        open={!!celebrate}
        title={celebrate?.title ?? ""}
        subtitle={celebrate?.subtitle}
        emoji={celebrate?.emoji}
        color={celebrate?.color}
        onClose={() => setCelebrate(null)} />
    </div>
  );
}

// Tiny interval hook.
function useInterval(active: boolean, tick: () => void) {
  const ref = useRef(tick);
  ref.current = tick;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => ref.current(), 1000);
    return () => window.clearInterval(id);
  }, [active]);
}

/** Empty state card — one line of copy + single primary CTA.
 *  Deliberately minimal (no illustrations, no lottie) so it feels fast. */
function EmptyState({
  icon, title, subtitle, actionLabel, onAction,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
      <div className="mx-auto w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="mt-4 btn-primary text-sm inline-flex items-center gap-1.5">{actionLabel}</button>
      )}
    </div>
  );
}
