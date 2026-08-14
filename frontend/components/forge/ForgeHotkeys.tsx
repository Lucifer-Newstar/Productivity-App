"use client";
/**
 * ForgeHotkeys — global keyboard layer for the /projects space.
 *
 * Shortcuts:
 *   ?           → toggle help overlay
 *   g f / g 1   → Foundry
 *   g q / g 2   → Quarry
 *   g s / g 3   → Smelter
 *   g v / g 4   → Vault
 *   g h         → Home (/)
 *   n  /  ⌘K    → open STRIKE panel (action palette)
 *   t           → toggle theme (foundry/drafting)
 *   Esc         → close STRIKE / close help
 *   /           → open STRIKE panel (like cmd+k)
 *
 * Sequence model: first pressing "g" arms a chord; next character routes.
 * Ignored while typing in input/textarea/contenteditable or when a meta
 * modifier is held (so browser/cmdr shortcuts survive).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../lib/theme";
import { FORGE_NAV, type ForgeSectionId } from "./ForgeShell";

interface Props {
  currentSection: ForgeSectionId;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
}

const CHORD_TIMEOUT = 1200;

const SHORTCUTS: { keys: string; label: string; hint?: string }[] = [
  { keys: "?",        label: "Open this help", hint: "strike.cheat_sheet" },
  { keys: "n  /  /",  label: "Open STRIKE panel", hint: "action palette" },
  { keys: "g f  (g 1)", label: "→ Foundry §01", hint: "active heats" },
  { keys: "g q  (g 2)", label: "→ Quarry §02", hint: "tasks/kanban" },
  { keys: "g s  (g 3)", label: "→ Smelter §03", hint: "brainstorms" },
  { keys: "g v  (g 4)", label: "→ Vault §04", hint: "shipped/dead" },
  { keys: "g h",      label: "→ Home (Kaizen root)", hint: "space picker" },
  { keys: "t",        label: "Toggle foundry/drafting", hint: "theme" },
  { keys: "esc",      label: "Close panel / help", hint: "escape" },
];

const SECTION_BY_KEY: Record<string, ForgeSectionId> = {
  f: "foundry", "1": "foundry",
  q: "quarry",  "2": "quarry",
  s: "smelter", "3": "smelter",
  v: "vault",   "4": "vault",
};

const SECTION_ROUTE: Record<ForgeSectionId, string> = {
  foundry: "/projects",
  quarry:  "/projects/quarry",
  smelter: "/projects/smelter",
  vault:   "/projects/vault",
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export default function ForgeHotkeys({ currentSection, panelOpen, setPanelOpen }: Props) {
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

  const goSection = useCallback((s: ForgeSectionId) => {
    disarm();
    if (s === currentSection && panelOpen) return;
    setPanelOpen(false);
    router.push(SECTION_ROUTE[s], undefined, { scroll: false });
  }, [router, currentSection, panelOpen, setPanelOpen, disarm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Always-on Esc closes overlays
      if (e.key === "Escape") {
        if (helpOpen) { e.preventDefault(); setHelpOpen(false); return; }
        if (panelOpen) { e.preventDefault(); setPanelOpen(false); return; }
      }

      // Don't hijack while typing
      if (isTypingTarget(e.target)) return;
      // Cmd/Ctrl+K = STRIKE panel (universal command-palette muscle memory)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPanelOpen(!panelOpen); disarm(); return;
      }
      // Don't hijack other browser/cmdr shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();

      // Help
      if (k === "?") { e.preventDefault(); setHelpOpen(v => !v); return; }

      // Theme
      if (k === "t" && !chordArmed) { e.preventDefault(); toggle(); return; }

      // STRIKE panel
      if (k === "n" || k === "/") { e.preventDefault(); setPanelOpen(!panelOpen); disarm(); return; }

      // "g" chord
      if (chordArmed) {
        if (k === "h") { e.preventDefault(); disarm(); setPanelOpen(false); router.push("/", undefined, { scroll: false }); return; }
        const sec = SECTION_BY_KEY[k];
        if (sec) { e.preventDefault(); goSection(sec); return; }
        disarm();
        return;
      }
      if (k === "g") { e.preventDefault(); armChord(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, panelOpen, setPanelOpen, toggle, chordArmed, armChord, disarm, goSection, router]);

  // Close help on route change
  useEffect(() => {
    const onRoute = () => setHelpOpen(false);
    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [router]);

  // Small chord indicator in bottom-right
  return (
    <>
      <AnimatePresence>
        {chordArmed && (
          <motion.div
            key="g-chord"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-10 right-6 z-[60] steel-plate px-3 py-2 mono text-[11px] tracking-widest"
            style={{
              color: "var(--fr-amber)",
              background: "var(--fr-card)",
              borderColor: "var(--fr-amber)",
              boxShadow: "0 0 20px rgba(245,158,11,0.4)",
            }}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <span style={{color:"var(--fr-fgMuted)"}}>g</span>
            <span className="mx-2" style={{color:"var(--fr-amber)"}}>_</span>
            <span style={{opacity:0.6}}>awaiting key…</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {helpOpen && (
          <motion.div
            key="help"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => setHelpOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-xl steel-plate p-6 md:p-8"
              style={{ background: "var(--fr-card)", borderColor: "var(--fr-amber)", color: "var(--fr-fg)" }}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>

              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-black tracking-widest uppercase flex items-center gap-2"
                    style={{color:"var(--fr-amber)"}}>
                    ⚒ forge.keys
                  </h2>
                  <p className="mono text-[11px] tracking-widest mt-1" style={{color:"var(--fr-fgMuted)"}}>
                    // hotkey cheat-sheet · press <Kbd>?</Kbd> to dismiss
                  </p>
                </div>
                <button onClick={()=>setHelpOpen(false)}
                  className="mono text-[10px] tracking-widest px-2 py-1 rounded-sm"
                  style={{color:"var(--fr-fgMuted)", border:"1px solid var(--fr-borderSoft)"}}>ESC</button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--fr-borderSoft)" }}>
                    <div>
                      <div className="text-sm font-bold tracking-wide uppercase" style={{color:"var(--fr-fg)"}}>{s.label}</div>
                      {s.hint && <div className="mono text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>// {s.hint}</div>}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {s.keys.split(/\s+/).map((tok, j) =>
                        tok === "/" ? <span key={j} className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>or</span>
                        : <Kbd key={j}>{tok}</Kbd>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 flex flex-wrap items-center gap-3"
                style={{ borderTop: "1px solid var(--fr-borderSoft)" }}>
                <span className="mono text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>SECTORS:</span>
                {FORGE_NAV.map(n => (
                  <button key={n.id} onClick={()=>{ setHelpOpen(false); router.push(SECTION_ROUTE[n.id], undefined, { scroll:false }); }}
                    className="mono text-[10px] tracking-widest px-2 py-1 rounded-sm flex items-center gap-1 transition"
                    style={{
                      color: currentSection === n.id ? "#000" : "var(--fr-fg)",
                      background: currentSection === n.id ? "var(--fr-amber)" : "transparent",
                      border: "1px solid var(--fr-borderSoft)",
                    }}>
                    §{n.code} {n.label.toUpperCase()}
                  </button>
                ))}
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
    <kbd className="mono text-[11px] font-black tracking-widest px-2 py-1 rounded-sm inline-block"
      style={{
        background: "var(--fr-card2)",
        color: "var(--fr-amber)",
        border: "1px solid var(--fr-border)",
        borderBottomWidth: "2px",
        boxShadow: "0 2px 0 rgba(0,0,0,0.4)",
        minWidth: "1.6rem",
        textAlign: "center",
      }}>{children}</kbd>
  );
}
