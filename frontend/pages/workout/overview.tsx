"use client";

/**
 * pages/workout/overview — landing tab for the workout space.
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import OverviewContent from "../../components/workout/OverviewContent";

export default function WorkoutOverviewPage() {
  return (
    <WorkoutPage section="overview">
      <OverviewContent />
    </WorkoutPage>
  );
}
WorkoutOverviewPage.fullScreen = FULLSCREEN;
