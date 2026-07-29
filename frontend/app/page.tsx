"use client";

/**
 * App shell — top-level layout.
 *
 * Layout:
 *   - TopNav (horizontal bar at the top) shared with the pages-router routes.
 *   - Main content area that switches between core productivity views
 *     (Dashboard, Tasks, Pomodoro, Notes, Habits, Calendar) with AnimatePresence.
 *
 * Important navigation change:
 *   The five life "Spaces" (Projects, Workout, Career, Entertainment, Health)
 *   are no longer in-SPA views — they live at real Next.js routes: `/projects`,
 *   `/workout`, `/career`, `/entertainment`, `/health`. Clicking a space in
 *   TopNav uses next/link to navigate there as a full page.
 *
 * Initial view can be set via `?view=tasks` (etc.) so TopNav can deep-link to
 * specific core tools. The component that reads search params lives inside a
 * <Suspense> boundary (required by Next for static generation).
 */

import { Suspense } from "react";
import AppShell from "./AppShell";

export default function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    }>
      <AppShell />
    </Suspense>
  );
}
