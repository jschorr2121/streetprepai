-- 0004_profiles_onboarding.sql
-- Unit 4 — Auth UI + middleware + onboarding.
--
-- Adds the two columns required for the onboarding gate:
--   current_semester  text         — validated by Zod enum on the app side (plain text
--                                    column; no Postgres enum so migrations stay easy).
--   onboarded_at      timestamptz  — set by completeOnboardingAction; null = not yet
--                                    onboarded. Middleware redirects to /onboarding
--                                    while this is null.
--
-- The policy `profiles_owner` already exists from 0000_baseline.sql with
-- `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`. The
-- RLS verification block below is idempotent — it only adds the policy if
-- it is somehow missing.
--
-- Idempotent: safe to run multiple times.

alter table public.profiles
  add column if not exists current_semester text,
  add column if not exists onboarded_at     timestamptz;

-- ──────────────────────────────────────────────────────────────────────────────
-- RLS verification (idempotent)
-- Confirm the owner policy is present; add it if it was somehow dropped.
-- ──────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'profiles'
      and policyname = 'profiles_owner'
  ) then
    create policy profiles_owner on public.profiles
      using  (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
