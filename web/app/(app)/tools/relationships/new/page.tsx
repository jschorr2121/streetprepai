import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewContactForm } from "@/components/relationships/new-contact-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Add a contact — Street Prep AI" };

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1">
        <Link href="/tools/relationships">
          <ArrowLeft className="size-3.5" />
          Back to relationships
        </Link>
      </Button>
      <PageHeader
        eyebrow="Tool · CRM"
        title="Add a contact"
        description="Log the person once — every coffee chat, note, follow-up, and AI prep sheet hangs off them. Paste their LinkedIn bio for richer prep sheets."
      />
      <div className="bg-card border-border mt-8 rounded-md border p-5">
        <NewContactForm />
      </div>
    </div>
  );
}
