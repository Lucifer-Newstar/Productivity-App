"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Task, Note, SpaceId } from "./types";
import { SPACES } from "./types";

interface StoreState {
  tasks: Task[];
  notes: Note[];
  addTask: (t: Omit<Task, "id" | "createdAt" | "completed">) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  addNote: (n: Omit<Note, "id" | "updatedAt" | "pinned">) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
}

const StoreContext = createContext<StoreState | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const DAY = 86_400_000;

const seedTasks: Task[] = [
  { id: uid(), title: "Design the landing page hero",   completed: false, priority: "high",   space: "projects",      createdAt: Date.now() - 2 * DAY },
  { id: uid(), title: "Set up CI/CD pipeline",          completed: false, priority: "medium", space: "projects",      createdAt: Date.now() - DAY },
  { id: uid(), title: "Push day — chest & triceps",     completed: true,  priority: "medium", space: "workout",       createdAt: Date.now() - 1 * 3600_000 },
  { id: uid(), title: "Leg day session",               completed: false, priority: "high",   space: "workout",       createdAt: Date.now() - 2 * 3600_000 },
  { id: uid(), title: "Update resume & LinkedIn",       completed: false, priority: "medium", space: "career",        createdAt: Date.now() - 5 * 3600_000 },
  { id: uid(), title: "Schedule 1:1 with mentor",       completed: true,  priority: "low",    space: "career",        createdAt: Date.now() - DAY },
  { id: uid(), title: "Watch Dune: Part Two",           completed: false, priority: "low",    space: "entertainment", createdAt: Date.now() - 3 * DAY },
  { id: uid(), title: "Try the new ramen shop",         completed: false, priority: "low",    space: "entertainment", createdAt: Date.now() - 6 * 3600_000 },
  { id: uid(), title: "Drink 2L of water today",        completed: true,  priority: "medium", space: "health",        createdAt: Date.now() - 1 * 3600_000 },
  { id: uid(), title: "7+ hours sleep",                 completed: false, priority: "high",   space: "health",        createdAt: Date.now() - 2 * 3600_000 },
];

const seedNotes: Note[] = [
  { id: uid(), title: "Product ideas",     content: "- AI writing assistant\n- Habit tracker with streaks\n- Minimal pomodoro that plays lo-fi", color: "#8b5cf6", pinned: true,  updatedAt: Date.now() - 100_000 },
  { id: uid(), title: "Books to read",     content: "1. Deep Work — Cal Newport\n2. Atomic Habits\n3. The Pragmatic Programmer",                 color: "#06b6d4", pinned: false, updatedAt: Date.now() - 500_000 },
  { id: uid(), title: "Sprint kickoff",    content: "Sprint 24:\n- Auth refresh\n- Dashboard widgets\n- Performance budget",                      color: "#ec4899", pinned: false, updatedAt: Date.now() - 2_000_000 },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return seedTasks;
    const stored = localStorage.getItem("kaizen.tasks");
    return stored ? JSON.parse(stored) : seedTasks;
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === "undefined") return seedNotes;
    const stored = localStorage.getItem("kaizen.notes");
    return stored ? JSON.parse(stored) : seedNotes;
  });

  useEffect(() => { localStorage.setItem("kaizen.tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("kaizen.notes", JSON.stringify(notes)); }, [notes]);
  // clear old storage keys from previous versions
  useEffect(() => {
    localStorage.removeItem("prod.tasks");
    localStorage.removeItem("prod.notes");
    localStorage.removeItem("prod.projects");
    localStorage.removeItem("prod.habits");
  }, []);

  const addTask: StoreState["addTask"] = useCallback((t) => {
    setTasks((prev) => [{ ...t, id: uid(), completed: false, createdAt: Date.now() }, ...prev]);
  }, []);
  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const addNote: StoreState["addNote"] = useCallback((n) => {
    setNotes((prev) => [{ ...n, id: uid(), pinned: false, updatedAt: Date.now() }, ...prev]);
  }, []);
  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  }, []);
  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);
  const togglePinNote = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        tasks, notes,
        addTask, toggleTask, deleteTask, updateTask,
        addNote, updateNote, deleteNote, togglePinNote,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useSpace(spaceId: SpaceId) {
  return SPACES.find((s) => s.id === spaceId)!;
}
