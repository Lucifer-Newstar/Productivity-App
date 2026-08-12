"use client";

/**
 * Workout page — /workout route.
 *
 * When a session is active (workout.activeSessionId is set) we take over the
 * whole viewport with ActiveWorkout (one-thumb in-session screen). Otherwise
 * we show a dashboard + tabs:
 *
 *   0. Overview — hero stats, today's readiness quick-log, 7-day muscle heatmap,
 *      streak + badges, CSV export, glove/minimal/sound quick toggles.
 *   1. PRs       — Personal Records (peak per exercise, quick-log attempts)
 *   2. Skills    — Progressive skill trees with progressions
 *   3. Exercises — Exercise library with unit/equipment/level filters
 *   4. Schedule  — Routines editor + Start-workout buttons
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Dumbbell, Trophy, Target, Calendar, Flame, Play,
  Download, Hand, Minimize2, Volume2, VolumeX, Zap, Award,
} from "lucide-react";
import WorkoutPRs from "../../components/workout/WorkoutPRs";
import WorkoutSkills from "../../components/workout/WorkoutSkills";
import WorkoutExercises from "../../components/workout/WorkoutExercises";
import WorkoutSchedule from "../../components/workout/WorkoutSchedule";
import ActiveWorkout from "../../components/workout/ActiveWorkout";
import MuscleHeatmap from "../../components/workout/MuscleHeatmap";
import { useStore } from "../../lib/store";
import { weeklyMuscleVolume, intensityMultiplier } from "../../lib/workoutAnalytics";
import type { MuscleGroup } from "../../lib/types";

type Section = "overview" | "pr" | "skills" | "exercises" | "schedule";

const SECTIONS: { id: Section; label: string; icon: any }[] = [
  { id: "overview",  label: "Overview", icon: Flame },
  { id: "pr",        label: "PRs",      icon: Trophy },
  { id: "skills",    label: "Skills",   icon: Target },
  { id: "exercises", label: "Exercises",icon: Dumbbell },
  { id: "schedule",  label: "Schedule", icon: Calendar },
];

/* ---------- Badge metadata (icon + label + colour) ---------- */
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
};

export default function WorkoutPage() {
  const [section, setSection] = useState<Section>("overview");
  const { workout, tasks, logReadiness, exportWorkoutCSV, updateWorkoutSettings, startSession } = useStore();

  // -------- Aggregate stats --------
  const stats = useMemo(() => {
    const prCount = workout.prs.length;
    const exerciseCount = workout.exercises.length;
    const completed = workout.sessions.filter((s) => s.endedAt);
    const now = Date.now();
    const thisWeek = completed.filter((s) => now - s.startedAt <= 7 * 86400000).length;
    const totalVolume = completed.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
    const workoutTasks = tasks.filter((t) => t.space === "workout");
    const activeTasks = workoutTasks.filter((t) => !t.completed).length;
    const longestSession = completed.reduce((best, s) => Math.max(best, s.durationSeconds ?? 0), 0);
    return {
      prCount, exerciseCount, thisWeek, totalVolume,
      completedCount: completed.length,
      activeTasks, longestSession,
    };
  }, [workout, tasks]);

  // -------- Today helpers --------
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysRoutine = workout.routines.find((r) => r.dayOfWeek === new Date().getDay());
  const todayReadiness = workout.readiness.find((r) => r.date === todayIso);

  // -------- Weekly muscle volume for heatmap --------
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

  // -------- CSV download --------
  function handleExport() {
    const csv = exportWorkoutCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaizen-workouts-${todayIso}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // Active session — take over the view
  if (workout.activeSessionId) {
    return (
      <div className="dark max-w-6xl mx-auto text-gray-100 py-10 px-4">
        <ActiveWorkout
          sessionId={workout.activeSessionId}
          onFinish={() => setSection("overview")}
          onDiscard={() => setSection("schedule")}
        />
      </div>
    );
  }

  return (
    // Force dark mode for workout — pink/cyan gradients + deep panels are designed for dark.
    <div className="dark space-y-8 max-w-6xl mx-auto text-gray-100 py-8 px-4">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 glass border border-white/10"
        style={{ borderColor: "#ec489930" }}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-xl"
            style={{ boxShadow: "0 10px 40px -10px #ec489980" }}>
            <Dumbbell size={30} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Workout</h1>
            <p className="text-gray-400 mt-1">Log lifts, chase PRs, build skills, and run your routines — all in one place.</p>
          </div>
          <div className="flex gap-2">
            {todaysRoutine && (
              <button onClick={() => { startSession(todaysRoutine.name, todaysRoutine.id, todayReadiness?.score); }}
                className="btn-primary text-sm inline-flex items-center gap-2">
                <Play size={14} /> Start {todaysRoutine.name}
              </button>
            )}
            <button onClick={handleExport} className="btn-ghost text-sm inline-flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
          <Stat label="🔥 Streak" value={`${workout.currentStreak ?? 0} days`} color="#f59e0b" />
          <Stat label="PRs" value={stats.prCount} color="#ec4899" />
          <Stat label="Exercises" value={stats.exerciseCount} color="#a3e635" />
          <Stat label="This week" value={`${stats.thisWeek} workouts`} color="#06b6d4" />
          <Stat label="Total volume" value={`${Math.round(stats.totalVolume).toLocaleString()} kg`} color="#8b5cf6" />
        </div>

        {/* Quick settings strip */}
        <div className="relative flex flex-wrap gap-2 mt-6">
          <ToggleChip
            active={workout.settings.gloveMode}
            onClick={() => updateWorkoutSettings({ gloveMode: !workout.settings.gloveMode })}
            icon={<Hand size={14} />}
            label="Glove mode"
          />
          <ToggleChip
            active={workout.settings.minimalMode}
            onClick={() => updateWorkoutSettings({ minimalMode: !workout.settings.minimalMode })}
            icon={<Minimize2 size={14} />}
            label="Minimal mode"
          />
          <ToggleChip
            active={workout.settings.soundEnabled}
            onClick={() => updateWorkoutSettings({ soundEnabled: !workout.settings.soundEnabled })}
            icon={workout.settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            label={workout.settings.soundEnabled ? "Sound on" : "Muted"}
          />
        </div>
      </motion.div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                active ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}>
              {active && (
                <motion.div layoutId="workout-section-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              <Icon size={15} className="relative z-10" />
              <span className="relative z-10">{s.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {section === "overview" && (
          <Overview
            volume={volume as Partial<Record<MuscleGroup, number>>}
            readiness={todayReadiness}
            onLogReadiness={(r) => logReadiness(r)}
            badges={workout.badges}
            streak={workout.currentStreak ?? 0}
            longestStreak={workout.longestStreak ?? 0}
            freezes={workout.settings.streakFreezes}
          />
        )}
        {section === "pr" && <WorkoutPRs />}
        {section === "skills" && <WorkoutSkills />}
        {section === "exercises" && <WorkoutExercises />}
        {section === "schedule" && <WorkoutSchedule />}
      </motion.div>
    </div>
  );
}

/* ---------- Small presentational helpers ---------- */

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1 text-white" style={{ color }}>{value}</p>
    </div>
  );
}

function ToggleChip({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
        active
          ? "bg-violet-500/20 text-violet-200 border-violet-500/40"
          : "bg-white/5 text-gray-400 border-white/10 hover:text-gray-200"
      }`}>
      {icon} {label}
    </button>
  );
}

/* ---------- Overview tab ---------- */

function Overview({
  volume, readiness, onLogReadiness, badges, streak, longestStreak, freezes,
}: {
  volume: Partial<Record<MuscleGroup, number>>;
  readiness: { score: number; soreness: number; sleep: number; stress: number } | undefined;
  onLogReadiness: (r: { soreness: number; sleep: number; stress: number; note?: string }) => void;
  badges: { id: string; earnedAt: number }[];
  streak: number;
  longestStreak: number;
  freezes: number;
}) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [soreness, setSoreness] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(4);

  // Live preview the readiness score as sliders move
  const previewScore = useMemo(() => {
    const s = Math.max(1, Math.min(10, soreness));
    const sl = Math.max(1, Math.min(10, sleep));
    const st = Math.max(1, Math.min(10, stress));
    return Math.round((((11 - s) / 10) * 0.3 + (sl / 10) * 0.45 + ((11 - st) / 10) * 0.25) * 100);
  }, [soreness, sleep, stress]);

  const intensity = intensityMultiplier(readiness?.score ?? previewScore);

  const scoreColor = readiness
    ? readiness.score >= 75 ? "#a3e635"
    : readiness.score >= 50 ? "#f59e0b"
    : "#ef4444"
    : previewScore >= 75 ? "#a3e635"
    : previewScore >= 50 ? "#f59e0b"
    : "#ef4444";

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Left column */}
      <div className="space-y-6">
        {/* Muscle heatmap */}
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
              {Object.entries(volume).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 6).map(([m, v]) => (
                <button key={m} onClick={() => setSelectedMuscle(m as MuscleGroup)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition ${
                    selectedMuscle === m ? "bg-violet-500/20 border border-violet-500/40" : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}>
                  <span className="text-sm capitalize text-white font-medium w-24">{m}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((v as number) / 2000) * 100)}%`,
                        background: "linear-gradient(90deg, #ec4899, #b91c1c)",
                      }} />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right font-mono">{Math.round(v as number)} kg</span>
                </button>
              ))}
              {Object.keys(volume).length === 0 && (
                <p className="text-sm text-gray-500 italic">No volume this week yet — start a workout to see your heatmap.</p>
              )}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Award className="text-amber-400" size={18} /> Achievements
            <span className="text-xs text-gray-500 font-normal ml-1">{badges.length} earned</span>
          </h3>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No badges yet — finish your first workout to unlock <b>First Workout</b>.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((b) => {
                const meta = BADGE_META[b.id] ?? { icon: "🏅", label: b.id, color: "#8b5cf6" };
                return (
                  <div key={b.id}
                    className="rounded-xl p-3 bg-white/5 border border-white/5 text-center"
                    style={{ borderColor: `${meta.color}30` }}>
                    <div className="text-3xl mb-1">{meta.icon}</div>
                    <div className="text-xs font-semibold text-white">{meta.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(b.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Locked preview */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-500 mb-2">Locked</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BADGE_META)
                .filter(([id]) => !badges.some((b) => b.id === id))
                .slice(0, 6)
                .map(([id, meta]) => (
                  <div key={id} className="px-2 py-1 rounded-full text-[11px] bg-white/5 text-gray-500 border border-white/5">
                    {meta.icon} {meta.label}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Readiness */}
        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Zap className="text-cyan-400" size={18} /> Today’s Readiness
          </h3>

          <div className="rounded-xl p-4 bg-black/30 border border-white/5 text-center mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Score</p>
            <p className="text-4xl font-bold font-mono mt-1" style={{ color: scoreColor }}>
              {readiness?.score ?? previewScore}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Intensity x{intensity.toFixed(2)}
              {intensity < 0.85 && " — deload recommended"}
              {intensity >= 1.05 && " — push for a PR!"}
            </p>
          </div>

          <Slider label="Soreness" minLabel="fresh" maxLabel="sore" value={soreness} onChange={setSoreness} inverted />
          <Slider label="Sleep"    minLabel="bad"   maxLabel="great" value={sleep}    onChange={setSleep} />
          <Slider label="Stress"   minLabel="calm"  maxLabel="max"   value={stress}   onChange={setStress} inverted />

          <button
            onClick={() => onLogReadiness({ soreness, sleep, stress })}
            className="w-full mt-3 btn-primary text-sm"
          >
            {readiness ? "Update today’s check-in" : "Log today’s readiness"}
          </button>
          {readiness && (
            <p className="text-[11px] text-gray-500 text-center mt-2">Already logged today — adjust and re-save.</p>
          )}
        </div>

        {/* Streak + long-streak */}
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
          <p className="text-xs text-gray-500 mt-3">
            Finish a workout every calendar day to extend your streak. Streaks freeze with
            <span className="text-cyan-400 mx-1">{freezes ?? 0} freezes</span>
            available.
          </p>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, minLabel, maxLabel, value, onChange, inverted }: {
  label: string; minLabel: string; maxLabel: string;
  value: number; onChange: (v: number) => void; inverted?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className="font-mono text-white">{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-pink-500" />
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{inverted ? maxLabel : minLabel}</span>
        <span>{inverted ? minLabel : maxLabel}</span>
      </div>
    </div>
  );
}
