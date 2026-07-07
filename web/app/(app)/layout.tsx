import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/auth/server";

// All (app) routes depend on the signed-in session — force dynamic so Next.js
// never attempts to statically pre-render them (which would fail: no cookies).
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates `(app)` routes, but we fetch the user here to feed
  // the sidebar profile menu (and as defense-in-depth: throws if unauthenticated).
  const user = await requireUser();
  const meta = user.user_metadata as Record<string, unknown>;
  const fullName = typeof meta["full_name"] === "string" ? meta["full_name"] : undefined;

  return (
    <div className="flex min-h-screen">
      <AppNav email={user.email ?? ""} fullName={fullName} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
