/** Explicit build-time gate for destructive QA/demo data controls. */
export const DEMO_TOOLS_ENABLED = process.env.NEXT_PUBLIC_KAIZEN_DEMO_TOOLS === "1";
