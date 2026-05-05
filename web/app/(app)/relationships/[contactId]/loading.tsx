export default function ContactDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <div className="mb-6">
        <div className="bg-muted mb-2 h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
      <div className="mb-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-muted h-9 w-24 animate-pulse rounded-md" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="bg-muted mb-3 h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted mb-2 h-3 w-full animate-pulse rounded" />
            <div className="bg-muted h-3 w-4/5 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
