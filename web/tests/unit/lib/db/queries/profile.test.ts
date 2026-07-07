/**
 * PGlite-backed tests for `lib/db/queries/profile.ts`.
 *
 * Uses an in-memory Postgres instance (via `tests/helpers/pglite-db.ts`) so
 * the upsert, camelCase↔snake_case mapping, and null-coercion behaviour are
 * verified by real SQL — not a stub executor that ignores query conditions.
 */

import { describe, expect, it, beforeEach } from "vitest";

import type { Executor } from "@/lib/db/client";
import { emptyProfile, getProfile, updateProfile } from "@/lib/db/queries/profile";
import { createPgliteDb } from "../../../../helpers/pglite-db";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

let db: Executor;

beforeEach(async () => {
  db = await createPgliteDb();
});

// ─── getProfile ───────────────────────────────────────────────────────────────

describe("getProfile", () => {
  it("returns the empty-profile shape when no row exists", async () => {
    const profile = await getProfile(db, USER_ID);
    expect(profile).toEqual(emptyProfile(USER_ID));
    expect(profile.targetRoles).toEqual([]);
    expect(profile.experiences).toEqual([]);
    expect(profile.fullName).toBeUndefined();
  });

  it("maps a populated row to the camelCase Profile shape", async () => {
    // Insert via updateProfile (the only write path available).
    await updateProfile(db, USER_ID, {
      fullName: "Jane Banker",
      school: "State U",
      graduationYear: 2027,
      targetRoles: ["Summer Analyst"],
      targetFirms: ["Evercore", "Centerview"],
      bioSummary: "Aspiring IB analyst",
      skills: ["Excel", "PowerPoint"],
    });

    const profile = await getProfile(db, USER_ID);
    expect(profile.userId).toBe(USER_ID);
    expect(profile.fullName).toBe("Jane Banker");
    expect(profile.school).toBe("State U");
    expect(profile.graduationYear).toBe(2027);
    expect(profile.targetRoles).toEqual(["Summer Analyst"]);
    expect(profile.targetFirms).toEqual(["Evercore", "Centerview"]);
    expect(profile.bioSummary).toBe("Aspiring IB analyst");
    expect(profile.skills).toEqual(["Excel", "PowerPoint"]);
  });

  it("coerces null columns to the Profile defaults (array fields → [])", async () => {
    // Direct insert of a row with NULLs to simulate an old row.
    await db.execute(`insert into profiles (user_id) values ('${USER_ID}')`);
    const profile = await getProfile(db, USER_ID);
    // Array fields default to [] even when the column is NULL.
    expect(profile.targetRoles).toEqual([]);
    expect(profile.targetFirms).toEqual([]);
    expect(profile.experiences).toEqual([]);
    expect(profile.education).toEqual([]);
    expect(profile.skills).toEqual([]);
    // Scalar nullable fields default to undefined.
    expect(profile.fullName).toBeUndefined();
    expect(profile.school).toBeUndefined();
    expect(profile.graduationYear).toBeUndefined();
    expect(profile.userId).toBe(USER_ID);
  });
});

// ─── updateProfile ────────────────────────────────────────────────────────────

describe("updateProfile", () => {
  it("inserts a new row when none exists (upsert create path)", async () => {
    const profile = await updateProfile(db, USER_ID, {
      fullName: "Jane Banker",
      school: "Wharton",
      graduationYear: 2027,
      targetFirms: ["Goldman Sachs"],
      skills: ["Excel"],
    });

    expect(profile.fullName).toBe("Jane Banker");
    expect(profile.school).toBe("Wharton");
    expect(profile.graduationYear).toBe(2027);
    expect(profile.targetFirms).toEqual(["Goldman Sachs"]);
    expect(profile.skills).toEqual(["Excel"]);
  });

  it("updates an existing row without overwriting unset fields (upsert update path)", async () => {
    // Create initial profile.
    await updateProfile(db, USER_ID, { fullName: "Jane Banker", school: "Booth" });

    // Partial update — should not wipe school.
    const updated = await updateProfile(db, USER_ID, { fullName: "Jane Q. Banker" });
    expect(updated.fullName).toBe("Jane Q. Banker");
    expect(updated.school).toBe("Booth"); // preserved
  });

  it("stamps updatedAt on every call", async () => {
    const p1 = await updateProfile(db, USER_ID, { school: "Harvard" });
    // Small pause to ensure a different timestamp is possible, but we just
    // check the field is present and non-null.
    expect(p1.updatedAt).toBeTruthy();
    expect(typeof p1.updatedAt).toBe("string");
  });

  it("does not mix rows between users", async () => {
    await updateProfile(db, USER_ID, { fullName: "Alice" });
    await updateProfile(db, USER_B, { fullName: "Bob" });

    const alice = await getProfile(db, USER_ID);
    const bob = await getProfile(db, USER_B);
    expect(alice.fullName).toBe("Alice");
    expect(bob.fullName).toBe("Bob");
  });
});
