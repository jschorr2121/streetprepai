import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getFirmBySlug } from "@/lib/data/firms";
import { getChatLogs, getContacts } from "@/lib/data/contacts";
import { FirmPrep } from "@/components/firms/firm-prep";
import { FirmPastChats } from "@/components/firms/firm-past-chats";

export default async function FirmPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const [firm, chatLogs, contacts] = await Promise.all([
    getFirmBySlug(slug),
    getChatLogs(user.id),
    getContacts(user.id),
  ]);
  if (!firm) notFound();

  // String-match recall over the user's real chats: notes or structured fields
  // mentioning this firm by name, plus chats with contacts who work there.
  // (pgvector similarity search is a future upgrade — see lib/data/semantic-recall.)
  const firmName = firm.name.toLowerCase();
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const matches = chatLogs
    .filter((log) => {
      const contact = contactById.get(log.contactId);
      if (contact?.firm.toLowerCase() === firmName) return true;
      const haystack = [
        log.rawNotes,
        ...(log.structured?.topics ?? []),
        ...(log.structured?.adviceGiven ?? []),
        ...(log.structured?.commitments ?? []),
        ...(log.structured?.personalDetails ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(firmName);
    })
    .map((log) => ({ log, contact: contactById.get(log.contactId) }))
    .filter((m): m is { log: typeof m.log; contact: NonNullable<typeof m.contact> } =>
      Boolean(m.contact),
    )
    .slice(0, 3);

  return (
    <>
      <FirmPrep firm={firm} />
      <FirmPastChats firmName={firm.name} matches={matches} />
    </>
  );
}
