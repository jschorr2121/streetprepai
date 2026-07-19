import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import { OutreachDrawer } from "@/components/relationships/outreach-drawer";
import type { Contact } from "@/lib/types";

const { toastErrorMock, toastSuccessMock, writeTextMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  writeTextMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));

const contact: Contact = {
  id: "c1",
  name: "Alex Chen",
  firm: "Goldman Sachs",
  title: "Analyst",
  stage: "cold",
  tags: [],
  linkedinBio: "Worked in TMT for three years.",
};

describe("OutreachDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  it("disables Generate when there is no LinkedIn context", () => {
    render(
      <OutreachDrawer
        contact={{ ...contact, linkedinBio: undefined }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /generate draft/i })).toBeDisabled();
    expect(
      screen.getByText(/add a note about this contact above to enable drafting/i),
    ).toBeInTheDocument();
  });

  it("generates a draft and lets the user pick a subject and copy the email", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        subjects: ["Quick question about your path", "Fellow TMT enthusiast"],
        body: "Hi Alex,\n\nWould love to learn more.",
        followups: [{ when: "1 week", kind: "nudge" }],
      }),
    } as Response);

    render(<OutreachDrawer contact={contact} open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /generate draft/i }));

    expect(await screen.findByText("Quick question about your path")).toBeInTheDocument();
    expect(screen.getByText("Fellow TMT enthusiast")).toBeInTheDocument();
    const body = screen.getByLabelText(/body \(editable\)/i);
    expect(body).toHaveValue("Hi Alex,\n\nWould love to learn more.");

    // Switch to the second subject, then copy.
    fireEvent.click(screen.getByText("Fellow TMT enthusiast"));
    fireEvent.click(screen.getByRole("button", { name: /copy email/i }));

    expect(writeTextMock).toHaveBeenCalledWith(
      "Subject: Fellow TMT enthusiast\n\nHi Alex,\n\nWould love to learn more.",
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Copied to clipboard.");
    expect(await screen.findByRole("button", { name: /copied/i })).toBeInTheDocument();
  });

  it("shows a toast and no draft when the request fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Rate limited." }),
    } as Response);

    render(<OutreachDrawer contact={contact} open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /generate draft/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Rate limited."));
    expect(screen.queryByLabelText(/body \(editable\)/i)).not.toBeInTheDocument();
  });

  it("renders nothing visible when closed", () => {
    render(<OutreachDrawer contact={contact} open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText(/draft cold outreach/i)).not.toBeInTheDocument();
  });
});
