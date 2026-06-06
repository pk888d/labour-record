# LabourRecord — User Guide

## Table of Contents
1. [Overview](#overview)
2. [First-Time Setup Flow](#first-time-setup-flow)
3. [Establishments](#establishments)
4. [Employees](#employees)
5. [Government Holidays](#government-holidays)
6. [Wage Rules](#wage-rules)
7. [Monthly Cycles](#monthly-cycles)
8. [Form Data Entry](#form-data-entry)
   - [Attendance Tab](#attendance-tab)
   - [Wage Data Tab](#wage-data-tab)
   - [Overtime Tab](#overtime-tab)
   - [Fines Tab](#fines-tab)
   - [Deductions Tab](#deductions-tab)
   - [Leave Tab](#leave-tab)
9. [Salary Slips](#salary-slips)
10. [Print Forms](#print-forms)
11. [Wage Rules Simulator](#wage-rules-simulator)
12. [Common Workflows](#common-workflows)
13. [Troubleshooting](#troubleshooting)

---

## Overview

LabourRecord is a statutory compliance management tool for Tamil Nadu establishments (hospitals and shops). It generates all required government forms under:

- **Clinical Establishments Act** — Form XI, Form V, Form XII, Form XVII, Form IV, Form I, Form II
- **Tamil Nadu Shops & Establishments Act** — Form U, Form V, Form W, Form T, Form X

It tracks employees, monthly attendance, wages, overtime, leave, fines, and deductions — and prints every government-mandated register and salary slip from the same data.

---

## First-Time Setup Flow

Follow this order when using the application for the first time:

```
1. Create Establishment
      ↓
2. Add Employees  (linked to the establishment)
      ↓
3. Configure Government Holidays  (optional, affects attendance defaults)
      ↓
4. Configure Wage Rules  (optional, system defaults are pre-filled)
      ↓
5. Create Monthly Cycle  (for a specific month/year)
      ↓
6. Open Form Tasks → Enter Attendance, Wages, OT, Leave, Fines, Deductions
      ↓
7. Print / Export Forms
```

---

## Establishments

**Path:** Sidebar → Establishments

An establishment is a hospital or shop registered under Tamil Nadu law. Everything else (employees, cycles, forms) belongs to an establishment.

### Creating an Establishment

1. Click **+ New Establishment**.
2. Fill in:
   - **Establishment Name** — Legal registered name (e.g. "City General Hospital"). Min 3 characters.
   - **Address** — Full address with pincode. Appears on all printed forms.
   - **Employer Name** — Owner/proprietor as per licence.
   - **Manager / In-Charge** — Person responsible. Appears on Form I, Form V etc.
   - **Registration Certificate No.** — Certificate number under the applicable act (e.g. `REG/TN/2024/1234`).
   - **Establishment Type** — `Hospital` (Clinical Establishments Act) or `Shop` (Shops & Establishments Act). This controls which set of government forms is generated.
   - **Working Days per Week** — `7 days (all days)`, `6 days (Mon–Sat)`, or `5 days (Mon–Fri)`. Controls which days are auto-marked as Holiday (H) in the attendance grid when a form task is first opened. For 6-day weeks, Sundays are H. For 5-day weeks, Saturdays and Sundays are H. For 7-day weeks, no day is automatically marked H (only government holidays still apply).
3. **Wage Formula Configuration** (auto-filled based on type):
   - **Preset** — Read-only; set by the Type field.
   - **Fixed Allowance** — Monthly allowance beyond Basic+DA (hospitals only, e.g. ₹360/month per TN notification).
   - **HRA** — House Rent Allowance (shops only).
   - **LWF Rate** — Labour Welfare Fund deduction per employee (TN standard: ₹0.25 employee + ₹0.75 employer).
   - **ESI Applicable** — Check if any employee earns ≤ ₹21,000/month gross.
   - **LWF Applicable** — Usually checked for all TN establishments.
4. Click **Create Establishment**.

### Editing an Establishment

Click the **Edit** link next to an establishment in the list. All fields are editable. You can also mark it as inactive.

### Deleting an Establishment

Click **Delete** next to the establishment. Deletion is blocked if the establishment has employees or monthly cycles. Remove those first.

---

## Employees

**Path:** Sidebar → Employees  
**Or:** Establishment detail page → + Add Employee

Employees are always linked to one establishment.

### Adding an Employee

1. Navigate to the establishment first (Establishments → click establishment name), then click **+ Add Employee**. The establishment is pre-selected automatically.
2. Fill in the required fields:

**Personal Details**
| Field | Notes |
|---|---|
| Employee ID | Unique within the establishment (e.g. `H001`, `S001`) |
| Full Name | As per identity document |
| Sex | M / F |
| Date of Birth | Must be ≥ 14 years before Date of Entry |
| Father / Spouse Name | Appears on Form XI |
| Present Address | Current residential address |
| Permanent Address | Permanent residential address |

**Employment Details**
| Field | Notes |
|---|---|
| Designation | e.g. Nurse, Attender, Cashier |
| Department | Optional (e.g. OPD, ICU, Billing) |
| Date of Entry | Start date of employment |
| Date of Exit | Fill only when employee leaves |
| Exit Reason | Required if Date of Exit is set |
| Status | Active / Exited / Suspended |

**Statutory Numbers**
| Field | Notes |
|---|---|
| UAN | 12-digit Universal Account Number for PF |
| ESI No | ESI insurance number |
| Bank Account No | For wage payment records |
| IFSC Code | Format: 4 letters + 0 + 6 alphanumeric (e.g. `SBIN0001234`) |

**Monthly Wage Defaults** *(important — used to auto-populate wages each month)*
| Field | Notes |
|---|---|
| Basic Wage | Monthly basic (e.g. ₹6,000) |
| DA | Dearness allowance (e.g. ₹1,360) |
| HRA | House Rent Allowance (shops only) |

> **Important:** If you leave wage defaults as ₹0, the wages tab in monthly cycles will show zero for this employee. Always fill these in.

### Editing an Employee

Click the employee name in the list → Edit button on the detail page.

### Filtering Employees by Establishment

On the Employees page, use the **Establishment** dropdown to filter employees. The page title changes to "Employees — [Establishment Name]".

---

## Government Holidays

**Path:** Sidebar → Holidays

Government holidays affect two things:
1. **Attendance defaults** — When a cycle is opened, government holiday dates are automatically marked as `H` (Holiday) in the attendance grid.
2. **Double wages** — Employees who work on a government holiday earn double wages (controlled by the Holiday Multiplier wage rule).

### Adding a Holiday

1. Click **Add Holiday**.
2. Enter the **Date** (must be a valid calendar date within ±3 years of current year).
3. Enter the **Holiday Name** (e.g. "Pongal", "Republic Day"). Min 3 characters.
4. Click **Add**.

### Deleting a Holiday

Click the **×** button next to the holiday. This only removes the holiday from the database; it does not retroactively update existing attendance records.

---

## Wage Rules

**Path:** Sidebar → Wage Rules

Wage rules define the percentages and multipliers used in wage calculations. Each establishment can have its own custom rules, or use system defaults.

### System Defaults

| Rule | Default | Meaning |
|---|---|---|
| HOLIDAY_MULTIPLIER | 2.0× | Double wages for working on a government holiday |
| OT_MULTIPLIER | 2.0× | Double the hourly rate for overtime hours |
| PF_EMPLOYEE_PCT | 12% | Employee PF contribution (% of Basic) |
| PF_EMPLOYER_PCT | 13% | Employer PF contribution (% of Basic) |
| ESI_EMPLOYEE_PCT | 0.75% | Employee ESI contribution (% of Gross) |
| ESI_EMPLOYER_PCT | 3.25% | Employer ESI contribution (% of Gross) |

### Editing a Rule

1. Select an establishment from the dropdown.
2. Click **Edit** next to any rule.
3. Enter the new value. The allowed range is shown in the tooltip (ⓘ icon).
4. Click **Save**.

A blue value indicates a custom override. A grey "default" label means the system default is in use.

### Salary Slip Simulator (right panel)

While editing rules, the right panel shows a live salary slip that recalculates instantly. Edit the sample inputs (monthly basic, DA, wage days, etc.) and see how the rule changes affect gross wages, deductions, and net pay. The affected line in the slip is highlighted in green when you edit its rule.

### Resetting to Defaults

Click **Reset to Defaults** to remove all custom rules for the selected establishment. This cannot be undone.

---

## Monthly Cycles

**Path:** Sidebar → Monthly Cycles

A monthly cycle represents one payroll period (one month) for one establishment. It holds all attendance, wage, leave, OT, fines, and deduction data for that month.

### Creating a Cycle

1. Click **+ New Cycle**.
2. Select the **Establishment**.
3. Select **Month** and **Year**.
4. Set **Wage Period Days** — the number of working days in the month (typically 26 for a 6-day week, or 25 if holidays fall in that month).
5. Click **Create Cycle**.

On creation, the cycle automatically snapshots all currently active employees of the establishment. It also creates all required form tasks (7 for hospitals, 5 for shops).

### Cycle Detail Page

Click a cycle in the list to open its detail page. You will see:

- **Form Tasks** — one row per statutory form, showing status and Open/Print links.
- **Employees in this Cycle** — list of employees snapshotted at cycle creation.
- **Sync Employees** button — if you added an employee after the cycle was created, click this to pull them into the cycle.
- **Salary Slips** button — view and print salary slips for all employees.

### Cycle Status

Each form task has its own status:

| Status | Meaning |
|---|---|
| NOT STARTED | No data entered yet |
| DATA ENTRY | Data is being entered |
| READY FOR REVIEW | Data entry complete, awaiting approval |
| NEEDS CORRECTION | Reviewer flagged corrections |
| APPROVED | Approved and ready to export |
| EXPORTED | Document has been generated |

### Deleting a Cycle

Click **Delete** on the cycles list. This permanently deletes the cycle and all its data (attendance, wages, leave, OT, fines, deductions, generated documents). This cannot be undone.

---

## Form Data Entry

**Path:** Monthly Cycles → Open cycle → Click **Open** on any form task

Each form task opens a 6-tab data entry page.

---

### Attendance Tab

The attendance grid shows every employee as a row and every day of the month as a column.

**Default marks (applied automatically on first open):**
- Monday–Saturday: **P** (Present)
- Sunday: **H** (Holiday)
- Government holiday dates: **H** (Holiday — takes priority)

**Attendance codes:**

| Code | Meaning |
|---|---|
| P | Present |
| A | Absent |
| H | Holiday / Weekly Off |
| OT | Present + Overtime |
| L | Leave |

**How to change a mark:**
- Click any cell to cycle through: P → A → L → H → OT → (blank) → P → …
- Changes are saved per row when you click **Save Attendance**.

**Totals (auto-calculated):**
- **Days Worked** = P + OT days
- **Leave Days** = L days
- **Absent Days** = A days
- **Wage Days** = Days Worked + Leave Days (used for wage proration)

---

### Wage Data Tab

Wages are auto-populated from the employee's wage defaults, prorated by wage days.

**Proration formula:**
```
Prorated Basic = Monthly Basic × Wage Days ÷ Days in Month
Prorated DA    = Monthly DA    × Wage Days ÷ Days in Month
PF             = Prorated Basic × PF Employee %
ESI            = Gross Wages   × ESI Employee %
```

> **Warning banner:** If an employee shows a yellow ⚠ warning, their basic wage default is ₹0. Click the "Set wage defaults" link to go to their employee profile and fill in the monthly basic and DA.

**Fields you can override per employee:**
- Basic, DA, HRA
- PF, ESI, LWF
- Other Allowances (freeform)
- Advance Recovered, Other Deductions
- Payment Date, Receipt Reference

Gross wages and net wages are calculated automatically.

Click **Save Wage Data** to save. Pre-flight validation checks that days worked is within range and no values are negative.

---

### Overtime Tab

Enter daily overtime hours per employee. The system calculates:

```
OT Earnings = (Daily Rate ÷ 8) × OT Multiplier × Total OT Hours
```

where Daily Rate = (Prorated Basic + DA) ÷ Wage Days.

Enter hours in the grid cells (one column per day). Zero or blank = no OT that day.

Click **Save Overtime**.

---

### Fines Tab

Fines are individual entries (one offence = one row).

1. Select the **Employee**.
2. Enter **Offence Date**, **Offence Description**, and **Fine Amount**.
3. Optionally enter **Amount Recovered** this period and **Remarks**.
4. Click **Add Fine**.

To delete a fine entry, click the **×** button on that row.

This data populates **Form I — Register of Fines**.

---

### Deductions Tab

Same structure as fines, but for damage/loss deductions.

1. Select the **Employee**.
2. Enter **Date of Damage**, **Description**, **Deduction Amount**.
3. Optionally enter **Amount Recovered** this period and **Remarks**.
4. Click **Add Deduction**.

This data populates **Form II — Register of Deductions**.

---

### Leave Tab

Enter leave balances per employee for the month.

| Field | Meaning |
|---|---|
| EL Opening | Earned leave balance at month start |
| Earned During | Leave accrued this month |
| EL Availed | Leave taken this month |
| EL Closing | Auto-calculated: Opening + Earned − Availed (min 0) |
| Medical Leave | Medical leave days this month |
| Other Leave | Any other leave type |

Click **Save Leave Data**.

---

## Salary Slips

**Path:** Monthly Cycles → Open cycle → **Salary Slips** button

### All Employees View

Shows salary slip cards for every employee in the cycle, arranged in a grid. Each card shows:
- Employee details (Emp No, Name, Designation, UAN, ESI No)
- Earnings breakdown → Gross Wages
- Deductions → Total Deductions
- **Net Pay**
- Employee signature line

**Actions on each card:**
- **View** — Opens the full individual slip page.
- **Print** — Opens the individual slip in a new tab and triggers the browser print dialog immediately.

**Print All** (top-right button) — Prints all salary slips in a 2-column print layout. Sidebar and navigation are hidden automatically.

### Individual Slip View

Click **View** on any card to see the full-page slip for that employee. Features:
- Clean, print-ready A4 layout.
- **← Name / Name →** navigation buttons to move between employees without going back.
- **"1 of 6 employees"** counter.
- **Print Slip** button — prints only this slip (sidebar hidden).
- Both employee and authorised signatory signature lines.

---

## Print Forms

**Path:** Monthly Cycles → Open cycle → **Print** link on any form task row

Opens the statutory form as a print-ready page in a new browser tab. Press **Ctrl+P** (or **Cmd+P** on Mac) to print or save as PDF.

### Available Forms

**Hospitals (Clinical Establishments Act):**

| Form | Description |
|---|---|
| Form XI — Rule 25 | Register of Employees (full employee details) |
| Form V — Rule 26 | Muster Roll (monthly attendance) |
| Form XII — Rule 27(1) | Register of Wages (wage summary table) |
| Form XVII — Rule 27(3) | Wage Slips (individual salary slips grid) |
| Form IV — Rule 28 | Overtime Muster Roll cum Wages |
| Form I — Rule 72(1) | Register of Fines |
| Form II — Rule 72(2) | Register of Deductions |

**Shops & Establishments:**

| Form | Description |
|---|---|
| Form U — Rule 16 | Employee Register |
| Form V — Rule 17 | Register of Employment |
| Form W — Rule 18 | Register of Wages |
| Form T — Rule 19 | Wage Slips |
| Form X — Rule 20 | Leave & Social Security Benefits |

---

## Wage Rules Simulator

**Path:** Sidebar → Wage Rules → select an establishment

The right panel is a live salary slip calculator. It is useful for:
- **Understanding how rules affect pay** before changing them.
- **Answering employee questions** about their salary breakdown.
- **Verifying TN minimum wages compliance** by entering actual basic/DA values.

**Sample inputs you can adjust:**
- Monthly Basic, Monthly DA, Fixed Allowance, LWF amount
- Days in Month, Wage Days Worked
- Holiday Days Worked, OT Hours

The slip recalculates instantly. When you click **Edit** on a rule, the affected slip line highlights in green so you can see exactly what changes.

---

## Common Workflows

### Monthly Payroll Workflow

1. **Start of month:** Create a new Monthly Cycle for the establishment and month.
2. **During month:** As employees take leave or work OT, open the cycle and update the Attendance, OT, and Leave tabs.
3. **End of month:** Open the Wages tab — wages are pre-populated. Review and adjust if needed. Save.
4. **Fines/Deductions:** Add any fine or deduction entries in those tabs.
5. **Print:** Print Form XII (Register of Wages), Form XVII (Wage Slips), and Form V (Muster Roll) for the month.
6. **Salary Slips:** Go to Salary Slips → print individual slips for each employee.

### New Employee Mid-Month

1. Add the employee under the establishment (Employees → + Add Employee).
2. Go to the current monthly cycle → click **Sync Employees** button.
3. The employee now appears in all tabs. Their attendance defaults to P for remaining days.
4. Enter wages manually (they won't be prorated automatically for partial month — adjust days worked in the Attendance tab, and wages will prorate accordingly).

### Employee Leaves the Organisation

1. Go to Employees → find the employee → Edit.
2. Set **Date of Exit**, **Exit Reason**, and change **Status** to Exited.
3. The employee will no longer be included in new cycles created after their exit date.

### Changing Wage Rules for Next Month

1. Go to Wage Rules → select the establishment.
2. Edit the rule(s). Changes apply from the next cycle created (existing wage records are not retroactively changed).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Wages showing ₹0 for an employee | The employee's Monthly Wage Defaults are not set. Go to Employees → edit employee → fill Basic Wage and DA fields. |
| Employee missing from cycle | Employee was added after cycle creation. Go to cycle detail → click **Sync Employees**. |
| Cannot delete establishment | The establishment has active employees or cycles. Delete the cycles first, then the employees, then the establishment. |
| Cannot delete cycle | Cycles can always be deleted. Check the browser console for any error. |
| Attendance not saving | Check that you are clicking **Save Attendance** on each employee row, not just changing the cells. |
| Government holiday not marking as H | The holiday must be added in the Holidays page *before* opening the form task for the first time. Existing attendance records are not automatically updated. |
| Print shows sidebar | Make sure you are using the Print Slip button (or the Print link on the cycle detail) rather than the browser's print shortcut directly on a non-print page. |
| App won't start after install | Run `cd ~/labour-record/labour-record-app && npm run build`. If it fails, check that Node.js v20+ is installed: `node --version`. |
