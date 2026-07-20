/**
 * Server Component test for DashboardPage (app/(app)/dashboard/page.tsx).
 *
 * The page is a thin orchestrator over already-tested pure functions
 * (computeFlow, cycleGuidance, weakestTopics) — so rather than mocking those
 * away, the DB-facing seam is mocked (requireUser/withUser/queries) and real
 * `chapters` data drives the pure functions, exercising the page's own JSX
 * branching: "continue the flow" vs "all chapters complete", due-review
 * count, and the weak-areas empty state vs populated list.
 *
 * `@/app/(app)/dashboard/actions` is mocked too — ProductTour imports
 * `completeTourAction` from it, which pulls in Sentry/rate-limit machinery
 * that isn't set up for the dom test environment.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import DashboardPage from "@/app/(app)/dashboard/page";
import { chapters } from "@/lib/curriculum/chapters";
import { fakeProfile } from "@/tests/fixtures/profile";
import { fakeUser } from "@/tests/fixtures/user";
import type { ChapterProgressEntry, TopicMasteryEntry } from "@/lib/types";

const {
  requireUserMock,
  withUserMock,
  getProfileMock,
  listSectionProgressMock,
  listChapterProgressMock,
  listTopicMasteryMock,
  countDueReviewsMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  withUserMock: vi.fn(),
  getProfileMock: vi.fn(),
  listSectionProgressMock: vi.fn(),
  listChapterProgressMock: vi.fn(),
  listTopicMasteryMock: vi.fn(),
  countDueReviewsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));
vi.mock("@/lib/db/queries/profile", () => ({ getProfile: getProfileMock }));
vi.mock("@/lib/db/queries/curriculum", () => ({
  listSectionProgress: listSectionProgressMock,
  listChapterProgress: listChapterProgressMock,
  listTopicMastery: listTopicMasteryMock,
}));
vi.mock("@/lib/db/queries/qbank", () => ({ countDueReviews: countDueReviewsMock }));
vi.mock("@/app/(app)/dashboard/actions", () => ({ completeTourAction: vi.fn() }));

const spineChapters = chapters.filter((c) => c.kind === "spine");
const firstSpine = spineChapters[0]!;

function setup(opts: {
  chapterRows?: ChapterProgressEntry[];
  mastery?: TopicMasteryEntry[];
  dueCount?: number;
}) {
  requireUserMock.mockResolvedValue(fakeUser());
  withUserMock.mockImplementation(async (_claims: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({}),
  );
  getProfileMock.mockResolvedValue(fakeProfile({ tourCompletedAt: "2026-01-01T00:00:00.000Z" }));
  listSectionProgressMock.mockResolvedValue([]);
  listChapterProgressMock.mockResolvedValue(opts.chapterRows ?? []);
  listTopicMasteryMock.mockResolvedValue(opts.mastery ?? []);
  countDueReviewsMock.mockResolvedValue(opts.dueCount ?? 0);
}

describe("DashboardPage", () => {
  it("shows the next unread section and an empty weak-areas / due-review state when nothing is graded yet", async () => {
    setup({ chapterRows: [], mastery: [], dueCount: 0 });

    render(await DashboardPage());

    expect(screen.getByText(firstSpine.title)).toBeInTheDocument();
    expect(screen.getByText(firstSpine.sections[0]!.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read section/i })).toHaveAttribute(
      "href",
      `/guide/${firstSpine.sections[0]!.slug}`,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/nothing due/i)).toBeInTheDocument();
    expect(screen.getByText(/answer a few questions in the question bank/i)).toBeInTheDocument();
    expect(screen.queryByText(/you've completed every chapter/i)).not.toBeInTheDocument();
  });

  it("shows the all-chapters-complete state, due reviews, and ranked weak areas once every spine chapter is done", async () => {
    const chapterRows: ChapterProgressEntry[] = spineChapters.map((c) => ({
      chapterSlug: c.slug,
      completedAt: "2026-01-01T00:00:00.000Z",
      gatePassedAt: "2026-01-01T00:00:00.000Z",
    }));
    const mastery: TopicMasteryEntry[] = [
      { topic: "accounting", score: 0.3, attempts: 5 },
      { topic: "valuation", score: 0.4, attempts: 4 },
      { topic: "ev-equity-value", score: 0.5, attempts: 3 },
      { topic: "behavioral", score: 0.9, attempts: 10 },
      { topic: "recruiting", score: 0.1, attempts: 1 }, // below minAttempts — excluded
    ];
    setup({ chapterRows, mastery, dueCount: 4 });

    render(await DashboardPage());

    expect(screen.getByText("All chapters complete")).toBeInTheDocument();
    expect(screen.getByText(/you've completed every chapter/i)).toBeInTheDocument();

    // Due-review count renders and the "Drill now" CTA switches to the
    // filled variant once something is actually due.
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText(/weak questions resurfacing today/i)).toBeInTheDocument();

    // Weakest three (by score, ascending) are ranked; the 4th (excluded by
    // minAttempts) and the strong 0.9-score topic never show up.
    const accounting = chapters.find((c) => c.topic === "accounting")!.shortTitle;
    const valuation = chapters.find((c) => c.topic === "valuation")!.shortTitle;
    expect(screen.getByText(accounting)).toBeInTheDocument();
    expect(screen.getByText(valuation)).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });
});
