import { test, expect } from '@playwright/test'

const TEST_TITLE = 'E2E Reminder Event'

test.describe('Calendar & notifications', () => {
  // remove any custom events this spec created so it doesn't pollute reminders
  test.afterAll(async ({ request }) => {
    const res = await request.get('/api/calendar-events')
    if (!res.ok()) return
    const events = (await res.json()) as { id: string; title: string }[]
    for (const e of events.filter((e) => e.title === TEST_TITLE)) {
      await request.delete(`/api/calendar-events/${e.id}`)
    }
  })

  test('calendar page renders the month grid + legend', async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /20\d\d/ }).first()).toBeVisible()
    // 7 weekday headers + day cells
    const cells = await page.locator('.grid-cols-7 > div').count()
    expect(cells).toBeGreaterThanOrEqual(7 + 28)
    await expect(page.getByText('Holiday', { exact: true })).toBeVisible() // legend
    await expect(page.getByRole('button', { name: '+ Add Event' })).toBeVisible()
  })

  test('auto-derived events: holidays show on the grid', async ({ page }) => {
    await page.goto('/calendar?month=2026-01', { waitUntil: 'networkidle' })
    // January seed holidays (Republic Day etc.) render as chips
    await expect(page.locator('.grid-cols-7 [title]').first()).toBeVisible()
  })

  test('add a custom event → appears on the grid and in notifications', async ({ page }) => {
    const today = new Date()
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    await page.goto(`/calendar?month=${ymd.slice(0, 7)}`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: '+ Add Event' }).click()
    await page.getByLabel('Event Title').fill(TEST_TITLE)
    await page.getByLabel('Event Date').fill(ymd)
    await page.getByLabel('Remind Days Before').fill('14')
    await page.getByRole('button', { name: 'Save Event' }).click()
    await expect(page.getByTitle(TEST_TITLE).first()).toBeVisible({ timeout: 8000 })

    // notifications API picks it up as upcoming
    const notif = await page.evaluate(async () => (await fetch('/api/notifications')).json())
    expect(notif.count).toBeGreaterThanOrEqual(1)
    expect(notif.upcoming.some((e: { title: string }) => e.title === TEST_TITLE)).toBe(true)
  })

  test('notification bell shows a badge and dashboard widget is present', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    await expect(page.getByText('Upcoming & Overdue')).toBeVisible()
    // bell badge appears once notifications load
    await expect(page.getByTestId('notif-count')).toBeVisible({ timeout: 8000 })
    await page.getByLabel('Notifications').click()
    await expect(page.getByText('Notifications').first()).toBeVisible()
  })
})
