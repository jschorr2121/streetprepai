-- 0011_ai_usage_user_id_not_null.sql
-- Security-review Low #16: `ai_usage.user_id` was created nullable (0001) for
-- "callers that haven't been swept to pass the user yet". That sweep is now
-- complete — every write path (lib/ai/usage.ts logUsage, every AI route,
-- embeddings/grading/chat-title helpers) supplies a real user_id. A NULL row
-- breaks per-user spend-cap accounting (lib/ai/usage.ts assertUnderQuota, which
-- filters `user_id = :uid`): unattributable spend that no cap can see.
--
-- This migration is IDEMPOTENT (safe to re-run) and live-data-aware: it clears
-- any existing NULL rows before enforcing the constraint.
--
-- Backfill strategy — DELETE the NULL rows (not backfill):
--   These rows carry no recoverable owner. They predate the sweep (and the old
--   lazy-thenable logUsage bug era) and there is no column from which a user_id
--   could be reconstructed, so no attribution is possible. Because every
--   per-user read already filters `user_id = :uid`, NULL rows are invisible to
--   real users' recorded spend — deleting them cannot lower anyone's total or
--   loosen any cap. They only pollute global aggregates, so removing them is the
--   only sound way to reach NOT NULL. The count is surfaced via RAISE NOTICE.

do $$
declare
  orphan_count bigint;
begin
  -- 1) Remove unattributable orphan rows (user_id IS NULL). Guarded by the
  --    count so a re-run on already-clean data is a no-op with no notice noise.
  select count(*) into orphan_count from public.ai_usage where user_id is null;
  if orphan_count > 0 then
    delete from public.ai_usage where user_id is null;
    raise notice 'ai_usage: deleted % orphan row(s) with NULL user_id', orphan_count;
  end if;

  -- 2) Add NOT NULL only if it is not already enforced (guarded ALTER →
  --    re-running this migration after it has applied is a no-op).
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_usage'
      and column_name = 'user_id'
      and is_nullable = 'YES'
  ) then
    alter table public.ai_usage alter column user_id set not null;
    raise notice 'ai_usage.user_id: NOT NULL constraint added';
  end if;
end $$;
