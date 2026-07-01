import { test, expect, type Page } from '@playwright/test'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build a CSV buffer from rows (header auto-prepended). */
function csvBuf(rows: string[][]): Buffer {
  const header = 'Action,Emp ID,Name,Salary,Sex,Designation,Department,Date of Entry,Phone,Payment Mode,Basic Wage,DA,HRA,PF Amount,ESI Amount,LWF Amount,Email,Present Address,Remarks'
  return Buffer.from([header, ...rows.map((r) => r.join(','))].join('\n'))
}

/** Navigate to import page, pick an establishment, upload a buffer, click submit. */
async function upload(page: Page, buf: Buffer, estLabel = 'DNV Orthocare') {
  await page.goto('/employees/import')
  await page.getByLabel('Establishment').selectOption({ label: estLabel })
  await page.locator('input[type="file"]').setInputFiles({
    name: 'test.csv',
    mimeType: 'text/csv',
    buffer: buf,
  })
  await page.getByRole('button', { name: /Upload & Apply/i }).click()
  // Wait for result panel or error to appear
  await page.waitForSelector('text=Result, text=row(s) skipped, .text-\\[\\#f07070\\]', { timeout: 10000 }).catch(() => {})
  await page.waitForLoadState('networkidle')
}

/** Read the numeric counter next to a label (Added / Updated / Deleted / Exited). */
async function counter(page: Page, label: 'Added' | 'Updated' | 'Deleted' | 'Exited'): Promise<number> {
  // Find the label div; the number is its previousElementSibling
  const labelEl = page.getByText(label, { exact: true }).last()
  await labelEl.waitFor({ timeout: 15000 })
  const numText = await labelEl.evaluate((el) => el.previousElementSibling?.textContent ?? '0')
  return parseInt(numText, 10)
}

// ── constants ─────────────────────────────────────────────────────────────────

const EMP_ID   = 'BLK-E2E-01'
const EMP_NAME = 'Bulk E2E Worker'

// ── suite ─────────────────────────────────────────────────────────────────────

test.describe('Bulk employee import — end to end', () => {

  // ── template download ──────────────────────────────────────────────────────

  test('template download link is present and points to xlsx endpoint', async ({ page }) => {
    await page.goto('/employees/import')
    const link = page.getByRole('link', { name: /Download Template/i })
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    expect(href).toContain('/api/employees/import/template')
  })

  test('template endpoint returns xlsx content-type and correct headers', async ({ request }) => {
    const res = await request.get('/api/employees/import/template')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(res.headers()['content-disposition']).toContain('.xlsx')

    // Read the xlsx and verify key columns exist
    const XLSX = await import('xlsx')
    const buf  = Buffer.from(await res.body())
    const wb   = XLSX.read(buf, { type: 'buffer' })
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]

    const headers = rows[0]
    for (const col of [
      'Action', 'Emp ID', 'Name', 'Salary', 'Sex', 'Designation',
      'Basic Wage', 'DA', 'HRA', 'PF Mode', 'PF Amount', 'ESI Amount', 'LWF Amount',
      'Email', 'Present Address', 'Permanent Address', 'UAN', 'ESI No', 'Aadhaar',
      '480 Days Completion', 'Date Made Permanent', 'Remarks',
    ]) {
      expect(headers, `missing column: ${col}`).toContain(col)
    }
  })

  test('template has ADD/UPDATE/DELETE requirement rows', async ({ request }) => {
    const res  = await request.get('/api/employees/import/template')
    const XLSX = await import('xlsx')
    const wb   = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as string[][]

    // Row 2 starts with "ADD →", row 3 "UPDATE →", row 4 "DELETE →"
    expect(rows[1][0]).toMatch(/ADD/)
    expect(rows[2][0]).toMatch(/UPDATE/)
    expect(rows[3][0]).toMatch(/DELETE/)

    // Name column (index 2) must say Mandatory for ADD, Optional for UPDATE, Not used for DELETE
    expect(rows[1][2]).toMatch(/Mandatory/i)
    expect(rows[2][2]).toMatch(/Optional/i)
    expect(rows[3][2]).toMatch(/Not used/i)
  })

  // ── ADD ───────────────────────────────────────────────────────────────────

  test('ADD — creates employee from CSV and shows counter', async ({ page }) => {
    const buf = csvBuf([
      [
        'ADD', EMP_ID, EMP_NAME, '14000', 'M', 'Import Tester', 'QA Dept',
        '2023-01-01', '9876543210', 'CASH',
        '7000', '1360', '500', '0', '0', '10',
        'bulktest@example.com', '1 Test St Chennai', 'e2e test employee',
      ],
    ])
    await upload(page, buf)

    await expect(page.getByText('Result')).toBeVisible()
    expect(await counter(page, 'Added')).toBe(1)
    expect(await counter(page, 'Updated')).toBe(0)
    expect(await counter(page, 'Deleted')).toBe(0)

    // Employee appears in the list
    await page.goto(`/employees?q=${encodeURIComponent(EMP_NAME)}`)
    await expect(page.getByText(EMP_NAME).first()).toBeVisible()
    await expect(page.getByText(EMP_ID)).toBeVisible()
  })

  // ── UPDATE ────────────────────────────────────────────────────────────────

  test('UPDATE — patches name and salary, counter shows 1 updated', async ({ page }) => {
    const buf = csvBuf([
      [
        'UPDATE', EMP_ID, `${EMP_NAME} Updated`, '16000', '', 'Senior Import Tester',
        '', '', '', '', '', '', '', '', '', '', '', '', '',
      ],
    ])
    await upload(page, buf)

    await expect(page.getByText('Result')).toBeVisible()
    expect(await counter(page, 'Updated')).toBe(1)
    expect(await counter(page, 'Added')).toBe(0)

    // Verify updated name visible in list
    await page.goto(`/employees?q=${encodeURIComponent(EMP_NAME + ' Updated')}`)
    await expect(page.getByText(`${EMP_NAME} Updated`).first()).toBeVisible()
  })

  // ── DELETE ────────────────────────────────────────────────────────────────

  test('DELETE — removes employee with no cycle records', async ({ page }) => {
    const buf = csvBuf([
      ['DELETE', EMP_ID, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)

    await expect(page.getByText('Result')).toBeVisible()
    // Employee has no cycle records → hard deleted; if it somehow has records → exited
    const gone = (await counter(page, 'Deleted')) + (await counter(page, 'Exited'))
    expect(gone).toBe(1)

    // Employee no longer appears in active list
    await page.goto(`/employees?q=${encodeURIComponent(EMP_ID)}`)
    await expect(page.getByText(EMP_ID)).not.toBeVisible()
  })

  // ── error cases ───────────────────────────────────────────────────────────

  test('error — ADD missing name shows validation message', async ({ page }) => {
    const buf = csvBuf([
      ['ADD', '', '', '10000', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)
    await expect(page.getByText('Result')).toBeVisible()
    await expect(page.getByText(/name is required/i)).toBeVisible()
    expect(await counter(page, 'Added')).toBe(0)
  })

  test('error — ADD missing salary shows validation message', async ({ page }) => {
    const buf = csvBuf([
      ['ADD', '', 'No Salary Worker', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)
    await expect(page.getByText('Result')).toBeVisible()
    await expect(page.getByText(/salary is required/i)).toBeVisible()
  })

  test('error — UPDATE missing Emp ID shows validation message', async ({ page }) => {
    const buf = csvBuf([
      ['UPDATE', '', 'Some Name', '10000', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)
    await expect(page.getByText('Result')).toBeVisible()
    // Use locator('p') to avoid matching the Step-1 hint text
    await expect(page.locator('p').filter({ hasText: /Row \d+: Emp ID is required/i })).toBeVisible()
  })

  test('error — DELETE missing Emp ID shows validation message', async ({ page }) => {
    const buf = csvBuf([
      ['DELETE', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)
    await expect(page.getByText('Result')).toBeVisible()
    await expect(page.locator('p').filter({ hasText: /Row \d+: Emp ID is required/i })).toBeVisible()
  })

  test('error — UPDATE nonexistent Emp ID shows not-found message', async ({ page }) => {
    const buf = csvBuf([
      ['UPDATE', 'NONEXISTENT-XYZ-999', 'Ghost', '10000', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)
    await expect(page.getByText('Result')).toBeVisible()
    await expect(page.getByText(/not found/i)).toBeVisible()
    expect(await counter(page, 'Updated')).toBe(0)
  })

  test('error — DELETE nonexistent Emp ID shows not-found message', async ({ page }) => {
    const buf = csvBuf([
      ['DELETE', 'NONEXISTENT-XYZ-999', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)
    await expect(page.getByText('Result')).toBeVisible()
    await expect(page.getByText(/not found/i)).toBeVisible()
    expect(await counter(page, 'Deleted')).toBe(0)
  })

  // ── multi-row mixed upload ─────────────────────────────────────────────────

  test('mixed CSV — two ADDs, one invalid row, correct counters', async ({ page }) => {
    const buf = csvBuf([
      ['ADD', 'BLK-MIX-01', 'Mix Worker One', '12000', 'F', 'Staff', '', '', '', 'CASH', '', '', '', '', '', '', '', '', ''],
      ['ADD', 'BLK-MIX-02', 'Mix Worker Two', '13000', 'M', 'Staff', '', '', '', 'CASH', '', '', '', '', '', '', '', '', ''],
      ['ADD', '',           '',               '',       '',  '',      '', '', '', '',     '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, buf)

    await expect(page.getByText('Result')).toBeVisible()
    expect(await counter(page, 'Added')).toBe(2)
    await expect(page.getByText(/row\(s\) skipped/i)).toBeVisible()

    // Cleanup the two created employees
    const delBuf = csvBuf([
      ['DELETE', 'BLK-MIX-01', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['DELETE', 'BLK-MIX-02', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    await upload(page, delBuf)
    expect((await counter(page, 'Deleted')) + (await counter(page, 'Exited'))).toBe(2)
  })

  // ── template instruction rows are skipped ─────────────────────────────────

  test('uploading the raw template (with instruction rows) produces no hard errors', async ({ page, request }) => {
    // Fetch the actual template from the API and re-upload it as-is
    const templateRes = await request.get('/api/employees/import/template')
    const buf = Buffer.from(await templateRes.body())

    await page.goto('/employees/import')
    await page.getByLabel('Establishment').selectOption({ label: 'DNV Orthocare' })
    await page.locator('input[type="file"]').setInputFiles({
      name: 'template.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: buf,
    })
    await page.getByRole('button', { name: /Upload & Apply/i }).click()
    await page.waitForLoadState('networkidle')

    // The template example rows will either ADD (example names) or error on UPDATE/DELETE
    // for missing emp IDs — but there must be NO unhandled server crash (no top-level error)
    await expect(page.getByText('Internal server error')).not.toBeVisible()
    await expect(page.getByText('Result')).toBeVisible()
  })
})
