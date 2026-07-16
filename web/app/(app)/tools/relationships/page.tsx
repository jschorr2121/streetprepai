import Link from "next/link";
import { Plus } from "lucide-react";

import { ContactsView } from "@/components/relationships/contacts-view";
import { RelationshipsTopWidgets } from "@/components/relationships/top-widgets";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { seedContacts, seedChatLogs } from "@/lib/data/contacts";
import { seedCalendarEvents } from "@/lib/data/calendar";
import { seedFollowups } from "@/lib/data/followups";

export default function RelationshipsPage() {
  return (
    <div>
      <div className="mx-auto max-w-6xl px-6 pt-8 md:px-8">
        <PageHeader
          eyebrow="Tool · CRM"
          title="Relationships"
          description="Every coffee chat and interview on a calendar. Per-person notes, follow-up drafts, and search across everything you've ever discussed."
          action={
            // The /new flow is still a placeholder — label the CTA honestly so
            // the primary action doesn't dead-end on a "coming soon" page.
            <Button asChild size="sm" variant="outline">
              <Link href="/tools/relationships/new">
                <Plus className="mr-1.5 size-3.5" aria-hidden /> Add contact
                <span className="text-muted-foreground ml-1.5 font-mono text-[10px] tracking-[0.14em]">
                  SOON
                </span>
              </Link>
            </Button>
          }
        />
      </div>
      <RelationshipsTopWidgets contacts={seedContacts} followups={seedFollowups} />
      <ContactsView contacts={seedContacts} chatLogs={seedChatLogs} events={seedCalendarEvents} />
    </div>
  );
}
