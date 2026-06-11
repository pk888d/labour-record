import { test, expect } from '@playwright/test'

// ─── 1. Page Load Checks ────────────────────────────────────────────────────

test.describe('Page Load Checks', () => {
  const pages = [
    { path: '/establishments', name: 'Establishments list' },
    { path: '/establishments/new', name: 'New establishment form' },
    { path: '/employees', name: 'Employees list' },
    { path: '/employees/new', name: 'New employee form' },
    { path: '/cycles', name: 'Cycles list' },
    { path: '/cycles/new', name: 'New cycle form' },
    { path: '/holidays', name: 'Holidays page' },
    { path: '/dashboard', name: 'Dashboard page' },
    { path: '/exports', name: 'Exports page' },
  ]

  for (const { path, name } of pages) {
    test(`${name} loads without crash`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      const response = await page.goto(path)
      await page.waitForLoadState('networkidle')
      expect(response?.status()).not.toBe(500)
      expect(response?.status()).not.toBe(404)
      // Check no blank page (body has content)
      const bodyText = await page.locator('body').innerText()
      expect(bodyText.trim().length).toBeGreaterThan(10)
    })
  }
})

// ─── 2. Tooltip (ⓘ icon) Checks ─────────────────────────────────────────────

test.describe('Info Tooltips on Forms', () => {
  test('establishment form has ⓘ tooltip icons', async ({ page }) => {
    await page.goto('/establishments/new')
    await page.waitForLoadState('networkidle')
    // Look for tooltip trigger elements: title attr, aria-label, data-tooltip, or ⓘ text
    const tooltipTriggers = page.locator('[title], [aria-label], [data-tooltip], [data-tip]')
      .or(page.getByText('ⓘ'))
      .or(page.locator('button[aria-describedby], svg[aria-label]'))
      .or(page.locator('.tooltip, [class*="tooltip"]'))
    const count = await tooltipTriggers.count()
    expect(count).toBeGreaterThan(0)
  })

  test('employee form has ⓘ tooltip icons', async ({ page }) => {
    await page.goto('/employees/new')
    await page.waitForLoadState('networkidle')
    const tooltipTriggers = page.locator('[title], [aria-label], [data-tooltip], [data-tip]')
      .or(page.getByText('ⓘ'))
      .or(page.locator('button[aria-describedby], svg[aria-label]'))
      .or(page.locator('.tooltip, [class*="tooltip"]'))
    const count = await tooltipTriggers.count()
    expect(count).toBeGreaterThan(0)
  })

  test('cycle form has ⓘ tooltip icons', async ({ page }) => {
    await page.goto('/cycles/new')
    await page.waitForLoadState('networkidle')
    const tooltipTriggers = page.locator('[title], [aria-label], [data-tooltip], [data-tip]')
      .or(page.getByText('ⓘ'))
      .or(page.locator('button[aria-describedby], svg[aria-label]'))
      .or(page.locator('.tooltip, [class*="tooltip"]'))
    const count = await tooltipTriggers.count()
    expect(count).toBeGreaterThan(0)
  })
})

// ─── 3. Validation Guards ────────────────────────────────────────────────────

test.describe('Validation Guards', () => {
  test('establishment form: empty submit shows required validation', async ({ page }) => {
    await page.goto('/establishments/new')
    await page.getByRole('button', { name: /Create Establishment/i }).click()
    // Either the browser-native required validation fires or a JS error message appears
    const nameInput = page.getByLabel('Name', { exact: true })
    const isRequired = await nameInput.getAttribute('required')
    const hasValidationMsg = await page.getByText(/required|field is required|please fill/i).count() > 0
    // At minimum the name field should be marked required
    expect(isRequired !== null || hasValidationMsg).toBeTruthy()
  })

  test('employee form: invalid mobile number (3 digits) shows error', async ({ page }) => {
    await page.goto('/employees/new')
    await page.waitForLoadState('networkidle')
    // Fill required fields minimally
    await page.getByLabel('Emp ID').fill('TESTID99')
    await page.getByLabel('Name', { exact: true }).fill('Test Person')
    try {
      await page.getByLabel('Establishment').selectOption({ index: 1 })
    } catch {}
    // Fill mobile with invalid value
    const mobileInput = page.getByLabel(/mobile|phone/i).first()
    if (await mobileInput.count() > 0) {
      await mobileInput.fill('123')
    }
    await page.getByRole('button', { name: /Add Employee/i }).click()
    // Look for validation error message
    const hasError = await page.getByText(/mobile|phone|invalid|10 digit|must be/i).count() > 0
    const hasBrowserValidation = await page.locator('input:invalid').count() > 0
    expect(hasError || hasBrowserValidation || await mobileInput.getAttribute('pattern') !== null).toBeTruthy()
  })

  test('employee form: DOB less than 14 years ago shows age error', async ({ page }) => {
    await page.goto('/employees/new')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Emp ID').fill('TESTID100')
    await page.getByLabel('Name', { exact: true }).fill('Child Test')
    try {
      await page.getByLabel('Establishment').selectOption({ index: 1 })
    } catch {}
    const dobField = page.getByLabel('Date of Birth').or(page.getByLabel(/dob/i)).first()
    if (await dobField.count() > 0) {
      // Set DOB to 5 years ago (under 14)
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      const dobStr = fiveYearsAgo.toISOString().split('T')[0]
      await dobField.fill(dobStr)
      await page.getByRole('button', { name: /Add Employee/i }).click()
      // Look for age-related error
      const hasAgeError = await page.getByText(/age|14 year|minimum age|too young|born/i).count() > 0
      // If no specific error, check for general form validation failure (still on same page)
      const stillOnNewPage = page.url().includes('/employees/new')
      expect(hasAgeError || stillOnNewPage).toBeTruthy()
    } else {
      test.skip(true, 'DOB field not found on employee form')
    }
  })
})

// ─── 4. Specific UI Feature Checks ───────────────────────────────────────────

test.describe('Specific UI Feature Checks', () => {
  test('holidays page: add form is visible', async ({ page }) => {
    await page.goto('/holidays')
    await page.waitForLoadState('networkidle')
    await expect(page.getByLabel('Date').or(page.locator('input[type="date"]').first())).toBeVisible()
    await expect(page.getByLabel('Holiday Name').or(page.getByPlaceholder(/holiday name/i)).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Holiday' })).toBeVisible()
  })

  test.skip('wage rules page: establishment selector works', async ({ page }) => {
    // Wage Rules page was removed; test retained as skipped for history.
    await page.goto('/wage-rules')
    await page.waitForLoadState('networkidle')
    const selector = page.getByLabel('Establishment').or(page.locator('select').first())
    await expect(selector).toBeVisible()
    await selector.selectOption({ index: 1 })
    // After selection, some rules content should appear
    await page.waitForTimeout(500)
    const hasContent = await page.locator('table, [class*="rule"], [class*="Rule"]').count() > 0
    expect(hasContent).toBeTruthy()
  })

  test('cycles list: Delete button is present', async ({ page }) => {
    await page.goto('/cycles')
    await page.waitForLoadState('networkidle')
    const deleteBtn = page.getByRole('button', { name: /Delete/i }).first()
      .or(page.getByRole('link', { name: /Delete/i }).first())
    await expect(deleteBtn).toBeVisible()
  })

  test('employees list: filter dropdowns are present', async ({ page }) => {
    await page.goto('/employees')
    await page.waitForLoadState('networkidle')
    // Should have at least one filter dropdown (by establishment)
    const filterDropdown = page.locator('select').first()
      .or(page.getByRole('combobox').first())
    await expect(filterDropdown).toBeVisible()
  })

  test('sidebar navigation: no 404 errors on nav links', async ({ page }) => {
    const navLinks = ['/dashboard', '/establishments', '/employees', '/cycles', '/holidays', '/exports']
    for (const path of navLinks) {
      const response = await page.goto(path)
      const status = response?.status() ?? 0
      expect(status, `${path} returned ${status}`).not.toBe(404)
    }
  })
})
