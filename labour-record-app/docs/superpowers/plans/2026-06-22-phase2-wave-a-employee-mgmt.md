# Phase-2 Wave A — Employee Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make employee data entry low-friction and complete: only Name + salary required (auto-gen empId), per-employee Cash/Bank payment mode, guarded hard-delete, and bulk import from CSV/TXT/XLSX.

**Architecture:** A Prisma migration relaxes employee columns to nullable + adds `paymentMode`. Pure helpers (`generateEmpId`, employee-import parser) are unit-tested in isolation; the create/update/import routes and the employee form consume them. Delete becomes a guarded hard-delete that refuses when historical records exist.

**Tech Stack:** Next.js 16 (route handlers + server/client components), Prisma 7 + SQLite, `xlsx` (SheetJS) for spreadsheet parsing, Vitest, Playwright. Per `AGENTS.md`, verify Next file-upload / route-handler APIs against `node_modules/next/dist/docs/`.

---

## Reference: current state
- `src/domain/validations/employee.ts` — `validateEmployee(input)` currently requires empId, name, sex, fatherSpouseName, dateOfEntry, designation, presentAddress, permanentAddress, establishmentId.
- `src/app/api/employees/route.ts` `POST` calls `b.sex.trim()`, `b.fatherSpouseName.trim()`, `b.designation.trim()`, `b.presentAddress.trim()`, `b.permanentAddress.trim()`, `new Date(b.dateOfEntry)`, `b.empId.trim()` directly — these throw on undefined once optional, so they must become null-safe.
- `src/app/api/employees/[id]/route.ts` — `PUT` (update) and `DELETE` (currently soft-sets `status:'EXITED'`).
- `src/components/employee-form.tsx` — client form (`'use client'`, useState, fetch). Inputs use `aria-label`. Styling tokens: `inputClass = 'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'`, `labelClass = 'block text-xs text-[#5a8ab8] mb-1'`.
- `src/app/employees/[id]/page.tsx` — employee edit page (renders `EmployeeForm`).
- Money/validation conventions: API routes return `422 { errors: [] }` / `409`/`500`. Tests: `npm test -- <name>` (e2e excluded by vitest.config).

---

## Task A1: Schema migration (nullable fields + paymentMode)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<ts>_employee_optional_fields_payment_mode/migration.sql` (generated)

- [ ] **Step 1: Edit the Employee model**

In `prisma/schema.prisma`, change these columns to optional and add paymentMode. Replace the current lines:
```prisma
  sex                 String
  fatherSpouseName    String
  dob                 DateTime?
  dateOfEntry         DateTime
  designation         String
  department          String?
  presentAddress      String
  permanentAddress    String
```
with:
```prisma
  sex                 String?
  fatherSpouseName    String?
  dob                 DateTime?
  dateOfEntry         DateTime?
  designation         String?
  department          String?
  presentAddress      String?
  permanentAddress    String?
```
And add, immediately after the `lwfAmount` line (before `establishmentId`):
```prisma
  paymentMode         String         @default("BANK") // BANK | CASH
```

- [ ] **Step 2: Create the migration + regenerate client**

Run: `npx prisma migrate dev --name employee_optional_fields_payment_mode`
Then (Prisma 7 doesn't auto-generate): `npx prisma generate`
Expected: migration created/applied; `dev.db` in sync.

- [ ] **Step 3: Verify columns are nullable**

Run: `sqlite3 dev.db "PRAGMA table_info(Employee);" | grep -E "sex|paymentMode|dateOfEntry"`
Expected: `sex`, `dateOfEntry` show `notnull = 0`; `paymentMode` present with default `'BANK'`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: relax employee required columns + add paymentMode"
```

---

## Task A2: Validation + empId generator (pure, tested)

**Files:**
- Modify: `src/domain/validations/employee.ts`
- Create: `src/domain/validations/employee.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/domain/validations/employee.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateEmployee, generateEmpId, type EmployeeInput } from './employee'

const base: EmployeeInput = {
  empId: '', name: 'Asha', sex: null, fatherSpouseName: null, dateOfEntry: null,
  designation: null, presentAddress: null, permanentAddress: null,
  establishmentId: 'est1', defaultTotalSalary: 15000,
}

describe('validateEmployee', () => {
  it('requires only name, salary, and establishment', () => {
    expect(validateEmployee(base)).toEqual([])
  })
  it('flags a missing name', () => {
    expect(validateEmployee({ ...base, name: '  ' })).toContain('name is required')
  })
  it('flags a missing / non-positive salary', () => {
    expect(validateEmployee({ ...base, defaultTotalSalary: 0 })).toContain('a salary figure is required')
  })
  it('flags a missing establishment', () => {
    expect(validateEmployee({ ...base, establishmentId: '' })).toContain('establishmentId is required')
  })
  it('still validates exit relationships when present', () => {
    expect(validateEmployee({ ...base, dateOfEntry: new Date('2020-01-01'), exitDate: new Date('2019-01-01') }))
      .toContain('exitDate must be after dateOfEntry')
    expect(validateEmployee({ ...base, exitDate: new Date('2020-01-01') }))
      .toContain('exitReason is required when exitDate is set')
  })
})

describe('generateEmpId', () => {
  it('zero-pads a sequence to EMP-####', () => {
    expect(generateEmpId(0)).toBe('EMP-0001')
    expect(generateEmpId(41)).toBe('EMP-0042')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test -- employee`
Expected: FAIL — `generateEmpId` not exported; required-field expectations differ.

- [ ] **Step 3: Rewrite `src/domain/validations/employee.ts`**

Replace the entire file with:
```ts
export type EmployeeInput = {
  empId?: string | null
  name: string
  sex?: string | null
  fatherSpouseName?: string | null
  dateOfEntry?: Date | null
  designation?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  establishmentId: string
  defaultTotalSalary?: number | null
  exitDate?: Date | null
  exitReason?: string | null
}

// Phase-2 (#3): only Name + a salary figure are mandatory (plus the owning
// establishment). Everything else is optional and entered later / via import.
export function validateEmployee(input: EmployeeInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('name is required')
  if (!(typeof input.defaultTotalSalary === 'number' && input.defaultTotalSalary > 0)) {
    errors.push('a salary figure is required')
  }
  if (!input.establishmentId?.trim()) errors.push('establishmentId is required')

  if (input.exitDate && input.dateOfEntry && input.exitDate < input.dateOfEntry) {
    errors.push('exitDate must be after dateOfEntry')
  }
  if (input.exitDate && !input.exitReason?.trim()) {
    errors.push('exitReason is required when exitDate is set')
  }
  return errors
}

// Auto-generate an Employee ID when the operator leaves it blank (#3).
// `existingCount` is the current number of employees in the establishment.
export function generateEmpId(existingCount: number): string {
  return `EMP-${String(existingCount + 1).padStart(4, '0')}`
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- employee`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/validations/employee.ts src/domain/validations/employee.test.ts
git commit -m "feat: employee validation requires only name+salary; add generateEmpId"
```

> NOTE: the create/update routes import `validateEmployee` and call `.trim()` on
> now-optional fields — that breakage is fixed in Task A3 (don't run build until then).

---

## Task A3: Null-safe create/update routes + auto empId + paymentMode

**Files:**
- Modify: `src/app/api/employees/route.ts` (POST)
- Modify: `src/app/api/employees/[id]/route.ts` (PUT)

- [ ] **Step 1: Make POST null-safe + auto-gen empId + paymentMode**

In `src/app/api/employees/route.ts`, import the generator:
```ts
import { validateEmployee, generateEmpId } from '@/domain/validations/employee'
```
Then, after the `validateEmployee` check passes and before `prisma.employee.create`, compute the empId:
```ts
    const empId = b.empId?.trim()
      ? b.empId.trim()
      : generateEmpId(await prisma.employee.count({ where: { establishmentId: b.establishmentId } }))
```
Replace the `data: { ... }` object's field expressions with null-safe versions:
```ts
      data: {
        empId,
        name: b.name.trim(),
        sex: b.sex?.trim() || null,
        fatherSpouseName: b.fatherSpouseName?.trim() || null,
        dob: b.dob ? new Date(b.dob) : null,
        dateOfEntry: b.dateOfEntry ? new Date(b.dateOfEntry) : null,
        designation: b.designation?.trim() || null,
        department: b.department?.trim() || null,
        presentAddress: b.presentAddress?.trim() || null,
        permanentAddress: b.permanentAddress?.trim() || null,
        uan: b.uan?.trim() || null,
        esiNo: b.esiNo?.trim() || null,
        aadhaar: b.aadhaar?.trim() || null,
        bankAccount: b.paymentMode === 'CASH' ? null : (b.bankAccount?.trim() || null),
        ifsc: b.paymentMode === 'CASH' ? null : (b.ifsc?.trim() || null),
        bankName: b.paymentMode === 'CASH' ? null : (b.bankName?.trim() || null),
        mobile: b.mobile?.trim() || null,
        email: b.email?.trim() || null,
        completionOf480Days: b.completionOf480Days ? new Date(b.completionOf480Days) : null,
        dateMadePermanent: b.dateMadePermanent ? new Date(b.dateMadePermanent) : null,
        periodOfSuspension: b.periodOfSuspension?.trim() || null,
        remarks: b.remarks?.trim() || null,
        paymentMode: b.paymentMode === 'CASH' ? 'CASH' : 'BANK',
        defaultTotalSalary: parseFloat(b.defaultTotalSalary) || 0,
        basicWage: parseFloat(b.basicWage) || 0,
        daWage: parseFloat(b.daWage) || 0,
        hraWage: parseFloat(b.hraWage) || 0,
        pfMode: ['PERCENT', 'FIXED', 'NONE'].includes(b.pfMode) ? b.pfMode : 'PERCENT',
        pfPercent: parseFloat(b.pfPercent) || 12,
        pfWageCeiling: parseFloat(b.pfWageCeiling) || 15000,
        pfAmount: parseFloat(b.pfAmount) || 0,
        esiAmount: parseFloat(b.esiAmount) || 0,
        lwfAmount: parseFloat(b.lwfAmount) || 0,
        establishmentId: b.establishmentId,
      },
```

- [ ] **Step 2: Make PUT null-safe + paymentMode**

Read `src/app/api/employees/[id]/route.ts`. In the `PUT` handler's `data` object, apply the same null-safe pattern: `b.sex?.trim() || null`, `b.fatherSpouseName?.trim() || null`, `b.designation?.trim() || null`, `presentAddress`/`permanentAddress` `?.trim() || null`, `dateOfEntry: b.dateOfEntry ? new Date(b.dateOfEntry) : null`, add `paymentMode: b.paymentMode === 'CASH' ? 'CASH' : 'BANK'`, and null the three bank fields when `b.paymentMode === 'CASH'` (same expressions as Step 1). Keep `empId` as `b.empId?.trim()` if the update sends it (do not regenerate on update). Leave wage fields as-is.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -iE "employees/route|employees/\[id\]/route" | head`
Expected: no lines referencing these two route files (pre-existing project-wide tsc noise is fine).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compiles. (Run `npx prisma generate` first if it complains about the client.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/employees/route.ts" "src/app/api/employees/[id]/route.ts"
git commit -m "feat: null-safe employee create/update, auto empId, paymentMode (clears bank on CASH)"
```

---

## Task A4: Employee form — required Name+Salary, Payment Mode toggle

**Files:**
- Modify: `src/components/employee-form.tsx`

- [ ] **Step 1: Read the form and add a paymentMode state field**

Read `src/components/employee-form.tsx`. In the `useState` form object, add `paymentMode: employee?.paymentMode ?? 'BANK'` and (if not present) ensure `empId` defaults to `employee?.empId ?? ''`.

- [ ] **Step 2: Make only Name + Salary visually required; relax the rest**

Remove the `required` attribute from all inputs EXCEPT Name and the salary field (`defaultTotalSalary`). Add a `*` marker to the Name and Salary labels only. For the Emp ID input, set `placeholder="auto-generated if blank"`.

- [ ] **Step 3: Add the Payment Mode select and conditionally disable bank fields**

Add a Payment Mode `<select>` (options Bank/Cash) bound to `form.paymentMode`:
```tsx
        <div>
          <label className={labelClass}>Payment Mode</label>
          <select
            className={inputClass}
            aria-label="Payment Mode"
            value={form.paymentMode}
            onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
          >
            <option value="BANK">Bank Transfer</option>
            <option value="CASH">Cash</option>
          </select>
        </div>
```
For the Bank A/C, IFSC, and Bank Name inputs add `disabled={form.paymentMode === 'CASH'}` and append ` disabled:opacity-40` to their className. When `paymentMode === 'CASH'`, the submit payload should send empty bank fields (the route also nulls them, but clear in the UI too): on the Payment Mode `onChange`, when value is `CASH` also clear `bankAccount`, `ifsc`, `bankName` in form state.

- [ ] **Step 4: Ensure paymentMode is in the submit payload**

Confirm the `fetch` body serializes the whole `form` object (so `paymentMode` is included). If it builds an explicit payload object, add `paymentMode: form.paymentMode`.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: compiles cleanly.

- [ ] **Step 6: Commit**

```bash
git add src/components/employee-form.tsx
git commit -m "feat: employee form — only Name+Salary required, Payment Mode toggle clears bank on Cash"
```

---

## Task A5: Guarded hard-delete (route + UI)

**Files:**
- Modify: `src/app/api/employees/[id]/route.ts` (DELETE)
- Create: `src/app/employees/[id]/delete-employee-button.tsx`
- Modify: `src/app/employees/[id]/page.tsx` (render the button)

- [ ] **Step 1: Add a guarded remove mode to DELETE**

In `src/app/api/employees/[id]/route.ts`, change the `DELETE` handler so it reads the URL `mode` param and hard-deletes when safe:
```ts
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode')
    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (mode === 'remove') {
      const refCount = await prisma.cycleEmployee.count({ where: { employeeId: id } })
        + await prisma.wageRecord.count({ where: { employeeId: id } })
        + await prisma.attendanceRecord.count({ where: { employeeId: id } })
      if (refCount > 0) {
        return NextResponse.json(
          { error: 'This employee appears in one or more cycles and cannot be permanently deleted. Mark them Exited instead.', canSoftDelete: true },
          { status: 409 },
        )
      }
      await prisma.employee.delete({ where: { id } })
      try {
        await prisma.auditLog.create({ data: { entityType: 'Employee', entityId: id, action: 'DELETED', previousValue: JSON.stringify({ name: employee.name, empId: employee.empId }) } })
      } catch (e) { console.error('Audit log failed:', e) }
      return NextResponse.json({ success: true, removed: true })
    }

    // default: soft delete (mark Exited)
    const updated = await prisma.employee.update({ where: { id }, data: { status: 'EXITED', exitDate: new Date() } })
    try {
      await prisma.auditLog.create({ data: { entityType: 'Employee', entityId: id, action: 'EXITED', newValue: JSON.stringify({ exitDate: updated.exitDate }) } })
    } catch (e) { console.error('Audit log failed:', e) }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/employees/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the client Delete button**

Create `src/app/employees/[id]/delete-employee-button.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteEmployeeButton({ employeeId, name }: { employeeId: string; name: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function remove() {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/employees/${employeeId}?mode=remove`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) { router.push('/employees'); router.refresh(); return }
    const data = (await res.json().catch(() => ({}))) as { error?: string; canSoftDelete?: boolean }
    setMsg(data.error ?? 'Delete failed')
  }

  async function markExited() {
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/employees/${employeeId}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) { router.push('/employees'); router.refresh(); return }
    setMsg('Could not mark exited')
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={remove} disabled={busy}
        className="px-4 py-1.5 bg-[#3a1414] border border-[#5a2020] text-[#f07070] text-xs rounded hover:bg-[#4a1a1a] disabled:opacity-50">
        Delete employee
      </button>
      {msg && (
        <div className="text-xs text-[#f0a070] space-y-1">
          <p>{msg}</p>
          <button type="button" onClick={markExited} disabled={busy}
            className="px-3 py-1 border border-[#2a3a50] text-[#c0a040] rounded hover:border-[#4a6a8a]">
            Mark Exited instead
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Render the button on the edit page**

Read `src/app/employees/[id]/page.tsx`. Import `DeleteEmployeeButton` and render it below the form (it already loads the employee — pass `employeeId={employee.id} name={employee.name}`).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compiles; routes present.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/employees/[id]/route.ts" "src/app/employees/[id]/delete-employee-button.tsx" "src/app/employees/[id]/page.tsx"
git commit -m "feat: guarded hard-delete employee (UI button + 409 fallback to Mark Exited)"
```

---

## Task A6: Employee import parser (pure, tested)

**Files:**
- Create: `src/lib/import/parse-employees.ts`
- Create: `src/lib/import/parse-employees.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/import/parse-employees.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { parseEmployeeRows } from './parse-employees'

describe('parseEmployeeRows', () => {
  it('maps headers case-insensitively and keeps valid rows', () => {
    const { valid, errors } = parseEmployeeRows([
      { Name: 'Asha', Salary: '15000', 'Emp ID': 'A1', 'Payment Mode': 'Cash' },
      { name: 'Bina', salary: '18000', Designation: 'Nurse' },
    ])
    expect(errors).toEqual([])
    expect(valid).toHaveLength(2)
    expect(valid[0]).toMatchObject({ name: 'Asha', empId: 'A1', defaultTotalSalary: 15000, paymentMode: 'CASH' })
    expect(valid[1]).toMatchObject({ name: 'Bina', defaultTotalSalary: 18000, designation: 'Nurse', paymentMode: 'BANK' })
  })

  it('reports row errors for missing name or salary (1-based, header = row 1)', () => {
    const { valid, errors } = parseEmployeeRows([
      { Name: '', Salary: '15000' },
      { Name: 'Cima', Salary: 'abc' },
    ])
    expect(valid).toHaveLength(0)
    expect(errors).toEqual([
      { row: 2, messages: ['name is required'] },
      { row: 3, messages: ['a salary figure is required'] },
    ])
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test -- parse-employees`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the parser**

Create `src/lib/import/parse-employees.ts`:
```ts
// Pure mapper from spreadsheet rows (already parsed to objects keyed by header)
// into validated employee inputs. Header matching is case-insensitive and
// whitespace-trimmed. Required: Name, Salary. Row numbers are 1-based with the
// header counted as row 1 (so the first data row is row 2).

export interface ParsedEmployee {
  empId: string | null
  name: string
  sex: string | null
  fatherSpouseName: string | null
  designation: string | null
  dateOfEntry: string | null
  mobile: string | null
  bankAccount: string | null
  ifsc: string | null
  paymentMode: 'BANK' | 'CASH'
  defaultTotalSalary: number
}

export interface RowError { row: number; messages: string[] }

const HEADER_ALIASES: Record<keyof Omit<ParsedEmployee, 'paymentMode' | 'defaultTotalSalary'> | 'salary' | 'paymentMode', string[]> = {
  name: ['name'],
  empId: ['emp id', 'empid', 'employee id', 'id'],
  sex: ['sex', 'gender'],
  fatherSpouseName: ['father/spouse', 'father / spouse', 'father/spouse name', 'father name', 'spouse name'],
  designation: ['designation', 'role'],
  dateOfEntry: ['date of entry', 'doj', 'joining date'],
  mobile: ['phone', 'mobile', 'mobile number'],
  bankAccount: ['bank a/c', 'bank account', 'account', 'a/c'],
  ifsc: ['ifsc', 'ifsc code'],
  salary: ['salary', 'total salary', 'gross', 'gross salary'],
  paymentMode: ['payment mode', 'mode', 'payment'],
}

function pick(row: Record<string, string>, aliases: string[]): string {
  const lower = new Map(Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]))
  for (const a of aliases) {
    const v = lower.get(a)
    if (v !== undefined && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

export function parseEmployeeRows(rows: Record<string, string>[]): { valid: ParsedEmployee[]; errors: RowError[] } {
  const valid: ParsedEmployee[] = []
  const errors: RowError[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // header is row 1
    const name = pick(row, HEADER_ALIASES.name)
    const salaryRaw = pick(row, HEADER_ALIASES.salary)
    const salary = Number(salaryRaw)
    const messages: string[] = []
    if (!name) messages.push('name is required')
    if (!(salaryRaw !== '' && Number.isFinite(salary) && salary > 0)) messages.push('a salary figure is required')
    if (messages.length > 0) { errors.push({ row: rowNum, messages }); return }

    const modeRaw = pick(row, HEADER_ALIASES.paymentMode).toUpperCase()
    valid.push({
      empId: pick(row, HEADER_ALIASES.empId) || null,
      name,
      sex: pick(row, HEADER_ALIASES.sex) || null,
      fatherSpouseName: pick(row, HEADER_ALIASES.fatherSpouseName) || null,
      designation: pick(row, HEADER_ALIASES.designation) || null,
      dateOfEntry: pick(row, HEADER_ALIASES.dateOfEntry) || null,
      mobile: pick(row, HEADER_ALIASES.mobile) || null,
      bankAccount: pick(row, HEADER_ALIASES.bankAccount) || null,
      ifsc: pick(row, HEADER_ALIASES.ifsc) || null,
      paymentMode: modeRaw === 'CASH' ? 'CASH' : 'BANK',
      defaultTotalSalary: salary,
    })
  })

  return { valid, errors }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- parse-employees`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/import/parse-employees.ts src/lib/import/parse-employees.test.ts
git commit -m "feat: pure employee-import row parser (header mapping + validation)"
```

---

## Task A7: Import API route + import page + sample

**Files:**
- Add dep: `xlsx`
- Create: `src/app/api/employees/import/route.ts`
- Create: `src/app/employees/import/page.tsx`
- Create: `src/app/employees/import/import-client.tsx`
- Modify: `src/app/employees/page.tsx` (add an "Import" action link)

- [ ] **Step 1: Add SheetJS**

Run: `npm install xlsx`
Expected: `xlsx` added to dependencies.

- [ ] **Step 2: Implement the import route (server-side file parse)**

Create `src/app/api/employees/import/route.ts`:
```ts
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { parseEmployeeRows } from '@/lib/import/parse-employees'
import { generateEmpId } from '@/domain/validations/employee'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const establishmentId = String(form.get('establishmentId') ?? '')
    const file = form.get('file')
    if (!establishmentId) return NextResponse.json({ error: 'establishmentId is required' }, { status: 422 })
    if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 422 })

    const est = await prisma.establishment.findUnique({ where: { id: establishmentId } })
    if (!est) return NextResponse.json({ error: 'establishmentId not found' }, { status: 422 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false })

    const { valid, errors } = parseEmployeeRows(rows)

    let created = 0
    let count = await prisma.employee.count({ where: { establishmentId } })
    for (const r of valid) {
      await prisma.employee.create({
        data: {
          empId: r.empId ?? generateEmpId(count),
          name: r.name,
          sex: r.sex,
          fatherSpouseName: r.fatherSpouseName,
          designation: r.designation,
          dateOfEntry: r.dateOfEntry ? new Date(r.dateOfEntry) : null,
          mobile: r.mobile,
          bankAccount: r.paymentMode === 'CASH' ? null : r.bankAccount,
          ifsc: r.paymentMode === 'CASH' ? null : r.ifsc,
          paymentMode: r.paymentMode,
          defaultTotalSalary: r.defaultTotalSalary,
          establishmentId,
        },
      })
      created++
      count++
    }

    return NextResponse.json({ created, errors })
  } catch (error) {
    console.error('POST /api/employees/import failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create the import client component**

Create `src/app/employees/import/import-client.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Est = { id: string; name: string }
type RowError = { row: number; messages: string[] }

export function ImportClient({ establishments }: { establishments: Est[] }) {
  const router = useRouter()
  const [establishmentId, setEstablishmentId] = useState(establishments[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: RowError[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true); setError(null); setResult(null)
    const fd = new FormData(e.currentTarget)
    fd.set('establishmentId', establishmentId)
    const res = await fetch('/api/employees/import', { method: 'POST', body: fd })
    setBusy(false)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error ?? 'Import failed'); return }
    setResult(data)
    router.refresh()
  }

  const sample =
    'Name,Salary,Emp ID,Sex,Father/Spouse,Designation,Date of Entry,Phone,Bank A/C,IFSC,Payment Mode\n' +
    'Asha,15000,,F,Raman,Nurse,2020-01-01,9000000000,1234567890,HDFC0001,Bank\n'
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(sample)}`

  return (
    <form onSubmit={submit} className="max-w-xl p-6 space-y-4">
      <a href={sampleHref} download="employee-import-sample.csv"
        className="text-xs text-[#4a9eff] hover:underline">Download sample CSV</a>

      <label className="block">
        <span className="block text-xs text-[#5a8ab8] mb-1">Establishment</span>
        <select value={establishmentId} onChange={(e) => setEstablishmentId(e.target.value)}
          aria-label="Establishment"
          className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8]">
          {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="block text-xs text-[#5a8ab8] mb-1">File (.csv, .txt, .xlsx)</span>
        <input type="file" name="file" accept=".csv,.txt,.xlsx" required
          aria-label="Employee file"
          className="text-xs text-[#c8d8e8]" />
      </label>

      <button type="submit" disabled={busy || !establishmentId}
        className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50">
        {busy ? 'Importing…' : 'Import'}
      </button>

      {error && <p className="text-sm text-[#f07070]">{error}</p>}
      {result && (
        <div className="text-xs space-y-2">
          <p className="text-[#5fd38a]">Imported {result.created} employee{result.created !== 1 ? 's' : ''}.</p>
          {result.errors.length > 0 && (
            <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-[#f0a070] space-y-1">
              <p className="font-semibold">{result.errors.length} row(s) skipped:</p>
              {result.errors.map((er) => <p key={er.row}>Row {er.row}: {er.messages.join(', ')}</p>)}
            </div>
          )}
        </div>
      )}
    </form>
  )
}
```

- [ ] **Step 4: Create the import page**

Create `src/app/employees/import/page.tsx`:
```tsx
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { ImportClient } from './import-client'

export const dynamic = 'force-dynamic'

export default async function ImportEmployeesPage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div>
      <PageHeader title="Import Employees" subtitle="Upload a CSV, TXT, or Excel file" />
      <ImportClient establishments={establishments} />
    </div>
  )
}
```

- [ ] **Step 5: Add an Import link on the employees list**

In `src/app/employees/page.tsx`, add a link to `/employees/import` near the page header action (e.g., a small "↥ Import" link in the filter row). Keep it minimal:
```tsx
          <Link href="/employees/import"
            className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060]">
            ↥ Import
          </Link>
```
(Place it inside the existing `<div className="flex gap-3 mb-4">` filter row; `Link` is already imported.)

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: compiles; `/employees/import` + `/api/employees/import` routes present.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json "src/app/api/employees/import/route.ts" "src/app/employees/import" "src/app/employees/page.tsx"
git commit -m "feat: employee import (CSV/TXT/XLSX) — route, page, sample, list link"
```

---

## Task A8: Verify + e2e + status

**Files:**
- Create: `e2e/15-employee-mgmt.spec.ts`
- Modify: `status.md`

- [ ] **Step 1: Write the e2e**

Create `e2e/15-employee-mgmt.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test.describe('Employee management (phase-2 wave A)', () => {
  test('create an employee with only name + salary (auto empId)', async ({ page }) => {
    await page.goto('/employees/new')
    await page.getByLabel('Name', { exact: true }).fill('Minimal Mary')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    // salary field — match by label containing "Salary"
    await page.getByLabel(/Salary/i).first().fill('15000')
    await page.getByRole('button', { name: /Add Employee/i }).click()
    await page.goto('/employees?q=Minimal Mary')
    await expect(page.getByText('Minimal Mary')).toBeVisible()
  })

  test('payment mode Cash disables bank fields', async ({ page }) => {
    await page.goto('/employees/new')
    await page.getByLabel('Payment Mode').selectOption('CASH')
    await expect(page.getByLabel(/Bank A\/C|Bank Account/i).first()).toBeDisabled()
  })

  test('import page is reachable and shows the sample link', async ({ page }) => {
    await page.goto('/employees')
    await page.getByRole('link', { name: /Import/i }).click()
    await expect(page).toHaveURL(/\/employees\/import/)
    await expect(page.getByRole('link', { name: /Download sample/i })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the new e2e**

Run: `npx playwright test e2e/15-employee-mgmt.spec.ts --reporter=list`
Expected: 3 passed. (If a label selector doesn't match the actual form labels, adjust the selector to the real label text — read `employee-form.tsx`.)

- [ ] **Step 3: Run unit + existing employee e2e (regression)**

Run: `npm test` then `npx playwright test e2e/03-employees.spec.ts --reporter=list`
Expected: unit all pass (incl. new employee, parse-employees tests); 03-employees green.

- [ ] **Step 4: Update status.md**

Append a `### Task Update — <today> — Phase-2 Wave A (employee management)` entry per the repo's status.md format (Task/Status/Scope/Files changed/Metrics/Validation/Next step).

- [ ] **Step 5: Commit**

```bash
git add e2e/15-employee-mgmt.spec.ts status.md
git commit -m "test: e2e for employee management wave A + status"
```

---

## Self-review notes
- **Spec coverage (Wave A):** #3 optional fields + auto empId (A1/A2/A3/A4) ✓; #4 paymentMode + cash clears bank (A1/A3/A4) ✓; #1 guarded hard-delete UI + route (A5) ✓; #2 import parser + route + page + xlsx (A6/A7) ✓.
- **Type consistency:** `validateEmployee(EmployeeInput)` with optional fields + `defaultTotalSalary`; `generateEmpId(count)`; `parseEmployeeRows -> { valid: ParsedEmployee[]; errors: RowError[] }`; `paymentMode` 'BANK'|'CASH' used consistently across schema, routes, form, parser.
- **Migrations:** A1 must run before A3/A7 build (the client needs `paymentMode`).
- **No placeholders:** all code steps complete.
- **Deferred:** Waves B (#5,#7) and C (#6,#8,#9,#10) are separate plans.
