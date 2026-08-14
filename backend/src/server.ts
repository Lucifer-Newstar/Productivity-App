/**
 * Kaizen — REST API (Express, in-memory store).
 *
 * Runs on port 4000 (set via PORT env). Mirrors the frontend TypeScript
 * domain model from frontend/lib/types.ts + frontend/lib/careerTypes.ts.
 * Covers both Workout and Career domains. All routes are JSON.
 *
 * This is intentionally minimal — no database, no auth, no validation
 * library. It is designed to let the frontend sync data to a server during
 * local development and to serve as a reference for a future production
 * implementation (Postgres/Prisma, JWT auth, etc.).
 *
 * See docs/API.md for the full route reference; see docs/CAREER.md for the
 * career data model.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }));
app.use(express.json({ limit: "2mb" }));

// ---------------- In-memory store ----------------
// Simple collection of records keyed by id, with typed helpers.
type Row = Record<string, any>;
const db: Record<string, Record<string, Row>> = {
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
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);

// ---------------- Helpers ----------------
const list = (table: string) => (_req: Request, res: Response) => res.json(Object.values(db[table]));
const get = (table: string) => (req: Request, res: Response) => {
  const r = db[table][req.params.id];
  if (!r) return res.status(404).json({ error: "not found" });
  return res.json(r);
};
const create = (table: string) => (req: Request, res: Response) => {
  const id = uid();
  const row = { id, ...req.body, createdAt: Date.now() };
  db[table][id] = row;
  return res.status(201).json(row);
};
const patch = (table: string) => (req: Request, res: Response) => {
  const r = db[table][req.params.id];
  if (!r) return res.status(404).json({ error: "not found" });
  db[table][req.params.id] = { ...r, ...req.body };
  return res.json(db[table][req.params.id]);
};
const del = (table: string) => (req: Request, res: Response) => {
  if (!db[table][req.params.id]) return res.status(404).json({ error: "not found" });
  delete db[table][req.params.id];
  return res.status(204).end();
};

// ---------------- Session-specific routes ----------------

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

// Sync (entire state push / pull)
app.get("/api/sync", (_req, res) => res.json(db));
app.post("/api/sync", (req, res) => {
  const incoming = req.body ?? {};
  for (const table of Object.keys(db)) {
    if (incoming[table] && typeof incoming[table] === "object") {
      // Merge keyed by id
      const asObj: Record<string, Row> = {};
      for (const row of Object.values(incoming[table]) as Row[]) {
        if (row && row.id) asObj[row.id] = row;
      }
      db[table] = asObj;
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
    // resolve exercise from routine block, fall back to adHocBlocks
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

// ---------------- Analytics (same algorithms as frontend, simplified) ----------------

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

// ---------------- Generic CRUD routes ----------------
const CRUD: [string, string][] = [
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
  // Career CRUD
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
];
for (const [table, path] of CRUD) {
  const full = `/api${path}`;
  app.get(full, list(table));
  app.post(full, create(table));
  app.get(`${full}/:id`, get(table));
  app.patch(`${full}/:id`, patch(table));
  app.delete(`${full}/:id`, del(table));
}

// Patch/discard/finish session
app.patch("/api/sessions/:id", patch("sessions"));
app.delete("/api/sessions/:id", del("sessions"));

// ---------------- Health ----------------
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
