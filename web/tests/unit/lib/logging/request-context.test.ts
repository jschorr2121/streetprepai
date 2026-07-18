import { describe, expect, it } from "vitest";

import { extractRequestId, getRequestLogger } from "@/lib/logging/request-context";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reqWithHeader(value: string | undefined): Request {
  const headers: Record<string, string> = {};
  if (value !== undefined) headers["x-request-id"] = value;
  return new Request("http://localhost/api/test", { headers });
}

describe("extractRequestId", () => {
  it("returns the x-request-id header verbatim when present and within the length limit", () => {
    expect(extractRequestId(reqWithHeader("client-trace-123"))).toBe("client-trace-123");
  });

  it("accepts a header exactly at the 200-char boundary", () => {
    const id = "a".repeat(200);
    expect(extractRequestId(reqWithHeader(id))).toBe(id);
  });

  it("falls back to a generated id when the header exceeds 200 chars", () => {
    const tooLong = "a".repeat(201);
    const result = extractRequestId(reqWithHeader(tooLong));
    expect(result).not.toBe(tooLong);
    expect(result).toMatch(UUID_RE);
  });

  it("falls back to a generated id when the header is absent", () => {
    const result = extractRequestId(reqWithHeader(undefined));
    expect(result).toMatch(UUID_RE);
  });

  it("falls back to a generated id when the header is present but empty", () => {
    // Request.headers.get() normalizes an explicitly empty header to "", which
    // fails the `fromHeader.length > 0` check.
    const req = new Request("http://localhost/api/test", { headers: { "x-request-id": "" } });
    const result = extractRequestId(req);
    expect(result).toMatch(UUID_RE);
  });

  it("generates a different id on each call with no header (not cached/stable)", () => {
    const a = extractRequestId(reqWithHeader(undefined));
    const b = extractRequestId(reqWithHeader(undefined));
    expect(a).not.toBe(b);
  });
});

describe("getRequestLogger", () => {
  it("binds requestId and routeKey from the request, without throwing", () => {
    const req = reqWithHeader("my-request-id");
    const log = getRequestLogger(req, "curriculum/progress");
    expect(log.bindings()).toMatchObject({
      requestId: "my-request-id",
      routeKey: "curriculum/progress",
    });
  });

  it("includes userId in the bindings only when provided", () => {
    const req = reqWithHeader("my-request-id-2");
    const withUser = getRequestLogger(req, "curriculum/progress", "user-1");
    expect(withUser.bindings()).toMatchObject({ userId: "user-1" });

    const withoutUser = getRequestLogger(req, "curriculum/progress");
    expect(withoutUser.bindings().userId).toBeUndefined();
  });
});
