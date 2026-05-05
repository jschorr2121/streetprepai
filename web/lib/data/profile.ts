import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  user_id: string;
  full_name: string | null;
  school: string | null;
  graduation_year: number | null;
  target_roles: string[] | null;
  target_firms: string[] | null;
  bio_summary: string | null;
  resume_raw_text: string | null;
  experiences: unknown[] | null;
  education: unknown[] | null;
  skills: string[] | null;
  updated_at: string | null;
};

function mapRow(r: DbRow): Profile {
  return {
    userId: r.user_id,
    fullName: r.full_name ?? undefined,
    school: r.school ?? undefined,
    graduationYear: r.graduation_year ?? undefined,
    targetRoles: r.target_roles ?? [],
    targetFirms: r.target_firms ?? [],
    bioSummary: r.bio_summary ?? undefined,
    resumeRawText: r.resume_raw_text ?? undefined,
    experiences: r.experiences ?? [],
    education: r.education ?? [],
    skills: r.skills ?? [],
    updatedAt: r.updated_at ?? undefined,
  };
}

function emptyProfile(userId: string): Profile {
  return {
    userId,
    targetRoles: [],
    targetFirms: [],
    experiences: [],
    education: [],
    skills: [],
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return emptyProfile(userId);
  return mapRow(data as DbRow);
}

export async function upsertProfile(
  userId: string,
  patch: Partial<{
    fullName: string;
    school: string;
    graduationYear: number;
    targetRoles: string[];
    targetFirms: string[];
    bioSummary: string;
    resumeRawText: string;
    experiences: unknown[];
    education: unknown[];
    skills: string[];
  }>,
): Promise<Profile> {
  const row: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  if ("fullName" in patch) row.full_name = patch.fullName;
  if ("school" in patch) row.school = patch.school;
  if ("graduationYear" in patch) row.graduation_year = patch.graduationYear;
  if ("targetRoles" in patch) row.target_roles = patch.targetRoles;
  if ("targetFirms" in patch) row.target_firms = patch.targetFirms;
  if ("bioSummary" in patch) row.bio_summary = patch.bioSummary;
  if ("resumeRawText" in patch) row.resume_raw_text = patch.resumeRawText;
  if ("experiences" in patch) row.experiences = patch.experiences;
  if ("education" in patch) row.education = patch.education;
  if ("skills" in patch) row.skills = patch.skills;

  const sb = await createClient();
  const { data, error } = await sb
    .from("profiles")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as DbRow);
}
