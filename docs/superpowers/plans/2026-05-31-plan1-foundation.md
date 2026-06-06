# Labour Record — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js application, define the full database schema, and deliver working Establishment + Employee CRUD (API + UI).

**Architecture:** Single Next.js 15 App Router process. Prisma ORM with SQLite for local dev. Domain validation lives in `src/domain/` and is tested with Vitest independently of the HTTP layer. API routes in `src/app/api/` call domain functions and Prisma directly.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, SQLite, Vitest

**Spec:** `docs/superpowers/specs/2026-05-31-labour-record-design.md`

**Subsequent plans:**
- Plan 2: Monthly Cycles + Kanban Board
- Plan 3: Core Monthly Data Entry (attendance, wages, calculations)
- Plan 4: Exceptions (overtime, fines, deductions, leave)
- Plan 5: Export Pipeline (DOCX, PDF, browser print)

---

## File Map

```
labour-record-app/               ← new project root (sibling to forms-template/)
  package.json
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  vitest.config.ts
  .env
  .gitignore

  prisma/
    schema.prisma                ← full schema (all 16 tables)
    seed.ts                      ← seed: 2 establishments + employees from April 2026 forms

  src/
    lib/
      prisma.ts                  ← singleton Prisma client
      utils.ts                   ← cn() classname helper

    types/
      index.ts                   ← shared TypeScript types (WageFormulaConfig etc.)

    domain/
      validations/
        establishment.ts         ← validateEstablishment()
        employee.ts              ← validateEmployee()

    components/
      sidebar.tsx                ← left nav
      page-header.tsx            ← title + action button
      data-table.tsx             ← reusable sortable table

    app/
      layout.tsx                 ← root layout (sidebar + main)
      page.tsx                   ← redirect → /establishments
      globals.css

      establishments/
        page.tsx                 ← list all establishments
        new/
          page.tsx               ← create form
        [id]/
          page.tsx               ← edit form

      employees/
        page.tsx                 ← list employees (query ?establishmentId=)
        new/
          page.tsx               ← create form
        [id]/
          page.tsx               ← edit form

      api/
        establishments/
          route.ts               ← GET (list), POST (create)
          [id]/
            route.ts             ← GET (one), PUT (update), DELETE
        employees/
          route.ts               ← GET (list), POST (create)
          [id]/
            route.ts             ← GET (one), PUT (update), DELETE

  tests/
    domain/
      establishment.test.ts
      employee.test.ts
```

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: `labour-record-app/` (entire project)

- [ ] **Step 1: Bootstrap with create-next-app**

Run from the `labour-record/` directory (parent of `forms-template/`):

```bash
cd /Users/praveenkumar/Documents/Personal/study/DevApps/labour-record
npx create-next-app@latest labour-record-app \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --import-alias "@/*"
cd labour-record-app
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client
npm install --save-dev vitest @vitest/coverage-v8
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 3: Configure vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Configure .env**

`.env` should contain:
```
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:
```
exports/
*.db
*.db-journal
.superpowers/
```

- [ ] **Step 7: Create src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install the two helpers:
```bash
npm install clsx tailwind-merge
```

- [ ] **Step 8: Verify project starts**

```bash
npm run dev
```

Expected: Next.js dev server running on http://localhost:3000 with no errors.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 15 app with TypeScript, Tailwind, Prisma, Vitest"
```

---

## Task 2: Prisma schema and initial migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/types/index.ts`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Write the full schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Establishment {
  id                String            @id @default(cuid())
  name              String
  address           String
  employerName      String
  managerName       String
  regCertNo         String
  type              EstablishmentType
  wageFormulaConfig String            @default("{}") // JSON string
  isActive          Boolean           @default(true)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  employees     Employee[]
  monthlyCycles MonthlyCycle[]
}

enum EstablishmentType {
  HOSPITAL
  SHOP
}

model Employee {
  id                  String         @id @default(cuid())
  empId               String
  name                String
  sex                 String
  fatherSpouseName    String
  dob                 DateTime?
  dateOfEntry         DateTime
  designation         String
  department          String?
  presentAddress      String
  permanentAddress    String
  uan                 String?
  esiNo               String?
  aadhaar             String? // stored encrypted
  bankAccount         String? // stored encrypted
  ifsc                String?
  bankName            String?
  mobile              String?
  email               String?
  photoPath           String?
  completionOf480Days DateTime?
  dateMadePermanent   DateTime?
  periodOfSuspension  String?
  specimenSignature   String?
  status              EmployeeStatus @default(ACTIVE)
  exitDate            DateTime?
  exitReason          String?
  remarks             String?
  establishmentId     String
  establishment       Establishment  @relation(fields: [establishmentId], references: [id])
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  cycleEmployees   CycleEmployee[]
  attendanceRecords AttendanceRecord[]
  wageRecords      WageRecord[]
  leaveRecords     LeaveRecord[]
  overtimeRecords  OvertimeRecord[]
  fineRecords      FineRecord[]
  deductionRecords DeductionRecord[]
}

enum EmployeeStatus {
  ACTIVE
  SUSPENDED
  EXITED
}

model MonthlyCycle {
  id              String      @id @default(cuid())
  establishmentId String
  establishment   Establishment @relation(fields: [establishmentId], references: [id])
  month           Int
  year            Int
  wagePeriodDays  Int         @default(26)
  status          CycleStatus @default(OPEN)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  cycleEmployees   CycleEmployee[]
  formTasks        FormTask[]
  attendanceRecords AttendanceRecord[]
  wageRecords      WageRecord[]
  leaveRecords     LeaveRecord[]
  overtimeRecords  OvertimeRecord[]
  fineRecords      FineRecord[]
  deductionRecords DeductionRecord[]

  @@unique([establishmentId, month, year])
}

enum CycleStatus {
  OPEN
  LOCKED
}

model CycleEmployee {
  id              String       @id @default(cuid())
  cycleId         String
  cycle           MonthlyCycle @relation(fields: [cycleId], references: [id])
  employeeId      String
  employee        Employee     @relation(fields: [employeeId], references: [id])
  empDataSnapshot String       @default("{}") // JSON snapshot

  @@unique([cycleId, employeeId])
}

model FormTask {
  id               String         @id @default(cuid())
  cycleId          String
  cycle            MonthlyCycle   @relation(fields: [cycleId], references: [id])
  formCode         String
  status           FormTaskStatus @default(NOT_STARTED)
  assignedTo       String?
  dueDate          DateTime?
  validationErrors String?        // JSON
  lastComment      String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  statusHistory      FormTaskStatusHistory[]
  generatedDocuments GeneratedDocument[]
}

enum FormTaskStatus {
  NOT_STARTED
  DATA_ENTRY
  READY_FOR_REVIEW
  NEEDS_CORRECTION
  APPROVED
  EXPORTED
}

model FormTaskStatusHistory {
  id         String         @id @default(cuid())
  formTaskId String
  formTask   FormTask       @relation(fields: [formTaskId], references: [id])
  fromStatus FormTaskStatus
  toStatus   FormTaskStatus
  comment    String?
  changedAt  DateTime       @default(now())
}

model AttendanceRecord {
  id            String       @id @default(cuid())
  cycleId       String
  cycle         MonthlyCycle @relation(fields: [cycleId], references: [id])
  employeeId    String
  employee      Employee     @relation(fields: [employeeId], references: [id])
  workStartTime String?
  workEndTime   String?
  restInterval  String?
  dailyMarks    String       @default("[]") // JSON [{day:1,status:"P"},...]
  daysWorked    Int          @default(0)
  leaveDays     Int          @default(0)
  absentDays    Int          @default(0)
  wageDays      Int          @default(0)
  remarks       String?

  @@unique([cycleId, employeeId])
}

model WageRecord {
  id                  String       @id @default(cuid())
  cycleId             String
  cycle               MonthlyCycle @relation(fields: [cycleId], references: [id])
  employeeId          String
  employee            Employee     @relation(fields: [employeeId], references: [id])
  daysWorked          Int          @default(0)
  basic               Float        @default(0)
  da                  Float        @default(0)
  hra                 Float        @default(0)
  otherAllowances     String       @default("[]") // JSON
  totalNormalWages    Float        @default(0) // calc: basic + da
  totalEarnings       Float        @default(0) // calc: preset-dependent
  overtimeEarnings    Float        @default(0)
  grossWages          Float        @default(0) // calc: totalEarnings + overtimeEarnings
  pf                  Float        @default(0)
  esi                 Float        @default(0)
  lwf                 Float        @default(0)
  advanceRecovered    Float        @default(0)
  fineDeduction       Float        @default(0)
  otherDeductions     Float        @default(0)
  totalDeductions     Float        @default(0) // calc: sum of deductions
  netWages            Float        @default(0) // calc: gross - totalDeductions
  paymentDate         DateTime?
  unpaidAccumulations Float        @default(0)
  receiptRef          String?

  @@unique([cycleId, employeeId])
}

model LeaveRecord {
  id                 String       @id @default(cuid())
  cycleId            String
  cycle              MonthlyCycle @relation(fields: [cycleId], references: [id])
  employeeId         String
  employee           Employee     @relation(fields: [employeeId], references: [id])
  earnedLeaveOpening Int          @default(0)
  earnedDuring       Int          @default(0)
  earnedAvailed      Int          @default(0)
  earnedClosing      Int          @default(0) // calc: opening + during - availed
  medicalLeave       Int          @default(0)
  otherLeave         Int          @default(0)
  maternityInfo      String?
  gratuityInfo       String?
  nominationInfo     String?
  remarks            String?

  @@unique([cycleId, employeeId])
}

model OvertimeRecord {
  id             String       @id @default(cuid())
  cycleId        String
  cycle          MonthlyCycle @relation(fields: [cycleId], references: [id])
  employeeId     String
  employee       Employee     @relation(fields: [employeeId], references: [id])
  dailyOt        String       @default("[]") // JSON [{day:1,hours:2.5},...]
  totalOtHours   Float        @default(0) // calc
  normalHoursRate Float       @default(0)
  otRate         Float        @default(0)
  normalEarnings Float        @default(0)
  otEarnings     Float        @default(0) // calc: totalOtHours * otRate
  totalEarnings  Float        @default(0) // calc: normalEarnings + otEarnings
  paymentDate    DateTime?

  @@unique([cycleId, employeeId])
}

model FineRecord {
  id                 String       @id @default(cuid())
  cycleId            String
  cycle              MonthlyCycle @relation(fields: [cycleId], references: [id])
  employeeId         String
  employee           Employee     @relation(fields: [employeeId], references: [id])
  offenceDate        DateTime
  offenceDescription String
  showCauseDate      DateTime?
  wagePeriod         String?
  wagesOnDate        Float        @default(0)
  fineAmount         Float        @default(0)
  recovered          Float        @default(0)
  pendingRecovery    Float        @default(0)
  remarks            String?
}

model DeductionRecord {
  id              String       @id @default(cuid())
  cycleId         String
  cycle           MonthlyCycle @relation(fields: [cycleId], references: [id])
  employeeId      String
  employee        Employee     @relation(fields: [employeeId], references: [id])
  damageDate      DateTime
  description     String
  damageAmount    Float        @default(0)
  deductionAmount Float        @default(0)
  recovered       Float        @default(0)
  pendingRecovery Float        @default(0)
  remarks         String?
}

model GeneratedDocument {
  id              String   @id @default(cuid())
  formTaskId      String
  formTask        FormTask @relation(fields: [formTaskId], references: [id])
  formCode        String
  docxPath        String?
  pdfPath         String?
  templateVersion String
  versionNo       Int      @default(1)
  generatedAt     DateTime @default(now())
  fileName        String
}

model AuditLog {
  id            String   @id @default(cuid())
  entityType    String
  entityId      String
  action        String
  previousValue String?  // JSON
  newValue      String?  // JSON
  changedAt     DateTime @default(now())
}
```

- [ ] **Step 2: Create shared TypeScript types**

Create `src/types/index.ts`:

```typescript
export type EstablishmentType = 'HOSPITAL' | 'SHOP'
export type EmployeeStatus = 'ACTIVE' | 'SUSPENDED' | 'EXITED'
export type FormTaskStatus =
  | 'NOT_STARTED'
  | 'DATA_ENTRY'
  | 'READY_FOR_REVIEW'
  | 'NEEDS_CORRECTION'
  | 'APPROVED'
  | 'EXPORTED'

export type WageFormulaPreset =
  | 'TN_MINIMUM_WAGES_HOSPITAL'
  | 'TN_SHOPS_ESTABLISHMENTS'

export type WageFormulaConfig = {
  preset: WageFormulaPreset
  fixedAllowance?: number   // hospital: the component beyond basic+DA (e.g. 360)
  hra?: number              // shop: fixed HRA amount if applicable
  lwfRate?: number          // labour welfare fund rate
  esiApplicable?: boolean
  lwfApplicable?: boolean
}

// Form codes per establishment type
export const HOSPITAL_FORM_CODES = [
  'HOSPITAL_FORM_XI',
  'HOSPITAL_FORM_V',
  'HOSPITAL_FORM_XII',
  'HOSPITAL_FORM_XVII',
  'HOSPITAL_FORM_IV',
  'HOSPITAL_FORM_I',
  'HOSPITAL_FORM_II',
] as const

export const SHOP_FORM_CODES = [
  'SHOP_FORM_U',
  'SHOP_FORM_V',
  'SHOP_FORM_W',
  'SHOP_FORM_T',
  'SHOP_FORM_X',
] as const

export type FormCode =
  | (typeof HOSPITAL_FORM_CODES)[number]
  | (typeof SHOP_FORM_CODES)[number]

export const FORM_DISPLAY_NAMES: Record<FormCode, { name: string; ref: string }> = {
  HOSPITAL_FORM_XI:  { name: 'Form XI — Register of Employees',            ref: 'Rule 25' },
  HOSPITAL_FORM_V:   { name: 'Form V — Register of Muster Roll',            ref: 'Rule 26' },
  HOSPITAL_FORM_XII: { name: 'Form XII — Register of Wages',                ref: 'Rule 27(1)' },
  HOSPITAL_FORM_XVII:{ name: 'Form XVII — Wage Slip',                       ref: 'Rule 27(3)' },
  HOSPITAL_FORM_IV:  { name: 'Form IV — Overtime Muster Roll cum Wages',    ref: 'Rule 28' },
  HOSPITAL_FORM_I:   { name: 'Form I — Register of Fines',                  ref: 'Rule 72(1)' },
  HOSPITAL_FORM_II:  { name: 'Form II — Register of Deductions',            ref: 'Rule 72(2)' },
  SHOP_FORM_U:       { name: 'Form U — Employee Register',                  ref: 'Rule 16' },
  SHOP_FORM_V:       { name: 'Form V — Register of Employment',             ref: 'Rule 17' },
  SHOP_FORM_W:       { name: 'Form W — Register of Wages',                  ref: 'Rule 18' },
  SHOP_FORM_T:       { name: 'Form T — Wage Slip',                          ref: 'Rule 19' },
  SHOP_FORM_X:       { name: 'Form X — Leave & Social Security Benefits',   ref: 'Rule 20' },
}
```

- [ ] **Step 3: Create Prisma singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Run initial migration**

```bash
npx prisma migrate dev --name init
```

Expected output: `✔  Generated Prisma Client` and `Database migrations applied.`

- [ ] **Step 5: Verify schema compiled**

```bash
npx prisma studio
```

Expected: Browser opens showing all tables. Close after verifying.

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/types/ src/lib/
git commit -m "feat: add Prisma schema (16 tables) and shared types"
```

---

## Task 3: Establishment domain validation

**Files:**
- Create: `src/domain/validations/establishment.ts`
- Create: `tests/domain/establishment.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/domain/establishment.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  validateEstablishment,
  validateWageFormulaConfig,
} from '@/domain/validations/establishment'

describe('validateEstablishment', () => {
  const base = {
    name: 'DNV Orthocare',
    address: '123 Main St, Palacode',
    employerName: 'Dr. Nagarajan',
    managerName: 'Ramesh Kumar',
    regCertNo: 'TN-HR-2021-001',
    type: 'HOSPITAL' as const,
  }

  it('passes a valid hospital establishment', () => {
    const errors = validateEstablishment(base)
    expect(errors).toEqual([])
  })

  it('requires name', () => {
    const errors = validateEstablishment({ ...base, name: '' })
    expect(errors).toContain('name is required')
  })

  it('requires employerName', () => {
    const errors = validateEstablishment({ ...base, employerName: '' })
    expect(errors).toContain('employerName is required')
  })

  it('requires managerName', () => {
    const errors = validateEstablishment({ ...base, managerName: '' })
    expect(errors).toContain('managerName is required')
  })

  it('requires regCertNo', () => {
    const errors = validateEstablishment({ ...base, regCertNo: '' })
    expect(errors).toContain('regCertNo is required')
  })

  it('requires type to be HOSPITAL or SHOP', () => {
    const errors = validateEstablishment({ ...base, type: 'OTHER' as any })
    expect(errors).toContain('type must be HOSPITAL or SHOP')
  })
})

describe('validateWageFormulaConfig', () => {
  it('passes valid hospital config', () => {
    const errors = validateWageFormulaConfig({
      preset: 'TN_MINIMUM_WAGES_HOSPITAL',
      fixedAllowance: 360,
      esiApplicable: false,
      lwfApplicable: true,
      lwfRate: 0.25,
    })
    expect(errors).toEqual([])
  })

  it('passes valid shop config', () => {
    const errors = validateWageFormulaConfig({
      preset: 'TN_SHOPS_ESTABLISHMENTS',
      esiApplicable: true,
      lwfApplicable: true,
      lwfRate: 0.25,
    })
    expect(errors).toEqual([])
  })

  it('requires a valid preset', () => {
    const errors = validateWageFormulaConfig({ preset: 'UNKNOWN' as any })
    expect(errors).toContain('preset must be TN_MINIMUM_WAGES_HOSPITAL or TN_SHOPS_ESTABLISHMENTS')
  })

  it('requires fixedAllowance to be non-negative when provided', () => {
    const errors = validateWageFormulaConfig({
      preset: 'TN_MINIMUM_WAGES_HOSPITAL',
      fixedAllowance: -10,
    })
    expect(errors).toContain('fixedAllowance must be 0 or greater')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test tests/domain/establishment.test.ts
```

Expected: FAIL — `Cannot find module '@/domain/validations/establishment'`

- [ ] **Step 3: Implement establishment validation**

Create `src/domain/validations/establishment.ts`:

```typescript
import type { WageFormulaConfig } from '@/types'

type EstablishmentInput = {
  name: string
  address: string
  employerName: string
  managerName: string
  regCertNo: string
  type: string
}

export function validateEstablishment(input: EstablishmentInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('name is required')
  if (!input.address?.trim()) errors.push('address is required')
  if (!input.employerName?.trim()) errors.push('employerName is required')
  if (!input.managerName?.trim()) errors.push('managerName is required')
  if (!input.regCertNo?.trim()) errors.push('regCertNo is required')
  if (!['HOSPITAL', 'SHOP'].includes(input.type)) errors.push('type must be HOSPITAL or SHOP')
  return errors
}

export function validateWageFormulaConfig(config: Partial<WageFormulaConfig>): string[] {
  const errors: string[] = []
  const validPresets = ['TN_MINIMUM_WAGES_HOSPITAL', 'TN_SHOPS_ESTABLISHMENTS']
  if (!config.preset || !validPresets.includes(config.preset)) {
    errors.push('preset must be TN_MINIMUM_WAGES_HOSPITAL or TN_SHOPS_ESTABLISHMENTS')
  }
  if (config.fixedAllowance !== undefined && config.fixedAllowance < 0) {
    errors.push('fixedAllowance must be 0 or greater')
  }
  if (config.lwfRate !== undefined && config.lwfRate < 0) {
    errors.push('lwfRate must be 0 or greater')
  }
  return errors
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test tests/domain/establishment.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/ tests/
git commit -m "feat: establishment domain validation with tests"
```

---

## Task 4: Employee domain validation

**Files:**
- Create: `src/domain/validations/employee.ts`
- Create: `tests/domain/employee.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/domain/employee.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateEmployee } from '@/domain/validations/employee'

describe('validateEmployee', () => {
  const base = {
    empId: 'EMP001',
    name: 'Alagurani',
    sex: 'F',
    fatherSpouseName: 'Angappan',
    dateOfEntry: new Date('2020-01-01'),
    designation: 'Nurse',
    presentAddress: '12 Gandhi St, Palacode',
    permanentAddress: '12 Gandhi St, Palacode',
    establishmentId: 'est_001',
  }

  it('passes a valid employee', () => {
    expect(validateEmployee(base)).toEqual([])
  })

  it('requires empId', () => {
    expect(validateEmployee({ ...base, empId: '' })).toContain('empId is required')
  })

  it('requires name', () => {
    expect(validateEmployee({ ...base, name: '' })).toContain('name is required')
  })

  it('requires sex', () => {
    expect(validateEmployee({ ...base, sex: '' })).toContain('sex is required')
  })

  it('requires fatherSpouseName', () => {
    expect(validateEmployee({ ...base, fatherSpouseName: '' }))
      .toContain('fatherSpouseName is required')
  })

  it('requires dateOfEntry', () => {
    expect(validateEmployee({ ...base, dateOfEntry: null as any }))
      .toContain('dateOfEntry is required')
  })

  it('requires designation', () => {
    expect(validateEmployee({ ...base, designation: '' }))
      .toContain('designation is required')
  })

  it('requires presentAddress', () => {
    expect(validateEmployee({ ...base, presentAddress: '' }))
      .toContain('presentAddress is required')
  })

  it('requires permanentAddress', () => {
    expect(validateEmployee({ ...base, permanentAddress: '' }))
      .toContain('permanentAddress is required')
  })

  it('requires establishmentId', () => {
    expect(validateEmployee({ ...base, establishmentId: '' }))
      .toContain('establishmentId is required')
  })

  it('validates exitDate is after dateOfEntry when both present', () => {
    const errors = validateEmployee({
      ...base,
      exitDate: new Date('2019-01-01'), // before dateOfEntry
    })
    expect(errors).toContain('exitDate must be after dateOfEntry')
  })

  it('requires exitReason when exitDate is set', () => {
    const errors = validateEmployee({
      ...base,
      exitDate: new Date('2024-01-01'),
      exitReason: '',
    })
    expect(errors).toContain('exitReason is required when exitDate is set')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test tests/domain/employee.test.ts
```

Expected: FAIL — `Cannot find module '@/domain/validations/employee'`

- [ ] **Step 3: Implement employee validation**

Create `src/domain/validations/employee.ts`:

```typescript
type EmployeeInput = {
  empId: string
  name: string
  sex: string
  fatherSpouseName: string
  dateOfEntry: Date | null
  designation: string
  presentAddress: string
  permanentAddress: string
  establishmentId: string
  exitDate?: Date | null
  exitReason?: string | null
}

export function validateEmployee(input: EmployeeInput): string[] {
  const errors: string[] = []
  if (!input.empId?.trim()) errors.push('empId is required')
  if (!input.name?.trim()) errors.push('name is required')
  if (!input.sex?.trim()) errors.push('sex is required')
  if (!input.fatherSpouseName?.trim()) errors.push('fatherSpouseName is required')
  if (!input.dateOfEntry) errors.push('dateOfEntry is required')
  if (!input.designation?.trim()) errors.push('designation is required')
  if (!input.presentAddress?.trim()) errors.push('presentAddress is required')
  if (!input.permanentAddress?.trim()) errors.push('permanentAddress is required')
  if (!input.establishmentId?.trim()) errors.push('establishmentId is required')

  if (input.exitDate && input.dateOfEntry && input.exitDate <= input.dateOfEntry) {
    errors.push('exitDate must be after dateOfEntry')
  }
  if (input.exitDate && !input.exitReason?.trim()) {
    errors.push('exitReason is required when exitDate is set')
  }
  return errors
}
```

- [ ] **Step 4: Run all domain tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/validations/employee.ts tests/domain/employee.test.ts
git commit -m "feat: employee domain validation with tests"
```

---

## Task 5: Establishment API routes

**Files:**
- Create: `src/app/api/establishments/route.ts`
- Create: `src/app/api/establishments/[id]/route.ts`

- [ ] **Step 1: Create GET + POST handler**

Create `src/app/api/establishments/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEstablishment } from '@/domain/validations/establishment'

export async function GET() {
  const establishments = await prisma.establishment.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  })
  return NextResponse.json(establishments)
}

export async function POST(request: Request) {
  const body = await request.json()
  const errors = validateEstablishment(body)
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  const establishment = await prisma.establishment.create({
    data: {
      name: body.name.trim(),
      address: body.address.trim(),
      employerName: body.employerName.trim(),
      managerName: body.managerName.trim(),
      regCertNo: body.regCertNo.trim(),
      type: body.type,
      wageFormulaConfig: body.wageFormulaConfig
        ? JSON.stringify(body.wageFormulaConfig)
        : '{}',
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Establishment',
      entityId: establishment.id,
      action: 'CREATED',
      newValue: JSON.stringify(establishment),
    },
  })

  return NextResponse.json(establishment, { status: 201 })
}
```

- [ ] **Step 2: Create GET (one) + PUT + DELETE handler**

Create `src/app/api/establishments/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEstablishment } from '@/domain/validations/establishment'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const establishment = await prisma.establishment.findUnique({
    where: { id },
    include: { _count: { select: { employees: true, monthlyCycles: true } } },
  })
  if (!establishment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(establishment)
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const errors = validateEstablishment(body)
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

  const previous = await prisma.establishment.findUnique({ where: { id } })
  if (!previous) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.establishment.update({
    where: { id },
    data: {
      name: body.name.trim(),
      address: body.address.trim(),
      employerName: body.employerName.trim(),
      managerName: body.managerName.trim(),
      regCertNo: body.regCertNo.trim(),
      type: body.type,
      isActive: body.isActive ?? true,
      wageFormulaConfig: body.wageFormulaConfig
        ? JSON.stringify(body.wageFormulaConfig)
        : '{}',
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Establishment',
      entityId: id,
      action: 'UPDATED',
      previousValue: JSON.stringify(previous),
      newValue: JSON.stringify(updated),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const establishment = await prisma.establishment.findUnique({ where: { id } })
  if (!establishment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft delete — set isActive = false
  const updated = await prisma.establishment.update({
    where: { id },
    data: { isActive: false },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Establishment',
      entityId: id,
      action: 'DEACTIVATED',
      previousValue: JSON.stringify(establishment),
      newValue: JSON.stringify(updated),
    },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Smoke test the API manually**

Start the dev server: `npm run dev`

Test in a new terminal:
```bash
# Create establishment
curl -s -X POST http://localhost:3000/api/establishments \
  -H "Content-Type: application/json" \
  -d '{"name":"DNV Orthocare","address":"Palacode","employerName":"Dr. Nagarajan","managerName":"Ramesh","regCertNo":"TN-001","type":"HOSPITAL"}' | jq .

# List establishments
curl -s http://localhost:3000/api/establishments | jq .
```

Expected: First call returns `201` with the created object. Second returns array with 1 item.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/establishments/
git commit -m "feat: establishment API routes (CRUD + audit log)"
```

---

## Task 6: Employee API routes

**Files:**
- Create: `src/app/api/employees/route.ts`
- Create: `src/app/api/employees/[id]/route.ts`

- [ ] **Step 1: Create GET + POST handler**

Create `src/app/api/employees/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmployee } from '@/domain/validations/employee'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const establishmentId = searchParams.get('establishmentId')
  const status = searchParams.get('status')

  const employees = await prisma.employee.findMany({
    where: {
      ...(establishmentId ? { establishmentId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { name: 'asc' },
    include: { establishment: { select: { name: true, type: true } } },
  })
  return NextResponse.json(employees)
}

export async function POST(request: Request) {
  const body = await request.json()
  const errors = validateEmployee(body)
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

  const employee = await prisma.employee.create({
    data: {
      empId: body.empId.trim(),
      name: body.name.trim(),
      sex: body.sex.trim(),
      fatherSpouseName: body.fatherSpouseName.trim(),
      dob: body.dob ? new Date(body.dob) : null,
      dateOfEntry: new Date(body.dateOfEntry),
      designation: body.designation.trim(),
      department: body.department?.trim() || null,
      presentAddress: body.presentAddress.trim(),
      permanentAddress: body.permanentAddress.trim(),
      uan: body.uan?.trim() || null,
      esiNo: body.esiNo?.trim() || null,
      aadhaar: body.aadhaar?.trim() || null,
      bankAccount: body.bankAccount?.trim() || null,
      ifsc: body.ifsc?.trim() || null,
      bankName: body.bankName?.trim() || null,
      mobile: body.mobile?.trim() || null,
      email: body.email?.trim() || null,
      completionOf480Days: body.completionOf480Days ? new Date(body.completionOf480Days) : null,
      dateMadePermanent: body.dateMadePermanent ? new Date(body.dateMadePermanent) : null,
      periodOfSuspension: body.periodOfSuspension?.trim() || null,
      remarks: body.remarks?.trim() || null,
      establishmentId: body.establishmentId,
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Employee',
      entityId: employee.id,
      action: 'CREATED',
      newValue: JSON.stringify({ name: employee.name, empId: employee.empId }),
    },
  })

  return NextResponse.json(employee, { status: 201 })
}
```

- [ ] **Step 2: Create GET (one) + PUT + DELETE handler**

Create `src/app/api/employees/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmployee } from '@/domain/validations/employee'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { establishment: { select: { name: true, type: true } } },
  })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(employee)
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const errors = validateEmployee(body)
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

  const previous = await prisma.employee.findUnique({ where: { id } })
  if (!previous) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      empId: body.empId.trim(),
      name: body.name.trim(),
      sex: body.sex.trim(),
      fatherSpouseName: body.fatherSpouseName.trim(),
      dob: body.dob ? new Date(body.dob) : null,
      dateOfEntry: new Date(body.dateOfEntry),
      designation: body.designation.trim(),
      department: body.department?.trim() || null,
      presentAddress: body.presentAddress.trim(),
      permanentAddress: body.permanentAddress.trim(),
      uan: body.uan?.trim() || null,
      esiNo: body.esiNo?.trim() || null,
      aadhaar: body.aadhaar?.trim() || null,
      bankAccount: body.bankAccount?.trim() || null,
      ifsc: body.ifsc?.trim() || null,
      bankName: body.bankName?.trim() || null,
      mobile: body.mobile?.trim() || null,
      email: body.email?.trim() || null,
      completionOf480Days: body.completionOf480Days ? new Date(body.completionOf480Days) : null,
      dateMadePermanent: body.dateMadePermanent ? new Date(body.dateMadePermanent) : null,
      periodOfSuspension: body.periodOfSuspension?.trim() || null,
      status: body.status ?? previous.status,
      exitDate: body.exitDate ? new Date(body.exitDate) : null,
      exitReason: body.exitReason?.trim() || null,
      remarks: body.remarks?.trim() || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Employee',
      entityId: id,
      action: 'UPDATED',
      previousValue: JSON.stringify({ name: previous.name, status: previous.status }),
      newValue: JSON.stringify({ name: updated.name, status: updated.status }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark as EXITED, not hard delete — compliance data must be preserved
  const updated = await prisma.employee.update({
    where: { id },
    data: { status: 'EXITED', exitDate: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Employee',
      entityId: id,
      action: 'EXITED',
      newValue: JSON.stringify({ exitDate: updated.exitDate }),
    },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/employees/
git commit -m "feat: employee API routes (CRUD + audit log, soft-delete as EXITED)"
```

---

## Task 7: Root layout and sidebar

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/sidebar.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create the sidebar component**

Create `src/components/sidebar.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { section: 'Workspace', items: [
    { href: '/', label: 'Kanban Board', icon: '⊞' },
    { href: '/cycles', label: 'Monthly Cycles', icon: '↻' },
  ]},
  { section: 'Masters', items: [
    { href: '/establishments', label: 'Establishments', icon: '🏢' },
    { href: '/employees', label: 'Employees', icon: '👥' },
  ]},
  { section: 'Output', items: [
    { href: '/exports', label: 'Exports', icon: '↓' },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-48 min-h-screen bg-[#0f1923] border-r border-[#1e2d3d] flex flex-col">
      <div className="px-4 py-4 border-b border-[#1e2d3d]">
        <p className="text-sm font-bold text-white">LabourRecord</p>
        <p className="text-[10px] text-[#4a6a8a] mt-0.5">Compliance Manager</p>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[#4a6a8a]">
              {group.section}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 mx-1.5 px-3 py-1.5 rounded text-xs',
                    active
                      ? 'bg-[#1a3050] text-[#4a9eff] font-semibold'
                      : 'text-[#7a9ab8] hover:bg-[#1a2a3a] hover:text-[#c8d8e8]'
                  )}
                >
                  <span className="w-3.5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LabourRecord — Compliance Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'bg-[#0d1117] text-[#c8d8e8]')}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
```

Add `cn` import at top: `import { cn } from '@/lib/utils'`

- [ ] **Step 3: Update globals.css**

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  background: #0d1117;
  color: #c8d8e8;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0d1117; }
::-webkit-scrollbar-thumb { background: #2a3a50; border-radius: 3px; }
```

- [ ] **Step 4: Redirect root to Kanban (placeholder)**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/establishments')
}
```

- [ ] **Step 5: Verify layout renders**

```bash
npm run dev
```

Open http://localhost:3000 — should redirect to `/establishments` and show the sidebar. The main area will be a 404 for now.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx src/components/sidebar.tsx
git commit -m "feat: root layout with sidebar navigation"
```

---

## Task 8: Establishments UI

**Files:**
- Create: `src/components/page-header.tsx`
- Create: `src/app/establishments/page.tsx`
- Create: `src/app/establishments/new/page.tsx`
- Create: `src/app/establishments/[id]/page.tsx`

- [ ] **Step 1: Create PageHeader component**

Create `src/components/page-header.tsx`:

```tsx
import Link from 'next/link'

type Props = {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d] bg-[#0f1923]">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-[#4a6a8a] mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="px-3 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec]"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create establishments list page**

Create `src/app/establishments/page.tsx`:

```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'

export default async function EstablishmentsPage() {
  const establishments = await prisma.establishment.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true, monthlyCycles: true } } },
  })

  return (
    <div>
      <PageHeader
        title="Establishments"
        subtitle={`${establishments.length} establishment${establishments.length !== 1 ? 's' : ''}`}
        action={{ label: '+ New Establishment', href: '/establishments/new' }}
      />
      <div className="p-6">
        {establishments.length === 0 ? (
          <p className="text-[#4a6a8a] text-sm">
            No establishments yet.{' '}
            <Link href="/establishments/new" className="text-[#4a9eff] hover:underline">
              Create the first one.
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Name</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Type</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Employer</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Reg. No.</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Employees</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {establishments.map((est) => (
                <tr key={est.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-3 font-medium text-white">{est.name}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      est.type === 'HOSPITAL'
                        ? 'bg-[#1a2a50] text-[#4a9eff]'
                        : 'bg-[#2a1a40] text-[#c087f0]'
                    }`}>
                      {est.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{est.employerName}</td>
                  <td className="py-2 px-3 text-[#7a9ab8] font-mono text-xs">{est.regCertNo}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{est._count.employees}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      est.isActive ? 'bg-[#0f2a1a] text-[#40c070]' : 'bg-[#2a1a1a] text-[#f07070]'
                    }`}>
                      {est.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <Link
                      href={`/establishments/${est.id}`}
                      className="text-xs text-[#4a9eff] hover:underline"
                    >
                      Edit
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

- [ ] **Step 3: Create establishment form (shared between new + edit)**

Create `src/components/establishment-form.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Establishment } from '@prisma/client'
import type { WageFormulaConfig } from '@/types'

type Props = {
  establishment?: Establishment
}

const defaultFormula: WageFormulaConfig = {
  preset: 'TN_MINIMUM_WAGES_HOSPITAL',
  fixedAllowance: 0,
  esiApplicable: false,
  lwfApplicable: true,
  lwfRate: 0.25,
}

export function EstablishmentForm({ establishment }: Props) {
  const router = useRouter()
  const isEdit = !!establishment

  const [form, setForm] = useState({
    name: establishment?.name ?? '',
    address: establishment?.address ?? '',
    employerName: establishment?.employerName ?? '',
    managerName: establishment?.managerName ?? '',
    regCertNo: establishment?.regCertNo ?? '',
    type: establishment?.type ?? 'HOSPITAL',
    isActive: establishment?.isActive ?? true,
    wageFormulaConfig: establishment?.wageFormulaConfig
      ? (JSON.parse(establishment.wageFormulaConfig) as WageFormulaConfig)
      : defaultFormula,
  })

  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const setFormula = (field: string, value: unknown) =>
    setForm((prev) => ({
      ...prev,
      wageFormulaConfig: { ...prev.wageFormulaConfig, [field]: value },
    }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const url = isEdit ? `/api/establishments/${establishment.id}` : '/api/establishments'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }

    router.push('/establishments')
    router.refresh()
  }

  const inputClass =
    'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'
  const labelClass = 'block text-xs text-[#5a8ab8] mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl p-6 space-y-4">
      {errors.length > 0 && (
        <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-xs text-[#f07070] space-y-1">
          {errors.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Establishment Name *</label>
          <input className={inputClass} value={form.name}
            onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Address *</label>
          <textarea className={inputClass} rows={2} value={form.address}
            onChange={(e) => set('address', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Employer Name *</label>
          <input className={inputClass} value={form.employerName}
            onChange={(e) => set('employerName', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Manager / In-Charge *</label>
          <input className={inputClass} value={form.managerName}
            onChange={(e) => set('managerName', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Registration Certificate No. *</label>
          <input className={inputClass} value={form.regCertNo}
            onChange={(e) => set('regCertNo', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Establishment Type *</label>
          <select className={inputClass} value={form.type}
            onChange={(e) => {
              set('type', e.target.value)
              setFormula('preset', e.target.value === 'HOSPITAL'
                ? 'TN_MINIMUM_WAGES_HOSPITAL' : 'TN_SHOPS_ESTABLISHMENTS')
            }}>
            <option value="HOSPITAL">Hospital</option>
            <option value="SHOP">Shop</option>
          </select>
        </div>
      </div>

      <div className="border-t border-[#1e2d3d] pt-4">
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3">Wage Formula Configuration</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className={labelClass}>Preset</label>
            <input className={`${inputClass} text-[#7a9ab8]`}
              value={form.wageFormulaConfig.preset} readOnly />
          </div>
          {form.type === 'HOSPITAL' && (
            <div>
              <label className={labelClass}>Fixed Allowance (₹) beyond Basic+DA</label>
              <input className={inputClass} type="number" min="0"
                value={form.wageFormulaConfig.fixedAllowance ?? 0}
                onChange={(e) => setFormula('fixedAllowance', parseFloat(e.target.value))} />
            </div>
          )}
          {form.type === 'SHOP' && (
            <div>
              <label className={labelClass}>HRA (₹)</label>
              <input className={inputClass} type="number" min="0"
                value={form.wageFormulaConfig.hra ?? 0}
                onChange={(e) => setFormula('hra', parseFloat(e.target.value))} />
            </div>
          )}
          <div>
            <label className={labelClass}>LWF Rate (₹ per month)</label>
            <input className={inputClass} type="number" min="0" step="0.01"
              value={form.wageFormulaConfig.lwfRate ?? 0}
              onChange={(e) => setFormula('lwfRate', parseFloat(e.target.value))} />
          </div>
          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-2 text-xs text-[#7a9ab8] cursor-pointer">
              <input type="checkbox"
                checked={form.wageFormulaConfig.esiApplicable ?? false}
                onChange={(e) => setFormula('esiApplicable', e.target.checked)} />
              ESI Applicable
            </label>
            <label className="flex items-center gap-2 text-xs text-[#7a9ab8] cursor-pointer">
              <input type="checkbox"
                checked={form.wageFormulaConfig.lwfApplicable ?? true}
                onChange={(e) => setFormula('lwfApplicable', e.target.checked)} />
              LWF Applicable
            </label>
          </div>
        </div>
      </div>

      {isEdit && (
        <div>
          <label className="flex items-center gap-2 text-xs text-[#7a9ab8] cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)} />
            Active
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Establishment'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/establishments')}
          className="px-4 py-1.5 bg-transparent border border-[#2a3a50] text-[#7a9ab8] text-xs rounded hover:border-[#4a6a8a]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Create new establishment page**

Create `src/app/establishments/new/page.tsx`:

```tsx
import { PageHeader } from '@/components/page-header'
import { EstablishmentForm } from '@/components/establishment-form'

export default function NewEstablishmentPage() {
  return (
    <div>
      <PageHeader title="New Establishment" />
      <EstablishmentForm />
    </div>
  )
}
```

- [ ] **Step 5: Create edit establishment page**

Create `src/app/establishments/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { EstablishmentForm } from '@/components/establishment-form'

export default async function EditEstablishmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const establishment = await prisma.establishment.findUnique({ where: { id } })
  if (!establishment) notFound()

  return (
    <div>
      <PageHeader title={`Edit — ${establishment.name}`} />
      <EstablishmentForm establishment={establishment} />
    </div>
  )
}
```

- [ ] **Step 6: Verify in browser**

Navigate to http://localhost:3000/establishments — see empty state with "Create the first one" link. Click it, fill the form, submit — should redirect back to list showing the new establishment.

- [ ] **Step 7: Commit**

```bash
git add src/app/establishments/ src/components/
git commit -m "feat: establishments list, create, and edit UI"
```

---

## Task 9: Employees UI

**Files:**
- Create: `src/app/employees/page.tsx`
- Create: `src/app/employees/new/page.tsx`
- Create: `src/app/employees/[id]/page.tsx`
- Create: `src/components/employee-form.tsx`

- [ ] **Step 1: Create employee list page**

Create `src/app/employees/page.tsx`:

```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ establishmentId?: string; status?: string }>
}) {
  const { establishmentId, status } = await searchParams

  const employees = await prisma.employee.findMany({
    where: {
      ...(establishmentId ? { establishmentId } : {}),
      ...(status ? { status: status as any } : { status: 'ACTIVE' }),
    },
    orderBy: { name: 'asc' },
    include: { establishment: { select: { name: true, type: true } } },
  })

  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} employee${employees.length !== 1 ? 's' : ''}`}
        action={{ label: '+ New Employee', href: '/employees/new' }}
      />
      <div className="p-6">
        {/* Filter bar */}
        <div className="flex gap-3 mb-4">
          <form method="GET" className="flex gap-2">
            <select
              name="establishmentId"
              defaultValue={establishmentId ?? ''}
              className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All Establishments</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status ?? 'ACTIVE'}
              className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="ACTIVE">Active</option>
              <option value="EXITED">Exited</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </form>
        </div>

        {employees.length === 0 ? (
          <p className="text-[#4a6a8a] text-sm">No employees found.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">ID</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Name</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Sex</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Designation</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Establishment</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Entry Date</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-3 font-mono text-xs text-[#7a9ab8]">{emp.empId}</td>
                  <td className="py-2 px-3 font-medium text-white">{emp.name}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{emp.sex}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{emp.designation}</td>
                  <td className="py-2 px-3 text-[#7a9ab8] text-xs">{emp.establishment.name}</td>
                  <td className="py-2 px-3 text-[#7a9ab8] text-xs">
                    {new Date(emp.dateOfEntry).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      emp.status === 'ACTIVE' ? 'bg-[#0f2a1a] text-[#40c070]' :
                      emp.status === 'EXITED' ? 'bg-[#2a1a1a] text-[#f07070]' :
                      'bg-[#2a2010] text-[#c0a040]'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <Link href={`/employees/${emp.id}`}
                      className="text-xs text-[#4a9eff] hover:underline">Edit</Link>
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

- [ ] **Step 2: Create employee form component**

Create `src/components/employee-form.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Employee, Establishment } from '@prisma/client'

type Props = {
  employee?: Employee
  establishments: Pick<Establishment, 'id' | 'name' | 'type'>[]
}

export function EmployeeForm({ employee, establishments }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEdit = !!employee

  const [form, setForm] = useState({
    empId: employee?.empId ?? '',
    name: employee?.name ?? '',
    sex: employee?.sex ?? '',
    fatherSpouseName: employee?.fatherSpouseName ?? '',
    dob: employee?.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
    dateOfEntry: employee?.dateOfEntry
      ? new Date(employee.dateOfEntry).toISOString().split('T')[0] : '',
    designation: employee?.designation ?? '',
    department: employee?.department ?? '',
    presentAddress: employee?.presentAddress ?? '',
    permanentAddress: employee?.permanentAddress ?? '',
    uan: employee?.uan ?? '',
    esiNo: employee?.esiNo ?? '',
    aadhaar: employee?.aadhaar ?? '',
    bankAccount: employee?.bankAccount ?? '',
    ifsc: employee?.ifsc ?? '',
    bankName: employee?.bankName ?? '',
    mobile: employee?.mobile ?? '',
    email: employee?.email ?? '',
    completionOf480Days: employee?.completionOf480Days
      ? new Date(employee.completionOf480Days).toISOString().split('T')[0] : '',
    dateMadePermanent: employee?.dateMadePermanent
      ? new Date(employee.dateMadePermanent).toISOString().split('T')[0] : '',
    periodOfSuspension: employee?.periodOfSuspension ?? '',
    status: employee?.status ?? 'ACTIVE',
    exitDate: employee?.exitDate
      ? new Date(employee.exitDate).toISOString().split('T')[0] : '',
    exitReason: employee?.exitReason ?? '',
    remarks: employee?.remarks ?? '',
    establishmentId: employee?.establishmentId ?? searchParams.get('establishmentId') ?? '',
  })

  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const url = isEdit ? `/api/employees/${employee.id}` : '/api/employees'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }

    router.push('/employees')
    router.refresh()
  }

  const inputClass =
    'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'
  const labelClass = 'block text-xs text-[#5a8ab8] mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl p-6 space-y-6">
      {errors.length > 0 && (
        <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-xs text-[#f07070] space-y-1">
          {errors.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      {/* Basic details */}
      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Basic Details</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Employee ID *</label>
            <input className={inputClass} value={form.empId}
              onChange={(e) => set('empId', e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Full Name *</label>
            <input className={inputClass} value={form.name}
              onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Sex *</label>
            <select className={inputClass} value={form.sex}
              onChange={(e) => set('sex', e.target.value)} required>
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Father / Spouse Name *</label>
            <input className={inputClass} value={form.fatherSpouseName}
              onChange={(e) => set('fatherSpouseName', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input className={inputClass} type="date" value={form.dob}
              onChange={(e) => set('dob', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Date of Entry *</label>
            <input className={inputClass} type="date" value={form.dateOfEntry}
              onChange={(e) => set('dateOfEntry', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Establishment *</label>
            <select className={inputClass} value={form.establishmentId}
              onChange={(e) => set('establishmentId', e.target.value)} required>
              <option value="">Select</option>
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>{est.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Designation *</label>
            <input className={inputClass} value={form.designation}
              onChange={(e) => set('designation', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input className={inputClass} value={form.department}
              onChange={(e) => set('department', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Addresses */}
      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Addresses</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Present Address *</label>
            <textarea className={inputClass} rows={2} value={form.presentAddress}
              onChange={(e) => set('presentAddress', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Permanent Address *</label>
            <textarea className={inputClass} rows={2} value={form.permanentAddress}
              onChange={(e) => set('permanentAddress', e.target.value)} required />
          </div>
        </div>
      </section>

      {/* Statutory IDs */}
      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Statutory IDs</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>EPF UAN</label>
            <input className={inputClass} value={form.uan}
              onChange={(e) => set('uan', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>ESI No.</label>
            <input className={inputClass} value={form.esiNo}
              onChange={(e) => set('esiNo', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Aadhaar No.</label>
            <input className={inputClass} type="password" value={form.aadhaar}
              onChange={(e) => set('aadhaar', e.target.value)}
              placeholder="Stored encrypted" />
          </div>
        </div>
      </section>

      {/* Bank Details */}
      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Bank Details</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Bank Account No.</label>
            <input className={inputClass} type="password" value={form.bankAccount}
              onChange={(e) => set('bankAccount', e.target.value)}
              placeholder="Stored encrypted" />
          </div>
          <div>
            <label className={labelClass}>IFSC Code</label>
            <input className={inputClass} value={form.ifsc}
              onChange={(e) => set('ifsc', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Bank Name</label>
            <input className={inputClass} value={form.bankName}
              onChange={(e) => set('bankName', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Contact</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Mobile</label>
            <input className={inputClass} value={form.mobile}
              onChange={(e) => set('mobile', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Service dates */}
      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Service Dates</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>480 Days Completion</label>
            <input className={inputClass} type="date" value={form.completionOf480Days}
              onChange={(e) => set('completionOf480Days', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Date Made Permanent</label>
            <input className={inputClass} type="date" value={form.dateMadePermanent}
              onChange={(e) => set('dateMadePermanent', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Period of Suspension</label>
            <input className={inputClass} value={form.periodOfSuspension}
              onChange={(e) => set('periodOfSuspension', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Exit (edit only) */}
      {isEdit && (
        <section>
          <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Exit Details</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status}
                onChange={(e) => set('status', e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="EXITED">Exited</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Exit Date</label>
              <input className={inputClass} type="date" value={form.exitDate}
                onChange={(e) => set('exitDate', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Reason for Exit</label>
              <input className={inputClass} value={form.exitReason}
                onChange={(e) => set('exitReason', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      <div>
        <label className={labelClass}>Remarks</label>
        <input className={inputClass} value={form.remarks}
          onChange={(e) => set('remarks', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Employee'}
        </button>
        <button type="button" onClick={() => router.push('/employees')}
          className="px-4 py-1.5 bg-transparent border border-[#2a3a50] text-[#7a9ab8] text-xs rounded">
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create new employee page**

Create `src/app/employees/new/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { EmployeeForm } from '@/components/employee-form'

export default async function NewEmployeePage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div>
      <PageHeader title="New Employee" />
      <EmployeeForm establishments={establishments} />
    </div>
  )
}
```

- [ ] **Step 4: Create edit employee page**

Create `src/app/employees/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { EmployeeForm } from '@/components/employee-form'

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [employee, establishments] = await Promise.all([
    prisma.employee.findUnique({ where: { id } }),
    prisma.establishment.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    }),
  ])
  if (!employee) notFound()
  return (
    <div>
      <PageHeader title={`Edit — ${employee.name}`} />
      <EmployeeForm employee={employee} establishments={establishments} />
    </div>
  )
}
```

- [ ] **Step 5: Test in browser**

Navigate to http://localhost:3000/employees → empty state. Click "+ New Employee", select an establishment, fill required fields, submit → redirects to list with new employee shown.

- [ ] **Step 6: Commit**

```bash
git add src/app/employees/ src/components/employee-form.tsx
git commit -m "feat: employees list, create, and edit UI"
```

---

## Task 10: Seed data

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Write seed file**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create establishments
  const hospital = await prisma.establishment.upsert({
    where: { id: 'est_hospital_dnv' },
    update: {},
    create: {
      id: 'est_hospital_dnv',
      name: 'DNV Orthocare',
      address: 'Palacode, Dharmapuri District, Tamil Nadu',
      employerName: 'Dr. Nagarajan',
      managerName: 'Ramesh Kumar',
      regCertNo: 'TN-HR-2021-001',
      type: 'HOSPITAL',
      wageFormulaConfig: JSON.stringify({
        preset: 'TN_MINIMUM_WAGES_HOSPITAL',
        fixedAllowance: 360,
        esiApplicable: false,
        lwfApplicable: true,
        lwfRate: 0.25,
      }),
    },
  })

  const shop = await prisma.establishment.upsert({
    where: { id: 'est_shop_sriranga' },
    update: {},
    create: {
      id: 'est_shop_sriranga',
      name: 'Sri Ranga Department Store',
      address: 'Palacode, Dharmapuri District, Tamil Nadu',
      employerName: 'Sri Ranga Traders',
      managerName: 'Sundaram',
      regCertNo: 'TN-SE-2019-042',
      type: 'SHOP',
      wageFormulaConfig: JSON.stringify({
        preset: 'TN_SHOPS_ESTABLISHMENTS',
        esiApplicable: true,
        lwfApplicable: true,
        lwfRate: 0.25,
      }),
    },
  })

  // Hospital employees (from filled Form XI April 2026)
  const hospitalEmployees = [
    { empId: 'H001', name: 'Alagurani',    sex: 'F', fatherSpouseName: 'Angappan',   designation: 'Nurse' },
    { empId: 'H002', name: 'Ambika',       sex: 'F', fatherSpouseName: 'Sambath',     designation: 'Nurse' },
    { empId: 'H003', name: 'Aruljoslinraj',sex: 'M', fatherSpouseName: 'Fernandas',   designation: 'Attender' },
    { empId: 'H004', name: 'Muniraj',      sex: 'M', fatherSpouseName: 'Mariappan',   designation: 'Attender' },
    { empId: 'H005', name: 'Muthulakshmi', sex: 'F', fatherSpouseName: 'Mariappan',   designation: 'Nurse' },
    { empId: 'H006', name: 'Mynavathy',    sex: 'F', fatherSpouseName: 'Saravanan',   designation: 'Nurse' },
  ]

  for (const emp of hospitalEmployees) {
    await prisma.employee.upsert({
      where: { id: `emp_${emp.empId.toLowerCase()}` },
      update: {},
      create: {
        id: `emp_${emp.empId.toLowerCase()}`,
        ...emp,
        dateOfEntry: new Date('2020-01-01'),
        presentAddress: 'Palacode, Tamil Nadu',
        permanentAddress: 'Palacode, Tamil Nadu',
        establishmentId: hospital.id,
      },
    })
  }

  console.log('✓ Seed complete: 2 establishments, ' + hospitalEmployees.length + ' hospital employees')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Add seed script to package.json**

In `package.json`, add under `"prisma"` key (create it if absent):

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Install ts-node:
```bash
npm install --save-dev ts-node
```

- [ ] **Step 3: Run seed**

```bash
npx prisma db seed
```

Expected: `✓ Seed complete: 2 establishments, 6 hospital employees`

- [ ] **Step 4: Verify in browser**

Navigate to http://localhost:3000/establishments — should show DNV Orthocare (Hospital) and Sri Ranga Dept (Shop).
Navigate to http://localhost:3000/employees — should show 6 active employees.

- [ ] **Step 5: Run all tests one final time**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Final commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: seed data — 2 establishments and 6 hospital employees from April 2026 forms"
```

---

## Plan 1 — Done

At this point the application has:
- ✅ Next.js 15 + TypeScript + Tailwind + Prisma + SQLite running with `npm run dev`
- ✅ Full database schema (16 tables, all migrations applied)
- ✅ Shared types: `WageFormulaConfig`, `FormCode`, `FORM_DISPLAY_NAMES`
- ✅ Domain validation for establishments and employees (tested with Vitest)
- ✅ CRUD API routes for establishments and employees (with audit log)
- ✅ Sidebar navigation
- ✅ Establishments list, create, edit UI (with formula config)
- ✅ Employees list, create, edit UI (all 23 Form U fields)
- ✅ Seed data: DNV Orthocare + Sri Ranga Dept + hospital employees

**Next:** Plan 2 — Monthly Cycles + Kanban Board
