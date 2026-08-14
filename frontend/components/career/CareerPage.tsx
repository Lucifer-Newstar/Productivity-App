"use client";

/**
 * CareerPage — shared wrapper for all /career/* sub-routes.
 * Mirrors WorkoutPage pattern for consistency:
 *  - CareerShell chrome (HUD/terminal aesthetic)
 *  - CommandNav terminal prompt button
 *  - CommandCard module picker (renders inline, not a modal)
 *  - HudFlash horizontal scan transition between routes
 *  - Mounted guard for hydration safety
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import CareerShell, { type CareerSectionId } from "./CareerShell";
import CommandNav from "./CommandNav";
import CommandCard from "./CommandCard";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  section: CareerSectionId;
  children: React.ReactNode;
}

const ROUTE_MAP: Record<CareerSectionId, string> = {
  roadmaps:  "/career/roadmaps",
  skills:    "/career/skills",
  certs:     "/career/certs",
  network:   "/career/network",
  jobs:      "/career/jobs",
  portfolio: "/career/portfolio",
  daily:     "/career/daily",
  projects:  "/career/projects",
  global:    "/career/command",
};

// Terminal-style horizontal scan-flash (HUD career version of SectionSlash).
// Uses CSS variable so it inherits the correct theme color.
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
          "linear-gradient(180deg, transparent 48%, var(--cr-accent) 49.5%, #fff 50%, var(--cr-accent) 50.5%, transparent 52%)",
        mixBlendMode: "screen",
      }}/>
  );
}

export default function CareerPage({ section, children }: Props) {
  const router = useRouter();
  const [cardOpen, setCardOpen] = useState(false);
  const [slashing, setSlashing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevSection = useRef<CareerSectionId | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close card on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCardOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close card on route change
  useEffect(() => {
    const onRoute = () => setCardOpen(false);
    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [router]);

  // Section slash on navigation
  useEffect(() => {
    if (prevSection.current && prevSection.current !== section) {
      setSlashing(true);
      const t = window.setTimeout(() => setSlashing(false), 450);
      return () => window.clearTimeout(t);
    }
    prevSection.current = section;
  }, [section]);

  const navTo = useCallback((s: CareerSectionId) => {
    setCardOpen(false);
    router.push(ROUTE_MAP[s], undefined, { scroll: false });
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center font-mono text-xs tracking-widest"
        style={{ background: "#05080d", color: "#22d3ee" }}>
        <pre style={{opacity: 0.5}}>{"// booting career.command()\n// > initializing matrix..."}</pre>
      </div>
    );
  }

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
        {children}
      </CareerShell>

      <AnimatePresence>
        {slashing && !cardOpen && <HudFlash />}
      </AnimatePresence>
    </>
  );
}

export { ROUTE_MAP };
export const FULLSCREEN = true;
