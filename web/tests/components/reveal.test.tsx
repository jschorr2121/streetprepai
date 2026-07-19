import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

import { Reveal } from "@/components/marketing/reveal";

// Same rationale as count-up.test.tsx: happy-dom's built-in IntersectionObserver
// never actually fires, so we install a fake that hands back its callback for
// the test to trigger manually.
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

describe("Reveal", () => {
  const originalIO = window.IntersectionObserver;

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    FakeIntersectionObserver.last = undefined;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIO;
    vi.unstubAllGlobals();
  });

  it("starts hidden (faded out, offset down) before it scrolls into view", () => {
    mockMatchMedia(false);
    const { container } = render(
      <Reveal>
        <p>content</p>
      </Reveal>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("opacity-0");
    expect(wrapper.className).toContain("translate-y-3");
  });

  it("reveals (fades in, resets offset) once it intersects the viewport", () => {
    mockMatchMedia(false);
    const { container } = render(
      <Reveal>
        <p>content</p>
      </Reveal>,
    );
    const wrapper = container.firstElementChild as HTMLElement;

    const observer = FakeIntersectionObserver.last;
    expect(observer).toBeDefined();
    act(() => {
      observer!.callback([{ isIntersecting: true } as IntersectionObserverEntry], observer!);
    });

    expect(wrapper.className).toContain("opacity-100");
    expect(wrapper.className).toContain("translate-y-0");
    expect(observer!.disconnect).toHaveBeenCalledTimes(1);
  });

  it("reveals immediately under reduced motion, without waiting on intersection", async () => {
    mockMatchMedia(true);
    const { container } = render(
      <Reveal>
        <p>content</p>
      </Reveal>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("opacity-100");
  });
});
