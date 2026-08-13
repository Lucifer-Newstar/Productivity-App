"use client";

/**
 * pages/workout/calisthenics — bodyweight skills & chains panel.
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutCalisthenics from "../../components/workout/WorkoutCalisthenics";

export default function WorkoutCalisthenicsPage() {
  return (
    <WorkoutPage section="calisthenics">
      <WorkoutCalisthenics />
    </WorkoutPage>
  );
}
WorkoutCalisthenicsPage.fullScreen = FULLSCREEN;
