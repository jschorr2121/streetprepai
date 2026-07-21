/**
 * Pre-flight `Content-Length` check for body-reading Route Handlers.
 *
 * Buffering an entire request body (via `req.arrayBuffer()` / `req.formData()`)
 * before checking its size means an oversized upload still gets fully read
 * into memory before it is rejected. When the client sends a `Content-Length`
 * header, we can reject before touching the body at all.
 *
 * This is a fast-path only: a chunked-encoded or missing `Content-Length`
 * falls through (returns `null`), so callers MUST keep an authoritative
 * post-read size check (on the buffered `ArrayBuffer`/`File.size`) as the
 * backstop.
 */
export function rejectIfContentLengthExceeds(
  req: Request,
  maxBytes: number,
  message: string,
): Response | null {
  const raw = req.headers.get("content-length");
  if (!raw) return null;

  const declared = Number(raw);
  if (!Number.isFinite(declared) || declared <= maxBytes) return null;

  return Response.json({ error: message }, { status: 413 });
}
