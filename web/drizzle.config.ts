import { defineConfig } from "drizzle-kit";

// drizzle-kit (pull / generate / migrate) talks to Postgres directly.
// Env is loaded by the `db:*` scripts in package.json via `node --env-file=.env.local`.
// Prefer the direct connection (port 5432) for schema ops where available; fall
// back to the pooler URL the app uses at runtime.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set for drizzle-kit. See .env.example.");
}

export default defineConfig({
  dialect: "postgresql",
  // Introspected schema (db:pull writes here). Hand-written index.ts barrel
  // re-exports the generated files and is never overwritten by pull.
  schema: "./lib/db/schema",
  out: "./lib/db/migrations",
  dbCredentials: { url },
  // Only manage the app's own tables; leave Supabase-internal schemas alone.
  schemaFilter: ["public"],
  casing: "snake_case",
  verbose: true,
  strict: true,
});
