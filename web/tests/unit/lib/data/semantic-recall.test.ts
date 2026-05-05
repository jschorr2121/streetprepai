import { describe, expect, it, beforeEach, vi } from "vitest";

describe("findSimilarChats", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("calls the match_chat_embeddings rpc and maps rows to SimilarChat[]", async () => {
    const fakeVec = new Array(1536).fill(0.05);
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          chat_id: "chat-1",
          contact_id: "contact-a",
          summary_text: "topic: TMT",
          distance: 0.2,
        },
        {
          chat_id: "chat-2",
          contact_id: "contact-a",
          summary_text: "topic: ECM",
          distance: 0.5,
        },
      ],
      error: null,
    });
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: () => ({ rpc }),
    }));
    vi.doMock("@/lib/ai/embeddings", () => ({
      embedText: vi.fn().mockResolvedValue(fakeVec),
    }));

    const { findSimilarChats } = await import("@/lib/data/semantic-recall");
    const out = await findSimilarChats({
      userId: "user-x",
      contactId: "contact-a",
      queryText: "Alex Chen Goldman Sachs VP",
      k: 5,
    });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("match_chat_embeddings", {
      user_id_in: "user-x",
      contact_id_in: "contact-a",
      query_embedding: fakeVec,
      match_count: 5,
    });
    expect(out).toEqual([
      {
        chatId: "chat-1",
        contactId: "contact-a",
        summaryText: "topic: TMT",
        similarity: 0.8,
      },
      {
        chatId: "chat-2",
        contactId: "contact-a",
        summaryText: "topic: ECM",
        similarity: 0.5,
      },
    ]);
  });

  it("passes contact_id_in=null when contactId is omitted, defaults k=3", async () => {
    const fakeVec = new Array(1536).fill(0.01);
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: () => ({ rpc }),
    }));
    vi.doMock("@/lib/ai/embeddings", () => ({
      embedText: vi.fn().mockResolvedValue(fakeVec),
    }));
    const { findSimilarChats } = await import("@/lib/data/semantic-recall");
    await findSimilarChats({ userId: "u", queryText: "anything" });
    expect(rpc).toHaveBeenCalledWith("match_chat_embeddings", {
      user_id_in: "u",
      contact_id_in: null,
      query_embedding: fakeVec,
      match_count: 3,
    });
  });

  it("returns [] when admin client is null", async () => {
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: () => null,
    }));
    const embed = vi.fn();
    vi.doMock("@/lib/ai/embeddings", () => ({ embedText: embed }));
    const { findSimilarChats } = await import("@/lib/data/semantic-recall");
    const out = await findSimilarChats({ userId: "u", queryText: "x" });
    expect(out).toEqual([]);
    expect(embed).not.toHaveBeenCalled();
  });

  it("returns [] when queryText is empty/whitespace", async () => {
    const rpc = vi.fn();
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: () => ({ rpc }),
    }));
    vi.doMock("@/lib/ai/embeddings", () => ({ embedText: vi.fn() }));
    const { findSimilarChats } = await import("@/lib/data/semantic-recall");
    expect(await findSimilarChats({ userId: "u", queryText: "   " })).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns [] and logs when rpc returns an error", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "rpc boom" } });
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: () => ({ rpc }),
    }));
    vi.doMock("@/lib/ai/embeddings", () => ({
      embedText: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
    }));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { findSimilarChats } = await import("@/lib/data/semantic-recall");
    const out = await findSimilarChats({
      userId: "u",
      queryText: "q",
    });
    expect(out).toEqual([]);
    expect(err).toHaveBeenCalled();
  });

  it("returns [] and logs when embedText throws", async () => {
    const rpc = vi.fn();
    vi.doMock("@/lib/supabase/admin", () => ({
      getAdminClient: () => ({ rpc }),
    }));
    vi.doMock("@/lib/ai/embeddings", () => ({
      embedText: vi.fn().mockRejectedValue(new Error("openai down")),
    }));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { findSimilarChats } = await import("@/lib/data/semantic-recall");
    const out = await findSimilarChats({ userId: "u", queryText: "q" });
    expect(out).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
  });
});
