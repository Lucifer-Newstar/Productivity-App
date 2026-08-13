/**
 * Seed the store with rich mock data for QA / demo purposes.
 *
 * Usage: in the browser console, call:
 *   window.__kaizenSeed()
 * Or click "Load demo data" on the Tools page (dev-only).
 *
 * Wipes existing workout.sessions / prs / readiness / bodyweight / goals / challenges
 * and fills in ~12 weeks of realistic training data so every chart/card has content.
 */
import type {
  WorkoutSession, WorkoutSetLog, WorkoutPR, WorkoutReadiness, WorkoutBodyweight,
  WorkoutGoal, ChallengeEntry, WorkoutNote, CardioLog,
} from "./types";

type JournalEntry = WorkoutNote;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const DAY = 86_400_000;
const todayIso = (d = new Date()) => d.toISOString().slice(0, 10);

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * DAY);
  return todayIso(d);
}

interface SeedDeps {
  exercises: any[];
  routines: any[];
}

export function generateSeedData({ exercises, routines }: SeedDeps) {
  const ids = {
    bench: exercises.find((e) => e.id === "w-bench")?.id ?? undefined,
    squat: exercises.find((e) => e.id === "w-squat")?.id ?? undefined,
    dead:  exercises.find((e) => e.id === "w-dead")?.id ?? undefined,
    ohp:   exercises.find((e) => e.id === "w-ohp")?.id ?? undefined,
    rows:  exercises.find((e) => e.id === "w-row")?.id ?? exercises.find((e) => e.name.toLowerCase().includes("row"))?.id ?? undefined,
    pullup:exercises.find((e) => e.id === "w-pullup")?.id ?? undefined,
    pushup:exercises.find((e) => e.id === "w-pushup")?.id ?? undefined,
    plank: exercises.find((e) => e.id === "w-plank")?.id ?? undefined,
    run:   exercises.find((e) => e.id === "w-run5k")?.id ?? undefined,
    bicep: exercises.find((e) => e.id === "w-bicep")?.id ?? undefined,
    tri:   exercises.find((e) => e.id === "w-tbextend")?.id ?? undefined,
    latRaise: exercises.find((e) => e.id === "w-latraise")?.id ?? undefined,
    rdl:   exercises.find((e) => e.name.toLowerCase().includes("romanian"))?.id ?? undefined,
    lunge: exercises.find((e) => e.name.toLowerCase().includes("lunge"))?.id ?? undefined,
    calf:  exercises.find((e) => e.id === "w-calf")?.id ?? undefined,
  };
  // Build a pseudo-block mapping for the seeded push/leg/pull routines.
  const findRoutine = (name: string) => routines.find((r) => r.name === name);
  const pushR = findRoutine("Push Day");
  const legR  = findRoutine("Leg Day");
  const pullBlocks: any[] = [];
  // Build a synthetic "Pull Day" routine by picking block ids from common exercises.
  const pullBlockFor = (exId: string, sets: number, reps: number, rest: number) => {
    const id = "seed-" + exId + "-" + uid().slice(0,4);
    pullBlocks.push({ id, exerciseId: exId, type: "strength", sets, reps, restSeconds: rest });
    return id;
  };
  const pullRow    = ids.rows ? pullBlockFor(ids.rows, 4, 8, 120) : undefined;
  const pullPullup = ids.pullup ? pullBlockFor(ids.pullup, 4, 6, 150) : undefined;
  const pullDead   = ids.dead ? pullBlockFor(ids.dead, 3, 3, 240) : undefined;
  const pullBicep  = ids.bicep ? pullBlockFor(ids.bicep, 3, 12, 60) : undefined;
  const pullLat    = ids.latRaise ? pullBlockFor(ids.latRaise, 3, 15, 45) : undefined;

  const blockFor = (routine: any, exId: string | undefined): string | undefined =>
    routine?.blocks.find((b: any) => b.exerciseId === exId)?.id ?? undefined;

  // Generate 12 weeks (84 days) of sessions
  const sessions: WorkoutSession[] = [];
  const prs: WorkoutPR[] = [];
  const readiness: WorkoutReadiness[] = [];
  const bodyweight: WorkoutBodyweight[] = [];
  const journal: JournalEntry[] = [];

  // PRs start from baseline and trend up
  const prMap: Record<string, { weight: number; reps: number; history: {date:string;value:number;reps?:number;weight?:number}[] }> = {
    [ids.bench!]:  { weight: 60, reps: 8, history: [] },
    [ids.squat!]:  { weight: 80, reps: 5, history: [] },
    [ids.dead!]:   { weight: 100, reps: 3, history: [] },
    [ids.ohp!]:    { weight: 40, reps: 6, history: [] },
    [ids.pullup!]: { weight: 0, reps: 5, history: [] },
  };

  // Simple linear progression with small noise
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const randi = (min: number, max: number) => Math.round(rand(min, max));

  for (let day = 83; day >= 0; day--) {
    const doy = new Date(Date.now() - day * DAY).getDay(); // 0=sun
    // Push Mon(1) / Pull Wed-ish(3) / Leg Fri(5) roughly, skip some days randomly
    const shouldPush = day % 7 === 2 && Math.random() > 0.1;
    const shouldPull = day % 7 === 4 && Math.random() > 0.1;
    const shouldLeg  = day % 7 === 6 && Math.random() > 0.15;
    const isCardio   = Math.random() < 0.12 && day % 2 === 0;

    // Bodyweight ~70 kg ± 1.2 trending down slightly
    const bw = 72 - (day / 84) * 1.5 + rand(-0.4, 0.4);
    bodyweight.push({ date: daysAgo(day), weightKg: +bw.toFixed(1) });

    // Readiness most days
    if (day % 3 !== 0) {
      const soreness = randi(1, 5), sleep = randi(5, 9), stress = randi(2, 6);
      const score = Math.round((((11 - soreness)/10)*0.3 + (sleep/10)*0.45 + ((11 - stress)/10)*0.25) * 100);
      readiness.push({ date: daysAgo(day), soreness, sleep, stress, score });
    }

    const addSets = (routine: any, sets_plan: { bid: string|undefined; exId: string|undefined; w0: number; r0: number; inc: number; isBW?: boolean; isCardio?: boolean }[]) => {
      const startedAt = Date.now() - day * DAY;
      const sessSets: WorkoutSetLog[] = [];
      let totalVol = 0;
      sets_plan.forEach((plan) => {
        if (!plan.bid && !plan.isCardio) return;
        const w = plan.isBW ? 0 : Math.max(20, Math.round(plan.w0 + plan.inc * (84 - day) / 70 + rand(-1.5, 2)));
        for (let s = 1; s <= (plan.isCardio? 1 : randi(3, 5)); s++) {
          const reps = plan.isCardio ? randi(1500, 3600) /* seconds for cardio */ : Math.max(1, Math.round(plan.r0 + rand(-1, 1)));
          const entry: WorkoutSetLog = {
            blockId: plan.bid!, setIndex: s, value: reps,
            weight: plan.isBW || plan.isCardio ? undefined : w,
            rir: randi(0,3), rpe: [6,7,8,9,10][randi(1,4)] as any,
            completed: true, durationSeconds: plan.isCardio ? reps : undefined,
          };
          sessSets.push(entry);
          if (w) totalVol += w * reps;
        }
        // Log occasional PRs
        if (!plan.isCardio && !plan.isBW && plan.exId && prMap[plan.exId] && Math.random() < 0.15) {
          const pr = prMap[plan.exId];
          pr.weight = Math.max(pr.weight, w);
          pr.reps = Math.max(pr.reps, Math.round(plan.r0 + rand(-0.5, 1.5)));
        }
      });
      sessions.push({
        id: uid(), routineId: routine?.id,
        name: routine?.name ?? (isCardio ? "Cardio" : "Session"),
        date: daysAgo(day), startedAt, endedAt: startedAt + randi(40,75) * 60000,
        sets: sessSets, totalVolumeKg: totalVol, durationSeconds: randi(2400, 5400),
        rating: randi(5,9), phase: "maintenance", crowdLevel: ["light","moderate","packed"][randi(0,2)] as any,
      });
    };

    if (shouldPush && pushR) {
      addSets(pushR, [
        { bid: blockFor(pushR, ids.bench), exId: ids.bench, w0: 60, r0: 6, inc: 20 },
        { bid: blockFor(pushR, ids.ohp),   exId: ids.ohp,   w0: 38, r0: 7, inc: 8 },
        { bid: blockFor(pushR, ids.pushup),exId: ids.pushup,w0: 0,  r0: 12,inc: 0, isBW: true },
        { bid: blockFor(pushR, ids.plank), exId: ids.plank, w0: 0,  r0: 45,inc: 0, isBW: true },
        { bid: ids.tri ? (() => { const id = "seed-tri-"+uid().slice(0,4); pullBlocks.push({id,exerciseId:ids.tri,type:"strength",sets:3,reps:12,restSeconds:60}); return id; })() : undefined, exId: ids.tri, w0: 18, r0: 12, inc: 6 },
      ]);
      if (Math.random() < 0.3) journal.push({ id: uid(), date: daysAgo(day), content: "Push day felt strong. Bench was crisp, lockout solid.", tags: ["push"] });
    }
    if (shouldPull) {
      const syntheticRoutine = { id: undefined, name: "Pull Day", blocks: pullBlocks };
      addSets(syntheticRoutine as any, [
        { bid: pullDead, exId: ids.dead, w0: 100, r0: 3, inc: 40 },
        { bid: pullPullup, exId: ids.pullup, w0: 0, r0: 5, inc: 0, isBW: true },
        { bid: pullRow, exId: ids.rows, w0: 50, r0: 8, inc: 15 },
        { bid: pullBicep, exId: ids.bicep, w0: 12, r0: 10, inc: 6 },
        { bid: pullLat, exId: ids.latRaise, w0: 6, r0: 12, inc: 3 },
      ]);
      if (Math.random() < 0.2) journal.push({ id: uid(), date: daysAgo(day), content: "Pull-ups are coming along — 4 strict in a row now.", tags: ["pull"] });
    }
    if (shouldLeg && legR) {
      addSets(legR, [
        { bid: blockFor(legR, ids.squat), exId: ids.squat, w0: 80, r0: 5, inc: 40 },
        { bid: blockFor(legR, ids.lunge), exId: ids.lunge, w0: 40, r0: 10, inc: 15 },
        { bid: blockFor(legR, ids.calf),  exId: ids.calf,  w0: 40, r0: 15, inc: 20 },
        { bid: ids.rdl ? (() => { const id = "seed-rdl-"+uid().slice(0,4); pullBlocks.push({id,exerciseId:ids.rdl,type:"strength",sets:3,reps:10,restSeconds:90}); return id; })() : undefined, exId: ids.rdl, w0: 60, r0: 10, inc: 20 },
      ]);
      if (Math.random() < 0.2) journal.push({ id: uid(), date: daysAgo(day), content: "Legs destroyed. Squats heavy but hips tight — need more mobility.", tags: ["legs"] });
    }
    if (isCardio) {
      const startedAt = Date.now() - day * DAY + 3600000;
      const dist = randi(3000, 8000);
      const dur = Math.round(dist / rand(2.5, 3.5));
      sessions.push({
        id: uid(),
        name: "Run", date: daysAgo(day), startedAt, endedAt: startedAt + dur * 1000,
        sets: [], totalVolumeKg: 0, durationSeconds: dur, rating: randi(6,9),
      });
    }
  }

  // Build PRs from prMap trends
  Object.entries(prMap).forEach(([exId, pr]) => {
    if (!exId) return;
    const isBW = exId === ids.pullup;
    prs.push({
      id: uid(), exerciseId: exId,
      value: isBW ? pr.reps : pr.weight,
      reps: isBW ? undefined : pr.reps,
      estimated1RM: isBW ? pr.reps : Math.round(pr.weight * (1 + pr.reps/30) * 10) / 10,
      date: daysAgo(randi(2,10)),
      history: pr.history,
    });
  });

  // A couple of goals
  const goals: WorkoutGoal[] = [
    { id: uid(), title: "Bench 100 kg", target: 100, unit: "kg", metric: "1rm-kg", exerciseId: ids.bench },
    { id: uid(), title: "20 workouts", target: 20, unit: "workouts", metric: "workouts" },
    { id: uid(), title: "7-day streak", target: 7, unit: "days", metric: "streak" },
  ];

  // A challenge
  const perDay = Array.from({length: 30}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return { date: todayIso(d), done: i < 20 - Math.floor(Math.random()*3) };
  });
  const challenge: ChallengeEntry = {
    id: uid(), name: "30-day push-up challenge",
    startDate: perDay[0].date, lengthDays: 30, perDay,
  };

  // A handful of cardio sessions (3 runs over the last 2 weeks, progressing pace)
  const cardioLogs: CardioLog[] = [];
  [12, 7, 3, 1].forEach((dayBack, i) => {
    const dist = 4000 + i * 400;
    const dur = Math.round((dist / rand(2.7, 3.2)));
    const avgHr = Math.round(145 + i * 2);
    cardioLogs.push({
      id: uid(),
      date: daysAgo(dayBack),
      type: "run",
      routeName: i % 2 === 0 ? "River Trail" : "Neighborhood loop",
      distanceMeters: dist,
      durationSec: dur,
      avgHr,
      maxHr: avgHr + 12,
      hrStart: avgHr - 15,
      hrEnd: avgHr + 8,
      hrDriftPct: +((((avgHr + 8) - (avgHr - 15)) / (avgHr - 15)) * 100).toFixed(1),
      cadenceSpm: randi(165, 178),
      cooldownMin: 5,
      fuel: i === 0 ? "fasted" : "toast + coffee",
      isLSD: i === 0,
      paceSecPerKm: dur / (dist / 1000),
    });
  });

  return {
    sessions: sessions.sort((a,b) => b.startedAt - a.startedAt),
    prs, readiness, bodyweight, journal,
    cardioLogs,
    goals, challenges: [challenge],
  };
}
