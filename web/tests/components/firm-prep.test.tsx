import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { FirmPrep } from "@/components/firms/firm-prep";
import { STREAM_ERROR_SENTINEL } from "@/lib/streaming/stream-error";
import type { Firm } from "@/lib/types";

const firm: Firm = {
  slug: "goldman-sachs",
  name: "Goldman Sachs",
  tier: "bulge-bracket",
  hq: "New York, NY",
  description: "Global investment bank.",
};

// Builds a fetch Response stand-in whose body streams the given chunks one
// `reader.read()` call at a time, mirroring how the real /api/firms/:slug/prep
// route sends plain-text deltas (optionally including the in-band error
// sentinel — see lib/streaming/stream-error.ts).
function streamResponse(chunks: string[], opts: { ok?: boolean } = {}) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: opts.ok ?? true,
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

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("FirmPrep", () => {
  it("renders firm header details and the empty state before generating", () => {
    render(<FirmPrep firm={firm} />);
    expect(screen.getByRole("heading", { name: "Goldman Sachs" })).toBeInTheDocument();
    expect(screen.getByText("New York, NY")).toBeInTheDocument();
    expect(screen.getByText("bulge bracket")).toBeInTheDocument();
    expect(screen.getByText(/click generate to have claude build/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
  });

  it("streams in the prep sheet and switches the button to Regenerate", async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse(["Focus on their ", "TMT deal flow."]));
    render(<FirmPrep firm={firm} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(await screen.findByText("Focus on their TMT deal flow.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Regenerate" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/firms/goldman-sachs/prep", { method: "POST" });
  });

  it("keeps the previous prep sheet visible until the regenerated stream delivers content", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(streamResponse(["Original prep sheet content."]));
    render(<FirmPrep firm={firm} />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await screen.findByText("Original prep sheet content.");

    // Regenerate resolves to a stream that ends without ever emitting content
    // (e.g. the model errored immediately) — the old prep sheet must remain.
    vi.mocked(fetch).mockResolvedValueOnce(streamResponse([]));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Regenerate" })).toBeEnabled());
    expect(screen.getByText("Original prep sheet content.")).toBeInTheDocument();
  });

  it("restores the previous prep sheet and shows a generic error when the regenerate request throws", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(streamResponse(["Original prep sheet content."]));
    render(<FirmPrep firm={firm} />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await screen.findByText("Original prep sheet content.");

    vi.mocked(fetch).mockRejectedValueOnce(new Error("network down"));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    expect(
      await screen.findByText(
        "Sorry, something went wrong generating the prep sheet. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Original prep sheet content.")).toBeInTheDocument();
  });

  it("splits in-band stream errors from content, keeping delivered content and surfacing the error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      streamResponse([`Partial prep sheet.${STREAM_ERROR_SENTINEL}The model timed out.`]),
    );
    render(<FirmPrep firm={firm} />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByText("Partial prep sheet.")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("The model timed out.");
    // Content was received, so it's kept (not discarded as a full failure).
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument();
  });

  it("shows a generic error and no prep sheet when the response is not ok on first generate", async () => {
    vi.mocked(fetch).mockResolvedValue(streamResponse([], { ok: false }));
    render(<FirmPrep firm={firm} />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(
      await screen.findByText(
        "Sorry, something went wrong generating the prep sheet. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/click generate to have claude build/i)).toBeInTheDocument();
  });
});
