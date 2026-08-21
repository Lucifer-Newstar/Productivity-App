"use client";
/** Full-page Kaizen profile: identity hero, section pills, one focused card. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight, Briefcase, Camera, Dumbbell, FolderKanban, GitBranch, HeartPulse,
  Home, Link2, Minus, Plus, Sparkles, UserRound,
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
import {
  bmi, bmiCategory, bmrMifflin, latestStandingWeightKg, proteinTargetG, tdee, waterGoalMl,
} from "../lib/healthAnalytics";

type Tab = "identity" | "home" | "workout" | "forge" | "career" | "health" | "entertainment" | "github";
const TABS: { id: Tab; label: string; href: string; icon: typeof UserRound; lead: string }[] = [
  { id: "identity", label: "You", href: "/profile", icon: UserRound, lead: "Name, photo, gender and standing weight." },
  { id: "home", label: "Home", href: "/", icon: Home, lead: "Which Home view opens after load." },
  { id: "workout", label: "Workout", href: "/workout/overview", icon: Dumbbell, lead: "Units and phase. Sessions stay in Workout." },
  { id: "forge", label: "Forge", href: "/projects", icon: FolderKanban, lead: "Workspace hours and sprint length." },
  { id: "career", label: "Career", href: "/career/projects", icon: Briefcase, lead: "Public career link used by network views." },
  { id: "health", label: "Health", href: "/health/sync", icon: HeartPulse, lead: "Age, height, standing weight and formulas. Cycle log is optional." },
  { id: "entertainment", label: "Glow", href: "/entertainment", icon: Sparkles, lead: "Language and catalogue keys for this tab only." },
  { id: "github", label: "GitHub", href: "/projects", icon: GitBranch, lead: "Public username and a session token, never backed up." },
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

function WeightField({ kg, onCommit }: { kg: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState(kg > 0 ? String(kg) : "");
  useEffect(() => { setDraft(kg > 0 ? String(kg) : ""); }, [kg]);
  function flush() {
    const n = Number(draft);
    if (Number.isFinite(n) && n >= 30 && n <= 250) onCommit(n);
    else setDraft(kg > 0 ? String(kg) : "");
  }
  return (
    <div className="profile-weight">
      <button type="button" className="profile-weight-step" aria-label="Decrease weight" disabled={!(kg > 0)} onClick={() => onCommit(kg - 0.1)}><Minus size={14} /></button>
      <input
        className="input-base profile-weight-input"
        type="number"
        min={30}
        max={250}
        step={0.1}
        value={draft}
        placeholder="—"
        aria-label="Standing weight in kilograms"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={flush}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); flush(); } }}
      />
      <button type="button" className="profile-weight-step" aria-label="Increase weight" disabled={!(kg > 0)} onClick={() => onCommit(kg + 0.1)}><Plus size={14} /></button>
    </div>
  );
}

export default function ProfilePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const store = useStore();
  const { profile, updateProfile, health, updateHealth, workout, updateWorkoutSettings, logBodyweight, forge, updateForge, career, updateCareer, entertainment, updateEntertainment } = store;
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
  const female = health.profile.gender === "female";
  const standingKg = useMemo(() => latestStandingWeightKg(workout.bodyweight), [workout.bodyweight]);
  const hp = health.profile;
  const intel = useMemo(() => {
    if (!(standingKg > 0 && hp.heightCm > 0 && hp.ageYears > 0)) return null;
    const bmiVal = bmi(standingKg, hp.heightCm);
    return {
      bmi: bmiVal,
      bmiLabel: bmiCategory(bmiVal).label,
      bmr: Math.round(bmrMifflin(standingKg, hp.heightCm, hp.ageYears, hp.gender)),
      tdee: Math.round(tdee(standingKg, hp)),
      water: waterGoalMl(standingKg, hp.climateMult),
      protein: proteinTargetG(standingKg),
    };
  }, [standingKg, hp]);
  function commitWeight(raw: number) {
    if (!Number.isFinite(raw)) return;
    logBodyweight(Math.round(Math.min(250, Math.max(30, raw)) * 10) / 10);
  }

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
  const glowOn = AFTERGLOW_KEY_FIELDS.filter((field) => glowKeys[field.id].trim()).length;

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
        <header className="profile-hero">
          <label className="profile-avatar-edit">
            {profile.avatarDataUrl
              ? <img src={profile.avatarDataUrl} alt="" />
              : <span>{initials(profile.displayName)}</span>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onAvatar(event.target.files?.[0])} />
            <em><Camera size={12} /> Photo</em>
          </label>
          <div className="profile-identity-copy">
            <p className="profile-kicker">{female ? "Atelier profile" : "Instrument profile"}</p>
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
            <div className="profile-chips">
              <span>{profile.timezone}</span>
              <span>{female ? "Female" : "Male"}</span>
              {standingKg > 0 && <span>{standingKg.toFixed(1)} kg</span>}
              <span>{readyCount} / {TAB_IDS.length} ready</span>
            </div>
            <div className="profile-meter" aria-hidden>
              <i style={{ width: `${Math.round((readyCount / TAB_IDS.length) * 100)}%` }} />
            </div>
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
            <div>
              <p className="profile-kicker">{activeTab.label}</p>
              <h2>{activeTab.id === "identity" ? (profile.displayName || "You") : activeTab.label}</h2>
              <p className="profile-lead">{activeTab.lead}</p>
            </div>
            {activeTab.id !== "identity" && (
              <Link href={activeTab.href} className="profile-space-link">
                Open <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
          <div className="profile-body">
            {tab === "identity" && (
              <>
                <Field label="Gender">
                  <div className="profile-seg" role="group" aria-label="Gender">
                    <button type="button" className={female ? "" : "is-on"} onClick={() => setGender("male")}>Male</button>
                    <button type="button" className={female ? "is-on" : ""} onClick={() => setGender("female")}>Female</button>
                  </div>
                </Field>
                <Field label="Standing weight (kg)" hint="Set once. BMI, calories, water, protein, workout ratios and Home intelligence use this until you change it — not a daily log.">
                  <WeightField kg={standingKg} onCommit={commitWeight} />
                </Field>
                {intel && (
                  <div className="profile-intel" aria-label="Health intelligence from standing weight">
                    <div><b>{intel.bmi.toFixed(1)}</b><span>BMI · {intel.bmiLabel}</span></div>
                    <div><b>{intel.bmr}</b><span>BMR kcal</span></div>
                    <div><b>{intel.tdee}</b><span>TDEE kcal</span></div>
                    <div><b>{Math.round(intel.water / 10) / 100}</b><span>Water L</span></div>
                    <div><b>{intel.protein}g</b><span>Protein</span></div>
                  </div>
                )}
                <Field label="Timezone">
                  <select className="input-base" value={profile.timezone} onChange={(e) => updateProfile({ timezone: e.target.value })}>
                    {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                  </select>
                </Field>
                <div className="profile-row">
                  <Field label="Website">
                    <input className="input-base" value={profile.website} placeholder="https://" onChange={(e) => updateProfile({ website: e.target.value })} />
                  </Field>
                  <Field label="LinkedIn">
                    <input className="input-base" value={profile.linkedin} placeholder="https://linkedin.com/in/…" onChange={(e) => updateProfile({ linkedin: e.target.value })} />
                  </Field>
                </div>
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
                <Field label="Standing weight (kg)" hint="Same number as You. Health and Workout read it; you do not log it every day.">
                  <WeightField kg={standingKg} onCommit={commitWeight} />
                </Field>
                {intel && (
                  <div className="profile-intel" aria-label="Health intelligence from standing weight">
                    <div><b>{intel.bmi.toFixed(1)}</b><span>BMI · {intel.bmiLabel}</span></div>
                    <div><b>{intel.tdee}</b><span>TDEE kcal</span></div>
                    <div><b>{intel.protein}g</b><span>Protein</span></div>
                  </div>
                )}
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
                    <div className="profile-seg" role="group" aria-label="Gender">
                      <button type="button" className={female ? "" : "is-on"} onClick={() => setGender("male")}>Male</button>
                      <button type="button" className={female ? "is-on" : ""} onClick={() => setGender("female")}>Female</button>
                    </div>
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
                <p className="profile-hint">
                  {female
                    ? "Navy body-fat uses hip. Iron target is the ICMR adult female RDA."
                    : "Navy body-fat uses neck and waist. Iron target is the ICMR adult male RDA."}
                </p>
                <label className="profile-check">
                  <input
                    type="checkbox"
                    checked={health.settings.cycleTrackingVisible}
                    onChange={(e) => updateHealth((h) => ({ settings: { ...h.settings, cycleTrackingVisible: e.target.checked } }))}
                  />
                  Show cycle log
                </label>
                {health.settings.cycleTrackingVisible && <CycleLogCard />}
              </>
            )}
            {tab === "entertainment" && (
              <>
                <div className="profile-row">
                  <Field label="Language">
                    <select className="input-base" value={entertainment.settings.language} onChange={(e) => updateEntertainment((current) => ({ settings: { ...current.settings, language: e.target.value as typeof current.settings.language } }))}>
                      <option value="en">English</option>
                      <option value="ta">Tamil</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </Field>
                  <label className="profile-check profile-check-card">
                    <input type="checkbox" checked={entertainment.settings.monthlyRollover} onChange={(e) => updateEntertainment((current) => ({ settings: { ...current.settings, monthlyRollover: e.target.checked } }))} />
                    Monthly rollover
                  </label>
                </div>
                <div className="profile-keys">
                  <div className="profile-keys-head">
                    <strong>Catalogue keys</strong>
                    <span>{glowOn} of {AFTERGLOW_KEY_FIELDS.length} in this tab</span>
                  </div>
                  <p className="profile-hint">Session only — never backed up. AniList and Open Library need no key. Press ! for the official how-to.</p>
                  {AFTERGLOW_KEY_FIELDS.map((field) => (
                    <div className="profile-key-row" key={field.id}>
                      <div className="profile-key-title">
                        <b className={glowKeys[field.id].trim() ? "is-on" : ""} />
                        <span>{field.label}</span>
                        <button
                          type="button"
                          className="profile-help-bang"
                          aria-label={`How to get ${field.label}`}
                          aria-expanded={glowHelp === field.id}
                          onClick={() => setGlowHelp((current) => current === field.id ? null : field.id)}
                        >!</button>
                      </div>
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
                        onChange={(e) => { setGlowKeys((current) => ({ ...current, [field.id]: e.target.value })); setGlowSaved(false); }}
                      />
                    </div>
                  ))}
                  <div className="profile-key-actions">
                    <button type="button" className="btn-ghost" onClick={() => { clearAfterglowSessionKeys(); setGlowKeys(emptyAfterglowKeyDraft()); setGlowSaved(false); }}>Clear</button>
                    <button type="button" className="btn-primary" onClick={() => { writeAfterglowSessionKeys(glowKeys); setGlowSaved(true); }}>{glowSaved ? "Saved for this tab" : "Save session keys"}</button>
                  </div>
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
