import type { UIMessage } from "ai";

import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getMessages, listThreads, type ChatThread } from "@/lib/db/queries/chat";
import { ChatSession } from "./_components/chat";
import { ThreadRail } from "./_components/thread-rail";

// The page load renders the full visible conversation (not just the model's
// context window), so this is generous relative to the assistant route's
// MODEL_CONTEXT_MESSAGES — bounded only to cap worst-case read/parse cost on
// an extremely long-lived thread.
const PAGE_LOAD_MESSAGES = 200;

export default async function ChatbotPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const user = await requireUser();
  const requested = (await searchParams).thread;

  const { threads, active, messages } = await withUser<{
    threads: ChatThread[];
    active: ChatThread | null;
    messages: UIMessage[];
  }>({ sub: user.id, role: "authenticated" }, async (tx) => {
    const all = await listThreads(tx, user.id);
    // URL-state convention: ?thread=<id> selects, ?thread=new starts fresh,
    // no param resumes the most recent conversation.
    const selected =
      requested === "new"
        ? null
        : ((requested ? all.find((t) => t.id === requested) : undefined) ?? all[0] ?? null);
    return {
      threads: all,
      active: selected,
      messages: selected ? await getMessages(tx, user.id, selected.id, PAGE_LOAD_MESSAGES) : [],
    };
  });

  return (
    // Mobile has the sticky h-14 top bar; desktop main starts at the viewport top.
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-5xl flex-col px-6 pt-8 md:px-10 lg:h-dvh">
      <PageHeader
        eyebrow="Tool · AI mentor"
        title="Chatbot"
        description="Your standalone IB prep mentor — technicals, recruiting strategy, networking. Conversations are saved."
      />
      <div className="flex min-h-0 flex-1 gap-6">
        <aside className="hidden w-56 shrink-0 border-r pt-6 pr-4 md:block">
          <ThreadRail threads={threads} activeThreadId={active?.id ?? null} />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Small screens: collapsible conversation list instead of the rail. */}
          {threads.length > 0 && (
            <details className="border-b py-2 md:hidden">
              <summary className="text-muted-foreground cursor-pointer text-xs font-medium">
                Conversations ({threads.length})
              </summary>
              <div className="max-h-56 overflow-y-auto pt-2">
                <ThreadRail threads={threads} activeThreadId={active?.id ?? null} />
              </div>
            </details>
          )}
          <ChatSession activeThreadId={active?.id ?? null} initialMessages={messages} />
        </div>
      </div>
    </div>
  );
}
