import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
