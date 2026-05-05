import type { Profile } from "@/lib/types";

export function fakeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    fullName: "Jane Test",
    school: "Wharton",
    graduationYear: 2027,
    targetRoles: ["IB SA"],
    targetFirms: ["Goldman Sachs", "Evercore"],
    bioSummary: "Junior at Wharton targeting IB SA roles.",
    resumeRawText: "Wharton 2027. GS TMT off-cycle 2025. M&I 400.",
    experiences: [],
    education: [],
    skills: ["Excel", "PowerPoint"],
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}
