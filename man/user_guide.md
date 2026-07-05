# Mustearly — User Guide

*Tamil Nadu Labour Compliance Manager, by Tech Sakthi*

## Table of Contents
1. [Overview](#overview)
2. [First-Time Setup Flow](#first-time-setup-flow)
3. [Dashboard](#dashboard)
4. [Establishments](#establishments)
5. [Employees](#employees)
6. [Government Holidays](#government-holidays)
7. [Wage Formula & Salary Simulator](#wage-formula--salary-simulator)
8. [Monthly Cycles](#monthly-cycles)
9. [Form Data Entry](#form-data-entry)
   - [Attendance Tab](#attendance-tab)
   - [Wage Data Tab](#wage-data-tab)
   - [Overtime Tab](#overtime-tab)
   - [Fines Tab](#fines-tab)
   - [Deductions Tab](#deductions-tab)
   - [Leave Tab](#leave-tab)
10. [Salary Slips](#salary-slips)
11. [Print Forms](#print-forms)
12. [Bulk Import & Export](#bulk-import--export)
13. [Calendar](#calendar)
14. [Settings](#settings)
15. [Audit Log](#audit-log)
16. [Common Workflows](#common-workflows)
17. [Troubleshooting](#troubleshooting)

---

## Overview

Mustearly is a statutory compliance management tool for Tamil Nadu establishments. It generates all required government forms under:

- **Clinical Establishments Act** (Hospital establishments) — Form XI, Form V, Form XII, Form XVII, Form IV, Form I, Form II
- **Tamil Nadu Shops & Establishments Act** (all other establishment types) — Form U, Form V, Form W, Form T, Form X

**Establishment types supported**, each with its own default Dearness Allowance (DA) rate:

| Type | Default DA (₹/month) | Forms family |
|---|---|---|
| Shop | 7,353 | Shops & Establishments |
| Hospital | 5,544 | Clinical Establishments |
| Hotel | 8,466 | Shops & Establishments |
| Petrol Bunk | 7,247 | Shops & Establishments |
| Medical | 7,970 | Shops & Establishments |
| Oil Mill | 8,950 | Shops & Establishments |

Only **Hospital** uses the Clinical Establishments forms and the minimum-wages preset; every other type falls under the TN Shops & Establishments Act. The DA rate is a per-employee default and remains editable on each employee's Salary Setup.

Mustearly tracks employees, monthly attendance, wages, overtime, leave, fines, and deductions — and prints every government-mandated register and salary slip from the same data.

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
4. Review/adjust Wage Formula on the Establishment  (optional, sensible defaults are pre-filled)
      ↓
5. Create Monthly Cycle  (for a specific month/year)
      ↓
6. Open Form Tasks → Enter Attendance, Wages, OT, Leave, Fines, Deductions
      ↓
7. Print / Export Forms
```

---

## Dashboard

**Path:** Sidebar → Dashboard

The home screen, giving an at-a-glance view of your entire workload.

- **Summary cards** — total **Registered Firms**, **Total Employees**, and **Monthly Cycles**.
- **Workload Panel** — counts of Form Tasks grouped by status (Not Started, Data Entry, Review, Correction, Approved, Exported), plus an "N open tasks" summary covering every status except Exported.
- **Reminders Panel** — an "Upcoming & Overdue" list of Calendar events due within the next two weeks (or already past due), each linking through to the Calendar. Shows "Nothing due in the next two weeks" when the list is empty.
- **Establishments panel** — switchable between **Cards**, **Table**, **Rows** (expandable), and **Directory** views (your last choice is remembered). Shows, per establishment: Name, Type, Address, Employer Name, Manager Name, Reg. Cert. No., Contact (phone · email), Processing Fee, Service Start Date, Employee count, Cycle count, and DA Rate.
- **"+ New Establishment"** shortcut in the header.

---

## Establishments

**Path:** Sidebar → Establishments

An establishment is a business registered under Tamil Nadu law. Everything else (employees, cycles, forms) belongs to an establishment.

### Creating an Establishment

1. Click **+ New Establishment**.
2. Fill in the **Core Details**:
   - **Establishment Name*** — legal registered name (e.g. "City General Hospital"). Minimum 3 characters.
   - **Address*** — full registered address including city and pincode. Appears on all statutory forms.
   - **Employer Name*** — name of the owner/proprietor as per licence.
   - **Manager / In-Charge*** — name of the manager responsible. Appears on Form I, Form V etc.
   - **Registration Certificate No.*** — certificate no. under the applicable act (e.g. `REG/TN/2024/1234`). Required, minimum 3 characters.
   - **Establishment Type*** — one of Shop, Hospital, Hotel, Petrol Bunk, Medical, Oil Mill (shown with its DA rate in the dropdown). Hospital uses Clinical Establishments Act forms; every other type uses TN Shops & Establishments Act forms. Selecting a type also sets the Wage Formula preset automatically.
   - **Working Days per Week*** — `7 days (all days)`, `6 days (Mon–Sat)`, or `5 days (Mon–Fri)`. Controls which days auto-mark as Holiday (H) in the attendance grid. Government holidays are always marked H regardless of this setting.
3. Fill in **Contact & Billing**:
   - **Contact Phone** — primary contact number.
   - **Contact Email** — primary contact email.
   - **Processing Fee (₹/month)** — your monthly service fee for this establishment.
   - **Service Start Date** — the date you started servicing this establishment.
4. Review **Wage Formula Configuration** (see [Wage Formula & Salary Simulator](#wage-formula--salary-simulator) for full field details).
5. Click **Create Establishment**.

### Editing an Establishment

Click the **Edit** link next to an establishment in the list. All fields are editable, plus an **Active** checkbox to mark it inactive without deleting it.

### Deleting an Establishment

Click **Delete** next to the establishment. Deletion is blocked if the establishment has employees or monthly cycles — remove those first.

---

## Employees

**Path:** Sidebar → Employees
**Or:** Establishment detail page → + Add Employee

Employees are always linked to one establishment, set at creation and locked thereafter.

### Adding an Employee

Navigate to the establishment first (or use the establishments-scoped list), then click **+ Add Employee**. Fields are grouped as follows.

**Basic Details**
| Field | Notes |
|---|---|
| Employee ID | Unique within the establishment (e.g. `EMP001`, `H-2024-01`). Leave blank to auto-generate. |
| Full Name* | As per Aadhaar/official records. Minimum 2 characters. |
| Sex | M / F. Used in statutory registers. |
| Father / Spouse Name | Father's name (unmarried) or spouse name (married). Required for Form I and PF nomination. |
| Date of Birth | Employee must be at least 14 years old. |
| Date of Entry | First day of employment. Used to compute tenure, earned leave, and the 480-days milestone. |
| Establishment | Locked after creation. |
| Designation | Job title as per appointment letter, e.g. Staff Nurse, Cashier. |
| Department | Section/unit, optional, e.g. OPD, ICU, Billing. |

**Addresses**
| Field | Notes |
|---|---|
| Present Address | Current residential address. Used in Form I register. |
| Permanent Address | Permanent/native address. Used in Form I register. |

**Statutory IDs**
| Field | Notes |
|---|---|
| EPF UAN | 12-digit Universal Account Number from EPFO. |
| ESI No. | 17-digit ESI insurance number from ESIC. |
| Aadhaar No. | 12-digit Aadhaar number. Masked in the UI and stored encrypted. |

**Bank Details**
| Field | Notes |
|---|---|
| Payment Mode | Bank Transfer or Cash. Switching to Cash clears and disables the bank fields below. |
| Bank Account No. | 9–18 digits, masked in the UI, stored encrypted. |
| IFSC Code | 11 characters: 4 letters + `0` + 6 alphanumeric, e.g. `SBIN0001234`. |
| Bank Name | e.g. State Bank of India, Indian Bank. |

**Contact**
| Field | Notes |
|---|---|
| Mobile | Exactly 10 digits. |
| Email | Optional. |

**Service Dates**
| Field | Notes |
|---|---|
| 480 Days Completion | Date the employee completes 480 working days — entitles them to earned leave under the TN Shops Act. |
| Date Made Permanent | Date of confirmation/regularisation. |
| Period of Suspension | Free text, e.g. "15 days — April 2024". |

**Exit Details** *(shown only when editing an existing employee)*
| Field | Notes |
|---|---|
| Status | Active / Suspended / Exited. |
| Exit Date | Must not be before Date of Entry. |
| Reason for Exit | Required whenever Exit Date is set. |

**Salary Setup** *(interactive — drives the Live Breakdown Preview; see next section)* and **Monthly Wage Defaults** *(the values actually used to prorate wages each cycle)*:

| Field | Notes |
|---|---|
| Basic (₹) | Monthly basic wage as per appointment/minimum wages notification, e.g. ₹6,000. |
| DA (₹) | Dearness Allowance per month as per TN govt notification, e.g. ₹1,360. |
| HRA (₹) | House Rent Allowance per month (Shop-type establishments), e.g. ₹500. |
| PF (₹) | Monthly PF deduction, typically 12% of Basic. |
| ESI (₹) | Monthly ESI deduction, typically 0.75% of gross wages. |
| LWF (₹) | Labour Welfare Fund monthly deduction, TN employee share ≈ ₹0.25–₹10 depending on config. |

> **Important:** If you leave the Monthly Wage Defaults at ₹0, the Wages tab in every monthly cycle will show ₹0 for this employee. Always fill these in — use the **"Apply to wage defaults ↓"** button in Salary Setup to compute and copy them in automatically (see next section).

**Remarks** — free text.

**Validation rules:**
- Name ≥ 2 characters.
- Employee must be at least 14 years old (from Date of Birth).
- Date of Entry cannot be before Date of Birth.
- Exit Date cannot be before Date of Entry.
- Reason for Exit is required whenever an Exit Date is set.
- Mobile must be exactly 10 digits.
- UAN must be exactly 12 digits.
- IFSC must match 4 letters + `0` + 6 alphanumeric (11 characters total).
- Wage amounts (Basic/DA/HRA/PF/ESI/LWF) cannot be negative.
- Basic wage cannot exceed ₹2,00,000.

### Editing an Employee

Click the employee's name in the list, then use the Edit page.

### Filtering & Searching Employees

On the Employees page: **Search** by name or ID (updates live, 300 ms after you stop typing), **Filter by establishment** (dropdown, defaults to "All Establishments"), **Filter by status** (Active / Exited / Suspended, defaults to Active).

---

## Government Holidays

**Path:** Sidebar → Holidays

Government holidays affect two things:
1. **Attendance defaults** — when a form task is first opened, holiday dates auto-fill as `H` (Holiday, paid) in the attendance grid.
2. **Double wages** — an employee who works (`P`) on a government holiday earns double wages.

### Adding a Holiday

1. Use the **Year** dropdown to pick the year you're adding a holiday for (defaults to a range around the current year; any year you've already added holidays for is included automatically).
2. Enter the **Date*** — must be a valid date; the year is validated to be between 2000–9999.
3. Enter the **Holiday Name*** — e.g. "Pongal", "Republic Day". Minimum 3 characters.
4. Click **+ Add Holiday**.

### Loading Default Holidays

Click **"Load default holidays"** to auto-populate the standard set of double-wage holidays for the selected year, instead of entering them one by one.

### The Holidays Table

Columns: **#**, **Date**, **Day** (auto-computed weekday), **Holiday Name**, **Double Wage** (a "2× Double" badge, or "Normal" if double-wage doesn't apply to that entry), and **Action** (Delete).

### Deleting a Holiday

Click **Delete** next to the holiday. This only removes the holiday going forward — it does not retroactively update attendance already saved for cycles that already used that date.

---

## Wage Formula & Salary Simulator

There is no separate "Wage Rules" page in the app — wage-formula configuration and the salary simulator live in two places:

### 1. Establishment → Wage Formula Configuration

Found in the Establishment create/edit form, below Contact & Billing.

| Field | Notes |
|---|---|
| Preset | Read-only. Auto-set from Establishment Type: `TN_MINIMUM_WAGES_HOSPITAL` for Hospital, `TN_SHOPS_ESTABLISHMENTS` for everything else. |
| Fixed Allowance (₹) beyond Basic+DA | Hospital establishments only. Additional fixed monthly allowance beyond Basic+DA, e.g. ₹360/month per TN notification. Capped at ₹50,000. |
| HRA (₹) | Non-Hospital establishments only. Firm-wide default House Rent Allowance. |
| LWF Rate (₹ per month) | Labour Welfare Fund deduction per employee per month. TN rate: ₹0.25 employee + ₹0.75 employer. Flagged if set above 100. |
| ESI Applicable | Tick if any employee earns ≤ ₹21,000/month gross. ESI = 0.75% employee + 3.25% employer. |
| LWF Applicable | Usually left checked — applies to all TN establishments by default. |

### 2. Employee → Salary Setup + Live Breakdown Preview

Found on the Employee form, above Monthly Wage Defaults. This is the app's real-time **salary slip simulator** — every field below recalculates the preview instantly as you type, before anything is saved.

| Field | Notes |
|---|---|
| Default Total Salary (₹)* | Monthly gross target (Basic + DA + HRA + Other). Basic is the remainder after the other components. |
| DA (₹) | Dearness Allowance. Defaults to the firm's rate but is editable per employee. The **↺ ₹[rate]** button resets it back to the firm rate. |
| HRA (₹) | House Rent Allowance, editable. Part of the gross; reduces Basic. |
| Other Allowances (₹) | Any other fixed monthly allowance. Part of the gross; reduces Basic. |
| Overtime / Double Wages (₹) | Extra earnings on top of the gross (e.g. holiday double-wages). Not part of Basic. |
| LWF (₹) | Labour Welfare Fund deduction per month, editable. Subtracted from gross in net pay. |
| PF Mode | `PERCENT` (12% of Basic+DA capped at the wage ceiling, ₹1,800 default), `FIXED` (a flat PF amount), or `NONE`. |
| PF % / PF Wage Ceiling (₹) | Shown when PF Mode = Percent. |
| Fixed PF Amount (₹) | Shown when PF Mode = Fixed — flat monthly PF for this employee. |
| ESI Applicable | ESI = employee % of gross wages, only when gross ≤ the threshold. TN statutory default: 0.75% with a ₹21,000 threshold — both editable when checked (**ESI %**, **Threshold ₹**). |

**Live Breakdown Preview** (read-only, updates on every keystroke) shows: Basic, DA, HRA, Other Allow., Overtime, PF, ESI, LWF, then **Gross**, **− Deductions**, and **Net Pay**.

Click **"Apply to wage defaults ↓"** to copy the preview's Basic/DA/HRA/PF/ESI straight into the Monthly Wage Defaults fields below — this is the fastest way to set an employee's wage defaults correctly the first time or after changing their salary structure.

---

## Monthly Cycles

**Path:** Sidebar → Monthly Cycles

A monthly cycle represents one payroll period (one month) for one establishment. It holds all attendance, wage, leave, OT, fines, and deduction data for that month.

### Creating a Cycle

1. Click **+ New Cycle**.
2. Select the **Establishment***.
3. Select **Month*** and **Year*** (2000–9999).
4. Set **Wage Period Days** (1–31, default 26) — the number of working days used for proration. Default 26 assumes a 6-day week (4 Saturdays + 22 weekdays); bump to 27 if the month has 5 Saturdays.
5. Click **Create Cycle**.

On creation, the cycle snapshots all currently active employees of the establishment and creates every required form task for that establishment's type.

### Cycle Detail Page

Click a cycle in the list to open its detail page:

- **Form Tasks** — one row per statutory form for this establishment type, showing its status and **Open** / **Print** / **Slips** (for wage-slip form codes) / **Export** actions.
- **Employees in this Cycle** — employees snapshotted at cycle creation, with a **Sync Employees** button (pulls in employees added to the establishment after the cycle was created) and a **Sync Wages** button (refreshes each employee's wage record from their current profile defaults).
- **Salary Slips** shortcut link.

### Cycle Status

Each form task has its own status:

| Status | Meaning |
|---|---|
| NOT STARTED | No data entered yet. |
| DATA ENTRY | Data is currently being entered. |
| READY FOR REVIEW | Data entry complete, awaiting approval. |
| NEEDS CORRECTION | Reviewer flagged corrections. |
| APPROVED | Approved and ready to export. |
| EXPORTED | Document has been generated. |

### Deleting a Cycle

Click **Delete** on the cycles list. This permanently deletes the cycle and all its data (attendance, wages, leave, OT, fines, deductions, generated documents). This cannot be undone.

---

## Form Data Entry

**Path:** Monthly Cycles → open a cycle → click **Open** on any form task

Each form task opens a tabbed data-entry workspace, plus a workflow status bar at the bottom.

---

### Attendance Tab

The grid shows every employee as a row and every day of the month as a column.

**Default marks (applied automatically on first open):**
- Working days (per the establishment's Working Days per Week): **P** (Present)
- Weekly off day(s) and government holiday dates: **H** (Holiday — holiday always wins)

**Attendance codes:** click a cell to cycle through `'' → P → A → L → H → OT → ''`.

| Code | Meaning |
|---|---|
| P | Present |
| A | Absent (no pay) |
| L | Leave (paid) |
| H | Holiday / Weekly Off (paid) |
| OT | Overtime day |
| P on a govt holiday | Present on a holiday — earns double wages |

**"Apply Defaults"** button re-fills any still-blank cells using the same P/H rule above, leaving already-set marks untouched.

**Per-employee totals (auto-calculated):**
- **Wkd** = worked days (P + OT)
- **Lv** = leave days
- **Ab** = absent days
- **Wage** = **worked + leave + holiday** days — this is the figure used to prorate wages, since paid holidays and weekly-offs count toward pay just like a worked day.

Click **Save Attendance** to persist.

---

### Wage Data Tab

Wages are auto-populated from each employee's Monthly Wage Defaults, prorated by wage days.

**Proration formula:**
```
Wage Days      = Days Worked + Leave Days + Holiday Days   (paid holidays count!)
Prorated Basic = Monthly Basic × Wage Days ÷ Days in Month
Prorated DA    = Monthly DA    × Wage Days ÷ Days in Month
Gross Wages    = Basic + DA + Fixed Allowance + Holiday Bonus + OT Earnings
PF             = 12% of Prorated Basic
ESI            = 0.75% of Prorated Gross Wages
Net            = Gross − (PF + ESI + LWF + Advance + Fines + Other Deductions)
```

> **Warning banner:** if any employee has both Basic and DA at ₹0, a banner appears — click the "⚠ Set wage defaults" link to jump to their profile and fill in Basic/DA (see [Employees](#employees)).

**Fields you can override per employee:** Basic, DA, HRA/Other (Shop establishments), PF, ESI, LWF, Advance Recovered, Fine Deduction, Payment Date, Receipt Reference. Gross and Net are always computed automatically from these.

Click **Save Wage Data**. Validation checks days worked is within 0–days-in-month and no amount is negative.

---

### Overtime Tab

Instruction: "Enter daily OT hours. Leave 0 for non-OT days."

Per employee: a daily OT-hours input for every day of the month (0–24, in half-hour steps), an editable **OT Rate** and **Normal Earn**, and computed **OT Earn** (hours × rate) and **Total** (Normal + OT).

Click **Save Overtime**.

---

### Fines Tab

Fines are individual entries — one offence per row. Existing records show Employee, Offence Date, Description, Amount, Recovered.

**Add Fine Record:** select **Employee***, enter **Offence Date***, **Description***, and **Fine Amount**, then click **Add Fine**. Delete any row with its **×**/Delete action.

This data populates **Form I — Register of Fines**.

---

### Deductions Tab

Same pattern as Fines, for damage/loss deductions. Existing records show Employee, Damage Date, Description, Deduction, Recovered.

**Add Deduction Record:** select **Employee***, enter **Damage Date***, **Description***, and **Deduction Amount**, then click **Add Deduction**.

This data populates **Form II — Register of Deductions**.

---

### Leave Tab

Per-employee columns: **EL Open** (opening earned-leave balance), **EL Earned** (accrued this month), **EL Availed** (taken this month), **EL Closing** (auto-calculated = max(0, Open + Earned − Availed)), **Medical** (medical leave days), **Other** (any other leave type).

Click **Save Leave Data**.

---

### Footer / Workflow Toolbar

Shows the task's current **Status** with the relevant transition button:
- **"Start Entry"** (from Not Started) → moves to Data Entry.
- **"Move to Review"** (from Data Entry) → moves to Ready for Review and navigates home.
- **"Reopen for Entry"** (from Needs Correction) → moves back to Data Entry.

---

## Salary Slips

**Path:** Cycle Detail page → **Salary Slips**

### All Employees View

A grid of salary-slip cards, one per employee in the cycle. Each card shows Establishment, Period, Emp No, Days Worked, Name, Designation, Dept/UAN/ESI No (when set), full Earnings and Deductions breakdown, **Net Pay**, Payment Date (when set), and a signature line. If wage data hasn't been entered yet, the card shows "No wage data entered yet." with a link to set wage defaults.

**Actions per card:** **View** (opens the full slip page) and **Print** (opens the slip in a new tab and triggers the print dialog immediately).

**"Print All"** (top of the page) prints every slip, two per A4 sheet; sidebar/navigation is hidden automatically.

### Individual Slip View

Full-page print-ready slip, rendered twice on one landscape A4 sheet, labeled **"Original"** and **"Duplicate (Photocopy)"**. Includes prev/next employee navigation, a **Print Slip** button, and signature lines for both Employee and Authorised Signatory.

---

## Print Forms

**Path:** Cycle Detail page → **Print** link on any form task row

Opens the statutory form as a print-ready page in a new tab (`?orientation=landscape|portrait`). Press **Ctrl+P** (Cmd+P on Mac) to print or save as PDF. Long registers are automatically paginated according to the [Settings](#settings) page's row-per-sheet limits.

### Available Forms

**Hospital (Clinical Establishments Act):**

| Form | Rule | Description |
|---|---|---|
| Form XI | 27(6) | Register of Employees |
| Form V | 27(5) | Register of Muster Roll (monthly attendance) |
| Form XII | 27(1) | Register of Wages |
| Form XVII | 32(9) | Wage Slips (per-employee cards, not paginated rows) |
| Form IV | 25(2) | Overtime Muster Roll cum Wages |
| Form I | 21(4) | Register of Fines |
| Form II | 21(4) | Register of Deductions |

**Shops & Establishments (all non-Hospital types):**

| Form | Rule | Description |
|---|---|---|
| Form U | 16(1) | Employee Register (single-card layout, not paginated) |
| Form V | 38(1)(a) | Register of Employment |
| Form W | 16(1) | Register of Wages |
| Form T | 11(6) | Wage Slips (per-employee cards, not paginated) |
| Form X | 16(1) | Leave & Social Security Benefits |

**Export History** — Sidebar → Exports (Output group) — lists the last 100 generated documents (DOCX/PDF) with Form, Establishment, Period, Version, Generated timestamp, file-availability badges, and a Print link back to the live view.

---

## Bulk Import & Export

**Path:** Employees list → **↥ Import** / **⭳ Export**

### Import

1. **Step 1 — Download Template** (`employee-import-template.xlsx`). Fill the **Action** column per row:

| Action | Emp ID | Name | Salary | What happens |
|---|---|---|---|---|
| ADD | optional (auto-generated if blank) | required | required | Creates a new employee |
| UPDATE | required | optional | optional | Updates only the non-blank fields |
| DELETE | required | — | — | Deletes if no cycle records exist; otherwise marks the employee **Exited** |

2. **Step 2 — Upload File**: choose the **Establishment**, pick a **File** (`.csv`, `.txt`, or `.xlsx`), then click **Upload & Apply**.
3. **Result**: counts of **Added**, **Updated**, **Deleted**, **Exited**, plus a list of any skipped rows with row numbers and error messages.

### Export

From the Employees list, click **⭳ Export** (enabled only once an **Establishment** filter is selected). Downloads an XLSX using the exact same column layout as the import template — Action pre-filled to `UPDATE` and Emp ID populated — so an exported file can be edited and re-imported directly for bulk changes.

---

## Calendar

**Path:** Sidebar → Calendar

A unified month-view calendar combining holidays, wage-cycle deadlines, form due-dates, employee join/exit milestones, and your own custom events. Navigate with Prev / Next / Today.

**Legend/event types:** Holiday, Wage cycle, Form due, Joined (employee join), Exit (employee exit), Event (custom).

Click any day (or **"+ Add Event"**) to open the **Add Calendar Event** dialog:

| Field | Notes |
|---|---|
| Title* | e.g. "ESI payment due" |
| Date* | |
| Time | Optional. |
| Recurring | One-time / Monthly / Yearly. |
| Remind days before | e.g. 14 — surfaces the event on the Dashboard's Reminders panel that many days ahead. |
| Establishment | Optional — scope the reminder to one establishment. |
| Notes | Free text. |

Click **Save Event**.

---

## Settings

**Path:** Sidebar → Settings

Controls print-register pagination globally.

| Field | Notes |
|---|---|
| Max employees per sheet | Default 20 if left blank. Values above the per-sheet ceiling are capped automatically so each printed sheet keeps its own header. |
| Min fill rows | Default 5 if left blank. Below this many employees, rows stretch to fill the whole page rather than leaving it half-empty. |

Click **Save** — a "Saved." confirmation appears.

---

## Audit Log

**Path:** Sidebar → Audit Log

A chronological log of every record change across the system. Filter by **entity type**. Each row shows **When** (timestamp), **Entity** (type + ID), **Action** (Created / Updated / Deleted), and a truncated **Detail** preview of the value that changed.

---

## Common Workflows

### Monthly Payroll Workflow

1. **Start of month:** Create a new Monthly Cycle for the establishment and month.
2. **During the month:** As employees take leave or work OT, open the cycle and update Attendance, Overtime, and Leave.
3. **End of month:** Open the Wages tab — wages are pre-populated from proration. Review and adjust if needed, then Save.
4. **Fines/Deductions:** Add any entries in those tabs.
5. **Print:** Print Form XII/W (Register of Wages), Form XVII/T (Wage Slips), and Form V (Muster Roll / Register of Employment) for the month.
6. **Salary Slips:** Go to Salary Slips → print individual slips for each employee.

### New Employee Mid-Month

1. Add the employee under the establishment.
2. Open the current monthly cycle → click **Sync Employees**.
3. The employee now appears in every tab; attendance defaults to P for remaining days.
4. Adjust Days Worked in the Attendance tab for the partial month — wages will prorate accordingly once saved.

### Employee Leaves the Organisation

1. Go to Employees → find the employee → Edit.
2. Set **Exit Date**, **Reason for Exit**, and change **Status** to Exited.
3. The employee will no longer be included in new cycles created after their exit date.

### Changing Wage Formula for Next Month

1. Go to the establishment's Edit page → **Wage Formula Configuration**.
2. Adjust the relevant field(s). Changes apply from the next cycle created — existing wage records already saved are not retroactively changed. To pull the new defaults into an already-created cycle, use **Sync Wages** on the cycle detail page.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Wages showing ₹0 for an employee | The employee's Monthly Wage Defaults are ₹0. Edit the employee, use Salary Setup + "Apply to wage defaults ↓" to fill Basic/DA/HRA/PF/ESI, then Save. |
| Gross wage looks lower than expected | Check the employee's Wage Days for the cycle — it should equal Worked + Leave + Holiday days, not just Worked + Leave. Paid holidays and weekly-offs count toward wages. |
| Employee missing from cycle | Employee was added after the cycle was created. Go to the cycle detail page → click **Sync Employees**. |
| Employee's wage record still shows old salary after editing their profile | Open the cycle detail page → click **Sync Wages** to refresh wage records from current employee defaults. |
| Cannot delete establishment | It still has active employees or cycles. Delete the cycles first, then the employees, then the establishment. |
| Attendance not saving | Make sure you clicked **Save Attendance** — changing cells alone doesn't persist them. |
| Government holiday not marking as H | The holiday must be added on the Holidays page *before* the form task is first opened. Existing attendance records are not automatically updated retroactively. |
| Import shows rows skipped | Read the per-row error messages in the result panel — commonly a missing required field for the chosen Action (see the Import table above), or a duplicate Emp ID. |
| Export link disabled | Select an Establishment filter on the Employees page first — Export requires exactly one establishment in scope. |
| Print shows sidebar/navigation | Use the page's own **Print** / **Print Slip** / **Print All** button rather than the browser's print shortcut on a non-print page. |

---

*This guide is also available in-app: Sidebar → Help.*
