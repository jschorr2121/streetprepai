export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="bg-muted mb-6 h-8 w-32 animate-pulse rounded" />
      <div className="mb-6 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-9 w-24 animate-pulse rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-4">
            <div className="bg-muted mb-2 h-4 w-36 animate-pulse rounded" />
            <div className="bg-muted mb-3 h-3 w-52 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-5 w-16 animate-pulse rounded-full" />
              <div className="bg-muted h-5 w-20 animate-pulse rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
