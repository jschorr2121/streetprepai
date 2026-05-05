export default function ResumeLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <div className="bg-muted mb-2 h-8 w-40 animate-pulse rounded" />
      <div className="bg-muted mb-8 h-4 w-72 animate-pulse rounded" />
      <div className="bg-card mb-6 flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12">
        <div className="bg-muted size-12 animate-pulse rounded-full" />
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
        <div className="bg-muted h-9 w-32 animate-pulse rounded-md" />
      </div>
      <div className="bg-card rounded-xl border p-6">
        <div className="bg-muted mb-4 h-5 w-36 animate-pulse rounded" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-3 w-full animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
