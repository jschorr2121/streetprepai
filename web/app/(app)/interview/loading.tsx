export default function InterviewLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-16 md:px-8">
      <div className="bg-muted size-20 animate-pulse rounded-full" />
      <div className="bg-muted h-6 w-64 animate-pulse rounded" />
      <div className="bg-card w-full rounded-xl border p-6">
        <div className="bg-muted mb-3 h-4 w-24 animate-pulse rounded" />
        <div className="bg-muted mb-2 h-5 w-full animate-pulse rounded" />
        <div className="bg-muted h-5 w-4/5 animate-pulse rounded" />
      </div>
    </div>
  );
}
