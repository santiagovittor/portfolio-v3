import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // M8: ink-morph case study navigation. If this flag ever breaks builds
    // or navigation, revert it — the site must never depend on it (PLAN.md).
    viewTransition: true,
  },
};

export default nextConfig;
