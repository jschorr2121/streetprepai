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

import { getTopicMastery, listTopicMastery, upsertTopicMastery } from "@/lib/db/queries/curriculum";
import type { Executor } from "@/lib/db/client";
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
