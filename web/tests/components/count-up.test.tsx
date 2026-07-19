import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { CountUp } from "@/components/marketing/count-up";

// happy-dom ships a real (if inert) IntersectionObserver, so CountUp's
// `new IntersectionObserver(...)` call succeeds but never fires on its own —
// there's no layout engine to decide intersection. We install a fake that
// captures the callback so tests can trigger it deterministically, and force
// requestAnimationFrame's `now` far past the animation duration so the first
// tick lands on the final eased value instead of depending on wall-clock time.
class FakeIntersectionObserver {
  static last: FakeIntersectionObserver | undefined;
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  thresholds: number[] = [];
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.last = this;
  }
}

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  }));
}

describe("CountUp", () => {
  const originalRAF = window.requestAnimationFrame;
  const originalIO = window.IntersectionObserver;

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    FakeIntersectionObserver.last = undefined;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
    window.IntersectionObserver = originalIO;
    vi.unstubAllGlobals();
  });

  it("renders a zero-padded initial value before it has scrolled into view", () => {
    mockMatchMedia(false);
    render(<CountUp target={42} />);
    expect(screen.getByText("00")).toBeInTheDocument();
  });

  it("jumps straight to the zero-padded target under reduced motion", async () => {
    mockMatchMedia(true);
    render(<CountUp target={7} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("07")).toBeInTheDocument();
  });

  it("animates to the target once it intersects the viewport", () => {
    mockMatchMedia(false);
    // Force the very first animation frame's timestamp to be past the full
    // duration, so progress clamps to 1 and the eased value lands exactly on
    // `target` without waiting on real animation frames.
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(performance.now() + 10_000);
      return 0;
    }) as typeof window.requestAnimationFrame;

    render(<CountUp target={15} />);
    expect(screen.getByText("00")).toBeInTheDocument();

    const observer = FakeIntersectionObserver.last;
    expect(observer).toBeDefined();
    act(() => {
      observer!.callback([{ isIntersecting: true } as IntersectionObserverEntry], observer!);
    });

    expect(screen.getByText("15")).toBeInTheDocument();
  });
});
