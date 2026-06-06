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
