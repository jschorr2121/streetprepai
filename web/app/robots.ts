import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Every route segment under app/(app)/ requires a session — keep crawlers out
// entirely rather than relying on the auth redirect to do it. Mirrors the
// folders in app/(app)/.
const AUTHED_APP_PATHS = [
  "/dashboard",
  "/dev",
  "/firms",
  "/guide",
  "/learn",
  "/onboarding",
  "/profile",
  "/progress",
  "/sectors",
  "/tools",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...AUTHED_APP_PATHS],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
