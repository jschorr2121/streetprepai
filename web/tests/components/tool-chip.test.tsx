import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ToolChip } from "@/app/(app)/tools/chatbot/_components/chat";

describe("ToolChip", () => {
  it("renders a friendly label and result count for a settled tool call", () => {
    render(
      <ToolChip
        toolName="search_chat_logs"
        state="output-available"
        output={{ count: 3, hits: [] }}
      />,
    );
    expect(screen.getByText(/Searched your chat logs — 3 results/)).toBeInTheDocument();
  });

  it("pluralizes correctly for a single array result", () => {
    render(<ToolChip toolName="list_contacts" state="output-available" output={[{ id: "c1" }]} />);
    expect(screen.getByText(/Checked: your contacts — 1 result$/)).toBeInTheDocument();
  });

  it("expands to show the consulted output", () => {
    render(
      <ToolChip
        toolName="get_applied_jobs"
        state="output-available"
        output={{ count: 1, byStage: { superday: [{ firm: "Goldman Sachs" }] } }}
      />,
    );
    expect(screen.getByText(/Goldman Sachs/)).toBeInTheDocument();
  });

  it("marks failed lookups without leaking raw error internals", () => {
    render(
      <ToolChip toolName="get_resume" state="output-error" errorText="Tool get_resume failed" />,
    );
    expect(screen.getByText(/Checked: your resume — failed/)).toBeInTheDocument();
    expect(screen.getByText("Tool get_resume failed")).toBeInTheDocument();
  });

  it("shows an in-flight state while the tool is still running", () => {
    render(<ToolChip toolName="search_chat_logs" state="input-available" />);
    expect(screen.getByText(/Searched your chat logs/)).toBeInTheDocument();
  });

  it("falls back to a humanized tool name for unknown tools", () => {
    render(<ToolChip toolName="get_firm" state="output-available" output={[]} />);
    expect(screen.getByText(/get firm — 0 results/)).toBeInTheDocument();
  });
});

describe("SourceList", () => {
  it("renders deduped web citations with domain and skips bad URLs", async () => {
    const { SourceList } = await import("@/app/(app)/tools/chatbot/_components/chat");
    render(
      <SourceList
        parts={[
          { type: "text", text: "answer" },
          { type: "source-url", sourceId: "s1", url: "https://www.ft.com/x", title: "FT story" },
          { type: "source-url", sourceId: "s2", url: "https://www.ft.com/x", title: "dup" },
          { type: "source-url", sourceId: "s3", url: "not a url", title: "broken" },
          { type: "source-url", sourceId: "s4", url: "https://reuters.com/y" },
        ]}
      />,
    );
    expect(screen.getByText("Sources")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://www.ft.com/x");
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]!.getAttribute("rel")).toContain("noopener");
    // Untitled source falls back to its domain as the link text.
    expect(links[1]).toHaveTextContent("reuters.com");
  });

  it("renders nothing when there are no source parts", async () => {
    const { SourceList } = await import("@/app/(app)/tools/chatbot/_components/chat");
    const { container } = render(<SourceList parts={[{ type: "text", text: "hi" }]} />);
    expect(container.innerHTML).toBe("");
  });
});
