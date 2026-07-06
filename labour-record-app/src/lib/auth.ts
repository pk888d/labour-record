/**
 * Dependency-free single-user session auth.
 *
 * Uses Web Crypto (globalThis.crypto.subtle) HMAC-SHA256 so the same code runs
 * in both the Node.js runtime (API routes) and the edge/proxy runtime.
 *
 * Token format: "<expiresAtMs>.<base64url HMAC-SHA256 of expiresAtMs>"
 */

export const AUTH_COOKIE = 'musterly_session'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

type Env = Record<string, string | undefined>

/** Auth is enabled only when APP_PASSWORD is a non-empty string. */
export function isAuthEnabled(env: Env = process.env): boolean {
  return typeof env.APP_PASSWORD === 'string' && env.APP_PASSWORD.length > 0
}

/** Secret used to sign session tokens; falls back to APP_PASSWORD. */
export function getSessionSecret(env: Env = process.env): string {
  return env.SESSION_SECRET || env.APP_PASSWORD || ''
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(message))
  return toBase64Url(new Uint8Array(sig))
}

/** Constant-time-ish string comparison (length leak only). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Create a signed session token expiring at `expiresAtMs` (epoch ms). */
export async function signSession(secret: string, expiresAtMs: number): Promise<string> {
  const payload = String(expiresAtMs)
  const signature = await hmac(secret, payload)
  return `${payload}.${signature}`
}

/**
 * Verify a session token. Returns false for missing, malformed, tampered,
 * or expired tokens. Never throws.
 */
export async function verifySession(
  secret: string,
  token: string | undefined,
  nowMs: number = Date.now()
): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0 || dot === token.length - 1) return false
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!/^\d+$/.test(payload)) return false
  const expiresAtMs = Number(payload)
  if (!Number.isFinite(expiresAtMs)) return false
  try {
    const expected = await hmac(secret, payload)
    if (!timingSafeEqual(signature, expected)) return false
  } catch {
    return false
  }
  return nowMs < expiresAtMs
}
