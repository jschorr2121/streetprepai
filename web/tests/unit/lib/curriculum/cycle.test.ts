import { describe, expect, it } from "vitest";

import { cycleGuidance } from "@/lib/curriculum/cycle";

describe("cycleGuidance", () => {
  it.each(["Sophomore Spring", "Junior Fall"] as const)(
    "%s falls in the accelerated BB cycle window",
    (semester) => {
      const g = cycleGuidance(semester);
      expect(g.path).toBe("accelerated");
      expect(g.headline).toBe(`${semester} — you're in the thick of it`);
      expect(g.focus).toEqual(["Behavioral story", "Accounting → DCF core", "Mock interviews"]);
    },
  );

  it.each(["Junior Spring", "Senior Fall"] as const)(
    "%s is in interview & convert mode",
    (semester) => {
      const g = cycleGuidance(semester);
      expect(g.path).toBe("interview");
      expect(g.headline).toBe(`${semester} — interview & convert`);
      expect(g.focus).toEqual([
        "Daily drills on weak areas",
        "Mock interviews",
        "Firm-specific prep",
      ]);
    },
  );

  it("Sophomore Fall gets the 'build the base' foundation guidance", () => {
    const g = cycleGuidance("Sophomore Fall");
    expect(g.path).toBe("foundation");
    expect(g.headline).toBe("Sophomore Fall — build the base");
    expect(g.focus).toEqual(["Networking", "Accounting foundations", "Resume"]);
  });

  it.each(["Freshman Fall", "Freshman Spring"] as const)(
    "%s (idx 0-1) gets 'explore & get ahead' foundation guidance",
    (semester) => {
      const g = cycleGuidance(semester);
      expect(g.path).toBe("foundation");
      expect(g.headline).toBe(`${semester} — explore & get ahead`);
      expect(g.focus).toEqual(["Recruiting cycle", "Networking basics", "Resume"]);
    },
  );

  it("Senior Spring (last known semester, none of the special-cased branches) falls to the default interview branch", () => {
    const g = cycleGuidance("Senior Spring");
    expect(g.path).toBe("interview");
    expect(g.headline).toBe("Senior Spring");
    expect(g.detail).toBe(
      "Focus on converting any remaining processes and keeping your technicals interview-ready.",
    );
    expect(g.focus).toEqual(["Mock interviews", "Weak-area drills"]);
  });

  it("an unrecognized semester string falls to the default branch, keyed off its own truthiness", () => {
    const g = cycleGuidance("Gap Year");
    expect(g.path).toBe("interview");
    expect(g.headline).toBe("Gap Year");
    expect(g.detail).toBe(
      "Focus on converting any remaining processes and keeping your technicals interview-ready.",
    );
  });

  it("undefined semester prompts the user to set one", () => {
    const g = cycleGuidance(undefined);
    expect(g.path).toBe("interview");
    expect(g.headline).toBe("Set your semester");
    expect(g.detail).toBe(
      "Add your current semester in your profile to personalize your recruiting timeline.",
    );
    expect(g.focus).toEqual(["Mock interviews", "Weak-area drills"]);
  });

  it("empty-string semester is falsy, same branch as undefined but with idx -1 too", () => {
    const g = cycleGuidance("");
    expect(g.headline).toBe("Set your semester");
  });
});
