import { APPLIED_JOB_STAGES } from "@/lib/validation/schemas/applied-jobs";

export const ASSISTANT_TOOLS_OPENAI = [
  {
    type: "function" as const,
    function: {
      name: "get_resume",
      description: "Retrieve the user's current resume and profile summary.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_applied_jobs",
      description: "List jobs the user has applied to, optionally filtered by stage.",
      parameters: {
        type: "object",
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
  },
  {
    type: "function" as const,
    function: {
      name: "list_contacts",
      description: "List networking contacts, optionally filtered by stage or firm.",
      parameters: {
        type: "object",
        properties: {
          stage: { type: "string", description: "Filter by contact stage." },
          firm: { type: "string", description: "Filter by firm name (case-insensitive)." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_contact",
      description: "Get detailed info for a contact, including chat history.",
      parameters: {
        type: "object",
        properties: {
          contactId: { type: "string", description: "The contact ID." },
        },
        required: ["contactId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_upcoming_events",
      description: "List upcoming calendar events within a time window.",
      parameters: {
        type: "object",
        properties: {
          daysAhead: { type: "number", description: "Look ahead this many days (default: 14)." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_chat_logs",
      description: "Search through all chat notes for a keyword or topic.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query." },
        },
        required: ["query"],
      },
    },
  },
];
