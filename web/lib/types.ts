export type GuideCategory =
  | "technicals"
  | "behavioral"
  | "firm-guides"
  | "networking"
  | "resume"
  | "modeling"
  | "superday"
  | "market-news"
  | "recruiting"
  | "sectors"
  | "interviewing";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Guide = {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  difficulty: Difficulty;
  readingMinutes: number;
  tags: string[];
  content: string;
};

export type Section = {
  id: string;
  heading: string;
  level: number;
  content: string;
};

export type ContactStage =
  | "cold"
  | "outreach-sent"
  | "coffee-chat"
  | "warm"
  | "interviewed"
  | "offer";

export type Contact = {
  id: string;
  name: string;
  firm: string;
  group?: string;
  title: string;
  school?: string;
  gradYear?: number;
  linkedinBio?: string;
  howMet?: string;
  stage: ContactStage;
  tags: string[];
  lastInteractionAt?: string;
  /**
   * ISO date of the last meaningful inbound/outbound contact (chat, email, intro).
   * Drives the "gentle nudges" widget on the relationships page.
   * TODO (needs Supabase + auth): derive from chats/outreach tables instead of seed data.
   */
  lastContactAt?: string;
};

export type ChatLog = {
  id: string;
  contactId: string;
  happenedAt: string;
  rawNotes: string;
  structured?: {
    topics: string[];
    adviceGiven: string[];
    commitments: string[];
    personalDetails: string[];
    followUps: { description: string; dueBy?: string }[];
  };
  followUpDraft?: { subject: string; body: string };
};

export type CalendarEvent = {
  id: string;
  contactId?: string;
  kind: "coffee-chat" | "interview" | "other";
  title: string;
  startsAt: string;
  durationMinutes: number;
  location?: string;
  notes?: string;
  status: "upcoming" | "completed" | "cancelled";
  chatLogId?: string;
};

export type Firm = {
  slug: string;
  name: string;
  tier: "bulge-bracket" | "elite-boutique" | "middle-market" | "other";
  hq: string;
  description: string;
  latestEarningsRaw?: string;
};

export type Job = {
  id: string;
  firm: string;
  role: string;
  group?: string;
  location: string;
  yearTarget: string;
  deadline?: string;
  url: string;
  tags: string[];
};

export type StoryFraming = {
  angle:
    | "leadership"
    | "teamwork"
    | "conflict"
    | "failure"
    | "analytical"
    | "resume-bullet"
    | "why-banking";
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  oneLiner: string;
  confidence: number;
};

export type Story = {
  id: string;
  title: string;
  rawExperience: string;
  framings: StoryFraming[];
};

export type AppliedJobStage =
  | "shortlist"
  | "applied"
  | "interview"
  | "superday"
  | "offer"
  | "rejected";

export type AppliedJob = {
  id: string;
  firm: string;
  role: string;
  group?: string;
  deadline?: string;
  url?: string;
  stage: AppliedJobStage;
  notes?: string;
  addedAt: string;
  updatedAt?: string;
};

export type Profile = {
  userId: string;
  fullName?: string;
  school?: string;
  graduationYear?: number;
  currentSemester?: string;
  targetRoles: string[];
  targetFirms: string[];
  bioSummary?: string;
  resumeRawText?: string;
  experiences: unknown[];
  education: unknown[];
  skills: string[];
  advancedTrack?: boolean;
  onboardedAt?: string;
  updatedAt?: string;
};

// ─── Question bank + curriculum progress ─────────────────────────────────────

export type QbankDifficulty = "easy" | "medium" | "hard";

export type QbankQuestionType =
  | "conceptual"
  | "single-step"
  | "multi-step"
  | "calculation"
  | "verbal"
  | "curveball";

export type RubricKeyPoint = { point: string; weight: number };

export type QbankQuestion = {
  id: string;
  topic: string;
  difficulty: QbankDifficulty;
  questionType: QbankQuestionType;
  prompt: string;
  keyPoints: RubricKeyPoint[];
  misconceptions: string[];
  modelAnswer: string;
  chapterSlug?: string;
  sectionSlug?: string;
  advanced: boolean;
};

export type QbankFollowup = {
  id: string;
  questionId: string;
  ordinal: number;
  prompt: string;
  modelAnswer: string;
};

/** The published rubric result — every dimension shown to the user. */
export type GradedAnswer = {
  score: number; // 0–100
  correct: boolean;
  keyPointResults: { point: string; hit: boolean; comment: string }[];
  misconceptionsTriggered: string[];
  depthComment: string;
  overallFeedback: string;
  modelAnswer: string;
};

export type SectionProgressEntry = {
  chapterSlug: string;
  sectionSlug: string;
  readAt?: string;
  drillScore?: number;
  drillCompletedAt?: string;
};

export type ChapterProgressEntry = {
  chapterSlug: string;
  gateScore?: number;
  gatePassedAt?: string;
  completedAt?: string;
};

export type TopicMasteryEntry = {
  topic: string;
  score: number; // 0–1
  attempts: number;
};

export type GuideProgressEntry = {
  id: string;
  guideSlug: string;
  readAt: string;
  completed: boolean;
};

export type MockInterview = {
  id: string;
  questionText: string;
  mode: string;
  transcript?: string;
  scorecard?: unknown;
  audioMetrics?: unknown;
  durationSeconds?: number;
  createdAt: string;
};
