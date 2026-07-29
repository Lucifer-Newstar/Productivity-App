/**
 * Shared type definitions for the Kaizen app.
 *
 * - Core domain types (Task, Note, Space) power the main productivity features
 * - Career-specific types (CareerTrack, CareerConcept, CareerGoal, etc.)
 *   are used by the /career page.
 * - The SPACES constant is the single source of truth for the five life spaces
 *   (Projects, Workout, Career, Entertainment, Health) that tasks are scoped to.
 */

// Priority level for tasks — controls badge color & sort weight
export type Priority = "low" | "medium" | "high";

// The five life "spaces" that own tasks and their own pages
export type SpaceId = "projects" | "workout" | "career" | "entertainment" | "health";

// Every top-level view routable from the sidebar.
// Core tools + the five spaces.
export type View =
  | "dashboard"
  | "tasks"
  | "pomodoro"
  | "notes"
  | "habits"
  | "calendar"
  | SpaceId;

// A to-do item. Belongs to exactly one space via `space`.
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  space: SpaceId;
  createdAt: number;
}

// Sticky note from the Notes page.
export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  updatedAt: number;
}

// Metadata for a space (color, emoji, display name) used throughout the UI
// to tint badges, headers, cards and gradients.
export interface Space {
  id: SpaceId;
  name: string;
  color: string;
  emoji: string;
}

export const SPACES: Space[] = [
  { id: "projects",      name: "Projects",      color: "#8b5cf6", emoji: "📁" },
  { id: "workout",       name: "Workout",       color: "#ec4899", emoji: "💪" },
  { id: "career",        name: "Career",        color: "#06b6d4", emoji: "💼" },
  { id: "entertainment", name: "Entertainment", color: "#f59e0b", emoji: "🎮" },
  { id: "health",        name: "Health",        color: "#a3e635", emoji: "❤️" },
];

// ---------------- Career domain ----------------

// A career "track" is a path like DevOps, SRE, Backend, etc.
// Each track owns its own roadmap (concepts → sub-concepts), notes, and resume bullets.
export type CareerTrackId = string;

// A single checkable sub-concept nested under a CareerConcept.
// e.g. under the "Networking" concept you might have "TCP/IP", "DNS", "HTTP/TLS".
export interface CareerSubConcept {
  id: string;
  title: string;
  done: boolean;
}

// A top-level roadmap concept (e.g. "Linux Fundamentals") containing an ordered
// checklist of sub-concepts. Rendered as an expandable section with its own progress.
export interface CareerConcept {
  id: string;
  title: string;
  subConcepts: CareerSubConcept[];
}

// Free-form note scoped to a specific track (interview prep, reading, etc.)
export interface CareerNote {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

// A single resume bullet point under a track.
export interface CareerBullet {
  id: string;
  text: string;
}

export interface CareerTrack {
  id: CareerTrackId;
  name: string;
  color: string;
  concepts: CareerConcept[];     // roadmap hierarchy: concepts -> sub-concepts
  notes: CareerNote[];
  resumeBullets: CareerBullet[];
}

// A high-level goal, optionally tied to a track and a deadline.
export interface CareerGoal {
  id: string;
  title: string;
  description?: string;
  trackId?: CareerTrackId;
  done: boolean;
  deadline?: string;
}

// Celebrated win (internship, certification, course completion, etc.)
// Shown in the Achievement Vault timeline.
export interface CareerAchievement {
  id: string;
  title: string;
  description?: string;
  date: string;           // ISO yyyy-mm-dd
  icon: string;           // emoji
  trackId?: CareerTrackId;
}

// Root career state persisted to localStorage under `kaizen.career`.
export interface CareerState {
  tracks: CareerTrack[];
  goals: CareerGoal[];
  achievements: CareerAchievement[];
  linkedin: string;       // LinkedIn profile URL (portfolio is placeholder)
}
