"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatThread } from "@/lib/db/queries/chat";
import { deleteThreadAction } from "../actions";

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ThreadRail({
  threads,
  activeThreadId,
}: {
  threads: ChatThread[];
  activeThreadId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(thread: ChatThread) {
    if (!window.confirm(`Delete “${thread.title}”? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteThreadAction({ threadId: thread.id });
      if (!result.ok) {
        toast.error(result.error.message ?? "Failed to delete conversation.");
        return;
      }
      toast.success("Conversation deleted.");
      if (thread.id === activeThreadId) {
        router.push("/tools/chatbot?thread=new");
      }
      router.refresh();
    });
  }

  return (
    <nav aria-label="Past conversations" className="flex h-full flex-col gap-1.5">
      <Button asChild size="sm" variant="outline" className="justify-start gap-2">
        <Link href="/tools/chatbot?thread=new">
          <Plus className="size-3.5" />
          New chat
        </Link>
      </Button>
      <div className="mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {threads.length === 0 && (
          <p className="text-muted-foreground px-2 py-1.5 text-xs">No conversations yet.</p>
        )}
        {threads.map((t) => {
          const active = t.id === activeThreadId;
          return (
            <div
              key={t.id}
              className={`group flex items-center gap-1 rounded-md pr-1 ${
                active ? "bg-secondary" : "hover:bg-secondary/60"
              }`}
            >
              <Link
                href={`/tools/chatbot?thread=${t.id}`}
                aria-current={active ? "page" : undefined}
                className="min-w-0 flex-1 px-2 py-1.5"
              >
                <span className="block truncate text-sm">{t.title}</span>
                <span className="text-muted-foreground block text-[11px]">
                  {relativeDay(t.updatedAt)}
                </span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending}
                    aria-label={`Options for ${t.title}`}
                    className="size-9 opacity-100 md:size-7 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(t)}>
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
