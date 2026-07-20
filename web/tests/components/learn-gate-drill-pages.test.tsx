/**
 * Server Component tests for the chapter-gate and section-drill pages
 * (app/(app)/learn/[chapter]/practice/page.tsx and
 * app/(app)/learn/[chapter]/drill/[section]/page.tsx).
 *
 * Both pages share the same shape: resolve the chapter/section from the real
 * curriculum manifest (notFound if it doesn't exist or isn't gated/drillable),
 * fetch a question pool, and either show a "no questions yet" fallback or
 * hand off to PracticeSession. PracticeSession's own sequencing/scoring is
 * covered by practice-session.test.tsx, so it's stubbed here — these tests
 * are purely about the two pages' own notFound/empty-state branching.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import ChapterGatePage from "@/app/(app)/learn/[chapter]/practice/page";
import SectionDrillPage from "@/app/(app)/learn/[chapter]/drill/[section]/page";
import { fakeUser } from "@/tests/fixtures/user";
import type { QbankQuestion } from "@/lib/types";

const {
  requireUserMock,
  withUserMock,
  getGateQuestionsMock,
  getSectionDrillQuestionsMock,
  notFoundMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  withUserMock: vi.fn(),
  getGateQuestionsMock: vi.fn(),
  getSectionDrillQuestionsMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));
vi.mock("@/lib/db/queries/qbank", () => ({
  getGateQuestions: getGateQuestionsMock,
  getSectionDrillQuestions: getSectionDrillQuestionsMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/components/learn/practice-session", () => ({
  PracticeSession: ({ title }: { title: string }) => (
    <div data-testid="practice-session">{title}</div>
  ),
}));

function q(id: string): QbankQuestion {
  return {
    id,
    topic: "accounting",
    difficulty: "medium",
    questionType: "short-answer",
    prompt: `Prompt ${id}`,
    keyPoints: [],
    misconceptions: [],
    modelAnswer: "",
    advanced: false,
  };
}

beforeEach(() => {
  requireUserMock.mockResolvedValue(fakeUser());
  withUserMock.mockImplementation(async (_claims: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({}),
  );
});

// Real manifest data: "accounting" is gated with a section
// "income-statement-anatomy"; "behavioral" is a spine chapter that is NOT
// gated, used to exercise the not-gated notFound branch.
describe("ChapterGatePage (chapter gate)", () => {
  it("calls notFound for a chapter slug that doesn't exist", async () => {
    getGateQuestionsMock.mockResolvedValue([]);
    await expect(
      ChapterGatePage({ params: Promise.resolve({ chapter: "not-a-chapter" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getGateQuestionsMock).not.toHaveBeenCalled();
  });

  it("calls notFound for a real chapter that isn't gated", async () => {
    getGateQuestionsMock.mockResolvedValue([]);
    await expect(
      ChapterGatePage({ params: Promise.resolve({ chapter: "behavioral" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows a fallback message when no gate questions are seeded yet", async () => {
    getGateQuestionsMock.mockResolvedValue([]);

    render(await ChapterGatePage({ params: Promise.resolve({ chapter: "accounting" }) }));

    expect(
      screen.getByText(/no gate questions are available for this chapter yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("practice-session")).not.toBeInTheDocument();
  });

  it("renders PracticeSession once gate questions exist", async () => {
    getGateQuestionsMock.mockResolvedValue([q("g1"), q("g2")]);

    render(await ChapterGatePage({ params: Promise.resolve({ chapter: "accounting" }) }));

    expect(screen.getByTestId("practice-session")).toHaveTextContent("Chapter Gate");
  });
});

describe("SectionDrillPage (section drill)", () => {
  it("calls notFound for a section that doesn't exist on the chapter", async () => {
    getSectionDrillQuestionsMock.mockResolvedValue([]);
    await expect(
      SectionDrillPage({
        params: Promise.resolve({ chapter: "accounting", section: "not-a-section" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getSectionDrillQuestionsMock).not.toHaveBeenCalled();
  });

  it("shows a fallback message when no drill questions are seeded yet", async () => {
    getSectionDrillQuestionsMock.mockResolvedValue([]);

    render(
      await SectionDrillPage({
        params: Promise.resolve({ chapter: "accounting", section: "income-statement-anatomy" }),
      }),
    );

    expect(
      screen.getByText(/no drill questions are available for this section yet/i),
    ).toBeInTheDocument();
  });

  it("renders PracticeSession once drill questions exist", async () => {
    getSectionDrillQuestionsMock.mockResolvedValue([q("d1")]);

    render(
      await SectionDrillPage({
        params: Promise.resolve({ chapter: "accounting", section: "income-statement-anatomy" }),
      }),
    );

    expect(screen.getByTestId("practice-session")).toHaveTextContent("Drill —");
  });
});
