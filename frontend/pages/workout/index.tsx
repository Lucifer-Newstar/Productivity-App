"use client";

/**
 * pages/workout/index — redirect to /workout/overview.
 */
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function WorkoutIndexRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/workout/overview"); }, [router]);
  return (
    <div className="dark min-h-screen w-full flex items-center justify-center text-gray-500 text-sm"
      style={{ background: "#08080d" }}>
      Loading workout…
    </div>
  );
}
WorkoutIndexRedirect.fullScreen = true;
