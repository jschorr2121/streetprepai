import { MockStudio } from "@/components/interview/mock-studio";
import { PastSessions } from "@/components/interview/past-sessions";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/server";
import { getMockInterviews } from "@/lib/data/mock-interviews";

// Latest sessions shown on the page — a history list, not a full archive.
const RECENT_SESSIONS_LIMIT = 10;

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { mode } = await searchParams;
  const initialMode = Array.isArray(mode) ? mode[0] : mode;

  const user = await requireUser();
  const sessions = await getMockInterviews(user.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <PageHeader
        eyebrow="Tool · Practice"
        title="Mock Interview Studio"
        description="Pick a mode, record your answer, and Claude scores content and delivery — with the questions a real interviewer would ask next."
        className="mb-8"
      />
      <MockStudio initialMode={initialMode} />
      <div className="mt-8">
        <PastSessions sessions={sessions.slice(0, RECENT_SESSIONS_LIMIT)} />
      </div>
    </div>
  );
}
