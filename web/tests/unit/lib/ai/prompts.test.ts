import { describe, expect, it } from "vitest";
import * as Prompts from "@/lib/ai/prompts";

describe("prompts.ts exports", () => {
  it("every exported constant is a non-empty string with no leftover ${...} template expressions", () => {
    const entries = Object.entries(Prompts);
    expect(entries.length).toBeGreaterThan(0);
    for (const [name, value] of entries) {
      expect(typeof value, `${name} should be a string`).toBe("string");
      const v = value as string;
      expect(v.length, `${name} should be non-empty`).toBeGreaterThan(0);
      // No accidental unresolved template-expression leftovers like ${something}.
      // The prompts include literal `\`save_xxx\`` tool names and other backtick
      // segments — those are fine. We only flag `${...}` patterns.
      expect(v, `${name} contains a leftover \${...} template expression`).not.toMatch(
        /\$\{[^}]*\}/,
      );
    }
  });

  it("includes the SYSTEM_BASE persona in derived system prompts", () => {
    expect(Prompts.LENS_EXPLAIN_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.LENS_BEGINNER_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.CHAT_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.PREP_PERSON_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.PREP_FIRM_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.STRUCTURE_CHAT_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.DRAFT_FOLLOWUP_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.STORY_FRAMER_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.RESUME_CRITIQUE_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.INTERVIEW_SCORE_SYSTEM).toContain(Prompts.SYSTEM_BASE);
    expect(Prompts.OUTREACH_DRAFT_SYSTEM).toContain(Prompts.SYSTEM_BASE);
  });
});
