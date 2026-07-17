import type { UIMessage } from "ai";

import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getMessages, listThreads } from "@/lib/db/queries/chat";
import { AssistantChat } from "./_components/chat";

export default async function ChatbotPage() {
  const user = await requireUser();

  // Issue 01 scope: resume the most recent thread, or start fresh. The thread
  // rail with switching/deleting is issue 05.
  const { threadId, messages } = await withUser<{
    threadId: string | null;
    messages: UIMessage[];
  }>({ sub: user.id, role: "authenticated" }, async (tx) => {
    const threads = await listThreads(tx, user.id);
    const latest = threads[0];
    if (!latest) return { threadId: null, messages: [] };
    return { threadId: latest.id, messages: await getMessages(tx, user.id, latest.id) };
  });

  // Mobile has the sticky h-14 top bar; desktop main starts at the viewport top.
  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-3xl flex-col px-6 pt-8 md:px-10 lg:h-dvh">
      <PageHeader
        eyebrow="Tool · AI mentor"
        title="Chatbot"
        description="Your standalone IB prep mentor — technicals, recruiting strategy, networking. Conversations are saved."
      />
      <AssistantChat initialThreadId={threadId} initialMessages={messages} />
    </div>
  );
}
