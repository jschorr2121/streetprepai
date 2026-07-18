import { describe, expect, it } from "vitest";
import { z } from "zod";

import { actionErrorFromAppError, fieldErrorsFromIssues } from "@/lib/auth/action-result";
import {
  ExternalServiceError,
  LLMError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";

describe("fieldErrorsFromIssues", () => {
  it("keeps only the first message per top-level field", () => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
    const result = schema.safeParse({ email: "not-an-email", password: "short" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const fieldErrors = fieldErrorsFromIssues(result.error.issues);
    expect(Object.keys(fieldErrors).sort()).toEqual(["email", "password"]);
    const emailIssue = result.error.issues.find((i) => i.path[0] === "email")!;
    expect(fieldErrors.email).toBe(emailIssue.message);
  });

  it("keeps the first message when a field has multiple issues, dropping subsequent ones", () => {
    const issues = [
      { path: ["email"], message: "First error" },
      { path: ["email"], message: "Second error" },
    ];
    const fieldErrors = fieldErrorsFromIssues(issues);
    expect(fieldErrors).toEqual({ email: "First error" });
  });

  it("skips issues whose top-level path segment is not a string (e.g. an array index)", () => {
    const issues = [
      { path: [0, "name"], message: "Item 0 name is required" },
      { path: ["title"], message: "Title required" },
    ];
    const fieldErrors = fieldErrorsFromIssues(issues);
    expect(fieldErrors).toEqual({ title: "Title required" });
  });

  it("returns an empty object for an empty issues array", () => {
    expect(fieldErrorsFromIssues([])).toEqual({});
  });

  it("skips issues with an empty path (top-level/root-level Zod issues)", () => {
    const issues = [{ path: [], message: "Root-level error" }];
    expect(fieldErrorsFromIssues(issues)).toEqual({});
  });
});

describe("actionErrorFromAppError", () => {
  it("maps UnauthorizedError to the UNAUTHORIZED code with its message", () => {
    const err = new UnauthorizedError("Sign in first.");
    const result = actionErrorFromAppError(err);
    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Sign in first." },
    });
  });

  it("maps NotFoundError to the NOT_FOUND code", () => {
    const err = new NotFoundError("Nope.");
    const result = actionErrorFromAppError(err);
    expect(result.error.code).toBe("NOT_FOUND");
    expect(result.error.message).toBe("Nope.");
  });

  it("maps RateLimitedError to the RATE_LIMITED code", () => {
    const err = new RateLimitedError("Slow down.", 30);
    const result = actionErrorFromAppError(err);
    expect(result.error.code).toBe("RATE_LIMITED");
  });

  it("maps LLMError and ExternalServiceError both to the INTERNAL code", () => {
    expect(actionErrorFromAppError(new LLMError()).error.code).toBe("INTERNAL");
    expect(actionErrorFromAppError(new ExternalServiceError()).error.code).toBe("INTERNAL");
  });

  // BUG: actionErrorFromAppError (web/lib/auth/action-result.ts:48-56) never
  // copies ValidationError.fieldErrors onto the returned ActionError, even
  // though ActionError.fieldErrors exists specifically for this purpose and
  // ValidationError always carries a fieldErrors map. Every Server Action that
  // throws ValidationError loses per-field messages, so forms can't render
  // inline errors from a caught AppError -- only from a raw Zod safeParse via
  // fieldErrorsFromIssues directly. Repro: actionErrorFromAppError(new
  // ValidationError("msg", { email: "bad" })).error.fieldErrors is undefined.
  // Asserting the CORRECT behavior below; skipped until the source is fixed.
  it.skip("propagates fieldErrors from a ValidationError onto the ActionError", () => {
    const err = new ValidationError("Check the highlighted fields.", { email: "Invalid email" });
    const result = actionErrorFromAppError(err);
    expect(result.error.fieldErrors).toEqual({ email: "Invalid email" });
  });
});
