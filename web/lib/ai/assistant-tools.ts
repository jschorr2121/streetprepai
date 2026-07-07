import { getProfile } from "@/lib/data/profile";
import {
  getContacts,
  getContactById,
  getChatLogs,
  getChatLogsForContact,
} from "@/lib/data/contacts";
import { getCalendarEvents } from "@/lib/data/calendar";
import { withUser } from "@/lib/db/client";
import { getApplications } from "@/lib/db/queries/applications";
import type { AppliedJobStage } from "@/lib/types";
import { APPLIED_JOB_STAGES } from "@/lib/validation/schemas/applied-jobs";

export const ASSISTANT_TOOLS = [
  {
    name: "get_resume",
    description: "Retrieve the user's current resume and profile summary.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_contacts",
    description: "List networking contacts, optionally filtered by stage or firm.",
    input_schema: {
      type: "object" as const,
      properties: {
        stage: { type: "string", description: "Filter by contact stage." },
        firm: { type: "string", description: "Filter by firm name (case-insensitive substring)." },
      },
      required: [],
    },
  },
  {
    name: "get_contact",
    description: "Get detailed info for a specific contact, including their chat history.",
    input_schema: {
      type: "object" as const,
      properties: {
        contactId: { type: "string", description: "The contact ID." },
      },
      required: ["contactId"],
    },
  },
  {
    name: "get_upcoming_events",
    description: "List upcoming calendar events (coffee chats, interviews) within a time window.",
    input_schema: {
      type: "object" as const,
      properties: {
        daysAhead: {
          type: "number",
          description: "Look ahead this many days (default: 14).",
        },
      },
      required: [],
    },
  },
  {
    name: "search_chat_logs",
    description: "Search through all chat notes for a keyword or topic.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_applied_jobs",
    description: "List jobs the user has applied to, optionally filtered by stage.",
    input_schema: {
      type: "object" as const,
      properties: {
        stage: {
          type: "string",
          enum: [...APPLIED_JOB_STAGES],
          description: "Only return jobs at this stage.",
        },
      },
      required: [],
    },
  },
  {
    name: "web_search",
    description: "Search the web for current market news, firm info, or deal updates.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query." },
      },
      required: ["query"],
    },
  },
];

export async function executeTool(
  userId: string,
  toolName: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  try {
    switch (toolName) {
      case "get_resume": {
        const profile = await getProfile(userId);
        return {
          fullName: profile.fullName ?? null,
          school: profile.school,
          graduationYear: profile.graduationYear ?? null,
          targetRoles: profile.targetRoles,
          targetFirms: profile.targetFirms,
          bioSummary: profile.bioSummary ?? null,
          resumeText: profile.resumeRawText ?? null,
          experiences: profile.experiences,
          education: profile.education,
          skills: profile.skills,
        };
      }

      case "list_contacts": {
        let contacts = await getContacts(userId);
        if (input.stage) {
          contacts = contacts.filter((c) => c.stage === input.stage);
        }
        if (input.firm && typeof input.firm === "string") {
          const firmLower = input.firm.toLowerCase();
          contacts = contacts.filter((c) => c.firm.toLowerCase().includes(firmLower));
        }
        return contacts.map((c) => ({
          id: c.id,
          name: c.name,
          firm: c.firm,
          group: c.group,
          stage: c.stage,
          lastContactAt: c.lastContactAt,
        }));
      }

      case "get_contact": {
        const contactId = input.contactId as string;
        const contact = await getContactById(contactId, userId);
        if (!contact) return { error: `Contact ${contactId} not found` };
        const chats = await getChatLogsForContact(contactId, userId);

        return { contact, chats };
      }

      case "get_upcoming_events": {
        const daysAhead = typeof input.daysAhead === "number" ? input.daysAhead : 14;
        const events = await getCalendarEvents(userId);
        const cutoff = Date.now() + daysAhead * 24 * 60 * 60 * 1000;
        return events.filter((e) => {
          if (e.status !== "upcoming") return false;
          const ts = new Date(e.startsAt).getTime();
          return ts >= Date.now() && ts <= cutoff;
        });
      }

      case "search_chat_logs": {
        const query = (input.query as string).toLowerCase();
        const [contacts, allChats] = await Promise.all([getContacts(userId), getChatLogs(userId)]);
        const contactMap = new Map(contacts.map((c) => [c.id, c]));
        const hits: Array<{
          chatId: string;
          contactId: string;
          contactName: string;
          snippet: string;
        }> = [];

        for (const chat of allChats) {
          const searchText = [
            chat.rawNotes,
            ...(chat.structured?.topics ?? []),
            ...(chat.structured?.adviceGiven ?? []),
          ]
            .join(" ")
            .toLowerCase();

          if (searchText.includes(query)) {
            const idx = searchText.indexOf(query);
            const snippet = chat.rawNotes.slice(Math.max(0, idx - 40), idx + 120).trim();
            const contact = contactMap.get(chat.contactId);
            hits.push({
              chatId: chat.id,
              contactId: chat.contactId,
              contactName: contact?.name ?? "Unknown",
              snippet,
            });
          }
        }

        return { count: hits.length, hits };
      }

      case "get_applied_jobs": {
        // Validate the optional stage filter at the boundary.
        const stage =
          typeof input.stage === "string" &&
          (APPLIED_JOB_STAGES as readonly string[]).includes(input.stage)
            ? (input.stage as AppliedJobStage)
            : undefined;

        const applications = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
          getApplications(tx, userId, stage ? { stage } : {}),
        );

        // Group by stage for the chatbot's summary view.
        const byStage: Record<
          string,
          Array<{ id: string; firm: string; role: string; deadline?: string; notes?: string }>
        > = {};
        for (const app of applications) {
          if (!byStage[app.stage]) byStage[app.stage] = [];
          byStage[app.stage]!.push({
            id: app.id,
            firm: app.firm,
            role: app.role,
            deadline: app.deadline,
            notes: app.notes,
          });
        }

        return { count: applications.length, byStage };
      }

      case "web_search": {
        return { results: [], note: "Web search not available in this context." };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Tool execution failed" };
  }
}
