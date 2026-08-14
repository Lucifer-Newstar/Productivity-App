"use client";

/**
 * OverviewContent — hero stats, readiness, heatmap, badges, streaks.
 * Used by /workout/overview. Accepts the workout slice + callbacks.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Play, Download, Zap, Flame, Award, Sparkles, AlertCircle, History, Database, Heart } from "lucide-react";
import { useRouter } from "next/router";
import MuscleHeatmap from "./MuscleHeatmap";
import { useStore } from "../../lib/store";
import { intensityMultiplier, weeklyMuscleVolume, suggestNextWorkout, recommendedAccessories } from "../../lib/workoutAnalytics";
import {
  waterGoalMl, proteinTargetG, tdee as tdeeFn,
  recoveryScore, computeSleepBank, avgRhr, activeInjuries, injuryRestrictionHints,
  burnoutHeuristic, classifyBp, preWorkoutAdvisory,
  projectedSleepRecovery, trainingStatus,
} from "../../lib/healthAnalytics";
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
  const { workout, tasks, logReadiness, exportWorkoutCSV, startSession, getExerciseForBlock, seedDemoData, health } = useStore();
  const router = useRouter();

  // --- Health → Workout bridge (wave 7) ---
  const bw = useMemo(() => {
    const sorted = [...workout.bodyweight].sort((a,b)=>b.date.localeCompare(a.date));
    return sorted[0]?.weightKg ?? 70;
  }, [workout.bodyweight]);
  const todayIso = new Date().toISOString().slice(0,10);
  const bank = useMemo(() => computeSleepBank(health.sleep, health.profile.idealSleepHours), [health.sleep, health.profile.idealSleepHours]);
  const lastNight = useMemo(() => [...health.sleep].sort((a,b)=>b.date.localeCompare(a.date))[0], [health.sleep]);
  const todayWater = health.water.filter(w=>w.date===todayIso).reduce((n,w)=>n+w.ml,0);
  const waterGoal = waterGoalMl(bw, health.profile.climateMult);
  const waterPct = Math.round(Math.min(100, (todayWater/Math.max(1,waterGoal))*100));
  const rec = recoveryScore(health.sleep, health.profile.idealSleepHours, waterPct);
  const rhrBaseline = avgRhr(health.vitals, 21);
  const rhr7 = avgRhr(health.vitals, 7);
  const rhrDelta = rhrBaseline>0 && rhr7>0 ? rhr7 - rhrBaseline : 0;
  const injuries = activeInjuries(health.injuries);
  const todayV = health.vitals.filter(v=>v.date===todayIso).sort((a,b)=>(b.time||"").localeCompare(a.time||""))[0];
  const bpCrisis = todayV ? classifyBp(todayV.systolic, todayV.diastolic).cat === "crisis" : false;
  const fever = !!todayV?.tempC && todayV.tempC >= 38;
  const burnout = burnoutHeuristic({sleepEntries:health.sleep,idealHours:health.profile.idealSleepHours,vitals:health.vitals,mind:health.mind,injuries:health.injuries});
  const preWO = preWorkoutAdvisory({
    sleepBank: bank, lastNightHrs: lastNight?.durationHours ?? 0, recovery: Math.round(rec*100),
    hydrationPct: waterPct, activeInjuries: injuries.length, bpCrisis, fever, rhrDelta,
    burnoutLevel: burnout.level,
  });
  const sleepProj = projectedSleepRecovery(health.sleep, health.profile.idealSleepHours);
  const volPast = (days:number, offset:number) => {
    const start = new Date(); start.setDate(start.getDate() - offset - days);
    const end = new Date(); end.setDate(end.getDate() - offset);
    const set = new Set<string>();
    for (let i=0;i<days;i++){ const d=new Date(start); d.setDate(start.getDate()+i); set.add(d.toISOString().slice(0,10)); }
    return workout.sessions.filter(s => s.endedAt && set.has(s.date)).reduce((n,s)=>n+(s.totalVolumeKg??0),0);
  };
  const recentSess = workout.sessions.filter(s=>{ const d=new Date(s.date); const n=new Date(); n.setDate(n.getDate()-14); return s.endedAt && d>=n; }).length;
  const priorSess = workout.sessions.filter(s=>{ const d=new Date(s.date); const lo=new Date(); lo.setDate(lo.getDate()-42); const hi=new Date(); hi.setDate(hi.getDate()-14); return s.endedAt && d>=lo && d<hi; }).length;
  const tStatus = trainingStatus({
    recentVol: volPast(14,0), priorVol: volPast(28,14),
    recovery: Math.round(rec*100), rhrDelta, sessionsRecent: recentSess, sessionsPrior: priorSess,
  });
  const restr = injuryRestrictionHints(health.injuries);

  const stats = useMemo(() => {
    const prCount = workout.prs.length;
    const exerciseCount = workout.exercises.length;
    const completed = workout.sessions.filter((s) => s.endedAt);
    const now = Date.now();
    const thisWeek = completed.filter((s) => now - s.startedAt <= 7 * 86400000).length;
    const totalVolume = completed.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
    return { prCount, exerciseCount, thisWeek, totalVolume, completedCount: completed.length };
  }, [workout, tasks]);

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

  // Next-workout suggestion engine
  const nextWorkout = useMemo(() => suggestNextWorkout({
    sessions: workout.sessions, routines: workout.routines, exercises: workout.exercises,
    readinessScore: todayReadiness?.score,
    blockToExercise: getExerciseForBlock,
  }), [workout.sessions, workout.routines, workout.exercises, todayReadiness, getExerciseForBlock]);

  // Most recently finished session (for pain-rec accessory recs)
  const lastFinished = useMemo(
    () => workout.sessions.find((s) => s.endedAt),
    [workout.sessions],
  );
  const recs = useMemo(() => recommendedAccessories(lastFinished?.jointPain), [lastFinished]);

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

      {/* Joint-pain accessory recommendations (only if last session flagged pain) */}
      <AnimatePresence>
        {recs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="text-red-400" size={18} />
              <h3 className="font-semibold text-red-200 text-sm">Prehab for logged joint pain</h3>
              <span className="text-xs text-red-300/70 ml-auto">
                From {lastFinished && new Date(lastFinished.date).toLocaleDateString()}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {recs.map((r) => (
                <div key={r.joint} className="rounded-lg p-3 bg-black/30 border border-white/5">
                  <p className="text-xs uppercase tracking-widest text-red-300/80 mb-1">{r.title}</p>
                  <ul className="space-y-0.5 text-sm text-gray-300">
                    {r.tips.map((t, i) => <li key={i}>• {t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OverviewBody
        volume={volume as Partial<Record<MuscleGroup, number>>}
        readiness={todayReadiness}
        onLogReadiness={(r: { soreness: number; sleep: number; stress: number }) => logReadiness(r)}
        badges={workout.badges}
        streak={workout.currentStreak ?? 0}
        longestStreak={workout.longestStreak ?? 0}
        freezes={workout.settings.streakFreezes}
        nextWorkout={nextWorkout}
        onGoToSchedule={() => router.push("/workout/schedule")}
        onGoToLibrary={() => router.push("/workout/library")}
        onStartRoutine={todaysRoutine ? () => { startSession(todaysRoutine.name, todaysRoutine.id, todayReadiness?.score); } : null}
        onSeedDemo={() => seedDemoData()}
        todaysRoutineName={todaysRoutine?.name ?? null}
        healthAdvisory={{ preWO, rec, bank, waterPct, tStatus, injuries, restr }}
        onGoToHealth={() => router.push("/health")}
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

function OverviewBody({ volume, readiness, onLogReadiness, badges, streak, longestStreak, freezes, nextWorkout, onGoToSchedule, onGoToLibrary, onStartRoutine, onSeedDemo, todaysRoutineName, healthAdvisory, onGoToHealth }: any) {
  const { preWO, rec, bank, waterPct, tStatus, injuries, restr } = healthAdvisory || {};
  void restr;
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
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                  <p className="text-sm text-gray-300">No volume this week yet.</p>
                  <p className="text-xs text-gray-500 mt-1">Start a workout or load demo data to populate the heatmap.</p>
                  <button onClick={onSeedDemo}
                    className="mt-3 btn-primary text-xs inline-flex items-center gap-1 !bg-gradient-to-r !from-pink-500 !to-violet-500">
                    <Database size={12} /> Load demo data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 12-Week Volume Trend */}
        <WeeklyVolumeSparkline />

        {/* Recent sessions timeline */}
        <RecentTimeline />

        <div className="card">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Award className="text-amber-400" size={18} /> Achievements <span className="text-xs text-gray-500 font-normal ml-1">{badges.length} earned</span>
          </h3>
          {badges.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
              <p className="text-sm text-gray-300">No badges yet.</p>
              <p className="text-xs text-gray-500 mt-1">Finish your first workout to unlock the First Workout badge.</p>
              {onStartRoutine && todaysRoutineName ? (
                <button onClick={onStartRoutine}
                  className="mt-3 btn-primary text-xs inline-flex items-center gap-1">
                  <Play size={12} fill="white" /> Start {todaysRoutineName}
                </button>
              ) : (
                <button onClick={onGoToSchedule}
                  className="mt-3 btn-ghost text-xs">Build a routine first →</button>
              )}
            </div>
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
        {/* Health advisory (Health→Workout bridge) */}
        {preWO && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="card relative overflow-hidden"
            style={{ borderColor: `${preWO.color}40`, background: `linear-gradient(135deg, ${preWO.color}14, transparent)` }}>
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} style={{ color: preWO.color }}/>
              <h3 className="font-semibold text-sm" style={{ color: preWO.color }}>HEALTH: {preWO.title}</h3>
            </div>
            <div className="text-xs text-gray-300 space-y-1 mb-2">
              {preWO.messages.slice(0, 3).map((m: string, i: number) => <div key={i}>• {m}</div>)}
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-mono">
              <div className="rounded bg-white/5 p-1.5"><div className="text-gray-500">RECOVERY</div><div style={{color: rec>=0.7?"#a3e635":rec>=0.5?"#f59e0b":"#ef4444"}}>{Math.round(rec*100)}</div></div>
              <div className="rounded bg-white/5 p-1.5"><div className="text-gray-500">SLEEP</div><div style={{color: bank<=-5?"#ef4444":bank<0?"#f59e0b":"#a3e635"}}>{bank>=0?"+":""}{bank.toFixed(1)}h</div></div>
              <div className="rounded bg-white/5 p-1.5"><div className="text-gray-500">HYDRO</div><div style={{color:waterPct>=70?"#a3e635":waterPct>=50?"#f59e0b":"#ef4444"}}>{waterPct}%</div></div>
            </div>
            <div className="mt-2 text-[10px] text-center" style={{color: tStatus.color}}>● {tStatus.label}</div>
            {injuries.length>0 && restr.length>0 && (
              <div className="mt-2 text-[9px] text-amber-300/80 font-mono">→ {restr[0]}</div>
            )}
            <button onClick={onGoToHealth} className="mt-2 w-full rounded-md py-1 text-[10px] text-violet-300 hover:text-violet-200 border border-violet-500/20 bg-violet-500/10">Open Health OS →</button>
          </motion.div>
        )}

        {/* Next workout suggestion */}
        <div className="card border-violet-500/30 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
              <Sparkles className="text-violet-400" size={18} /> Suggested today
            </h3>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-pink-300 mb-2">
              {nextWorkout.title}
            </p>
            <p className="text-sm text-gray-400 mb-3">{nextWorkout.reasoning}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                nextWorkout.intensity === "pr" ? "bg-pink-500/25 text-pink-300" :
                nextWorkout.intensity === "push" ? "bg-amber-500/25 text-amber-300" :
                nextWorkout.intensity === "easy" ? "bg-cyan-500/25 text-cyan-300" :
                nextWorkout.intensity === "deload" ? "bg-gray-500/25 text-gray-300" :
                "bg-emerald-500/25 text-emerald-300"
              }`}>{nextWorkout.intensity}</span>
              {nextWorkout.routineId ? (
                <button onClick={onGoToSchedule} className="chip cursor-pointer bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 text-[10px]">
                  View schedule
                </button>
              ) : nextWorkout.focus ? (
                <button onClick={onGoToLibrary} className="chip cursor-pointer bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 text-[10px]">
                  Browse {nextWorkout.focus} exercises
                </button>
              ) : null}
            </div>
          </div>
        </div>

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

/** Recent sessions timeline — shows the last 10 completed workouts in
 *  reverse-chronological order with volume/duration so there's an at-a-glance
 *  completion history on the overview. */
function RecentTimeline() {
  const { workout, seedDemoData } = useStore();
  const router = useRouter();
  const recent = useMemo(
    () => [...workout.sessions].filter((s) => s.endedAt).slice(0, 10),
    [workout.sessions],
  );

  const fmtDur = (sec?: number) => {
    if (!sec) return "—";
    const m = Math.round(sec / 60);
    return `${m}m`;
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
        <History className="text-violet-400" size={18} /> Recent sessions
      </h3>
      {recent.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
          <p className="text-sm text-gray-300">No sessions logged yet.</p>
          <p className="text-xs text-gray-500 mt-1">Kick things off with today's routine or preview with demo data.</p>
          <div className="flex gap-2 justify-center mt-3 flex-wrap">
            <button onClick={() => router.push("/workout/gym")}
              className="btn-primary text-xs inline-flex items-center gap-1">
              <Play size={12} fill="white" /> Start a workout
            </button>
            <button onClick={() => seedDemoData()}
              className="btn-ghost text-xs inline-flex items-center gap-1">
              <Database size={12} /> Load demo data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="w-1.5 h-10 rounded-full"
                style={{ background: i === 0 ? "linear-gradient(180deg,#ec4899,#8b5cf6)" : "#8b5cf640" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{s.name}</p>
                <p className="text-[11px] text-gray-500 font-mono">{s.date}</p>
              </div>
              <div className="text-right text-xs font-mono">
                <p className="text-lime-300">{Math.round(s.totalVolumeKg ?? 0).toLocaleString()} kg</p>
                <p className="text-gray-500">{fmtDur(s.durationSeconds)} · {s.sets.length} sets</p>
              </div>
              {s.rating && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">{s.rating}/10</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 12-week rolling volume trend sparkline (pure SVG, no deps). */
function WeeklyVolumeSparkline() {
  const { workout } = useStore();
  const weeks = 12;
  const data = useMemo(() => {
    const now = Date.now();
    const out: { label: string; volume: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const end = now - i * 7 * 86400000;
      const start = end - 7 * 86400000;
      const vol = workout.sessions
        .filter((s) => s.endedAt && s.startedAt >= start && s.startedAt < end)
        .reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
      const d = new Date(start);
      out.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, volume: Math.round(vol) });
    }
    return out;
  }, [workout.sessions]);

  const W = 480, H = 110, PAD = 24;
  const maxV = Math.max(1, ...data.map((d) => d.volume));
  const step = (W - PAD * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = PAD + i * step;
    const y = H - PAD - ((H - PAD * 2) * (d.volume / maxV));
    return [x, y] as const;
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L ${points[points.length - 1][0]} ${H - PAD} L ${points[0][0]} ${H - PAD} Z`;
  const avg = data.reduce((n, d) => n + d.volume, 0) / data.length;
  const latest = data[data.length - 1].volume;
  const delta = data.length >= 2 ? latest - data[data.length - 2].volume : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Flame className="text-cyan-400" size={18} /> 12-Week Volume Trend
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400">Avg <span className="text-white font-mono">{Math.round(avg).toLocaleString()} kg</span></span>
          <span className="text-gray-400">This week <span className="text-white font-mono">{Math.round(latest).toLocaleString()} kg</span></span>
          <span className={delta >= 0 ? "text-lime-400" : "text-red-400"}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta)).toLocaleString()}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28">
        <defs>
          <linearGradient id="vol-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1={PAD} x2={W - PAD} y1={PAD + (H - PAD * 2) * f} y2={PAD + (H - PAD * 2) * f}
            stroke="#ffffff10" strokeDasharray="3 4" />
        ))}
        <path d={area} fill="url(#vol-grad)" />
        <path d={path} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 2}
            fill={i === points.length - 1 ? "#ec4899" : "#06b6d4"} />
        ))}
        {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((d, k) => {
          const i = k * 3 < data.length - 1 ? k * 3 : data.length - 1;
          const p = points[i];
          return (
            <text key={i} x={p[0]} y={H - 6} textAnchor="middle" className="fill-gray-500" style={{ fontSize: 9 }}>
              {d.label}
            </text>
          );
        })}
      </svg>
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
