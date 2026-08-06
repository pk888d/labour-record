import { test, expect } from '@playwright/test'

// Regression coverage for TEC-49 (mobile responsive layout issues and
// split-screen filter misalignment). Pure layout/geometry assertions —
// no fixtures/data needed since these pages render fine with an empty DB.

const MOBILE = { width: 375, height: 667 }
const SPLIT_SCREEN = { width: 700, height: 900 }

async function hasNoHorizontalOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
}

test.describe('Responsive layout — no horizontal overflow', () => {
  for (const viewport of [MOBILE, SPLIT_SCREEN]) {
    for (const path of ['/', '/cycles', '/dashboard', '/audit', '/employees']) {
      test(`${path} has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto(path)
        await expect.poll(() => hasNoHorizontalOverflow(page)).toBe(true)
      })
    }
  }
})

test.describe('Filter controls reflow instead of clipping off-screen', () => {
  for (const viewport of [MOBILE, SPLIT_SCREEN]) {
    test(`kanban board filter controls stay in-viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const establishmentSelect = page.locator('select[name="establishmentId"]')
      const monthSelect = page.locator('select[name="month"]')
      const yearSelect = page.locator('select[name="year"]')
      const filterButton = page.getByRole('button', { name: 'Filter' })

      for (const locator of [establishmentSelect, monthSelect, yearSelect, filterButton]) {
        await expect(locator).toBeVisible()
        const box = await locator.boundingBox()
        expect(box).not.toBeNull()
        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
        }
      }
    })
  }
})

test.describe('Sidebar stacks on mobile instead of crushing content', () => {
  test('main content region is not squeezed to a sliver at 375px', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await page.goto('/dashboard')

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(300)
    }
  })

  test('sidebar and content are side-by-side above the md breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/dashboard')

    const aside = page.locator('aside').first()
    const main = page.locator('main').first()
    await expect(aside).toBeVisible()
    await expect(main).toBeVisible()

    const asideBox = await aside.boundingBox()
    const mainBox = await main.boundingBox()
    expect(asideBox).not.toBeNull()
    expect(mainBox).not.toBeNull()
    if (asideBox && mainBox) {
      // Side-by-side means the main content starts at/after the sidebar's right edge,
      // not below it (stacked would put main.y > aside.y + aside.height).
      expect(mainBox.x).toBeGreaterThanOrEqual(asideBox.x + asideBox.width - 1)
    }
  })
})
