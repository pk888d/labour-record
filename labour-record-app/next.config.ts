import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Overridable so a second test server (e2e/22-auth.spec.ts) can run
  // alongside the main dev server without fighting over .next/.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
