import type { Contact, ChatLog } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type ContactRow = {
  id: string;
  name: string;
  firm: string;
  group_name: string | null;
  title: string | null;
  school: string | null;
  grad_year: number | null;
  how_met: string | null;
  stage: string;
  tags: string[] | null;
  linkedin_bio: string | null;
  last_interaction_at: string | null;
  last_contact_at: string | null;
};

type ChatRow = {
  id: string;
  contact_id: string;
  happened_at: string;
  raw_notes: string | null;
  structured: ChatLog["structured"] | null;
  follow_up_draft: ChatLog["followUpDraft"] | null;
};

function mapContactRow(r: ContactRow): Contact {
  return {
    id: r.id,
    name: r.name,
    firm: r.firm,
    group: r.group_name ?? undefined,
    title: r.title ?? "",
    school: r.school ?? undefined,
    gradYear: r.grad_year ?? undefined,
    linkedinBio: r.linkedin_bio ?? undefined,
    howMet: r.how_met ?? undefined,
    stage: r.stage as Contact["stage"],
    tags: r.tags ?? [],
    lastInteractionAt: r.last_interaction_at ?? undefined,
    lastContactAt: r.last_contact_at ?? undefined,
  };
}

function mapChatRow(r: ChatRow): ChatLog {
  return {
    id: r.id,
    contactId: r.contact_id,
    happenedAt: r.happened_at,
    rawNotes: r.raw_notes ?? "",
    structured: r.structured ?? undefined,
    followUpDraft: r.follow_up_draft ?? undefined,
  };
}

export async function getContacts(userId: string): Promise<Contact[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) throw error;
  return (data as ContactRow[]).map(mapContactRow);
}

export async function getContactById(
  id: string,
  userId: string,
): Promise<Contact | null> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapContactRow(data as ContactRow) : null;
}

export async function getChatLogs(userId: string): Promise<ChatLog[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("happened_at", { ascending: false });
  if (error) throw error;
  return (data as ChatRow[]).map(mapChatRow);
}

export async function getChatLogsForContact(
  contactId: string,
  userId: string,
): Promise<ChatLog[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("chats")
    .select("*")
    .eq("contact_id", contactId)
    .eq("user_id", userId)
    .order("happened_at", { ascending: false });
  if (error) throw error;
  return (data as ChatRow[]).map(mapChatRow);
}


export const seedContacts: Contact[] = [
  {
    id: "c1",
    name: "Alex Chen",
    firm: "Goldman Sachs",
    group: "TMT",
    title: "Investment Banking Analyst",
    school: "Stanford",
    gradYear: 2023,
    howMet: "Alumni mixer, October",
    stage: "coffee-chat",
    tags: ["TMT", "target", "Stanford alum"],
    lastInteractionAt: "2025-10-18",
    lastContactAt: "2025-10-18",
    linkedinBio: `Investment Banking Analyst at Goldman Sachs, TMT group. Stanford '23, Economics + CS. Prior internship at Qatalyst Partners. Interests: semiconductor M&A, enterprise software.`,
  },
  {
    id: "c2",
    name: "Priya Mehta",
    firm: "Evercore",
    group: "M&A",
    title: "Associate",
    school: "Wharton",
    gradYear: 2020,
    howMet: "Cold LinkedIn outreach",
    stage: "warm",
    tags: ["EB", "M&A", "responsive"],
    lastInteractionAt: "2026-01-12",
    lastContactAt: "2026-01-12",
    linkedinBio: `Associate in Evercore's general M&A practice. Wharton '20, Finance + Mathematics. Prior: JPMorgan M&A analyst. Active on deals in industrials and healthcare services.`,
  },
  {
    id: "c3",
    name: "Marcus Thompson",
    firm: "JPMorgan",
    group: "Healthcare",
    title: "Vice President",
    school: "Duke",
    gradYear: 2014,
    howMet: "Referred by Professor Lee",
    stage: "interviewed",
    tags: ["Healthcare", "senior", "referred"],
    lastInteractionAt: "2026-02-04",
    lastContactAt: "2026-02-14",
    linkedinBio: `VP in JPMorgan's Healthcare coverage. Focus on large-cap pharma and medical devices M&A. Duke '14, Public Policy. Started at JPM as summer analyst.`,
  },
  {
    id: "c4",
    name: "Jordan Ruiz",
    firm: "Centerview Partners",
    group: "Generalist",
    title: "Investment Banking Analyst",
    school: "Harvard",
    gradYear: 2024,
    howMet: "Campus info session",
    stage: "outreach-sent",
    tags: ["EB", "elite", "generalist"],
    lastInteractionAt: "2026-03-22",
    lastContactAt: "2026-03-22",
    linkedinBio: `First-year analyst at Centerview Partners, generalist. Harvard '24, Economics. Led Harvard Finance Club junior year.`,
  },
  {
    id: "c5",
    name: "Samir Patel",
    firm: "Morgan Stanley",
    group: "Energy",
    title: "Investment Banking Analyst",
    school: "Michigan (Ross)",
    gradYear: 2023,
    howMet: "Mutual friend intro",
    stage: "coffee-chat",
    tags: ["Energy", "candid", "Ross alum"],
    lastInteractionAt: "2026-04-08",
    lastContactAt: "2026-04-08",
    linkedinBio: `Analyst, Morgan Stanley Energy group. Ross '23, Finance. Focus on oilfield services and energy transition. Previously interned at Lazard.`,
  },
];

export const seedChatLogs: ChatLog[] = [
  {
    id: "ch1",
    contactId: "c1",
    happenedAt: "2025-10-18",
    rawNotes: `30 min zoom. Alex super nice, no bs. Talked about how Goldman Sachs TMT is weighted heavy toward semis coverage now (not just software). He worked on the Marvell/Innovium deal. Said MD's name is Bill — loves when candidates mention the Berkshire letter. Told me to apply SA and mention him. He said he'd intro me to a 2nd year named Priya. Compared GS culture to peers — said Morgan Stanley was friendlier in his Superday process but he chose GS for the franchise. Don't ask comp ever. He has a golden retriever named Miso — mentioned it a lot.`,
    structured: {
      topics: [
        "GS TMT group composition (semis-heavy)",
        "Recent deals (Marvell/Innovium)",
        "Culture and MD preferences",
        "Superday process",
      ],
      adviceGiven: [
        "Apply SA and mention Alex in the app",
        "Reference the Berkshire letter in interviews with MD Bill",
        "Don't ask about comp",
      ],
      commitments: ["Intro to Priya, a 2nd year at GS TMT"],
      personalDetails: [
        "Golden retriever named Miso",
        "Worked on Marvell/Innovium deal",
        "Says GS culture is grindy but smart",
      ],
      followUps: [
        { description: "Thank-you email within 48h", dueBy: "2025-10-20" },
        {
          description: "Follow up in 3 weeks re: Priya intro",
          dueBy: "2025-11-08",
        },
      ],
    },
    followUpDraft: {
      subject: "Thanks for the call — quick note",
      body: `Alex,\n\nReally appreciated the 30 minutes — the texture on how TMT has leaned further into semis coverage was especially useful, and I'd heard the Marvell/Innovium work was yours. I'll keep an eye on the Berkshire reference you mentioned.\n\nOne small ask: if the intro to Priya still works, I'd love to take her up on 15 minutes later this month.\n\nThanks again — and give Miso a scratch from me.\n\nJake`,
    },
  },
];
