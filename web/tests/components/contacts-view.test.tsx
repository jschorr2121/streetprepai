import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import { ContactsView } from "@/components/relationships/contacts-view";
import type { CalendarEvent, ChatLog, Contact } from "@/lib/types";

const { updateContactStageActionMock, pushMock, refreshMock, toastErrorMock } = vi.hoisted(() => ({
  updateContactStageActionMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/app/(app)/tools/relationships/actions", () => ({
  updateContactStageAction: updateContactStageActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: vi.fn() },
}));

const alex: Contact = {
  id: "c1",
  name: "Alex Chen",
  firm: "Goldman Sachs",
  title: "Analyst",
  group: "TMT",
  stage: "cold",
  tags: [],
};

const priya: Contact = {
  id: "c2",
  name: "Priya Rao",
  firm: "Morgan Stanley",
  title: "Associate",
  stage: "warm",
  tags: ["mentor"],
};

const contacts: Contact[] = [alex, priya];

const chatLogs: ChatLog[] = [
  {
    id: "l1",
    contactId: "c2",
    happenedAt: "2026-01-01",
    rawNotes: "Talked about her path into M&A.",
  },
];

describe("ContactsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to the Contacts tab when there are no calendar events", () => {
    render(<ContactsView contacts={contacts} chatLogs={[]} events={[]} />);
    expect(screen.getByRole("list", { name: /your contacts/i })).toBeInTheDocument();
  });

  it("defaults to the Calendar tab when events exist", () => {
    const events: CalendarEvent[] = [
      {
        id: "e1",
        contactId: "c1",
        kind: "coffee-chat",
        title: "Coffee with Alex",
        startsAt: new Date().toISOString(),
        durationMinutes: 30,
        status: "upcoming",
      },
    ];
    render(<ContactsView contacts={contacts} chatLogs={[]} events={events} />);
    expect(screen.getByText("Coffee with Alex")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /your contacts/i })).not.toBeInTheDocument();
  });

  it("labels the search input for assistive tech", () => {
    render(<ContactsView contacts={contacts} chatLogs={[]} events={[]} />);
    expect(screen.getByRole("textbox", { name: /search contacts and notes/i })).toBeVisible();
  });

  it("filters contacts by the search query", () => {
    render(<ContactsView contacts={contacts} chatLogs={[]} events={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/search everyone/i), {
      target: { value: "morgan" },
    });
    expect(screen.getByText("Priya Rao")).toBeInTheDocument();
    expect(screen.queryByText("Alex Chen")).not.toBeInTheDocument();
  });

  it("filters contacts by stage", () => {
    render(<ContactsView contacts={contacts} chatLogs={[]} events={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Warm" }));
    expect(screen.getByText("Priya Rao")).toBeInTheDocument();
    expect(screen.queryByText("Alex Chen")).not.toBeInTheDocument();
  });

  it("shows an empty state when no contact matches the filters", () => {
    render(<ContactsView contacts={contacts} chatLogs={[]} events={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/search everyone/i), {
      target: { value: "nobody-here" },
    });
    expect(screen.getByText("No contacts matching those filters.")).toBeInTheDocument();
  });

  it("searches chat notes and links back to the contact", () => {
    render(<ContactsView contacts={contacts} chatLogs={chatLogs} events={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/search everyone/i), {
      target: { value: "M&A" },
    });
    // Radix Tabs switches tab on mousedown, not click.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /search notes/i }), { button: 0 });
    expect(screen.getByText("Talked about her path into M&A.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /priya rao/i })).toHaveAttribute(
      "href",
      "/tools/relationships/c2",
    );
  });

  it("moves a contact to a new stage on the pipeline and reverts on failure", async () => {
    updateContactStageActionMock.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Couldn't move the contact." },
    });

    render(<ContactsView contacts={contacts} chatLogs={[]} events={[]} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: /pipeline/i }), { button: 0 });

    // Alex starts in the Cold column — scope to it via the column heading to
    // avoid matching his card's own "Cold" stage-dropdown trigger.
    const coldHeading = screen.getByRole("heading", { name: "Cold" });
    const coldColumn = coldHeading.closest("div")!.parentElement!;
    expect(within(coldColumn).getByText("Alex Chen")).toBeInTheDocument();

    // Open Alex's stage dropdown (Radix DropdownMenu opens on pointerdown).
    fireEvent.pointerDown(within(coldColumn).getByRole("button", { name: /cold/i }), {
      button: 0,
    });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Warm" }));

    await waitFor(() =>
      expect(updateContactStageActionMock).toHaveBeenCalledWith({ id: "c1", stage: "warm" }),
    );
    expect(toastErrorMock).toHaveBeenCalledWith("Couldn't move the contact.");
  });
});
