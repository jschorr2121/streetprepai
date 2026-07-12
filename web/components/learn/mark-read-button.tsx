"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

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
    const res = await markSectionReadAction({ chapterSlug, sectionSlug });
    setPending(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
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
    <Button variant="ghost" size="sm" onClick={mark} disabled={pending} className="h-7 gap-1 text-xs">
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
      Mark read
    </Button>
  );
}
