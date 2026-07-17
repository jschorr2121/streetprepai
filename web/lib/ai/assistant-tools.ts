import { tool } from "ai";
import { z } from "zod";

import { getProfile } from "@/lib/data/profile";
import {
  getContacts,
  getContactById,
  getChatLogs,
  getChatLogsForContact,
} from "@/lib/data/contacts";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getFirmByQuery } from "@/lib/data/firms";
import { findSimilarChats } from "@/lib/data/semantic-recall";
import { withUser } from "@/lib/db/client";
import { getApplications } from "@/lib/db/queries/applications";
import { capText } from "@/lib/ai/sanitize";
import { APPLIED_JOB_STAGES } from "@/lib/validation/schemas/applied-jobs";

// Output caps — tool results flow back into the prompt; unbounded user-authored
// text (notes, resumes) is both a token-cost and prompt-injection surface.
const RESUME_TEXT_CAP = 8_000;
const NOTES_CAP = 1_500;
const SNIPPET_CAP = 400;
const MAX_CONTACT_ROWS = 100;

/**
 * Run a tool executor with the shared error contract: tool results flow back
 * through the model into user-visible text, so raw error internals (SQL,
 * hostnames, stack fragments) must never surface there.
 */
async function run<T>(toolName: string, fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[assistant-tools] ${toolName} failed:`, err);
    return { error: `Tool ${toolName} failed` };
  }
}

type ChatLogHit = {
  chatId: string;
  contactId: string;
  contactName: string;
  snippet: string;
  match: "semantic" | "keyword";
};

/**
 * AI SDK tool registry for the assistant chatbot. `userId` is closure-injected
 * by the route from the authenticated session — NEVER model input; the model
 * must not choose whose data to read. Input validation is the SDK's job
 * (`inputSchema` Zod), so executors only see typed, validated arguments.
 */
export function buildAssistantTools(userId: string) {
  return {
    get_resume: tool({
      description: "Retrieve the user's current resume and profile summary.",
      inputSchema: z.object({}),
      execute: () =>
        run("get_resume", async () => {
          const profile = await getProfile(userId);
          return {
            fullName: profile.fullName ?? null,
            school: profile.school,
            graduationYear: profile.graduationYear ?? null,
            targetRoles: profile.targetRoles,
            targetFirms: profile.targetFirms,
            bioSummary: profile.bioSummary ?? null,
            resumeText: profile.resumeRawText
              ? capText(profile.resumeRawText, RESUME_TEXT_CAP)
              : null,
            experiences: profile.experiences,
            education: profile.education,
            skills: profile.skills,
          };
        }),
    }),

    list_contacts: tool({
      description: "List the user's networking contacts, optionally filtered by stage or firm.",
      inputSchema: z.object({
        stage: z.string().optional().describe("Filter by contact stage."),
        firm: z.string().optional().describe("Filter by firm name (case-insensitive substring)."),
      }),
      execute: ({ stage, firm }) =>
        run("list_contacts", async () => {
          let contacts = await getContacts(userId);
          if (stage) contacts = contacts.filter((c) => c.stage === stage);
          if (firm) {
            const firmLower = firm.toLowerCase();
            contacts = contacts.filter((c) => c.firm.toLowerCase().includes(firmLower));
          }
          return contacts.slice(0, MAX_CONTACT_ROWS).map((c) => ({
            id: c.id,
            name: c.name,
            firm: c.firm,
            group: c.group,
            stage: c.stage,
            lastContactAt: c.lastContactAt,
          }));
        }),
    }),

    get_contact: tool({
      description: "Get detailed info for a specific contact, including their chat history.",
      inputSchema: z.object({ contactId: z.string().min(1).describe("The contact ID.") }),
      execute: ({ contactId }) =>
        run("get_contact", async () => {
          const [contact, chats] = await Promise.all([
            getContactById(contactId, userId),
            getChatLogsForContact(contactId, userId),
          ]);
          if (!contact) return { error: `Contact ${contactId} not found` };
          return {
            contact,
            chats: chats.map((c) => ({
              ...c,
              rawNotes: c.rawNotes ? capText(c.rawNotes, NOTES_CAP) : c.rawNotes,
            })),
          };
        }),
    }),

    get_upcoming_events: tool({
      description:
        "List the user's upcoming calendar events (coffee chats, interviews) within a time window.",
      inputSchema: z.object({
        daysAhead: z
          .number()
          .min(1)
          .max(365)
          .optional()
          .describe("Look ahead this many days (default: 14)."),
      }),
      execute: ({ daysAhead }) =>
        run("get_upcoming_events", async () => {
          const events = await getCalendarEvents(userId);
          const window = (daysAhead ?? 14) * 24 * 60 * 60 * 1000;
          const now = Date.now();
          return events.filter((e) => {
            if (e.status !== "upcoming") return false;
            const ts = new Date(e.startsAt).getTime();
            return ts >= now && ts <= now + window;
          });
        }),
    }),

    search_chat_logs: tool({
      description:
        "Search the user's past networking chat notes by topic or keyword. Combines semantic (meaning-based) and exact keyword matching. Optionally scope to contacts at one firm.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Search query."),
        firm: z
          .string()
          .optional()
          .describe("Only search chats with contacts at this firm (name substring)."),
      }),
      execute: ({ query, firm }) =>
        run("search_chat_logs", async () => {
          // Hybrid: semantic recall (pgvector over structured summaries) catches
          // paraphrases; keyword substring keeps exact matches working for chats
          // that were never embedded. findSimilarChats degrades to [] on its own.
          // With a firm scope we over-fetch semantic hits, then filter.
          const [contacts, allChats, semantic] = await Promise.all([
            getContacts(userId),
            getChatLogs(userId),
            findSimilarChats({ userId, queryText: query, k: firm ? 10 : 5 }),
          ]);
          const contactMap = new Map(contacts.map((c) => [c.id, c]));
          const firmLower = firm?.toLowerCase();
          const atFirm = (contactId: string) =>
            !firmLower ||
            (contactMap.get(contactId)?.firm.toLowerCase().includes(firmLower) ?? false);
          const hits: ChatLogHit[] = [];
          const seen = new Set<string>();

          for (const s of semantic) {
            if (!atFirm(s.contactId)) continue;
            seen.add(s.chatId);
            hits.push({
              chatId: s.chatId,
              contactId: s.contactId,
              contactName: contactMap.get(s.contactId)?.name ?? "Unknown",
              snippet: capText(s.summaryText, SNIPPET_CAP),
              match: "semantic",
            });
          }

          const q = query.toLowerCase();
          for (const chat of allChats) {
            if (seen.has(chat.id) || !atFirm(chat.contactId)) continue;
            const searchText = [
              chat.rawNotes,
              ...(chat.structured?.topics ?? []),
              ...(chat.structured?.adviceGiven ?? []),
            ]
              .join(" ")
              .toLowerCase();
            if (!searchText.includes(q)) continue;
            const idx = searchText.indexOf(q);
            hits.push({
              chatId: chat.id,
              contactId: chat.contactId,
              contactName: contactMap.get(chat.contactId)?.name ?? "Unknown",
              snippet: chat.rawNotes.slice(Math.max(0, idx - 40), idx + 120).trim(),
              match: "keyword",
            });
          }

          return { count: hits.length, hits };
        }),
    }),

    get_firm: tool({
      description:
        "Look up a firm's profile data (tier, HQ, description, latest earnings summary) by name, abbreviation, or slug — e.g. 'JPM', 'Goldman Sachs', 'evercore'.",
      inputSchema: z.object({
        firm: z.string().min(1).describe("Firm name, abbreviation, or slug."),
      }),
      execute: ({ firm }) =>
        run("get_firm", async () => {
          // Firms are shared read-only content — no user scoping needed. The
          // { firm } wrapper keeps the shape additive for the future firm_data
          // pipeline (earnings/deals/news rows).
          const match = await getFirmByQuery(firm);
          if (!match) return { error: `No firm found matching "${capText(firm, 100)}"` };
          return {
            firm: {
              ...match,
              latestEarningsRaw: match.latestEarningsRaw
                ? capText(match.latestEarningsRaw, 4_000)
                : null,
            },
          };
        }),
    }),

    get_applied_jobs: tool({
      description: "List jobs the user has applied to, optionally filtered by stage.",
      inputSchema: z.object({
        stage: z.enum(APPLIED_JOB_STAGES).optional().describe("Only return jobs at this stage."),
      }),
      execute: ({ stage }) =>
        run("get_applied_jobs", async () => {
          const applications = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
            getApplications(tx, userId, stage ? { stage } : {}),
          );

          // Group by stage for the chatbot's summary view.
          const byStage: Record<
            string,
            Array<{ id: string; firm: string; role: string; deadline?: string; notes?: string }>
          > = {};
          for (const app of applications) {
            (byStage[app.stage] ??= []).push({
              id: app.id,
              firm: app.firm,
              role: app.role,
              deadline: app.deadline,
              notes: app.notes,
            });
          }

          return { count: applications.length, byStage };
        }),
    }),
  };
}

export type AssistantTools = ReturnType<typeof buildAssistantTools>;
export type AssistantToolName = keyof AssistantTools;
