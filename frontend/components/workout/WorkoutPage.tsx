"use client";

/**
 * WorkoutPage — shared wrapper for all /workout/* sub-routes.
 *
 * Responsibilities:
 *  - Handles ActiveWorkout full-screen takeover when a session is live
 *  - Handles the mandatory daily bodyweight modal
 *  - Wraps children in <WorkoutShell> (left rail + top strip + animated transitions)
 *  - Provides Start-today's-routine CTA wiring
 *
 * Every sub-page just exports default with `page.fullScreen = true` and calls
 * this helper with its section id + content.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/router";
import WorkoutShell, { WORKOUT_NAV, type WorkoutSectionId } from "./WorkoutShell";
import ActiveWorkout from "./ActiveWorkout";
import { useStore } from "../../lib/store";
import { weeklyMuscleVolume } from "../../lib/workoutAnalytics";

interface Props {
  section: WorkoutSectionId;
  children: React.ReactNode;
}

export default function WorkoutPage({ section, children }: Props) {
  const router = useRouter();
  const { workout, startSession, logReadiness, updateWorkoutSettings } = useStore();

  // When user clicks a nav item, client-side transition to that route.
  const onSectionChange = useCallback((s: WorkoutSectionId) => {
    const route =
      s === "overview" ? "/workout/overview" :
      s === "library"  ? "/workout/library" :
      s === "pr"       ? "/workout/prs" :
      s === "skills"   ? "/workout/skills" :
      s === "schedule" ? "/workout/schedule" :
      s === "calisthenics" ? "/workout/calisthenics" :
      s === "gym"      ? "/workout/gym" :
      s === "cardio"   ? "/workout/cardio" :
      s === "global"   ? "/workout/tools" :
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

  // Active-session takeover
  if (workout.activeSessionId) {
    return (
      <div className="dark min-h-screen w-full text-gray-100 flex items-center justify-center p-4 md:p-8"
        style={{
          background:
            "radial-gradient(at 15% 10%, rgba(236,72,153,0.2) 0, transparent 45%)," +
            "radial-gradient(at 85% 90%, rgba(6,182,212,0.15) 0, transparent 45%)," +
            "#08080d",
        }}>
        <div className="w-full max-w-4xl">
          <ActiveWorkout
            sessionId={workout.activeSessionId}
            onFinish={() => router.push("/workout/overview")}
            onDiscard={() => router.push("/workout/schedule")}
          />
        </div>
      </div>
    );
  }

  return (
    <WorkoutShell
      section={section}
      onSectionChange={onSectionChange}
      onStartTodaysRoutine={handleStartTodays}
      todaysRoutineName={todaysRoutine?.name}
    >
      <div className="max-w-6xl mx-auto w-full">{children}</div>
    </WorkoutShell>
  );
}

// Helper used by pages to set the static fullScreen flag (kept consistent).
export const FULLSCREEN = true;
