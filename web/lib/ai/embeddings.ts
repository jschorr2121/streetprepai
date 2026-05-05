import { getOpenAI } from "@/lib/ai/openai";
import { logUsage } from "@/lib/ai/usage";
import type { TokenUsage } from "@/lib/ai/pricing";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Returns a 1536-dim float embedding of `input`. Logs cost via lib/ai/usage.
 * Throws if the OpenAI response shape is unexpected (wrong dim, no vector).
 */
export async function embedText(
  input: string,
  opts: { userId?: string; endpoint?: string } = {},
): Promise<number[]> {
  const client = getOpenAI();
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  const usage: TokenUsage = {
    input_tokens: res.usage?.prompt_tokens ?? 0,
    output_tokens: 0,
  };
  logUsage({
    model: EMBEDDING_MODEL,
    usage,
    endpoint: opts.endpoint ?? "embeddings",
    userId: opts.userId,
  });
  const vec = res.data[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Unexpected embedding dimensions: ${vec?.length ?? "missing"}`);
  }
  return vec;
}

export type ChatSummaryForEmbed = {
  topics?: string[];
  adviceGiven?: string[];
  commitments?: string[];
  personalDetails?: string[];
  followUps?: { description: string }[];
};

/**
 * Build the canonical text we embed for a structured chat summary.
 * Joining the high-signal fields keeps the vector aligned with what users
 * actually search for ("what did we discuss"). Raw notes are excluded.
 */
export function summaryEmbedText(s: ChatSummaryForEmbed): string {
  return [
    ...(s.topics ?? []).map((t) => `topic: ${t}`),
    ...(s.adviceGiven ?? []).map((t) => `advice: ${t}`),
    ...(s.commitments ?? []).map((t) => `commitment: ${t}`),
    ...(s.personalDetails ?? []).map((t) => `personal: ${t}`),
    ...(s.followUps ?? []).map((f) => `followup: ${f.description}`),
  ].join("\n");
}
