import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Singleton Drizzle client over the Supabase transaction pooler. `prepare: false`
// is required for the pooler's transaction mode (prepared statements aren't
// supported there). Cached on globalThis so dev/HMR reloads don't open new
// connections on every change.
//
// Created lazily on first use (not at import) so that `next build`'s page-data
// collection — which imports route modules — doesn't require DATABASE_URL.
// Missing env still fails fast with a clear error on the first query.
const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see .env.example.");
  }
  const client = globalForDb._pgClient ?? postgres(connectionString, { prepare: false });
  if (process.env.NODE_ENV !== "production") globalForDb._pgClient = client;
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

let _db: Database | undefined;

// The client connects as the pooler's privileged role, which bypasses RLS. Use
// it directly only in background jobs / admin paths. For user-facing reads and
// writes, go through `withUser` so RLS policies are enforced.
export function getDb(): Database {
  _db ??= createDb();
  return _db;
}
// The transaction executor type, derived without importing Drizzle internals.
// Query functions accept `Executor` so the same function works standalone or
// inside a transaction (per code-standards: `fn(db, ...args)`).
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Executor = Database | Transaction;

export type SupabaseToken = { sub?: string; role?: string };

const ALLOWED_ROLES = new Set(["authenticated", "anon", "service_role"]);

/**
 * Run `fn` inside a transaction scoped to a Supabase user so RLS policies
 * (auth.uid(), auth.jwt()) apply. Sets `request.jwt.claims` + the local role for
 * the duration of the transaction, then resets them. This is the hybrid
 * `getUserDb` strategy from the Unit 3 spec — Drizzle everywhere, RLS enforced
 * transparently.
 */
export async function withUser<T>(
  token: SupabaseToken,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const role = token.role && ALLOWED_ROLES.has(token.role) ? token.role : "authenticated";
  return getDb().transaction(async (tx) => {
    // One round trip for all three GUCs. `is_local = true` makes them
    // transaction-local — Postgres reverts them automatically on COMMIT or
    // ROLLBACK, so no teardown statements are needed (the old 3-statement
    // setup + 3-statement teardown cost 6 pooler round trips per call).
    // Setting the `role` GUC via set_config is equivalent to SET LOCAL ROLE.
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(token)}, true),
                 set_config('request.jwt.claim.sub', ${token.sub ?? ""}, true),
                 set_config('role', ${role}, true)`,
    );
    return await fn(tx);
  });
}
