// Guard for db:push / db:migrate / db:studio — these run against whatever
// DATABASE_URL points to (normally the LIVE Supabase DB via .env.local), with
// no confirmation step. Require an explicit opt-in so a reflexive `pnpm
// db:push` can't clobber production schema.
//
// Usage: ALLOW_LIVE_DB=1 pnpm db:push

if (process.env.ALLOW_LIVE_DB !== "1") {
  console.error(
    [
      "✋ Refusing to run: this command talks directly to the database that",
      "   DATABASE_URL points at (usually the LIVE Supabase instance).",
      "",
      "   If you are sure, re-run with the opt-in flag:",
      "",
      "     ALLOW_LIVE_DB=1 pnpm db:push   (or db:migrate / db:studio)",
      "",
      "   Schema changes should normally land as SQL migration files instead",
      "   (web/supabase/migrations/), applied deliberately.",
    ].join("\n"),
  );
  process.exit(1);
}
