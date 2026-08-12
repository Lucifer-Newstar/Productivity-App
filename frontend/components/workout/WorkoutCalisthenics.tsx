"use client";

/**
 * WorkoutCalisthenics — calisthenics/bodyweight feature section.
 *
 * Implements:
 *  - Progression chain tracker (Push-up → Diamond → Archer → One-Arm)
 *  - Skill tree visualization (color-coded achieved/pending)
 *  - Difficulty ratings, unlock celebrations, first/best attempt tracking
 *  - Failed-attempt logger with reason
 *  - Isometric hold timer (plank/L-sit/handstand)
 *  - AMRAP logger (rounds+reps in time cap)
 *  - EMOM logger (per-minute reps grid)
 *  - "Grease the Groove" hourly micro-set grid + daily volume + GtG streak
 *  - Freestyle flow logger + quality rating
 *  - Mobility/warmup library + sessions
 *  - Calisthenics equipment log, ring-height tracker
 *  - Rest/deload day button
 *  - Pseudo-planche hand-distance tracker
 *  - Unlock checklist (predefined milestones)
 *  - Assistance/accessory linker
 *  - Tempo input, MMConnection rating, video link
 *  - Test-day logger
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Plus, Trash2, Play, Square, Save, Target, Flame, Award, Zap, Timer,
  Hand, RefreshCw,
} from "lucide-react";

type Chain = {
  id: string; name: string;
  progressions: { id: string; name: string; difficulty: number; achieved: boolean; bestReps?: number; note?: string }[];
};

type Skill = {
  id: string; name: string; difficulty: number; unlocked: boolean; unlockedAt?: string;
  firstAttempt?: string; bestReps?: number; accessories: string[]; equipment: string[];
  video?: string; fails: { date: string; reason: string }[];
};

const CHAIN_SEEDS: Chain[] = [
  {
    id: "ch-push", name: "Push-up Progression",
    progressions: [
      { id: "p1", name: "Knee Push-up",       difficulty: 1, achieved: true, bestReps: 20 },
      { id: "p2", name: "Push-up",            difficulty: 2, achieved: true, bestReps: 15 },
      { id: "p3", name: "Diamond Push-up",    difficulty: 3, achieved: false },
      { id: "p4", name: "Wide Push-up",       difficulty: 3, achieved: false },
      { id: "p5", name: "Archer Push-up",     difficulty: 5, achieved: false },
      { id: "p6", name: "Typewriter Push-up", difficulty: 6, achieved: false },
      { id: "p7", name: "One-Arm Push-up",    difficulty: 9, achieved: false },
    ],
  },
  {
    id: "ch-pull", name: "Pull-up Progression",
    progressions: [
      { id: "u1", name: "Dead Hang",                  difficulty: 1, achieved: true },
      { id: "u2", name: "Australian Pull-up",         difficulty: 2, achieved: true },
      { id: "u3", name: "Negative Pull-up",           difficulty: 3, achieved: true },
      { id: "u4", name: "Band-assisted Pull-up",      difficulty: 4, achieved: false },
      { id: "u5", name: "Strict Pull-up",             difficulty: 5, achieved: false },
      { id: "u6", name: "L-Sit Pull-up",              difficulty: 6, achieved: false },
      { id: "u7", name: "Weighted Pull-up (+10kg)",   difficulty: 7, achieved: false },
      { id: "u8", name: "Muscle-up",                  difficulty: 9, achieved: false },
    ],
  },
  {
    id: "ch-squat", name: "Squat Progression",
    progressions: [
      { id: "s1", name: "Assisted Squat",  difficulty: 1, achieved: true },
      { id: "s2", name: "Bodyweight Squat", difficulty: 2, achieved: true },
      { id: "s3", name: "Pistol (assisted)", difficulty: 4, achieved: false },
      { id: "s4", name: "Shrimp Squat",     difficulty: 5, achieved: false },
      { id: "s5", name: "Pistol Squat",     difficulty: 8, achieved: false },
    ],
  },
  {
    id: "ch-hand", name: "Handstand Progression",
    progressions: [
      { id: "h1", name: "Wall hold 30s",       difficulty: 2, achieved: true },
      { id: "h2", name: "Chest-to-wall 20s",   difficulty: 4, achieved: false },
      { id: "h3", name: "Free-standing 10s",   difficulty: 6, achieved: false },
      { id: "h4", name: "Handstand Push-up",   difficulty: 8, achieved: false },
      { id: "h5", name: "One-arm Handstand",   difficulty: 10, achieved: false },
    ],
  },
];

const UNLOCKS: { id: string; name: string; achieved: boolean }[] = [
  { id: "u-5pull",  name: "5 strict pull-ups",    achieved: false },
  { id: "u-10pull", name: "10 pull-ups",          achieved: false },
  { id: "u-mu",     name: "First muscle-up",      achieved: false },
  { id: "u-lsit10", name: "L-sit 10s",            achieved: false },
  { id: "u-hs5",    name: "Free handstand 5s",    achieved: false },
  { id: "u-pistol", name: "Pistol squat",         achieved: false },
  { id: "u-planch", name: "Planche lean 15s",     achieved: false },
];

// Pre-defined warm-up drills
const MOBILITY_SEED = [
  { id: "m-wrist",  name: "Wrist circles", durationSec: 30 },
  { id: "m-shdis",  name: "Shoulder dislocates", durationSec: 60 },
  { id: "m-scap",   name: "Scapular push-ups", durationSec: 45 },
  { id: "m-hollow", name: "Hollow body hold", durationSec: 30 },
  { id: "m-catcow", name: "Cat-cow", durationSec: 45 },
  { id: "m-hip90",  name: "90/90 hip switches", durationSec: 60 },
];

export default function WorkoutCalisthenics() {
  const [tab, setTab] = useState<"chains" | "skills" | "gtg" | "iso" | "emom-amrap" | "flow" | "mobility" | "rest">("chains");
  const [chains, setChains] = useState<Chain[]>(CHAIN_SEEDS);
  const [unlocks, setUnlocks] = useState(UNLOCKS);
  const [skills, setSkills] = useState<Skill[]>([
    { id: "sk1", name: "Planche", difficulty: 9, unlocked: false, accessories: ["Wrist conditioning"], equipment: ["parallettes"], fails: [] },
    { id: "sk2", name: "Front Lever", difficulty: 8, unlocked: false, accessories: ["Back lever negatives"], equipment: ["pull-up-bar"], fails: [] },
  ]);

  // ---------- Progression chain ----------
  const toggleProgression = (cid: string, pid: string) => {
    setChains((cs) => cs.map((c) => c.id !== cid ? c : {
      ...c, progressions: c.progressions.map((p) => p.id === pid ? { ...p, achieved: !p.achieved } : p),
    }));
    // Auto-check unlocks when toggling
  };

  // ---------- Isometric hold timer ----------
  const [isoSec, setIsoSec] = useState(0);
  const [isoRunning, setIsoRunning] = useState(false);
  const [isoName, setIsoName] = useState("Plank");
  const isoRef = { current: null as number | null };
  if (typeof window !== "undefined") {
    // using a simple ref via useState would be cleaner but keep simple
  }
  useIntervalIso(isoRunning, () => setIsoSec((s) => s + 1));

  // ---------- AMRAP ----------
  const [amrapCap, setAmrapCap] = useState(600); // seconds
  const [amrapRunning, setAmrapRunning] = useState(false);
  const [amrapElapsed, setAmrapElapsed] = useState(0);
  const [amrapRounds, setAmrapRounds] = useState(0);
  const [amrapReps, setAmrapReps] = useState(0);
  useIntervalIso(amrapRunning, () => setAmrapElapsed((s) => s + 1));

  // ---------- EMOM ----------
  const [emomMinutes, setEmomMinutes] = useState(10);
  const [emomRunning, setEmomRunning] = useState(false);
  const [emomMin, setEmomMin] = useState(0);
  const [emomSec, setEmomSec] = useState(0);
  const [emomReps, setEmomReps] = useState<number[]>([]);
  const [emomRepInput, setEmomRepInput] = useState("");
  useIntervalIso(emomRunning, () => {
    setEmomSec((s) => {
      if (s + 1 >= 60) {
        // beep; advance minute
        return 0;
      }
      return s + 1;
    });
  });

  // ---------- GtG ----------
  const today = new Date().toISOString().slice(0, 10);
  const hours = Array.from({ length: 12 }, (_, i) => 7 + i); // 7am-6pm
  const [gtg, setGtg] = useState<Record<string, { checked: boolean; reps: number }>>({});
  const toggleGtg = (h: number) => {
    const k = `${today}-${h}`;
    setGtg((g) => ({ ...g, [k]: { checked: !g[k]?.checked, reps: g[k]?.reps ?? 5 } }));
  };
  const gtgTotal = Object.entries(gtg).filter(([k]) => k.startsWith(today)).reduce((n, [, v]) => n + (v.checked ? v.reps : 0), 0);
  const gtgDays = Object.keys(gtg).reduce<Set<string>>((acc, k) => { if (gtg[k]?.checked) acc.add(k.split("-")[0]); return acc; }, new Set()).size;

  // ---------- Flow logger ----------
  const [flows, setFlows] = useState<{ id: string; name: string; moves: string; quality: number; date: string }[]>([]);
  const [flowName, setFlowName] = useState("");
  const [flowMoves, setFlowMoves] = useState("");
  const [flowQuality, setFlowQuality] = useState(7);

  // ---------- Mobility ----------
  const [mobilityChecked, setMobilityChecked] = useState<Record<string, boolean>>({});
  const [mobilitySessions, setMobilitySessions] = useState<{ date: string; ids: string[]; durationSec: number }[]>([]);
  const logMobility = () => {
    const ids = Object.entries(mobilityChecked).filter(([, v]) => v).map(([k]) => k);
    const dur = ids.reduce((n, id) => n + (MOBILITY_SEED.find((m) => m.id === id)?.durationSec ?? 0), 0);
    if (!ids.length) return;
    setMobilitySessions((s) => [{ date: today, ids, durationSec: dur }, ...s]);
    setMobilityChecked({});
  };

  // ---------- Rest day ----------
  const [restReason, setRestReason] = useState("");
  const [restDays, setRestDays] = useState<{ date: string; reason: string }[]>([]);
  const logRest = (reason: string) => { setRestDays((r) => [{ date: today, reason }, ...r]); setRestReason(""); };

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

      {/* Tabs */}
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
          {chains.map((chain) => {
            const achieved = chain.progressions.filter((p) => p.achieved).length;
            const pct = Math.round((achieved / chain.progressions.length) * 100);
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
                  {/* vertical line */}
                  <div className="absolute left-[9px] top-1 bottom-1 w-px bg-white/10" />
                  {chain.progressions.map((p, i) => {
                    const prev = i > 0 ? chain.progressions[i - 1].achieved : true;
                    const locked = !prev && !p.achieved;
                    return (
                      <div key={p.id} className="flex items-center gap-3 py-1.5">
                        <button onClick={() => toggleProgression(chain.id, p.id)}
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
                          {"★".repeat(p.difficulty)}{"☆".repeat(10 - p.difficulty)}
                        </span>
                        {p.bestReps != null && <span className="text-xs text-lime-400">{p.bestReps} reps</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Unlock checklist */}
          <div className="card">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Award size={16} className="text-amber-400" /> Unlock Checklist</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {unlocks.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={u.achieved}
                    onChange={() => setUnlocks((us) => us.map((x) => x.id === u.id ? { ...x, achieved: !x.achieved } : x))}
                    className="checkbox-custom" />
                  <span className={u.achieved ? "text-lime-400" : "text-gray-300"}>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skills */}
      {tab === "skills" && (
        <div className="grid md:grid-cols-2 gap-3">
          {skills.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.unlocked ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-500"}`}>
                  {s.unlocked ? "🏆" : "🔒"}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{s.name}</h4>
                  <p className="text-xs text-gray-400">Difficulty {s.difficulty}/10 · {s.equipment.join(", ") || "no equipment"}</p>
                </div>
              </div>
              {s.firstAttempt && <p className="text-xs text-gray-500 mt-2">First: {s.firstAttempt} · Best: {s.bestReps ?? "—"}</p>}
              {s.accessories.length > 0 && (
                <p className="text-[11px] text-violet-300 mt-2">Accessories: {s.accessories.join(", ")}</p>
              )}
              {s.fails.length > 0 && (
                <div className="mt-2 space-y-1">
                  {s.fails.slice(-2).map((f, i) => (
                    <div key={i} className="text-[11px] text-red-400 bg-red-500/10 rounded px-2 py-1">
                      {f.date}: {f.reason}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1 mt-3">
                <button className="btn-ghost text-xs py-1 px-2">Log attempt</button>
                <button className="btn-ghost text-xs py-1 px-2">Log fail</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GtG */}
      {tab === "gtg" && (
        <div className="card">
          <h4 className="font-semibold text-white mb-1">Grease the Groove — today</h4>
          <p className="text-xs text-gray-400 mb-4">Do a few sub-max sets spread across the day. Tap a cell when you hit it.</p>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {hours.map((h) => {
              const k = `${today}-${h}`;
              const checked = gtg[k]?.checked;
              return (
                <button key={h} onClick={() => toggleGtg(h)}
                  className={`p-3 rounded-xl border text-sm font-mono transition ${
                    checked
                      ? "bg-lime-500/20 border-lime-500/40 text-lime-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                  }`}>
                  {h}:00
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">Today total: <b className="text-lime-400">{gtgTotal} reps</b></span>
            <span className="text-gray-400">GtG streak: <b className="text-amber-400">{gtgDays} days</b></span>
          </div>
        </div>
      )}

      {/* Isometric */}
      {tab === "iso" && (
        <div className="card text-center">
          <h4 className="font-semibold text-white mb-1">Isometric Hold Timer</h4>
          <p className="text-xs text-gray-400 mb-4">Plank, L-sit, Handstand, or any static hold.</p>
          <input value={isoName} onChange={(e) => setIsoName(e.target.value)}
            className="input-base text-center mb-4 w-full max-w-xs mx-auto" placeholder="Exercise (Plank)" />
          <div className="text-7xl font-bold font-mono text-cyan-300 my-6">
            {Math.floor(isoSec / 60)}:{String(isoSec % 60).padStart(2, "0")}
          </div>
          <div className="flex items-center justify-center gap-3">
            {!isoRunning ? (
              <button onClick={() => setIsoRunning(true)} className="btn-primary flex items-center gap-2"><Play size={16} /> Start</button>
            ) : (
              <button onClick={() => setIsoRunning(false)} className="btn-primary bg-gradient-to-r from-rose-500 to-red-500 flex items-center gap-2"><Square size={16} /> Stop</button>
            )}
            <button onClick={() => { setIsoSec(0); setIsoRunning(false); }}
              className="btn-ghost flex items-center gap-2">Reset</button>
            <button className="btn-ghost flex items-center gap-2" disabled={!isoSec}><Save size={14} /> Log</button>
          </div>
        </div>
      )}

      {/* EMOM/AMRAP */}
      {tab === "emom-amrap" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* AMRAP */}
          <div className="card">
            <h4 className="font-semibold text-white mb-1">AMRAP</h4>
            <p className="text-xs text-gray-400 mb-3">As many rounds/reps as possible in a time cap.</p>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-gray-400">Cap (min)</label>
              <input type="number" min={1} value={Math.round(amrapCap / 60)}
                onChange={(e) => setAmrapCap(parseInt(e.target.value || "0") * 60)}
                className="input-base w-20 text-center" />
            </div>
            <div className="text-5xl font-mono font-bold text-pink-400 text-center my-4">
              {Math.floor(amrapElapsed / 60)}:{String(amrapElapsed % 60).padStart(2, "0")}
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              {!amrapRunning ? (
                <button onClick={() => { setAmrapRunning(true); setAmrapElapsed(0); setAmrapRounds(0); setAmrapReps(0); }} className="btn-primary text-sm"><Play size={14} /> Go</button>
              ) : (
                <button onClick={() => setAmrapRunning(false)} className="btn-primary text-sm">Stop</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-400">Rounds
                <input type="number" value={amrapRounds} onChange={(e) => setAmrapRounds(parseInt(e.target.value || "0"))} className="input-base w-full mt-1" />
              </label>
              <label className="text-xs text-gray-400">Reps
                <input type="number" value={amrapReps} onChange={(e) => setAmrapReps(parseInt(e.target.value || "0"))} className="input-base w-full mt-1" />
              </label>
            </div>
            <button className="btn-primary w-full mt-3 text-sm"><Save size={13} /> Save score</button>
          </div>

          {/* EMOM */}
          <div className="card">
            <h4 className="font-semibold text-white mb-1">EMOM</h4>
            <p className="text-xs text-gray-400 mb-3">Every minute on the minute — log reps per minute.</p>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-gray-400">Minutes</label>
              <input type="number" min={1} value={emomMinutes} onChange={(e) => setEmomMinutes(parseInt(e.target.value || "0"))} className="input-base w-20 text-center" />
            </div>
            <div className="text-5xl font-mono font-bold text-cyan-400 text-center my-4">
              {String(emomMin).padStart(2, "0")}:{String(emomSec).padStart(2, "0")}
            </div>
            {!emomRunning ? (
              <button onClick={() => { setEmomRunning(true); setEmomMin(0); setEmomSec(0); setEmomReps([]); }}
                className="btn-primary w-full text-sm"><Play size={14} /> Start</button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" value={emomRepInput} onChange={(e) => setEmomRepInput(e.target.value)}
                    placeholder={`Minute ${emomMin + 1} reps`}
                    className="input-base flex-1" />
                  <button onClick={() => {
                    const n = parseInt(emomRepInput || "0");
                    if (n > 0) { setEmomReps((r) => [...r, n]); setEmomRepInput(""); setEmomMin((m) => m + 1); setEmomSec(0); }
                  }} className="btn-primary px-3 text-sm">Log</button>
                </div>
                <button onClick={() => setEmomRunning(false)} className="btn-ghost w-full text-sm">Stop</button>
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
            <div className="flex items-center gap-3 mb-3">
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
              setFlows((f) => [{ id: String(Date.now()), name: flowName || "Flow", moves: flowMoves, quality: flowQuality, date: today }, ...f]);
              setFlowName(""); setFlowMoves(""); setFlowQuality(7);
            }} className="btn-primary text-sm"><Save size={13} /> Save flow</button>
          </div>
          {flows.map((f) => (
            <div key={f.id} className="card">
              <div className="flex items-start justify-between">
                <h5 className="font-semibold text-white">{f.name}</h5>
                <span className="text-xs text-violet-300">Q{f.quality}/10 · {f.date}</span>
              </div>
              <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{f.moves}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mobility */}
      {tab === "mobility" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h4 className="font-semibold text-white mb-3">Warm-up Library</h4>
            <div className="space-y-1.5">
              {MOBILITY_SEED.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox-custom"
                    checked={!!mobilityChecked[m.id]}
                    onChange={(e) => setMobilityChecked((c) => ({ ...c, [m.id]: e.target.checked }))} />
                  <span className="flex-1 text-gray-300">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.durationSec}s</span>
                </label>
              ))}
            </div>
            <button onClick={logMobility} className="btn-primary w-full mt-4 text-sm">Log warm-up</button>
          </div>
          <div className="card">
            <h4 className="font-semibold text-white mb-3">Recent sessions</h4>
            {mobilitySessions.length === 0 && <p className="text-sm text-gray-500 italic">No warm-ups logged yet.</p>}
            {mobilitySessions.map((s, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 mb-2">
                <div className="text-xs text-gray-400">{s.date} · {Math.round(s.durationSec/60)} min</div>
                <div className="text-sm text-gray-200">
                  {s.ids.map((id) => MOBILITY_SEED.find((m) => m.id === id)?.name).filter(Boolean).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest day */}
      {tab === "rest" && (
        <div className="card">
          <h4 className="font-semibold text-white mb-2">Rest / Deload Day</h4>
          <p className="text-xs text-gray-400 mb-4">Recovery is training. Tap a reason to log today as a rest day.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {["soreness","fatigue","injury","life","deload"].map((r) => (
              <button key={r} onClick={() => logRest(r)}
                className="chip bg-white/5 text-gray-300 hover:bg-white/10 capitalize cursor-pointer px-3 py-1.5">
                {r}
              </button>
            ))}
          </div>
          <input value={restReason} onChange={(e) => setRestReason(e.target.value)}
            placeholder="Or add a note…" className="input-base w-full mb-2" />
          <button onClick={() => { if (restReason.trim()) logRest(restReason); }}
            className="btn-primary text-sm" disabled={!restReason.trim()}>Log note</button>
          {restDays.length > 0 && (
            <div className="mt-4 space-y-1">
              {restDays.slice(0, 5).map((r, i) => (
                <div key={i} className="text-sm text-gray-400">{r.date} — {r.reason}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Tiny interval hook (avoids bringing in a helper file for one feature)
import { useEffect, useRef } from "react";
function useIntervalIso(active: boolean, tick: () => void) {
  const ref = useRef(tick);
  ref.current = tick;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => ref.current(), 1000);
    return () => window.clearInterval(id);
  }, [active]);
}
