"use client";

/**
 * pages/workout/gym — weights/gym panel (plate calc, 1RM, Wilks, etc.).
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutGym from "../../components/workout/WorkoutGym";

export default function WorkoutGymPage() {
  return (
    <WorkoutPage section="gym">
      <WorkoutGym />
    </WorkoutPage>
  );
}
WorkoutGymPage.fullScreen = FULLSCREEN;
