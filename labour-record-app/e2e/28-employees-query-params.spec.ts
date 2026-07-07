import { test, expect } from '@playwright/test'

// GET /api/employees — q (name/empId search) and limit query params (TEC-39).
// Fixture: a uniquely-named + uniquely-prefixed employee so assertions don't
// depend on seed data. Created in beforeAll, removed in afterAll.

const FIXTURE_NAME = 'Zzq39FixtureEmployee'
const FIXTURE_EMP_ID = 'TEC39-Q'
const HOSPITAL_ESTABLISHMENT_ID = 'est_hospital_dnv'

test.describe('GET /api/employees — q and limit', () => {
  let fixtureId = ''

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/employees', {
      data: {
        empId: FIXTURE_EMP_ID,
        name: FIXTURE_NAME,
        establishmentId: HOSPITAL_ESTABLISHMENT_ID,
        defaultTotalSalary: 15000,
      },
    })
    expect(res.ok()).toBeTruthy()
    fixtureId = ((await res.json()) as { id: string }).id
  })

  test.afterAll(async ({ request }) => {
    if (fixtureId) await request.delete(`/api/employees/${fixtureId}?mode=remove`)
  })

  test('q filters by name (case-insensitive substring)', async ({ request }) => {
    const res = await request.get(`/api/employees?q=${encodeURIComponent('zzq39fixture')}`)
    expect(res.ok()).toBeTruthy()
    const rows = (await res.json()) as { name: string }[]
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.name.toLowerCase().includes('zzq39fixture'))).toBe(true)
  })

  test('q filters by empId substring', async ({ request }) => {
    const res = await request.get(`/api/employees?q=${encodeURIComponent(FIXTURE_EMP_ID)}`)
    expect(res.ok()).toBeTruthy()
    const rows = (await res.json()) as { empId: string }[]
    expect(rows.some((r) => r.empId === FIXTURE_EMP_ID)).toBe(true)
    expect(rows.length).toBeLessThan(50) // proves it's actually filtering, not the whole table
  })

  test('q with no match returns an empty array, not the full table', async ({ request }) => {
    const res = await request.get('/api/employees?q=NoSuchEmployeeXYZ123')
    expect(res.ok()).toBeTruthy()
    const rows = (await res.json()) as unknown[]
    expect(rows).toEqual([])
  })

  test('limit caps the result count', async ({ request }) => {
    const res = await request.get('/api/employees?limit=1')
    expect(res.ok()).toBeTruthy()
    const rows = (await res.json()) as unknown[]
    expect(rows.length).toBeLessThanOrEqual(1)
  })

  test('limit=0 or a non-numeric limit is rejected with 400', async ({ request }) => {
    const zero = await request.get('/api/employees?limit=0')
    expect(zero.status()).toBe(400)
    const nonNumeric = await request.get('/api/employees?limit=abc')
    expect(nonNumeric.status()).toBe(400)
  })

  test('q and limit combine', async ({ request }) => {
    const res = await request.get(`/api/employees?q=${encodeURIComponent(FIXTURE_EMP_ID)}&limit=1`)
    expect(res.ok()).toBeTruthy()
    const rows = (await res.json()) as { empId: string }[]
    expect(rows.length).toBe(1)
    expect(rows[0].empId).toBe(FIXTURE_EMP_ID)
  })

  test('no q/limit still returns the full table (unchanged default behaviour)', async ({ request }) => {
    const res = await request.get('/api/employees')
    expect(res.ok()).toBeTruthy()
    const rows = (await res.json()) as unknown[]
    expect(rows.length).toBeGreaterThan(1)
  })
})
