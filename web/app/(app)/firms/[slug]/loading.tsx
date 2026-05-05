export default function FirmDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="mb-6">
        <div className="bg-muted mb-2 h-8 w-56 animate-pulse rounded" />
        <div className="bg-muted mb-1 h-4 w-40 animate-pulse rounded" />
        <div className="bg-muted h-3 w-full max-w-xl animate-pulse rounded" />
      </div>
      <div className="bg-card mb-6 rounded-xl border p-6">
        <div className="bg-muted mb-4 h-5 w-40 animate-pulse rounded" />
        <div className="bg-muted mb-6 h-10 w-44 animate-pulse rounded" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted h-3 w-full animate-pulse rounded" />
          ))}
        </div>
      </div>
      <div className="bg-muted mb-4 h-5 w-36 animate-pulse rounded" />
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-4">
            <div className="bg-muted mb-2 h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-3 w-full animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
