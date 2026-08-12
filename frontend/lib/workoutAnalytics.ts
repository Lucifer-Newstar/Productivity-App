/**
 * Workout analytics — pure helpers used across the workout page.
 *
 * Algorithms implemented here (documented in docs/ALGORITHMS.md):
 *  - 1RM estimates (Epley + Brzycki)
 *  - Training Max (90% of 1RM) for 5/3/1-style programming
 *  - Weekly muscle volume for the anatomical heatmap (secondary muscles @ 40%)
 *  - Readiness score 0-100 (weighted soreness / sleep / stress)
 *  - Intensity multiplier from readiness (deload / push recommendations)
 *  - Progressive-overload suggestion from recent sets
 *  - Plateau detection (no PR improvement in 14+ days with stagnant reps)
 *  - Badge eligibility
 *  - Warm-up set generator (empty-bar / 50 / 65 / 75 / 85% of work weight)
 *  - Cooldown muscle targeting
 *  - CSV export
 *  - WebAudio beep (rest timer / PR celebration)
 *  - RPE ↔ RIR conversion
 *  - AMRAP projection (Epley inverted)
 *  - Deload suggestion (6 weeks / 12 hard sessions since last deload)
 *  - VO2 max (Cooper 12-min run, VO2 = d/15 - 13.9)
 *  - HR zones (5 zones, 220-age max HR, Z1<60% … Z5>90%)
 *  - HR recovery, HR drift, negative-split detection, running economy
 *  - Weekly aggregations (volume / intensity / duration / frequency by day)
 *  - Time-of-day preference (morning / afternoon / evening distribution)
 *  - Consistency score (completed / planned workouts for last 4 weeks)
 *  - Weakness analysis (fail reasons → accessory recommendation)
 *  - Streak computation (with freezes)
 */

import type {
  WorkoutExercise, WorkoutSession, WorkoutSetLog, WorkoutReadiness,
  MuscleGroup, WorkoutPR, BadgeId, CardioLog, WorkoutRoutine,
  CaliFail, CalisthenicsSkill,
} from "./types";
import { MUSCLE_FILTER_GROUP } from "./types";

// ---------- 1RM estimates ----------

// Epley:  1RM = weight × (1 + reps/30)
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}
// Brzycki: 1RM = weight × 36 / (37 − reps). Tends to be slightly more conservative.
export function brzycki1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return (weight * 36) / (37 - Math.min(reps, 36));
}
export function set1RM(set: WorkoutSetLog): number {
  if (!set.weight || set.value <= 0) return 0;
  return epley1RM(set.weight, Math.max(1, Math.round(set.value)));
}

export function best1RMForExercise(
  exerciseId: string,
  sessions: WorkoutSession[],
  blockToExercise: (blockId: string) => WorkoutExercise | undefined,
): number {
  let best = 0;
  for (const s of sessions) {
    if (!s.endedAt) continue;
    for (const set of s.sets) {
      if (set.isWarmup) continue;
      const ex = blockToExercise(set.blockId);
      if (!ex || ex.id !== exerciseId) continue;
      best = Math.max(best, set1RM(set));
    }
  }
  return Math.round(best * 10) / 10;
}

// ---------- Training Max (90% of 1RM) ----------
export const trainingMax = (oneRM: number) => oneRM * 0.9;

// ---------- Warm-up set generator ----------
export interface WarmupSet { label: string; weight: number; reps: number; }
export function generateWarmupSets(workingWeightKg: number, oneRM?: number): WarmupSet[] {
  const base = oneRM ? trainingMax(oneRM) : workingWeightKg;
  return [
    { label: "Empty bar",    weight: 20,                       reps: 10 },
    { label: "50% work",     weight: Math.round(base * 0.50),  reps: 8 },
    { label: "65% work",     weight: Math.round(base * 0.65),  reps: 5 },
    { label: "75% work",     weight: Math.round(base * 0.75),  reps: 3 },
    { label: "85% work",     weight: Math.round(base * 0.85),  reps: 1 },
  ];
}
export function generateWarmup(exerciseName: string, workingWeightKg?: number): string[] {
  const steps = [
    "3 min light cardio (jumping jacks, row, or brisk walk)",
    "Dynamic stretches for 2 min (arm circles, leg swings, bodyweight moves)",
  ];
  if (workingWeightKg && workingWeightKg > 0) {
    for (const s of generateWarmupSets(workingWeightKg).slice(0, -1)) {
      steps.push(`${s.label}: ${s.weight} kg × ${s.reps}`);
    }
  }
  steps.push("Rest 60s — first working set coming up 💪");
  return steps;
}

// ---------- RPE ↔ RIR ----------
export const rirToRpe = (rir: number) => Math.max(1, Math.min(10, 10 - rir));
export const rpeToRir = (rpe: number) => Math.max(0, Math.min(10, 10 - rpe));

// ---------- AMRAP projection ----------
// From a weight+reps PR, predict how many reps you could do at weight w.
export function projectAMRAP(weight: number, reps: number, oneRM: number): number {
  if (!oneRM || weight <= 0) return reps;
  // inverted Epley: reps = (1RM / weight − 1) × 30
  return Math.max(1, Math.round((oneRM / weight - 1) * 30));
}

// ---------- Deload suggestion ----------
// Deload after ≥12 hard sessions or 6 weeks since last deload, whichever hits first.
export function shouldDeload(sessions: WorkoutSession[], lastDeloadMs = 0): boolean {
  const hard = sessions.filter((s) =>
    s.endedAt && s.startedAt > lastDeloadMs && !(s.isDeload || s.isRestDay),
  );
  const weeksSince = lastDeloadMs ? (Date.now() - lastDeloadMs) / (7 * 86400000) : 99;
  return hard.length >= 12 || weeksSince >= 6;
}

// ---------- Lactate Threshold estimation (Wolff / DMAX-style) ----------

/**
 * Estimate Lactate Threshold (LT2 / anaerobic threshold) HR from a max HR.
 * Two common empirical formulas:
 *   - LT1 (aerobic):   ~77% max HR
 *   - LT2 (anaerobic): ~88-90% max HR for trained, ~85% for untrained
 * We also take avg HR from a 30-min time-trial and return the average of the
 * last 20 minutes — that's the gold-standard field test.
 */
export function estimateLactateThreshold(maxHr: number, trained = true): { lt1: number; lt2: number } {
  return {
    lt1: Math.round(maxHr * 0.77),
    lt2: Math.round(maxHr * (trained ? 0.90 : 0.85)),
  };
}

// ---------- Weekly muscle volume ----------
export function weeklyMuscleVolume(
  sessions: WorkoutSession[],
  blockToExercise: (blockId: string) => WorkoutExercise | undefined,
  days = 7,
): Record<string, number> {
  const vol: Record<string, number> = {};
  const cutoff = Date.now() - days * 86400000;
  for (const s of sessions) {
    if (!s.endedAt || s.startedAt < cutoff) continue;
    for (const set of s.sets) {
      if (set.isWarmup) continue;
      if (!set.weight) continue;
      const ex = blockToExercise(set.blockId);
      if (!ex) continue;
      const amount = set.weight * set.value;
      const group = ex.muscleGroup ? MUSCLE_FILTER_GROUP[ex.muscleGroup] : "other";
      vol[group] = (vol[group] ?? 0) + amount;
      (ex.secondaryMuscles ?? []).forEach((m) => {
        vol[MUSCLE_FILTER_GROUP[m]] = (vol[MUSCLE_FILTER_GROUP[m]] ?? 0) + amount * 0.4;
      });
    }
  }
  return vol;
}

// ---------- Readiness ----------
export function readinessScore(r: { soreness: number; sleep: number; stress: number }): number {
  const s = Math.max(1, Math.min(10, r.soreness));
  const sl = Math.max(1, Math.min(10, r.sleep));
  const st = Math.max(1, Math.min(10, r.stress));
  const raw = ((11 - s) / 10) * 0.3 + (sl / 10) * 0.45 + ((11 - st) / 10) * 0.25;
  return Math.round(raw * 100);
}
export function intensityMultiplier(score: number): number {
  if (score >= 80) return 1.05;
  if (score >= 65) return 1.0;
  if (score >= 50) return 0.9;
  if (score >= 35) return 0.8;
  return 0.7;
}

// ---------- Progressive-overload suggestion ----------
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
  const w = last.weight ?? 0;
  const avgReps = recentSets.reduce((n, s) => n + s.value, 0) / recentSets.length;
  const avgRir = recentSets.reduce((n, s) => n + (s.rir ?? 2), 0) / recentSets.length;
  if (avgReps >= last.value + 1 && avgRir >= 1) {
    return { weight: +(w + 2.5).toFixed(1), reps: Math.round(last.value),
      message: `Bump to ${(w + 2.5).toFixed(1)} kg — you had reps left.` };
  }
  if (last.value < 4) {
    return { weight: Math.max(0, +(w - 2.5).toFixed(1)), reps: 5,
      message: `Drop to ${Math.max(0, w - 2.5)} kg and nail 5 clean reps.` };
  }
  return { weight: w, reps: Math.round(last.value + 1),
    message: `Stay at ${w} kg, aim for ${Math.round(last.value + 1)} reps.` };
}

// ---------- Plateau detection ----------
export function detectPlateau(pr: WorkoutPR | undefined): boolean {
  if (!pr || pr.history.length < 3) return false;
  const last = new Date(pr.date).getTime();
  if (Date.now() - last < 14 * 86400000) return false;
  const recent = pr.history.slice(-3);
  return !recent.some((h, i) => i === 0 || h.value > recent[i - 1].value);
}

// ---------- Badges ----------
export function evaluateBadges(state: {
  sessions: WorkoutSession[]; prs: WorkoutPR[]; currentStreak: number;
  exercises: WorkoutExercise[]; goalsAchieved?: number;
}): BadgeId[] {
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
  if (state.prs.some((p) => state.exercises.find((e) => e.id === p.exerciseId)?.unit === "kg")) out.push("pr_strength");
  if (state.prs.some((p) => {
    const ex = state.exercises.find((e) => e.id === p.exerciseId);
    return ex && (ex.unit === "seconds" || ex.unit === "meters");
  })) out.push("pr_cardio");
  if (state.prs.some((p) => {
    const ex = state.exercises.find((e) => e.id === p.exerciseId);
    return ex && ex.unit === "reps" && ex.equipment === "bodyweight";
  })) out.push("pr_bodyweight");
  if ((state.goalsAchieved ?? 0) > 0) out.push("goal_achieved");
  return out;
}

// ---------- Cooldown muscles ----------
export function suggestCooldown(exercises: WorkoutExercise[]): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  exercises.forEach((e) => {
    if (e.muscleGroup) set.add(e.muscleGroup);
    (e.secondaryMuscles ?? []).forEach((m) => set.add(m));
  });
  return Array.from(set);
}

// ---------- CSV export ----------
export function exportCSV(
  sessions: WorkoutSession[],
  blockToExercise: (b: string) => WorkoutExercise | undefined,
  cardioLogs?: CardioLog[],
): string {
  const rows: string[][] = [
    ["type","date","name","set_or_minute","value","value_unit","weight_kg","rir","rpe","duration_s","volume_kg","notes"],
  ];
  for (const s of sessions) {
    for (const set of s.sets) {
      const ex = blockToExercise(set.blockId);
      rows.push([
        "strength", s.date, ex?.name ?? s.name, String(set.setIndex),
        String(set.value), ex?.unit ?? "reps",
        set.weight != null ? String(set.weight) : "",
        set.rir != null ? String(set.rir) : "",
        set.rpe != null ? String(set.rpe) : "",
        set.durationSeconds != null ? String(set.durationSeconds) : "",
        String((set.weight ?? 0) * set.value),
        set.notes ?? "",
      ]);
    }
  }
  for (const c of cardioLogs ?? []) {
    rows.push([
      "cardio", c.date, c.type, "",
      String(c.distanceMeters ?? ""), "m", "", "", "",
      String(c.durationSec), "",
      [c.routeName, c.fuel, c.notes].filter(Boolean).join(" · "),
    ]);
  }
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

// ---------- Beep ----------
export function playBeep(freq = 880, durationMs = 220, volume = 0.2) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.value = volume;
    o.connect(g).connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    o.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => ctx.close(), durationMs + 100);
  } catch { /* ignore */ }
}

// ---------- Cardio-specific analytics ----------

// Max HR: 220 − age (classic estimate).
export const maxHR = (age: number) => Math.max(160, Math.min(220, 220 - age));

export const HR_ZONE_BOUNDS = [
  { label: "Z1", name: "Recovery",   min: 0,   max: 0.60, color: "#22c55e" },
  { label: "Z2", name: "Aerobic",    min: 0.60, max: 0.70, color: "#a3e635" },
  { label: "Z3", name: "Tempo",      min: 0.70, max: 0.80, color: "#f59e0b" },
  { label: "Z4", name: "Threshold",  min: 0.80, max: 0.90, color: "#ec4899" },
  { label: "Z5", name: "Anaerobic",  min: 0.90, max: 1.01, color: "#ef4444" },
] as const;

// Bucket a single HR value into zone index 0..4.
export function hrZone(hr: number, age: number): number {
  const ratio = hr / maxHR(age);
  if (ratio < 0.60) return 0;
  if (ratio < 0.70) return 1;
  if (ratio < 0.80) return 2;
  if (ratio < 0.90) return 3;
  return 4;
}

// Estimate seconds spent in each zone from avg HR and duration (crude but useful).
export function estimateHRZones(avgHr: number, durationSec: number, age: number) {
  const out = [0,0,0,0,0];
  out[hrZone(avgHr, age)] = durationSec;
  return out;
}

// HR recovery = drop from end-of-session HR to 2-minute-post HR (higher = more fit).
export const hrRecovery = (endHr: number, hr2min: number) => endHr - hr2min;

// HR drift % = (HR_end − HR_start) / HR_start × 100.  >10% = accumulating fatigue.
export const hrDrift = (start: number, end: number) =>
  start > 0 ? +(((end - start) / start) * 100).toFixed(1) : 0;

// Negative splits: second-half average faster than first half.
export function isNegativeSplit(splitsSec: number[]): boolean {
  if (splitsSec.length < 2) return false;
  const half = Math.floor(splitsSec.length / 2);
  const avg = (a: number[]) => a.reduce((n, x) => n + x, 0) / a.length;
  return avg(splitsSec.slice(half)) < avg(splitsSec.slice(0, half));
}

// Pace in sec/km.
export const pacePerKm = (durationSec: number, meters: number) =>
  meters > 0 ? durationSec / (meters / 1000) : undefined;

// VO2 max from Cooper 12-minute test:  VO2 = (distance in meters / 15) − 13.9
export const cooperVO2 = (distanceM: number) => +(distanceM / 15 - 13.9).toFixed(1);

// Running economy: pace per km at a fixed HR. Lower sec/km at the same HR = better.
// We simply return pace/HR ratio so trends are visible.
export const runningEconomy = (paceSecPerKm: number, avgHr: number) =>
  avgHr > 0 ? +(paceSecPerKm / avgHr).toFixed(2) : undefined;

// ---------- Global aggregations ----------

export interface WeeklyStats {
  workouts: number;
  volumeKg: number;
  minutes: number;
  avgIntensity: number;  // mean % of 1RM across working sets (0-1 scale)
}
export function weeklyStats(
  sessions: WorkoutSession[],
  days = 7,
): WeeklyStats {
  const cutoff = Date.now() - days * 86400000;
  const sess = sessions.filter((s) => s.endedAt && s.startedAt >= cutoff);
  let intensitySum = 0;
  let intensityN = 0;
  for (const s of sess) {
    for (const set of s.sets) {
      if (set.isWarmup || !set.weight) continue;
      intensityN++;
      // crude: weight / (weight * (1 + reps/30)) = 1/(1+reps/30) — % of estimated 1RM
      intensitySum += 1 / (1 + set.value / 30);
    }
  }
  return {
    workouts: sess.length,
    volumeKg: sess.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0),
    minutes: sess.reduce((n, s) => n + ((s.durationSeconds ?? 0) / 60), 0),
    avgIntensity: intensityN ? intensitySum / intensityN : 0,
  };
}

// Distribution by weekday (0 = Sun).
export function frequencyByDay(sessions: WorkoutSession[]): number[] {
  const out = [0,0,0,0,0,0,0];
  for (const s of sessions) {
    if (!s.endedAt) continue;
    out[new Date(s.startedAt).getDay()]++;
  }
  return out;
}

// AM/PM preference based on session start hours.
export function timePreference(sessions: WorkoutSession[]): "morning" | "afternoon" | "evening" | "none" {
  const finished = sessions.filter((s) => s.endedAt);
  if (!finished.length) return "none";
  const buckets = { morning: 0, afternoon: 0, evening: 0 } as Record<string, number>;
  for (const s of finished) {
    const h = new Date(s.startedAt).getHours();
    if (h < 11) buckets.morning++;
    else if (h < 17) buckets.afternoon++;
    else buckets.evening++;
  }
  return (Object.entries(buckets).sort((a,b) => b[1]-a[1])[0][0]) as any;
}

// Consistency: completed sessions vs scheduled routines in the last 4 weeks.
export function consistencyScore(
  sessions: WorkoutSession[],
  routines: WorkoutRoutine[],
  weeks = 4,
): number {
  const planned = routines.reduce((n, r) => n + (r.dayOfWeek != null ? weeks : 0), 0);
  if (!planned) return 0;
  const cutoff = Date.now() - weeks * 7 * 86400000;
  const completed = sessions.filter((s) => s.endedAt && s.startedAt >= cutoff).length;
  return Math.min(100, Math.round((completed / planned) * 100));
}

// Streak: consecutive calendar days with at least one completed session.
// One freeze absorbs a missing day.
export function computeStreak(sessions: WorkoutSession[], freezes = 0): { current: number; longest: number } {
  const days = new Set(sessions.filter((s) => s.endedAt).map((s) =>
    new Date(s.startedAt).toISOString().slice(0, 10)));
  if (!days.size) return { current: 0, longest: 0 };
  let longest = 0, cur = 0, freezesLeft = freezes;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0,10);
    if (days.has(iso)) { cur++; longest = Math.max(longest, cur); }
    else if (i === 0) { cur = 0; continue; }
    else if (freezesLeft > 0) { freezesLeft--; continue; }
    else { if (i > 0) break; }
  }
  return { current: cur, longest };
}

// ---------- Next-workout suggestion ----------

/**
 * Recommend what to do today based on:
 *   - Readiness score → intensity multiplier (deload / normal / PR day)
 *   - Weekly volume per muscle → pick muscles that are undertrained (low volume)
 *   - Last session's muscle groups → avoid repeating same muscles back-to-back
 *   - Day of week → match routine if scheduled, otherwise suggest the weakest muscle
 *
 * Returns a human-readable suggestion + a recommended routine id (or null).
 */
export interface NextWorkoutSuggestion {
  title: string;
  reasoning: string;
  routineId?: string;
  focus?: MuscleGroup;
  intensity: "deload" | "easy" | "normal" | "push" | "pr";
}

export function suggestNextWorkout(params: {
  sessions: WorkoutSession[];
  routines: WorkoutRoutine[];
  exercises: WorkoutExercise[];
  readinessScore?: number;
  blockToExercise: (blockId: string) => WorkoutExercise | undefined;
}): NextWorkoutSuggestion {
  const { sessions, routines, exercises, readinessScore, blockToExercise } = params;
  const finished = sessions.filter((s) => s.endedAt);
  const last = finished[0];

  // Decide intensity from readiness
  let intensity: NextWorkoutSuggestion["intensity"] = "normal";
  const score = readinessScore ?? 70;
  if (shouldDeload(sessions)) intensity = "deload";
  else if (score < 45) intensity = "easy";
  else if (score < 65) intensity = "normal";
  else if (score < 85) intensity = "push";
  else intensity = "pr";

  // If today has a scheduled routine, prefer that — with an intensity note.
  const todaysRoutine = routines.find((r) => r.dayOfWeek === new Date().getDay());
  if (todaysRoutine) {
    const intensityNote =
      intensity === "deload" ? "Deload week — cut volume 40% and weight 50%." :
      intensity === "easy" ? "Readiness is low — take it light, focus on form." :
      intensity === "push" ? "Readiness is high — push for a small PR or +2.5 kg." :
      intensity === "pr" ? "You're primed — today is a PR day. Go for it." :
      "Hit the programmed work as written.";
    return {
      title: todaysRoutine.name,
      reasoning: intensityNote,
      routineId: todaysRoutine.id,
      intensity,
    };
  }

  // Otherwise pick the muscle group with the least volume in the last 5 days,
  // skipping anything hit hard in the last session.
  const vol = weeklyMuscleVolume(sessions, blockToExercise, 5) as Record<MuscleGroup, number>;
  const lastHit = new Set<MuscleGroup>();
  if (last) {
    last.sets.forEach((set) => {
      const ex = blockToExercise(set.blockId);
      if (!ex) return;
      if (ex.muscleGroup) lastHit.add(MUSCLE_FILTER_GROUP[ex.muscleGroup]);
    });
  }
  const priorityGroups: MuscleGroup[] = ["chest","back","legs","shoulders","core"];
  let pick: MuscleGroup = "chest";
  let bestScore = Infinity;
  for (const g of priorityGroups) {
    if (lastHit.has(g)) continue;
    const v = vol[g] ?? 0;
    if (v < bestScore) { bestScore = v; pick = g; }
  }
  const focusTitle = `Focus: ${pick}`;
  const reasoning =
    intensity === "deload" ? "Deload — active recovery, mobility, light volume." :
    intensity === "easy" ? `${pick} is under-trained this week; take it light.` :
    intensity === "push" ? `${pick} is under-trained — good day to push weight.` :
    intensity === "pr" ? `${pick} is under-trained and readiness is high — PR day.` :
    `${pick} is the most undertrained muscle group this week.`;
  return { title: focusTitle, reasoning, focus: pick, intensity };
}

// ---------- Goal progress ----------

/**
 * Compute current progress for a goal based on its metric.
 * - "workouts": completed sessions count
 * - "streak": current streak (days)
 * - "volume-kg": total kg volume across sessions
 * - "1rm-kg": best estimated 1RM for the linked exercise
 * - "bodyweight-kg": most recent bodyweight log
 * - "custom": 0 (manual)
 */
export function goalProgress(
  goal: { metric: string; target: number; exerciseId?: string },
  sessions: WorkoutSession[],
  bodyweight: { date: string; weightKg: number }[],
  exercises: WorkoutExercise[],
  prs: WorkoutPR[],
  currentStreak: number,
): { current: number; pct: number; achieved: boolean } {
  let current = 0;
  const finished = sessions.filter((s) => s.endedAt);
  switch (goal.metric) {
    case "workouts": current = finished.length; break;
    case "streak":   current = currentStreak; break;
    case "volume-kg": current = Math.round(finished.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0)); break;
    case "bodyweight-kg": {
      const last = [...bodyweight].sort((a, b) => b.date.localeCompare(a.date))[0];
      current = last?.weightKg ?? 0;
      break;
    }
    case "1rm-kg": {
      if (!goal.exerciseId) break;
      const pr = prs.find((p) => p.exerciseId === goal.exerciseId);
      current = pr?.estimated1RM ?? pr?.value ?? 0;
      break;
    }
  }
  const pct = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;
  return { current, pct, achieved: current >= goal.target };
}

// ---------- RPE auto-calibration ----------

/**
 * Given historical (weight, reps, RPE) triplets, compute a calibration factor
 * that relates RPE to estimated % of 1RM for the user.
 *
 * Standard RPE table (Prilepin / table form):
 *   RPE 10 = 100% of 1RM (0 RIR)
 *   RPE 9  = 96%
 *   RPE 8  = 92%
 *   RPE 7  = 89%
 *   RPE 6  = 86%
 *
 * We compare actual reps done at a given RPE against the standard table and
 * return the mean error + a recommended personal multiplier.
 */
export const RPE_TO_PCT: Record<number, number> = {
  10: 1.00, 9.5: 0.98, 9: 0.96, 8.5: 0.94, 8: 0.92,
  7.5: 0.90, 7: 0.89, 6.5: 0.87, 6: 0.86,
};
export function pctFromRpe(rpe: number): number {
  if (rpe >= 10) return 1.0;
  if (rpe <= 6) return RPE_TO_PCT[6];
  // interpolate
  const lo = Math.floor(rpe * 2) / 2;
  const hi = Math.ceil(rpe * 2) / 2;
  if (lo === hi) return RPE_TO_PCT[lo] ?? 1;
  return RPE_TO_PCT[lo] + (RPE_TO_PCT[hi] - RPE_TO_PCT[lo]) * ((rpe - lo) / (hi - lo));
}

export interface RpeCalibration {
  samples: number;
  meanError: number;   // (predicted% - actual%) — positive means standard table is optimistic
  personalMultiplier: number;  // multiplier for pctFromRpe() to fit this user
}
export function calibrateRpe(sets: WorkoutSetLog[]): RpeCalibration {
  // Compute best 1RM per block first
  const blockBest: Record<string, number> = {};
  sets.forEach((set) => {
    if (!set.weight || set.value <= 0 || set.isWarmup) return;
    const est = epley1RM(set.weight, set.value);
    if (!blockBest[set.blockId] || est > blockBest[set.blockId]) blockBest[set.blockId] = est;
  });
  const errs: number[] = [];
  sets.forEach((set) => {
    if (!set.weight || set.value <= 0 || set.isWarmup) return;
    if (set.rpe == null) return;
    const best = blockBest[set.blockId];
    if (!best) return;
    const actualPct = set.weight / best;
    const standardPct = pctFromRpe(set.rpe);
    errs.push(standardPct - actualPct);
  });
  if (errs.length < 3) return { samples: errs.length, meanError: 0, personalMultiplier: 1 };
  const mean = errs.reduce((n, e) => n + e, 0) / errs.length;
  // If standard table predicts 92% but user actually lifts 95%, multiplier > 1
  return { samples: errs.length, meanError: mean, personalMultiplier: 1 + mean };
}

// ---------- Cali weakness analysis ----------
// Map common fail reasons → accessory work recommendations.
const WEAKNESS_RULES: { keywords: string[]; tip: string }[] = [
  { keywords: ["core", "tension", "hollow"], tip: "Add 3×30s hollow body holds + planks before skill work." },
  { keywords: ["grip", "hand", "slip"], tip: "Train grip 2×/week: dead hangs, fat-bar holds, plate pinches." },
  { keywords: ["tricep", "triceps", "lockout", "dip"], tip: "Add weighted dips 3×6 + tricep extensions 3×12." },
  { keywords: ["pull", "explosive", "transition"], tip: "Build explosive pull: high-pulls, clap pull-ups, weighted negatives." },
  { keywords: ["wrist", "shoulder", "mobility"], tip: "Add 5 min wrist + shoulder prehab before every session." },
  { keywords: ["balance", "handstand"], tip: "Wall handstand holds 4×30s + frog-to-wall entries daily." },
  { keywords: ["leg", "squat", "pistol"], tip: "Add shrimp squats 3×8 + single-leg RDLs for ankle/hip mobility." },
];
export function weaknessAnalysis(skills: CalisthenicsSkill[]): string[] {
  const tips = new Set<string>();
  for (const s of skills) {
    for (const f of s.failLog.slice(-10)) {
      const lower = f.reason.toLowerCase();
      for (const rule of WEAKNESS_RULES) {
        if (rule.keywords.some((k) => lower.includes(k))) tips.add(`[${s.name}] ${rule.tip}`);
      }
    }
  }
  return Array.from(tips).slice(0, 6);
}
