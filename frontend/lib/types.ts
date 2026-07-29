export type Priority = "low" | "medium" | "high";

export type SpaceId = "projects" | "workout" | "career" | "entertainment" | "health";

export type View =
  | "dashboard"
  | "tasks"
  | "pomodoro"
  | "notes"
  | "habits"
  | "calendar"
  | SpaceId;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  space: SpaceId;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  updatedAt: number;
}

export interface Space {
  id: SpaceId;
  name: string;
  color: string;
  emoji: string;
}

export const SPACES: Space[] = [
  { id: "projects",     name: "Projects",      color: "#8b5cf6", emoji: "📁" },
  { id: "workout",      name: "Workout",       color: "#ec4899", emoji: "💪" },
  { id: "career",       name: "Career",        color: "#06b6d4", emoji: "💼" },
  { id: "entertainment",name: "Entertainment", color: "#f59e0b", emoji: "🎮" },
  { id: "health",       name: "Health",        color: "#a3e635", emoji: "❤️" },
];
