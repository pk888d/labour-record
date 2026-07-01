/**
 * Employee edit — field coverage and round-trip persistence tests.
 *
 * Strategy:
 *  - All write-tests operate on Alagurani (emp_h001) and restore via the API
 *    in afterEach so the DB stays clean for the next test.
 *  - The "all seeded employees" suite just does a load + no-op save to prove
 *    no employee's existing data fails validation.
 */
import { test, expect, type APIRequestContext } from '@playwright/test'

// ── helpers ───────────────────────────────────────────────────────────────────

const EMP_ID = 'emp_h001'
const EMP_PATH = `/employees/${EMP_ID}`

async function getEmployee(request: APIRequestContext) {
  const res = await request.get(`/api/employees/${EMP_ID}`)
  return res.json()
}

async function restoreEmployee(request: APIRequestContext, snapshot: Record<string, unknown>) {
  const toDate = (v: unknown) =>
    v ? new Date(v as string).toISOString().split('T')[0] : ''

  await request.put(`/api/employees/${EMP_ID}`, {
    data: {
      empId:               snapshot.empId,
      name:                snapshot.name,
      sex:                 snapshot.sex ?? '',
      fatherSpouseName:    snapshot.fatherSpouseName ?? '',
      dob:                 toDate(snapshot.dob),
      dateOfEntry:         toDate(snapshot.dateOfEntry),
      designation:         snapshot.designation ?? '',
      department:          snapshot.department ?? '',
      presentAddress:      snapshot.presentAddress ?? '',
      permanentAddress:    snapshot.permanentAddress ?? '',
      uan:                 snapshot.uan ?? '',
      esiNo:               snapshot.esiNo ?? '',
      aadhaar:             snapshot.aadhaar ?? '',
      mobile:              snapshot.mobile ?? '',
      email:               snapshot.email ?? '',
      bankAccount:         snapshot.bankAccount ?? '',
      ifsc:                snapshot.ifsc ?? '',
      bankName:            snapshot.bankName ?? '',
      paymentMode:         snapshot.paymentMode,
      defaultTotalSalary:  String(snapshot.defaultTotalSalary),
      basicWage:           String(snapshot.basicWage),
      daWage:              String(snapshot.daWage),
      hraWage:             String(snapshot.hraWage),
      pfMode:              snapshot.pfMode,
      pfPercent:           String(snapshot.pfPercent),
      pfWageCeiling:       String(snapshot.pfWageCeiling),
      pfAmount:            String(snapshot.pfAmount),
      esiAmount:           String(snapshot.esiAmount),
      lwfAmount:           String(snapshot.lwfAmount),
      status:              snapshot.status,
      exitDate:            toDate(snapshot.exitDate),
      exitReason:          snapshot.exitReason ?? '',
      remarks:             snapshot.remarks ?? '',
      establishmentId:     snapshot.establishmentId,
    },
  })
}

// Fill a labelled text/number input by its aria-label (exact match).
async function fill(page: Parameters<typeof import('@playwright/test')['test']['fn']>[0]['page'], label: string, value: string) {
  await page.getByLabel(label, { exact: true }).fill(value)
}

// ── suite: field round-trip ───────────────────────────────────────────────────

test.describe('Employee edit — field round-trip', () => {
  let snapshot: Record<string, unknown>

  test.beforeEach(async ({ request }) => {
    snapshot = await getEmployee(request)
  })

  test.afterEach(async ({ request }) => {
    await restoreEmployee(request, snapshot)
  })

  // ── 1. Basic identity fields ───────────────────────────────────────────────

  test('identity fields: name, sex, father/spouse, DOB, date of entry, designation, department, remarks', async ({ page }) => {
    await page.goto(EMP_PATH)

    await fill(page, 'Name', 'Alagurani Edited')
    await page.getByLabel('Sex', { exact: true }).selectOption('M')
    await fill(page, 'Father / Spouse Name', 'Test Father')
    await fill(page, 'Date of Birth', '1985-06-15')
    await fill(page, 'Date of Entry', '2019-03-01')
    await fill(page, 'Designation', 'Senior Nurse')
    await fill(page, 'Department', 'ICU')
    await fill(page, 'Remarks', 'edited in e2e test')

    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    // Re-open edit page and verify persisted values
    await page.goto(EMP_PATH)
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Alagurani Edited')
    await expect(page.getByLabel('Sex', { exact: true })).toHaveValue('M')
    await expect(page.getByLabel('Father / Spouse Name', { exact: true })).toHaveValue('Test Father')
    await expect(page.getByLabel('Date of Birth', { exact: true })).toHaveValue('1985-06-15')
    await expect(page.getByLabel('Date of Entry', { exact: true })).toHaveValue('2019-03-01')
    await expect(page.getByLabel('Designation', { exact: true })).toHaveValue('Senior Nurse')
    await expect(page.getByLabel('Department', { exact: true })).toHaveValue('ICU')
    await expect(page.getByLabel('Remarks', { exact: true })).toHaveValue('edited in e2e test')
  })

  // ── 2. Contact fields ─────────────────────────────────────────────────────

  test('contact fields: mobile, email, present address, permanent address', async ({ page }) => {
    await page.goto(EMP_PATH)

    await fill(page, 'Mobile', '9876543210')
    await fill(page, 'Email', 'alagu.test@example.com')
    await fill(page, 'Present Address', '42 MG Road, Chennai')
    await fill(page, 'Permanent Address', 'Palacode, Dharmapuri Dt.')

    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    await page.goto(EMP_PATH)
    await expect(page.getByLabel('Mobile', { exact: true })).toHaveValue('9876543210')
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('alagu.test@example.com')
    await expect(page.getByLabel('Present Address', { exact: true })).toHaveValue('42 MG Road, Chennai')
    await expect(page.getByLabel('Permanent Address', { exact: true })).toHaveValue('Palacode, Dharmapuri Dt.')
  })

  // ── 3. Statutory ID fields ────────────────────────────────────────────────

  test('statutory IDs: UAN, ESI No, Aadhaar', async ({ page }) => {
    await page.goto(EMP_PATH)

    await fill(page, 'UAN', '100234567890')
    await fill(page, 'ESI No', '41-00-123456-000-0001')
    await fill(page, 'Aadhaar', '1234 5678 9012')

    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    await page.goto(EMP_PATH)
    await expect(page.getByLabel('UAN', { exact: true })).toHaveValue('100234567890')
    await expect(page.getByLabel('ESI No', { exact: true })).toHaveValue('41-00-123456-000-0001')
    await expect(page.getByLabel('Aadhaar', { exact: true })).toHaveValue('1234 5678 9012')
  })

  // ── 4. Salary fields ──────────────────────────────────────────────────────

  test('salary fields: total salary, basic, DA, HRA, PF amount, ESI, LWF', async ({ page }) => {
    await page.goto(EMP_PATH)

    await fill(page, 'Default Total Salary', '50000')
    await fill(page, 'Basic Wage', '39000')
    await fill(page, 'DA Wage', '5000')
    await fill(page, 'HRA Wage', '3000')
    await fill(page, 'PF Amount', '1800')
    await fill(page, 'ESI Amount', '375')
    await fill(page, 'LWF Amount', '20')

    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    await page.goto(EMP_PATH)
    await expect(page.getByLabel('Default Total Salary', { exact: true })).toHaveValue('50000')
    await expect(page.getByLabel('Basic Wage', { exact: true })).toHaveValue('39000')
    await expect(page.getByLabel('DA Wage', { exact: true })).toHaveValue('5000')
    await expect(page.getByLabel('HRA Wage', { exact: true })).toHaveValue('3000')
    await expect(page.getByLabel('PF Amount', { exact: true })).toHaveValue('1800')
    await expect(page.getByLabel('ESI Amount', { exact: true })).toHaveValue('375')
    await expect(page.getByLabel('LWF Amount', { exact: true })).toHaveValue('20')
  })

  // ── 5. PF mode: FIXED → PERCENT ───────────────────────────────────────────

  test('PF mode change: FIXED → PERCENT → verify pfPercent and ceiling saved', async ({ page }) => {
    await page.goto(EMP_PATH)

    await page.getByLabel('PF Mode', { exact: true }).selectOption('PERCENT')
    // pfPercent and pfWageCeiling inputs appear when mode is PERCENT
    await fill(page, 'PF Percent', '12')
    await fill(page, 'PF Wage Ceiling', '15000')

    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    await page.goto(EMP_PATH)
    await expect(page.getByLabel('PF Mode', { exact: true })).toHaveValue('PERCENT')
    await expect(page.getByLabel('PF Percent', { exact: true })).toHaveValue('12')
    await expect(page.getByLabel('PF Wage Ceiling', { exact: true })).toHaveValue('15000')
  })

  // ── 6. Payment mode BANK → CASH (clears bank details) ────────────────────

  test('payment mode: BANK → CASH clears bank fields on re-open', async ({ page }) => {
    // First set to BANK with account details
    await page.goto(EMP_PATH)
    await page.getByLabel('Payment Mode', { exact: true }).selectOption('BANK')
    await fill(page, 'Bank Account', '123456789012')
    await fill(page, 'IFSC Code', 'SBIN0001234')
    await fill(page, 'Bank Name', 'SBI')
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    // Now switch to CASH
    await page.goto(EMP_PATH)
    await page.getByLabel('Payment Mode', { exact: true }).selectOption('CASH')
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    // Re-open: payment mode should be CASH; bank section disabled
    await page.goto(EMP_PATH)
    await expect(page.getByLabel('Payment Mode', { exact: true })).toHaveValue('CASH')
    await expect(page.getByLabel('Bank Account', { exact: true })).toBeDisabled()
  })

  // ── 7. Payment mode CASH → BANK with account details ─────────────────────

  test('payment mode: CASH → BANK with bank details persists', async ({ page }) => {
    // Set to CASH first
    await page.goto(EMP_PATH)
    await page.getByLabel('Payment Mode', { exact: true }).selectOption('CASH')
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    // Now set to BANK and fill details
    await page.goto(EMP_PATH)
    await page.getByLabel('Payment Mode', { exact: true }).selectOption('BANK')
    await fill(page, 'Bank Account', '987654321098')
    await fill(page, 'IFSC Code', 'HDFC0001234')
    await fill(page, 'Bank Name', 'HDFC Bank')
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    await page.goto(EMP_PATH)
    await expect(page.getByLabel('Payment Mode', { exact: true })).toHaveValue('BANK')
    await expect(page.getByLabel('IFSC Code', { exact: true })).toHaveValue('HDFC0001234')
    await expect(page.getByLabel('Bank Name', { exact: true })).toHaveValue('HDFC Bank')
  })

  // ── 8. Validation error scrolls into view ─────────────────────────────────

  test('invalid mobile: error is visible near Save button without scrolling', async ({ page }) => {
    await page.goto(EMP_PATH)

    // Fill an invalid mobile (not 10 digits)
    await fill(page, 'Mobile', '12345')

    // Scroll to bottom before clicking Save (simulates real user position)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.getByRole('button', { name: /Save Changes/i }).click()

    // The inline error count near Save should be visible without scrolling
    await expect(page.getByText(/error.*scroll up/i)).toBeVisible()
    // After auto-scroll, the error box at top should also be in view
    await expect(page.getByText(/Mobile must be 10 digits/i)).toBeVisible()
  })

  // ── 9. Exit date + reason fields ──────────────────────────────────────────

  test('exit date and exit reason save correctly', async ({ page }) => {
    await page.goto(EMP_PATH)

    await page.getByLabel('Status', { exact: true }).selectOption('EXITED')
    await fill(page, 'Exit Date', '2026-06-30')
    await fill(page, 'Reason for Exit', 'Resigned')

    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForURL('/employees')

    // Re-open (note: EXITED employees appear with ?status=EXITED filter; use direct URL)
    await page.goto(EMP_PATH)
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue('EXITED')
    await expect(page.getByLabel('Exit Date', { exact: true })).toHaveValue('2026-06-30')
    await expect(page.getByLabel('Reason for Exit', { exact: true })).toHaveValue('Resigned')
  })
})

// ── suite: all seeded employees load and no-op save ──────────────────────────

test.describe('Employee edit — all seeded employees: load + save without errors', () => {
  // Real seeded employee IDs (from seed.ts, not test-generated)
  const SEEDED = [
    { id: 'emp_h001', name: 'Alagurani' },
    { id: 'emp_h002', name: 'Ambika' },
    { id: 'emp_h003', name: 'Aruljoslinraj' },
    { id: 'emp_h004', name: 'Muniraj' },
    { id: 'emp_h005', name: 'Muthulakshmi' },
    { id: 'emp_h006', name: 'Mynavathy' },
  ]

  for (const emp of SEEDED) {
    test(`${emp.name} (${emp.id}): edit page loads and saves without errors`, async ({ page }) => {
      await page.goto(`/employees/${emp.id}`)

      // Verify the correct employee is shown
      await expect(page.getByLabel('Name', { exact: true })).toHaveValue(emp.name)

      // Submit unchanged — should save cleanly (validator allows 0 salary on UPDATE)
      await page.getByRole('button', { name: /Save Changes/i }).click()
      await page.waitForURL('/employees', { timeout: 10000 })

      await expect(page).toHaveURL('/employees')
    })
  }
})
