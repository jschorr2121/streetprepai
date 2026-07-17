import { describe, expect, it } from "vitest";

import { chatMessages } from "@/lib/db/schema";
import {
  appendMessages,
  createThread,
  deleteThread,
  getMessages,
  getThread,
  listThreads,
  toStoredParts,
} from "@/lib/db/queries/chat";
import { createPgliteDb } from "../../../../helpers/pglite-db";

const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";
const THREAD_1 = "11111111-0000-4000-8000-000000000001";
const THREAD_2 = "11111111-0000-4000-8000-000000000002";

describe("lib/db/queries/chat", () => {
  it("round-trips a thread and scopes reads to the owner", async () => {
    const db = await createPgliteDb();
    await createThread(db, USER_A, THREAD_1, "How do I prep for LBOs?");

    const own = await getThread(db, USER_A, THREAD_1);
    expect(own?.title).toBe("How do I prep for LBOs?");

    expect(await getThread(db, USER_B, THREAD_1)).toBeNull();
    expect(await listThreads(db, USER_B)).toEqual([]);
  });

  it("lists threads most-recently-updated first", async () => {
    const db = await createPgliteDb();
    await createThread(db, USER_A, THREAD_1, "first");
    await createThread(db, USER_A, THREAD_2, "second");

    // Appending to the older thread bumps it to the top.
    await appendMessages(db, USER_A, THREAD_1, [
      { role: "user", parts: [{ type: "text", text: "hi" }] },
    ]);

    const threads = await listThreads(db, USER_A);
    expect(threads.map((t) => t.title)).toEqual(["first", "second"]);
  });

  it("round-trips messages in insertion order, even within one batch", async () => {
    const db = await createPgliteDb();
    await createThread(db, USER_A, THREAD_1, "t");

    await appendMessages(db, USER_A, THREAD_1, [
      { role: "user", parts: [{ type: "text", text: "question" }] },
      { role: "assistant", parts: [{ type: "text", text: "answer" }] },
    ]);
    await appendMessages(db, USER_A, THREAD_1, [
      { role: "user", parts: [{ type: "text", text: "follow-up" }] },
    ]);

    const messages = await getMessages(db, USER_A, THREAD_1);
    expect(messages.map((m) => [m.role, m.parts[0]?.text])).toEqual([
      ["user", "question"],
      ["assistant", "answer"],
      ["user", "follow-up"],
    ]);
    // Loaded rows satisfy the UIMessage shape (id + role + parts).
    expect(messages[0]?.id).toBeTruthy();

    // Cross-user read comes back empty.
    expect(await getMessages(db, USER_B, THREAD_1)).toEqual([]);
  });

  it("skips malformed content rows instead of failing the thread", async () => {
    const db = await createPgliteDb();
    await createThread(db, USER_A, THREAD_1, "t");
    await appendMessages(db, USER_A, THREAD_1, [
      { role: "user", parts: [{ type: "text", text: "good" }] },
    ]);
    await db.insert(chatMessages).values({
      threadId: THREAD_1,
      userId: USER_A,
      role: "assistant",
      content: { not: "a parts array" },
    });

    const messages = await getMessages(db, USER_A, THREAD_1);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.parts[0]?.text).toBe("good");
  });

  it("round-trips settled tool parts alongside text parts", async () => {
    const db = await createPgliteDb();
    await createThread(db, USER_A, THREAD_1, "t");
    const parts = toStoredParts([
      {
        type: "tool-get_applied_jobs",
        toolCallId: "call_1",
        state: "output-available",
        input: {},
        output: { count: 2, byStage: { applied: [] } },
      },
      { type: "text", text: "You have 2 applications." },
    ]);
    expect(parts).toHaveLength(2);
    await appendMessages(db, USER_A, THREAD_1, [{ role: "assistant", parts }]);

    const messages = await getMessages(db, USER_A, THREAD_1);
    expect(messages[0]?.parts.map((p) => p.type)).toEqual(["tool-get_applied_jobs", "text"]);
    const tool = messages[0]?.parts[0];
    expect(tool && "output" in tool ? tool.output : null).toEqual({
      count: 2,
      byStage: { applied: [] },
    });
  });

  it("toStoredParts drops transient/unknown parts and keeps settled ones", () => {
    const parts = toStoredParts([
      { type: "step-start" },
      { type: "text", text: "" },
      { type: "text", text: "kept", state: "done" },
      { type: "tool-search_chat_logs", toolCallId: "c1", state: "input-streaming", input: {} },
      {
        type: "tool-search_chat_logs",
        toolCallId: "c2",
        state: "output-error",
        input: { query: "x" },
        errorText: "Tool search_chat_logs failed",
      },
      "not even an object",
      { type: "source-url", sourceId: "s1", url: "https://example.com/a", title: "Example" },
      {
        type: "tool-web_search",
        toolCallId: "c3",
        state: "output-available",
        input: { query: "evercore deals" },
        output: [],
        providerExecuted: true,
      },
    ]);
    expect(parts).toEqual([
      { type: "text", text: "kept" },
      {
        type: "tool-search_chat_logs",
        toolCallId: "c2",
        state: "output-error",
        input: { query: "x" },
        errorText: "Tool search_chat_logs failed",
      },
      { type: "source-url", sourceId: "s1", url: "https://example.com/a", title: "Example" },
      {
        type: "tool-web_search",
        toolCallId: "c3",
        state: "output-available",
        input: { query: "evercore deals" },
        output: [],
        providerExecuted: true,
      },
    ]);
  });

  it("deleteThread cascades messages and refuses cross-user deletes", async () => {
    const db = await createPgliteDb();
    await createThread(db, USER_A, THREAD_1, "t");
    await appendMessages(db, USER_A, THREAD_1, [
      { role: "user", parts: [{ type: "text", text: "hi" }] },
    ]);

    // Someone else's delete is a no-op that reports not-found.
    expect(await deleteThread(db, USER_B, THREAD_1)).toBe(false);
    expect(await getThread(db, USER_A, THREAD_1)).not.toBeNull();

    expect(await deleteThread(db, USER_A, THREAD_1)).toBe(true);
    expect(await getThread(db, USER_A, THREAD_1)).toBeNull();
    // FK cascade removed the messages: re-creating the thread id shows none.
    await createThread(db, USER_A, THREAD_1, "t2");
    expect(await getMessages(db, USER_A, THREAD_1)).toEqual([]);
  });

  it("appendMessages with an empty batch is a no-op", async () => {
    const db = await createPgliteDb();
    await createThread(db, USER_A, THREAD_1, "t");
    const before = await getThread(db, USER_A, THREAD_1);
    await appendMessages(db, USER_A, THREAD_1, []);
    const after = await getThread(db, USER_A, THREAD_1);
    expect(after?.updatedAt).toBe(before?.updatedAt);
  });
});
