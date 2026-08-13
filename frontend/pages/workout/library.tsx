"use client";

/**
 * pages/workout/library — exercise library with mini muscle-map on the side.
 */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import LibraryContent from "../../components/workout/LibraryContent";

export default function WorkoutLibraryPage() {
  return (
    <WorkoutPage section="library">
      <LibraryContent />
    </WorkoutPage>
  );
}
WorkoutLibraryPage.fullScreen = FULLSCREEN;
