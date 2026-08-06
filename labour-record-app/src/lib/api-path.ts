// Prefixes an absolute app path with NEXT_PUBLIC_BASE_PATH (e.g. '/mustearly'
// in production, unset in dev/test). Next.js auto-prefixes next/link,
// useRouter and next/image with basePath, but not manual fetch() calls to
// absolute paths — every client-side fetch('/api/...') must go through this
// (TEC-45: unprefixed fetches 404 against nginx's path-scoped reverse proxy).
export function apiPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`
}

// Prefixes an absolute static-asset path (logo, /help/*.png screenshots, etc.)
// with NEXT_PUBLIC_BASE_PATH. This codebase has no next/image usage, so plain
// <img src="/..."> tags are never auto-prefixed by Next.js the way next/image
// would be — every such reference must go through this instead (TEC-46:
// unprefixed <img> src's 404 against nginx's path-scoped reverse proxy, same
// class of bug as TEC-45's fetch() prefixing).
export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`
}
