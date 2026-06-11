import { test, expect, type Page } from '@playwright/test'

async function getCycleId(page: Page): Promise<string> {
  await page.goto('/cycles')
  await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
  // Wait for cycle detail page to load before reading URL
  await page.waitForURL(/\/cycles\/[^/]+$/)
  return page.url().split('/').pop() ?? ''
}

test.describe('Print Views — Hospital Forms', () => {
  test('Form XII (Wages Register) print page loads', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XII`)
    await expect(page.getByText(/REGISTER OF WAGES/i).first()).toBeVisible({ timeout: 20000 })
  })

  test('Form V (Muster Roll) print page loads', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_V`)
    await expect(page.getByText(/Muster Roll|Form V/i).first()).toBeVisible()
  })

  test('Form XI (Employee Register) print page loads', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XI`)
    await expect(page.getByText(/REGISTER OF EMPLOYEES/i).first()).toBeVisible()
  })

  test('Form XVII (Wage Slips) print page loads', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XVII`)
    await expect(page.getByText(/Wage Slip|Form XVII/i).first()).toBeVisible()
  })

  test('Form IV (Overtime Muster) print page loads', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_IV`)
    await expect(page.getByText(/Overtime|Form IV/i).first()).toBeVisible()
  })

  test('Form I (Fines Register) print page loads', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_I`)
    await expect(page.getByText(/REGISTER OF FINES/i).first()).toBeVisible()
  })

  test('Form II (Deductions Register) print page loads', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_II`)
    await expect(page.getByText(/REGISTER OF DEDUCTIONS/i).first()).toBeVisible()
  })

  test('print page has Print button', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XII`)
    await expect(page.getByRole('button', { name: /Print/i })).toBeVisible()
  })

  test('print page sidebar is hidden', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XII`)
    const sidebar = page.locator('aside')
    if (await sidebar.count() > 0) {
      await expect(sidebar).not.toBeVisible()
    }
  })

  test('print page shows employee names', async ({ page }) => {
    const cycleId = await getCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XII`)
    await expect(page.getByText('Alagurani')).toBeVisible()
  })
})

test.describe('Print Views — Invalid Routes', () => {
  test('invalid form code returns 404', async ({ page }) => {
    const cycleId = await getCycleId(page)
    const response = await page.goto(`/print/${cycleId}/INVALID_FORM_CODE`)
    expect(response?.status()).toBe(404)
  })
})
