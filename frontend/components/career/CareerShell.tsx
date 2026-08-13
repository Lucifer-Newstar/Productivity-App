"use client";

/**
 * CareerShell — immersive chrome for the /career space.
 * Matches Kaizen's obsidian/parchment look with a BATTLE-style "COMMAND"
 * nav trigger (gold/crimson) that summons the section card inline.
 *
 * Top strip: Kaizen crown + brand, current section badge, COMMAND button,
 * toggles, theme, K seal.
 * Content: AnimatePresence page transitions, battle card slot.
 */

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Crown, Sun, Moon, Bell, Map, Brain, Award, Users, Briefcase,
  Trophy, ClipboardList, Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";

export type CareerSectionId =
  | "roadmaps" | "skills" | "certs" | "network" | "jobs"
  | "portfolio" | "daily" | "global";

export interface CareerNavItem {
  id: CareerSectionId;
  label: string;
  sigil: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

export const CAREER_NAV: CareerNavItem[] = [
  { id: "roadmaps",  label: "Roadmaps",    sigil: "I",    icon: Map,         color: "#d4af37", description: "Learning tracks" },
  { id: "skills",    label: "Skills",      sigil: "II",   icon: Brain,       color: "#b91c1c", description: "Inventory & gaps" },
  { id: "certs",     label: "Certs",       sigil: "III",  icon: Award,       color: "#06b6d4", description: "Courses & certifications" },
  { id: "network",   label: "Network",     sigil: "IV",   icon: Users,       color: "#ec4899", description: "Contacts & favors" },
  { id: "jobs",      label: "Jobs",        sigil: "V",    icon: Briefcase,   color: "#f59e0b", description: "Applications & offers" },
  { id: "portfolio", label: "Portfolio",   sigil: "VI",   icon: Trophy,      color: "#a3e635", description: "Wins & projects" },
  { id: "daily",     label: "Daily",       sigil: "VII",  icon: ClipboardList, color: "#8b5cf6", description: "Standups, meetings, logs" },
  { id: "global",    label: "Command",     sigil: "VIII", icon: Globe,       color: "#cbd5e1", description: "Timeline, burnout, vision" },
];

interface Props {
  section: CareerSectionId;
  commandButton: React.ReactNode;
  commandCard?: React.ReactNode;
  children: React.ReactNode;
}

export default function CareerShell({ section, commandButton, commandCard, children }: Props) {
  const { theme, toggle } = useTheme();
  const { career } = useStore();
  const isDark = theme === "dark";
  const active = CAREER_NAV.find((n) => n.id === section) ?? CAREER_NAV[0];

  const roadmapCount = career.roadmaps?.length ?? 0;
  const activeRoadmaps = (career.roadmaps ?? []).filter(r => r.status === "active").length;

  return (
    <div
      className={`${isDark ? "dark" : "parchment"} min-h-screen w-full flex flex-col relative overflow-hidden`}
      style={{
        color: isDark ? "#f3e9d2" : "#1a0f0a",
        background: isDark
          ? "radial-gradient(at 15% 10%, rgba(185,28,28,0.2) 0, transparent 45%)," +
            "radial-gradient(at 85% 5%,  rgba(6,182,212,0.18) 0, transparent 40%)," +
            "radial-gradient(at 80% 90%, rgba(212,175,55,0.15) 0, transparent 45%)," +
            "#0a0709"
          : "radial-gradient(at 15% 10%, rgba(127,29,29,0.15) 0, transparent 45%)," +
            "radial-gradient(at 85% 5%,  rgba(6,182,212,0.15) 0, transparent 40%)," +
            "radial-gradient(at 80% 90%, rgba(156,122,26,0.15) 0, transparent 45%)," +
            "#f2e6c9",
      }}>
      {/* Decorative layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 scale-pattern opacity-50" />
      <div aria-hidden className="pointer-events-none absolute inset-0 grille-pattern opacity-25" />
      <div aria-hidden className="glitter-bg" />

      {/* Floating auras */}
      <motion.div aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: isDark ? "radial-gradient(circle, rgba(6,182,212,0.45) 0%, transparent 70%)" : "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" }}
        animate={{ x: [0,40,0], y: [0,20,0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: isDark ? "radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)" : "radial-gradient(circle, rgba(156,122,26,0.3) 0%, transparent 70%)" }}
        animate={{ x: [0,-30,0], y: [0,30,0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }} />

      {/* Top strip */}
      <header
        className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-8 border-b backdrop-blur-xl z-20 relative overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(90deg, rgba(15,10,13,0.85) 0%, rgba(20,13,16,0.7) 100%)"
            : "linear-gradient(90deg, rgba(255,248,228,0.85) 0%, rgba(242,230,201,0.75) 100%)",
          borderColor: isDark ? "rgba(212,175,55,0.25)" : "rgba(6,182,212,0.25)",
        }}>
        <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: isDark
            ? "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)"
            : "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)" }} />

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-[-2deg]"
            style={{
              background: "linear-gradient(135deg, #0e7490 0%, #164e63 100%)",
              border: "1.5px solid rgba(103,232,249,0.5)",
              boxShadow: "0 6px 20px -6px rgba(6,182,212,0.8), inset 0 1px 0 rgba(186,230,253,0.3)",
            }}>
            <Crown size={18} className="text-amber-100" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg imperial-name leading-none"
              style={{
                background: "linear-gradient(135deg, #67e8f9 0%, #d4af37 60%, #b91c1c 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
              Kaizen
            </h1>
            <p className="text-[9px] emperor-title uppercase tracking-[0.3em] mt-0.5"
              style={{ color: isDark ? "#67e8f9" : "#0e7490" }}>Career · Command</p>
          </div>
        </Link>

        <div className="h-6 w-px" style={{ background: isDark ? "rgba(212,175,55,0.2)" : "rgba(6,182,212,0.2)" }} />

        {/* Back to dashboard on mobile */}
        <Link href="/"
          className={`md:hidden p-2 rounded-lg text-xs flex items-center gap-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          <ArrowLeft size={14} />
        </Link>

        {/* Section badge */}
        <div className="flex items-center gap-3 min-w-0 relative">
          <motion.div key={active.id}
            initial={{ scale: 1.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: -5, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${active.color}, ${active.color}99)`,
              border: "1.5px solid rgba(255,255,255,0.25)",
              boxShadow: `0 4px 14px -4px ${active.color}aa`,
            }}>
            <active.icon size={17} className="text-white" />
          </motion.div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg emperor-title leading-none truncate flex items-center gap-2"
              style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>
              {active.label}
              <span className="hidden sm:inline text-[9px] emperor-title px-1.5 py-0.5 rounded"
                style={{
                  color: isDark ? "#fde68a" : "#0e7490",
                  background: isDark ? "rgba(212,175,55,0.12)" : "rgba(6,182,212,0.1)",
                  border: `1px solid ${isDark ? "rgba(212,175,55,0.35)" : "rgba(6,182,212,0.25)"}`,
                }}>
                {active.sigil}
              </span>
            </h2>
            <p className={`hidden md:block text-[11px] mt-0.5 serif-body italic`}
              style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>
              — {active.description} —
            </p>
          </div>
        </div>

        {/* Tiny stats */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          <div className="text-center px-3 py-1 rounded-lg border"
            style={{ borderColor: isDark ? "rgba(212,175,55,0.25)" : "rgba(6,182,212,0.25)", background: isDark ? "rgba(212,175,55,0.08)" : "rgba(6,182,212,0.08)" }}>
            <div className="text-[9px] emperor-title uppercase tracking-widest" style={{ color: isDark ? "#d4af37" : "#0e7490" }}>Roadmaps</div>
            <div className="text-sm font-bold gold-text">{activeRoadmaps}/{roadmapCount}</div>
          </div>
        </div>

        <div className="flex-1" />

        {commandButton}

        <div className="w-px h-6 hidden sm:block" style={{ background: isDark ? "rgba(212,175,55,0.2)" : "rgba(6,182,212,0.2)" }} />

        <button aria-label="Notifications"
          className={`p-2 rounded-xl transition hidden sm:inline-flex relative ${isDark ? "hover:bg-cyan-200/10 text-gray-300" : "hover:bg-cyan-900/10 text-gray-600"}`}>
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#06b6d4", boxShadow: "0 0 8px #06b6d4" }} />
        </button>
        <button aria-label="Theme" onClick={toggle} title={`Switch to ${isDark ? "parchment" : "obsidian"} mode`}
          className={`p-2 rounded-xl transition hidden sm:inline-flex ${isDark ? "hover:bg-amber-200/10 text-amber-300" : "hover:bg-cyan-900/10 text-cyan-800"}`}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-sm imperial-name font-black text-amber-50 shrink-0 transition hover:scale-105 hover:rotate-[-3deg]"
          style={{
            background: "linear-gradient(135deg, #0e7490, #164e63)",
            border: "1.5px solid rgba(103,232,249,0.5)",
            boxShadow: "0 4px 14px -4px rgba(6,182,212,0.8), inset 0 1px 0 rgba(186,230,253,0.25)",
          }}>
          K
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {commandCard ? (
            <motion.div key="command-card"
              initial={{ opacity: 0, y: 24, scale: 0.98, rotateX: -6, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.99, rotateX: 4, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-6 md:py-10 relative" style={{ perspective: 1200 }}>
              {commandCard}
            </motion.div>
          ) : (
            <motion.div key={section}
              initial={{ opacity: 0, y: 24, scale: 0.98, rotateX: -6, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.99, rotateX: 4, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-6 md:py-8 relative" style={{ perspective: 1200 }}>
              <div className="max-w-6xl mx-auto w-full">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
