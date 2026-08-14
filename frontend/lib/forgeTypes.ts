/**
 * Forge / Projects OS data model.
 *
 * Industrial foundry (dark) / drafting-room vellum (light) themed space.
 * Cross-links to Career (skills, portfolio, network).
 */

export type ProjectHealth = "on-track" | "blocked" | "off-track" | "done" | "dead" | "paused";
export type CheckinFreq = "daily" | "weekly" | "biweekly" | "monthly";
export type TaskPriority = "P0" | "P1" | "P2" | "P3";
export type TaskStatus = "todo" | "doing" | "review" | "blocked" | "done";
export type TaskEnergy = 1 | 2 | 3 | 4 | 5;
export type RiskProb = "low" | "med" | "high";
export type RiskImpact = "low" | "med" | "high";
export type StakeholderPower = "low" | "med" | "high";
export type StakeholderInterest = "low" | "med" | "high";
export type StakeholderStance = "ally" | "neutral" | "opponent" | "champion" | "decision-maker" | "influencer";

export interface ProjectStakeholder {
  id: string;
  name: string;
  role?: string;
  contactId?: string; // link to career network
  power: StakeholderPower;
  interest: StakeholderInterest;
  stance: StakeholderStance;
  satisfaction?: number; // 1-10
  notes?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  date?: string;          // target date ISO
  done: boolean;
  doneAt?: string;
  notes?: string;
  celebration?: string;
}

export interface PremortemItem {
  id: string;
  failure: string;
  mitigation: string;
  likelihood: RiskProb;
}

export interface RiskItem {
  id: string;
  description: string;
  probability: RiskProb;
  impact: RiskImpact;
  mitigation: string;
  contingency: string;
  status: "open" | "mitigated" | "occurred";
}

export interface IssueItem {
  id: string;
  description: string;
  impact: string;
  priority: "low" | "med" | "high" | "crit";
  owner?: string;
  status: "open" | "wip" | "resolved";
  resolution?: string;
  createdAt: string;
}

export interface QualityCheck {
  id: string;
  label: string;
  category?: "testing" | "review" | "feedback" | "standards" | "compliance";
  done: boolean;
  note?: string;
}

export interface CommsLogEntry {
  id: string;
  date: string;
  person: string;
  channel: string;
  topic: string;
  summary: string;
  actionItems: string;
  satisfaction?: number;
  type?: "update" | "sponsor" | "decision" | "champion" | "opponent";
}

export interface ChangeRequest {
  id: string;
  date: string;
  description: string;
  reason: string;
  impact: string;
  approved: "pending" | "approved" | "rejected";
}

export interface Resource {
  id: string;
  name: string;
  kind: "people" | "budget" | "equipment" | "software";
  allocated: number;
  used: number;
  unit: string;
}

export interface QualityMetric {
  id: string;
  label: string;
  target: number;
  actual?: number;
  unit: string;
}

export interface WeeklyReport {
  id: string;
  weekOf: string;
  accomplishments: string;
  nextWeek: string;
  blockers: string;
  risks: string;
  decisionsNeeded: string;
  mood?: 1|2|3|4|5;
  hoursLogged?: number;
}

export interface GoNoGo {
  id: string;
  date: string;
  decision: "go" | "no-go" | "hold";
  rationale: string;
  nextReview?: string;
}

export interface SatisfactionLog {
  id: string;
  date: string;
  score: number; // 1-10
  note?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  doneAt?: string;
  estimateMins?: number;
  actualMins?: number;
  pomodoros: number;
  energy: TaskEnergy;
  focus: TaskEnergy;
  difficulty?: number;   // 1-10
  importance?: number;   // 1-10
  urgency?: number;      // 1-10
  effort?: 1|2|3|4|5;
  impact?: 1|2|3|4|5;
  tags: string[];
  context?: string[];    // home/office/errand/online…
  parentId?: string;     // subtask
  dependsOn?: string[];
  subtaskIds: string[];
  today?: boolean;
  stuck?: boolean;
  stuckNote?: string;
  comments: { id: string; date: string; text: string }[];
  checkpoints?: { id: string; date: string; note: string }[];
  createdAt: string;
  completedAt?: string;
  satisfaction?: number;
  linkedNoteIds?: string[];
  recurringDays?: number; // repeat every N days
  assignee?: string;
  recurrence?: { freq: "daily"|"weekly"|"biweekly"|"monthly"; interval: number };
  nextAction?: boolean;
  clonedFrom?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: "created" | "status" | "milestone" | "risk" | "issue" | "ship" | "kill" | "edit";
  message: string;
}

export interface ScratchNote {
  id: string;
  projectId?: string;
  text: string;
  pinned?: boolean;
  createdAt: number;
}

export interface DecisionEntry {
  id: string;
  projectId?: string;
  date: string;
  decision: string;
  alternatives: string;
  why: string;
  approvals?: string;
}

export interface SwotRow {
  id: string;
  projectId?: string;
  quadrant: "S" | "W" | "O" | "T";
  text: string;
}

export interface ProConItem {
  id: string;
  projectId?: string;
  side: "pro" | "con";
  text: string;
  weight: number;
}

export interface ScenarioEntry {
  id: string;
  projectId: string;
  title: string;
  trigger: string;
  response: string;
}

export interface FiveWhy {
  id: string;
  projectId: string;
  problem: string;
  whys: string[]; // 5
}

export interface LessonEntry {
  id: string;
  projectId?: string;
  date: string;
  category: "well" | "poorly" | "improve" | "general";
  text: string;
  tags: string[];
}

export interface Retrospective {
  id: string;
  projectId?: string;
  date: string;
  start: string[];
  stop: string[];
  continue: string[];
}

export interface Persona {
  id: string;
  projectId?: string;
  name: string;
  role: string;
  goal: string;
  pain: string;
}

export interface DecisionMatrixRow {
  id: string;
  projectId?: string;
  title: string;
  criteria: { label: string; weight: number; score: number }[];
}

export interface Idea {
  id: string;
  projectId?: string;
  text: string;
  kind: "idea" | "worst" | "reverse" | "mood" | "kano";
  kanoCat?: "must" | "perf" | "delight" | "indiff" | "reverse";
  votes?: number;
  bucket?: string;
  createdAt: number;
}

export interface Fishbone {
  id: string;
  projectId?: string;
  problem: string;
  categories: { name: string; causes: string[] }[];
}

export interface SixHats {
  id: string;
  projectId?: string;
  topic: string;
  date: string;
  white: string; // facts
  red: string;   // feelings
  black: string; // risks
  yellow: string; // benefits
  green: string; // creativity
  blue: string;  // process/conclusion
}

export interface Scamper {
  id: string;
  projectId?: string;
  topic: string;
  date: string;
  substitute: string;
  combine: string;
  adapt: string;
  modify: string;
  put: string; // put to other use
  eliminate: string;
  reverse: string;
}

export interface ProjectBudget {
  estimated?: number;
  actual: number;
  currency: string;
}

export interface Obituary {
  whyStopped: string;
  learned: string;
  startAgain: "yes" | "no" | "maybe";
  date?: string;
}

export interface ForgeProject {
  id: string;
  codename: string;       // shown in header (codename feel)
  title: string;
  brief: string;
  why: string;            // manifesto
  successMetrics: string;
  rejectionCriteria: string;
  status: ProjectHealth;
  priority: number;       // 1-10
  energyDemand: number;   // 1-10
  complexity: number;     // 1-10
  color: string;          // forge accent
  icon: string;           // emoji
  createdAt: string;
  deadline?: string;
  startedAt?: string;
  completedAt?: string;
  archived: boolean;
  checkinFreq: CheckinFreq;
  budget: ProjectBudget;
  budgetBenefit?: { projectedROI?: number; actualROI?: number; socialImpact?: string; notes?: string };
  stakeholders: ProjectStakeholder[];
  milestones: ProjectMilestone[];
  premortem: PremortemItem[];
  risks: RiskItem[];
  issues: IssueItem[];
  qualityChecks: QualityCheck[];
  qualityMetrics?: QualityMetric[];
  comms: CommsLogEntry[];
  changeRequests?: ChangeRequest[];
  resources?: Resource[];
  weeklyReports?: WeeklyReport[];
  skillTagIds?: string[];    // link to career skills
  portfolioLinkId?: string;  // link to portfolio project on completion
  networkContactIds?: string[]; // link to career network
  obituary?: Obituary;
  links: { label: string; url: string }[];
  fileLinks?: { label: string; path: string }[];
  scope: string;
  scopeHistory?: { date: string; text: string }[];
  tags: string[];
  template?: string;
  velocityPoints: number[];  // weekly velocity (tasks done per week)
  timeline?: TimelineEvent[];
  handoverDoc?: string;
  continuityPlan?: string;
  regulatoryChecks?: { label: string; checked: boolean }[];
  goalAlignment?: string;
  goNoGos?: GoNoGo[];
  satisfactionLog?: SatisfactionLog[];
  costBenefit?: { oneTimeCost: number; ongoingCost: number; projectedBenefit: number; paybackMonths?: number };
  sponsorLog?: { date: string; note: string }[];
}

export interface ParkingLotItem {
  id: string;
  text: string;
  projectId?: string;
  createdAt: string;
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  projectId?: string;
  startedAt: number;
  durationMin: number;
  completed: boolean;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "closed";
  projectId?: string;  // optional — if unset = cross-project sprint
  taskIds: string[];
  velocityTarget?: number;
  completedAt?: string;
  retrospective?: string;
}

export interface WeeklyReview {
  id: string;
  weekOf: string;     // Monday yyyy-mm-dd
  mood?: 1|2|3|4|5;
  shipped: string[];  // task ids
  carry: string[];    // task ids carrying over
  wins: string;
  learnings: string;
  nextWeekFocus: string;
  distractions: string;
  hoursWorked?: number;
  rating?: 1|2|3|4|5;
  createdAt: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  codename: string;
  icon: string;
  color: string;
  description: string;
  sections: {
    hasMilestones: boolean;
    hasPremortem: boolean;
    hasRisks: boolean;
    hasStakeholders: boolean;
    hasQualityChecks: boolean;
  };
  boilerplate: {
    brief?: string;
    why?: string;
    successMetrics?: string;
    checkinFreq: CheckinFreq;
    defaultTags: string[];
  };
}

export interface ForgeState {
  projects: ForgeProject[];
  tasks: ProjectTask[];
  scratch: ScratchNote[];
  decisions: DecisionEntry[];
  swot: SwotRow[];
  proscons: ProConItem[];
  scenarios: ScenarioEntry[];
  fiveWhys: FiveWhy[];
  lessons: LessonEntry[];
  retors: Retrospective[];
  parking: ParkingLotItem[];
  pomodoros: PomodoroSession[];
  personas: Persona[];
  decisionMatrix: DecisionMatrixRow[];
  ideas: Idea[];
  fishbones: Fishbone[];
  sixHats: SixHats[];
  scamper: Scamper[];
  sprints: Sprint[];
  reviews: WeeklyReview[];
  streak: {
    lastActive: string;   // yyyy-mm-dd
    current: number;      // days
    longest: number;
    history: string[];    // iso dates w/ >=1 completed task
  };
  settings: {
    workStartHour: number;
    workEndHour: number;
    defaultEnergyPeak: "morning" | "afternoon" | "evening";
    forgeName: string;
    sprintLengthDays: number;
  };
}
