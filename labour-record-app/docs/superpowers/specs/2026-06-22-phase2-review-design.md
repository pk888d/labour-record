# Phase-2 Review — Design (10 items, 3 waves)

**Date:** 2026-06-22
**Status:** Approved design — pending per-wave implementation plans

Addresses the 10 second-phase review items. Delivered as three independently
mergeable waves: **A** employee management, **B** wage sync & auto double-wage,
**C** print/template fidelity. Each wave gets its own writing-plans plan,
implementation, review, and merge.

## Locked decisions
| # | Item | Decision |
|---|---|---|
| 1 | Delete employee | **Guarded hard delete**: remove row if employee is in no cycle/wage/attendance record; else 409 → "mark Exited instead". Keep existing soft-Exit as a separate action. |
| 2 | Import | Employees, **templated columns**, CSV/TXT + XLSX (add SheetJS). Required: Name, Salary. |
| 3 | Mandatory fields | **Name + salary only**; auto-generate empId when blank; other fields optional (migration). |
| 4 | Cash payment | **Per employee** `paymentMode` (BANK\|CASH); CASH disables/clears bank fields. |
| 5 | Auto OT/double wage | **Holiday-worked = 2× day wage**, auto from attendance (reuses existing `holidayBonus` math); OT hours stay on the Overtime tab. |
| 7 | Wage sync | **Seed on cycle create + Sync button + live fallback** to the employee's saved salary when no manual wage row exists. |

---

## Wave A — Employee management (#1, #2, #3, #4)

### Schema (migration)
- Make nullable: `sex`, `fatherSpouseName`, `designation`, `presentAddress`,
  `permanentAddress`, `dateOfEntry`.
- Add `paymentMode String @default("BANK")` (values `BANK` | `CASH`).
- `empId` stays `NOT NULL` but is auto-generated when the input is blank.

### Validation (`src/domain/validations/employee.ts`)
- Required: `name` (non-empty) and a salary figure (`defaultTotalSalary > 0`).
- All other fields optional. Keep the relational checks that still apply
  (exitDate ≥ dateOfEntry only when both present; exitReason required when
  exitDate set).
- New pure helper `generateEmpId(existingCount | establishmentPrefix)` →
  e.g. `EMP-0001`; used by create routes/import when empId is blank. Unit-tested.

### Employee form (`src/components/employee-form.tsx`)
- Only Name + Salary marked required (`*`); remove `required` from the rest.
- **Payment Mode** select (Bank/Cash). When Cash: disable + clear Bank A/C, IFSC,
  Bank Name.
- empId field optional with placeholder "auto" when blank.

### #1 Delete UI + route
- `DELETE /api/employees/[id]` gains a `?mode=remove` (hard) path:
  - Count `cycleEmployees` + `wageRecords` + `attendanceRecords` + fine/deduction/
    overtime/leave for the employee. If any > 0 → `409 { error, canSoftDelete: true }`.
  - Else hard-delete the row (+ audit `DELETED`).
  - Existing no-mode behavior (soft `EXITED`) retained for the "Mark Exited" action.
- UI: on the employee edit page, a **Delete** button (confirm dialog) calling the
  remove mode; on 409, show the message and offer **Mark Exited**.

### #2 Import
- `xlsx` (SheetJS) added to dependencies.
- Pure parser `src/lib/import/parse-employees.ts`:
  `parseEmployeeRows(rows: Record<string,string>[]) -> { valid: EmployeeInput[]; errors: {row,messages}[] }`
  — header mapping (case-insensitive: Name, Salary, Emp ID, Sex, Father/Spouse,
  Designation, Date of Entry, Phone, Bank A/C, IFSC, Payment Mode), validates each
  via `validateEmployee`. Unit-tested.
- `POST /api/employees/import` — body: establishmentId + parsed rows (file parsed
  client-side via SheetJS, or server reads the uploaded file; **server-side parse**
  chosen so .xlsx/.csv both handled in one place). Bulk-creates valid rows, returns
  `{ created, errors[] }`.
- `/employees/import` page: establishment picker, file input (.csv/.txt/.xlsx),
  a **Download sample** link, and a results panel (created count + per-row errors).

---

## Wave B — Wage sync & auto double-wage (#5, #7)

### Shared computation
New `src/domain/calculations/cycle-wage.ts`:
```
computeCycleWages(input: {
  employee: { defaultTotalSalary, basicWage, daWage, hraWage, pfMode, pfPercent, pfWageCeiling, lwfAmount, ... }
  attendance?: string[]            // daily marks for the cycle
  holidayDays: Set<number>         // govt-holiday day numbers in the month
  manual?: WageRecordLike | null   // a saved Wages-tab row (overrides)
  config: WageFormulaConfig
  rules: { holidayMultiplier: number }
  daysInMonth: number
}): WageCalcResult & { source: 'manual' | 'employee-default' }
```
- If `manual` present → use it (current behavior).
- Else derive Basic/DA/HRA from the employee's saved salary via
  `computeSalaryBreakdown`, compute **holiday-worked double-wage** from
  `attendance` × `holidayMultiplier`, then `calculateWages`. Pure + unit-tested.

### Consumers
- `slip-data.ts` and `getWagesData` (form-data) call `computeCycleWages` so a
  slip/register shows the employee's current salary when no manual row exists (**#7
  fallback**, **#5 auto double-wage**).
- **Seed**: on cycle creation, for employees with `defaultTotalSalary > 0`, create
  WageRecords from the computed defaults.
- **Sync button**: `POST /api/cycles/[id]/sync-wages` re-pulls employee defaults
  into WageRecords (skips rows manually edited? — re-pull all by default, with a
  confirm). Button on the cycle detail / wages tab.

### Tests
Unit tests for `computeCycleWages`: manual override, employee-default fallback,
double-wage on holiday-worked days, zero-salary employee.

---

## Wave C — Print/template fidelity (#6, #8, #9, #10)

Source of truth: the tagged `templates/{hospital,shop}/*.docx` + the `form-data`
row types. During planning the exact column lists are extracted from the .docx
(unzip → `word/document.xml`) so the React print matches 1:1.

- **#10 Wages Register** (`hospital-form-xii.tsx`, `shop-form-w.tsx`): expand from
  ~17 to the full statutory column set (~29 for Form XII). Add the missing
  earnings/deduction breakdown + statutory caption columns; ensure every
  `WagesRow`/template field has a column.
- **#6 Attendance / Muster** (`hospital-form-v.tsx`, `shop-form-v.tsx`): add the
  missing title columns to match the template header.
- **#8 Signature columns**: replace any per-row employee name in signature/thumb
  columns with the fixed phrase **"Signature / Thumb impression"** across all forms.
- **#9 Employee Register** (`hospital-form-xi.tsx`, `shop-form-u.tsx`): fix column
  alignment / widths so the header and body align.

### Verification
Print e2e (`07-print-views`, `10-print-pagination`) stays green; add assertions
that the wages register renders the expected column count, and a manual visual
check of each touched form.

---

## Out of scope (flagged for later)
- Attendance bulk import (biometric exports) — separate wave if wanted.
- The remaining Tier 1–4 features from the first review.

## Risks / notes
- The nullability migration (#3) must not break existing reads that assume
  non-null (print/export use `?? 'Nil'` already in places — verify each consumer).
- `empId` auto-gen must avoid collisions (use a count- or cuid-suffixed scheme).
- Per-cycle wage **override vs fallback**: a manual WageRecord must always win so
  the Sync button can't silently clobber hand-entered figures without confirm.
- AGENTS.md: verify Next APIs (route handlers, file upload parsing) against
  `node_modules/next/dist/docs/` during implementation.
