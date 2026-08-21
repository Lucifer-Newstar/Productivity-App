"use client";
/** Global identity control: top-right trigger plus a sectioned setup drawer. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase, Dumbbell, FolderKanban, GitBranch, HeartPulse, Home, Link2, Sparkles, UserRound, X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { GITHUB_REPO_URL, GITHUB_TOKEN_SESSION_KEY, type HomeLandingView } from "../lib/profileTypes";
import { readSafeImageAsDataUrl } from "../lib/security";
import type { PublicGithubRepo } from "../lib/githubRepos";

type Tab = "identity" | "home" | "workout" | "forge" | "career" | "health" | "entertainment" | "github";
const TABS: { id: Tab; label: string; icon: typeof UserRound }[] = [
  { id: "identity", label: "Identity", icon: UserRound },
  { id: "home", label: "Home", icon: Home },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "forge", label: "Forge", icon: FolderKanban },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "entertainment", label: "Glow", icon: Sparkles },
  { id: "github", label: "GitHub", icon: GitBranch },
];

const ProfileUi = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);
function useProfileUi() {
  const ctx = useContext(ProfileUi);
  if (!ctx) throw new Error("Profile trigger must render inside ProfileDock");
  return ctx;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "K") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ProfileTrigger({ className = "" }: { className?: string }) {
  const { open, setOpen } = useProfileUi();
  const { profile } = useStore();
  return (
    <button type="button" className={`profile-trigger ${className}`} aria-label="Open profile" aria-expanded={open} onClick={() => setOpen(!open)}>
      {profile.avatarDataUrl
        ? <img src={profile.avatarDataUrl} alt="" className="profile-avatar-img" />
        : <span>{initials(profile.displayName)}</span>}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="profile-field"><span>{label}</span>{children}</label>;
}

function ProfileDrawer() {
  const { open, setOpen } = useProfileUi();
  const store = useStore();
  const { profile, updateProfile, health, updateHealth, workout, updateWorkoutSettings, forge, updateForge, career, updateCareer, entertainment, updateEntertainment } = store;
  const [tab, setTab] = useState<Tab>("identity");
  const [token, setToken] = useState("");
  const [repos, setRepos] = useState<PublicGithubRepo[]>([]);
  const [repoStatus, setRepoStatus] = useState("");
  const [linkProjectId, setLinkProjectId] = useState("");

  useEffect(() => {
    if (!open) return;
    setToken(sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) ?? "");
  }, [open]);

  const filled = useMemo(() => {
    const identity = !!(profile.displayName || profile.handle);
    return {
      identity,
      home: !!profile.homeLandingView,
      workout: (workout.bodyweight?.length ?? 0) > 0,
      forge: forge.projects.length > 0,
      career: !!(career.linkedin || career.goals.length),
      health: !!(health.profile.ageYears && health.profile.heightCm && health.profile.gender),
      entertainment: entertainment.items.length > 0 || entertainment.settings.monthlyRollover,
      github: !!profile.githubUsername,
    };
  }, [profile, workout.bodyweight, forge.projects.length, career, health.profile, entertainment]);

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="profile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.aside
            className="profile-drawer"
            role="dialog"
            aria-label="Kaizen profile"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="profile-drawer-head">
              <div>
                <p>PROFILE</p>
                <h2>{profile.displayName || "Set up who you are"}</h2>
              </div>
              <button type="button" aria-label="Close profile" onClick={() => setOpen(false)}><X size={16} /></button>
            </header>
            <nav className="profile-tabs">
              {TABS.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>
                    <Icon size={13} />
                    {item.label}
                    <i className={filled[item.id] ? "is-ready" : ""} />
                  </button>
                );
              })}
            </nav>
            <div className="profile-body">
              {tab === "identity" && (
                <>
                  <Field label="Display name">
                    <input className="input-base" value={profile.displayName} maxLength={80} onChange={(e) => updateProfile({ displayName: e.target.value })} />
                  </Field>
                  <Field label="Handle">
                    <input className="input-base" value={profile.handle} maxLength={32} placeholder="navin" onChange={(e) => updateProfile({ handle: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })} />
                  </Field>
                  <Field label="Timezone">
                    <input className="input-base" value={profile.timezone} maxLength={80} onChange={(e) => updateProfile({ timezone: e.target.value })} />
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
                <Field label="Landing view">
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
                  <p className="profile-hint">Daily sessions, PRs and bodyweight logs stay in Workout. This tab is only constants.</p>
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
                <Field label="LinkedIn (Career slice)">
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
                  <Field label="Optional session token (never backed up)">
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
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProfileDock({ floating = false, children }: { floating?: boolean; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ProfileUi.Provider value={{ open, setOpen }}>
      {floating && <ProfileTrigger className="profile-dock-float" />}
      {children}
      <ProfileDrawer />
    </ProfileUi.Provider>
  );
}

export { ProfileUi };
