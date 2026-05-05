import type { Contact, ChatLog } from "@/lib/types";

export function fakeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c_001",
    name: "Alex Chen",
    firm: "Goldman Sachs",
    group: "TMT",
    title: "Vice President",
    school: "Wharton",
    gradYear: 2018,
    linkedinBio: "VP at GS TMT, ex-Morgan Stanley TMT analyst.",
    howMet: "intro from career advisor",
    stage: "warm",
    tags: ["target", "tmt"],
    lastInteractionAt: "2026-04-15T18:00:00.000Z",
    lastContactAt: "2026-04-15T18:00:00.000Z",
    ...overrides,
  };
}

export function fakeChatLog(overrides: Partial<ChatLog> = {}): ChatLog {
  return {
    id: "chat_001",
    contactId: "c_001",
    happenedAt: "2026-04-15T18:00:00.000Z",
    rawNotes: "Talked about deal flow in Q1, mentioned a recent SaaS LBO they're modeling.",
    structured: {
      topics: ["deal flow", "SaaS LBO"],
      adviceGiven: ["read M&I 400 cover-to-cover"],
      commitments: ["intro to summer analyst on the desk"],
      personalDetails: ["from Boston, runs marathons"],
      followUps: [{ description: "send thank-you", dueBy: "2026-04-17" }],
    },
    ...overrides,
  };
}
