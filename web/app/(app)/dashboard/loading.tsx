export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <div className="mb-8">
        <div className="bg-muted mb-2 h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
      </div>
      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="bg-muted mb-3 h-4 w-28 animate-pulse rounded" />
            <div className="bg-muted mb-1 h-8 w-20 animate-pulse rounded" />
            <div className="bg-muted h-3 w-36 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="mb-10">
        <div className="bg-muted mb-4 h-6 w-40 animate-pulse rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-5">
              <div className="bg-muted mb-2 h-3 w-24 animate-pulse rounded" />
              <div className="bg-muted mb-1 h-5 w-48 animate-pulse rounded" />
              <div className="bg-muted h-3 w-full animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="bg-muted mb-4 h-5 w-36 animate-pulse rounded" />
            {[0, 1, 2].map((j) => (
              <div key={j} className="bg-muted mb-3 h-4 w-full animate-pulse rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
