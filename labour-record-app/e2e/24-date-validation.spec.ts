import { test, expect } from '@playwright/test'

// TEC-20: unvalidated dates from the API used to persist as Invalid Date
// (calendar events, holidays) or silently roll over to a nonexistent
// calendar date's neighbour (e.g. "2026-02-30" -> March 2). Every route that
// parses a date out of the request body now rejects garbage with a 422
// before it reaches Prisma. These tests hit the API directly (no UI) so they
// exercise exactly the validation path added for this ticket.

let establishmentId: string

test.beforeAll(async ({ request }) => {
  const res = await request.get('/api/establishments')
  const establishments = (await res.json()) as Array<{ id: string }>
  expect(establishments.length).toBeGreaterThan(0)
  establishmentId = establishments[0].id
})

test.describe('Calendar events — date validation', () => {
  test('rejects a garbage date with 422', async ({ request }) => {
    const res = await request.post('/api/calendar-events', {
      data: { title: 'TEC-20 bad date', date: 'banana' },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    expect(body.errors.join(' ')).toMatch(/date is not a valid date/)
  })

  test('rejects a calendar-rollover date ("2026-02-30") with 422', async ({ request }) => {
    const res = await request.post('/api/calendar-events', {
      data: { title: 'TEC-20 rollover date', date: '2026-02-30' },
    })
    expect(res.status()).toBe(422)
  })

  test('happy path: valid date still creates the event', async ({ request }) => {
    const res = await request.post('/api/calendar-events', {
      data: { title: 'TEC-20 happy path', date: '2099-06-15' },
    })
    expect(res.status()).toBe(201)
    const created = await res.json()
    expect(created.id).toBeTruthy()
    // Clean up
    await request.delete(`/api/calendar-events/${created.id}`)
  })
})

test.describe('Employees — date validation', () => {
  test('rejects a garbage dob with 422', async ({ request }) => {
    const res = await request.post('/api/employees', {
      data: {
        name: 'TEC-20 Bad DOB',
        establishmentId,
        defaultTotalSalary: '15000',
        dob: 'garbage',
      },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    expect(body.errors.join(' ')).toMatch(/dob is not a valid date/)
  })

  test('happy path: valid dob/dateOfEntry still creates the employee', async ({ request }) => {
    const res = await request.post('/api/employees', {
      data: {
        name: 'TEC-20 Good DOB',
        establishmentId,
        defaultTotalSalary: '15000',
        dob: '1990-05-15',
        dateOfEntry: '2020-01-10',
      },
    })
    expect(res.status()).toBe(201)
    const created = await res.json()
    expect(created.id).toBeTruthy()
    expect(new Date(created.dob).getUTCFullYear()).toBe(1990)
    // Clean up
    await request.delete(`/api/employees/${created.id}?mode=remove`)
  })
})

test.describe('Holidays — date validation', () => {
  test('rejects a garbage date with 422', async ({ request }) => {
    const res = await request.post('/api/holidays', {
      data: { date: 'not-a-date', name: 'TEC-20 Bad Holiday' },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    expect(body.errors.join(' ')).toMatch(/date is not a valid date/)
  })

  test('rejects a calendar-rollover date ("2026-04-31") with 422', async ({ request }) => {
    const res = await request.post('/api/holidays', {
      data: { date: '2026-04-31', name: 'TEC-20 Rollover Holiday' },
    })
    expect(res.status()).toBe(422)
  })

  test('happy path: valid date still creates the holiday', async ({ request }) => {
    const res = await request.post('/api/holidays', {
      data: { date: '2099-08-20', name: 'TEC-20 Good Holiday' },
    })
    expect(res.status()).toBe(201)
    const created = await res.json()
    expect(created.id).toBeTruthy()
    // Clean up
    await request.delete(`/api/holidays/${created.id}`)
  })
})
