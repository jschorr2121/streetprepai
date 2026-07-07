import { and, desc, eq } from "drizzle-orm";

import type { Executor } from "@/lib/db/client";
import { appliedJobs } from "@/lib/db/schema";
import type { AppliedJob, AppliedJobStage } from "@/lib/types";

// ─── Row → domain type mapping ────────────────────────────────────────────────

function mapRow(r: typeof appliedJobs.$inferSelect): AppliedJob {
  return {
    id: r.id,
    firm: r.firm,
    role: r.role,
    group: r.groupName ?? undefined,
    deadline: r.deadline ?? undefined,
    url: r.url ?? undefined,
    stage: r.stage as AppliedJobStage,
    notes: r.notes ?? undefined,
    addedAt: r.addedAt ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? undefined,
  };
}

// ─── Query types ──────────────────────────────────────────────────────────────

export type GetApplicationsOpts = {
  stage?: AppliedJobStage;
};

export type CreateApplicationInput = {
  firm: string;
  role: string;
  group?: string;
  stage: AppliedJobStage;
  url?: string;
  deadline?: string;
  notes?: string;
};

export type UpdateApplicationInput = {
  firm?: string;
  role?: string;
  group?: string;
  stage?: AppliedJobStage;
  url?: string;
  deadline?: string;
  notes?: string;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List all applications for a user, optionally filtered by stage.
 * Returns most-recently-added first (added_at DESC).
 * Run inside `withUser` so RLS scopes the read to the signed-in user.
 */
export async function getApplications(
  db: Executor,
  userId: string,
  opts: GetApplicationsOpts = {},
): Promise<AppliedJob[]> {
  const conditions = [eq(appliedJobs.userId, userId)];
  if (opts.stage) {
    conditions.push(eq(appliedJobs.stage, opts.stage));
  }

  const rows = await db
    .select()
    .from(appliedJobs)
    .where(and(...conditions))
    .orderBy(desc(appliedJobs.addedAt));

  return rows.map(mapRow);
}

/**
 * Fetch a single application by id + userId. Returns null when not found or
 * not owned. Used by update/delete to perform the explicit ownership check
 * required by code-standards §Server Actions (step 4).
 */
export async function getApplicationById(
  db: Executor,
  id: string,
  userId: string,
): Promise<AppliedJob | null> {
  const rows = await db
    .select()
    .from(appliedJobs)
    .where(and(eq(appliedJobs.id, id), eq(appliedJobs.userId, userId)))
    .limit(1);

  const row = rows[0];
  return row ? mapRow(row) : null;
}

/**
 * Insert a new application row for the user.
 * Run inside `withUser` so the RLS WITH CHECK policy validates ownership.
 */
export async function createApplication(
  db: Executor,
  userId: string,
  input: CreateApplicationInput,
): Promise<AppliedJob> {
  const now = new Date().toISOString();
  const rows = await db
    .insert(appliedJobs)
    .values({
      userId,
      firm: input.firm,
      role: input.role,
      groupName: input.group ?? null,
      stage: input.stage,
      url: input.url ?? null,
      deadline: input.deadline ?? null,
      notes: input.notes ?? null,
      addedAt: now,
      updatedAt: now,
    })
    .returning();

  const row = rows[0];
  if (!row) throw new Error("Insert returned no rows.");
  return mapRow(row);
}

/**
 * Update mutable fields on an existing application row.
 * Caller must confirm ownership before invoking (ownership check is step 4 of
 * the Server Action skeleton; this query does not re-check it).
 * Run inside `withUser` so RLS USING policy applies as a safety net.
 */
export async function updateApplication(
  db: Executor,
  id: string,
  input: UpdateApplicationInput,
): Promise<AppliedJob> {
  const now = new Date().toISOString();

  const set: Record<string, unknown> = { updatedAt: now };
  if (input.firm !== undefined) set.firm = input.firm;
  if (input.role !== undefined) set.role = input.role;
  if (input.group !== undefined) set.groupName = input.group;
  if (input.stage !== undefined) set.stage = input.stage;
  if (input.url !== undefined) set.url = input.url;
  if (input.deadline !== undefined) set.deadline = input.deadline;
  if (input.notes !== undefined) set.notes = input.notes;

  const rows = await db.update(appliedJobs).set(set).where(eq(appliedJobs.id, id)).returning();

  const row = rows[0];
  if (!row) throw new Error("Update returned no rows — row may have been deleted.");
  return mapRow(row);
}

/**
 * Delete an application row by id.
 * Caller must confirm ownership before invoking.
 * Run inside `withUser` so RLS USING policy applies as a safety net.
 */
export async function deleteApplication(db: Executor, id: string): Promise<void> {
  await db.delete(appliedJobs).where(eq(appliedJobs.id, id));
}
