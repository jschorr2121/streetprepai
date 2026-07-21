/**
 * Pre-flight `Content-Length` check for body-reading Route Handlers.
 *
 * Buffering an entire request body (via `req.arrayBuffer()` / `req.formData()`
 * / `req.json()`) before checking its size means an oversized body still gets
 * fully read into memory before it is rejected. When the client sends a
 * `Content-Length` header, we can reject before touching the body at all.
 *
 * This is a fast-path only: a chunked-encoded or missing `Content-Length`
 * falls through (returns `null`), so callers MUST keep an authoritative
 * post-read size check (on the buffered `ArrayBuffer`/`File.size`, or the
 * parsed JSON via Zod's own length limits) as the backstop.
 *
 * The declared length for multipart uploads includes boundary/part-header
 * overhead, so a file at exactly the cap would otherwise trip the pre-check
 * that the authoritative `file.size` comparison would let through. A small
 * slack keeps the pre-check strictly weaker than the backstop for every
 * caller (JSON bodies have no such overhead, so the slack is just extra
 * headroom for them).
 */
const OVERHEAD_SLACK_BYTES = 8_192;

export function rejectIfContentLengthExceeds(
  req: Request,
  maxBytes: number,
  message: string,
): Response | null {
  const raw = req.headers.get("content-length");
  if (!raw) return null;

  const declared = Number(raw);
  if (!Number.isFinite(declared) || declared <= maxBytes + OVERHEAD_SLACK_BYTES) {
    return null;
  }

  return Response.json({ error: message }, { status: 413 });
}
