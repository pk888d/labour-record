# Export Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete export pipeline: browser-printable A4 views for all 12 statutory forms, DOCX generation via docxtemplater, PDF via LibreOffice headless, export trigger API, and export history UI.

**Architecture:** Server-rendered React pages under `/print/[cycleId]/[formCode]` pull data via a shared `getCycleContext()` library and render A4-sized HTML tables. An export API route calls docxtemplater + LibreOffice headless to produce DOCX/PDF, stores paths in `GeneratedDocument`, and transitions the FormTask to EXPORTED. Export history page lists all generated documents per cycle.

**Tech Stack:** Next.js 16.2.6 App Router, Prisma 7 (SQLite), docxtemplater + pizzip (install), LibreOffice headless (system), Tailwind CSS v4, TypeScript strict.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/export/form-data.ts` | Create | `getCycleContext()` + 12 typed data functions |
| `src/lib/export/docx-generator.ts` | Create | docxtemplater wrapper |
| `src/lib/export/pdf-generator.ts` | Create | LibreOffice headless wrapper |
| `src/app/print/layout.tsx` | Create | A4 CSS, hide sidebar, white background |
| `src/app/print/[cycleId]/[formCode]/page.tsx` | Create | Dispatcher: switch on formCode → form component |
| `src/app/print/[cycleId]/[formCode]/print-button.tsx` | Create | `'use client'` window.print() button |
| `src/app/print/[cycleId]/[formCode]/hospital-form-xii.tsx` | Create | Wages Register (HOSPITAL) |
| `src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx` | Create | Muster Roll (HOSPITAL) |
| `src/app/print/[cycleId]/[formCode]/hospital-form-xi.tsx` | Create | Employee Register (HOSPITAL) |
| `src/app/print/[cycleId]/[formCode]/hospital-form-xvii.tsx` | Create | Wage Slip (reuses XII data) |
| `src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx` | Create | Overtime Muster Roll (HOSPITAL) |
| `src/app/print/[cycleId]/[formCode]/hospital-form-i.tsx` | Create | Fines Register (HOSPITAL) |
| `src/app/print/[cycleId]/[formCode]/hospital-form-ii.tsx` | Create | Deductions Register (HOSPITAL) |
| `src/app/print/[cycleId]/[formCode]/shop-form-w.tsx` | Create | Wages Register (SHOP) |
| `src/app/print/[cycleId]/[formCode]/shop-form-t.tsx` | Create | Wage Slip (reuses W data) |
| `src/app/print/[cycleId]/[formCode]/shop-form-u.tsx` | Create | Employee Register (SHOP) |
| `src/app/print/[cycleId]/[formCode]/shop-form-v.tsx` | Create | Employment Register (SHOP) |
| `src/app/print/[cycleId]/[formCode]/shop-form-x.tsx` | Create | Leave Register (SHOP) |
| `src/app/api/form-tasks/[id]/export/route.ts` | Create | POST: generate DOCX+PDF, store GeneratedDocument |
| `src/app/exports/page.tsx` | Create | Export history list |
| `src/app/cycles/[id]/page.tsx` | Modify | Add Print + Export buttons per FormTask |
| `templates/README.md` | Create | Template format docs |
| `templates/hospital/.gitkeep` | Create | Placeholder |
| `templates/shop/.gitkeep` | Create | Placeholder |
| `exports/.gitkeep` | Create | Generated output dir (gitignored) |
| `.gitignore` | Modify | Add `exports/` |

---

## Shared Types & Patterns

### CycleContext (used by all form data functions)

```typescript
export type CycleContext = {
  cycleId: string
  cycle: { id: string; month: number; year: number; wagePeriodDays: number }
  establishment: {
    name: string
    address: string
    employerName: string
    managerName: string
    regCertNo: string
    type: 'HOSPITAL' | 'SHOP'
    wageFormulaConfig: WageFormulaConfig
  }
  employees: Array<{
    employeeId: string
    empId: string
    name: string
    sex: string
    designation: string
    department: string | null
    dateOfEntry: string
    uan: string | null
    esiNo: string | null
  }>
  daysInMonth: number
}
```

### fmt helper (used in all form components)

```typescript
const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)
```

### Attendance mark display

```typescript
// P = Present, A = Absent, H = Holiday, PH = Public Holiday, WO = Week Off, L = Leave
const markLabel: Record<string, string> = {
  P: 'P', A: 'A', H: 'H', PH: 'PH', WO: 'WO', L: 'L',
  OT: 'OT', HD: 'HD', '': '-'
}
```

---

## Task 1: Form Data Extraction Library

**Files:**
- Create: `src/lib/export/form-data.ts`

- [ ] **Step 1: Install dependencies and confirm prisma import path**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npm install docxtemplater pizzip
```

Confirm `src/generated/prisma/client` exists. The import alias is `@/lib/prisma` (already used everywhere).

- [ ] **Step 2: Write form-data.ts with CycleContext and all 12 data functions**

Create `src/lib/export/form-data.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import type { WageFormulaConfig } from '@/types'

export const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

export type CycleContext = {
  cycleId: string
  cycle: { id: string; month: number; year: number; wagePeriodDays: number }
  establishment: {
    name: string
    address: string
    employerName: string
    managerName: string
    regCertNo: string
    type: 'HOSPITAL' | 'SHOP'
    wageFormulaConfig: WageFormulaConfig
  }
  employees: Array<{
    employeeId: string
    empId: string
    name: string
    sex: string
    designation: string
    department: string | null
    dateOfEntry: string
    uan: string | null
    esiNo: string | null
  }>
  daysInMonth: number
}

export type WagesRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  department: string | null
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  grossEarnings: number
  pf: number
  esi: number
  lwf: number
  fineDeduction: number
  otherDeductions: number
  advanceRecovered: number
  netWage: number
  paymentDate: string
  receiptRef: string
}

export type MusterRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  dailyMarks: string[]
  totalPresent: number
  totalAbsent: number
  workStartTime: string
  workEndTime: string
  restInterval: string
  remarks: string
}

export type EmployeeRow = {
  employeeId: string
  empId: string
  name: string
  sex: string
  designation: string
  department: string | null
  dateOfEntry: string
  uan: string | null
  esiNo: string | null
  fatherSpouseName: string
  dob: string
  address: string
}

export type OvertimeRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  dailyOt: number[]
  totalOtHours: number
  normalHoursRate: number
  otRate: number
  normalEarnings: number
  otEarnings: number
}

export type FineRow = {
  id: string
  employeeId: string
  empId: string
  name: string
  offenceDate: string
  offenceDescription: string
  fineAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

export type DeductionRow = {
  id: string
  employeeId: string
  empId: string
  name: string
  damageDate: string
  description: string
  deductionAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

export type LeaveRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  earnedLeaveOpening: number
  earnedDuring: number
  earnedAvailed: number
  earnedClosing: number
  medicalLeave: number
  otherLeave: number
  remarks: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export async function getCycleContext(cycleId: string): Promise<CycleContext> {
  const cycle = await prisma.cycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: {
      establishment: true,
      cycleEmployees: {
        include: { employee: true },
        orderBy: { employee: { name: 'asc' } },
      },
    },
  })

  const snap = (ce: typeof cycle.cycleEmployees[0]) => {
    const s = JSON.parse(ce.empDataSnapshot) as Record<string, string>
    return {
      employeeId: ce.employeeId,
      empId: s.empId ?? ce.employee.empId,
      name: s.name ?? ce.employee.name,
      sex: s.sex ?? ce.employee.sex,
      designation: s.designation ?? ce.employee.designation,
      department: s.department ?? ce.employee.department,
      dateOfEntry: s.dateOfEntry ?? (ce.employee.dateOfEntry ? new Date(ce.employee.dateOfEntry).toISOString().split('T')[0] : ''),
      uan: s.uan ?? ce.employee.uan ?? null,
      esiNo: s.esiNo ?? ce.employee.esiNo ?? null,
    }
  }

  const wageFormulaConfig = JSON.parse(cycle.establishment.wageFormulaConfig) as WageFormulaConfig

  return {
    cycleId,
    cycle: {
      id: cycle.id,
      month: cycle.month,
      year: cycle.year,
      wagePeriodDays: cycle.wagePeriodDays,
    },
    establishment: {
      name: cycle.establishment.name,
      address: cycle.establishment.address ?? '',
      employerName: cycle.establishment.employerName ?? '',
      managerName: cycle.establishment.managerName ?? '',
      regCertNo: cycle.establishment.regCertNo ?? '',
      type: cycle.establishment.type as 'HOSPITAL' | 'SHOP',
      wageFormulaConfig,
    },
    employees: cycle.cycleEmployees.map(snap),
    daysInMonth: getDaysInMonth(cycle.year, cycle.month),
  }
}

export async function getWagesData(ctx: CycleContext): Promise<WagesRow[]> {
  const wages = await prisma.wageRecord.findMany({ where: { cycleId: ctx.cycleId } })
  const fines = await prisma.fineRecord.findMany({ where: { cycleId: ctx.cycleId } })

  return ctx.employees.map((emp) => {
    const w = wages.find((r) => r.employeeId === emp.employeeId)
    const empFines = fines.filter((f) => f.employeeId === emp.employeeId)
    const fineDeduction = empFines.reduce((s, f) => s + f.fineAmount, 0)
    const otherAllowances = w
      ? Number((JSON.parse(w.otherAllowances) as number[])[0] ?? 0)
      : 0
    const gross = (w?.basic ?? 0) + (w?.da ?? 0) + (w?.hra ?? 0) + otherAllowances
    const totalDed = (w?.pf ?? 0) + (w?.esi ?? 0) + (w?.lwf ?? 0) + fineDeduction +
      (w?.otherDeductions ?? 0) + (w?.advanceRecovered ?? 0)
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      daysWorked: w?.daysWorked ?? 0,
      basic: w?.basic ?? 0,
      da: w?.da ?? 0,
      hra: w?.hra ?? 0,
      otherAllowances,
      grossEarnings: gross,
      pf: w?.pf ?? 0,
      esi: w?.esi ?? 0,
      lwf: w?.lwf ?? 0,
      fineDeduction,
      otherDeductions: w?.otherDeductions ?? 0,
      advanceRecovered: w?.advanceRecovered ?? 0,
      netWage: gross - totalDed,
      paymentDate: w?.paymentDate ? new Date(w.paymentDate).toISOString().split('T')[0] : '',
      receiptRef: w?.receiptRef ?? '',
    }
  })
}

export async function getMusterData(ctx: CycleContext): Promise<MusterRow[]> {
  const att = await prisma.attendanceRecord.findMany({ where: { cycleId: ctx.cycleId } })
  return ctx.employees.map((emp) => {
    const r = att.find((a) => a.employeeId === emp.employeeId)
    const storedMarks = r ? (JSON.parse(r.dailyMarks) as string[]) : []
    const marks = storedMarks.length >= ctx.daysInMonth
      ? storedMarks.slice(0, ctx.daysInMonth)
      : [...storedMarks, ...Array(ctx.daysInMonth - storedMarks.length).fill('')]
    const totalPresent = marks.filter((m) => m === 'P' || m === 'OT' || m === 'HD').length
    const totalAbsent = marks.filter((m) => m === 'A').length
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      dailyMarks: marks,
      totalPresent,
      totalAbsent,
      workStartTime: r?.workStartTime ?? '',
      workEndTime: r?.workEndTime ?? '',
      restInterval: r?.restInterval ?? '',
      remarks: r?.remarks ?? '',
    }
  })
}

export async function getEmployeeData(ctx: CycleContext): Promise<EmployeeRow[]> {
  const empIds = ctx.employees.map((e) => e.employeeId)
  const dbEmps = await prisma.employee.findMany({ where: { id: { in: empIds } } })
  return ctx.employees.map((emp) => {
    const db = dbEmps.find((e) => e.id === emp.employeeId)
    return {
      ...emp,
      fatherSpouseName: db?.fatherSpouseName ?? '',
      dob: db?.dob ? new Date(db.dob).toISOString().split('T')[0] : '',
      address: db?.address ?? '',
    }
  })
}

export async function getOvertimeData(ctx: CycleContext): Promise<OvertimeRow[]> {
  const ot = await prisma.overtimeRecord.findMany({ where: { cycleId: ctx.cycleId } })
  return ctx.employees.map((emp) => {
    const r = ot.find((o) => o.employeeId === emp.employeeId)
    const storedDailyOt = r ? (JSON.parse(r.dailyOt) as number[]) : []
    const dailyOt = storedDailyOt.length >= ctx.daysInMonth
      ? storedDailyOt.slice(0, ctx.daysInMonth)
      : [...storedDailyOt, ...Array(ctx.daysInMonth - storedDailyOt.length).fill(0)]
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      dailyOt,
      totalOtHours: r?.totalOtHours ?? 0,
      normalHoursRate: r?.normalHoursRate ?? 0,
      otRate: r?.otRate ?? 0,
      normalEarnings: r?.normalEarnings ?? 0,
      otEarnings: r?.otEarnings ?? 0,
    }
  })
}

export async function getFinesData(ctx: CycleContext): Promise<FineRow[]> {
  const fines = await prisma.fineRecord.findMany({
    where: { cycleId: ctx.cycleId },
    include: { employee: { select: { empId: true } } },
    orderBy: { offenceDate: 'asc' },
  })
  return fines.map((f) => {
    const emp = ctx.employees.find((e) => e.employeeId === f.employeeId)
    return {
      id: f.id,
      employeeId: f.employeeId,
      empId: emp?.empId ?? f.employee.empId,
      name: emp?.name ?? '',
      offenceDate: new Date(f.offenceDate).toISOString().split('T')[0],
      offenceDescription: f.offenceDescription,
      fineAmount: f.fineAmount,
      recovered: f.recovered,
      pendingRecovery: f.pendingRecovery,
      remarks: f.remarks ?? '',
    }
  })
}

export async function getDeductionsData(ctx: CycleContext): Promise<DeductionRow[]> {
  const ded = await prisma.deductionRecord.findMany({
    where: { cycleId: ctx.cycleId },
    include: { employee: { select: { empId: true } } },
    orderBy: { damageDate: 'asc' },
  })
  return ded.map((d) => {
    const emp = ctx.employees.find((e) => e.employeeId === d.employeeId)
    return {
      id: d.id,
      employeeId: d.employeeId,
      empId: emp?.empId ?? d.employee.empId,
      name: emp?.name ?? '',
      damageDate: new Date(d.damageDate).toISOString().split('T')[0],
      description: d.description,
      deductionAmount: d.deductionAmount,
      recovered: d.recovered,
      pendingRecovery: d.pendingRecovery,
      remarks: d.remarks ?? '',
    }
  })
}

export async function getLeaveData(ctx: CycleContext): Promise<LeaveRow[]> {
  const leave = await prisma.leaveRecord.findMany({ where: { cycleId: ctx.cycleId } })
  return ctx.employees.map((emp) => {
    const r = leave.find((l) => l.employeeId === emp.employeeId)
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      earnedLeaveOpening: r?.earnedLeaveOpening ?? 0,
      earnedDuring: r?.earnedDuring ?? 0,
      earnedAvailed: r?.earnedAvailed ?? 0,
      earnedClosing: r?.earnedClosing ?? 0,
      medicalLeave: r?.medicalLeave ?? 0,
      otherLeave: r?.otherLeave ?? 0,
      remarks: r?.remarks ?? '',
    }
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors from `src/lib/export/form-data.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/export/form-data.ts package.json package-lock.json
git commit -m "feat: add form data extraction library and install docxtemplater/pizzip"
```

---

## Task 2: Print Layout + Route Dispatcher + PrintButton

**Files:**
- Create: `src/app/print/layout.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/page.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/print-button.tsx`

- [ ] **Step 1: Create print layout**

Create `src/app/print/layout.tsx`:

```tsx
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        aside { display: none !important; }
        main { background: white !important; color: black !important; padding: 0 !important; overflow: visible !important; }
        body { background: white !important; color: black !important; }
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 2px 4px; font-size: 9px; line-height: 1.2; }
        th { background: #f0f0f0; font-weight: bold; text-align: center; }
        .totals-row { font-weight: bold; background: #f9f9f9; }
        .form-page { padding: 4mm; font-family: Arial, sans-serif; }
        .form-header { text-align: center; margin-bottom: 6px; }
        .form-header h2 { font-size: 12px; font-weight: bold; margin: 2px 0; }
        .form-header p { font-size: 10px; margin: 1px 0; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 9px; }
        .no-print { display: block; }
        @media print { .no-print { display: none !important; } }
      `}</style>
      {children}
    </>
  )
}
```

- [ ] **Step 2: Create PrintButton client component**

Create `src/app/print/[cycleId]/[formCode]/print-button.tsx`:

```tsx
'use client'

export function PrintButton() {
  return (
    <div className="no-print" style={{ padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
      <button
        onClick={() => window.print()}
        style={{
          padding: '6px 16px',
          background: '#1a5adc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        Print / Save as PDF
      </button>
      <span style={{ marginLeft: '12px', fontSize: '11px', color: '#666' }}>
        Use your browser's Print dialog (Ctrl+P / Cmd+P)
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Create dispatcher page.tsx (stub with placeholders for unimplemented forms)**

Create `src/app/print/[cycleId]/[formCode]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getCycleContext, getWagesData, getMusterData, getEmployeeData,
  getOvertimeData, getFinesData, getDeductionsData, getLeaveData } from '@/lib/export/form-data'
import { PrintButton } from './print-button'
import { HospitalFormXII } from './hospital-form-xii'
import { HospitalFormV } from './hospital-form-v'
import { HospitalFormXI } from './hospital-form-xi'
import { HospitalFormXVII } from './hospital-form-xvii'
import { HospitalFormIV } from './hospital-form-iv'
import { HospitalFormI } from './hospital-form-i'
import { HospitalFormII } from './hospital-form-ii'
import { ShopFormW } from './shop-form-w'
import { ShopFormT } from './shop-form-t'
import { ShopFormU } from './shop-form-u'
import { ShopFormV } from './shop-form-v'
import { ShopFormX } from './shop-form-x'

const VALID_CODES = [
  'HOSPITAL_FORM_XII','HOSPITAL_FORM_V','HOSPITAL_FORM_XI','HOSPITAL_FORM_XVII',
  'HOSPITAL_FORM_IV','HOSPITAL_FORM_I','HOSPITAL_FORM_II',
  'SHOP_FORM_W','SHOP_FORM_T','SHOP_FORM_U','SHOP_FORM_V','SHOP_FORM_X',
]

export default async function PrintPage({
  params,
}: {
  params: Promise<{ cycleId: string; formCode: string }>
}) {
  const { cycleId, formCode } = await params
  if (!VALID_CODES.includes(formCode)) notFound()

  const ctx = await getCycleContext(cycleId)

  let content: React.ReactNode

  switch (formCode) {
    case 'HOSPITAL_FORM_XII': {
      const wages = await getWagesData(ctx)
      content = <HospitalFormXII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_V': {
      const muster = await getMusterData(ctx)
      content = <HospitalFormV ctx={ctx} muster={muster} />
      break
    }
    case 'HOSPITAL_FORM_XI': {
      const employees = await getEmployeeData(ctx)
      content = <HospitalFormXI ctx={ctx} employees={employees} />
      break
    }
    case 'HOSPITAL_FORM_XVII': {
      const wages = await getWagesData(ctx)
      content = <HospitalFormXVII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_IV': {
      const ot = await getOvertimeData(ctx)
      content = <HospitalFormIV ctx={ctx} ot={ot} />
      break
    }
    case 'HOSPITAL_FORM_I': {
      const fines = await getFinesData(ctx)
      content = <HospitalFormI ctx={ctx} fines={fines} />
      break
    }
    case 'HOSPITAL_FORM_II': {
      const ded = await getDeductionsData(ctx)
      content = <HospitalFormII ctx={ctx} deductions={ded} />
      break
    }
    case 'SHOP_FORM_W': {
      const wages = await getWagesData(ctx)
      content = <ShopFormW ctx={ctx} wages={wages} />
      break
    }
    case 'SHOP_FORM_T': {
      const wages = await getWagesData(ctx)
      content = <ShopFormT ctx={ctx} wages={wages} />
      break
    }
    case 'SHOP_FORM_U': {
      const employees = await getEmployeeData(ctx)
      content = <ShopFormU ctx={ctx} employees={employees} />
      break
    }
    case 'SHOP_FORM_V': {
      const muster = await getMusterData(ctx)
      content = <ShopFormV ctx={ctx} muster={muster} />
      break
    }
    case 'SHOP_FORM_X': {
      const leave = await getLeaveData(ctx)
      content = <ShopFormX ctx={ctx} leave={leave} />
      break
    }
    default:
      notFound()
  }

  return (
    <>
      <PrintButton />
      {content}
    </>
  )
}
```

- [ ] **Step 4: Verify TypeScript (imports will fail until form components exist — OK at this stage)**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | grep -v "Cannot find module './hospital" | grep -v "Cannot find module './shop" | head -20
```

Expected: no errors other than missing form component imports (those come in Tasks 3-5).

- [ ] **Step 5: Commit**

```bash
git add src/app/print/layout.tsx src/app/print/[cycleId]/[formCode]/page.tsx src/app/print/[cycleId]/[formCode]/print-button.tsx
git commit -m "feat: add print layout, route dispatcher, and PrintButton"
```

---

## Task 3: Hospital Form XII (Wages Register) + Form V (Muster Roll)

**Files:**
- Create: `src/app/print/[cycleId]/[formCode]/hospital-form-xii.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx`

- [ ] **Step 1: Create hospital-form-xii.tsx (Wages Register)**

Form XII header: "REGISTER OF WAGES — Form XII [Rule 78(1)(a)(i)]"
Columns: S.No | Emp ID | Name | Designation | Dept | Days Worked | Basic | DA | HRA | Other Allow | Gross | PF | ESI | LWF | Fine Ded | Other Ded | Advance | Net Wage | Payment Date | Receipt Ref

Create `src/app/print/[cycleId]/[formCode]/hospital-form-xii.tsx`:

```tsx
import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

export function HospitalFormXII({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const totals = {
    daysWorked: wages.reduce((s, r) => s + r.daysWorked, 0),
    basic: wages.reduce((s, r) => s + r.basic, 0),
    da: wages.reduce((s, r) => s + r.da, 0),
    hra: wages.reduce((s, r) => s + r.hra, 0),
    otherAllowances: wages.reduce((s, r) => s + r.otherAllowances, 0),
    grossEarnings: wages.reduce((s, r) => s + r.grossEarnings, 0),
    pf: wages.reduce((s, r) => s + r.pf, 0),
    esi: wages.reduce((s, r) => s + r.esi, 0),
    lwf: wages.reduce((s, r) => s + r.lwf, 0),
    fineDeduction: wages.reduce((s, r) => s + r.fineDeduction, 0),
    otherDeductions: wages.reduce((s, r) => s + r.otherDeductions, 0),
    advanceRecovered: wages.reduce((s, r) => s + r.advanceRecovered, 0),
    netWage: wages.reduce((s, r) => s + r.netWage, 0),
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF WAGES</h2>
        <p>Form XII [Rule 78(1)(a)(i)] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Designation</th>
            <th>Dept</th>
            <th>Days</th>
            <th>Basic</th>
            <th>DA</th>
            <th>HRA</th>
            <th>Other Allow</th>
            <th>Gross</th>
            <th>PF</th>
            <th>ESI</th>
            <th>LWF</th>
            <th>Fine Ded</th>
            <th>Other Ded</th>
            <th>Advance</th>
            <th>Net Wage</th>
            <th>Paid On</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {wages.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              <td>{row.department ?? ''}</td>
              <td style={{ textAlign: 'center' }}>{row.daysWorked}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.da)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.grossEarnings)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.fineDeduction)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otherDeductions)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.advanceRecovered)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.netWage)}</td>
              <td style={{ textAlign: 'center' }}>{row.paymentDate}</td>
              <td>{row.receiptRef}</td>
            </tr>
          ))}
          <tr className="totals-row">
            <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL</td>
            <td style={{ textAlign: 'center' }}>{totals.daysWorked}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.basic)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.da)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.hra)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.otherAllowances)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.grossEarnings)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.pf)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.esi)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.lwf)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.fineDeduction)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.otherDeductions)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.advanceRecovered)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.netWage)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9px' }}>
        <div>Manager/Employer Signature: ____________________________</div>
        <div>Date: ____________________________</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create hospital-form-v.tsx (Muster Roll)**

Form V header: "MUSTER ROLL — Form V [Rule 77]"
Columns: S.No | Emp ID | Name | Designation | Day 1..N | Total P | Total A | Work Hours | Rest | Remarks

Create `src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx`:

```tsx
import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function HospitalFormV({ ctx, muster }: { ctx: CycleContext; muster: MusterRow[] }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>MUSTER ROLL</h2>
        <p>Form V [Rule 77] — Tamil Nadu Payment of Wages Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Emp ID</th>
            <th rowSpan={2}>Name</th>
            <th rowSpan={2}>Designation</th>
            <th colSpan={daysInMonth}>Attendance ({period})</th>
            <th rowSpan={2}>Total P</th>
            <th rowSpan={2}>Total A</th>
            <th rowSpan={2}>Work Hrs</th>
            <th rowSpan={2}>Rest</th>
            <th rowSpan={2}>Remarks</th>
          </tr>
          <tr>
            {days.map((d) => (
              <th key={d} style={{ minWidth: '14px' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {muster.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              {row.dailyMarks.map((m, d) => (
                <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{m || '-'}</td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalPresent}</td>
              <td style={{ textAlign: 'center' }}>{row.totalAbsent}</td>
              <td style={{ textAlign: 'center' }}>{row.workStartTime}{row.workEndTime ? `–${row.workEndTime}` : ''}</td>
              <td style={{ textAlign: 'center' }}>{row.restInterval}</td>
              <td>{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '16px', fontSize: '9px' }}>
        P=Present A=Absent H=Holiday WO=Week Off L=Leave OT=Overtime HD=Half Day PH=Public Holiday
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors from the two new files.

- [ ] **Step 4: Commit**

```bash
git add src/app/print/[cycleId]/[formCode]/hospital-form-xii.tsx src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx
git commit -m "feat: add Hospital Form XII (Wages) and Form V (Muster Roll) print views"
```

---

## Task 4: Hospital Form XI + XVII + IV Print Views

**Files:**
- Create: `src/app/print/[cycleId]/[formCode]/hospital-form-xi.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/hospital-form-xvii.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx`

- [ ] **Step 1: Create hospital-form-xi.tsx (Employee Register)**

Form XI header: "REGISTER OF EMPLOYEES — Form XI [Rule 74]"
Columns: S.No | Emp ID | Name | Father/Spouse | Sex | DOB | Designation | Dept | Date of Entry | Address | UAN | ESI No

Create `src/app/print/[cycleId]/[formCode]/hospital-form-xi.tsx`:

```tsx
import type { CycleContext, EmployeeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function HospitalFormXI({ ctx, employees }: { ctx: CycleContext; employees: EmployeeRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF EMPLOYEES</h2>
        <p>Form XI [Rule 74] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — as of {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Father/Spouse</th>
            <th>Sex</th>
            <th>DOB</th>
            <th>Designation</th>
            <th>Department</th>
            <th>Date of Entry</th>
            <th>Address</th>
            <th>UAN</th>
            <th>ESI No</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr key={emp.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{emp.empId}</td>
              <td>{emp.name}</td>
              <td>{emp.fatherSpouseName}</td>
              <td style={{ textAlign: 'center' }}>{emp.sex}</td>
              <td style={{ textAlign: 'center' }}>{emp.dob}</td>
              <td>{emp.designation}</td>
              <td>{emp.department ?? ''}</td>
              <td style={{ textAlign: 'center' }}>{emp.dateOfEntry}</td>
              <td>{emp.address}</td>
              <td>{emp.uan ?? ''}</td>
              <td>{emp.esiNo ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create hospital-form-xvii.tsx (Wage Slip)**

Form XVII renders individual wage slips (one card per employee, 2 per row).
Header: "WAGE SLIP — Form XVII [Rule 78(1)(a)(ii)]"

Create `src/app/print/[cycleId]/[formCode]/hospital-form-xvii.tsx`:

```tsx
import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

function WageSlipCard({ row, establishment, period, idx }: {
  row: WagesRow
  establishment: CycleContext['establishment']
  period: string
  idx: number
}) {
  return (
    <div style={{
      border: '1px solid #000',
      padding: '6px',
      fontSize: '9px',
      pageBreakInside: 'avoid',
    }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '4px' }}>
        WAGE SLIP — {establishment.name} — {period}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '4px' }}>
        <div>Emp No: <strong>{row.empId}</strong></div>
        <div>Name: <strong>{row.name}</strong></div>
        <div>Designation: {row.designation}</div>
        <div>Dept: {row.department ?? '-'}</div>
        <div>Days Worked: {row.daysWorked}</div>
        <div>Payment Date: {row.paymentDate || '-'}</div>
      </div>
      <table style={{ width: '100%', marginBottom: '4px' }}>
        <thead>
          <tr>
            <th colSpan={2}>Earnings</th>
            <th colSpan={2}>Deductions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic</td><td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td>
            <td>PF</td><td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td>
          </tr>
          <tr>
            <td>DA</td><td style={{ textAlign: 'right' }}>{fmt(row.da)}</td>
            <td>ESI</td><td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td>
          </tr>
          <tr>
            <td>HRA</td><td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td>
            <td>LWF</td><td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td>
          </tr>
          <tr>
            <td>Other Allow</td><td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td>
            <td>Fine Ded</td><td style={{ textAlign: 'right' }}>{fmt(row.fineDeduction)}</td>
          </tr>
          <tr>
            <td></td><td></td>
            <td>Other Ded</td><td style={{ textAlign: 'right' }}>{fmt(row.otherDeductions)}</td>
          </tr>
          <tr>
            <td></td><td></td>
            <td>Advance</td><td style={{ textAlign: 'right' }}>{fmt(row.advanceRecovered)}</td>
          </tr>
          <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000' }}>
            <td>Gross</td><td style={{ textAlign: 'right' }}>{fmt(row.grossEarnings)}</td>
            <td>Net Wage</td><td style={{ textAlign: 'right' }}>{fmt(row.netWage)}</td>
          </tr>
        </tbody>
      </table>
      <div>Employee Signature: ________________________</div>
    </div>
  )
}

export function HospitalFormXVII({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header no-print">
        <h2>WAGE SLIPS</h2>
        <p>Form XVII [Rule 78(1)(a)(ii)] — {establishment.name} — {period}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {wages.map((row, i) => (
          <WageSlipCard key={row.employeeId} row={row} establishment={establishment} period={period} idx={i} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create hospital-form-iv.tsx (Overtime Muster Roll)**

Form IV header: "OVERTIME MUSTER ROLL — Form IV [Rule 25]"
Columns: S.No | Emp ID | Name | Designation | Day 1..N | Total OT Hours | Normal Rate | OT Rate | Normal Earnings | OT Earnings | Total Earnings

Create `src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx`:

```tsx
import type { CycleContext, OvertimeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

export function HospitalFormIV({ ctx, ot }: { ctx: CycleContext; ot: OvertimeRow[] }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>OVERTIME MUSTER ROLL</h2>
        <p>Form IV [Rule 25] — Tamil Nadu Factories Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Emp ID</th>
            <th rowSpan={2}>Name</th>
            <th rowSpan={2}>Designation</th>
            <th colSpan={daysInMonth}>Daily OT Hours</th>
            <th rowSpan={2}>Total OT Hrs</th>
            <th rowSpan={2}>Normal Rate (₹/hr)</th>
            <th rowSpan={2}>OT Rate (₹/hr)</th>
            <th rowSpan={2}>Normal Earnings</th>
            <th rowSpan={2}>OT Earnings</th>
            <th rowSpan={2}>Total Earnings</th>
          </tr>
          <tr>
            {days.map((d) => <th key={d} style={{ minWidth: '14px' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {ot.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              {row.dailyOt.map((h, d) => (
                <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{h > 0 ? h : '-'}</td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalOtHours}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.normalHoursRate)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otRate)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.normalEarnings)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otEarnings)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.normalEarnings + row.otEarnings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/print/[cycleId]/[formCode]/hospital-form-xi.tsx src/app/print/[cycleId]/[formCode]/hospital-form-xvii.tsx src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx
git commit -m "feat: add Hospital Form XI (Employee Register), Form XVII (Wage Slip), Form IV (Overtime) print views"
```

---

## Task 5: Hospital Form I + II + All 5 Shop Forms

**Files:**
- Create: `src/app/print/[cycleId]/[formCode]/hospital-form-i.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/hospital-form-ii.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/shop-form-w.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/shop-form-t.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/shop-form-u.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/shop-form-v.tsx`
- Create: `src/app/print/[cycleId]/[formCode]/shop-form-x.tsx`

- [ ] **Step 1: Create hospital-form-i.tsx (Fines Register)**

Form I header: "REGISTER OF FINES — Form I [Rule 3]"
Columns: S.No | Emp ID | Name | Offence Date | Offence Description | Fine Amount | Recovered | Pending Recovery | Remarks

Create `src/app/print/[cycleId]/[formCode]/hospital-form-i.tsx`:

```tsx
import type { CycleContext, FineRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

export function HospitalFormI({ ctx, fines }: { ctx: CycleContext; fines: FineRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF FINES</h2>
        <p>Form I [Rule 3] — Tamil Nadu Payment of Wages Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      {fines.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>No fines recorded for this period.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Offence Date</th>
              <th>Offence Description</th>
              <th>Fine Amount (₹)</th>
              <th>Recovered (₹)</th>
              <th>Pending (₹)</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {fines.map((row, i) => (
              <tr key={row.id}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{row.empId}</td>
                <td>{row.name}</td>
                <td style={{ textAlign: 'center' }}>{row.offenceDate}</td>
                <td>{row.offenceDescription}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.fineAmount)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.recovered)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.pendingRecovery)}</td>
                <td>{row.remarks}</td>
              </tr>
            ))}
            <tr className="totals-row">
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL</td>
              <td style={{ textAlign: 'right' }}>{fmt(fines.reduce((s, r) => s + r.fineAmount, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(fines.reduce((s, r) => s + r.recovered, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(fines.reduce((s, r) => s + r.pendingRecovery, 0))}</td>
              <td />
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create hospital-form-ii.tsx (Deductions Register)**

Form II header: "REGISTER OF DEDUCTIONS — Form II [Rule 4]"
Columns: S.No | Emp ID | Name | Damage Date | Description | Deduction Amount | Recovered | Pending | Remarks

Create `src/app/print/[cycleId]/[formCode]/hospital-form-ii.tsx`:

```tsx
import type { CycleContext, DeductionRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

export function HospitalFormII({ ctx, deductions }: { ctx: CycleContext; deductions: DeductionRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS</h2>
        <p>Form II [Rule 4] — Tamil Nadu Payment of Wages Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      {deductions.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>No deductions recorded for this period.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Damage Date</th>
              <th>Description</th>
              <th>Deduction Amount (₹)</th>
              <th>Recovered (₹)</th>
              <th>Pending (₹)</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((row, i) => (
              <tr key={row.id}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{row.empId}</td>
                <td>{row.name}</td>
                <td style={{ textAlign: 'center' }}>{row.damageDate}</td>
                <td>{row.description}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.deductionAmount)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.recovered)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.pendingRecovery)}</td>
                <td>{row.remarks}</td>
              </tr>
            ))}
            <tr className="totals-row">
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL</td>
              <td style={{ textAlign: 'right' }}>{fmt(deductions.reduce((s, r) => s + r.deductionAmount, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(deductions.reduce((s, r) => s + r.recovered, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(deductions.reduce((s, r) => s + r.pendingRecovery, 0))}</td>
              <td />
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create shop-form-w.tsx (Wages Register — Shop)**

Same structure as hospital-form-xii.tsx. Header: "REGISTER OF WAGES — Form W [Rule 18]"

Create `src/app/print/[cycleId]/[formCode]/shop-form-w.tsx`:

```tsx
import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

export function ShopFormW({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const totals = {
    daysWorked: wages.reduce((s, r) => s + r.daysWorked, 0),
    grossEarnings: wages.reduce((s, r) => s + r.grossEarnings, 0),
    pf: wages.reduce((s, r) => s + r.pf, 0),
    esi: wages.reduce((s, r) => s + r.esi, 0),
    lwf: wages.reduce((s, r) => s + r.lwf, 0),
    fineDeduction: wages.reduce((s, r) => s + r.fineDeduction, 0),
    otherDeductions: wages.reduce((s, r) => s + r.otherDeductions, 0),
    advanceRecovered: wages.reduce((s, r) => s + r.advanceRecovered, 0),
    netWage: wages.reduce((s, r) => s + r.netWage, 0),
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF WAGES</h2>
        <p>Form W [Rule 18] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Designation</th>
            <th>Days</th>
            <th>Basic</th>
            <th>DA</th>
            <th>HRA</th>
            <th>Other Allow</th>
            <th>Gross</th>
            <th>PF</th>
            <th>ESI</th>
            <th>LWF</th>
            <th>Fine Ded</th>
            <th>Other Ded</th>
            <th>Advance</th>
            <th>Net Wage</th>
            <th>Paid On</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {wages.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              <td style={{ textAlign: 'center' }}>{row.daysWorked}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.da)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.grossEarnings)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.fineDeduction)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otherDeductions)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.advanceRecovered)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.netWage)}</td>
              <td style={{ textAlign: 'center' }}>{row.paymentDate}</td>
              <td>{row.receiptRef}</td>
            </tr>
          ))}
          <tr className="totals-row">
            <td colSpan={4} style={{ textAlign: 'right' }}>TOTAL</td>
            <td style={{ textAlign: 'center' }}>{totals.daysWorked}</td>
            <td colSpan={4} />
            <td style={{ textAlign: 'right' }}>{fmt(totals.grossEarnings)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.pf)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.esi)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.lwf)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.fineDeduction)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.otherDeductions)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.advanceRecovered)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.netWage)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create shop-form-t.tsx (Wage Slip — Shop)**

Same structure as hospital-form-xvii.tsx but with Form T header. Header: "WAGE SLIP — Form T [Rule 19]"

Create `src/app/print/[cycleId]/[formCode]/shop-form-t.tsx`:

```tsx
import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

function ShopWageSlipCard({ row, establishment, period }: {
  row: WagesRow
  establishment: CycleContext['establishment']
  period: string
}) {
  return (
    <div style={{ border: '1px solid #000', padding: '6px', fontSize: '9px', pageBreakInside: 'avoid' }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '4px' }}>
        WAGE SLIP — {establishment.name} — {period}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '4px' }}>
        <div>Emp No: <strong>{row.empId}</strong></div>
        <div>Name: <strong>{row.name}</strong></div>
        <div>Designation: {row.designation}</div>
        <div>Days Worked: {row.daysWorked}</div>
        <div>Payment Date: {row.paymentDate || '-'}</div>
      </div>
      <table style={{ width: '100%' }}>
        <thead>
          <tr><th colSpan={2}>Earnings</th><th colSpan={2}>Deductions</th></tr>
        </thead>
        <tbody>
          <tr><td>Basic</td><td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td><td>PF</td><td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td></tr>
          <tr><td>DA</td><td style={{ textAlign: 'right' }}>{fmt(row.da)}</td><td>ESI</td><td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td></tr>
          <tr><td>HRA</td><td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td><td>LWF</td><td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td></tr>
          <tr><td>Other</td><td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td><td>Fine</td><td style={{ textAlign: 'right' }}>{fmt(row.fineDeduction)}</td></tr>
          <tr><td></td><td></td><td>Other</td><td style={{ textAlign: 'right' }}>{fmt(row.otherDeductions)}</td></tr>
          <tr><td></td><td></td><td>Advance</td><td style={{ textAlign: 'right' }}>{fmt(row.advanceRecovered)}</td></tr>
          <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000' }}>
            <td>Gross</td><td style={{ textAlign: 'right' }}>{fmt(row.grossEarnings)}</td>
            <td>Net</td><td style={{ textAlign: 'right' }}>{fmt(row.netWage)}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '4px' }}>Employee Signature: ________________________</div>
    </div>
  )
}

export function ShopFormT({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  return (
    <div className="form-page">
      <div className="form-header no-print">
        <h2>WAGE SLIPS</h2>
        <p>Form T [Rule 19] — Tamil Nadu Shops and Establishments Act — {period}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {wages.map((row) => (
          <ShopWageSlipCard key={row.employeeId} row={row} establishment={establishment} period={period} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create shop-form-u.tsx (Employee Register — Shop)**

Form U header: "REGISTER OF EMPLOYEES — Form U [Rule 14]"
Same structure as Form XI (hospital).

Create `src/app/print/[cycleId]/[formCode]/shop-form-u.tsx`:

```tsx
import type { CycleContext, EmployeeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function ShopFormU({ ctx, employees }: { ctx: CycleContext; employees: EmployeeRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF EMPLOYEES</h2>
        <p>Form U [Rule 14] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — as of {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Father/Spouse</th>
            <th>Sex</th>
            <th>DOB</th>
            <th>Designation</th>
            <th>Date of Entry</th>
            <th>Address</th>
            <th>UAN</th>
            <th>ESI No</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr key={emp.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{emp.empId}</td>
              <td>{emp.name}</td>
              <td>{emp.fatherSpouseName}</td>
              <td style={{ textAlign: 'center' }}>{emp.sex}</td>
              <td style={{ textAlign: 'center' }}>{emp.dob}</td>
              <td>{emp.designation}</td>
              <td style={{ textAlign: 'center' }}>{emp.dateOfEntry}</td>
              <td>{emp.address}</td>
              <td>{emp.uan ?? ''}</td>
              <td>{emp.esiNo ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Create shop-form-v.tsx (Employment Register / Muster Roll — Shop)**

Form V header: "EMPLOYMENT REGISTER (MUSTER ROLL) — Form V [Rule 15]"
Same structure as hospital Form V.

Create `src/app/print/[cycleId]/[formCode]/shop-form-v.tsx`:

```tsx
import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function ShopFormV({ ctx, muster }: { ctx: CycleContext; muster: MusterRow[] }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>EMPLOYMENT REGISTER (MUSTER ROLL)</h2>
        <p>Form V [Rule 15] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Emp ID</th>
            <th rowSpan={2}>Name</th>
            <th rowSpan={2}>Designation</th>
            <th colSpan={daysInMonth}>Attendance ({period})</th>
            <th rowSpan={2}>Total P</th>
            <th rowSpan={2}>Total A</th>
            <th rowSpan={2}>Work Hrs</th>
            <th rowSpan={2}>Remarks</th>
          </tr>
          <tr>
            {days.map((d) => <th key={d} style={{ minWidth: '14px' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {muster.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              {row.dailyMarks.map((m, d) => (
                <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{m || '-'}</td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalPresent}</td>
              <td style={{ textAlign: 'center' }}>{row.totalAbsent}</td>
              <td style={{ textAlign: 'center' }}>{row.workStartTime}{row.workEndTime ? `–${row.workEndTime}` : ''}</td>
              <td>{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '8px', fontSize: '9px' }}>
        P=Present A=Absent H=Holiday WO=Week Off L=Leave OT=Overtime HD=Half Day
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create shop-form-x.tsx (Leave Register — Shop)**

Form X header: "LEAVE REGISTER — Form X [Rule 16]"
Columns: S.No | Emp ID | Name | Designation | EL Opening | EL During | EL Availed | EL Closing | Medical Leave | Other Leave | Remarks

Create `src/app/print/[cycleId]/[formCode]/shop-form-x.tsx`:

```tsx
import type { CycleContext, LeaveRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function ShopFormX({ ctx, leave }: { ctx: CycleContext; leave: LeaveRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>LEAVE REGISTER</h2>
        <p>Form X [Rule 16] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Designation</th>
            <th>EL Opening</th>
            <th>EL Earned</th>
            <th>EL Availed</th>
            <th>EL Closing</th>
            <th>Medical Leave</th>
            <th>Other Leave</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {leave.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              <td style={{ textAlign: 'center' }}>{row.earnedLeaveOpening}</td>
              <td style={{ textAlign: 'center' }}>{row.earnedDuring}</td>
              <td style={{ textAlign: 'center' }}>{row.earnedAvailed}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.earnedClosing}</td>
              <td style={{ textAlign: 'center' }}>{row.medicalLeave}</td>
              <td style={{ textAlign: 'center' }}>{row.otherLeave}</td>
              <td>{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 8: Verify TypeScript compiles cleanly**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/print/[cycleId]/[formCode]/hospital-form-i.tsx src/app/print/[cycleId]/[formCode]/hospital-form-ii.tsx src/app/print/[cycleId]/[formCode]/shop-form-w.tsx src/app/print/[cycleId]/[formCode]/shop-form-t.tsx src/app/print/[cycleId]/[formCode]/shop-form-u.tsx src/app/print/[cycleId]/[formCode]/shop-form-v.tsx src/app/print/[cycleId]/[formCode]/shop-form-x.tsx
git commit -m "feat: add Hospital Form I (Fines), Form II (Deductions), and all 5 Shop form print views"
```

---

## Task 6: Export Trigger API

**Files:**
- Create: `src/app/api/form-tasks/[id]/export/route.ts`
- Create: `exports/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Add exports/ to .gitignore**

Read `.gitignore` first, then add the `exports/` line:

```bash
echo "exports/" >> /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app/.gitignore
```

- [ ] **Step 2: Create exports directory placeholder**

```bash
mkdir -p /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app/exports
touch /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app/exports/.gitkeep
```

- [ ] **Step 3: Create export API route**

Create `src/app/api/form-tasks/[id]/export/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDocx } from '@/lib/export/docx-generator'
import { generatePdf } from '@/lib/export/pdf-generator'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const formTask = await prisma.formTask.findUnique({
    where: { id },
    include: {
      cycle: {
        include: { establishment: { select: { name: true, type: true } } },
      },
    },
  })
  if (!formTask) {
    return NextResponse.json({ error: 'FormTask not found' }, { status: 404 })
  }

  const { cycle } = formTask
  const cycleId = cycle.id
  const formCode = formTask.formCode

  // Determine next version number
  const lastDoc = await prisma.generatedDocument.findFirst({
    where: { formTaskId: id, formCode },
    orderBy: { versionNo: 'desc' },
  })
  const versionNo = (lastDoc?.versionNo ?? 0) + 1

  const monthStr = String(cycle.month).padStart(2, '0')
  const baseFileName = `${formCode}_${cycle.year}_${monthStr}_v${versionNo}`

  let docxPath: string | undefined
  let pdfPath: string | undefined
  let generateErrors: string[] = []

  try {
    docxPath = await generateDocx(cycleId, formCode, baseFileName)
  } catch (err) {
    generateErrors.push(`DOCX: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (docxPath) {
    try {
      pdfPath = await generatePdf(docxPath)
    } catch (err) {
      generateErrors.push(`PDF: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const doc = await prisma.generatedDocument.create({
    data: {
      formTaskId: id,
      formCode,
      docxPath: docxPath ?? null,
      pdfPath: pdfPath ?? null,
      templateVersion: '1.0',
      versionNo,
      fileName: baseFileName,
    },
  })

  // Transition status to EXPORTED only if no critical errors
  if (generateErrors.length === 0) {
    await prisma.formTask.update({
      where: { id },
      data: { status: 'EXPORTED' },
    })
  }

  return NextResponse.json({
    id: doc.id,
    fileName: doc.fileName,
    docxPath: doc.docxPath,
    pdfPath: doc.pdfPath,
    versionNo: doc.versionNo,
    warnings: generateErrors.length > 0 ? generateErrors : undefined,
  }, { status: 201 })
}
```

- [ ] **Step 4: Verify TypeScript compiles (docx-generator and pdf-generator imports will fail until Task 7)**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | grep -v "Cannot find module.*docx-generator" | grep -v "Cannot find module.*pdf-generator" | head -20
```

Expected: no other errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/form-tasks/[id]/export/route.ts exports/.gitkeep .gitignore
git commit -m "feat: add export trigger API route"
```

---

## Task 7: DOCX + PDF Generation Libraries + Templates Scaffold

**Files:**
- Create: `src/lib/export/docx-generator.ts`
- Create: `src/lib/export/pdf-generator.ts`
- Create: `templates/README.md`
- Create: `templates/hospital/.gitkeep`
- Create: `templates/shop/.gitkeep`

- [ ] **Step 1: Create templates scaffold**

```bash
mkdir -p /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app/templates/hospital
mkdir -p /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app/templates/shop
touch /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app/templates/hospital/.gitkeep
touch /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app/templates/shop/.gitkeep
```

- [ ] **Step 2: Create templates/README.md**

Create `templates/README.md`:

```markdown
# Form Templates

Place `.docx` template files here for DOCX export.

## Naming Convention

Templates must be named exactly as the form code (lowercase, underscores):

- `hospital/hospital_form_xii.docx` — Wages Register (Hospital)
- `hospital/hospital_form_v.docx` — Muster Roll (Hospital)
- `hospital/hospital_form_xi.docx` — Employee Register (Hospital)
- `hospital/hospital_form_xvii.docx` — Wage Slip (Hospital)
- `hospital/hospital_form_iv.docx` — Overtime Muster Roll (Hospital)
- `hospital/hospital_form_i.docx` — Fines Register (Hospital)
- `hospital/hospital_form_ii.docx` — Deductions Register (Hospital)
- `shop/shop_form_w.docx` — Wages Register (Shop)
- `shop/shop_form_t.docx` — Wage Slip (Shop)
- `shop/shop_form_u.docx` — Employee Register (Shop)
- `shop/shop_form_v.docx` — Employment Register (Shop)
- `shop/shop_form_x.docx` — Leave Register (Shop)

## Template Variables

Templates use `{variable}` syntax (docxtemplater default delimiters).

### Common Variables (all templates)
- `{establishmentName}` — establishment name
- `{address}` — establishment address
- `{regCertNo}` — registration certificate number
- `{employerName}` — employer name
- `{managerName}` — manager name
- `{period}` — e.g., "June 2026"
- `{year}` — e.g., "2026"
- `{month}` — e.g., "6"

### Table Data
Templates use docxtemplater loop syntax `{#rows}{/rows}` for table rows.
Each row object contains the same fields as the TypeScript types in `src/lib/export/form-data.ts`.

## If No Template Found

If a template file is missing, the export API skips DOCX generation and logs a warning.
PDF generation is skipped if DOCX generation fails.
The browser print view is always available regardless of template availability.
```

- [ ] **Step 3: Create docx-generator.ts**

Create `src/lib/export/docx-generator.ts`:

```typescript
import path from 'path'
import fs from 'fs'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { getCycleContext, getWagesData, getMusterData, getEmployeeData,
  getOvertimeData, getFinesData, getDeductionsData, getLeaveData,
  MONTH_NAMES } from './form-data'
import type { CycleContext, WagesRow, MusterRow, EmployeeRow,
  OvertimeRow, FineRow, DeductionRow, LeaveRow } from './form-data'

const TEMPLATES_DIR = path.join(process.cwd(), 'templates')
const EXPORTS_DIR = path.join(process.cwd(), 'exports')

function getTemplatePath(formCode: string): string {
  const isHospital = formCode.startsWith('HOSPITAL_')
  const subdir = isHospital ? 'hospital' : 'shop'
  const filename = `${formCode.toLowerCase()}.docx`
  return path.join(TEMPLATES_DIR, subdir, filename)
}

function buildTemplateData(
  ctx: CycleContext,
  formCode: string,
  rows: WagesRow[] | MusterRow[] | EmployeeRow[] | OvertimeRow[] | FineRow[] | DeductionRow[] | LeaveRow[]
): Record<string, unknown> {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return {
    establishmentName: establishment.name,
    address: establishment.address,
    regCertNo: establishment.regCertNo,
    employerName: establishment.employerName,
    managerName: establishment.managerName,
    period,
    year: cycle.year,
    month: cycle.month,
    daysInMonth,
    rows,
  }
}

export async function generateDocx(
  cycleId: string,
  formCode: string,
  baseFileName: string
): Promise<string> {
  const templatePath = getTemplatePath(formCode)
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  const ctx = await getCycleContext(cycleId)

  let rows: WagesRow[] | MusterRow[] | EmployeeRow[] | OvertimeRow[] | FineRow[] | DeductionRow[] | LeaveRow[]

  switch (formCode) {
    case 'HOSPITAL_FORM_XII':
    case 'HOSPITAL_FORM_XVII':
    case 'SHOP_FORM_W':
    case 'SHOP_FORM_T':
      rows = await getWagesData(ctx)
      break
    case 'HOSPITAL_FORM_V':
    case 'SHOP_FORM_V':
      rows = await getMusterData(ctx)
      break
    case 'HOSPITAL_FORM_XI':
    case 'SHOP_FORM_U':
      rows = await getEmployeeData(ctx)
      break
    case 'HOSPITAL_FORM_IV':
      rows = await getOvertimeData(ctx)
      break
    case 'HOSPITAL_FORM_I':
      rows = await getFinesData(ctx)
      break
    case 'HOSPITAL_FORM_II':
      rows = await getDeductionsData(ctx)
      break
    case 'SHOP_FORM_X':
      rows = await getLeaveData(ctx)
      break
    default:
      throw new Error(`Unknown formCode: ${formCode}`)
  }

  const templateContent = fs.readFileSync(templatePath, 'binary')
  const zip = new PizZip(templateContent)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

  doc.render(buildTemplateData(ctx, formCode, rows))

  const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })

  fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  const outputPath = path.join(EXPORTS_DIR, `${baseFileName}.docx`)
  fs.writeFileSync(outputPath, buffer)

  return outputPath
}
```

- [ ] **Step 4: Create pdf-generator.ts**

Create `src/lib/export/pdf-generator.ts`:

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export async function generatePdf(docxPath: string): Promise<string> {
  if (!fs.existsSync(docxPath)) {
    throw new Error(`DOCX file not found: ${docxPath}`)
  }

  const outDir = path.dirname(docxPath)

  const { stderr } = await execAsync(
    `soffice --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`
  )

  if (stderr && !stderr.includes('Java') && !stderr.includes('JVM')) {
    // LibreOffice often prints JVM warnings to stderr — those are safe to ignore
    throw new Error(`LibreOffice error: ${stderr}`)
  }

  const pdfPath = docxPath.replace(/\.docx$/, '.pdf')
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not generated at expected path: ${pdfPath}`)
  }

  return pdfPath
}
```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/export/docx-generator.ts src/lib/export/pdf-generator.ts templates/README.md templates/hospital/.gitkeep templates/shop/.gitkeep
git commit -m "feat: add DOCX generator, PDF generator (LibreOffice), and templates scaffold"
```

---

## Task 8: Export History UI + Print Links on Cycle Detail

**Files:**
- Create: `src/app/exports/page.tsx`
- Modify: `src/app/cycles/[id]/page.tsx`
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Read existing cycle detail page**

Read `src/app/cycles/[id]/page.tsx` to understand current structure before modifying.

- [ ] **Step 2: Create export history page**

Create `src/app/exports/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode } from '@/types'
import Link from 'next/link'

export default async function ExportsPage() {
  const docs = await prisma.generatedDocument.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 100,
    include: {
      formTask: {
        include: {
          cycle: {
            include: {
              establishment: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  const MONTH_NAMES = ['','January','February','March','April','May','June',
    'July','August','September','October','November','December']

  return (
    <div className="p-6">
      <h1 className="text-sm font-semibold text-white mb-4">Export History</h1>

      {docs.length === 0 ? (
        <p className="text-xs text-[#5a8ab8]">No exports yet. Use the Print / Export button on a form task.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e2d3d] text-[#5a8ab8]">
              <th className="text-left pb-2 pr-4">Form</th>
              <th className="text-left pb-2 pr-4">Establishment</th>
              <th className="text-left pb-2 pr-4">Period</th>
              <th className="text-left pb-2 pr-4">Version</th>
              <th className="text-left pb-2 pr-4">Generated</th>
              <th className="text-left pb-2 pr-4">Files</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => {
              const { formTask } = doc
              const { cycle } = formTask
              const display = FORM_DISPLAY_NAMES[doc.formCode as FormCode]
              const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
              const generatedAt = new Date(doc.generatedAt).toLocaleString('en-IN', {
                dateStyle: 'short', timeStyle: 'short',
              })

              return (
                <tr key={doc.id} className="border-b border-[#111d2a] hover:bg-[#0f1923]">
                  <td className="py-2 pr-4 text-[#c8d8e8]">{display?.name ?? doc.formCode}</td>
                  <td className="py-2 pr-4 text-[#8ab0d0]">{cycle.establishment.name}</td>
                  <td className="py-2 pr-4 text-[#8ab0d0]">{period}</td>
                  <td className="py-2 pr-4 text-[#5a8ab8]">v{doc.versionNo}</td>
                  <td className="py-2 pr-4 text-[#5a8ab8]">{generatedAt}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    {doc.docxPath && (
                      <span className="text-[#4a9eff]">DOCX ✓</span>
                    )}
                    {doc.pdfPath && (
                      <span className="text-[#4aff9f]">PDF ✓</span>
                    )}
                    {!doc.docxPath && !doc.pdfPath && (
                      <span className="text-[#f07070]">No files</span>
                    )}
                    <Link
                      href={`/print/${cycle.id}/${doc.formCode}`}
                      className="text-[#4a9eff] underline"
                      target="_blank"
                    >
                      Print
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add Print + Export buttons to cycle detail page**

Read `src/app/cycles/[id]/page.tsx` first. Then add Print and Export button links to each FormTask row. The FormTask list already shows task name + status. Add two buttons per row:
- Print: links to `/print/[cycle.id]/[formTask.formCode]` (opens in new tab)
- Export: calls `POST /api/form-tasks/[formTask.id]/export` (client action — create inline client component)

Since this requires a client action, create a small `ExportButton` client component inline in a separate file:

Create `src/app/cycles/[id]/export-button.tsx`:

```tsx
'use client'
import { useState } from 'react'

export function ExportButton({ formTaskId }: { formTaskId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleExport() {
    setState('loading')
    setMsg('')
    const res = await fetch(`/api/form-tasks/${formTaskId}/export`, { method: 'POST' })
    const data = await res.json() as { fileName?: string; warnings?: string[]; error?: string }
    if (res.ok) {
      setState('done')
      setMsg(data.warnings?.length ? `Exported (warnings: ${data.warnings.join('; ')})` : `Exported: ${data.fileName}`)
    } else {
      setState('error')
      setMsg(data.error ?? 'Export failed')
    }
  }

  return (
    <span>
      <button
        onClick={handleExport}
        disabled={state === 'loading'}
        className="text-[10px] px-2 py-0.5 bg-[#1a3a1a] border border-[#2a5a2a] text-[#5adf5a] rounded hover:bg-[#1f4a1f] disabled:opacity-50"
      >
        {state === 'loading' ? 'Exporting…' : 'Export DOCX/PDF'}
      </button>
      {msg && (
        <span className={`ml-2 text-[10px] ${state === 'error' ? 'text-[#f07070]' : 'text-[#5a8ab8]'}`}>
          {msg}
        </span>
      )}
    </span>
  )
}
```

Then modify `src/app/cycles/[id]/page.tsx` to import `Link` from `next/link` and `ExportButton`, and add Print + Export buttons next to each FormTask. Read the file first to find the exact location to insert.

- [ ] **Step 4: Add "Exports" link to sidebar**

Read `src/components/sidebar.tsx`. Find the nav links section. Add an "Exports" link after the existing links:

```tsx
<Link href="/exports" className={...}>Exports</Link>
```

Follow the exact same pattern as the other nav links in the sidebar.

- [ ] **Step 5: Verify TypeScript compiles cleanly**

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record/labour-record-app
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/exports/page.tsx src/app/cycles/[id]/export-button.tsx src/app/cycles/[id]/page.tsx src/components/sidebar.tsx
git commit -m "feat: add export history UI, Print/Export buttons on cycle detail, Exports sidebar link"
```

---

## Self-Review

**Spec coverage:**
- ✅ Browser print views: 12 forms (Tasks 2-5)
- ✅ DOCX generation via docxtemplater: Task 7
- ✅ PDF via LibreOffice headless: Task 7
- ✅ Export trigger API: Task 6
- ✅ Export history UI: Task 8
- ✅ Print links on cycle detail: Task 8
- ✅ GeneratedDocument versioning: Task 6 (versionNo increments)
- ✅ FormTask → EXPORTED status transition: Task 6
- ✅ Templates scaffold with README: Task 7

**Placeholder scan:** None found.

**Type consistency:**
- `CycleContext`, `WagesRow`, `MusterRow`, `EmployeeRow`, `OvertimeRow`, `FineRow`, `DeductionRow`, `LeaveRow` — defined in Task 1, used consistently in Tasks 3-5, 7.
- `getCycleContext`, `getWagesData`, etc. — defined in Task 1, imported in Tasks 2, 7.
- `generateDocx`, `generatePdf` — defined in Task 7, imported in Task 6.
- All consistent.
