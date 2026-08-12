/**
 * Workout analytics — pure helpers used across the workout page.
 *
 *  - Epley 1RM estimate
 *  - Weekly volume per muscle (for heatmap)
 *  - Readiness score (0-100) from soreness/sleep/stress
 *  - Intensity multiplier based on readiness
 *  - Progressive-overload suggestion
 *  - Plateau detection
 *  - Badge eligibility
 *  - Warm-up & cooldown generators
 */

import type {
  WorkoutExercise, WorkoutSession, WorkoutSetLog, WorkoutReadiness,
  MuscleGroup, WorkoutPR, BadgeId,
} from "./types";
import { MUSCLE_FILTER_GROUP } from "./types";

// ---------- 1RM (Epley formula) ----------
// 1RM = weight × (1 + reps/30)
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}
export function set1RM(set: WorkoutSetLog): number {
  if (!set.weight || set.value <= 0) return 0;
  return epley1RM(set.weight, Math.max(1, Math.round(set.value)));
}

// Best 1RM for an exercise across all finished sessions.
export function best1RMForExercise(
  exerciseId: string,
  sessions: WorkoutSession[],
  blockToExercise: (blockId: string) => WorkoutExercise | undefined,
): number {
  let best = 0;
  for (const s of sessions) {
    if (!s.endedAt) continue;
    for (const set of s.sets) {
      const ex = blockToExercise(set.blockId);
      if (!ex || ex.id !== exerciseId) continue;
      const rm = set1RM(set);
      if (rm > best) best = rm;
    }
  }
  return Math.round(best * 10) / 10;
}

// ---------- Weekly muscle volume ----------
// Returns kg-volume per *filter-group* muscle for the last 7 days. Secondary
// muscles get 40% credit.
export function weeklyMuscleVolume(
  sessions: WorkoutSession[],
  blockToExercise: (blockId: string) => WorkoutExercise | undefined,
): Record<string, number> {
  const vol: Record<string, number> = {};
  const weekAgo = Date.now() - 7 * 86400000;
  for (const s of sessions) {
    if (!s.endedAt || s.startedAt < weekAgo) continue;
    for (const set of s.sets) {
      if (!set.weight) continue;
      const ex = blockToExercise(set.blockId);
      if (!ex) continue;
      const amount = set.weight * set.value;
      const group = ex.muscleGroup ? MUSCLE_FILTER_GROUP[ex.muscleGroup] : "other";
      vol[group] = (vol[group] ?? 0) + amount;
      (ex.secondaryMuscles ?? []).forEach((m) => {
        const g = MUSCLE_FILTER_GROUP[m];
        vol[g] = (vol[g] ?? 0) + amount * 0.4;
      });
    }
  }
  return vol;
}

// ---------- Readiness ----------
// soreness 1-10 (high = bad), sleep 1-10 (high = good), stress 1-10 (high = bad).
// Sleep matters most. Output 0-100.
export function readinessScore(r: { soreness: number; sleep: number; stress: number }): number {
  const s = Math.max(1, Math.min(10, r.soreness));
  const sl = Math.max(1, Math.min(10, r.sleep));
  const st = Math.max(1, Math.min(10, r.stress));
  const raw = ((11 - s) / 10) * 0.3 + (sl / 10) * 0.45 + ((11 - st) / 10) * 0.25;
  return Math.round(raw * 100);
}

// Suggested intensity multiplier.
export function intensityMultiplier(score: number): number {
  if (score >= 80) return 1.05;
  if (score >= 65) return 1.0;
  if (score >= 50) return 0.9;
  if (score >= 35) return 0.8;
  return 0.7; // deload
}

// ---------- Progressive overload ----------
// Given the most recent sets for an exercise, recommend next step.
export function suggestProgression(
  exercise: WorkoutExercise,
  recentSets: WorkoutSetLog[],
): { weight?: number; reps?: number; message: string } {
  if (recentSets.length === 0) {
    return exercise.unit === "kg"
      ? { weight: 20, reps: 8, message: "Start light — 20 kg × 8 to find baseline." }
      : { reps: 8, message: "Start with a conservative target to establish baseline." };
  }
  if (exercise.unit !== "kg") {
    const last = recentSets[recentSets.length - 1].value;
    return { reps: Math.max(1, Math.round(last + 2)), message: `Aim for ${Math.max(1, Math.round(last + 2))} reps next session.` };
  }
  const last = recentSets[recentSets.length - 1];
  const lastWeight = last.weight ?? 0;
  const avgReps = recentSets.reduce((n, s) => n + s.value, 0) / recentSets.length;
  const avgRir = recentSets.reduce((n, s) => n + (s.rir ?? 2), 0) / recentSets.length;
  if (avgReps >= (last.value + 1) && avgRir >= 1) {
    return { weight: +(lastWeight + 2.5).toFixed(1), reps: Math.round(last.value),
      message: `Bump to ${(lastWeight + 2.5).toFixed(1)} kg — you had reps left.` };
  }
  if (last.value < 4) {
    return { weight: Math.max(0, +(lastWeight - 2.5).toFixed(1)), reps: 5,
      message: `Drop to ${Math.max(0, lastWeight - 2.5)} kg and nail 5 clean reps.` };
  }
  return { weight: lastWeight, reps: Math.round(last.value + 1),
    message: `Stay at ${lastWeight} kg, aim for ${Math.round(last.value + 1)} reps.` };
}

// ---------- Plateau detection ----------
// PR hasn't improved in 14+ days and recent attempts are not trending up.
export function detectPlateau(pr: WorkoutPR | undefined): boolean {
  if (!pr || pr.history.length < 3) return false;
  const last = new Date(pr.date).getTime();
  const twoWeeks = 14 * 86400000;
  if (Date.now() - last < twoWeeks) return false;
  const recent = pr.history.slice(-3);
  const improving = recent.some((h, i) => i === 0 || h.value > recent[i - 1].value);
  return !improving;
}

// ---------- Badges ----------
export function evaluateBadges(
  state: {
    sessions: WorkoutSession[];
    prs: WorkoutPR[];
    currentStreak: number;
    exercises: WorkoutExercise[];
  },
): BadgeId[] {
  const out: BadgeId[] = [];
  const finished = state.sessions.filter((s) => s.endedAt);
  if (finished.length >= 1)  out.push("first_workout");
  if (finished.length >= 10) out.push("ten_workouts");
  if (finished.length >= 50) out.push("fifty_workouts");
  if (state.currentStreak >= 3)  out.push("streak_3");
  if (state.currentStreak >= 7)  out.push("streak_7");
  if (state.currentStreak >= 30) out.push("streak_30");
  const totalKg = finished.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
  if (totalKg >= 10000) out.push("century_volume");
  if (finished.some((s) => new Date(s.startedAt).getHours() < 7)) out.push("early_bird");
  // Strength PR exists -> pr_strength
  const hasStrengthPR = state.prs.some((p) => {
    const ex = state.exercises.find((e) => e.id === p.exerciseId);
    return ex && ex.unit === "kg";
  });
  if (hasStrengthPR) out.push("pr_strength");
  const cardioPR = state.prs.some((p) => {
    const ex = state.exercises.find((e) => e.id === p.exerciseId);
    return ex && (ex.unit === "seconds" || ex.unit === "meters");
  });
  if (cardioPR) out.push("pr_cardio");
  const bwPR = state.prs.some((p) => {
    const ex = state.exercises.find((e) => e.id === p.exerciseId);
    return ex && ex.unit === "reps" && ex.equipment === "bodyweight";
  });
  if (bwPR) out.push("pr_bodyweight");
  return out;
}

// ---------- Warm-up generator ----------
export function generateWarmup(exerciseName: string, workingWeightKg?: number): string[] {
  const steps = [
    "3 min light cardio (jumping jacks, row, or brisk walk)",
    `Dynamic stretches for 2 min (arm circles, leg swings, bodyweight moves)`,
  ];
  if (workingWeightKg && workingWeightKg > 0) {
    steps.push(`2 × 8 light warm-up sets at 50% (${Math.round(workingWeightKg * 0.5)} kg)`);
    steps.push(`1 × 5 at 75% (${Math.round(workingWeightKg * 0.75)} kg)`);
  }
  steps.push("Rest 60s — first working set coming up 💪");
  return steps;
}

// Cooldown muscles for a session = all muscles touched.
export function suggestCooldown(exercises: WorkoutExercise[]): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  exercises.forEach((e) => {
    if (e.muscleGroup) set.add(e.muscleGroup);
    (e.secondaryMuscles ?? []).forEach((m) => set.add(m));
  });
  return Array.from(set);
}

// CSV export of all workout data.
export function exportCSV(sessions: WorkoutSession[], blockToExercise: (b: string) => WorkoutExercise | undefined): string {
  const rows = [
    ["date", "exercise", "set", "reps_or_seconds", "weight_kg", "rir", "duration_s", "volume_kg"],
  ];
  for (const s of sessions) {
    for (const set of s.sets) {
      const ex = blockToExercise(set.blockId);
      const vol = (set.weight ?? 0) * set.value;
      rows.push([
        s.date,
        ex?.name ?? "—",
        String(set.setIndex),
        String(set.value),
        set.weight != null ? String(set.weight) : "",
        set.rir != null ? String(set.rir) : "",
        set.durationSeconds != null ? String(set.durationSeconds) : "",
        vol ? String(vol) : "",
      ]);
    }
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

// Short beep using WebAudio (no assets needed).
export function playBeep(freq = 880, durationMs = 220, volume = 0.2) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = volume;
    o.connect(g).connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    o.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => ctx.close(), durationMs + 100);
  } catch {
    /* ignore */
  }
}
