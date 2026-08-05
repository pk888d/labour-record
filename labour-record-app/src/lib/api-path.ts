// Prefixes an absolute app path with NEXT_PUBLIC_BASE_PATH (e.g. '/musterly'
// in production, unset in dev/test). Next.js auto-prefixes next/link,
// useRouter and next/image with basePath, but not manual fetch() calls to
// absolute paths — every client-side fetch('/api/...') must go through this
// (TEC-45: unprefixed fetches 404 against nginx's path-scoped reverse proxy).
export function apiPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`
}
