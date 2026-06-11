import { test, expect } from '@playwright/test'

test.describe('Navigation & Layout', () => {
  test('root page loads (Kanban board)', async ({ page }) => {
    await page.goto('/')
    // Root is the Kanban board
    await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible()
  })

  test('sidebar shows all nav links', async ({ page }) => {
    await page.goto('/establishments')
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Monthly Cycles' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Establishments' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Employees' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Exports' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Holidays' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })

  test('active link is highlighted', async ({ page }) => {
    await page.goto('/cycles')
    const cyclesLink = page.getByRole('link', { name: 'Monthly Cycles' })
    await expect(cyclesLink).toHaveClass(/gold/) // active item uses the gold accent
  })

  test('sidebar navigates to employees', async ({ page }) => {
    await page.goto('/establishments')
    await page.getByRole('link', { name: 'Employees' }).click()
    await expect(page).toHaveURL(/\/employees/)
  })

  test('sidebar navigates to cycles', async ({ page }) => {
    await page.goto('/establishments')
    await page.getByRole('link', { name: 'Monthly Cycles' }).click()
    await expect(page).toHaveURL(/\/cycles/)
  })

  test('sidebar navigates to exports', async ({ page }) => {
    await page.goto('/establishments')
    await page.getByRole('link', { name: 'Exports' }).click()
    await expect(page).toHaveURL(/\/exports/)
  })

  test('sidebar has Holidays link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Holidays' })).toBeVisible()
  })

  test('sidebar has Dashboard link (Wage Rules removed)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Wage Rules' })).toHaveCount(0)
  })
})
