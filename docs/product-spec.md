# Kanban Labour Record Maintenance - Product Spec

## 1. Objective

Build a Kanban-style labour record maintenance system that helps maintain statutory labour records for establishments such as hospitals and shops. The system should convert the current Word-based workflow into a structured monthly workflow while still producing outputs that match the existing template forms.

The existing source documents are split into:

- `forms-template/hospital`: blank statutory templates for hospital/minimum wages records.
- `forms-template/shop`: blank statutory templates for shop and establishment records.
- `forms-filled/hospital`: completed hospital records for April 2026.
- `forms-filled/shops`: completed shop records for April 2026.

The filled forms should be treated as examples for data shape, formatting expectations, and export behavior.

## 2. User Goals

- Maintain employee master records once and reuse them across monthly forms.
- Track monthly form preparation using a Kanban board.
- Reduce duplicate entry across employee register, muster roll, wage register, wage slips, overtime, leave, fines, and deductions.
- Generate filled statutory documents from approved monthly data.
- Preserve an audit trail for who changed records and when.
- Support separate establishment types because hospital and shop forms follow different statutory formats.

## 3. Primary Users

- Admin/Owner: manages establishments, users, templates, and monthly cycles.
- HR/Accounts Operator: enters employee, attendance, wage, leave, and deduction data.
- Reviewer/Manager: validates records before export.
- Auditor/Compliance User: views approved records and generated documents.

## 4. Establishment Types

### Hospital / Minimum Wages Tamil Nadu Forms

Current templates include:

- Form No XI - Register of Employees
- Form No V - Register of Muster Roll
- Form No XII - Register of Wages
- Form No XVII - Wage Slip
- Form No IV - Register of Overtime Muster Roll cum Wages
- Form No I - Register of Fines
- Form No II - Register of Deductions for Damages or Loss

### Shop / Tamil Nadu Shops and Establishments Forms

Current templates include:

- Form U - Employee Register
- Form V - Register of Employment
- Form W - Register of Wages
- Form T - Wage Slip / Leave Card
- Form X - Register of Leave and Social Security Benefits

## 5. Core Product Concepts

### Establishment

Represents one business location or employer record.

Key fields:

- Establishment name and address
- Employer name and address
- Manager/in-charge name
- Registration certificate number
- Establishment type: `hospital` or `shop`
- Active/inactive status

### Employee

Reusable employee master record.

Common fields:

- Employee ID
- Name
- Gender/sex
- Father or spouse name
- Date of birth, where applicable
- Date of entry/commencement
- Designation/nature of employment
- Department/nature of work
- Present address
- Permanent address
- Mobile number and email, where applicable
- Aadhaar number, where applicable
- EPF UAN, ESI number, bank details, where applicable
- Exit date, reason for exit, remarks

### Monthly Compliance Cycle

A month-specific workspace for one establishment.

Example: `DNV Orthocare - April 2026`.

Each cycle contains the forms required for that establishment type and exposes them as Kanban cards.

### Kanban Card

Each card represents a required form or compliance task for a month.

Default stages:

- `Not Started`
- `Data Entry`
- `Ready for Review`
- `Needs Correction`
- `Approved`
- `Exported`

Card metadata:

- Form name and statutory reference
- Establishment
- Month/year
- Assigned user
- Status
- Due date
- Completion percentage
- Validation errors
- Last generated document

## 6. Required Workflows

### 6.1 Establishment Setup

1. Create an establishment.
2. Select establishment type: hospital or shop.
3. Enter statutory identity details.
4. Confirm which forms are required.
5. Save as active.

### 6.2 Employee Master Setup

1. Add employees manually or import from a filled employee register.
2. Validate mandatory fields for the selected establishment type.
3. Mark employee as active, suspended, exited, or inactive.
4. Reuse active employees in monthly records.

### 6.3 Monthly Cycle Creation

1. Select establishment and month.
2. System creates the required Kanban cards.
3. Employee list is copied from active employees into the monthly cycle.
4. Operator fills monthly attendance, wage, leave, overtime, fine, and deduction data.
5. Derived totals are calculated automatically.

### 6.4 Kanban Form Maintenance

For each card:

1. Open the form-specific data entry screen.
2. Enter or import data.
3. Run validations.
4. Move card to `Ready for Review`.
5. Reviewer approves or returns to `Needs Correction`.
6. Approved cards can be exported.

### 6.5 Document Export

1. Select an approved card or full monthly cycle.
2. Generate DOCX output matching the relevant template.
3. Optionally generate PDF after DOCX generation.
4. Store generated file with timestamp, month, establishment, and form name.

## 7. Form Data Requirements

### Employee Registers

Hospital Form XI and Shop Form U/V should pull from employee master records. Shop Form U requires deeper employee details such as EPF, ESI, Aadhaar, bank, photo, mobile, email, exit reason, and remarks.

### Muster / Attendance

Hospital Form V tracks daily work across days 1-31, including commencement time, cessation time, rest interval, days worked, leave granted, absent days, counted wage days, and remarks.

### Wage Registers

Hospital Form XII and Shop Form W track wage period, employee days worked, basic wages, dearness allowance, HRA, other allowances, overtime/double wages, leave wages, gross wages, PF, ESI, labour welfare fund, advances, fines/damages, other deductions, net wages, payment date, unpaid accumulations, and receipt or bank transaction references.

### Wage Slips

Hospital Form XVII and Shop Form T should be generated per employee from wage register data. Shop Form T also includes leave availed and leave at credit.

### Overtime

Hospital Form IV tracks daily overtime for each worker, overtime extent, normal hours/rate, overtime rate, normal earnings, overtime earnings, total earnings, and payment date.

### Leave and Social Security

Shop Form X tracks earned leave, medical leave, other leave, maternity-related benefits, nomination, gratuity, and remarks.

### Fines and Deductions

Hospital Form I and Form II track offences, show cause notices, wages, fine or deduction amount, recovery, pending recovery, and remarks.

## 8. Validation Rules

Minimum validation:

- Month/year is required for every monthly record.
- Establishment statutory details are required before export.
- Employee name, gender, father/spouse name, date of entry, and designation/nature of work should be required where the target form expects them.
- Days worked cannot exceed days in wage period.
- Gross wages must equal wage component totals.
- Total deductions must equal deduction component totals.
- Net wages must equal gross wages minus total deductions.
- Payment date cannot be before wage period end unless explicitly allowed.
- Exit employees should not be automatically included in cycles after exit date.
- Overtime earnings require overtime hours and overtime rate.
- Fines/deductions should require reason/date fields.

## 9. Non-Functional Requirements

- Data must be stored in a structured database, not only in generated documents.
- Generated DOCX documents must remain reproducible from stored data.
- All important changes should be auditable.
- The system should support at least multiple establishments and multiple months.
- UI must work comfortably on desktop first; mobile can be read-only or limited for the first version.
- Export should not overwrite previous exports; keep versions.
- Sensitive fields such as Aadhaar and bank account numbers should be protected in storage and hidden unless user role allows viewing.

## 10. MVP Scope

MVP should include:

- Establishment management
- Employee master management
- Monthly cycle creation
- Kanban board for required forms
- Data entry for employee register, attendance/muster, wages, wage slips
- Basic leave, overtime, fines, and deductions data screens
- Review/approval workflow
- DOCX generation using current templates
- Export history

Out of MVP:

- Payroll bank upload files
- Biometric attendance integration
- Government portal submission
- Advanced analytics
- Mobile app
- Multi-state compliance beyond the current Tamil Nadu forms

