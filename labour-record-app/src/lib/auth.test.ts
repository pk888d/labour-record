import { describe, it, expect } from 'vitest'
import { signSession, verifySession, isAuthEnabled, AUTH_COOKIE, SESSION_TTL_MS } from './auth'

const SECRET = 'test-secret'
const NOW = 1_750_000_000_000

describe('signSession / verifySession', () => {
  it('round-trips: a signed token verifies with the same secret', async () => {
    const token = await signSession(SECRET, NOW + 10_000)
    await expect(verifySession(SECRET, token, NOW)).resolves.toBe(true)
  })

  it('token format is "<expiresAtMs>.<base64url signature>"', async () => {
    const expiresAt = NOW + 10_000
    const token = await signSession(SECRET, expiresAt)
    const [exp, sig] = token.split('.')
    expect(exp).toBe(String(expiresAt))
    expect(sig).toMatch(/^[A-Za-z0-9_-]+$/) // base64url, no padding
    expect(sig.length).toBeGreaterThan(0)
  })

  it('rejects a tampered signature', async () => {
    const token = await signSession(SECRET, NOW + 10_000)
    const [exp, sig] = token.split('.')
    const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1)
    await expect(verifySession(SECRET, `${exp}.${flipped}`, NOW)).resolves.toBe(false)
  })

  it('rejects a tampered expiry', async () => {
    const token = await signSession(SECRET, NOW + 10_000)
    const [, sig] = token.split('.')
    await expect(verifySession(SECRET, `${NOW + 999_999_999}.${sig}`, NOW)).resolves.toBe(false)
  })

  it('rejects an expired token', async () => {
    const token = await signSession(SECRET, NOW - 1)
    await expect(verifySession(SECRET, token, NOW)).resolves.toBe(false)
  })

  it('accepts a token expiring exactly in the future, rejects at/after expiry', async () => {
    const token = await signSession(SECRET, NOW)
    await expect(verifySession(SECRET, token, NOW - 1)).resolves.toBe(true)
    await expect(verifySession(SECRET, token, NOW)).resolves.toBe(false)
  })

  it('rejects undefined and empty tokens', async () => {
    await expect(verifySession(SECRET, undefined, NOW)).resolves.toBe(false)
    await expect(verifySession(SECRET, '', NOW)).resolves.toBe(false)
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await signSession('other-secret', NOW + 10_000)
    await expect(verifySession(SECRET, token, NOW)).resolves.toBe(false)
  })

  it('rejects malformed tokens', async () => {
    await expect(verifySession(SECRET, 'no-dot-here', NOW)).resolves.toBe(false)
    await expect(verifySession(SECRET, 'abc.def', NOW)).resolves.toBe(false) // non-numeric expiry
    await expect(verifySession(SECRET, `${NOW + 10_000}.`, NOW)).resolves.toBe(false) // empty signature
    await expect(verifySession(SECRET, `${NOW + 10_000}.!!!not-base64url***`, NOW)).resolves.toBe(false)
    await expect(verifySession(SECRET, '.', NOW)).resolves.toBe(false)
  })
})

describe('isAuthEnabled', () => {
  it('is false when APP_PASSWORD is unset', () => {
    expect(isAuthEnabled({})).toBe(false)
  })

  it('is false when APP_PASSWORD is empty', () => {
    expect(isAuthEnabled({ APP_PASSWORD: '' })).toBe(false)
  })

  it('is true when APP_PASSWORD is a non-empty string', () => {
    expect(isAuthEnabled({ APP_PASSWORD: 'hunter2' })).toBe(true)
  })
})

describe('constants', () => {
  it('exposes the cookie name and a 7-day TTL', () => {
    expect(AUTH_COOKIE).toBe('musterly_session')
    expect(SESSION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })
})
