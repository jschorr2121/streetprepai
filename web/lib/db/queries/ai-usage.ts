import { and, desc, eq, gte } from "drizzle-orm";

import type { Executor } from "@/lib/db/client";
import { aiUsage } from "@/lib/db/schema";

// Self-scoped ai_usage reads for the /dev/spend testing dashboard — the
// signed-in user's own rows only. RLS's `ai_usage_user_read` policy
// (auth.uid() = user_id) is the safety net; run inside `withUser` so it
// actually applies.

export type MyUsageRow = {
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  createdAt: string;
};

function mapRow(r: typeof aiUsage.$inferSelect): MyUsageRow {
  return {
    endpoint: r.endpoint,
    model: r.model,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheReadTokens: r.cacheReadTokens,
    cacheWriteTokens: r.cacheWriteTokens,
    costUsd: Number(r.costUsd),
    createdAt: r.createdAt,
  };
}

export function startOfUtcMonth(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

/** The signed-in user's own ai_usage rows since `sinceIso`, newest first. */
export async function listMyUsageSince(
  db: Executor,
  userId: string,
  sinceIso: string,
): Promise<MyUsageRow[]> {
  const rows = await db
    .select()
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, sinceIso)))
    .orderBy(desc(aiUsage.createdAt));
  return rows.map(mapRow);
}
