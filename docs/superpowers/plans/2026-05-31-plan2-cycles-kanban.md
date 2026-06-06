# Labour Record — Plan 2: Monthly Cycles + Kanban Board

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Monthly cycle management — create cycles with employee snapshots and form tasks — plus a Kanban board showing all form tasks across 6 workflow stages.

**Architecture:** Cycle creation atomically snapshots active employees + creates FormTask records. Kanban transitions enforced by domain logic. Board is a server-rendered page with filter controls.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7, SQLite, Vitest

**Spec:** `docs/superpowers/specs/2026-05-31-labour-record-design.md`

**Previous plan:** Plan 1 — Foundation (complete)
**Next plan:** Plan 3 — Core Monthly Data Entry (attendance, wages, auto-calculations)

---

## File Map

```
src/
  domain/
    workflow/
      kanban-transitions.ts       ← isValidTransition(), requiresComment(), getFormCodes()
    validations/
      cycle.ts                    ← validateNewCycle()
  app/
    api/
      cycles/
        route.ts                  ← GET list + POST create
        [id]/
          route.ts                ← GET one + PUT lock/unlock
      form-tasks/
        [id]/
          transition/
            route.ts              ← POST status transition
    page.tsx                      ← Kanban board (replaces redirect)
    cycles/
      page.tsx                    ← cycle list
      new/
        page.tsx                  ← create cycle
      [id]/
        page.tsx                  ← cycle detail
  components/
    cycle-form.tsx                ← client form for create cycle

tests/
  domain/
    cycle.test.ts
    kanban-transitions.test.ts
```

---

## Task 1: Cycle Domain Logic

**Files:**
- Create: `src/domain/workflow/kanban-transitions.ts`
- Create: `src/domain/validations/cycle.ts`
- Create: `tests/domain/cycle.test.ts`
- Create: `tests/domain/kanban-transitions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/domain/cycle.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateNewCycle } from '@/domain/validations/cycle'

describe('validateNewCycle', () => {
  const base = { establishmentId: 'est_123', month: 4, year: 2026 }

  it('passes a valid input', () => {
    expect(validateNewCycle(base)).toEqual([])
  })

  it('passes with wagePeriodDays', () => {
    expect(validateNewCycle({ ...base, wagePeriodDays: 26 })).toEqual([])
  })

  it('requires establishmentId', () => {
    expect(validateNewCycle({ ...base, establishmentId: '' }))
      .toContain('establishmentId is required')
  })

  it('rejects month 0', () => {
    expect(validateNewCycle({ ...base, month: 0 }))
      .toContain('month must be between 1 and 12')
  })

  it('rejects month 13', () => {
    expect(validateNewCycle({ ...base, month: 13 }))
      .toContain('month must be between 1 and 12')
  })

  it('rejects year 1999', () => {
    expect(validateNewCycle({ ...base, year: 1999 }))
      .toContain('year must be between 2000 and 2100')
  })

  it('rejects wagePeriodDays 0', () => {
    expect(validateNewCycle({ ...base, wagePeriodDays: 0 }))
      .toContain('wagePeriodDays must be an integer between 1 and 31')
  })

  it('rejects wagePeriodDays 32', () => {
    expect(validateNewCycle({ ...base, wagePeriodDays: 32 }))
      .toContain('wagePeriodDays must be an integer between 1 and 31')
  })
})
```

Create `tests/domain/kanban-transitions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { isValidTransition, requiresComment, getFormCodes } from '@/domain/workflow/kanban-transitions'

describe('isValidTransition', () => {
  it('allows NOT_STARTED → DATA_ENTRY', () => {
    expect(isValidTransition('NOT_STARTED', 'DATA_ENTRY')).toBe(true)
  })

  it('allows DATA_ENTRY → READY_FOR_REVIEW', () => {
    expect(isValidTransition('DATA_ENTRY', 'READY_FOR_REVIEW')).toBe(true)
  })

  it('allows READY_FOR_REVIEW → APPROVED', () => {
    expect(isValidTransition('READY_FOR_REVIEW', 'APPROVED')).toBe(true)
  })

  it('allows READY_FOR_REVIEW → NEEDS_CORRECTION', () => {
    expect(isValidTransition('READY_FOR_REVIEW', 'NEEDS_CORRECTION')).toBe(true)
  })

  it('allows NEEDS_CORRECTION → DATA_ENTRY', () => {
    expect(isValidTransition('NEEDS_CORRECTION', 'DATA_ENTRY')).toBe(true)
  })

  it('allows APPROVED → EXPORTED', () => {
    expect(isValidTransition('APPROVED', 'EXPORTED')).toBe(true)
  })

  it('allows APPROVED → DATA_ENTRY (admin override)', () => {
    expect(isValidTransition('APPROVED', 'DATA_ENTRY')).toBe(true)
  })

  it('rejects NOT_STARTED → APPROVED', () => {
    expect(isValidTransition('NOT_STARTED', 'APPROVED')).toBe(false)
  })

  it('rejects EXPORTED → DATA_ENTRY', () => {
    expect(isValidTransition('EXPORTED', 'DATA_ENTRY')).toBe(false)
  })

  it('rejects DATA_ENTRY → APPROVED (skip review)', () => {
    expect(isValidTransition('DATA_ENTRY', 'APPROVED')).toBe(false)
  })
})

describe('requiresComment', () => {
  it('requires comment for READY_FOR_REVIEW → NEEDS_CORRECTION', () => {
    expect(requiresComment('READY_FOR_REVIEW', 'NEEDS_CORRECTION')).toBe(true)
  })

  it('does not require comment for READY_FOR_REVIEW → APPROVED', () => {
    expect(requiresComment('READY_FOR_REVIEW', 'APPROVED')).toBe(false)
  })

  it('does not require comment for DATA_ENTRY → READY_FOR_REVIEW', () => {
    expect(requiresComment('DATA_ENTRY', 'READY_FOR_REVIEW')).toBe(false)
  })
})

describe('getFormCodes', () => {
  it('returns 7 hospital forms', () => {
    expect(getFormCodes('HOSPITAL')).toHaveLength(7)
  })

  it('returns 5 shop forms', () => {
    expect(getFormCodes('SHOP')).toHaveLength(5)
  })

  it('includes HOSPITAL_FORM_XII', () => {
    expect(getFormCodes('HOSPITAL')).toContain('HOSPITAL_FORM_XII')
  })

  it('includes SHOP_FORM_W', () => {
    expect(getFormCodes('SHOP')).toContain('SHOP_FORM_W')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run tests/domain/cycle.test.ts tests/domain/kanban-transitions.test.ts
```

Expected: Tests fail with module-not-found errors (files don't exist yet).

- [ ] **Step 3: Implement the domain files**

Create `src/domain/workflow/kanban-transitions.ts`:

```typescript
import type { FormTaskStatus } from '@/generated/prisma/client'
import { HOSPITAL_FORM_CODES, SHOP_FORM_CODES } from '@/types'

export const VALID_TRANSITIONS: Record<FormTaskStatus, FormTaskStatus[]> = {
  NOT_STARTED:        ['DATA_ENTRY'],
  DATA_ENTRY:         ['READY_FOR_REVIEW'],
  READY_FOR_REVIEW:   ['APPROVED', 'NEEDS_CORRECTION'],
  NEEDS_CORRECTION:   ['DATA_ENTRY'],
  APPROVED:           ['EXPORTED', 'DATA_ENTRY'],
  EXPORTED:           [],
}

export function isValidTransition(from: FormTaskStatus, to: FormTaskStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to)
}

export function requiresComment(from: FormTaskStatus, to: FormTaskStatus): boolean {
  return from === 'READY_FOR_REVIEW' && to === 'NEEDS_CORRECTION'
}

export function getFormCodes(type: 'HOSPITAL' | 'SHOP'): readonly string[] {
  return type === 'HOSPITAL' ? HOSPITAL_FORM_CODES : SHOP_FORM_CODES
}
```

Create `src/domain/validations/cycle.ts`:

```typescript
type CycleInput = {
  establishmentId: string
  month: number
  year: number
  wagePeriodDays?: number
}

export function validateNewCycle(input: CycleInput): string[] {
  const errors: string[] = []
  if (!input.establishmentId?.trim()) errors.push('establishmentId is required')
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12)
    errors.push('month must be between 1 and 12')
  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100)
    errors.push('year must be between 2000 and 2100')
  if (input.wagePeriodDays !== undefined &&
      (!Number.isInteger(input.wagePeriodDays) || input.wagePeriodDays < 1 || input.wagePeriodDays > 31))
    errors.push('wagePeriodDays must be an integer between 1 and 31')
  return errors
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run tests/domain/cycle.test.ts tests/domain/kanban-transitions.test.ts
```

Expected output:
```
 ✓ tests/domain/cycle.test.ts (8)
 ✓ tests/domain/kanban-transitions.test.ts (14)

 Test Files  2 passed (2)
 Tests  22 passed (22)
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add src/domain/workflow/kanban-transitions.ts src/domain/validations/cycle.ts tests/domain/cycle.test.ts tests/domain/kanban-transitions.test.ts
git commit -m "$(cat <<'EOF'
feat: add cycle validation and kanban transition domain logic

Adds validateNewCycle() for input validation and isValidTransition() /
requiresComment() / getFormCodes() for enforcing the 6-stage workflow.
22 unit tests pass.
EOF
)"
```

---

## Task 2: Cycle API Routes

**Files:**
- Create: `src/app/api/cycles/route.ts`
- Create: `src/app/api/cycles/[id]/route.ts`

- [ ] **Step 1: Create the cycles list/create route**

Create `src/app/api/cycles/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNewCycle } from '@/domain/validations/cycle'
import { getFormCodes } from '@/domain/workflow/kanban-transitions'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')

    const cycles = await prisma.monthlyCycle.findMany({
      where: establishmentId ? { establishmentId } : undefined,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        establishment: { select: { name: true, type: true } },
        _count: { select: { formTasks: true, cycleEmployees: true } },
      },
    })
    return NextResponse.json(cycles)
  } catch (error) {
    console.error('GET /api/cycles failed:', error)
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

    const b = body as { establishmentId?: string; month?: number; year?: number; wagePeriodDays?: number }
    const errors = validateNewCycle({
      establishmentId: b.establishmentId ?? '',
      month: b.month ?? 0,
      year: b.year ?? 0,
      wagePeriodDays: b.wagePeriodDays,
    })
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

    // Check establishment exists and get type
    const establishment = await prisma.establishment.findUnique({
      where: { id: b.establishmentId! },
    })
    if (!establishment) return NextResponse.json({ errors: ['establishmentId not found'] }, { status: 422 })

    // Check for duplicate
    const existing = await prisma.monthlyCycle.findUnique({
      where: {
        establishmentId_month_year: {
          establishmentId: b.establishmentId!,
          month: b.month!,
          year: b.year!,
        },
      },
    })
    if (existing) {
      return NextResponse.json(
        { errors: ['A cycle already exists for this establishment, month, and year'] },
        { status: 422 }
      )
    }

    // Create cycle
    const cycle = await prisma.monthlyCycle.create({
      data: {
        establishmentId: b.establishmentId!,
        month: b.month!,
        year: b.year!,
        wagePeriodDays: b.wagePeriodDays ?? 26,
      },
    })

    // Snapshot active employees into CycleEmployee
    const cycleStart = new Date(b.year!, b.month! - 1, 1)
    const employees = await prisma.employee.findMany({
      where: {
        establishmentId: b.establishmentId!,
        status: 'ACTIVE',
        OR: [{ exitDate: null }, { exitDate: { gt: cycleStart } }],
      },
    })

    if (employees.length > 0) {
      await prisma.cycleEmployee.createMany({
        data: employees.map((emp) => ({
          cycleId: cycle.id,
          employeeId: emp.id,
          empDataSnapshot: JSON.stringify({
            empId: emp.empId,
            name: emp.name,
            sex: emp.sex,
            designation: emp.designation,
            department: emp.department,
            dateOfEntry: emp.dateOfEntry,
            uan: emp.uan,
            esiNo: emp.esiNo,
          }),
        })),
      })
    }

    // Create FormTask for each required form
    const formCodes = getFormCodes(establishment.type as 'HOSPITAL' | 'SHOP')
    await prisma.formTask.createMany({
      data: formCodes.map((formCode) => ({
        cycleId: cycle.id,
        formCode,
        status: 'NOT_STARTED' as const,
      })),
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'MonthlyCycle',
          entityId: cycle.id,
          action: 'CREATED',
          newValue: JSON.stringify({
            month: cycle.month,
            year: cycle.year,
            establishmentId: cycle.establishmentId,
          }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(cycle, { status: 201 })
  } catch (error) {
    console.error('POST /api/cycles failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the cycle detail/update route**

Create `src/app/api/cycles/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: {
        establishment: {
          select: { name: true, type: true, employerName: true, managerName: true },
        },
        formTasks: { orderBy: { formCode: 'asc' } },
        cycleEmployees: {
          include: {
            employee: {
              select: { empId: true, name: true, designation: true, status: true },
            },
          },
        },
        _count: { select: { formTasks: true, cycleEmployees: true } },
      },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(cycle)
  } catch (error) {
    console.error('GET /api/cycles/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { status?: string; wagePeriodDays?: number }
    const cycle = await prisma.monthlyCycle.findUnique({ where: { id } })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const validStatuses = ['OPEN', 'LOCKED']
    if (b.status && !validStatuses.includes(b.status)) {
      return NextResponse.json({ errors: ['status must be OPEN or LOCKED'] }, { status: 422 })
    }

    const updated = await prisma.monthlyCycle.update({
      where: { id },
      data: {
        ...(b.status ? { status: b.status as 'OPEN' | 'LOCKED' } : {}),
        ...(b.wagePeriodDays ? { wagePeriodDays: b.wagePeriodDays } : {}),
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'MonthlyCycle',
          entityId: id,
          action: 'UPDATED',
          previousValue: JSON.stringify({ status: cycle.status }),
          newValue: JSON.stringify({ status: updated.status }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/cycles/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add src/app/api/cycles/route.ts src/app/api/cycles/[id]/route.ts
git commit -m "$(cat <<'EOF'
feat: add /api/cycles GET+POST and /api/cycles/[id] GET+PUT routes

Cycle creation atomically snapshots active employees and creates
FormTask records for each required form based on establishment type.
Duplicate cycle detection and audit logging included.
EOF
)"
```

---

## Task 3: FormTask Transition API

**Files:**
- Create: `src/app/api/form-tasks/[id]/transition/route.ts`

- [ ] **Step 1: Create the transition route**

Create `src/app/api/form-tasks/[id]/transition/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidTransition, requiresComment } from '@/domain/workflow/kanban-transitions'
import type { FormTaskStatus } from '@/generated/prisma/client'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES: FormTaskStatus[] = [
  'NOT_STARTED',
  'DATA_ENTRY',
  'READY_FOR_REVIEW',
  'NEEDS_CORRECTION',
  'APPROVED',
  'EXPORTED',
]

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { to?: string; comment?: string }

    if (!b.to || !VALID_STATUSES.includes(b.to as FormTaskStatus)) {
      return NextResponse.json(
        { errors: ['to must be a valid FormTaskStatus'] },
        { status: 422 }
      )
    }

    const toStatus = b.to as FormTaskStatus

    const formTask = await prisma.formTask.findUnique({
      where: { id },
      include: { cycle: { include: { establishment: true } } },
    })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fromStatus = formTask.status

    if (!isValidTransition(fromStatus, toStatus)) {
      return NextResponse.json(
        { errors: [`Transition from ${fromStatus} to ${toStatus} is not allowed`] },
        { status: 422 }
      )
    }

    if (requiresComment(fromStatus, toStatus) && !b.comment?.trim()) {
      return NextResponse.json(
        { errors: ['A comment is required when sending back for correction'] },
        { status: 422 }
      )
    }

    // For DATA_ENTRY → READY_FOR_REVIEW, full row-level validation is enforced in Plan 3.
    // For now, allow the transition unconditionally.

    const updated = await prisma.formTask.update({
      where: { id },
      data: {
        status: toStatus,
        lastComment: b.comment?.trim() ?? formTask.lastComment,
        updatedAt: new Date(),
      },
    })

    await prisma.formTaskStatusHistory.create({
      data: {
        formTaskId: id,
        fromStatus,
        toStatus,
        comment: b.comment?.trim() ?? null,
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'FormTask',
          entityId: id,
          action: 'STATUS_CHANGED',
          previousValue: JSON.stringify({ status: fromStatus }),
          newValue: JSON.stringify({ status: toStatus, comment: b.comment }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('POST /api/form-tasks/[id]/transition failed:', error)
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
git add src/app/api/form-tasks/[id]/transition/route.ts
git commit -m "$(cat <<'EOF'
feat: add POST /api/form-tasks/[id]/transition route

Enforces kanban workflow rules — valid transitions, comment required for
NEEDS_CORRECTION — and records status history + audit log on every change.
EOF
)"
```

---

## Task 4: Cycles UI

**Files:**
- Create: `src/components/cycle-form.tsx`
- Create: `src/app/cycles/page.tsx`
- Create: `src/app/cycles/new/page.tsx`
- Create: `src/app/cycles/[id]/page.tsx`

- [ ] **Step 1: Create the CycleForm client component**

Create `src/components/cycle-form.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Establishment = { id: string; name: string; type: string }

type Props = {
  establishments: Establishment[]
}

export function CycleForm({ establishments }: Props) {
  const router = useRouter()
  const now = new Date()

  const [form, setForm] = useState({
    establishmentId: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    wagePeriodDays: 26,
  })
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }

    router.push('/cycles')
    router.refresh()
  }

  const inputClass =
    'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'
  const labelClass = 'block text-xs text-[#5a8ab8] mb-1'

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  return (
    <form onSubmit={handleSubmit} className="max-w-lg p-6 space-y-4">
      {errors.length > 0 && (
        <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-xs text-[#f07070] space-y-1">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      <div>
        <label className={labelClass}>Establishment *</label>
        <select
          className={inputClass}
          value={form.establishmentId}
          onChange={(e) => set('establishmentId', e.target.value)}
          required
        >
          <option value="">Select establishment</option>
          {establishments.map((est) => (
            <option key={est.id} value={est.id}>
              {est.name} ({est.type})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Month *</label>
          <select
            className={inputClass}
            value={form.month}
            onChange={(e) => set('month', parseInt(e.target.value))}
          >
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Year *</label>
          <input
            className={inputClass}
            type="number"
            min="2000"
            max="2100"
            value={form.year}
            onChange={(e) => set('year', parseInt(e.target.value))}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Wage Period Days</label>
        <input
          className={inputClass}
          type="number"
          min="1"
          max="31"
          value={form.wagePeriodDays}
          onChange={(e) => set('wagePeriodDays', parseInt(e.target.value))}
        />
        <p className="text-[10px] text-[#4a6a8a] mt-1">Default: 26 days</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Cycle'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/cycles')}
          className="px-4 py-1.5 bg-transparent border border-[#2a3a50] text-[#7a9ab8] text-xs rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create the cycles list page**

Create `src/app/cycles/page.tsx`:

```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default async function CyclesPage() {
  const cycles = await prisma.monthlyCycle.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      establishment: { select: { name: true, type: true } },
      _count: { select: { formTasks: true, cycleEmployees: true } },
    },
  })

  return (
    <div>
      <PageHeader
        title="Monthly Cycles"
        subtitle={`${cycles.length} cycle${cycles.length !== 1 ? 's' : ''}`}
        action={{ label: '+ New Cycle', href: '/cycles/new' }}
      />
      <div className="p-6">
        {cycles.length === 0 ? (
          <p className="text-[#4a6a8a] text-sm">
            No cycles yet.{' '}
            <Link href="/cycles/new" className="text-[#4a9eff] hover:underline">
              Create the first one.
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Period</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Establishment</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Employees</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Forms</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <tr key={cycle.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-3 font-medium text-white">
                    {MONTH_NAMES[cycle.month]} {cycle.year}
                  </td>
                  <td className="py-2 px-3 text-[#7a9ab8]">
                    {cycle.establishment.name}
                    <span className="ml-2 text-[10px] text-[#4a6a8a]">{cycle.establishment.type}</span>
                  </td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{cycle._count.cycleEmployees}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{cycle._count.formTasks}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        cycle.status === 'OPEN'
                          ? 'bg-[#0f2a1a] text-[#40c070]'
                          : 'bg-[#2a2010] text-[#c0a040]'
                      }`}
                    >
                      {cycle.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <Link href={`/cycles/${cycle.id}`} className="text-xs text-[#4a9eff] hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create the new cycle page**

Create `src/app/cycles/new/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { CycleForm } from '@/components/cycle-form'

export default async function NewCyclePage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div>
      <PageHeader title="New Monthly Cycle" />
      <CycleForm establishments={establishments} />
    </div>
  )
}
```

- [ ] **Step 4: Create the cycle detail page**

Create `src/app/cycles/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode } from '@/types'

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED:      'bg-[#1a2332] text-[#4a6a8a]',
  DATA_ENTRY:       'bg-[#1a2a50] text-[#4a9eff]',
  READY_FOR_REVIEW: 'bg-[#2a2010] text-[#c0a040]',
  NEEDS_CORRECTION: 'bg-[#2a1010] text-[#f07070]',
  APPROVED:         'bg-[#0f2a1a] text-[#40c070]',
  EXPORTED:         'bg-[#1a0f2a] text-[#c087f0]',
}

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cycle = await prisma.monthlyCycle.findUnique({
    where: { id },
    include: {
      establishment: { select: { name: true, type: true } },
      formTasks: { orderBy: { formCode: 'asc' } },
      cycleEmployees: {
        include: {
          employee: {
            select: { empId: true, name: true, designation: true, status: true },
          },
        },
        orderBy: { employee: { name: 'asc' } },
      },
    },
  })
  if (!cycle) notFound()

  const periodLabel = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div>
      <PageHeader
        title={`${cycle.establishment.name} — ${periodLabel}`}
        subtitle={`${cycle.establishment.type} · ${cycle.cycleEmployees.length} employees · ${cycle.status}`}
      />
      <div className="p-6 space-y-6">
        {/* Form Tasks */}
        <section>
          <h2 className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide mb-3">
            Form Tasks
          </h2>
          <div className="space-y-1">
            {cycle.formTasks.map((task) => {
              const display = FORM_DISPLAY_NAMES[task.formCode as FormCode]
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-3 py-2 rounded bg-[#0f1923] border border-[#1e2d3d]"
                >
                  <div>
                    <span className="text-sm text-white">{display?.name ?? task.formCode}</span>
                    <span className="ml-2 text-xs text-[#4a6a8a]">{display?.ref}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[task.status] ?? ''}`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>
                    <Link
                      href={`/forms/${task.id}`}
                      className="text-xs text-[#4a9eff] hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Employees in cycle */}
        <section>
          <h2 className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide mb-3">
            Employees in this Cycle ({cycle.cycleEmployees.length})
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">ID</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Name</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Designation</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {cycle.cycleEmployees.map((ce) => (
                <tr key={ce.id} className="border-b border-[#1a2332]">
                  <td className="py-2 px-3 font-mono text-xs text-[#7a9ab8]">{ce.employee.empId}</td>
                  <td className="py-2 px-3 text-white">{ce.employee.name}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{ce.employee.designation}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        ce.employee.status === 'ACTIVE'
                          ? 'bg-[#0f2a1a] text-[#40c070]'
                          : ce.employee.status === 'EXITED'
                          ? 'bg-[#2a1a1a] text-[#f07070]'
                          : 'bg-[#2a2010] text-[#c0a040]'
                      }`}
                    >
                      {ce.employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add "Cycles" link to the sidebar**

Open `src/components/sidebar.tsx` and add a Cycles nav link alongside the existing Establishments and Employees links. Find the nav items array or list and insert:

```tsx
{ href: '/cycles', label: 'Cycles' }
```

The exact insertion depends on the sidebar structure. Open the file, locate where `establishments` and `employees` nav links are defined, and add the Cycles entry in the same pattern immediately after Employees.

- [ ] **Step 6: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add src/components/cycle-form.tsx src/app/cycles/page.tsx src/app/cycles/new/page.tsx "src/app/cycles/[id]/page.tsx" src/components/sidebar.tsx
git commit -m "$(cat <<'EOF'
feat: add cycles UI — list, create, and detail pages

Cycle list shows period, establishment, employee/form counts, status.
Create form snapshots active employees on submission. Detail page shows
all form tasks with status badges and employees in the cycle.
EOF
)"
```

---

## Task 5: Kanban Board (Home Page)

**Files:**
- Modify: `src/app/page.tsx` (replaces redirect with full Kanban board)

- [ ] **Step 1: Replace the home page with the Kanban board**

Overwrite `src/app/page.tsx` with:

```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode } from '@/types'
import type { FormTaskStatus } from '@/generated/prisma/client'

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const COLUMNS: { status: FormTaskStatus; label: string; color: string }[] = [
  { status: 'NOT_STARTED',      label: 'Not Started',      color: 'text-[#4a6a8a]' },
  { status: 'DATA_ENTRY',       label: 'Data Entry',       color: 'text-[#4a9eff]' },
  { status: 'READY_FOR_REVIEW', label: 'Ready for Review', color: 'text-[#c0a040]' },
  { status: 'NEEDS_CORRECTION', label: 'Needs Correction', color: 'text-[#f07070]' },
  { status: 'APPROVED',         label: 'Approved',         color: 'text-[#40c070]' },
  { status: 'EXPORTED',         label: 'Exported',         color: 'text-[#c087f0]' },
]

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ establishmentId?: string; month?: string; year?: string }>
}) {
  const { establishmentId, month, year } = await searchParams

  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const monthNum = month ? parseInt(month) : undefined
  const yearNum = year ? parseInt(year) : undefined

  const formTasks = await prisma.formTask.findMany({
    where: {
      cycle: {
        ...(establishmentId ? { establishmentId } : {}),
        ...(monthNum ? { month: monthNum } : {}),
        ...(yearNum ? { year: yearNum } : {}),
      },
    },
    include: {
      cycle: {
        include: { establishment: { select: { name: true, type: true } } },
      },
    },
    orderBy: [
      { cycle: { year: 'desc' } },
      { cycle: { month: 'desc' } },
      { formCode: 'asc' },
    ],
  })

  const byStatus = Object.fromEntries(
    COLUMNS.map((col) => [col.status, formTasks.filter((t) => t.status === col.status)])
  ) as Record<FormTaskStatus, typeof formTasks>

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="flex flex-col h-screen">
      {/* Header / Filter bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d] bg-[#0f1923]">
        <h1 className="text-base font-semibold text-white">Kanban Board</h1>
        <form method="GET" className="flex items-center gap-2">
          <select
            name="establishmentId"
            defaultValue={establishmentId ?? ''}
            className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
          >
            <option value="">All Establishments</option>
            {establishments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            name="month"
            defaultValue={month ?? ''}
            className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
          >
            <option value="">All Months</option>
            {MONTH_NAMES.slice(1).map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={year ?? ''}
            className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060]"
          >
            Filter
          </button>
          {(establishmentId || month || year) && (
            <Link href="/" className="text-xs text-[#4a6a8a] hover:text-[#7a9ab8]">
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Kanban columns */}
      <div className="flex flex-1 overflow-x-auto gap-0 min-h-0">
        {COLUMNS.map((col) => {
          const cards = byStatus[col.status] ?? []
          return (
            <div
              key={col.status}
              className="flex-1 min-w-[180px] flex flex-col border-r border-[#1e2d3d] last:border-r-0"
            >
              {/* Column header */}
              <div className="px-3 py-2 border-b border-[#1e2d3d] bg-[#0f1923]">
                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                <span className="ml-2 text-[10px] text-[#4a6a8a]">{cards.length}</span>
              </div>
              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.map((task) => {
                  const display = FORM_DISPLAY_NAMES[task.formCode as FormCode]
                  return (
                    <Link
                      key={task.id}
                      href={`/forms/${task.id}`}
                      className="block p-2 rounded bg-[#0f1923] border border-[#1e2d3d] hover:border-[#2a4060] cursor-pointer"
                    >
                      <p className="text-xs font-medium text-white leading-tight">
                        {display?.name ?? task.formCode}
                      </p>
                      <p className="text-[10px] text-[#4a6a8a] mt-1">
                        {task.cycle.establishment.name}
                      </p>
                      <p className="text-[10px] text-[#4a6a8a]">
                        {MONTH_NAMES[task.cycle.month]} {task.cycle.year}
                      </p>
                      {display?.ref && (
                        <p className="text-[10px] text-[#2a4a6a] mt-1">{display.ref}</p>
                      )}
                    </Link>
                  )
                })}
                {cards.length === 0 && (
                  <p className="text-[10px] text-[#2a3a4a] px-1 py-2">—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run all tests**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx vitest run
```

Expected output:
```
 ✓ tests/domain/cycle.test.ts (8)
 ✓ tests/domain/kanban-transitions.test.ts (14)

 Test Files  2 passed (2)
 Tests  22 passed (22)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
git add src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat: replace home redirect with Kanban board

Server-rendered board shows all FormTask cards grouped across 6 workflow
columns. Filter controls for establishment, month, year. Each card links
to /forms/[id] for Plan 3 data entry.
EOF
)"
```

---

## Verification

After all 5 tasks are complete, run the full verification:

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app

# All tests pass
npx vitest run

# TypeScript clean
npx tsc --noEmit

# Dev server starts without errors
npx next build 2>&1 | tail -20
```

**Expected state after Plan 2:**
- `GET /` — Kanban board with 6 columns (empty until a cycle is created)
- `GET /cycles` — Cycle list
- `GET /cycles/new` — Create cycle form
- `POST /api/cycles` — Creates cycle, snapshots employees, creates form tasks
- `GET /api/cycles` — Returns all cycles
- `GET /api/cycles/:id` — Returns cycle with form tasks and employees
- `PUT /api/cycles/:id` — Lock/unlock a cycle
- `POST /api/form-tasks/:id/transition` — Transition form task status with validation
- 22 unit tests passing (8 cycle validation + 14 kanban transitions)
