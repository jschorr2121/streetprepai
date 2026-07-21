/**
 * Integration coverage for the Application Tracker Server Actions, run
 * against a real PGlite database (via tests/helpers/pglite-db.ts) rather than
 * mocking `lib/db/queries/applications` (see applications-action.test.ts for
 * the mocked wiring/auth/rate-limit tests).
 *
 * These three bugs are specifically about what the *real* `date` column and
 * the *real* update/delete queries do — a mock that hands back whatever the
 * test wants would defeat the point:
 *
 *  BUG 1 — blank Deadline ("" from <input type="date">) used to reach the
 *          Postgres `date` column verbatim and raise
 *          `invalid input syntax for type date: ""`, surfaced as a generic
 *          INTERNAL error. Fixed by normalising "" -> undefined/null before
 *          the column write.
 *  BUG 2 — update must support clear-vs-absent semantics: an explicit "" on
 *          url/deadline clears the column (NULL); an absent field leaves the
 *          existing value untouched.
 *  BUG 3 — a TOCTOU race between the ownership check and the mutation (row
 *          deleted between the two) must surface as NOT_FOUND, not INTERNAL.
 *
 * Only auth, the rate limiter, and withUser's role-switch plumbing are
 * mocked — withUser is rewired to hand the callback the PGlite db directly.
 */

import { eq } from "drizzle-orm";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

const { withUserMock, requireUserMock, limiterMock } = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  requireUserMock: vi.fn(),
  limiterMock: vi.fn(async () => ({ allowed: true as const })),
}));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

vi.mock("@/lib/ratelimit/limiters", () => ({
  applicationsLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  createApplicationAction,
  updateApplicationAction,
  deleteApplicationAction,
} from "@/app/(app)/tools/applications/actions";
import type { Executor } from "@/lib/db/client";
import { appliedJobs } from "@/lib/db/schema";
import { createPgliteDb } from "../../helpers/pglite-db";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

let db: Executor;

beforeEach(async () => {
  db = await createPgliteDb();
  withUserMock.mockReset();
  withUserMock.mockImplementation(async (_token: unknown, fn: (tx: Executor) => Promise<unknown>) =>
    fn(db),
  );
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ id: USER_ID });
  limiterMock.mockClear();
  limiterMock.mockResolvedValue({ allowed: true as const });
});

// ─── BUG 1 — blank Deadline no longer crashes create/update ─────────────────

describe("createApplicationAction — blank deadline", () => {
  it("succeeds with deadline '' and stores NULL, not the empty string", async () => {
    const result = await createApplicationAction({
      firm: "Goldman Sachs",
      role: "Analyst",
      stage: "applied",
      deadline: "",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.deadline).toBeUndefined();

    const [row] = await db.select().from(appliedJobs).where(eq(appliedJobs.id, result.data.id));
    expect(row?.deadline).toBeNull();
  });

  it("still accepts a real yyyy-mm-dd deadline", async () => {
    const result = await createApplicationAction({
      firm: "Goldman Sachs",
      role: "Analyst",
      stage: "applied",
      deadline: "2026-09-01",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.deadline).toBe("2026-09-01");
  });

  it("rejects a malformed deadline before it reaches the database", async () => {
    const result = await createApplicationAction({
      firm: "Goldman Sachs",
      role: "Analyst",
      stage: "applied",
      deadline: "09/01/2026",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });
});

describe("updateApplicationAction — blank deadline", () => {
  it("succeeds when clearing an existing deadline to ''", async () => {
    const created = await createApplicationAction({
      firm: "Evercore",
      role: "Analyst",
      stage: "applied",
      deadline: "2026-09-01",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await updateApplicationAction({ id: created.data.id, deadline: "" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.deadline).toBeUndefined();
  });
});

// ─── BUG 2 — clear-vs-absent semantics on update ─────────────────────────────

describe("updateApplicationAction — clear-vs-absent semantics", () => {
  it("clears url to NULL when the field is explicitly sent as ''", async () => {
    const created = await createApplicationAction({
      firm: "Lazard",
      role: "Analyst",
      stage: "applied",
      url: "https://careers.lazard.com/job/1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await updateApplicationAction({ id: created.data.id, url: "" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.url).toBeUndefined();

    const [row] = await db.select().from(appliedJobs).where(eq(appliedJobs.id, created.data.id));
    expect(row?.url).toBeNull();
  });

  it("leaves url untouched when the field is absent from the update payload", async () => {
    const created = await createApplicationAction({
      firm: "Centerview",
      role: "Associate",
      stage: "applied",
      url: "https://careers.centerview.com/job/2",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Only `stage` is sent — url must survive unchanged.
    const result = await updateApplicationAction({ id: created.data.id, stage: "interview" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.url).toBe("https://careers.centerview.com/job/2");
  });

  it("clears deadline to NULL when the field is explicitly sent as ''", async () => {
    const created = await createApplicationAction({
      firm: "Moelis",
      role: "Analyst",
      stage: "applied",
      deadline: "2026-10-15",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await updateApplicationAction({ id: created.data.id, deadline: "" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [row] = await db.select().from(appliedJobs).where(eq(appliedJobs.id, created.data.id));
    expect(row?.deadline).toBeNull();
  });

  it("leaves deadline untouched when the field is absent from the update payload", async () => {
    const created = await createApplicationAction({
      firm: "PJT Partners",
      role: "Analyst",
      stage: "applied",
      deadline: "2026-11-01",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await updateApplicationAction({ id: created.data.id, stage: "interview" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.deadline).toBe("2026-11-01");
  });
});

// ─── BUG 3 — TOCTOU race surfaces NOT_FOUND, not INTERNAL ───────────────────

describe("updateApplicationAction — TOCTOU race", () => {
  it("returns NOT_FOUND when the row is deleted between the ownership check and the update", async () => {
    const created = await createApplicationAction({
      firm: "Houlihan Lokey",
      role: "Analyst",
      stage: "applied",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // First withUser call = ownership check (runs normally against the seeded
    // row). Second withUser call = the mutation — delete the row out from
    // under it immediately beforehand to simulate a concurrent delete
    // (double-click / two tabs) landing between the two steps.
    withUserMock.mockReset();
    withUserMock
      .mockImplementationOnce(async (_t: unknown, fn: (tx: Executor) => Promise<unknown>) => fn(db))
      .mockImplementationOnce(async (_t: unknown, fn: (tx: Executor) => Promise<unknown>) => {
        await db.delete(appliedJobs).where(eq(appliedJobs.id, created.data.id));
        return fn(db);
      });

    const result = await updateApplicationAction({ id: created.data.id, stage: "interview" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});

describe("deleteApplicationAction — TOCTOU race", () => {
  it("returns NOT_FOUND when the row is deleted between the ownership check and the delete", async () => {
    const created = await createApplicationAction({
      firm: "Guggenheim",
      role: "Associate",
      stage: "applied",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    withUserMock.mockReset();
    withUserMock
      .mockImplementationOnce(async (_t: unknown, fn: (tx: Executor) => Promise<unknown>) => fn(db))
      .mockImplementationOnce(async (_t: unknown, fn: (tx: Executor) => Promise<unknown>) => {
        await db.delete(appliedJobs).where(eq(appliedJobs.id, created.data.id));
        return fn(db);
      });

    const result = await deleteApplicationAction({ id: created.data.id });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});
