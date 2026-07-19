import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { PracticeSession } from "@/components/learn/practice-session";
import { finishSittingAction } from "@/app/(app)/learn/actions";
import type { AnswerCardQuestion } from "@/components/learn/answer-card";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/(app)/learn/actions", () => ({
  finishSittingAction: vi.fn(),
}));

// AnswerCard's own grading behavior is covered by answer-card.test.tsx.
// Stub it here so PracticeSession's sequencing/scoring logic can be driven
// directly via a "Grade" button that reports a fixed score.
vi.mock("@/components/learn/answer-card", () => ({
  AnswerCard: ({
    question,
    onGraded,
  }: {
    question: AnswerCardQuestion;
    onGraded?: (r: { score: number; correct: boolean }) => void;
  }) => (
    <div>
      <p>{question.prompt}</p>
      <button onClick={() => onGraded?.({ score: 90, correct: true })}>Grade 90</button>
      <button onClick={() => onGraded?.({ score: 40, correct: false })}>Grade 40</button>
    </div>
  ),
}));

const mockedFinishSittingAction = vi.mocked(finishSittingAction);

const questions: AnswerCardQuestion[] = [
  { id: "q1", prompt: "Question one", topic: "valuation", difficulty: "easy", questionType: "t" },
  { id: "q2", prompt: "Question two", topic: "valuation", difficulty: "easy", questionType: "t" },
];

beforeEach(() => {
  mockedFinishSittingAction.mockReset();
  refresh.mockReset();
});

describe("PracticeSession", () => {
  it("renders the first question, title, and progress", () => {
    render(
      <PracticeSession questions={questions} context="daily-drill" title="Today's mixed drill" />,
    );
    expect(screen.getByText("Today's mixed drill")).toBeInTheDocument();
    expect(screen.getByText("Question one")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("shows a fallback message when there are no questions", () => {
    render(<PracticeSession questions={[]} context="qbank" title="Practice" />);
    expect(screen.getByText("No questions available yet.")).toBeInTheDocument();
  });

  it("advances to the next question after grading, without a finish call mid-session", () => {
    render(<PracticeSession questions={questions} context="daily-drill" title="Drill" />);
    fireEvent.click(screen.getByText("Grade 90"));

    const next = screen.getByRole("button", { name: /next question/i });
    fireEvent.click(next);

    expect(screen.getByText("Question two")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(mockedFinishSittingAction).not.toHaveBeenCalled();
  });

  it("shows a plain tally summary for an ungated context without calling finishSittingAction", () => {
    render(
      <PracticeSession
        questions={[questions[0]!]}
        context="qbank"
        title="Practice"
        backHref="/tools/question-bank"
      />,
    );
    fireEvent.click(screen.getByText("Grade 90"));
    fireEvent.click(screen.getByRole("button", { name: /finish/i }));

    expect(screen.getByText("Session complete")).toBeInTheDocument();
    expect(screen.getByText(/averaged/)).toHaveTextContent("You averaged 90% across 1 question.");
    expect(mockedFinishSittingAction).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /done/i })).toHaveAttribute(
      "href",
      "/tools/question-bank",
    );
  });

  it("scores a chapter gate server-side and shows 'Gate passed' on success", async () => {
    mockedFinishSittingAction.mockResolvedValue({
      ok: true,
      data: { averageScore: 92, passed: true, threshold: 0.85, chapterCompleted: true },
    });
    render(
      <PracticeSession
        questions={[questions[0]!]}
        context="chapter-gate"
        chapterSlug="valuation"
        title="Chapter gate"
      />,
    );
    fireEvent.click(screen.getByText("Grade 90"));
    fireEvent.click(screen.getByRole("button", { name: /finish & score/i }));

    expect(await screen.findByText("Gate passed")).toBeInTheDocument();
    expect(screen.getByText(/This chapter is now complete\./)).toBeInTheDocument();
    expect(mockedFinishSittingAction).toHaveBeenCalledWith(
      expect.objectContaining({ chapterSlug: "valuation", context: "chapter-gate" }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows the gate error and lets the user retry instead of falling through to a pass", async () => {
    mockedFinishSittingAction.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION_FAILED", message: "This sitting expired — start it again." },
    });
    render(
      <PracticeSession
        questions={[questions[0]!]}
        context="chapter-gate"
        chapterSlug="valuation"
        title="Chapter gate"
      />,
    );
    fireEvent.click(screen.getByText("Grade 40"));
    fireEvent.click(screen.getByRole("button", { name: /finish & score/i }));

    expect(await screen.findByText("This sitting expired — start it again.")).toBeInTheDocument();
    // Stays on the question screen — no summary shown.
    expect(screen.queryByText("Gate passed")).not.toBeInTheDocument();
    expect(screen.queryByText("Not quite yet")).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("lets a failed gate be retried, resetting to the first question", async () => {
    mockedFinishSittingAction.mockResolvedValue({
      ok: true,
      data: { averageScore: 40, passed: false, threshold: 0.85, chapterCompleted: false },
    });
    render(
      <PracticeSession
        questions={questions}
        context="chapter-gate"
        chapterSlug="valuation"
        title="Chapter gate"
      />,
    );
    fireEvent.click(screen.getByText("Grade 40"));
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    fireEvent.click(screen.getByText("Grade 40"));
    fireEvent.click(screen.getByRole("button", { name: /finish & score/i }));

    expect(await screen.findByText("Not quite yet")).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: /retry the gate/i });
    fireEvent.click(retry);

    expect(screen.getByText("Question one")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });
});
