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
const ONBOARDING_ROUTE = "/onboarding";
const DEFAULT_SIGNED_IN_ROUTE = "/dashboard";
const DEFAULT_SIGNED_OUT_ROUTE = "/login";

// Routes that must pass through untouched regardless of session state:
//  - /callback creates the session by exchanging the OAuth/recovery code.
//  - /reset-password runs under a recovery session (so the user IS authed) but
//    must still be reachable to set a new password — don't bounce it to the app.
const PUBLIC_PASSTHROUGH = ["/callback", "/reset-password"];

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

  // OAuth callback runs before a session exists — never gate or redirect it.
  if (isPassthrough(pathname)) return response;

  // Unauthenticated: only auth routes are reachable; everything else → /login.
  if (!user) {
    if (isAuthRoute(pathname)) return response;
    return redirectTo(request, DEFAULT_SIGNED_OUT_ROUTE);
  }

  // Authenticated on an auth route → straight to the app.
  if (isAuthRoute(pathname)) {
    return redirectTo(request, DEFAULT_SIGNED_IN_ROUTE);
  }

  // Onboarding gate. A single RLS-scoped read of `onboarded_at` decides whether
  // the user still needs onboarding. Cheap (single indexed row); runs only for
  // authed users on gated routes.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const onboarded = Boolean(profile?.onboarded_at);

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
