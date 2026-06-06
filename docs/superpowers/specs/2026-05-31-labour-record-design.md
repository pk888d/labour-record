# Labour Record Maintenance System — Design Spec
_Date: 2026-05-31_

## 1. Problem

Statutory labour compliance records for Tamil Nadu establishments (hospitals and shops) are currently maintained as Word documents. Every month the same data is re-entered across multiple forms, calculations are manual, and there is no audit trail. The goal is a structured web application that stores all data once, auto-calculates wages, manages the monthly compliance workflow via a Kanban board, and generates print-ready outputs matching the original statutory form templates.

---

## 2. Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Deployment | Local machine first, cloud later | Zero external dependencies for initial use |
| Stack | Next.js 15 + TypeScript + Prisma + SQLite | Single process, one command to start, Prisma makes PostgreSQL switch a one-liner |
| Database | SQLite → PostgreSQL (cloud) | No database server needed locally |
| Auth | None in MVP | Single user on local machine; add NextAuth for cloud |
| Export | DOCX + PDF + browser print | All three outputs required |
| PDF conversion | LibreOffice headless | `soffice --headless --convert-to pdf` |
| DOCX templating | docxtemplater + pizzip | Preserves complex merged-cell table structure |
| Wage formulas | Named presets + configurable components | Covers TN statutory cases; no code change for component overrides |

---

## 3. Establishment Types and Forms

### Hospital — Tamil Nadu Minimum Wages Rules 1963

| Form | Description | Statutory Reference |
|---|---|---|
| Form XI | Register of Employees | Rule 25 |
| Form V | Register of Muster Roll | Rule 26 |
| Form XII | Register of Wages | Rule 27(1) |
| Form XVII | Wage Slip | Rule 27(3) |
| Form IV | Overtime Muster Roll cum Wages | Rule 28 |
| Form I | Register of Fines | Rule 72(1) |
| Form II | Register of Deductions for Damages or Loss | Rule 72(2) |

### Shop — Tamil Nadu Shops and Establishments Rules 1948

| Form | Description | Statutory Reference |
|---|---|---|
| Form U | Employee Register | Rule 16 |
| Form V | Register of Employment | Rule 17 |
| Form W | Register of Wages | Rule 18 |
| Form T | Wage Slip | Rule 19 |
| Form X | Register of Leave and Social Security Benefits | Rule 20 |

---

## 4. Architecture

```
Browser (Next.js App Router)
  └── React UI — Kanban board, data-entry grids, print views
         │
         ▼
Next.js API Routes (same process)
  └── Wage calculator, formula engine, validation, Kanban transitions
         │
         ▼
Prisma ORM → SQLite file (local) / PostgreSQL (cloud)
         │
         ▼
Export layer
  ├── docxtemplater → .docx files saved to exports/
  ├── LibreOffice headless → .pdf files saved to exports/
  └── /print routes → A4 HTML for browser Ctrl+P
```

Single command to run: `npm run dev` → http://localhost:3000

**System prerequisites (local machine):**
- Node.js 20+
- LibreOffice (for PDF generation — `brew install --cask libreoffice` on macOS)

### Folder structure

```
src/
  app/                  ← Next.js App Router pages + API routes
    (kanban)/           ← home Kanban board
    establishments/
    employees/
    cycles/
    forms/[taskId]/
    print/[cycleId]/[formCode]/
    exports/
    api/                ← API route handlers
  domain/
    calculations/       ← wage formulas, attendance totals, leave balance
    workflow/           ← Kanban transition rules
    validations/        ← per-form validation rules
    form-definitions/   ← form metadata, field maps, template paths
  lib/
    prisma.ts
    export/             ← docxtemplater wrapper, LibreOffice caller
  components/           ← shared UI components
templates/              ← original .docx files (never modified)
exports/                ← generated files (gitignored)
prisma/
  schema.prisma
  migrations/
```

### Cloud upgrade path

1. Change `DATABASE_URL` in `.env` from `file:./dev.db` to a PostgreSQL connection string
2. Run `prisma migrate deploy`
3. Add NextAuth.js for login and roles
4. Move `exports/` to S3-compatible storage
5. Deploy to Railway, Render, or any VPS (LibreOffice available on Linux)

---

## 5. Data Model

### Core tables

**establishments**
- id, name, address, employer_name, manager_name, reg_cert_no
- type: `HOSPITAL | SHOP`
- wage_formula_config (JSON — preset name + component overrides)
- is_active, created_at, updated_at

**employees**
- id, emp_id, name, sex, father_spouse_name, dob, date_of_entry
- designation, department, present_address, permanent_address
- uan, esi_no, aadhaar (encrypted), bank_account (encrypted), ifsc
- mobile, email, photo_path
- completion_of_480_days, date_made_permanent, period_of_suspension
- status: `ACTIVE | SUSPENDED | EXITED`
- exit_date, exit_reason, remarks
- establishment_id (FK)

**monthly_cycles**
- id, establishment_id (FK), month (1–12), year
- wage_period_days, status: `OPEN | LOCKED`
- created_at
- UNIQUE(establishment_id, month, year)

**cycle_employees** — snapshot of active employees at cycle creation time
- cycle_id (FK), employee_id (FK), emp_data_snapshot (JSON)

**form_tasks** — one row per required form per cycle (Kanban cards)
- id, cycle_id (FK), form_code
- status: `NOT_STARTED | DATA_ENTRY | READY_FOR_REVIEW | NEEDS_CORRECTION | APPROVED | EXPORTED`
- assigned_to, due_date, validation_errors (JSON), last_comment
- created_at, updated_at

**form_task_status_history**
- id, form_task_id (FK), from_status, to_status, comment, changed_at

> Fields marked `(calc)` are computed by the domain layer and **stored** in the database after each save. They are not recomputed on every read. This ensures historical records remain stable even if formula configuration changes later.

### Monthly data tables

**attendance_records**
- id, cycle_id (FK), employee_id (FK)
- work_start_time, work_end_time, rest_interval
- daily_marks (JSON array, index 0–30 = days 1–31, values: P/A/L/H/OT)
- days_worked (calc), leave_days (calc), absent_days (calc), wage_days (calc)
- remarks

**wage_records**
- id, cycle_id (FK), employee_id (FK)
- days_worked, basic, da, hra, other_allowances (JSON)
- total_normal_wages (calc), total_earnings (calc)
- overtime_earnings, gross_wages (calc)
- pf, esi, lwf, advance_recovered, fine_deduction, other_deductions
- total_deductions (calc), net_wages (calc)
- payment_date, unpaid_accumulations, receipt_ref

**leave_records**
- id, cycle_id (FK), employee_id (FK)
- earned_leave_opening, earned_during, earned_availed, earned_closing (calc)
- medical_leave, other_leave, maternity_info, gratuity_info, nomination_info, remarks

**overtime_records**
- id, cycle_id (FK), employee_id (FK)
- daily_ot (JSON — hours per day), total_ot_hours (calc)
- normal_hours_rate, ot_rate
- normal_earnings, ot_earnings (calc), total_earnings (calc)
- payment_date

**fine_records**
- id, cycle_id (FK), employee_id (FK)
- offence_date, offence_description, show_cause_date
- wage_period, wages_on_date, fine_amount, recovered, pending_recovery, remarks

**deduction_records**
- id, cycle_id (FK), employee_id (FK)
- damage_date, description, damage_amount
- deduction_amount, recovered, pending_recovery, remarks

### Output tables

**generated_documents**
- id, form_task_id (FK), form_code
- docx_path, pdf_path, template_version, version_no
- generated_at, file_name

**audit_logs**
- id, entity_type, entity_id, action, previous_value (JSON), new_value (JSON), changed_at

---

## 6. Wage Formula Configuration

Two built-in presets. Selected per establishment via `wage_formula_config` JSON.

### Preset: `TN_MINIMUM_WAGES_HOSPITAL`

Used for Form XII and Form XVII (hospital).

```
total_normal_wages  = basic + da
total_earnings      = basic + da + fixed_allowance
overtime_earnings   = ot_hours × ot_rate              (from overtime_records)
gross_wages         = total_earnings + overtime_earnings
total_deductions    = pf + esi + lwf + advance_recovered + fine_deduction + other_deductions
net_wages           = gross_wages - total_deductions
```

`fixed_allowance` is a configurable value set per establishment (e.g. ₹360 for DNV Orthocare). Other configurable components: LWF rate, ESI applicability toggle.

### Preset: `TN_SHOPS_ESTABLISHMENTS`

Used for Form W and Form T (shop).

```
gross_wages         = basic + da + hra + other_allowances + overtime_wages + leave_wages
total_deductions    = pf + esi + lwf + advance_recovered + fine_deduction + other_deductions
net_wages           = gross_wages - total_deductions
```

Configurable per establishment: HRA amount, LWF rate, ESI applicability, subsistence allowance toggle.

### Admin formula config screen

Located at `Establishments → [name] → Formula Config tab`:
- Select preset
- Enter fixed component values (fixed_allowance, HRA, LWF rate)
- Toggle ESI / LWF applicability on/off
- All changes stored in `establishments.wage_formula_config` JSON

---

## 7. Kanban Workflow

### Stages and transitions

```
NOT_STARTED → DATA_ENTRY → READY_FOR_REVIEW → APPROVED → EXPORTED
                                  ↓                ↑
                           NEEDS_CORRECTION ────────
```

### Transition rules (enforced in API)

| From | To | Condition |
|---|---|---|
| NOT_STARTED | DATA_ENTRY | Any time |
| DATA_ENTRY | READY_FOR_REVIEW | All validations pass (no blocking errors) |
| READY_FOR_REVIEW | APPROVED | Any user (no separate reviewer role in MVP) |
| READY_FOR_REVIEW | NEEDS_CORRECTION | Requires comment |
| NEEDS_CORRECTION | DATA_ENTRY | Any time |
| APPROVED | EXPORTED | Triggers DOCX + PDF generation |
| APPROVED | DATA_ENTRY | Allowed (admin override); audit log entry created |

### Card metadata displayed on board

- Form name + statutory reference
- Establishment name + month/year
- Validation error count badge (red) or ✓ valid (green)
- Due date badge (amber if today, red if past)
- Export state (DOCX/PDF icons if exported)

---

## 8. Export Pipeline

### DOCX generation

1. Load original template from `templates/{hospital|shop}/{form_code}.docx`
2. Apply `docxtemplater` with placeholder replacements:
   - Scalar: `{establishment_name}`, `{wage_period}`, `{employer_name}`, `{month_year}`
   - Row loops: `{#employees}…{/employees}`
   - Daily attendance: pre-expanded columns `{d1}` … `{d31}`
   - Nil values: numeric zero rendered as `Nil` where form expects it
3. Save to `exports/{establishment_slug}/{YYYY_MM}/{form_code}_v{n}.docx`

### PDF generation

```bash
soffice --headless --convert-to pdf --outdir <dir> <file.docx>
```

Saved alongside DOCX as `{form_code}_v{n}.pdf`. Requires LibreOffice installed locally.

### Browser print view

- Route: `/print/[cycleId]/[formCode]`
- A4 HTML page with `@page { size: A4; margin: 10mm }` CSS
- `@media print` hides all navigation and UI chrome
- Faithful table reproduction using `border-collapse` and fixed column widths
- Statutory header (form number, act reference, establishment, month) at top
- Totals row pinned at bottom

### File naming and versioning

```
exports/
  dnv-orthocare/
    2026_04/
      HOSPITAL_FORM_XII_v1.docx
      HOSPITAL_FORM_XII_v1.pdf
      HOSPITAL_FORM_V_v1.docx
  sri-ranga-dept/
    2026_04/
      SHOP_FORM_W_v1.docx
```

Re-export increments version number. Never overwrites.

---

## 9. Screen Map

| Route | Screen |
|---|---|
| `/` | Kanban board (home) — filtered by establishment + month |
| `/establishments` | Establishment list |
| `/establishments/new` | Create establishment |
| `/establishments/[id]` | Edit establishment — tabs: Details, Formula Config, Forms |
| `/employees` | Employee master list |
| `/employees/new` | Add employee |
| `/employees/[id]` | Edit employee — all 23 Form U fields |
| `/cycles` | Monthly cycles list |
| `/cycles/new` | Create cycle — select establishment + month/year |
| `/cycles/[id]` | Cycle detail — form tasks list + employee snapshot |
| `/forms/[taskId]` | Form data entry — tabs: Wage Data / Attendance / Overtime / Validation |
| `/print/[cycleId]/[formCode]` | A4 print view — no chrome, Ctrl+P ready |
| `/exports` | Export history — filter by establishment, month, form |

### Form data entry screen layout

- **Top bar**: establishment name, wage period, month/year, formula preset (read-only)
- **Tab: Wage Data** — employee grid, white cells = user input, green cells = auto-calculated, red cells = validation error
- **Tab: Attendance** — daily marks grid (days 1–31 per employee)
- **Tab: Overtime** — daily OT hours per employee, auto-calculates earnings
- **Tab: Validation** — list of all errors with row references
- **Footer toolbar**: Print Preview | Save Draft | Validate | Move to Review / Approve / Export

---

## 10. Validation Rules

- Days worked cannot exceed days in wage period
- Gross wages must equal sum of wage components (calculated)
- Net wages must equal gross minus total deductions (calculated)
- Payment date cannot be before wage period end
- Exited employees not auto-included in cycles after exit date
- Overtime earnings require overtime hours and rate
- Fine/deduction records require offence date and description
- Establishment statutory details (reg cert no, employer name) required before export
- UNIQUE constraint prevents duplicate cycles for same establishment + month + year

---

## 11. Validation Before Export

Before `APPROVED → EXPORTED` transition:
1. All required establishment fields present
2. All required employee fields present for the target form
3. No blocking validation errors on the form task
4. wage_records totals consistent (gross = components, net = gross − deductions)

---

## 12. Audit Log Events

| Event |
|---|
| Establishment created / updated / deactivated |
| Employee created / updated / exited |
| Monthly cycle created / locked |
| Kanban status changed (with from/to/comment) |
| Approved data edited (override) |
| Document exported (with file path + version) |

Each entry: entity_type, entity_id, action, previous_value (JSON), new_value (JSON), changed_at.

---

## 13. MVP Scope

### In scope
- Establishment management (hospital + shop)
- Employee master (all 23 Form U fields)
- Monthly cycle creation with auto-generated form tasks
- Kanban board with all 6 stages
- Data entry for all 12 forms (hospital 7 + shop 5)
- Auto-calculated wage fields with configurable presets
- DOCX export, PDF export, browser print view
- Export history with versioning
- Audit log

### Out of scope (post-MVP)
- Login / user roles (added when going cloud)
- PostgreSQL migration (done at cloud deployment)
- Payroll bank upload files
- Biometric attendance integration
- Government portal submission
- Multi-state compliance (non-Tamil Nadu forms)
- Mobile app
