-- 0008_profile_tour.sql
-- Product tour — adds tour_completed_at so the first-time spotlight
-- walkthrough shows once per user and never again (same nullable-timestamp
-- pattern as onboarded_at in 0004).
--
-- Idempotent: safe to run multiple times.

alter table public.profiles
  add column if not exists tour_completed_at timestamptz;
