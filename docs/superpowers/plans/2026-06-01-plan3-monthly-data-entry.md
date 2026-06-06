# Labour Record — Plan 3: Core Monthly Data Entry

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attendance daily marks grid + wage record entry with auto-calculation per TN formula presets. `/forms/[taskId]` data entry page with Attendance and Wage Data tabs.

**Architecture:** `AttendanceRecord` and `WageRecord` are stored at cycle×employee level (shared across all form tasks in a cycle). Domain layer calculates derived fields. API receives raw inputs, computes totals, stores both. Client-side real-time preview uses the same pure calculation functions.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7, SQLite, Vitest

**Previous plan:** Plan 2 — Monthly Cycles + Kanban Board (complete)
**Next plan:** Plan 4 — Overtime, Fines, Deductions

---

## File Map

```
src/
  domain/
    calculations/
      attendance-calculator.ts    ← calculateAttendanceTotals() — pure, no imports
      wage-calculator.ts          ← calculateWages() for both TN presets — pure
  app/
    api/
      form-tasks/
        [id]/
          attendance/
            route.ts              ← GET + PUT attendance records (auto-calculates totals)
          wages/
            route.ts              ← GET + PUT wage records (auto-calculates via domain)
    forms/
      [taskId]/
        page.tsx                  ← server: loads task + cycle + employees + records
        form-entry-client.tsx     ← 'use client': Attendance tab + Wage Data tab

tests/
  domain/
    attendance-calculator.test.ts
    wage-calculator.test.ts
```

---

## Task 1: Domain Calculations

**Files:**
- Create: `src/domain/calculations/attendance-calculator.ts`
- Create: `src/domain/calculations/wage-calculator.ts`
- Create: `tests/domain/attendance-calculator.test.ts`
- Create: `tests/domain/wage-calculator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/domain/attendance-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateAttendanceTotals } from '@/domain/calculations/attendance-calculator'

describe('calculateAttendanceTotals', () => {
  it('counts P as daysWorked', () => {
    const r = calculateAttendanceTotals(['P', 'P', 'P'])
    expect(r.daysWorked).toBe(3)
    expect(r.wageDays).toBe(3)
    expect(r.leaveDays).toBe(0)
    expect(r.absentDays).toBe(0)
  })

  it('counts OT as daysWorked', () => {
    const r = calculateAttendanceTotals(['OT', 'OT'])
    expect(r.daysWorked).toBe(2)
    expect(r.wageDays).toBe(2)
  })

  it('counts H (holiday) as daysWorked', () => {
    const r = calculateAttendanceTotals(['H'])
    expect(r.daysWorked).toBe(1)
    expect(r.wageDays).toBe(1)
  })

  it('counts L as leaveDays (not daysWorked)', () => {
    const r = calculateAttendanceTotals(['L', 'L'])
    expect(r.daysWorked).toBe(0)
    expect(r.leaveDays).toBe(2)
    expect(r.wageDays).toBe(2)
  })

  it('counts A as absentDays — no wages', () => {
    const r = calculateAttendanceTotals(['A', 'A'])
    expect(r.absentDays).toBe(2)
    expect(r.wageDays).toBe(0)
  })

  it('ignores empty strings', () => {
    const r = calculateAttendanceTotals(['P', '', ''])
    expect(r.daysWorked).toBe(1)
    expect(r.absentDays).toBe(0)
  })

  it('wageDays = daysWorked + leaveDays (A does not contribute)', () => {
    const r = calculateAttendanceTotals(['P', 'P', 'L', 'A', 'H'])
    expect(r.daysWorked).toBe(3)
    expect(r.leaveDays).toBe(1)
    expect(r.absentDays).toBe(1)
    expect(r.wageDays).toBe(4)
  })

  it('handles empty array', () => {
    expect(calculateAttendanceTotals([])).toEqual({
      daysWorked: 0,
      leaveDays: 0,
      absentDays: 0,
      wageDays: 0,
    })
  })
})
```

Create `tests/domain/wage-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateWages } from '@/domain/calculations/wage-calculator'
import type { WageFormulaConfig } from '@/types'

const hospitalConfig: WageFormulaConfig = {
  preset: 'TN_MINIMUM_WAGES_HOSPITAL',
  fixedAllowance: 360,
}

const shopConfig: WageFormulaConfig = {
  preset: 'TN_SHOPS_ESTABLISHMENTS',
}

const baseInput = {
  basic: 5000,
  da: 1000,
  hra: 0,
  otherAllowances: 0,
  overtimeEarnings: 0,
  pf: 600,
  esi: 0,
  lwf: 10,
  advanceRecovered: 0,
  fineDeduction: 0,
  otherDeductions: 0,
}

describe('calculateWages — TN_MINIMUM_WAGES_HOSPITAL', () => {
  it('totalNormalWages = basic + da', () => {
    expect(calculateWages(hospitalConfig, baseInput).totalNormalWages).toBe(6000)
  })

  it('totalEarnings = basic + da + fixedAllowance', () => {
    expect(calculateWages(hospitalConfig, baseInput).totalEarnings).toBe(6360)
  })

  it('grossWages = totalEarnings + overtimeEarnings', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, overtimeEarnings: 500 })
    expect(r.grossWages).toBe(6860)
  })

  it('totalDeductions sums all deduction fields', () => {
    expect(calculateWages(hospitalConfig, baseInput).totalDeductions).toBe(610)
  })

  it('netWages = grossWages - totalDeductions', () => {
    expect(calculateWages(hospitalConfig, baseInput).netWages).toBe(5750)
  })

  it('uses zero fixedAllowance when not configured', () => {
    const r = calculateWages({ preset: 'TN_MINIMUM_WAGES_HOSPITAL' }, baseInput)
    expect(r.totalEarnings).toBe(6000)
  })
})

describe('calculateWages — TN_SHOPS_ESTABLISHMENTS', () => {
  it('totalEarnings includes hra + otherAllowances (ignores fixedAllowance)', () => {
    const r = calculateWages(shopConfig, { ...baseInput, hra: 800, otherAllowances: 200 })
    expect(r.totalEarnings).toBe(7000)
  })

  it('netWages calculated correctly for shop', () => {
    const r = calculateWages(shopConfig, { ...baseInput, hra: 1000 })
    expect(r.netWages).toBe(6390)
  })
})

describe('calculateWages — rounding', () => {
  it('rounds to 2 decimal places', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, basic: 5000.555, da: 1000 })
    expect(r.totalNormalWages).toBe(6000.56)
  })

  it('netWages cannot go negative if deductions exceed gross', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, pf: 9999 })
    expect(r.netWages).toBe(6360 - 9999 - 10)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run tests/domain/attendance-calculator.test.ts tests/domain/wage-calculator.test.ts
```

Expected: FAIL with module-not-found errors.

- [ ] **Step 3: Create `src/domain/calculations/attendance-calculator.ts`**

```typescript
export type DayMark = 'P' | 'A' | 'L' | 'H' | 'OT' | ''

export type AttendanceTotals = {
  daysWorked: number
  leaveDays: number
  absentDays: number
  wageDays: number
}

export function calculateAttendanceTotals(dailyMarks: string[]): AttendanceTotals {
  let daysWorked = 0
  let leaveDays = 0
  let absentDays = 0

  for (const mark of dailyMarks) {
    if (mark === 'P' || mark === 'OT' || mark === 'H') daysWorked++
    else if (mark === 'L') leaveDays++
    else if (mark === 'A') absentDays++
  }

  return { daysWorked, leaveDays, absentDays, wageDays: daysWorked + leaveDays }
}
```

- [ ] **Step 4: Create `src/domain/calculations/wage-calculator.ts`**

```typescript
import type { WageFormulaConfig } from '@/types'

export type WageInput = {
  basic: number
  da: number
  hra: number
  otherAllowances: number
  overtimeEarnings: number
  pf: number
  esi: number
  lwf: number
  advanceRecovered: number
  fineDeduction: number
  otherDeductions: number
}

export type WageCalcResult = {
  totalNormalWages: number
  totalEarnings: number
  grossWages: number
  totalDeductions: number
  netWages: number
}

export function calculateWages(config: WageFormulaConfig, input: WageInput): WageCalcResult {
  let totalNormalWages: number
  let totalEarnings: number
  let grossWages: number

  if (config.preset === 'TN_MINIMUM_WAGES_HOSPITAL') {
    const fixed = config.fixedAllowance ?? 0
    totalNormalWages = round2(input.basic + input.da)
    totalEarnings = round2(input.basic + input.da + fixed)
    grossWages = round2(totalEarnings + input.overtimeEarnings)
  } else {
    totalNormalWages = round2(input.basic + input.da)
    totalEarnings = round2(input.basic + input.da + input.hra + input.otherAllowances)
    grossWages = round2(totalEarnings + input.overtimeEarnings)
  }

  const totalDeductions = round2(
    input.pf + input.esi + input.lwf +
    input.advanceRecovered + input.fineDeduction + input.otherDeductions
  )

  return {
    totalNormalWages,
    totalEarnings,
    grossWages,
    totalDeductions,
    netWages: round2(grossWages - totalDeductions),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run tests/domain/attendance-calculator.test.ts tests/domain/wage-calculator.test.ts
```

Expected:
```
 ✓ tests/domain/attendance-calculator.test.ts (8)
 ✓ tests/domain/wage-calculator.test.ts (9)

 Test Files  2 passed (2)
 Tests  17 passed (17)
```

- [ ] **Step 6: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add src/domain/calculations/attendance-calculator.ts \
        src/domain/calculations/wage-calculator.ts \
        tests/domain/attendance-calculator.test.ts \
        tests/domain/wage-calculator.test.ts
git commit -m "$(cat <<'EOF'
feat: add attendance and wage calculation domain logic

calculateAttendanceTotals() counts P/OT/H as worked, L as leave, A as absent.
calculateWages() implements TN_MINIMUM_WAGES_HOSPITAL and TN_SHOPS_ESTABLISHMENTS
presets with configurable fixedAllowance/HRA. 17 unit tests pass.
EOF
)"
```

---

## Task 2: Attendance API Route

**Files:**
- Create: `src/app/api/form-tasks/[id]/attendance/route.ts`

- [ ] **Step 1: Create the attendance route**

Create `src/app/api/form-tasks/[id]/attendance/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAttendanceTotals } from '@/domain/calculations/attendance-calculator'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.attendanceRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })

    return NextResponse.json(
      records.map((r) => ({
        ...r,
        dailyMarks: JSON.parse(r.dailyMarks) as string[],
      }))
    )
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/attendance failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type AttendanceRecordInput = {
  employeeId: string
  workStartTime?: string
  workEndTime?: string
  restInterval?: string
  dailyMarks: string[]
  remarks?: string
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { records?: AttendanceRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const updated = await Promise.all(
      b.records.map((r) => {
        const totals = calculateAttendanceTotals(r.dailyMarks)
        const data = {
          workStartTime: r.workStartTime?.trim() ?? null,
          workEndTime: r.workEndTime?.trim() ?? null,
          restInterval: r.restInterval?.trim() ?? null,
          dailyMarks: JSON.stringify(r.dailyMarks),
          daysWorked: totals.daysWorked,
          leaveDays: totals.leaveDays,
          absentDays: totals.absentDays,
          wageDays: totals.wageDays,
          remarks: r.remarks?.trim() ?? null,
        }
        return prisma.attendanceRecord.upsert({
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

    return NextResponse.json(
      updated.map((r) => ({ ...r, dailyMarks: JSON.parse(r.dailyMarks) as string[] }))
    )
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/attendance failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add "src/app/api/form-tasks/[id]/attendance/route.ts"
git commit -m "$(cat <<'EOF'
feat: add GET + PUT /api/form-tasks/[id]/attendance route

Upserts AttendanceRecord per cycle×employee, auto-calculates daysWorked /
leaveDays / absentDays / wageDays from dailyMarks using the domain function.
EOF
)"
```

---

## Task 3: Wages API Route

**Files:**
- Create: `src/app/api/form-tasks/[id]/wages/route.ts`

- [ ] **Step 1: Create the wages route**

Create `src/app/api/form-tasks/[id]/wages/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateWages } from '@/domain/calculations/wage-calculator'
import type { WageFormulaConfig } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.wageRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })

    return NextResponse.json(
      records.map((r) => ({
        ...r,
        otherAllowances: Number(JSON.parse(r.otherAllowances)[0] ?? 0),
      }))
    )
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/wages failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type WageRecordInput = {
  employeeId: string
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  pf: number
  esi: number
  lwf: number
  advanceRecovered: number
  fineDeduction: number
  otherDeductions: number
  paymentDate?: string
  receiptRef?: string
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params

    const formTask = await prisma.formTask.findUnique({
      where: { id },
      include: { cycle: { include: { establishment: true } } },
    })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { records?: WageRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const config = JSON.parse(
      formTask.cycle.establishment.wageFormulaConfig
    ) as WageFormulaConfig

    const updated = await Promise.all(
      b.records.map(async (r) => {
        // overtimeEarnings comes from OvertimeRecord (Plan 4); 0 for now
        const otRec = await prisma.overtimeRecord.findUnique({
          where: {
            cycleId_employeeId: {
              cycleId: formTask.cycleId,
              employeeId: r.employeeId,
            },
          },
        })
        const overtimeEarnings = otRec?.totalEarnings ?? 0

        const calc = calculateWages(config, {
          basic: r.basic,
          da: r.da,
          hra: r.hra,
          otherAllowances: r.otherAllowances,
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

    return NextResponse.json(
      updated.map((r) => ({
        ...r,
        otherAllowances: Number(JSON.parse(r.otherAllowances)[0] ?? 0),
      }))
    )
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/wages failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add "src/app/api/form-tasks/[id]/wages/route.ts"
git commit -m "$(cat <<'EOF'
feat: add GET + PUT /api/form-tasks/[id]/wages route

Upserts WageRecord per cycle×employee. Auto-calculates totalNormalWages,
totalEarnings, grossWages, totalDeductions, netWages using the establishment's
wageFormulaConfig preset. OT earnings sourced from OvertimeRecord if present.
EOF
)"
```

---

## Task 4: Form Entry UI

**Files:**
- Create: `src/app/forms/[taskId]/form-entry-client.tsx`
- Create: `src/app/forms/[taskId]/page.tsx`

- [ ] **Step 1: Create `src/app/forms/[taskId]/form-entry-client.tsx`**

```tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { calculateWages } from '@/domain/calculations/wage-calculator'
import type { WageFormulaConfig } from '@/types'

type Employee = { employeeId: string; empId: string; name: string }

type AttendanceRow = {
  marks: string[]
  workStartTime: string
  workEndTime: string
  restInterval: string
  remarks: string
}

type WageRow = {
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  pf: number
  esi: number
  lwf: number
  advanceRecovered: number
  fineDeduction: number
  otherDeductions: number
  paymentDate: string
  receiptRef: string
}

type Props = {
  formTaskId: string
  formTaskStatus: string
  month: number
  year: number
  daysInMonth: number
  employees: Employee[]
  formulaConfig: WageFormulaConfig
  isHospital: boolean
  initialAttendance: Record<string, AttendanceRow>
  initialWages: Record<string, WageRow>
}

const MARK_CYCLE: Record<string, string> = {
  '': 'P', P: 'A', A: 'L', L: 'H', H: 'OT', OT: '',
}

const MARK_STYLE: Record<string, string> = {
  P:   'bg-[#0f2a1a] text-[#40c070]',
  A:   'bg-[#2a1010] text-[#f07070]',
  L:   'bg-[#1a2a50] text-[#4a9eff]',
  H:   'bg-[#2a2010] text-[#c0a040]',
  OT:  'bg-[#1a0f2a] text-[#c087f0]',
  '':  'bg-[#0f1923] text-[#2a3a4a]',
}

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

function numInput(value: number, onChange: (v: number) => void) {
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-20 bg-[#1a2a3a] border border-[#2a3a50] rounded px-1 py-0.5 text-xs text-[#c8d8e8] text-right"
    />
  )
}

export function FormEntryClient({
  formTaskId,
  formTaskStatus,
  month,
  year,
  daysInMonth,
  employees,
  formulaConfig,
  isHospital,
  initialAttendance,
  initialWages,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'attendance' | 'wages'>('attendance')
  const [attendance, setAttendance] = useState<Record<string, AttendanceRow>>(initialAttendance)
  const [wages, setWages] = useState<Record<string, WageRow>>(initialWages)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const toggleMark = useCallback((employeeId: string, dayIndex: number) => {
    setAttendance((prev) => {
      const row = prev[employeeId]
      const newMarks = [...row.marks]
      newMarks[dayIndex] = MARK_CYCLE[newMarks[dayIndex] ?? ''] ?? 'P'
      return { ...prev, [employeeId]: { ...row, marks: newMarks } }
    })
  }, [])

  const setAttendanceField = useCallback(
    (employeeId: string, field: keyof AttendanceRow, value: string) => {
      setAttendance((prev) => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], [field]: value },
      }))
    },
    []
  )

  const setWageField = useCallback(
    (employeeId: string, field: keyof WageRow, value: number | string) => {
      setWages((prev) => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], [field]: value },
      }))
    },
    []
  )

  async function saveAttendance() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => {
          const row = attendance[emp.employeeId]
          return {
            employeeId: emp.employeeId,
            marks: row.marks,
            dailyMarks: row.marks,
            workStartTime: row.workStartTime || undefined,
            workEndTime: row.workEndTime || undefined,
            restInterval: row.restInterval || undefined,
            remarks: row.remarks || undefined,
          }
        }),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function saveWages() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/wages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => ({
          employeeId: emp.employeeId,
          ...wages[emp.employeeId],
        })),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function moveToReview() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'READY_FOR_REVIEW' }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setErrors(data.errors ?? [data.error ?? 'Transition failed'])
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const tabClass = (t: string) =>
    `px-4 py-1.5 text-xs font-medium rounded-t ${
      tab === t
        ? 'bg-[#0f1923] text-white border-b-2 border-[#4a9eff]'
        : 'text-[#5a8ab8] hover:text-white'
    }`

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 border-b border-[#1e2d3d]">
        <button className={tabClass('attendance')} onClick={() => setTab('attendance')}>
          Attendance
        </button>
        <button className={tabClass('wages')} onClick={() => setTab('wages')}>
          Wage Data
        </button>
      </div>

      {/* Error banner */}
      {errors.length > 0 && (
        <div className="mx-4 mt-3 bg-[#2a1010] border border-[#5a2020] rounded p-2 text-xs text-[#f07070]">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-[#5a8ab8]">
              Click a cell to cycle: — → P → A → L → H → OT → —
            </span>
            <span className="text-[10px] text-[#4a6a8a]">
              P=Present A=Absent L=Leave H=Holiday OT=Overtime
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium w-36">
                    Employee
                  </th>
                  {days.map((d) => (
                    <th key={d} className="px-0 py-1.5 text-[#5a8ab8] font-medium w-8 text-center">
                      {d}
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-center">Wkd</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-center">Lv</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-center">Ab</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-center">Wage</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium w-20">Start</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium w-20">End</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const row = attendance[emp.employeeId]
                  let daysWorked = 0, leaveDays = 0, absentDays = 0
                  for (const m of row.marks) {
                    if (m === 'P' || m === 'OT' || m === 'H') daysWorked++
                    else if (m === 'L') leaveDays++
                    else if (m === 'A') absentDays++
                  }
                  const wageDays = daysWorked + leaveDays
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 font-medium text-white w-36">
                        <div className="truncate max-w-[130px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                      </td>
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
                      <td className="px-2 py-1 text-center text-[#40c070]">{daysWorked}</td>
                      <td className="px-2 py-1 text-center text-[#4a9eff]">{leaveDays}</td>
                      <td className="px-2 py-1 text-center text-[#f07070]">{absentDays}</td>
                      <td className="px-2 py-1 text-center font-medium text-white">{wageDays}</td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          placeholder="09:00"
                          value={row.workStartTime}
                          onChange={(e) => setAttendanceField(emp.employeeId, 'workStartTime', e.target.value)}
                          className="w-16 bg-[#1a2a3a] border border-[#2a3a50] rounded px-1 py-0.5 text-xs text-[#c8d8e8]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          placeholder="18:00"
                          value={row.workEndTime}
                          onChange={(e) => setAttendanceField(emp.employeeId, 'workEndTime', e.target.value)}
                          className="w-16 bg-[#1a2a3a] border border-[#2a3a50] rounded px-1 py-0.5 text-xs text-[#c8d8e8]"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {/* Wage Data Tab */}
      {tab === 'wages' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium w-36">
                    Employee
                  </th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Days</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Basic</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">DA</th>
                  {!isHospital && (
                    <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">HRA</th>
                  )}
                  {!isHospital && (
                    <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Other</th>
                  )}
                  <th className="px-1 py-1.5 text-[#40c070] font-medium text-right">Gross</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">PF</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">ESI</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">LWF</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Adv</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Fine</th>
                  <th className="px-1 py-1.5 text-[#40c070] font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const w = wages[emp.employeeId]
                  const calc = calculateWages(formulaConfig, {
                    basic: w.basic,
                    da: w.da,
                    hra: w.hra,
                    otherAllowances: w.otherAllowances,
                    overtimeEarnings: 0,
                    pf: w.pf,
                    esi: w.esi,
                    lwf: w.lwf,
                    advanceRecovered: w.advanceRecovered,
                    fineDeduction: w.fineDeduction,
                    otherDeductions: w.otherDeductions,
                  })
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 font-medium text-white w-36">
                        <div className="truncate max-w-[130px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.daysWorked, (v) => setWageField(emp.employeeId, 'daysWorked', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.basic, (v) => setWageField(emp.employeeId, 'basic', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.da, (v) => setWageField(emp.employeeId, 'da', v))}
                      </td>
                      {!isHospital && (
                        <td className="px-1 py-1">
                          {numInput(w.hra, (v) => setWageField(emp.employeeId, 'hra', v))}
                        </td>
                      )}
                      {!isHospital && (
                        <td className="px-1 py-1">
                          {numInput(w.otherAllowances, (v) => setWageField(emp.employeeId, 'otherAllowances', v))}
                        </td>
                      )}
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">
                        {calc.grossWages.toFixed(2)}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.pf, (v) => setWageField(emp.employeeId, 'pf', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.esi, (v) => setWageField(emp.employeeId, 'esi', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.lwf, (v) => setWageField(emp.employeeId, 'lwf', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.advanceRecovered, (v) => setWageField(emp.employeeId, 'advanceRecovered', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.fineDeduction, (v) => setWageField(emp.employeeId, 'fineDeduction', v))}
                      </td>
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">
                        {calc.netWages.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={saveWages}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Wage Data'}
            </button>
          </div>
        </div>
      )}

      {/* Footer toolbar */}
      <div className="border-t border-[#1e2d3d] px-4 py-2 flex items-center justify-between bg-[#0d1620]">
        <span className="text-[10px] text-[#4a6a8a]">
          Status: <span className="text-[#c8d8e8]">{formTaskStatus.replace(/_/g, ' ')}</span>
        </span>
        <div className="flex gap-2">
          {formTaskStatus === 'NOT_STARTED' && (
            <button
              onClick={async () => {
                setSaving(true)
                setErrors([])
                const res = await fetch(`/api/form-tasks/${formTaskId}/transition`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ to: 'DATA_ENTRY' }),
                })
                setSaving(false)
                if (!res.ok) {
                  const d = await res.json()
                  setErrors(d.errors ?? [d.error ?? 'Failed'])
                } else {
                  router.refresh()
                }
              }}
              disabled={saving}
              className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060] disabled:opacity-50"
            >
              Start Entry
            </button>
          )}
          {formTaskStatus === 'DATA_ENTRY' && (
            <button
              onClick={moveToReview}
              disabled={saving}
              className="px-3 py-1 bg-[#1a4020] text-[#40c070] text-xs rounded hover:bg-[#1a5030] disabled:opacity-50"
            >
              Move to Review
            </button>
          )}
          {formTaskStatus === 'NEEDS_CORRECTION' && (
            <button
              onClick={async () => {
                setSaving(true)
                setErrors([])
                const res = await fetch(`/api/form-tasks/${formTaskId}/transition`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ to: 'DATA_ENTRY' }),
                })
                setSaving(false)
                if (!res.ok) {
                  const d = await res.json()
                  setErrors(d.errors ?? [d.error ?? 'Failed'])
                } else {
                  router.refresh()
                }
              }}
              disabled={saving}
              className="px-3 py-1 bg-[#2a1010] text-[#f07070] text-xs rounded hover:bg-[#3a1010] disabled:opacity-50"
            >
              Reopen for Entry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/forms/[taskId]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode, WageFormulaConfig } from '@/types'
import { FormEntryClient } from './form-entry-client'

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export default async function FormEntryPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  const formTask = await prisma.formTask.findUnique({
    where: { id: taskId },
    include: {
      cycle: {
        include: {
          establishment: {
            select: { name: true, type: true, wageFormulaConfig: true },
          },
          cycleEmployees: {
            include: {
              employee: { select: { empId: true, name: true } },
            },
            orderBy: { employee: { name: 'asc' } },
          },
        },
      },
    },
  })

  if (!formTask) notFound()

  const { cycle } = formTask
  const { establishment } = cycle
  const isHospital = establishment.type === 'HOSPITAL'
  const formulaConfig = JSON.parse(establishment.wageFormulaConfig) as WageFormulaConfig
  const daysInMonth = getDaysInMonth(cycle.year, cycle.month)

  const employees = cycle.cycleEmployees.map((ce) => {
    const snap = JSON.parse(ce.empDataSnapshot) as { empId?: string; name?: string }
    return {
      employeeId: ce.employeeId,
      empId: snap.empId ?? ce.employee.empId,
      name: snap.name ?? ce.employee.name,
    }
  })

  const existingAttendance = await prisma.attendanceRecord.findMany({
    where: { cycleId: cycle.id },
  })

  const existingWages = await prisma.wageRecord.findMany({
    where: { cycleId: cycle.id },
  })

  // Build initial state maps keyed by employeeId
  const initialAttendance = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingAttendance.find((r) => r.employeeId === emp.employeeId)
      const marks = rec ? (JSON.parse(rec.dailyMarks) as string[]) : Array(daysInMonth).fill('')
      return [
        emp.employeeId,
        {
          marks: marks.length >= daysInMonth ? marks : [...marks, ...Array(daysInMonth - marks.length).fill('')],
          workStartTime: rec?.workStartTime ?? '',
          workEndTime: rec?.workEndTime ?? '',
          restInterval: rec?.restInterval ?? '',
          remarks: rec?.remarks ?? '',
        },
      ]
    })
  )

  const initialWages = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingWages.find((r) => r.employeeId === emp.employeeId)
      const attRec = existingAttendance.find((r) => r.employeeId === emp.employeeId)
      return [
        emp.employeeId,
        {
          daysWorked: rec?.daysWorked ?? attRec?.wageDays ?? 0,
          basic: rec?.basic ?? 0,
          da: rec?.da ?? 0,
          hra: rec?.hra ?? 0,
          otherAllowances: rec ? Number(JSON.parse(rec.otherAllowances)[0] ?? 0) : 0,
          pf: rec?.pf ?? 0,
          esi: rec?.esi ?? 0,
          lwf: rec?.lwf ?? 0,
          advanceRecovered: rec?.advanceRecovered ?? 0,
          fineDeduction: rec?.fineDeduction ?? 0,
          otherDeductions: rec?.otherDeductions ?? 0,
          paymentDate: rec?.paymentDate ? new Date(rec.paymentDate).toISOString().split('T')[0] : '',
          receiptRef: rec?.receiptRef ?? '',
        },
      ]
    })
  )

  const display = FORM_DISPLAY_NAMES[formTask.formCode as FormCode]
  const periodLabel = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-3 border-b border-[#1e2d3d] bg-[#0f1923]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-white">
              {display?.name ?? formTask.formCode}
            </h1>
            <p className="text-xs text-[#5a8ab8] mt-0.5">
              {establishment.name} · {periodLabel} · {display?.ref}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#4a6a8a]">Preset</p>
            <p className="text-xs text-[#c8d8e8]">{formulaConfig.preset}</p>
          </div>
        </div>
      </div>

      <FormEntryClient
        formTaskId={taskId}
        formTaskStatus={formTask.status}
        month={cycle.month}
        year={cycle.year}
        daysInMonth={daysInMonth}
        employees={employees}
        formulaConfig={formulaConfig}
        isHospital={isHospital}
        initialAttendance={initialAttendance}
        initialWages={initialWages}
      />
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run all tests**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run
```

Expected:
```
 ✓ tests/domain/cycle.test.ts (8)
 ✓ tests/domain/kanban-transitions.test.ts (14)
 ✓ tests/domain/attendance-calculator.test.ts (8)
 ✓ tests/domain/wage-calculator.test.ts (9)

 Test Files  4 passed (4)
 Tests  39 passed (39)
```

- [ ] **Step 5: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add "src/app/forms/[taskId]/form-entry-client.tsx" \
        "src/app/forms/[taskId]/page.tsx"
git commit -m "$(cat <<'EOF'
feat: add /forms/[taskId] data entry page with Attendance and Wage Data tabs

Server page loads cycle employees, attendance and wage records. Client
component renders a clickable 31-day grid for attendance marks (P/A/L/H/OT)
and an editable numeric grid for wages with real-time calculated fields.
Footer toolbar handles NOT_STARTED→DATA_ENTRY→READY_FOR_REVIEW transitions.
EOF
)"
```

---

## Verification

After all 4 tasks are complete:

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app

# All tests pass
npx vitest run

# TypeScript clean
npx tsc --noEmit

# Build succeeds
npx next build 2>&1 | tail -20
```

**Expected state after Plan 3:**
- `GET /forms/[taskId]` — data entry page with Attendance + Wage Data tabs
- `GET /api/form-tasks/[id]/attendance` — returns attendance records for cycle
- `PUT /api/form-tasks/[id]/attendance` — upserts with auto-calculated totals
- `GET /api/form-tasks/[id]/wages` — returns wage records for cycle
- `PUT /api/form-tasks/[id]/wages` — upserts with auto-calculated derived fields
- 39 unit tests passing (8 cycle + 14 kanban + 8 attendance + 9 wage)
- Kanban cards at `/` link to `/forms/[taskId]` and work end-to-end

**Workflow smoke test:**
1. `GET /` — Kanban board (empty if no cycles)
2. `POST /api/cycles` — creates cycle with employees + form tasks
3. `GET /` — shows form task cards in NOT_STARTED column
4. Click a card → `/forms/[taskId]` opens
5. Click "Start Entry" → card moves to DATA_ENTRY
6. Enter attendance marks, click "Save Attendance"
7. Switch to Wage Data tab, enter basic/DA/deductions, click "Save Wage Data"
8. Click "Move to Review" → card moves to READY_FOR_REVIEW
