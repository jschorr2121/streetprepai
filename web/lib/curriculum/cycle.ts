// Recruiting-cycle widget logic — maps a user's current semester to where they
// are in the IB cycle and what to focus on. Pure; the dashboard passes in the
// profile's currentSemester string. The three "entry paths" from
// context/curriculum.md §5 (foundation / accelerated / interview) are derived
// from how close applications are.

export type EntryPath = "foundation" | "accelerated" | "interview";

export type CycleGuidance = {
  headline: string;
  detail: string;
  path: EntryPath;
  focus: string[];
};

// Ordered so we can reason about "how far into undergrad" a student is.
const SEMESTER_ORDER = [
  "Freshman Fall",
  "Freshman Spring",
  "Sophomore Fall",
  "Sophomore Spring",
  "Junior Fall",
  "Junior Spring",
  "Senior Fall",
  "Senior Spring",
] as const;

export function cycleGuidance(currentSemester: string | undefined): CycleGuidance {
  const idx = currentSemester ? SEMESTER_ORDER.indexOf(currentSemester as (typeof SEMESTER_ORDER)[number]) : -1;

  // Sophomore spring / junior fall is the heart of the accelerated BB cycle.
  if (currentSemester === "Sophomore Spring" || currentSemester === "Junior Fall") {
    return {
      headline: `${currentSemester} — you're in the thick of it`,
      detail:
        "Bulge-bracket applications for your summer open and close fast in this window. Prioritize technicals and get reps in mocks now.",
      path: "accelerated",
      focus: ["Behavioral story", "Accounting → DCF core", "Mock interviews"],
    };
  }

  if (currentSemester === "Junior Spring" || currentSemester === "Senior Fall") {
    return {
      headline: `${currentSemester} — interview & convert`,
      detail:
        "You're at or past applications. Keep technicals sharp, run mocks daily, and lean on the pre-interview checklist before every round.",
      path: "interview",
      focus: ["Daily drills on weak areas", "Mock interviews", "Firm-specific prep"],
    };
  }

  if (currentSemester === "Sophomore Fall") {
    return {
      headline: "Sophomore Fall — build the base",
      detail:
        "BB applications open a few months out. Start networking now and lay down the technical foundations so you're ready when the cycle hits.",
      path: "foundation",
      focus: ["Networking", "Accounting foundations", "Resume"],
    };
  }

  if (idx >= 0 && idx <= 1) {
    return {
      headline: `${currentSemester} — explore & get ahead`,
      detail:
        "You've got runway. Explore the industry, start building relationships, and get comfortable with the recruiting timeline.",
      path: "foundation",
      focus: ["Recruiting cycle", "Networking basics", "Resume"],
    };
  }

  // Senior spring or unknown.
  return {
    headline: currentSemester ? `${currentSemester}` : "Set your semester",
    detail: currentSemester
      ? "Focus on converting any remaining processes and keeping your technicals interview-ready."
      : "Add your current semester in your profile to personalize your recruiting timeline.",
    path: "interview",
    focus: ["Mock interviews", "Weak-area drills"],
  };
}
