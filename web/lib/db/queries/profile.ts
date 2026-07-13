import { eq } from "drizzle-orm";

import type { Executor } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/lib/types";

// Drizzle port of lib/data/profile.ts#getProfile. Behaviour is identical: maps
// the snake_case row to the camelCase Profile shape and returns an empty profile
// when no row exists, so existing callers don't need to change their handling.

function mapRow(r: typeof profiles.$inferSelect): Profile {
  return {
    userId: r.userId,
    fullName: r.fullName ?? undefined,
    school: r.school ?? undefined,
    graduationYear: r.graduationYear ?? undefined,
    currentSemester: r.currentSemester ?? undefined,
    targetRoles: r.targetRoles ?? [],
    targetFirms: r.targetFirms ?? [],
    bioSummary: r.bioSummary ?? undefined,
    resumeRawText: r.resumeRawText ?? undefined,
    experiences: (r.experiences as unknown[] | null) ?? [],
    education: (r.education as unknown[] | null) ?? [],
    skills: r.skills ?? [],
    advancedTrack: r.advancedTrack,
    onboardedAt: r.onboardedAt ?? undefined,
    tourCompletedAt: r.tourCompletedAt ?? undefined,
    updatedAt: r.updatedAt ?? undefined,
  };
}

export function emptyProfile(userId: string): Profile {
  return {
    userId,
    targetRoles: [],
    targetFirms: [],
    experiences: [],
    education: [],
    skills: [],
  };
}

// Takes the executor explicitly so the same function works against `db` or a
// transaction (e.g. inside `withUser` for RLS-scoped reads).
export async function getProfile(db: Executor, userId: string): Promise<Profile> {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  const row = rows[0];
  return row ? mapRow(row) : emptyProfile(userId);
}

// The editable subset of the profile the user can update from the /profile page.
// Mirrors the shape of `ProfileSaveSchema` from lib/validation/schemas/profile.ts.
export type UpdateProfileFields = {
  fullName?: string;
  school?: string;
  graduationYear?: number;
  targetRoles?: string[];
  targetFirms?: string[];
  bioSummary?: string;
  resumeRawText?: string;
  experiences?: unknown[];
  education?: unknown[];
  skills?: string[];
  advancedTrack?: boolean;
};

/**
 * Upsert the profile row for the given user. Uses `insert … on conflict (user_id)
 * do update` so the row is created if missing (e.g. new OAuth user who skipped
 * onboarding) or updated in-place otherwise.
 *
 * Run inside `withUser(token, fn)` so the RLS `auth.uid()` check applies.
 *
 * This is the write-path Drizzle proof for Unit 6 — the canonical reference
 * for how profile mutations are performed.
 */
export async function updateProfile(
  db: Executor,
  userId: string,
  fields: UpdateProfileFields,
): Promise<Profile> {
  const now = new Date().toISOString();

  const values = {
    userId,
    ...(fields.fullName !== undefined && { fullName: fields.fullName }),
    ...(fields.school !== undefined && { school: fields.school }),
    ...(fields.graduationYear !== undefined && { graduationYear: fields.graduationYear }),
    ...(fields.targetRoles !== undefined && { targetRoles: fields.targetRoles }),
    ...(fields.targetFirms !== undefined && { targetFirms: fields.targetFirms }),
    ...(fields.bioSummary !== undefined && { bioSummary: fields.bioSummary }),
    ...(fields.resumeRawText !== undefined && { resumeRawText: fields.resumeRawText }),
    ...(fields.experiences !== undefined && { experiences: fields.experiences }),
    ...(fields.education !== undefined && { education: fields.education }),
    ...(fields.skills !== undefined && { skills: fields.skills }),
    ...(fields.advancedTrack !== undefined && { advancedTrack: fields.advancedTrack }),
    updatedAt: now,
  };

  const rows = await db
    .insert(profiles)
    .values(values)
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        ...(fields.fullName !== undefined && { fullName: values.fullName }),
        ...(fields.school !== undefined && { school: values.school }),
        ...(fields.graduationYear !== undefined && { graduationYear: values.graduationYear }),
        ...(fields.targetRoles !== undefined && { targetRoles: values.targetRoles }),
        ...(fields.targetFirms !== undefined && { targetFirms: values.targetFirms }),
        ...(fields.bioSummary !== undefined && { bioSummary: values.bioSummary }),
        ...(fields.resumeRawText !== undefined && { resumeRawText: values.resumeRawText }),
        ...(fields.experiences !== undefined && { experiences: values.experiences }),
        ...(fields.education !== undefined && { education: values.education }),
        ...(fields.skills !== undefined && { skills: values.skills }),
        ...(fields.advancedTrack !== undefined && { advancedTrack: values.advancedTrack }),
        updatedAt: values.updatedAt,
      },
    })
    .returning();

  const row = rows[0];
  return row ? mapRow(row) : emptyProfile(userId);
}

// Stamps tour_completed_at so the first-time spotlight walkthrough shows once
// and never again. Run inside `withUser` so RLS scopes the write.
export async function markTourCompleted(db: Executor, userId: string): Promise<void> {
  await db
    .update(profiles)
    .set({ tourCompletedAt: new Date().toISOString() })
    .where(eq(profiles.userId, userId));
}

export type SetOnboardedFields = {
  school: string;
  graduationYear: number;
  currentSemester: string;
  targetFirms: string[];
  advancedTrack: boolean;
};

// First user-facing write through Drizzle (Unit 4). Upserts the onboarding
// fields and stamps `onboarded_at`, marking the profile as onboarded. Run inside
// `withUser` so RLS scopes the write to the signed-in user.
export async function setOnboarded(
  db: Executor,
  userId: string,
  fields: SetOnboardedFields,
): Promise<Profile> {
  const now = new Date().toISOString();
  const values = {
    userId,
    school: fields.school,
    graduationYear: fields.graduationYear,
    currentSemester: fields.currentSemester,
    targetFirms: fields.targetFirms,
    advancedTrack: fields.advancedTrack,
    onboardedAt: now,
    updatedAt: now,
  };

  const rows = await db
    .insert(profiles)
    .values(values)
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        school: values.school,
        graduationYear: values.graduationYear,
        currentSemester: values.currentSemester,
        targetFirms: values.targetFirms,
        advancedTrack: values.advancedTrack,
        onboardedAt: values.onboardedAt,
        updatedAt: values.updatedAt,
      },
    })
    .returning();

  const row = rows[0];
  return row ? mapRow(row) : emptyProfile(userId);
}
