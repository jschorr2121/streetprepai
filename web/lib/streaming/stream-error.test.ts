import { describe, expect, it } from "vitest";

import {
  STREAM_ERROR_SENTINEL,
  encodeStreamError,
  splitStreamError,
  stripStreamSentinel,
} from "./stream-error";

describe("splitStreamError", () => {
  it("passes clean text through with no error", () => {
    expect(splitStreamError("Hello **world**")).toEqual({
      content: "Hello **world**",
      error: null,
    });
  });

  it("splits partial content from a mid-stream error", () => {
    const raw = `Some partial answer\n${encodeStreamError("The response failed. Please try again.")}`;
    expect(splitStreamError(raw)).toEqual({
      content: "Some partial answer",
      error: "The response failed. Please try again.",
    });
  });

  it("yields empty content when the stream fails before any text", () => {
    expect(splitStreamError(encodeStreamError("Rate limited."))).toEqual({
      content: "",
      error: "Rate limited.",
    });
  });

  it("falls back to a generic message when the error text is empty", () => {
    expect(splitStreamError(STREAM_ERROR_SENTINEL).error).toBe(
      "The response failed. Please try again.",
    );
  });

  it("handles the sentinel split across chunks (accumulator semantics)", () => {
    // Clients re-split the full accumulator each chunk, so a sentinel arriving
    // in its own chunk must still be found.
    let acc = "First chunk";
    expect(splitStreamError(acc).error).toBeNull();
    acc += encodeStreamError("boom");
    expect(splitStreamError(acc)).toEqual({ content: "First chunk", error: "boom" });
  });
});

describe("stripStreamSentinel", () => {
  it("removes the sentinel from model text", () => {
    expect(stripStreamSentinel(`a${STREAM_ERROR_SENTINEL}b`)).toBe("ab");
  });

  it("returns untouched text unchanged", () => {
    expect(stripStreamSentinel("plain")).toBe("plain");
  });
});
