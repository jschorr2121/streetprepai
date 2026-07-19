import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DrillRunner } from "@/components/learn/drill-runner";

// The generators are pure/random by design; mock them with a deterministic
// fixture so the test can assert exact correct/incorrect behavior instead of
// re-deriving the math the generator already owns.
vi.mock("@/lib/curriculum/drills/generators", () => {
  let call = 0;
  return {
    DRILL_GENERATORS: {
      "three-statement": vi.fn(() => {
        call += 1;
        return {
          kind: "three-statement",
          prompt: `Prompt for round ${call}`,
          fields: [
            { key: "netIncome", label: "Change in net income ($)", value: 100, tolerance: 0.5 },
            { key: "cashChange", label: "Change in cash ($)", value: -20, tolerance: 0.5 },
          ],
          explanation: `Explanation for round ${call}`,
        };
      }),
    },
    DRILL_META: {
      "three-statement": {
        title: "3-Statement Change",
        topic: "accounting",
        blurb: "blurb",
      },
    },
  };
});

describe("DrillRunner", () => {
  it("renders the drill prompt and field labels", () => {
    render(<DrillRunner kind="three-statement" />);
    expect(screen.getByText("3-Statement Change")).toBeInTheDocument();
    expect(screen.getByText(/^Prompt for round \d+$/)).toBeInTheDocument();
    expect(screen.getByLabelText("Change in net income ($)")).toBeInTheDocument();
    expect(screen.getByLabelText("Change in cash ($)")).toBeInTheDocument();
  });

  it("disables Check answer until at least one field is filled", () => {
    render(<DrillRunner kind="three-statement" />);
    const checkButton = screen.getByRole("button", { name: /check answer/i });
    expect(checkButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Change in net income ($)"), {
      target: { value: "100" },
    });
    expect(checkButton).toBeEnabled();
  });

  it("marks correct and incorrect fields, and reveals the explanation", () => {
    render(<DrillRunner kind="three-statement" />);
    fireEvent.change(screen.getByLabelText("Change in net income ($)"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Change in cash ($)"), {
      target: { value: "999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Check the working below")).toBeInTheDocument();
    expect(screen.getByText(/^Explanation for round \d+$/)).toBeInTheDocument();
    // The wrong field shows the correct value inline.
    expect(screen.getByText(/= -20/)).toBeInTheDocument();
    // Inputs lock once checked.
    expect(screen.getByLabelText("Change in net income ($)")).toBeDisabled();
  });

  it("reports 'Correct' when every field is within tolerance", () => {
    render(<DrillRunner kind="three-statement" />);
    fireEvent.change(screen.getByLabelText("Change in net income ($)"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Change in cash ($)"), {
      target: { value: "-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByText("Correct")).toBeInTheDocument();
  });

  it("starts a new round with cleared inputs when 'New drill' is clicked", () => {
    render(<DrillRunner kind="three-statement" />);
    const initialPrompt = screen.getByText(/^Prompt for round \d+$/).textContent;
    fireEvent.change(screen.getByLabelText("Change in net income ($)"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /new drill/i }));

    expect(screen.getByText(/^Prompt for round \d+$/).textContent).not.toBe(initialPrompt);
    expect(screen.getByLabelText("Change in net income ($)")).toHaveValue(null);
    expect(screen.getByRole("button", { name: /check answer/i })).toBeInTheDocument();
  });
});
