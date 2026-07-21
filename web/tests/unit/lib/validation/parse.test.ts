import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseJson } from "@/lib/validation/parse";

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
});

function jsonRequest(body: string, extraHeaders?: Record<string, string>): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...extraHeaders },
    body,
  });
}

describe("parseJson", () => {
  it("returns ok:true with the parsed data for a valid body", async () => {
    const req = jsonRequest(JSON.stringify({ name: "Jake", age: 21 }));
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: "Jake", age: 21 });
    }
  });

  it("returns a typed 400 Response with 'Invalid JSON' when the body isn't valid JSON", async () => {
    const req = jsonRequest("this is not json");
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body).toEqual({ error: "Invalid JSON" });
    }
  });

  it("returns a typed 400 Response with issues when the body fails schema validation", async () => {
    const req = jsonRequest(JSON.stringify({ name: "", age: -5 }));
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Invalid request body");
      expect(Array.isArray(body.issues)).toBe(true);
      expect(body.issues.length).toBeGreaterThan(0);
    }
  });

  it("returns a validation failure when a required field is missing entirely", async () => {
    const req = jsonRequest(JSON.stringify({ age: 20 }));
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(body.issues.some((issue: { path: unknown[] }) => issue.path[0] === "name")).toBe(true);
    }
  });

  it("treats an empty body as invalid JSON (req.json() throws on empty string)", async () => {
    const req = jsonRequest("");
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(body).toEqual({ error: "Invalid JSON" });
    }
  });

  it("rejects an oversized declared Content-Length with a 413 before reading the body", async () => {
    // The body itself isn't valid JSON. If parseJson attempted to read/parse
    // it, it would fail with the 400 "Invalid JSON" path instead — a 413
    // here proves the Content-Length guard short-circuited before any read.
    const req = jsonRequest("this is not valid json", { "content-length": "10000" });
    const result = await parseJson(req, schema, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
      const body = await result.response.json();
      expect(body).toEqual({ error: "Request body is too large." });
    }
  });

  it("falls through to a normal parse when Content-Length is missing, regardless of maxBytes", async () => {
    const req = jsonRequest(JSON.stringify({ name: "Jake", age: 21 }));
    // No content-length header is set, so the guard can't evaluate size and
    // must fall through — even with a tiny maxBytes, the real body (well
    // under it) still parses successfully.
    const result = await parseJson(req, schema, 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: "Jake", age: 21 });
    }
  });

  it("accepts a declared Content-Length within the cap", async () => {
    const body = JSON.stringify({ name: "Jake", age: 21 });
    const req = jsonRequest(body, { "content-length": String(body.length) });
    const result = await parseJson(req, schema, 1_000);
    expect(result.ok).toBe(true);
  });
});
