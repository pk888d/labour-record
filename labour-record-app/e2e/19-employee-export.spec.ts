import { test, expect, type Page } from '@playwright/test'
import { parseEmployeeRows } from '../src/lib/import/parse-employees'

// ── helpers ──────────────────────────────────────────────────────────────────

async function establishmentId(page: Page, label = 'DNV Orthocare'): Promise<string> {
  await page.goto('/employees')
  const value = await page
    .getByLabel('Establishment')
    .locator(`option:has-text("${label}")`)
    .getAttribute('value')
  if (!value) throw new Error(`Establishment "${label}" not found`)
  return value
}

async function uploadCsv(page: Page, buf: Buffer, estLabel = 'DNV Orthocare') {
  await page.goto('/employees/import')
  await page.getByLabel('Establishment').selectOption({ label: estLabel })
  await page.locator('input[type="file"]').setInputFiles({
    name: 'test.csv',
    mimeType: 'text/csv',
    buffer: buf,
  })
  await page.getByRole('button', { name: /Upload & Apply/i }).click()
  await page.waitForLoadState('networkidle')
}

function csvBuf(rows: string[][]): Buffer {
  const header = 'Action,Emp ID,Name,Salary,Sex,Designation,Department,Date of Entry,Phone,Payment Mode,Basic Wage,DA,HRA,PF Amount,ESI Amount,LWF Amount,Email,Present Address,Remarks'
  return Buffer.from([header, ...rows.map((r) => r.join(','))].join('\n'))
}

const EMP_ID = 'EXP-E2E-01'
const EMP_NAME = 'Export E2E Worker'

test.describe('Employee export — end to end', () => {

  test('Export link is present and disabled without an establishment filter', async ({ page }) => {
    await page.goto('/employees')
    const disabled = page.getByText('⭳ Export', { exact: true })
    await expect(disabled).toBeVisible()
  })

  test('Export link points to the export endpoint once an establishment is selected', async ({ page }) => {
    const id = await establishmentId(page)
    await page.goto(`/employees?establishmentId=${id}`)
    const link = page.getByRole('link', { name: '⭳ Export' })
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    expect(href).toContain('/api/employees/export')
    expect(href).toContain(`establishmentId=${id}`)
  })

  test('export endpoint returns xlsx with the same header row as the import template', async ({ page, request }) => {
    const id = await establishmentId(page)
    const [exportRes, templateRes] = await Promise.all([
      request.get(`/api/employees/export?establishmentId=${id}`),
      request.get('/api/employees/import/template'),
    ])
    expect(exportRes.status()).toBe(200)
    expect(exportRes.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(exportRes.headers()['content-disposition']).toContain('.xlsx')

    const XLSX = await import('xlsx')
    const exportWb = XLSX.read(Buffer.from(await exportRes.body()), { type: 'buffer' })
    const templateWb = XLSX.read(Buffer.from(await templateRes.body()), { type: 'buffer' })

    const exportHeaders = XLSX.utils.sheet_to_json<string[]>(
      exportWb.Sheets[exportWb.SheetNames[0]], { header: 1 },
    )[0]
    const templateHeaders = XLSX.utils.sheet_to_json<string[]>(
      templateWb.Sheets[templateWb.SheetNames[0]], { header: 1 },
    )[0]

    expect(exportHeaders).toEqual(templateHeaders)
  })

  test('export includes an added employee with Action=UPDATE and Emp ID filled in', async ({ page, request }) => {
    // Seed an employee via bulk import first
    await uploadCsv(page, csvBuf([
      ['ADD', EMP_ID, EMP_NAME, '15000', 'F', 'Import Tester', 'QA Dept', '2023-01-01', '9876543210', 'CASH', '7000', '1360', '500', '0', '0', '10', 'exp-e2e@example.com', '1 Test St', 'e2e export test'],
    ]))

    const id = await establishmentId(page)
    const res = await request.get(`/api/employees/export?establishmentId=${id}`)
    expect(res.status()).toBe(200)

    const XLSX = await import('xlsx')
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false })

    const row = rows.find((r) => r['Emp ID'] === EMP_ID)
    expect(row).toBeTruthy()
    expect(row!['Action']).toBe('UPDATE')
    expect(row!['Name']).toBe(EMP_NAME)

    // Cleanup
    await uploadCsv(page, csvBuf([
      ['DELETE', EMP_ID, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ]))
  })

  test('round-trip — exported rows re-import cleanly via parseEmployeeRows', async ({ page, request }) => {
    await uploadCsv(page, csvBuf([
      ['ADD', EMP_ID, EMP_NAME, '15000', 'F', 'Import Tester', 'QA Dept', '2023-01-01', '9876543210', 'CASH', '7000', '1360', '500', '0', '0', '10', 'exp-e2e@example.com', '1 Test St', 'e2e export test'],
    ]))

    const id = await establishmentId(page)
    const res = await request.get(`/api/employees/export?establishmentId=${id}`)
    const XLSX = await import('xlsx')
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false })

    const { valid, errors } = parseEmployeeRows(rows)

    const ourRow = valid.find((r) => r.empId === EMP_ID)
    expect(ourRow).toBeTruthy()
    expect(ourRow!.action).toBe('UPDATE')
    // No hard error tied to our row (legend row is silently skipped, same as template notes rows)
    expect(errors.find((e) => e.messages.some((m) => m.includes(EMP_ID)))).toBeUndefined()

    // Cleanup
    await uploadCsv(page, csvBuf([
      ['DELETE', EMP_ID, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ]))
  })
})
