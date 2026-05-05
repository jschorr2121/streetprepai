import type { AppliedJob, AppliedJobStage } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  id: string;
  firm: string;
  role: string;
  group_name: string | null;
  deadline: string | null;
  url: string | null;
  stage: AppliedJobStage;
  notes: string | null;
  added_at: string;
  updated_at?: string | null;
};

function mapRow(r: DbRow): AppliedJob {
  return {
    id: r.id,
    firm: r.firm,
    role: r.role,
    group: r.group_name ?? undefined,
    deadline: r.deadline ?? undefined,
    url: r.url ?? undefined,
    stage: r.stage,
    notes: r.notes ?? undefined,
    addedAt: r.added_at,
    updatedAt: r.updated_at ?? undefined,
  };
}

export async function getAppliedJobs(userId: string): Promise<AppliedJob[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("applied_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}

export async function addAppliedJob(
  userId: string,
  input: {
    firm: string;
    role: string;
    group?: string;
    deadline?: string;
    url?: string;
    stage: AppliedJobStage;
    notes?: string;
  },
): Promise<AppliedJob> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("applied_jobs")
    .insert({
      user_id: userId,
      firm: input.firm,
      role: input.role,
      group_name: input.group ?? null,
      deadline: input.deadline ?? null,
      url: input.url ?? null,
      stage: input.stage,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function updateAppliedJob(
  userId: string,
  id: string,
  patch: Partial<{
    firm: string;
    role: string;
    group: string | undefined;
    deadline: string | undefined;
    url: string | undefined;
    stage: AppliedJobStage;
    notes: string | undefined;
  }>,
): Promise<AppliedJob> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.firm !== undefined) row.firm = patch.firm;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.stage !== undefined) row.stage = patch.stage;
  if (patch.group !== undefined) row.group_name = patch.group;
  if (patch.deadline !== undefined) row.deadline = patch.deadline;
  if (patch.url !== undefined) row.url = patch.url;
  if (patch.notes !== undefined) row.notes = patch.notes;

  const sb = await createClient();
  const { data, error } = await sb
    .from("applied_jobs")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function removeAppliedJob(userId: string, id: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb
    .from("applied_jobs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
