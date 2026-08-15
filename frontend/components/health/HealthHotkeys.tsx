"use client";
/**
 * HealthHotkeys — global keyboard layer for /health/* routes.
 *
 * Shortcuts:
 *   ?              → toggle help overlay
 *   g t / g 0      → Triage (dashboard)
 *   g f / g 1      → Fuel (nutrition)
 *   g w / g 2      → Hydration (water)
 *   g s / g 3      → Somnium (sleep)
 *   g b / g 4      → Soma (physique/body)
 *   g p / g 5      → Apothecary (supps)
 *   g v / g 6      → Vitals
 *   g m / g 7      → Mind
 *   g l / g 8      → Lab (profile/sync)
 *   g r / g 9      → Reports
 *   g h            → Home (/)
 *   n              → quick-log (future)
 *   t              → toggle theme
 *   Esc            → close overlays
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../lib/theme";
import { HEALTH_SECTIONS, type HealthSectionId } from "../../lib/healthTypes";

const CHORD_TIMEOUT = 1200;

const KEY_TO_SECTION: Record<string, HealthSectionId> = {
  t: "triage", "0": "triage",
  f: "fuel", "1": "fuel",
  w: "hydration", "2": "hydration",
  s: "somnium", "3": "somnium",
  b: "soma", "4": "soma",
  p: "apothecary", "5": "apothecary",
  v: "vitals", "6": "vitals",
  m: "mind", "7": "mind",
  l: "lab", "8": "lab",
  r: "reports", "9": "reports",
};

const ROUTE_BY_ID: Record<HealthSectionId, string> = (() => {
  const m = {} as Record<HealthSectionId, string>;
  for (const s of HEALTH_SECTIONS) m[s.id] = s.route;
  return m;
})();

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

interface Props {
  currentSection: HealthSectionId;
}

export default function HealthHotkeys({ currentSection }: Props) {
  const router = useRouter();
  const { toggle } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const [chordArmed, setChordArmed] = useState(false);
  const chordTimer = useRef<number | null>(null);

  const armChord = useCallback(() => {
    setChordArmed(true);
    if (chordTimer.current) window.clearTimeout(chordTimer.current);
    chordTimer.current = window.setTimeout(() => setChordArmed(false), CHORD_TIMEOUT);
  }, []);
  const disarm = useCallback(() => {
    setChordArmed(false);
    if (chordTimer.current) window.clearTimeout(chordTimer.current);
  }, []);

  const goSection = useCallback((s: HealthSectionId) => {
    disarm();
    router.push(ROUTE_BY_ID[s], undefined, { scroll: false });
  }, [router, disarm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (helpOpen) { e.preventDefault(); setHelpOpen(false); return; }
      }
      if (isTypingTarget(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setHelpOpen(v => !v); disarm(); return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === "?") { e.preventDefault(); setHelpOpen(v => !v); return; }
      if (k === "t" && !chordArmed) { e.preventDefault(); toggle(); return; }

      if (chordArmed) {
        if (k === "h") { e.preventDefault(); disarm(); router.push("/", undefined, { scroll: false }); return; }
        const sec = KEY_TO_SECTION[k];
        if (sec) { e.preventDefault(); goSection(sec); return; }
        disarm();
        return;
      }
      if (k === "g") { e.preventDefault(); armChord(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, toggle, chordArmed, armChord, disarm, goSection, router]);

  useEffect(() => {
    const onRoute = () => setHelpOpen(false);
    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [router]);

  return (
    <>
      <AnimatePresence>
        {chordArmed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-10 right-6 z-[60] px-3 py-2 rounded-md font-mono text-[11px] tracking-widest"
            style={{
              color: "#34d399",
              background: "rgba(10,22,40,0.9)",
              border: "1px solid rgba(52,211,153,0.4)",
              boxShadow: "0 0 20px rgba(52,211,153,0.3)",
            }}>
            <span style={{ opacity: 0.5 }}>g</span>
            <span className="mx-2" style={{ color: "#34d399" }}>_</span>
            <span style={{ opacity: 0.6 }}>awaiting key…</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-xl p-6 md:p-8 font-mono"
              style={{
                background: "rgba(10,22,40,0.95)",
                border: "1px solid rgba(52,211,153,0.35)",
                color: "#f8fafc",
                boxShadow: "0 0 40px rgba(52,211,153,0.25)",
              }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl tracking-widest uppercase flex items-center gap-2" style={{ color: "#34d399", fontFamily: "var(--hlth-font-display, ui-sans-serif)", fontWeight: 900 }}>
                    ❤ vitals.keys
                  </h2>
                  <p className="text-[11px] tracking-widest mt-1" style={{ color: "#94a3b8" }}>// hotkey cheat-sheet · press ? to dismiss</p>
                </div>
                <button onClick={() => setHelpOpen(false)}
                  className="text-[10px] tracking-widest px-2 py-1 rounded-sm"
                  style={{ color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" }}>ESC</button>
              </div>

              <div className="grid grid-cols-1 gap-1 text-[12px]">
                {HEALTH_SECTIONS.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-1.5"
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(148,163,184,0.12)" }}>
                    <div>
                      <span style={{ opacity: 0.5, marginRight: 8 }}>§{s.code}</span>
                      <span className="uppercase tracking-wide">{s.label}</span>
                      <span className="ml-2" style={{ fontSize: 10, color: "#94a3b8" }}>{s.description}</span>
                    </div>
                    <Kbd>g {s.short[0].toLowerCase()}</Kbd><Kbd>g {s.code === "00" ? "0" : String(i)}</Kbd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 py-1.5" style={{ borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                  <div>
                    <span className="uppercase tracking-wide">Home</span>
                    <span className="ml-2" style={{ fontSize: 10, color: "#94a3b8" }}>kaizen root</span>
                  </div>
                  <Kbd>g h</Kbd>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5" style={{ borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                  <div>
                    <span className="uppercase tracking-wide">Toggle theme</span>
                    <span className="ml-2" style={{ fontSize: 10, color: "#94a3b8" }}>VITAL-SIGN / CLINIC</span>
                  </div>
                  <Kbd>t</Kbd>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5" style={{ borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                  <div>
                    <span className="uppercase tracking-wide">Help</span>
                  </div>
                  <Kbd>?</Kbd>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="text-[11px] tracking-widest px-2 py-1 rounded-sm inline-block"
      style={{
        background: "rgba(15,30,55,0.9)",
        color: "#34d399",
        border: "1px solid rgba(52,211,153,0.3)",
        borderBottomWidth: "2px",
        boxShadow: "0 2px 0 rgba(0,0,0,0.4)",
        fontFamily: "ui-monospace, monospace",
        fontWeight: 800,
        marginLeft: 4,
        minWidth: "2rem",
        textAlign: "center",
      }}>{children}</kbd>
  );
}
