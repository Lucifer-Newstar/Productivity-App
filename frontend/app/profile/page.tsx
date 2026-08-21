"use client";
/**
 * Kaizen profile — App Router full page for identity and per-space constants.
 * Search params live behind Suspense so the route can still statically prerender.
 */
import { Suspense } from "react";
import ProfilePage from "../../components/ProfilePage";

export default function ProfileRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading profile…</div>
      </div>
    }>
      <ProfilePage />
    </Suspense>
  );
}
