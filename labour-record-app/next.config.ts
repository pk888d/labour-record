import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Overridable so a second test server (e2e/22-auth.spec.ts) can run
  // alongside the main dev server without fighting over .next/.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Unset in dev/test (localhost:3000 at root). Production sets it to
  // '/musterly' to match the nginx reverse-proxy path prefix (TEC-45) —
  // basePath auto-prefixes next/link, useRouter and next/image, but NOT
  // manual fetch() calls; those go through apiPath() in src/lib/api-path.ts.
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH } : {}),
};

export default nextConfig;
