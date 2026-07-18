import { describe, expect, it } from "vitest";

import { computeNextChatSessionState } from "@/app/(app)/tools/chatbot/_components/chat";

// Regression coverage for issue 06 (new-thread refresh flicker): the
// `AssistantChat` mount key must stay stable while a brand-new thread's
// client-generated id becomes confirmed by the server (null -> non-null),
// but must change for any other transition — a genuine switch between
// threads, or an explicit reset to "new" — so the composer/messages reset.
describe("computeNextChatSessionState", () => {
  it("keeps the same state (and mountKey) when activeThreadId is unchanged", () => {
    const prev = { knownId: "thread-1", mountKey: "thread-1" };
    expect(computeNextChatSessionState(prev, "thread-1")).toBe(prev);
  });

  it("does not change the mountKey when a new thread's own id is confirmed", () => {
    const prev = { knownId: null, mountKey: "new" };
    const next = computeNextChatSessionState(prev, "thread-1");
    expect(next).toEqual({ knownId: "thread-1", mountKey: "new" });
  });

  it("changes the mountKey when switching between two different existing threads", () => {
    const prev = { knownId: "thread-1", mountKey: "thread-1" };
    const next = computeNextChatSessionState(prev, "thread-2");
    expect(next).toEqual({ knownId: "thread-2", mountKey: "thread-2" });
  });

  it("changes the mountKey when explicitly resetting to a new thread", () => {
    const prev = { knownId: "thread-1", mountKey: "thread-1" };
    const next = computeNextChatSessionState(prev, null);
    expect(next).toEqual({ knownId: null, mountKey: "new" });
  });

  it("stays put when repeatedly unconfirmed (still null)", () => {
    const prev = { knownId: null, mountKey: "new" };
    expect(computeNextChatSessionState(prev, null)).toBe(prev);
  });
});
