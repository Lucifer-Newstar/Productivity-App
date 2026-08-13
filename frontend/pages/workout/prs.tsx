"use client";

/**
 * pages/workout/prs — personal records list.
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutPRs from "../../components/workout/WorkoutPRs";

export default function WorkoutPRsPage() {
  return (
    <WorkoutPage section="pr">
      <WorkoutPRs />
    </WorkoutPage>
  );
}
WorkoutPRsPage.fullScreen = FULLSCREEN;
