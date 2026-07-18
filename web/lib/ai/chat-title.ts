/**
 * LLM auto-titling for chatbot threads (deferred item from Unit 9).
 *
 * Called best-effort from `chat/assistant`'s stream `onEnd` after the first
 * exchange in a new thread persists. A failure here must never break the
 * chat response — callers catch and keep the existing fallback title (the
 * first 60 chars of the user's message, set at thread creation).
 */
import { getAnthropic, MODELS } from "./anthropic";
import { THREAD_TITLE_SYSTEM } from "./prompts";
import { capText, wrapUserText } from "./sanitize";
import { logUsage } from "./usage";

const MAX_TITLE_CHARS = 80;

/**
 * Clean up raw model text into a safe, displayable title: collapse
 * newlines/whitespace, strip wrapping quotes/backticks, clamp length. The
 * model is asked for plain text only — this is never `JSON.parse`d.
 */
export function sanitizeTitle(raw: string, maxChars: number = MAX_TITLE_CHARS): string {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  const unquoted = collapsed.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, "").trim();
  return unquoted.length > maxChars ? unquoted.slice(0, maxChars).trim() : unquoted;
}

export type GenerateThreadTitleOpts = {
  userText: string;
  assistantText?: string;
  userId?: string;
};

/**
 * Generate a short (~3-6 word) title from the first exchange via the
 * cheapest model already used elsewhere for small generation tasks (haiku —
 * see `relationships/draft-followup`). Logs one `ai_usage` row per call via
 * the existing `logUsage` path. Throws on failure — the caller (route
 * `onEnd`) is responsible for the best-effort catch.
 */
export async function generateThreadTitle(opts: GenerateThreadTitleOpts): Promise<string | null> {
  const client = getAnthropic();
  const prompt = [
    wrapUserText(capText(opts.userText, 2_000), "student_message"),
    opts.assistantText
      ? wrapUserText(capText(opts.assistantText, 1_000), "assistant_reply")
      : null,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n\n");

  const response = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 20,
    system: THREAD_TITLE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  logUsage({
    model: MODELS.haiku,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined,
    },
    endpoint: "chat/assistant/title",
    userId: opts.userId,
  });

  const text = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");

  const title = sanitizeTitle(text);
  return title.length > 0 ? title : null;
}
