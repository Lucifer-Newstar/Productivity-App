"use client";

/**
 * Workout page — /workout route.
 *
 * Four sections, switchable via a sliding-pill tab bar:
 *   1. PR       — Personal Records (peak per exercise, quick-log attempts)
 *   2. Skills   — Progressive skill trees with progressions + completion tracking
 *   3. Exercises — Exercise library with unit types (reps / seconds / meters / kg)
 *   4. Schedule — Routines (blocks × sets × reps × rest) with a live per-set timer
 *
 * Also shows a hero header with aggregate stats (streak, total volume, PRs,
 * workouts this week) and a "Start today's workout" CTA if a routine exists for
 * today's weekday.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Dumbbell, Trophy, Target, Calendar, Flame, Play,
} from "lucide-react";
import WorkoutPRs from "../../components/workout/WorkoutPRs";
import WorkoutSkills from "../../components/workout/WorkoutSkills";
import WorkoutExercises from "../../components/workout/WorkoutExercises";
import WorkoutSchedule from "../../components/workout/WorkoutSchedule";
import { useStore } from "../../lib/store";

type Section = "pr" | "skills" | "exercises" | "schedule";

const SECTIONS: { id: Section; label: string; icon: any }[] = [
  { id: "pr",         label: "PR",        icon: Trophy },
  { id: "skills",     label: "Skills",    icon: Target },
  { id: "exercises",  label: "Exercises", icon: Dumbbell },
  { id: "schedule",   label: "Schedule",  icon: Calendar },
];

export default function WorkoutPage() {
  const [section, setSection] = useState<Section>("pr");
  const { workout, tasks } = useStore();

  // Aggregate stats
  const stats = useMemo(() => {
    const prCount = workout.prs.length;
    const exerciseCount = workout.exercises.length;
    const completedSessions = workout.sessions.filter((s) => s.endedAt);
    const thisWeek = completedSessions.filter((s) => {
      const d = new Date(s.date);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;
    const totalVolume = completedSessions.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
    const workoutTasks = tasks.filter((t) => t.space === "workout");
    return { prCount, exerciseCount, thisWeek, totalVolume, completedCount: completedSessions.length, activeTasks: workoutTasks.filter((t) => !t.completed).length };
  }, [workout, tasks]);

  // Today's routine (if any assigned to today's weekday)
  const todayIdx = new Date().getDay();
  const todaysRoutine = workout.routines.find((r) => r.dayOfWeek === todayIdx);

  return (
    // Force dark mode for workout — the pink/cyan gradients + deep panels are
    // designed for a dark canvas.
    <div className="dark space-y-8 max-w-6xl mx-auto text-gray-100">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 glass border border-white/10"
        style={{ borderColor: "#ec489930" }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-xl" style={{ boxShadow: "0 10px 40px -10px #ec489980" }}>
            <Dumbbell size={30} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Workout
            </h1>
            <p className="text-gray-400 mt-1">Log lifts, chase PRs, build skills, and run your routines — all in one place.</p>
          </div>
          {todaysRoutine && !workout.activeSessionId && (
            <Link href="#schedule" onClick={() => setSection("schedule")}
              className="hidden md:inline-flex items-center gap-2 btn-primary text-sm">
              <Play size={14} /> Start {todaysRoutine.name}
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <Stat label="PRs" value={stats.prCount} color="#f59e0b" />
          <Stat label="Exercises" value={stats.exerciseCount} color="#ec4899" />
          <Stat label="This week" value={`${stats.thisWeek} workouts`} color="#06b6d4" />
          <Stat label="Total volume" value={`${Math.round(stats.totalVolume)} kg`} color="#a3e635" />
        </div>
      </motion.div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-bg-card/60 rounded-xl border border-white/5 w-fit">
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
        {section === "pr" && <WorkoutPRs />}
        {section === "skills" && <WorkoutSkills />}
        {section === "exercises" && <WorkoutExercises />}
        {section === "schedule" && <WorkoutSchedule />}
      </motion.div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1 text-white" style={{ color }}>{value}</p>
    </div>
  );
}
