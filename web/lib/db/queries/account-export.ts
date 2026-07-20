import { eq } from "drizzle-orm";

import type { Executor } from "@/lib/db/client";
import {
  aiUsage,
  appliedJobs,
  calendarEvents,
  chapterProgress,
  chatEmbeddings,
  chatMessages,
  chats,
  chatThreads,
  contacts,
  feedback,
  followups,
  guideProgress,
  mockInterviews,
  profiles,
  qbankAttempts,
  qbankSpacedState,
  sectionProgress,
  stories,
  topicMastery,
} from "@/lib/db/schema";

// Self-serve data export (GDPR/CCPA portability). One query per user-owned
// table, run inside a single `withUser` transaction so RLS scopes every read
// to the signed-in user — this module never takes a raw userId without RLS
// backing it.
//
// Table coverage mirrors the cascade audit from the account-deletion work
// (every `user_id → auth.users(id) on delete cascade` FK across migrations
// 0000-0012). Two Drizzle schema files exist with NO backing table in any
// migration — `resumes` and `interview_sessions` (dead: no CREATE TABLE, no
// query-site imports) — and are intentionally excluded here; see
// app/api/account/export/route.ts meta.notes.
//
// Vector columns (`chats.embedding`, `chat_embeddings.embedding`) are raw
// float arrays with no value to a human reading their export, so both
// queries select an explicit column list that omits `embedding`. The human-
// readable text those vectors were derived from (`chats.rawNotes` /
// `chats.structured`, `chatEmbeddings.summaryText`) is still included.

export type AccountExportData = {
  profile: typeof profiles.$inferSelect | null;
  contacts: (typeof contacts.$inferSelect)[];
  chats: Omit<typeof chats.$inferSelect, "embedding">[];
  chatEmbeddings: Omit<typeof chatEmbeddings.$inferSelect, "embedding">[];
  followups: (typeof followups.$inferSelect)[];
  calendarEvents: (typeof calendarEvents.$inferSelect)[];
  appliedJobs: (typeof appliedJobs.$inferSelect)[];
  mockInterviews: (typeof mockInterviews.$inferSelect)[];
  stories: (typeof stories.$inferSelect)[];
  guideProgress: (typeof guideProgress.$inferSelect)[];
  aiUsage: (typeof aiUsage.$inferSelect)[];
  qbankAttempts: (typeof qbankAttempts.$inferSelect)[];
  qbankSpacedState: (typeof qbankSpacedState.$inferSelect)[];
  topicMastery: (typeof topicMastery.$inferSelect)[];
  sectionProgress: (typeof sectionProgress.$inferSelect)[];
  chapterProgress: (typeof chapterProgress.$inferSelect)[];
  chatThreads: (typeof chatThreads.$inferSelect)[];
  chatMessages: (typeof chatMessages.$inferSelect)[];
  feedback: (typeof feedback.$inferSelect)[];
};

/**
 * Every user-owned row across the app's tables, grouped by table. Run inside
 * `withUser({ sub: userId, role: "authenticated" }, ...)` — queries below
 * rely on RLS (auth.uid() = user_id) as the real access boundary, the
 * `eq(table.userId, userId)` filters are belt-and-suspenders.
 */
export async function exportAccountData(db: Executor, userId: string): Promise<AccountExportData> {
  const [
    profileRow,
    contactsRows,
    chatsRows,
    chatEmbeddingsRows,
    followupsRows,
    calendarEventsRows,
    appliedJobsRows,
    mockInterviewsRows,
    storiesRows,
    guideProgressRows,
    aiUsageRows,
    qbankAttemptsRows,
    qbankSpacedStateRows,
    topicMasteryRows,
    sectionProgressRows,
    chapterProgressRows,
    chatThreadsRows,
    chatMessagesRows,
    feedbackRows,
  ] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, userId)),
    db.select().from(contacts).where(eq(contacts.userId, userId)),
    db
      .select({
        id: chats.id,
        userId: chats.userId,
        contactId: chats.contactId,
        happenedAt: chats.happenedAt,
        rawNotes: chats.rawNotes,
        structured: chats.structured,
        followUpDraft: chats.followUpDraft,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(eq(chats.userId, userId)),
    db
      .select({
        chatId: chatEmbeddings.chatId,
        userId: chatEmbeddings.userId,
        contactId: chatEmbeddings.contactId,
        summaryText: chatEmbeddings.summaryText,
        createdAt: chatEmbeddings.createdAt,
      })
      .from(chatEmbeddings)
      .where(eq(chatEmbeddings.userId, userId)),
    db.select().from(followups).where(eq(followups.userId, userId)),
    db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)),
    db.select().from(appliedJobs).where(eq(appliedJobs.userId, userId)),
    db.select().from(mockInterviews).where(eq(mockInterviews.userId, userId)),
    db.select().from(stories).where(eq(stories.userId, userId)),
    db.select().from(guideProgress).where(eq(guideProgress.userId, userId)),
    db.select().from(aiUsage).where(eq(aiUsage.userId, userId)),
    db.select().from(qbankAttempts).where(eq(qbankAttempts.userId, userId)),
    db.select().from(qbankSpacedState).where(eq(qbankSpacedState.userId, userId)),
    db.select().from(topicMastery).where(eq(topicMastery.userId, userId)),
    db.select().from(sectionProgress).where(eq(sectionProgress.userId, userId)),
    db.select().from(chapterProgress).where(eq(chapterProgress.userId, userId)),
    db.select().from(chatThreads).where(eq(chatThreads.userId, userId)),
    db.select().from(chatMessages).where(eq(chatMessages.userId, userId)),
    db.select().from(feedback).where(eq(feedback.userId, userId)),
  ]);

  return {
    profile: profileRow[0] ?? null,
    contacts: contactsRows,
    chats: chatsRows,
    chatEmbeddings: chatEmbeddingsRows,
    followups: followupsRows,
    calendarEvents: calendarEventsRows,
    appliedJobs: appliedJobsRows,
    mockInterviews: mockInterviewsRows,
    stories: storiesRows,
    guideProgress: guideProgressRows,
    aiUsage: aiUsageRows,
    qbankAttempts: qbankAttemptsRows,
    qbankSpacedState: qbankSpacedStateRows,
    topicMastery: topicMasteryRows,
    sectionProgress: sectionProgressRows,
    chapterProgress: chapterProgressRows,
    chatThreads: chatThreadsRows,
    chatMessages: chatMessagesRows,
    feedback: feedbackRows,
  };
}
