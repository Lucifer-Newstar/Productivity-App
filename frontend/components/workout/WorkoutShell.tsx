"use client";

/**
 * WorkoutShell — immersive full-screen chrome for all /workout/* sub-routes.
 *
 * - Left nav rail (desktop) with animated pink/violet sliding pill
 * - Bottom tab bar (mobile) with 5 primary sections
 * - Slim top strip: section title, session meta quick-toggles, theme, sounds, etc.
 * - Ambient animated mesh gradients behind content
 * - Framer-Motion AnimatePresence page transitions
 *
 * Each sub-page renders its children INSIDE this shell via <WorkoutPage>.
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Dumbbell, Flame, Trophy, Target, Calendar, Zap, Award,
  Sparkles, Play, Hand, Minimize2, Volume2, VolumeX, Sun, Moon, Bell,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";

export type WorkoutSectionId =
  | "overview" | "library" | "calisthenics" | "gym" | "cardio"
  | "pr" | "skills" | "exercises" | "schedule" | "global";

export interface WorkoutNavItem {
  id: WorkoutSectionId;
  label: string;
  icon: LucideIcon;
  color: string;
  description?: string;
  primary?: boolean; // show in mobile bottom bar
}

export const WORKOUT_NAV: WorkoutNavItem[] = [
  { id: "overview",     label: "Overview",     icon: Flame,       color: "#ec4899", description: "Today at a glance",    primary: true },
  { id: "library",      label: "Library",      icon: BookOpen,    color: "#8b5cf6", description: "Exercises & muscles", primary: true },
  { id: "calisthenics", label: "Calisthenics", icon: Target,      color: "#a3e635", description: "Bodyweight skills",   primary: true },
  { id: "gym",          label: "Gym",          icon: Dumbbell,    color: "#f59e0b", description: "Weights & plates",   primary: true },
  { id: "cardio",       label: "Cardio",       icon: Zap,         color: "#06b6d4", description: "Run, bike, row",     primary: true },
  { id: "pr",           label: "PRs",          icon: Trophy,      color: "#f59e0b", description: "Personal records" },
  { id: "skills",       label: "Skills",       icon: Award,       color: "#8b5cf6", description: "Progressions" },
  { id: "schedule",     label: "Schedule",     icon: Calendar,    color: "#06b6d4", description: "Routines & splits" },
  { id: "global",       label: "Tools",        icon: Sparkles,    color: "#ec4899", description: "Timers, journal, challenges" },
];

interface ShellProps {
  section: WorkoutSectionId;
  onSectionChange: (s: WorkoutSectionId) => void;
  onStartTodaysRoutine?: () => void;
  todaysRoutineName?: string;
  children: React.ReactNode;
}

export default function WorkoutShell({
  section, onSectionChange, onStartTodaysRoutine, todaysRoutineName, children,
}: ShellProps) {
  const { theme, toggle } = useTheme();
  const { workout, updateWorkoutSettings } = useStore();
  const router = useRouter();
  const active = WORKOUT_NAV.find((n) => n.id === section) ?? WORKOUT_NAV[0];
  const primary = WORKOUT_NAV.filter((n) => n.primary);

  return (
    <div className="dark min-h-screen w-full flex text-gray-100 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(at 15% 10%, rgba(139,92,246,0.18) 0, transparent 45%)," +
          "radial-gradient(at 85% 5%,  rgba(236,72,153,0.15) 0, transparent 40%)," +
          "radial-gradient(at 80% 90%, rgba(6,182,212,0.12) 0, transparent 45%)," +
          "#08080d",
      }}>

      {/* Ambient blobs */}
      <motion.div aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }}
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />

      {/* ---------- LEFT RAIL (desktop) ---------- */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30 border-r border-white/5 backdrop-blur-xl bg-black/30">
        <Link href="/" className="flex items-center gap-3 px-5 py-5 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg"
            style={{ boxShadow: "0 8px 30px -8px #ec489980" }}>
            <Dumbbell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-violet-400 to-cyan-400 leading-none">
              Workout
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <Sparkles size={9} /> Kaizen
            </p>
          </div>
        </Link>

        <Link href="/"
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition">
          <ArrowLeft size={13} /> Back to dashboard
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {WORKOUT_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === section;
            return (
              <button key={item.id} onClick={() => onSectionChange(item.id)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                  isActive ? "text-white" : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                }`}>
                {isActive && (
                  <motion.div layoutId="workout-rail-pill"
                    className="absolute inset-0 rounded-xl border"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}25, ${item.color}08)`,
                      borderColor: `${item.color}55`,
                      boxShadow: `0 10px 30px -12px ${item.color}80`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
                <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                  isActive ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"}`}
                  style={isActive ? { color: item.color } : undefined}>
                  <Icon size={16} />
                </div>
                <div className="relative z-10 flex-1 text-left">
                  <div>{item.label}</div>
                  {item.description && (
                    <div className="text-[10px] text-gray-500 font-normal leading-tight">{item.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {onStartTodaysRoutine && (
          <div className="p-3 border-t border-white/5">
            <button onClick={onStartTodaysRoutine}
              className="w-full relative overflow-hidden rounded-xl px-4 py-3 font-medium text-white
                bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500
                shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-0.5 transition
                flex items-center justify-center gap-2 text-sm">
              <Play size={14} fill="white" />
              {todaysRoutineName ? `Start ${todaysRoutineName}` : "Quick start"}
            </button>
          </div>
        )}
      </aside>

      {/* ---------- MAIN COLUMN ---------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top strip */}
        <header className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-8 border-b border-white/5 backdrop-blur-xl bg-black/20 z-20">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
              <Dumbbell size={15} className="text-white" />
            </div>
          </div>

          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <active.icon size={18} style={{ color: active.color }} />
              {active.label}
            </h2>
            {active.description && (
              <p className="text-[11px] text-gray-500">{active.description}</p>
            )}
          </div>

          <div className="flex-1" />

          <IconToggle active={workout.settings.soundEnabled}
            onClick={() => updateWorkoutSettings({ soundEnabled: !workout.settings.soundEnabled })}
            label="sound">
            {workout.settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </IconToggle>
          <IconToggle active={workout.settings.gloveMode}
            onClick={() => updateWorkoutSettings({ gloveMode: !workout.settings.gloveMode })}
            label="glove">
            <Hand size={15} />
          </IconToggle>
          <IconToggle active={workout.settings.minimalMode}
            onClick={() => updateWorkoutSettings({ minimalMode: !workout.settings.minimalMode })}
            label="minimal">
            <Minimize2 size={15} />
          </IconToggle>

          <div className="w-px h-6 bg-white/10 hidden sm:block" />

          <button aria-label="Notifications"
            className="p-2 rounded-xl hover:bg-white/5 transition text-gray-300 hidden sm:inline-flex relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pink-500" />
          </button>
          <button aria-label="Theme" onClick={toggle}
            className="p-2 rounded-xl hover:bg-white/5 transition text-gray-300 hidden sm:inline-flex">
            {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 via-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10 hover:scale-105 transition shrink-0">
            A
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={section}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 md:px-8 py-6 md:py-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ---------- BOTTOM TAB BAR (mobile) ---------- */}
        <nav className="md:hidden flex items-center justify-around border-t border-white/5 bg-black/60 backdrop-blur-xl px-2 py-2 shrink-0">
          {primary.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === section;
            return (
              <button key={item.id} onClick={() => onSectionChange(item.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[56px]">
                {isActive && (
                  <motion.div layoutId="workout-bottom-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${item.color}25` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon size={18} className="relative z-10"
                  style={{ color: isActive ? item.color : "#9ca3af" }} />
                <span className={`relative z-10 text-[10px] ${isActive ? "text-white font-semibold" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function IconToggle({ active, onClick, label, children }:
  { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick}
      className={`p-2 rounded-xl border transition text-sm ${
        active ? "bg-violet-500/20 text-violet-200 border-violet-500/40"
               : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"}`}>
      {children}
    </button>
  );
}
