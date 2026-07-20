"use client";

/**
 * Floating feedback widget — mounted once in `(app)/layout.tsx` so it's
 * available on every authed page. A small trigger button opens a Dialog
 * (Escape closes, focus trapped by the Radix primitive) with a textarea;
 * submit calls `submitFeedbackAction` with the current pathname + message.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction } from "@/lib/feedback/actions";

const MESSAGE_MAX_LENGTH = 2000;

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset once the close animation has had a beat, so the form doesn't
      // visibly blank out while the dialog is still fading away.
      setTimeout(() => {
        setMessage("");
        setError(null);
        setSent(false);
      }, 150);
    }
  }

  async function onSubmit() {
    const trimmed = message.trim();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    try {
      const result = await submitFeedbackAction({ route: pathname, message: trimmed });
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error.message);
      }
    } catch {
      setError("Couldn't send feedback. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground fixed right-4 bottom-4 z-30 gap-1.5 shadow-sm"
        >
          <MessageSquarePlus aria-hidden className="size-3.5" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle>Thanks for the feedback</DialogTitle>
              <DialogDescription>We read every note — this helps a lot.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send feedback</DialogTitle>
              <DialogDescription>
                Found a bug or have an idea? Tell us what&apos;s on your mind.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder="What's working, what's not..."
              rows={5}
              disabled={pending}
              aria-label="Feedback message"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-xs" role="alert">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                size="sm"
                onClick={onSubmit}
                disabled={pending || message.trim().length === 0}
              >
                {pending ? "Sending…" : "Send"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
