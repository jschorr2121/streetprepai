import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Session refresh + route gating for the proxy (formerly middleware) entrypoint.
//
// Pattern follows @supabase/ssr's required middleware shape: build a mutable
// NextResponse, hand `getAll`/`setAll` to createServerClient so a refreshed
// token is written back onto BOTH the request (for downstream RSC reads) and the
// response (for the browser), then call getUser() to trigger the refresh.
//
// IMPORTANT (per @supabase/ssr docs): do not run any logic between creating the
// client and calling getUser(), and always return the `response` object so the
// refreshed cookies survive — otherwise users get randomly logged out.

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

// Onboarding is one-way (`onboarded_at` is set once and never cleared), so
// once we've seen it we remember it in a cookie and skip the per-navigation
// profiles read. The cookie value is the user id, so a different account on
// the same browser never inherits the flag. Worst case on forgery: the user
// skips the /onboarding redirect and sees an app shell with default profile
// fields — it gates UX, not data access (RLS does that).
// Exported so account deletion can clear it — a re-signup on the same browser
// must re-run onboarding rather than inherit the deleted account's flag.
export const ONBOARDED_COOKIE = "sp-onboarded";
const ONBOARDING_ROUTE = "/onboarding";
const DEFAULT_SIGNED_IN_ROUTE = "/dashboard";
const DEFAULT_SIGNED_OUT_ROUTE = "/login";

// Routes that must pass through untouched regardless of session state:
//  - /callback creates the session by exchanging the OAuth/recovery code.
//  - /reset-password runs under a recovery session (so the user IS authed) but
//    must still be reachable to set a new password — don't bounce it to the app.
const PUBLIC_PASSTHROUGH = ["/callback", "/reset-password"];

// /api routes reachable without a session — currently just the uptime-monitor
// liveness probe. Everything else under /api/* still hits the 401 backstop
// below.
const PUBLIC_API_ROUTES = ["/api/health"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function isPassthrough(pathname: string): boolean {
  return PUBLIC_PASSTHROUGH.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session if expired (writes new cookies via setAll above).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Defense-in-depth backstop for /api/*: every route also gates itself via
  // requireUser, but a new route that forgets the gate fails closed here
  // instead of shipping open. API clients get 401 JSON, never a redirect.
  // No onboarding gate for APIs — routes decide their own data requirements.
  if (pathname.startsWith("/api")) {
    if (PUBLIC_API_ROUTES.includes(pathname)) return response;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  // OAuth callback runs before a session exists — never gate or redirect it.
  if (isPassthrough(pathname)) return response;

  // Unauthenticated: the marketing landing and auth routes are reachable;
  // everything else → /login.
  if (!user) {
    if (pathname === "/" || isAuthRoute(pathname)) return response;
    return redirectTo(request, DEFAULT_SIGNED_OUT_ROUTE);
  }

  // Authenticated on the landing or an auth route → straight to the app.
  if (pathname === "/" || isAuthRoute(pathname)) {
    return redirectTo(request, DEFAULT_SIGNED_IN_ROUTE);
  }

  // Onboarding gate. The cookie short-circuits the common case; otherwise a
  // single RLS-scoped read of `onboarded_at` decides, and a hit is memoized
  // into the cookie so later navigations skip the round trip.
  let onboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === user.id;
  if (!onboarded) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .maybeSingle();
    onboarded = Boolean(profile?.onboarded_at);
    if (onboarded && pathname !== ONBOARDING_ROUTE) {
      response.cookies.set(ONBOARDED_COOKIE, user.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  if (!onboarded && pathname !== ONBOARDING_ROUTE) {
    return redirectTo(request, ONBOARDING_ROUTE);
  }

  if (onboarded && pathname === ONBOARDING_ROUTE) {
    return redirectTo(request, DEFAULT_SIGNED_IN_ROUTE);
  }

  return response;
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}
