import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ChatPanel } from "@/components/reader/chat-panel";
import { STREAM_ERROR_SENTINEL } from "@/lib/streaming/stream-error";

// Builds a fetch Response stand-in whose body streams the given chunks one
// `reader.read()` call at a time, mirroring /api/chat/stream's plain-text
// deltas (optionally including the in-band error sentinel).
function streamResponse(chunks: string[], opts: { ok?: boolean; status?: number } = {}) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    body: {
      getReader() {
        return {
          async read() {
            if (i < chunks.length) {
              const value = encoder.encode(chunks[i]);
              i += 1;
              return { value, done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    },
  } as unknown as Response;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  // jsdom/happy-dom doesn't implement scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ChatPanel", () => {
  it("shows suggestion prompts before any messages, and fills the input on click", () => {
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);
    expect(screen.getByText("Chat with this guide")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/give me a quiz question on this/i));
    expect(screen.getByPlaceholderText(/ask about this guide/i)).toHaveValue(
      "Give me a quiz question on this.",
    );
  });

  it("sends a message and streams the assistant reply", async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse(["The DCF ", "discounts free cash flow."]));
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);

    const textarea = screen.getByPlaceholderText(/ask about this guide/i);
    fireEvent.change(textarea, { target: { value: "What is a DCF?" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText("What is a DCF?")).toBeInTheDocument();
    expect(await screen.findByText("The DCF discounts free cash flow.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/chat/stream",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          guideTitle: "DCF Basics",
          guideContent: "content",
          messages: [{ role: "user", content: "What is a DCF?" }],
        }),
      }),
    );
    // Input is cleared and stays clear once the reply lands cleanly.
    expect(textarea).toHaveValue("");
  });

  it("sends on Enter (without shift) and ignores shift+Enter", () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse(["ok"]));
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);
    const textarea = screen.getByPlaceholderText(/ask about this guide/i);

    fireEvent.change(textarea, { target: { value: "Shift enter should not send" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("disables sending while streaming and when the input is empty", () => {
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);
    const sendButton = screen.getByRole("button", { name: /send message/i });
    expect(sendButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/ask about this guide/i), {
      target: { value: "hi" },
    });
    expect(sendButton).toBeEnabled();
  });

  it("shows a rate-limit message and restores the typed prompt on HTTP 429", async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse([], { ok: false, status: 429 }));
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);

    const textarea = screen.getByPlaceholderText(/ask about this guide/i);
    fireEvent.change(textarea, { target: { value: "Another question" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/sending messages too quickly/i)).toBeInTheDocument();
    // The prompt is restored so a retry is one click.
    expect(textarea).toHaveValue("Another question");
  });

  it("shows a session-expired message on HTTP 401", async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse([], { ok: false, status: 401 }));
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);
    fireEvent.change(screen.getByPlaceholderText(/ask about this guide/i), {
      target: { value: "hi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/your session expired/i)).toBeInTheDocument();
  });

  it("splits an in-band stream error, rendering both the partial content and the error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      streamResponse([`Here's the start.${STREAM_ERROR_SENTINEL}The stream dropped.`]),
    );
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);

    const textarea = screen.getByPlaceholderText(/ask about this guide/i);
    fireEvent.change(textarea, { target: { value: "Explain it" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Here's the start.")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("The stream dropped.");
    // The prompt is restored so the user can retry.
    expect(textarea).toHaveValue("Explain it");
  });

  it("shows a generic error and restores the prompt when the request throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    render(<ChatPanel guideTitle="DCF Basics" guideContent="content" />);

    const textarea = screen.getByPlaceholderText(/ask about this guide/i);
    fireEvent.change(textarea, { target: { value: "hello?" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/sorry, something went wrong\. please try again in a moment\./i),
    ).toBeInTheDocument();
    await waitFor(() => expect(textarea).toHaveValue("hello?"));
  });
});
