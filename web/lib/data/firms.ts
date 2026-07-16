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


