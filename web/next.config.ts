import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Origins the browser legitimately talks to, derived from env so each
// deployment allows exactly its own backing services. NEXT_PUBLIC_* vars are
// inlined at build time, so these are static per deployment.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseWsOrigin = supabaseOrigin?.replace(/^https:/, "wss:");
const posthogOrigin = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
// posthog-js lazy-loads its session-recorder/surveys bundles from the assets CDN.
const posthogAssetsOrigin = "https://us-assets.i.posthog.com";
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryOrigin = sentryDsn ? new URL(sentryDsn).origin : undefined;

function src(...parts: Array<string | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join(" ");
}

// Content-Security-Policy. `script-src 'unsafe-inline'` is required by Next.js
// bootstrap inline scripts unless we move to a nonce-based CSP, which forces
// every page to render dynamically (no static/ISR caching) — not worth the
// perf cost today. Even so, this policy blocks all external script origins
// except PostHog's asset CDN, plus clickjacking and form exfiltration.
const csp = [
  `default-src 'self'`,
  src(
    `script-src 'self' 'unsafe-inline'`,
    isDev ? `'unsafe-eval'` : undefined,
    posthogAssetsOrigin,
  ),
  `style-src 'self' 'unsafe-inline'`,
  src(`img-src 'self' blob: data:`, supabaseOrigin),
  `font-src 'self' data:`,
  src(`media-src 'self' blob:`, supabaseOrigin),
  src(
    `connect-src 'self'`,
    supabaseOrigin,
    supabaseWsOrigin,
    posthogOrigin,
    posthogAssetsOrigin,
    sentryOrigin,
  ),
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Mic is used for mock-interview + relationship voice notes; no camera use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Permanent (301) redirects for legacy URLs replaced by the new spine + tools IA.
  // Per `context/feature-specs/unit-5-ia-refactor.md`: keep redirects for at least 90 days,
  // then evaluate whether to drop.
  async redirects() {
    return [
      { source: "/library", destination: "/learn", permanent: true },
      { source: "/library/:path*", destination: "/learn/:path*", permanent: true },
      { source: "/interview", destination: "/tools/mock-interview", permanent: true },
      { source: "/interview/:path*", destination: "/tools/mock-interview/:path*", permanent: true },
      { source: "/story-framer", destination: "/tools/story-framer", permanent: true },
      {
        source: "/story-framer/:path*",
        destination: "/tools/story-framer/:path*",
        permanent: true,
      },
      { source: "/resume", destination: "/tools/resume-coach", permanent: true },
      { source: "/resume/:path*", destination: "/tools/resume-coach/:path*", permanent: true },
      { source: "/relationships", destination: "/tools/relationships", permanent: true },
      {
        source: "/relationships/:path*",
        destination: "/tools/relationships/:path*",
        permanent: true,
      },
    ];
  },
};

// Sentry build plugin: uploads source maps + widens server instrumentation.
// Source-map upload only activates when SENTRY_AUTH_TOKEN (+ org/project) are
// set in the build environment; without them this wrapper is a no-op, so local
// and CI builds work unchanged.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  // Strip uploaded source maps from the client bundle so app code isn't
  // exposed in production, while Sentry still gets readable stack traces.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
});
