/**
 * Typed registry of cache tags used with `unstable_cache` and `revalidateTag`.
 *
 * Centralising tag construction here keeps the caching layer and invalidation
 * sites in lockstep — if a tag string is renamed, every callsite updates with
 * it instead of drifting apart and silently failing to invalidate.
 *
 * Public reads (firms, jobs, guides) are wrapped in `unstable_cache` and
 * tagged so that mutations elsewhere can revalidate them. Per-user reads
 * (contacts, calendar, profile, etc.) are NOT currently wrapped — the
 * per-user tag helpers exist for a future pass when we revisit the cardinality
 * tradeoff. The `revalidateTag` calls referencing them today are no-ops, but
 * harmless, and ready to take effect the moment the corresponding read is
 * wrapped.
 */
export const CACHE_TAGS = {
  guides: "guides", // public, content-driven
  guide: (slug: string) => `guide:${slug}`,
  firms: "firms", // public list
  firm: (slug: string) => `firm:${slug}`,
  jobs: "jobs", // public job feed
  // Per-user tags (for revalidating after user mutations):
  userContacts: (userId: string) => `user:${userId}:contacts`,
  userCalendar: (userId: string) => `user:${userId}:calendar`,
  userAppliedJobs: (userId: string) => `user:${userId}:applied-jobs`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  userFollowups: (userId: string) => `user:${userId}:followups`,
  userGuideProgress: (userId: string) => `user:${userId}:guide-progress`,
  userStories: (userId: string) => `user:${userId}:stories`,
  userMockInterviews: (userId: string) => `user:${userId}:mock-interviews`,
} as const;
