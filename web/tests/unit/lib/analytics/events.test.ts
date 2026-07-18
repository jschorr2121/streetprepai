/**
 * Unit coverage for the typed analytics event helpers (lib/analytics/events.ts).
 *
 * This suite runs in the `node` vitest project, so `typeof window === "undefined"`
 * is true at module-load time and every helper resolves through the server
 * (`captureServer`) branch — the client (`captureClient`/posthog-js) branch is
 * browser-only and out of scope here.
 *
 * Covers:
 *  - The no-op-when-unconfigured path: `getServerPostHog()` returns null ->
 *    the helper resolves without throwing and never calls flush.
 *  - Capture/flush plumbing against a mocked PostHog client: the right
 *    distinctId/event/properties shape is passed to `capture()`, and
 *    `flushServerPostHog()` is awaited afterwards.
 *  - capture() throwing is swallowed (fire-and-forget: analytics must never
 *    break the caller).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerPostHogMock, flushServerPostHogMock } = vi.hoisted(() => ({
  getServerPostHogMock: vi.fn(),
  flushServerPostHogMock: vi.fn(async () => {}),
}));

vi.mock("@/lib/analytics/server", () => ({
  getServerPostHog: getServerPostHogMock,
  flushServerPostHog: flushServerPostHogMock,
}));

import {
  trackAIUsage,
  trackChatStarted,
  trackInterviewScored,
  trackPrepGenerated,
  trackResumeCritiqued,
} from "@/lib/analytics/events";

beforeEach(() => {
  getServerPostHogMock.mockReset();
  flushServerPostHogMock.mockReset().mockResolvedValue(undefined);
});

describe("analytics helpers — unconfigured (no-op)", () => {
  it("resolve without throwing and never flush when PostHog is not configured", async () => {
    getServerPostHogMock.mockReturnValue(null);

    await expect(
      trackAIUsage({ userId: "11111111-1111-4111-8111-111111111111", endpoint: "chat-stream" }),
    ).resolves.toBeUndefined();

    expect(flushServerPostHogMock).not.toHaveBeenCalled();
  });
});

describe("analytics helpers — capture/flush plumbing", () => {
  it("trackInterviewScored calls capture with distinctId/event/properties, then flushes", async () => {
    const captureMock = vi.fn();
    getServerPostHogMock.mockReturnValue({ capture: captureMock });

    await trackInterviewScored({ userId: "user-2", mode: "behavioral" });

    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "user-2",
      event: "interview_scored",
      properties: { mode: "behavioral" },
    });
    expect(flushServerPostHogMock).toHaveBeenCalledTimes(1);
  });

  it("trackAIUsage maps camelCase fields to the snake_case PostHog property names", async () => {
    const captureMock = vi.fn();
    getServerPostHogMock.mockReturnValue({ capture: captureMock });

    await trackAIUsage({
      userId: "user-3",
      endpoint: "interview-score",
      model: "claude-sonnet-5",
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 10,
      cacheCreationTokens: 5,
      costUsd: 0.01,
    });

    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "user-3",
      event: "ai_usage",
      properties: {
        endpoint: "interview-score",
        model: "claude-sonnet-5",
        input_tokens: 100,
        output_tokens: 50,
        cache_read_tokens: 10,
        cache_creation_tokens: 5,
        cost_usd: 0.01,
      },
    });
  });

  it("trackPrepGenerated and trackResumeCritiqued route through the same capture/flush path", async () => {
    const captureMock = vi.fn();
    getServerPostHogMock.mockReturnValue({ capture: captureMock });

    await trackPrepGenerated({ userId: "user-4", contactFirm: "gs", kind: "firm" });
    await trackResumeCritiqued({ userId: "user-4" });

    expect(captureMock).toHaveBeenNthCalledWith(1, {
      distinctId: "user-4",
      event: "prep_generated",
      properties: { contact_firm: "gs", kind: "firm" },
    });
    expect(captureMock).toHaveBeenNthCalledWith(2, {
      distinctId: "user-4",
      event: "resume_critiqued",
      properties: undefined,
    });
    expect(flushServerPostHogMock).toHaveBeenCalledTimes(2);
  });

  it("trackChatStarted swallows a capture() throw instead of rejecting", async () => {
    const captureMock = vi.fn(() => {
      throw new Error("posthog down");
    });
    getServerPostHogMock.mockReturnValue({ capture: captureMock });

    await expect(
      trackChatStarted({ userId: "user-5", guideTitle: "M&A basics" }),
    ).resolves.toBeUndefined();
    // The throw happens before flush is reached.
    expect(flushServerPostHogMock).not.toHaveBeenCalled();
  });
});
