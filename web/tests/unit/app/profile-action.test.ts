/**
 * Unit coverage for `saveProfileAction` and `saveProfileSchema` (Unit 6).
 *
 * Tests:
 *  1. Schema parses valid input correctly.
 *  2. Schema rejects invalid input with fieldErrors.
 *  3. Action returns UNAUTHORIZED when called without a session.
 *  4. Action returns RATE_LIMITED when the limiter denies.
 */

import { describe, expect, it, vi } from "vitest";

// Sentry's module-load side effect (network call) must be neutralised before
// any import that transitively touches @sentry/nextjs.
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

// Hoist mocks that are referenced inside vi.mock() factories.
const { withUserMock, updateProfileMock } = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  updateProfileMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/db/queries/profile", () => ({
  updateProfile: updateProfileMock,
}));

// ─── Auth mock ───────────────────────────────────────────────────────────────
// Default: requireUser() throws → UNAUTHORIZED. Override per-test if needed.
vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: vi.fn(async () => {
      throw new actual.UnauthorizedError();
    }),
  };
});

// ─── Rate-limit mock ─────────────────────────────────────────────────────────
const rateLimitAllowed = vi.fn(async () => ({ allowed: true as const }));
vi.mock("@/lib/ratelimit/limiters", () => ({
  profileMutationLimiter: (...args: unknown[]) => rateLimitAllowed(...args),
}));

// ─── Logger mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/logging/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { UnauthorizedError } from "@/lib/auth/server";
import { saveProfileAction, saveProfileSchema } from "@/app/(app)/profile/actions";

// ─── 1. Schema — valid input ─────────────────────────────────────────────────
describe("saveProfileSchema", () => {
  it("parses a fully populated valid input", () => {
    const input = {
      fullName: "Jane Banker",
      school: "Wharton",
      graduationYear: 2027,
      targetRoles: ["Summer Analyst"],
      targetFirms: ["Goldman Sachs", "Evercore"],
      bioSummary: "Aspiring IB analyst",
      skills: ["Excel", "PowerPoint"],
      experiences: [
        {
          company: "McKinsey",
          role: "Summer Intern",
          bullets: ["Led analysis of $50M cost reduction initiative"],
        },
      ],
      education: [
        {
          school: "Wharton",
          degree: "BSc",
          field: "Finance",
          graduationYear: 2027,
          gpa: 3.9,
        },
      ],
    };

    const result = saveProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Jane Banker");
      expect(result.data.targetFirms).toEqual(["Goldman Sachs", "Evercore"]);
    }
  });

  it("accepts a partial input (all fields optional)", () => {
    const result = saveProfileSchema.safeParse({ fullName: "Jane" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all fields optional)", () => {
    const result = saveProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  // ─── Invalid cases ───────────────────────────────────────────────────────
  it("rejects graduationYear outside valid range", () => {
    const result = saveProfileSchema.safeParse({ graduationYear: 1800 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldPaths = result.error.issues.map((i) => i.path[0]);
      expect(fieldPaths).toContain("graduationYear");
    }
  });

  it("rejects a fullName that exceeds 200 chars", () => {
    const result = saveProfileSchema.safeParse({ fullName: "A".repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe("fullName");
    }
  });

  it("rejects unknown fields (strict schema)", () => {
    const result = saveProfileSchema.safeParse({ unknownField: "boom" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed experience (missing required company/role)", () => {
    const result = saveProfileSchema.safeParse({
      experiences: [{ company: "GS", bullets: "should-be-array" }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── 2. Action — UNAUTHORIZED ─────────────────────────────────────────────────
describe("saveProfileAction — auth gate", () => {
  it("returns UNAUTHORIZED when called without a session", async () => {
    const result = await saveProfileAction({ fullName: "Jane" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("UNAUTHORIZED error carries the UnauthorizedError code", () => {
    expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
  });
});

// ─── 3. Action — RATE_LIMITED ─────────────────────────────────────────────────
describe("saveProfileAction — rate limit", () => {
  it("returns RATE_LIMITED when the limiter denies the request", async () => {
    // Override requireUser for this suite: return a valid user.
    const { requireUser } = await import("@/lib/auth/server");
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    } as Awaited<ReturnType<typeof requireUser>>);

    // Override rate-limit mock: deny.
    rateLimitAllowed.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 30 });

    const result = await saveProfileAction({ fullName: "Jane" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RATE_LIMITED");
    }
    expect(withUserMock).not.toHaveBeenCalled();
  });
});
