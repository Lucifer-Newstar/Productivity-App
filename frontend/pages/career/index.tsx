"use client";

/**
 * Career page — immersive command-center for the Kaizen career space.
 *
 * Uses CareerShell chrome with the cyan/gold palette, a floating COMMAND
 * button (CommandNav) in the top strip that summons the CommandCard inline,
 * and routes between the 8 sections locally (state-based, no router) to keep
 * page transitions instant. A SectionSlash katana-flash plays between sections.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import CareerShell, { CAREER_NAV, type CareerSectionId } from "../../components/career/CareerShell";
import CommandNav from "../../components/career/CommandNav";
import CommandCard from "../../components/career/CommandCard";
import SectionSlash from "../../components/workout/SectionSlash";
import { AnimatePresence } from "framer-motion";

import RoadmapsSection from "../../components/career/sections/RoadmapsSection";
import SkillsSection from "../../components/career/sections/SkillsSection";
import CertsSection from "../../components/career/sections/CertsSection";
import NetworkSection from "../../components/career/sections/NetworkSection";
import JobsSection from "../../components/career/sections/JobsSection";
import PortfolioSection from "../../components/career/sections/PortfolioSection";
import DailySection from "../../components/career/sections/DailySection";
import GlobalSection from "../../components/career/sections/GlobalSection";

const DEFAULT_SECTION: CareerSectionId = "roadmaps";

export default function CareerPage() {
  const [section, setSection] = useState<CareerSectionId>(DEFAULT_SECTION);
  const [cardOpen, setCardOpen] = useState(false);
  const [slashing, setSlashing] = useState(false);
  const prevSection = useRef<CareerSectionId | null>(null);

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
        {slashing && !cardOpen && <SectionSlash />}
      </AnimatePresence>
    </>
  );
}

export const FULLSCREEN = true;
