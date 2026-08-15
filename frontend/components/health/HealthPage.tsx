"use client";

/**
 * HealthPage — shared FULLSCREEN wrapper for all /health/* routes.
 *
 * - Mounted guard (pre-hydration bootsplash to prevent SSR/client mismatch).
 * - HealthShell chrome with left rail + top beam + EKG trace.
 * - EkgFlash transition sweep between sections.
 * - HealthHotkeys keyboard layer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import HealthShell, { } from "./HealthShell";
import HealthHotkeys from "./HealthHotkeys";
import EkgFlash from "./EkgFlash";
import { AnimatePresence } from "framer-motion";
import type { HealthSectionId } from "../../lib/healthTypes";

interface Props {
  section: HealthSectionId;
  children: React.ReactNode;
}

export default function HealthPage({ section, children }: Props) {
  const router = useRouter();
  const [flashing, setFlashing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevSection = useRef<HealthSectionId | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (prevSection.current && prevSection.current !== section) {
      setFlashing(true);
      const t = window.setTimeout(() => setFlashing(false), 550);
      return () => window.clearTimeout(t);
    }
    prevSection.current = section;
  }, [section]);

  const _unused = useCallback(() => {
    router; // keep router in dep list for future action panels
  }, [router]);
  void _unused;

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "#050a14", color: "#34d399", fontFamily: "ui-monospace, monospace" }}>
        <pre className="text-xs tracking-widest" style={{ opacity: 0.6 }}>{"// initializing vitals...\n// > checking pulse"}</pre>
      </div>
    );
  }

  return (
    <>
      <HealthShell section={section}>
        {children}
      </HealthShell>

      <HealthHotkeys currentSection={section} />

      <AnimatePresence>
        {flashing && <EkgFlash key="ekg-flash" />}
      </AnimatePresence>
    </>
  );
}

export const FULLSCREEN = true;
