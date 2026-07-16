import Link from "next/link";
import { Plus } from "lucide-react";

import { ContactsView } from "@/components/relationships/contacts-view";
import { RelationshipsTopWidgets } from "@/components/relationships/top-widgets";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/server";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getContacts, getChatLogs } from "@/lib/data/contacts";
import { getFollowups } from "@/lib/data/followups";

export const metadata = { title: "Relationships — Street Prep AI" };

export default async function RelationshipsPage() {
  const user = await requireUser();
  const [contacts, chatLogs, events, followups] = await Promise.all([
    getContacts(user.id),
    getChatLogs(user.id),
    getCalendarEvents(user.id),
    getFollowups(user.id),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-6xl px-6 pt-8 md:px-8">
        <PageHeader
          eyebrow="Tool · CRM"
          title="Relationships"
          description="Every coffee chat and interview on a calendar. Per-person notes, follow-up drafts, and search across everything you've ever discussed."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/tools/relationships/new">
                <Plus className="mr-1.5 size-3.5" aria-hidden /> Add contact
              </Link>
            </Button>
          }
        />
      </div>
      {contacts.length === 0 ? (
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <div className="rounded-md border border-dashed px-6 py-14 text-center">
            <p className="eyebrow">Empty</p>
            <p className="text-foreground mt-2 text-sm font-medium">No contacts yet.</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs">
              Add the first person you&apos;ve networked with — every coffee chat, note, follow-up,
              and AI prep sheet hangs off a contact.
            </p>
            <Button asChild size="sm" className="mt-5">
              <Link href="/tools/relationships/new">
                <Plus className="mr-1.5 size-3.5" aria-hidden /> Add your first contact
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <RelationshipsTopWidgets contacts={contacts} followups={followups} />
          <ContactsView contacts={contacts} chatLogs={chatLogs} events={events} />
        </>
      )}
    </div>
  );
}
