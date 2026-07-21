/**
 * Server Component test for InterviewPage
 * (app/(app)/tools/mock-interview/page.tsx).
 *
 * The page's real logic — not covered by mock-studio.test.tsx (which stubs
 * this page's output away) — is:
 *  1. Reads the signed-in user's past sessions via getMockInterviews and caps
 *     the list at RECENT_SESSIONS_LIMIT (10) before handing it to
 *     PastSessions.
 *  2. Renders a genuine empty state when there are no saved sessions.
 * MockStudio and PastSessions are stubbed so the test can assert on exactly
 * the props this page computed and handed them.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import InterviewPage from "@/app/(app)/tools/mock-interview/page";
import { fakeUser } from "@/tests/fixtures/user";
import type { MockInterview } from "@/lib/types";

const { requireUserMock, getMockInterviewsMock } = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  getMockInterviewsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/data/mock-interviews", () => ({ getMockInterviews: getMockInterviewsMock }));

vi.mock("@/components/interview/mock-studio", () => ({
  MockStudio: () => <div data-testid="mock-studio" />,
}));

vi.mock("@/components/interview/past-sessions", () => ({
  PastSessions: ({ sessions }: { sessions: MockInterview[] }) => (
    <ul data-testid="past-sessions">
      {sessions.map((s) => (
        <li key={s.id}>{s.questionText}</li>
      ))}
    </ul>
  ),
}));

function session(id: string, questionText: string): MockInterview {
  return {
    id,
    questionText,
    mode: "technical",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("InterviewPage", () => {
  it("caps past sessions at the latest 10, most-recent first as returned", async () => {
    requireUserMock.mockResolvedValue(fakeUser());
    const sessions = Array.from({ length: 15 }, (_, i) => session(`s${i}`, `Question ${i}`));
    getMockInterviewsMock.mockResolvedValue(sessions);

    render(await InterviewPage({ searchParams: Promise.resolve({}) }));

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(10);
    expect(items[0]!.textContent).toBe("Question 0");
    expect(items[9]!.textContent).toBe("Question 9");
  });

  it("passes an empty list through when the user has no saved sessions", async () => {
    requireUserMock.mockResolvedValue(fakeUser());
    getMockInterviewsMock.mockResolvedValue([]);

    render(await InterviewPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("past-sessions")).toBeEmptyDOMElement();
  });

  it("scopes the read to the signed-in user", async () => {
    const user = fakeUser({ id: "22222222-2222-4222-8222-222222222222" });
    requireUserMock.mockResolvedValue(user);
    getMockInterviewsMock.mockResolvedValue([]);

    await InterviewPage({ searchParams: Promise.resolve({}) });

    expect(getMockInterviewsMock).toHaveBeenCalledWith(user.id);
  });
});
