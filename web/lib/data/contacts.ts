import type { Contact, ChatLog } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type ContactRow = {
  id: string;
  name: string;
  firm: string;
  group_name: string | null;
  title: string | null;
  school: string | null;
  grad_year: number | null;
  how_met: string | null;
  stage: string;
  tags: string[] | null;
  linkedin_bio: string | null;
  last_interaction_at: string | null;
  last_contact_at: string | null;
};

type ChatRow = {
  id: string;
  contact_id: string;
  happened_at: string;
  raw_notes: string | null;
  structured: ChatLog["structured"] | null;
  follow_up_draft: ChatLog["followUpDraft"] | null;
};

function mapContactRow(r: ContactRow): Contact {
  return {
    id: r.id,
    name: r.name,
    firm: r.firm,
    group: r.group_name ?? undefined,
    title: r.title ?? "",
    school: r.school ?? undefined,
    gradYear: r.grad_year ?? undefined,
    linkedinBio: r.linkedin_bio ?? undefined,
    howMet: r.how_met ?? undefined,
    stage: r.stage as Contact["stage"],
    tags: r.tags ?? [],
    lastInteractionAt: r.last_interaction_at ?? undefined,
    lastContactAt: r.last_contact_at ?? undefined,
  };
}

function mapChatRow(r: ChatRow): ChatLog {
  return {
    id: r.id,
    contactId: r.contact_id,
    happenedAt: r.happened_at,
    rawNotes: r.raw_notes ?? "",
    structured: r.structured ?? undefined,
    followUpDraft: r.follow_up_draft ?? undefined,
  };
}

export async function getContacts(userId: string): Promise<Contact[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) throw error;
  return (data as ContactRow[]).map(mapContactRow);
}

export async function getContactById(
  id: string,
  userId: string,
): Promise<Contact | null> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapContactRow(data as ContactRow) : null;
}

export async function getChatLogs(userId: string): Promise<ChatLog[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("happened_at", { ascending: false });
  if (error) throw error;
  return (data as ChatRow[]).map(mapChatRow);
}

export async function getChatLogsForContact(
  contactId: string,
  userId: string,
): Promise<ChatLog[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("chats")
    .select("*")
    .eq("contact_id", contactId)
    .eq("user_id", userId)
    .order("happened_at", { ascending: false });
  if (error) throw error;
  return (data as ChatRow[]).map(mapChatRow);
}

// Optional fields admit explicit undefined because the caller passes a
// Zod-inferred object (z.optional() infers `string | undefined`).
export type CreateContactInput = {
  name: string;
  firm: string;
  title?: string | undefined;
  group?: string | undefined;
  school?: string | undefined;
  gradYear?: number | undefined;
  howMet?: string | undefined;
  stage: Contact["stage"];
  linkedinBio?: string | undefined;
};

export async function createContact(
  userId: string,
  input: CreateContactInput,
): Promise<Contact> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("contacts")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      name: input.name,
      firm: input.firm,
      title: input.title ?? null,
      group_name: input.group ?? null,
      school: input.school ?? null,
      grad_year: input.gradYear ?? null,
      how_met: input.howMet ?? null,
      stage: input.stage,
      tags: [],
      linkedin_bio: input.linkedinBio ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapContactRow(data as ContactRow);
}

/**
 * Updates a contact's pipeline stage. The `user_id` filter doubles as the
 * ownership check (RLS is the safety net): returns null when the row doesn't
 * exist or belongs to someone else.
 */
export async function updateContactStage(
  userId: string,
  id: string,
  stage: Contact["stage"],
): Promise<Contact | null> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("contacts")
    .update({ stage })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapContactRow(data as ContactRow) : null;
}


