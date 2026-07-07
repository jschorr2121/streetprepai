import { notFound } from "next/navigation";
import { ContactDetail } from "@/components/relationships/contact-detail";
import { seedContacts, seedChatLogs } from "@/lib/data/contacts";
import { seedCalendarEvents } from "@/lib/data/calendar";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  const contact = seedContacts.find((c) => c.id === contactId);
  if (!contact) notFound();
  const chatLogs = seedChatLogs.filter((l) => l.contactId === contactId);
  return <ContactDetail contact={contact} chatLogs={chatLogs} events={seedCalendarEvents} />;
}
