// The curriculum manifest — the single source of truth for the learning-flow
// spine. Chapters and sections are static, versioned content (per
// context/curriculum.md); section prose lives as flat MDX in content/guides/
// referenced by slug. User state (progress, gates, mastery) lives in Postgres.
// Pure data — safe to import from Server and Client Components.

export type CurriculumTopic =
  | "recruiting"
  | "networking"
  | "resume"
  | "behavioral"
  | "accounting"
  | "ev-equity-value"
  | "valuation"
  | "dcf"
  | "ma"
  | "lbo"
  | "mental-math"
  | "interviewing";

export type SectionDef = {
  /** Guide slug — the MDX file in content/guides/<slug>.md */
  slug: string;
  title: string;
  /** ⭐ elective/advanced — excluded from the chapter gate; shown to advanced-track users */
  advanced?: boolean;
};

export type ChapterDef = {
  slug: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  /** spine = ordered, part of the flow; reference = browsable anytime, no gate */
  kind: "spine" | "reference";
  /** Mastery-model bucket; also the default qbank topic for this chapter's drills */
  topic: CurriculumTopic;
  /** Hard gate: chapter counts as complete only after passing the gate quiz (~85%).
   *  All content stays browsable regardless — gates control progression, not access. */
  gated: boolean;
  /** Sidebar tool taught in context, if any — rendered as a tool-exercise CTA */
  toolExercise?: { label: string; href: string };
  sections: SectionDef[];
};

export const GATE_PASS_THRESHOLD = 0.85;

export const chapters: ChapterDef[] = [
  {
    slug: "recruiting-cycle",
    number: 1,
    title: "Recruiting Cycle & Timeline",
    shortTitle: "Recruiting Cycle",
    description:
      "How IB recruiting actually works, what happens each semester, and how to build your personal plan.",
    kind: "spine",
    topic: "recruiting",
    gated: false,
    sections: [
      { slug: "how-recruiting-works", title: "How recruiting actually works" },
      { slug: "recruiting-calendar-by-class-year", title: "The calendar by class year" },
      { slug: "firm-tiers-bb-eb-mm", title: "Firm tiers: BB vs EB vs MM" },
      { slug: "group-types-explained", title: "Group types explained" },
      { slug: "build-your-recruiting-plan", title: "Build your recruiting plan" },
    ],
  },
  {
    slug: "applications",
    number: 2,
    title: "How to Apply",
    shortTitle: "Applications",
    description:
      "Application mechanics, target lists, cover letters, HireVue screens, and recovery paths.",
    kind: "spine",
    topic: "recruiting",
    gated: false,
    toolExercise: { label: "Start your target list in the Application Tracker", href: "/tools/applications" },
    sections: [
      { slug: "application-mechanics", title: "Application mechanics" },
      { slug: "building-your-target-list", title: "Building your target list" },
      { slug: "cover-letters", title: "Cover letters" },
      { slug: "hirevue-and-online-assessments", title: "HireVue & online assessments" },
      { slug: "off-cycle-and-recovery-paths", title: "Off-cycle & recovery paths" },
    ],
  },
  {
    slug: "firms",
    number: 3,
    title: "Firm Overviews",
    shortTitle: "Firms",
    description:
      "Reference chapter — research any firm just-in-time before networking calls and interviews.",
    kind: "reference",
    topic: "recruiting",
    gated: false,
    sections: [
      { slug: "how-to-research-a-firm", title: "How to research a firm" },
      { slug: "reading-league-tables", title: "Reading league tables" },
      { slug: "goldman-sachs-guide", title: "Goldman Sachs" },
      { slug: "jpmorgan-guide", title: "J.P. Morgan" },
      { slug: "morgan-stanley-guide", title: "Morgan Stanley" },
      { slug: "evercore-guide", title: "Evercore" },
      { slug: "lazard-guide", title: "Lazard" },
      { slug: "centerview-guide", title: "Centerview" },
    ],
  },
  {
    slug: "sectors",
    number: 4,
    title: "Sector Deep-Dives",
    shortTitle: "Sectors",
    description:
      "Reference chapter — coverage areas, key multiples, and terminology by industry group.",
    kind: "reference",
    topic: "recruiting",
    gated: false,
    sections: [
      { slug: "how-sector-choice-affects-recruiting", title: "How sector choice affects recruiting" },
      { slug: "sector-overview-tmt", title: "TMT" },
      { slug: "sector-overview-healthcare", title: "Healthcare" },
      { slug: "sector-overview-fig", title: "FIG" },
      { slug: "sector-overview-energy", title: "Energy" },
      { slug: "sector-overview-consumer-retail", title: "Consumer & Retail" },
      { slug: "sector-overview-industrials", title: "Industrials" },
      { slug: "sector-overview-real-estate", title: "Real Estate" },
      { slug: "sector-overview-financial-sponsors", title: "Financial Sponsors" },
    ],
  },
  {
    slug: "resume",
    number: 5,
    title: "Resume & Cover Letter",
    shortTitle: "Resume",
    description:
      "One-page conventions, banker bullets, deal sheets, and the red flags that get resumes cut.",
    kind: "spine",
    topic: "resume",
    gated: false,
    toolExercise: { label: "Run your resume through Resume Coach", href: "/tools/resume-coach" },
    sections: [
      { slug: "one-page-resume-conventions", title: "One-page conventions & formatting" },
      { slug: "banker-bullet-structure", title: "Banker bullet structure" },
      { slug: "deal-sheet-for-returning-interns", title: "Deal sheets for returning interns" },
      { slug: "resume-red-flags", title: "Red flags & fixes" },
    ],
  },
  {
    slug: "networking",
    number: 6,
    title: "Networking Mastery",
    shortTitle: "Networking",
    description:
      "Finding bankers, cold outreach, coffee chats, and converting conversations into referrals.",
    kind: "spine",
    topic: "networking",
    gated: false,
    toolExercise: { label: "Add your first contacts in Relationship Manager", href: "/tools/relationships" },
    sections: [
      { slug: "alumni-networking", title: "Who to reach & how to find them" },
      { slug: "cold-outreach-email-template", title: "Cold email anatomy" },
      { slug: "coffee-chat-framework", title: "The coffee chat" },
      { slug: "follow-up-and-referrals", title: "Follow-up cadence & referrals" },
    ],
  },
  {
    slug: "behavioral",
    number: 7,
    title: "Behavioral & Fit",
    shortTitle: "Behavioral",
    description:
      "Your story, your story bank, and fluent answers to every fit question — trained for adaptation, not memorization.",
    kind: "spine",
    topic: "behavioral",
    gated: false,
    toolExercise: { label: "Build your story bank in Story Framer", href: "/tools/story-framer" },
    sections: [
      { slug: "walk-me-through-your-resume", title: "Walk me through your resume" },
      { slug: "tell-me-about-yourself", title: "Tell me about yourself" },
      { slug: "why-investment-banking", title: "Why investment banking" },
      { slug: "why-our-firm", title: "Why our firm" },
      { slug: "star-framework", title: "The story bank (STAR)" },
      { slug: "strengths-and-weaknesses", title: "Strengths & weaknesses" },
      { slug: "objection-handling-by-background", title: "Objection handling by background" },
      { slug: "tell-me-about-a-deal", title: "Discussing deals" },
      { slug: "how-to-follow-the-market", title: "Following the market" },
      { slug: "discussing-your-own-experience", title: "Discussing your own experience" },
    ],
  },
  {
    slug: "accounting",
    number: 8,
    title: "Accounting & the 3 Statements",
    shortTitle: "Accounting",
    description:
      "The foundation of every technical interview — the three statements, how they link, and statement-change drills.",
    kind: "spine",
    topic: "accounting",
    gated: true,
    sections: [
      { slug: "income-statement-anatomy", title: "The income statement" },
      { slug: "balance-sheet-anatomy", title: "The balance sheet" },
      { slug: "cash-flow-statement-anatomy", title: "The cash flow statement" },
      { slug: "accounting-linkages", title: "Linking the three statements" },
      { slug: "working-capital-and-operational-items", title: "Working capital & operational items" },
      { slug: "three-statement-walkthrough", title: "The three-statement walkthrough" },
      { slug: "single-step-changes", title: "Single-step changes" },
      { slug: "multi-step-scenarios", title: "Multi-step scenarios" },
      { slug: "advanced-accounting", title: "Advanced accounting", advanced: true },
    ],
  },
  {
    slug: "ev-equity-value",
    number: 9,
    title: "Enterprise Value vs Equity Value",
    shortTitle: "EV vs Equity Value",
    description:
      "What each measures, diluted share counts, the bridge, and the pairing rule behind every multiple.",
    kind: "spine",
    topic: "ev-equity-value",
    gated: true,
    sections: [
      { slug: "enterprise-value-vs-equity-value", title: "What each value measures" },
      { slug: "diluted-share-count", title: "Diluted share count" },
      { slug: "the-ev-bridge", title: "The EV bridge" },
      { slug: "event-impacts-on-ev", title: "Event impacts on EV & equity value" },
      { slug: "pairing-metrics-with-values", title: "Pairing metrics with values" },
      { slug: "ev-edge-cases", title: "Edge cases", advanced: true },
    ],
  },
  {
    slug: "valuation",
    number: 10,
    title: "Valuation: Comps & Precedent Transactions",
    shortTitle: "Valuation",
    description:
      "Relative valuation end to end — multiples, comp sets, precedents, and interpreting the football field.",
    kind: "spine",
    topic: "valuation",
    gated: true,
    sections: [
      { slug: "valuation-methodologies-overview", title: "The big picture" },
      { slug: "metrics-and-multiples", title: "Metrics & multiples" },
      { slug: "trading-comps", title: "Trading comps" },
      { slug: "precedent-transactions", title: "Precedent transactions" },
      { slug: "football-field-and-interpretation", title: "The football field" },
      { slug: "other-methodologies-and-sector-multiples", title: "Other methodologies & sector multiples", advanced: true },
    ],
  },
  {
    slug: "dcf",
    number: 11,
    title: "DCF Analysis",
    shortTitle: "DCF",
    description:
      "The single most-tested topic — unlevered FCF, WACC, terminal value, and what moves the answer.",
    kind: "spine",
    topic: "dcf",
    gated: true,
    sections: [
      { slug: "walk-me-through-a-dcf", title: "Walk me through a DCF" },
      { slug: "unlevered-free-cash-flow", title: "Unlevered free cash flow" },
      { slug: "cost-of-capital-and-wacc", title: "WACC & cost of equity" },
      { slug: "terminal-value", title: "Terminal value" },
      { slug: "what-moves-a-dcf", title: "What moves a DCF" },
      { slug: "advanced-dcf", title: "Advanced DCF", advanced: true },
    ],
  },
  {
    slug: "ma",
    number: 12,
    title: "M&A & Merger Models",
    shortTitle: "M&A",
    description:
      "Deal rationale, accretion/dilution mechanics, purchase accounting, and the full merger model.",
    kind: "spine",
    topic: "ma",
    gated: true,
    sections: [
      { slug: "why-companies-buy", title: "Why companies buy" },
      { slug: "m-and-a-accretion-dilution", title: "Accretion / dilution mechanics" },
      { slug: "purchase-price-and-consideration", title: "Purchase price & consideration" },
      { slug: "goodwill-and-purchase-price-allocation", title: "Goodwill & purchase price allocation" },
      { slug: "full-merger-model", title: "The full merger model" },
      { slug: "advanced-ma", title: "Advanced M&A", advanced: true },
    ],
  },
  {
    slug: "lbo",
    number: 13,
    title: "LBO Models",
    shortTitle: "LBO",
    description:
      "Why leverage works, sources & uses, the debt schedule, returns, and paper-LBO mental math.",
    kind: "spine",
    topic: "lbo",
    gated: true,
    sections: [
      { slug: "lbo-basics", title: "Why leverage amplifies returns" },
      { slug: "what-makes-a-good-lbo-candidate", title: "What makes a good LBO candidate" },
      { slug: "sources-and-uses", title: "Sources & uses" },
      { slug: "debt-tranches-and-the-debt-schedule", title: "Debt tranches & the debt schedule" },
      { slug: "exit-and-returns", title: "Exit & returns" },
      { slug: "lbo-paper-math", title: "Paper LBO & IRR mental math" },
      { slug: "modeling-test-prep", title: "Modeling test prep", advanced: true },
      { slug: "advanced-lbo", title: "Advanced LBO features", advanced: true },
    ],
  },
  {
    slug: "mental-math",
    number: 14,
    title: "Mental Math & Pressure Drills",
    shortTitle: "Mental Math",
    description:
      "The arithmetic that transfers, thinking out loud under pressure, and market awareness quick-hits.",
    kind: "spine",
    topic: "mental-math",
    gated: false,
    sections: [
      { slug: "mental-math-that-transfers", title: "Mental math that transfers" },
      { slug: "thinking-out-loud-under-pressure", title: "Thinking out loud under pressure" },
      { slug: "market-awareness-quick-hits", title: "Market awareness quick-hits" },
      { slug: "classic-brain-teasers", title: "Classic brain teasers", advanced: true },
    ],
  },
  {
    slug: "mock-interviews",
    number: 15,
    title: "Mock Interviews & HireVue Practice",
    shortTitle: "Mocks",
    description:
      "Interview formats, what scorers reward, and full-fidelity practice in the Mock Interview Studio.",
    kind: "spine",
    topic: "interviewing",
    gated: false,
    toolExercise: { label: "Take a mock in the Interview Studio", href: "/tools/mock-interview" },
    sections: [
      { slug: "interview-formats-and-what-scorers-reward", title: "Formats & what scorers reward" },
      { slug: "hirevue-simulation-guide", title: "The HireVue simulation" },
      { slug: "first-round-strategy", title: "First-round strategy" },
    ],
  },
  {
    slug: "superday",
    number: 16,
    title: "Superday & Logistics",
    shortTitle: "Superday",
    description:
      "The full day, staying consistent across 5–10 interviews, the pre-interview checklist, and closing it out.",
    kind: "spine",
    topic: "interviewing",
    gated: false,
    sections: [
      { slug: "superday-day-of-logistics", title: "Day-of logistics" },
      { slug: "consistency-and-energy", title: "Consistency & energy" },
      { slug: "pre-interview-checklist", title: "The pre-interview checklist" },
      { slug: "thank-yous-and-offers", title: "Thank-yous, offers & rejections" },
    ],
  },
];

export function getChapter(slug: string): ChapterDef | null {
  return chapters.find((c) => c.slug === slug) ?? null;
}

export function getSection(
  chapterSlug: string,
  sectionSlug: string,
): { chapter: ChapterDef; section: SectionDef; index: number } | null {
  const chapter = getChapter(chapterSlug);
  if (!chapter) return null;
  const index = chapter.sections.findIndex((s) => s.slug === sectionSlug);
  const section = chapter.sections[index];
  if (!section) return null;
  return { chapter, section, index };
}

/** Spine chapters in order — the linear flow the dashboard recommends through. */
export function spineChapters(): ChapterDef[] {
  return chapters.filter((c) => c.kind === "spine");
}

/** Core (non-advanced) sections — the set that counts toward completion + gates. */
export function coreSections(chapter: ChapterDef): SectionDef[] {
  return chapter.sections.filter((s) => !s.advanced);
}
