import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseJson } from "@/lib/validation/parse";

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
});

function jsonRequest(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
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
});
