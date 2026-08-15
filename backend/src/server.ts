/**
 * Kaizen — REST API (Express, in-memory store).
 *
 * Runs on port 4000 (set via PORT env). Mirrors the FULL frontend TypeScript
 * domain model across every space:
 *
 *   - Core    → tasks, notes                     (frontend/lib/types.ts)
 *   - Workout → 25 collections                   (frontend/lib/types.ts)
 *   - Career  → 25 collections                   (frontend/lib/careerTypes.ts)
 *   - Forge   → 37 collections + 2 singletons    (frontend/lib/forgeTypes.ts)
 *   - Health  → 20 collections + 4 singletons    (frontend/lib/healthTypes.ts)
 *
 * All routes are JSON. This is intentionally minimal — no database, no auth,
 * no validation library. It lets the offline-first frontend push/pull its
 * whole state (`/api/sync`) during local development and serves as the
 * reference for a future production implementation (Postgres/Prisma, JWT).
 *
 * See docs/API.md for the full route reference.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }));
app.use(express.json({ limit: "8mb" })); // photos are dataURLs — allow room

// ---------------- In-memory store ----------------
// Collections of records keyed by id.
type Row = Record<string, any>;
const db: Record<string, Record<string, Row>> = {
  // Core (home dashboard)
  tasks: {},
  notes: {},
  // Workout domain
  exercises: {},
  prs: {},
  skills: {},
  routines: {},
  sessions: {},
  readiness: {},
  badges: {},
  bodyweight: {},
  caliChains: {},
  caliSkills: {},
  caliFlows: {},
  gtg: {},
  isometricLogs: {},
  intervalLogs: {},
  mobilityDrills: {},
  mobilitySessions: {},
  plancheEntries: {},
  cardioLogs: {},
  programs: {},
  goals: {},
  customMetrics: {},
  customMetricEntries: {},
  challenges: {},
  journal: {},
  board: {},
  restDays: {},
  // Career domain
  roadmaps: {},
  careerSkills: {},
  courses: {},
  contacts: {},
  applications: {},
  companies: {},
  questions: {},
  careerAchievements: {},
  projects: {},
  resumes: {},
  bullets: {},
  testimonials: {},
  days: {},
  meetings: {},
  timeline: {},
  satisfaction: {},
  burnoutChecks: {},
  sabbaticals: {},
  sideHustles: {},
  ip: {},
  speaking: {},
  visionBoard: {},
  tracks: {},
  careerGoals: {},
  careerNotes: {},
  // Forge (Projects space) domain
  forgeProjects: {},
  forgeTasks: {},
  forgeScratch: {},
  forgeDecisions: {},
  forgeSwot: {},
  forgeProsCons: {},
  forgeScenarios: {},
  forgeFiveWhys: {},
  forgeLessons: {},
  forgeRetros: {},
  forgeParking: {},
  forgePomodoros: {},
  forgePersonas: {},
  forgeDecisionMatrix: {},
  forgeIdeas: {},
  forgeFishbones: {},
  forgeSixHats: {},
  forgeScamper: {},
  forgeSprints: {},
  forgeReviews: {},
  forgeMindmaps: {},
  forgeCanvases: {},
  forgeVoiceNotes: {},
  forgeBmc: {},
  forgeVpc: {},
  forgeLean: {},
  forgePorter: {},
  forgePestel: {},
  forgeUserStories: {},
  forgeEventStorms: {},
  forgeJourneyMaps: {},
  forgeBlueprints: {},
  forgeWireframes: {},
  forgeBuyAFeature: {},
  forgePaired: {},
  forgeAffinity: {},
  forgeCustomStatuses: {},
  forgeAuditLog: {},
  // Health (VITAL-SIGN) domain
  healthScores: {},
  healthMeals: {},
  healthNutrients: {},
  healthRecipes: {},
  healthMealPlan: {},
  healthRestaurantMeals: {},
  healthWater: {},
  healthSleep: {},
  healthNaps: {},
  healthUrineChecks: {},
  healthMeasurements: {},
  healthPhotos: {},
  healthSupplementDefs: {},
  healthSupplementLog: {},
  healthVitals: {},
  healthMind: {},
  healthSymptoms: {},
  healthIllnesses: {},
  healthInjuries: {},
  healthMedications: {},
  healthAllergies: {},
  healthOrthostatic: {},
  healthJournal: {},
  healthCircadian: {},
  healthSunlight: {},
};

// Singleton documents (single JSON object, GET/PUT semantics).
const singletons: Record<string, Row | null> = {
  forgeStreak: null,     // ForgeState.streak
  forgeSettings: null,   // ForgeState.settings
  healthProfile: null,   // HealthState.profile
  healthSettings: null,  // HealthState.settings
  bedtimeRoutine: null,  // HealthState.bedtimeRoutine
  wakeRoutine: null,     // HealthState.wakeRoutine
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);

// ---------------- Generic handlers ----------------
const list = (table: string) => (_req: Request, res: Response) => res.json(Object.values(db[table]));
const get = (table: string) => (req: Request, res: Response) => {
  const r = db[table][req.params.id];
  if (!r) return res.status(404).json({ error: "not found" });
  return res.json(r);
};
const create = (table: string) => (req: Request, res: Response) => {
  const id = req.body?.id ?? uid();
  const row = { ...req.body, id, createdAt: req.body?.createdAt ?? Date.now() };
  db[table][id] = row;
  return res.status(201).json(row);
};
const patch = (table: string) => (req: Request, res: Response) => {
  const r = db[table][req.params.id];
  if (!r) return res.status(404).json({ error: "not found" });
  db[table][req.params.id] = { ...r, ...req.body, id: r.id };
  return res.json(db[table][req.params.id]);
};
const del = (table: string) => (req: Request, res: Response) => {
  if (!db[table][req.params.id]) return res.status(404).json({ error: "not found" });
  delete db[table][req.params.id];
  return res.status(204).end();
};

// Singleton GET / PUT
const getSingleton = (key: string) => (_req: Request, res: Response) => {
  if (singletons[key] == null) return res.status(404).json({ error: "not set" });
  res.json(singletons[key]);
};
const putSingleton = (key: string) => (req: Request, res: Response) => {
  singletons[key] = { ...(singletons[key] ?? {}), ...(req.body ?? {}) };
  res.json(singletons[key]);
};

// ---------------- Session-specific routes (Workout) ----------------

// Start a new session
app.post("/api/sessions", (req, res) => {
  const id = uid();
  const { name, routineId, readinessScore } = req.body;
  const row = {
    id, name, routineId, readinessScore,
    date: today(), startedAt: Date.now(), sets: [], totalVolumeKg: 0,
  };
  db.sessions[id] = row;
  res.status(201).json(row);
});

// Log a set (adds to sets array, recomputes total volume)
app.post("/api/sessions/:id/sets", (req, res) => {
  const s = db.sessions[req.params.id];
  if (!s) return res.status(404).json({ error: "session not found" });
  const set = { ...req.body, id: uid() };
  s.sets.push(set);
  s.totalVolumeKg = s.sets.reduce((n: number, x: any) => n + ((x.weight ?? 0) * (x.value ?? 0)), 0);
  res.json(s);
});

// Finish session (sets endedAt + duration)
app.patch("/api/sessions/:id/finish", (req, res) => {
  const s = db.sessions[req.params.id];
  if (!s) return res.status(404).json({ error: "not found" });
  s.endedAt = Date.now();
  s.durationSeconds = Math.round((s.endedAt - s.startedAt) / 1000);
  res.json(s);
});

// ---------------- Sync (entire state push / pull) ----------------
app.get("/api/sync", (_req, res) => res.json({ tables: db, singletons }));
app.post("/api/sync", (req, res) => {
  const incoming = req.body ?? {};
  const tables = incoming.tables ?? incoming; // accept both wrapped and legacy flat shape
  for (const table of Object.keys(db)) {
    const t = tables[table];
    if (t && typeof t === "object") {
      const asObj: Record<string, Row> = {};
      const rows: Row[] = Array.isArray(t) ? t : (Object.values(t) as Row[]);
      for (const row of rows) {
        if (row && row.id) asObj[row.id] = row;
      }
      db[table] = asObj;
    }
  }
  if (incoming.singletons && typeof incoming.singletons === "object") {
    for (const key of Object.keys(singletons)) {
      if (incoming.singletons[key] != null) singletons[key] = incoming.singletons[key];
    }
  }
  res.json({ ok: true });
});

// ---------------- Specialized query endpoints ----------------

// Exercises filtered by muscle group / equipment
app.get("/api/exercises/by-muscle/:muscle", (req, res) => {
  const m = req.params.muscle;
  const out = Object.values(db.exercises).filter((e: any) =>
    e.muscleGroup === m || (e.secondaryMuscles ?? []).includes(m),
  );
  res.json(out);
});

// CSV export — same format the frontend writes
app.get("/api/export/csv", (_req, res) => {
  const rows = [["type","date","name","set","value","unit","weight_kg","rir","rpe","duration_s","volume_kg","notes"]];
  const exById = db.exercises as Record<string, any>;
  for (const s of Object.values(db.sessions) as any[]) {
    if (!s.endedAt) continue;
    const routine = s.routineId ? (db.routines[s.routineId] as any) : null;
    const adHoc = (s.adHocBlocks ?? []) as any[];
    const blockMap = new Map<string, any>();
    if (routine) for (const b of routine.blocks ?? []) blockMap.set(b.id, b);
    for (const b of adHoc) blockMap.set(b.id, b);
    for (const set of s.sets ?? []) {
      const block = blockMap.get(set.blockId);
      const ex = block?.exerciseId ? exById[block.exerciseId] : null;
      rows.push(["strength", s.date, ex?.name ?? s.name, String(set.setIndex ?? ""),
        String(set.value ?? ""), ex?.unit ?? "reps",
        set.weight != null ? String(set.weight) : "",
        set.rir != null ? String(set.rir) : "", set.rpe != null ? String(set.rpe) : "",
        set.durationSeconds != null ? String(set.durationSeconds) : "",
        String((set.weight ?? 0) * (set.value ?? 0)), set.notes ?? ""]);
    }
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="kaizen-${today()}.csv"`);
  res.send(csv);
});

// ---------------- Workout analytics (mirror of frontend algorithms) ----------------

// Epley 1RM
const epley = (w: number, r: number) => r <= 1 ? w : w * (1 + r / 30);

app.get("/api/analytics/1rm/:exerciseId", (req, res) => {
  const { exerciseId } = req.params;
  let best = 0;
  for (const s of Object.values(db.sessions) as any[]) {
    if (!s.endedAt) continue;
    for (const set of s.sets ?? []) {
      if (set.blockId !== exerciseId || set.isWarmup) continue;
      if (set.weight && set.value) best = Math.max(best, epley(set.weight, set.value));
    }
  }
  res.json({ exerciseId, oneRM: Math.round(best * 10) / 10 });
});

app.get("/api/analytics/weekly-stats", (_req, res) => {
  const cutoff = Date.now() - 7 * 86400000;
  let workouts = 0, volume = 0, minutes = 0, intensityN = 0, intensityD = 0;
  for (const s of Object.values(db.sessions) as any[]) {
    if (!s.endedAt || s.startedAt < cutoff) continue;
    workouts++;
    volume += s.totalVolumeKg ?? 0;
    minutes += (s.durationSeconds ?? 0) / 60;
    for (const set of s.sets ?? []) {
      if (set.isWarmup || !set.weight) continue;
      intensityN += 1 / (1 + (set.value ?? 0) / 30);
      intensityD++;
    }
  }
  res.json({
    workouts,
    volumeKg: Math.round(volume),
    minutes: Math.round(minutes),
    avgIntensity: intensityD ? +(intensityN / intensityD).toFixed(2) : 0,
  });
});

app.get("/api/analytics/streak", (_req, res) => {
  const days = new Set(
    (Object.values(db.sessions) as any[])
      .filter((s) => s.endedAt)
      .map((s) => new Date(s.startedAt).toISOString().slice(0, 10)),
  );
  let current = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const iso = new Date(d); iso.setDate(d.getDate() - i);
    if (days.has(iso.toISOString().slice(0, 10))) current++;
    else if (i > 0) break;
  }
  res.json({ current, longest: current /* simplified */ });
});

// ---------------- Health analytics (mirror of frontend/lib/healthAnalytics.ts) ----------------
// Pure formulas re-implemented server-side. Docs: docs/ALGORITHMS.md §H1-H23.

const bmrMifflin = (weightKg: number, heightCm: number, ageYears: number, gender = "male") =>
  10 * weightKg + 6.25 * heightCm - 5 * ageYears + (gender === "male" ? 5 : -161);
const bmrKatch = (lbmKg: number) => 370 + 21.6 * lbmKg;
const ACTIVITY_MULT: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9,
};
const log10 = (x: number) => Math.log(x) / Math.LN10;
const navyBF_m = (waistCm: number, neckCm: number, heightCm: number) =>
  495 / (1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)) - 450;
const navyBF_f = (waistCm: number, neckCm: number, hipCm: number, heightCm: number) =>
  495 / (1.29579 - 0.35004 * log10(waistCm + hipCm - neckCm) + 0.22100 * log10(heightCm)) - 450;

// GET /api/health/analytics/bmr?weight=70&height=175&age=20&gender=male[&bf=15]
app.get("/api/health/analytics/bmr", (req, res) => {
  const weight = Number(req.query.weight), height = Number(req.query.height), age = Number(req.query.age);
  const gender = String(req.query.gender ?? "male");
  const bf = req.query.bf != null ? Number(req.query.bf) : null;
  if (!weight || !height || !age) return res.status(400).json({ error: "weight, height, age required" });
  const mifflin = bmrMifflin(weight, height, age, gender);
  const katch = bf != null && bf > 0 && bf < 60 ? bmrKatch(weight * (1 - bf / 100)) : null;
  res.json({ mifflin: Math.round(mifflin), katch: katch != null ? Math.round(katch) : null });
});

// GET /api/health/analytics/tdee?weight=70&height=175&age=20&activity=moderate[&gender=male]
app.get("/api/health/analytics/tdee", (req, res) => {
  const weight = Number(req.query.weight), height = Number(req.query.height), age = Number(req.query.age);
  const activity = String(req.query.activity ?? "moderate");
  const gender = String(req.query.gender ?? "male");
  if (!weight || !height || !age) return res.status(400).json({ error: "weight, height, age required" });
  const mult = ACTIVITY_MULT[activity] ?? 1.55;
  res.json({ tdee: Math.round(bmrMifflin(weight, height, age, gender) * mult), activityMult: mult });
});

// GET /api/health/analytics/water-goal?weight=70[&climateMult=1.1][&workoutMl=500]
app.get("/api/health/analytics/water-goal", (req, res) => {
  const weight = Number(req.query.weight);
  if (!weight) return res.status(400).json({ error: "weight required" });
  const climateMult = Number(req.query.climateMult ?? 1.1);
  const workoutMl = Number(req.query.workoutMl ?? 0);
  res.json({ goalMl: Math.round(weight * 35 * climateMult + workoutMl) });
});

// GET /api/health/analytics/navy-bf?waist=80&neck=38&height=175[&gender=male][&hip=95]
app.get("/api/health/analytics/navy-bf", (req, res) => {
  const waist = Number(req.query.waist), neck = Number(req.query.neck), height = Number(req.query.height);
  const gender = String(req.query.gender ?? "male");
  if (!waist || !neck || !height) return res.status(400).json({ error: "waist, neck, height required" });
  if (gender === "female") {
    const hip = Number(req.query.hip);
    if (!hip) return res.status(400).json({ error: "hip required for female" });
    return res.json({ bfPct: +navyBF_f(waist, neck, hip, height).toFixed(1) });
  }
  if (waist - neck <= 0) return res.status(400).json({ error: "waist must exceed neck" });
  res.json({ bfPct: +navyBF_m(waist, neck, height).toFixed(1) });
});

// GET /api/health/analytics/sleep-bank?ideal=8 — computed over stored healthSleep rows (last 14)
app.get("/api/health/analytics/sleep-bank", (req, res) => {
  const ideal = Number(req.query.ideal ?? 8);
  const entries = (Object.values(db.healthSleep) as any[])
    .filter((e) => e.bedIso && e.wakeIso)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-14);
  let bank = 0;
  for (const e of entries) {
    const h = (new Date(e.wakeIso).getTime() - new Date(e.bedIso).getTime()) / 3_600_000;
    if (h <= 0 || h > 24) continue;
    const delta = h - ideal;
    bank += delta > 0 ? Math.min(delta * 0.5, 1) : delta; // 0.5× credit, cap +1h/night
  }
  bank = Math.max(-20, Math.min(10, bank));
  res.json({ bankHours: +bank.toFixed(1), nights: entries.length, ideal });
});

// GET /api/health/analytics/daily-summary?date=YYYY-MM-DD — kcal/protein/water/sleep/supps for one day
app.get("/api/health/analytics/daily-summary", (req, res) => {
  const date = String(req.query.date ?? today());
  const meals = (Object.values(db.healthMeals) as any[]).filter((m) => m.date === date);
  let kcal = 0, proteinG = 0, carbsG = 0, fatG = 0;
  for (const m of meals) for (const it of m.items ?? []) {
    kcal += it.kcal ?? 0; proteinG += it.proteinG ?? 0; carbsG += it.carbsG ?? 0; fatG += it.fatG ?? 0;
  }
  const water = (Object.values(db.healthWater) as any[]).filter((w) => w.date === date);
  const waterMl = water.reduce((n, w) => n + (w.ml ?? 0), 0);
  const caffeineMg = water.reduce((n, w) => n + (w.caffeineMg ?? 0), 0);
  const sleep = (Object.values(db.healthSleep) as any[]).find((s) => s.date === date);
  const sleepH = sleep?.bedIso && sleep?.wakeIso
    ? +(((new Date(sleep.wakeIso).getTime() - new Date(sleep.bedIso).getTime()) / 3_600_000).toFixed(1))
    : null;
  const suppsTaken = (Object.values(db.healthSupplementLog) as any[]).filter((l) => l.date === date).length;
  res.json({ date, kcal, proteinG, carbsG, fatG, waterMl, caffeineMg, sleepH, suppsTaken, mealCount: meals.length });
});

// GET /api/health/export/csv — daily summaries for every date with any health data
app.get("/api/health/export/csv", (_req, res) => {
  const dates = new Set<string>();
  for (const t of ["healthMeals", "healthWater", "healthSleep", "healthSupplementLog", "healthVitals", "healthMind"]) {
    for (const r of Object.values(db[t]) as any[]) if (r.date) dates.add(r.date);
  }
  const rows = [["date","kcal","protein_g","carbs_g","fat_g","water_ml","caffeine_mg","sleep_h","supps_taken","meals"]];
  for (const date of [...dates].sort()) {
    const meals = (Object.values(db.healthMeals) as any[]).filter((m) => m.date === date);
    let kcal = 0, p = 0, c = 0, f = 0;
    for (const m of meals) for (const it of m.items ?? []) {
      kcal += it.kcal ?? 0; p += it.proteinG ?? 0; c += it.carbsG ?? 0; f += it.fatG ?? 0;
    }
    const water = (Object.values(db.healthWater) as any[]).filter((w) => w.date === date);
    const sleep = (Object.values(db.healthSleep) as any[]).find((s) => s.date === date);
    const sleepH = sleep?.bedIso && sleep?.wakeIso
      ? ((new Date(sleep.wakeIso).getTime() - new Date(sleep.bedIso).getTime()) / 3_600_000).toFixed(1) : "";
    rows.push([date, String(kcal), String(Math.round(p)), String(Math.round(c)), String(Math.round(f)),
      String(water.reduce((n, w) => n + (w.ml ?? 0), 0)),
      String(water.reduce((n, w) => n + (w.caffeineMg ?? 0), 0)),
      sleepH,
      String((Object.values(db.healthSupplementLog) as any[]).filter((l) => l.date === date).length),
      String(meals.length)]);
  }
  const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="kaizen-health-${today()}.csv"`);
  res.send(csv);
});

// ---------------- Forge analytics ----------------

// GET /api/forge/analytics/summary — project/task counts by status
app.get("/api/forge/analytics/summary", (_req, res) => {
  const tasks = Object.values(db.forgeTasks) as any[];
  const byStatus: Record<string, number> = {};
  for (const t of tasks) byStatus[t.status ?? "unknown"] = (byStatus[t.status ?? "unknown"] ?? 0) + 1;
  res.json({
    projects: Object.keys(db.forgeProjects).length,
    tasks: tasks.length,
    byStatus,
    sprints: Object.keys(db.forgeSprints).length,
    ideas: Object.keys(db.forgeIdeas).length,
  });
});

// ---------------- Generic CRUD routes ----------------
const CRUD: [string, string][] = [
  // Core
  ["tasks", "/core/tasks"],
  ["notes", "/core/notes"],
  // Workout
  ["exercises", "/exercises"],
  ["prs", "/prs"],
  ["skills", "/skills"],
  ["routines", "/routines"],
  ["readiness", "/readiness"],
  ["badges", "/badges"],
  ["bodyweight", "/bodyweight"],
  ["caliChains", "/cali/chains"],
  ["caliSkills", "/cali/skills"],
  ["caliFlows", "/cali/flows"],
  ["gtg", "/cali/gtg"],
  ["isometricLogs", "/cali/iso"],
  ["intervalLogs", "/cali/intervals"],
  ["mobilityDrills", "/cali/mobility/drills"],
  ["mobilitySessions", "/cali/mobility/sessions"],
  ["plancheEntries", "/cali/planche"],
  ["cardioLogs", "/cardio"],
  ["programs", "/programs"],
  ["goals", "/goals"],
  ["customMetrics", "/custom-metrics"],
  ["customMetricEntries", "/custom-metric-entries"],
  ["challenges", "/challenges"],
  ["journal", "/journal"],
  ["board", "/board"],
  ["restDays", "/rest-days"],
  // Career
  ["roadmaps",          "/career/roadmaps"],
  ["careerSkills",      "/career/skills"],
  ["courses",           "/career/courses"],
  ["contacts",          "/career/contacts"],
  ["applications",      "/career/applications"],
  ["companies",         "/career/companies"],
  ["questions",         "/career/questions"],
  ["careerAchievements","/career/achievements"],
  ["projects",          "/career/projects"],
  ["resumes",           "/career/resumes"],
  ["bullets",           "/career/bullets"],
  ["testimonials",      "/career/testimonials"],
  ["days",              "/career/days"],
  ["meetings",          "/career/meetings"],
  ["timeline",          "/career/timeline"],
  ["satisfaction",      "/career/satisfaction"],
  ["burnoutChecks",     "/career/burnout"],
  ["sabbaticals",       "/career/sabbaticals"],
  ["sideHustles",       "/career/side-hustles"],
  ["ip",                "/career/ip"],
  ["speaking",          "/career/speaking"],
  ["visionBoard",       "/career/vision-board"],
  ["tracks",            "/career/tracks"],
  ["careerGoals",       "/career/goals"],
  ["careerNotes",       "/career/notes"],
  // Forge (Projects space)
  ["forgeProjects",       "/forge/projects"],
  ["forgeTasks",          "/forge/tasks"],
  ["forgeScratch",        "/forge/scratch"],
  ["forgeDecisions",      "/forge/decisions"],
  ["forgeSwot",           "/forge/swot"],
  ["forgeProsCons",       "/forge/pros-cons"],
  ["forgeScenarios",      "/forge/scenarios"],
  ["forgeFiveWhys",       "/forge/five-whys"],
  ["forgeLessons",        "/forge/lessons"],
  ["forgeRetros",         "/forge/retros"],
  ["forgeParking",        "/forge/parking"],
  ["forgePomodoros",      "/forge/pomodoros"],
  ["forgePersonas",       "/forge/personas"],
  ["forgeDecisionMatrix", "/forge/decision-matrix"],
  ["forgeIdeas",          "/forge/ideas"],
  ["forgeFishbones",      "/forge/fishbones"],
  ["forgeSixHats",        "/forge/six-hats"],
  ["forgeScamper",        "/forge/scamper"],
  ["forgeSprints",        "/forge/sprints"],
  ["forgeReviews",        "/forge/reviews"],
  ["forgeMindmaps",       "/forge/mindmaps"],
  ["forgeCanvases",       "/forge/canvases"],
  ["forgeVoiceNotes",     "/forge/voice-notes"],
  ["forgeBmc",            "/forge/bmc"],
  ["forgeVpc",            "/forge/vpc"],
  ["forgeLean",           "/forge/lean"],
  ["forgePorter",         "/forge/porter"],
  ["forgePestel",         "/forge/pestel"],
  ["forgeUserStories",    "/forge/user-stories"],
  ["forgeEventStorms",    "/forge/event-storms"],
  ["forgeJourneyMaps",    "/forge/journey-maps"],
  ["forgeBlueprints",     "/forge/blueprints"],
  ["forgeWireframes",     "/forge/wireframes"],
  ["forgeBuyAFeature",    "/forge/buy-a-feature"],
  ["forgePaired",         "/forge/paired"],
  ["forgeAffinity",       "/forge/affinity"],
  ["forgeCustomStatuses", "/forge/custom-statuses"],
  ["forgeAuditLog",       "/forge/audit-log"],
  // Health (VITAL-SIGN)
  ["healthScores",         "/health/scores"],
  ["healthMeals",          "/health/meals"],
  ["healthNutrients",      "/health/nutrients"],
  ["healthRecipes",        "/health/recipes"],
  ["healthMealPlan",       "/health/meal-plan"],
  ["healthRestaurantMeals","/health/restaurant-meals"],
  ["healthWater",          "/health/water"],
  ["healthSleep",          "/health/sleep"],
  ["healthNaps",           "/health/naps"],
  ["healthUrineChecks",    "/health/urine-checks"],
  ["healthMeasurements",   "/health/measurements"],
  ["healthPhotos",         "/health/photos"],
  ["healthSupplementDefs", "/health/supplement-defs"],
  ["healthSupplementLog",  "/health/supplement-log"],
  ["healthVitals",         "/health/vitals"],
  ["healthMind",           "/health/mind"],
  ["healthSymptoms",       "/health/symptoms"],
  ["healthIllnesses",      "/health/illnesses"],
  ["healthInjuries",       "/health/injuries"],
  ["healthMedications",    "/health/medications"],
  ["healthAllergies",      "/health/allergies"],
  ["healthOrthostatic",    "/health/orthostatic"],
  ["healthJournal",        "/health/journal"],
  ["healthCircadian",      "/health/circadian"],
  ["healthSunlight",       "/health/sunlight"],
];
for (const [table, path] of CRUD) {
  const full = `/api${path}`;
  app.get(full, list(table));
  app.post(full, create(table));
  app.get(`${full}/:id`, get(table));
  app.patch(`${full}/:id`, patch(table));
  app.delete(`${full}/:id`, del(table));
}

// ---------------- Singleton routes ----------------
const SINGLETONS: [string, string][] = [
  ["forgeStreak",    "/forge/streak"],
  ["forgeSettings",  "/forge/settings"],
  ["healthProfile",  "/health/profile"],
  ["healthSettings", "/health/settings"],
  ["bedtimeRoutine", "/health/bedtime-routine"],
  ["wakeRoutine",    "/health/wake-routine"],
];
for (const [key, path] of SINGLETONS) {
  const full = `/api${path}`;
  app.get(full, getSingleton(key));
  app.put(full, putSingleton(key));
}

// Patch/discard/finish session
app.patch("/api/sessions/:id", patch("sessions"));
app.delete("/api/sessions/:id", del("sessions"));
app.get("/api/sessions", list("sessions"));
app.get("/api/sessions/:id", get("sessions"));

// ---------------- Health check ----------------
app.get("/api/health-check", (_req, res) => res.json({
  ok: true, time: Date.now(),
  tables: Object.keys(db).length,
  singletons: Object.keys(singletons).length,
}));
// Legacy alias (pre-Health-space name; kept for compatibility)
app.get("/api/health", (_req, res) => res.json({ ok: true, time: Date.now() }));

// ---------------- Error handler ----------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = parseInt(process.env.PORT ?? "4000", 10);
app.listen(PORT, () => {
  console.log(`[kaizen-backend] listening on http://localhost:${PORT}`);
});
