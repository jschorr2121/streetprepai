/**
 * PGlite-backed tests for the topic-mastery query functions in
 * `lib/db/queries/curriculum.ts`.
 *
 * Uses an in-memory Postgres instance (via `tests/helpers/pglite-db.ts`) so
 * the WHERE clauses, numeric column mapping, and upsert (onConflictDoUpdate)
 * behaviour are verified by real SQL execution.
 *
 * Section/chapter progress functions are covered lightly here only where
 * trivial; the bulk of this file targets getTopicMastery/upsertTopicMastery
 * per the Unit 8 test-debt scope.
 */

import { describe, expect, it, beforeEach } from "vitest";

import {
  getTopicMastery,
  getTopicMasteryForUpdate,
  listTopicMastery,
  upsertTopicMastery,
} from "@/lib/db/queries/curriculum";
import type { Executor } from "@/lib/db/client";
import { updateMastery } from "@/lib/mastery/mastery";
import { createPgliteDb } from "../../../../helpers/pglite-db";

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let db: Executor;

beforeEach(async () => {
  db = await createPgliteDb();
});

// ─── getTopicMastery ────────────────────────────────────────────────────────────

describe("getTopicMastery", () => {
  it("returns null when the user has no mastery entry for the topic", async () => {
    const result = await getTopicMastery(db, USER_A, "valuation");
    expect(result).toBeNull();
  });

  it("returns the mapped entry after an upsert", async () => {
    await upsertTopicMastery(db, USER_A, { topic: "valuation", score: 0.65, attempts: 3 });

    const result = await getTopicMastery(db, USER_A, "valuation");
    expect(result).not.toBeNull();
    expect(result!.topic).toBe("valuation");
    expect(result!.score).toBe(0.65);
    expect(result!.attempts).toBe(3);
  });

  it("does not return a different topic's entry", async () => {
    await upsertTopicMastery(db, USER_A, { topic: "valuation", score: 0.5, attempts: 1 });
    const result = await getTopicMastery(db, USER_A, "lbo");
    expect(result).toBeNull();
  });
});

// ─── upsertTopicMastery ─────────────────────────────────────────────────────────

describe("upsertTopicMastery", () => {
  it("inserts a new row when none exists", async () => {
    await upsertTopicMastery(db, USER_A, { topic: "accounting", score: 0.4, attempts: 1 });

    const all = await listTopicMastery(db, USER_A);
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({ topic: "accounting", score: 0.4, attempts: 1 });
  });

  it("updates the existing row on conflict (userId, topic) instead of duplicating", async () => {
    await upsertTopicMastery(db, USER_A, { topic: "accounting", score: 0.4, attempts: 1 });
    await upsertTopicMastery(db, USER_A, { topic: "accounting", score: 0.72, attempts: 2 });

    const all = await listTopicMastery(db, USER_A);
    expect(all).toHaveLength(1);
    expect(all[0]!.score).toBe(0.72);
    expect(all[0]!.attempts).toBe(2);
  });

  it("keeps separate rows per topic for the same user", async () => {
    await upsertTopicMastery(db, USER_A, { topic: "accounting", score: 0.4, attempts: 1 });
    await upsertTopicMastery(db, USER_A, { topic: "valuation", score: 0.8, attempts: 5 });

    const all = await listTopicMastery(db, USER_A);
    expect(all).toHaveLength(2);
    const byTopic = Object.fromEntries(all.map((e) => [e.topic, e]));
    expect(byTopic.accounting!.score).toBe(0.4);
    expect(byTopic.valuation!.score).toBe(0.8);
  });

  // TWO-USER ISOLATION.
  it("does not let one user's upsert affect another user's mastery for the same topic", async () => {
    await upsertTopicMastery(db, USER_A, { topic: "valuation", score: 0.9, attempts: 4 });
    await upsertTopicMastery(db, USER_B, { topic: "valuation", score: 0.1, attempts: 1 });

    const a = await getTopicMastery(db, USER_A, "valuation");
    const b = await getTopicMastery(db, USER_B, "valuation");
    expect(a!.score).toBe(0.9);
    expect(b!.score).toBe(0.1);
  });
});

// ─── getTopicMasteryForUpdate ────────────────────────────────────────────────────
// BUG B: the mastery grade is a read-modify-write. This locks the row FOR
// UPDATE (materializing a zero row first) so concurrent grades serialize
// instead of clobbering each other. PGlite is single-connection, so true
// blocking can't be exercised here — these prove the SQL path runs and that a
// materialized zero row is arithmetically identical to "no row", preserving the
// updateMastery formula exactly.

describe("getTopicMasteryForUpdate", () => {
  it("materializes and returns a zero row when none exists", async () => {
    const entry = await getTopicMasteryForUpdate(db, USER_A, "valuation");
    expect(entry).toEqual({ topic: "valuation", score: 0, attempts: 0 });

    // The zero row is persisted so FOR UPDATE has something to lock.
    const all = await listTopicMastery(db, USER_A);
    expect(all).toEqual([{ topic: "valuation", score: 0, attempts: 0 }]);
  });

  it("returns the existing row without overwriting it (insert-or-ignore)", async () => {
    await upsertTopicMastery(db, USER_A, { topic: "valuation", score: 0.65, attempts: 3 });

    const entry = await getTopicMasteryForUpdate(db, USER_A, "valuation");
    expect(entry).toEqual({ topic: "valuation", score: 0.65, attempts: 3 });

    // Still one row, unchanged.
    const all = await listTopicMastery(db, USER_A);
    expect(all).toHaveLength(1);
    expect(all[0]!.attempts).toBe(3);
  });

  it("a zero row yields the same first-attempt result as passing null to updateMastery", async () => {
    const locked = await getTopicMasteryForUpdate(db, USER_A, "valuation");
    const fromZero = updateMastery(locked, "valuation", 80, "first");
    const fromNull = updateMastery(null, "valuation", 80, "first");
    expect(fromZero).toEqual(fromNull);
  });

  it("read-lock-compute-write across two grades accumulates attempts and folds scores", async () => {
    // Mirrors gradeAnswerAction's persistence path: lock → updateMastery → upsert.
    const prev1 = await getTopicMasteryForUpdate(db, USER_A, "valuation");
    await upsertTopicMastery(db, USER_A, updateMastery(prev1, "valuation", 100, "first"));

    const prev2 = await getTopicMasteryForUpdate(db, USER_A, "valuation");
    await upsertTopicMastery(db, USER_A, updateMastery(prev2, "valuation", 100, "first"));

    const final = await getTopicMastery(db, USER_A, "valuation");
    expect(final!.attempts).toBe(2);
    // Two perfect answers pull mastery strictly up from 0, without either grade
    // resetting the other's attempt count.
    expect(final!.score).toBeGreaterThan(0);
    expect(final!.score).toBeLessThanOrEqual(1);
  });

  // TWO-USER ISOLATION.
  it("materializes a row only for the acting user", async () => {
    await getTopicMasteryForUpdate(db, USER_A, "valuation");
    expect(await listTopicMastery(db, USER_B)).toEqual([]);
  });
});

// ─── listTopicMastery ───────────────────────────────────────────────────────────

describe("listTopicMastery", () => {
  it("returns an empty array when the user has no mastery entries", async () => {
    expect(await listTopicMastery(db, USER_A)).toEqual([]);
  });

  it("does not return another user's entries", async () => {
    await upsertTopicMastery(db, USER_B, { topic: "valuation", score: 0.5, attempts: 2 });
    expect(await listTopicMastery(db, USER_A)).toEqual([]);
  });
});
