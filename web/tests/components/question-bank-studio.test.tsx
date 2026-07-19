import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { QuestionBankStudio } from "@/components/learn/question-bank-studio";
import { serveQuestionAction } from "@/app/(app)/tools/question-bank/actions";
import type { AnswerCardQuestion } from "@/components/learn/answer-card";

vi.mock("@/app/(app)/tools/question-bank/actions", () => ({
  serveQuestionAction: vi.fn(),
}));

// AnswerCard, PracticeSession, and DrillRunner each have their own dedicated
// test files — stub them here so this file can focus on QuestionBankStudio's
// own job: tab switching, topic/difficulty selection, and wiring the serve
// action's result into the right piece of UI.
vi.mock("@/components/learn/answer-card", () => ({
  AnswerCard: ({ question }: { question: AnswerCardQuestion }) => (
    <div data-testid="answer-card">{question.prompt}</div>
  ),
}));
vi.mock("@/components/learn/practice-session", () => ({
  PracticeSession: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div data-testid="practice-session">
      {title}
      {subtitle ? ` — ${subtitle}` : ""}
    </div>
  ),
}));
vi.mock("@/components/learn/drill-runner", () => ({
  DrillRunner: ({ kind }: { kind: string }) => <div data-testid="drill-runner">{kind}</div>,
}));

const mockedServeQuestionAction = vi.mocked(serveQuestionAction);

const topics = [
  { value: "valuation", label: "Valuation" },
  { value: "ma", label: "M&A" },
];

// Radix Tabs switches the active tab on `mousedown` (not `click`) under its
// default "automatic" activation mode — see @radix-ui/react-tabs's
// TabsTrigger, which calls `onValueChange` from onMouseDown/onFocus.
function switchTab(name: RegExp | string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

beforeEach(() => {
  mockedServeQuestionAction.mockReset();
});

describe("QuestionBankStudio", () => {
  it("shows the empty state on the daily tab when there are no queued questions", () => {
    render(<QuestionBankStudio dueCount={0} dailyQuestions={[]} topics={topics} />);
    expect(screen.getByText(/Nothing queued yet/)).toBeInTheDocument();
    expect(screen.queryByTestId("practice-session")).not.toBeInTheDocument();
  });

  it("renders the daily drill session and due badge when questions are queued", () => {
    const dailyQuestions: AnswerCardQuestion[] = [
      { id: "q1", prompt: "P1", topic: "valuation", difficulty: "easy", questionType: "t" },
    ];
    render(<QuestionBankStudio dueCount={3} dailyQuestions={dailyQuestions} topics={topics} />);
    expect(screen.getByText("3 due")).toBeInTheDocument();
    expect(screen.getByTestId("practice-session")).toHaveTextContent("Today's mixed drill");
    expect(screen.getByTestId("practice-session")).toHaveTextContent("3 weak items due");
  });

  it("lets the user pick a topic and difficulty, then serves a question", async () => {
    mockedServeQuestionAction.mockResolvedValue({
      ok: true,
      data: { id: "q9", prompt: "M&A prompt", topic: "ma", difficulty: "hard", questionType: "t" },
    });
    render(<QuestionBankStudio dueCount={0} dailyQuestions={[]} topics={topics} />);

    switchTab(/by topic/i);
    fireEvent.click(screen.getByTestId("qbank-topic-ma"));
    fireEvent.click(screen.getByTestId("qbank-difficulty-hard"));
    fireEvent.click(screen.getByTestId("qbank-serve-button"));

    expect(mockedServeQuestionAction).toHaveBeenCalledWith({ topic: "ma", difficulty: "hard" });
    expect(await screen.findByTestId("answer-card")).toHaveTextContent("M&A prompt");
  });

  it("shows an empty-combination message when the server has no matching question", async () => {
    mockedServeQuestionAction.mockResolvedValue({ ok: true, data: null });
    render(<QuestionBankStudio dueCount={0} dailyQuestions={[]} topics={topics} />);

    switchTab(/by topic/i);
    fireEvent.click(screen.getByTestId("qbank-serve-button"));

    expect(await screen.findByText(/No questions for that combination yet/)).toBeInTheDocument();
    expect(screen.queryByTestId("answer-card")).not.toBeInTheDocument();
  });

  it("shows the error message when serving a question fails", async () => {
    mockedServeQuestionAction.mockResolvedValue({
      ok: false,
      error: { code: "RATE_LIMITED", message: "Slow down a moment." },
    });
    render(<QuestionBankStudio dueCount={0} dailyQuestions={[]} topics={topics} />);

    switchTab(/by topic/i);
    fireEvent.click(screen.getByTestId("qbank-serve-button"));

    expect(await screen.findByText("Slow down a moment.")).toBeInTheDocument();
  });

  it("jumps to the By topic tab with the topic preselected when initialTopic is set", () => {
    render(
      <QuestionBankStudio dueCount={0} dailyQuestions={[]} topics={topics} initialTopic="ma" />,
    );

    // Lands directly on "By topic" (not the default "Daily drill" tab).
    expect(screen.getByTestId("qbank-topic-ma")).toHaveClass("border-primary");
    expect(screen.queryByTestId("practice-session")).not.toBeInTheDocument();
  });

  it("switches between mental math drills", () => {
    render(<QuestionBankStudio dueCount={0} dailyQuestions={[]} topics={topics} />);
    switchTab(/mental math/i);

    expect(screen.getByTestId("drill-runner")).toHaveTextContent("three-statement");

    fireEvent.click(screen.getByText("Treasury Stock Method"));
    expect(screen.getByTestId("drill-runner")).toHaveTextContent("tsm");
  });
});
