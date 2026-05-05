-- 0000_baseline.sql
-- Full initial schema for Street Prep AI.
-- All tables are per-user with RLS enforced. Service-role client bypasses RLS
-- for admin writes; the SSR client uses anon key + row-level security.
--
-- Apply order: this migration must run before all numbered migrations.

-- ──────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ──────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────────────
-- Profiles
-- One row per authenticated user. Upserted (not inserted) by the profile/save
-- route on every save. All columns nullable except user_id.
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  school           text,
  graduation_year  int,
  target_roles     text[]         not null default '{}',
  target_firms     text[]         not null default '{}',
  bio_summary      text,
  resume_raw_text  text,
  experiences      jsonb          not null default '[]',
  education        jsonb          not null default '[]',
  skills           text[]         not null default '{}',
  updated_at       timestamptz
);

alter table public.profiles enable row level security;
create policy profiles_owner on public.profiles
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Firms (read-only reference data — no per-user RLS needed)
-- Seeded by scripts/seed.ts; never written by user routes.
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.firms (
  slug                 text primary key,
  name                 text not null,
  tier                 text not null check (tier in ('bulge-bracket','elite-boutique','middle-market','regional-boutique')),
  hq                   text not null,
  description          text not null default '',
  latest_earnings_raw  text
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Jobs (read-only reference data — aggregated from public sources)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  firm        text not null,
  role        text not null,
  group_name  text,
  region      text,
  deadline    date,
  url         text,
  is_open     boolean not null default true,
  posted_at   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Contacts (per-user CRM entries)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id                  text primary key default gen_random_uuid()::text,
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  firm                text not null,
  group_name          text,
  title               text,
  school              text,
  grad_year           int,
  how_met             text,
  stage               text not null default 'cold' check (stage in ('cold','outreach-sent','warm','coffee-chat','interviewed','offer')),
  tags                text[]         not null default '{}',
  linkedin_bio        text,
  last_interaction_at date,
  last_contact_at     date,
  created_at          timestamptz not null default now()
);

create index if not exists contacts_user_idx on public.contacts (user_id);

alter table public.contacts enable row level security;
create policy contacts_owner on public.contacts
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Chats (post-coffee-chat notes and structured summaries)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.chats (
  id              text primary key default gen_random_uuid()::text,
  user_id         uuid not null references auth.users(id) on delete cascade,
  contact_id      text not null references public.contacts(id) on delete cascade,
  happened_at     date not null default now(),
  raw_notes       text,
  structured      jsonb,
  follow_up_draft jsonb
);

create index if not exists chats_user_idx on public.chats (user_id);
create index if not exists chats_contact_idx on public.chats (contact_id);

alter table public.chats enable row level security;
create policy chats_owner on public.chats
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Followups (per-contact action-item nudges)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.followups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  contact_id   text not null references public.contacts(id) on delete cascade,
  due_at       date not null,
  kind         text not null check (kind in ('post-chat','outreach')),
  note         text not null,
  completed_at timestamptz
);

create index if not exists followups_user_idx on public.followups (user_id);

alter table public.followups enable row level security;
create policy followups_owner on public.followups
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Calendar events (coffee chats, interviews, superdays)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.calendar_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  contact_id       text references public.contacts(id) on delete set null,
  chat_log_id      text references public.chats(id) on delete set null,
  title            text not null,
  kind             text not null check (kind in ('coffee_chat','interview','superday','deadline','other')),
  starts_at        timestamptz not null,
  duration_minutes int not null default 30,
  location         text,
  status           text not null default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  notes            text
);

create index if not exists calendar_user_idx on public.calendar_events (user_id);

alter table public.calendar_events enable row level security;
create policy calendar_owner on public.calendar_events
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Applied jobs (per-user job application tracker / Kanban)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.applied_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  firm        text not null,
  role        text not null,
  group_name  text,
  deadline    date,
  url         text,
  stage       text not null default 'bookmarked' check (
                stage in ('bookmarked','applied','screen','interview','superday','offer','rejected')
              ),
  notes       text,
  added_at    timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists applied_jobs_user_idx on public.applied_jobs (user_id);

alter table public.applied_jobs enable row level security;
create policy applied_jobs_owner on public.applied_jobs
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Mock interviews (recorded Q&A sessions with AI scoring)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.mock_interviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  question_text    text not null,
  mode             text not null check (mode in ('technical','behavioral','firm','superday','markets')),
  transcript       text,
  scorecard        jsonb,
  audio_metrics    jsonb,
  duration_seconds numeric,
  created_at       timestamptz not null default now()
);

create index if not exists mock_interviews_user_idx on public.mock_interviews (user_id);

alter table public.mock_interviews enable row level security;
create policy mock_interviews_owner on public.mock_interviews
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Stories (behavioral story bank with STAR framings)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.stories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  raw_experience  text not null,
  framings        jsonb not null default '[]',
  created_at      timestamptz not null default now()
);

create index if not exists stories_user_idx on public.stories (user_id);

alter table public.stories enable row level security;
create policy stories_owner on public.stories
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Guide progress (reading streaks and completion tracking)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.guide_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  guide_slug  text not null,
  read_at     timestamptz not null default now(),
  completed   boolean not null default false,
  constraint guide_progress_user_slug_unique unique (user_id, guide_slug)
);

create index if not exists guide_progress_user_idx on public.guide_progress (user_id);

alter table public.guide_progress enable row level security;
create policy guide_progress_owner on public.guide_progress
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
