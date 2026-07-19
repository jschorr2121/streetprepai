import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { AnswerCard, type AnswerCardQuestion } from "@/components/learn/answer-card";
import { gradeAnswerAction } from "@/app/(app)/tools/question-bank/actions";
import type { GradedAnswer } from "@/lib/types";

vi.mock("@/app/(app)/tools/question-bank/actions", () => ({
  gradeAnswerAction: vi.fn(),
}));

const mockedGradeAnswerAction = vi.mocked(gradeAnswerAction);

const question: AnswerCardQuestion = {
  id: "q1",
  prompt: "Walk me through a DCF.",
  topic: "valuation-dcf",
  difficulty: "medium",
  questionType: "walk-me-through",
};

function makeGrade(overrides: Partial<GradedAnswer> = {}): GradedAnswer {
  return {
    score: 82,
    correct: true,
    keyPointResults: [
      { point: "Projects unlevered FCF", hit: true, comment: "Nailed it" },
      { point: "Discounts at WACC", hit: false, comment: "Missing" },
    ],
    misconceptionsTriggered: [],
    depthComment: "Solid depth for a medium question.",
    overallFeedback: "Strong answer overall.",
    modelAnswer: "A model answer walks through FCF projections and a terminal value.",
    ...overrides,
  };
}

beforeEach(() => {
  mockedGradeAnswerAction.mockReset();
});

describe("AnswerCard", () => {
  it("renders the question prompt and formatted badges", () => {
    render(<AnswerCard question={question} context="qbank" />);
    expect(screen.getByText("Walk me through a DCF.")).toBeInTheDocument();
    expect(screen.getByText("valuation dcf")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("walk me through")).toBeInTheDocument();
  });

  it("disables submit until an answer is entered, then grades on click", async () => {
    mockedGradeAnswerAction.mockResolvedValue({
      ok: true,
      data: { grade: makeGrade(), nextFollowup: null },
    });
    const onGraded = vi.fn();
    render(<AnswerCard question={question} context="qbank" onGraded={onGraded} />);

    const submit = screen.getByRole("button", { name: /submit for grading/i });
    expect(submit).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/answer as you would/i);
    fireEvent.change(textarea, { target: { value: "Project FCF, discount at WACC." } });
    expect(submit).toBeEnabled();

    fireEvent.click(submit);

    expect(await screen.findByText("Strong answer overall.")).toBeInTheDocument();
    expect(screen.getByText("82/100")).toBeInTheDocument();
    expect(screen.getByText("Projects unlevered FCF")).toBeInTheDocument();
    expect(onGraded).toHaveBeenCalledWith({ score: 82, correct: true });
    expect(mockedGradeAnswerAction).toHaveBeenCalledWith({
      questionId: "q1",
      answer: "Project FCF, discount at WACC.",
      context: "qbank",
    });
    // Once graded, the textarea locks and the submit button disappears.
    expect(textarea).toBeDisabled();
    expect(screen.queryByRole("button", { name: /submit for grading/i })).not.toBeInTheDocument();
  });

  it("shows misconceptions when triggered", async () => {
    mockedGradeAnswerAction.mockResolvedValue({
      ok: true,
      data: {
        grade: makeGrade({ misconceptionsTriggered: ["Confused EV with equity value"] }),
        nextFollowup: null,
      },
    });
    render(<AnswerCard question={question} context="qbank" />);
    fireEvent.change(screen.getByPlaceholderText(/answer as you would/i), {
      target: { value: "some answer" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit for grading/i }));
    expect(await screen.findByText("Confused EV with equity value")).toBeInTheDocument();
    expect(screen.getByText("Watch out")).toBeInTheDocument();
  });

  it("surfaces the error message and leaves the form editable when grading fails", async () => {
    mockedGradeAnswerAction.mockResolvedValue({
      ok: false,
      error: { code: "RATE_LIMITED", message: "Grading limit reached — try again in 30s." },
    });
    render(<AnswerCard question={question} context="qbank" />);
    fireEvent.change(screen.getByPlaceholderText(/answer as you would/i), {
      target: { value: "some answer" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit for grading/i }));

    expect(
      await screen.findByText("Grading limit reached — try again in 30s."),
    ).toBeInTheDocument();
    // No grade rendered, and the textarea is still editable for a retry.
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/answer as you would/i)).toBeEnabled();
  });

  it("offers a follow-up after a correct answer and grades it separately", async () => {
    mockedGradeAnswerAction
      .mockResolvedValueOnce({
        ok: true,
        data: {
          grade: makeGrade(),
          nextFollowup: { id: "f1", prompt: "What if WACC rises by 200bps?" },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          grade: makeGrade({ score: 70, overallFeedback: "Follow-up feedback." }),
          nextFollowup: null,
        },
      });
    render(<AnswerCard question={question} context="qbank" />);
    fireEvent.change(screen.getByPlaceholderText(/answer as you would/i), {
      target: { value: "some answer" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit for grading/i }));
    await screen.findByText("Strong answer overall.");

    const followupButton = screen.getByRole("button", { name: /interviewer follow-up/i });
    fireEvent.click(followupButton);

    expect(screen.getByText("What if WACC rises by 200bps?")).toBeInTheDocument();
    const followupTextarea = screen.getByPlaceholderText(/go deeper/i);
    fireEvent.change(followupTextarea, { target: { value: "It would lower the valuation." } });
    fireEvent.click(screen.getByRole("button", { name: /submit follow-up/i }));

    expect(await screen.findByText("Follow-up feedback.")).toBeInTheDocument();
    expect(screen.getByText("Follow-up answered")).toBeInTheDocument();
    expect(mockedGradeAnswerAction).toHaveBeenNthCalledWith(2, {
      questionId: "q1",
      followupId: "f1",
      answer: "It would lower the valuation.",
      context: "qbank",
    });
  });
});
