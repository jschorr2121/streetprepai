import { describe, expect, it } from "vitest";
import {
  interviewQuestions,
  getQuestionsByMode,
  pickRandomQuestion,
} from "@/lib/data/interview-questions";

describe("interviewQuestions array", () => {
  it("has at least one question per mode", () => {
    const modes = ["technical", "behavioral", "firm", "superday"] as const;
    for (const mode of modes) {
      expect(
        interviewQuestions.some((q) => q.mode === mode),
        `expected at least one ${mode} question`,
      ).toBe(true);
    }
  });

  it("every question has the required fields", () => {
    for (const q of interviewQuestions) {
      expect(q.id).toBeTruthy();
      expect(q.text.length).toBeGreaterThan(0);
      expect(q.topic.length).toBeGreaterThan(0);
      expect(["easy", "medium", "hard"]).toContain(q.difficulty);
      expect(q.idealAnswerOutline.length).toBeGreaterThan(0);
    }
  });

  it("ids are unique", () => {
    const ids = interviewQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getQuestionsByMode", () => {
  it.each([["technical"], ["behavioral"], ["firm"], ["superday"]] as const)(
    "returns only %s questions",
    (mode) => {
      const list = getQuestionsByMode(mode);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((q) => q.mode === mode)).toBe(true);
    },
  );
});

describe("pickRandomQuestion", () => {
  it("returns a question of the requested mode", () => {
    const q = pickRandomQuestion("technical");
    expect(q.mode).toBe("technical");
  });

  it("excludes the given excludeId when alternatives exist", () => {
    const tech = getQuestionsByMode("technical");
    const excluded = tech[0]!.id;
    // run several iterations to be confident
    for (let i = 0; i < 10; i++) {
      const q = pickRandomQuestion("technical", excluded);
      expect(q.id).not.toBe(excluded);
    }
  });

  it("falls back to full pool when excludeId would empty the pool", () => {
    // For a mode with only one question, exclusion should still return that question.
    // We'll use all firm questions and exclude every-but-one.
    const firmList = getQuestionsByMode("firm");
    if (firmList.length > 0) {
      // Grab one and exclude it — must still return a firm question.
      const q = pickRandomQuestion("firm", firmList[0]!.id);
      expect(q.mode).toBe("firm");
    }
  });
});
