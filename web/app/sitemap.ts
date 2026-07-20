import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only public, unauthenticated pages belong here — everything under
// app/(app)/ needs a session and has no place in a public sitemap.
// /reset-password (token-gated) and the OAuth /callback route are excluded
// for the same reason: no standalone value to a crawler.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/signup`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/forgot-password`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
