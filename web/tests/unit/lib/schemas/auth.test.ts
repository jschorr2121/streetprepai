/**
 * Unit coverage for the Unit 4 auth + onboarding Zod schemas. These guard the
 * edge cases called out in the spec: bad email, weak password, out-of-range grad
 * year, invalid semester, and empty target firms.
 */
import { describe, expect, it } from "vitest";

import { GRAD_YEAR_RANGE, onboardingSchema, signInSchema, signUpSchema } from "@/lib/schemas/auth";

describe("signUpSchema", () => {
  it("accepts a valid email + 8-char password", () => {
    const result = signUpSchema.safeParse({ email: "a@b.com", password: "password1" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ email: "not-an-email", password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  const valid = {
    school: "State U",
    graduationYear: GRAD_YEAR_RANGE.min + 2,
    currentSemester: "Sophomore Fall",
    targetFirms: ["Evercore"],
    advancedTrack: false,
  };

  it("rejects a submission missing advancedTrack", () => {
    const withoutTrack: Partial<typeof valid> = { ...valid };
    delete withoutTrack.advancedTrack;
    expect(onboardingSchema.safeParse(withoutTrack).success).toBe(false);
  });

  it("accepts a valid submission", () => {
    expect(onboardingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty school", () => {
    expect(onboardingSchema.safeParse({ ...valid, school: "  " }).success).toBe(false);
  });

  it("rejects a graduation year below the allowed range", () => {
    expect(
      onboardingSchema.safeParse({ ...valid, graduationYear: GRAD_YEAR_RANGE.min - 1 }).success,
    ).toBe(false);
  });

  it("rejects a graduation year above the allowed range", () => {
    expect(
      onboardingSchema.safeParse({ ...valid, graduationYear: GRAD_YEAR_RANGE.max + 1 }).success,
    ).toBe(false);
  });

  it("rejects an invalid semester", () => {
    expect(onboardingSchema.safeParse({ ...valid, currentSemester: "Gap Year" }).success).toBe(
      false,
    );
  });

  it("rejects zero target firms", () => {
    expect(onboardingSchema.safeParse({ ...valid, targetFirms: [] }).success).toBe(false);
  });
});
