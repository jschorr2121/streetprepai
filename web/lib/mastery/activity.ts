// Engagement math — pure functions over activity timestamps (no DB, no
// network). Days are bucketed in UTC to match the server-side timestamps.

export type ActivitySummary = {
  /** One flag per day in the window, oldest first. */
  activeDays: boolean[];
  /** Consecutive active days ending today (or yesterday if today is quiet). */
  currentStreak: number;
  /** Longest run of consecutive active days inside the window. */
  longestStreak: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDayIndex(d: Date): number {
  return Math.floor(d.getTime() / DAY_MS);
}

export function summarizeActivity(events: Date[], now: Date, windowDays = 28): ActivitySummary {
  const today = utcDayIndex(now);
  const start = today - (windowDays - 1);
  const active = new Set<number>();
  for (const e of events) {
    const idx = utcDayIndex(e);
    if (idx >= start && idx <= today) active.add(idx);
  }

  const activeDays = Array.from({ length: windowDays }, (_, i) => active.has(start + i));

  // Current streak counts back from today; a quiet today doesn't break a
  // streak that ran through yesterday.
  let currentStreak = 0;
  let cursor = active.has(today) ? today : today - 1;
  while (active.has(cursor)) {
    currentStreak++;
    cursor--;
  }

  let longestStreak = 0;
  let run = 0;
  for (const isActive of activeDays) {
    run = isActive ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  return { activeDays, currentStreak, longestStreak };
}
