# Government Holidays & Wage Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global government holidays master, per-establishment configurable wage rules, attendance auto-defaults, and holiday bonus pay to the labour record app.

**Architecture:** GovtHoliday (global) and WageRule (per-establishment) are new Prisma models. Attendance defaults (P/A/H) are applied client-side using a new pure utility. Holiday bonus pay is computed server-side in the wages API by cross-referencing attendance marks against the holiday set, using the establishment's HOLIDAY_MULTIPLIER rule.

**Tech Stack:** Next.js 15 App Router, Prisma 6 + SQLite, Vitest for unit tests, Playwright for E2E. All pages follow the established server-component + `'use client'` island pattern.

---

## File Map

**New files:**
- `prisma/migrations/<timestamp>_add_govt_holidays_and_wage_rules/migration.sql`
- `src/domain/calculations/wage-defaults.ts` — WAGE_RULE_DEFAULTS constant + getWageRuleValue helper
- `src/app/api/holidays/route.ts` — GET (year filter), POST
- `src/app/api/holidays/[id]/route.ts` — DELETE
- `src/app/api/wage-rules/route.ts` — GET (merged), PUT (upsert), DELETE (reset)
- `src/app/holidays/page.tsx` — server page, fetches initial data
- `src/app/holidays/holidays-client.tsx` — `'use client'` island: year filter, add form, table
- `src/app/wage-rules/page.tsx` — server page, fetches establishments
- `src/app/wage-rules/wage-rules-client.tsx` — `'use client'` island: selector, inline edit, reset
- `e2e/09-holidays.spec.ts`
- `e2e/10-wage-rules.spec.ts`

**Modified files:**
- `prisma/schema.prisma` — add GovtHoliday, WageRule models; add WageRecord.holidayBonus, Establishment.wageRules relation
- `src/domain/calculations/attendance-calculator.ts` — add `applyAttendanceDefaults`
- `src/domain/calculations/wage-calculator.ts` — add `holidayBonus` to WageInput
- `src/components/sidebar.tsx` — add Holidays + Wage Rules nav items to Masters
- `src/app/forms/[taskId]/page.tsx` — fetch + pass `holidayDays` prop
- `src/app/forms/[taskId]/form-entry-client.tsx` — Apply Defaults button, holiday column styles, orange-P badge
- `src/app/api/form-tasks/[id]/wages/route.ts` — compute + store holidayBonus
- `tests/domain/attendance-calculator.test.ts` — add applyAttendanceDefaults tests
- `tests/domain/wage-calculator.test.ts` — add holidayBonus tests

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add models to schema**

Open `prisma/schema.prisma` and make the following additions.

Add `wageRules WageRule[]` inside the `Establishment` model (after the existing `monthlyCycles` relation line):
```prisma
  wageRules     WageRule[]
```

Add `holidayBonus Float @default(0)` inside the `WageRecord` model (after the existing `netWages` line):
```prisma
  holidayBonus        Float        @default(0)
```

Add these two new models at the end of the file, before the closing of the schema:
```prisma
model GovtHoliday {
  id        String   @id @default(cuid())
  date      DateTime @unique
  name      String
  year      Int
  createdAt DateTime @default(now())
}

model WageRule {
  id              String        @id @default(cuid())
  establishmentId String
  establishment   Establishment @relation(fields: [establishmentId], references: [id])
  ruleKey         String
  ruleValue       Float
  updatedAt       DateTime      @updatedAt

  @@unique([establishmentId, ruleKey])
}
```

- [ ] **Step 2: Run migration**

```bash
cd /path/to/labour-record-app
npx prisma migrate dev --name add_govt_holidays_and_wage_rules
```

Expected: migration created and applied, no errors.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 4: Verify schema compiles**

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add GovtHoliday and WageRule models to schema"
```

---

## Task 2: Attendance Defaults Utility

**Files:**
- Modify: `src/domain/calculations/attendance-calculator.ts`
- Modify: `tests/domain/attendance-calculator.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `tests/domain/attendance-calculator.test.ts` (below the existing tests):

```ts
import { applyAttendanceDefaults } from '@/domain/calculations/attendance-calculator'

describe('applyAttendanceDefaults', () => {
  // June 2026: day 1 = Monday, day 6 = Saturday, day 7 = Sunday
  it('fills empty weekdays with P', () => {
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result[0]).toBe('P') // June 1 = Monday
    expect(result[1]).toBe('P') // June 2 = Tuesday
  })

  it('fills empty weekends with A', () => {
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result[5]).toBe('A') // June 6 = Saturday
    expect(result[6]).toBe('A') // June 7 = Sunday
  })

  it('fills holiday days with H regardless of day of week', () => {
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set([15]))
    expect(result[14]).toBe('H') // June 15
  })

  it('holiday wins over weekend when day is both', () => {
    // June 7, 2026 is a Sunday. Mark it as a holiday too.
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set([7]))
    expect(result[6]).toBe('H') // holiday takes priority over A
  })

  it('does not overwrite existing non-empty marks', () => {
    const marks = ['A', ...new Array(29).fill('')]
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result[0]).toBe('A') // kept as-is, even though Monday = would be P
  })

  it('handles all-filled marks (no-op)', () => {
    const marks = new Array(30).fill('P')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result).toEqual(marks)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/domain/attendance-calculator.test.ts
```

Expected: FAIL — `applyAttendanceDefaults is not a function` or similar.

- [ ] **Step 3: Implement applyAttendanceDefaults**

Add to the bottom of `src/domain/calculations/attendance-calculator.ts`:

```ts
export function applyAttendanceDefaults(
  marks: string[],
  year: number,
  month: number,
  holidayDays: Set<number>
): string[] {
  return marks.map((mark, i) => {
    if (mark !== '') return mark
    const day = i + 1
    if (holidayDays.has(day)) return 'H'
    const dow = new Date(year, month - 1, day).getDay()
    if (dow === 0 || dow === 6) return 'A'
    return 'P'
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/domain/attendance-calculator.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/calculations/attendance-calculator.ts tests/domain/attendance-calculator.test.ts
git commit -m "feat: add applyAttendanceDefaults utility"
```

---

## Task 3: Wage Defaults Utility + Holiday Bonus in calculateWages

**Files:**
- Create: `src/domain/calculations/wage-defaults.ts`
- Modify: `src/domain/calculations/wage-calculator.ts`
- Modify: `tests/domain/wage-calculator.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `tests/domain/wage-calculator.test.ts` (below existing tests):

```ts
import { getWageRuleValue, WAGE_RULE_DEFAULTS } from '@/domain/calculations/wage-defaults'

describe('getWageRuleValue', () => {
  it('returns custom value when rule exists', () => {
    const rules = [{ ruleKey: 'HOLIDAY_MULTIPLIER', ruleValue: 1.5 }]
    expect(getWageRuleValue(rules, 'HOLIDAY_MULTIPLIER')).toBe(1.5)
  })
  it('returns default value when no custom rule', () => {
    expect(getWageRuleValue([], 'HOLIDAY_MULTIPLIER')).toBe(2.0)
  })
  it('returns 0 for unknown key with no default', () => {
    expect(getWageRuleValue([], 'UNKNOWN_KEY')).toBe(0)
  })
})

describe('calculateWages — holidayBonus', () => {
  it('includes holidayBonus in totalEarnings for hospital config', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, holidayBonus: 500 })
    expect(r.totalEarnings).toBe(6860) // 6000 + 360 fixedAllowance + 500 bonus
  })
  it('includes holidayBonus in totalEarnings for shop config', () => {
    const r = calculateWages(shopConfig, { ...baseInput, holidayBonus: 200 })
    expect(r.totalEarnings).toBe(6200) // 5000 + 1000 + 200
  })
  it('holidayBonus zero has no effect', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, holidayBonus: 0 })
    expect(r.totalEarnings).toBe(6360)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/domain/wage-calculator.test.ts
```

Expected: FAIL — `getWageRuleValue` not exported, and `holidayBonus` not in WageInput.

- [ ] **Step 3: Create wage-defaults.ts**

Create `src/domain/calculations/wage-defaults.ts`:

```ts
export const WAGE_RULE_DEFAULTS: Record<string, number> = {
  HOLIDAY_MULTIPLIER: 2.0,
  OT_MULTIPLIER: 2.0,
  PF_EMPLOYEE_PCT: 12.0,
  PF_EMPLOYER_PCT: 13.0,
  ESI_EMPLOYEE_PCT: 0.75,
  ESI_EMPLOYER_PCT: 3.25,
}

export function getWageRuleValue(
  rules: Array<{ ruleKey: string; ruleValue: number }>,
  key: string
): number {
  const found = rules.find((r) => r.ruleKey === key)
  return found?.ruleValue ?? WAGE_RULE_DEFAULTS[key] ?? 0
}
```

- [ ] **Step 4: Update WageInput and calculateWages**

In `src/domain/calculations/wage-calculator.ts`, add `holidayBonus: number` to `WageInput`:

```ts
export type WageInput = {
  basic: number
  da: number
  hra: number
  otherAllowances: number
  holidayBonus: number
  overtimeEarnings: number
  pf: number
  esi: number
  lwf: number
  advanceRecovered: number
  fineDeduction: number
  otherDeductions: number
}
```

Update the `calculateWages` function body. For the hospital preset:
```ts
totalNormalWages = round2(input.basic + input.da)
totalEarnings = round2(input.basic + input.da + fixed + input.holidayBonus)
grossWages = round2(totalEarnings + input.overtimeEarnings)
```

For the default (shop) preset:
```ts
totalNormalWages = round2(input.basic + input.da)
totalEarnings = round2(input.basic + input.da + input.hra + input.otherAllowances + input.holidayBonus)
grossWages = round2(totalEarnings + input.overtimeEarnings)
```

- [ ] **Step 5: Fix callers of calculateWages that don't pass holidayBonus**

The only call-site inside the client component is in `src/app/forms/[taskId]/form-entry-client.tsx` (used for the live wage preview). Search for `calculateWages(` and add `holidayBonus: 0` to the input object passed there. The wages API route will be updated in Task 10.

In `form-entry-client.tsx`, locate the line that calls `calculateWages(formulaConfig, {` and update:
```ts
const calc = calculateWages(formulaConfig, {
  basic: w.basic, da: w.da, hra: w.hra,
  otherAllowances: w.otherAllowances,
  holidayBonus: 0,   // live preview; actual bonus computed server-side on save
  overtimeEarnings: 0,
  pf: w.pf, esi: w.esi, lwf: w.lwf,
  advanceRecovered: w.advanceRecovered,
  fineDeduction: w.fineDeduction,
  otherDeductions: w.otherDeductions,
})
```

Also update `src/app/api/form-tasks/[id]/wages/route.ts` — the existing `calculateWages` call there — add `holidayBonus: 0` temporarily (Task 10 replaces this with the real computation):
```ts
const calc = calculateWages(config, {
  basic: r.basic, da: r.da, hra: r.hra,
  otherAllowances: r.otherAllowances,
  holidayBonus: 0,
  overtimeEarnings,
  pf: r.pf, esi: r.esi, lwf: r.lwf,
  advanceRecovered: r.advanceRecovered,
  fineDeduction: r.fineDeduction,
  otherDeductions: r.otherDeductions,
})
```

- [ ] **Step 6: Update existing wage-calculator tests to include holidayBonus: 0 in baseInput**

In `tests/domain/wage-calculator.test.ts`, update the `baseInput` constant to include:
```ts
const baseInput = {
  basic: 5000,
  da: 1000,
  hra: 0,
  otherAllowances: 0,
  holidayBonus: 0,    // add this line
  overtimeEarnings: 0,
  pf: 600,
  esi: 0,
  lwf: 10,
  advanceRecovered: 0,
  fineDeduction: 0,
  otherDeductions: 0,
}
```

- [ ] **Step 7: Run all unit tests to verify they pass**

```bash
npx vitest run
```

Expected: all existing + new tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/domain/calculations/wage-defaults.ts src/domain/calculations/wage-calculator.ts src/app/forms/[taskId]/form-entry-client.tsx src/app/api/form-tasks/[id]/wages/route.ts tests/domain/wage-calculator.test.ts
git commit -m "feat: add holidayBonus to wage calculation and wage-defaults utility"
```

---

## Task 4: Holidays API Routes

**Files:**
- Create: `src/app/api/holidays/route.ts`
- Create: `src/app/api/holidays/[id]/route.ts`

- [ ] **Step 1: Create the holidays collection route**

Create `src/app/api/holidays/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10)
    const holidays = await prisma.govtHoliday.findMany({
      where: { year },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(holidays)
  } catch (error) {
    console.error('GET /api/holidays failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const b = body as { date?: string; name?: string }
    if (!b.date || !b.name?.trim()) {
      return NextResponse.json({ errors: ['date and name are required'] }, { status: 422 })
    }
    const date = new Date(b.date)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ errors: ['invalid date'] }, { status: 422 })
    }
    const year = date.getFullYear()
    const holiday = await prisma.govtHoliday.create({
      data: { date, name: b.name.trim(), year },
    })
    return NextResponse.json(holiday, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ errors: ['A holiday already exists on that date'] }, { status: 422 })
    }
    console.error('POST /api/holidays failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the holiday item route (DELETE)**

Create directory `src/app/api/holidays/[id]/` and file `route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const record = await prisma.govtHoliday.findUnique({ where: { id } })
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.govtHoliday.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/holidays/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/holidays/
git commit -m "feat: add holidays API routes (GET, POST, DELETE)"
```

---

## Task 5: Holidays Page

**Files:**
- Create: `src/app/holidays/page.tsx`
- Create: `src/app/holidays/holidays-client.tsx`
- Create: `e2e/09-holidays.spec.ts`

- [ ] **Step 1: Write E2E tests**

Create `e2e/09-holidays.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Holidays Page', () => {
  test('holidays page loads', async ({ page }) => {
    await page.goto('/holidays')
    await expect(page.getByRole('heading', { name: 'Government Holidays' })).toBeVisible()
  })

  test('can add a holiday', async ({ page }) => {
    await page.goto('/holidays')
    await page.getByLabel('Date').fill('2099-03-21')
    await page.getByLabel('Holiday Name').fill('Test Holiday March')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText('Test Holiday March').first()).toBeVisible()
  })

  test('duplicate holiday date shows error', async ({ page }) => {
    await page.goto('/holidays')
    // First add
    await page.getByLabel('Date').fill('2099-04-14')
    await page.getByLabel('Holiday Name').fill('Holiday A')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText('Holiday A').first()).toBeVisible()
    // Duplicate add
    await page.getByLabel('Date').fill('2099-04-14')
    await page.getByLabel('Holiday Name').fill('Holiday B')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText(/already exists/i)).toBeVisible()
  })

  test('can delete a holiday', async ({ page }) => {
    await page.goto('/holidays')
    // Add then delete
    await page.getByLabel('Date').fill('2099-05-05')
    await page.getByLabel('Holiday Name').fill('Delete Me Holiday')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText('Delete Me Holiday').first()).toBeVisible()
    await page.locator('tr', { hasText: 'Delete Me Holiday' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Delete Me Holiday')).not.toBeVisible()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx playwright test e2e/09-holidays.spec.ts
```

Expected: all tests FAIL (page doesn't exist yet).

- [ ] **Step 3: Create the holidays-client component**

Create `src/app/holidays/holidays-client.tsx`:

```tsx
'use client'
import { useState } from 'react'

type Holiday = { id: string; date: string; name: string; year: number }

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HolidaysClient({
  initialHolidays,
  initialYear,
}: {
  initialHolidays: Holiday[]
  initialYear: number
}) {
  const [year, setYear] = useState(initialYear)
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function loadYear(y: number) {
    const res = await fetch(`/api/holidays?year=${y}`)
    const data = await res.json() as Holiday[]
    setHolidays(data)
    setYear(y)
  }

  async function addHoliday() {
    if (!date || !name.trim()) {
      setErrors(['Date and holiday name are required'])
      return
    }
    setSaving(true)
    setErrors([])
    const res = await fetch('/api/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, name: name.trim() }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Failed to add holiday'])
      return
    }
    const created = await res.json() as Holiday
    if (created.year === year) {
      setHolidays((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
    }
    setDate('')
    setName('')
  }

  async function deleteHoliday(id: string) {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      setErrors([data.error ?? 'Delete failed'])
      return
    }
    setHolidays((prev) => prev.filter((h) => h.id !== id))
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

  return (
    <div>
      {/* Header bar */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#1e2d3d]">
        <div>
          <p className="text-xs text-[#5a8ab8]">Masters › Holidays</p>
          <h1 className="text-lg font-semibold text-white mt-0.5">Government Holidays</h1>
          <p className="text-[11px] text-[#4a6a8a] mt-0.5">{holidays.length} holidays in {year}</p>
        </div>
        <select
          value={year}
          onChange={(e) => loadYear(parseInt(e.target.value, 10))}
          className="bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-3 py-1.5 rounded"
          aria-label="Year"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Add form */}
      <div className="px-6 py-4 bg-[#0a1520] border-b border-[#1e2d3d]">
        <p className="text-[10px] text-[#5a8ab8] uppercase tracking-wider mb-2">Add Holiday</p>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-[10px] text-[#5a8ab8] mb-1" htmlFor="holiday-date">Date *</label>
            <input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Date"
              className="bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-2 py-1.5 rounded w-40"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] text-[#5a8ab8] mb-1" htmlFor="holiday-name">Holiday Name *</label>
            <input
              id="holiday-name"
              type="text"
              placeholder="e.g. Republic Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHoliday()}
              aria-label="Holiday Name"
              className="w-full bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-2 py-1.5 rounded"
            />
          </div>
          <button
            onClick={addHoliday}
            disabled={saving}
            className="px-4 py-1.5 bg-[#1a3a1a] border border-[#2a5a2a] text-[#40c070] text-xs font-medium rounded hover:bg-[#223a22] disabled:opacity-50 whitespace-nowrap"
          >
            + Add Holiday
          </button>
        </div>
        {errors.length > 0 && (
          <div className="mt-2 text-xs text-[#f07070]">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {holidays.length === 0 ? (
          <p className="text-sm text-[#4a6a8a]">No holidays for {year}. Add one above.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">#</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Date</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Day</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Holiday Name</th>
                <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h, i) => {
                const d = new Date(h.date)
                return (
                  <tr key={h.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                    <td className="py-2 px-2 text-[#5a8ab8]">{i + 1}</td>
                    <td className="py-2 px-2 text-[#c8d8e8]">{formatDate(h.date)}</td>
                    <td className="py-2 px-2 text-[#7a9ab8]">{DAY_NAMES[d.getDay()]}</td>
                    <td className="py-2 px-2 text-white font-medium">{h.name}</td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => deleteHoliday(h.id)}
                        disabled={saving}
                        className="text-[10px] px-2 py-0.5 border border-[#3a2020] text-[#f07070] rounded hover:bg-[#2a1010] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create the server page**

Create `src/app/holidays/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { HolidaysClient } from './holidays-client'

export default async function HolidaysPage() {
  const currentYear = new Date().getFullYear()
  const holidays = await prisma.govtHoliday.findMany({
    where: { year: currentYear },
    orderBy: { date: 'asc' },
  })
  const serialized = holidays.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    name: h.name,
    year: h.year,
  }))
  return <HolidaysClient initialHolidays={serialized} initialYear={currentYear} />
}
```

- [ ] **Step 5: Run E2E tests**

```bash
npx playwright test e2e/09-holidays.spec.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/holidays/ e2e/09-holidays.spec.ts
git commit -m "feat: add government holidays page and E2E tests"
```

---

## Task 6: Wage Rules API

**Files:**
- Create: `src/app/api/wage-rules/route.ts`

- [ ] **Step 1: Create the wage rules API route**

Create `src/app/api/wage-rules/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WAGE_RULE_DEFAULTS } from '@/domain/calculations/wage-defaults'

const RULE_KEYS = Object.keys(WAGE_RULE_DEFAULTS)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')
    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId is required' }, { status: 400 })
    }
    const custom = await prisma.wageRule.findMany({ where: { establishmentId } })
    const merged = RULE_KEYS.map((key) => {
      const found = custom.find((r) => r.ruleKey === key)
      return {
        ruleKey: key,
        ruleValue: found?.ruleValue ?? WAGE_RULE_DEFAULTS[key],
        isCustom: !!found,
        id: found?.id ?? null,
      }
    })
    return NextResponse.json(merged)
  } catch (error) {
    console.error('GET /api/wage-rules failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const b = body as { establishmentId?: string; ruleKey?: string; ruleValue?: number }
    if (!b.establishmentId || !b.ruleKey) {
      return NextResponse.json({ errors: ['establishmentId and ruleKey are required'] }, { status: 422 })
    }
    if (typeof b.ruleValue !== 'number' || b.ruleValue < 0) {
      return NextResponse.json({ errors: ['ruleValue must be a non-negative number'] }, { status: 422 })
    }
    if (!RULE_KEYS.includes(b.ruleKey)) {
      return NextResponse.json({ errors: [`unknown ruleKey: ${b.ruleKey}`] }, { status: 422 })
    }
    const rule = await prisma.wageRule.upsert({
      where: {
        establishmentId_ruleKey: {
          establishmentId: b.establishmentId,
          ruleKey: b.ruleKey,
        },
      },
      update: { ruleValue: b.ruleValue },
      create: {
        establishmentId: b.establishmentId,
        ruleKey: b.ruleKey,
        ruleValue: b.ruleValue,
      },
    })
    return NextResponse.json(rule)
  } catch (error) {
    console.error('PUT /api/wage-rules failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')
    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId is required' }, { status: 400 })
    }
    await prisma.wageRule.deleteMany({ where: { establishmentId } })
    return NextResponse.json({ reset: true })
  } catch (error) {
    console.error('DELETE /api/wage-rules failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/wage-rules/
git commit -m "feat: add wage rules API routes (GET, PUT, DELETE)"
```

---

## Task 7: Wage Rules Page

**Files:**
- Create: `src/app/wage-rules/page.tsx`
- Create: `src/app/wage-rules/wage-rules-client.tsx`
- Create: `e2e/10-wage-rules.spec.ts`

- [ ] **Step 1: Write E2E tests**

Create `e2e/10-wage-rules.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Wage Rules Page', () => {
  test('wage rules page loads', async ({ page }) => {
    await page.goto('/wage-rules')
    await expect(page.getByRole('heading', { name: 'Wage Rules' })).toBeVisible()
  })

  test('shows establishment selector', async ({ page }) => {
    await page.goto('/wage-rules')
    await expect(page.getByLabel('Establishment')).toBeVisible()
  })

  test('selecting an establishment shows the rules table', async ({ page }) => {
    await page.goto('/wage-rules')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    await expect(page.getByText('HOLIDAY_MULTIPLIER')).toBeVisible()
    await expect(page.getByText('2')).toBeVisible()
  })

  test('can edit a wage rule', async ({ page }) => {
    await page.goto('/wage-rules')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    await page.locator('tr', { hasText: 'HOLIDAY_MULTIPLIER' }).getByRole('button', { name: 'Edit' }).click()
    const input = page.locator('tr', { hasText: 'HOLIDAY_MULTIPLIER' }).getByRole('spinbutton')
    await input.fill('1.5')
    await page.locator('tr', { hasText: 'HOLIDAY_MULTIPLIER' }).getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('1.5').first()).toBeVisible()
  })

  test('reset to defaults restores default values', async ({ page }) => {
    await page.goto('/wage-rules')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    // Accept the confirm dialog
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Reset to Defaults' }).click()
    await expect(page.getByText('2').first()).toBeVisible()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx playwright test e2e/10-wage-rules.spec.ts
```

Expected: all tests FAIL.

- [ ] **Step 3: Create wage-rules-client component**

Create `src/app/wage-rules/wage-rules-client.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { WAGE_RULE_DEFAULTS } from '@/domain/calculations/wage-defaults'

type Establishment = { id: string; name: string }
type RuleRow = { ruleKey: string; ruleValue: number; isCustom: boolean; id: string | null }

const RULE_LABELS: Record<string, string> = {
  HOLIDAY_MULTIPLIER:  'Holiday Work Multiplier (×)',
  OT_MULTIPLIER:       'Overtime Multiplier (×)',
  PF_EMPLOYEE_PCT:     'PF Employee (%)',
  PF_EMPLOYER_PCT:     'PF Employer (%)',
  ESI_EMPLOYEE_PCT:    'ESI Employee (%)',
  ESI_EMPLOYER_PCT:    'ESI Employer (%)',
}

export function WageRulesClient({ establishments }: { establishments: Establishment[] }) {
  const [selectedId, setSelectedId] = useState('')
  const [rules, setRules] = useState<RuleRow[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function loadRules(id: string) {
    setSelectedId(id)
    setEditingKey(null)
    setErrors([])
    if (!id) { setRules([]); return }
    const res = await fetch(`/api/wage-rules?establishmentId=${id}`)
    const data = await res.json() as RuleRow[]
    setRules(data)
  }

  async function saveRule(ruleKey: string) {
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) {
      setErrors(['Value must be a non-negative number'])
      return
    }
    setSaving(true)
    setErrors([])
    const res = await fetch('/api/wage-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ establishmentId: selectedId, ruleKey, ruleValue: val }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[] }
      setErrors(data.errors ?? ['Save failed'])
      return
    }
    setRules((prev) =>
      prev.map((r) => r.ruleKey === ruleKey ? { ...r, ruleValue: val, isCustom: true } : r)
    )
    setEditingKey(null)
  }

  async function resetToDefaults() {
    if (!window.confirm('Reset all wage rules for this establishment to system defaults? This cannot be undone.')) return
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/wage-rules?establishmentId=${selectedId}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      setErrors(['Reset failed'])
      return
    }
    setRules((prev) =>
      prev.map((r) => ({ ...r, ruleValue: WAGE_RULE_DEFAULTS[r.ruleKey] ?? r.ruleValue, isCustom: false, id: null }))
    )
    setEditingKey(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#1e2d3d]">
        <div>
          <p className="text-xs text-[#5a8ab8]">Masters › Wage Rules</p>
          <h1 className="text-lg font-semibold text-white mt-0.5">Wage Rules</h1>
          <p className="text-[11px] text-[#4a6a8a] mt-0.5">Configure calculation rules per establishment</p>
        </div>
      </div>

      {/* Establishment selector */}
      <div className="px-6 py-4 border-b border-[#1e2d3d]">
        <label className="block text-[10px] text-[#5a8ab8] uppercase tracking-wider mb-1" htmlFor="est-select">
          Establishment
        </label>
        <select
          id="est-select"
          value={selectedId}
          onChange={(e) => loadRules(e.target.value)}
          aria-label="Establishment"
          className="bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-3 py-1.5 rounded w-64"
        >
          <option value="">— Select establishment —</option>
          {establishments.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {errors.length > 0 && (
        <div className="mx-6 mt-3 bg-[#2a1010] border border-[#5a2020] rounded p-2 text-xs text-[#f07070]">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Rules table */}
      {selectedId && rules.length > 0 && (
        <div className="px-6 py-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Rule</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Key</th>
                <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Default</th>
                <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Current Value</th>
                <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.ruleKey} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-2 text-[#c8d8e8]">{RULE_LABELS[r.ruleKey] ?? r.ruleKey}</td>
                  <td className="py-2 px-2 font-mono text-[#5a8ab8] text-[10px]">{r.ruleKey}</td>
                  <td className="py-2 px-2 text-right text-[#4a6a8a]">{WAGE_RULE_DEFAULTS[r.ruleKey]}</td>
                  <td className="py-2 px-2 text-right">
                    {editingKey === r.ruleKey ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 bg-[#1a2a3a] border border-[#4a9eff] rounded px-1 py-0.5 text-xs text-[#c8d8e8] text-right"
                        autoFocus
                      />
                    ) : (
                      <span className={r.isCustom ? 'text-[#4a9eff] font-semibold' : 'text-white'}>
                        {r.ruleValue}
                        {!r.isCustom && (
                          <span className="ml-1 text-[9px] text-[#4a6a8a] font-normal">default</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {editingKey === r.ruleKey ? (
                      <span className="flex gap-1 justify-end">
                        <button
                          onClick={() => saveRule(r.ruleKey)}
                          disabled={saving}
                          className="text-[10px] px-2 py-0.5 bg-[#1a5adc] text-white rounded hover:bg-[#2a6aec] disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="text-[10px] px-2 py-0.5 border border-[#2a3a50] text-[#7a9ab8] rounded hover:bg-[#1a2a3a]"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setEditingKey(r.ruleKey); setEditValue(String(r.ruleValue)) }}
                        className="text-[10px] px-2 py-0.5 border border-[#2a3a50] text-[#4a9eff] rounded hover:bg-[#1a2a3a]"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <button
              onClick={resetToDefaults}
              disabled={saving}
              className="px-4 py-1.5 bg-[#2a1010] border border-[#5a2020] text-[#f07070] text-xs font-medium rounded hover:bg-[#3a1010] disabled:opacity-50"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {selectedId && rules.length === 0 && (
        <div className="px-6 py-4 text-sm text-[#4a6a8a]">Loading rules…</div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create the server page**

Create `src/app/wage-rules/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { WageRulesClient } from './wage-rules-client'

export default async function WageRulesPage() {
  const establishments = await prisma.establishment.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
  return <WageRulesClient establishments={establishments} />
}
```

- [ ] **Step 5: Run E2E tests**

```bash
npx playwright test e2e/10-wage-rules.spec.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/wage-rules/ e2e/10-wage-rules.spec.ts
git commit -m "feat: add wage rules page and E2E tests"
```

---

## Task 8: Sidebar Navigation

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Update the navItems array**

In `src/components/sidebar.tsx`, the Masters section currently has:
```ts
{ section: 'Masters', items: [
  { href: '/establishments', label: 'Establishments', icon: '🏢' },
  { href: '/employees', label: 'Employees', icon: '👥' },
]},
```

Replace with:
```ts
{ section: 'Masters', items: [
  { href: '/establishments', label: 'Establishments', icon: '🏢' },
  { href: '/employees', label: 'Employees', icon: '👥' },
  { href: '/holidays', label: 'Holidays', icon: '📅' },
  { href: '/wage-rules', label: 'Wage Rules', icon: '⚙️' },
]},
```

- [ ] **Step 2: Verify sidebar renders**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Update the navigation E2E test**

In `e2e/01-navigation.spec.ts`, add tests for the new sidebar links:

```ts
test('sidebar has Holidays link', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Holidays' })).toBeVisible()
})

test('sidebar has Wage Rules link', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Wage Rules' })).toBeVisible()
})
```

- [ ] **Step 4: Run navigation E2E tests**

```bash
npx playwright test e2e/01-navigation.spec.ts
```

Expected: all tests PASS including new ones.

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar.tsx e2e/01-navigation.spec.ts
git commit -m "feat: add Holidays and Wage Rules to sidebar navigation"
```

---

## Task 9: Form Entry — Attendance Defaults & Holiday Visual Indicators

**Files:**
- Modify: `src/app/forms/[taskId]/page.tsx`
- Modify: `src/app/forms/[taskId]/form-entry-client.tsx`

- [ ] **Step 1: Pass holidayDays from page to client**

In `src/app/forms/[taskId]/page.tsx`, after the existing `getDaysInMonth` helper, add a query to fetch holidays:

After the `existingLeave` query block, add:
```ts
const cycleHolidays = await prisma.govtHoliday.findMany({
  where: { year: cycle.year },
})
const holidayDays: number[] = cycleHolidays
  .filter((h) => new Date(h.date).getMonth() + 1 === cycle.month)
  .map((h) => new Date(h.date).getDate())
```

Then pass `holidayDays` to `FormEntryClient`:
```tsx
<FormEntryClient
  formTaskId={taskId}
  formTaskStatus={formTask.status}
  month={cycle.month}
  year={cycle.year}
  daysInMonth={daysInMonth}
  employees={employees}
  formulaConfig={formulaConfig}
  isHospital={isHospital}
  holidayDays={holidayDays}
  initialAttendance={initialAttendance}
  initialWages={initialWages}
  initialOt={initialOt}
  initialFines={initialFines}
  initialDeductions={initialDeductions}
  initialLeave={initialLeave}
/>
```

- [ ] **Step 2: Update FormEntryClient Props type and imports**

In `src/app/forms/[taskId]/form-entry-client.tsx`:

At the top of the file, add the import:
```ts
import { applyAttendanceDefaults } from '@/domain/calculations/attendance-calculator'
```

Add `holidayDays: number[]` to the `Props` type:
```ts
type Props = {
  formTaskId: string
  formTaskStatus: string
  month: number
  year: number
  daysInMonth: number
  employees: Employee[]
  formulaConfig: WageFormulaConfig
  isHospital: boolean
  holidayDays: number[]
  initialAttendance: Record<string, AttendanceRow>
  // ... rest unchanged
}
```

In the component function signature, change `month: _month, year: _year` to `month, year` (remove the underscore prefix since they are now used):
```ts
export function FormEntryClient({
  formTaskId,
  formTaskStatus,
  month,
  year,
  daysInMonth,
  employees,
  formulaConfig,
  isHospital,
  holidayDays,
  initialAttendance,
  // ... rest unchanged
}: Props) {
```

Derive `holidayDaySet` from `holidayDays` right after the state declarations:
```ts
const holidayDaySet = new Set(holidayDays)
```

- [ ] **Step 3: Add "Apply Defaults" handler**

Add this function inside the component, after `saveAttendance`:

```ts
function applyDefaults() {
  setAttendance((prev) => {
    const next = { ...prev }
    for (const emp of employees) {
      const row = next[emp.employeeId]
      next[emp.employeeId] = {
        ...row,
        marks: applyAttendanceDefaults(row.marks, year, month, holidayDaySet),
      }
    }
    return next
  })
}
```

- [ ] **Step 4: Update the attendance table header to style weekend/holiday columns**

In the attendance table `<thead>` section, find the day column headers:
```tsx
{days.map((d) => (
  <th key={d} className="px-0 py-1.5 text-[#5a8ab8] font-medium w-8 text-center">
    {d}
  </th>
))}
```

Replace with:
```tsx
{days.map((d) => {
  const dow = new Date(year, month - 1, d).getDay()
  const isWeekend = dow === 0 || dow === 6
  const isHoliday = holidayDaySet.has(d)
  const headerClass = isHoliday
    ? 'bg-[#1a1000] text-[#c87020]'
    : isWeekend
    ? 'bg-[#080f18] text-[#4a6a8a]'
    : 'text-[#5a8ab8]'
  return (
    <th key={d} className={`px-0 py-1.5 font-medium w-8 text-center ${headerClass}`}>
      {d}{isHoliday ? '★' : ''}
    </th>
  )
})}
```

- [ ] **Step 5: Update attendance cells to show orange badge for worked-holiday**

In the attendance table `<tbody>` section, find the cell rendering:
```tsx
{days.map((d) => {
  const mark = row.marks[d - 1] ?? ''
  return (
    <td key={d} className="p-0 border-r border-[#1a2332]">
      <button
        type="button"
        onClick={() => toggleMark(emp.employeeId, d - 1)}
        className={`w-8 h-7 text-[10px] font-semibold ${MARK_STYLE[mark] ?? MARK_STYLE['']}`}
      >
        {mark || '—'}
      </button>
    </td>
  )
})}
```

Replace with:
```tsx
{days.map((d) => {
  const mark = row.marks[d - 1] ?? ''
  const isWorkedHoliday = holidayDaySet.has(d) && mark === 'P'
  const cellStyle = isWorkedHoliday
    ? 'bg-[#2a1200] text-[#e07020] border border-[#c05010]'
    : MARK_STYLE[mark] ?? MARK_STYLE['']
  return (
    <td key={d} className="p-0 border-r border-[#1a2332]">
      <button
        type="button"
        onClick={() => toggleMark(emp.employeeId, d - 1)}
        className={`w-8 h-7 text-[10px] font-semibold ${cellStyle}`}
      >
        {mark || '—'}
      </button>
    </td>
  )
})}
```

- [ ] **Step 6: Add "Apply Defaults" button next to "Save Attendance"**

Find the Save Attendance button area:
```tsx
<div className="mt-4">
  <button
    onClick={saveAttendance}
    disabled={saving}
    className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
  >
    {saving ? 'Saving…' : 'Save Attendance'}
  </button>
</div>
```

Replace with:
```tsx
<div className="mt-4 flex gap-2">
  <button
    onClick={applyDefaults}
    className="px-4 py-1.5 bg-[#1a2a1a] border border-[#2a4a2a] text-[#40c070] text-xs font-medium rounded hover:bg-[#223222]"
  >
    Apply Defaults
  </button>
  <button
    onClick={saveAttendance}
    disabled={saving}
    className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
  >
    {saving ? 'Saving…' : 'Save Attendance'}
  </button>
</div>
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Run the form entry E2E tests to verify no regressions**

```bash
npx playwright test e2e/05-form-entry.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/forms/[taskId]/page.tsx src/app/forms/[taskId]/form-entry-client.tsx
git commit -m "feat: add attendance defaults and holiday visual indicators to form entry"
```

---

## Task 10: Holiday Bonus Computation in Wages API

**Files:**
- Modify: `src/app/api/form-tasks/[id]/wages/route.ts`

- [ ] **Step 1: Update the wages API PUT route to compute holidayBonus**

In `src/app/api/form-tasks/[id]/wages/route.ts`, at the top add this import:
```ts
import { getWageRuleValue } from '@/domain/calculations/wage-defaults'
```

Inside the PUT handler, after the `formTask` lookup, add a query to fetch wage rules and holidays. Replace the existing `const config = JSON.parse(...)` block and the `b.records.map(async (r) => {` body with:

```ts
const config = JSON.parse(
  formTask.cycle.establishment.wageFormulaConfig
) as WageFormulaConfig

const wageRules = await prisma.wageRule.findMany({
  where: { establishmentId: formTask.cycle.establishment.id },
})

const holidayMultiplier = getWageRuleValue(wageRules, 'HOLIDAY_MULTIPLIER')

const cycleHolidays = await prisma.govtHoliday.findMany({
  where: { year: formTask.cycle.year },
})
const holidayDaysInMonth = new Set(
  cycleHolidays
    .filter((h) => new Date(h.date).getMonth() + 1 === formTask.cycle.month)
    .map((h) => new Date(h.date).getDate())
)

const daysInMonth = new Date(formTask.cycle.year, formTask.cycle.month, 0).getDate()

const updated = await Promise.all(
  b.records.map(async (r) => {
    const otRec = await prisma.overtimeRecord.findUnique({
      where: {
        cycleId_employeeId: {
          cycleId: formTask.cycleId,
          employeeId: r.employeeId,
        },
      },
    })
    const overtimeEarnings = otRec?.totalEarnings ?? 0

    // Compute holiday bonus from attendance marks
    const attRec = await prisma.attendanceRecord.findUnique({
      where: {
        cycleId_employeeId: {
          cycleId: formTask.cycleId,
          employeeId: r.employeeId,
        },
      },
    })
    const dailyMarks: string[] = attRec ? JSON.parse(attRec.dailyMarks) : []
    const grossEarnings = r.basic + r.da + r.hra + r.otherAllowances
    const dailyRate = daysInMonth > 0 ? grossEarnings / daysInMonth : 0
    let holidayWorkedDays = 0
    for (let day = 1; day <= dailyMarks.length; day++) {
      if (dailyMarks[day - 1] === 'P' && holidayDaysInMonth.has(day)) {
        holidayWorkedDays++
      }
    }
    const holidayBonus = Math.round(dailyRate * (holidayMultiplier - 1) * holidayWorkedDays * 100) / 100

    const calc = calculateWages(config, {
      basic: r.basic,
      da: r.da,
      hra: r.hra,
      otherAllowances: r.otherAllowances,
      holidayBonus,
      overtimeEarnings,
      pf: r.pf,
      esi: r.esi,
      lwf: r.lwf,
      advanceRecovered: r.advanceRecovered,
      fineDeduction: r.fineDeduction,
      otherDeductions: r.otherDeductions,
    })

    const data = {
      daysWorked: r.daysWorked,
      basic: r.basic,
      da: r.da,
      hra: r.hra,
      otherAllowances: JSON.stringify([r.otherAllowances]),
      holidayBonus,
      totalNormalWages: calc.totalNormalWages,
      totalEarnings: calc.totalEarnings,
      overtimeEarnings,
      grossWages: calc.grossWages,
      pf: r.pf,
      esi: r.esi,
      lwf: r.lwf,
      advanceRecovered: r.advanceRecovered,
      fineDeduction: r.fineDeduction,
      otherDeductions: r.otherDeductions,
      totalDeductions: calc.totalDeductions,
      netWages: calc.netWages,
      paymentDate: r.paymentDate ? new Date(r.paymentDate) : null,
      receiptRef: r.receiptRef?.trim() ?? null,
    }

    return prisma.wageRecord.upsert({
      where: {
        cycleId_employeeId: {
          cycleId: formTask.cycleId,
          employeeId: r.employeeId,
        },
      },
      update: data,
      create: { cycleId: formTask.cycleId, employeeId: r.employeeId, ...data },
    })
  })
)
```

Also update the `formTask` include to also select `establishment.id`:
```ts
const formTask = await prisma.formTask.findUnique({
  where: { id },
  include: {
    cycle: {
      include: {
        establishment: {
          select: { id: true, name: true, type: true, wageFormulaConfig: true },
        },
      },
    },
  },
})
```

- [ ] **Step 2: Update the GET handler return to include holidayBonus**

In the GET handler `return NextResponse.json(...)`, update to include `holidayBonus`:
```ts
return NextResponse.json(
  records.map((r) => ({
    ...r,
    otherAllowances: Number((JSON.parse(r.otherAllowances) as number[])[0] ?? 0),
    holidayBonus: r.holidayBonus,
  }))
)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full E2E test suite**

```bash
npx playwright test
```

Expected: all tests PASS.

- [ ] **Step 5: Run unit tests**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/form-tasks/[id]/wages/route.ts
git commit -m "feat: compute and store holiday bonus in wages API"
```

---

## Final Verification

- [ ] Start the dev server and manually verify:
  1. `/holidays` page — add a holiday for current month, confirm it appears in the table
  2. Open a form entry page — click "Apply Defaults", confirm weekdays = P, weekends = A, holiday day = H
  3. Change the holiday day from H to P — confirm the cell turns orange
  4. Save attendance, then save wages — confirm no errors
  5. `/wage-rules` page — select an establishment, edit HOLIDAY_MULTIPLIER to 1.5, save, then Reset to Defaults
  6. Sidebar shows Holidays and Wage Rules links

```bash
npm run dev
```
