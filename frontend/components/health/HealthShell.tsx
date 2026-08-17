"use client";

/**
 * HealthShell — chrome for the /health/* FULLSCREEN space.
 *
 * Layout mirrors the Forge/Career/Workout full-screen pattern but themed as
 * a medical/vitals OS ("VITAL-SIGN" dark, "CLINIC" light):
 *
 *  - LEFT RAIL 72px desktop / collapsed on mobile: vertical EKG-green trace,
 *    stenciled sector numerals (00–09), heartbeat pulse icon, footer
 *    "kaizen.health // v0.1" label.
 *  - TOP HEADER BEAM: VITAL-SIGN wordmark, live ISO clock, current section,
 *    health-score gauge placeholder, theme toggle, gear.
 *  - MAIN CONTENT AREA: radial navy (dark) or grid paper (light), EKG pulse
 *    trace animating across the top of content on load/route change.
 *  - EKG TRACE FOOTER: thin lime EKG rhythm line anchored to bottom.
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, Heart, Moon, Sun, Home } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { HEALTH_SECTIONS, type HealthSectionId } from "../../lib/healthTypes";
import NotificationButton from "../NotificationButton";

interface Props {
  section: HealthSectionId;
  children: React.ReactNode;
}

const ROUTE_BY_ID: Record<HealthSectionId, string> = (() => {
  const map = {} as Record<HealthSectionId, string>;
  for (const s of HEALTH_SECTIONS) map[s.id] = s.route;
  return map;
})();

/** Live EKG SVG trace drawn with a motion path. */
function EkgTrace({ className = "", color = "#10b981", pulseKey = 0 }: { className?: string; color?: string; pulseKey?: number }) {
  // Classic EKG P-QRS-T waveform path, designed for 600x60 viewBox.
  // Repeats seamlessly.
  const path =
    "M0,30 " +
    "L220,30 L235,30 L242,18 L250,30 L265,30 " +         // P wave
    "L275,30 L280,40 L285,25 " +                           // Q dip
    "L290,-15 L298,60 " +                                  // R spike / S dip
    "L308,30 L320,30 " +
    "L345,30 L360,8 L380,30 " +                            // T wave
    "L600,30";
  return (
    <svg key={pulseKey} viewBox="0 0 600 60" className={className} preserveAspectRatio="none" aria-hidden>
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.2 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.4, 1, 0.7] }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

function Clock({ light }: { light: boolean }) {
  const [now, setNow] = useState<string>(() => new Date().toISOString().slice(11, 19));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().slice(11, 19)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono tabular-nums text-[11px] tracking-widest"
      style={{ color: light ? "#065f46" : "#34d399" }}>
      {now} <span style={{ opacity: 0.6 }}>UTC</span>
    </span>
  );
}

export default function HealthShell({ section, children }: Props) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const light = theme === "light";
  const [pulseKey, setPulseKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { setMounted(true); }, []);

  // Re-fire the EKG pulse animation when section changes
  useEffect(() => {
    setPulseKey(k => k + 1);
  }, [section]);

  // Keep "now" ticking for IST date display in top bar
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "#050a14", color: "#34d399", fontFamily: "ui-monospace, monospace" }}>
        <pre className="text-xs tracking-widest" style={{ opacity: 0.6 }}>{"// initializing vitals...\n// > checking pulse"}</pre>
      </div>
    );
  }

  const istDate = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const active = HEALTH_SECTIONS.find(s => s.id === section) ?? HEALTH_SECTIONS[0];

  // VITAL-SIGN dark theme tokens default; CLINIC overrides via [data-lt="1"] scoping on the wrapper.
  return (
    <div className={light ? "health-root health-light" : "health-root health-dark"} data-lt={light ? "1" : "0"}>
      {/* ===== LEFT RAIL ===== */}
      <aside className="hlth-rail">
        {/* Brand heart icon with pulse */}
        <div className="hlth-brand">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}>
            <Heart size={26} fill="currentColor" />
          </motion.div>
          <div className="hlth-brand-label">
            <span style={{ fontWeight: 900, letterSpacing: "0.15em", fontSize: 11 }}>VITALS</span>
            <span style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.6 }}>KAIZEN</span>
          </div>
        </div>

        {/* Vertical EKG decorative line */}
        <div className="hlth-rail-trace" aria-hidden>
          <svg width="20" height="100%" viewBox="0 0 20 200" preserveAspectRatio="none">
            <path d="M10,0 L10,80 L4,80 L10,100 L16,80 L10,120 L10,200"
              stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          </svg>
        </div>

        {/* Nav items */}
        <nav className="hlth-nav">
          {HEALTH_SECTIONS.map(s => {
            const isActive = s.id === section;
            return (
              <Link key={s.id} href={s.route} scroll={false}
                className="hlth-nav-item"
                data-active={isActive ? "1" : "0"}
                title={s.label}>
                <span className="hlth-nav-code">{s.code}</span>
                <span className="hlth-nav-short">{s.short}</span>
                <span className="hlth-nav-label">{s.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="hlth-rail-footer">
          <Link href="/" title="Home" className="hlth-home-link">
            <Home size={14}/>
          </Link>
          <span className="hlth-version">v0.1</span>
        </div>
      </aside>

      {/* ===== MAIN COLUMN ===== */}
      <div className="hlth-main">
        {/* Top beam */}
        <header className="hlth-topbar">
          <div className="hlth-topbar-left">
            <h1 className="hlth-wordmark">
              <Activity size={18} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />
              {active.label.toUpperCase()}
            </h1>
            <span className="hlth-section-desc">// {active.description}</span>
          </div>
          <div className="hlth-topbar-right">
            <span className="hlth-date">{istDate}</span>
            <Clock light={light} />
            <NotificationButton size={14} className="hlth-icon-btn"/>
            <button
              onClick={toggle}
              className="hlth-icon-btn"
              title={light ? "Switch to VITAL-SIGN dark" : "Switch to CLINIC light"}
              aria-label="Toggle theme"
            >
              {light ? <Moon size={14}/> : <Sun size={14}/>}
            </button>
          </div>
        </header>

        {/* Top EKG trace decoration */}
        <div className="hlth-top-ekg" aria-hidden>
          <EkgTrace pulseKey={pulseKey} color={light ? "#059669" : "#34d399"} className="hlth-ekg-svg"/>
        </div>

        {/* Content area */}
        <main className="hlth-content">
          {children}
        </main>

        {/* Footer EKG line */}
        <div className="hlth-footer-ekg" aria-hidden>
          <EkgTrace color={light ? "#10b981" : "#10b981"} className="hlth-ekg-svg" pulseKey={(pulseKey % 3) + 100} />
          <span className="hlth-disclaimer">
            Educational tool. Not medical advice. Consult qualified healthcare professionals for medical concerns.
          </span>
        </div>
      </div>

      {/* Local-scoped styles so we don't bloat globals.css */}
      <style jsx global>{`
        /* ===== VITAL-SIGN DARK (default) ===== */
        .health-root {
          --hlth-bg: radial-gradient(at 20% 10%, rgba(16,185,129,0.08) 0, transparent 50%),
                     radial-gradient(at 80% 90%, rgba(6,182,212,0.06) 0, transparent 45%),
                     #050a14;
          --hlth-fg: #f8fafc;
          --hlth-muted: #94a3b8;
          --hlth-card: rgba(10, 22, 40, 0.85);
          --hlth-card2: rgba(15, 30, 55, 0.9);
          --hlth-border: rgba(52,211,153,0.25);
          --hlth-border-soft: rgba(148,163,184,0.15);
          --hlth-accent: #10b981;   /* EKG green */
          --hlth-accent-glow: #34d399;
          --hlth-red: #ef4444;
          --hlth-cyan: #06b6d4;
          --hlth-amber: #f59e0b;
          --hlth-font-mono: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;
          --hlth-font-display: "Chakra Petch", "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
          min-height: 100vh;
          width: 100%;
          color: var(--hlth-fg);
          background: var(--hlth-bg);
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          display: grid;
          grid-template-columns: 72px 1fr;
        }
        /* ===== CLINIC LIGHT ===== */
        .health-root.health-light {
          --hlth-bg:
            linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px) 0 0/24px 24px,
            linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px) 0 0/24px 24px,
            linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px) 0 0/120px 120px,
            linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px) 0 0/120px 120px,
            #fafafa;
          --hlth-fg: #0f172a;
          --hlth-muted: #64748b;
          --hlth-card: #ffffff;
          --hlth-card2: #f1f5f9;
          --hlth-border: rgba(5,150,105,0.3);
          --hlth-border-soft: rgba(100,116,139,0.2);
          --hlth-accent: #059669;
          --hlth-accent-glow: #10b981;
          --hlth-red: #dc2626;
          --hlth-cyan: #0891b2;
          --hlth-amber: #d97706;
        }
        .hlth-rail {
          position: sticky; top: 0;
          height: 100vh;
          border-right: 1px solid var(--hlth-border-soft);
          background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 40%, rgba(0,0,0,0.2) 100%),
                      var(--hlth-card2);
          display: flex; flex-direction: column; align-items: center;
          padding: 14px 6px 10px;
          gap: 8px;
          font-family: var(--hlth-font-mono);
        }
        .health-light .hlth-rail {
          background: linear-gradient(180deg, rgba(15,23,42,0.04) 0%, transparent 40%, rgba(15,23,42,0.05) 100%),
                      var(--hlth-card);
        }
        .hlth-brand {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          color: var(--hlth-accent-glow);
          padding: 4px 0 8px;
        }
        .hlth-brand-label { display: flex; flex-direction: column; align-items: center; margin-top: 2px; }
        .hlth-rail-trace { flex: 1; position: relative; width: 100%; color: var(--hlth-accent); opacity: 0.4; }
        .hlth-rail-trace svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .hlth-nav { display: flex; flex-direction: column; gap: 3px; width: 100%; padding: 4px 0; flex: 2; }
        .hlth-nav-item {
          display: grid; grid-template-columns: 18px 1fr;
          column-gap: 6px; row-gap: 0;
          align-items: center;
          padding: 8px 6px;
          border-radius: 6px;
          text-decoration: none;
          color: var(--hlth-muted);
          font-size: 9px;
          letter-spacing: 0.15em;
          position: relative;
          transition: all 0.15s;
          cursor: pointer;
          border-left: 2px solid transparent;
        }
        .hlth-nav-item:hover {
          background: rgba(52,211,153,0.08);
          color: var(--hlth-fg);
        }
        .hlth-nav-item[data-active="1"] {
          background: rgba(16,185,129,0.15);
          color: var(--hlth-accent-glow);
          border-left-color: var(--hlth-accent);
          box-shadow: inset 0 0 20px rgba(16,185,129,0.08);
        }
        .hlth-nav-code {
          font-size: 9px; opacity: 0.5;
          grid-column: 1; grid-row: 1 / span 2;
          text-align: center; font-weight: 700;
        }
        .hlth-nav-short {
          grid-column: 2;
          font-weight: 800; font-size: 10px;
          letter-spacing: 0.12em;
        }
        .hlth-nav-label {
          grid-column: 2;
          font-size: 9px; opacity: 0.65;
          letter-spacing: 0.1em; text-transform: uppercase;
          display: none;
        }
        @media (min-width: 1100px) {
          .health-root { grid-template-columns: 180px 1fr; }
          .hlth-nav-item { grid-template-columns: 30px 1fr; padding: 8px 10px; }
          .hlth-nav-label { display: block; }
          .hlth-brand { flex-direction: row; gap: 8px; }
          .hlth-brand-label { align-items: flex-start; }
        }
        .hlth-rail-footer {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding-top: 8px; border-top: 1px solid var(--hlth-border-soft);
          font-size: 9px; color: var(--hlth-muted); letter-spacing: 0.2em;
          width: 100%;
        }
        .hlth-home-link {
          color: var(--hlth-muted);
          padding: 4px; border-radius: 4px;
          display: inline-flex;
        }
        .hlth-home-link:hover { color: var(--hlth-accent-glow); background: rgba(52,211,153,0.1); }

        /* ===== MAIN AREA ===== */
        .hlth-main { display: flex; flex-direction: column; min-height: 100vh; position: relative; }
        .hlth-topbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 22px 10px;
          border-bottom: 1px solid var(--hlth-border-soft);
          background: linear-gradient(180deg, rgba(16,185,129,0.05), transparent);
          font-family: var(--hlth-font-mono);
        }
        .hlth-topbar-left { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
        .hlth-topbar-right { display: flex; align-items: center; gap: 14px; }
        .hlth-wordmark {
          margin: 0;
          font-family: var(--hlth-font-display);
          font-weight: 900; font-size: 20px; letter-spacing: 0.12em;
          color: var(--hlth-accent-glow);
          text-shadow: 0 0 18px rgba(52,211,153,0.25);
        }
        .health-light .hlth-wordmark { text-shadow: none; color: var(--hlth-accent); }
        .hlth-section-desc { font-size: 11px; letter-spacing: 0.1em; color: var(--hlth-muted); }
        .hlth-date { font-size: 11px; letter-spacing: 0.15em; color: var(--hlth-muted); text-transform: uppercase; }
        .hlth-icon-btn {
          background: transparent;
          border: 1px solid var(--hlth-border-soft);
          color: var(--hlth-muted);
          width: 28px; height: 28px; border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .hlth-icon-btn:hover {
          color: var(--hlth-accent-glow); border-color: var(--hlth-accent);
          background: rgba(16,185,129,0.1);
        }
        .hlth-top-ekg { position: relative; height: 22px; overflow: hidden; }
        .hlth-ekg-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .hlth-content {
          flex: 1;
          padding: 22px 22px 80px;
          position: relative;
        }
        .hlth-footer-ekg {
          position: relative; height: 26px; padding: 0 22px;
          border-top: 1px solid var(--hlth-border-soft);
          display: flex; align-items: center; gap: 12px;
        }
        .hlth-footer-ekg .hlth-ekg-svg { flex: 1; height: 100%; }
        .hlth-disclaimer {
          font-family: var(--hlth-font-mono);
          font-size: 9px; letter-spacing: 0.15em;
          color: var(--hlth-muted); opacity: 0.7;
          white-space: nowrap;
        }

        /* ===== Content primitives used by section children ===== */
        .hlth-grid {
          display: grid; gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
        .hlth-card {
          background: var(--hlth-card);
          border: 1px solid var(--hlth-border-soft);
          border-radius: 10px;
          padding: 16px 18px;
          position: relative;
          backdrop-filter: blur(4px);
        }
        .hlth-card-h { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--hlth-muted); margin-bottom: 6px; font-family: var(--hlth-font-mono); }
        .hlth-kpi { font-family: var(--hlth-font-display); font-weight: 900; font-size: 28px; letter-spacing: 0.02em; color: var(--hlth-fg); }
        .hlth-kpi-unit { font-size: 12px; color: var(--hlth-muted); margin-left: 4px; font-family: var(--hlth-font-mono); font-weight: 400; letter-spacing: 0.1em; }
        .hlth-subtle { color: var(--hlth-muted); font-size: 12px; font-family: var(--hlth-font-mono); letter-spacing: 0.05em; }
        .hlth-btn {
          font-family: var(--hlth-font-mono);
          font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
          background: var(--hlth-accent); color: #04251a; border: none;
          padding: 8px 14px; border-radius: 6px; font-weight: 800;
          cursor: pointer; transition: all 0.15s;
        }
        .hlth-btn:hover { background: var(--hlth-accent-glow); box-shadow: 0 0 18px rgba(52,211,153,0.4); }
        .hlth-btn-ghost {
          background: transparent; color: var(--hlth-fg);
          border: 1px solid var(--hlth-border);
        }
        .hlth-btn-ghost:hover { background: rgba(16,185,129,0.1); color: var(--hlth-accent-glow); }

        @media (max-width: 720px) {
          .health-root { grid-template-columns: 60px 1fr; }
          .hlth-wordmark { font-size: 16px; }
          .hlth-section-desc { display: none; }
          .hlth-date { display: none; }
          .hlth-content { padding: 16px 14px 80px; }
          .hlth-disclaimer { display: none; }
        }
      `}</style>
    </div>
  );
}
