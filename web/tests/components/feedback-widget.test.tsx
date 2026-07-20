import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { submitFeedbackAction } from "@/lib/feedback/actions";

vi.mock("next/navigation", () => ({
  usePathname: () => "/tools/chatbot",
}));

vi.mock("@/lib/feedback/actions", () => ({
  submitFeedbackAction: vi.fn(),
}));

const mockedSubmitFeedbackAction = vi.mocked(submitFeedbackAction);

beforeEach(() => {
  mockedSubmitFeedbackAction.mockReset();
});

describe("FeedbackWidget", () => {
  it("opens the dialog when the trigger is clicked", () => {
    render(<FeedbackWidget />);
    expect(screen.queryByText("Send feedback")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /feedback/i }));

    expect(screen.getByText("Send feedback")).toBeInTheDocument();
  });

  it("disables Send while the message is empty or whitespace-only", () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByRole("button", { name: /feedback/i }));

    const send = screen.getByRole("button", { name: /send$/i });
    expect(send).toBeDisabled();

    const textarea = screen.getByLabelText(/feedback message/i);
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(send).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "This crashed on me" } });
    expect(send).toBeEnabled();
  });

  it("submits the current pathname and trimmed message, then shows a thank-you state", async () => {
    mockedSubmitFeedbackAction.mockResolvedValue({ ok: true, data: null });
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByRole("button", { name: /feedback/i }));

    fireEvent.change(screen.getByLabelText(/feedback message/i), {
      target: { value: "  Loved this page  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /send$/i }));

    expect(await screen.findByText("Thanks for the feedback")).toBeInTheDocument();
    expect(mockedSubmitFeedbackAction).toHaveBeenCalledWith({
      route: "/tools/chatbot",
      message: "Loved this page",
    });
  });

  it("shows an inline error and keeps the form open when the action fails", async () => {
    mockedSubmitFeedbackAction.mockResolvedValue({
      ok: false,
      error: { code: "RATE_LIMITED", message: "Slow down a moment." },
    });
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByRole("button", { name: /feedback/i }));

    fireEvent.change(screen.getByLabelText(/feedback message/i), {
      target: { value: "Another note" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send$/i }));

    expect(await screen.findByText("Slow down a moment.")).toBeInTheDocument();
    expect(screen.getByText("Send feedback")).toBeInTheDocument();
  });
});
