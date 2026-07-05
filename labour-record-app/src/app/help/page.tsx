import { PageHeader } from '@/components/page-header'

type FieldRow = { field: string; notes: string }

function FieldTable({ rows }: { rows: FieldRow[] }) {
  return (
    <table className="w-full text-xs border-collapse my-3">
      <tbody>
        {rows.map((r) => (
          <tr key={r.field} className="border-b border-[#1a2332] align-top">
            <td className="py-1.5 pr-4 text-[#c8d8e8] font-medium whitespace-nowrap">{r.field}</td>
            <td className="py-1.5 text-[#8aa8c0]">{r.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Note({ kind = 'info', children }: { kind?: 'info' | 'warning'; children: React.ReactNode }) {
  const styles = kind === 'warning'
    ? 'bg-[#2a2010] border-[#5a4010] text-[#e0c080]'
    : 'bg-[#0f2040] border-[#1a3a6a] text-[#8ab8e0]'
  return (
    <div className={`rounded border p-3 text-xs my-3 ${styles}`}>
      {children}
    </div>
  )
}

function Section({
  id,
  title,
  path,
  defaultOpen = false,
  children,
}: {
  id: string
  title: string
  path?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details id={id} open={defaultOpen} className="border-b border-[#1e2d3d] scroll-mt-4">
      <summary className="cursor-pointer select-none px-6 py-3 text-sm font-semibold text-[#c8d8e8] hover:bg-[#0f1c2c] flex items-center justify-between">
        <span>{title}</span>
        {path && <span className="text-[10px] font-normal text-[#5a8ab8]">{path}</span>}
      </summary>
      <div className="px-6 pb-5 text-xs leading-relaxed text-[#a8c4d8] space-y-2">
        {children}
      </div>
    </details>
  )
}

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'first-time-setup', label: 'First-Time Setup Flow' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'establishments', label: 'Establishments' },
  { id: 'employees', label: 'Employees' },
  { id: 'holidays', label: 'Government Holidays' },
  { id: 'wage-formula', label: 'Wage Formula & Salary Simulator' },
  { id: 'cycles', label: 'Monthly Cycles' },
  { id: 'form-entry', label: 'Form Data Entry' },
  { id: 'salary-slips', label: 'Salary Slips' },
  { id: 'print-forms', label: 'Print Forms' },
  { id: 'bulk-import-export', label: 'Bulk Import & Export' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'settings', label: 'Settings' },
  { id: 'audit-log', label: 'Audit Log' },
  { id: 'workflows', label: 'Common Workflows' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]

export default function HelpPage() {
  return (
    <div>
      <PageHeader title="Help" subtitle="Mustearly User Guide — Tamil Nadu Labour Compliance Manager" />
      <div className="flex gap-6 p-6">
        <nav className="hidden lg:block w-56 shrink-0 sticky top-4 self-start">
          <p className="text-[10px] uppercase tracking-wider text-[#5a8ab8] mb-2 px-1">On this page</p>
          <ul className="space-y-0.5">
            {TOC.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block px-2 py-1 rounded text-[11px] text-[#7a9ab8] hover:bg-[#132E4A] hover:text-[#c8d8e8]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0 rounded border border-[#1e2d3d] bg-[#0a1520] overflow-hidden">
          <Section id="overview" title="Overview" defaultOpen>
            <p>
              Mustearly is a statutory compliance management tool for Tamil Nadu establishments. It generates
              all required government forms under the <strong className="text-[#c8d8e8]">Clinical Establishments Act</strong>{' '}
              (Hospital establishments — Form XI, V, XII, XVII, IV, I, II) and the{' '}
              <strong className="text-[#c8d8e8]">Tamil Nadu Shops &amp; Establishments Act</strong> (all other
              types — Form U, V, W, T, X).
            </p>
            <FieldTable
              rows={[
                { field: 'Shop', notes: 'DA ₹7,353/month · Shops & Establishments forms' },
                { field: 'Hospital', notes: 'DA ₹5,544/month · Clinical Establishments forms' },
                { field: 'Hotel', notes: 'DA ₹8,466/month · Shops & Establishments forms' },
                { field: 'Petrol Bunk', notes: 'DA ₹7,247/month · Shops & Establishments forms' },
                { field: 'Medical', notes: 'DA ₹7,970/month · Shops & Establishments forms' },
                { field: 'Oil Mill', notes: 'DA ₹8,950/month · Shops & Establishments forms' },
              ]}
            />
            <p>
              Only <strong className="text-[#c8d8e8]">Hospital</strong> uses the Clinical Establishments forms and the
              minimum-wages preset; every other type falls under the TN Shops &amp; Establishments Act. DA is a
              per-employee default and stays editable on each employee&rsquo;s Salary Setup.
            </p>
            <p>
              Mustearly tracks employees, monthly attendance, wages, overtime, leave, fines, and deductions — and
              prints every government-mandated register and salary slip from the same data.
            </p>
          </Section>

          <Section id="first-time-setup" title="First-Time Setup Flow">
            <ol className="list-decimal list-inside space-y-1">
              <li>Create an Establishment.</li>
              <li>Add Employees (linked to the establishment).</li>
              <li>Configure Government Holidays (optional — affects attendance defaults).</li>
              <li>Review/adjust the establishment&rsquo;s Wage Formula (optional — sensible defaults are pre-filled).</li>
              <li>Create a Monthly Cycle for a specific month/year.</li>
              <li>Open its Form Tasks → enter Attendance, Wages, OT, Leave, Fines, Deductions.</li>
              <li>Print / Export the statutory forms.</li>
            </ol>
          </Section>

          <Section id="dashboard" title="Dashboard" path="Sidebar → Dashboard">
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-[#c8d8e8]">Summary cards</strong> — Registered Firms, Total Employees, Monthly Cycles.</li>
              <li><strong className="text-[#c8d8e8]">Workload Panel</strong> — Form Task counts by status, plus an &ldquo;N open tasks&rdquo; total (every status except Exported).</li>
              <li><strong className="text-[#c8d8e8]">Reminders Panel</strong> — Calendar events due in the next two weeks or overdue, linking to the Calendar.</li>
              <li><strong className="text-[#c8d8e8]">Establishments panel</strong> — switchable Cards / Table / Rows / Directory views (your choice is remembered), showing name, type, address, employer/manager, reg. no., contact, processing fee, service start date, employee/cycle counts, and DA rate.</li>
            </ul>
          </Section>

          <Section id="establishments" title="Establishments" path="Sidebar → Establishments">
            <p>An establishment is a business registered under Tamil Nadu law. Everything else (employees, cycles, forms) belongs to an establishment.</p>
            <p className="text-[#c8d8e8] font-medium mt-3">Core Details</p>
            <FieldTable
              rows={[
                { field: 'Establishment Name*', notes: 'Legal registered name, e.g. "City General Hospital". Min 3 characters.' },
                { field: 'Address*', notes: 'Full registered address incl. city and pincode. Appears on all printed forms.' },
                { field: 'Employer Name*', notes: 'Owner/proprietor as per licence.' },
                { field: 'Manager / In-Charge*', notes: 'Person responsible. Appears on Form I, Form V etc.' },
                { field: 'Registration Certificate No.*', notes: 'Certificate no. under the applicable act, e.g. REG/TN/2024/1234. Min 3 characters.' },
                { field: 'Establishment Type*', notes: 'Shop, Hospital, Hotel, Petrol Bunk, Medical, or Oil Mill. Sets the forms family and default DA rate; also auto-sets the Wage Formula preset.' },
                { field: 'Working Days per Week*', notes: '7 (all days), 6 (Mon–Sat, Sunday off), or 5 (Mon–Fri, Sat+Sun off). Controls auto-marked Holiday (H) days. Govt holidays are always H regardless.' },
              ]}
            />
            <p className="text-[#c8d8e8] font-medium mt-3">Contact &amp; Billing</p>
            <FieldTable
              rows={[
                { field: 'Contact Phone', notes: 'Primary contact number.' },
                { field: 'Contact Email', notes: 'Primary contact email.' },
                { field: 'Processing Fee (₹/month)', notes: 'Your monthly service fee for this establishment.' },
                { field: 'Service Start Date', notes: 'The date you started servicing this establishment.' },
              ]}
            />
            <p>See <a href="#wage-formula" className="text-[#4a9eff] hover:underline">Wage Formula &amp; Salary Simulator</a> for the Wage Formula Configuration fields.</p>
            <p className="mt-3"><strong className="text-[#c8d8e8]">Editing:</strong> click Edit next to an establishment — all fields are editable, plus an Active checkbox to deactivate without deleting.</p>
            <p><strong className="text-[#c8d8e8]">Deleting:</strong> blocked if the establishment still has employees or monthly cycles — remove those first.</p>
          </Section>

          <Section id="employees" title="Employees" path="Sidebar → Employees">
            <p>Employees are always linked to one establishment, set at creation and locked thereafter.</p>

            <p className="text-[#c8d8e8] font-medium mt-3">Basic Details</p>
            <FieldTable
              rows={[
                { field: 'Employee ID', notes: 'Unique within the establishment, e.g. EMP001. Leave blank to auto-generate.' },
                { field: 'Full Name*', notes: 'As per official records. Min 2 characters.' },
                { field: 'Sex', notes: 'M / F. Used in statutory registers.' },
                { field: 'Father / Spouse Name', notes: 'Required for Form I and PF nomination.' },
                { field: 'Date of Birth', notes: 'Employee must be at least 14 years old.' },
                { field: 'Date of Entry', notes: 'Drives tenure, earned leave, and the 480-days milestone.' },
                { field: 'Designation / Department', notes: 'Job title; Department is optional.' },
              ]}
            />

            <p className="text-[#c8d8e8] font-medium mt-3">Addresses, Statutory IDs, Bank Details, Contact</p>
            <FieldTable
              rows={[
                { field: 'Present / Permanent Address', notes: 'Used in the Form I register.' },
                { field: 'EPF UAN', notes: '12-digit Universal Account Number.' },
                { field: 'ESI No.', notes: '17-digit ESI insurance number.' },
                { field: 'Aadhaar No.', notes: '12-digit, masked in the UI, stored encrypted.' },
                { field: 'Payment Mode', notes: 'Bank Transfer or Cash — Cash clears/disables the bank fields.' },
                { field: 'Bank Account No. / IFSC / Bank Name', notes: 'IFSC format: 4 letters + 0 + 6 alphanumeric, e.g. SBIN0001234.' },
                { field: 'Mobile', notes: 'Exactly 10 digits.' },
              ]}
            />

            <p className="text-[#c8d8e8] font-medium mt-3">Service &amp; Exit Details</p>
            <FieldTable
              rows={[
                { field: '480 Days Completion', notes: 'Entitles the employee to earned leave under the TN Shops Act.' },
                { field: 'Date Made Permanent', notes: 'Confirmation/regularisation date.' },
                { field: 'Period of Suspension', notes: 'Free text.' },
                { field: 'Status / Exit Date / Reason for Exit', notes: 'Shown when editing. Reason is required whenever Exit Date is set.' },
              ]}
            />

            <p className="text-[#c8d8e8] font-medium mt-3">Salary Setup &amp; Monthly Wage Defaults</p>
            <p>See <a href="#wage-formula" className="text-[#4a9eff] hover:underline">Wage Formula &amp; Salary Simulator</a> for the full Salary Setup + Live Preview fields.</p>
            <FieldTable
              rows={[
                { field: 'Basic / DA / HRA (₹)', notes: 'Monthly wage components used to prorate wages each cycle.' },
                { field: 'PF / ESI / LWF (₹)', notes: 'Monthly deductions — typically 12% of Basic, 0.75% of gross, and the TN LWF rate respectively.' },
              ]}
            />
            <Note kind="warning">
              If Monthly Wage Defaults are left at ₹0, the Wages tab in every monthly cycle shows ₹0 for that
              employee. Use <strong>&ldquo;Apply to wage defaults ↓&rdquo;</strong> in Salary Setup to fill these
              correctly.
            </Note>

            <p className="text-[#c8d8e8] font-medium mt-3">Validation rules</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Name ≥ 2 characters; employee must be ≥ 14 years old.</li>
              <li>Date of Entry cannot be before Date of Birth; Exit Date cannot be before Date of Entry.</li>
              <li>Reason for Exit required whenever Exit Date is set.</li>
              <li>Mobile = 10 digits, UAN = 12 digits, IFSC = 4 letters + 0 + 6 alphanumeric.</li>
              <li>Wage amounts cannot be negative; Basic wage capped at ₹2,00,000.</li>
            </ul>

            <p className="mt-3"><strong className="text-[#c8d8e8]">Filtering &amp; searching:</strong> the Employees list has a live Search (name/ID, 300ms debounce), an Establishment filter, and a Status filter (Active/Exited/Suspended, defaults to Active).</p>
          </Section>

          <Section id="holidays" title="Government Holidays" path="Sidebar → Holidays">
            <p>Government holidays affect two things: attendance defaults (auto-marked <code>H</code> when a form task first opens) and double wages (an employee who works <code>P</code> on a holiday earns double).</p>
            <FieldTable
              rows={[
                { field: 'Year', notes: 'Selects which year&rsquo;s holiday list to view/edit.' },
                { field: 'Date*', notes: 'The official holiday date. Year is validated 2000–9999.' },
                { field: 'Holiday Name*', notes: 'Official name as notified, e.g. Pongal, Republic Day. Min 3 characters.' },
                { field: '"Load default holidays"', notes: 'Auto-populates the standard set of double-wage holidays for the selected year.' },
              ]}
            />
            <p>The table shows #, Date, Day (auto-computed), Holiday Name, a Double Wage badge, and a Delete action. Deleting a holiday does not retroactively update attendance already saved.</p>
          </Section>

          <Section id="wage-formula" title="Wage Formula & Salary Simulator">
            <p>There is no separate &ldquo;Wage Rules&rdquo; page — wage-formula configuration and the salary simulator live in two places:</p>

            <p className="text-[#c8d8e8] font-medium mt-3">1. Establishment → Wage Formula Configuration</p>
            <FieldTable
              rows={[
                { field: 'Preset', notes: 'Read-only, auto-set from Establishment Type.' },
                { field: 'Fixed Allowance (₹)', notes: 'Hospital only — additional fixed monthly allowance beyond Basic+DA, capped at ₹50,000.' },
                { field: 'HRA (₹)', notes: 'Non-Hospital only — firm-wide default HRA.' },
                { field: 'LWF Rate (₹/month)', notes: 'TN rate: ₹0.25 employee + ₹0.75 employer. Flagged above 100.' },
                { field: 'ESI Applicable', notes: 'Tick if any employee earns ≤ ₹21,000/month gross.' },
                { field: 'LWF Applicable', notes: 'Usually checked — applies to all TN establishments by default.' },
              ]}
            />

            <p className="text-[#c8d8e8] font-medium mt-3">2. Employee → Salary Setup + Live Breakdown Preview</p>
            <p>This is the app&rsquo;s real-time salary-slip simulator — every field recalculates the preview instantly as you type, before anything is saved.</p>
            <FieldTable
              rows={[
                { field: 'Default Total Salary (₹)*', notes: 'Monthly gross target (Basic + DA + HRA + Other). Basic is the remainder.' },
                { field: 'DA (₹)', notes: 'Defaults to the firm rate; the ↺ button resets it back.' },
                { field: 'HRA / Other Allowances (₹)', notes: 'Editable; part of the gross, reduces Basic.' },
                { field: 'Overtime / Double Wages (₹)', notes: 'Extra earnings on top of gross; not part of Basic.' },
                { field: 'PF Mode', notes: 'PERCENT (12% of Basic+DA capped at the wage ceiling), FIXED, or NONE.' },
                { field: 'ESI Applicable', notes: 'ESI = employee % of gross wages, only when gross ≤ threshold. Default 0.75% / ₹21,000, both editable.' },
              ]}
            />
            <p>The <strong className="text-[#c8d8e8]">Live Breakdown Preview</strong> shows Basic, DA, HRA, Other, Overtime, PF, ESI, LWF, then Gross, Deductions, and Net Pay. Click <strong className="text-[#c8d8e8]">&ldquo;Apply to wage defaults ↓&rdquo;</strong> to copy the preview straight into Monthly Wage Defaults.</p>
          </Section>

          <Section id="cycles" title="Monthly Cycles" path="Sidebar → Monthly Cycles">
            <p>A monthly cycle is one payroll period for one establishment, holding all attendance, wage, leave, OT, fines, and deduction data for that month.</p>
            <FieldTable
              rows={[
                { field: 'Establishment*', notes: 'All active employees of this establishment will be included.' },
                { field: 'Month* / Year*', notes: 'Year must be 2000–9999.' },
                { field: 'Wage Period Days', notes: 'Default 26 (6-day week: 4 Saturdays + 22 weekdays). Use 27 for a 5-Saturday month. Range 1–31.' },
              ]}
            />
            <p>On creation, the cycle snapshots currently active employees and creates every required form task for that establishment&rsquo;s type.</p>
            <p className="text-[#c8d8e8] font-medium mt-3">Cycle Detail Page</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Form Tasks</strong> — one row per statutory form, with Open / Print / Slips / Export actions.</li>
              <li><strong>Employees in this Cycle</strong> — with a <strong>Sync Employees</strong> button (pulls in employees added after cycle creation) and a <strong>Sync Wages</strong> button (refreshes wage records from current employee defaults).</li>
              <li><strong>Salary Slips</strong> shortcut.</li>
            </ul>
            <FieldTable
              rows={[
                { field: 'NOT STARTED', notes: 'No data entered yet.' },
                { field: 'DATA ENTRY', notes: 'Data is being entered.' },
                { field: 'READY FOR REVIEW', notes: 'Entry complete, awaiting approval.' },
                { field: 'NEEDS CORRECTION', notes: 'Reviewer flagged corrections.' },
                { field: 'APPROVED', notes: 'Approved, ready to export.' },
                { field: 'EXPORTED', notes: 'Document generated.' },
              ]}
            />
            <Note kind="warning">Deleting a cycle permanently removes all its data (attendance, wages, leave, OT, fines, deductions, generated documents). This cannot be undone.</Note>
          </Section>

          <Section id="form-entry" title="Form Data Entry" path="Cycle Detail → Open a form task">
            <p className="text-[#c8d8e8] font-medium">Attendance Tab</p>
            <p>Click a cell to cycle through <code>&#39;&#39; → P → A → L → H → OT → &#39;&#39;</code>.</p>
            <FieldTable
              rows={[
                { field: 'P', notes: 'Present' },
                { field: 'A', notes: 'Absent (no pay)' },
                { field: 'L', notes: 'Leave (paid)' },
                { field: 'H', notes: 'Holiday / Weekly Off (paid)' },
                { field: 'OT', notes: 'Overtime day' },
                { field: 'P on a govt holiday', notes: 'Present on a holiday — earns double wages' },
              ]}
            />
            <p>Totals: <strong>Wkd</strong> = P+OT, <strong>Lv</strong> = leave days, <strong>Ab</strong> = absent days, <strong>Wage</strong> = worked + leave + holiday days (used to prorate wages — paid holidays count).</p>
            <p>&ldquo;Apply Defaults&rdquo; fills any still-blank cells; click <strong>Save Attendance</strong> to persist.</p>

            <p className="text-[#c8d8e8] font-medium mt-4">Wage Data Tab</p>
            <pre className="bg-[#050d16] border border-[#1a2332] rounded p-3 text-[11px] text-[#8ab8e0] overflow-x-auto">
{`Wage Days      = Days Worked + Leave Days + Holiday Days
Prorated Basic = Monthly Basic × Wage Days ÷ Days in Month
Prorated DA    = Monthly DA    × Wage Days ÷ Days in Month
Gross Wages    = Basic + DA + Fixed Allowance + Holiday Bonus + OT Earnings
PF             = 12% of Prorated Basic
ESI            = 0.75% of Prorated Gross Wages
Net            = Gross − (PF + ESI + LWF + Advance + Fines + Other Deductions)`}
            </pre>
            <p>Override per employee: Basic, DA, HRA/Other, PF, ESI, LWF, Advance Recovered, Fine Deduction, Payment Date, Receipt Reference. Click <strong>Save Wage Data</strong>.</p>

            <p className="text-[#c8d8e8] font-medium mt-4">Overtime Tab</p>
            <p>Enter daily OT hours (0–24, half-hour steps) per employee; OT Rate and Normal Earn are editable, OT Earn and Total are computed. Click <strong>Save Overtime</strong>.</p>

            <p className="text-[#c8d8e8] font-medium mt-4">Fines Tab</p>
            <p>Select Employee*, enter Offence Date*, Description*, Fine Amount, then <strong>Add Fine</strong>. Populates Form I — Register of Fines.</p>

            <p className="text-[#c8d8e8] font-medium mt-4">Deductions Tab</p>
            <p>Select Employee*, enter Damage Date*, Description*, Deduction Amount, then <strong>Add Deduction</strong>. Populates Form II — Register of Deductions.</p>

            <p className="text-[#c8d8e8] font-medium mt-4">Leave Tab</p>
            <p>EL Open, EL Earned, EL Availed, EL Closing (auto = max(0, Open+Earned−Availed)), Medical, Other. Click <strong>Save Leave Data</strong>.</p>

            <p className="text-[#c8d8e8] font-medium mt-4">Workflow Toolbar</p>
            <p>&ldquo;Start Entry&rdquo; (Not Started → Data Entry), &ldquo;Move to Review&rdquo; (Data Entry → Ready for Review), &ldquo;Reopen for Entry&rdquo; (Needs Correction → Data Entry).</p>
          </Section>

          <Section id="salary-slips" title="Salary Slips" path="Cycle Detail → Salary Slips">
            <p><strong className="text-[#c8d8e8]">All Employees View:</strong> a card grid, one per employee, showing Establishment/Period/Emp No/Days Worked/Name/Designation, full Earnings and Deductions breakdown, Net Pay, and a signature line. <strong>View</strong> opens the full slip; <strong>Print</strong> opens it in a new tab and triggers print immediately. <strong>&ldquo;Print All&rdquo;</strong> prints every slip, two per A4 sheet.</p>
            <p><strong className="text-[#c8d8e8]">Individual Slip View:</strong> full-page slip rendered twice on one landscape sheet — labeled &ldquo;Original&rdquo; and &ldquo;Duplicate (Photocopy)&rdquo; — with prev/next navigation and both Employee and Authorised Signatory signature lines.</p>
          </Section>

          <Section id="print-forms" title="Print Forms" path="Cycle Detail → Print link on any form task">
            <p>Opens the statutory form as a print-ready page. Press Ctrl+P (Cmd+P on Mac) to print or save as PDF.</p>
            <p className="text-[#c8d8e8] font-medium mt-3">Hospital (Clinical Establishments Act)</p>
            <FieldTable
              rows={[
                { field: 'Form XI — Rule 27(6)', notes: 'Register of Employees' },
                { field: 'Form V — Rule 27(5)', notes: 'Register of Muster Roll' },
                { field: 'Form XII — Rule 27(1)', notes: 'Register of Wages' },
                { field: 'Form XVII — Rule 32(9)', notes: 'Wage Slips (per-employee cards)' },
                { field: 'Form IV — Rule 25(2)', notes: 'Overtime Muster Roll cum Wages' },
                { field: 'Form I — Rule 21(4)', notes: 'Register of Fines' },
                { field: 'Form II — Rule 21(4)', notes: 'Register of Deductions' },
              ]}
            />
            <p className="text-[#c8d8e8] font-medium mt-3">Shops & Establishments (all non-Hospital types)</p>
            <FieldTable
              rows={[
                { field: 'Form U — Rule 16(1)', notes: 'Employee Register' },
                { field: 'Form V — Rule 38(1)(a)', notes: 'Register of Employment' },
                { field: 'Form W — Rule 16(1)', notes: 'Register of Wages' },
                { field: 'Form T — Rule 11(6)', notes: 'Wage Slips (per-employee cards)' },
                { field: 'Form X — Rule 16(1)', notes: 'Leave & Social Security Benefits' },
              ]}
            />
            <p>The <strong className="text-[#c8d8e8]">Exports</strong> page (Sidebar → Exports) lists the last 100 generated documents with file-availability badges and a link back to the live print view.</p>
          </Section>

          <Section id="bulk-import-export" title="Bulk Import & Export" path="Employees list → Import / Export">
            <p className="text-[#c8d8e8] font-medium">Import</p>
            <FieldTable
              rows={[
                { field: 'ADD', notes: 'Emp ID optional (auto-generated), Name and Salary required — creates a new employee.' },
                { field: 'UPDATE', notes: 'Emp ID required, other fields optional — updates only non-blank fields.' },
                { field: 'DELETE', notes: 'Emp ID required — deletes if no cycle records exist, otherwise marks Exited.' },
              ]}
            />
            <p>Download the template, fill the Action column, then upload the file (.csv/.txt/.xlsx) against an Establishment. The result shows Added/Updated/Deleted/Exited counts plus per-row error messages for skipped rows.</p>
            <p className="text-[#c8d8e8] font-medium mt-3">Export</p>
            <p>Available once an Establishment filter is selected on the Employees list. Downloads an XLSX in the exact same layout as the import template (Action pre-filled UPDATE, Emp ID populated) so it can be edited and re-imported directly.</p>
          </Section>

          <Section id="calendar" title="Calendar" path="Sidebar → Calendar">
            <p>A unified month view combining holidays, wage-cycle deadlines, form due-dates, employee join/exit milestones, and custom events.</p>
            <FieldTable
              rows={[
                { field: 'Title*', notes: 'e.g. "ESI payment due"' },
                { field: 'Date*', notes: '' },
                { field: 'Time', notes: 'Optional.' },
                { field: 'Recurring', notes: 'One-time / Monthly / Yearly.' },
                { field: 'Remind days before', notes: 'Surfaces the event on the Dashboard Reminders panel that many days ahead.' },
                { field: 'Establishment', notes: 'Optional — scopes the reminder to one establishment.' },
                { field: 'Notes', notes: 'Free text.' },
              ]}
            />
          </Section>

          <Section id="settings" title="Settings" path="Sidebar → Settings">
            <p>Controls print-register pagination globally.</p>
            <FieldTable
              rows={[
                { field: 'Max employees per sheet', notes: 'Default 20 if blank. Capped at the per-sheet ceiling so each printed sheet keeps its own header.' },
                { field: 'Min fill rows', notes: 'Default 5 if blank. Below this many employees, rows stretch to fill the whole page.' },
              ]}
            />
          </Section>

          <Section id="audit-log" title="Audit Log" path="Sidebar → Audit Log">
            <p>A chronological log of every record change across the system. Filter by entity type. Each row shows When (timestamp), Entity (type + ID), Action (Created/Updated/Deleted), and a truncated Detail preview of the changed value.</p>
          </Section>

          <Section id="workflows" title="Common Workflows">
            <p className="text-[#c8d8e8] font-medium">Monthly Payroll Workflow</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a new Monthly Cycle for the establishment and month.</li>
              <li>During the month, update Attendance, Overtime, and Leave as needed.</li>
              <li>End of month: review the pre-populated Wages tab, adjust, and Save.</li>
              <li>Add any Fines/Deductions entries.</li>
              <li>Print Form XII/W, Form XVII/T, and Form V for the month.</li>
              <li>Print individual Salary Slips for each employee.</li>
            </ol>
            <p className="text-[#c8d8e8] font-medium mt-3">New Employee Mid-Month</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Add the employee under the establishment.</li>
              <li>Open the current cycle → click Sync Employees.</li>
              <li>Adjust Days Worked in Attendance for the partial month — wages prorate accordingly on Save.</li>
            </ol>
            <p className="text-[#c8d8e8] font-medium mt-3">Employee Leaves the Organisation</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Edit the employee — set Exit Date, Reason for Exit, and Status = Exited.</li>
              <li>They&rsquo;re excluded from new cycles created after their exit date.</li>
            </ol>
            <p className="text-[#c8d8e8] font-medium mt-3">Changing Wage Formula for Next Month</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Edit the establishment&rsquo;s Wage Formula Configuration.</li>
              <li>Changes apply from the next cycle created. Use Sync Wages on an already-created cycle to pull in the new defaults.</li>
            </ol>
          </Section>

          <Section id="troubleshooting" title="Troubleshooting">
            <FieldTable
              rows={[
                { field: 'Wages showing ₹0', notes: 'Monthly Wage Defaults are ₹0 — use "Apply to wage defaults ↓" on the employee, then Save.' },
                { field: 'Gross wage lower than expected', notes: 'Check Wage Days = Worked + Leave + Holiday days — paid holidays and weekly-offs count toward wages.' },
                { field: 'Employee missing from cycle', notes: 'Added after cycle creation — use Sync Employees on the cycle detail page.' },
                { field: 'Wage record shows stale salary', notes: 'Use Sync Wages on the cycle detail page to refresh from current employee defaults.' },
                { field: 'Cannot delete establishment', notes: 'It still has employees or cycles — remove those first.' },
                { field: 'Attendance not saving', notes: 'Click Save Attendance — changing cells alone doesn’t persist them.' },
                { field: 'Holiday not marking as H', notes: 'Add the holiday before the form task is first opened; existing attendance isn’t retroactively updated.' },
                { field: 'Import rows skipped', notes: 'Check the per-row error messages — usually a missing required field for the chosen Action, or a duplicate Emp ID.' },
                { field: 'Export link disabled', notes: 'Select an Establishment filter on the Employees page first.' },
                { field: 'Print shows sidebar/navigation', notes: 'Use the page’s own Print/Print Slip/Print All button, not the browser’s print shortcut on a non-print page.' },
              ]}
            />
          </Section>
        </div>
      </div>
    </div>
  )
}
