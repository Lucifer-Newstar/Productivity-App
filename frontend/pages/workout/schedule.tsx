"use client";

/**
 * pages/workout/schedule — routines & split builder.
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutSchedule from "../../components/workout/WorkoutSchedule";

export default function WorkoutSchedulePage() {
  return (
    <WorkoutPage section="schedule">
      <WorkoutSchedule />
    </WorkoutPage>
  );
}
WorkoutSchedulePage.fullScreen = FULLSCREEN;
