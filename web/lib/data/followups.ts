// Scheduled follow-ups across the user's network.
//
// TODO (needs Supabase + auth): persist follow-ups in a table keyed to (user_id, contact_id),
// derived from chat structured.followUps + outreach drafts the user accepted.

export type FollowupKind = "post-chat" | "outreach";

export interface Followup {
  id: string;
  contactId: string;
  /** ISO date the follow-up is due. May be in the past — those render as "overdue". */
  dueAt: string;
  kind: FollowupKind;
  /** Short human-readable note describing the follow-up angle. */
  note: string;
}

export const seedFollowups: Followup[] = [
  // c1 Alex Chen — past-due thank-you-style nudge
  {
    id: "fu1",
    contactId: "c1",
    dueAt: "2025-11-08",
    kind: "post-chat",
    note: "Check whether Alex's intro to Priya ever happened",
  },
  // c2 Priya Mehta — upcoming pre-coffee-chat prep nudge
  {
    id: "fu2",
    contactId: "c2",
    dueAt: "2026-04-21",
    kind: "post-chat",
    note: "Send confirmation note for in-person coffee at Evercore lobby",
  },
  // c3 Marcus Thompson — overdue post-final-round thank-you
  {
    id: "fu3",
    contactId: "c3",
    dueAt: "2026-02-16",
    kind: "post-chat",
    note: "Thank-you note after JPM Healthcare final round",
  },
  // c4 Jordan Ruiz — outreach cadence (soft check-in)
  {
    id: "fu4",
    contactId: "c4",
    dueAt: "2026-04-26",
    kind: "outreach",
    note: "Soft check-in on cold outreach — no response yet",
  },
  // c5 Samir Patel — upcoming pre-call prep
  {
    id: "fu5",
    contactId: "c5",
    dueAt: "2026-04-23",
    kind: "post-chat",
    note: "Reread MS Energy notes before Friday call",
  },
];
