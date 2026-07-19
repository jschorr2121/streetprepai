import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ProductTour, type TourStep } from "@/components/tour/product-tour";
import { completeTourAction } from "@/app/(app)/dashboard/actions";

vi.mock("@/app/(app)/dashboard/actions", () => ({
  completeTourAction: vi.fn(),
}));

const mockedCompleteTour = vi.mocked(completeTourAction);

const steps: TourStep[] = [
  { selector: '[data-tour="nav-learn"]', title: "Learn", description: "Guides and drills." },
  { selector: '[data-tour="nav-interview"]', title: "Interview", description: "Mock interviews." },
];

const originalRAF = window.requestAnimationFrame;
const originalGetRect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  mockedCompleteTour.mockReset();
  mockedCompleteTour.mockResolvedValue({ ok: true, data: null });
  // Fire the mount-time measurement synchronously instead of waiting on a
  // real animation frame, which happy-dom never schedules on its own.
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }) as typeof window.requestAnimationFrame;
  // happy-dom has no layout engine, so every element measures 0x0 by
  // default — ProductTour treats that as "not present". Stub a fixed,
  // non-zero rect so targets that exist in the DOM are treated as visible.
  Element.prototype.getBoundingClientRect = vi.fn(function (this: Element) {
    return {
      top: 100,
      left: 50,
      width: 120,
      height: 40,
      right: 170,
      bottom: 140,
      x: 50,
      y: 100,
      toJSON: () => "",
    } as DOMRect;
  }) as typeof Element.prototype.getBoundingClientRect;
});

afterEach(() => {
  window.requestAnimationFrame = originalRAF;
  Element.prototype.getBoundingClientRect = originalGetRect;
});

function renderTour(activeSteps: TourStep[] = steps) {
  return render(
    <div>
      <div data-tour="nav-learn">Learn nav</div>
      <div data-tour="nav-interview">Interview nav</div>
      <ProductTour steps={activeSteps} active />
    </div>,
  );
}

describe("ProductTour", () => {
  it("renders nothing when inactive", () => {
    render(
      <div>
        <div data-tour="nav-learn">Learn nav</div>
        <ProductTour steps={steps} active={false} />
      </div>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the first step with a 1-indexed counter", () => {
    renderTour();
    expect(screen.getByRole("dialog", { name: /product tour/i })).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByText("Guides and drills.")).toBeInTheDocument();
  });

  it("advances with Next and returns with Back", () => {
    renderTour();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Interview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Learn" })).toBeInTheDocument();
  });

  it("finishes the tour and records completion when Skip tour is clicked", () => {
    renderTour();
    fireEvent.click(screen.getByRole("button", { name: /skip tour/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockedCompleteTour).toHaveBeenCalledTimes(1);
  });

  it("finishes the tour when Done is clicked on the last step", () => {
    renderTour();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockedCompleteTour).toHaveBeenCalledTimes(1);
  });

  it("finishes the tour on Escape", () => {
    renderTour();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockedCompleteTour).toHaveBeenCalledTimes(1);
  });

  it("skips a step whose target isn't in the DOM (e.g. sidebar hidden below lg)", () => {
    render(
      <div>
        {/* Only the second step's target is rendered. */}
        <div data-tour="nav-interview">Interview nav</div>
        <ProductTour steps={steps} active />
      </div>,
    );

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Interview" })).toBeInTheDocument();
  });

  it("treats the tour as complete when no step's target is present", () => {
    render(<ProductTour steps={steps} active />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockedCompleteTour).toHaveBeenCalledTimes(1);
  });
});
