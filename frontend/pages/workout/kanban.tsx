"use client";

/** pages/workout/kanban — planning kanban board sub-page. */

import WorkoutPage, { FULLSCREEN } from "../../components/workout/WorkoutPage";
import WorkoutKanban from "../../components/workout/WorkoutKanban";

export default function WorkoutKanbanPage() {
  return (
    <WorkoutPage section="kanban">
      <WorkoutKanban />
    </WorkoutPage>
  );
}
WorkoutKanbanPage.fullScreen = FULLSCREEN;
