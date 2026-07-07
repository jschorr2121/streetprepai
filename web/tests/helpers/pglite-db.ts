/**
 * PGlite-backed Drizzle test harness.
 *
 * Spins up an in-memory Postgres instance via PGlite and returns a Drizzle
 * client over it. Query functions (`lib/db/queries/**`) accept the `Executor`
 * type and call standard Drizzle operations (select/insert/update/delete) that
 * PGlite supports identically to real Postgres.
 *
 * NOTE: PGlite is bare Postgres — it does NOT enforce Supabase RLS policies
 * (those require auth.uid() from the Supabase auth extension). These tests
 * prove the QUERY's where-clause filtering, column mapping, and upsert
 * behaviour. RLS enforcement was separately verified against the live DB.
 *
 * Usage:
 *   const db = await createPgliteDb();
 *   // db is typed as Executor — pass it directly to query functions.
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import type { Executor } from "@/lib/db/client";

/**
 * Creates an isolated in-memory PGlite Drizzle instance with the minimal
 * schema tables needed by lib/db/queries tests (profiles, applied_jobs).
 * Each call returns a fresh database with empty tables.
 */
export async function createPgliteDb(): Promise<Executor> {
  const pg = new PGlite();
  const db = drizzle(pg);

  // Create the tables used by the query functions. Column names and types must
  // match the Drizzle schema in lib/db/schema/ exactly.
  await db.execute(`
    create table profiles (
      user_id         uuid          primary key,
      full_name       text,
      school          text,
      graduation_year integer,
      target_roles    text[],
      target_firms    text[],
      bio_summary     text,
      resume_raw_text text,
      experiences     jsonb,
      education       jsonb,
      skills          text[],
      current_semester text,
      onboarded_at    timestamptz,
      updated_at      timestamptz default now()
    )
  `);

  await db.execute(`
    create table applied_jobs (
      id          uuid          primary key default gen_random_uuid(),
      user_id     uuid          not null,
      firm        text          not null,
      role        text          not null,
      group_name  text,
      deadline    date,
      url         text,
      stage       text          not null,
      notes       text,
      added_at    timestamptz   default now(),
      updated_at  timestamptz   default now()
    )
  `);

  // PGliteDatabase satisfies the Drizzle query builder interface that Executor
  // describes. The cast is safe: Executor is Database | Transaction, both of
  // which expose the same query builder surface that PGliteDatabase implements.
  return db as unknown as Executor;
}
