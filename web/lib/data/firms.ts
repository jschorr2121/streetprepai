import type { Firm } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  slug: string;
  name: string;
  tier: string;
  hq: string;
  description: string;
  latest_earnings_raw: string | null;
};

function mapRow(r: DbRow): Firm {
  return {
    slug: r.slug,
    name: r.name,
    tier: r.tier as Firm["tier"],
    hq: r.hq,
    description: r.description,
    latestEarningsRaw: r.latest_earnings_raw ?? undefined,
  };
}

export async function getAllFirms(): Promise<Firm[]> {
  const sb = await createClient();
  const { data, error } = await sb.from("firms").select("*").order("name");
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}

export async function getFirmBySlug(slug: string): Promise<Firm | null> {
  const sb = await createClient();
  const { data, error } = await sb.from("firms").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as DbRow) : null;
}

/**
 * Fuzzy firm lookup for the chatbot's get_firm tool. Pure so it's unit-testable
 * against a fixed list; matching order = exact slug → exact normalized name →
 * word initials ("jpm" → "J.P. Morgan", "gs" → "Goldman Sachs") → substring.
 */
export function matchFirm(firms: Firm[], query: string): Firm | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/gi, "");
  const q = norm(query);
  if (!q) return null;

  // Split on every non-alphanumeric run so "J.P. Morgan" → j+p+m = "jpm".
  const initials = (name: string) =>
    name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("");

  return (
    firms.find((f) => f.slug === query.trim().toLowerCase()) ??
    firms.find((f) => norm(f.name) === q) ??
    firms.find((f) => initials(f.name) === q || norm(f.name).startsWith(q)) ??
    firms.find((f) => norm(f.name).includes(q)) ??
    null
  );
}

export async function getFirmByQuery(query: string): Promise<Firm | null> {
  return matchFirm(await getAllFirms(), query);
}
