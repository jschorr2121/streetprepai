import { getAdminClient } from "@/lib/supabase/admin";
import { calculateCost, type TokenUsage } from "./pricing";

export type UsagePayload = {
  model: string;
  usage: TokenUsage;
  endpoint: string;
  userId?: string;
};

export function logUsage(payload: UsagePayload): void {
  const admin = getAdminClient();
  if (!admin) {
    console.warn("[ai/usage] logUsage: admin client unavailable (SUPABASE_SERVICE_ROLE_KEY not set)");
    return;
  }

  const costUsd = calculateCost(payload.model, payload.usage);

  void admin
    .from("ai_usage")
    .insert({
      user_id: payload.userId ?? null,
      endpoint: payload.endpoint,
      model: payload.model,
      input_tokens: payload.usage.input_tokens,
      output_tokens: payload.usage.output_tokens,
      cache_read_tokens: payload.usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: payload.usage.cache_creation_input_tokens ?? 0,
      cost_usd: costUsd,
    });
}

type TrackStreamOpts = { userId?: string };

export function trackStream(
  stream: { finalMessage: () => Promise<{ model?: string; usage?: TokenUsage }> },
  endpoint: string,
  opts: TrackStreamOpts = {},
): void {
  void stream
    .finalMessage()
    .then((msg) => {
      if (!msg.model || !msg.usage) return;
      logUsage({ model: msg.model, usage: msg.usage, endpoint, userId: opts.userId });
    })
    .catch(() => {
      // swallow — caller handles stream errors via their own error handling
    });
}

export type UsageMonthResult = { totalUsd: number; rowCount: number };

export async function getUserUsageThisMonth(userId: string): Promise<UsageMonthResult> {
  const admin = getAdminClient();
  if (!admin) return { totalUsd: 0, rowCount: 0 };

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const { data, error } = await admin
    .from("ai_usage")
    .select("cost_usd")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  if (error || !data) {
    console.error("[ai/usage] getUserUsageThisMonth error:", error);
    return { totalUsd: 0, rowCount: 0 };
  }

  const rows = data as { cost_usd: number | string }[];
  const totalUsd = rows.reduce((sum, r) => sum + Number(r.cost_usd), 0);
  return { totalUsd, rowCount: rows.length };
}

export type QuotaResult = { ok: boolean; usedUsd: number };

export async function assertUnderQuota(userId: string, capUsd: number): Promise<QuotaResult> {
  const { totalUsd } = await getUserUsageThisMonth(userId);
  return { ok: totalUsd < capUsd, usedUsd: totalUsd };
}
