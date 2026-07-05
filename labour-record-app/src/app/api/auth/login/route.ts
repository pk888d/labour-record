import { NextResponse } from 'next/server'
import { AUTH_COOKIE, SESSION_TTL_MS, getSessionSecret, isAuthEnabled, signSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // Escape hatch: no APP_PASSWORD configured → auth is disabled, no cookie needed.
    if (!isAuthEnabled()) {
      return NextResponse.json({ ok: true })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { password } = body as { password?: string }
    if (typeof password !== 'string' || password !== process.env.APP_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await signSession(getSessionSecret(), Date.now() + SESSION_TTL_MS)
    const response = NextResponse.json({ ok: true })
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
      secure: new URL(request.url).protocol === 'https:',
    })
    return response
  } catch (error) {
    console.error('POST /api/auth/login failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
