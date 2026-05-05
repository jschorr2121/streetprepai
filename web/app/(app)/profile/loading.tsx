export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <div className="bg-muted mb-2 h-8 w-32 animate-pulse rounded" />
      <div className="bg-muted mb-8 h-4 w-56 animate-pulse rounded" />
      <div className="space-y-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="bg-muted mb-3 h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-10 w-full animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
