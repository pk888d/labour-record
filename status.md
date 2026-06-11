# Labour Record Compliance Management App — Status

## Overall Progress: 10% [█░░░░░░░░░]

## Phase Progress

| Phase | Status | Notes |
|-------|--------|-------|
| Task 1: Scaffold Next.js project | ✅ Completed | |
| Task 2: Prisma schema + migration | ⬜ Pending | |
| Task 3: Establishment domain validation | ⬜ Pending | |
| Task 4: Employee domain validation | ⬜ Pending | |
| Task 5: Establishment API routes | ⬜ Pending | |
| Task 6: Employee API routes | ⬜ Pending | |
| Task 7: Root layout + sidebar | ⬜ Pending | |
| Task 8: Establishments UI | ⬜ Pending | |
| Task 9: Employees UI | ⬜ Pending | |
| Task 10: Seed data | ⬜ Pending | |

## Project Metrics

| Metric | Value |
|--------|-------|
| Files created | 8 |
| Models | 0 |
| API endpoints | 0 |
| Permissions | 0 |

## COMPLETED ITEMS

- Task 1: Scaffolded Next.js 15 app with TypeScript, Tailwind CSS, Prisma (SQLite), Vitest, clsx, tailwind-merge
- Created `src/lib/utils.ts` with `cn()` helper
- Verified dev server starts and serves HTML on localhost:3000
- Committed with message: `feat: scaffold Next.js 15 app with TypeScript, Tailwind, Prisma, Vitest`
- Code review fixes for Task 1: moved `prisma` CLI to devDependencies, added `src/lib/prisma.ts` singleton using `@prisma/adapter-better-sqlite3` (required by Prisma 7.x)

## EXECUTION STATUS

- Current state: QA testing complete — 42/42 tests passing after fixes
- Next action: Continue with Task 2 — Define Prisma schema and run migration (or next user-directed task)

---

### Task Update — 2026-05-31 TZ
- Task: Task 1 — Scaffold Next.js project
- Status: completed
- Scope: Bootstrap Next.js 15 app, install Prisma/Vitest/clsx/tailwind-merge, configure vitest, add test scripts, update .gitignore, create utils.ts
- Files changed: package.json, package-lock.json, .gitignore, vitest.config.ts, prisma/schema.prisma, prisma.config.ts, src/lib/utils.ts
- Metrics impact: 7 new/modified files
- Validation: `curl http://localhost:3000` returned Next.js HTML; git commit 0e7a62f
- Next step: Task 2 — Define Prisma schema (Establishment + Employee models) and run migration

### Task Update — 2026-05-31 TZ
- Task: Task 1 code review fixes
- Status: completed
- Scope: Fix 1 (schema url) is N/A for Prisma 7 (url moved to prisma.config.ts); Fix 2: moved prisma CLI to devDependencies; Fix 3: created prisma singleton — adapted for Prisma 7 which requires adapter-based instantiation
- Files changed: package.json, package-lock.json, src/lib/prisma.ts
- Metrics impact: +1 file (src/lib/prisma.ts), added @prisma/adapter-better-sqlite3 and better-sqlite3 to dependencies
- Validation: `npx tsc --noEmit` passes cleanly; `npx prisma generate` succeeds; git commit 1396c85
- Next step: Task 2 — Define Prisma schema (Establishment + Employee models) and run migration

### Task Update — 2026-06-06 10:00 IST
- Task: QA testing — full user guide walkthrough
- Status: completed
- Scope: Playwright-automated QA across all 14 app sections; 5 doc fixes in user_guide.md; root-cause identified for fines React onChange issue; 1 accessibility finding logged
- Files changed: man/user_guide.md
- Metrics impact: none (no source code changed; doc fixes only)
- Validation: 42/42 automated test assertions passing; all 7 print forms render correct data; salary slips show wage proration
- Next step: User to decide next development task

### Task Update — 2026-06-09 08:50 IST
- Task: Feedback Phase A — establishment types + DA, PF config, salary breakdown (items 8, 5, 10)
- Status: completed (core); one PF "apply-to-all" button pending in Phase C
- Scope:
  - Item 8: EstablishmentType enum expanded to SHOP/HOSPITAL/HOTEL/PETROL_BUNK/MEDICAL/OIL_MILL; new da-rates.ts (fixed DA per type, getWagePreset/getFormFamily helpers); establishment-form 6-type dropdown; validation accepts all six types; non-hospital types use shop-family forms + TN_SHOPS preset.
  - Item 5: Employee.pfMode/pfPercent/pfWageCeiling fields; pf-calculator.ts (12% default, ₹15000 ceiling → ₹1800 cap, PERCENT/FIXED/NONE); employee-form PF UI; POST /api/establishments/[id]/apply-pf bulk endpoint.
  - Item 10: Employee.defaultTotalSalary field; salary-breakdown.ts (total → Basic/DA/PF/ESI/OT → net); employee-form "Default Total Salary" + "Compute breakdown" driver; ESI 0.75% when gross ≤ ₹21,000.
- Files changed: prisma/schema.prisma, prisma/migrations/20260609031526_phase_a_types_pf_salary/, src/types/index.ts, src/domain/calculations/{da-rates,pf-calculator,salary-breakdown}.ts, src/domain/validations/establishment.ts, src/components/{establishment-form,employee-form}.tsx, src/app/api/employees/route.ts, src/app/api/employees/[id]/route.ts, src/app/api/establishments/[id]/apply-pf/route.ts, tests/domain/{da-rates,pf-calculator,salary-breakdown,establishment}.test.ts
- Metrics impact: +3 domain calc modules, +1 API endpoint, +3 Employee fields, +1 migration, +28 new unit tests (122 total passing)
- Validation: `npx vitest run tests/` → 122 passed; `npx tsc --noEmit` clean; `npx prisma generate` succeeds
- Next step: Phase B (DOCX templates + watermark + logo + dual wage slip), OR wait for user's holiday list + logo asset

### Task Update — 2026-06-09 09:35 IST
- Task: Feedback items 3, 4, 1, 2, 11, 7, 6 (dashboard, firm→employees, logo, watermark, dual slip, round-robin attendance, holidays)
- Status: completed
- Scope:
  - Item 3: /dashboard route (firm cards + employee/cycle/DA totals); added to sidebar.
  - Item 4: establishment name links to /establishments/[id]/employees (list + Edit + Add); ApplyPfButton wired to apply-pf endpoint (completes item 5).
  - Item 1: placeholder tech-sakthi-logo.svg, wired into sidebar + print BrandHeader/slips.
  - Item 2: CSS diagonal watermark component on print forms + salary slips.
  - Item 11: SlipCard component; individual slip renders Original + Duplicate(Photocopy) on one A4 portrait sheet with logo + watermark.
  - Item 7: computeWeeklyOffDays + applyRotatingAttendanceDefaults (rotate weekly off by employee + week); wired into form page; POST /api/cycles/generate-fy (Apr-Mar 12 cycles) + GenerateFyButton; widened getFormCodes to EstablishmentType (new types → shop forms).
  - Item 6: default-holidays.ts + ensureHolidays + seed-defaults endpoint + "Load default holidays" button; GovtHoliday.doubleWage field (+migration) + UI column.
- Files changed: src/app/dashboard/page.tsx, src/components/sidebar.tsx, src/app/establishments/page.tsx, src/app/establishments/[id]/employees/{page,apply-pf-button}.tsx, public/tech-sakthi-logo.svg, src/components/print-brand.tsx, src/app/print/layout.tsx, src/app/cycles/[id]/salary-slips/[employeeId]/{page,slip-card}.tsx, src/domain/calculations/attendance-calculator.ts, src/app/forms/[taskId]/page.tsx, src/domain/workflow/kanban-transitions.ts, src/app/api/cycles/{route,generate-fy/route}.ts, src/app/cycles/{page,generate-fy-button}.tsx, src/domain/holidays/{default-holidays,ensure-holidays}.ts, src/app/api/holidays/{route,seed-defaults/route}.ts, src/app/holidays/{page,holidays-client}.tsx, prisma/schema.prisma (+migration holiday_double_wage), tests/domain/{attendance-rotation,default-holidays}.test.ts
- Metrics impact: +5 routes/endpoints, +1 migration, +1 schema field, +19 new tests (141 total passing)
- Validation: `npx vitest run tests/` → 141 passed; `npx tsc --noEmit` clean
- Next step: Item 9 — wire/tag the supplied DOCX templates into the export pipeline (currently broken: templates dir empty)

### Task Update — 2026-06-09 17:30 IST
- Task: Item 9 — DOCX templates wired + tagged (partial)
- Status: in progress (pipeline fixed + 2 of 12 forms tagged & verified)
- Scope:
  - Fixed broken export pipeline: copied all 12 supplied templates into labour-record-app/templates/{hospital,shop}/ with the names docx-generator expects (was empty → "Template not found" crash).
  - docx-generator: added nullGetter (untagged/missing columns render blank, never throw) + row enrichment (sno, totalNormal, totalDeductions, leaveWages, otEarnings).
  - Wrote scripts/tag-template.py — injects {#rows}…{/rows} loop + {field} tags into a template's data row, removes spare placeholder rows, does header text replacement.
  - Tagged + RENDER-VERIFIED: hospital_form_xii.docx (17 cols) and shop_form_w.docx (14 cols) — both produce a .docx with header period + looped employee rows (verified via docxtemplater render of mock data).
- Files changed: labour-record-app/templates/{hospital,shop}/*.docx (12 copied, 2 tagged), src/lib/export/docx-generator.ts, scripts/tag-template.py
- Metrics impact: pipeline operational; 2/12 forms production-tagged
- Validation: node render of both tagged templates → both employee rows + period + DA values present in output XML; tsc clean; 141 tests pass
- REMAINING (needs per-form column map + visual check vs forms-filled/ samples): hospital xi/i/ii/iv/v/xvii, shop x/t/u/v. Muster (Form V) is a daily-attendance grid and wage slips (XVII/T) are one-employee-per-page — these need bespoke tagging, not the generic row-loop.
- User action: verify the two tagged forms open correctly in Word with proper column alignment before remaining 10 are tagged.

### Task Update — 2026-06-09 17:42 IST
- Task: Real logo + Item 9 DOCX (5/12 forms tagged, pipeline complete)
- Status: completed (logo); Item 9 partial (5/12 tagged, 7 need manual Word work)
- Scope:
  - Logo (item 1): replaced placeholder SVG with real Tech Sakthi Logo.webp (copied from html/GitHTML/techsakthi/assets/images/Logo.webp) → public/tech-sakthi-logo.webp; updated sidebar, print BrandHeader, slip-card to use it (object-contain). Removed placeholder svg.
  - Item 9: upgraded scripts/tag-template.py with depth-aware (nesting-safe) table/row/cell parsing + --table-index. Tagged + render-verified 5 forms: hospital_form_xii, _xi, _i, _ii and shop_form_w. All 12 templates validated: render without error (untagged 7 → blank official template via nullGetter, never crash).
  - Found 7 forms need manual Word tagging + visual verification: IV/V(hosp)/X/V(shop) use NESTED-table layouts (wrapper table containing data tables — unsafe to auto-tag blind); XVII/T/U are vertical per-page slips.
- Files changed: public/tech-sakthi-logo.webp (+removed .svg), src/components/{sidebar,print-brand}.tsx, src/app/cycles/[id]/salary-slips/[employeeId]/slip-card.tsx, scripts/tag-template.py, templates/{hospital,shop}/*.docx (5 tagged)
- Metrics impact: 5/12 statutory forms production-tagged; pipeline crash-free for all 12
- Validation: node render of all 12 templates → 12/12 valid; 5 tagged forms produce data rows; tsc clean; 141 tests pass (13 files)
- Next step: manual Word tagging of the 7 nested/vertical forms (or confirm the 5 tagged forms in Word first). Real logo + HTML print fallback for all forms are live.

### Task Update — 2026-06-09 18:30 IST
- Task: Item 9 COMPLETE (all 12 forms) + orientation option + logo scope correction
- Status: completed
- Scope:
  - All 12 statutory DOCX forms now tagged + render-verified with employee data:
    * Flat registers: XII, W, XI, I, II
    * Nested two-table forms with daily grids: IV (overtime), V (muster), X (leave), shop-V (employment) — solved via depth-aware (nesting-safe) parsing + daily column-loop ({#dailyMarks}{.}{/dailyMarks} collapses 31 fixed day-cells into one looped cell)
    * Per-employee page-loop slips: XVII, T (wage slips) and U (employee register) — whole table wrapped in {#rows}…{/rows} with page break per employee
  - Orientation option: landscape default + portrait toggle. HTML print views inject @page per-form with a Landscape/Portrait switch; DOCX generator rewrites <w:pgSz> orientation (landscape default), threaded from export API ?orientation=.
  - Logo scope correction (per user): Tech Sakthi logo is app-only (sidebar) — removed from salary slips and print BrandHeader (logo brands the software, not the establishment's statutory documents). Tech Sakthi watermark stays on outputs (item 2). Real Logo.webp installed.
- Files changed: scripts/tag-template.py (depth-aware + daily mode), scripts/tag-wageslip.py (new), templates/{hospital,shop}/*.docx (all 12 tagged), src/lib/export/docx-generator.ts (orientation + nullGetter + enrichment), src/app/api/form-tasks/[id]/export/route.ts (orientation param), src/app/print/[cycleId]/[formCode]/{page,print-button}.tsx, src/app/print/layout.tsx, src/components/print-brand.tsx, src/app/cycles/[id]/salary-slips/[employeeId]/slip-card.tsx, src/components/sidebar.tsx, public/tech-sakthi-logo.webp
- Metrics impact: 12/12 statutory forms production-tagged; orientation feature; logo scope fixed
- Validation: node render of all 12 templates with 2-employee dataset → 12/12 render WITH data; tsc clean; 141 tests pass (13 files)
- Next step: ALL 11 feedback items complete. Recommend opening a few exported forms in Word to confirm column alignment/styling matches the forms-filled/ samples.

### Task Update — 2026-06-09 19:10 IST
- Task: Salary slip landscape + orientation switch fix + full browser testing
- Status: completed
- Scope:
  - Salary slip print now LANDSCAPE with Original + Photocopy side-by-side (was portrait/stacked).
  - Orientation switch: was functionally working (@page flipped) but invisible on screen → added on-screen WYSIWYG page frame (landscape 1123px / portrait 794px) so the toggle is obviously working; @page still drives print, DOCX still rewrites pgSz.
  - Bug fixed: /establishments/[id]/employees crashed (500) with "undefined.toLocaleString" — the long-running dev server held a STALE Prisma client (pre-migration, missing defaultTotalSalary/pfAmount). Hardened fmt() to (n ?? 0) and restarted server.
  - Full browser testing via Playwright (real Chromium): all main pages load (dashboard/establishments/employees/cycles/holidays), firm-name→employees link, Apply-PF-to-all executes, holidays Load-defaults adds 16 rows (1→17), orientation toggle visibly flips layout, salary slip shows 2 side-by-side copies, live DOCX export returns 201 in landscape with {period} rendered. 0 page errors.
- Files changed: src/app/cycles/[id]/salary-slips/[employeeId]/page.tsx, src/app/print/[cycleId]/[formCode]/page.tsx, src/app/establishments/[id]/employees/page.tsx
- Validation: Playwright 7/7 + 13/13 browser checks pass, 0 page errors; tsc clean; 141 unit tests pass. (DOCX→PDF step needs LibreOffice/soffice installed — env only, DOCX itself works.)
- Next step: optional — install LibreOffice for DOCX→PDF auto-conversion; verify exported form column alignment in Word.

### Task Update — 2026-06-10 — Form output corrected vs forms-template
- Task: Match print/DOCX output to forms-template (list every employee, "Nil" empty cells)
- Status: completed
- Scope:
  - Fines (Form I) & Deductions (Form II): were per-record with a hiding "No fines recorded" empty state. Refactored getFinesData/getDeductionsData to return ONE ROW PER EMPLOYEE (all employees), with template columns (Name, Father's/Husband's, Age&Sex, Department, offence/deduction cols…) and "Nil" wherever there is no entry; merges real fines/deductions where present. Rewrote hospital-form-i.tsx & hospital-form-ii.tsx to the 12-column statutory layout with (1)-(12) numbering. Same data feeds DOCX (tags already aligned) — verified export lists all 6 employees + Nil.
  - Fixed pre-existing wages crash: WageRecord.otherAllowances held corrupt JSON (["[]"]) → reduce concatenated into a string → fmt n.toFixed crashed Form XII/XVII (and shop W/T). Added defensive sumNumeric() in form-data.ts + slip-data.ts (coerce each element to number), and hardened fmt() in all 5 wage components.
- Files changed: src/lib/export/form-data.ts, src/app/cycles/[id]/salary-slips/slip-data.ts, src/app/print/[cycleId]/[formCode]/{hospital-form-i,hospital-form-ii,hospital-form-iv,hospital-form-xii,hospital-form-xvii,shop-form-w,shop-form-t}.tsx
- Validation: browser sweep of all 7 hospital forms → 0 page errors; Fines/Deductions list all 6 employees with Nil (HTML + DOCX); Form XII renders all employees + TOTAL; tsc clean; 141 tests pass.
- Next step: commit; (other registers already listed all employees — no change needed).

### Task Update — 2026-06-10 — Date of Entry shows date only
- Task: Form XI (and all forms) Date of Entry must show date only, no time
- Status: completed
- Scope: empDataSnapshot stored dateOfEntry as a full ISO datetime, so registers showed "…T00:00:00.000Z". Added dateOnly() helper in form-data.ts and applied it in getCycleContext snapshot mapper (single source feeding all forms, HTML + DOCX).
- Files changed: src/lib/export/form-data.ts
- Validation: Form XI HTML print → Date of Entry "2020-01-01" (no time); DOCX export → no "T00:00", dates "2020-01-01"; tsc clean; 141 tests pass.

### Task Update — 2026-06-10 — Salary Setup: more control
- Task: Give more control over the employee Salary Setup section
- Status: completed
- Scope (per user: editable components + live preview, auto-fill-then-editable):
  - computeSalaryBreakdown extended: editable DA (overridable), HRA, Other Allowances, LWF; Basic = max(0, total − DA − HRA − Other); LWF added to deductions. 5 new TDD tests.
  - Employee form Salary Setup now has editable DA (defaults to firm rate, with ↺ reset-to-firm button), HRA, Other Allowances, Overtime/Double-Wages, PF Mode (+ Fixed PF amount input in FIXED mode, PF%/ceiling in PERCENT mode), ESI toggle.
  - Live Breakdown Preview table (Basic/DA/HRA/Other/Overtime/PF/ESI/LWF + Gross/Deductions/Net) recomputes as you type.
  - "Apply to wage defaults" fills Basic/DA/HRA/PF/ESI into the editable Monthly Wage Defaults (still hand-editable).
- Files changed: src/domain/calculations/salary-breakdown.ts, tests/domain/salary-breakdown.test.ts, src/components/employee-form.tsx
- Validation: browser — all inputs present, live preview updates (20000 − DA5000 − HRA2000 − Other1000 = Basic 12000; Net 19840), both PF modes compute ₹1800, 0 page errors; tsc clean; 146 tests pass.

### Task Update — 2026-06-10 — Salary Setup: ESI control
- Task: Add ESI control to Salary Setup
- Status: completed
- Scope: editable ESI Employee % (default 0.75) and ESI Threshold ₹ (default 21000), shown when ESI Applicable is ticked; wired into the live preview + computeSalaryBreakdown (which already accepted the params). 2 new tests (custom % and custom threshold).
- Files changed: src/components/employee-form.tsx, tests/domain/salary-breakdown.test.ts
- Validation: browser — ESI 90 @0.75%/12000; 120 @1%; 0 over ₹21k threshold; 187.50 when threshold raised to 30k; hides + 0 when unticked; 0 page errors; tsc clean; 148 tests pass.

### Task Update — 2026-06-10 — Salary Setup: LWF control
- Task: Add LWF control to Salary Setup
- Status: completed
- Scope: editable LWF (₹) input in Salary Setup, bound to form.lwfAmount (same value as Monthly Wage Defaults LWF, kept in sync), feeding the live preview + net. Salary Setup now controls DA, HRA, Other Allowances, Overtime, LWF, PF (Percent/Fixed + ceiling), ESI (% + threshold).
- Files changed: src/components/employee-form.tsx
- Validation: browser — LWF=20 drops Net by exactly ₹20 (10110→10090); value syncs; 0 page errors; tsc clean; 148 tests pass.

### Task Update — 2026-06-10 — Wage Rules aligned with salary controls
- Task: /wage-rules — add the same configurable parameters (PF ceiling, ESI threshold, LWF)
- Status: completed
- Scope: added 3 establishment-level rules to WAGE_RULE_DEFAULTS — PF_WAGE_CEILING (15000), ESI_THRESHOLD (21000), LWF_EMPLOYEE (10) — auto-surfaced by the API. Added RULE_INFO (labels/limits). Wired the live simulator: PF computed on min(basic, ceiling) [0=no cap]; ESI applies only when gross ≤ threshold [0=always]; LWF deduction now driven by the rule (removed the manual LWF slip input). LWF row highlights when editing LWF_EMPLOYEE.
- Files changed: src/domain/calculations/wage-defaults.ts, src/app/wage-rules/wage-rules-client.tsx
- Validation: browser — 9 rules listed incl. the 3 new; PF capped at ₹1,800 for high basic; ESI=Nil over ₹21k then ₹174 after threshold raised to ₹40k; LWF ₹10 from rule; save persists + simulator updates; 0 page errors; tsc clean; 148 tests pass.

### Task Update — 2026-06-10 — HTML print views aligned to forms-template (in progress)
- Task: Browser Print/Save-as-PDF output must match the statutory template column layout (all forms)
- Status: in progress — 7 of 12 forms rebuilt to match templates
- Scope:
  - Rebuilt to exact template column layout (template header block: Form No + rule + title + establishment/address + manager + reg cert + period; template column headers in order; (1)…(n) numbering row; lists ALL employees; "Nil" for empty cells):
    * Fines (Form I) — 12 cols  · Deductions (Form II) — 12 cols
    * Employees (Form XI) — 9 cols (Name, Age&Sex, Father, Nature of Employment, Permanent Address, Date of Commencement/termination, Signature)
    * Wages (Form XII) — 17 cols with grouped headers (Total Earnings → Min Wages/DA/Total Normal; Deductions → Amount/Kind)
    * Muster (Form V) — Name/Father/Sex/Nature + daily attendance grid + Days Worked/Leave/Absent/Counted/Remarks
    * Shop Wages (Form W) — 14 cols (Name, EmpID, Days, Basic, DA, HRA, Other, OT, Leave, Gross, PF, ESI, LWF)
    * Shop Leave (Form X) — grouped Earned Leaves (opening/earned/availed/balance) + Medical/Other + Remarks
  - Data: added fatherSpouseName + sex to WagesRow and MusterRow (via getFatherNames) so registers can show them.
- Files changed: src/lib/export/form-data.ts, src/app/print/[cycleId]/[formCode]/{hospital-form-i,ii,xi,xii,v,shop-form-w,shop-form-x}.tsx (note: i/ii rebuilt earlier)
- Validation: browser render of XI/XII/V/I → 0 page errors, all list 6 employees with template columns + (n) numbering; tsc clean; 148 tests pass.
- Note: DOCX exports already match templates exactly (they use the .docx files); this work is only the on-screen Print/PDF (HTML) views.

### Task Update — 2026-06-10 — HTML print views aligned to forms-template (ALL 12 done)
- Task: Finish the remaining 5 print forms
- Status: completed — all 12 HTML print forms now mirror the statutory templates
- Scope (remaining 5 rebuilt this pass):
  * Overtime (Form IV): Name/Father/Sex/Designation + daily OT grid + Total OT/Normal Rate/OT Rate/Normal Earnings/OT Earnings/Total.
  * Wage Slips (Form XVII + Form T): shared WageSlipForm — vertical numbered template layout (1. Establishment … 6. Wage period From/To … 7. Wage Earned (a–g) | Deductions (i–v) | Net Amount Paid; signatures), 2-up.
  * Employee Register (Form U): vertical per-employee 23-field card (Name…Remarks), Nil for empties, 2-up.
  * Employment (Form V shop): work-begin/rest/work-end + daily attendance grid + Days Worked/Absent/Leave/Remarks.
  - Data: added fatherSpouseName+sex to OvertimeRow; dateOfEntry to WagesRow (for the slip).
- Files changed: src/lib/export/form-data.ts, src/app/print/[cycleId]/[formCode]/{hospital-form-iv,hospital-form-xvii,shop-form-t,shop-form-u,shop-form-v,wage-slip-form}.tsx
- Validation: production build ✓ compiled; browser render of all 12 forms → 0 page errors; slip + U vertical layouts confirmed via screenshot; tsc clean; 148 tests pass.

### Task Update — 2026-06-10 — Print header alignment + cycle-year guard
- Task: Fix print form header alignment + reject implausible cycle years
- Status: completed
- Scope:
  - Print form headers: title/rule/period stay centred; establishment + manager/reg-cert lines left-aligned (single CSS rule `.form-header p:nth-last-of-type(-n+2)`), matching the statutory template. Applies to all forms.
  - Cycle year validation capped at currentYear+1 (was 2100, letting 2099 typos through); dynamic error message. Corrected the stray 2099 local cycle to 2026. +2 tests.
- Files: src/app/print/layout.tsx, src/domain/validations/cycle.ts, tests/domain/cycle.test.ts
- Validation: browser header alignment [center,center,left,left]; 150 tests pass; commits 6442f9a, 63ec844.

### Task Update — 2026-06-10 — Tech Sakthi theme + navigation bar
- Task: Apply Tech Sakthi theme + add Home/Back/Forward navigation
- Status: completed
- Scope: Tech Sakthi palette (navy #071426 bg, gold #D4A31E accent, Poppins/Inter fonts) on the app shell — globals.css variables, sidebar (gold brand + active item), page header (gold action button). New TopNav bar (Home → dashboard, Back/Forward via router history), sticky at top of content.
- Files: src/app/globals.css, src/app/layout.tsx, src/components/{sidebar,page-header,top-nav}.tsx
- Validation: body bg rgb(7,20,38); Home/Back/Forward work; all pages render 0 errors; 150 tests pass; commit 12cac8d.

### Task Update — 2026-06-10 — Muster "Days Worked" fix
- Task: Muster Days Worked wrongly counted holidays as worked
- Status: completed
- Scope: getMusterData.totalPresent counted P+OT+H (so a 30-day month with 4 Sundays showed 30 worked instead of 26). Now Days Worked = P+OT; holidays/leave counted separately; Days counted for wages = worked + paid holidays + paid leave. Added leaveDays/holidayDays/wageDays to MusterRow (HTML + DOCX). Fixed Forms V (muster) and shop V (employment).
- Files: src/lib/export/form-data.ts, src/app/print/[cycleId]/[formCode]/{hospital-form-v,shop-form-v}.tsx
- Validation: browser muster shows Worked 26 / Counted 30 for 26P+4H; tsc clean; 150 tests; commit 3659cac.

### Task Update — 2026-06-10 — Dashboard establishment listing (4 layouts) + new fields
- Task: Dashboard option to list establishments in multiple layouts
- Status: completed
- Scope:
  - New Establishment fields: contactPhone, contactEmail, processingFee, serviceStartDate (migration) + inputs in establishment form ("Contact & Billing") + API persist.
  - Dashboard "Establishments" section with a localStorage-persisted view switcher: Cards (rich), Table (detailed/all fields), Expandable rows (master-detail), Directory (split list + profile). All show name/type/address/employees/owner/POC/contact/fee/start date/DA.
- Files: prisma/schema.prisma (+migration establishment_contact_fee_startdate), src/app/api/establishments/{route,[id]/route}.ts, src/components/establishment-form.tsx, src/app/dashboard/{page,dashboard-establishments}.tsx
- Validation: all 4 views render + switcher persists across reload; build ✓; 0 page errors; 150 tests pass; commit 598c3e0.

### Task Update — 2026-06-10 — Remove Wage Rules page
- Task: Wage Rules page no longer needed
- Status: completed
- Scope: removed /wage-rules page + /api/wage-rules route + sidebar link. Wage calculation unaffected (getWageRuleValue/WAGE_RULE_DEFAULTS + WageRule data still used by cycle wage computation).
- Files: deleted src/app/wage-rules/*, src/app/api/wage-rules/route.ts; src/components/sidebar.tsx
- Validation: /wage-rules → 404, not in sidebar, dashboard loads, 0 page errors; build ✓; 150 tests pass; commit b5116c1.

### Project metrics — 2026-06-10
- Tests: 150 passing (13 files) · tsc clean · production build compiles
- App branded "Mustearly" (by Tech Sakthi), Tech Sakthi navy/gold theme
- All 11 original feedback items complete; all 12 statutory forms match templates (HTML print + DOCX); dashboard 4-layout establishment listing; Home/Back/Forward nav

### Task Update — 2026-06-11 — Autonomous E2E QA harness
- Task: Full autonomous E2E UI test (plan → crawl → log → deterministic spec)
- Status: completed
- Scope: QA_plan.md (12-area checklist incl. math + print), QA_results.md (36/36 checks, 0 console/page errors, 0 broken links across 71 links), QA_404_report.md (all 404s intentional). New e2e/qa-e2e.spec.ts (UI-derived IDs, console-error guard). Removed obsolete e2e/10-wage-rules.spec.ts.
- Files: labour-record-app/{QA_plan.md,QA_results.md,QA_404_report.md,e2e/qa-e2e.spec.ts}
- Validation: qa-e2e 12/12; 21/21 live math + 80/80 unit math verified; 0 broken links
- Next step: branded error states + template fixes

### Task Update — 2026-06-11 — Branded 404 + error boundary
- Task: Graceful error states
- Status: completed
- Scope: src/app/not-found.tsx (branded 404 + Go-to-Dashboard) and error.tsx (recoverable boundary + Try again). 404 still returns HTTP 404. Verified in browser for unknown route, removed /wage-rules, bad IDs, and a forced render error.
- Files: src/app/{not-found,error}.tsx
- Validation: browser-verified all 404 cases + error boundary; 150 tests; build ✓
- Next step: open year range

### Task Update — 2026-06-11 — Year range to 9999 + e2e suite refresh
- Task: Allow cycle/holiday years up to 9999; align stale specs to current app
- Status: completed
- Scope: year validation 2000–9999 (cycle.ts server, cycle-form.tsx client max=9999, holidays-client.tsx). Refreshed stale e2e specs (01 Wage Rules removed + gold highlight; 04 June 2099 valid + de-flaked + afterAll cleanup; 07 rebuilt form titles; 99 dropped /wage-rules). 
- Files: src/domain/validations/cycle.ts, src/components/cycle-form.tsx, src/app/holidays/holidays-client.tsx, tests/domain/cycle.test.ts, e2e/{01,04,07,99}*.spec.ts
- Validation: full e2e 15-fail → 95 pass/1 skip/0 fail; 150 unit; browser-verified 9999 accepted, 1999 rejected
- Next step: print template fidelity

### Task Update — 2026-06-11 — Print fidelity: year, bold, wage slip, browser header
- Task: Fix print docs (stale June 2099, bold subtitle, wage slip layout, browser header/footer)
- Status: completed
- Scope:
  - June 2099 was a stray e2e-created cycle; deleted + afterAll cleanup so it stops polluting print views (DNV now June 2026).
  - Bolded the "Register of … for the Month of <period>" subtitle across all register forms (per template).
  - Wage slip (XVII/T) rebuilt to template: LANDSCAPE, left [Original] | right [Duplicate/Photocopy], **2 employees per page** to save paper (6 emp → 3 pages, verified via PDF).
  - Suppressed browser print header/footer (title/date/URL/page#) via @page margin:0 + 8mm content padding, across forms/wage-slip/salary-slips.
  - Verified DB values == printed values (Basic/DA/Gross/Net) and correct year.
- Files: src/app/print/[cycleId]/[formCode]/{wage-slip-form,page,hospital-form-i/ii/iv/v/xii,shop-form-v/w/x}.tsx, src/app/cycles/[id]/salary-slips/[employeeId]/page.tsx, e2e/qa-e2e.spec.ts
- Validation: full e2e 97 pass/1 skip/0 fail; 150 unit; tsc clean; build ✓; browser+PDF verified (no header/footer, June 2026, bold, 2-up wage slip)
- Next step: user-directed

### Project metrics — 2026-06-11
- Unit tests: 150 passing · E2E (Playwright): 97 passing, 1 skipped, 0 failed
- Print: browser header/footer suppressed; statutory layout; wage slip 2 employees/landscape page; all 12 forms match templates
- Validation/UX: cycle+holiday years 2000–9999; branded 404 + error boundary
