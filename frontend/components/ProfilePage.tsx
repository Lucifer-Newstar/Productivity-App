"use client";
/** Calm full-page Kaizen profile: identity strip, section pills, one quiet card. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight, Briefcase, Camera, Dumbbell, FolderKanban, GitBranch, HeartPulse,
  Home, Link2, Sparkles, UserRound,
} from "lucide-react";
import TopNav from "./TopNav";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { GITHUB_REPO_URL, GITHUB_TOKEN_SESSION_KEY, type HomeLandingView } from "../lib/profileTypes";
import { readSafeImageAsDataUrl } from "../lib/security";
import type { PublicGithubRepo } from "../lib/githubRepos";
import {
  AFTERGLOW_KEY_FIELDS, emptyAfterglowKeyDraft, readAfterglowSessionKeys,
  writeAfterglowSessionKeys, clearAfterglowSessionKeys, type AfterglowKeyId,
} from "../lib/entertainmentKeys";
import CycleLogCard from "./health/CycleLogCard";
import type { Gender } from "../lib/healthTypes";

type Tab = "identity" | "home" | "workout" | "forge" | "career" | "health" | "entertainment" | "github";
const TABS: { id: Tab; label: string; href: string; icon: typeof UserRound }[] = [
  { id: "identity", label: "You", href: "/profile", icon: UserRound },
  { id: "home", label: "Home", href: "/", icon: Home },
  { id: "workout", label: "Workout", href: "/workout/overview", icon: Dumbbell },
  { id: "forge", label: "Forge", href: "/projects", icon: FolderKanban },
  { id: "career", label: "Career", href: "/career/projects", icon: Briefcase },
  { id: "health", label: "Health", href: "/health/sync", icon: HeartPulse },
  { id: "entertainment", label: "Glow", href: "/entertainment", icon: Sparkles },
  { id: "github", label: "GitHub", href: "/projects", icon: GitBranch },
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
  const [photoError, setPhotoError] = useState("");
  const [glowKeys, setGlowKeys] = useState(emptyAfterglowKeyDraft);
  const [glowSaved, setGlowSaved] = useState(false);
  const [glowHelp, setGlowHelp] = useState<AfterglowKeyId | null>(null);
  const zones = useMemo(() => Array.from(new Set([profile.timezone, ...ZONES].filter(Boolean))), [profile.timezone]);

  useEffect(() => {
    setToken(sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) ?? "");
    setGlowKeys(readAfterglowSessionKeys());
  }, []);

  function setGender(next: Gender) {
    updateHealth((h) => ({
      profile: { ...h.profile, gender: next },
      settings: { ...h.settings, cycleTrackingVisible: next === "female" ? true : h.settings.cycleTrackingVisible },
    }));
  }

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

  async function onAvatar(file?: File) {
    if (!file) return;
    setPhotoError("");
    try { updateProfile({ avatarDataUrl: await readSafeImageAsDataUrl(file) }); }
    catch (error) { setPhotoError(error instanceof Error ? error.message : "Image rejected"); }
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
    <div className="home-root profile-page" data-theme={theme} data-gender={health.profile.gender}>
      <TopNav />
      <main className="profile-shell">
        <header className="profile-identity">
          <label className="profile-avatar-edit">
            {profile.avatarDataUrl
              ? <img src={profile.avatarDataUrl} alt="" />
              : <span>{initials(profile.displayName)}</span>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onAvatar(event.target.files?.[0])} />
            <em><Camera size={12} /> Photo</em>
          </label>
          <div className="profile-identity-copy">
            <input
              className="profile-name-input"
              value={profile.displayName}
              maxLength={80}
              placeholder="Your name"
              aria-label="Display name"
              onChange={(e) => updateProfile({ displayName: e.target.value })}
            />
            <input
              className="profile-handle-input"
              value={profile.handle}
              maxLength={32}
              placeholder="@handle"
              aria-label="Handle"
              onChange={(e) => updateProfile({ handle: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })}
            />
            <p className="profile-quiet">{profile.timezone} · {readyCount} of {TAB_IDS.length} ready</p>
            {photoError && <p className="profile-hint">{photoError}</p>}
          </div>
        </header>

        <nav className="profile-pills" aria-label="Profile sections">
          {TABS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={tab === item.id ? "is-active" : ""}
                onClick={() => openTab(item.id)}
              >
                <Icon size={13} />
                {item.label}
                <i className={filled[item.id] ? "is-ready" : ""} />
              </button>
            );
          })}
        </nav>

        <section className="profile-card" aria-label={activeTab.label}>
          <div className="profile-card-head">
            <h2>{activeTab.label}</h2>
            {activeTab.id !== "identity" && (
              <Link href={activeTab.href} className="profile-space-link">
                Open <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
          <div className="profile-body">
            {tab === "identity" && (
              <>
                <Field label="Gender" hint="Writes Health formulas. Spaces keep their own look.">
                  <select className="input-base" value={health.profile.gender} onChange={(e) => setGender(e.target.value as Gender)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </Field>
                <Field label="Timezone">
                  <select className="input-base" value={profile.timezone} onChange={(e) => updateProfile({ timezone: e.target.value })}>
                    {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                  </select>
                </Field>
                <Field label="Website">
                  <input className="input-base" value={profile.website} placeholder="https://" onChange={(e) => updateProfile({ website: e.target.value })} />
                </Field>
                <Field label="LinkedIn">
                  <input className="input-base" value={profile.linkedin} placeholder="https://linkedin.com/in/…" onChange={(e) => updateProfile({ linkedin: e.target.value })} />
                </Field>
              </>
            )}
            {tab === "home" && (
              <Field label="Landing view" hint="Home opens this view after load.">
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
                <div className="profile-row">
                  <Field label="Units">
                    <select className="input-base" value={workout.settings.units} onChange={(e) => updateWorkoutSettings({ units: e.target.value as "kg" | "lb" })}>
                      <option value="kg">Kilograms</option>
                      <option value="lb">Pounds</option>
                    </select>
                  </Field>
                  <Field label="Phase">
                    <select className="input-base" value={workout.settings.phase ?? "maintenance"} onChange={(e) => updateWorkoutSettings({ phase: e.target.value as typeof workout.settings.phase })}>
                      <option value="maintenance">Maintenance</option>
                      <option value="bulking">Bulking</option>
                      <option value="cutting">Cutting</option>
                      <option value="deload">Deload</option>
                      <option value="peak">Peak</option>
                    </select>
                  </Field>
                </div>
                <p className="profile-hint">Sessions and PRs stay in Workout.</p>
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
              <Field label="Career LinkedIn" hint="Writes the Career record used by network views.">
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
                <div className="profile-row">
                  <Field label="Gender">
                    <select className="input-base" value={health.profile.gender} onChange={(e) => setGender(e.target.value as Gender)}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
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
                </div>
                <Field label="City">
                  <input className="input-base" value={health.profile.city} onChange={(e) => updateHealth((h) => ({ profile: { ...h.profile, city: e.target.value.slice(0, 80) } }))} />
                </Field>
                <p className="profile-hint">Formulas and cycle tools ship in the next Health wave. Confirm data in Notifications setup.</p>
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
                <div className="profile-divider" />
                <p className="profile-hint">Catalogue keys live in this tab only — never backed up. AniList and Open Library need no key. Server env vars remain preferred.</p>
                {AFTERGLOW_KEY_FIELDS.map((field) => (
                  <div className="profile-field" key={field.id}>
                    <span className="profile-key-title">
                      {field.label}
                      <button
                        type="button"
                        className="profile-help-bang"
                        aria-label={`How to get ${field.label}`}
                        aria-expanded={glowHelp === field.id}
                        onClick={() => setGlowHelp((current) => current === field.id ? null : field.id)}
                      >!</button>
                    </span>
                    {glowHelp === field.id && (
                      <span className="profile-help-pop" role="note">
                        {field.help}{" "}
                        <a href={field.helpUrl} target="_blank" rel="noopener noreferrer">Official guide</a>
                      </span>
                    )}
                    <input
                      className="input-base"
                      type="password"
                      autoComplete="off"
                      value={glowKeys[field.id]}
                      placeholder="Session-only credential"
                      aria-label={field.label}
                      onChange={(e) => setGlowKeys((current) => ({ ...current, [field.id]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="profile-key-actions">
                  <button type="button" className="btn-ghost" onClick={() => { clearAfterglowSessionKeys(); setGlowKeys(emptyAfterglowKeyDraft()); setGlowSaved(false); }}>Clear session keys</button>
                  <button type="button" className="btn-primary" onClick={() => { writeAfterglowSessionKeys(glowKeys); setGlowSaved(true); }}>{glowSaved ? "Saved for this tab" : "Save session keys"}</button>
                </div>
              </>
            )}
            {tab === "github" && (
              <>
                <Field label="GitHub username">
                  <input className="input-base" value={profile.githubUsername} maxLength={39} onChange={(e) => updateProfile({ githubUsername: e.target.value.replace(/[^A-Za-z0-9-]/g, "") })} />
                </Field>
                <Field label="Session token" hint="This tab only. Never backed up.">
                  <input className="input-base" type="password" value={token} placeholder="ghp_…" onChange={(e) => {
                    const next = e.target.value.trim();
                    setToken(next);
                    if (next) sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, next);
                    else sessionStorage.removeItem(GITHUB_TOKEN_SESSION_KEY);
                  }} />
                </Field>
                <Field label="Attach to project">
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
      </main>
    </div>
  );
}
