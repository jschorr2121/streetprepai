import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";

import { AssistantChat } from "@/app/(app)/tools/chatbot/_components/chat";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: ({ messages }: { messages: UIMessage[] }) => ({
    messages,
    sendMessage: vi.fn(),
    status: "ready",
    error: undefined,
  }),
}));

function fakeMessage(id: string, text: string): UIMessage {
  return { id, role: "user", parts: [{ type: "text", text }] };
}

describe("AssistantChat truncation notice", () => {
  it("shows a truncation notice above the messages when the page load hit the message cap", () => {
    const messages = [fakeMessage("m1", "Hello")];
    render(
      <AssistantChat initialThreadId="thread-1" initialMessages={messages} truncated={true} />,
    );

    expect(
      screen.getByText(`Showing the most recent ${messages.length} messages.`),
    ).toBeInTheDocument();
  });

  it("shows no notice when the load wasn't truncated", () => {
    const messages = [fakeMessage("m1", "Hello")];
    render(
      <AssistantChat initialThreadId="thread-1" initialMessages={messages} truncated={false} />,
    );

    expect(screen.queryByText(/Showing the most recent/)).not.toBeInTheDocument();
  });
});
