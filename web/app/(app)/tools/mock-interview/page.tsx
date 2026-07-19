import { MockStudio } from "@/components/interview/mock-studio";
import { PageHeader } from "@/components/page-header";

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { mode } = await searchParams;
  const initialMode = Array.isArray(mode) ? mode[0] : mode;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <PageHeader
        eyebrow="Tool · Practice"
        title="Mock Interview Studio"
        description="Pick a mode, record your answer, and Claude scores content and delivery — with the questions a real interviewer would ask next."
        className="mb-8"
      />
      <MockStudio initialMode={initialMode} />
    </div>
  );
}
