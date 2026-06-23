# Labour Record App — Project Status

## Overall Progress: 100% [##########]

## Phase-wise Progress

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Project Scaffold | completed | Next.js app scaffolded |
| 2. Prisma Schema + Migration | completed | 16 tables, initial migration applied |
| 3. Domain Validation | completed | Establishment (parallel) + Employee (completed) + Cycle (completed) |
| 4. API Routes | completed | Establishments + Employees API done (prior tasks) |
| 5. UI | completed | Tasks 7-9: layout, sidebar, establishments, employees |
| 6. Seed Data | completed | Task 10: 2 establishments + 6 employees seeded |

## Module-wise Progress

| Module | Status |
|--------|--------|
| prisma/schema.prisma | completed |
| src/types/index.ts | completed |
| src/lib/prisma.ts | verified |
| src/generated/prisma | generated |
| src/domain/validations/employee.ts | completed |
| src/domain/validations/cycle.ts | completed |
| src/domain/workflow/kanban-transitions.ts | completed |
| tests/domain/employee.test.ts | completed |
| tests/domain/cycle.test.ts | completed |
| tests/domain/kanban-transitions.test.ts | completed |
| prisma/migrations/20260531140032_init | applied |

## COMPLETED ITEMS

### Task Update — 2026-06-05 20:59 IST
- Task: Task 2 — Attendance Defaults Utility (applyAttendanceDefaults)
- Status: completed
- Scope: Implemented applyAttendanceDefaults function to auto-fill empty attendance marks with defaults based on holiday set, weekends, and weekdays. Added 6 comprehensive unit tests covering all logic branches.
- Files changed: src/domain/calculations/attendance-calculator.ts, tests/domain/attendance-calculator.test.ts
- Metrics impact: +1 exported function, +6 tests (14 total tests in file, all passing)
- Validation: `npx vitest run tests/domain/attendance-calculator.test.ts` — 14/14 passed; commit: afb4ff7
- Next step: Task 3 — Wage defaults utility + holidayBonus in calculateWages

### Task Update — 2026-06-05 18:00 IST
- Task: Government Holidays & Wage Rules — design + implementation plan
- Status: completed
- Scope: brainstorming → spec → implementation plan written
- Files changed: docs/superpowers/specs/2026-06-05-govt-holidays-wage-rules-design.md, docs/superpowers/plans/2026-06-05-govt-holidays-wage-rules.md
- Metrics impact: none (plan only)
- Validation: spec self-review + plan self-review passed
- Next step: execute plan via subagent-driven-development or executing-plans
- Plan 5 Task 1: Form data extraction library — src/lib/export/form-data.ts; installed docxtemplater + pizzip; 7 async data functions (getCycleContext, getWagesData, getMusterData, getEmployeeData, getOvertimeData, getFinesData, getDeductionsData, getLeaveData) + 8 TypeScript row types
- Task 1: Next.js project scaffold
- Task 2: Prisma schema (16 tables: Establishment, Employee, MonthlyCycle, CycleEmployee, FormTask, FormTaskStatusHistory, AttendanceRecord, WageRecord, LeaveRecord, OvertimeRecord, FineRecord, DeductionRecord, GeneratedDocument, AuditLog + enums), initial migration `20260531140032_init`, shared TypeScript types
- Task 4: Employee domain validation (validateEmployee function + 12 tests, all passing)
- Task 7: Root layout with Sidebar, globals.css dark theme, page redirect to /establishments
- Task 8: Establishments list, new, edit pages + EstablishmentForm + PageHeader components
- Task 9: Employees list (with filters), new, edit pages + EmployeeForm component
- Task 10: prisma/seed.ts seeded via tsx — 2 establishments (DNV Orthocare, Sri Ranga Dept Store) + 6 hospital employees
- Task 1 (Plan 2): Cycle domain logic — validateNewCycle + kanban transitions (isValidTransition, requiresComment, getFormCodes) with 25 tests
- Task 2 (Plan 2): Cycle API routes — GET /api/cycles (list), POST /api/cycles (create), GET /api/cycles/[id], PUT /api/cycles/[id]
- Task 3 (Plan 2): FormTask transition API — POST /api/form-tasks/[id]/transition (status changes with validation)
- Task 4 (Plan 2): Cycles UI — /cycles (list), /cycles/new (create with CycleForm), /cycles/[id] (detail with form tasks + employees)
- Task 5 (Plan 2): Kanban board home page — filterable by establishment/month/year, 6-column status board

## PROJECT METRICS
- Models: 14 tables + 4 enums
- Migration: 20260531140032_init (applied)
- TypeScript: 0 errors
- Components: sidebar.tsx, page-header.tsx, establishment-form.tsx, employee-form.tsx
- Pages: /establishments, /establishments/new, /establishments/[id], /employees, /employees/new, /employees/[id]
- Seed records: 2 establishments, 6 employees

## EXECUTION STATUS
- Current state: DS2 completed — generic SplitRegister component (2-page horizontal split) created and committed
- Next action: DS3 — wire Hospital Form IV into SplitRegister

### Task Update — 2026-06-23 IST
- Task: DS2 — generic SplitRegister server component (2-page horizontal split)
- Status: completed
- Scope: Created SplitRegister<T> generic server component that renders wide statutory registers as two landscape .form-page blocks. Part 1 = identity cols + first-half days; Part 2 = identity cols repeated + second-half days + summary cols. breakAfter: 'page' on Part 1. Uses splitDays() from @/lib/day-split.
- Files changed: src/app/print/[cycleId]/[formCode]/split-register.tsx (new, 73 lines)
- Metrics impact: +1 component
- Validation: npx tsc --noEmit 2>&1 | grep -i "split-register" → 0 errors; commit: ae53d1d
- Next step: DS3 — Hospital Form IV → SplitRegister

### Task Update — 2026-06-23 IST
- Task: A7 — employee import (CSV/TXT/XLSX) — route, page, sample, list link
- Status: completed
- Scope: Installed xlsx (SheetJS). Created POST /api/employees/import route that parses CSV/TXT/XLSX via SheetJS, calls parseEmployeeRows, bulk-creates valid employees with auto-generated empId. Created /employees/import page with ImportClient (establishment selector, file picker, downloadable sample CSV, success/error display). Added "↥ Import" Link to employees list filter row.
- Files changed: package.json, package-lock.json, src/app/api/employees/import/route.ts (new), src/app/employees/import/import-client.tsx (new), src/app/employees/import/page.tsx (new), src/app/employees/page.tsx
- Metrics impact: +2 routes (/api/employees/import, /employees/import)
- Validation: npm run build — clean; both new routes present in build output; commit 2227225
- Next step: A8 — verify + e2e + status

### Task Update — 2026-06-23 IST
- Task: A5 — guarded hard-delete employee (route + UI)
- Status: completed
- Scope: DELETE handler extended to support ?mode=remove (hard-delete); 409 returned when employee has cycleEmployee/wageRecord/attendanceRecord references; default DELETE still soft-sets EXITED. New DeleteEmployeeButton client component: "Delete employee" triggers hard-delete; on 409 shows error + "Mark Exited instead" fallback button. Edit page (employees/[id]/page.tsx) renders button in Danger zone section below EmployeeForm.
- Files changed: src/app/api/employees/[id]/route.ts, src/app/employees/[id]/delete-employee-button.tsx (new), src/app/employees/[id]/page.tsx
- Metrics impact: none (no new models/endpoints; existing DELETE route extended)
- Validation: npm run build — clean; 16/16 static + all dynamic routes compiled; commit b9f3f73
- Next step: A6 — import parser (pure, tested)

### Task Update — 2026-06-22 22:15 IST
- Task: A3 — null-safe employee create/update routes, auto empId, paymentMode
- Status: completed
- Scope: POST + PUT routes now optional-chain all nullable fields; POST auto-generates empId from count; PUT preserves existing empId when blank; paymentMode='CASH' clears bankAccount/ifsc/bankName. Fixed four downstream nullable type errors introduced by A1 schema change (slip-data.ts, slip-card.tsx, employees/page.tsx, calendar/events.ts).
- Files changed: src/app/api/employees/route.ts, src/app/api/employees/[id]/route.ts, src/app/cycles/[id]/salary-slips/slip-data.ts, src/app/cycles/[id]/salary-slips/[employeeId]/slip-card.tsx, src/app/employees/page.tsx, src/lib/calendar/events.ts
- Metrics impact: none (no new models/endpoints)
- Validation: npx tsc --noEmit — 0 errors on employee routes; npm run build — clean (all 46 routes compiled)
- Next step: A4 — employee form UI required fields + paymentMode toggle

### Task Update — 2026-06-22 21:53 IST
- Task: A2 — validateEmployee rewrite + generateEmpId (Phase-2 #3)
- Status: completed
- Scope: Relaxed EmployeeInput so only name, defaultTotalSalary, establishmentId are required. All other fields optional. Added generateEmpId(existingCount) helper. Added employee.test.ts with 6 vitest unit tests (TDD: red → green).
- Files changed: src/domain/validations/employee.ts, src/domain/validations/employee.test.ts (new)
- Metrics impact: +6 unit tests (all passing); EmployeeInput type changed (breaking for routes — fixed in A3)
- Validation: `npm test -- employee` — 6/6 passed; commit: 9a705c7
- Next step: A3 — null-safe create/update employee routes

### Task Update — 2026-06-05 21:45 IST
- Task: Tasks 8–10 — Sidebar, Form Entry Defaults, Holiday Bonus Wages API
- Status: completed
- Scope:
  - Task 8: Added Holidays (📅) and Wage Rules (⚙️) to Masters section in sidebar.tsx; added nav tests to e2e/01-navigation.spec.ts
  - Task 9: form-entry page.tsx fetches GovtHoliday rows for cycle month; form-entry-client.tsx adds "Apply Defaults" button, amber ★ holiday column headers, orange P badge for worked-holiday cells
  - Task 10: wages/route.ts fetches WageRules + GovtHolidays + attendance records; computes holidayBonus = dailyRate × (HOLIDAY_MULTIPLIER-1) × holidayWorkedDays per employee; stores in WageRecord.holidayBonus and passes to calculateWages
- Files changed: src/components/sidebar.tsx, e2e/01-navigation.spec.ts, src/app/forms/[taskId]/page.tsx, src/app/forms/[taskId]/form-entry-client.tsx, src/app/api/form-tasks/[id]/wages/route.ts
- Metrics impact: 0 TypeScript errors, 90 unit tests passing
- Validation: `npx tsc --noEmit` — 0 errors; `npx vitest run` — 90 tests passed
- Commits: ee42448 (sidebar), 7102efb (form entry), eb27fd9 (wages API)

### Task Update — 2026-06-05 21:30 IST
- Task: Task 5 — Holidays Page (/holidays)
- Status: completed
- Scope: Created holidays page with year filter, add form, table, and delete. Added E2E tests for all four user flows.
- Files changed: src/app/holidays/holidays-client.tsx, src/app/holidays/page.tsx, e2e/09-holidays.spec.ts
- Metrics impact: +2 pages, +1 E2E test file (4 tests), 0 TypeScript errors
- Validation: `npx playwright test e2e/09-holidays.spec.ts --project=chromium` — 4/4 passed; `npx tsc --noEmit` — 0 errors; commit: a75543f
- Next step: Task 6 — Wage Rules API routes (GET/PUT/DELETE)

---

### Task Update — 2026-06-04 17:30 IST
- Task: Fix Playwright E2E test suite (60 tests)
- Status: completed
- Scope: Fixed all test failures across 8 spec files; added aria-labels to form components; fixed locator strategies
- Files changed: src/components/employee-form.tsx, src/components/establishment-form.tsx, src/app/forms/[taskId]/form-entry-client.tsx, e2e/01-navigation.spec.ts, e2e/02-establishments.spec.ts, e2e/03-employees.spec.ts, e2e/04-cycles.spec.ts, e2e/05-form-entry.spec.ts, e2e/06-kanban.spec.ts, e2e/07-print-views.spec.ts, e2e/08-exports.spec.ts, playwright.config.ts
- Metrics impact: 60/60 Playwright tests passing
- Validation: `npx playwright test --project=chromium` — 60 passed
- Next step: N/A

---

### Task Update — 2026-05-31 14:00 IST
- Task: Prisma schema and initial migration
- Status: completed
- Scope: Full schema with 14 models and 4 enums; shared TypeScript types; migration applied
- Files changed: prisma/schema.prisma, prisma/migrations/20260531140032_init/migration.sql, prisma/migrations/migration_lock.toml, src/types/index.ts
- Metrics impact: +14 models, +4 enums, +1 migration
- Validation: `npx prisma migrate dev --name init` — success; `npx tsc --noEmit` — 0 errors
- Next step: Task 3 — Establishment domain validation (zod schemas + business rules)

### Task Update — 2026-05-31 19:35 IST
- Task: Employee domain validation
- Status: completed
- Scope: validateEmployee function with 9 required-field checks and 2 conditional checks (exitDate/exitReason)
- Files changed: src/domain/validations/employee.ts, tests/domain/employee.test.ts
- Metrics impact: +1 domain validation module, +12 tests
- Validation: `npm test tests/domain/employee.test.ts` — 12/12 passed; `npm test` — 12/12 passed
- Next step: Task 5 — Establishment API routes (after Task 3 completes)

### Task Update — 2026-05-31 20:30 IST
- Task: Tasks 7-10 — UI layer and seed data
- Status: completed
- Scope: Root layout + sidebar; establishments UI (list/new/edit); employees UI (list/new/edit with filters); seed data (2 establishments + 6 hospital employees)
- Files changed: src/app/layout.tsx, src/app/globals.css, src/app/page.tsx, src/components/sidebar.tsx, src/components/page-header.tsx, src/components/establishment-form.tsx, src/components/employee-form.tsx, src/app/establishments/page.tsx, src/app/establishments/new/page.tsx, src/app/establishments/[id]/page.tsx, src/app/employees/page.tsx, src/app/employees/new/page.tsx, src/app/employees/[id]/page.tsx, prisma/seed.ts, prisma.config.ts, package.json
- Metrics impact: +4 components, +6 pages, +2 seed establishments, +6 seed employees
- Validation: `npx tsc --noEmit` — 0 errors; `npx prisma db seed` — success
- Next step: Tasks 11+ — Monthly Cycles UI and wage calculation

### Task Update — 2026-05-31 20:40 IST
- Task: Plan 2 Task 1 — Cycle domain logic
- Status: completed
- Scope: validateNewCycle (4 validations) + kanban-transitions (isValidTransition with VALID_TRANSITIONS map, requiresComment, getFormCodes)
- Files changed: src/domain/validations/cycle.ts, src/domain/workflow/kanban-transitions.ts, tests/domain/cycle.test.ts, tests/domain/kanban-transitions.test.ts
- Metrics impact: +2 domain modules, +25 tests (9 cycle + 10 transition + 3 comment + 4 formcodes)
- Validation: `npx vitest run tests/domain/cycle.test.ts tests/domain/kanban-transitions.test.ts` — 25/25 passed; `npx tsc --noEmit` — 0 errors
- Next step: Plan 2 Task 2 — Cycle API routes

### Task Update — 2026-05-31 20:41 IST
- Task: Plan 2 Task 2 — Cycle API routes
- Status: completed
- Scope: 4 endpoints — GET /api/cycles (list with optional establishmentId filter), POST /api/cycles (create with cycle data validation, employee snapshot, form task creation), GET /api/cycles/[id] (detail with establishment, form tasks, cycle employees), PUT /api/cycles/[id] (update status/wagePeriodDays)
- Files changed: src/app/api/cycles/route.ts, src/app/api/cycles/[id]/route.ts
- Metrics impact: +2 API routes with 4 handlers
- Validation: `npx tsc --noEmit` — 0 errors; commit: 2b6e871
- Next step: Plan 2 Task 3 — Cycle UI

### Task Update — 2026-05-31 21:30 IST
- Task: Plan 2 Tasks 4 and 5 — Cycles UI and Kanban board home page
- Status: completed
- Scope: CycleForm component (client, POST to /api/cycles); /cycles list page; /cycles/new create page; /cycles/[id] detail page with form tasks and employees table; Kanban board as home page (/) with 6-column status view and establishment/month/year filters
- Files changed: src/components/cycle-form.tsx, src/app/cycles/page.tsx, src/app/cycles/new/page.tsx, src/app/cycles/[id]/page.tsx, src/app/page.tsx
- Metrics impact: +1 component, +4 pages; pages now: /cycles, /cycles/new, /cycles/[id], /
- Validation: `npx tsc --noEmit` — 0 errors; `npm run build` — 13 routes compiled successfully; commit: ddcfadf
- Next step: Plan 2 Task 6 — Forms detail page (/forms/[id])

### Task Update — 2026-06-01 06:54 IST
- Task: Plan 3 Task 1 — Attendance and wage calculation domain functions
- Status: completed
- Scope: Two pure domain functions: calculateAttendanceTotals(dailyMarks) counts P/OT/H as worked, L as leave, A as absent; calculateWages(config, input) implements TN_MINIMUM_WAGES_HOSPITAL and TN_SHOPS_ESTABLISHMENTS presets with configurable fixedAllowance/HRA. Includes type definitions (AttendanceTotals, WageInput, WageCalcResult) and 17 comprehensive unit tests.
- Files changed: src/domain/calculations/attendance-calculator.ts, src/domain/calculations/wage-calculator.ts, tests/domain/attendance-calculator.test.ts, tests/domain/wage-calculator.test.ts
- Metrics impact: +2 domain modules, +17 tests (8 attendance + 9 wage)
- Validation: `npx vitest run tests/domain/attendance-calculator.test.ts tests/domain/wage-calculator.test.ts` — 17/17 passed; `npx tsc --noEmit` — 0 errors; commit: 45a7553
- Next step: Plan 3 Task 2 — Form detail page and wage record APIs

### Task Update — 2026-06-01 12:15 IST
- Task: Plan 3 Task 2 — Attendance record API route
- Status: completed
- Scope: GET /api/form-tasks/[id]/attendance (fetch all attendance records for a cycle) and PUT /api/form-tasks/[id]/attendance (upsert records with auto-calculated totals). Handles Next.js 16 Promise params, JSON serialization of dailyMarks, composite key upsert.
- Files changed: src/app/api/form-tasks/[id]/attendance/route.ts
- Metrics impact: +1 API route with 2 handlers (GET, PUT)
- Validation: `npx tsc --noEmit` — 0 errors; commit: 4febdc2
- Next step: Plan 3 Task 3 — Wage record API route

### Task Update — 2026-06-01 07:01 IST
- Task: Plan 3 Task 3 — Wage record API route
- Status: completed
- Scope: GET /api/form-tasks/[id]/wages (fetch all wage records for a cycle) and PUT /api/form-tasks/[id]/wages (upsert records with auto-calculated totals). Handles Next.js 16 Promise params, JSON serialization of otherAllowances, composite key upsert, OvertimeRecord lookup, wageFormulaConfig parsing, and calculateWages integration.
- Files changed: src/app/api/form-tasks/[id]/wages/route.ts
- Metrics impact: +1 API route with 2 handlers (GET, PUT)
- Validation: `npx tsc --noEmit` — 0 errors; commit: 53c5487
- Next step: Plan 3 Task 4 — Leave and overtime record API routes

### Task Update — 2026-06-01 07:15 IST
- Task: Plan 3 Task 4 — Form data entry page /forms/[taskId]
- Status: completed
- Scope: Server page (page.tsx) loads formTask, cycle, employees, wageFormulaConfig, existing attendance and wage records from DB. Client component (form-entry-client.tsx) renders two-tab UI: Attendance tab with 31-day clickable mark grid (P/A/L/H/OT cycle), summary columns (worked/leave/absent/wage days), start/end time inputs; Wage Data tab with editable numeric grid and real-time gross/net calculations via calculateWages. Footer toolbar handles NOT_STARTED/DATA_ENTRY/NEEDS_CORRECTION transitions.
- Files changed: src/app/forms/[taskId]/form-entry-client.tsx, src/app/forms/[taskId]/page.tsx
- Metrics impact: +2 pages (server + client component); route /forms/[taskId] now active
- Validation: `npx tsc --noEmit` — 0 errors; `npx vitest run` — 67/67 passed; `npx next build` — success (21 routes, /forms/[taskId] listed as dynamic)
- Next step: Plan 3 Task 5 — Leave and overtime record API routes

### Task Update — 2026-06-01 07:36 IST
- Task: Plan 4 Task 1 — Overtime and leave calculation domain functions
- Status: completed
- Scope: Two pure domain functions: calculateOvertimeTotals(dailyOt, normalEarnings, otRate) sums OT hours (ignoring negatives), applies rate, and returns totalOtHours/otEarnings/totalEarnings; calculateEarnedLeaveClosing(opening, during, availed) calculates closing balance with Math.max(0, ...) floor. Both with proper rounding to 2 decimal places.
- Files changed: src/domain/calculations/overtime-calculator.ts, src/domain/calculations/leave-calculator.ts, tests/domain/overtime-calculator.test.ts, tests/domain/leave-calculator.test.ts
- Metrics impact: +2 domain modules, +11 tests (7 overtime + 4 leave)
- Validation: `npx vitest run tests/domain/overtime-calculator.test.ts tests/domain/leave-calculator.test.ts` — 11/11 passed; `npx vitest run` — 78/78 passed (11 new + 67 existing); `npx tsc --noEmit` — 0 errors
- Next step: Plan 4 Task 2 — Leave and overtime record API routes

### Task Update — 2026-06-01 07:38 IST
- Task: Plan 4 Task 2 — Overtime record API route
- Status: completed
- Scope: GET /api/form-tasks/[id]/overtime (fetch all overtime records for a cycle) and PUT /api/form-tasks/[id]/overtime (upsert records with auto-calculated totals). Handles Next.js 16 Promise params, JSON serialization of dailyOt, composite key upsert, calculateOvertimeTotals integration.
- Files changed: src/app/api/form-tasks/[id]/overtime/route.ts
- Metrics impact: +1 API route with 2 handlers (GET, PUT)
- Validation: `npx tsc --noEmit` — 0 errors; `npm test` — 78/78 passed; `npm run build` — success (13 routes listed including /api/form-tasks/[id]/overtime)
- Next step: Plan 4 Task 3 — Leave record API route

### Task Update — 2026-06-01 09:45 IST
- Task: Plan 4 Task 3 — Fines and deductions API routes
- Status: completed
- Scope: 4 new API endpoints. GET/POST /api/form-tasks/[id]/fines (list, create FineRecord with cycleId + required fields: employeeId, offenceDate, offenceDescription). GET/POST /api/form-tasks/[id]/deductions (list, create DeductionRecord with cycleId + required fields: employeeId, damageDate, description). DELETE /api/fine-records/[fineId] (remove individual record). DELETE /api/deduction-records/[deductionId] (remove individual record). All support optional fields with sensible defaults (0 for amounts, null for remarks).
- Files changed: src/app/api/form-tasks/[id]/fines/route.ts, src/app/api/fine-records/[fineId]/route.ts, src/app/api/form-tasks/[id]/deductions/route.ts, src/app/api/deduction-records/[deductionId]/route.ts
- Metrics impact: +4 API routes with GET/POST/DELETE handlers; 0 new models (FineRecord, DeductionRecord already in schema)
- Validation: `npx tsc --noEmit` — 0 errors; all 4 files created with exact spec; commit: 9d9525d
- Next step: Plan 4 Task 4 — Form UI for fines/deductions data entry

### Task Update — 2026-06-01 07:39 IST
- Task: Plan 4 Task 4 — Leave record API route
- Status: completed
- Scope: GET + PUT /api/form-tasks/[id]/leave route: GET fetches all LeaveRecord for a cycle (ordered by employee name); PUT upserts records with auto-calculated earnedClosing via calculateEarnedLeaveClosing. Handles Next.js 16 Promise params, composite key upsert, optional field null-coercion.
- Files changed: src/app/api/form-tasks/[id]/leave/route.ts
- Metrics impact: +1 API route with 2 handlers (GET, PUT)
- Validation: `npx tsc --noEmit` — 0 errors; `npx vitest run` — 78/78 passed; changelog + status updated
- Next step: Plan 4 Task 5 — Overtime record API route

### Task Update — 2026-06-01 07:52 IST
- Task: Plan 4 Task 5 — Add Overtime, Fines, Deductions, Leave tabs to form entry page
- Status: completed
- Scope: Extended form-entry-client.tsx with 4 new types (OtRow, FineEntry, DeductionEntry, LeaveRow), 4 new props, 6 new state variables, 9 new handler functions. Added Overtime tab (daily hours grid with real-time OT earnings calc), Fines tab (list + add form + delete), Deductions tab (list + add form + delete), Leave tab (per-employee EL/medical/other inputs with auto-calculated closing). Updated page.tsx with 4 new Prisma queries and initial data structures passed as props. Bug fix: delete operations now surface API errors via setErrors.
- Files changed: src/app/forms/[taskId]/form-entry-client.tsx, src/app/forms/[taskId]/page.tsx
- Metrics impact: /forms/[taskId] now has 6 tabs; +4 new API calls surfaced in UI
- Validation: `npx tsc --noEmit` — 0 errors; `npx vitest run` — 78/78 passed; build success; commits: a875fbb, 2ea0834
- Next step: Plan 5 — Export Pipeline (DOCX + PDF + print views)

### Task Update — 2026-06-03 10:00 IST
- Task: Plan 5 Task 1 — Form data extraction library
- Status: completed
- Scope: Created src/lib/export/form-data.ts with CycleContext type, 8 row types (WagesRow, MusterRow, EmployeeRow, OvertimeRow, FineRow, DeductionRow, LeaveRow), and 7 async data functions. Installed docxtemplater + pizzip. Fixed two schema discrepancies: MonthlyCycle (not Cycle), presentAddress/permanentAddress (not address).
- Files changed: src/lib/export/form-data.ts, package.json, package-lock.json
- Metrics impact: +1 export library module
- Validation: `npx tsc --noEmit` — 0 errors
- Next step: Plan 5 Task 2 — Print layout + route dispatcher + PrintButton

### Task Update — 2026-06-03 10:15 IST
- Task: Plan 5 Task 4 — Hospital Form XI + XVII + IV print views
- Status: completed
- Scope: Created 3 hospital form TSX components: hospital-form-xi.tsx (Employee Register with 13 columns), hospital-form-xvii.tsx (Wage Slips with 2-column grid layout), hospital-form-iv.tsx (Overtime Muster Roll with dynamic daily columns). All components use CycleContext, row types from form-data.ts, and proper formatting helpers.
- Files changed: src/app/print/[cycleId]/[formCode]/hospital-form-xi.tsx, src/app/print/[cycleId]/[formCode]/hospital-form-xvii.tsx, src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx
- Metrics impact: +3 print view components
- Validation: `npx tsc --noEmit` — 0 errors (filtered existing form component not-found errors); commit: 9cba18f
- Next step: Plan 5 Task 5 — Hospital Form I + II + all 5 Shop Forms print views

### Task Update — 2026-06-03 11:00 IST
- Task: Plan 5 Task 6 — Export trigger API route
- Status: completed
- Scope: Created POST /api/form-tasks/[id]/export — loads formTask + cycle, determines next versionNo, calls generateDocx + generatePdf (with per-step error capture), persists GeneratedDocument record, transitions FormTask status to EXPORTED if no errors, returns 201 JSON with id/fileName/docxPath/pdfPath/versionNo/warnings. Created exports/ directory with .gitkeep (gitignored). exports/ already present in .gitignore — .gitkeep not commitable by design.
- Files changed: src/app/api/form-tasks/[id]/export/route.ts, exports/.gitkeep (local only — gitignored)
- Metrics impact: +1 API route with POST handler
- Validation: `npx tsc --noEmit` (filtered docx-generator + pdf-generator missing module errors) — 0 other errors; commit: 33e070a
- Next step: Plan 5 Task 7 — DOCX + PDF generation libraries + templates scaffold

### Task Update — 2026-06-03 11:30 IST
- Task: Plan 5 Task 7 — DOCX generator, PDF generator, templates scaffold
- Status: completed
- Scope: Created docx-generator.ts (docxtemplater + pizzip, switch on formCode, 12 form codes mapped), pdf-generator.ts (LibreOffice soffice subprocess, JVM stderr suppression), templates/README.md (naming conventions + variable docs), templates/hospital/.gitkeep, templates/shop/.gitkeep
- Files changed: src/lib/export/docx-generator.ts, src/lib/export/pdf-generator.ts, templates/README.md, templates/hospital/.gitkeep, templates/shop/.gitkeep
- Metrics impact: +2 export library modules, +1 templates scaffold
- Validation: `npx tsc --noEmit` — 0 errors; commit: c953eee
- Next step: Plan 5 Task 8 — Export history UI + print links on cycle detail

### Task Update — 2026-06-05 21:36 IST
- Task: Task 6 — Wage Rules API routes (GET/PUT/DELETE)
- Status: completed
- Scope: Created src/app/api/wage-rules/route.ts with 3 handlers: GET (fetch custom wage rules for an establishment, merge with defaults); PUT (upsert wage rule with validation of establishmentId, ruleKey, ruleValue); DELETE (reset all custom rules for an establishment). All handlers include proper error handling and validation.
- Files changed: src/app/api/wage-rules/route.ts
- Metrics impact: +1 API route with 3 handlers (GET, PUT, DELETE)
- Validation: `npx tsc --noEmit` — 0 errors; commit: 4060d1f
- Next step: Task 7 — Wage Rules page (/wage-rules with establishment selector, inline edit, reset, E2E)

### Task Update — 2026-06-06 IST
- Task: Comprehensive final review — Info tooltips + client-side validation on all forms
- Status: completed
- Scope: Created shared Info tooltip component. Added ℹ info icons with example text to every field in establishment-form, employee-form, cycle-form, holidays-client, wage-rules-client, and form-entry-client (attendance legend + wage column headers). Added client-side validation guards in all forms: establishment (name length, regCertNo, fixedAllowance cap, LWF sanity), employee (age ≥14, DOE after DOB, exit date logic, exit reason required, mobile format, UAN format, IFSC format, wage bounds), cycle (year range, wagePeriodDays range, establishment required), holidays (date required, name length, year plausibility), wage rules (per-rule min/max bounds). Added wage row validation in saveWages() (daysWorked range, no negative wages).
- Files changed: src/components/info-tooltip.tsx (new), src/components/establishment-form.tsx, src/components/employee-form.tsx, src/components/cycle-form.tsx, src/app/holidays/holidays-client.tsx, src/app/wage-rules/wage-rules-client.tsx, src/app/forms/[taskId]/form-entry-client.tsx
- Metrics impact: +1 new component; 0 TypeScript errors
- Validation: `npx tsc --noEmit` — 0 errors (clean pass)
- Next step: None — review complete

### Task Update — 2026-06-06 IST
- Task: Live Salary Slip Simulator on Wage Rules page
- Status: completed
- Scope: Rewrote wage-rules-client.tsx with two-column layout: left = rules table (unchanged functionality + RULE_INFO with label/info/min/max, row highlights green when editing), right = salary slip simulator panel (8 sample input fields + live computed slip). Slip shows Earnings (prorated Basic, DA, Fixed Allowance, Holiday Bonus, OT Earnings → Gross), Deductions (PF, ESI, LWF → Total, Net Pay), Employer Contributions (PF, ESI → Total CTC). Each affected slip line shows rule-key badge + formula string. When editing a rule, the affected slip line highlights green and a "Editing X — affected line highlighted →" banner appears. Uses system defaults when no establishment selected, switches to establishment's custom rules once loaded.
- Files changed: src/app/wage-rules/wage-rules-client.tsx
- Metrics impact: 0 TypeScript errors
- Validation: `npx tsc --noEmit` — 0 errors (clean pass)
- Next step: None — all features complete

### Task Update — 2026-06-23 07:50 IST
- Task: A6 — Pure employee-import row parser (header mapping + per-row validation)
- Status: completed
- Scope: TDD — wrote failing tests first, then implemented parseEmployeeRows(). Handles case-insensitive + trimmed header matching via ALIASES map. Validates required Name and Salary fields (positive finite number). Maps optional fields: empId, sex, fatherSpouseName, designation, dateOfEntry, mobile, bankAccount, ifsc, paymentMode (defaults BANK). Row numbers are 1-based (header = row 1, first data row = row 2). Returns { valid: ParsedEmployee[], errors: RowError[] }.
- Files changed: src/lib/import/parse-employees.ts, src/lib/import/parse-employees.test.ts
- Metrics impact: +1 lib module, +2 tests passing
- Validation: npm test -- parse-employees → 2 passed (2) in 171ms; commit: 2bbe4c3
- Next step: A7 — Import route + page + sample CSV
