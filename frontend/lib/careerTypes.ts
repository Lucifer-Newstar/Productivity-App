/**
 * Career data model.
 *
 * Domains supported:
 *  - Roadmaps (parallel tracks w/ phases, milestones, resources, projects, quizzes, labs, dependencies, time estimates, proficiency)
 *  - Skill inventory (proficiency, confidence, interest, decay, graph, growth line, gap analysis)
 *  - Certifications & courses (expiry, ratings, hours, notes)
 *  - Network (contacts, relationship health, follow-ups, favor bank)
 *  - Job market (application kanban, interview Q bank, offers, company dossiers)
 *  - Achievements & portfolio (vault, project builder, resume bullets, testimonials)
 *  - Daily workflow (standup prep, meeting ROI, focus timer, work log, wins/challenges/learning)
 *  - Global (timeline, satisfaction, burnout, work-life, vision board, side-hustle, speaking, IP)
 */

export type CareerSectionId =
  | "roadmaps" | "skills" | "certs" | "network" | "jobs"
  | "portfolio" | "daily" | "global";

// ---------------- Legacy / shared aliases ----------------
export type CareerTrackId = string;

// ---------------- Roadmaps ----------------
export type RoadmapId = string;
export type ResourceType = "course" | "book" | "video" | "docs" | "lab" | "article" | "podcast" | "other";
export interface CareerResource {
  id: string;
  type: ResourceType;
  title: string;
  url?: string;
  completed?: boolean;
  notes?: string;
}
export interface CareerProject {
  id: string;
  title: string;
  description?: string;
  skillsUsed?: string[];    // skill inventory tags
  completed?: boolean;
  url?: string;
  notes?: string;
}
export interface CareerLabItem {
  id: string;
  text: string;
  done: boolean;
}
export interface CareerQuizItem {
  id: string;
  question: string;
  selfRating: "yes" | "partial" | "no";
}
export interface CareerMilestone {
  id: string;
  title: string;
  description?: string;
  hoursEstimate: number;
  hoursActual: number;
  targetProficiency: number;    // 1-10
  selfRatingBefore?: number;    // 1-10
  selfRatingAfter?: number;
  resources: CareerResource[];
  projects: CareerProject[];
  labChecklist: CareerLabItem[];
  quiz: CareerQuizItem[];
  notes?: string;
  done: boolean;
  completedAt?: number;
  dependsOn?: string[];          // milestone ids (prereqs)
  skillTags?: string[];          // skill inventory ids this unlocks/levels
}
export interface CareerPhase {
  id: string;
  title: string;
  description?: string;
  milestones: CareerMilestone[];
}
export type RoadmapStatus = "active" | "paused" | "completed" | "archived";
export interface CareerRoadmap {
  id: RoadmapId;
  name: string;
  icon: string;
  color: string;
  description?: string;
  template?: "devops" | "networking" | "linux" | "mlops" | "cloud" | "custom";
  weeklyHoursTarget: number;
  priority: number;             // 1-10
  status: RoadmapStatus;
  startLevel: number;           // 1-10
  targetLevel: number;          // 1-10
  phases: CareerPhase[];
  startedAt?: number;
  completedAt?: number;
  notes?: string;
}

// ---------------- Skill inventory ----------------
export type SkillUsageFreq = "daily" | "weekly" | "monthly" | "rarely";
export interface SkillGrowthPoint { date: string; level: number; }
export interface SkillPortfolioLink { label: string; url: string; }
export interface CareerSkill {
  id: string;
  name: string;
  category?: string;
  proficiency: number;          // 1-10
  confidence: number;           // 1-10
  interest: number;             // 1-10
  usage: SkillUsageFreq;
  lastUsedAt?: number;          // epoch ms for decay
  certIds?: string[];           // linked cert ids
  projectIds?: string[];        // linked achievement/project ids
  mentor?: string;
  resources?: { title: string; url?: string }[];
  growth: SkillGrowthPoint[];
  portfolioLinks: SkillPortfolioLink[];
  desiredLevel?: number;        // gap analysis target
}

// ---------------- Certs & courses ----------------
export interface CareerCourse {
  id: string;
  name: string;
  provider: string;
  startDate?: string;
  endDate?: string;
  completed: boolean;
  certReceived: boolean;
  expiryDate?: string;
  hoursInvested: number;
  rating?: number;              // 1-10
  notes?: string;
  keyTakeaways?: string;
  applicationNotes?: string;
  skillTags?: string[];
}

// ---------------- Network ----------------
export type RelationshipType = "mentor" | "peer" | "report" | "client" | "prospect" | "recruiter" | "friend" | "other";
export interface NetworkContact {
  id: string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  preferredChannel?: string;
  relationship: RelationshipType;
  healthScore: number;         // 1-10
  influenceScore: number;      // 1-10
  birthday?: string;
  interests?: string;          // hobbies, kids, pets, sports
  lastContactAt?: number;
  nextFollowUpAt?: number;
  notes?: string;
  nextTalkPrep?: string;       // "Next time, ask about X."
  referredBy?: string;         // contact id
  favorsGiven: number;
  favorsReceived: number;
  interactions: NetworkInteraction[];
  jobHistory?: { company: string; role: string; startedAt?: string }[];
}
export interface NetworkInteraction {
  id: string;
  date: string;
  type: "call" | "coffee" | "email" | "message" | "event" | "meeting" | "other";
  summary: string;
  goldNuggets?: string;
  followUpDate?: string;
}

// ---------------- Job market ----------------
export type AppStage =
  | "researching" | "applied" | "phone-screen" | "tech-interview"
  | "onsite" | "offer" | "rejected" | "ghosted" | "accepted";
export interface AppQuestion {
  id: string;
  question: string;
  answer?: string;
  tags?: string[];
  frequency?: number;
}
export interface CompanyDossier {
  id: string;
  name: string;
  products?: string;
  funding?: string;
  recentNews?: string;
  cultureScore?: number;
  competitors?: string;
  interviewNotes?: string;
  cultureChecks?: { label: string; value: string }[];
  careerPathNotes?: string;
  pros?: string;
  cons?: string;
}
export interface JobApplication {
  id: string;
  companyId?: string;
  role: string;
  appliedAt: string;
  stage: AppStage;
  lastContactAt?: string;
  recruiter?: string;
  referral?: string;
  resumeVersionId?: string;
  notes?: string;
  offerBase?: number;
  offerBonus?: number;
  offerEquity?: number;
  offerBenefits?: string;
  offerFinal?: number;
  counterOffer?: number;
  rejectionFeedback?: string;
  vibeScore?: number;
  decisionWeight?: { salary: number; culture: number; growth: number; commute: number; benefits: number; title: number };
  followUpReminderAt?: number;
  timeSpentMin?: number;
}

// ---------------- Achievements & portfolio ----------------
export type AchievementCategory = "technical" | "leadership" | "sales" | "product" | "process" | "personal" | "other";
export interface Achievement {
  id: string;
  title: string;
  date: string;
  category: AchievementCategory;
  description?: string;
  impact?: string;           // quantified metric
  tags?: string[];
  privateNote?: boolean;
  icon?: string;
  trackId?: string;          // legacy link to old CareerTrack
}
export interface PortfolioProject {
  id: string;
  title: string;
  summary?: string;
  role?: string;
  technologies?: string[];
  results?: string;
  challenges?: string;
  learnings?: string;
  url?: string;
  repoUrl?: string;
  heroImage?: string;
  private: boolean;
  relevanceTags?: string[];   // for "sort by relevance"
  skillTags?: string[];
  caseStudy?: { problem: string; solution: string; results: string };
}
export interface ResumeBullet {
  id: string;
  text: string;
  tags?: string[];
}
export interface ResumeVersion {
  id: string;
  name: string;
  sentTo?: string;            // company/role
  sentAt?: number;
  bullets: ResumeBullet[];
  atsKeywords: string[];
  tailoredChecklist: { label: string; done: boolean }[];
}
export interface Testimonial {
  id: string;
  from: string;
  role?: string;
  quote: string;
  date?: string;
}

// ---------------- Daily workflow ----------------
export interface WorkDayEntry {
  date: string;
  standup?: string;           // 3-bullet prep
  meetings?: MeetingEntry[];
  focusSessionsMinutes: number;
  timeAllocation?: { meetings: number; coding: number; writing: number; emails: number; planning: number; other: number };
  workLog?: string;
  mood: number;               // 1-10
  stress: number;             // 1-10
  wins?: string[];
  learnings?: string[];
  challenges?: string[];
}
export interface MeetingEntry {
  id: string;
  title: string;
  date: string;
  durationMin: number;
  attendees?: string;
  plannedAgenda?: string;
  actualDiscussion?: string;
  roiScore?: number;          // 1-5
  decisions?: string;
  actionItems?: string;
}

// ---------------- Global career ----------------
export type TimelineEventType =
  | "job" | "promotion" | "cert" | "project" | "skill" | "milestone" | "speaking" | "side-hustle" | "other";
export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  icon?: string;
  refId?: string;
}
export interface WeekSatisfaction { date: string; score: number; }
export interface BurnoutCheck {
  date: string;
  workload: number; control: number; rewards: number; community: number; fairness: number; values: number;
  score: number;
}
export interface SabbaticalPlan {
  id: string;
  targetDate?: string;
  savingsTarget?: number;
  savingsCurrent?: number;
  durationWeeks?: number;
  notes?: string;
}
export interface RetirementPlan {
  currentSavings?: number;
  targetAnnual?: number;
  targetAge?: number;
  projectedAge?: number;
  notes?: string;
}
export interface SideHustle {
  id: string;
  name: string;
  hoursPerWeek: number;
  monthlyIncome: number;
  tasks?: string[];
  notes?: string;
}
export interface IPItem {
  id: string;
  type: "patent" | "copyright" | "trademark" | "idea";
  title: string;
  date?: string;
  notes?: string;
}
export interface SpeakingEngagement {
  id: string;
  title: string;
  event: string;
  date: string;
  notes?: string;
}
export interface VisionBoardItem {
  id: string;
  type: "quote" | "image" | "goal";
  content: string;
  imageUrl?: string;
}

// ---------------- Root career state ----------------
export interface CareerState {
  roadmaps: CareerRoadmap[];
  skills: CareerSkill[];
  courses: CareerCourse[];
  contacts: NetworkContact[];
  applications: JobApplication[];
  companies: CompanyDossier[];
  questions: AppQuestion[];
  achievements: Achievement[];
  projects: PortfolioProject[];
  resumes: ResumeVersion[];
  bullets: ResumeBullet[];
  testimonials: Testimonial[];
  days: WorkDayEntry[];
  meetings: MeetingEntry[];
  timeline: TimelineEvent[];
  satisfaction: WeekSatisfaction[];
  burnoutChecks: BurnoutCheck[];
  sabbaticals: SabbaticalPlan[];
  retirement?: RetirementPlan;
  sideHustles: SideHustle[];
  ip: IPItem[];
  speaking: SpeakingEngagement[];
  visionBoard: VisionBoardItem[];

  // Legacy (kept for backwards compat with old components)
  tracks: LegacyTrack[];
  goals: LegacyGoal[];
  notes: LegacyNote[];
  linkedin?: string;
}

// Legacy types retained so old components (Roadmap/Notes/Posts/Goals/AchievementVault/TrackTabs) keep compiling.
export interface LegacySubConcept { id: string; title: string; done: boolean; }
export interface LegacyConcept    { id: string; title: string; subConcepts: LegacySubConcept[]; }
export interface LegacyNote       { id: string; title: string; content: string; updatedAt: number; trackId?: string; }
export interface LegacyBullet     { id: string; text: string; }
export interface LegacyTrack {
  id: string;
  name: string;
  color: string;
  concepts: LegacyConcept[];
  notes: LegacyNote[];
  resumeBullets: LegacyBullet[];
}
export interface LegacyGoal {
  id: string;
  title: string;
  description?: string;
  trackId?: string;
  done: boolean;
  deadline?: string;
}
