export interface TimestampedWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface AudioMetrics {
  /** Words per minute, computed over total speaking time (excludes leading/trailing silence). */
  wpm: number;
  /** Count of filler tokens detected in the transcript. */
  fillerCount: number;
  /** Fraction of inter-word time spent in pauses > 400ms (0..1). */
  pauseRatio: number;
  /** Longest inter-word pause in milliseconds. */
  longestPauseMs: number;
  /** Total speaking duration in milliseconds, from first word start to last word end. */
  totalSpeakingMs: number;
}

const FILLER_PHRASES = [
  "you know",
  "sort of",
  "kind of",
];

const FILLER_WORDS = new Set([
  "uh",
  "um",
  "like",
  "basically",
]);

const PAUSE_THRESHOLD_MS = 400;

/**
 * Analyze a sequence of timestamped words from Whisper into delivery metrics.
 * Pure function — easy to unit-test, no I/O.
 */
export function analyzeAudio(words: TimestampedWord[]): AudioMetrics {
  if (!words || words.length === 0) {
    return {
      wpm: 0,
      fillerCount: 0,
      pauseRatio: 0,
      longestPauseMs: 0,
      totalSpeakingMs: 0,
    };
  }

  // Total speaking duration: first start → last end.
  const totalSpeakingMs = Math.max(
    0,
    Math.round((words[words.length - 1]!.end - words[0]!.start) * 1000),
  );

  const minutes = totalSpeakingMs / 60_000;
  const wpm = minutes > 0 ? Math.round(words.length / minutes) : 0;

  // Pause analysis — sum gaps and find max gap.
  let totalGapMs = 0;
  let pauseGapMs = 0;
  let longestPauseMs = 0;
  for (let i = 1; i < words.length; i++) {
    const gapMs = Math.max(
      0,
      Math.round((words[i]!.start - words[i - 1]!.end) * 1000),
    );
    totalGapMs += gapMs;
    if (gapMs > longestPauseMs) longestPauseMs = gapMs;
    if (gapMs > PAUSE_THRESHOLD_MS) pauseGapMs += gapMs;
  }
  const pauseRatio =
    totalGapMs > 0 ? Math.min(1, pauseGapMs / totalGapMs) : 0;

  // Filler detection — work over the full normalized transcript so multi-word
  // fillers ("you know") match across token boundaries, then scan single tokens.
  const normalized = words
    .map((w) => w.word.toLowerCase().replace(/[^a-z' ]/g, "").trim())
    .filter((w) => w.length > 0);
  const joined = " " + normalized.join(" ") + " ";

  let fillerCount = 0;
  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(`(?:^|\\s)${phrase}(?=\\s|$)`, "g");
    const matches = joined.match(re);
    if (matches) fillerCount += matches.length;
  }
  for (const tok of normalized) {
    if (FILLER_WORDS.has(tok)) fillerCount += 1;
  }

  return {
    wpm,
    fillerCount,
    pauseRatio: Number(pauseRatio.toFixed(3)),
    longestPauseMs,
    totalSpeakingMs,
  };
}
