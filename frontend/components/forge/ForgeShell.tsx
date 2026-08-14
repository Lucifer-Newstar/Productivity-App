"use client";

/**
 * ForgeShell — industrial heavy-machinery chrome for the /projects space.
 *
 * DARK MODE (default): "Foundry"
 *   Deep iron/charcoal black (#0f0d0b → #080706 → #000), hot rivets,
 *   hazard-stripes, layered steel plates, molten-orange/amber accents
 *   (#f59e0b, #ea580c), heat-cyan quench (#06b6d4), steel grey (#94a3b8),
 *   blood-red (#ef4444) danger, embers/orbs, spark particles. Animated
 *   rivets "pulse" heat, ambient heat shimmer.
 *
 * LIGHT MODE: "Drafting Room"
 *   Yellowed vellum/tracing paper (#f3ecdd → #e8dec4 → #d9cba9), graphite
 *   structural lines (#1f2937), brass (#b45309) grommets/rivets, burnt-orange
 *   (#c2410c) pencil annotations, faint grid, compass/set-square marks,
 *   "APPROVED V.2" technical rubber-stamps, brush-stroke highlights. No
 *   blueprint (career), no parchment (workout), no white.
 *
 * CSS variables on .forge-root drive all section colors. A `[data-lt]`
 * override block flips common dark-rgba tokens into vellum/grey variants.
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer, Flame, HardHat, Pickaxe, ScrollText, Lightbulb,
  Archive, LayoutDashboard, Sun, Moon, Bell, Anvil,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";

export type ForgeSectionId =
  | "foundry" | "quarry" | "smelter" | "vault";

const SECTION_ROUTE: Record<ForgeSectionId, string> = {
  foundry: "/projects",
  quarry:  "/projects/quarry",
  smelter: "/projects/smelter",
  vault:   "/projects/vault",
};

export interface ForgeNavItem {
  id: ForgeSectionId;
  label: string;
  code: string;
  icon: LucideIcon;
  color: string;       // dark-mode molten/steel accent
  colorLight: string;  // light-mode drafting accent (brass/graphite)
  description?: string;
}

export const FORGE_NAV: ForgeNavItem[] = [
  { id: "foundry", label: "Foundry", code: "01", icon: LayoutDashboard, color: "#f59e0b", colorLight: "#92400e", description: "active.projects" },
  { id: "quarry",  label: "Quarry",  code: "02", icon: Pickaxe,         color: "#fb923c", colorLight: "#c2410c", description: "tasks.kanban" },
  { id: "smelter", label: "Smelter", code: "03", icon: Flame,           color: "#ef4444", colorLight: "#7f1d1d", description: "brainstorms.retros" },
  { id: "vault",   label: "Vault",   code: "04", icon: Archive,         color: "#94a3b8", colorLight: "#475569", description: "archive.obituaries" },
];

interface Props {
  section: ForgeSectionId;
  actionButton?: React.ReactNode;
  actionPanel?: React.ReactNode;
  children: React.ReactNode;
}

function Rivet({ color }: { color: string }) {
  return (
    <span aria-hidden
      className="absolute w-2.5 h-2.5 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 30%, #fff8dc 0%, ${color} 50%, rgba(0,0,0,0.6) 100%)`,
        boxShadow: `0 0 6px ${color}, inset 0 -1px 1px rgba(0,0,0,0.7)`,
      }}/>
  );
}

function Clock({ light }: { light: boolean }) {
  const [now, setNow] = useState<string>(() => new Date().toISOString().slice(11,19));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().slice(11,19)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono tabular-nums text-[11px]"
      style={{ color: light ? "#92400e" : "#f59e0b" }}>{now} UTC</span>
  );
}

export default function ForgeShell({ section, actionButton, actionPanel, children }: Props) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { forge } = useStore();
  const light = theme === "light";
  const active = FORGE_NAV.find((n) => n.id === section) ?? FORGE_NAV[0];

  const activeCount = forge.projects.filter(p => !p.archived && p.status !== "dead" && p.status !== "done").length;
  const blockedCount = forge.projects.filter(p => p.status === "blocked" || p.status === "off-track").length;
  const tasksDue = forge.tasks.filter(t => t.today && t.status !== "done").length;

  const T = light ? {
    bg: "radial-gradient(ellipse at top, #f3ecdd 0%, #e8dec4 55%, #d9cba9 100%)",
    fg: "#1f2937",
    fgMuted: "#475569",
    fgDim: "#94a3b8",
    border: "rgba(31,41,55,0.45)",
    borderSoft: "rgba(31,41,55,0.18)",
    grid: "rgba(31,41,55,0.07)",
    gridStrong: "rgba(31,41,55,0.16)",
    headerBg: "linear-gradient(180deg, rgba(243,236,221,0.94) 0%, rgba(232,222,196,0.88) 100%)",
    cardBg: "rgba(255,252,244,0.72)",
    cardBg2: "rgba(255,252,244,0.55)",
    accent1: "#92400e",     // brass
    accent2: "#c2410c",     // burnt-orange pencil
    accent3: "#065f46",     // green (done)
    accent4: "#7f1d1d",     // red (danger)
    accentCyan: "#0c4a6e",  // blueprint quench
    steel: "#475569",
    stripe: "repeating-linear-gradient(-45deg, #1f2937 0 10px, #fcd34d 10px 20px)",
    footerBg: "rgba(232,222,196,0.85)",
    dotOnline: "#065f46",
    bell: "#475569",
    bellDot: "#c2410c",
    stamp: "#7f1d1d",
    seal: "#92400e",
    sealBg: "rgba(146,64,14,0.08)",
    orb1: "rgba(146,64,14,0.14)",
    orb2: "rgba(194,65,12,0.1)",
    orb3: "rgba(31,41,55,0.08)",
    shadow: "none",
  } : {
    bg: "radial-gradient(ellipse at top, #0f0d0b 0%, #080706 55%, #000000 100%)",
    fg: "#e5e7eb",
    fgMuted: "#78716c",
    fgDim: "#44403c",
    border: "rgba(245,158,11,0.35)",
    borderSoft: "rgba(245,158,11,0.12)",
    grid: "rgba(245,158,11,0.06)",
    gridStrong: "rgba(245,158,11,0.18)",
    headerBg: "linear-gradient(180deg, rgba(15,13,11,0.94) 0%, rgba(8,7,6,0.82) 100%)",
    cardBg: "rgba(22,19,16,0.65)",
    cardBg2: "rgba(15,13,11,0.55)",
    accent1: "#f59e0b",    // molten amber
    accent2: "#ea580c",    // orange-hot steel
    accent3: "#22c55e",    // heat-cyan quench is below; green = done
    accent4: "#ef4444",    // blood red
    accentCyan: "#06b6d4", // quench-cool
    steel: "#94a3b8",
    stripe: "repeating-linear-gradient(-45deg, #000 0 10px, #f59e0b 10px 20px)",
    footerBg: "rgba(8,7,6,0.9)",
    dotOnline: "#22c55e",
    bell: "#78716c",
    bellDot: "#ef4444",
    stamp: "#f59e0b",
    seal: "#ea580c",
    sealBg: "rgba(234,88,12,0.08)",
    orb1: "rgba(245,158,11,0.24)",
    orb2: "rgba(234,88,12,0.18)",
    orb3: "rgba(6,182,212,0.1)",
    shadow: "0 0 20px rgba(245,158,11,0.3)",
  };

  const aColor = light ? active.colorLight : active.color;

  return (
    <div className="forge-root min-h-screen w-full flex flex-col relative overflow-hidden"
      data-lt={light ? "1" : "0"}
      style={{ color: T.fg, background: T.bg, fontFamily: "var(--font-condensed, 'Oswald', 'Impact', 'Inter', sans-serif)" }}>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Special+Elite&family=JetBrains+Mono:wght@400;600;800&display=swap');
        @keyframes f-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes f-heat {
          0%,100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-3px) scale(1.08); opacity: 1; }
        }
        @keyframes f-grind {
          0%{background-position:0 0} 100%{background-position:40px 0}
        }
        @keyframes f-spark {
          0% { transform: translate(0,0) scale(1); opacity:1; }
          100% { transform: translate(var(--sx,30px), var(--sy,-40px)) scale(0); opacity:0; }
        }
        @keyframes f-pulse-rivet {
          0%,100% { box-shadow: 0 0 6px currentColor, inset 0 -1px 1px rgba(0,0,0,0.7); }
          50% { box-shadow: 0 0 12px currentColor, inset 0 -1px 1px rgba(0,0,0,0.7); }
        }
        @keyframes f-stamp {
          0% { transform: scale(1.8) rotate(-12deg); opacity:0; }
          60% { transform: scale(0.95) rotate(-8deg); opacity:1; }
          100% { transform: scale(1) rotate(-8deg); opacity:1; }
        }
        .forge-root {
          --fr-bg: ${light ? "#f3ecdd" : "#080706"};
          --fr-fg: ${T.fg};
          --fr-fgMuted: ${T.fgMuted};
          --fr-fgDim: ${T.fgDim};
          --fr-border: ${T.border};
          --fr-borderSoft: ${T.borderSoft};
          --fr-steel: ${T.steel};
          --fr-amber: ${T.accent1};
          --fr-orange: ${T.accent2};
          --fr-green: ${T.accent3};
          --fr-red: ${T.accent4};
          --fr-cyan: ${T.accentCyan};
          --fr-card: ${T.cardBg};
          --fr-card2: ${T.cardBg2};
          --fr-grid: ${T.grid};
          --fr-header: ${T.headerBg};
        }
        /* Kill ALL career/workout bleed classes */
        .forge-root .imperial-name,
        .forge-root .emperor-title,
        .forge-root .serif-body,
        .forge-root .font-jp,
        .forge-root .k-blade,
        .forge-root .scale-pattern,
        .forge-root .grille-pattern,
        .forge-root .glitter-bg,
        .forge-root .shimmer,
        .forge-root .hud-corner { all: unset; }
        .forge-root .career-root,
        .forge-root .workout-root { all: unset; }
        /* Typography: heavy condensed Oswald for headers, JetBrains Mono for metrics, Special Elite for pencil marks */
        .forge-root h1,.forge-root h2,.forge-root h3,.forge-root h4,.forge-root .forge-heading {
          font-family: 'Oswald','Impact',sans-serif !important;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .forge-root code,.forge-root .mono,.forge-root .metric {
          font-family: 'JetBrains Mono',ui-monospace,monospace !important;
        }
        .forge-root .pencil {
          font-family: 'Special Elite', 'Courier New', monospace;
        }
        /* Grid background (steel plate grid in dark, vellum graph in light) */
        .forge-grid {
          background-image:
            linear-gradient(${T.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${T.grid} 1px, transparent 1px),
            linear-gradient(${T.gridStrong} 1px, transparent 1px),
            linear-gradient(90deg, ${T.gridStrong} 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
          ${light ? "" : "animation: f-grind 22s linear infinite;"}
        }
        /* Vignette + heat (dark) / paper-aging (light) */
        .forge-vignette {
          box-shadow: inset 0 0 200px ${light ? "rgba(120,80,20,0.22)" : "rgba(0,0,0,0.8)"};
          pointer-events: none;
        }
        .forge-grain {
          position: absolute; inset:0; pointer-events:none; opacity:0.3;
          background-image: ${light
            ? "radial-gradient(rgba(31,41,55,0.08) 1px, transparent 1px)"
            : "radial-gradient(rgba(245,158,11,0.05) 1px, transparent 1px)"};
          background-size: 3px 3px;
          mix-blend-mode: multiply;
        }
        /* Steel plate / vellum card */
        .steel-plate {
          position: relative;
          background: ${light ? T.cardBg : `linear-gradient(145deg, ${T.cardBg}, rgba(8,7,6,0.6))`};
          border: 1.5px solid ${light ? T.border : "rgba(245,158,11,0.25)"};
          ${light ? "" : "box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 0 rgba(0,0,0,0.5);"}
        }
        .steel-plate::before, .steel-plate::after,
        .steel-plate > .riv-tr, .steel-plate > .riv-bl {
          content: ""; position: absolute; width: 10px; height: 10px;
        }
        /* Rivets in 4 corners (plates can include <span className=riv-tr/><span className=riv-bl/>) */
        .steel-plate .riv-tl,.steel-plate .riv-tr,
        .steel-plate .riv-bl,.steel-plate .riv-br {
          position: absolute; width: 10px; height: 10px; border-radius: 999px;
          background: ${light
            ? `radial-gradient(circle at 30% 30%, #fde68a 0%, ${T.accent1} 55%, rgba(0,0,0,0.5) 100%)`
            : `radial-gradient(circle at 30% 30%, #fde68a 0%, ${T.accent1} 55%, rgba(0,0,0,0.7) 100%)`};
          ${light ? "box-shadow: inset 0 -1px 1px rgba(0,0,0,0.6);" : "animation: f-pulse-rivet 3s ease-in-out infinite;"}
        }
        .steel-plate .riv-tl { top:-5px; left:-5px; }
        .steel-plate .riv-tr { top:-5px; right:-5px; }
        .steel-plate .riv-bl { bottom:-5px; left:-5px; }
        .steel-plate .riv-br { bottom:-5px; right:-5px; }

        /* Hazard stripe bar */
        .hazard-stripe {
          height: 4px;
          background: ${T.stripe};
          ${light ? "" : "box-shadow: 0 0 8px rgba(245,158,11,0.6);"}
        }
        /* Rubber stamp (APPROVED / COMPILED / DEAD) */
        .forge-stamp {
          font-family: 'Oswald',sans-serif;
          font-weight: 800;
          letter-spacing: 0.2em;
          border: 2.5px solid currentColor;
          padding: 2px 8px;
          display: inline-block;
          transform: rotate(-8deg);
          opacity: 0.85;
          border-radius: 2px;
          animation: f-stamp 0.5s ease-out;
        }
        /* Buttons: chunky press */
        .forge-root button { font-family: 'Oswald',sans-serif; letter-spacing:0.08em; text-transform: uppercase; }
        .forge-root button:focus-visible { outline: 2px solid ${T.accent1}; outline-offset: 2px; }

        .forge-root ::selection { background: ${T.accent1}; color: #000; }
        .forge-root ::-webkit-scrollbar { width: 10px; height: 10px; }
        .forge-root ::-webkit-scrollbar-track { background: transparent; }
        .forge-root ::-webkit-scrollbar-thumb {
          background: ${light ? "rgba(31,41,55,0.3)" : "rgba(245,158,11,0.35)"};
        }
        .forge-root ::-webkit-scrollbar-thumb:hover {
          background: ${light ? "rgba(31,41,55,0.55)" : "rgba(245,158,11,0.6)"};
        }

        /* Light mode overrides for hardcoded dark values */
        .forge-root[data-lt="1"] .steel-plate {
          background: ${T.cardBg};
          border-color: rgba(31,41,55,0.4);
          box-shadow: 2px 3px 0 -1px rgba(31,41,55,0.25);
        }
        .forge-root[data-lt="1"] input,
        .forge-root[data-lt="1"] textarea,
        .forge-root[data-lt="1"] select {
          background: rgba(255,252,244,0.7) !important;
          color: ${T.fg} !important;
          border-color: ${T.borderSoft} !important;
        }
        .forge-root[data-lt="1"] textarea::placeholder,
        .forge-root[data-lt="1"] input::placeholder { color: ${T.fgDim} !important; }
        .forge-root[data-lt="1"] option { background: #f3ecdd; color: #1f2937; }

        /* Lift on steel plates in dark mode */
        .forge-root[data-lt="0"] .steel-plate {
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }
        .forge-root[data-lt="0"] button.steel-plate:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 30px -12px rgba(245,158,11,0.55);
          border-color: ${T.accent1};
        }
        /* Pencil-press jiggle in light mode */
        .forge-root[data-lt="1"] button.steel-plate:active {
          transform: translate(1px, 1px) rotate(0.3deg);
        }
      `}</style>

      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 forge-grid" />
      <div aria-hidden className="pointer-events-none absolute inset-0 forge-vignette" />
      <div aria-hidden className="forge-grain" />

      {/* Floating heat orbs */}
      <motion.div aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.orb1} 0%, transparent 70%)` }}
        animate={{ x: [0,50,0], y: [0,30,0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.orb2} 0%, transparent 70%)` }}
        animate={{ x: [0,-40,0], y: [0,40,0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${T.orb3} 0%, transparent 70%)` }}
        animate={{ x: [0,20,-10,0], y: [0,-20,10,0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} />

      {/* Top bar (steel I-beam) */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-3 md:px-6 border-b z-20 relative"
        style={{ background: T.headerBg, borderColor: T.border, backdropFilter: "blur(10px)" }}>
        <div aria-hidden className="absolute top-0 left-0 right-0 hazard-stripe" />

        {/* Brand plate */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="relative px-2.5 py-1 rounded-sm steel-plate"
            style={{ color: T.accent1, background: "transparent", borderColor: T.accent1 }}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <div className="flex items-center gap-1.5">
              <Anvil size={14}/>
              <span className="text-[12px] tracking-[0.2em] font-black">FORGE</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] tracking-widest" style={{color:T.fgMuted}}>
            <span style={{color:T.accent2}}>/</span>projects
          </div>
        </Link>

        <div className="w-px h-7" style={{background: T.borderSoft}}/>

        {/* Section plate */}
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div key={active.id}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="relative w-9 h-9 rounded-sm steel-plate flex items-center justify-center shrink-0"
            style={{ color: aColor, background: "transparent", borderColor: aColor }}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <active.icon size={15}/>
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest" style={{color:aColor}}>§{active.code}</span>
              <h2 className="text-sm font-black tracking-wide uppercase truncate">{active.label}</h2>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full"
                style={{background:aColor, animation:"f-pulse-rivet 1.8s ease-in-out infinite", color:aColor}}/>
            </div>
            <p className="hidden md:block text-[10px] tracking-wider mono" style={{color:T.fgMuted}}>
              // {active.description}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-3">
          <StatPlate label="heat" value={activeCount} color={T.accent1} T={T}/>
          <StatPlate label="cold" value={blockedCount} color={T.accent4} T={T}/>
          <StatPlate label="today" value={tasksDue} color={T.accentCyan} T={T}/>
        </div>

        <div className="flex-1"/>

        <Clock light={light}/>

        {actionButton}

        <div className="w-px h-6 hidden sm:block" style={{background:T.borderSoft}}/>

        <button aria-label="Alerts" className="hidden sm:inline-flex p-2 rounded-sm transition hover:bg-black/5 relative" style={{color:T.bell}}>
          <Bell size={14}/>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{background:T.bellDot, boxShadow:`0 0 6px ${T.bellDot}`}}/>
        </button>
        <button aria-label="Theme" onClick={toggle}
          title={`Switch to ${light ? "foundry" : "drafting"} mode`}
          className="p-2 rounded-sm transition hover:bg-black/5 hidden sm:inline-flex" style={{color:T.fgMuted}}>
          {light ? <Moon size={14}/> : <Sun size={14}/>}
        </button>

        <div className="relative px-2 py-1 rounded-sm steel-plate text-[10px] tracking-widest hidden sm:block"
          style={{color:T.seal, background:T.sealBg, borderColor:T.seal}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          HEAT::720°C
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {actionPanel ? (
            <motion.div key="action-panel"
              initial={{ opacity: 0, y: 16, scale: 0.99, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 1, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-6 md:py-10">
              {actionPanel}
            </motion.div>
          ) : (
            <motion.div key={section}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
              className="px-4 md:px-8 py-5 md:py-7">
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer: I-beam bottom */}
      <footer className="h-7 shrink-0 flex items-center gap-3 px-3 md:px-6 border-t text-[10px] tracking-widest z-20 mono"
        style={{ background: T.footerBg, borderColor: T.borderSoft, color: T.fgMuted }}>
        <span style={{color:T.dotOnline}}>●</span> <span>FORGE::LIVE</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">ANVIL::{active.code}</span>
        <span className="hidden md:inline">|</span>
        <span className="hidden md:inline-flex items-center gap-1">
          <kbd className="mono text-[9px] font-black px-1 rounded-sm"
            style={{border:`1px solid ${T.border}`,color:T.accent1}}>?</kbd>
          <span>hotkeys</span>
        </span>
        <span className="flex-1"/>
        <span className={light ? "pencil" : ""}>kaizen.forge // v1.0 — {light ? "vellum" : "foundry"}</span>
      </footer>
    </div>
  );
}

function StatPlate({ label, value, color, T }: { label: string; value: number | string; color: string; T: any }) {
  return (
    <div className="relative px-2.5 py-1 rounded-sm steel-plate text-[10px] tracking-widest"
      style={{color, background:T.cardBg2, borderColor:`${color}88`}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <span style={{color:T.fgMuted}}>{label.toUpperCase()}</span>
      <span className="ml-1.5 font-black" style={{color}}>{value}</span>
    </div>
  );
}
