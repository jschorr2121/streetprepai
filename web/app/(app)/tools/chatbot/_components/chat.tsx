"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from "ai";
import { ArrowUp, Loader2 } from "lucide-react";

import { Markdown } from "@/components/reader/markdown";
import { StatusLine } from "@/components/status-line";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "How should I study for LBO questions?",
  "Walk me through a DCF like I'm seeing it for the first time.",
  "What should my sophomore-year recruiting timeline look like?",
];

function messageText(m: UIMessage): string {
  return m.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const TOOL_LABELS: Record<string, string> = {
  get_resume: "Checked: your resume",
  list_contacts: "Checked: your contacts",
  get_contact: "Checked: contact details",
  get_upcoming_events: "Checked: your calendar",
  search_chat_logs: "Searched your chat logs",
  get_applied_jobs: "Checked: your applications",
  get_firm: "Checked: firm data",
  web_search: "Searched the web",
};

/** Deduped web citation list rendered under an answer that used web_search. */
export function SourceList({ parts }: { parts: UIMessage["parts"] }) {
  const seen = new Set<string>();
  const sources: Array<{ url: string; title: string; domain: string }> = [];
  for (const p of parts) {
    if (p.type !== "source-url" || seen.has(p.url)) continue;
    seen.add(p.url);
    let domain = "";
    try {
      domain = new URL(p.url).hostname.replace(/^www\./, "");
    } catch {
      continue; // unparsable URL — skip rather than render a broken link
    }
    sources.push({ url: p.url, title: p.title || domain, domain });
  }
  if (sources.length === 0) return null;
  return (
    <div className="border-border/60 mt-2 border-t pt-2">
      <p className="text-muted-foreground text-[11px] font-medium">Sources</p>
      <ul className="mt-1 space-y-0.5">
        {sources.map((s) => (
          <li key={s.url} className="truncate text-xs">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {s.title}
            </a>
            <span className="text-muted-foreground"> — {s.domain}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function toolResultSummary(output: unknown): string | null {
  if (Array.isArray(output)) {
    return `${output.length} result${output.length === 1 ? "" : "s"}`;
  }
  if (output && typeof output === "object") {
    if ("error" in output && typeof output.error === "string") return "lookup failed";
    if ("count" in output && typeof output.count === "number") {
      return `${output.count} result${output.count === 1 ? "" : "s"}`;
    }
  }
  return null;
}

/**
 * Citation chip for a settled tool invocation, rendered from a UIMessage tool
 * part. Expands to a compact JSON view of what the assistant consulted.
 */
export function ToolChip({
  toolName,
  state,
  output,
  errorText,
}: {
  toolName: string;
  state: string;
  output?: unknown;
  errorText?: string;
}) {
  const label = TOOL_LABELS[toolName] ?? toolName.replaceAll("_", " ");
  if (state !== "output-available" && state !== "output-error") {
    return (
      <span className="border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
        <Loader2 className="size-3 animate-spin" />
        {label}
      </span>
    );
  }
  const failed = state === "output-error";
  const summary = failed ? "failed" : toolResultSummary(output);
  return (
    <details className="group inline-block align-middle">
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs [&::-webkit-details-marker]:hidden ${
          failed
            ? "border-destructive/40 text-destructive"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        🔍 {label}
        {summary ? ` — ${summary}` : ""}
      </summary>
      <pre className="bg-secondary text-muted-foreground mt-1.5 max-h-48 overflow-auto rounded-md p-2.5 text-[11px] leading-relaxed whitespace-pre-wrap">
        {failed
          ? (errorText ?? "The lookup failed.")
          : JSON.stringify(output, null, 2)?.slice(0, 4_000)}
      </pre>
    </details>
  );
}

type ChatSessionState = { knownId: string | null; mountKey: string };

/**
 * Decides whether a change in the server-resolved active thread id should
 * remount the mounted `AssistantChat` instance (new `mountKey`) or leave it
 * alone. A brand-new thread's client-generated id (see `AssistantChat`'s
 * `threadId` state) only becomes visible here once the server persists it
 * and `router.refresh()` picks it up — that null -> non-null transition is
 * the same conversation catching up with its own id, not a switch, so the
 * instance (and its already-streamed messages) must survive it. Any other
 * change — a different thread, or an explicit reset to "new" — is a real
 * switch and should reset the chat.
 */
export function computeNextChatSessionState(
  prev: ChatSessionState,
  activeThreadId: string | null,
): ChatSessionState {
  if (activeThreadId === prev.knownId) return prev;
  const ownIdConfirmed = prev.knownId === null && activeThreadId !== null;
  return {
    knownId: activeThreadId,
    mountKey: ownIdConfirmed ? prev.mountKey : (activeThreadId ?? "new"),
  };
}

/**
 * Server-driven wrapper around `AssistantChat` that owns its mount key.
 * `page.tsx` re-resolves `activeThreadId` from `searchParams` on every
 * `router.refresh()`; keying `AssistantChat` directly off that value would
 * remount it the moment a brand-new thread's id gets confirmed, racing the
 * just-streamed assistant reply against the server's persist (issue 06).
 * See `computeNextChatSessionState` for the remount rule.
 */
export function ChatSession({
  activeThreadId,
  initialMessages,
}: {
  activeThreadId: string | null;
  initialMessages: UIMessage[];
}) {
  const [session, setSession] = useState<ChatSessionState>(() => ({
    knownId: activeThreadId,
    mountKey: activeThreadId ?? "new",
  }));

  if (activeThreadId !== session.knownId) {
    setSession(computeNextChatSessionState(session, activeThreadId));
  }

  return (
    <AssistantChat
      key={session.mountKey}
      initialThreadId={activeThreadId}
      initialMessages={initialMessages}
    />
  );
}

export function AssistantChat({
  initialThreadId,
  initialMessages,
}: {
  initialThreadId: string | null;
  initialMessages: UIMessage[];
}) {
  // The thread is created server-side on the first message; for a brand-new
  // conversation the client picks the id up front so follow-up turns and a
  // reload land on the same thread.
  const [threadId] = useState(() => initialThreadId ?? crypto.randomUUID());
  const [input, setInput] = useState("");
  const router = useRouter();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/assistant",
        // The server reloads history from the DB — send only the newest turn.
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { threadId, message: messages[messages.length - 1] },
        }),
      }),
    [threadId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      // A brand-new thread now exists server-side: sync the URL so reloads and
      // the thread rail (server components) both point at it.
      if (!initialThreadId) {
        router.replace(`/tools/chatbot?thread=${threadId}`, { scroll: false });
      }
      router.refresh();
    },
  });

  // Scroll on new messages only — keying on every streamed token hijacks the
  // viewport when the user scrolls up to read while a reply streams.
  const messageCount = messages.length;
  useEffect(() => {
    if (messageCount > 0) {
      document.getElementById("chat-bottom")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageCount]);

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    void sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 && (
          <div className="text-muted-foreground space-y-3 rounded-md border border-dashed p-6 text-sm">
            <div className="text-foreground font-medium">Ask your IB mentor anything</div>
            <p className="leading-relaxed">
              Technicals, recruiting strategy, networking, behaviorals — answers stream in and your
              conversation is saved.
            </p>
            <div className="space-y-1.5 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-primary block text-left text-xs hover:underline"
                >
                  → {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => {
          const text = messageText(m);
          return (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "bg-secondary max-w-[85%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap"
                    : "max-w-[95%] text-sm"
                }
              >
                {m.role === "user" ? (
                  text
                ) : m.parts.length > 0 ? (
                  <div className="space-y-2">
                    {m.parts.map((p, i) => {
                      if (p.type === "text") {
                        return p.text ? (
                          <Markdown key={i} content={p.text} className="text-sm" />
                        ) : null;
                      }
                      if (isToolUIPart(p)) {
                        return (
                          <div key={i}>
                            <ToolChip
                              toolName={getToolName(p)}
                              state={p.state}
                              output={p.state === "output-available" ? p.output : undefined}
                              errorText={p.state === "output-error" ? p.errorText : undefined}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                    <SourceList parts={m.parts} />
                  </div>
                ) : (
                  <StatusLine>
                    <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                    <span className="sr-only">Assistant is responding…</span>
                  </StatusLine>
                )}
              </div>
            </div>
          );
        })}
        {status === "submitted" && (
          <div className="flex justify-start">
            <StatusLine>
              <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
              <span className="sr-only">Assistant is responding…</span>
            </StatusLine>
          </div>
        )}
        {error && (
          <p className="text-destructive text-xs" role="alert">
            Sorry, something went wrong. Your message was kept — try again in a moment.
          </p>
        )}
        <div id="chat-bottom" />
      </div>
      <div className="border-t pt-3 pb-2">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about technicals, recruiting, networking…"
            rows={1}
            className="max-h-32 min-h-9 flex-1 resize-none text-sm"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            aria-label="Send message"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
