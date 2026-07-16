// In-band error framing for the plain-text streaming routes (chat, lens, prep
// sheets). A failure that happens mid-stream can't change the HTTP status any
// more, so the server marks it with an ASCII Record Separator — a control
// character that never occurs in model text (the server strips it from deltas
// as extra insurance) — and clients split on it so the error can be styled and
// retried instead of rendering as assistant prose.
export const STREAM_ERROR_SENTINEL = "\u001E";

export function encodeStreamError(message: string): string {
  return `${STREAM_ERROR_SENTINEL}${message}`;
}

export function stripStreamSentinel(text: string): string {
  return text.includes(STREAM_ERROR_SENTINEL) ? text.replaceAll(STREAM_ERROR_SENTINEL, "") : text;
}

export type StreamPayload = { content: string; error: string | null };

export function splitStreamError(raw: string): StreamPayload {
  const i = raw.indexOf(STREAM_ERROR_SENTINEL);
  if (i === -1) return { content: raw, error: null };
  return {
    content: raw.slice(0, i).trimEnd(),
    error: raw.slice(i + 1).trim() || "The response failed. Please try again.",
  };
}
