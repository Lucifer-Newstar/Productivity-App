export type DomainId = "core" | "forge" | "career" | "workout" | "health" | "entertainment" | "notifications";
export type Sensitivity = "normal" | "personal" | "health" | "restricted";
export type ContentTrust = "system" | "kaizen-derived" | "user-authored" | "externally-imported";

export interface RevisionVector {
  installationEpoch: string;
  domains: Partial<Record<DomainId, number>>;
}

export interface AnalyticsFact {
  id: string;
  label: string;
  value: unknown;
  algorithm: string;
  algorithmVersion: string;
  computedAt: string;
}

export interface RedactionNotice {
  field: string;
  reason: "not-required" | "consent" | "sensitive" | "unsafe";
}

export interface DomainSnapshot<T = unknown> {
  contract: string;
  contractVersion: string;
  domain: DomainId;
  snapshotId: string;
  revision: RevisionVector;
  capturedAt: string;
  timezone: string;
  sensitivity: Sensitivity;
  trust: "kaizen-derived";
  data: T;
  analytics: AnalyticsFact[];
  redactions: RedactionNotice[];
}

export interface TodayContextV1 {
  localDate: string;
  availableFocusMinutes?: number;
  tasks: Array<{
    id: string;
    title: string;
    space: string;
    priority: "low" | "medium" | "high";
    dueDate?: string;
    completed: boolean;
  }>;
  scheduled: Array<{
    id: string;
    source: string;
    title: string;
    startsAt?: string;
    estimateMinutes?: number;
  }>;
  deterministicNextAction?: {
    sourceId: string;
    title: string;
    reason: string;
    estimateMinutes?: number;
    algorithmVersion: string;
  };
  attention: Array<{
    notificationId: string;
    section: string;
    priority: "high" | "critical";
    title: string;
  }>;
}
