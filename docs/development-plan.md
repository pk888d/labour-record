# Development Plan

## 1. Recommended Architecture

Use a simple full-stack web application:

- Frontend: React or Next.js with a dense, operational Kanban UI.
- Backend: Node.js/TypeScript or Python/FastAPI.
- Database: PostgreSQL.
- File storage: local filesystem for MVP, later replaceable with S3-compatible storage.
- Document generation: DOCX templating based on the existing `.docx` forms.

Keep compliance form definitions data-driven where possible. Each form should have a form definition containing fields, validation rules, source data mappings, and export template path.

## 2. Major Modules

### 2.1 Establishments

- CRUD for establishment details.
- Store statutory identity fields.
- Assign required form set by establishment type.

### 2.2 Employees

- CRUD for employee master data.
- Support active/exited status.
- Support shop-specific fields such as UAN, ESI, Aadhaar, bank, mobile, email, photo.
- Import helpers can come later.

### 2.3 Monthly Cycles

- Create one cycle per establishment per month.
- Auto-create form tasks/cards.
- Snapshot active employee list into the cycle.
- Prevent accidental duplicate cycles for same establishment/month.

### 2.4 Kanban Workflow

- Board columns: `Not Started`, `Data Entry`, `Ready for Review`, `Needs Correction`, `Approved`, `Exported`.
- Cards represent monthly forms.
- Card movement should respect workflow rules.
- Store comments, validation messages, assignment, and status history.

### 2.5 Form Data Entry

- Shared employee grid for monthly rows.
- Form-specific sections for attendance, wages, leave, overtime, fines, and deductions.
- Auto-calculate totals where possible.
- Preserve manual override fields with reason.

### 2.6 Review and Approval

- Reviewer can approve or return a card with comments.
- Approved cards become locked except for users with override permission.
- Any edit after approval should create a new revision or return card to `Data Entry`.

### 2.7 Export Engine

- Map stored data to the relevant DOCX template.
- Generate output files per form and per month.
- Store generated file metadata.
- Keep export versions.

## 3. Suggested Data Model

Core tables:

- `users`
- `establishments`
- `employees`
- `employee_documents`
- `monthly_cycles`
- `cycle_employees`
- `form_tasks`
- `form_task_comments`
- `form_task_status_history`
- `attendance_records`
- `wage_records`
- `leave_records`
- `overtime_records`
- `fine_records`
- `deduction_records`
- `generated_documents`
- `audit_logs`

Important relationships:

- One establishment has many employees.
- One establishment has many monthly cycles.
- One monthly cycle has many form tasks.
- One monthly cycle has many cycle employees.
- Wage, attendance, leave, overtime, fine, and deduction rows belong to a monthly cycle and employee.
- Generated documents belong to a form task or monthly cycle.

## 4. Kanban Status Rules

- `Not Started` to `Data Entry`: allowed when user begins work.
- `Data Entry` to `Ready for Review`: allowed only when required validations pass.
- `Ready for Review` to `Approved`: reviewer only.
- `Ready for Review` to `Needs Correction`: reviewer only, requires comment.
- `Needs Correction` to `Data Entry`: operator only.
- `Approved` to `Exported`: allowed after successful document generation.
- `Approved` back to `Data Entry`: admin/reviewer only, requires reason.

## 5. Form Definition Strategy

Represent each statutory form as a definition:

- `form_code`: e.g. `HOSPITAL_FORM_XI`, `SHOP_FORM_W`
- `display_name`
- `establishment_type`
- `template_path`
- `data_sources`
- `required_fields`
- `calculated_fields`
- `validation_rules`
- `export_mapping`

This avoids hardcoding every form into the UI and allows new forms to be added later.

## 6. Document Generation Strategy

Recommended approach:

1. Convert each existing `.docx` template into a templating-friendly DOCX file with placeholders.
2. Use placeholders for scalar fields such as establishment name, month, employer, manager, and wage period.
3. Use table-row repetition for employee rows.
4. Generate one document per form.
5. Compare generated output against the filled April 2026 examples.

Potential libraries:

- Node.js: `docxtemplater`, `pizzip`
- Python: `python-docx` for structured generation, or `docxtpl` for templating

## 7. Import Strategy

Do not make DOCX import mandatory for MVP. DOCX tables can be inconsistent, and reliable extraction may become a separate project.

Recommended path:

1. First build manual data entry and clean exports.
2. Add CSV/Excel import for employee and monthly wage rows.
3. Later add assisted DOCX import if needed.

## 8. Security and Permissions

Roles:

- `admin`: full access.
- `operator`: data entry and corrections.
- `reviewer`: approve/reject/export.
- `auditor`: read-only access to approved records and exports.

Controls:

- Mask Aadhaar and bank account numbers by default.
- Store every approval, rejection, status movement, and export in audit logs.
- Prevent deleted records from vanishing; use soft delete for compliance data.

## 9. Testing Strategy

Minimum tests:

- Data model validations.
- Wage calculations.
- Kanban transition rules.
- Monthly cycle creation.
- Export mapping for each MVP form.
- Regression test using April 2026 filled examples.

Manual acceptance tests:

- Create hospital establishment and April 2026 cycle.
- Enter employees from filled hospital Form XI.
- Generate Form XI, Form V, Form XII, and Form XVII.
- Create shop establishment and April 2026 cycle.
- Enter employees from shop forms.
- Generate Form U, Form W, Form T, and Form X.

