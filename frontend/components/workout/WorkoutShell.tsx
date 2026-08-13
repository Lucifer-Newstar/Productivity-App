"use client";

/**
 * WorkoutShell — immersive full-screen chrome for all /workout/* sub-routes.
 *
 * Japanese aesthetic (Kuro / Sumi ink + gold + vermilion + sakura):
 *  - Left rail: lacquered wood panel feel with gold-foil separators, sliding ink pill
 *  - Top strip: seigaiha wave pattern + kanji seal stamp on active section
 *  - Content: asanoha hemp-leaf pattern overlay + floating glitter particles
 *  - Mobile bottom bar: glassy lacquer with gold-foil sliding pill
 *  - Page transitions: ink-drop AnimatePresence with directional slide
 *  - Full light/dark theme support (respects `kaizen.theme` via useTheme())
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Dumbbell, Flame, Trophy, Target, Calendar, Zap, Award,
  Sparkles, Play, Hand, Minimize2, Volume2, VolumeX, Sun, Moon, Bell,
  BookOpen, BarChart3, Kanban as KanbanIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";

export type WorkoutSectionId =
  | "overview" | "library" | "calisthenics" | "gym" | "cardio"
  | "pr" | "skills" | "exercises" | "schedule" | "charts" | "kanban" | "global";

export interface WorkoutNavItem {
  id: WorkoutSectionId;
  label: string;
  kanji: string;        // small Japanese sub-label for flavor
  icon: LucideIcon;
  color: string;
  description?: string;
  primary?: boolean;
}

export const WORKOUT_NAV: WorkoutNavItem[] = [
  { id: "overview",     label: "Overview",     kanji: "一覧",  icon: Flame,       color: "#c81d25", description: "Today at a glance",    primary: true },
  { id: "library",      label: "Library",      kanji: "書庫",  icon: BookOpen,    color: "#d4af37", description: "Exercises & muscles", primary: true },
  { id: "calisthenics", label: "Calisthenics", kanji: "自重",  icon: Target,      color: "#ec4899", description: "Bodyweight skills",   primary: true },
  { id: "gym",          label: "Gym",          kanji: "鉄場",  icon: Dumbbell,    color: "#f59e0b", description: "Weights & plates",   primary: true },
  { id: "cardio",       label: "Cardio",       kanji: "心肺",  icon: Zap,         color: "#06b6d4", description: "Run, bike, row",     primary: true },
  { id: "charts",       label: "Charts",       kanji: "統計",  icon: BarChart3,   color: "#d4af37", description: "Progress analytics" },
  { id: "kanban",       label: "Board",        kanji: "看板",  icon: KanbanIcon,  color: "#be185d", description: "Weekly kanban",       primary: true },
  { id: "pr",           label: "PRs",          kanji: "記録",  icon: Trophy,      color: "#f59e0b", description: "Personal records" },
  { id: "skills",       label: "Skills",       kanji: "技",    icon: Award,       color: "#c81d25", description: "Progressions" },
  { id: "schedule",     label: "Schedule",     kanji: "予定",  icon: Calendar,    color: "#06b6d4", description: "Routines & splits" },
  { id: "global",       label: "Tools",        kanji: "道具",  icon: Sparkles,    color: "#ec4899", description: "Timers, journal, challenges" },
];

interface ShellProps {
  section: WorkoutSectionId;
  onSectionChange: (s: WorkoutSectionId) => void;
  onStartTodaysRoutine?: () => void;
  onQuickStart?: () => void;
  todaysRoutineName?: string;
  children: React.ReactNode;
}

export default function WorkoutShell({
  section, onSectionChange, onStartTodaysRoutine, onQuickStart, todaysRoutineName, children,
}: ShellProps) {
  const { theme, toggle } = useTheme();
  const { workout, updateWorkoutSettings } = useStore();
  const router = useRouter();
  const active = WORKOUT_NAV.find((n) => n.id === section) ?? WORKOUT_NAV[0];
  const primary = WORKOUT_NAV.filter((n) => n.primary);
  const isDark = theme === "dark";

  return (
    <div
      className={`${isDark ? "dark" : "washi"} min-h-screen w-full flex relative overflow-hidden`}
      style={{
        color: isDark ? "#f3e9d2" : "#1a1216",
        background: isDark
          ? "radial-gradient(at 15% 10%, rgba(200,29,37,0.20) 0, transparent 45%)," +
            "radial-gradient(at 85% 5%,  rgba(212,175,55,0.18) 0, transparent 40%)," +
            "radial-gradient(at 80% 90%, rgba(244,114,182,0.12) 0, transparent 45%)," +
            "#0a0709"
          : "radial-gradient(at 15% 10%, rgba(200,29,37,0.10) 0, transparent 45%)," +
            "radial-gradient(at 85% 5%,  rgba(184,134,11,0.12) 0, transparent 40%)," +
            "radial-gradient(at 80% 90%, rgba(244,114,182,0.08) 0, transparent 45%)," +
            "#f5efe4",
      }}
    >
      {/* Asanoha hemp-leaf backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 asanoha-pattern opacity-60" />
      {/* Glitter particle layer */}
      <div aria-hidden className="glitter-bg" />

      {/* Floating ink blobs */}
      <motion.div aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(200,29,37,0.55) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(200,29,37,0.30) 0%, transparent 70%)",
        }}
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(212,175,55,0.40) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(184,134,11,0.25) 0%, transparent 70%)",
        }}
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/3 w-[480px] h-[480px] rounded-full blur-3xl"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(244,114,182,0.30) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 70%)",
        }}
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }} />

      {/* ---------- LEFT RAIL (desktop) ---------- */}
      <aside
        className={`hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30 border-r backdrop-blur-xl`}
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(20,13,16,0.85) 0%, rgba(15,10,13,0.9) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(245,239,228,0.8) 100%)",
          borderColor: isDark ? "rgba(212,175,55,0.2)" : "rgba(200,29,37,0.15)",
          boxShadow: isDark
            ? "inset 1px 0 0 rgba(212,175,55,0.15), 10px 0 40px -20px rgba(0,0,0,0.8)"
            : "inset 1px 0 0 rgba(200,29,37,0.1), 10px 0 30px -20px rgba(139,0,0,0.25)",
        }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-5 py-5 group relative">
          <div className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #c81d25 0%, #8b0000 100%)",
              border: "1px solid rgba(253,230,138,0.4)",
              boxShadow: "0 8px 24px -8px rgba(200,29,37,0.7), inset 0 1px 0 rgba(253,230,138,0.3)",
            }}>
            <Dumbbell size={20} className="text-amber-100" />
            {/* small gold kanji 改善 (kaizen) */}
            <span className="absolute -bottom-1 -right-1 text-[9px] font-jp bg-amber-300 text-red-900 rounded px-1 font-bold"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
              改善
            </span>
          </div>
          <div>
            <h1 className="text-lg font-jp font-bold tracking-wide leading-none">
              <span className="gold-text">鍛</span>
              <span className={isDark ? "text-gray-100" : "text-ink"}>練</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] mt-1 flex items-center gap-1"
              style={{ color: isDark ? "#d4af37" : "#9c7a1a" }}>
              <Sparkles size={9} /> Training
            </p>
          </div>
        </Link>

        <div className="divider-gold mx-5 mb-3" />

        <Link href="/"
          className={`mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition
            ${isDark ? "text-gray-400 hover:text-amber-200 hover:bg-amber-200/5"
                     : "text-gray-600 hover:text-red-800 hover:bg-red-900/5"}`}>
          <ArrowLeft size={13} /> Back to dashboard
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {WORKOUT_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === section;
            return (
              <button key={item.id} onClick={() => onSectionChange(item.id)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                  isActive ? "" : isDark
                    ? "text-gray-400 hover:text-amber-100 hover:bg-amber-200/5"
                    : "text-gray-600 hover:text-red-900 hover:bg-red-900/5"
                }`}>
                {isActive && (
                  <motion.div layoutId="workout-rail-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: isDark
                        ? `linear-gradient(135deg, ${item.color}30, ${item.color}08)`
                        : `linear-gradient(135deg, ${item.color}20, ${item.color}04)`,
                      border: `1px solid ${item.color}${isDark ? "66" : "55"}`,
                      boxShadow: `0 10px 30px -12px ${item.color}80${isDark ? "" : "55"}, inset 0 1px 0 ${item.color}22`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
                <div
                  className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center transition
                    ${isActive ? "" : isDark ? "bg-white/5 group-hover:bg-amber-200/10" : "bg-black/5 group-hover:bg-red-900/10"}`}
                  style={isActive ? {
                    background: isDark
                      ? `linear-gradient(135deg, ${item.color}40, ${item.color}15)`
                      : `linear-gradient(135deg, ${item.color}25, ${item.color}08)`,
                    color: item.color,
                    border: `1px solid ${item.color}55`,
                    boxShadow: `0 4px 12px -4px ${item.color}80`,
                  } : undefined}>
                  <Icon size={16} />
                </div>
                <div className="relative z-10 flex-1 text-left min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`${isActive ? "font-semibold" : ""}`}
                      style={isActive ? { color: isDark ? "#fde68a" : "#8b0000" } : undefined}>
                      {item.label}
                    </span>
                    <span className="text-[10px] font-jp opacity-60 shrink-0">{item.kanji}</span>
                  </div>
                  {item.description && (
                    <div className={`text-[10px] leading-tight ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {onStartTodaysRoutine && (
          <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${isDark ? "rgba(212,175,55,0.2)" : "rgba(200,29,37,0.15)"}` }}>
            {todaysRoutineName ? (
              <button onClick={onStartTodaysRoutine}
                className="w-full relative overflow-hidden rounded-xl px-4 py-3 font-semibold text-amber-50
                  bg-gradient-to-r from-red-700 via-red-600 to-rose-700
                  hover:-translate-y-0.5 transition
                  flex items-center justify-center gap-2 text-sm
                  border border-amber-300/30"
                style={{ boxShadow: "0 10px 30px -10px rgba(200,29,37,0.7), inset 0 1px 0 rgba(253,230,138,0.25)" }}>
                {/* Shimmer sweep */}
                <span aria-hidden className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(110deg, transparent 30%, rgba(253,230,138,0.35) 50%, transparent 70%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s linear infinite",
                  }} />
                <Play size={14} fill="currentColor" className="relative z-10" />
                <span className="relative z-10 flex items-center gap-2">
                  Start {todaysRoutineName}
                  <span className="text-[10px] font-jp bg-amber-200/20 px-1.5 py-0.5 rounded border border-amber-200/30">始</span>
                </span>
              </button>
            ) : null}
            {onQuickStart && (
              <button onClick={onQuickStart}
                className={`w-full rounded-xl px-4 py-2 font-medium text-sm transition flex items-center justify-center gap-2
                  ${todaysRoutineName
                    ? isDark
                      ? "bg-amber-200/5 text-amber-100 hover:bg-amber-200/10 border border-amber-300/20"
                      : "bg-black/5 text-gray-700 hover:bg-black/10 border border-black/10"
                    : "text-red-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 border border-amber-700/30 shadow-lg"
                  }`}
                style={!todaysRoutineName ? { boxShadow: "0 10px 24px -10px rgba(212,175,55,0.7)" } : undefined}>
                <Play size={12} fill="currentColor" />
                Quick start
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ---------- MAIN COLUMN ---------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top strip */}
        <header
          className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-8 border-b backdrop-blur-xl z-20 relative overflow-hidden"
          style={{
            background: isDark
              ? "linear-gradient(90deg, rgba(15,10,13,0.8) 0%, rgba(20,13,16,0.65) 100%)"
              : "linear-gradient(90deg, rgba(255,255,255,0.75) 0%, rgba(245,239,228,0.7) 100%)",
            borderColor: isDark ? "rgba(212,175,55,0.2)" : "rgba(200,29,37,0.15)",
          }}
        >
          {/* Seigaiha wave decoration at bottom edge */}
          <div aria-hidden className="absolute bottom-0 left-0 right-0 h-3 seigaiha-pattern opacity-70 pointer-events-none" />

          <div className="md:hidden flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center border border-amber-300/30"
              style={{ boxShadow: "0 6px 16px -6px rgba(200,29,37,0.7)" }}>
              <Dumbbell size={15} className="text-amber-100" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 relative">
            <motion.div
              key={active.id}
              initial={{ scale: 1.5, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: -5, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #c81d25, #8b0000)",
                border: "1.5px solid rgba(253,230,138,0.45)",
                boxShadow: "0 6px 18px -6px rgba(200,29,37,0.8), inset 0 1px 0 rgba(253,230,138,0.3)",
              }}>
              <active.icon size={18} className="text-amber-100" />
            </motion.div>
            <div>
              <h2 className="text-lg font-jp font-bold flex items-center gap-2 leading-none">
                <span className={isDark ? "text-amber-100" : "text-ink"}>{active.label}</span>
                <span className="text-[11px] font-jp px-1.5 py-0.5 rounded"
                  style={{
                    color: isDark ? "#fde68a" : "#8b0000",
                    background: isDark ? "rgba(212,175,55,0.1)" : "rgba(200,29,37,0.08)",
                    border: `1px solid ${isDark ? "rgba(212,175,55,0.3)" : "rgba(200,29,37,0.2)"}`,
                  }}>
                  {active.kanji}
                </span>
              </h2>
              {active.description && (
                <p className={`text-[11px] mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{active.description}</p>
              )}
            </div>
          </div>

          <div className="flex-1" />

          <IconToggle active={workout.settings.soundEnabled}
            onClick={() => updateWorkoutSettings({ soundEnabled: !workout.settings.soundEnabled })}
            label="sound" isDark={isDark}>
            {workout.settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </IconToggle>
          <IconToggle active={workout.settings.gloveMode}
            onClick={() => updateWorkoutSettings({ gloveMode: !workout.settings.gloveMode })}
            label="glove" isDark={isDark}>
            <Hand size={15} />
          </IconToggle>
          <IconToggle active={workout.settings.minimalMode}
            onClick={() => updateWorkoutSettings({ minimalMode: !workout.settings.minimalMode })}
            label="minimal" isDark={isDark}>
            <Minimize2 size={15} />
          </IconToggle>

          <div className={`w-px h-6 ${isDark ? "bg-amber-300/20" : "bg-red-900/20"} hidden sm:block`} />

          <button aria-label="Notifications"
            className={`p-2 rounded-xl transition hidden sm:inline-flex relative
              ${isDark ? "hover:bg-amber-200/10 text-gray-300" : "hover:bg-red-900/10 text-gray-600"}`}>
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: "#c81d25", boxShadow: "0 0 6px #c81d25" }} />
          </button>
          <button aria-label="Theme" onClick={toggle}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            className={`p-2 rounded-xl transition hidden sm:inline-flex
              ${isDark ? "hover:bg-amber-200/10 text-amber-300" : "hover:bg-red-900/10 text-red-800"}`}>
            {isDark ? <Sun size={16} className="text-amber-300" /> : <Moon size={16} />}
          </button>

          {/* Avatar — hanko-style seal */}
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-amber-50 shrink-0 transition hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #c81d25, #8b0000)",
              border: "1.5px solid rgba(253,230,138,0.4)",
              boxShadow: "0 4px 12px -4px rgba(200,29,37,0.7), inset 0 1px 0 rgba(253,230,138,0.25)",
            }}>
            <span className="font-jp">忍</span>
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 18, scale: 0.992, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0,  scale: 1,     filter: "blur(0px)" }}
              exit={{    opacity: 0, y: -12, scale: 0.995, filter: "blur(3px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 md:px-8 py-6 md:py-8"
            >
              {/* Decorative vertical kanji on right edge of content (desktop only) */}
              <div aria-hidden className="hidden lg:block absolute top-4 right-4 pointer-events-none">
                <div className={`font-jp writing-vertical text-[11px] tracking-[0.4em] opacity-30 ${isDark ? "text-amber-300" : "text-red-900"}`}
                  style={{ writingMode: "vertical-rl" }}>
                  鍛錬・継続・改善
                </div>
              </div>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ---------- BOTTOM TAB BAR (mobile) ---------- */}
        <nav
          className="md:hidden flex items-center justify-around border-t backdrop-blur-xl px-2 py-2 shrink-0 relative"
          style={{
            background: isDark
              ? "linear-gradient(0deg, rgba(10,7,9,0.95) 0%, rgba(20,13,16,0.8) 100%)"
              : "linear-gradient(0deg, rgba(245,239,228,0.95) 0%, rgba(255,255,255,0.8) 100%)",
            borderColor: isDark ? "rgba(212,175,55,0.2)" : "rgba(200,29,37,0.15)",
          }}>
          {primary.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === section;
            return (
              <button key={item.id} onClick={() => onSectionChange(item.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[56px]">
                {isActive && (
                  <motion.div layoutId="workout-bottom-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: isDark
                        ? `linear-gradient(180deg, ${item.color}30, ${item.color}08)`
                        : `linear-gradient(180deg, ${item.color}20, ${item.color}04)`,
                      border: `1px solid ${item.color}${isDark ? "55" : "44"}`,
                    }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon size={18} className="relative z-10 transition-transform"
                  style={{
                    color: isActive ? item.color : isDark ? "#94a3b8" : "#64748b",
                    filter: isActive ? `drop-shadow(0 0 6px ${item.color}80)` : undefined,
                  }} />
                <span className={`relative z-10 text-[10px] ${isActive ? "font-semibold" : ""}`}
                  style={{ color: isActive ? item.color : isDark ? "#9ca3af" : "#64748b" }}>
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

/* ---------- Icon toggle — themed to gold/red ---------- */
function IconToggle({ active, onClick, label, children, isDark }:
  { active: boolean; onClick: () => void; label: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <button aria-label={label} onClick={onClick}
      className="p-2 rounded-xl border transition text-sm"
      style={active ? {
        background: isDark ? "rgba(212,175,55,0.15)" : "rgba(200,29,37,0.12)",
        color: isDark ? "#fde68a" : "#8b0000",
        borderColor: isDark ? "rgba(212,175,55,0.4)" : "rgba(200,29,37,0.35)",
        boxShadow: isDark ? "0 0 16px -4px rgba(212,175,55,0.5)" : "0 0 16px -4px rgba(200,29,37,0.3)",
      } : {
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        color: isDark ? "#9ca3af" : "#64748b",
        borderColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(0,0,0,0.08)",
      }}>
      {children}
    </button>
  );
}
