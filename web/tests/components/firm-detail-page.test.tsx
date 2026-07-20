/**
 * Server Component test for FirmPage (app/(app)/firms/[slug]/page.tsx).
 *
 * The page's only real logic (beyond wiring already-tested child components —
 * see firm-prep.test.tsx / firm-past-chats.test.tsx) is the string-match
 * recall that decides which of the user's chat logs "mention" this firm.
 * That's the behavior under test here, plus the notFound branch.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import FirmPage from "@/app/(app)/firms/[slug]/page";
import { fakeChatLog, fakeContact } from "@/tests/fixtures/contact";
import { fakeUser } from "@/tests/fixtures/user";
import type { Firm } from "@/lib/types";

const { requireUserMock, getFirmBySlugMock, getChatLogsMock, getContactsMock, notFoundMock } =
  vi.hoisted(() => ({
    requireUserMock: vi.fn(),
    getFirmBySlugMock: vi.fn(),
    getChatLogsMock: vi.fn(),
    getContactsMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  }));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/data/firms", () => ({ getFirmBySlug: getFirmBySlugMock }));
vi.mock("@/lib/data/contacts", () => ({
  getChatLogs: getChatLogsMock,
  getContacts: getContactsMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

const goldman: Firm = {
  slug: "goldman-sachs",
  name: "Goldman Sachs",
  tier: "bulge-bracket",
  hq: "New York, NY",
  description: "A bulge-bracket bank.",
};

beforeEach(() => {
  requireUserMock.mockResolvedValue(fakeUser());
});

describe("FirmPage", () => {
  it("calls notFound when the firm slug doesn't exist", async () => {
    getFirmBySlugMock.mockResolvedValue(null);
    getChatLogsMock.mockResolvedValue([]);
    getContactsMock.mockResolvedValue([]);

    await expect(FirmPage({ params: Promise.resolve({ slug: "nonexistent" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("surfaces past chats whose contact works at the firm", async () => {
    getFirmBySlugMock.mockResolvedValue(goldman);
    const contact = fakeContact({ id: "c_gs", name: "Alex Chen", firm: "Goldman Sachs" });
    const log = fakeChatLog({ contactId: "c_gs", id: "chat_gs" });
    getContactsMock.mockResolvedValue([contact]);
    getChatLogsMock.mockResolvedValue([log]);

    const jsx = await FirmPage({ params: Promise.resolve({ slug: "goldman-sachs" }) });
    render(jsx);

    expect(screen.getByText(/past chats mentioning goldman sachs/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alex chen/i })).toHaveAttribute(
      "href",
      "/tools/relationships/c_gs",
    );
  });

  it("shows no past-chats section when no chat log mentions the firm", async () => {
    getFirmBySlugMock.mockResolvedValue(goldman);
    const contact = fakeContact({ id: "c_ms", name: "Sam Lee", firm: "Morgan Stanley" });
    const log = fakeChatLog({
      contactId: "c_ms",
      rawNotes: "Talked about their group and the desk.",
      structured: {
        topics: ["group culture"],
        adviceGiven: [],
        commitments: [],
        personalDetails: [],
        followUps: [],
      },
    });
    getContactsMock.mockResolvedValue([contact]);
    getChatLogsMock.mockResolvedValue([log]);

    const jsx = await FirmPage({ params: Promise.resolve({ slug: "goldman-sachs" }) });
    render(jsx);

    expect(screen.queryByText(/past chats mentioning/i)).not.toBeInTheDocument();
  });
});
