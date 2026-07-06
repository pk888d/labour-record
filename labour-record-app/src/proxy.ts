import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, getSessionSecret, isAuthEnabled, verifySession } from '@/lib/auth'

/**
 * Auth gate (Next.js 16 "proxy" convention — the renamed middleware.ts).
 *
 * When APP_PASSWORD is unset, auth is disabled and every request passes
 * through — local dev and the existing Playwright suite keep working.
 */

// Paths reachable without a session.
const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/favicon.ico'])

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/_next/')) return true
  // Static assets under /public (logo, help screenshots, fonts, …):
  // anything whose last segment has a file extension.
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1)
  if (lastSegment.includes('.')) return true
  return false
}

export async function proxy(request: NextRequest) {
  if (!isAuthEnabled()) return NextResponse.next()

  const { pathname } = request.nextUrl
  if (request.method === 'OPTIONS' || isPublic(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  const valid = await verifySession(getSessionSecret(), token)
  if (valid) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}
