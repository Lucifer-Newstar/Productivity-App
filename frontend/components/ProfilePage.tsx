"use client";
/** Full-page Kaizen profile workspace: identity plus per-space constants. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight, Briefcase, Dumbbell, FolderKanban, GitBranch, HeartPulse,
  Home, Link2, Sparkles, UserRound,
} from "lucide-react";
import TopNav from "./TopNav";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { GITHUB_REPO_URL, GITHUB_TOKEN_SESSION_KEY, type HomeLandingView } from "../lib/profileTypes";
import { readSafeImageAsDataUrl } from "../lib/security";
import type { PublicGithubRepo } from "../lib/githubRepos";

type Tab = "identity" | "home" | "workout" | "forge" | "career" | "health" | "entertainment" | "github";
const TABS: { id: Tab; label: string; hint: string; href: string; icon: typeof UserRound }[] = [
  { id: "identity", label: "Identity", hint: "Name, handle, presence", href: "/profile", icon: UserRound },
  { id: "home", label: "Home", hint: "Command-center landing", href: "/", icon: Home },
  { id: "workout", label: "Workout", hint: "Units and training phase", href: "/workout/overview", icon: Dumbbell },
  { id: "forge", label: "Forge", hint: "Shop hours and sprint length", href: "/projects", icon: FolderKanban },
  { id: "career", label: "Career", hint: "Public professional link", href: "/career/projects", icon: Briefcase },
  { id: "health", label: "Health", hint: "Formula constants", href: "/health/sync", icon: HeartPulse },
  { id: "entertainment", label: "Glow", hint: "Language and rollover", href: "/entertainment", icon: Sparkles },
  { id: "github", label: "GitHub", hint: "Read-only public repos", href: "/projects", icon: GitBranch },
];
const TAB_IDS = TABS.map((item) => item.id);
const ZONES = [
  "Asia/Calcutta", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago",
  "America/Los_Angeles", "UTC",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "K") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function ProfilePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const store = useStore();
  const { profile, updateProfile, health, updateHealth, workout, updateWorkoutSettings, forge, updateForge, career, updateCareer, entertainment, updateEntertainment } = store;
  const requested = params?.get("tab") as Tab | null;
  const tab: Tab = requested && TAB_IDS.includes(requested) ? requested : "identity";
  const [token, setToken] = useState("");
  const [repos, setRepos] = useState<PublicGithubRepo[]>([]);
  const [repoStatus, setRepoStatus] = useState("");
  const [linkProjectId, setLinkProjectId] = useState("");
  const zones = useMemo(() => {
    const supported = typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl as unknown as { supportedValuesOf: (key: "timeZone") => string[] }).supportedValuesOf("timeZone")
      : ZONES;
    return Array.from(new Set([profile.timezone, ...ZONES, ...supported].filter(Boolean)));
  }, [profile.timezone]);

  useEffect(() => {
    setToken(sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) ?? "");
  }, []);

  const filled = useMemo(() => ({
    identity: !!(profile.displayName || profile.handle),
    home: !!profile.homeLandingView,
    workout: (workout.bodyweight?.length ?? 0) > 0,
    forge: forge.projects.length > 0,
    career: !!(career.linkedin || career.goals.length),
    health: !!(health.profile.ageYears && health.profile.heightCm && health.profile.gender),
    entertainment: entertainment.items.length > 0 || entertainment.settings.monthlyRollover,
    github: !!profile.githubUsername,
  }), [profile, workout.bodyweight, forge.projects.length, career, health.profile, entertainment]);

  const readyCount = TAB_IDS.filter((id) => filled[id]).length;

  function openTab(next: Tab) {
    router.replace(next === "identity" ? "/profile" : `/profile?tab=${next}`, { scroll: false });
  }

  async function loadRepos() {
    if (!profile.githubUsername) { setRepoStatus("Save a GitHub username first."); return; }
    setRepoStatus("Loading…");
    try {
      const headers: Record<string, string> = {};
      if (token) headers["x-kaizen-github-token"] = token;
      const response = await fetch(`/api/forge/github/repos?user=${encodeURIComponent(profile.githubUsername)}`, { headers, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load repositories");
      setRepos(body.repos ?? []);
      setRepoStatus(`${(body.repos ?? []).length} public repositories`);
    } catch (error) {
      setRepos([]);
      setRepoStatus(error instanceof Error ? error.message : "GitHub request failed");
    }
  }

  function attachRepo(repo: PublicGithubRepo) {
    const projectId = linkProjectId || forge.projects[0]?.id;
    if (!projectId) { setRepoStatus("Create a Forge project first."); return; }
    if (!GITHUB_REPO_URL.test(repo.htmlUrl)) { setRepoStatus("Repository URL was rejected."); return; }
    updateForge((current) => ({
      projects: current.projects.map((project) => project.id !== projectId ? project : {
        ...project,
        links: [...project.links.filter((item) => item.url !== repo.htmlUrl), { label: `GitHub · ${repo.fullName}`, url: repo.htmlUrl }],
      }),
    }));
    setRepoStatus(`Linked ${repo.fullName}`);
  }

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];

  return (
    <div className="home-root profile-page" data-theme={theme}>
      <TopNav />
      <main className="profile-shell">
        <header className="profile-hero">
          <div className="profile-hero-mark">
            {profile.avatarDataUrl
              ? <img src={profile.avatarDataUrl} alt="" />
              : <span>{initials(profile.displayName)}</span>}
          </div>
          <div className="profile-hero-copy">
            <p>KAIZEN PROFILE</p>
            <h1>{profile.displayName || "Set up who you are"}</h1>
            <p className="profile-hero-meta">
              {profile.handle ? `@${profile.handle}` : "No handle yet"}
              <i />
              {profile.timezone}
              <i />
              {readyCount} / {TAB_IDS.length} sections ready
            </p>
          </div>
          <div className="profile-hero-meter" aria-hidden="true">
            <strong>{Math.round((readyCount / TAB_IDS.length) * 100)}</strong>
            <span>READY</span>
          </div>
        </header>
        <div className="profile-layout">
          <nav className="profile-rail" aria-label="Profile sections">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={tab === item.id ? "is-active" : ""}
                  onClick={() => openTab(item.id)}
                >
                  <Icon size={15} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <i className={filled[item.id] ? "is-ready" : ""} />
                </button>
              );
            })}
          </nav>
          <section className="profile-panel" aria-label={activeTab.label}>
            <div className="profile-panel-head">
              <div>
                <p>{activeTab.label.toUpperCase()}</p>
                <h2>{activeTab.hint}</h2>
              </div>
              {activeTab.id !== "identity" && (
                <Link href={activeTab.href} className="profile-space-link">
                  Open space <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            <div className="profile-body">
              {tab === "identity" && (
                <>
                  <Field label="Display name">
                    <input className="input-base" value={profile.displayName} maxLength={80} onChange={(e) => updateProfile({ displayName: e.target.value })} />
                  </Field>
                  <Field label="Handle" hint="Letters, numbers, underscore or hyphen.">
                    <input className="input-base" value={profile.handle} maxLength={32} placeholder="navin" onChange={(e) => updateProfile({ handle: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })} />
                  </Field>
                  <Field label="Timezone">
                    <select className="input-base" value={profile.timezone} onChange={(e) => updateProfile({ timezone: e.target.value })}>
                      {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                    </select>
                  </Field>
                  <Field label="Website">
                    <input className="input-base" value={profile.website} placeholder="https://" onChange={(e) => updateProfile({ website: e.target.value })} />
                  </Field>
                  <Field label="LinkedIn URL">
                    <input className="input-base" value={profile.linkedin} placeholder="https://linkedin.com/in/…" onChange={(e) => updateProfile({ linkedin: e.target.value })} />
                  </Field>
                  <Field label="Avatar (JPEG/PNG/WebP, 2 MB)">
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try { updateProfile({ avatarDataUrl: await readSafeImageAsDataUrl(file) }); }
                      catch (error) { window.alert(error instanceof Error ? error.message : "Image rejected"); }
                    }} />
                  </Field>
                </>
              )}
              {tab === "home" && (
                <Field label="Landing view" hint="Home opens this view after load. Command center remains the default.">
                  <select className="input-base" value={profile.homeLandingView} onChange={(e) => updateProfile({ homeLandingView: e.target.value as HomeLandingView })}>
                    <option value="">Command center</option>
                    <option value="tasks">Tasks</option>
                    <option value="focus">Focus</option>
                    <option value="notes">Notes</option>
                    <option value="habits">Habits</option>
                    <option value="calendar">Calendar</option>
                  </select>
                </Field>
              )}
              {tab === "workout" && (
                <>
                  <Field label="Units">
                    <select className="input-base" value={workout.settings.units} onChange={(e) => updateWorkoutSettings({ units: e.target.value as "kg" | "lb" })}>
                      <option value="kg">Kilograms</option>
                      <option value="lb">Pounds</option>
                    </select>
                  </Field>
                  <Field label="Training phase">
                    <select className="input-base" value={workout.settings.phase ?? "maintenance"} onChange={(e) => updateWorkoutSettings({ phase: e.target.value as typeof workout.settings.phase })}>
                      <option value="maintenance">Maintenance</option>
                      <option value="bulking">Bulking</option>
                      <option value="cutting">Cutting</option>
                      <option value="deload">Deload</option>
                      <option value="peak">Peak</option>
                    </select>
                  </Field>
                  <p className="profile-hint">Daily sessions, PRs and bodyweight logs stay in Workout. This page only stores constants.</p>
                </>
              )}
              {tab === "forge" && (
                <>
                  <Field label="Forge name">
                    <input className="input-base" value={forge.settings.forgeName} maxLength={40} onChange={(e) => updateForge((current) => ({ settings: { ...current.settings, forgeName: e.target.value } }))} />
                  </Field>
                  <div className="profile-row">
                    <Field label="Work start">
                      <input className="input-base" type="number" min={0} max={23} value={forge.settings.workStartHour} onChange={(e) => updateForge((current) => ({ settings: { ...current.settings, workStartHour: Number(e.target.value) } }))} />
                    </Field>
                    <Field label="Work end">
                      <input className="input-base" type="number" min={0} max={23} value={forge.settings.workEndHour} onChange={(e) => updateForge((current) => ({ settings: { ...current.settings, workEndHour: Number(e.target.value) } }))} />
                    </Field>
                  </div>
                  <Field label="Sprint length (days)">
                    <input className="input-base" type="number" min={3} max={30} value={forge.settings.sprintLengthDays} onChange={(e) => updateForge((current) => ({ settings: { ...current.settings, sprintLengthDays: Number(e.target.value) } }))} />
                  </Field>
                </>
              )}
              {tab === "career" && (
                <Field label="LinkedIn (Career slice)" hint="Writes the Career record used by network and portfolio views.">
                  <input className="input-base" value={career.linkedin ?? ""} onChange={(e) => updateCareer(() => ({ linkedin: e.target.value.slice(0, 120) }))} />
                </Field>
              )}
              {tab === "health" && (
                <>
                  <div className="profile-row">
                    <Field label="Age">
                      <input className="input-base" type="number" min={12} max={90} value={health.profile.ageYears} onChange={(e) => updateHealth((h) => ({ profile: { ...h.profile, ageYears: Number(e.target.value) } }))} />
                    </Field>
                    <Field label="Height (cm)">
                      <input className="input-base" type="number" min={120} max={230} value={health.profile.heightCm} onChange={(e) => updateHealth((h) => ({ profile: { ...h.profile, heightCm: Number(e.target.value) } }))} />
                    </Field>
                  </div>
                  <Field label="Gender">
                    <select className="input-base" value={health.profile.gender} onChange={(e) => updateHealth((h) => ({ profile: { ...h.profile, gender: e.target.value as "male" | "female" } }))}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </Field>
                  <Field label="City">
                    <input className="input-base" value={health.profile.city} onChange={(e) => updateHealth((h) => ({ profile: { ...h.profile, city: e.target.value.slice(0, 80) } }))} />
                  </Field>
                  <Field label="Activity">
                    <select className="input-base" value={health.profile.activityLevel} onChange={(e) => updateHealth((h) => ({ profile: { ...h.profile, activityLevel: e.target.value as typeof h.profile.activityLevel } }))}>
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="active">Active</option>
                      <option value="very_active">Very active</option>
                    </select>
                  </Field>
                  <p className="profile-hint">Health remains the source of truth for BMR, TDEE and sleep formulas. Confirm data in Notifications setup.</p>
                </>
              )}
              {tab === "entertainment" && (
                <>
                  <Field label="Language">
                    <select className="input-base" value={entertainment.settings.language} onChange={(e) => updateEntertainment((current) => ({ settings: { ...current.settings, language: e.target.value as typeof current.settings.language } }))}>
                      <option value="en">English</option>
                      <option value="ta">Tamil</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </Field>
                  <label className="profile-check">
                    <input type="checkbox" checked={entertainment.settings.monthlyRollover} onChange={(e) => updateEntertainment((current) => ({ settings: { ...current.settings, monthlyRollover: e.target.checked } }))} />
                    Monthly rollover
                  </label>
                </>
              )}
              {tab === "github" && (
                <>
                  <Field label="GitHub username">
                    <input className="input-base" value={profile.githubUsername} maxLength={39} onChange={(e) => updateProfile({ githubUsername: e.target.value.replace(/[^A-Za-z0-9-]/g, "") })} />
                  </Field>
                  <Field label="Optional session token" hint="Stored in this tab only. Never written to localStorage or backups.">
                    <input className="input-base" type="password" value={token} placeholder="ghp_…" onChange={(e) => {
                      const next = e.target.value.trim();
                      setToken(next);
                      if (next) sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, next);
                      else sessionStorage.removeItem(GITHUB_TOKEN_SESSION_KEY);
                    }} />
                  </Field>
                  <Field label="Attach to Forge project">
                    <select className="input-base" value={linkProjectId} onChange={(e) => setLinkProjectId(e.target.value)}>
                      <option value="">First project</option>
                      {forge.projects.map((project) => <option key={project.id} value={project.id}>{project.codename} · {project.title}</option>)}
                    </select>
                  </Field>
                  <button type="button" className="btn-primary" onClick={loadRepos}>Load public repositories</button>
                  {repoStatus && <p className="profile-hint">{repoStatus}</p>}
                  <ul className="profile-repo-list">
                    {repos.map((repo) => (
                      <li key={repo.fullName}>
                        <div>
                          <strong>{repo.fullName}</strong>
                          <span>{repo.language || "n/a"} · {repo.stars}★</span>
                        </div>
                        <button type="button" className="btn-ghost" onClick={() => attachRepo(repo)}><Link2 size={12} /> Link</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
