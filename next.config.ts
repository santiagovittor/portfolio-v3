import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Album art only, never touches the shader pipeline (approved exception to
    // the no-external-images rule, interview-9). Narrowest possible hosts.
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "*.spotifycdn.com" },
    ],
  },
  // PostHog is served from this origin under /ingest so the analytics
  // requests are first-party: ad blockers and tracker-blocking browsers stop
  // eating them, and no third-party host has to be allowed in a CSP.
  // Region-specific: swap us-assets/us.i for eu-assets/eu.i if the project
  // lives in PostHog EU Cloud (TUTORIAL.md → "Choosing a region").
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // PostHog's API is sensitive to the trailing slash Next would otherwise
  // redirect away.
  skipTrailingSlashRedirect: true,

  // The services site moved from santiagovittor.store to santiagovittor.com,
  // so its case study slug moved with it. Anything already shared at the old
  // URL keeps working.
  async redirects() {
    return [
      {
        source: "/work/santiagovittor-store",
        destination: "/work/santiagovittor-com",
        permanent: true,
      },
    ];
  },
  experimental: {
    // M8: ink-morph case study navigation. If this flag ever breaks builds
    // or navigation, revert it — the site must never depend on it (PLAN.md).
    viewTransition: true,
  },
};

export default nextConfig;
