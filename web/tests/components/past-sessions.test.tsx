import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PastSessions } from "@/components/interview/past-sessions";
import type { MockInterview } from "@/lib/types";

function session(overrides: Partial<MockInterview> = {}): MockInterview {
  return {
    id: "mi-1",
    questionText: "Walk me through a DCF.",
    mode: "technical",
    createdAt: "2026-03-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("PastSessions", () => {
  it("shows a genuine empty state with no sessions", () => {
    render(<PastSessions sessions={[]} />);
    expect(screen.getByText("No completed sessions yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders question, mode label, date, and the averaged overall score", () => {
    render(
      <PastSessions
        sessions={[
          session({
            scorecard: { content_score: 80, delivery_score: 60 },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Walk me through a DCF.")).toBeInTheDocument();
    expect(screen.getByText("Technical")).toBeInTheDocument();
    expect(screen.getByText("Mar 15, 2026")).toBeInTheDocument();
    // (80 + 60) / 2 = 70
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("shows 'Not scored' when the scorecard is missing or malformed", () => {
    render(
      <PastSessions
        sessions={[
          session({ id: "mi-2", scorecard: undefined }),
          session({ id: "mi-3", scorecard: { rubric: [] } }),
        ]}
      />,
    );
    expect(screen.getAllByText("Not scored")).toHaveLength(2);
  });

  it("caps the visible list to whatever sessions it's handed (caller controls the limit)", () => {
    const sessions = Array.from({ length: 3 }, (_, i) =>
      session({ id: `mi-${i}`, questionText: `Question ${i}` }),
    );
    render(<PastSessions sessions={sessions} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
