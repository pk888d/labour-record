# Wide Register 2-Page Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the wide daily-column registers (Hospital Form IV/V, Shop Form V) across two landscape pages — identity columns repeated, day columns halved, summaries on page 2 — so the Name/identity columns are legible.

**Architecture:** A pure `splitDays` helper + a generic server component `SplitRegister` that renders two `.form-page` blocks (part 1 with a page break, part 2 marked "continued") from per-form config (identity head/cells, day group label, day cell, summary head/cells). The three form components become thin configs of `SplitRegister`. `page.tsx`/`paginateForm` are unchanged — they render the form per employee-chunk and the form now emits 2 sheets.

**Tech Stack:** Next.js 16 server components, React, Vitest, Playwright.

---

## Reference: current state
- `paginateForm` in `src/app/print/[cycleId]/[formCode]/page.tsx` renders each register once per employee-chunk inside a density `<div>` with `break-after:page` between chunks. Forms receive `{ ctx, <rows>, startIndex }` and currently return a single `<div className="form-page">`.
- `CycleContext` has `establishment{name,address,managerName,regCertNo}`, `cycle{month,year}`, `daysInMonth`. `MONTH_NAMES` exported from `@/lib/export/form-data`.
- `OvertimeRow` (Form IV): `employeeId, name, fatherSpouseName, sex, designation, dailyOt: number[], totalOtHours, normalHoursRate, otRate, normalEarnings, otEarnings`.
- `MusterRow` (Form V / Shop V): `employeeId, name, empId, fatherSpouseName, sex, designation, workStartTime, workEndTime, restInterval, dailyMarks: string[], remarks`.
- Print CSS already has `table-layout:fixed`. Tests: `npm test -- <name>`; e2e `npx playwright test e2e/<f>` (kill stale `:3000` first). Build: `npm run build`.

---

## Task 1: `splitDays` helper (pure, tested)

**Files:** Create `src/lib/day-split.ts`, `src/lib/day-split.test.ts`

- [ ] **Step 1: Failing test** — `src/lib/day-split.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { splitDays } from './day-split'

describe('splitDays', () => {
  it('splits a 31-day month into 16 + 15', () => {
    const { first, second } = splitDays(31)
    expect(first).toEqual([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])
    expect(second).toEqual([17,18,19,20,21,22,23,24,25,26,27,28,29,30,31])
  })
  it('splits a 30-day month into 15 + 15', () => {
    const { first, second } = splitDays(30)
    expect(first.length).toBe(15)
    expect(second).toEqual([16,17,18,19,20,21,22,23,24,25,26,27,28,29,30])
  })
  it('splits a 28-day month into 14 + 14', () => {
    const { first, second } = splitDays(28)
    expect(first.length).toBe(14)
    expect(second.length).toBe(14)
  })
})
```

- [ ] **Step 2: Run → FAIL** — `npm test -- day-split`

- [ ] **Step 3: Implement** — `src/lib/day-split.ts`:
```ts
// Split a month's day numbers into two near-equal halves for the 2-page
// horizontal split of wide daily-column registers (Form IV/V).
export function splitDays(daysInMonth: number): { first: number[]; second: number[] } {
  const mid = Math.ceil(daysInMonth / 2)
  const all = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  return { first: all.slice(0, mid), second: all.slice(mid) }
}
```

- [ ] **Step 4: Run → PASS** — `npm test -- day-split` (3 tests)

- [ ] **Step 5: Commit**
```bash
git add src/lib/day-split.ts src/lib/day-split.test.ts
git commit -m "feat: splitDays helper for 2-page register split"
```

---

## Task 2: Generic `SplitRegister` component

**Files:** Create `src/app/print/[cycleId]/[formCode]/split-register.tsx`

- [ ] **Step 1: Implement** — full file:
```tsx
import type { ReactNode } from 'react'
import { splitDays } from '@/lib/day-split'

export type SplitRegisterProps<T> = {
  title: string
  ruleLine: string
  periodLine: string
  establishment: { name: string; address: string; managerName: string; regCertNo: string }
  rows: T[]
  startIndex: number
  daysInMonth: number
  dayGroupLabel: string // header spanning the day columns
  identityHead: ReactNode // <th rowSpan={2}> cells for identity columns
  summaryHead: ReactNode // <th rowSpan={2}> cells for summary columns (page 2)
  identityCells: (row: T, sno: number) => ReactNode // <td> identity cells
  dayCell: (row: T, dayIndex: number) => ReactNode // <td> for one day (0-based)
  summaryCells: (row: T) => ReactNode // <td> summary cells (page 2)
  rowKey: (row: T) => string
  legend?: ReactNode
}

export function SplitRegister<T>(props: SplitRegisterProps<T>) {
  const { first, second } = splitDays(props.daysInMonth)

  const header = (continued: boolean) => (
    <div className="form-header">
      <h2>{props.title}{continued ? ' (continued)' : ''}</h2>
      <p>{props.ruleLine}</p>
      <p style={{ fontWeight: 'bold' }}>{props.periodLine}</p>
      <p>Name and Address of the Establishment: <strong>{props.establishment.name}</strong>, {props.establishment.address}</p>
      <p>Name of the Manager/In-charge: {props.establishment.managerName} | Registration Certificate No.: {props.establishment.regCertNo}</p>
    </div>
  )

  const part = (days: number[], withSummary: boolean) => (
    <table>
      <thead>
        <tr>
          {props.identityHead}
          <th colSpan={days.length}>{props.dayGroupLabel}</th>
          {withSummary ? props.summaryHead : null}
        </tr>
        <tr>
          {days.map((d) => <th key={d} style={{ minWidth: '13px', fontWeight: 'normal' }}>{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row, i) => (
          <tr key={props.rowKey(row)}>
            {props.identityCells(row, props.startIndex + i + 1)}
            {days.map((d) => (
              <span key={d} style={{ display: 'contents' }}>{props.dayCell(row, d - 1)}</span>
            ))}
            {withSummary ? props.summaryCells(row) : null}
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <>
      <div className="form-page" style={{ breakAfter: 'page' }}>
        {header(false)}
        {part(first, false)}
        {props.legend}
      </div>
      <div className="form-page">
        {header(true)}
        {part(second, true)}
        {props.legend}
      </div>
    </>
  )
}
```
> NOTE on the `dayCell` wrapper: `dayCell` returns a `<td>`; wrapping it in
> `<span style={{display:'contents'}}>` only to carry the `key` would put a span
> inside `<tr>` which is invalid. Instead, have `dayCell` NOT include a key and
> render days as `{days.map((d) => dayCell(row, d - 1))}` — but React needs keys.
> SIMPLER: change `dayCell` signature to `(row, dayIndex) => ReactNode` that returns
> a **keyed `<td key=...>`**, and render `{days.map((d) => props.dayCell(row, d - 1))}`
> directly (no span wrapper). Update the map in `part` to:
> `{days.map((d) => props.dayCell(row, d - 1))}` and require each form's `dayCell`
> to set `key={dayIndex}` on its returned `<td>`. Use this approach (remove the
> span wrapper shown above).

- [ ] **Step 2: Apply the keyed-`<td>` approach** — in `part`, the day map must be:
```tsx
            {days.map((d) => props.dayCell(row, d - 1))}
```
and the JSDoc for `dayCell` states it must return `<td key={dayIndex}>…`.

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit 2>&1 | grep -i "split-register" | head` → no errors referencing split-register (pre-existing project noise is fine).

- [ ] **Step 4: Commit**
```bash
git add "src/app/print/[cycleId]/[formCode]/split-register.tsx"
git commit -m "feat: generic SplitRegister (2-page horizontal split scaffold)"
```

---

## Task 3: Hospital Form IV → SplitRegister

**Files:** Modify `src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx`

- [ ] **Step 1: Replace the whole file** with:
```tsx
import type { CycleContext, OvertimeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'
import { SplitRegister } from './split-register'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

export function HospitalFormIV({ ctx, ot, startIndex = 0 }: { ctx: CycleContext; ot: OvertimeRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  return (
    <SplitRegister<OvertimeRow>
      title="FORM No. IV — REGISTER OF OVERTIME (MUSTER ROLL CUM WAGES)"
      ruleLine="Prescribed under Rule 25(2) of Minimum Wages (Tamil Nadu) Rules, 1953"
      periodLine={`Overtime Register for the Month of ${period}`}
      establishment={establishment}
      rows={ot}
      startIndex={startIndex}
      daysInMonth={daysInMonth}
      dayGroupLabel="Date on which Overtime Worked (hours)"
      rowKey={(r) => r.employeeId}
      identityHead={<>
        <th rowSpan={2}>S.No</th>
        <th rowSpan={2}>Name</th>
        <th rowSpan={2}>Father&apos;s / Husband&apos;s Name</th>
        <th rowSpan={2}>Sex</th>
        <th rowSpan={2}>Designation &amp; Department</th>
      </>}
      summaryHead={<>
        <th rowSpan={2}>Total Overtime worked</th>
        <th rowSpan={2}>Normal Rate</th>
        <th rowSpan={2}>Overtime Rate</th>
        <th rowSpan={2}>Normal Earnings</th>
        <th rowSpan={2}>Overtime Earnings</th>
        <th rowSpan={2}>Total Earnings</th>
      </>}
      identityCells={(row, sno) => <>
        <td style={{ textAlign: 'center' }}>{sno}</td>
        <td>{row.name}</td>
        <td>{row.fatherSpouseName || 'Nil'}</td>
        <td style={{ textAlign: 'center' }}>{row.sex}</td>
        <td>{row.designation}</td>
      </>}
      dayCell={(row, d) => (
        <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{row.dailyOt[d] > 0 ? row.dailyOt[d] : '-'}</td>
      )}
      summaryCells={(row) => <>
        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalOtHours > 0 ? row.totalOtHours : 'Nil'}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.normalHoursRate)}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.otRate)}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.normalEarnings)}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.otEarnings)}</td>
        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.normalEarnings + row.otEarnings)}</td>
      </>}
    />
  )
}
```

- [ ] **Step 2: Build** — `npm run build` (prisma generate first if needed). Expected: compiles.

- [ ] **Step 3: Commit**
```bash
git add "src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx"
git commit -m "feat: Form IV (overtime) renders as 2-page split"
```

---

## Task 4: Hospital Form V → SplitRegister

**Files:** Modify `src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx`

- [ ] **Step 1: Replace the whole file** with:
```tsx
import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'
import { SplitRegister } from './split-register'

export function HospitalFormV({ ctx, muster, startIndex = 0 }: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const dash = '—'
  const legend = (
    <div style={{ marginTop: '10px', fontSize: '9px' }}>
      P = Present · A = Absent · H = Holiday / Weekly off · L = Leave · OT = Overtime
    </div>
  )
  return (
    <SplitRegister<MusterRow>
      title="FORM No. V — REGISTER OF MUSTER ROLL"
      ruleLine="Prescribed under Rule 27(5) of the Minimum Wages (Tamil Nadu) Rules, 1963"
      periodLine={`Register of Muster Roll for the Month of ${period}`}
      establishment={establishment}
      rows={muster}
      startIndex={startIndex}
      daysInMonth={daysInMonth}
      dayGroupLabel={`Daily attendance (${period})`}
      rowKey={(r) => r.employeeId}
      legend={legend}
      identityHead={<>
        <th rowSpan={2}>S.No</th>
        <th rowSpan={2}>Name of the worker</th>
        <th rowSpan={2}>Father&apos;s / Husband&apos;s Name</th>
        <th rowSpan={2}>Sex</th>
        <th rowSpan={2}>Nature of work</th>
        <th rowSpan={2}>Time commenced</th>
        <th rowSpan={2}>Time ceased</th>
        <th rowSpan={2}>Rest Interval</th>
      </>}
      summaryHead={<>
        <th rowSpan={2}>Days Worked</th>
        <th rowSpan={2}>No. of Days counted for wages</th>
        <th rowSpan={2}>No. of Days leave with wages</th>
        <th rowSpan={2}>No. of Days Absent</th>
        <th rowSpan={2}>Remarks</th>
      </>}
      identityCells={(row, sno) => <>
        <td style={{ textAlign: 'center' }}>{sno}</td>
        <td>{row.name}</td>
        <td>{row.fatherSpouseName || 'Nil'}</td>
        <td style={{ textAlign: 'center' }}>{row.sex}</td>
        <td>{row.designation}</td>
        <td style={{ textAlign: 'center' }}>{row.workStartTime || dash}</td>
        <td style={{ textAlign: 'center' }}>{row.workEndTime || dash}</td>
        <td style={{ textAlign: 'center' }}>{row.restInterval || dash}</td>
      </>}
      dayCell={(row, d) => (
        <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{row.dailyMarks[d] || '-'}</td>
      )}
      summaryCells={(row) => {
        const worked = row.dailyMarks.filter((m) => m === 'P' || m === 'OT').length
        const holiday = row.dailyMarks.filter((m) => m === 'H').length
        const leave = row.dailyMarks.filter((m) => m === 'L').length
        const absent = row.dailyMarks.filter((m) => m === 'A').length
        return <>
          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{worked}</td>
          <td style={{ textAlign: 'center' }}>{worked + holiday + leave}</td>
          <td style={{ textAlign: 'center' }}>{leave}</td>
          <td style={{ textAlign: 'center' }}>{absent}</td>
          <td>{row.remarks || 'Nil'}</td>
        </>
      }}
    />
  )
}
```

- [ ] **Step 2: Build** — `npm run build`. Expected: compiles.

- [ ] **Step 3: Commit**
```bash
git add "src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx"
git commit -m "feat: Form V (muster) renders as 2-page split"
```

---

## Task 5: Shop Form V → SplitRegister

**Files:** Modify `src/app/print/[cycleId]/[formCode]/shop-form-v.tsx`

- [ ] **Step 1: Replace the whole file** with:
```tsx
import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'
import { SplitRegister } from './split-register'

export function ShopFormV({ ctx, muster, startIndex = 0 }: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const legend = (
    <div style={{ marginTop: '10px', fontSize: '9px' }}>
      P = Present · A = Absent · H = Holiday / Weekly off · L = Leave · OT = Overtime
    </div>
  )
  return (
    <SplitRegister<MusterRow>
      title="FORM V — REGISTER OF EMPLOYMENT"
      ruleLine="Prescribed under Rule 38(1)(a) of the Tamil Nadu Shops and Establishments Rules, 1958"
      periodLine={`Register of Employment for the Month of ${period}`}
      establishment={establishment}
      rows={muster}
      startIndex={startIndex}
      daysInMonth={daysInMonth}
      dayGroupLabel={`Daily attendance (${period})`}
      rowKey={(r) => r.employeeId}
      legend={legend}
      identityHead={<>
        <th rowSpan={2}>S.No</th>
        <th rowSpan={2}>Name of the Employee</th>
        <th rowSpan={2}>EID No</th>
        <th rowSpan={2}>Time work begins</th>
        <th rowSpan={2}>Rest Interval</th>
        <th rowSpan={2}>Time work ends</th>
      </>}
      summaryHead={<>
        <th rowSpan={2}>Total Days Worked</th>
        <th rowSpan={2}>Total Days Absent</th>
        <th rowSpan={2}>Days on Leave</th>
        <th rowSpan={2}>Remarks</th>
      </>}
      identityCells={(row, sno) => <>
        <td style={{ textAlign: 'center' }}>{sno}</td>
        <td>{row.name}</td>
        <td>{row.empId}</td>
        <td style={{ textAlign: 'center' }}>{row.workStartTime || 'Nil'}</td>
        <td style={{ textAlign: 'center' }}>{row.restInterval || 'Nil'}</td>
        <td style={{ textAlign: 'center' }}>{row.workEndTime || 'Nil'}</td>
      </>}
      dayCell={(row, d) => (
        <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{row.dailyMarks[d] || '-'}</td>
      )}
      summaryCells={(row) => {
        const worked = row.dailyMarks.filter((m) => m === 'P' || m === 'OT').length
        const leave = row.dailyMarks.filter((m) => m === 'L').length
        const absent = row.dailyMarks.filter((m) => m === 'A').length
        return <>
          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{worked}</td>
          <td style={{ textAlign: 'center' }}>{absent}</td>
          <td style={{ textAlign: 'center' }}>{leave}</td>
          <td>{row.remarks || 'Nil'}</td>
        </>
      }}
    />
  )
}
```

- [ ] **Step 2: Build** — `npm run build`. Expected: compiles.

- [ ] **Step 3: Commit**
```bash
git add "src/app/print/[cycleId]/[formCode]/shop-form-v.tsx"
git commit -m "feat: Shop Form V (muster) renders as 2-page split"
```

---

## Task 6: e2e + regression + status

**Files:** Create `e2e/17-wide-register-split.spec.ts`; Modify `status.md`

- [ ] **Step 1: e2e** — `e2e/17-wide-register-split.spec.ts`:
```ts
import { test, expect, type Page } from '@playwright/test'

async function cycleId(page: Page): Promise<string> {
  await page.goto('/cycles')
  await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
  await page.waitForURL(/\/cycles\/[^/]+$/)
  return page.url().split('/').pop() ?? ''
}

test.describe('Wide register 2-page split', () => {
  test('Form IV (Overtime) splits into two pages with repeated identity + continued marker', async ({ page }) => {
    const id = await cycleId(page)
    await page.goto(`/print/${id}/HOSPITAL_FORM_IV`)
    await expect(page.getByText(/REGISTER OF OVERTIME/i).first()).toBeVisible({ timeout: 20000 })
    // 2 sheets for a single-chunk roster (part 1 + part 2).
    expect(await page.locator('.form-page').count()).toBe(2)
    // "(continued)" marks page 2; Name header appears on both pages.
    await expect(page.getByText(/continued/i)).toBeVisible()
    expect(await page.getByRole('columnheader', { name: 'Name', exact: true }).count()).toBeGreaterThanOrEqual(2)
  })

  test('Form V (Muster) splits into two pages', async ({ page }) => {
    const id = await cycleId(page)
    await page.goto(`/print/${id}/HOSPITAL_FORM_V`)
    await expect(page.getByText(/MUSTER ROLL/i).first()).toBeVisible({ timeout: 20000 })
    expect(await page.locator('.form-page').count()).toBe(2)
    await expect(page.getByText(/continued/i)).toBeVisible()
  })
})
```
> NOTE: this assumes the DNV cycle is a single employee-chunk (≤ max-per-sheet, which it is at 6 employees) → exactly 2 `.form-page`. If DNV has been emptied in your DB, seed it (`npx prisma db seed`).

- [ ] **Step 2: Run new e2e** — `lsof -ti :3000 | xargs kill -9 2>/dev/null; npx playwright test e2e/17-wide-register-split.spec.ts --reporter=list` → 2 passed.

- [ ] **Step 3: Regression** — `npm test` (unit incl. day-split) and `npx playwright test e2e/07-print-views.spec.ts e2e/10-print-pagination.spec.ts --reporter=list`. Expected: 07 green; 10 green (Form V now yields 4 `.form-page` for the bulk cycle = 2 chunks × 2 parts, still > 1; rows ≥ roster holds). If 07's "Form IV/V loads" assertions target text now split across pages, they still find the heading on page 1 — should pass.

- [ ] **Step 4: status.md** — add a `### Task Update — <today> — Wide register 2-page split` entry.

- [ ] **Step 5: Commit**
```bash
git add e2e/17-wide-register-split.spec.ts status.md
git commit -m "test: e2e for wide-register 2-page split + status"
```

---

## Self-review notes
- **Spec coverage:** splitDays (T1) ✓; SplitRegister 2-part render + continued marker + page break (T2) ✓; Form IV (T3), Form V (T4), Shop V (T5) configured ✓; identity repeated + days halved + summary on p2 ✓; e2e + regression (T6) ✓.
- **page.tsx unchanged:** confirmed — forms still receive `{ctx, rows, startIndex}` and emit their own sheets.
- **Type consistency:** `SplitRegister<T>` props (`identityHead`, `summaryHead`, `identityCells(row,sno)`, `dayCell(row,dayIndex)→<td key>`, `summaryCells(row)`, `rowKey`, `dayGroupLabel`, `legend?`) used identically across T3–T5. `dayCell` returns a keyed `<td>`; the day map calls `props.dayCell(row, d-1)` directly (no span wrapper) per Task 2 Step 2.
- **No placeholders:** complete code in every step.
