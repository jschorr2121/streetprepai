import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";

import { MarkReadButton } from "@/components/learn/mark-read-button";
import { markSectionReadAction } from "@/app/(app)/learn/actions";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/(app)/learn/actions", () => ({
  markSectionReadAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const mockedMarkSectionReadAction = vi.mocked(markSectionReadAction);

beforeEach(() => {
  mockedMarkSectionReadAction.mockReset();
  refresh.mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("MarkReadButton", () => {
  it("renders the 'Read' indicator with no button when already read", () => {
    render(<MarkReadButton chapterSlug="valuation" sectionSlug="dcf" read />);
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark read/i })).not.toBeInTheDocument();
  });

  it("marks the section read and refreshes the router on success", async () => {
    mockedMarkSectionReadAction.mockResolvedValue({ ok: true, data: null });
    render(<MarkReadButton chapterSlug="valuation" sectionSlug="dcf" read={false} />);

    const button = screen.getByRole("button", { name: /mark read/i });
    fireEvent.click(button);

    expect(await screen.findByText("Read")).toBeInTheDocument();
    expect(mockedMarkSectionReadAction).toHaveBeenCalledWith({
      chapterSlug: "valuation",
      sectionSlug: "dcf",
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /mark read/i })).not.toBeInTheDocument();
  });

  it("shows a toast and stays unread when the action returns an error", async () => {
    mockedMarkSectionReadAction.mockResolvedValue({
      ok: false,
      error: { code: "RATE_LIMITED", message: "Slow down a moment." },
    });
    render(<MarkReadButton chapterSlug="valuation" sectionSlug="dcf" read={false} />);

    fireEvent.click(screen.getByRole("button", { name: /mark read/i }));

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Slow down a moment.");
    });
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /mark read/i })).toBeEnabled();
  });

  it("shows a generic toast when the action throws", async () => {
    mockedMarkSectionReadAction.mockRejectedValue(new Error("network down"));
    render(<MarkReadButton chapterSlug="valuation" sectionSlug="dcf" read={false} />);

    fireEvent.click(screen.getByRole("button", { name: /mark read/i }));

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't mark this section as read. Please try again.",
      );
    });
    expect(screen.getByRole("button", { name: /mark read/i })).toBeEnabled();
  });
});
