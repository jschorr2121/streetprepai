/**
 * Unit coverage for `streamTextResponse` (lib/ai/stream-response.ts).
 *
 * The module bridges an Anthropic message stream to a plain-text HTTP
 * Response, concatenating `text_delta` chunks and — if the upstream stream
 * throws mid-iteration — framing the failure with the in-band error sentinel
 * from lib/streaming/stream-error.ts so streaming clients can split content
 * from error.
 *
 * Sentinel encode/strip/split behaviour itself is covered by
 * lib/streaming/stream-error.test.ts — these tests only exercise the bridge:
 * event-type filtering, ordering, error framing, and the Response shape.
 */

import { describe, expect, it, vi } from "vitest";
import type {
  RawContentBlockDeltaEvent,
  RawContentBlockStopEvent,
  RawMessageStopEvent,
  MessageStreamEvent,
} from "@anthropic-ai/sdk/resources/messages";

// clientSafeError (lib/security/client-error.ts) routes through the shared
// pino logger rather than raw console.error, so its output is captured to
// Sentry via the server config's pinoIntegration.
const { loggerMock } = vi.hoisted(() => ({
  loggerMock: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/logging/logger", () => ({
  logger: loggerMock,
}));

import { streamTextResponse } from "@/lib/ai/stream-response";
import { STREAM_ERROR_SENTINEL } from "@/lib/streaming/stream-error";

function textDelta(text: string, index = 0): RawContentBlockDeltaEvent {
  return { type: "content_block_delta", index, delta: { type: "text_delta", text } };
}

function contentBlockStop(index = 0): RawContentBlockStopEvent {
  return { type: "content_block_stop", index };
}

function messageStop(): RawMessageStopEvent {
  return { type: "message_stop" };
}

// A fake AsyncIterable<MessageStreamEvent> that yields the given events in
// order, then optionally throws instead of completing normally.
function fakeStream(
  events: MessageStreamEvent[],
  failWith?: unknown,
): AsyncIterable<MessageStreamEvent> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next(): Promise<IteratorResult<MessageStreamEvent>> {
          if (i < events.length) {
            const value = events[i];
            i += 1;
            return { value, done: false };
          }
          if (failWith !== undefined) {
            const err = failWith;
            failWith = undefined;
            throw err;
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

describe("streamTextResponse", () => {
  it("concatenates text deltas in order", async () => {
    const stream = fakeStream([
      textDelta("Hello"),
      textDelta(", "),
      textDelta("world"),
      contentBlockStop(),
      messageStop(),
    ]);

    const response = streamTextResponse(stream, "test-route");
    const body = await response.text();

    expect(body).toBe("Hello, world");
  });

  it("ignores non-text-delta and non-content-block-delta events", async () => {
    const stream = fakeStream([messageStop(), contentBlockStop(), textDelta("only this")]);

    const response = streamTextResponse(stream, "test-route");
    const body = await response.text();

    expect(body).toBe("only this");
  });

  it("frames a mid-stream error with the sentinel after partial content", async () => {
    const stream = fakeStream([textDelta("partial "), textDelta("content")], new Error("boom"));

    const response = streamTextResponse(stream, "test-route");
    const body = await response.text();

    const sentinelIndex = body.indexOf(STREAM_ERROR_SENTINEL);
    expect(sentinelIndex).toBeGreaterThan(-1);
    expect(body.slice(0, sentinelIndex)).toBe("partial content");
    expect(body.slice(sentinelIndex + 1)).toBe("The response failed. Please try again.");
  });

  it("logs the real error server-side via clientSafeError while returning only the public message", async () => {
    const err = new Error("upstream exploded");

    const stream = fakeStream([], err);
    const response = streamTextResponse(stream, "my-route");
    const body = await response.text();

    expect(loggerMock.error).toHaveBeenCalledWith({ route: "my-route", err }, "route_error");
    expect(body).not.toContain("upstream exploded");
    expect(body).toBe(`${STREAM_ERROR_SENTINEL}The response failed. Please try again.`);
  });

  it("strips any sentinel character embedded in model text before enqueueing (defense in depth)", async () => {
    const stream = fakeStream([textDelta(`looks${STREAM_ERROR_SENTINEL}safe`)]);

    const response = streamTextResponse(stream, "test-route");
    const body = await response.text();

    expect(body).toBe("lookssafe");
  });

  it("returns a Response with plain-text headers and a 200 status, even on error", async () => {
    const okResponse = streamTextResponse(fakeStream([textDelta("hi")]), "test-route");
    expect(okResponse.status).toBe(200);
    expect(okResponse.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(okResponse.headers.get("Cache-Control")).toBe("no-cache, no-transform");

    const errResponse = streamTextResponse(fakeStream([], new Error("boom")), "test-route");
    // Headers are set synchronously before the stream body resolves, so the
    // status/headers are identical regardless of whether the stream later fails.
    expect(errResponse.status).toBe(200);
    expect(errResponse.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    await errResponse.text();
  });
});
