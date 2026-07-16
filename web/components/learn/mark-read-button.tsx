"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { toast } from "sonner";

import { markSectionReadAction } from "@/app/(app)/learn/actions";
import { Button } from "@/components/ui/button";

export function MarkReadButton({
  chapterSlug,
  sectionSlug,
  read,
}: {
  chapterSlug: string;
  sectionSlug: string;
  read: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(read);

  async function mark() {
    setPending(true);
    try {
      const res = await markSectionReadAction({ chapterSlug, sectionSlug });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("Couldn't mark this section as read. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <span className="text-primary flex items-center gap-1 text-xs font-medium">
        <Check className="size-3.5" /> Read
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={mark}
      disabled={pending}
      className="h-7 gap-1 text-xs"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
      Mark read
    </Button>
  );
}
