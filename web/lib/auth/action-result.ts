// The discriminated-union return shape every Server Action uses (code-standards
// §Next.js). Callers branch on `result.ok`.
//
// Lives in lib/auth for now because Unit 4 is the first unit to define Server
// Actions; Unit 6 (Server Action pattern proof) may relocate this to a more
// neutral home (e.g. lib/actions.ts) as the canonical reference. Codes are the
// fixed set from code-standards.

import { ValidationError, type AppError } from "@/lib/errors";

export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "INTERNAL";

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

// Collapse Zod issues into the first message per top-level field, for the
// `fieldErrors` map that forms render under each input.
export function fieldErrorsFromIssues(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Translate any `AppError` subclass into the `{ ok: false, error }` failure
 * shape that Server Actions return. Provides the single translation point that
 * code-standards §Error Handling describes ("Server Actions translate AppError →
 * discriminated-union failure shape in their top-level try/catch").
 *
 * Usage in a Server Action's catch block:
 *   if (err instanceof AppError) return actionErrorFromAppError(err);
 */
export function actionErrorFromAppError(err: AppError): { ok: false; error: ActionError } {
  return {
    ok: false,
    error: {
      code: err.code as ActionErrorCode,
      message: err.message,
      ...(err instanceof ValidationError ? { fieldErrors: err.fieldErrors } : {}),
    },
  };
}
