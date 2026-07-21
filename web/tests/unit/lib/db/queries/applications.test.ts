/**
 * PGlite-backed tests for `lib/db/queries/applications.ts`.
 *
 * Uses an in-memory Postgres instance (via `tests/helpers/pglite-db.ts`) so
 * the WHERE clauses, column mappings, and upsert behaviour are verified by
 * real SQL execution — not a stub that ignores query conditions.
 *
 * The two-user isolation test at the bottom is the critical proof: it shows
 * that `getApplications(db, userA)` returns ONLY userA's rows because the SQL
 * `where user_id = ?` actually runs.
 */

import { describe, expect, it, beforeEach } from "vitest";

import {
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplications,
  updateApplication,
} from "@/lib/db/queries/applications";
import type { Executor } from "@/lib/db/client";
import { NotFoundError } from "@/lib/errors";
import { createPgliteDb } from "../../../../helpers/pglite-db";

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let db: Executor;

beforeEach(async () => {
  // Fresh in-memory DB per test — no cross-test contamination.
  db = await createPgliteDb();
});

// ─── getApplications ──────────────────────────────────────────────────────────

describe("getApplications", () => {
  it("returns an empty array when the user has no applications", async () => {
    const result = await getApplications(db, USER_A);
    expect(result).toEqual([]);
  });

  it("maps a row to the camelCase AppliedJob shape", async () => {
    await createApplication(db, USER_A, {
      firm: "Goldman Sachs",
      role: "Summer Analyst",
      stage: "applied",
      group: "M&A",
      url: "https://careers.gs.com/job/1",
      deadline: "2026-09-01",
      notes: "Referral from Jane",
    });

    const result = await getApplications(db, USER_A);
    expect(result).toHaveLength(1);

    const app = result[0]!;
    expect(app.firm).toBe("Goldman Sachs");
    expect(app.role).toBe("Summer Analyst");
    expect(app.group).toBe("M&A");
    expect(app.stage).toBe("applied");
    expect(app.url).toBe("https://careers.gs.com/job/1");
    expect(app.deadline).toBe("2026-09-01");
    expect(app.notes).toBe("Referral from Jane");
    // userId must not leak into the domain type.
    expect(Object.keys(app)).not.toContain("userId");
  });

  it("coerces null optional columns to undefined", async () => {
    await createApplication(db, USER_A, {
      firm: "Evercore",
      role: "Analyst",
      stage: "shortlist",
      // no group, url, deadline, notes
    });

    const [app] = await getApplications(db, USER_A);
    expect(app!.group).toBeUndefined();
    expect(app!.url).toBeUndefined();
    expect(app!.deadline).toBeUndefined();
    expect(app!.notes).toBeUndefined();
  });

  // TWO-USER ISOLATION: proves the WHERE user_id = ? clause actually filters.
  // This is the test that stub executors could not provide — the stub ignored
  // the where condition and returned whatever rows you gave it.
  it("does not return rows belonging to another user (SQL-proven isolation)", async () => {
    await createApplication(db, USER_A, { firm: "Lazard", role: "Analyst", stage: "applied" });
    await createApplication(db, USER_B, { firm: "Centerview", role: "Associate", stage: "offer" });

    const appsA = await getApplications(db, USER_A);
    const appsB = await getApplications(db, USER_B);

    expect(appsA).toHaveLength(1);
    expect(appsA[0]!.firm).toBe("Lazard");

    expect(appsB).toHaveLength(1);
    expect(appsB[0]!.firm).toBe("Centerview");
  });
});

// ─── getApplicationById ───────────────────────────────────────────────────────

describe("getApplicationById", () => {
  it("returns the mapped application when found and owned by caller", async () => {
    const created = await createApplication(db, USER_A, {
      firm: "PJT Partners",
      role: "Summer Analyst",
      stage: "interview",
    });

    const found = await getApplicationById(db, created.id, USER_A);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.firm).toBe("PJT Partners");
  });

  it("returns null when the row does not exist", async () => {
    const found = await getApplicationById(db, "00000000-0000-4000-8000-000000000000", USER_A);
    expect(found).toBeNull();
  });

  it("returns null when the row belongs to a different user (ownership isolation)", async () => {
    const created = await createApplication(db, USER_A, {
      firm: "Moelis",
      role: "Analyst",
      stage: "applied",
    });

    // USER_B must not be able to retrieve USER_A's row.
    const found = await getApplicationById(db, created.id, USER_B);
    expect(found).toBeNull();
  });
});

// ─── createApplication ────────────────────────────────────────────────────────

describe("createApplication", () => {
  it("inserts a row and returns it as an AppliedJob", async () => {
    const app = await createApplication(db, USER_A, {
      firm: "Houlihan Lokey",
      role: "Analyst",
      stage: "shortlist",
    });

    expect(app.id).toBeTruthy();
    expect(app.firm).toBe("Houlihan Lokey");
    expect(app.role).toBe("Analyst");
    expect(app.stage).toBe("shortlist");
    expect(app.addedAt).toBeTruthy();
  });

  it("stores optional fields when provided", async () => {
    const app = await createApplication(db, USER_A, {
      firm: "Guggenheim",
      role: "Associate",
      stage: "offer",
      notes: "Strong offer — deadline 2026-08-01",
      group: "Healthcare",
    });

    const fetched = await getApplicationById(db, app.id, USER_A);
    expect(fetched!.notes).toBe("Strong offer — deadline 2026-08-01");
    expect(fetched!.group).toBe("Healthcare");
  });
});

// ─── updateApplication ────────────────────────────────────────────────────────

describe("updateApplication", () => {
  it("updates mutable fields and returns the updated row", async () => {
    const app = await createApplication(db, USER_A, {
      firm: "Jefferies",
      role: "Analyst",
      stage: "applied",
    });

    const updated = await updateApplication(db, app.id, {
      stage: "interview",
      notes: "Phone screen done.",
    });
    expect(updated.stage).toBe("interview");
    expect(updated.notes).toBe("Phone screen done.");
    expect(updated.firm).toBe("Jefferies"); // unchanged
  });

  it("clears url and deadline to NULL when passed explicit null (clear-vs-absent contract)", async () => {
    const app = await createApplication(db, USER_A, {
      firm: "Blackstone",
      role: "Analyst",
      stage: "applied",
      url: "https://careers.blackstone.com/job/1",
      deadline: "2026-09-01",
    });

    const updated = await updateApplication(db, app.id, { url: null, deadline: null });
    expect(updated.url).toBeUndefined();
    expect(updated.deadline).toBeUndefined();
  });

  it("leaves url and deadline untouched when omitted from the input", async () => {
    const app = await createApplication(db, USER_A, {
      firm: "Perella Weinberg",
      role: "Analyst",
      stage: "applied",
      url: "https://careers.pwp.com/job/1",
      deadline: "2026-09-01",
    });

    const updated = await updateApplication(db, app.id, { stage: "interview" });
    expect(updated.url).toBe("https://careers.pwp.com/job/1");
    expect(updated.deadline).toBe("2026-09-01");
  });

  // BUG 3 (TOCTOU): a row deleted between the caller's ownership check and
  // this mutation must surface as NotFoundError, not a raw "no rows" crash.
  it("throws NotFoundError when the row no longer exists", async () => {
    await expect(
      updateApplication(db, "00000000-0000-4000-8000-000000000000", { stage: "interview" }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── deleteApplication ────────────────────────────────────────────────────────

describe("deleteApplication", () => {
  it("removes the row so it is no longer returned by getApplicationById", async () => {
    const app = await createApplication(db, USER_A, {
      firm: "RBC Capital",
      role: "Analyst",
      stage: "applied",
    });

    await deleteApplication(db, app.id);

    const fetched = await getApplicationById(db, app.id, USER_A);
    expect(fetched).toBeNull();
  });

  // BUG 3 (TOCTOU): deleting an already-gone row (double-click, two tabs)
  // must throw NotFoundError instead of silently no-op'ing.
  it("throws NotFoundError when the row no longer exists", async () => {
    await expect(
      deleteApplication(db, "00000000-0000-4000-8000-000000000000"),
    ).rejects.toThrow(NotFoundError);
  });
});
