-- ──────────────────────────────────────────────────────────────────────────────
-- Unit: Curriculum + Question Bank (context/curriculum.md)
-- Shared content: qbank_questions, qbank_followups (read-only to users; seeded
-- by 0007_qbank_seed.sql via service role). User state: qbank_attempts,
-- qbank_spaced_state, topic_mastery, section_progress, chapter_progress.
-- Profiles gain the advanced-track toggle.
-- Idempotent: safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────────

-- Question bank — shared content
create table if not exists public.qbank_questions (
  id text primary key,
  topic text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_type text not null check (
    question_type in ('conceptual', 'single-step', 'multi-step', 'calculation', 'verbal', 'curveball')
  ),
  prompt text not null,
  key_points jsonb not null default '[]'::jsonb,
  misconceptions jsonb not null default '[]'::jsonb,
  model_answer text not null,
  chapter_slug text,
  section_slug text,
  advanced boolean not null default false,
  source text not null default 'curated' check (source in ('curated', 'ai_generated')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists qbank_questions_topic_idx on public.qbank_questions (topic, difficulty);
create index if not exists qbank_questions_chapter_idx on public.qbank_questions (chapter_slug, section_slug);

alter table public.qbank_questions enable row level security;
do $$ begin
  create policy qbank_questions_read on public.qbank_questions
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

create table if not exists public.qbank_followups (
  id text primary key,
  question_id text not null references public.qbank_questions (id) on delete cascade,
  ordinal integer not null,
  prompt text not null,
  model_answer text not null
);

create index if not exists qbank_followups_question_idx on public.qbank_followups (question_id, ordinal);

alter table public.qbank_followups enable row level security;
do $$ begin
  create policy qbank_followups_read on public.qbank_followups
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

-- Question bank — user state
create table if not exists public.qbank_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null references public.qbank_questions (id) on delete cascade,
  followup_id text references public.qbank_followups (id) on delete set null,
  answer text not null,
  score numeric(5, 2) not null,
  correct boolean not null,
  rubric_breakdown jsonb not null default '{}'::jsonb,
  context text not null default 'qbank' check (context in ('qbank', 'section-drill', 'chapter-gate', 'daily-drill')),
  answered_at timestamptz not null default now()
);

create index if not exists qbank_attempts_user_idx on public.qbank_attempts (user_id, answered_at desc);
create index if not exists qbank_attempts_question_idx on public.qbank_attempts (user_id, question_id);

alter table public.qbank_attempts enable row level security;
do $$ begin
  create policy qbank_attempts_owner on public.qbank_attempts
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create table if not exists public.qbank_spaced_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null references public.qbank_questions (id) on delete cascade,
  next_due_at timestamptz not null,
  interval_days integer not null default 2,
  consecutive_correct integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists qbank_spaced_due_idx on public.qbank_spaced_state (user_id, next_due_at);

alter table public.qbank_spaced_state enable row level security;
do $$ begin
  create policy qbank_spaced_state_owner on public.qbank_spaced_state
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Mastery — one row per user per curriculum topic
create table if not exists public.topic_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  score numeric(4, 3) not null default 0,
  attempts integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

alter table public.topic_mastery enable row level security;
do $$ begin
  create policy topic_mastery_owner on public.topic_mastery
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Learning-flow progress
create table if not exists public.section_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_slug text not null,
  section_slug text not null,
  read_at timestamptz,
  drill_score numeric(5, 2),
  drill_completed_at timestamptz,
  primary key (user_id, chapter_slug, section_slug)
);

create index if not exists section_progress_user_idx on public.section_progress (user_id, chapter_slug);

alter table public.section_progress enable row level security;
do $$ begin
  create policy section_progress_owner on public.section_progress
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create table if not exists public.chapter_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_slug text not null,
  gate_score numeric(5, 2),
  gate_passed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_slug)
);

alter table public.chapter_progress enable row level security;
do $$ begin
  create policy chapter_progress_owner on public.chapter_progress
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Profile: advanced-track toggle (PE-bound / prior-experience users see ⭐ sections)
alter table public.profiles
  add column if not exists advanced_track boolean not null default false;
