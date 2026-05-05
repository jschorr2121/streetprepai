"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";

/**
 * Client-side PostHog provider.
 *
 * Wrap the root layout's children in this component. It initializes the
 * browser PostHog SDK exactly once when the app first mounts.
 *
 * - No-ops cleanly when `NEXT_PUBLIC_POSTHOG_KEY` is unset.
 * - Default config relies on PostHog's built-in autocapture and pageviews;
 *   we don't manually track page navigations here.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // posthog-js guards against double init internally, but this is cheap.
    // `__loaded` is set after a successful `init`.
    const ph = posthog as unknown as { __loaded?: boolean };
    if (ph.__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "identified_only",
    });
  }, []);

  return <>{children}</>;
}
