"use client";

/**
 * WorkoutGlobal — global tools & wellness panel.
 *
 * Features wired to the persisted store:
 *  1. Mandatory bodyweight popup (first-open today)      ✓ logBodyweight
 *  2. Floating sticky rest timer                         ✓ local state (UI-only)
 *  3. Year-in-review GitHub-style heatmap                ✓ reads workout.sessions
 *  4. Monthly calendar with prev/next                    ✓ reads workout.sessions
 *  5. Weekly stat cards (volume / duration / workouts / streak) ✓ computed
 *  6. Session metadata: phase/crowd/hydration/prewo/playlist/rating
 *  7. Frankenstein workout (3 random exercises)          ✓ reads exercises
 *  8. Deload suggestion                                  ✓ shouldDeload helper
 *  9. Motivation board (add/delete quotes/PRs/goals)     ✓ addBoardItem/deleteBoardItem
 * 10. Challenges (30-day grids, create/toggle)           ✓ addChallenge/toggleChallengeDay
 * 11. Journal with search                                ✓ addJournalEntry/deleteJournalEntry
 * 12. Rest-day log                                       ✓ logRestDay
 * 13. Goal tracker                                       ✓ addWorkoutGoal/deleteWorkoutGoal
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Calendar as CalIcon, Dumbbell, Timer as TimerIcon, Shuffle, Star,
  Droplet, Coffee, Users, Music, Target, Sparkles, BookOpen, Award, Trash2, Plus,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { weeklyStats, frequencyByDay, timePreference, consistencyScore, shouldDeload, goalProgress } from "../../lib/workoutAnalytics";
import CelebrationModal from "./CelebrationModal";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CROWD: { id: "empty"|"light"|"moderate"|"packed"; label: string }[] = [
  { id: "empty", label: "Empty" }, { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" }, { id: "packed", label: "Packed" },
];

export default function WorkoutGlobal() {
  const {
    workout, logBodyweight, updateWorkoutSettings,
    addChallenge, toggleChallengeDay, deleteChallenge,
    addJournalEntry, addBoardItem, deleteBoardItem,
    logRestDay, addWorkoutGoal, deleteWorkoutGoal, updateWorkoutGoal, updateSession,
  } = useStore();

  // Goal achievement detection — fire celebration when a goal flips to achieved
  const prevAchievedRef = useRef<Set<string>>(new Set());
  const [goalCelebration, setGoalCelebration] = useState<{ title: string } | null>(null);
  useEffect(() => {
    const newly: string[] = [];
    workout.goals.forEach((g) => {
      const { achieved } = goalProgress(g, workout.sessions, workout.bodyweight, workout.exercises, workout.prs, workout.currentStreak ?? 0);
      if (achieved && !g.achieved && !prevAchievedRef.current.has(g.id)) {
        newly.push(g.id);
        updateWorkoutGoal(g.id, { achieved: true, achievedAt: Date.now() });
      }
      if (achieved) prevAchievedRef.current.add(g.id);
      else prevAchievedRef.current.delete(g.id);
    });
    if (newly.length > 0) {
      const g = workout.goals.find((x) => x.id === newly[0]);
      setGoalCelebration({ title: g?.title ?? "Goal achieved" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout.sessions, workout.prs, workout.bodyweight, workout.currentStreak]);
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayBw = workout.bodyweight.find((b) => b.date === todayIso);

  /* ---- Bodyweight popup ---- */
  const [showBw, setShowBw] = useState(false);
  const [bwInput, setBwInput] = useState("70");
  useEffect(() => {
    const ack = sessionStorage.getItem("kaizen.bw.ack");
    if (!todayBw && ack !== todayIso) setShowBw(true);
  }, [todayBw, todayIso]);

  /* ---- Floating rest timer ---- */
  const [restSec, setRestSec] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restPreset, setRestPreset] = useState(90);
  useEffect(() => {
    if (!restRunning) return;
    const id = window.setInterval(() => setRestSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [restRunning]);
  useEffect(() => {
    if (restRunning && restSec === 0) setRestRunning(false);
  }, [restRunning, restSec]);

  /* ---- Year heatmap ---- */
  const yearDots = useMemo(() => {
    const days: { date: string; volume: number; workouts: number }[] = [];
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 364);
    const byDate = new Map<string, { v: number; n: number }>();
    workout.sessions.filter((s) => s.endedAt).forEach((s) => {
      const cur = byDate.get(s.date) ?? { v: 0, n: 0 };
      byDate.set(s.date, { v: cur.v + (s.totalVolumeKg ?? 0), n: cur.n + 1 });
    });
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const cur = byDate.get(iso) ?? { v: 0, n: 0 };
      days.push({ date: iso, volume: cur.v, workouts: cur.n });
    }
    return days;
  }, [workout.sessions]);

  /* ---- Monthly calendar ---- */
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const calDays = useMemo(() => {
    const first = new Date(calMonth.y, calMonth.m, 1);
    const last = new Date(calMonth.y, calMonth.m + 1, 0);
    const startPad = first.getDay();
    const cells: { day?: number; iso?: string; count?: number }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({});
    const byDate = new Map<string, number>();
    workout.sessions.filter((s) => s.endedAt).forEach((s) => byDate.set(s.date, (byDate.get(s.date) ?? 0) + 1));
    for (let d = 1; d <= last.getDate(); d++) {
      const iso = `${calMonth.y}-${String(calMonth.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push({ day: d, iso, count: byDate.get(iso) ?? 0 });
    }
    return cells;
  }, [calMonth, workout.sessions]);

  /* ---- Stats ---- */
  const wStats = weeklyStats(workout.sessions);
  const consistency = consistencyScore(workout.sessions, workout.routines);
  const tPref = timePreference(workout.sessions);
  const freqs = frequencyByDay(workout.sessions);
  const deloadAdvised = shouldDeload(workout.sessions);

  /* ---- Frankenstein ---- */
  const [franken, setFranken] = useState<string[]>([]);
  const rollFranken = () => setFranken([...workout.exercises].sort(() => Math.random() - 0.5).slice(0,3).map(e => e.name));

  /* ---- Forms ---- */
  const [jText, setJText] = useState("");
  const [jSearch, setJSearch] = useState("");
  const [newChallenge, setNewChallenge] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [boardText, setBoardText] = useState("");
  const [restReason, setRestReason] = useState("");
  const [rating, setRating] = useState(0);
  const [crowd, setCrowd] = useState<"empty"|"light"|"moderate"|"packed">("light");
  const [hydPre, setHydPre] = useState(500);
  const [hydPost, setHydPost] = useState(500);
  const [prewo, setPrewo] = useState(false);
  const [playlist, setPlaylist] = useState("");

  /* ---- Active-session metadata quick patch (for last open session) ---- */
  const lastSession = workout.sessions[0];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="text-violet-400" size={22} /> Global Tools
        </h2>
        <p className="text-sm text-gray-400 mt-1">Bodyweight, timers, calendar, journal, challenges, stats — all persisted.</p>
      </div>

      {/* Bodyweight modal */}
      <AnimatePresence>
        {showBw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md glass rounded-2xl p-6 border border-violet-500/40">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles size={18} /> Daily Weigh-in</h3>
              <p className="text-sm text-gray-400 mt-1">Quick log before you train.</p>
              <input type="number" step="0.1" autoFocus value={bwInput} onChange={(e) => setBwInput(e.target.value)}
                className="input-base w-full mt-4 text-center text-2xl font-mono" placeholder="kg" />
              <div className="flex gap-2 mt-4">
                <button className="btn-ghost flex-1" onClick={() => { sessionStorage.setItem("kaizen.bw.ack", todayIso); setShowBw(false); }}>Skip today</button>
                <button className="btn-primary flex-1" onClick={() => {
                  const v = parseFloat(bwInput);
                  if (!isNaN(v) && v > 0) { logBodyweight(v); sessionStorage.setItem("kaizen.bw.ack", todayIso); setShowBw(false); }
                }}>Log</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating rest timer */}
      <div className="sticky bottom-4 z-40">
        <div className="card flex items-center gap-3 shadow-2xl shadow-black/50 border-pink-500/30 bg-black/60 backdrop-blur-xl">
          <TimerIcon className="text-pink-400" size={20} />
          <div className="text-2xl font-mono font-bold text-white w-20">
            {Math.floor(restSec / 60)}:{String(restSec % 60).padStart(2, "0")}
          </div>
          <div className="flex gap-1 flex-1">
            {[60, 90, 120, 180].map((p) => (
              <button key={p} onClick={() => { setRestPreset(p); setRestSec(p); setRestRunning(true); }}
                className={`text-xs px-2 py-1 rounded-md transition ${restPreset === p ? "bg-pink-500/20 text-pink-300" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {p}s
              </button>
            ))}
          </div>
          {!restRunning ? (
            <button onClick={() => { setRestSec(restPreset); setRestRunning(true); }} className="btn-primary py-1.5 px-3 text-xs">Start</button>
          ) : (
            <button onClick={() => { setRestRunning(false); setRestSec(0); }} className="btn-ghost py-1.5 px-3 text-xs">Stop</button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={<Flame size={16} className="text-amber-400" />} label="This week" value={`${wStats.workouts} workouts`} />
        <Stat icon={<Dumbbell size={16} className="text-lime-400" />} label="Volume" value={`${Math.round(wStats.volumeKg).toLocaleString()} kg`} />
        <Stat icon={<TimerIcon size={16} className="text-cyan-400" />} label="Duration" value={`${Math.round(wStats.minutes)} min`} />
        <Stat icon={<Award size={16} className="text-violet-400" />} label="Streak" value={`${workout.currentStreak ?? 0} days`} />
        <Stat icon={<Target size={16} className="text-pink-400" />} label="Consistency" value={`${consistency}%`} />
      </div>

      <div className="text-xs text-gray-500 flex flex-wrap gap-3">
        <span>Preferred time: <b className="text-gray-300 capitalize">{tPref}</b></span>
        <span>Frequency: {["S","M","T","W","T","F","S"].map((d,i) => `${d}:${freqs[i]}`).join(" · ")}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Year heatmap */}
        <div className="card">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Flame size={16} className="text-amber-400" /> Year in Review</h4>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] w-full overflow-x-auto pb-1">
            {yearDots.map((d, i) => {
              const intensity = d.workouts === 0 ? 0 : d.volume > 10000 ? 4 : d.volume > 5000 ? 3 : d.volume > 1000 ? 2 : 1;
              const colors = ["#1e293b", "#fca5a5", "#f87171", "#ef4444", "#b91c1c"];
              return <div key={i} title={`${d.date}: ${Math.round(d.volume)} kg`}
                className="w-[10px] h-[10px] rounded-[2px]" style={{ background: colors[intensity] }} />;
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
            <span>Less</span>
            {["#1e293b","#fca5a5","#f87171","#ef4444","#b91c1c"].map((c,i) => <span key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: c }} />)}
            <span>More</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white flex items-center gap-2"><CalIcon size={16} className="text-cyan-400" /> Calendar</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => setCalMonth(({y,m}) => m === 0 ? { y: y-1, m: 11 } : { y, m: m-1 })} className="btn-ghost px-2 py-1 text-xs">‹</button>
              <span className="text-sm text-white font-medium">{MONTHS[calMonth.m]} {calMonth.y}</span>
              <button onClick={() => setCalMonth(({y,m}) => m === 11 ? { y: y+1, m: 0 } : { y, m: m+1 })} className="btn-ghost px-2 py-1 text-xs">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1 text-center">
            {["S","M","T","W","T","F","S"].map((d,i)=><div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((c,i) => (
              <div key={i} className={`aspect-square rounded-md text-xs flex items-center justify-center ${!c.day ? "" : c.count ? "bg-pink-500/30 text-white font-semibold" : "bg-white/5 text-gray-500"}`}>
                {c.day ?? ""}
              </div>
            ))}
          </div>
        </div>

        {/* Session metadata */}
        <div className="card">
          <h4 className="font-semibold text-white mb-3">Pre / Post Session</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block text-xs text-gray-400">Phase
              <select value={workout.settings.phase ?? "maintenance"}
                onChange={(e) => updateWorkoutSettings({ phase: e.target.value as any })}
                className="input-base w-full mt-1">
                <option value="bulking">Bulking</option><option value="cutting">Cutting</option>
                <option value="maintenance">Maintenance</option><option value="deload">Deload</option><option value="peak">Peak</option>
              </select>
            </label>
            <label className="block text-xs text-gray-400">Crowded
              <select value={crowd} onChange={(e) => { setCrowd(e.target.value as any); if (lastSession) updateSession(lastSession.id, { crowdLevel: e.target.value as any }); }}
                className="input-base w-full mt-1">
                {CROWD.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="block text-xs text-gray-400">Hydration pre (ml)
              <input type="number" value={hydPre} onChange={(e) => setHydPre(parseInt(e.target.value||"0"))} className="input-base w-full mt-1" />
            </label>
            <label className="block text-xs text-gray-400">Hydration post (ml)
              <input type="number" value={hydPost} onChange={(e) => setHydPost(parseInt(e.target.value||"0"))} className="input-base w-full mt-1" />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 col-span-2">
              <input type="checkbox" className="checkbox-custom" checked={prewo} onChange={(e) => setPrewo(e.target.checked)} /> Took pre-workout / caffeine
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-3">Playlist / Music</p>
          <input value={playlist} onChange={(e) => setPlaylist(e.target.value)} placeholder="Playlist name…" className="input-base w-full mt-1 text-sm" />
          <p className="text-xs text-gray-500 mt-3">Workout rating</p>
          <div className="flex gap-1 mt-1">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => setRating(n)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition ${rating >= n ? "bg-amber-500/30 text-amber-300" : "bg-white/5 text-gray-500"}`}>{n}</button>
            ))}
          </div>
        </div>

        {/* Frankenstein */}
        <div className="card">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Shuffle size={16} className="text-pink-400" /> Frankenstein Workout</h4>
          <p className="text-xs text-gray-400 mb-3">3 random exercises from your library.</p>
          <div className="space-y-1.5 mb-3">
            {franken.length === 0 && <p className="text-sm text-gray-500 italic">Roll the dice…</p>}
            {franken.map((n,i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm">
                <Dumbbell size={14} className="text-pink-400" /> {n}
              </div>
            ))}
          </div>
          <button onClick={rollFranken} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Shuffle size={14} /> Roll</button>
        </div>

        {/* Deload */}
        <div className={`card border ${deloadAdvised ? "border-amber-500/40 bg-amber-500/5" : "border-white/5"}`}>
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2"><Coffee size={16} className="text-amber-400" /> Deload</h4>
          <p className={`text-sm ${deloadAdvised ? "text-amber-300" : "text-gray-400"}`}>
            {deloadAdvised ? "It's been 6+ weeks — deload week recommended." : "You're within a fresh training block. Keep pushing."}
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => logRestDay("deload")} className="btn-ghost text-xs">Log deload week</button>
            <button onClick={() => logRestDay("rest")} className="btn-ghost text-xs">Log rest day</button>
          </div>
        </div>

        {/* Rest day quick-log */}
        <div className="card">
          <h4 className="font-semibold text-white mb-2">Quick Rest Day</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {["soreness","fatigue","injury","life"].map(r => (
              <button key={r} onClick={() => logRestDay(r)} className="chip bg-white/5 text-gray-300 hover:bg-white/10 capitalize px-3 py-1.5 cursor-pointer">{r}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={restReason} onChange={e=>setRestReason(e.target.value)} placeholder="Custom note…" className="input-base flex-1 text-sm" />
            <button disabled={!restReason.trim()} onClick={() => { logRestDay(restReason); setRestReason(""); }} className="btn-primary text-sm">Log</button>
          </div>
        </div>

        {/* Motivation board */}
        <div className="card md:col-span-2">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Sparkles size={16} className="text-violet-400" /> Motivation Board</h4>
          <form onSubmit={(e) => { e.preventDefault(); if (!boardText.trim()) return; addBoardItem({ type: "custom", content: boardText, emoji: "✨" }); setBoardText(""); }}
            className="flex gap-2 mb-3">
            <input value={boardText} onChange={e=>setBoardText(e.target.value)} placeholder="Add a quote, goal, or win…" className="input-base flex-1 text-sm" />
            <button className="btn-primary text-sm"><Plus size={13} /> Add</button>
          </form>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {workout.board.map((b) => (
              <div key={b.id} className="p-3 rounded-lg bg-gradient-to-br from-violet-500/15 to-pink-500/10 border border-white/5 text-sm group relative">
                <button onClick={() => deleteBoardItem(b.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"><Trash2 size={12} /></button>
                <span className="text-lg">{b.emoji ?? "✨"}</span>
                <p className="text-gray-200 mt-1 text-xs leading-snug">{b.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="card">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Target size={16} className="text-lime-400" /> Goals</h4>
        <form onSubmit={(e) => { e.preventDefault(); if (!newGoal.trim()) return; addWorkoutGoal({ title: newGoal, target: 1, unit: "rep", metric: "workouts" }); setNewGoal(""); }}
          className="flex gap-2 mb-3">
          <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="New goal…" className="input-base flex-1 text-sm" />
          <button className="btn-primary text-sm">Add</button>
        </form>
        <div className="space-y-2">
          {workout.goals.length === 0 && <p className="text-sm text-gray-500 italic">No goals yet.</p>}
          {workout.goals.map(g => {
            const prog = goalProgress(g, workout.sessions, workout.bodyweight, workout.exercises, workout.prs, workout.currentStreak ?? 0);
            return (
              <div key={g.id} className="p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm flex-1 ${g.achieved ? "line-through text-lime-400" : "text-gray-200"}`}>{g.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{prog.current}/{g.target} {g.unit}</span>
                  <button onClick={() => deleteWorkoutGoal(g.id)} className="text-gray-500 hover:text-red-400 text-xs">✕</button>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${prog.pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: g.achieved
                      ? "linear-gradient(90deg,#22c55e,#a3e635)"
                      : "linear-gradient(90deg,#8b5cf6,#ec4899)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenges */}
      <div className="card">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Award size={16} className="text-amber-400" /> Challenges</h4>
        <form onSubmit={(e) => { e.preventDefault(); if (!newChallenge.trim()) return; addChallenge(newChallenge.trim(), 30); setNewChallenge(""); }}
          className="flex gap-2 mb-3">
          <input value={newChallenge} onChange={e=>setNewChallenge(e.target.value)} placeholder="New challenge (e.g. 30-day push-up)" className="input-base flex-1 text-sm" />
          <button className="btn-primary text-sm">Add</button>
        </form>
        <div className="space-y-3">
          {workout.challenges.length === 0 && <p className="text-sm text-gray-500 italic">No challenges yet.</p>}
          {workout.challenges.map(ch => {
            const daysSince = Math.min(ch.lengthDays, Math.floor((Date.now() - new Date(ch.startDate).getTime()) / 86400000) + 1);
            return (
              <div key={ch.id} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{ch.name}</p>
                  <span className="text-xs text-gray-400">{ch.perDay.filter(d=>d.done).length}/{ch.lengthDays}</span>
                  <button onClick={() => deleteChallenge(ch.id)} className="text-gray-500 hover:text-red-400 text-xs">✕</button>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {ch.perDay.map((d,i) => (
                    <button key={i} disabled={i >= daysSince} onClick={() => toggleChallengeDay(ch.id, i)}
                      className={`aspect-square rounded text-[10px] ${d.done ? "bg-lime-500/30 text-lime-300" : i >= daysSince ? "bg-white/5 text-gray-600" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>{i+1}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Journal */}
      <div className="card">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><BookOpen size={16} className="text-cyan-400" /> Journal</h4>
        <textarea value={jText} onChange={e=>setJText(e.target.value)} placeholder="How did it feel? What clicked?" className="input-base w-full h-20 text-sm mb-2" />
        <div className="flex gap-2 mb-3">
          <input value={jSearch} onChange={e=>setJSearch(e.target.value)} placeholder="Search notes…" className="input-base flex-1 text-sm" />
          <button onClick={() => { if (!jText.trim()) return; addJournalEntry(jText.trim()); setJText(""); }}
            className="btn-primary text-sm flex items-center gap-1"><Star size={13} /> Save</button>
        </div>
        {workout.journal.filter(j => j.content.toLowerCase().includes(jSearch.toLowerCase())).length === 0 &&
          <p className="text-sm text-gray-500 italic">No entries yet.</p>}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {workout.journal
            .filter(j => j.content.toLowerCase().includes(jSearch.toLowerCase()))
            .map(j => (
            <div key={j.id} className="p-2 rounded-lg bg-white/5">
              <p className="text-[10px] text-gray-500 flex justify-between">
                <span>{j.date}</span>
              </p>
              <p className="text-sm text-gray-200">{j.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goal celebration */}
      <CelebrationModal
        open={!!goalCelebration}
        title="Goal achieved! 🎯"
        subtitle={goalCelebration ? `You hit your target: ${goalCelebration.title}` : ""}
        emoji="🎯"
        color="#a3e635"
        actionLabel="Awesome"
        onClose={() => setGoalCelebration(null)} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 md:p-4 bg-white/5 border border-white/5">
      <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{icon}{label}</div>
      <p className="text-lg md:text-xl font-bold mt-1 text-white">{value}</p>
    </div>
  );
}
