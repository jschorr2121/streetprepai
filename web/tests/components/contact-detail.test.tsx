import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import { ContactDetail } from "@/components/relationships/contact-detail";
import type { Contact } from "@/lib/types";

const {
  logChatActionMock,
  saveChatSummaryActionMock,
  saveFollowUpDraftActionMock,
  refreshMock,
  toastErrorMock,
  toastSuccessMock,
} = vi.hoisted(() => ({
  logChatActionMock: vi.fn(),
  saveChatSummaryActionMock: vi.fn(),
  saveFollowUpDraftActionMock: vi.fn(),
  refreshMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("@/app/(app)/tools/relationships/actions", () => ({
  logChatAction: logChatActionMock,
  saveChatSummaryAction: saveChatSummaryActionMock,
  saveFollowUpDraftAction: saveFollowUpDraftActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));

const contact: Contact = {
  id: "c1",
  name: "Alex Chen",
  firm: "Goldman Sachs",
  title: "Analyst",
  group: "TMT",
  stage: "warm",
  tags: [],
  linkedinBio: "Three years in TMT investment banking.",
  howMet: "Alumni mixer",
};

/** Builds a fetch mock keyed by URL substring, matched in call order. */
function mockFetchByUrl(handlers: Record<string, () => Promise<Response> | Response>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [key, handler] of Object.entries(handlers)) {
      if (url.includes(key)) return handler();
    }
    throw new Error(`Unhandled fetch URL in test: ${url}`);
  });
}

function streamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return { ok: true, body } as Response;
}

describe("ContactDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the contact header with stage badge and how-met note", () => {
    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    expect(screen.getByRole("heading", { name: "Alex Chen" })).toBeInTheDocument();
    expect(screen.getByText(/Analyst · Goldman Sachs · TMT/)).toBeInTheDocument();
    expect(screen.getByText("warm")).toBeInTheDocument();
    expect(screen.getByText(/Alumni mixer/)).toBeInTheDocument();
  });

  it("shows the empty history state when there are no chats or events", () => {
    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: /history/i }), { button: 0 });
    expect(screen.getByText(/No prior events logged with Alex Chen/)).toBeInTheDocument();
  });

  it("streams and renders the AI prep sheet on Generate", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/api/relationships/prep-person": () =>
          streamResponse("**Hook:** ask about his TMT deals."),
      }),
    );

    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    expect(await screen.findByText(/Hook:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /regenerate/i })).toBeInTheDocument();
  });

  it("shows an inline error when the prep sheet stream fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    expect(
      await screen.findByText(/Sorry, something went wrong generating the prep sheet/),
    ).toBeInTheDocument();
  });

  it("structures notes end-to-end: saves the chat, calls the AI route, and persists the summary", async () => {
    logChatActionMock.mockResolvedValue({ ok: true, data: { id: "chat-1" } });
    saveChatSummaryActionMock.mockResolvedValue({ ok: true, data: { id: "chat-1" } });
    const structured = {
      topics: ["TMT deal flow"],
      adviceGiven: ["Network broadly"],
      commitments: ["Intro to Priya"],
      personalDetails: ["Has a dog named Miso"],
      followUps: [{ description: "Send thank-you note", dueBy: "2026-08-01" }],
    };
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/api/relationships/structure-chat": () =>
          new Response(JSON.stringify(structured), { status: 200 }),
      }),
    );

    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: /log a chat/i }), { button: 0 });

    const textarea = screen.getByPlaceholderText(/30-min zoom with Alex/);
    fireEvent.change(textarea, { target: { value: "Great call, talked shop." } });

    const structureButton = screen.getByRole("button", { name: /structure notes/i });
    expect(structureButton).toBeEnabled();
    fireEvent.click(structureButton);

    await waitFor(() =>
      expect(logChatActionMock).toHaveBeenCalledWith({
        contactId: "c1",
        rawNotes: "Great call, talked shop.",
      }),
    );

    expect(await screen.findByText("TMT deal flow")).toBeInTheDocument();
    expect(screen.getByText("Intro to Priya")).toBeInTheDocument();
    expect(screen.getByText("Has a dog named Miso")).toBeInTheDocument();
    expect(screen.getByText(/Send thank-you note/)).toBeInTheDocument();

    await waitFor(() =>
      expect(saveChatSummaryActionMock).toHaveBeenCalledWith({
        chatId: "chat-1",
        structured,
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Chat logged — scroll down to draft the follow-up.",
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("stops after logChatAction fails and never calls the structuring route", async () => {
    logChatActionMock.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Couldn't save the chat." },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: /log a chat/i }), { button: 0 });

    fireEvent.change(screen.getByPlaceholderText(/30-min zoom with Alex/), {
      target: { value: "Rough notes." },
    });
    fireEvent.click(screen.getByRole("button", { name: /structure notes/i }));

    await waitFor(() => expect(logChatActionMock).toHaveBeenCalledTimes(1));
    expect(toastErrorMock).toHaveBeenCalledWith("Couldn't save the chat.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a friendly rate-limit message when structuring returns 429", async () => {
    logChatActionMock.mockResolvedValue({ ok: true, data: { id: "chat-1" } });
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/api/relationships/structure-chat": () => new Response(null, { status: 429 }),
      }),
    );

    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: /log a chat/i }), { button: 0 });
    fireEvent.change(screen.getByPlaceholderText(/30-min zoom with Alex/), {
      target: { value: "Rough notes." },
    });
    fireEvent.click(screen.getByRole("button", { name: /structure notes/i }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Notes saved. You're going too fast — give it a minute, then structure again.",
      ),
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("warns that voice capture is unsupported when the browser has no mediaDevices", () => {
    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: /log a chat/i }), { button: 0 });

    fireEvent.click(screen.getByTitle(/record voice memo/i));

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Your browser doesn't support voice capture. Type instead.",
    );
  });

  it("opens the outreach drawer from the header action", () => {
    render(<ContactDetail contact={contact} chatLogs={[]} events={[]} />);
    expect(screen.queryByText(/draft cold outreach to alex chen/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /draft cold outreach/i }));

    expect(screen.getByText(/draft cold outreach to alex chen/i)).toBeInTheDocument();
  });
});
