# Row-Level Security Policies

All per-user tables use a single owner policy that grants full access (SELECT,
INSERT, UPDATE, DELETE) to authenticated users on their own rows. The service-role
client (used by server-side admin writes) bypasses RLS entirely.

| Table             | Policy name          | Condition               |
|-------------------|----------------------|-------------------------|
| `profiles`        | `profiles_owner`     | `auth.uid() = user_id`  |
| `contacts`        | `contacts_owner`     | `auth.uid() = user_id`  |
| `chats`           | `chats_owner`        | `auth.uid() = user_id`  |
| `followups`       | `followups_owner`    | `auth.uid() = user_id`  |
| `calendar_events` | `calendar_owner`     | `auth.uid() = user_id`  |
| `applied_jobs`    | `applied_jobs_owner` | `auth.uid() = user_id`  |
| `mock_interviews` | `mock_interviews_owner` | `auth.uid() = user_id` |
| `stories`         | `stories_owner`      | `auth.uid() = user_id`  |
| `guide_progress`  | `guide_progress_owner` | `auth.uid() = user_id` |
| `ai_usage`        | `ai_usage_user_read` | `auth.uid() = user_id` (SELECT only; inserts via service role) |
| `chat_embeddings` | `chat_embeddings_user_read` | `auth.uid() = user_id` (SELECT only; writes via service role) |

## Public / reference tables (no RLS)

| Table   | Notes                                         |
|---------|-----------------------------------------------|
| `firms` | Read by all authenticated and anonymous users |
| `jobs`  | Read by all authenticated and anonymous users |

## Verifying policies

```sql
-- List all policies on a table:
select * from pg_policies where tablename = 'contacts';

-- Test as a specific user (replace UUID):
set request.jwt.claims = '{"sub":"<user-uuid>","role":"authenticated"}';
select * from contacts;  -- should return only that user's rows
reset request.jwt.claims;
```
