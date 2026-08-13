"use client";

/**
 * WorkoutPage — shared wrapper for all /workout/* sub-routes.
 *
 * Responsibilities:
 *  - BattleGate intro (full-screen obsidian throne room with the BATTLE
 *    button + dragon-fire/sword-slash reveal) on first visit per session.
 *  - Handles ActiveWorkout full-screen takeover when a session is live.
 *  - Handles the mandatory daily bodyweight modal.
 *  - Wraps children in <WorkoutShell> (left rail + top strip + animated transitions).
 *  - Plays a SectionSlash (katana swipe + ember burst) between sub-page navigations.
 *  - Provides Start-today's-routine CTA wiring + "Retreat" button to re-seal gate.
 *
 * Gate state is persisted in sessionStorage under `kaizer.gateOpen` so a
 * refresh keeps the shell open; closing the tab and revisiting re-triggers
 * the battle intro.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import WorkoutShell, { WORKOUT_NAV, type WorkoutSectionId } from "./WorkoutShell";
import ActiveWorkout from "./ActiveWorkout";
import FreestyleWorkout from "./FreestyleWorkout";
import BattleGate from "./BattleGate";
import SectionSlash from "./SectionSlash";
import { AnimatePresence } from "framer-motion";
import { useStore } from "../../lib/store";

interface Props {
  section: WorkoutSectionId;
  children: React.ReactNode;
}

const GATE_KEY = "kaizer.gateOpen";

export default function WorkoutPage({ section, children }: Props) {
  const router = useRouter();
  const { workout, startSession } = useStore();

  // Gate starts closed and opens after the BATTLE animation. We hydrate from
  // sessionStorage after mount (avoid SSR mismatch).
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReady, setGateReady] = useState(false); // flip true after mount
  const [slashing, setSlashing] = useState(false);
  const prevSection = useRefValue(section);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.sessionStorage.getItem(GATE_KEY) : null;
    setGateOpen(stored === "1");
    setGateReady(true);
  }, []);

  // Play section-slash when the section changes (and gate is open)
  useEffect(() => {
    if (!gateReady || !gateOpen) return;
    if (prevSection.current && prevSection.current !== section) {
      setSlashing(true);
      const t = window.setTimeout(() => setSlashing(false), 450);
      return () => window.clearTimeout(t);
    }
    prevSection.current = section;
  }, [section, gateOpen, gateReady]);

  const openGate = useCallback(() => {
    setGateOpen(true);
    if (typeof window !== "undefined") window.sessionStorage.setItem(GATE_KEY, "1");
  }, []);
  const closeGate = useCallback(() => {
    setGateOpen(false);
    if (typeof window !== "undefined") window.sessionStorage.removeItem(GATE_KEY);
  }, []);

  // When user clicks a nav item, client-side transition to that route (slash
  // animates between via the useEffect above).
  const onSectionChange = useCallback((s: WorkoutSectionId) => {
    const route =
      s === "overview"     ? "/workout/overview" :
      s === "library"      ? "/workout/library" :
      s === "pr"           ? "/workout/prs" :
      s === "skills"       ? "/workout/skills" :
      s === "schedule"     ? "/workout/schedule" :
      s === "calisthenics" ? "/workout/calisthenics" :
      s === "gym"          ? "/workout/gym" :
      s === "cardio"       ? "/workout/cardio" :
      s === "charts"       ? "/workout/charts" :
      s === "kanban"       ? "/workout/kanban" :
      s === "global"       ? "/workout/tools" :
      "/workout/overview";
    router.push(route, undefined, { scroll: false });
  }, [router]);

  const todaysRoutine = useMemo(
    () => workout.routines.find((r) => r.dayOfWeek === new Date().getDay()),
    [workout.routines],
  );
  const todayIso = new Date().toISOString().slice(0,10);
  const todayReadiness = workout.readiness.find((r) => r.date === todayIso);

  const handleStartTodays = useCallback(() => {
    if (!todaysRoutine) { router.push("/workout/schedule"); return; }
    startSession(todaysRoutine.name, todaysRoutine.id, todayReadiness?.score);
  }, [todaysRoutine, todayReadiness, startSession, router]);
  const handleQuickStart = useCallback(() => {
    startSession("Quick Session", undefined, todayReadiness?.score);
  }, [todayReadiness, startSession]);

  // Active-session takeover — freestyle logger when no routine, block-driven otherwise.
  if (workout.activeSessionId) {
    const activeSession = workout.sessions.find((s) => s.id === workout.activeSessionId);
    const isFreestyle = !activeSession?.routineId;
    return (
      <div className="dark min-h-screen w-full text-gray-100 flex items-center justify-center p-4 md:p-8"
        style={{
          background:
            "radial-gradient(at 15% 10%, rgba(236,72,153,0.2) 0, transparent 45%)," +
            "radial-gradient(at 85% 90%, rgba(6,182,212,0.15) 0, transparent 45%)," +
            "#08080d",
        }}>
        <div className="w-full max-w-4xl">
          {isFreestyle ? (
            <FreestyleWorkout
              sessionId={workout.activeSessionId}
              onFinish={() => { setGateOpen(true); window.sessionStorage.setItem(GATE_KEY,"1"); router.push("/workout/overview"); }}
              onDiscard={() => { setGateOpen(true); window.sessionStorage.setItem(GATE_KEY,"1"); router.push("/workout/overview"); }}
            />
          ) : (
            <ActiveWorkout
              sessionId={workout.activeSessionId}
              onFinish={() => { setGateOpen(true); window.sessionStorage.setItem(GATE_KEY,"1"); router.push("/workout/overview"); }}
              onDiscard={() => { setGateOpen(true); window.sessionStorage.setItem(GATE_KEY,"1"); router.push("/workout/schedule"); }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkoutShell
        section={section}
        onSectionChange={onSectionChange}
        onStartTodaysRoutine={handleStartTodays}
        onQuickStart={handleQuickStart}
        todaysRoutineName={todaysRoutine?.name}
        onRetreat={closeGate}
      >
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </WorkoutShell>

      {/* Section slash overlay */}
      <AnimatePresence>
        {slashing && gateOpen && <SectionSlash />}
      </AnimatePresence>

      {/* Battle gate overlay (renders on top until opened) */}
      {gateReady && !gateOpen && (
        <BattleGate
          onOpen={openGate}
          todaysRoutineName={todaysRoutine?.name}
          onQuickStart={handleQuickStart}
          onStartTodays={handleStartTodays}
        />
      )}
    </>
  );
}

// Tiny ref hook for tracking the previous value of a prop/state.
import { useRef } from "react";
function useRefValue<T>(v: T) {
  const r = useRef<T>(v);
  useEffect(() => { r.current = v; });
  return r;
}

// Helper used by pages to set the static fullScreen flag.
export const FULLSCREEN = true;
