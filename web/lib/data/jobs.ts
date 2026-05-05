import type { Job } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  id: string;
  firm: string;
  role: string;
  group_name: string | null;
  location: string;
  year_target: string;
  deadline: string | null;
  url: string;
  tags: string[] | null;
};

function mapRow(r: DbRow): Job {
  return {
    id: r.id,
    firm: r.firm,
    role: r.role,
    group: r.group_name ?? undefined,
    location: r.location,
    yearTarget: r.year_target,
    deadline: r.deadline ?? undefined,
    url: r.url,
    tags: r.tags ?? [],
  };
}

export async function getJobs(): Promise<Job[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}


export const seedJobs: Job[] = [
  {
    id: "j1",
    firm: "Goldman Sachs",
    role: "Investment Banking Summer Analyst",
    group: "Global",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-08-15",
    url: "https://www.goldmansachs.com/careers",
    tags: ["BB", "SA", "Rotational"],
  },
  {
    id: "j2",
    firm: "Morgan Stanley",
    role: "Investment Banking Summer Analyst",
    group: "TMT",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-07-31",
    url: "https://www.morganstanley.com/careers",
    tags: ["BB", "SA", "TMT"],
  },
  {
    id: "j3",
    firm: "JPMorgan",
    role: "Investment Banking Summer Analyst",
    group: "Healthcare",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-08-01",
    url: "https://careers.jpmorgan.com",
    tags: ["BB", "SA", "Healthcare"],
  },
  {
    id: "j4",
    firm: "Evercore",
    role: "Investment Banking Summer Analyst",
    group: "General Advisory",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-07-20",
    url: "https://www.evercore.com/careers",
    tags: ["EB", "SA", "M&A"],
  },
  {
    id: "j5",
    firm: "Lazard",
    role: "Investment Banking Summer Analyst",
    group: "Financial Advisory",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-07-25",
    url: "https://www.lazard.com/careers",
    tags: ["EB", "SA", "Generalist"],
  },
  {
    id: "j6",
    firm: "Centerview Partners",
    role: "Investment Banking Summer Analyst",
    group: "Generalist",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-07-10",
    url: "https://www.centerviewpartners.com/careers",
    tags: ["EB", "SA", "Elite"],
  },
  {
    id: "j7",
    firm: "Moelis & Company",
    role: "Investment Banking Summer Analyst",
    group: "Restructuring",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-08-05",
    url: "https://www.moelis.com/careers",
    tags: ["EB", "SA", "RX"],
  },
  {
    id: "j8",
    firm: "PJT Partners",
    role: "Investment Banking Summer Analyst",
    group: "Strategic Advisory",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-07-15",
    url: "https://pjtpartners.com/careers",
    tags: ["EB", "SA", "M&A"],
  },
  {
    id: "j9",
    firm: "Houlihan Lokey",
    role: "Investment Banking Summer Analyst",
    group: "Corporate Finance",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-08-10",
    url: "https://www.hl.com/careers",
    tags: ["MM", "SA", "Sponsor"],
  },
  {
    id: "j10",
    firm: "Jefferies",
    role: "Investment Banking Summer Analyst",
    group: "Leveraged Finance",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-08-01",
    url: "https://www.jefferies.com/careers",
    tags: ["MM", "SA", "LevFin"],
  },
  {
    id: "j11",
    firm: "Bank of America",
    role: "Investment Banking Summer Analyst",
    group: "Global Corporate & Investment Banking",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-08-15",
    url: "https://careers.bankofamerica.com",
    tags: ["BB", "SA", "GCIB"],
  },
  {
    id: "j12",
    firm: "Barclays",
    role: "Investment Banking Summer Analyst",
    group: "Natural Resources",
    location: "Houston, TX",
    yearTarget: "2027 Summer",
    deadline: "2026-07-30",
    url: "https://home.barclays/careers",
    tags: ["BB", "SA", "Energy"],
  },
  {
    id: "j13",
    firm: "Citi",
    role: "Investment Banking Summer Analyst",
    group: "Consumer & Retail",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-08-20",
    url: "https://www.citigroup.com/global/careers",
    tags: ["BB", "SA", "Consumer"],
  },
  {
    id: "j14",
    firm: "Guggenheim Securities",
    role: "Investment Banking Summer Analyst",
    group: "Generalist",
    location: "New York, NY",
    yearTarget: "2027 Summer",
    deadline: "2026-07-28",
    url: "https://www.guggenheimpartners.com/careers",
    tags: ["EB", "SA", "Generalist"],
  },
  {
    id: "j15",
    firm: "Harris Williams",
    role: "Investment Banking Summer Analyst",
    group: "Industrials",
    location: "Richmond, VA",
    yearTarget: "2027 Summer",
    deadline: "2026-08-10",
    url: "https://www.harriswilliams.com/careers",
    tags: ["MM", "SA", "Industrials"],
  },
];

export const allFirms = Array.from(new Set(seedJobs.map((j) => j.firm))).sort();
export const allRegions = Array.from(
  new Set(seedJobs.map((j) => j.location)),
).sort();
export const allTiers = ["BB", "EB", "MM"] as const;
