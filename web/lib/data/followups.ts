import { createClient } from "@/lib/supabase/server";

export type FollowupKind = "post-chat" | "outreach";

export interface Followup {
  id: string;
  contactId: string;
  dueAt: string;
  kind: FollowupKind;
  note: string;
  completedAt?: string;
}

type DbRow = {
  id: string;
  contact_id: string;
  due_at: string;
  kind: string;
  note: string;
  completed_at: string | null;
};

function mapRow(r: DbRow): Followup {
  return {
    id: r.id,
    contactId: r.contact_id,
    dueAt: r.due_at,
    kind: r.kind as FollowupKind,
    note: r.note,
    completedAt: r.completed_at ?? undefined,
  };
}

export async function getFollowups(userId: string): Promise<Followup[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("followups")
    .select("*")
    .eq("user_id", userId)
    .is("completed_at", null)
    .order("due_at");
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}

export async function createFollowup(
  userId: string,
  input: { contactId: string; dueAt: string; kind: FollowupKind; note: string },
): Promise<Followup> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("followups")
    .insert({
      user_id: userId,
      contact_id: input.contactId,
      due_at: input.dueAt,
      kind: input.kind,
      note: input.note,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function completeFollowup(userId: string, id: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb
    .from("followups")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteFollowup(userId: string, id: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.from("followups").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
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
