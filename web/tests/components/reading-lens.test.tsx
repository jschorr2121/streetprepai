import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import { ReadingLens } from "@/components/reader/reading-lens";
import type { Guide, Section } from "@/lib/types";

const guide: Guide = {
  slug: "wacc-primer",
  title: "WACC Primer",
  description: "A primer on WACC.",
  category: "modeling",
  difficulty: "beginner",
  readingMinutes: 5,
  tags: ["valuation"],
  content: "The weighted average cost of capital blends debt and equity financing costs.",
};

const sections: Section[] = [
  {
    id: "overview",
    heading: "Overview",
    level: 2,
    content: "The weighted average cost of capital blends debt and equity financing costs.",
  },
];

/**
 * happy-dom's Selection implementation doesn't support programmatically
 * building a real text selection, so `window.getSelection()` is stubbed
 * per-test with a fake `Selection`-like object. `container` must be a real
 * node inside the rendered guide content — the component checks
 * `contentRef.current?.contains(range.commonAncestorContainer)` — so tests
 * select an actual paragraph's text node rather than a detached one.
 */
function stubSelection(options: { text: string; collapsed: boolean; container: Node }) {
  const range = {
    commonAncestorContainer: options.container,
    getBoundingClientRect: () => ({
      left: 120,
      top: 240,
      width: 60,
      height: 18,
      right: 180,
      bottom: 258,
      x: 120,
      y: 240,
      toJSON: () => ({}),
    }),
  };
  const selection = {
    isCollapsed: options.collapsed,
    toString: () => options.text,
    getRangeAt: () => range,
    removeAllRanges: () => {},
  };
  vi.spyOn(window, "getSelection").mockReturnValue(selection as unknown as Selection);
}

describe("ReadingLens keyboard-accessible highlight-to-explain", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the popover from a keyboard-driven selection (selectionchange) and moves focus into it once settled", async () => {
    render(<ReadingLens guide={guide} sections={sections} />);
    const paragraph = screen.getByText(/weighted average cost of capital/i);
    stubSelection({
      text: "weighted average cost of capital",
      collapsed: false,
      container: paragraph.firstChild ?? paragraph,
    });

    fireEvent(document, new Event("selectionchange"));

    const explainButton = await screen.findByRole("button", { name: /explain/i });
    await waitFor(() => expect(explainButton).toHaveFocus());
  });

  it("does not open the popover for a collapsed selection (caret only)", async () => {
    render(<ReadingLens guide={guide} sections={sections} />);
    const paragraph = screen.getByText(/weighted average cost of capital/i);
    stubSelection({
      text: "",
      collapsed: true,
      container: paragraph.firstChild ?? paragraph,
    });

    fireEvent.mouseUp(document);
    fireEvent(document, new Event("selectionchange"));

    // Give the debounced selectionchange handler a beat, then confirm it
    // never rendered a popover.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(screen.queryByRole("button", { name: /explain/i })).not.toBeInTheDocument();
  });

  it("dismisses the popover on Escape", async () => {
    render(<ReadingLens guide={guide} sections={sections} />);
    const paragraph = screen.getByText(/weighted average cost of capital/i);
    stubSelection({
      text: "weighted average cost of capital",
      collapsed: false,
      container: paragraph.firstChild ?? paragraph,
    });

    fireEvent.mouseUp(document);
    await screen.findByRole("button", { name: /explain/i });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /explain/i })).not.toBeInTheDocument(),
    );
  });
});
