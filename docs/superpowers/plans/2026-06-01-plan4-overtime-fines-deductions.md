# Labour Record — Plan 4: Overtime, Fines, Deductions & Leave

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add overtime daily-hours grid, fine records, deduction records, and leave records — all with APIs and new tabs in the form entry page.

**Architecture:** OvertimeRecord follows the same upsert pattern as AttendanceRecord (one per cycle×employee, `@@unique`). FineRecord and DeductionRecord are multi-row per employee (no unique constraint) — use POST to create, DELETE to remove. LeaveRecord is upsert like attendance. The wages API already reads OvertimeRecord.totalEarnings — no change needed there.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7, SQLite, Vitest

**Previous plan:** Plan 3 — Core Monthly Data Entry (complete)
**Next plan:** Plan 5 — Export Pipeline (DOCX + PDF + print views)

---

## File Map

```
src/
  domain/
    calculations/
      overtime-calculator.ts     ← calculateOvertimeTotals() — pure
      leave-calculator.ts        ← calculateEarnedLeaveClosing() — pure
  app/
    api/
      form-tasks/
        [id]/
          overtime/
            route.ts             ← GET + PUT overtime records (auto-calculates)
          fines/
            route.ts             ← GET + POST fine records for cycle
          deductions/
            route.ts             ← GET + POST deduction records for cycle
          leave/
            route.ts             ← GET + PUT leave records (upsert, auto-calculates closing)
      fine-records/
        [fineId]/
          route.ts               ← DELETE a fine record
      deduction-records/
        [deductionId]/
          route.ts               ← DELETE a deduction record
    forms/
      [taskId]/
        form-entry-client.tsx    ← MODIFY: add Overtime, Fines, Deductions, Leave tabs
        page.tsx                 ← MODIFY: load initial OT/fines/deductions/leave data

tests/
  domain/
    overtime-calculator.test.ts
    leave-calculator.test.ts
```

---

## Task 1: Domain Calculations

**Files:**
- Create: `src/domain/calculations/overtime-calculator.ts`
- Create: `src/domain/calculations/leave-calculator.ts`
- Create: `tests/domain/overtime-calculator.test.ts`
- Create: `tests/domain/leave-calculator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/domain/overtime-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateOvertimeTotals } from '@/domain/calculations/overtime-calculator'

describe('calculateOvertimeTotals', () => {
  it('sums daily OT hours', () => {
    expect(calculateOvertimeTotals([2, 3, 0, 1.5], 0, 0).totalOtHours).toBe(6.5)
  })

  it('ignores negative values', () => {
    expect(calculateOvertimeTotals([-1, 2, 3], 0, 0).totalOtHours).toBe(5)
  })

  it('calculates otEarnings = totalOtHours × otRate', () => {
    expect(calculateOvertimeTotals([2, 3], 0, 100).otEarnings).toBe(500)
  })

  it('totalEarnings = normalEarnings + otEarnings', () => {
    expect(calculateOvertimeTotals([2], 1000, 100).totalEarnings).toBe(1200)
  })

  it('handles empty array', () => {
    expect(calculateOvertimeTotals([], 0, 100)).toEqual({
      totalOtHours: 0,
      otEarnings: 0,
      totalEarnings: 0,
    })
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateOvertimeTotals([0.005], 0, 1).otEarnings).toBe(0.01)
  })

  it('normalEarnings of zero keeps totalEarnings = otEarnings', () => {
    const r = calculateOvertimeTotals([4], 0, 50)
    expect(r.otEarnings).toBe(200)
    expect(r.totalEarnings).toBe(200)
  })
})
```

Create `tests/domain/leave-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateEarnedLeaveClosing } from '@/domain/calculations/leave-calculator'

describe('calculateEarnedLeaveClosing', () => {
  it('closing = opening + during - availed', () => {
    expect(calculateEarnedLeaveClosing(10, 2, 5)).toBe(7)
  })

  it('closing is zero when availed exceeds accrued', () => {
    expect(calculateEarnedLeaveClosing(5, 0, 8)).toBe(0)
  })

  it('closing is zero when all leave is used', () => {
    expect(calculateEarnedLeaveClosing(10, 2, 12)).toBe(0)
  })

  it('opening only — no during or availed', () => {
    expect(calculateEarnedLeaveClosing(15, 0, 0)).toBe(15)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run tests/domain/overtime-calculator.test.ts tests/domain/leave-calculator.test.ts
```

Expected: FAIL with module-not-found errors.

- [ ] **Step 3: Create `src/domain/calculations/overtime-calculator.ts`**

```typescript
export type OvertimeTotals = {
  totalOtHours: number
  otEarnings: number
  totalEarnings: number
}

export function calculateOvertimeTotals(
  dailyOt: number[],
  normalEarnings: number,
  otRate: number
): OvertimeTotals {
  const totalOtHours = round2(dailyOt.reduce((sum, h) => sum + Math.max(0, h), 0))
  const otEarnings = round2(totalOtHours * otRate)
  return { totalOtHours, otEarnings, totalEarnings: round2(normalEarnings + otEarnings) }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
```

- [ ] **Step 4: Create `src/domain/calculations/leave-calculator.ts`**

```typescript
export function calculateEarnedLeaveClosing(
  opening: number,
  during: number,
  availed: number
): number {
  return Math.max(0, opening + during - availed)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run tests/domain/overtime-calculator.test.ts tests/domain/leave-calculator.test.ts
```

Expected:
```
 ✓ tests/domain/overtime-calculator.test.ts (7)
 ✓ tests/domain/leave-calculator.test.ts (4)

 Test Files  2 passed (2)
 Tests  11 passed (11)
```

- [ ] **Step 6: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add src/domain/calculations/overtime-calculator.ts \
        src/domain/calculations/leave-calculator.ts \
        tests/domain/overtime-calculator.test.ts \
        tests/domain/leave-calculator.test.ts
git commit -m "$(cat <<'EOF'
feat: add overtime and leave calculation domain logic

calculateOvertimeTotals() sums daily OT hours, computes otEarnings = hours × rate.
calculateEarnedLeaveClosing() clamps closing balance to zero minimum.
11 unit tests pass.
EOF
)"
```

---

## Task 2: Overtime API Route

**Files:**
- Create: `src/app/api/form-tasks/[id]/overtime/route.ts`

- [ ] **Step 1: Create the overtime route**

Create `src/app/api/form-tasks/[id]/overtime/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateOvertimeTotals } from '@/domain/calculations/overtime-calculator'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.overtimeRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })

    return NextResponse.json(
      records.map((r) => ({
        ...r,
        dailyOt: JSON.parse(r.dailyOt) as number[],
      }))
    )
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/overtime failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type OtRecordInput = {
  employeeId: string
  dailyOt: number[]
  normalHoursRate: number
  otRate: number
  normalEarnings: number
  paymentDate?: string
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

    const b = body as { records?: OtRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const updated = await Promise.all(
      b.records.map((r) => {
        const calc = calculateOvertimeTotals(r.dailyOt, r.normalEarnings, r.otRate)
        const data = {
          dailyOt: JSON.stringify(r.dailyOt),
          normalHoursRate: r.normalHoursRate,
          otRate: r.otRate,
          normalEarnings: r.normalEarnings,
          totalOtHours: calc.totalOtHours,
          otEarnings: calc.otEarnings,
          totalEarnings: calc.totalEarnings,
          paymentDate: r.paymentDate ? new Date(r.paymentDate) : null,
        }
        return prisma.overtimeRecord.upsert({
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
      updated.map((r) => ({ ...r, dailyOt: JSON.parse(r.dailyOt) as number[] }))
    )
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/overtime failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add "src/app/api/form-tasks/[id]/overtime/route.ts"
git commit -m "$(cat <<'EOF'
feat: add GET + PUT /api/form-tasks/[id]/overtime route

Upserts OvertimeRecord per cycle×employee. Auto-calculates totalOtHours,
otEarnings (hours × rate), totalEarnings (normalEarnings + otEarnings).
EOF
)"
```

---

## Task 3: Fines & Deductions API Routes

**Files:**
- Create: `src/app/api/form-tasks/[id]/fines/route.ts`
- Create: `src/app/api/fine-records/[fineId]/route.ts`
- Create: `src/app/api/form-tasks/[id]/deductions/route.ts`
- Create: `src/app/api/deduction-records/[deductionId]/route.ts`

- [ ] **Step 1: Create `src/app/api/form-tasks/[id]/fines/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.fineRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { offenceDate: 'asc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/fines failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
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

    const b = body as {
      employeeId?: string
      offenceDate?: string
      offenceDescription?: string
      showCauseDate?: string
      wagePeriod?: string
      wagesOnDate?: number
      fineAmount?: number
      recovered?: number
      pendingRecovery?: number
      remarks?: string
    }

    if (!b.employeeId?.trim()) {
      return NextResponse.json({ errors: ['employeeId is required'] }, { status: 422 })
    }
    if (!b.offenceDate) {
      return NextResponse.json({ errors: ['offenceDate is required'] }, { status: 422 })
    }
    if (!b.offenceDescription?.trim()) {
      return NextResponse.json({ errors: ['offenceDescription is required'] }, { status: 422 })
    }

    const record = await prisma.fineRecord.create({
      data: {
        cycleId: formTask.cycleId,
        employeeId: b.employeeId,
        offenceDate: new Date(b.offenceDate),
        offenceDescription: b.offenceDescription,
        showCauseDate: b.showCauseDate ? new Date(b.showCauseDate) : null,
        wagePeriod: b.wagePeriod?.trim() ?? null,
        wagesOnDate: b.wagesOnDate ?? 0,
        fineAmount: b.fineAmount ?? 0,
        recovered: b.recovered ?? 0,
        pendingRecovery: b.pendingRecovery ?? 0,
        remarks: b.remarks?.trim() ?? null,
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST /api/form-tasks/[id]/fines failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create `src/app/api/fine-records/[fineId]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ fineId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { fineId } = await params
    const record = await prisma.fineRecord.findUnique({ where: { id: fineId } })
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.fineRecord.delete({ where: { id: fineId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/fine-records/[fineId] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create `src/app/api/form-tasks/[id]/deductions/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.deductionRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { damageDate: 'asc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/deductions failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
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

    const b = body as {
      employeeId?: string
      damageDate?: string
      description?: string
      damageAmount?: number
      deductionAmount?: number
      recovered?: number
      pendingRecovery?: number
      remarks?: string
    }

    if (!b.employeeId?.trim()) {
      return NextResponse.json({ errors: ['employeeId is required'] }, { status: 422 })
    }
    if (!b.damageDate) {
      return NextResponse.json({ errors: ['damageDate is required'] }, { status: 422 })
    }
    if (!b.description?.trim()) {
      return NextResponse.json({ errors: ['description is required'] }, { status: 422 })
    }

    const record = await prisma.deductionRecord.create({
      data: {
        cycleId: formTask.cycleId,
        employeeId: b.employeeId,
        damageDate: new Date(b.damageDate),
        description: b.description,
        damageAmount: b.damageAmount ?? 0,
        deductionAmount: b.deductionAmount ?? 0,
        recovered: b.recovered ?? 0,
        pendingRecovery: b.pendingRecovery ?? 0,
        remarks: b.remarks?.trim() ?? null,
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST /api/form-tasks/[id]/deductions failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create `src/app/api/deduction-records/[deductionId]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ deductionId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { deductionId } = await params
    const record = await prisma.deductionRecord.findUnique({ where: { id: deductionId } })
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.deductionRecord.delete({ where: { id: deductionId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/deduction-records/[deductionId] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add "src/app/api/form-tasks/[id]/fines/route.ts" \
        "src/app/api/fine-records/[fineId]/route.ts" \
        "src/app/api/form-tasks/[id]/deductions/route.ts" \
        "src/app/api/deduction-records/[deductionId]/route.ts"
git commit -m "$(cat <<'EOF'
feat: add fines and deductions API routes

GET + POST /api/form-tasks/[id]/fines — list and create fine records per cycle.
GET + POST /api/form-tasks/[id]/deductions — list and create deduction records.
DELETE /api/fine-records/[fineId] and /api/deduction-records/[deductionId].
EOF
)"
```

---

## Task 4: Leave API Route

**Files:**
- Create: `src/app/api/form-tasks/[id]/leave/route.ts`

- [ ] **Step 1: Create the leave route**

Create `src/app/api/form-tasks/[id]/leave/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateEarnedLeaveClosing } from '@/domain/calculations/leave-calculator'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.leaveRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/leave failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type LeaveRecordInput = {
  employeeId: string
  earnedLeaveOpening: number
  earnedDuring: number
  earnedAvailed: number
  medicalLeave: number
  otherLeave: number
  maternityInfo?: string
  gratuityInfo?: string
  nominationInfo?: string
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

    const b = body as { records?: LeaveRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const updated = await Promise.all(
      b.records.map((r) => {
        const earnedClosing = calculateEarnedLeaveClosing(
          r.earnedLeaveOpening,
          r.earnedDuring,
          r.earnedAvailed
        )
        const data = {
          earnedLeaveOpening: r.earnedLeaveOpening,
          earnedDuring: r.earnedDuring,
          earnedAvailed: r.earnedAvailed,
          earnedClosing,
          medicalLeave: r.medicalLeave,
          otherLeave: r.otherLeave,
          maternityInfo: r.maternityInfo?.trim() ?? null,
          gratuityInfo: r.gratuityInfo?.trim() ?? null,
          nominationInfo: r.nominationInfo?.trim() ?? null,
          remarks: r.remarks?.trim() ?? null,
        }
        return prisma.leaveRecord.upsert({
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/leave failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add "src/app/api/form-tasks/[id]/leave/route.ts"
git commit -m "$(cat <<'EOF'
feat: add GET + PUT /api/form-tasks/[id]/leave route

Upserts LeaveRecord per cycle×employee. Auto-calculates earnedClosing =
max(0, opening + during - availed) using the domain function.
EOF
)"
```

---

## Task 5: UI — Add Overtime, Fines, Deductions & Leave Tabs

**Files:**
- Modify: `src/app/forms/[taskId]/form-entry-client.tsx`
- Modify: `src/app/forms/[taskId]/page.tsx`

The existing client component has tabs `'attendance' | 'wages'`. This task extends it with 4 more tabs.

### Changes to `form-entry-client.tsx`

- [ ] **Step 1: Add new types and initial state structures**

Add these types after the existing `WageRow` type definition:

```typescript
type OtRow = {
  dailyOt: number[]
  normalHoursRate: number
  otRate: number
  normalEarnings: number
}

type FineEntry = {
  id: string
  employeeId: string
  employeeName: string
  offenceDate: string
  offenceDescription: string
  fineAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

type DeductionEntry = {
  id: string
  employeeId: string
  employeeName: string
  damageDate: string
  description: string
  deductionAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

type LeaveRow = {
  earnedLeaveOpening: number
  earnedDuring: number
  earnedAvailed: number
  medicalLeave: number
  otherLeave: number
  remarks: string
}
```

- [ ] **Step 2: Extend Props type**

After the existing `initialWages` prop, add:

```typescript
  initialOt: Record<string, OtRow>
  initialFines: FineEntry[]
  initialDeductions: DeductionEntry[]
  initialLeave: Record<string, LeaveRow>
```

- [ ] **Step 3: Add state variables and handlers**

After the existing `setErrors` state, add:

```typescript
  const [ot, setOt] = useState<Record<string, OtRow>>(initialOt)
  const [fines, setFines] = useState<FineEntry[]>(initialFines)
  const [deductions, setDeductions] = useState<DeductionEntry[]>(initialDeductions)
  const [leave, setLeave] = useState<Record<string, LeaveRow>>(initialLeave)
  const [newFine, setNewFine] = useState({ employeeId: '', offenceDate: '', offenceDescription: '', fineAmount: 0 })
  const [newDeduction, setNewDeduction] = useState({ employeeId: '', damageDate: '', description: '', deductionAmount: 0 })
```

Add these handler functions after the existing `saveWages` and `transition` functions:

```typescript
  const setOtField = useCallback(
    (employeeId: string, field: keyof OtRow, value: number | number[]) => {
      setOt((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [field]: value } }))
    },
    []
  )

  const setOtDay = useCallback((employeeId: string, dayIndex: number, value: number) => {
    setOt((prev) => {
      const row = prev[employeeId]
      const newDailyOt = [...row.dailyOt]
      newDailyOt[dayIndex] = Math.max(0, value)
      return { ...prev, [employeeId]: { ...row, dailyOt: newDailyOt } }
    })
  }, [])

  const setLeaveField = useCallback(
    (employeeId: string, field: keyof LeaveRow, value: number | string) => {
      setLeave((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [field]: value } }))
    },
    []
  )

  async function saveOt() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/overtime`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => ({
          employeeId: emp.employeeId,
          ...ot[emp.employeeId],
        })),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function saveLeave() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/leave`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => ({
          employeeId: emp.employeeId,
          ...leave[emp.employeeId],
        })),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function addFine() {
    if (!newFine.employeeId || !newFine.offenceDate || !newFine.offenceDescription) {
      setErrors(['Employee, offence date, and description are required'])
      return
    }
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/fines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFine),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Add failed'])
    } else {
      const created = await res.json() as { id: string }
      const emp = employees.find((e) => e.employeeId === newFine.employeeId)
      setFines((prev) => [...prev, {
        id: created.id,
        employeeId: newFine.employeeId,
        employeeName: emp?.name ?? '',
        offenceDate: newFine.offenceDate,
        offenceDescription: newFine.offenceDescription,
        fineAmount: newFine.fineAmount,
        recovered: 0,
        pendingRecovery: newFine.fineAmount,
        remarks: '',
      }])
      setNewFine({ employeeId: '', offenceDate: '', offenceDescription: '', fineAmount: 0 })
    }
  }

  async function deleteFine(fineId: string) {
    setSaving(true)
    const res = await fetch(`/api/fine-records/${fineId}`, { method: 'DELETE' })
    setSaving(false)
    if (res.ok) {
      setFines((prev) => prev.filter((f) => f.id !== fineId))
    }
  }

  async function addDeduction() {
    if (!newDeduction.employeeId || !newDeduction.damageDate || !newDeduction.description) {
      setErrors(['Employee, damage date, and description are required'])
      return
    }
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/deductions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeduction),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Add failed'])
    } else {
      const created = await res.json() as { id: string }
      const emp = employees.find((e) => e.employeeId === newDeduction.employeeId)
      setDeductions((prev) => [...prev, {
        id: created.id,
        employeeId: newDeduction.employeeId,
        employeeName: emp?.name ?? '',
        damageDate: newDeduction.damageDate,
        description: newDeduction.description,
        deductionAmount: newDeduction.deductionAmount,
        recovered: 0,
        pendingRecovery: newDeduction.deductionAmount,
        remarks: '',
      }])
      setNewDeduction({ employeeId: '', damageDate: '', description: '', deductionAmount: 0 })
    }
  }

  async function deleteDeduction(deductionId: string) {
    setSaving(true)
    const res = await fetch(`/api/deduction-records/${deductionId}`, { method: 'DELETE' })
    setSaving(false)
    if (res.ok) {
      setDeductions((prev) => prev.filter((d) => d.id !== deductionId))
    }
  }
```

- [ ] **Step 4: Extend the tab type and tab bar**

Change the tab state type from `'attendance' | 'wages'` to:
```typescript
const [tab, setTab] = useState<'attendance' | 'wages' | 'overtime' | 'fines' | 'deductions' | 'leave'>('attendance')
```

In the tab bar JSX, after the existing two tab buttons, add:
```tsx
        <button className={tabClass('overtime')} onClick={() => setTab('overtime')}>
          Overtime
        </button>
        <button className={tabClass('fines')} onClick={() => setTab('fines')}>
          Fines
        </button>
        <button className={tabClass('deductions')} onClick={() => setTab('deductions')}>
          Deductions
        </button>
        <button className={tabClass('leave')} onClick={() => setTab('leave')}>
          Leave
        </button>
```

- [ ] **Step 5: Add Overtime tab content**

After the closing `</div>` of the Wage Data tab (`{tab === 'wages' && (...)}`) add:

```tsx
      {/* Overtime Tab */}
      {tab === 'overtime' && (
        <div className="flex-1 overflow-auto p-4">
          <p className="text-xs text-[#5a8ab8] mb-3">Enter daily OT hours. Leave 0 for non-OT days.</p>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[130px]">
                    Employee
                  </th>
                  {days.map((d) => (
                    <th key={d} className="px-0 py-1.5 text-[#5a8ab8] font-medium w-10 text-center">{d}</th>
                  ))}
                  <th className="px-2 py-1.5 text-[#c087f0] font-medium text-right">Total Hrs</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">OT Rate</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">Normal Earn</th>
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">OT Earn</th>
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const row = ot[emp.employeeId]
                  const totalOtHours = row.dailyOt.reduce((s, h) => s + Math.max(0, h), 0)
                  const otEarnings = Math.round(totalOtHours * row.otRate * 100) / 100
                  const totalEarnings = Math.round((row.normalEarnings + otEarnings) * 100) / 100
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 min-w-[130px]">
                        <div className="font-medium text-white truncate max-w-[120px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                      </td>
                      {days.map((d) => (
                        <td key={d} className="p-0.5 border-r border-[#1a2332]">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={row.dailyOt[d - 1] ?? 0}
                            onChange={(e) => setOtDay(emp.employeeId, d - 1, parseFloat(e.target.value) || 0)}
                            className="w-9 bg-[#1a2a3a] border border-[#2a3a50] rounded px-0.5 py-0.5 text-xs text-[#c8d8e8] text-right"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1 text-right text-[#c087f0]">{totalOtHours.toFixed(1)}</td>
                      <td className="px-1 py-1">
                        {numInput(row.otRate, (v) => setOtField(emp.employeeId, 'otRate', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.normalEarnings, (v) => setOtField(emp.employeeId, 'normalEarnings', v))}
                      </td>
                      <td className="px-2 py-1 text-right text-[#40c070]">{otEarnings.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">{totalEarnings.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              onClick={saveOt}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Overtime'}
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 6: Add Fines tab content**

```tsx
      {/* Fines Tab */}
      {tab === 'fines' && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Existing records */}
          {fines.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Employee</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Offence Date</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Description</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Amount</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Recovered</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.id} className="border-b border-[#1a2332]">
                    <td className="px-2 py-1.5 text-white">{f.employeeName}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{f.offenceDate}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{f.offenceDescription}</td>
                    <td className="px-2 py-1.5 text-right text-[#f07070]">{f.fineAmount.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right text-[#40c070]">{f.recovered.toFixed(2)}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => deleteFine(f.id)}
                        disabled={saving}
                        className="text-[10px] text-[#f07070] hover:text-[#ff9090] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-[#4a6a8a]">No fine records.</p>
          )}

          {/* Add fine form */}
          <div className="border border-[#2a3a50] rounded p-3 space-y-2 max-w-lg">
            <p className="text-xs font-semibold text-[#c8d8e8]">Add Fine Record</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Employee *</label>
                <select
                  value={newFine.employeeId}
                  onChange={(e) => setNewFine((p) => ({ ...p, employeeId: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                >
                  <option value="">Select</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Offence Date *</label>
                <input
                  type="date"
                  value={newFine.offenceDate}
                  onChange={(e) => setNewFine((p) => ({ ...p, offenceDate: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Description *</label>
                <input
                  type="text"
                  value={newFine.offenceDescription}
                  onChange={(e) => setNewFine((p) => ({ ...p, offenceDescription: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Fine Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newFine.fineAmount}
                  onChange={(e) => setNewFine((p) => ({ ...p, fineAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
            </div>
            <button
              onClick={addFine}
              disabled={saving}
              className="px-3 py-1 bg-[#1a5adc] text-white text-xs rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add Fine'}
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 7: Add Deductions tab content**

```tsx
      {/* Deductions Tab */}
      {tab === 'deductions' && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {deductions.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Employee</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Damage Date</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Description</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Deduction</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Recovered</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {deductions.map((d) => (
                  <tr key={d.id} className="border-b border-[#1a2332]">
                    <td className="px-2 py-1.5 text-white">{d.employeeName}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{d.damageDate}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{d.description}</td>
                    <td className="px-2 py-1.5 text-right text-[#f07070]">{d.deductionAmount.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right text-[#40c070]">{d.recovered.toFixed(2)}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => deleteDeduction(d.id)}
                        disabled={saving}
                        className="text-[10px] text-[#f07070] hover:text-[#ff9090] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-[#4a6a8a]">No deduction records.</p>
          )}

          <div className="border border-[#2a3a50] rounded p-3 space-y-2 max-w-lg">
            <p className="text-xs font-semibold text-[#c8d8e8]">Add Deduction Record</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Employee *</label>
                <select
                  value={newDeduction.employeeId}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, employeeId: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                >
                  <option value="">Select</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Damage Date *</label>
                <input
                  type="date"
                  value={newDeduction.damageDate}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, damageDate: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Description *</label>
                <input
                  type="text"
                  value={newDeduction.description}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Deduction Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newDeduction.deductionAmount}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, deductionAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
            </div>
            <button
              onClick={addDeduction}
              disabled={saving}
              className="px-3 py-1 bg-[#1a5adc] text-white text-xs rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add Deduction'}
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 8: Add Leave tab content**

```tsx
      {/* Leave Tab */}
      {tab === 'leave' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[130px]">
                    Employee
                  </th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">EL Open</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">EL Earned</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">EL Availed</th>
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">EL Closing</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">Medical</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">Other</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const row = leave[emp.employeeId]
                  const closing = Math.max(0, row.earnedLeaveOpening + row.earnedDuring - row.earnedAvailed)
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 min-w-[130px]">
                        <div className="font-medium text-white truncate max-w-[120px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.earnedLeaveOpening, (v) => setLeaveField(emp.employeeId, 'earnedLeaveOpening', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.earnedDuring, (v) => setLeaveField(emp.employeeId, 'earnedDuring', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.earnedAvailed, (v) => setLeaveField(emp.employeeId, 'earnedAvailed', Math.round(v)))}
                      </td>
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">{closing}</td>
                      <td className="px-1 py-1">
                        {numInput(row.medicalLeave, (v) => setLeaveField(emp.employeeId, 'medicalLeave', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.otherLeave, (v) => setLeaveField(emp.employeeId, 'otherLeave', Math.round(v)))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              onClick={saveLeave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Leave Data'}
            </button>
          </div>
        </div>
      )}
```

### Changes to `page.tsx`

- [ ] **Step 9: Update page.tsx to load and pass new initial data**

After the existing `existingWages` query, add:

```typescript
  const existingOt = await prisma.overtimeRecord.findMany({
    where: { cycleId: cycle.id },
  })

  const existingFines = await prisma.fineRecord.findMany({
    where: { cycleId: cycle.id },
    include: { employee: { select: { empId: true, name: true } } },
    orderBy: { offenceDate: 'asc' },
  })

  const existingDeductions = await prisma.deductionRecord.findMany({
    where: { cycleId: cycle.id },
    include: { employee: { select: { empId: true, name: true } } },
    orderBy: { damageDate: 'asc' },
  })

  const existingLeave = await prisma.leaveRecord.findMany({
    where: { cycleId: cycle.id },
  })
```

Add after `initialWages`:

```typescript
  const initialOt = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingOt.find((r) => r.employeeId === emp.employeeId)
      const storedDailyOt = rec ? (JSON.parse(rec.dailyOt) as number[]) : []
      const dailyOt = storedDailyOt.length >= daysInMonth
        ? storedDailyOt.slice(0, daysInMonth)
        : [...storedDailyOt, ...Array(daysInMonth - storedDailyOt.length).fill(0)]
      return [
        emp.employeeId,
        {
          dailyOt,
          normalHoursRate: rec?.normalHoursRate ?? 0,
          otRate: rec?.otRate ?? 0,
          normalEarnings: rec?.normalEarnings ?? 0,
        },
      ]
    })
  )

  const initialFines = existingFines.map((f) => ({
    id: f.id,
    employeeId: f.employeeId,
    employeeName: f.employee.name,
    offenceDate: new Date(f.offenceDate).toISOString().split('T')[0],
    offenceDescription: f.offenceDescription,
    fineAmount: f.fineAmount,
    recovered: f.recovered,
    pendingRecovery: f.pendingRecovery,
    remarks: f.remarks ?? '',
  }))

  const initialDeductions = existingDeductions.map((d) => ({
    id: d.id,
    employeeId: d.employeeId,
    employeeName: d.employee.name,
    damageDate: new Date(d.damageDate).toISOString().split('T')[0],
    description: d.description,
    deductionAmount: d.deductionAmount,
    recovered: d.recovered,
    pendingRecovery: d.pendingRecovery,
    remarks: d.remarks ?? '',
  }))

  const initialLeave = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingLeave.find((r) => r.employeeId === emp.employeeId)
      return [
        emp.employeeId,
        {
          earnedLeaveOpening: rec?.earnedLeaveOpening ?? 0,
          earnedDuring: rec?.earnedDuring ?? 0,
          earnedAvailed: rec?.earnedAvailed ?? 0,
          medicalLeave: rec?.medicalLeave ?? 0,
          otherLeave: rec?.otherLeave ?? 0,
          remarks: rec?.remarks ?? '',
        },
      ]
    })
  )
```

Pass the new props to `<FormEntryClient>`:
```tsx
        initialOt={initialOt}
        initialFines={initialFines}
        initialDeductions={initialDeductions}
        initialLeave={initialLeave}
```

- [ ] **Step 10: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 11: Run all tests**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run
```

Expected: All tests pass (67 existing + 11 new = 78 total).

- [ ] **Step 12: Build**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx next build 2>&1 | tail -20
```

Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 13: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add "src/app/forms/[taskId]/form-entry-client.tsx" \
        "src/app/forms/[taskId]/page.tsx"
git commit -m "$(cat <<'EOF'
feat: add Overtime, Fines, Deductions, Leave tabs to form entry page

Overtime: daily hours grid with OT rate input, real-time total/earnings calc.
Fines/Deductions: list + inline add form + delete per record.
Leave: per-employee numeric inputs with auto-calculated earned closing balance.
EOF
)"
```

---

## Verification

After all 5 tasks:

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app

# All tests pass
npx vitest run

# TypeScript clean
npx tsc --noEmit

# Build succeeds
npx next build 2>&1 | tail -20
```

**Expected state after Plan 4:**
- 78 unit tests passing
- `/forms/[taskId]` now has 6 tabs: Attendance | Wage Data | Overtime | Fines | Deductions | Leave
- New API routes: `/api/form-tasks/[id]/overtime` (GET+PUT), `/api/form-tasks/[id]/fines` (GET+POST), `/api/form-tasks/[id]/deductions` (GET+POST), `/api/form-tasks/[id]/leave` (GET+PUT), `/api/fine-records/[fineId]` (DELETE), `/api/deduction-records/[deductionId]` (DELETE)
- Overtime earnings feed automatically into wage calculations on next wage save
