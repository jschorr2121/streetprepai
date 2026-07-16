import { addDays } from "date-fns";

import { createClient } from "@/lib/supabase/server";

export type FollowupKind = "post-chat" | "outreach";

/**
 * Normalizes a model-suggested due date ("ISO date if implied") to a
 * `YYYY-MM-DD` string for the `followups.due_at` date column. Unparseable or
 * missing input defaults to three days out.
 */
export function followupDueDate(dueBy: string | undefined, now: Date = new Date()): string {
  if (dueBy) {
    const iso = dueBy.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(iso))) return iso;
  }
  return addDays(now, 3).toISOString().slice(0, 10);
}

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

/** Returns false when the row doesn't exist or isn't the caller's (the
 * user_id filter doubles as the ownership check; RLS is the safety net). */
export async function completeFollowup(userId: string, id: string): Promise<boolean> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("followups")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function deleteFollowup(userId: string, id: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.from("followups").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
