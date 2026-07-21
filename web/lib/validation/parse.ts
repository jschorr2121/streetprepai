import type { ZodSchema } from "zod";

import { rejectIfContentLengthExceeds } from "@/lib/security/content-length";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/**
 * Default declared-Content-Length cap for `parseJson` bodies.
 *
 * Surveyed every schema that flows through `parseJson` (grep for `parseJson(`
 * under `app/api/`). The largest is `chat/stream`'s `ChatStreamSchema`:
 * guideTitle (2,000 chars) + guideContent (120,000 chars) + up to 50 messages
 * at 8,000 chars each (400,000 chars) = ~522,000 characters of legitimate
 * content. At up to 3 bytes/char for multi-byte UTF-8 text (e.g. CJK), that's
 * ~1.5 MB of legitimate wire bytes — well above the "under 100 KB" assumption
 * one might start from. Every other schema behind `parseJson` tops out far
 * lower (the next largest, `draft-followup`'s `SummarySchema`, is ~100,000
 * chars, well under 1 MB even accounting for multi-byte text). 2 MB leaves
 * comfortable headroom above the worst legitimate case while still bounding
 * memory for an oversized/malicious body.
 */
const DEFAULT_MAX_JSON_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Parse and validate a JSON request body. Returns a 400 Response on failure
 * with structured error details.
 *
 * Before reading the body, rejects a declared `Content-Length` over
 * `maxBytes` with a 413 — this is a fast-path guard so an oversized body
 * doesn't get fully buffered by `req.json()` just to be rejected afterwards.
 * A chunked or missing `Content-Length` falls through to a normal parse; the
 * Zod schema validation below remains the authoritative check for shape and
 * size (an attacker lying with a small declared length is still bounded by
 * the platform/runtime's own request-body limits).
 */
export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>,
  maxBytes: number = DEFAULT_MAX_JSON_BYTES,
): Promise<ParseResult<T>> {
  const tooLarge = rejectIfContentLengthExceeds(req, maxBytes, "Request body is too large.");
  if (tooLarge) return { ok: false, response: tooLarge };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false,
      response: Response.json(
        { error: "Invalid request body", issues: result.error.issues },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: result.data };
}
