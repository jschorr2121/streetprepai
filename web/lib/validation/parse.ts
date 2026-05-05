import type { ZodSchema } from "zod";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/**
 * Parse and validate a JSON request body. Returns a 400 Response on failure
 * with structured error details.
 */
export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<ParseResult<T>> {
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
