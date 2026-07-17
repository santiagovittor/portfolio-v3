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
  experimental: {
    // M8: ink-morph case study navigation. If this flag ever breaks builds
    // or navigation, revert it — the site must never depend on it (PLAN.md).
    viewTransition: true,
  },
};

export default nextConfig;
