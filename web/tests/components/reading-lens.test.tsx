import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

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

// A second-section fixture for tests that need more than one entry — the
// table of contents, and beginner mode's per-section streaming loop.
const twoSections: Section[] = [
  {
    id: "overview",
    heading: "Overview",
    level: 2,
    content: "The weighted average cost of capital blends debt and equity financing costs.",
  },
  {
    id: "capm",
    heading: "The CAPM formula",
    level: 2,
    content: "Cost of equity is derived from the capital asset pricing model.",
  },
];

// Mirrors chat-panel.test.tsx's helper: a fetch Response stand-in whose body
// streams the given chunks one `reader.read()` call at a time.
function streamResponse(chunks: string[], opts: { ok?: boolean; status?: number } = {}) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    body: {
      getReader() {
        return {
          async read() {
            if (i < chunks.length) {
              const value = encoder.encode(chunks[i]);
              i += 1;
              return { value, done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    },
  } as unknown as Response;
}

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

describe("ReadingLens table of contents", () => {
  it("lists every level-2 section as a numbered link into the guide", () => {
    render(<ReadingLens guide={guide} sections={twoSections} />);

    const toc = screen.getByText("Contents").closest("div")!;
    const links = within(toc).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["#overview", "#capm"]);
    expect(links[0]!.textContent).toContain("Overview");
    expect(links[1]!.textContent).toContain("The CAPM formula");
  });
});

describe("ReadingLens explain-selection streaming flow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("streams the explanation into the Lens rail and switches to the Lens tab", async () => {
    vi.mocked(fetch).mockResolvedValue(
      streamResponse(["WACC blends the cost of debt and ", "the cost of equity."]),
    );
    render(<ReadingLens guide={guide} sections={sections} />);
    const paragraph = screen.getByText(/weighted average cost of capital/i);
    stubSelection({
      text: "weighted average cost of capital",
      collapsed: false,
      container: paragraph.firstChild ?? paragraph,
    });
    fireEvent.mouseUp(document);
    const explainButton = await screen.findByRole("button", { name: /explain/i });

    fireEvent.click(explainButton);

    await waitFor(() =>
      expect(
        screen.getByText("WACC blends the cost of debt and the cost of equity."),
      ).toBeInTheDocument(),
    );
    // The popover and quoted-selection blockquote both render in the rail.
    expect(
      screen.getByText(/weighted average cost of capital/i, { selector: "blockquote" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /explain/i })).not.toBeInTheDocument();
  });

  it("shows a retry-worthy error message when the explain stream fails", async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse([], { ok: false, status: 500 }));
    render(<ReadingLens guide={guide} sections={sections} />);
    const paragraph = screen.getByText(/weighted average cost of capital/i);
    stubSelection({
      text: "weighted average cost of capital",
      collapsed: false,
      container: paragraph.firstChild ?? paragraph,
    });
    fireEvent.mouseUp(document);
    const explainButton = await screen.findByRole("button", { name: /explain/i });

    fireEvent.click(explainButton);

    await waitFor(() =>
      expect(
        screen.getByText(/sorry, something went wrong\. please try highlighting/i),
      ).toBeInTheDocument(),
    );
  });
});

describe("ReadingLens beginner mode", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches a plain-English rewrite for each section and renders it alongside a collapsible original", async () => {
    vi.mocked(fetch).mockResolvedValue(
      streamResponse(["WACC in plain English: it's the blended cost of a company's money."]),
    );
    render(<ReadingLens guide={guide} sections={sections} />);

    fireEvent.click(screen.getByRole("button", { name: /beginner mode/i }));

    await waitFor(() =>
      expect(
        screen.getByText("WACC in plain English: it's the blended cost of a company's money."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Beginner rewrite")).toBeInTheDocument();
    expect(screen.getByText("Show original")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /beginner mode/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows a per-section retry error when the rewrite stream fails, without breaking other sections", async () => {
    const mockedFetch = vi.mocked(fetch);
    mockedFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const body = typeof input === "string" ? input : input.toString();
      if (body.includes("beginner")) {
        return streamResponse([], { ok: false, status: 500 });
      }
      return streamResponse([]);
    });
    render(<ReadingLens guide={guide} sections={twoSections} />);

    fireEvent.click(screen.getByRole("button", { name: /beginner mode/i }));

    await waitFor(() =>
      expect(screen.getAllByText(/couldn't rewrite this section/i).length).toBe(2),
    );
  });

  it("turning beginner mode off leaves the toggle unpressed and stops rendering rewrites", async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse(["A rewrite."]));
    render(<ReadingLens guide={guide} sections={sections} />);

    const toggle = screen.getByRole("button", { name: /beginner mode/i });
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByText("A rewrite.")).toBeInTheDocument());

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Beginner rewrite")).not.toBeInTheDocument();
  });
});

describe("ReadingLens right rail tabs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // happy-dom doesn't implement scrollIntoView, which ChatPanel calls.
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("defaults to the Lens tab with its empty-state copy, and switches to Chat on click", () => {
    render(<ReadingLens guide={guide} sections={sections} />);

    expect(screen.getByText(/the ai reads with you/i)).toBeInTheDocument();
    expect(screen.queryByText("Chat with this guide")).not.toBeInTheDocument();

    // Radix Tabs switches the active tab on mousedown, not click.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /chat/i }));

    expect(screen.getByText("Chat with this guide")).toBeInTheDocument();
    expect(screen.queryByText(/the ai reads with you/i)).not.toBeInTheDocument();
  });
});
