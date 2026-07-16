import { notFound } from "next/navigation";

import { ContactDetail } from "@/components/relationships/contact-detail";
import { requireUser } from "@/lib/auth/server";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getContactById, getChatLogsForContact } from "@/lib/data/contacts";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const user = await requireUser();
  const { contactId } = await params;
  const [contact, chatLogs, events] = await Promise.all([
    getContactById(contactId, user.id),
    getChatLogsForContact(contactId, user.id),
    getCalendarEvents(user.id),
  ]);
  if (!contact) notFound();
  return <ContactDetail contact={contact} chatLogs={chatLogs} events={events} />;
}
