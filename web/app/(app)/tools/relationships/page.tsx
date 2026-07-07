import { ContactsView } from "@/components/relationships/contacts-view";
import { RelationshipsTopWidgets } from "@/components/relationships/top-widgets";
import { seedContacts, seedChatLogs } from "@/lib/data/contacts";
import { seedCalendarEvents } from "@/lib/data/calendar";
import { seedFollowups } from "@/lib/data/followups";

export default function RelationshipsPage() {
  return (
    <div>
      <RelationshipsTopWidgets contacts={seedContacts} followups={seedFollowups} />
      <ContactsView contacts={seedContacts} chatLogs={seedChatLogs} events={seedCalendarEvents} />
    </div>
  );
}
