import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FirmPastChats } from "@/components/firms/firm-past-chats";
import { fakeChatLog, fakeContact } from "@/tests/fixtures/contact";

describe("FirmPastChats", () => {
  it("renders nothing when there are no matches", () => {
    const { container } = render(<FirmPastChats firmName="Goldman Sachs" matches={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("links each match to the contact's relationship page and shows advice excerpts", () => {
    const contact = fakeContact({ id: "c_42", name: "Alex Chen" });
    const log = fakeChatLog({
      id: "chat_42",
      structured: {
        topics: ["deal flow"],
        adviceGiven: ["read M&I 400", "network early", "this third one should be truncated out"],
        commitments: [],
        personalDetails: [],
        followUps: [],
      },
    });

    render(<FirmPastChats firmName="Goldman Sachs" matches={[{ log, contact }]} />);

    expect(screen.getByText(/Past chats mentioning Goldman Sachs/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Alex Chen/ });
    expect(link).toHaveAttribute("href", "/tools/relationships/c_42");
    // Only the first two advice items are shown (adviceExcerpt.slice(0, 2)).
    expect(screen.getByText("read M&I 400")).toBeInTheDocument();
    expect(screen.getByText("network early")).toBeInTheDocument();
    expect(screen.queryByText("this third one should be truncated out")).not.toBeInTheDocument();
  });

  it("falls back to topic badges when there is no advice given", () => {
    const contact = fakeContact({ id: "c_1" });
    const log = fakeChatLog({
      structured: {
        topics: ["SaaS LBO", "deal flow"],
        adviceGiven: [],
        commitments: [],
        personalDetails: [],
        followUps: [],
      },
    });

    render(<FirmPastChats firmName="Evercore" matches={[{ log, contact }]} />);

    expect(screen.getByText("SaaS LBO")).toBeInTheDocument();
    expect(screen.getByText("deal flow")).toBeInTheDocument();
  });

  it("falls back to raw notes when there is neither advice nor topics", () => {
    const contact = fakeContact({ id: "c_1" });
    const log = fakeChatLog({ structured: undefined, rawNotes: "Chatted about the desk culture." });

    render(<FirmPastChats firmName="Moelis" matches={[{ log, contact }]} />);

    expect(screen.getByText("Chatted about the desk culture.")).toBeInTheDocument();
  });
});
