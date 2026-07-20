/**
 * Server Component test for ProgressPage (app/(app)/progress/page.tsx).
 *
 * Exercises the page's own branching over real `summarizeActivity` /
 * `weakestTopics` output: the "no data yet" vs "weak areas found" copy in
 * the focus section, and the "—" vs percentage rendering for overall
 * mastery — both computed inline in the page, not delegated.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import ProgressPage from "@/app/(app)/progress/page";
import { chapters } from "@/lib/curriculum/chapters";
import { fakeUser } from "@/tests/fixtures/user";
import type { TopicMasteryEntry } from "@/lib/types";

const {
  requireUserMock,
  withUserMock,
  listTopicMasteryMock,
  listRecentAttemptsMock,
  countDueReviewsMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  withUserMock: vi.fn(),
  listTopicMasteryMock: vi.fn(),
  listRecentAttemptsMock: vi.fn(),
  countDueReviewsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));
vi.mock("@/lib/db/queries/curriculum", () => ({ listTopicMastery: listTopicMasteryMock }));
vi.mock("@/lib/db/queries/qbank", () => ({
  countDueReviews: countDueReviewsMock,
  listRecentAttempts: listRecentAttemptsMock,
}));

function setup(opts: {
  mastery?: TopicMasteryEntry[];
  attempts?: { answeredAt: string }[];
  dueCount?: number;
}) {
  requireUserMock.mockResolvedValue(fakeUser());
  withUserMock.mockImplementation(async (_claims: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({}),
  );
  listTopicMasteryMock.mockResolvedValue(opts.mastery ?? []);
  listRecentAttemptsMock.mockResolvedValue(opts.attempts ?? []);
  countDueReviewsMock.mockResolvedValue(opts.dueCount ?? 0);
}

describe("ProgressPage", () => {
  it("shows the honest zero-state before any question has ever been answered", async () => {
    setup({ mastery: [], attempts: [], dueCount: 0 });

    render(await ProgressPage());

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/answer questions to start tracking/i)).toBeInTheDocument();
    expect(
      screen.getByText(/answer a few questions and your weakest areas will show up here/i),
    ).toBeInTheDocument();
    // Streak count and this-week count both render as bare "0"s.
    expect(screen.getAllByText("0", { exact: true }).length).toBe(2);
  });

  it("shows overall mastery, this-week count, and ranked weak topics once questions are graded", async () => {
    const mastery: TopicMasteryEntry[] = [
      { topic: "accounting", score: 0.4, attempts: 6 },
      { topic: "valuation", score: 0.6, attempts: 4 },
    ];
    const now = new Date();
    const attempts = [
      { answeredAt: now.toISOString() },
      { answeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    setup({ mastery, attempts, dueCount: 3 });

    render(await ProgressPage());

    // overallMastery = mean(0.4, 0.6) = 0.5 → "50%"
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/across 2 topics practiced/i)).toBeInTheDocument();
    expect(screen.getByText(/3 due for review/i)).toBeInTheDocument();

    const accountingLabel = chapters.find((c) => c.topic === "accounting")!.shortTitle;
    // Renders once in the ranked "Focus today" list and once in the full
    // "Mastery by topic" grid.
    expect(screen.getAllByText(accountingLabel).length).toBe(2);
    expect(screen.getByText("40% mastered")).toBeInTheDocument();
    expect(
      screen.queryByText(/answer a few questions and your weakest areas/i),
    ).not.toBeInTheDocument();
  });
});
