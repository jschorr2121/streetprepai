import { ContactsView } from "@/components/relationships/contacts-view";
import { seedContacts, seedChatLogs } from "@/lib/data/contacts";
import { seedCalendarEvents } from "@/lib/data/calendar";

export default function RelationshipsPage() {
  return (
    <ContactsView
      contacts={seedContacts}
      chatLogs={seedChatLogs}
      events={seedCalendarEvents}
    />
  );
}
