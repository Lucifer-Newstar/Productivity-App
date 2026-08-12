"use client";

/**
 * pages/workout/cardio — run/bike/row/swim logging.
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutCardio from "../../components/workout/WorkoutCardio";

export default function WorkoutCardioPage() {
  return (
    <WorkoutPage section="cardio">
      <WorkoutCardio />
    </WorkoutPage>
  );
}
WorkoutCardioPage.fullScreen = FULLSCREEN;
