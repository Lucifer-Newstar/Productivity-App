"use client";

/**
 * WorkoutCharts — pure-SVG analytics dashboard.
 *
 * Every chart here uses hand-rolled SVG (no chart libraries) so we stay
 * dependency-light. Pulls data straight from useStore() and renders:
 *  1. Weekly volume trend (12 weeks, filled area)
 *  2. Muscle-group volume donut (last 14 days)
 *  3. Session-frequency weekday bar chart
 *  4. Session-duration histogram
 *  5. RPE distribution strip
 *  6. Bodyweight line (90 days)
 *  7. PR progression sparkline grid (one per PR)
 *  8. Workout type split (strength/cardio/cali/rest) donut
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Activity, Scale, Clock, Gauge,
  Flame, Award, PieChart,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { MUSCLE_GROUPS } from "../../lib/types";
import type { MuscleGroup } from "../../lib/types";
import { epley1RM } from "../../lib/workoutAnalytics";

const DAY_MS = 86_400_000;
const PALETTE = ["#ec4899","#8b5cf6","#06b6d4","#a3e635","#f59e0b","#f43f5e","#22d3ee","#fb923c","#84cc16","#e879f9"];

export default function WorkoutCharts() {
  const { workout } = useStore();
  const sessions = useMemo(() => workout.sessions.filter((s) => s.endedAt), [workout.sessions]);

  // Weekly volume (12 weeks)
  const weeklyVol = useMemo(() => {
    const out: { label: string; vol: number }[] = [];
    const now = Date.now();
    for (let i = 11; i >= 0; i--) {
      const end = now - i * 7 * DAY_MS;
      const start = end - 7 * DAY_MS;
      const vol = sessions
        .filter((s) => s.startedAt >= start && s.startedAt < end)
        .reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
      const d = new Date(start);
      out.push({ label: `${d.getMonth()+1}/${d.getDate()}`, vol: Math.round(vol) });
    }
    return out;
  }, [sessions]);

  // Muscle-group volume donut (last 14 days)
  const muscleVol = useMemo(() => {
    const start = Date.now() - 14 * DAY_MS;
    const byMuscle: Record<string, number> = {};
    sessions.filter((s) => s.startedAt >= start).forEach((s) => {
      s.sets.forEach((set) => {
        if (!set.weight || !set.completed) return;
        // Resolve block → exercise → muscle group
        let muscle: MuscleGroup | undefined;
        for (const r of workout.routines) {
          const b = r.blocks.find((bb) => bb.id === set.blockId);
          if (b?.exerciseId) {
            const ex = workout.exercises.find((e) => e.id === b.exerciseId);
            if (ex?.muscleGroup) muscle = ex.muscleGroup;
            break;
          }
        }
        if (!muscle) {
          for (const sess of workout.sessions) {
            const b = sess.adHocBlocks?.find((bb) => bb.id === set.blockId);
            if (b?.exerciseId) {
              const ex = workout.exercises.find((e) => e.id === b.exerciseId);
              if (ex?.muscleGroup) muscle = ex.muscleGroup;
              break;
            }
          }
        }
        if (muscle) byMuscle[muscle] = (byMuscle[muscle] ?? 0) + set.weight * set.value;
      });
    });
    return Object.entries(byMuscle)
      .map(([id, v]) => {
        const m = MUSCLE_GROUPS.find((g) => g.id === id);
        return { id, label: m?.label ?? id, color: m?.color ?? "#8b5cf6", v: Math.round(v) };
      })
      .sort((a, b) => b.v - a.v);
  }, [sessions, workout]);

  // Weekday frequency
  const weekdayFreq = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const out = days.map((d) => ({ d, n: 0 }));
    sessions.forEach((s) => {
      const idx = new Date(s.startedAt).getDay();
      out[idx].n++;
    });
    return out;
  }, [sessions]);

  // Duration histogram (buckets 0-20, 20-40, ..., 90+)
  const durationHist = useMemo(() => {
    const buckets = [0,0,0,0,0,0];
    sessions.forEach((s) => {
      if (!s.durationSeconds) return;
      const m = s.durationSeconds / 60;
      const b = Math.min(5, Math.floor(m / 20));
      buckets[b]++;
    });
    return [
      { label: "<20m", n: buckets[0] },
      { label: "20-40", n: buckets[1] },
      { label: "40-60", n: buckets[2] },
      { label: "60-80", n: buckets[3] },
      { label: "80-100", n: buckets[4] },
      { label: "100+", n: buckets[5] },
    ];
  }, [sessions]);

  // RPE distribution (sets with rpe 6..10)
  const rpeDist = useMemo(() => {
    const out = [0,0,0,0,0]; // 6,7,8,9,10
    sessions.forEach((s) => s.sets.forEach((set) => {
      if (set.rpe && set.rpe >= 6 && set.rpe <= 10) out[set.rpe - 6]++;
    }));
    return out.map((n, i) => ({ rpe: 6 + i, n }));
  }, [sessions]);

  // Bodyweight trend (90 days)
  const bwLine = useMemo(() => {
    const pts = [...workout.bodyweight].sort((a,b) => a.date.localeCompare(b.date));
    return pts.slice(-90);
  }, [workout.bodyweight]);

  // Workout type split (strength/cardio/rest)
  const typeSplit = useMemo(() => {
    const s = sessions.filter((x) => x.endedAt);
    const strength = s.filter((x) => x.sets.length > 0).length;
    const cardio = workout.cardioLogs.length;
    const rests = workout.restDays.length;
    const total = strength + cardio + rests || 1;
    return [
      { label: "Strength", n: strength, color: "#ec4899" },
      { label: "Cardio",   n: cardio,   color: "#06b6d4" },
      { label: "Rest",     n: rests,    color: "#8b5cf6" },
    ].map((x) => ({ ...x, pct: Math.round((x.n / total) * 100) }));
  }, [sessions, workout]);

  // PR sparklines (estimated 1RM over time for PRs with history)
  const prSpark = useMemo(() => {
    return workout.prs.slice(0, 6).map((p) => {
      const ex = workout.exercises.find((e) => e.id === p.exerciseId);
      const hist = p.history.slice().sort((a,b) => a.date.localeCompare(b.date)).slice(-12);
      return {
        id: p.id, name: ex?.name ?? "PR", color: ex?.muscleGroup
          ? (MUSCLE_GROUPS.find(m => m.id === ex.muscleGroup)?.color ?? "#8b5cf6")
          : "#8b5cf6",
        value: p.value, reps: p.reps, unit: ex?.unit ?? "reps",
        points: hist.map((h) => ({ date: h.date, v: ex?.unit === "kg" ? epley1RM(h.value, h.reps ?? 5) : h.value })),
      };
    });
  }, [workout.prs, workout.exercises]);

  // Totals
  const totals = useMemo(() => {
    const totalVol = sessions.reduce((n, s) => n + (s.totalVolumeKg ?? 0), 0);
    const totalMin = sessions.reduce((n, s) => n + ((s.durationSeconds ?? 0) / 60), 0);
    return {
      sessions: sessions.length,
      volume: Math.round(totalVol),
      minutes: Math.round(totalMin),
      prs: workout.prs.length,
    };
  }, [sessions, workout.prs]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-3xl font-jp font-bold flex items-center gap-3">
            <BarChart3 size={24} style={{ color: "#d4af37", filter: "drop-shadow(0 0 8px rgba(212,175,55,0.5))" }} />
            <span className="gold-text">Charts</span>
            <span className="jp-stamp text-[11px] animate-[sealStamp_0.6s_ease-out_both]">統計</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Progress analytics — pure-SVG, no external chart libs.</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<Flame size={16} className="text-pink-400" />} label="Sessions" value={totals.sessions} />
        <KPI icon={<TrendingUp size={16} className="text-lime-400" />} label="Total volume" value={`${totals.volume.toLocaleString()} kg`} />
        <KPI icon={<Clock size={16} className="text-cyan-400" />} label="Total minutes" value={totals.minutes} />
        <KPI icon={<Award size={16} className="text-amber-400" />} label="PRs logged" value={totals.prs} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Weekly volume (12 weeks)" icon={<TrendingUp size={15} className="text-cyan-400" />}>
          <AreaChart data={weeklyVol} w={460} h={160} color="#06b6d4" />
        </Card>

        <Card title="Muscle volume (last 2 weeks)" icon={<PieChart size={15} className="text-violet-400" />}>
          {muscleVol.length === 0
            ? <EmptyText text="No strength sets logged yet." />
            : <Donut data={muscleVol} w={260} h={200} />}
        </Card>

        <Card title="Session frequency by weekday" icon={<Activity size={15} className="text-pink-400" />}>
          <BarChart data={weekdayFreq.map(d => ({ label: d.d, v: d.n }))} w={460} h={160} color="#ec4899" />
        </Card>

        <Card title="Session duration" icon={<Clock size={15} className="text-amber-400" />}>
          <BarChart data={durationHist.map(d => ({ label: d.label, v: d.n }))} w={460} h={160} color="#f59e0b" />
        </Card>

        <Card title="RPE distribution" icon={<Gauge size={15} className="text-lime-400" />}>
          <div className="flex items-end gap-2 h-32 mt-4">
            {rpeDist.map((r, i) => {
              const max = Math.max(1, ...rpeDist.map(x => x.n));
              return (
                <div key={r.rpe} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-gray-500 font-mono">{r.n || ""}</div>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(r.n/max)*100}%` }}
                    className="w-full rounded-t" style={{ background: ["#22c55e","#84cc16","#eab308","#f97316","#ef4444"][i] }} />
                  <div className="text-[10px] text-gray-400 font-bold">{r.rpe}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Workout type split" icon={<PieChart size={15} className="text-pink-400" />}>
          <div className="space-y-3 py-2">
            {typeSplit.map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{t.label}</span>
                  <span className="text-gray-500 font-mono">{t.n} · {t.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }}
                    className="h-full rounded-full" style={{ background: t.color }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Bodyweight trend (90 days)" icon={<Scale size={15} className="text-cyan-400" />}>
          {bwLine.length < 2
            ? <EmptyText text="Log bodyweight daily to see a trend." />
            : <LineChart data={bwLine.map(b => ({ label: b.date.slice(5), v: b.weightKg }))} w={460} h={160} color="#a3e635" />}
        </Card>

        <Card title="PR progression" icon={<Award size={15} className="text-amber-400" />}>
          {prSpark.length === 0
            ? <EmptyText text="Hit a PR to populate sparklines." />
            : (
            <div className="grid grid-cols-2 gap-3">
              {prSpark.map((p) => (
                <div key={p.id} className="rounded-lg bg-white/5 border border-white/5 p-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white truncate">{p.name}</span>
                    <span className="font-mono" style={{ color: p.color }}>
                      {p.unit === "kg" ? `${p.value}kg` : p.value}
                    </span>
                  </div>
                  <Sparkline points={p.points.map(x=>x.v)} color={p.color} w={200} h={40} />
                </div>
              ))}
            </div>
            )}
        </Card>
      </div>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="card-lacquer p-4 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
      {/* gold top stripe */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em]"
        style={{ color: "#d4af37" }}>
        {icon}{label}
      </div>
      <div className="text-2xl font-bold mt-1 font-jp"
        style={{
          background: "linear-gradient(135deg, #fde68a 0%, #d4af37 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
        {value}
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card-lacquer relative overflow-hidden group hover:-translate-y-0.5 transition-transform p-6">
      {/* Top gold edge */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)" }} />
      <h4 className="font-jp font-semibold mb-3 flex items-center gap-2 text-sm tracking-wide"
        style={{ color: "#fde68a" }}>
        {icon}{title}
      </h4>
      {children}
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-xs text-gray-500 text-center py-8">{text}</p>;
}

// --- Tiny chart primitives ---

function AreaChart({ data, w, h, color }: { data: { label: string; vol: number }[]; w: number; h: number; color: string }) {
  if (!data.length) return <EmptyText text="No data." />;
  const PAD = 24;
  const max = Math.max(1, ...data.map(d => d.vol));
  const step = (w - PAD * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [PAD + i * step, h - PAD - ((h - PAD*2) * d.vol / max)] as const);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L ${pts[pts.length-1][0]} ${h-PAD} L ${pts[0][0]} ${h-PAD} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id={`ac-g-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75].map((f, i) => (
        <line key={i} x1={PAD} x2={w-PAD} y1={PAD+(h-PAD*2)*f} y2={PAD+(h-PAD*2)*f} stroke="#ffffff10" strokeDasharray="3 4" />
      ))}
      <path d={area} fill={`url(#ac-g-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length-1 ? 3.5 : 2} fill={i===pts.length-1?"#ec4899":color} />)}
      {data.filter((_,i) => i%2===0 || i===data.length-1).map((d, k) => {
        const i = k*2 < data.length-1 ? k*2 : data.length-1;
        return <text key={i} x={pts[i][0]} y={h-6} textAnchor="middle" fill="#64748b" fontSize="9">{d.label}</text>;
      })}
    </svg>
  );
}

function LineChart({ data, w, h, color }: { data: { label: string; v: number }[]; w: number; h: number; color: string }) {
  if (data.length < 2) return <EmptyText text="Need 2+ points." />;
  const PAD = 24;
  const vs = data.map(d => d.v);
  const max = Math.max(...vs), min = Math.min(...vs);
  const range = Math.max(0.1, max - min);
  const step = (w - PAD*2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [PAD + i*step, h - PAD - ((d.v - min)/range) * (h - PAD*2)] as const);
  const path = pts.map((p,i)=>`${i===0?"M":"L"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {[0.25,0.5,0.75].map((f,i)=>(
        <line key={i} x1={PAD} x2={w-PAD} y1={PAD+(h-PAD*2)*f} y2={PAD+(h-PAD*2)*f} stroke="#ffffff10" strokeDasharray="3 4" />
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill={color} />)}
      <text x={PAD} y={PAD-6} fill="#a3e635" fontSize="10" className="font-mono">{max.toFixed(1)}</text>
      <text x={PAD} y={h-PAD+12} fill="#64748b" fontSize="9" className="font-mono">{min.toFixed(1)}</text>
    </svg>
  );
}

function BarChart({ data, w, h, color }: { data: { label: string; v: number }[]; w: number; h: number; color: string }) {
  const PAD = 28;
  const max = Math.max(1, ...data.map(d=>d.v));
  const bw = (w - PAD*2) / data.length - 6;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {[0.25,0.5,0.75].map((f,i)=>(
        <line key={i} x1={PAD} x2={w-PAD} y1={PAD+(h-PAD*2)*f} y2={PAD+(h-PAD*2)*f} stroke="#ffffff10" strokeDasharray="3 4" />
      ))}
      {data.map((d, i) => {
        const x = PAD + i * ((w - PAD*2)/data.length) + 3;
        const bh = ((h - PAD*2) * d.v) / max;
        const y = h - PAD - bh;
        return (
          <g key={i}>
            <motion.rect initial={{ height: 0, y: h-PAD }} animate={{ height: bh, y }}
              transition={{ duration: 0.6, delay: i * 0.04 }}
              x={x} width={bw} rx={4} fill={color} opacity={0.85} />
            <text x={x + bw/2} y={h-8} textAnchor="middle" fill="#64748b" fontSize="9">{d.label}</text>
            {d.v > 0 && <text x={x + bw/2} y={y - 4} textAnchor="middle" fill="#fff" fontSize="9" className="font-mono">{d.v}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ data, w, h }: { data: { label: string; color: string; v: number }[]; w: number; h: number }) {
  const total = data.reduce((n,d)=>n+d.v,0) || 1;
  const cx = w/2, cy = h/2, r = 70, ir = 48;
  let acc = 0;
  const segs = data.slice(0,8).map((d) => {
    const startA = (acc/total) * Math.PI * 2 - Math.PI/2;
    acc += d.v;
    const endA = (acc/total) * Math.PI * 2 - Math.PI/2;
    const large = endA - startA > Math.PI ? 1 : 0;
    const x1 = cx + r*Math.cos(startA), y1 = cy + r*Math.sin(startA);
    const x2 = cx + r*Math.cos(endA),   y2 = cy + r*Math.sin(endA);
    const xi1 = cx + ir*Math.cos(endA),  yi1 = cy + ir*Math.sin(endA);
    const xi2 = cx + ir*Math.cos(startA),yi2 = cy + ir*Math.sin(startA);
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...d, path };
  });
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0">
        {segs.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity={0.85} />)}
        <text x={cx} y={cy-4} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{Math.round(total).toLocaleString()}</text>
        <text x={cx} y={cy+11} textAnchor="middle" fill="#64748b" fontSize="9">kg vol</text>
      </svg>
      <div className="flex-1 space-y-1 min-w-[120px]">
        {data.slice(0,6).map((d,i)=>(
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            <span className="text-gray-300 flex-1">{d.label}</span>
            <span className="text-gray-500 font-mono">{Math.round((d.v/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ points, color, w, h }: { points: number[]; color: string; w: number; h: number }) {
  if (points.length < 2) return <div className="text-[10px] text-gray-600 h-10 flex items-center">—</div>;
  const max = Math.max(...points), min = Math.min(...points), range = Math.max(0.1, max-min);
  const step = w / (points.length - 1);
  const path = points.map((v, i) => {
    const x = i * step;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(points.length-1)*step} cy={h - 2 - ((points[points.length-1]-min)/range)*(h-4)} r={2.5} fill={color} />
    </svg>
  );
}
