import type { GuideProgressEntry } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  id: string;
  user_id: string;
  guide_slug: string;
  read_at: string;
  completed: boolean;
};

function mapRow(r: DbRow): GuideProgressEntry {
  return {
    id: r.id,
    guideSlug: r.guide_slug,
    readAt: r.read_at,
    completed: r.completed,
  };
}

export async function getGuideProgress(userId: string): Promise<GuideProgressEntry[]> {
  const sb = await createClient();
  const { data, error } = await sb.from("guide_progress").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}

export async function markGuideRead(userId: string, guideSlug: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.from("guide_progress").upsert(
    {
      user_id: userId,
      guide_slug: guideSlug,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,guide_slug", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function markGuideCompleted(userId: string, guideSlug: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.from("guide_progress").upsert(
    {
      user_id: userId,
      guide_slug: guideSlug,
      read_at: new Date().toISOString(),
      completed: true,
    },
    { onConflict: "user_id,guide_slug" },
  );
  if (error) throw error;
}

export async function getCompletedSlugs(userId: string): Promise<Set<string>> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("guide_progress")
    .select("guide_slug")
    .eq("user_id", userId)
    .eq("completed", true);
  if (error) throw error;
  return new Set((data as { guide_slug: string }[]).map((r) => r.guide_slug));
}

export type StreakResult = {
  current: number;
  longest: number;
  last28: boolean[];
};

export function computeStreak(entries: GuideProgressEntry[]): StreakResult {
  if (entries.length === 0) {
    return { current: 0, longest: 0, last28: new Array(28).fill(false) };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeDays = new Set(
    entries.map((e) => {
      const d = new Date(e.readAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );

  const last28: boolean[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last28.push(activeDays.has(d.getTime()));
  }

  let current = 0;
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (activeDays.has(d.getTime())) {
      current++;
    } else {
      break;
    }
  }

  let longest = 0;
  let run = 0;
  const sortedDays = Array.from(activeDays).sort((a, b) => a - b);
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = sortedDays[i - 1];
      const cur = sortedDays[i];
      if (prev !== undefined && cur !== undefined && cur - prev === 86_400_000) {
        run++;
      } else {
        run = 1;
      }
    }
    if (run > longest) longest = run;
  }

  return { current, longest, last28 };
}
