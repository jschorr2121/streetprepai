import { describe, expect, it } from "vitest";
import { ASSISTANT_TOOLS_OPENAI } from "@/lib/ai/assistant-tools-openai";

// The exported entries are typed as `ChatCompletionTool` (a union including
// custom-tool variants) — we narrow to the function-tool shape for assertion.
type FnTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: { type: string; properties?: Record<string, unknown>; required?: string[] };
  };
};

const tools = ASSISTANT_TOOLS_OPENAI as unknown as FnTool[];

describe("ASSISTANT_TOOLS_OPENAI", () => {
  it("declares each tool as a function-typed entry with name + parameters", () => {
    for (const tool of tools) {
      expect(tool.type).toBe("function");
      expect(typeof tool.function.name).toBe("string");
      expect(tool.function.name.length).toBeGreaterThan(0);
      expect(tool.function.parameters).toBeTruthy();
      expect(tool.function.parameters.type).toBe("object");
    }
  });

  it("includes the same names as the Anthropic tool set (minus web_search)", () => {
    const names = tools.map((t) => t.function.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "get_resume",
        "get_applied_jobs",
        "list_contacts",
        "get_contact",
        "get_upcoming_events",
        "search_chat_logs",
      ]),
    );
    // OpenAI build does not include the server-side web_search tool.
    expect(names).not.toContain("web_search");
  });

  it("get_applied_jobs has the expected stage enum", () => {
    const tool = tools.find((t) => t.function.name === "get_applied_jobs");
    expect(tool).toBeTruthy();
    const stage = (
      tool!.function.parameters.properties as {
        stage: { enum: string[] };
      }
    ).stage;
    expect(stage.enum).toEqual([
      "shortlist",
      "applied",
      "interview",
      "superday",
      "offer",
      "rejected",
    ]);
  });

  it("get_contact requires contactId", () => {
    const tool = tools.find((t) => t.function.name === "get_contact");
    expect(tool!.function.parameters.required).toEqual(["contactId"]);
  });

  it("search_chat_logs requires query", () => {
    const tool = tools.find((t) => t.function.name === "search_chat_logs");
    expect(tool!.function.parameters.required).toEqual(["query"]);
  });
});
