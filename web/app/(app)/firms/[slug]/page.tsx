import { notFound } from "next/navigation";
import { seedFirms } from "@/lib/data/firms";
import { seedChatLogs, seedContacts } from "@/lib/data/contacts";
import { FirmPrep } from "@/components/firms/firm-prep";
import { FirmPastChats } from "@/components/firms/firm-past-chats";

export default async function FirmPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const firm = seedFirms.find((f) => f.slug === slug);
  if (!firm) notFound();

  // TODO: replace with pgvector similarity search when DB wired.
  // String-match recall: find chats whose structured fields or raw notes mention this firm by name.
  const firmName = firm.name.toLowerCase();
  const matches = seedChatLogs
    .filter((log) => {
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
    .map((log) => ({
      log,
      contact: seedContacts.find((c) => c.id === log.contactId),
    }))
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
