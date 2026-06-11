# QA Plan — Mustearly (Labour Record Compliance App)

**Target:** http://localhost:3000
**Date:** 2026-06-10
**Method:** Autonomous Playwright (Chromium) crawl — happy paths + edge cases. Capture console errors, page errors, HTTP status, broken links, validation behaviour.

> Note: this app has **no authentication / login** (local single-user compliance tool). The "Authentication" item is therefore **N/A**; coverage is redistributed to Navigation, Forms/Validation, Data submission, and Error states.

## 1. Authentication
- [ ] N/A — no login/signup/session. Verify no auth wall blocks access.

## 2. Navigation
- [ ] Sidebar links resolve 200: Dashboard, Monthly Cycles, Establishments, Employees, Holidays, Exports
- [ ] Removed page `/wage-rules` returns 404 and is absent from sidebar
- [ ] TopNav: Home → /dashboard; Back / Forward use browser history
- [ ] Active sidebar item highlights on the current route
- [ ] Establishment name → /establishments/[id]/employees

## 3. Dashboard
- [ ] Summary cards (Registered Firms / Total Employees / Monthly Cycles) render numbers
- [ ] View switcher: Cards, Table, Expandable, Directory each render
- [ ] Switcher selection persists across reload (localStorage)
- [ ] Expandable row opens detail; Directory selects a firm + shows profile
- [ ] New establishment / View / Edit links navigate correctly

## 4. Establishments (CRUD + validation)
- [ ] List page renders with rows
- [ ] New form — happy path: create a valid establishment
- [ ] New form — edge: submit empty → required-field errors shown
- [ ] New form — edge: name < 3 chars / missing reg cert → errors
- [ ] Contact & Billing fields (phone, email, processing fee, start date) persist
- [ ] Edit existing → values prefilled → save
- [ ] Delete (soft) flow available

## 5. Employees (CRUD + validation + Salary Setup)
- [ ] List page renders
- [ ] New form — happy path
- [ ] New form — edge: empty submit → errors (name, empId, etc.)
- [ ] Invalid mobile (not 10 digits), invalid UAN (not 12), invalid IFSC → errors
- [ ] Salary Setup: total salary → Compute breakdown fills Basic/DA/PF/ESI
- [ ] PF mode switch (Percent/Fixed); ESI % + threshold; LWF live preview updates
- [ ] Edit existing employee → prefilled

## 6. Holidays
- [ ] List renders for selected year
- [ ] Add holiday — happy path
- [ ] Add — edge: empty date/name → error; name < 3 chars → error
- [ ] "Load default holidays" populates list; Double-Wage column present
- [ ] Delete a holiday

## 7. Monthly Cycles
- [ ] List renders
- [ ] New cycle — happy path
- [ ] New cycle — edge: implausible year (e.g. 2099) → rejected
- [ ] Generate Financial Year (Apr–Mar) control creates 12 cycles
- [ ] Open a cycle → detail (forms / kanban)

## 8. Forms / Form entry (Kanban + data submission)
- [ ] Home (Kanban board) renders form-task columns
- [ ] Open a form task → data entry (attendance, wages, fines, deductions, overtime, leave)
- [ ] Status transitions / save without crash

## 9. Statutory Print forms (12)
- [ ] All 12 render (HOSPITAL XI/V/XII/XVII/IV/I/II + SHOP U/V/W/T/X): 200, list employees
- [ ] Orientation toggle Landscape/Portrait changes layout
- [ ] Watermark present; header alignment (title centred, establishment left)

## 10. Salary slips
- [ ] Slips list for a cycle renders
- [ ] Individual slip: Original + Photocopy on one landscape sheet

## 11. Exports
- [ ] Exports page renders
- [ ] DOCX export of a form task returns 201 (PDF step may warn if LibreOffice absent)

## 12. Error states
- [ ] 404 for unknown route + deleted `/wage-rules`
- [ ] 404 / not-found for invalid establishment / cycle / employee IDs
- [ ] Empty / invalid form submissions surface inline errors (no crash)
- [ ] No uncaught console/page errors on any page (excluding browser-extension noise)

## 13. Mathematical calculations (verify with evidence — input → expected → actual)
- [ ] DA per firm type: Shop 7353 / Hospital 5544 / Hotel 8466 / Petrol Bunk 7247 / Medical 7970 / Oil Mill 8950
- [ ] PF PERCENT: 12% of (Basic+DA) capped at wage ceiling → ₹1,800 cap; below cap exact %
- [ ] PF FIXED = entered amount; PF NONE = 0
- [ ] ESI = ESI% of gross when gross ≤ threshold, else 0; custom %/threshold honoured
- [ ] Salary breakdown: Basic = Total − DA − HRA − Other (floor 0); Net = Gross − (PF+ESI+LWF)
- [ ] Attendance totals: worked = P+OT; wageDays = worked+leave; H not worked
- [ ] Muster Days Worked = P+OT (excludes H); Days counted = worked + holidays + leave
- [ ] Wage register (Form XII): Total Normal = Basic+DA; Amount Deducted = Σ deductions; Net = Gross − Deductions
- [ ] Round-robin weekly-off rotation correctness
