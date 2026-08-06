import { test, expect, request as pwRequest, type APIRequestContext } from '@playwright/test'
import { spawn, type ChildProcess } from 'child_process'

/**
 * Auth tests in two parts:
 *
 * Part A — against the shared dev server (started WITHOUT APP_PASSWORD by
 * playwright.config.ts): proves the escape hatch — everything passes through
 * and the auth endpoints are harmless no-ops.
 *
 * Part B — auth-enabled flow: spawns a second `next dev` server on port 3105
 * with APP_PASSWORD set, and exercises the full login/logout flow against it.
 */

test.describe('Auth disabled (default server) — escape hatch', () => {
  test('dashboard loads without redirect to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('aside')).toBeVisible()
  })

  test('login page heading uses the correct brand spelling (TEC-50)', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Mustearly', exact: true })).toBeVisible()
  })

  test('POST /api/auth/login returns ok without a password check', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: { password: 'anything' } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  test('POST /api/auth/logout returns ok', async ({ request }) => {
    const res = await request.post('/api/auth/logout')
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

const AUTH_PORT = 3105
const AUTH_BASE = `http://localhost:${AUTH_PORT}`
const PASSWORD = 'test-secret-123'

test.describe('Auth enabled (second server on :3105)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  let server: ChildProcess | undefined
  let api: APIRequestContext

  test.beforeAll(async () => {
    test.setTimeout(180_000) // next dev boot can take a while
    server = spawn('npx', ['next', 'dev', '-p', String(AUTH_PORT)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        APP_PASSWORD: PASSWORD,
        SESSION_SECRET: 'e2e-session-secret',
        // Own dist dir so this server doesn't clash with the shared dev server's .next
        NEXT_DIST_DIR: '.next-auth-e2e',
      },
      stdio: 'ignore',
      detached: true,
    })
    // Poll until the server answers. /login is public even with auth on.
    const deadline = Date.now() + 120_000
    let ready = false
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${AUTH_BASE}/login`)
        if (res.status === 200) { ready = true; break }
      } catch { /* not up yet */ }
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (!ready) throw new Error(`Auth test server on :${AUTH_PORT} did not become ready`)
    api = await pwRequest.newContext({ baseURL: AUTH_BASE })
  })

  test.afterAll(async () => {
    await api?.dispose()
    if (server?.pid) {
      try { process.kill(-server.pid, 'SIGTERM') } catch { /* already gone */ }
      try { server.kill('SIGTERM') } catch { /* already gone */ }
    }
  })

  test('GET /dashboard without session redirects to /login', async () => {
    const res = await api.get('/dashboard', { maxRedirects: 0 })
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)
    expect(res.headers()['location']).toContain('/login')
    expect(res.headers()['location']).toContain('redirect=%2Fdashboard')
  })

  test('GET /api/employees without session returns 401', async () => {
    const res = await api.get('/api/employees')
    expect(res.status()).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  test('login page itself is reachable without a session', async () => {
    const res = await api.get('/login', { maxRedirects: 0 })
    expect(res.status()).toBe(200)
  })

  test('wrong password returns 401', async () => {
    const res = await api.post('/api/auth/login', { data: { password: 'wrong' } })
    expect(res.status()).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid password' })
  })

  test('correct password returns ok and sets the session cookie', async () => {
    const res = await api.post('/api/auth/login', { data: { password: PASSWORD } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    const setCookie = res.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain('musterly_session=')
    expect(setCookie.toLowerCase()).toContain('httponly')
  })

  test('with session cookie, dashboard and API are accessible', async () => {
    // The api context stored the cookie from the previous login.
    const dash = await api.get('/dashboard', { maxRedirects: 0 })
    expect(dash.status()).toBe(200)
    const employees = await api.get('/api/employees')
    expect(employees.status()).toBe(200)
  })

  test('after logout, dashboard redirects to /login again', async () => {
    const out = await api.post('/api/auth/logout')
    expect(out.status()).toBe(200)
    const res = await api.get('/dashboard', { maxRedirects: 0 })
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)
    expect(res.headers()['location']).toContain('/login')
  })
})
