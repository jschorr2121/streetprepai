export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="bg-muted mb-6 h-8 w-40 animate-pulse rounded" />
      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="bg-muted mb-3 h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted mb-1 h-8 w-16 animate-pulse rounded" />
            <div className="bg-muted h-3 w-32 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="bg-muted mb-4 h-6 w-36 animate-pulse rounded" />
      <div className="bg-card mb-8 rounded-xl border p-5">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="bg-muted h-8 w-full animate-pulse rounded" />
          ))}
        </div>
      </div>
      <div className="bg-muted mb-4 h-6 w-40 animate-pulse rounded" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-4">
            <div className="bg-muted mb-2 h-4 w-48 animate-pulse rounded" />
            <div className="bg-muted h-2 w-full animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
