import { ResumeCoach } from "@/components/resume/resume-coach";
import { PageHeader } from "@/components/page-header";

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <PageHeader
        eyebrow="Tool · Resume"
        title="Resume Coach"
        description="Drop a PDF or paste your resume. Claude rewrites each bullet in banker-style, flags weak items, and lets you apply changes one by one."
        className="mb-8"
      />
      <ResumeCoach />
    </div>
  );
}
