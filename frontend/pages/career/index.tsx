"use client";

/**
 * pages/career/index — redirect to /career/roadmaps (the default module).
 */
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CareerIndexRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/career/roadmaps"); }, [router]);
  return (
    <div className="min-h-screen w-full flex items-center justify-center font-mono text-xs tracking-widest"
      style={{ background: "#05080d", color: "#22d3ee" }}>
      <pre style={{opacity: 0.5}}>{"// routing career → /roadmaps\n// > loading..."}</pre>
    </div>
  );
}
CareerIndexRedirect.fullScreen = true;
