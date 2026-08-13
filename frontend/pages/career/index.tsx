"use client";

/**
 * Career page — techy cyberpunk command-center for the Kaizen career space.
 * Distinct from the imperial Japanese aesthetic used by /workout.
 * Grid/hud/terminal vibe — dark with cyan/violet/green accents, scanlines,
 * mono font, corner-bracket panels.
 *
 * Uses CareerShell chrome with a cyan/indigo palette, a floating COMMAND
 * button (CommandNav) in the top strip that summons the CommandCard inline,
 * and routes between the 8 sections locally (state-based, no router).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import CareerShell, { type CareerSectionId } from "../../components/career/CareerShell";
import CommandNav from "../../components/career/CommandNav";
import CommandCard from "../../components/career/CommandCard";
import { AnimatePresence, motion } from "framer-motion";

import RoadmapsSection from "../../components/career/sections/RoadmapsSection";
import SkillsSection from "../../components/career/sections/SkillsSection";
import CertsSection from "../../components/career/sections/CertsSection";
import NetworkSection from "../../components/career/sections/NetworkSection";
import JobsSection from "../../components/career/sections/JobsSection";
import PortfolioSection from "../../components/career/sections/PortfolioSection";
import DailySection from "../../components/career/sections/DailySection";
import GlobalSection from "../../components/career/sections/GlobalSection";

const DEFAULT_SECTION: CareerSectionId = "roadmaps";

// Terminal-style horizontal scan-flash (replaces the katana SectionSlash for career).
function HudFlash() {
  return (
    <motion.div aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, times: [0, 0.15, 0.55, 1] }}
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background:
          "linear-gradient(180deg, transparent 48%, rgba(34,211,238,0.6) 49.5%, #fff 50%, rgba(34,211,238,0.6) 50.5%, transparent 52%)",
        mixBlendMode: "screen",
      }}/>
  );
}

export default function CareerPage() {
  const [section, setSection] = useState<CareerSectionId>(DEFAULT_SECTION);
  const [cardOpen, setCardOpen] = useState(false);
  const [slashing, setSlashing] = useState(false);
  const prevSection = useRef<CareerSectionId | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Section-slash when user navigates
  useEffect(() => {
    if (prevSection.current && prevSection.current !== section) {
      setSlashing(true);
      const t = window.setTimeout(() => setSlashing(false), 450);
      return () => window.clearTimeout(t);
    }
    prevSection.current = section;
  }, [section]);

  // Close card on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCardOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navTo = useCallback((s: CareerSectionId) => {
    setCardOpen(false);
    setSection(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!mounted) {
    // Avoid hydration mismatches from Date.now()-derived UI (days-since, streaks, timers).
    return (
      <div className="min-h-screen w-full flex items-center justify-center font-mono text-xs tracking-widest"
        style={{ background: "#05080d", color: "#22d3ee" }}>
        <pre style={{opacity: 0.5}}>{"// booting career.command()\n// > initializing matrix..."}</pre>
      </div>
    );
  }

  const content = (() => {
    switch (section) {
      case "roadmaps":  return <RoadmapsSection />;
      case "skills":    return <SkillsSection />;
      case "certs":     return <CertsSection />;
      case "network":   return <NetworkSection />;
      case "jobs":      return <JobsSection />;
      case "portfolio": return <PortfolioSection />;
      case "daily":     return <DailySection />;
      case "global":    return <GlobalSection />;
      default:          return <RoadmapsSection />;
    }
  })();

  return (
    <>
      <CareerShell
        section={section}
        commandButton={
          <CommandNav open={cardOpen} onToggle={() => setCardOpen(v => !v)} />
        }
        commandCard={cardOpen ? (
          <CommandCard current={section} onPick={navTo} />
        ) : undefined}
      >
        {content}
      </CareerShell>

      <AnimatePresence>
        {slashing && !cardOpen && <HudFlash />}
      </AnimatePresence>
    </>
  );
}

export const FULLSCREEN = true;
