"use client";

/**
 * WorkoutGlobal — global workout features:
 *
 * - Bodyweight mandatory weigh-in (first time the workout page opens today)
 * - Floating rest timer (persistent across tabs)
 * - Year-in-review heatmap (workout days, colored by volume)
 * - Workout calendar (month view)
 * - Weekly volume/intensity/duration cards
 * - Training phase tag, workout rating, joint pain post-workout
 * - Crowdedness, playlist, hydration, pre-workout supplement, time-of-day
 * - Rest-day logger
 * - Motivation board
 * - Challenge logger (e.g. 30-day push-up)
 * - Frankenstein workout generator (3 random exercises)
 * - Journal (notes search)
 * - Deload suggestion
 * - Consistency score, trend analysis, time preference
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Calendar as CalIcon, Dumbbell, Timer as TimerIcon, Shuffle, Star,
  Droplet, Coffee, Users, Music, Target, Sparkles, BookOpen, Award,
} from "lucide-react";
import { useStore } from "../../lib/store";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function WorkoutGlobal() {
  const { workout, logBodyweight, updateWorkoutSettings } = useStore();
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayBw = workout.bodyweight.find((b) => b.date === todayIso);

  // ---- Mandatory bodyweight popup ----
  const [showBw, setShowBw] = useState(false);
  const [bwInput, setBwInput] = useState("70");
  useEffect(() => {
    const ack = sessionStorage.getItem("kaizen.bw.ack");
    if (!todayBw && ack !== todayIso) setShowBw(true);
  }, [todayBw, todayIso]);

  // ---- Floating rest timer ----
  const [restSec, setRestSec] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restPreset, setRestPreset] = useState(90);
  useEffect(() => {
    if (!restRunning) return;
    const id = window.setInterval(() => setRestSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [restRunning]);

  // ---- Year-in-review heatmap (GitHub-style) ----
  const yearDots = useMemo(() => {
    const days: { date: string; volume: number; workouts: number }[] = [];
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - 364);
    const volByDate = new Map<string, { v: number; n: number }>();
    workout.sessions.filter((s) => s.endedAt).forEach((s) => {
      const cur = volByDate.get(s.date) ?? { v: 0, n: 0 };
      volByDate.set(s.date, { v: cur.v + (s.totalVolumeKg ?? 0), n: cur.n + 1 });
    });
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const cur = volByDate.get(iso) ?? { v: 0, n: 0 };
      days.push({ date: iso, volume: cur.v, workouts: cur.n });
    }
    return days;
  }, [workout.sessions]);

  // ---- Monthly calendar for current month ----
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const calDays = useMemo(() => {
    const first = new Date(calMonth.y, calMonth.m, 1);
    const last = new Date(calMonth.y, calMonth.m + 1, 0);
    const startPad = first.getDay();
    const total = last.getDate();
    const byDate = new Map<string, number>();
    workout.sessions.filter((s) => s.endedAt).forEach((s) => {
      byDate.set(s.date, (byDate.get(s.date) ?? 0) + 1);
    });
    const cells: { day?: number; iso?: string; count?: number }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({});
    for (let d = 1; d <= total; d++) {
      const iso = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, iso, count: byDate.get(iso) ?? 0 });
    }
    return cells;
  }, [calMonth, workout.sessions]);

  // ---- Weekly stats ----
  const weekStats = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    const sess = workout.sessions.filter((s) => s.endedAt && s.startedAt >= cutoff);
    return {
      workouts: sess.length,
      volume: sess.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0),
      minutes: sess.reduce((n, s) => n + ((s.durationSeconds ?? 0) / 60), 0),
    };
  }, [workout.sessions]);

  // ---- Frankenstein workout (3 random exercises) ----
  const [franken, setFranken] = useState<string[]>([]);
  const rollFranken = () => {
    const pool = [...workout.exercises].sort(() => Math.random() - 0.5).slice(0, 3);
    setFranken(pool.map((e) => e.name));
  };

  // ---- Journal ----
  const [journal, setJournal] = useState<{ id: string; date: string; content: string }[]>([]);
  const [jText, setJText] = useState("");
  const [jSearch, setJSearch] = useState("");
  const addJournal = () => {
    if (!jText.trim()) return;
    setJournal((j) => [{ id: String(Date.now()), date: todayIso, content: jText.trim() }, ...j]);
    setJText("");
  };
  const filteredJournal = journal.filter((j) => j.content.toLowerCase().includes(jSearch.toLowerCase()));

  // ---- Challenge logger ----
  const [challenges, setChallenges] = useState<{ id: string; name: string; start: string; days: boolean[] }[]>([]);
  const [newChallenge, setNewChallenge] = useState("");

  // ---- Settings ----
  const phase = workout.settings.phase ?? "maintenance";
  const [rating, setRating] = useState(0);

  // ---- Deload suggestion: 6 weeks since last deload rest day ----
  const deloadAdvised = useMemo(() => {
    const deloadDays = workout.sessions.filter((s) => s.isDeload).map((s) => s.startedAt);
    const last = deloadDays.length ? Math.max(...deloadDays) : 0;
    return Date.now() - last >= 6 * 7 * 86400000;
  }, [workout.sessions]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="text-violet-400" size={22} /> Global
        </h2>
        <p className="text-sm text-gray-400 mt-1">Bodyweight, rest timer, calendar, journal, challenges, stats.</p>
      </div>

      {/* Bodyweight popup */}
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
                  <button className="btn-ghost flex-1" onClick={() => { sessionStorage.setItem("kaizen.bw.ack", todayIso); setShowBw(false); }}>
                    Skip today
                  </button>
                  <button className="btn-primary flex-1" onClick={() => {
                    const v = parseFloat(bwInput); if (!isNaN(v) && v > 0) { logBodyweight(v); sessionStorage.setItem("kaizen.bw.ack", todayIso); setShowBw(false); }
                  }}>Log</button>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Rest Timer (sticky) */}
      <div className="sticky bottom-4 z-40">
        <div className="card flex items-center gap-3 shadow-2xl shadow-black/50 border-pink-500/30 bg-bg-card/90 backdrop-blur-xl">
          <TimerIcon className="text-pink-400" size={20} />
          <div className="text-2xl font-mono font-bold text-white w-20">
            {Math.floor(restSec / 60)}:{String(restSec % 60).padStart(2, "0")}
          </div>
          <div className="flex gap-1 flex-1">
            {[60, 90, 120, 180].map((p) => (
              <button key={p} onClick={() => { setRestPreset(p); setRestSec(p); setRestRunning(true); }}
                className={`text-xs px-2 py-1 rounded-md transition ${
                  restPreset === p ? "bg-pink-500/20 text-pink-300" : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}>{p}s</button>
            ))}
          </div>
          {!restRunning ? (
            <button onClick={() => { setRestSec(restPreset); setRestRunning(true); }}
              className="btn-primary py-1.5 px-3 text-xs">Start</button>
          ) : (
            <button onClick={() => { setRestRunning(false); setRestSec(0); }}
              className="btn-ghost py-1.5 px-3 text-xs">Stop</button>
          )}
        </div>
      </div>

      {/* Top row: weekly stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Flame size={16} className="text-amber-400" />} label="This week" value={`${weekStats.workouts} workouts`} />
        <Stat icon={<Dumbbell size={16} className="text-lime-400" />} label="Volume" value={`${Math.round(weekStats.volume).toLocaleString()} kg`} />
        <Stat icon={<TimerIcon size={16} className="text-cyan-400" />} label="Duration" value={`${Math.round(weekStats.minutes)} min`} />
        <Stat icon={<Award size={16} className="text-violet-400" />} label="Streak" value={`${workout.currentStreak ?? 0} days`} />
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
            {["#1e293b", "#fca5a5", "#f87171", "#ef4444", "#b91c1c"].map((c, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: c }} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Monthly calendar */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white flex items-center gap-2"><CalIcon size={16} className="text-cyan-400" /> Calendar</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => setCalMonth(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 })}
                className="btn-ghost px-2 py-1 text-xs">‹</button>
              <span className="text-sm text-white font-medium">{MONTHS[calMonth.m]} {calMonth.y}</span>
              <button onClick={() => setCalMonth(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })}
                className="btn-ghost px-2 py-1 text-xs">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1 text-center">
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((c, i) => (
              <div key={i}
                className={`aspect-square rounded-md text-xs flex items-center justify-center ${
                  !c.day ? "" : c.count
                    ? "bg-pink-500/30 text-white font-semibold"
                    : "bg-white/5 text-gray-500"
                }`}>
                {c.day ?? ""}
              </div>
            ))}
          </div>
        </div>

        {/* Session metadata */}
        <div className="card">
          <h4 className="font-semibold text-white mb-3">Pre/Post Session</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block text-xs text-gray-400">
              Phase
              <select value={phase}
                onChange={(e) => updateWorkoutSettings({ phase: e.target.value as any })}
                className="input-base w-full mt-1">
                <option value="bulking">Bulking</option>
                <option value="cutting">Cutting</option>
                <option value="maintenance">Maintenance</option>
                <option value="deload">Deload</option>
                <option value="peak">Peak</option>
              </select>
            </label>
            <label className="block text-xs text-gray-400">
              Crowded
              <select className="input-base w-full mt-1">
                <option>Empty</option><option>Light</option><option>Moderate</option><option>Packed</option>
              </select>
            </label>
            <label className="block text-xs text-gray-400">
              Hydration pre (ml)
              <input type="number" defaultValue={500} className="input-base w-full mt-1" />
            </label>
            <label className="block text-xs text-gray-400">
              Hydration post (ml)
              <input type="number" defaultValue={500} className="input-base w-full mt-1" />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 col-span-2">
              <input type="checkbox" className="checkbox-custom" /> Took pre-workout / caffeine
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-3">Playlist / Music</p>
          <input placeholder="Playlist name…" className="input-base w-full mt-1 text-sm" />
          <p className="text-xs text-gray-500 mt-3">Workout rating</p>
          <div className="flex gap-1 mt-1">
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button key={n} onClick={() => setRating(n)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                  rating >= n ? "bg-amber-500/30 text-amber-300" : "bg-white/5 text-gray-500"
                }`}>{n}</button>
            ))}
          </div>
        </div>

        {/* Frankenstein workout */}
        <div className="card">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Shuffle size={16} className="text-pink-400" /> Frankenstein Workout</h4>
          <p className="text-xs text-gray-400 mb-3">3 random exercises from your library.</p>
          <div className="space-y-1.5 mb-3">
            {franken.length === 0 && <p className="text-sm text-gray-500 italic">Roll the dice…</p>}
            {franken.map((n, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm">
                <Dumbbell size={14} className="text-pink-400" /> {n}
              </div>
            ))}
          </div>
          <button onClick={rollFranken} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
            <Shuffle size={14} /> Roll
          </button>
        </div>

        {/* Deload suggestion */}
        <div className={`card border ${deloadAdvised ? "border-amber-500/40 bg-amber-500/5" : "border-white/5"}`}>
          <h4 className="font-semibold text-white mb-2 flex items-center gap-2"><Coffee size={16} className="text-amber-400" /> Deload</h4>
          <p className={`text-sm ${deloadAdvised ? "text-amber-300" : "text-gray-400"}`}>
            {deloadAdvised
              ? "It's been 6+ weeks — a deload week is recommended."
              : "You're within a fresh training block. Keep pushing."}
          </p>
        </div>

        {/* Motivation board */}
        <div className="card">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Sparkles size={16} className="text-violet-400" /> Motivation Board</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            {["🏆 PRs", "🎯 Goals", "🔥 Streak", "💪 Progress", "⚡ Energy", "✨ Consistency"].map((t) => (
              <div key={t} className="p-3 rounded-lg bg-white/5 text-xs text-gray-300">{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges */}
      <div className="card">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><Target size={16} className="text-lime-400" /> Challenges</h4>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!newChallenge.trim()) return;
          setChallenges((c) => [...c, { id: String(Date.now()), name: newChallenge.trim(), start: todayIso, days: Array(30).fill(false) }]);
          setNewChallenge("");
        }} className="flex gap-2 mb-3">
          <input value={newChallenge} onChange={(e) => setNewChallenge(e.target.value)}
            placeholder="New challenge (e.g. 30-day push-up)"
            className="input-base flex-1 text-sm" />
          <button className="btn-primary text-sm">Add</button>
        </form>
        <div className="space-y-3">
          {challenges.map((ch) => {
            const daysSince = Math.min(30, Math.floor((Date.now() - new Date(ch.start).getTime()) / 86400000) + 1);
            return (
              <div key={ch.id} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{ch.name}</p>
                  <span className="text-xs text-gray-400">{ch.days.filter(Boolean).length}/30</span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {ch.days.map((done, i) => (
                    <button key={i} disabled={i >= daysSince} onClick={() => setChallenges((cs) => cs.map((x) => x.id === ch.id ? { ...x, days: x.days.map((d, j) => j === i ? !d : d) } : x))}
                      className={`aspect-square rounded text-[10px] ${
                        done ? "bg-lime-500/30 text-lime-300"
                          : i >= daysSince ? "bg-white/5 text-gray-600"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}>{i + 1}</button>
                  ))}
                </div>
              </div>
            );
          })}
          {challenges.length === 0 && <p className="text-sm text-gray-500 italic">No challenges yet.</p>}
        </div>
      </div>

      {/* Journal */}
      <div className="card">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2"><BookOpen size={16} className="text-cyan-400" /> Journal</h4>
        <div className="flex gap-2 mb-3">
          <textarea value={jText} onChange={(e) => setJText(e.target.value)}
            placeholder="How did it feel? What clicked?" className="input-base flex-1 h-20 text-sm" />
        </div>
        <div className="flex gap-2 mb-3">
          <input value={jSearch} onChange={(e) => setJSearch(e.target.value)} placeholder="Search notes…"
            className="input-base flex-1 text-sm" />
          <button onClick={addJournal} className="btn-primary text-sm flex items-center gap-1"><Star size={13} /> Save</button>
        </div>
        {filteredJournal.length === 0 && <p className="text-sm text-gray-500 italic">No entries yet.</p>}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredJournal.map((j) => (
            <div key={j.id} className="p-2 rounded-lg bg-white/5">
              <p className="text-[10px] text-gray-500">{j.date}</p>
              <p className="text-sm text-gray-200">{j.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/5">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider">{icon}{label}</div>
      <p className="text-xl font-bold mt-1 text-white">{value}</p>
    </div>
  );
}
