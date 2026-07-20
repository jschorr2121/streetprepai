"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteAccountAction } from "@/app/(app)/profile/settings/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Second confirmation gate: the final button stays disabled until the user
// types this exact word. First gate is opening the dialog itself.
const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const confirmed = confirmText.trim() === CONFIRM_PHRASE;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setConfirmText("");
  }

  function onConfirm() {
    if (!confirmed) return;
    startTransition(async () => {
      // On success the action redirects to the marketing landing (throws
      // NEXT_REDIRECT), so control only returns here on failure.
      const result = await deleteAccountAction();
      if (result.ok) return;

      if (result.error.code === "UNAUTHORIZED") {
        router.push("/login");
        return;
      }
      toast.error(result.error.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete my account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account</DialogTitle>
          <DialogDescription>
            This permanently erases everything tied to your account — profile, resume, mock
            interviews and recordings, saved stories, chats, and all learning progress. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete">
            Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            aria-label="Confirmation phrase"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!confirmed || isPending}
            className="min-w-40"
          >
            {isPending ? "Deleting…" : "Permanently delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
