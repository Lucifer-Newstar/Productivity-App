/** Identity and setup constants for the global Profile drawer. Daily logs stay in-space. */
import { safeExternalUrl, safeImageDataUrl } from "./security";

export type HomeLandingView = "" | "dashboard" | "tasks" | "focus" | "notes" | "habits" | "calendar";

export interface KaizenProfile {
  displayName: string;
  handle: string;
  avatarDataUrl?: string;
  timezone: string;
  website: string;
  linkedin: string;
  githubUsername: string;
  homeLandingView: HomeLandingView;
  updatedAt: number;
}

export const EMPTY_PROFILE: KaizenProfile = {
  displayName: "",
  handle: "",
  timezone: "Asia/Calcutta",
  website: "",
  linkedin: "",
  githubUsername: "",
  homeLandingView: "",
  updatedAt: 0,
};

const HANDLE = /^[a-zA-Z0-9_-]{0,32}$/;
const GITHUB_USER = /^[A-Za-z0-9-]{0,39}$/;

/** Defensive hydration: drop unsafe avatar/URLs and unknown keys. */
export function migrateProfile(raw: unknown): KaizenProfile {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PROFILE };
  const value = raw as Record<string, unknown>;
  const website = typeof value.website === "string" ? safeExternalUrl(value.website) ?? "" : "";
  const linkedin = typeof value.linkedin === "string" ? safeExternalUrl(value.linkedin) ?? "" : "";
  const handle = typeof value.handle === "string" && HANDLE.test(value.handle) ? value.handle : "";
  const githubUsername = typeof value.githubUsername === "string" && GITHUB_USER.test(value.githubUsername)
    ? value.githubUsername
    : "";
  const homeLandingView = (["", "dashboard", "tasks", "focus", "notes", "habits", "calendar"] as const)
    .includes(value.homeLandingView as HomeLandingView)
    ? value.homeLandingView as HomeLandingView
    : "";
  return {
    displayName: typeof value.displayName === "string" ? value.displayName.slice(0, 80) : "",
    handle,
    avatarDataUrl: safeImageDataUrl(value.avatarDataUrl),
    timezone: typeof value.timezone === "string" && value.timezone.length < 80 ? value.timezone : EMPTY_PROFILE.timezone,
    website,
    linkedin,
    githubUsername,
    homeLandingView,
    updatedAt: typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt) ? value.updatedAt : 0,
  };
}

export const GITHUB_TOKEN_SESSION_KEY = "kaizen.github.token";
export const GITHUB_REPO_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
