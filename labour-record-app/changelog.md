# Changelog

- [2026-06-01] [claude] — Added: /forms/[taskId] data entry page with Attendance and Wage Data tabs.
  Files: src/app/forms/[taskId]/page.tsx, src/app/forms/[taskId]/form-entry-client.tsx. DB: none. Rollback: delete the two files.
- [2026-06-01] [claude] — Added: overtime and leave calculation domain functions.
  Files: src/domain/calculations/overtime-calculator.ts, src/domain/calculations/leave-calculator.ts, tests/domain/overtime-calculator.test.ts, tests/domain/leave-calculator.test.ts. DB: none. Rollback: delete the four files. Tests: 11 new tests (7 overtime + 4 leave), all passing.
- [2026-06-01] [claude] — Added: fines and deductions API routes.
  Files: src/app/api/form-tasks/[id]/fines/route.ts, src/app/api/fine-records/[fineId]/route.ts, src/app/api/form-tasks/[id]/deductions/route.ts, src/app/api/deduction-records/[deductionId]/route.ts. DB: none. Rollback: delete the four files.
- [2026-06-01] [claude] — Added: leave record API route (GET + PUT /api/form-tasks/[id]/leave).
  Files: src/app/api/form-tasks/[id]/leave/route.ts. DB: none. Rollback: delete the file. Upserts LeaveRecord per cycle×employee; auto-calculates earnedClosing via calculateEarnedLeaveClosing.
- [2026-06-06] [claude] — Added: shared Info tooltip component; added info tooltips to all form fields; added client-side validation to all forms.
  Files: src/components/info-tooltip.tsx, src/components/establishment-form.tsx, src/components/employee-form.tsx, src/components/cycle-form.tsx, src/app/holidays/holidays-client.tsx, src/app/wage-rules/wage-rules-client.tsx, src/app/forms/[taskId]/form-entry-client.tsx. DB: none. Rollback: revert each file individually.

- [2026-07-01] [claude] — Added: generic SplitRegister component — splits wide daily-column registers (Form IV Overtime, Form V Muster, Shop Form V Employment) into two landscape pages so identity columns remain legible. Part 1 covers days 1–mid; Part 2 repeats identity columns + days mid+1–end + summary columns.
  Files: src/lib/day-split.ts (+test), src/app/print/[cycleId]/[formCode]/split-register.tsx (new), hospital-form-iv.tsx, hospital-form-v.tsx, shop-form-v.tsx (refactored to thin configs). DB: none. Tests: +3 unit (day-split), +1 e2e spec (17-wide-register-split, 2 tests). Rollback: revert the 5 tsx files and delete day-split + split-register.

- [2026-07-01] [claude] — Fixed: Form V (muster) 2-page split now preserves all original columns (Period of Work, Daily Hours incl. OT, Time Commenced/Ceased, Rest Interval, Days Worked, Leave, Absent, Wage Days, Remarks) that were erroneously dropped when refactoring to the SplitRegister config.
  Files: src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx. DB: none.

- [2026-07-01] [claude] — Fixed: POST /api/employees returned 500 (Prisma P2003 FK violation) when establishmentId did not exist in the DB. Added a pre-create existence check that returns 422 with "Establishment not found".
  Files: src/app/api/employees/route.ts. DB: none.

- [2026-07-01] [claude] — Added: live employee search — name/establishment/status filters now update the employee list instantly (debounced 300 ms) without a Filter button click, via router.replace() URL param updates.
  Files: src/app/employees/employee-filters.tsx (new), src/app/employees/page.tsx. DB: none.

- [2026-07-01] [claude] — Added: full-field bulk employee import (ADD / UPDATE / DELETE) with downloadable XLSX template. Template has 35 columns covering all Employee fields with Mandatory/Optional/Not-used annotations per action. Parser handles CSV and XLSX, silently skips template instruction rows, validates required fields per action. Import API hard-deletes employees with no cycle refs, marks EXITED otherwise. Returns counters (added/updated/deleted/exited) + per-row errors.
  Files: src/lib/import/parse-employees.ts (rewritten), src/app/api/employees/import/route.ts (rewritten), src/app/api/employees/import/template/route.ts (new), src/app/employees/import/import-client.tsx (rewritten). DB: none. Tests: parse-employees.test.ts updated (7 unit tests).

- [2026-07-01] [claude] — Added: e2e/18-bulk-import.spec.ts — 14 tests covering template download link, template API (xlsx content-type + all 35 column headers), ADD/UPDATE/DELETE requirement rows, ADD/UPDATE/DELETE happy paths with counter assertions and list verification, all 4 validation error cases, UPDATE/DELETE nonexistent empId, mixed CSV, and raw template re-upload safety.
  Files: e2e/18-bulk-import.spec.ts (new). DB: none.

- [2026-07-01] [claude] — Fixed: employees with legacy salary=0 were blocked from saving via the edit form. validateEmployee now accepts { requireSalary?: boolean }; PUT route passes requireSalary: false so existing 0-salary employees can be updated without first setting a salary.
  Files: src/domain/validations/employee.ts, src/app/api/employees/[id]/route.ts. DB: none.

- [2026-07-01] [claude] — Added: explicit aria-label to all 21 form inputs/selects in employee-form that previously had none (UAN, ESI No, Aadhaar, Bank Account, IFSC Code, Bank Name, Mobile, Email, Department, Status, Exit Date, Reason for Exit, DA Wage, HRA Wage, PF Amount, ESI Amount, LWF Amount, Remarks, etc). Makes form fields accessible to screen readers and gives Playwright stable selectors.
  Files: src/components/employee-form.tsx. DB: none.

- [2026-07-01] [user] — Updated: tech-sakthi-logo.webp optimized (84 KB → 13 KB); added Logo/logo.png source asset.
  Files: public/tech-sakthi-logo.webp, Logo/logo.png. DB: none.

- [2026-07-01] [claude] — Added: e2e/19-employee-edit.spec.ts — 15 tests: 9 field round-trip tests covering every editable category (identity, contact, statutory IDs, salary, PF mode, payment mode BANK→CASH, CASH→BANK, validation scroll UX, exit date/reason) + 6 no-op save tests for every seeded employee. All 15 passing.
  Files: e2e/19-employee-edit.spec.ts (new). DB: none.
