/**
 * Unit coverage for Application Tracker Server Actions (Unit 7).
 *
 * Tests:
 *  1. createApplicationSchema rejects invalid input (URL, missing firm, etc.).
 *  2. createApplicationAction returns UNAUTHORIZED without a session.
 *  3. createApplicationAction returns RATE_LIMITED when the limiter denies.
 *  4. updateApplicationAction returns NOT_FOUND when the row doesn't exist.
 *  5. deleteApplicationAction returns NOT_FOUND when the row doesn't exist.
 *
 * Pattern mirrors tests/unit/app/profile-action.test.ts (Unit 6 canonical).
 */

import { describe, expect, it, vi } from "vitest";

// Sentry must be neutralised before any import that transitively loads it.
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

// Hoist mocks referenced inside vi.mock() factories.
const { withUserMock, createAppMock, getAppByIdMock, updateAppMock, deleteAppMock } = vi.hoisted(
  () => ({
    withUserMock: vi.fn(),
    createAppMock: vi.fn(),
    getAppByIdMock: vi.fn(),
    updateAppMock: vi.fn(),
    deleteAppMock: vi.fn(),
  }),
);

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/db/queries/applications", () => ({
  createApplication: createAppMock,
  getApplicationById: getAppByIdMock,
  updateApplication: updateAppMock,
  deleteApplication: deleteAppMock,
}));

// Auth mock — default: throws UnauthorizedError.
vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: vi.fn(async () => {
      throw new actual.UnauthorizedError();
    }),
  };
});

// Rate-limit mock — default: allow all.
const rateLimitAllowed = vi.fn(async () => ({ allowed: true as const }));
vi.mock("@/lib/ratelimit/limiters", () => ({
  applicationsLimiter: (...args: unknown[]) => rateLimitAllowed(...args),
}));

// Logger mock.
vi.mock("@/lib/logging/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  createApplicationAction,
  createApplicationSchema,
  updateApplicationAction,
  deleteApplicationAction,
} from "@/app/(app)/tools/applications/actions";
import { UnauthorizedError } from "@/lib/auth/server";

// ─── 1. createApplicationSchema ───────────────────────────────────────────────

describe("createApplicationSchema", () => {
  it("accepts a valid minimal input", () => {
    const result = createApplicationSchema.safeParse({
      firm: "GS",
      role: "Analyst",
      stage: "applied",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a fully populated valid input", () => {
    const result = createApplicationSchema.safeParse({
      firm: "Goldman Sachs",
      role: "Summer Analyst",
      group: "M&A",
      stage: "interview",
      url: "https://careers.gs.com/job/1234",
      deadline: "2026-09-01",
      notes: "Referred by Jane.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing firm", () => {
    const result = createApplicationSchema.safeParse({ role: "Analyst", stage: "applied" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("firm");
    }
  });

  it("rejects a missing role", () => {
    const result = createApplicationSchema.safeParse({ firm: "GS", stage: "applied" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid URL", () => {
    const result = createApplicationSchema.safeParse({
      firm: "GS",
      role: "Analyst",
      stage: "applied",
      url: "not-a-valid-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("url");
    }
  });

  it("rejects an invalid stage enum value", () => {
    const result = createApplicationSchema.safeParse({
      firm: "GS",
      role: "Analyst",
      stage: "bookmarked", // old legacy value
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes exceeding 5000 characters", () => {
    const result = createApplicationSchema.safeParse({
      firm: "GS",
      role: "Analyst",
      stage: "applied",
      notes: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("notes");
    }
  });

  it("accepts notes of exactly 5000 characters", () => {
    const result = createApplicationSchema.safeParse({
      firm: "GS",
      role: "Analyst",
      stage: "applied",
      notes: "x".repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty string URL (treated as no URL)", () => {
    // An empty string passes the schema (it's not `.url()` for empty strings)
    // because of `.or(z.literal(""))` in the schema.
    const result = createApplicationSchema.safeParse({
      firm: "GS",
      role: "Analyst",
      stage: "applied",
      url: "",
    });
    expect(result.success).toBe(true);
  });
});

// ─── 2. createApplicationAction — UNAUTHORIZED ────────────────────────────────

describe("createApplicationAction — auth gate", () => {
  it("returns UNAUTHORIZED when called without a session", async () => {
    const result = await createApplicationAction({ firm: "GS", role: "Analyst", stage: "applied" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("UnauthorizedError carries the correct code", () => {
    expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
  });
});

// ─── 3. createApplicationAction — RATE_LIMITED ───────────────────────────────

describe("createApplicationAction — rate limit", () => {
  it("returns RATE_LIMITED when the limiter denies", async () => {
    const { requireUser } = await import("@/lib/auth/server");
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    } as Awaited<ReturnType<typeof requireUser>>);

    rateLimitAllowed.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 });

    const result = await createApplicationAction({ firm: "GS", role: "Analyst", stage: "applied" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RATE_LIMITED");
    }
    expect(withUserMock).not.toHaveBeenCalled();
  });
});

// ─── 4. updateApplicationAction — NOT_FOUND ──────────────────────────────────

describe("updateApplicationAction — ownership / NOT_FOUND", () => {
  it("returns NOT_FOUND when the application does not belong to the user", async () => {
    const { requireUser } = await import("@/lib/auth/server");
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    } as Awaited<ReturnType<typeof requireUser>>);

    // withUser used for the ownership check — simulate getApplicationById returning null.
    withUserMock.mockResolvedValueOnce(null);

    const result = await updateApplicationAction({
      id: "11111111-1111-4111-8111-111111111111",
      stage: "interview",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });
});

// ─── 5. deleteApplicationAction — NOT_FOUND ──────────────────────────────────

describe("deleteApplicationAction — ownership / NOT_FOUND", () => {
  it("returns NOT_FOUND when the application does not belong to the user", async () => {
    const { requireUser } = await import("@/lib/auth/server");
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    } as Awaited<ReturnType<typeof requireUser>>);

    withUserMock.mockResolvedValueOnce(null);

    const result = await deleteApplicationAction({
      id: "11111111-1111-4111-8111-111111111111",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });
});
