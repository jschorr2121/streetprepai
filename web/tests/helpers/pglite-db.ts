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
 * schema tables needed by lib/db/queries tests (profiles, applied_jobs,
 * chat_threads, chat_messages, qbank_questions, qbank_followups,
 * qbank_attempts, qbank_spaced_state, topic_mastery, section_progress,
 * chapter_progress).
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
      advanced_track  boolean       not null default false,
      onboarded_at    timestamptz,
      tour_completed_at timestamptz,
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

  await db.execute(`
    create table chat_threads (
      id          uuid          primary key default gen_random_uuid(),
      user_id     uuid          not null,
      title       text          not null,
      created_at  timestamptz   not null default now(),
      updated_at  timestamptz   not null default now()
    )
  `);

  await db.execute(`
    create table chat_messages (
      id          uuid          primary key default gen_random_uuid(),
      seq         bigint        generated always as identity,
      thread_id   uuid          not null references chat_threads (id) on delete cascade,
      user_id     uuid          not null,
      role        text          not null check (role in ('user', 'assistant')),
      content     jsonb         not null,
      created_at  timestamptz   not null default now()
    )
  `);

  // Question bank — shared content (lib/db/schema/qbank.ts).
  await db.execute(`
    create table qbank_questions (
      id              text          primary key,
      topic           text          not null,
      difficulty      text          not null,
      question_type   text          not null,
      prompt          text          not null,
      key_points      jsonb         not null default '[]'::jsonb,
      misconceptions  jsonb         not null default '[]'::jsonb,
      model_answer    text          not null,
      chapter_slug    text,
      section_slug    text,
      advanced        boolean       not null default false,
      source          text          not null default 'curated',
      active          boolean       not null default true,
      created_at      timestamptz   not null default now()
    )
  `);

  await db.execute(`
    create table qbank_followups (
      id            text    primary key,
      question_id   text    not null,
      ordinal       integer not null,
      prompt        text    not null,
      model_answer  text    not null
    )
  `);

  // Question bank — user state (lib/db/schema/qbank.ts).
  await db.execute(`
    create table qbank_attempts (
      id                 uuid          primary key default gen_random_uuid(),
      user_id            uuid          not null,
      question_id        text          not null,
      followup_id        text,
      answer             text          not null,
      score               numeric(5, 2) not null,
      correct            boolean       not null,
      rubric_breakdown   jsonb         not null default '{}'::jsonb,
      context            text          not null default 'qbank',
      answered_at        timestamptz   not null default now()
    )
  `);

  await db.execute(`
    create table qbank_spaced_state (
      user_id              uuid          not null,
      question_id          text          not null,
      next_due_at          timestamptz   not null,
      interval_days        integer       not null default 2,
      consecutive_correct  integer       not null default 0,
      updated_at           timestamptz   not null default now(),
      primary key (user_id, question_id)
    )
  `);

  // Curriculum progress — topic mastery (lib/db/schema/curriculum-progress.ts).
  await db.execute(`
    create table topic_mastery (
      user_id     uuid          not null,
      topic       text          not null,
      score       numeric(4, 3) not null default 0,
      attempts    integer       not null default 0,
      updated_at  timestamptz   not null default now(),
      primary key (user_id, topic)
    )
  `);

  // Curriculum progress — section drills + chapter gates
  // (lib/db/schema/curriculum-progress.ts).
  await db.execute(`
    create table section_progress (
      user_id             uuid          not null,
      chapter_slug        text          not null,
      section_slug        text          not null,
      read_at             timestamptz,
      drill_score         numeric(5, 2),
      drill_completed_at  timestamptz,
      primary key (user_id, chapter_slug, section_slug)
    )
  `);

  await db.execute(`
    create table chapter_progress (
      user_id         uuid          not null,
      chapter_slug    text          not null,
      gate_score      numeric(5, 2),
      gate_passed_at  timestamptz,
      completed_at    timestamptz,
      updated_at      timestamptz   not null default now(),
      primary key (user_id, chapter_slug)
    )
  `);

  // PGliteDatabase satisfies the Drizzle query builder interface that Executor
  // describes. The cast is safe: Executor is Database | Transaction, both of
  // which expose the same query builder surface that PGliteDatabase implements.
  return db as unknown as Executor;
}
