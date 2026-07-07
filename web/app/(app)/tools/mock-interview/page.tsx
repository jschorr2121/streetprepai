import { MockStudio } from "@/components/interview/mock-studio";
import { PageHeader } from "@/components/page-header";

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <PageHeader
        eyebrow="Tool · Practice"
        title="Mock Interview Studio"
        description="Pick a mode, record your answer, and Claude scores content and delivery — with the questions a real interviewer would ask next."
        className="mb-8"
      />
      <MockStudio />
    </div>
  );
}
