export default function RelationshipsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="bg-muted mb-3 h-4 w-28 animate-pulse rounded" />
            <div className="bg-muted h-6 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card flex items-center justify-between rounded-xl border p-4">
            <div>
              <div className="bg-muted mb-2 h-4 w-36 animate-pulse rounded" />
              <div className="bg-muted h-3 w-52 animate-pulse rounded" />
            </div>
            <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
