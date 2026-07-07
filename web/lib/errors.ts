/**
 * AppError hierarchy — the typed error vocabulary for the entire application.
 *
 * Server Actions catch these and translate them into the `ActionResult<T>`
 * discriminated union. Unknown errors (not instanceof AppError) get captured
 * to Sentry and returned as `{ code: 'INTERNAL', message: 'Something went wrong.' }`.
 *
 * Rule: never surface `.message` that leaks stack traces, internal IDs, or
 * raw DB errors to the client. Safe messages only in every subclass below.
 */

/** Base class. `abstract` — never instantiate directly. */
export abstract class AppError extends Error {
  abstract readonly code:
    | "UNAUTHORIZED"
    | "VALIDATION_FAILED"
    | "RATE_LIMITED"
    | "NOT_FOUND"
    | "INTERNAL";
}

/**
 * Zod validation failed. Carries per-field errors for inline form feedback.
 *
 * Usage: `throw new ValidationError('Check the highlighted fields.', fieldErrors)`
 */
export class ValidationError extends AppError {
  readonly code = "VALIDATION_FAILED" as const;
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * No valid Supabase session, expired session, or the user doesn't own the
 * requested resource.
 *
 * NOTE: `lib/auth/server.ts` ships a minimal `UnauthorizedError` for Unit 4.
 * This class extends AppError properly. The auth module's class is kept for
 * backward compat; actions should import this one going forward.
 */
export class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED" as const;
  constructor(message = "You need to be signed in to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** The requested resource does not exist or is not owned by the caller. */
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND" as const;
  constructor(message = "Resource not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Per-user rate limit exceeded.
 *
 * `retryAfterSeconds` is safe to surface in the UI ("try again in N seconds").
 */
export class RateLimitedError extends AppError {
  readonly code = "RATE_LIMITED" as const;
  constructor(
    message = "Too many requests. Slow down and try again in a moment.",
    public readonly retryAfterSeconds = 60,
  ) {
    super(message);
    this.name = "RateLimitedError";
  }
}

/**
 * An LLM vendor call failed — Claude / Voyage / Groq returned a 5xx,
 * timed out, or violated a content policy.
 */
export class LLMError extends AppError {
  readonly code = "INTERNAL" as const;
  constructor(message = "AI service temporarily unavailable. Please try again.") {
    super(message);
    this.name = "LLMError";
  }
}

/**
 * A non-LLM external service call failed — Google Calendar, Resend, Inngest.
 */
export class ExternalServiceError extends AppError {
  readonly code = "INTERNAL" as const;
  constructor(
    message = "An external service call failed. Please try again.",
    public readonly service?: string,
  ) {
    super(message);
    this.name = "ExternalServiceError";
  }
}
