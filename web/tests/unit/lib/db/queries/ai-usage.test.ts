/**
 * PGlite-backed tests for `lib/db/queries/ai-usage.ts` — the /dev/spend
 * self-service usage reads.
 *
 * This module backs both the per-user spend dashboard AND (transitively,
 * via `lib/ai/usage.ts::assertUnderQuota`) the monthly AI cost cap that
 * gates every AI-calling API route. A broken WHERE clause here either
 * leaks another user's spend or fails to cap runaway cost, so the
 * user-scoping and date-boundary behaviour is worth real SQL coverage
 * rather than a mocked assertion.
 */

import { describe, expect, it, beforeEach } from "vitest";

import { listMyUsageSince, startOfUtcMonth } from "@/lib/db/queries/ai-usage";
import { aiUsage } from "@/lib/db/schema";
import type { Executor } from "@/lib/db/client";
import { createPgliteDb } from "../../../../helpers/pglite-db";

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let db: Executor;

beforeEach(async () => {
  db = await createPgliteDb();
});

async function insertUsage(overrides: {
  userId: string;
  endpoint?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costUsd?: string;
  createdAt?: string;
}) {
  const [row] = await db
    .insert(aiUsage)
    .values({
      userId: overrides.userId,
      endpoint: overrides.endpoint ?? "interview/score",
      model: overrides.model ?? "claude-sonnet-4-5",
      inputTokens: overrides.inputTokens ?? 1000,
      outputTokens: overrides.outputTokens ?? 200,
      cacheReadTokens: overrides.cacheReadTokens ?? 0,
      cacheWriteTokens: overrides.cacheWriteTokens ?? 0,
      costUsd: overrides.costUsd ?? "0.012500",
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    })
    .returning();
  return row;
}

describe("startOfUtcMonth", () => {
  it("returns midnight UTC on the 1st of the given month", () => {
    const result = startOfUtcMonth(new Date("2026-07-18T23:59:59.999Z"));
    expect(result).toBe("2026-07-01T00:00:00.000Z");
  });

  it("normalizes a date already at month start", () => {
    const result = startOfUtcMonth(new Date("2026-01-01T00:00:00.000Z"));
    expect(result).toBe("2026-01-01T00:00:00.000Z");
  });

  it("rolls over correctly at a year boundary", () => {
    const result = startOfUtcMonth(new Date("2025-12-31T23:59:59.999Z"));
    expect(result).toBe("2025-12-01T00:00:00.000Z");
  });

  it("uses UTC, not local time, for the month boundary", () => {
    // 2026-03-01T00:30 in UTC+1 is still Feb 28 in UTC.
    const result = startOfUtcMonth(new Date("2026-03-01T00:30:00.000+01:00"));
    expect(result).toBe("2026-02-01T00:00:00.000Z");
  });
});

describe("listMyUsageSince", () => {
  it("returns [] when the user has no usage rows", async () => {
    const result = await listMyUsageSince(db, USER_A, "2026-01-01T00:00:00.000Z");
    expect(result).toEqual([]);
  });

  it("returns only the requesting user's rows (isolation)", async () => {
    await insertUsage({ userId: USER_A, endpoint: "interview/score" });
    await insertUsage({ userId: USER_B, endpoint: "resume/critique" });

    const resultA = await listMyUsageSince(db, USER_A, "2026-01-01T00:00:00.000Z");
    expect(resultA).toHaveLength(1);
    expect(resultA[0]!.endpoint).toBe("interview/score");

    const resultB = await listMyUsageSince(db, USER_B, "2026-01-01T00:00:00.000Z");
    expect(resultB).toHaveLength(1);
    expect(resultB[0]!.endpoint).toBe("resume/critique");
  });

  it("excludes rows created before sinceIso (exclusive lower boundary via gte)", async () => {
    await insertUsage({ userId: USER_A, createdAt: "2026-06-30T23:59:59.999Z" });
    await insertUsage({ userId: USER_A, createdAt: "2026-07-01T00:00:00.000Z" });

    const result = await listMyUsageSince(db, USER_A, "2026-07-01T00:00:00.000Z");
    expect(result).toHaveLength(1);
    expect(result[0]!.createdAt.startsWith("2026-07-01")).toBe(true);
  });

  it("includes a row exactly at sinceIso (gte is inclusive)", async () => {
    await insertUsage({ userId: USER_A, createdAt: "2026-07-01T00:00:00.000Z" });
    const result = await listMyUsageSince(db, USER_A, "2026-07-01T00:00:00.000Z");
    expect(result).toHaveLength(1);
  });

  it("orders rows newest first", async () => {
    await insertUsage({ userId: USER_A, endpoint: "first", createdAt: "2026-07-01T00:00:00.000Z" });
    await insertUsage({
      userId: USER_A,
      endpoint: "second",
      createdAt: "2026-07-10T00:00:00.000Z",
    });
    await insertUsage({ userId: USER_A, endpoint: "third", createdAt: "2026-07-05T00:00:00.000Z" });

    const result = await listMyUsageSince(db, USER_A, "2026-01-01T00:00:00.000Z");
    expect(result.map((r) => r.endpoint)).toEqual(["second", "third", "first"]);
  });

  it("maps the numeric cost_usd column to a JS number", async () => {
    await insertUsage({ userId: USER_A, costUsd: "1.234567" });
    const [row] = await listMyUsageSince(db, USER_A, "2026-01-01T00:00:00.000Z");
    expect(row!.costUsd).toBe(1.234567);
    expect(typeof row!.costUsd).toBe("number");
  });

  it("maps every field of MyUsageRow", async () => {
    await insertUsage({
      userId: USER_A,
      endpoint: "lens/explain",
      model: "gpt-5-mini",
      inputTokens: 500,
      outputTokens: 150,
      cacheReadTokens: 300,
      cacheWriteTokens: 20,
      costUsd: "0.045000",
    });
    const [row] = await listMyUsageSince(db, USER_A, "2026-01-01T00:00:00.000Z");
    expect(row).toMatchObject({
      endpoint: "lens/explain",
      model: "gpt-5-mini",
      inputTokens: 500,
      outputTokens: 150,
      cacheReadTokens: 300,
      cacheWriteTokens: 20,
      costUsd: 0.045,
    });
    expect(typeof row!.createdAt).toBe("string");
  });
});
