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
