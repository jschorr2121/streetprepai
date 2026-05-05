/**
 * Typed analytics event helpers.
 *
 * Each helper accepts a strongly-typed payload of categorical data and
 * a UUID `userId`. Helpers route to either the server-side PostHog
 * client (in route handlers / Node) or the browser SDK (in the React
 * tree). When PostHog is not configured (no API key), they are no-ops.
 *
 * PRIVACY GUARANTEES:
 * - We NEVER capture user-pasted text (resume bullets, transcripts, chat
 *   messages, contact bios, etc.).
 * - Payloads are restricted to categorical fields (firm slugs, modes)
 *   and the user UUID.
 * - Callers should treat these as fire-and-forget. Server callers MUST
 *   `await` the helper to ensure flushing in serverless environments.
 */

import { flushServerPostHog, getServerPostHog } from "./server";

const isServer = typeof window === "undefined";

type Json = string | number | boolean | null | undefined | Json[] | { [k: string]: Json };

interface CapturePayload {
  event: string;
  userId: string;
  properties?: Record<string, Json>;
}

async function captureServer(payload: CapturePayload): Promise<void> {
  const client = getServerPostHog();
  if (!client) return;
  try {
    client.capture({
      distinctId: payload.userId,
      event: payload.event,
      properties: payload.properties as Record<string, unknown> | undefined,
    });
    // Vercel lambdas may freeze on response — flush before returning.
    await flushServerPostHog();
  } catch {
    // analytics never break business logic
  }
}

async function captureClient(payload: CapturePayload): Promise<void> {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    // dynamic import keeps posthog-js out of any accidental server bundle
    const mod = await import("posthog-js");
    const ph = mod.default;
    const loaded = (ph as unknown as { __loaded?: boolean }).__loaded;
    if (!loaded) return;
    if (payload.userId) ph.identify(payload.userId);
    ph.capture(payload.event, payload.properties);
  } catch {
    // ignore
  }
}

async function capture(payload: CapturePayload): Promise<void> {
  if (isServer) {
    await captureServer(payload);
  } else {
    await captureClient(payload);
  }
}

/* ------------------------------------------------------------------ */
/* Typed event helpers                                                 */
/* ------------------------------------------------------------------ */

export interface AIUsagePayload {
  userId: string;
  /** Endpoint identifier, e.g. "chat-stream", "interview-score". */
  endpoint: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  /** Estimated cost in USD, if available. */
  costUsd?: number;
}

export function trackAIUsage(p: AIUsagePayload): Promise<void> {
  return capture({
    event: "ai_usage",
    userId: p.userId,
    properties: {
      endpoint: p.endpoint,
      model: p.model,
      input_tokens: p.inputTokens,
      output_tokens: p.outputTokens,
      cache_read_tokens: p.cacheReadTokens,
      cache_creation_tokens: p.cacheCreationTokens,
      cost_usd: p.costUsd,
    },
  });
}

export interface InterviewScoredPayload {
  userId: string;
  /** Interview mode, e.g. "behavioral", "technical", "fit". */
  mode: string;
}

export function trackInterviewScored(p: InterviewScoredPayload): Promise<void> {
  return capture({
    event: "interview_scored",
    userId: p.userId,
    properties: { mode: p.mode },
  });
}

export interface PrepGeneratedPayload {
  userId: string;
  /** Either a firm slug (for firm prep) or a high-level firm name (for person prep). */
  contactFirm?: string;
  /** "person" or "firm" — defaults inferred by caller. */
  kind?: "person" | "firm";
}

export function trackPrepGenerated(p: PrepGeneratedPayload): Promise<void> {
  return capture({
    event: "prep_generated",
    userId: p.userId,
    properties: {
      contact_firm: p.contactFirm,
      kind: p.kind,
    },
  });
}

export interface ChatStartedPayload {
  userId: string;
  /** Title of the guide the chat is scoped to (no message content). */
  guideTitle?: string;
}

export function trackChatStarted(p: ChatStartedPayload): Promise<void> {
  return capture({
    event: "chat_started",
    userId: p.userId,
    properties: { guide_title: p.guideTitle },
  });
}

export interface ResumeCritiquedPayload {
  userId: string;
}

export function trackResumeCritiqued(p: ResumeCritiquedPayload): Promise<void> {
  return capture({
    event: "resume_critiqued",
    userId: p.userId,
  });
}
