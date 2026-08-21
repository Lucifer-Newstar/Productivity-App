"use client";

/**
 * WorkoutShell — immersive full-screen chrome for all /workout/* sub-routes.
 *
 * Kaizen throne-room layout:
 *  - NO left rail and NO bottom tabs — those are replaced by the BATTLE
 *    button in the top strip which summons the BattleNav overlay.
 *  - Slim top strip: Kaizen crown, current section title + sigil, quick
 *    toggles (sound/glove/minimal), theme toggle, K seal, and the
 *    floating BATTLE button (gateway to section nav).
 *  - Ambient dragon / scale / grille patterns + glitter particles +
 *    floating auras behind the content.
 *  - AnimatePresence 3D "charge-in" transitions on section change.
 *
 * Section switching is owned by WorkoutPage; it holds the BattleNav and
 * passes its onChange to the router.
 */

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Volume2, VolumeX, Sun, Moon, Hand, Minimize2, Crown,
  Flame, BookOpen, Target, Dumbbell, Zap, BarChart3, Kanban as KanbanIcon,
  Trophy, Award, Calendar, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";
import NotificationButton from "../NotificationButton";
import { ProfileTrigger } from "../ProfileDock";

export type WorkoutSectionId =
  | "overview" | "library" | "calisthenics" | "gym" | "cardio"
  | "pr" | "skills" | "exercises" | "schedule" | "charts" | "kanban" | "global";

export interface WorkoutNavItem {
  id: WorkoutSectionId;
  label: string;
  sigil: string;
  icon: LucideIcon;
  color: string;
  description?: string;
  primary?: boolean;
}

export const WORKOUT_NAV: WorkoutNavItem[] = [
  { id: "overview",     label: "Overview",     sigil: "I",    icon: Flame,       color: "#b91c1c", description: "Today at a glance" },
  { id: "library",      label: "Library",      sigil: "II",   icon: BookOpen,    color: "#d4af37", description: "Exercises & muscles" },
  { id: "calisthenics", label: "Calisthenics", sigil: "III",  icon: Target,      color: "#ec4899", description: "Bodyweight skills" },
  { id: "gym",          label: "Gym",          sigil: "IV",   icon: Dumbbell,    color: "#f59e0b", description: "Weights & plates" },
  { id: "cardio",       label: "Cardio",       sigil: "V",    icon: Zap,         color: "#06b6d4", description: "Run, bike, row" },
  { id: "charts",       label: "Charts",       sigil: "VI",   icon: BarChart3,   color: "#d4af37", description: "Progress analytics" },
  { id: "kanban",       label: "Board",        sigil: "VII",  icon: KanbanIcon,  color: "#be185d", description: "Weekly war-table" },
  { id: "pr",           label: "PRs",          sigil: "VIII", icon: Trophy,      color: "#f59e0b", description: "Personal records" },
  { id: "skills",       label: "Skills",       sigil: "IX",   icon: Award,       color: "#b91c1c", description: "Progressions" },
  { id: "schedule",     label: "Schedule",     sigil: "X",    icon: Calendar,    color: "#06b6d4", description: "Routines & splits" },
  { id: "global",       label: "Tools",        sigil: "XI",   icon: Sparkles,    color: "#ec4899", description: "Timers, journal, challenges" },
];

interface ShellProps {
  section: WorkoutSectionId;
  /** Rendered inside the top strip — the BATTLE trigger button. */
  battleButton?: React.ReactNode;
  /**
   * If provided, replaces children in the content area (the inline Hall of
   * Blades card). Otherwise the normal page children render.
   */
  battleCard?: React.ReactNode;
  children: React.ReactNode;
}

export default function WorkoutShell({ section, battleButton, battleCard, children }: ShellProps) {
  const { theme, toggle } = useTheme();
  const { workout, updateWorkoutSettings } = useStore();
  const isDark = theme === "dark";
  const active = WORKOUT_NAV.find((n) => n.id === section) ?? WORKOUT_NAV[0];

  return (
    <div
      className={`workout-shell ${isDark ? "dark" : "parchment"} min-h-screen w-full flex flex-col relative overflow-hidden`}
      style={{
        color: isDark ? "#f3e9d2" : "#1a0f0a",
        background: isDark
          ? "radial-gradient(at 15% 10%, rgba(185,28,28,0.25) 0, transparent 45%)," +
            "radial-gradient(at 85% 5%,  rgba(212,175,55,0.22) 0, transparent 40%)," +
            "radial-gradient(at 80% 90%, rgba(236,72,153,0.15) 0, transparent 45%)," +
            "#0a0709"
          : "radial-gradient(at 15% 10%, rgba(127,29,29,0.18) 0, transparent 45%)," +
            "radial-gradient(at 85% 5%,  rgba(156,122,26,0.18) 0, transparent 40%)," +
            "radial-gradient(at 80% 90%, rgba(190,24,93,0.10) 0, transparent 45%)," +
            "#f2e6c9",
      }}
    >
      {/* Decorative layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 scale-pattern opacity-60" />
      <div aria-hidden className="pointer-events-none absolute inset-0 grille-pattern opacity-30" />
      <div aria-hidden className="pointer-events-none absolute inset-0 dragon-watermark opacity-25" />
      <div aria-hidden className="glitter-bg" />

      {/* Floating auras */}
      <motion.div aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(185,28,28,0.55) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(127,29,29,0.35) 0%, transparent 70%)",
        }}
        animate={{ x: [0,40,0], y: [0,20,0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(212,175,55,0.40) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(156,122,26,0.30) 0%, transparent 70%)",
        }}
        animate={{ x: [0,-30,0], y: [0,30,0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/3 w-[480px] h-[480px] rounded-full blur-3xl"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(190,24,93,0.18) 0%, transparent 70%)",
        }}
        animate={{ x: [0,20,0], y: [0,-20,0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }} />

      {/* ───── Top strip ───── */}
      <header
        className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-8 border-b backdrop-blur-xl z-20 relative overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(90deg, rgba(15,10,13,0.85) 0%, rgba(20,13,16,0.7) 100%)"
            : "linear-gradient(90deg, rgba(255,248,228,0.85) 0%, rgba(242,230,201,0.75) 100%)",
          borderColor: isDark ? "rgba(212,175,55,0.25)" : "rgba(127,29,29,0.2)",
        }}
      >
        {/* Gold blade line along bottom */}
        <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: isDark
            ? "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)"
            : "linear-gradient(90deg, transparent, rgba(127,29,29,0.4), transparent)" }} />

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-[-2deg]"
            style={{
              background: "linear-gradient(135deg, #b91c1c 0%, #6f0f0f 100%)",
              border: "1.5px solid rgba(253,230,138,0.5)",
              boxShadow: "0 6px 20px -6px rgba(185,28,28,0.8), inset 0 1px 0 rgba(253,230,138,0.3)",
            }}>
            <Crown size={18} className="text-amber-100" style={{ filter: "drop-shadow(0 0 6px rgba(253,230,138,0.6))" }} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg imperial-name leading-none"
              style={{
                background: "linear-gradient(135deg, #fde68a 0%, #d4af37 50%, #b91c1c 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
              Kaizen
            </h1>
            <p className="text-[9px] emperor-title uppercase tracking-[0.3em] mt-0.5 flex items-center gap-1"
              style={{ color: isDark ? "#d4af37" : "#9c7a1a" }}>Training</p>
          </div>
        </Link>

        <div className="h-6 w-px" style={{ background: isDark ? "rgba(212,175,55,0.2)" : "rgba(127,29,29,0.15)" }} />

        {/* Current section badge */}
        <div className="flex items-center gap-3 min-w-0 relative">
          <motion.div
            key={active.id}
            initial={{ scale: 1.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: -5, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #b91c1c, #6f0f0f)",
              border: "1.5px solid rgba(253,230,138,0.5)",
              boxShadow: "0 4px 14px -4px rgba(185,28,28,0.8), inset 0 1px 0 rgba(253,230,138,0.25)",
            }}>
            <active.icon size={17} className="text-amber-100" />
          </motion.div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg emperor-title leading-none truncate flex items-center gap-2"
              style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>
              {active.label}
              <span className="hidden sm:inline text-[9px] emperor-title px-1.5 py-0.5 rounded"
                style={{
                  color: isDark ? "#fde68a" : "#7f1d1d",
                  background: isDark ? "rgba(212,175,55,0.12)" : "rgba(127,29,29,0.1)",
                  border: `1px solid ${isDark ? "rgba(212,175,55,0.35)" : "rgba(127,29,29,0.25)"}`,
                }}>
                {active.sigil}
              </span>
            </h2>
            {active.description && (
              <p className={`hidden md:block text-[11px] mt-0.5 serif-body italic`}
                style={{ color: isDark ? "#9c7a1a" : "#7c5a44" }}>
                — {active.description} —
              </p>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* BATTLE button (center/right) */}
        {battleButton}

        <div className="w-px h-6 hidden sm:block" style={{ background: isDark ? "rgba(212,175,55,0.2)" : "rgba(127,29,29,0.15)" }} />

        {/* Toggles */}
        <IconToggle active={workout.settings.soundEnabled}
          onClick={() => updateWorkoutSettings({ soundEnabled: !workout.settings.soundEnabled })}
          label="sound" isDark={isDark}>
          {workout.settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </IconToggle>
        <IconToggle active={workout.settings.gloveMode}
          onClick={() => updateWorkoutSettings({ gloveMode: !workout.settings.gloveMode })}
          label="glove" isDark={isDark} className="hidden md:inline-flex">
          <Hand size={15} />
        </IconToggle>
        <IconToggle active={workout.settings.minimalMode}
          onClick={() => updateWorkoutSettings({ minimalMode: !workout.settings.minimalMode })}
          label="minimal" isDark={isDark} className="hidden md:inline-flex">
          <Minimize2 size={15} />
        </IconToggle>

        <NotificationButton
          size={16}
          className={`p-2 rounded-xl transition hidden sm:inline-grid ${
            isDark ? "hover:bg-amber-200/10 text-gray-300" : "hover:bg-red-900/10 text-gray-600"
          }`}
        />
        <button aria-label="Theme" onClick={toggle}
          title={`Switch to ${isDark ? "parchment" : "obsidian"} mode`}
          className={`p-2 rounded-xl transition hidden sm:inline-flex ${
            isDark ? "hover:bg-amber-200/10 text-amber-300" : "hover:bg-red-900/10 text-red-900"
          }`}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <ProfileTrigger className="profile-trigger-inline" />

        {/* K seal */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-sm imperial-name font-black text-amber-50 shrink-0 transition hover:scale-105 hover:rotate-[-3deg]"
          style={{
            background: "linear-gradient(135deg, #b91c1c, #6f0f0f)",
            border: "1.5px solid rgba(253,230,138,0.5)",
            boxShadow: "0 4px 14px -4px rgba(185,28,28,0.8), inset 0 1px 0 rgba(253,230,138,0.25)",
          }}>
          K
        </button>

        {/* Back to dashboard on mobile */}
        <Link href="/"
          className={`md:hidden p-2 rounded-lg text-xs flex items-center gap-1 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}>
          <ArrowLeft size={14} />
        </Link>
      </header>

      {/* ───── Content area ───── */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {battleCard ? (
            <motion.div
              key="battle-card"
              initial={{ opacity: 0, y: 24, scale: 0.98, rotateX: -6, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0,  scale: 1,    rotateX: 0,  filter: "blur(0px)" }}
              exit={{    opacity: 0, y: -10, scale: 0.99, rotateX: 4,  filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 md:px-8 py-6 md:py-10 relative"
              style={{ perspective: 1200 }}
            >
              {battleCard}
            </motion.div>
          ) : (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 24, scale: 0.98, rotateX: -6, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0,  scale: 1,    rotateX: 0,  filter: "blur(0px)" }}
              exit={{    opacity: 0, y: -10, scale: 0.99, rotateX: 4,  filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 md:px-8 py-6 md:py-8 relative"
              style={{ perspective: 1200 }}
            >
              <div className="max-w-6xl mx-auto w-full">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ── Icon toggle ── */
function IconToggle({ active, onClick, label, children, isDark, className = "" }:
  { active: boolean; onClick: () => void; label: string; children: React.ReactNode; isDark: boolean; className?: string }) {
  return (
    <button aria-label={label} onClick={onClick}
      className={`p-2 rounded-xl border transition text-sm ${className}`}
      style={active ? {
        background: isDark ? "rgba(212,175,55,0.18)" : "rgba(127,29,29,0.15)",
        color: isDark ? "#fde68a" : "#7f1d1d",
        borderColor: isDark ? "rgba(212,175,55,0.45)" : "rgba(127,29,29,0.4)",
        boxShadow: isDark ? "0 0 18px -4px rgba(212,175,55,0.6)" : "0 0 18px -4px rgba(127,29,29,0.35)",
      } : {
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        color: isDark ? "#9ca3af" : "#7c5a44",
        borderColor: isDark ? "rgba(212,175,55,0.18)" : "rgba(0,0,0,0.1)",
      }}>
      {children}
    </button>
  );
}
