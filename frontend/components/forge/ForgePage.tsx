"use client";

/**
 * ForgePage — shared wrapper for all /projects/* routes.
 * Mirrors CareerPage but themed: HammerStrike (vertical molten spark sweep),
 * mounted guard, ActionNav (hammer button), ActionPanel (the forge "command card"
 * is inline as the action panel rather than a modal).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import ForgeShell, { type ForgeSectionId } from "./ForgeShell";
import ActionNav from "./ActionNav";
import ActionPanel from "./ActionPanel";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  section: ForgeSectionId;
  children: React.ReactNode;
}

const ROUTE_MAP: Record<ForgeSectionId, string> = {
  foundry: "/projects",
  quarry:  "/projects/quarry",
  smelter: "/projects/smelter",
  vault:   "/projects/vault",
};

// Vertical "hammer strike" — molten line slams down from top with ember glow.
function HammerStrike() {
  return (
    <>
      <motion.div aria-hidden
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scaleY: [0, 1, 1, 1] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, times: [0, 0.15, 0.6, 1] }}
        className="fixed inset-0 pointer-events-none z-[55]"
        style={{
          background:
            "linear-gradient(90deg, transparent 48%, var(--fr-amber) 49%, #fff 50%, var(--fr-orange) 51%, transparent 52%)",
          mixBlendMode: "screen",
          transformOrigin: "top",
        }}/>
      <motion.div aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
        className="fixed inset-0 pointer-events-none z-[54]"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.25), transparent 60%)",
        }}/>
    </>
  );
}

export default function ForgePage({ section, children }: Props) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [striking, setStriking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevSection = useRef<ForgeSectionId | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
      // hotkey: press G then 1-4 for quick nav
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onRoute = () => setPanelOpen(false);
    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [router]);

  useEffect(() => {
    if (prevSection.current && prevSection.current !== section) {
      setStriking(true);
      const t = window.setTimeout(() => setStriking(false), 600);
      return () => window.clearTimeout(t);
    }
    prevSection.current = section;
  }, [section]);

  const navTo = useCallback((s: ForgeSectionId) => {
    setPanelOpen(false);
    router.push(ROUTE_MAP[s], undefined, { scroll: false });
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "#080706", color: "#f59e0b", fontFamily: "ui-monospace, monospace" }}>
        <pre className="text-xs tracking-widest" style={{opacity:0.6}}>{"// stoking the forge...\n// > heating anvil"}</pre>
      </div>
    );
  }

  return (
    <>
      <ForgeShell
        section={section}
        actionButton={<ActionNav open={panelOpen} onToggle={()=>setPanelOpen(v=>!v)}/>}
        actionPanel={panelOpen ? <ActionPanel current={section} onPick={navTo}/> : undefined}
      >
        {children}
      </ForgeShell>

      <AnimatePresence>
        {striking && !panelOpen && <HammerStrike/>}
      </AnimatePresence>
    </>
  );
}

export { ROUTE_MAP };
export const FULLSCREEN = true;
