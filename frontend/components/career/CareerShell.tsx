"use client";

/**
 * CareerShell — techy chrome for the /career space with TWO distinct themes.
 *
 * DARK MODE (default): "Night HUD"
 *   Deep navy → black gradient, animated cyan grid, scanlines, sweep beam,
 *   vignette, cyan/indigo/acid-green accents, mono font, hud-corner brackets.
 *
 * LIGHT MODE: "Blueprint Schematic"
 *   Cream blueprint-paper (#f5f1e6 → #e8e2d2), fine blue technical grid,
 *   corner registration marks (no brackets), orange-red (#c2410c) pencil-markup
 *   accents alongside deep cyan-blue (#0c4a6e) structural lines, subtle paper
 *   grain, "red pencil" annotations. No parchment/gold/crimson — entirely
 *   unique from the workout imperial light mode.
 *
 * Both use CSS variables on .career-root so sections inherit colors without
 * per-section rewrites, plus a `[data-lt]` override block that flips the
 * common hardcoded dark-rgba tokens to blueprint-paper variants.
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Terminal, Sun, Moon, Bell, Map, Brain, Award, Users, Briefcase,
  Trophy, ClipboardList, Globe, Cpu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";

export type CareerSectionId =
  | "roadmaps" | "skills" | "certs" | "network" | "jobs"
  | "portfolio" | "daily" | "global";

const SECTION_ROUTE: Record<CareerSectionId, string> = {
  roadmaps:  "/career/roadmaps",
  skills:    "/career/skills",
  certs:     "/career/certs",
  network:   "/career/network",
  jobs:      "/career/jobs",
  portfolio: "/career/portfolio",
  daily:     "/career/daily",
  global:    "/career/command",
};

export interface CareerNavItem {
  id: CareerSectionId;
  label: string;
  code: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
  description?: string;
}

export const CAREER_NAV: CareerNavItem[] = [
  { id: "roadmaps",  label: "Roadmaps",    code: "01", icon: Map,          color: "#22d3ee", colorLight: "#0c4a6e", description: "learning.tracks" },
  { id: "skills",    label: "Skills",      code: "02", icon: Brain,        color: "#a78bfa", colorLight: "#6d28d9", description: "inventory.gaps" },
  { id: "certs",     label: "Certs",       code: "03", icon: Award,        color: "#34d399", colorLight: "#047857", description: "courses.creds" },
  { id: "network",   label: "Network",     code: "04", icon: Users,        color: "#f472b6", colorLight: "#be185d", description: "contacts.graph" },
  { id: "jobs",      label: "Jobs",        code: "05", icon: Briefcase,    color: "#fb923c", colorLight: "#c2410c", description: "pipeline.offers" },
  { id: "portfolio", label: "Portfolio",   code: "06", icon: Trophy,       color: "#facc15", colorLight: "#a16207", description: "wins.projects" },
  { id: "daily",     label: "Daily",       code: "07", icon: ClipboardList,color: "#818cf8", colorLight: "#1d4ed8", description: "standup.logs" },
  { id: "global",    label: "Command",     code: "08", icon: Globe,        color: "#e2e8f0", colorLight: "#334155", description: "timeline.vision" },
];

interface Props {
  section: CareerSectionId;
  commandButton: React.ReactNode;
  commandCard?: React.ReactNode;
  children: React.ReactNode;
}

function Cursor({ light }: { light: boolean }) {
  return <span className="inline-block w-2 h-4 ml-0.5 align-middle"
    style={{ background: light ? "#c2410c" : "#22d3ee", animation: "k-blink 1s steps(2) infinite" }}/>;
}

function Clock({ light }: { light: boolean }) {
  const [now, setNow] = useState<string>(() => new Date().toISOString().slice(11,19));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().slice(11,19)), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono tabular-nums text-[11px]" style={{ color: light ? "#0c4a6e" : "#22d3ee" }}>{now} UTC</span>;
}

export default function CareerShell({ section, commandButton, commandCard, children }: Props) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { career } = useStore();
  const light = theme === "light";
  const active = CAREER_NAV.find((n) => n.id === section) ?? CAREER_NAV[0];

  const roadmapCount = career.roadmaps?.length ?? 0;
  const activeRoadmaps = (career.roadmaps ?? []).filter(r => r.status === "active").length;

  // Color tokens per theme
  const T = light ? {
    bg: "radial-gradient(ellipse at top, #f5f1e6 0%, #ebe4d0 55%, #ddd3ba 100%)",
    fg: "#1f2937",
    fgMuted: "#475569",
    fgDim: "#94a3b8",
    border: "rgba(12,74,110,0.35)",
    borderSoft: "rgba(12,74,110,0.2)",
    grid: "rgba(12,74,110,0.09)",
    gridStrong: "rgba(12,74,110,0.18)",
    headerBg: "linear-gradient(180deg, rgba(245,241,230,0.92) 0%, rgba(235,228,208,0.85) 100%)",
    cardBg: "rgba(255,252,244,0.7)",
    cardBg2: "rgba(255,252,244,0.55)",
    accent1: "#0c4a6e",
    accent2: "#c2410c",
    accent3: "#047857",
    accent4: "#6d28d9",
    chipText: "#fff",
    shadow: "none",
    orb1: "rgba(12,74,110,0.15)",
    orb2: "rgba(194,65,12,0.12)",
    orb3: "rgba(4,120,87,0.1)",
    stripe: "linear-gradient(90deg, transparent, #0c4a6e 20%, #c2410c 50%, #047857 80%, transparent)",
    footerBg: "rgba(235,228,208,0.85)",
    dotOnline: "#047857",
    bell: "#64748b",
    bellDot: "#c2410c",
    seal: "#0c4a6e",
    sealBg: "rgba(12,74,110,0.08)",
  } : {
    bg: "radial-gradient(ellipse at top, #0a1624 0%, #05080d 55%, #02050a 100%)",
    fg: "#cbd5e1",
    fgMuted: "#64748b",
    fgDim: "#475569",
    border: "rgba(34,211,238,0.3)",
    borderSoft: "rgba(34,211,238,0.12)",
    grid: "rgba(34,211,238,0.07)",
    gridStrong: "rgba(34,211,238,0.18)",
    headerBg: "linear-gradient(180deg, rgba(5,12,20,0.9) 0%, rgba(5,12,20,0.75) 100%)",
    cardBg: "rgba(8,18,30,0.55)",
    cardBg2: "rgba(8,18,30,0.35)",
    accent1: "#22d3ee",
    accent2: "#fb923c",
    accent3: "#34d399",
    accent4: "#a78bfa",
    chipText: "#05080d",
    shadow: "0 0 20px rgba(34,211,238,0.25)",
    orb1: "rgba(34,211,238,0.22)",
    orb2: "rgba(139,92,246,0.2)",
    orb3: "rgba(52,211,153,0.12)",
    stripe: "linear-gradient(90deg, transparent, #22d3ee 20%, #a78bfa 50%, #34d399 80%, transparent)",
    footerBg: "rgba(5,12,20,0.8)",
    dotOnline: "#34d399",
    bell: "#64748b",
    bellDot: "#f472b6",
    seal: "#34d399",
    sealBg: "rgba(52,211,153,0.08)",
  };

  const aColor = light ? active.colorLight : active.color;

  return (
    <div className="career-root min-h-screen w-full flex flex-col relative overflow-hidden font-mono"
      data-lt={light ? "1" : "0"}
      style={{ color: T.fg, background: T.bg }}>
      <style jsx global>{`
        @keyframes k-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes k-scan {
          0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)}
        }
        @keyframes k-gridshift {
          0%{background-position:0 0} 100%{background-position:40px 40px}
        }
        @keyframes k-pulse-dot {
          0%,100%{opacity:1} 50%{opacity:0.4}
        }
        @keyframes k-paper-grain {
          0%{background-position:0 0} 100%{background-position:100px 100px}
        }
        /* Force mono everywhere in career, kill imperial workout fonts. */
        .career-root .imperial-name,
        .career-root .emperor-title { font-family: var(--font-mono, ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace) !important; letter-spacing: 0.08em !important; font-weight: 700 !important; text-transform: none !important; }
        .career-root .serif-body { font-family: var(--font-mono, ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace) !important; font-style: normal !important; letter-spacing: 0 !important; color: var(--cr-fgMuted) !important; }
        .career-root .font-jp { font-family: var(--font-mono) !important; }
        .career-root .k-blade,
        .career-root .scale-pattern,
        .career-root .grille-pattern,
        .career-root .glitter-bg,
        .career-root .shimmer { display: none !important; }
        /* Color variables that inner sections can read */
        .career-root {
          --cr-bg: ${light ? "#f5f1e6" : "#05080d"};
          --cr-fg: ${T.fg};
          --cr-fgMuted: ${T.fgMuted};
          --cr-fgDim: ${T.fgDim};
          --cr-border: ${T.border};
          --cr-borderSoft: ${T.borderSoft};
          --cr-accent: ${T.accent1};
          --cr-accent2: ${T.accent2};
          --cr-accent3: ${T.accent3};
          --cr-card: ${T.cardBg};
          --cr-card2: ${T.cardBg2};
          --cr-grid: ${T.grid};
        }
        /* Auto-flip common hardcoded dark tokens inside career to light tokens when in blueprint mode. */
        .career-root[data-lt="1"] .hud-corner,
        .career-root[data-lt="1"] [style*="rgba(12,26,34"],
        .career-root[data-lt="1"] [style*="rgba(10,20,24"],
        .career-root[data-lt="1"] [style*="rgba(0,0,0,0.25)"],
        .career-root[data-lt="1"] [style*="rgba(0,0,0,0.3)"],
        .career-root[data-lt="1"] [style*="rgba(0,0,0,0.35)"],
        .career-root[data-lt="1"] [style*="rgba(0,0,0,0.4)"] {
          background: ${T.cardBg} !important;
        }
        .career-root[data-lt="1"] [style*="color:"][style*="#f3e9d2"],
        .career-root[data-lt="1"] [style*="color:"][style*="#e0f2fe"],
        .career-root[data-lt="1"] [style*="color:"][style*="#cffafe"],
        .career-root[data-lt="1"] [style*="color:"][style*="#fecaca"],
        .career-root[data-lt="1"] [style*="color:"][style*="#c4cfd9"],
        .career-root[data-lt="1"] [style*="color:"][style*="#c4b5fd"],
        .career-root[data-lt="1"] [style*="color:"][style*="#fbcfe8"] {
          color: ${T.fg} !important;
        }
        .career-root[data-lt="1"] [style*="color:"][style*="#8b9eb0"],
        .career-root[data-lt="1"] [style*="color:"][style*="#a8b8c8"],
        .career-root[data-lt="1"] [style*="color:"][style*="#6b7280"],
        .career-root[data-lt="1"] [style*="color:"][style*="#475569"] {
          color: ${T.fgMuted} !important;
        }
        .career-root[data-lt="1"] [style*="border:"][style*="rgba(255,255,255,0.05)"],
        .career-root[data-lt="1"] [style*="border:"][style*="rgba(255,255,255,0.06)"],
        .career-root[data-lt="1"] [style*="border:"][style*="rgba(255,255,255,0.08)"],
        .career-root[data-lt="1"] [style*="border:"][style*="rgba(255,255,255,0.1)"],
        .career-root[data-lt="1"] [style*="border:"][style*="rgba(255,255,255,0.15)"] {
          border-color: ${T.borderSoft} !important;
        }
        .career-root[data-lt="1"] textarea,
        .career-root[data-lt="1"] input,
        .career-root[data-lt="1"] select {
          color-scheme: light;
          background: rgba(255,252,244,0.6) !important;
          color: ${T.fg} !important;
          border-color: ${T.borderSoft} !important;
        }
        .career-root[data-lt="1"] textarea::placeholder,
        .career-root[data-lt="1"] input::placeholder { color: ${T.fgDim} !important; }
        .career-root[data-lt="1"] option { background: #f5f1e6; color: #1f2937; }
        .career-root[data-lt="1"] .career-vignette { box-shadow: inset 0 0 140px rgba(120,100,60,0.18); }
        .career-root[data-lt="1"] .career-scanlines { opacity: 0; }
        .career-root textarea:focus,
        .career-root input:focus,
        .career-root select:focus { outline: 1px solid var(--cr-accent) !important; }
        /* Scrollbars */
        .career-root ::-webkit-scrollbar { width: 8px; height: 8px; }
        .career-root ::-webkit-scrollbar-track { background: transparent; }
        .career-root ::-webkit-scrollbar-thumb { background: ${light ? "rgba(12,74,110,0.3)" : "rgba(34,211,238,0.3)"}; border-radius: 0; }
        .career-root ::-webkit-scrollbar-thumb:hover { background: ${light ? "rgba(12,74,110,0.55)" : "rgba(34,211,238,0.55)"}; }
        /* Grid patterns */
        .career-hud-grid {
          background-image:
            linear-gradient(${T.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${T.grid} 1px, transparent 1px),
            linear-gradient(${T.gridStrong} 1px, transparent 1px),
            linear-gradient(90deg, ${T.gridStrong} 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
          ${light ? "animation: none;" : "animation: k-gridshift 18s linear infinite;"}
        }
        .career-scanlines {
          background: repeating-linear-gradient(
            to bottom,
            transparent 0, transparent 3px,
            rgba(34,211,238,0.04) 3px, rgba(34,211,238,0.04) 4px
          );
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        .career-scanbeam {
          position: absolute; left:0; right:0; height:140px;
          background: linear-gradient(to bottom, transparent, ${light ? "rgba(194,65,12,0.06)" : "rgba(34,211,238,0.07)"}, transparent);
          ${light ? "opacity:0;" : "animation: k-scan 9s linear infinite;"}
          pointer-events: none;
        }
        .career-vignette {
          box-shadow: inset 0 0 180px ${light ? "rgba(120,100,60,0.18)" : "rgba(0,0,0,0.7)"};
          pointer-events: none;
        }
        /* Paper grain for light mode */
        .career-root[data-lt="1"] .career-paper {
          position: absolute; inset:0; pointer-events:none; opacity:0.35;
          background-image: radial-gradient(rgba(12,74,110,0.08) 1px, transparent 1px);
          background-size: 3px 3px;
          mix-blend-mode: multiply;
        }
        /* HUD corner brackets (dark) vs registration marks (light) */
        .hud-corner { position: relative; border-width: 1px; border-style: solid; border-color: currentColor; }
        .hud-corner::before, .hud-corner::after,
        .hud-corner > .c-tr, .hud-corner > .c-bl {
          content: ""; position: absolute; width: 14px; height: 14px;
          border-color: currentColor; border-style: solid;
        }
        .hud-corner::before { top:-1px; left:-1px; border-width:2px 0 0 2px; }
        .hud-corner::after  { bottom:-1px; right:-1px; border-width:0 2px 2px 0; }
        .hud-corner > .c-tr { top:-1px; right:-1px; border-width:2px 2px 0 0; }
        .hud-corner > .c-bl { bottom:-1px; left:-1px; border-width:0 0 2px 2px; }
        .career-root[data-lt="1"] .hud-corner {
          border-style: solid;
          border-color: ${T.border};
          background: ${T.cardBg};
        }
        /* Button focus rings */
        .career-root button:focus-visible { outline: 1px solid var(--cr-accent); outline-offset: 2px; }
      `}</style>

      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 career-hud-grid" />
      <div aria-hidden className="pointer-events-none absolute inset-0 career-scanlines" />
      {!light && <div aria-hidden className="pointer-events-none absolute inset-0 career-scanbeam" />}
      <div aria-hidden className="pointer-events-none absolute inset-0 career-vignette" />
      {light && <div aria-hidden className="career-paper" />}

      {/* Floating orbs */}
      <motion.div aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.orb1} 0%, transparent 70%)` }}
        animate={{ x: [0,60,0], y: [0,30,0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[460px] h-[460px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.orb2} 0%, transparent 70%)` }}
        animate={{ x: [0,-40,0], y: [0,40,0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.orb3} 0%, transparent 70%)` }}
        animate={{ x: [0,20,-10,0], y: [0,-20,10,0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }} />

      {/* Top status bar */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-3 md:px-6 border-b z-20 relative"
        style={{ background: T.headerBg, borderColor: T.border, backdropFilter: "blur(10px)" }}>
        <div aria-hidden className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: T.stripe }} />

        {/* Brand bracket */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="relative px-2.5 py-1 rounded-sm hud-corner"
            style={{ color: T.accent1, background: "transparent", borderColor: T.accent1 }}>
            <span className="c-tr"/><span className="c-bl"/>
            <div className="flex items-center gap-1.5">
              {light ? <Terminal size={13} /> : <Cpu size={13} />}
              <span className="text-[11px] tracking-[0.2em] font-bold">KAIZEN</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] tracking-widest" style={{color:T.fgMuted}}>
            <span style={{color:T.accent2}}>/</span>career
            <Cursor light={light}/>
          </div>
        </Link>

        <div className="w-px h-7" style={{background: T.borderSoft}}/>

        <Link href="/" className="md:hidden p-2 rounded" style={{color:T.fgMuted}}>
          <ArrowLeft size={14}/>
        </Link>

        {/* Section HUD pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div key={active.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="relative w-9 h-9 rounded-sm hud-corner flex items-center justify-center shrink-0"
            style={{ color: aColor, background: "transparent", borderColor: aColor }}>
            <span className="c-tr"/><span className="c-bl"/>
            <active.icon size={15} />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest" style={{color:aColor}}>[{active.code}]</span>
              <h2 className="text-sm font-bold tracking-wide truncate" style={{color:T.fg}}>{active.label.toLowerCase()}</h2>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full"
                style={{background:aColor,animation:"k-pulse-dot 1.8s ease-in-out infinite",color:aColor}}/>
            </div>
            <p className="hidden md:block text-[10px] tracking-wider" style={{color:T.fgMuted}}>
              {">"} {active.description}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-3">
          <StatChip label="tracks" value={`${activeRoadmaps}/${roadmapCount}`} color={T.accent1} T={T}/>
        </div>

        <div className="flex-1"/>

        <Clock light={light}/>

        {commandButton}

        <div className="w-px h-6 hidden sm:block" style={{background:T.borderSoft}}/>

        <button aria-label="Alerts" className="hidden sm:inline-flex p-2 rounded-sm transition hover:bg-black/5" style={{color:T.bell}}>
          <Bell size={14}/>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{background:T.bellDot,boxShadow:`0 0 6px ${T.bellDot}`}}/>
        </button>
        <button aria-label="Theme" onClick={toggle} title={`Switch to ${light ? "night HUD" : "blueprint"} mode`}
          className="p-2 rounded-sm transition hover:bg-black/5 hidden sm:inline-flex" style={{color:T.fgMuted}}>
          {light ? <Moon size={14}/> : <Sun size={14}/>}
        </button>

        {/* UID seal */}
        <div className="relative px-2 py-1 rounded-sm hud-corner text-[10px] tracking-widest hidden sm:block"
          style={{color:T.seal,background:T.sealBg,borderColor:T.seal}}>
          <span className="c-tr"/><span className="c-bl"/>
          USR::K
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {commandCard ? (
            <motion.div key="command-card"
              initial={{ opacity: 0, y: 16, scale: 0.99, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 1, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-6 md:py-10">
              {commandCard}
            </motion.div>
          ) : (
            <motion.div key={section}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-5 md:py-7">
              <div className="max-w-6xl mx-auto w-full">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom status strip */}
      <footer className="h-7 shrink-0 flex items-center gap-3 px-3 md:px-6 border-t text-[10px] tracking-widest z-20"
        style={{ background: T.footerBg, borderColor: T.borderSoft, color: T.fgMuted }}>
        <span style={{color:T.dotOnline}}>●</span> <span>SYSTEM::ONLINE</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">SECTOR::{active.code}</span>
        <span className="flex-1"/>
        <span>kaizen.career // v2.0 — {light ? "blueprint" : "night"}</span>
      </footer>
    </div>
  );
}

function StatChip({ label, value, color, T }: { label: string; value: string; color: string; T: any }) {
  return (
    <div className="relative px-2.5 py-1 rounded-sm hud-corner text-[10px] tracking-widest"
      style={{color,background:T.cardBg,borderColor:`${color}88`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <span style={{color:T.fgMuted}}>{label.toUpperCase()}</span>
      <span className="ml-1.5 font-bold" style={{color}}>{value}</span>
    </div>
  );
}
