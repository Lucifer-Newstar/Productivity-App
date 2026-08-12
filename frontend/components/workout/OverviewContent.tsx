"use client";

/**
 * OverviewContent — hero stats, readiness, heatmap, badges, streaks.
 * Used by /workout/overview. Accepts the workout slice + callbacks.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Play, Download, Zap, Flame, Award } from "lucide-react";
import MuscleHeatmap from "./MuscleHeatmap";
import { useStore } from "../../lib/store";
import { intensityMultiplier, weeklyMuscleVolume } from "../../lib/workoutAnalytics";
import type { MuscleGroup } from "../../lib/types";

const BADGE_META: Record<string, { icon: string; label: string; color: string }> = {
  first_workout:   { icon: "💪", label: "First Workout",  color: "#ec4899" },
  ten_workouts:    { icon: "🏋️", label: "10 Workouts",    color: "#8b5cf6" },
  fifty_workouts:  { icon: "🔥", label: "50 Workouts",    color: "#f59e0b" },
  pr_strength:     { icon: "🏆", label: "Strength PR",    color: "#f59e0b" },
  pr_cardio:       { icon: "🏃", label: "Cardio PR",      color: "#ef4444" },
  pr_bodyweight:   { icon: "🧗", label: "Bodyweight PR",  color: "#a3e635" },
  streak_3:        { icon: "🔥", label: "3-Day Streak",   color: "#f59e0b" },
  streak_7:        { icon: "⚡", label: "7-Day Streak",    color: "#ec4899" },
  streak_30:       { icon: "👑", label: "30-Day Streak",  color: "#8b5cf6" },
  early_bird:      { icon: "🌅", label: "Early Bird",     color: "#06b6d4" },
  iron_grip:       { icon: "🤝", label: "Iron Grip",      color: "#a3e635" },
  century_volume:  { icon: "💯", label: "10k kg Volume",  color: "#a3e635" },
  perfect_week:    { icon: "✅", label: "Perfect Week",   color: "#22c55e" },
  cardio_king:     { icon: "👟", label: "Cardio King",    color: "#ef4444" },
  goal_achieved:   { icon: "🎯", label: "Goal Hit",       color: "#8b5cf6" },
};

export default function OverviewContent() {
  const { workout, tasks, logReadiness, exportWorkoutCSV, startSession } = useStore();

  const stats = useMemo(() => {
    const prCount = workout.prs.length;
    const exerciseCount = workout.exercises.length;
    const completed = workout.sessions.filter((s) => s.endedAt);
    const now = Date.now();
    const thisWeek = completed.filter((s) => now - s.startedAt <= 7 * 86400000).length;
    const totalVolume = completed.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
    return { prCount, exerciseCount, thisWeek, totalVolume, completedCount: completed.length };
  }, [workout, tasks]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysRoutine = workout.routines.find((r) => r.dayOfWeek === new Date().getDay());
  const todayReadiness = workout.readiness.find((r) => r.date === todayIso);

  const volume = useMemo(
    () => weeklyMuscleVolume(workout.sessions, (bid) => {
      for (const r of workout.routines) {
        const b = r.blocks.find((bb) => bb.id === bid);
        if (b?.exerciseId) return workout.exercises.find((e) => e.id === b.exerciseId);
      }
      return undefined;
    }),
    [workout.sessions, workout.routines, workout.exercises],
  );

  function handleExport() {
    const csv = exportWorkoutCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kaizen-workouts-${todayIso}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function handleStart() {
    if (!todaysRoutine) return;
    startSession(todaysRoutine.name, todaysRoutine.id, todayReadiness?.score);
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 glass border border-white/10"
        style={{ borderColor: "#ec489930" }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-xl">
            <Dumbbell size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Let's move.</h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              {todaysRoutine ? `Today is ${todaysRoutine.name} — you got this.` : "No routine scheduled today — pick a quick session or rest intentionally."}
            </p>
          </div>
          <div className="flex gap-2">
            {todaysRoutine && (
              <button onClick={handleStart}
                className="btn-primary text-sm inline-flex items-center gap-2 !bg-gradient-to-r !from-pink-500 !to-rose-500">
                <Play size={14} fill="white" /> Start {todaysRoutine.name}
              </button>
            )}
            <button onClick={handleExport} className="btn-ghost text-sm inline-flex items-center gap-2 !text-gray-300">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <Stat label="🔥 Streak" value={`${workout.currentStreak ?? 0} days`} color="#f59e0b" />
          <Stat label="PRs" value={stats.prCount} color="#ec4899" />
          <Stat label="Exercises" value={stats.exerciseCount} color="#a3e635" />
          <Stat label="This week" value={`${stats.thisWeek} workouts`} color="#06b6d4" />
          <Stat label="Total volume" value={`${Math.round(stats.totalVolume).toLocaleString()} kg`} color="#8b5cf6" />
        </div>
      </motion.div>

      <OverviewBody
        volume={volume as Partial<Record<MuscleGroup, number>>}
        readiness={todayReadiness}
        onLogReadiness={(r: { soreness: number; sleep: number; stress: number }) => logReadiness(r)}
        badges={workout.badges}
        streak={workout.currentStreak ?? 0}
        longestStreak={workout.longestStreak ?? 0}
        freezes={workout.settings.streakFreezes}
      />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-3 md:p-4 bg-white/5 border border-white/5">
      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl md:text-2xl font-bold mt-1 text-white" style={{ color }}>{value}</p>
    </div>
  );
}

function OverviewBody({ volume, readiness, onLogReadiness, badges, streak, longestStreak, freezes }: any) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [soreness, setSoreness] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(4);
  const previewScore = useMemo(() => {
    return Math.round((((11 - Math.max(1,Math.min(10,soreness)))/10)*0.3 + (Math.max(1,Math.min(10,sleep))/10)*0.45 + ((11 - Math.max(1,Math.min(10,stress)))/10)*0.25) * 100);
  }, [soreness, sleep, stress]);
  const intensity = intensityMultiplier(readiness?.score ?? previewScore);
  const scoreColor = readiness
    ? readiness.score >= 75 ? "#a3e635" : readiness.score >= 50 ? "#f59e0b" : "#ef4444"
    : previewScore >= 75 ? "#a3e635" : previewScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Flame className="text-pink-400" size={18} /> 7-Day Muscle Heatmap
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Darker red = more kg volume trained this week.</p>
            </div>
            {selectedMuscle && (
              <button onClick={() => setSelectedMuscle(null)}
                className="text-xs text-violet-300 hover:text-violet-200">Clear selection</button>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <MuscleHeatmap volume={volume} selected={selectedMuscle} onSelect={setSelectedMuscle} />
            <div className="flex-1 w-full space-y-2">
              {Object.entries(volume).sort((a:any,b:any) => b[1] - a[1]).slice(0,6).map(([m,v]:any) => (
                <button key={m} onClick={() => setSelectedMuscle(m)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition ${
                    selectedMuscle === m ? "bg-violet-500/20 border border-violet-500/40" : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}>
                  <span className="text-sm capitalize text-white font-medium w-24">{m}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min(100, (v/2000)*100)}%`, background: "linear-gradient(90deg,#ec4899,#b91c1c)" }} />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right font-mono">{Math.round(v)} kg</span>
                </button>
              ))}
              {Object.keys(volume).length === 0 && (
                <p className="text-sm text-gray-500 italic">No volume this week yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Award className="text-amber-400" size={18} /> Achievements <span className="text-xs text-gray-500 font-normal ml-1">{badges.length} earned</span>
          </h3>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No badges yet — finish your first workout to unlock First Workout.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((b: any) => {
                const meta = BADGE_META[b.id] ?? { icon: "🏅", label: b.id, color: "#8b5cf6" };
                return (
                  <div key={b.id} className="rounded-xl p-3 bg-white/5 border border-white/5 text-center"
                    style={{ borderColor: `${meta.color}30` }}>
                    <div className="text-3xl mb-1">{meta.icon}</div>
                    <div className="text-xs font-semibold text-white">{meta.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{new Date(b.earnedAt).toLocaleDateString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Zap className="text-cyan-400" size={18} /> Today's Readiness
          </h3>
          <div className="rounded-xl p-4 bg-black/30 border border-white/5 text-center mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Score</p>
            <p className="text-4xl font-bold font-mono mt-1" style={{ color: scoreColor }}>{readiness?.score ?? previewScore}</p>
            <p className="text-xs text-gray-400 mt-1">Intensity x{intensity.toFixed(2)}{intensity<0.85 && " — deload recommended"}{intensity>=1.05 && " — push for a PR!"}</p>
          </div>
          <Slider label="Soreness" minLabel="fresh" maxLabel="sore" value={soreness} onChange={setSoreness} inverted />
          <Slider label="Sleep"    minLabel="bad"   maxLabel="great" value={sleep}    onChange={setSleep} />
          <Slider label="Stress"   minLabel="calm"  maxLabel="max"   value={stress}   onChange={setStress} inverted />
          <button onClick={() => onLogReadiness({ soreness, sleep, stress })}
            className="w-full mt-3 btn-primary text-sm">
            {readiness ? "Update today's check-in" : "Log today's readiness"}
          </button>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Flame className="text-amber-400" size={18} /> Streak
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-gradient-to-br from-amber-500/20 to-pink-500/10 border border-amber-500/20 text-center">
              <p className="text-3xl font-bold text-amber-300">{streak}</p>
              <p className="text-xs text-gray-400 mt-0.5">current days</p>
            </div>
            <div className="rounded-xl p-3 bg-white/5 border border-white/5 text-center">
              <p className="text-3xl font-bold text-gray-200">{longestStreak}</p>
              <p className="text-xs text-gray-400 mt-0.5">longest</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Finish a workout every day. Streaks freeze with
            <span className="text-cyan-400 mx-1">{freezes ?? 0} freezes</span> available.
          </p>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, minLabel, maxLabel, value, onChange, inverted }: any) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span><span className="font-mono text-white">{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={(e)=>onChange(parseInt(e.target.value))} className="w-full accent-pink-500" />
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{inverted ? maxLabel : minLabel}</span><span>{inverted ? minLabel : maxLabel}</span>
      </div>
    </div>
  );
}
