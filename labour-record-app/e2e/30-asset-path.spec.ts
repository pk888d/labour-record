import { test, expect } from '@playwright/test'
import { spawn, type ChildProcess } from 'child_process'

/**
 * TEC-46 regression: with NEXT_PUBLIC_BASE_PATH set (production config,
 * mirrors nginx's /musterly reverse-proxy prefix), plain <img src="/..."> tags
 * for the logo and Help screenshots must be prefixed via assetPath() —
 * next/image auto-prefixing doesn't apply since this app has no next/image
 * usage. Spawns a second `next dev` server (same pattern as e2e/22-auth.spec.ts)
 * with the basePath set, so we can verify against a real running server rather
 * than just the unit-level assetPath() function.
 */

const PORT = 3106
const BASE_PATH = '/musterly'
const BASE = `http://localhost:${PORT}${BASE_PATH}`

test.describe('Static asset paths under NEXT_PUBLIC_BASE_PATH', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  let server: ChildProcess | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000) // next dev boot can take a while
    server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_BASE_PATH: BASE_PATH,
        // Own dist dir so this server doesn't clash with the shared dev
        // server's .next or the auth e2e server's .next-auth-e2e.
        NEXT_DIST_DIR: '.next-asset-e2e',
      },
      stdio: 'ignore',
      detached: true,
    })
    const deadline = Date.now() + 120_000
    let ready = false
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${BASE}/login`)
        if (res.status === 200) { ready = true; break }
      } catch { /* not up yet */ }
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (!ready) throw new Error(`Asset-path test server on :${PORT} did not become ready`)
  })

  test.afterAll(async () => {
    if (server?.pid) {
      try { process.kill(-server.pid, 'SIGTERM') } catch { /* already gone */ }
      try { server.kill('SIGTERM') } catch { /* already gone */ }
    }
  })

  test('login page logo has a basePath-prefixed src and loads (no 404)', async ({ page }) => {
    const responses: { url: string; status: number }[] = []
    page.on('response', (res) => responses.push({ url: res.url(), status: res.status() }))

    await page.goto(`${BASE}/login`)
    const logo = page.locator('img[alt="Tech Sakthi"]')
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute('src', `${BASE_PATH}/tech-sakthi-logo.webp`)

    const logoResponse = responses.find((r) => r.url.endsWith(`${BASE_PATH}/tech-sakthi-logo.webp`))
    expect(logoResponse?.status).toBe(200)
  })

  test('help page screenshot has a basePath-prefixed src and loads (no 404)', async ({ page }) => {
    const responses: { url: string; status: number }[] = []
    page.on('response', (res) => responses.push({ url: res.url(), status: res.status() }))

    await page.goto(`${BASE}/help`)
    const shot = page.locator('img[alt="Mustearly dashboard"]').first()
    await expect(shot).toBeVisible()
    const src = await shot.getAttribute('src')
    expect(src).toMatch(new RegExp(`^${BASE_PATH}/help/`))

    const shotResponse = responses.find((r) => r.url === new URL(src!, BASE).toString())
    expect(shotResponse?.status).toBe(200)
  })
})
