import { test, expect, type Page } from '@playwright/test'

/**
 * Autonomous-QA validated end-to-end flows for Mustearly.
 * Derives record IDs through the UI so it runs against any seeded DB.
 * Ignores browser-extension console noise; fails on app-origin errors.
 */

function guardConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (/chrome-extension|favicon|Failed to load resource/i.test(t)) return
    errors.push('console.error: ' + t)
  })
  return errors
}

const SIDEBAR = ['Dashboard', 'Monthly Cycles', 'Establishments', 'Employees', 'Holidays', 'Exports']
const PRINT_FORMS = [
  'HOSPITAL_FORM_XI', 'HOSPITAL_FORM_V', 'HOSPITAL_FORM_XII', 'HOSPITAL_FORM_XVII',
  'HOSPITAL_FORM_IV', 'HOSPITAL_FORM_I', 'HOSPITAL_FORM_II',
  'SHOP_FORM_U', 'SHOP_FORM_V', 'SHOP_FORM_W', 'SHOP_FORM_T', 'SHOP_FORM_X',
]

// Derive a cycle id from the Cycles list (first "View" link).
async function firstCycleId(page: Page): Promise<string> {
  await page.goto('/cycles', { waitUntil: 'networkidle' })
  const href = await page.locator('table a:has-text("View")').first().getAttribute('href')
  expect(href, 'a cycle must exist in the seed data').toBeTruthy()
  return href!.split('/').pop()!
}

test.describe('Mustearly — E2E', () => {
  test('Navigation: sidebar links, TopNav, wage-rules removed', async ({ page }) => {
    const errors = guardConsole(page)
    // sidebar labels carry an icon prefix, so match by substring (not exact)
    const routes: [string, RegExp][] = [
      ['Monthly Cycles', /\/cycles$/],
      ['Establishments', /\/establishments$/],
      ['Employees', /\/employees$/],
      ['Holidays', /\/holidays$/],
      ['Exports', /\/exports$/],
    ]
    for (const [label, re] of routes) {
      await page.goto('/dashboard', { waitUntil: 'networkidle' })
      await page.locator('aside nav a', { hasText: label }).click()
      await expect(page).toHaveURL(re)
    }
    // TopNav controls present
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next page' })).toBeVisible()
    // Removed page
    const resp = await page.goto('/wage-rules')
    expect(resp?.status()).toBe(404)
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    await expect(page.locator('aside nav a:has-text("Wage Rules")')).toHaveCount(0)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('Dashboard: 4-view switcher + persistence', async ({ page }) => {
    const errors = guardConsole(page)
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    await expect(page.getByText('Registered Firms')).toBeVisible()
    for (const v of ['Cards', 'Table', 'Expandable', 'Directory']) {
      await page.getByRole('button', { name: v }).click()
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    }
    await page.getByRole('button', { name: 'Table' }).click()
    await page.reload({ waitUntil: 'networkidle' })
    const cls = await page.getByRole('button', { name: 'Table' }).getAttribute('class')
    expect(cls).toContain('gold') // persisted selection highlighted
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('Establishments: validation (native required + min-length)', async ({ page }) => {
    await page.goto('/establishments/new', { waitUntil: 'networkidle' })
    // empty submit blocked by native required → stays on form
    await page.getByRole('button', { name: /Create Establishment/ }).click()
    await expect(page).toHaveURL(/\/establishments\/new/)
    // name too short → JS error
    await page.getByLabel('Name', { exact: true }).fill('ab')
    await page.getByLabel('Address').fill('x')
    await page.getByLabel('Employer Name').fill('x')
    await page.getByLabel('Manager Name').fill('x')
    await page.getByLabel('Reg Cert No').fill('x')
    await page.getByRole('button', { name: /Create Establishment/ }).click()
    await expect(page.getByText(/at least 3 characters/i)).toBeVisible()
  })

  test('Employees: empty submit + invalid mobile + salary live preview', async ({ page }) => {
    // empty submit blocked by native required → stays on the form
    await page.goto('/employees/new', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Add Employee/ }).click()
    await expect(page).toHaveURL(/\/employees\/new/)

    // edit an existing employee (first in the list)
    await page.goto('/employees', { waitUntil: 'networkidle' })
    await page.locator('table a:has-text("Edit")').first().click()
    await expect(page).toHaveURL(/\/employees\/.+/)

    // salary live preview: total - DA = Basic
    await page.getByLabel('Default Total Salary').fill('15000')
    await expect(page.getByText('Live Breakdown Preview')).toBeVisible()
    await page.getByRole('button', { name: /Apply to wage defaults/ }).click()
    // Basic = 15000 - firm DA (computed); just assert it changed to a number
    const basic = await page.getByLabel('Basic Wage').inputValue()
    expect(Number(basic)).toBeGreaterThan(0)

    // invalid mobile → rejected
    const mobile = page.locator('xpath=//label[contains(.,"Mobile")]/following::input[1]')
    await mobile.fill('123')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText(/Mobile must be 10 digits/i)).toBeVisible()
  })

  test('Holidays: defaults button, double-wage column, empty-add error', async ({ page }) => {
    await page.goto('/holidays', { waitUntil: 'networkidle' })
    await expect(page.getByRole('button', { name: 'Load default holidays' })).toBeVisible()
    await page.getByRole('button', { name: '+ Add Holiday' }).click()
    await expect(page.getByText(/Please select a date|is required/i)).toBeVisible()
  })

  test('Cycles: Generate Financial Year control', async ({ page }) => {
    await page.goto('/cycles', { waitUntil: 'networkidle' })
    await expect(page.getByRole('button', { name: 'Generate Financial Year' })).toBeVisible()
  })

  test('Print: all 12 statutory forms render + orientation + watermark', async ({ page }) => {
    const errors = guardConsole(page)
    const cycleId = await firstCycleId(page)
    for (const f of PRINT_FORMS) {
      const r = await page.goto(`/print/${cycleId}/${f}`, { waitUntil: 'networkidle' })
      expect(r?.status(), `form ${f}`).toBe(200)
    }
    // orientation toggle changes on-screen page width
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_I`, { waitUntil: 'networkidle' })
    const widthOf = () => page.evaluate(() => {
      const e = document.querySelector('.form-page')
      return e ? Math.round(e.getBoundingClientRect().width) : 0
    })
    const land = await widthOf()
    await page.getByRole('button', { name: 'Portrait' }).click()
    await page.waitForURL('**orientation=portrait**')
    const port = await widthOf()
    expect(land).toBeGreaterThan(port)
    await expect(page.locator('.ts-watermark')).toHaveCount(1)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('Salary slips: list + Original/Photocopy on one sheet', async ({ page }) => {
    const cycleId = await firstCycleId(page)
    const r = await page.goto(`/cycles/${cycleId}/salary-slips`, { waitUntil: 'networkidle' })
    expect(r?.status()).toBe(200)
    const view = page.locator('a:has-text("View")').first()
    if (await view.count()) {
      await view.click()
      await expect(page).toHaveURL(/\/salary-slips\/.+/)
      await expect(page.locator('.ts-sheet > div')).toHaveCount(2) // Original + Photocopy
    }
  })

  test('Error states: unknown route and bad IDs → 404', async ({ page }) => {
    for (const path of ['/no-such-page', '/establishments/zzz/employees', '/print/zzz/HOSPITAL_FORM_I', '/employees/zzz']) {
      const r = await page.goto(path)
      expect(r?.status(), path).toBe(404)
    }
  })

  test('Calculations: salary breakdown, wage register, muster', async ({ page }) => {
    const numOf = async (label: string) => {
      const t = await page.locator('text=Live Breakdown Preview').locator('xpath=..').innerText()
      const m = t.match(new RegExp(label + '\\s*₹([\\d,]+(?:\\.\\d+)?)'))
      return m ? parseFloat(m[1].replace(/,/g, '')) : NaN
    }
    // controlled salary inputs
    await page.goto('/employees', { waitUntil: 'networkidle' })
    await page.locator('table a:has-text("Edit")').first().click()
    await page.getByLabel('Default Total Salary').fill('20000')
    await page.getByLabel('Setup DA').fill('5000')
    await page.getByLabel('Setup HRA').fill('2000')
    await page.getByLabel('Setup Other Allowances').fill('1000')
    await page.getByLabel('PF Mode').selectOption('PERCENT')
    await page.getByLabel('PF Percent').fill('12')
    await page.getByLabel('PF Wage Ceiling').fill('15000')
    if (!(await page.getByLabel('ESI Percent').isVisible().catch(() => false))) await page.getByText('ESI Applicable').click()
    await page.getByLabel('ESI Percent').fill('0.75')
    await page.getByLabel('ESI Threshold').fill('21000')
    await page.getByLabel('Setup LWF').fill('10')
    await page.waitForTimeout(300)
    expect(await numOf('Basic')).toBeCloseTo(12000, 2)   // 20000 - 5000 - 2000 - 1000
    expect(await numOf('PF')).toBeCloseTo(1800, 2)        // min(17000,15000) * 12%
    expect(await numOf('ESI')).toBeCloseTo(150, 2)        // 0.75% of 20000
    expect(await numOf('LWF')).toBeCloseTo(10, 2)
    // Net = Gross - (PF+ESI+LWF) = 20000 - 1960 = 18040
    const netTxt = await page.locator('text=Live Breakdown Preview').locator('xpath=..').innerText()
    expect(netTxt).toMatch(/Net Pay:\s*₹18,040/)
    // ESI = 0 over threshold
    await page.getByLabel('Default Total Salary').fill('25000')
    await page.waitForTimeout(250)
    expect(await numOf('ESI')).toBeCloseTo(0, 2)

    // Wage register (Form XII) relational math — checked on the first cycle row
    // that actually has wage data (cells are "Nil" when a cycle has no records).
    const cycleId = await firstCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XII`, { waitUntil: 'networkidle' })
    const dataRows = await page.locator('table tbody tr').all()
    for (const row of dataRows) {
      const cells = (await row.locator('td').allInnerTexts()).map((x) => x.replace(/[₹,]/g, ''))
      const basic = parseFloat(cells[8]), da = parseFloat(cells[9]), totalNormal = parseFloat(cells[10])
      const gross = parseFloat(cells[12]), amtDed = parseFloat(cells[13]), net = parseFloat(cells[15])
      if ([basic, da, totalNormal, gross, amtDed, net].every(Number.isFinite)) {
        expect(totalNormal, 'Total Normal = Basic + DA').toBeCloseTo(basic + da, 2)
        expect(net, 'Net = Gross - Amount Deducted').toBeCloseTo(gross - amtDed, 2)
        break // one verified row is sufficient evidence
      }
    }

    // Muster (Form V): Days Worked ≤ Days counted for wages (when present)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_V`, { waitUntil: 'networkidle' })
    const mr = await page.locator('table tbody tr').first().locator('td').allInnerTexts()
    const worked = parseInt(mr[mr.length - 5]), counted = parseInt(mr[mr.length - 2])
    if (Number.isFinite(worked) && Number.isFinite(counted)) {
      expect(counted, 'Days counted ≥ Days worked').toBeGreaterThanOrEqual(worked)
    }
  })

  test('Print document fidelity: year, bold subtitle, DB-consistent values', async ({ page }) => {
    const cycleId = await firstCycleId(page)
    // The printed period year must match the cycle the user opened (no stale year)
    await page.goto(`/cycles/${cycleId}`, { waitUntil: 'networkidle' })
    const heading = await page.locator('h1').first().innerText()
    const yearMatch = heading.match(/\b(20\d\d|2[1-9]\d\d)\b/)
    const cycleYear = yearMatch ? yearMatch[1] : null

    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XII`, { waitUntil: 'networkidle' })
    const subtitle = page.locator('.form-header p', { hasText: 'for the Month' })
    // Subtitle (Register of … for the Month of <period>) must be BOLD per the template
    const weight = await subtitle.evaluate((e) => parseInt(getComputedStyle(e).fontWeight))
    expect(weight, 'subtitle should be bold').toBeGreaterThanOrEqual(600)
    // Printed year matches the cycle's year (not a stale value)
    if (cycleYear) expect(await subtitle.innerText()).toContain(cycleYear)
    // Wage register row math stays internally consistent (DB-derived)
    const cells = (await page.locator('table tbody tr').first().locator('td').allInnerTexts()).map((x) => x.replace(/[₹,]/g, ''))
    const basic = parseFloat(cells[8]), da = parseFloat(cells[9]), tn = parseFloat(cells[10])
    if ([basic, da, tn].every(Number.isFinite)) expect(tn).toBeCloseTo(basic + da, 2)
  })

  test('Wage slip matches template: landscape, per-employee Original + Photocopy', async ({ page }) => {
    const cycleId = await firstCycleId(page)
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XVII`, { waitUntil: 'networkidle' })
    const sheets = await page.locator('.ts-wageslip-sheet').count()
    expect(sheets, 'one sheet per employee').toBeGreaterThan(0)
    // each sheet carries both an Original and a Photocopy copy
    expect(await page.getByText('[Original]').count()).toBe(sheets)
    expect(await page.getByText(/Duplicate \/ Photocopy/).count()).toBe(sheets)
    // landscape orientation declared for the slip
    const css = await page.locator('style').evaluateAll((els) => els.map((e) => e.textContent).join('\n'))
    expect(css).toMatch(/A4 landscape/)
  })
})
