import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import { RelationshipsTopWidgets } from "@/components/relationships/top-widgets";
import type { Contact } from "@/lib/types";
import type { Followup } from "@/lib/data/followups";

const { completeFollowupActionMock, pushMock, refreshMock, toastErrorMock } = vi.hoisted(() => ({
  completeFollowupActionMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/app/(app)/tools/relationships/actions", () => ({
  completeFollowupAction: completeFollowupActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: vi.fn() },
}));

const now = Date.now();
const eightWeeksAgo = new Date(now - 1000 * 60 * 60 * 24 * 7 * 8).toISOString();

const staleContact: Contact = {
  id: "c1",
  name: "Alex Chen",
  firm: "Goldman Sachs",
  title: "Analyst",
  stage: "warm",
  tags: [],
  lastContactAt: eightWeeksAgo,
};

const freshContact: Contact = {
  id: "c2",
  name: "Priya Rao",
  firm: "Morgan Stanley",
  title: "Associate",
  stage: "coffee-chat",
  tags: [],
  lastContactAt: new Date(now).toISOString(),
};

const followup: Followup = {
  id: "f1",
  contactId: "c2",
  dueAt: new Date(now + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
  kind: "post-chat",
  note: "Send the intro to Priya's contact",
};

describe("RelationshipsTopWidgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there are no stale contacts or follow-ups", () => {
    const { container } = render(
      <RelationshipsTopWidgets contacts={[freshContact]} followups={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows stale contacts under Gentle nudges and follow-ups under Upcoming follow-ups", () => {
    render(
      <RelationshipsTopWidgets contacts={[staleContact, freshContact]} followups={[followup]} />,
    );
    expect(screen.getByText("Gentle nudges")).toBeInTheDocument();
    expect(screen.getByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByText("8w cold")).toBeInTheDocument();
    expect(screen.queryByText("Priya Rao", { selector: "a" })).not.toBeInTheDocument();

    expect(screen.getByText("Upcoming follow-ups")).toBeInTheDocument();
    expect(screen.getByText("Send the intro to Priya's contact")).toBeInTheDocument();
  });

  it("optimistically hides a follow-up on Mark done and reverts if the action fails", async () => {
    completeFollowupActionMock.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Couldn't complete the follow-up." },
    });

    render(<RelationshipsTopWidgets contacts={[freshContact]} followups={[followup]} />);

    fireEvent.click(screen.getByRole("button", { name: /mark follow-up for priya rao done/i }));

    // Optimistically removed right away.
    expect(screen.queryByText("Send the intro to Priya's contact")).not.toBeInTheDocument();

    await waitFor(() => expect(completeFollowupActionMock).toHaveBeenCalledWith({ id: "f1" }));
    // Reverted after the action reports failure.
    expect(await screen.findByText("Send the intro to Priya's contact")).toBeInTheDocument();
    expect(toastErrorMock).toHaveBeenCalledWith("Couldn't complete the follow-up.");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("opens the outreach drawer for a stale contact via Draft check-in", () => {
    render(<RelationshipsTopWidgets contacts={[staleContact]} followups={[]} />);
    expect(screen.queryByText(/draft cold outreach/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /draft check-in/i }));

    expect(screen.getByText(/draft cold outreach to alex chen/i)).toBeInTheDocument();
  });
});
