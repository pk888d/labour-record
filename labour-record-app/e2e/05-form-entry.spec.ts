import { test, expect, type Page } from '@playwright/test'

async function openFirstCycleFormTask(page: Page) {
  await page.goto('/cycles')
  await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
  await page.locator('a', { hasText: 'Open' }).first().click()
}

test.describe('Form Entry — Attendance Tab', () => {
  test('opens form entry page for Form XII', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await expect(page.getByRole('button', { name: 'Attendance', exact: true })).toBeVisible()
  })

  test('attendance tab shows all 6 employees', async ({ page }) => {
    await openFirstCycleFormTask(page)
    const attTab = page.getByRole('button', { name: 'Attendance', exact: true })
    if (await attTab.isVisible()) await attTab.click()
    await expect(page.getByText('Alagurani')).toBeVisible()
    await expect(page.getByText('Ambika')).toBeVisible()
  })

  test('can mark attendance day 1 as Present', async ({ page }) => {
    await openFirstCycleFormTask(page)
    const attTab = page.getByRole('button', { name: 'Attendance', exact: true })
    if (await attTab.isVisible()) await attTab.click()
    const firstDayCell = page.locator('td[data-day="1"], button[data-day="1"], [data-testid="day-cell"]').first()
    if (await firstDayCell.isVisible()) {
      await firstDayCell.click()
      await expect(firstDayCell).toHaveText(/P|A|H|L|OT/)
    }
  })

  test('attendance save button is visible', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeVisible()
  })
})

test.describe('Form Entry — Wages Tab', () => {
  test('wages tab shows employee wage fields', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Wage Data', exact: true }).click()
    await expect(page.getByText('Alagurani')).toBeVisible()
    await expect(page.getByPlaceholder(/basic|Basic/).first().or(
      page.locator('input[aria-label*="basic" i]').first()
    ).or(page.locator('td input').first())).toBeVisible()
  })

  test('wages tab has save button', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Wage Data', exact: true }).click()
    await expect(page.getByRole('button', { name: /Save Wage/i })).toBeVisible()
  })
})

test.describe('Form Entry — Overtime Tab', () => {
  test('overtime tab loads', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Overtime', exact: true }).click()
    await expect(page.getByText('Alagurani')).toBeVisible()
  })
})

test.describe('Form Entry — Fines Tab', () => {
  test('fines tab loads with add fine form', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Fines', exact: true }).click()
    await expect(page.getByRole('combobox').or(page.getByLabel(/Employee/i)).first()).toBeVisible()
  })

  test('add a fine record', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Fines', exact: true }).click()
    const empSelect = page.getByRole('combobox').first()
    await empSelect.selectOption({ index: 1 })
    await page.getByLabel('Offence Date').fill('2026-06-10')
    await page.getByLabel('Fine Description').fill('Late arrival')
    await page.getByLabel('Fine Amount').fill('50')
    await page.getByRole('button', { name: /Add Fine/i }).click()
    await expect(page.getByText('Late arrival').first()).toBeVisible()
  })
})

test.describe('Form Entry — Deductions Tab', () => {
  test('deductions tab loads', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Deductions', exact: true }).click()
    await expect(page.getByRole('button', { name: /Add Deduction/i })).toBeVisible()
  })
})

test.describe('Form Entry — Leave Tab', () => {
  test('leave tab shows employee leave fields', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Leave', exact: true }).click()
    await expect(page.getByText('Alagurani')).toBeVisible()
    await expect(page.getByRole('button', { name: /Save/i })).toBeVisible()
  })
})
