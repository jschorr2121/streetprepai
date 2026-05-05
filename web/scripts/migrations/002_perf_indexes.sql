-- 002_perf_indexes.sql
--
-- Performance indexes for the most frequently queried (user_id, <col>)
-- pairs in `lib/data/*`. The base schema already creates single-column
-- indexes on `user_id` for every per-user table; this migration adds
-- composite and partial indexes that match the actual access patterns
-- (sorted reads, "open" filters, foreign-key lookups).
--
-- All indexes are idempotent (`create index if not exists`).
--
-- Verification:
--   After applying, run EXPLAIN ANALYZE against representative queries
--   and confirm the planner picks the new index instead of a sequential
--   scan or generic user_id index. Examples:
--
--     explain analyze
--     select * from followups
--     where user_id = '<uuid>' and completed_at is null
--     order by due_at;
--
--     explain analyze
--     select * from applied_jobs
--     where user_id = '<uuid>' and stage = 'applied';
--
--     explain analyze
--     select * from mock_interviews
--     where user_id = '<uuid>'
--     order by created_at desc;

-- ──────────────────────────────────────────────
-- Followups: hot path for "what's due / open"
-- Source: lib/data/followups.ts → getFollowups()
--   .eq("user_id", …).is("completed_at", null).order("due_at")
-- Partial index excludes already-completed rows from the index, keeping
-- it small and matching the .is("completed_at", null) predicate.
-- ──────────────────────────────────────────────
create index if not exists followups_user_due_open_idx
  on public.followups (user_id, due_at)
  where completed_at is null;

-- ──────────────────────────────────────────────
-- Applied jobs: pipeline / Kanban board reads
-- Source: lib/data/applied-jobs.ts → getAppliedJobs()
--   .eq("user_id", …).order("added_at", { ascending: false })
-- Composite (user_id, added_at desc) covers the sorted listing and any
-- per-user stage filter the UI may add (planner can use the leading
-- user_id portion).
-- ──────────────────────────────────────────────
create index if not exists applied_jobs_user_added_idx
  on public.applied_jobs (user_id, added_at desc);
create index if not exists applied_jobs_user_stage_idx
  on public.applied_jobs (user_id, stage);

-- ──────────────────────────────────────────────
-- Contacts: name-sorted listing + stage filtering
-- Source: lib/data/contacts.ts → getContacts()
--   .eq("user_id", …).order("name")
-- ──────────────────────────────────────────────
create index if not exists contacts_user_name_idx
  on public.contacts (user_id, name);
create index if not exists contacts_user_stage_idx
  on public.contacts (user_id, stage);

-- ──────────────────────────────────────────────
-- Chats: per-contact and per-user history
-- Source: lib/data/contacts.ts
--   getChatLogs():        .eq("user_id", …).order("happened_at" desc)
--   getChatLogsForContact: .eq("contact_id", …).eq("user_id", …)
--                          .order("happened_at" desc)
-- Composite (user_id, contact_id) helps the per-contact path (Wave 5
-- pgvector backfill will also exercise it). Composite (user_id,
-- happened_at desc) helps the all-chats timeline.
-- ──────────────────────────────────────────────
create index if not exists chats_user_contact_idx
  on public.chats (user_id, contact_id);
create index if not exists chats_user_happened_idx
  on public.chats (user_id, happened_at desc);

-- ──────────────────────────────────────────────
-- Calendar events: upcoming list, sorted by start time
-- Source: lib/data/calendar.ts → getCalendarEvents()
--   .eq("user_id", …).order("starts_at")
-- ──────────────────────────────────────────────
create index if not exists calendar_user_starts_idx
  on public.calendar_events (user_id, starts_at);

-- ──────────────────────────────────────────────
-- Mock interviews: most-recent-first listing
-- Source: lib/data/mock-interviews.ts → getMockInterviews()
--   .eq("user_id", …).order("created_at", { ascending: false })
-- ──────────────────────────────────────────────
create index if not exists mock_interviews_user_created_idx
  on public.mock_interviews (user_id, created_at desc);

-- ──────────────────────────────────────────────
-- Stories: most-recent-first listing
-- Source: lib/data/stories.ts → getStories()
--   .eq("user_id", …).order("created_at", { ascending: false })
-- ──────────────────────────────────────────────
create index if not exists stories_user_created_idx
  on public.stories (user_id, created_at desc);

-- ──────────────────────────────────────────────
-- Guide progress: completed-only filter + uniqueness already covers
-- (user_id, guide_slug) lookups via the unique constraint, but a
-- partial index speeds up the completed-streak read path.
-- Source: lib/data/guide-progress.ts → getCompletedSlugs()
--   .eq("user_id", …).eq("completed", true)
-- ──────────────────────────────────────────────
create index if not exists guide_progress_user_completed_idx
  on public.guide_progress (user_id, guide_slug)
  where completed = true;

-- ──────────────────────────────────────────────
-- Index → source query crosswalk
-- ──────────────────────────────────────────────
-- followups_user_due_open_idx           lib/data/followups.ts        getFollowups (open, due_at asc)
-- applied_jobs_user_added_idx           lib/data/applied-jobs.ts     getAppliedJobs (added_at desc)
-- applied_jobs_user_stage_idx           lib/data/applied-jobs.ts     stage filter (Kanban columns)
-- contacts_user_name_idx                lib/data/contacts.ts         getContacts (order by name)
-- contacts_user_stage_idx               lib/data/contacts.ts         stage filter (pipeline view)
-- chats_user_contact_idx                lib/data/contacts.ts         getChatLogsForContact
-- chats_user_happened_idx               lib/data/contacts.ts         getChatLogs (timeline)
-- calendar_user_starts_idx              lib/data/calendar.ts         getCalendarEvents (upcoming)
-- mock_interviews_user_created_idx      lib/data/mock-interviews.ts  getMockInterviews
-- stories_user_created_idx              lib/data/stories.ts          getStories
-- guide_progress_user_completed_idx     lib/data/guide-progress.ts   getCompletedSlugs
