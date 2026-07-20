import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <p className="eyebrow">404</p>
        <h1 className="font-display text-2xl">This page doesn&apos;t exist</h1>
        <p className="text-muted-foreground text-sm">
          The page you&apos;re looking for may have moved or never existed.
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
