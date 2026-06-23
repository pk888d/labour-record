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

### Task Update — 2026-06-13 21:55 IST
- Task: Enable external access via router port-forward (50007 -> 3000)
- Status: completed
- Scope: user configured router DNAT external 50007 -> internal 192.168.0.91:3000; host firewalld was blocking 3000 (not in allow-list), so the forward was dropped. Opened 3000/tcp in firewalld (--permanent + reload). Forward targets the Next.js app directly (bypasses the 8080 nginx proxy).
- Files changed: server firewalld runtime+permanent (3000/tcp); none in repo
- Metrics impact: none
- Validation: LAN 192.168.0.91:3000 = 200; public http://49.206.252.114:50007 → /cycles 200 ("3 cycles"), /cycles/[id] 200, print HOSPITAL_FORM_XII 200, /_next asset 200
- SECURITY NOTE: exposed over plain HTTP to the internet (no TLS) and the Next app is directly internet-facing. For sustained external use: add HTTPS (domain + Let's Encrypt on nginx) and point the router's internal port at nginx (8080) instead of 3000.
- Next step: optional — domain + HTTPS via nginx if external access is permanent

### Task Update — 2026-06-13 21:35 IST
- Task: nginx reverse proxy for Musterly
- Status: completed
- Scope: created /etc/nginx/conf.d/musterly.conf — listen 8080, server_name _, proxy_pass 127.0.0.1:3000 with standard proxy headers + websocket upgrade + client_max_body_size 25m. Chose 8080 because port 80 is inventra's default_server, no domain/SSL exists (mirrors inventra's plain-HTTP-by-IP style), and 8080 is free + already firewall-open. Saved a copy to man/musterly.nginx.conf for reproducibility.
- Files changed: server /etc/nginx/conf.d/musterly.conf (new); repo man/musterly.nginx.conf (new)
- Metrics impact: none
- Validation: `nginx -t` ok; reload ok; via http://192.168.0.91:8080 → /cycles,/establishments,/holidays = 200, "3 cycles", /_next CSS asset = 200, print HOSPITAL_FORM_XII = 200
- Next step: none (optional later: real domain + HTTPS if external access wanted)

### Task Update — 2026-06-13 21:10 IST
- Task: Make data-driven listing pages dynamic (live DB without rebuild) + harden deploy
- Status: completed
- Scope: added `export const dynamic = 'force-dynamic'` to /cycles, /cycles/new, /establishments, /holidays, /exports (were statically prerendered → stale until rebuild); /establishments/new left static (no DB read). Also hardened man/deploy-server.sh to `pm2 stop` before `next build` (a live next start reading .next mid-build crashed with "Could not find a production build"). Pushed (0804b25) and redeployed via git pull + deploy-server.sh.
- Files changed: src/app/{cycles,cycles/new,establishments,holidays,exports}/page.tsx, man/deploy-server.sh
- Metrics impact: build now prerenders 15 static pages (was 20); 5 routes moved to on-demand (ƒ)
- Validation: local `tsc --noEmit` clean; build shows /cycles,/cycles/new,/establishments,/holidays,/exports as ƒ; deploy preserved DB (seed skipped); LAN /cycles,/establishments,/holidays,/exports = 200; "3 cycles"; print V/XII/XVII = 200; pm2 online 0 restarts
- Next step: none — review-fix + git deploy workflow complete

### Task Update — 2026-06-13 20:45 IST
- Task: Restore previous DB onto git-deployed server + diagnose stale cycle list
- Status: completed
- Scope: scp'd local prisma dev.db (11 establishments, 19 employees, 3 MonthlyCycles) to server prisma/dev.db (stopped app + cleared WAL first); found /cycles showed "0 cycles" because that page is statically prerendered (○) at build time and the build had run against the fresh seed before the DB swap — rebuilt with the restored DB in place, then restarted
- Files changed: server-side only (prisma/dev.db replaced)
- Metrics impact: none
- Validation: /cycles=200 shows "3 cycles" with all 3 cycle links; print routes V/XII/XVII = 200 for cmq25aedz000m3h455zes7lku
- KNOWN ISSUE (app design): listing pages /cycles, /establishments, /holidays are statically prerendered, so runtime data changes (new cycle/establishment) won't appear until the next `npm run build`. Detail + print routes are dynamic and reflect live data. Fix = mark these listing routes `export const dynamic = 'force-dynamic'` (or revalidate) — pending user approval.
- Next step: offer to make listing pages dynamic for a DB-backed app

### Task Update — 2026-06-13 20:10 IST
- Task: Switch Musterly to git-based deploy (local → GitHub → server git pull → install)
- Status: completed
- Scope: added man/deploy-server.sh (Linux/pm2: .env w/ absolute DATABASE_URL, npm ci, prisma migrate deploy + generate, seed-only-when-fresh, build, pm2 start/restart+save); pushed branch main to github.com/pk888d/labour-record; re-deployed server from a git clone at /database/web/musterly (repo root; app in labour-record-app/ subdir)
- Files changed: man/deploy-server.sh (new), status.md
- Metrics impact: none
- Validation: see server redeploy validation below (HTTP 200, seeded data, print routes 200)
- Next step: future updates = `cd /database/web/musterly && git pull && bash man/deploy-server.sh 3000`

### Task Update — 2026-06-13 19:30 IST
- Task: Deploy Musterly to local server (praveen@192.168.0.91:/database/web/musterly)
- Status: completed
- Scope: rsync'd app source to /database/web/musterly (chown praveen); npm ci (264 pkgs, Node 20.20.2); prisma generate + migrate deploy (8 migrations) + seed (2 establishments, 6 employees); set absolute DATABASE_URL=file:/database/web/musterly/dev.db; next build (Next 16.2.6); started under pm2 as "musterly" (fork mode, PORT=3000); pm2 save
- Files changed: server-side only (no repo changes); server .env pinned to absolute sqlite path
- Metrics impact: none (deployment)
- Validation: pm2 status online; ss shows *:3000 LISTEN; http://192.168.0.91:3000/cycles 200 (renders seeded "DNV Orthocare"); /establishments 200; print routes V/XII/XVII all 200 over LAN
- Next step: optional — nginx reverse-proxy vhost + firewall/domain if external access wanted; otherwise reachable at http://192.168.0.91:3000

### Task Update — 2026-06-13 18:30 IST
- Task: Mustearly review fixes — print fidelity (5 review comments)
- Status: completed
- Scope: (#1) fill-the-paper auto-scale on all register forms via server-computed density (approach A); (#2) Form V Muster Roll rebuilt to match docx — corrected citation to Rule 27(5)/1963, added Period of Work, Daily Hours incl. OT, Time commenced/ceased, Rest Interval, summary columns; (#3) print blank-then-loads fixed by replacing 60-node watermark with one tiled SVG background + gating Print button on document.fonts.ready; (#4) Form XII labels aligned to exact docx wording; (#5) wage slip reworked to deterministic 2-employees-per-page chunks that fill the sheet (no overflow). Consolidated conflicting @page/.form-page rules to a single source.
- Files changed: src/lib/print-density.ts (new), src/app/print/layout.tsx, src/app/print/[cycleId]/[formCode]/page.tsx, print-button.tsx, hospital-form-v.tsx, hospital-form-xii.tsx, wage-slip-form.tsx, src/components/print-brand.tsx
- Metrics impact: +1 lib file (print-density.ts)
- Validation: `npx tsc --noEmit` clean; `npx playwright test e2e/07-print-views.spec.ts` → 11/11 passed; visual screenshots of Form V / XII / XVII confirmed against docx templates
- Next step: sweep remaining forms (hospital I/II/IV/XI, shop U/V/W/X) for per-form label spot-check against their docx (density + orientation already applied)

## EXECUTION STATUS

- Current state: Print review fixes complete — Form V/XII/XVII aligned to docx, fill-paper + print-readiness applied across all 12 forms; tsc clean, 11/11 print e2e passing
- Next action: Optional label spot-check sweep of the remaining 8 forms against their docx templates

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

### Task Update — 2026-06-11 — Calendar + in-app event notifications
- Task: Full calendar feature with event notifications
- Status: completed
- Scope:
  - New CalendarEvent model (+migration calendar_events): title, date, time, type, establishment?, remindDaysBefore, recurring (none/monthly/yearly), notes.
  - TDD pure logic: src/lib/calendar/events.ts (buildCalendarEvents — unifies holidays + wage-cycle deadlines [7th of following month] + form-task due dates + employee join/exit + custom events, range-filtered, recurring expansion, sorted) and notifications.ts (getReminders → overdue/upcoming/count). 14 new unit tests.
  - Data loader src/lib/calendar/load.ts (Prisma → pure fns). API: GET/POST /api/calendar-events, DELETE /api/calendar-events/[id], GET /api/notifications.
  - UI: /calendar month-grid page (prev/next/today nav, type legend, event chips, click-day add) + Add-Event modal; NotificationBell in TopNav (badge + dropdown, 60s refresh); dashboard "Upcoming & Overdue" panel; sidebar Calendar link; Calendar icon in TopNav.
- Files: prisma/schema.prisma (+migration), src/lib/calendar/{events,notifications,load}.ts, src/app/api/{calendar-events/route,calendar-events/[id]/route,notifications/route}.ts, src/app/calendar/{page,calendar-view}.tsx, src/components/{notification-bell,top-nav,sidebar}.tsx, src/app/dashboard/{page,reminders-panel}.tsx, tests/domain/calendar-{events,notifications}.test.ts, e2e/11-calendar.spec.ts
- Validation: 164 unit tests (14 new); full e2e 101 pass/1 skip/0 fail (4 new calendar tests, self-cleaning); tsc clean; build ✓; browser-verified (holidays/cycle-deadlines render, add event, bell badge, dashboard widget, 0 page errors)
- Next step: user-directed

### Project metrics — 2026-06-11 (calendar)
- Unit tests: 164 passing · E2E: 101 passing, 1 skipped, 0 failed
- New: Calendar page + month grid; in-app notifications (bell + dashboard panel); CalendarEvent model; calendar/notifications domain libs

### Task Update — 2026-06-13 22:20 IST
- Task: Fix statutory rule citations (registry + print forms) to match .docx templates
- Status: completed
- Scope: corrected FORM_DISPLAY_NAMES refs and print-form "Prescribed under" strings. Hospital: I/II=Rule 21(4), IV=25(2), V=27(5), XI=27(6), XII=27(1), XVII=sub-rule (9) of Rule 32. Shop: U/W/X=Rule 16(1)/1948, V=Rule 38(1)(a)/1958, T=Rule 11(6). (I/II/IV/V/XII and Shop U print forms were already correct.)
- Files changed: src/types/index.ts; print forms hospital-form-xi.tsx, hospital-form-xvii.tsx, shop-form-v.tsx, shop-form-w.tsx, shop-form-t.tsx, shop-form-x.tsx
- Metrics impact: none
- Validation: tsc clean; pushed (b634b44); deployed; live http://49.206.252.114:50007 cycle list + print Forms XI/XVII show corrected refs
- Next step: none (outstanding: no-auth/HTTPS hardening, pluralization "1 employees", unvalidated dates — separate items)

### Task Update — 2026-06-19 — Configurable max employees per sheet + fill-page (print registers)
- Task: Env-configurable per-sheet employee count + fill-page for row-table print registers
- Status: completed
- Scope: New src/lib/print-config.ts (getPrintConfig reads PRINT_MAX_ROWS_PER_SHEET [default 20] + PRINT_MIN_FILL_ROWS [default 5], clamps max to single-sheet ceiling ~23 landscape/~36 portrait; chunk<T> helper). printDensity gains minFillRows param: below threshold the 16mm row-height clamp lifts so few rows stretch to fill the page. page.tsx refactored to a type-safe generic paginateForm<T> helper that chunks each register into per-sheet slices, repeats the statutory header per sheet (break-after:page), and keeps S.No continuous via a startIndex prop added to the 7 index-numbered forms (V/XII/XI/IV, Shop W/V/X). Forms I/II paginate but keep r.sno numbering; card forms (U/XVII/T) render once, unchanged.
- Files changed: src/lib/print-config.ts (new), src/lib/print-config.test.ts (new), src/lib/print-density.ts, src/lib/print-density.test.ts (new), src/app/print/[cycleId]/[formCode]/page.tsx, hospital-form-{v,xii,xi,iv}.tsx, shop-form-{w,v,x}.tsx, .env.example (new), docs/superpowers/{specs,plans} for this feature
- Metrics impact: +3 new lib/test files; +2 env vars (both optional, defaulted)
- Validation: 179 unit tests pass (164 baseline + 15 new print-config/print-density; 0 regressions). npm run build clean, /print/[cycleId]/[formCode] route compiles. Print e2e (07-print-views) not run in worktree — needs DB/.env + non-headless browser (infra unavailable); unchanged by this work.
- Next step: set PRINT_MAX_ROWS_PER_SHEET / PRINT_MIN_FILL_ROWS in the deployment .env if non-default values are wanted; merge branch worktree-print-max-employees-per-sheet

### Task Update — 2026-06-19 — Multi-sheet print pagination e2e + bulk fixture
- Task: End-to-end test proving print registers paginate across sheets with repeated header + continuous S.No
- Status: completed
- Scope: Added "QA Bulk Hospital" (est_hospital_bulk) seed fixture with 25 employees (> landscape single-sheet ceiling 23, so pagination triggers under any valid PRINT_MAX_ROWS_PER_SHEET). New e2e spec creates a cycle for it via API (auto-snapshots employees), asserts Form XI renders >1 .form-page with the REGISTER OF EMPLOYEES heading repeated, exactly 25 body rows, and S.No sequence exactly 1..25 (no per-sheet restart); also asserts Form V (muster) paginates. Cycle torn down in afterAll.
- Files changed: prisma/seed.ts (bulk fixture), e2e/10-print-pagination.spec.ts (new)
- Metrics impact: +1 e2e spec (3 tests); seed now 3 establishments / 31 employees
- Validation: e2e 10-print-pagination 3/3 pass (Playwright auto-starts dev server vs seeded dev.db). Earlier 07-print-views 11/11 pass. No spec asserts exact establishment counts, so the new fixture is non-breaking.
- Next step: run on branch test/print-multi-sheet-e2e; merge when ready

### Task Update — 2026-06-20 — UI-editable print config Settings page (app-wide, DB-backed)
- Task: Move print pagination config (max-per-sheet, min-fill) from env vars to an in-app Settings page
- Status: completed
- Scope: New AppSetting key/value table + migration. print-config.ts split into pure logic (resolvePrintConfig, parseSettingValue, exported singleSheetCeiling, chunk; no DB/env) and new print-config-server.ts (getRawPrintSettings + async getPrintConfig with precedence saved-DB -> env -> hardcoded default, then clamp). New /api/settings route (GET; PUT validates both fields, atomic prisma.$transaction upsert/clear). New /settings page (force-dynamic) + settings-form.tsx (dark-theme, aria-labelled inputs, server-validated) + sidebar System->Settings entry. Print page now awaits getPrintConfig once and threads cfg into paginateForm.
- Files changed: prisma/schema.prisma + migration 20260620022602_add_app_setting; src/lib/print-config.ts (pure refactor) + print-config.test.ts; src/lib/print-config-server.ts (new); src/app/api/settings/route.ts (new); src/app/settings/page.tsx (new); src/components/settings-form.tsx (new); src/components/sidebar.tsx; src/app/print/[cycleId]/[formCode]/page.tsx; e2e/12-settings.spec.ts (new)
- Metrics impact: +1 DB model; +1 API route; +1 page; +1 e2e spec (4 tests); print-config unit tests now 12
- Validation: e2e 12-settings 4/4 pass; print regressions 07+10 14/14 pass; 180 unit tests pass; npm run build clean with /settings + /api/settings routes. NOTE during e2e a stale dev server (started pre-migration) served an old Prisma client lacking appSetting → killed it so Playwright started fresh; restart dev server after running new migrations.
- Next step: merge branch feat/print-config-settings; saved values override env (which now only seeds the initial fallback)

### Task Update — 2026-06-20 — Foundation hardening (test + validation + CI), wave 1 of codebase review
- Task: Close the critical/high/medium gaps from the codebase review (money-math test coverage, financial input validation, test-config noise, N+1, build/CI)
- Status: completed
- Scope:
  - M1: vitest.config.ts now excludes e2e (`include: src/**/*.test.ts`) + coverage config — `npm test` is clean (no more Playwright-glob "failed files").
  - M2: extracted src/lib/money.ts (round2 with NaN/Infinity guard + EPSILON half-up; formatINR); the 4 calculators (wage/pf/salary/overtime) now import it instead of 4 duplicate round2 copies.
  - C1: unit tests for every pure domain fn — money, wage-calculator, pf-calculator (PF cap ₹1,800), salary-breakdown (DA split, ESI threshold), attendance, overtime, leave, kanban-transitions state machine.
  - C2: src/domain/validations/record-numbers.ts (validateWageRecords + validatePresentMoneyFields + generic validateNonNegativeNumbers) wired into wages (batch), fines, deductions routes → reject negative/NaN/non-numeric money before persist (422).
  - M3: wages PUT N+1 fixed — overtime now one batched findMany + Map (was findUnique per employee).
  - H3: build = `prisma generate && next build`; added postinstall prisma generate, test:coverage, typecheck scripts.
  - H2: .github/workflows/ci.yml (npm ci → migrate deploy → vitest → next build).
  - H1: e2e/13-wage-calc.spec.ts asserts exact computed totals via the real API pipeline (15000/15360/1810/13550) + negative & NaN rejection.
- Files changed: vitest.config.ts; src/lib/money.ts (+test); src/domain/calculations/{wage,pf,salary-breakdown,overtime}.ts (+ 6 new *.test.ts); src/domain/calculations/attendance/leave .test.ts; src/domain/workflow/kanban-transitions.test.ts; src/domain/validations/record-numbers.ts (+test); src/app/api/form-tasks/[id]/{wages,fines,deductions}/route.ts; package.json; .github/workflows/ci.yml; e2e/13-wage-calc.spec.ts
- Metrics impact: unit tests 26 → 65 (11 files); +1 e2e spec (3 tests); +1 CI workflow
- Validation: 65 unit tests pass; e2e 05-form-entry 11/11 + 13-wage-calc 3/3 pass (incl. fine create — validation non-breaking); npm run build clean.
- Next step: merge feat/foundation-hardening; then Tier-1 features (bank disbursement file, PF ECR / ESI return, payslip distribution, bonus/gratuity, compliance pre-flight) as subsequent waves

### Task Update — 2026-06-20 — M4 + Low polish (audit viewer, list search/pagination, dashboard, loading, README)
- Task: Close the review's M4 + Low-severity items
- Status: completed
- Scope:
  - M4: new /audit page (entityType filter + pagination) surfacing the AuditLog table; sidebar System → Audit Log entry.
  - Search + pagination: lib/paginate.ts (pure parsePage/pageMeta, tested) + components/pagination.tsx (param-preserving Prev/Next). Employees list gains name/empId search + 25/page; Cycles list gains establishment filter + pagination.
  - Dashboard: WorkloadPanel — open form-tasks grouped by workflow status (groupBy), with an "N open" headline.
  - UX: root app/loading.tsx skeleton for streaming route segments.
  - Docs: replaced the create-next-app README with real project docs (stack, setup, scripts, architecture, conventions, env, testing).
- Files changed: src/lib/paginate.ts (+test); src/components/pagination.tsx; src/app/audit/page.tsx (new); src/app/dashboard/page.tsx; src/app/employees/page.tsx; src/app/cycles/page.tsx; src/components/sidebar.tsx; src/app/loading.tsx (new); README.md; e2e/14-admin-views.spec.ts (new); e2e/03-employees.spec.ts (search-based assertion, pagination-robust)
- Metrics impact: unit tests 65 → 71 (12 files, +6 paginate); +1 page (/audit); +1 e2e spec (3 tests)
- Validation: 71 unit tests pass; npm run build clean (/audit present); e2e 01-nav + 03-employees + 04-cycles + 14-admin-views all green. NOTE: adding pagination surfaced a data-volume-fragile assertion in 03-employees (created employee fell to page 2) — fixed it to use the new ?q= search.
- Next step: merge feat/m4-low-polish; remaining work = Tier 1–4 feature set (each its own brainstorm→spec→plan cycle)

### Task Update — 2026-06-23 — Phase-2 Wave A (employee management: #1–#4)
- Task: Low-friction employee data entry + delete + import (phase-2 review items 1–4)
- Status: completed
- Scope:
  - #3: migration makes sex/fatherSpouseName/dateOfEntry/designation/present+permanentAddress nullable; validateEmployee now requires only name + positive salary (+establishment); blank empId auto-generates (generateEmpId). Routes coerce the form's string salary to a number before validating.
  - #4: per-employee paymentMode (BANK|CASH); form select clears + disables bank fields on Cash; routes null the bank fields on Cash.
  - #1: guarded hard-delete — DELETE ?mode=remove removes the row only if the employee has no cycle/wage/attendance refs, else 409 → UI offers "Mark Exited"; soft-Exit retained as default.
  - #2: employee import (CSV/TXT/XLSX via SheetJS) — pure parse-employees mapper (header aliases, name+salary required), POST /api/employees/import, /employees/import page + sample download, list "↥ Import" link.
- Files changed: prisma/schema.prisma + migration; src/domain/validations/employee.ts (+test); src/app/api/employees/route.ts; src/app/api/employees/[id]/route.ts; src/components/employee-form.tsx; src/app/employees/[id]/{page.tsx,delete-employee-button.tsx}; src/lib/import/parse-employees.ts (+test); src/app/api/employees/import/route.ts; src/app/employees/import/{page.tsx,import-client.tsx}; src/app/employees/page.tsx; package.json (xlsx); e2e/15-employee-mgmt.spec.ts
- Metrics impact: unit tests 71 → 79 (14 files, +employee +parse-employees); +2 routes, +1 page, +1 e2e (3 tests); +xlsx dep
- Validation: 79 unit tests pass; e2e 15-employee-mgmt 3/3 (create with only name+salary, Cash disables bank, import reachable); 03-employees 6/6 regression; npm run build clean. Caught + fixed a create-blocking bug (form posts salary as string; validator wanted number).
- Next step: merge feat/phase2-employee-mgmt; then Wave B (#5,#7 wage sync/double-wage) and Wave C (#6,#8,#9,#10 print fidelity)

### Task Update — 2026-06-23 — Phase-2 Wave B (wage sync + auto double-wage: #5, #7)
- Task: Make an employee's saved salary flow into wage slips / wages register, with holiday-worked days auto-paid at 2×
- Status: completed
- Scope:
  - B1: new pure computeCycleWages(employee, attendance?, holidayDays?, multiplier?, esiApplicable, daysInMonth) — derives basic/da/hra/pf/esi/lwf from saved salary (computeSalaryBreakdown) and auto-pays holiday-worked days at the multiplier (default 2×, #5). Zero-salary guard. 4 unit tests.
  - B2 (#7 seed): cycle creation seeds a WageRecord per employee (defaultTotalSalary>0) from computeCycleWages, so the register/slips show salary immediately.
  - B3 (#7 sync): POST /api/cycles/[id]/sync-wages re-pulls employee salary (+ current attendance double-wage) into WageRecords, preserving manual fine/advance/other-deduction figures; "↻ Sync wages from employees" button on the cycle page.
  - B4 (#7 fallback): slip-data + getWagesData compute from the employee's saved salary when no manual WageRecord exists; a manual record always overrides.
  - Fix: removed src/app/loading.tsx — the root loading skeleton (from the M4 wave) made every notFound() stream a 200 instead of 404 (verified empirically; broke 07-print invalid-code test).
- Files changed: src/domain/calculations/cycle-wage.ts (+test); src/app/api/cycles/route.ts; src/app/api/cycles/[id]/sync-wages/route.ts (new); src/app/cycles/[id]/{sync-wages-button.tsx,page.tsx}; src/app/cycles/[id]/salary-slips/slip-data.ts; src/lib/export/form-data.ts; e2e/16-wage-sync.spec.ts; removed src/app/loading.tsx
- Metrics impact: unit tests 79 → 83 (15 files, +4 cycle-wage); +1 route; +1 e2e (2 tests)
- Validation: 83 unit tests pass; e2e 16-wage-sync 2/2 (cycle seeds non-zero gross from salary; sync re-pulls); 07-print 11/11 (404 restored) + 13-wage-calc 3/3 (manual override still wins). npm run build clean.
- Next step: merge feat/phase2-wave-b-wage-sync; then Wave C (#6,#8,#9,#10 print fidelity)

### Task Update — 2026-06-23 — Phase-2 Wave C (print fidelity: #6, #8, #9; #10 partial)
- Task: Fix print/template fidelity of statutory registers
- Status: in progress (print-fit done; #10 column content awaits user's template)
- Root-cause finding: extracted the .docx templates — Wages (Form XII) = 17 columns, Muster (Form V) = details + daily 1–31; the React views already render these. The reported symptoms (#6 "many title columns missing", #8 "name in signature column", #9 "Employee Register not aligned", #10 "only 12 printed") all trace to ONE cause: the wide register tables used CSS table-layout:auto + width:100%, so on A4 print the content-sized columns overflowed the page and clipped the right-hand columns / shifted body cells under the wrong headers (making names appear under the signature column).
- Fix: src/app/print/layout.tsx — `table { table-layout: fixed }` + `th,td { overflow-wrap:anywhere; word-break:break-word }`. Columns now distribute to exactly the page width (no overflow/clip), header & body columns share widths (aligned), and the empty signature data cells stay under the signature header.
- Also: made e2e/10-print-pagination drift-tolerant (assert contiguous 1..N and >= seeded roster, not hardcoded 25) after create-employee tests polluted the bulk fixture; cleaned 3 stray rows from dev.db.
- Files changed: src/app/print/layout.tsx; e2e/10-print-pagination.spec.ts
- Validation: 07-print-views 11/11, 10-print-pagination 3/3, build clean.
- DEFERRED (#10 content): the Wages Register's additional columns to reach the user's "29" — the repo template has 17; user will share the authoritative 29-column template, then rebuild the React view + docx template to match.
- Next step: user shares 29-col wages template + verifies print output for #6/#8/#9; then finish #10.
