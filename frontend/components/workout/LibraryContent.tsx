"use client";

/**
 * LibraryContent — the /workout/library page content.
 *
 * Layout:
 *   [ compact muscle heatmap (both sides, click a muscle to filter) | exercise grid ]
 *
 * Interactions:
 *   - Click a muscle region → filters the grid to exercises that target it
 *     (both primary and secondary muscles).
 *   - Hover an exercise card → the heatmap highlights that exercise's primary
 *     muscle via the `highlight` prop.
 *   - Search box + equipment/level/pattern filter chips narrow further.
 *   - "New exercise" modal lets users add their own (still persisted in store).
 *
 * The compact heatmap is small (200px wide) and positioned on the left (sticky)
 * so it stays in view while scrolling the grid.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Dumbbell, Plus, Search, Trash2, X, Filter, Target, Sparkles, History,
} from "lucide-react";
import { useStore } from "../../lib/store";
import {
  MUSCLE_GROUPS, EQUIPMENT, LEVELS, formatWorkoutValue, MUSCLE_FILTER_GROUP,
} from "../../lib/types";
import type {
  WorkoutUnit, MuscleGroup, Equipment, Level, MovementPattern, WorkoutExercise,
} from "../../lib/types";
import MuscleHeatmap from "./MuscleHeatmap";
import ExerciseHistoryDrawer from "./ExerciseHistoryDrawer";

const UNITS: { id: WorkoutUnit; label: string }[] = [
  { id: "reps",    label: "Reps" },
  { id: "seconds", label: "Timed" },
  { id: "meters",  label: "Distance" },
  { id: "kg",      label: "Weight" },
];

const PATTERNS: MovementPattern[] = [
  "Push","Pull","Squat","Hinge","Carry","Rotation","Gait","Isometric","Other",
];

const PATTERN_INFO: { id: MovementPattern; label: string; desc: string }[] = [
  { id: "Push",      label: "Push",      desc: "Pressing away from the body — bench, OHP, push-ups, dips." },
  { id: "Pull",      label: "Pull",      desc: "Pulling toward the body — rows, pull-ups, curls, face pulls." },
  { id: "Squat",     label: "Squat",     desc: "Knee-dominant knee/hip flexion — back squat, front squat, lunges." },
  { id: "Hinge",     label: "Hinge",     desc: "Hip-dominant hip flexion — deadlifts, RDLs, swings, good-mornings." },
  { id: "Carry",     label: "Carry",     desc: "Loaded locomotion — farmer, suitcase, overhead carries." },
  { id: "Rotation",  label: "Rotation",  desc: "Twist/anti-twist — Russian twists, pallof, woodchops." },
  { id: "Gait",      label: "Gait",      desc: "Walk/jog/run/shuffle patterns — cardio and agility work." },
  { id: "Isometric", label: "Isometric", desc: "Static holds — planks, wall sits, L-sit, hollow body." },
  { id: "Other",     label: "Other",     desc: "Accessories, isolation, prehab, rehab — lateral raises, curls, etc." },
];

const EMPTY_VOL: Partial<Record<MuscleGroup, number>> = {};

/** Map a detailed muscle id (e.g. "lats") → its parent group key used by filter chips. */
function parentGroup(m: MuscleGroup | undefined): MuscleGroup {
  if (!m) return "other";
  return MUSCLE_FILTER_GROUP[m] ?? m;
}

export default function LibraryContent() {
  const { workout, addExercise, deleteExercise, logPR } = useStore();
  const { exercises, prs } = workout;

  // ----- filters -----
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "all">("all");
  const [equipFilter, setEquipFilter] = useState<Equipment | "all">("all");
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
  const [patternFilter, setPatternFilter] = useState<MovementPattern | "all">("all");
  const [q, setQ] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ----- new exercise modal -----
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<WorkoutUnit>("reps");
  const [muscle, setMuscle] = useState<MuscleGroup>("chest");
  const [equipment, setEquipment] = useState<Equipment>("bodyweight");
  const [level, setLevel] = useState<Level>("beginner");
  const [cuesText, setCuesText] = useState("");

  // quick-log inputs keyed by exerciseId
  const [logValue, setLogValue] = useState<Record<string, string>>({});
  const [logReps, setLogReps] = useState<Record<string, string>>({});
  // history drawer
  const [historyFor, setHistoryFor] = useState<WorkoutExercise | null>(null);

  // ----- derive hovered highlight -----
  const hoveredExercise = hoveredId ? exercises.find((e) => e.id === hoveredId) : null;
  const highlightMuscle: MuscleGroup | null = hoveredExercise?.muscleGroup ?? null;

  // ----- filtered list -----
  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (muscleFilter !== "all") {
        const primary = parentGroup(e.muscleGroup);
        const secondaries = (e.secondaryMuscles ?? []).map(parentGroup);
        if (primary !== muscleFilter && !secondaries.includes(muscleFilter)) return false;
      }
      if (equipFilter !== "all" && e.equipment !== equipFilter) return false;
      if (levelFilter !== "all" && e.level !== levelFilter) return false;
      if (patternFilter !== "all" && e.pattern !== patternFilter) return false;
      return true;
    });
  }, [exercises, muscleFilter, equipFilter, levelFilter, patternFilter, q]);

  // ----- stats for hero -----
  const stats = useMemo(() => {
    const byEquip: Record<string, number> = {};
    const byPattern: Record<string, number> = {};
    exercises.forEach((e) => {
      if (e.equipment) byEquip[e.equipment] = (byEquip[e.equipment] ?? 0) + 1;
      if (e.pattern) byPattern[e.pattern] = (byPattern[e.pattern] ?? 0) + 1;
    });
    return { total: exercises.length, byEquip, byPattern };
  }, [exercises]);

  const getPR = (eid: string) => prs.find((p) => p.exerciseId === eid);

  // Heatmap "volume" for the compact mini-map: we don't show training volume here,
  // we just map every exercise's primary muscle to a constant so all regions are
  // visible.  The highlight/select props do the heavy lifting of feedback.
  const heatmapVolume = useMemo(() => {
    const v: Partial<Record<MuscleGroup, number>> = {};
    exercises.forEach((e) => {
      const g = parentGroup(e.muscleGroup);
      v[g] = (v[g] ?? 0) + 1; // small fill (between 0..MAX_VOL=2000) so regions are faintly visible
    });
    return v;
  }, [exercises]);

  // ----- actions -----
  function submit() {
    if (!name.trim()) return;
    const cues = cuesText.split(",").map((c) => c.trim()).filter(Boolean);
    addExercise({
      name: name.trim(),
      unit,
      muscleGroup: muscle,
      equipment,
      level,
      cues: cues.length ? cues : undefined,
    });
    setName(""); setUnit("reps"); setCuesText("");
    setEquipment("bodyweight"); setLevel("beginner");
    setShowNew(false);
  }

  function quickLog(eid: string) {
    const ex = exercises.find((e) => e.id === eid);
    if (!ex) return;
    const v = parseFloat(logValue[eid] ?? "");
    if (isNaN(v) || v <= 0) return;
    const r = ex.unit === "kg" && logReps[eid] ? parseInt(logReps[eid], 10) : undefined;
    logPR(eid, v, r);
    setLogValue((s) => ({ ...s, [eid]: "" }));
    setLogReps((s) => ({ ...s, [eid]: "" }));
  }

  function clearFilters() {
    setMuscleFilter("all"); setEquipFilter("all"); setLevelFilter("all");
    setPatternFilter("all"); setQ("");
  }

  // ----- render -----
  const hasAnyFilter =
    muscleFilter !== "all" || equipFilter !== "all" || levelFilter !== "all" ||
    patternFilter !== "all" || q !== "";

  return (
    <div className="space-y-7">
      {/* ---------- HERO ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-7 md:p-8 glass border border-white/10"
        style={{ borderColor: "#8b5cf640" }}
      >
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl">
              <BookOpen size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Exercise Library</h1>
              <p className="text-gray-400 mt-1 text-sm md:text-base">
                {stats.total} curated movements. Click a muscle on the mini-map to filter, hover a card to see what it hits.
              </p>
            </div>
          </div>
          <button onClick={() => setShowNew(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm !bg-gradient-to-r !from-violet-500 !to-fuchsia-500">
            <Plus size={15} /> New exercise
          </button>
        </div>
        <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total" value={stats.total} color="#8b5cf6" />
          <Stat label="Compound" value={stats.byPattern["Push"] + stats.byPattern["Pull"] + stats.byPattern["Squat"] + stats.byPattern["Hinge"]} color="#ec4899" />
          <Stat label="Bodyweight" value={stats.byEquip["bodyweight"] ?? 0} color="#a3e635" />
          <Stat label="Barbell" value={stats.byEquip["barbell"] ?? 0} color="#f59e0b" />
        </div>
      </motion.div>

      {/* ---------- Movement Pattern Library ---------- */}
      <div className="card">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-cyan-400" /> Movement Pattern Library
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PATTERN_INFO.map((p) => {
            const n = stats.byPattern[p.id] ?? 0;
            const active = patternFilter === p.id;
            return (
              <button key={p.id} onClick={() => setPatternFilter(active ? "all" : p.id)}
                className={`text-left p-3 rounded-lg border transition ${active
                  ? "bg-cyan-500/15 border-cyan-500/40"
                  : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{p.label}</p>
                  <span className="text-[10px] font-mono text-gray-500">{n}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- MAIN GRID: heatmap + exercises ---------- */}
      <div className="grid lg:grid-cols-[220px_1fr] gap-7">
        {/* MINI MUSCLE MAP */}
        <aside className="lg:sticky lg:top-4 self-start">
          <div className="card !p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Target size={16} style={{ color: "#8b5cf6" }} /> Muscle Map
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Click to filter · hover cards highlights here</p>
            </div>
            <div className="flex justify-center">
              <MuscleHeatmap
                volume={heatmapVolume}
                onSelect={(m) => setMuscleFilter((prev) => prev === m ? "all" : m)}
                selected={muscleFilter === "all" ? null : muscleFilter}
                compact
                highlight={highlightMuscle}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Quick filter</p>
              <div className="grid grid-cols-2 gap-1.5">
                {MUSCLE_GROUPS.map((m) => (
                  <button key={m.id} onClick={() => setMuscleFilter((p) => p === m.id ? "all" : m.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${
                      muscleFilter === m.id
                        ? "text-white shadow"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                    style={muscleFilter === m.id
                      ? { background: m.color }
                      : undefined}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                    {m.label}
                  </button>
                ))}
              </div>
              {muscleFilter !== "all" && (
                <button onClick={() => setMuscleFilter("all")}
                  className="w-full mt-1 text-[11px] text-violet-300 hover:text-violet-200">
                  Clear muscle
                </button>
              )}
            </div>
          </div>

          {/* Filter chips below */}
          <div className="card !p-5 mt-4 space-y-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Filter size={16} style={{ color: "#06b6d4" }} /> Filters
              </h3>
            </div>

            <ChipGroup label="Equipment" value={equipFilter} onChange={(v) => setEquipFilter(v as Equipment | "all")}
              options={[{ id: "all", label: "Any" }, ...EQUIPMENT]} />
            <ChipGroup label="Level" value={levelFilter} onChange={(v) => setLevelFilter(v as Level | "all")}
              options={[{ id: "all", label: "Any" }, ...LEVELS]} />
            <ChipGroup label="Pattern" value={patternFilter} onChange={(v) => setPatternFilter(v as MovementPattern | "all")}
              options={[{ id: "all", label: "Any" }, ...PATTERNS.map((p) => ({ id: p, label: p }))]} />

            {hasAnyFilter && (
              <button onClick={clearFilters}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 rounded-lg transition">
                Reset all
              </button>
            )}
          </div>
        </aside>

        {/* EXERCISE GRID */}
        <div className="min-w-0 space-y-4">
          {/* search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search exercises..." className="input-base pl-11 py-3 w-full text-sm" />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-400">
              <span className="text-white font-semibold">{filtered.length}</span> exercise{filtered.length === 1 ? "" : "s"}
              {muscleFilter !== "all" && <> · <span className="text-violet-300 capitalize">{muscleFilter}</span></>}
              {equipFilter !== "all" && <> · <span className="text-cyan-300">{EQUIPMENT.find(e=>e.id===equipFilter)?.label}</span></>}
              {levelFilter !== "all" && <> · <span className="text-pink-300 capitalize">{levelFilter}</span></>}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence initial={false}>
              {filtered.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex}
                  pr={getPR(ex.id)}
                  hovered={hoveredId === ex.id}
                  onHover={(h) => setHoveredId(h ? ex.id : null)}
                  logValue={logValue[ex.id] ?? ""}
                  logReps={logReps[ex.id] ?? ""}
                  setLogValue={(v) => setLogValue((s) => ({ ...s, [ex.id]: v }))}
                  setLogReps={(v) => setLogReps((s) => ({ ...s, [ex.id]: v }))}
                  onQuickLog={() => quickLog(ex.id)}
                  onDelete={() => { if (confirm(`Delete exercise "${ex.name}"?`)) deleteExercise(ex.id); }}
                  onMuscleClick={(m) => setMuscleFilter((p) => p === m ? "all" : m)}
                  onHistory={() => setHistoryFor(ex)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl p-12 text-center border border-dashed border-white/10 text-gray-500">
              <Sparkles className="mx-auto mb-3 text-gray-600" />
              <p className="text-sm">No exercises match those filters.</p>
              <button onClick={clearFilters}
                className="mt-3 btn-ghost text-xs">Reset filters</button>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Exercise history drawer ---------- */}
      <AnimatePresence>
        {historyFor && (
          <ExerciseHistoryDrawer exercise={historyFor} onClose={() => setHistoryFor(null)} />
        )}
      </AnimatePresence>

      {/* ---------- New exercise modal ---------- */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNew(false)}>
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">New exercise</h3>
                <button onClick={() => setShowNew(false)} className="p-1.5 rounded hover:bg-white/10 text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Exercise name"
                className="input-base w-full mb-4"
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />

              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Unit</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {UNITS.map((u) => (
                  <button key={u.id} onClick={() => setUnit(u.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      unit === u.id
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}>{u.label}</button>
                ))}
              </div>

              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Muscle group</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {MUSCLE_GROUPS.map((m) => (
                  <button key={m.id} onClick={() => setMuscle(m.id)}
                    className="chip cursor-pointer transition"
                    style={muscle === m.id ? { background: m.color, color: "white" } : { background: `${m.color}20`, color: m.color }}>
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Equipment</p>
                  <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}
                    className="input-base w-full">
                    {EQUIPMENT.map((eq) => <option key={eq.id} value={eq.id}>{eq.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Level</p>
                  <select value={level} onChange={(e) => setLevel(e.target.value as Level)}
                    className="input-base w-full">
                    {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Form cues (comma-separated)</p>
              <input value={cuesText} onChange={(e) => setCuesText(e.target.value)}
                placeholder="Brace core, Elbows 45°, Drive through heels"
                className="input-base w-full mb-5" />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
                <button onClick={submit} className="btn-primary" disabled={!name.trim()}>Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- sub-components ---------- */

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-3 md:p-4 bg-white/5 border border-white/5">
      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl md:text-2xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  );
}

function ChipGroup({ label, value, onChange, options }:
  { label: string; value: string; onChange: (id: string) => void; options: { id: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`px-2 py-1 rounded-md text-[11px] transition ${
              value === o.id
                ? "bg-violet-500/80 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise: ex, pr, hovered, onHover, logValue, logReps, setLogValue, setLogReps, onQuickLog, onDelete, onMuscleClick, onHistory }: {
  exercise: WorkoutExercise;
  pr: ReturnType<typeof Object> | undefined;
  hovered: boolean;
  onHover: (h: boolean) => void;
  logValue: string; logReps: string;
  setLogValue: (v: string) => void;
  setLogReps: (v: string) => void;
  onQuickLog: () => void;
  onDelete: () => void;
  onMuscleClick: (m: MuscleGroup) => void;
  onHistory: () => void;
}) {
  const mg = ex.muscleGroup ? MUSCLE_GROUPS.find((m) => m.id === MUSCLE_FILTER_GROUP[ex.muscleGroup!] ?? ex.muscleGroup) : null;
  const accent = mg?.color ?? "#64748b";
  const secondary = ex.secondaryMuscles?.slice(0,2) ?? [];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, scale: hovered ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="card group relative overflow-hidden"
      style={{ borderColor: `${accent}35`, boxShadow: hovered ? `0 10px 40px -12px ${accent}60` : undefined }}
    >
      {/* color stripe */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-white truncate">{ex.name}</h4>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {mg && (
              <button onClick={() => onMuscleClick(mg.id as MuscleGroup)}
                className="chip text-[10px] cursor-pointer hover:opacity-80"
                style={{ background: `${accent}25`, color: accent }}>
                {mg.label}
              </button>
            )}
            {secondary.map((s) => {
              const sg = MUSCLE_GROUPS.find((m) => m.id === MUSCLE_FILTER_GROUP[s]);
              return sg ? (
                <button key={s} onClick={() => onMuscleClick(sg.id as MuscleGroup)}
                  className="chip text-[10px] cursor-pointer bg-white/5 text-gray-400 hover:text-white hover:bg-white/10">
                  + {sg.label}
                </button>
              ) : null;
            })}
            {ex.equipment && (
              <span className="chip text-[10px] bg-white/5 text-gray-400">
                {EQUIPMENT.find((e) => e.id === ex.equipment)?.label}
              </span>
            )}
            {ex.pattern && (
              <span className="chip text-[10px] bg-white/5 text-gray-400">{ex.pattern}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={onHistory} title="History"
            className="p-1.5 rounded-lg text-gray-500 hover:text-violet-300 hover:bg-violet-500/10">
            <History size={14} />
          </button>
          <button onClick={onDelete} title="Delete"
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* cues */}
      {ex.cues && ex.cues.length > 0 && (
        <ul className="mt-3 space-y-0.5">
          {ex.cues.slice(0,3).map((c, i) => (
            <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
              <Dumbbell size={10} className="mt-0.5 opacity-50 shrink-0" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}

      {/* PR */}
      <div className="mt-3 rounded-lg bg-black/20 border border-white/5 p-3">
        <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">Current PR</p>
        <p className="text-lg font-bold text-white">
          {pr
            ? formatWorkoutValue(pr.value, ex.unit) + (pr.reps && ex.unit === "kg" ? ` × ${pr.reps}` : "")
            : <span className="text-gray-500 text-sm font-normal">No PR yet</span>}
        </p>
      </div>

      {/* Quick log */}
      <form onSubmit={(e) => { e.preventDefault(); onQuickLog(); }}
        className="mt-3 flex gap-2">
        <input type="number" step="any" value={logValue}
          onChange={(e) => setLogValue(e.target.value)}
          placeholder={
            ex.unit === "kg" ? "kg" :
            ex.unit === "reps" ? "Reps" :
            ex.unit === "seconds" ? "Sec" : "m"
          }
          className="input-base flex-1 py-1.5 text-sm" />
        {ex.unit === "kg" && (
          <input type="number" value={logReps}
            onChange={(e) => setLogReps(e.target.value)}
            placeholder="×" className="input-base w-14 py-1.5 text-sm text-center" />
        )}
        <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition"
          style={{ background: accent, opacity: logValue ? 1 : 0.6 }}>
          Log
        </button>
      </form>
    </motion.div>
  );
}
