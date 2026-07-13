"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/reader/markdown";
import { ArrowUp, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export function ChatPanel({
  guideTitle,
  guideContent,
}: {
  guideTitle: string;
  guideContent: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    const next = [
      ...messages,
      { role: "user" as const, content: trimmed },
      { role: "assistant" as const, content: "" },
    ];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideTitle,
          guideContent,
          messages: next.slice(0, -1),
        }),
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((ms) => {
          const copy = ms.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      setMessages((ms) => {
        const copy = ms.slice();
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Sorry, something went wrong talking to Claude. Check that ANTHROPIC_API_KEY is set and try again.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  const suggestions = [
    "Give me a quiz question on this.",
    "Explain it like I'm a sophomore who's never modeled anything.",
    "Where do bankers usually mess this up?",
  ];

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-muted-foreground space-y-3 text-sm">
              <div className="text-foreground font-medium">Chat with this guide</div>
              <p className="leading-relaxed">
                Ask anything about what you&apos;re reading. Answers are grounded in the guide and
                reference specific sections.
              </p>
              <div className="space-y-1.5 pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-primary block text-left text-xs hover:underline"
                  >
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "bg-secondary max-w-[85%] rounded-md px-3 py-2 text-sm"
                    : "max-w-[95%] text-sm"
                }
              >
                {m.role === "user" ? (
                  m.content
                ) : m.content ? (
                  <Markdown content={m.content} className="text-sm" />
                ) : (
                  <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about this guide…"
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={streaming || !input.trim()}
            className="shrink-0"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
