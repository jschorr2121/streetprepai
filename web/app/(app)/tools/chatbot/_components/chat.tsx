"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Loader2 } from "lucide-react";

import { Markdown } from "@/components/reader/markdown";
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
                ) : text ? (
                  <Markdown content={text} className="text-sm" />
                ) : (
                  <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                )}
              </div>
            </div>
          );
        })}
        {status === "submitted" && (
          <div className="flex justify-start">
            <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
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
