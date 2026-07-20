/**
 * Server Component test for QuestionBankPage
 * (app/(app)/tools/question-bank/page.tsx).
 *
 * The page's real logic — not delegated anywhere, and not covered by
 * question-bank-studio.test.tsx (which stubs this page's output away) — is:
 *  1. `?topic=` validated against the real topic list, unknown values dropped.
 *  2. The daily set: due reviews first, then fresh questions, deduped by id,
 *     capped at DAILY_TARGET (8).
 * QuestionBankStudio is stubbed so the test can assert on exactly the props
 * this page computed and handed it.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import QuestionBankPage from "@/app/(app)/tools/question-bank/page";
import { fakeUser } from "@/tests/fixtures/user";
import type { QbankQuestion } from "@/lib/types";

const {
  requireUserMock,
  withUserMock,
  countDueReviewsMock,
  listDueReviewsMock,
  listChapterProgressMock,
  getInterleavedQuestionsMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  withUserMock: vi.fn(),
  countDueReviewsMock: vi.fn(),
  listDueReviewsMock: vi.fn(),
  listChapterProgressMock: vi.fn(),
  getInterleavedQuestionsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));
vi.mock("@/lib/db/queries/qbank", () => ({
  countDueReviews: countDueReviewsMock,
  listDueReviews: listDueReviewsMock,
  getInterleavedQuestions: getInterleavedQuestionsMock,
}));
vi.mock("@/lib/db/queries/curriculum", () => ({ listChapterProgress: listChapterProgressMock }));

vi.mock("@/components/learn/question-bank-studio", () => ({
  QuestionBankStudio: ({
    dueCount,
    dailyQuestions,
    initialTopic,
  }: {
    dueCount: number;
    dailyQuestions: { id: string; prompt: string }[];
    initialTopic?: string;
  }) => (
    <div>
      <p data-testid="due-count">{dueCount}</p>
      <p data-testid="initial-topic">{initialTopic ?? "none"}</p>
      <ul>
        {dailyQuestions.map((q) => (
          <li key={q.id}>{q.prompt}</li>
        ))}
      </ul>
    </div>
  ),
}));

function q(id: string, prompt: string): QbankQuestion {
  return {
    id,
    topic: "accounting",
    difficulty: "medium",
    questionType: "short-answer",
    prompt,
    keyPoints: [],
    misconceptions: [],
    modelAnswer: "",
    advanced: false,
  };
}

function setup(opts: { dueCount?: number; due?: QbankQuestion[]; fresh?: QbankQuestion[] }) {
  requireUserMock.mockResolvedValue(fakeUser());
  withUserMock.mockImplementation(async (_claims: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({}),
  );
  countDueReviewsMock.mockResolvedValue(opts.dueCount ?? 0);
  listDueReviewsMock.mockResolvedValue(opts.due ?? []);
  listChapterProgressMock.mockResolvedValue([]);
  getInterleavedQuestionsMock.mockResolvedValue(opts.fresh ?? []);
}

describe("QuestionBankPage", () => {
  it("puts due reviews first, dedupes by id against the fresh pool, and caps at the daily target", async () => {
    const due = [q("q1", "Due one"), q("q2", "Due two")];
    // q2 also shows up in the fresh pool — must not be duplicated. Fresh
    // pool has 8 more unique ids so the combined pool (2 due + 8 fresh - 1
    // dup = 9) exceeds DAILY_TARGET (8) and gets capped.
    const fresh = [
      q("q2", "Due two (duplicate)"),
      ...Array.from({ length: 8 }, (_, i) => q(`f${i}`, `Fresh ${i}`)),
    ];
    setup({ dueCount: 5, due, fresh });

    render(await QuestionBankPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("due-count").textContent).toBe("5");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(8);
    expect(items[0]!.textContent).toBe("Due one");
    expect(items[1]!.textContent).toBe("Due two");
    // The duplicate fresh copy of q2 never appears — only the due-review one did.
    expect(screen.queryByText("Due two (duplicate)")).not.toBeInTheDocument();
  });

  it("validates ?topic= against the real topic list, dropping unknown values", async () => {
    setup({});

    render(
      await QuestionBankPage({ searchParams: Promise.resolve({ topic: "not-a-real-topic" }) }),
    );

    expect(screen.getByTestId("initial-topic").textContent).toBe("none");
  });

  it("passes a valid ?topic= through as the initial topic", async () => {
    setup({});

    render(await QuestionBankPage({ searchParams: Promise.resolve({ topic: "accounting" }) }));

    expect(screen.getByTestId("initial-topic").textContent).toBe("accounting");
  });
});
