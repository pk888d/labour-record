'use client'
import { useMemo, useState } from 'react'
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
  return <div className={`rounded border p-3 text-xs my-3 ${styles}`}>{children}</div>
}

function Example({ title = 'Example', children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[#1a3a2a] bg-[#0a1f16] p-3 text-xs my-3">
      <p className="text-[10px] uppercase tracking-wider text-[#40c070] font-semibold mb-1.5">{title}</p>
      <div className="text-[#9ac4a8]">{children}</div>
    </div>
  )
}

function UseCase({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-[#2a2a4a] bg-[#100f24] p-3 text-xs my-3">
      <p className="text-[10px] uppercase tracking-wider text-[#8a8ae0] font-semibold mb-1.5">Use Case</p>
      <div className="text-[#b0aee0]">{children}</div>
    </div>
  )
}

function Shot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block my-3 group">
      <div className="rounded border border-[#1e2d3d] overflow-hidden bg-[#050d16]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-auto block group-hover:opacity-90 transition-opacity" />
      </div>
      {caption && <p className="text-[10px] text-[#4a6a8a] mt-1">{caption} — click to view full size</p>}
    </a>
  )
}

type SectionDef = {
  id: string
  title: string
  path?: string
  keywords: string
  body: React.ReactNode
}

const SECTIONS: SectionDef[] = [
  {
    id: 'overview',
    title: 'Overview',
    keywords: 'overview mustearly tamil nadu labour compliance shop hospital hotel petrol bunk medical oil mill clinical establishments act shops establishments act da rate dearness allowance tech sakthi',
    body: (
      <>
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
        <Example>
          A hospital called &ldquo;DNV Orthocare&rdquo; is set up as Establishment Type = Hospital. Its employees
          default to DA ₹5,544/month, and every monthly cycle automatically creates Form XI, V, XII, XVII, IV, I,
          and II tasks — the Clinical Establishments set. A neighbouring pharmacy set up as Establishment Type =
          Medical instead gets Form U, V, W, T, X — the Shops &amp; Establishments set — with DA defaulting to
          ₹7,970/month.
        </Example>
        <UseCase>
          You manage payroll compliance for several small clients (a hospital, a shop, a hotel) from one place
          instead of juggling separate spreadsheets and manually tracking which government forms each one owes —
          Mustearly picks the right form set automatically from the Establishment Type.
        </UseCase>
        <Shot src="/help/dashboard.png" alt="Mustearly dashboard" caption="Dashboard — the home screen after logging in" />
      </>
    ),
  },
  {
    id: 'first-time-setup',
    title: 'First-Time Setup Flow',
    keywords: 'first time setup flow getting started onboarding new install',
    body: (
      <ol className="list-decimal list-inside space-y-1">
        <li>Create an Establishment.</li>
        <li>Add Employees (linked to the establishment).</li>
        <li>Configure Government Holidays (optional — affects attendance defaults).</li>
        <li>Review/adjust the establishment&rsquo;s Wage Formula (optional — sensible defaults are pre-filled).</li>
        <li>Create a Monthly Cycle for a specific month/year.</li>
        <li>Open its Form Tasks → enter Attendance, Wages, OT, Leave, Fines, Deductions.</li>
        <li>Print / Export the statutory forms.</li>
      </ol>
    ),
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: 'Sidebar → Dashboard',
    keywords: 'dashboard summary cards registered firms total employees monthly cycles workload panel reminders panel establishments panel cards table rows directory view',
    body: (
      <>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-[#c8d8e8]">Summary cards</strong> — Registered Firms, Total Employees, Monthly Cycles.</li>
          <li><strong className="text-[#c8d8e8]">Workload Panel</strong> — Form Task counts by status, plus an &ldquo;N open tasks&rdquo; total (every status except Exported).</li>
          <li><strong className="text-[#c8d8e8]">Reminders Panel</strong> — Calendar events due in the next two weeks or overdue, linking to the Calendar.</li>
          <li><strong className="text-[#c8d8e8]">Establishments panel</strong> — switchable Cards / Table / Rows / Directory views (your choice is remembered), showing name, type, address, employer/manager, reg. no., contact, processing fee, service start date, employee/cycle counts, and DA rate.</li>
        </ul>
        <Shot src="/help/dashboard.png" alt="Dashboard summary cards and workload panel" />
        <UseCase>
          Monday morning: open the Dashboard first to see &ldquo;21 open tasks&rdquo; across all your establishments,
          and check the Reminders panel for anything overdue (like an ESI payment due date) before it&rsquo;s missed.
        </UseCase>
      </>
    ),
  },
  {
    id: 'establishments',
    title: 'Establishments',
    path: 'Sidebar → Establishments',
    keywords: 'establishment name address employer manager registration certificate establishment type working days per week contact phone email processing fee service start date active delete edit create',
    body: (
      <>
        <p>An establishment is a business registered under Tamil Nadu law. Everything else (employees, cycles, forms) belongs to an establishment.</p>
        <Shot src="/help/establishments-list.png" alt="Establishments list page" />
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
        <Shot src="/help/establishment-form.png" alt="Establishment edit form showing Core Details, Contact & Billing, and Wage Formula Configuration" caption="Establishment edit page — DNV Orthocare (Hospital)" />
        <Example>
          Setting up a hotel: Establishment Name = &ldquo;Sea View Residency&rdquo;, Type = Hotel (auto-fills DA
          ₹8,466), Working Days per Week = 6 days — Sundays now auto-mark as Holiday (H) in every attendance grid
          for this establishment&rsquo;s cycles.
        </Example>
        <p>See <a href="#wage-formula" className="text-[#4a9eff] hover:underline">Wage Formula &amp; Salary Simulator</a> for the Wage Formula Configuration fields.</p>
        <p className="mt-3"><strong className="text-[#c8d8e8]">Editing:</strong> click Edit next to an establishment — all fields are editable, plus an Active checkbox to deactivate without deleting.</p>
        <p><strong className="text-[#c8d8e8]">Deleting:</strong> blocked if the establishment still has employees or monthly cycles — remove those first.</p>
      </>
    ),
  },
  {
    id: 'employees',
    title: 'Employees',
    path: 'Sidebar → Employees',
    keywords: 'employee id full name sex father spouse date of birth date of entry designation department present address permanent address epf uan esi no aadhaar bank account ifsc bank name payment mode mobile email 480 days made permanent suspension exit reason status active exited suspended basic da hra pf lwf salary defaults search filter',
    body: (
      <>
        <p>Employees are always linked to one establishment, set at creation and locked thereafter.</p>
        <Shot src="/help/employees-list.png" alt="Employees list filtered by establishment, with search, status filter, and Import/Export links" />

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
        <Shot src="/help/employee-form.png" alt="Employee edit form — Alagurani, showing Salary Setup, Live Breakdown Preview, and Monthly Wage Defaults" caption="Employee edit page — full field set" />
        <Note kind="warning">
          If Monthly Wage Defaults are left at ₹0, the Wages tab in every monthly cycle shows ₹0 for that
          employee. Use <strong>&ldquo;Apply to wage defaults ↓&rdquo;</strong> in Salary Setup to fill these
          correctly.
        </Note>
        <Example>
          Alagurani&rsquo;s Default Total Salary is set to ₹40,000 with DA ₹2,544 and PF Mode = Fixed ₹1,800. The
          Live Breakdown Preview instantly shows Basic ₹37,456, Gross ₹40,000, Deductions ₹1,810, Net Pay
          ₹38,190 — clicking &ldquo;Apply to wage defaults ↓&rdquo; copies Basic/DA/PF straight into Monthly Wage
          Defaults so every future cycle prorates correctly.
        </Example>

        <p className="text-[#c8d8e8] font-medium mt-3">Validation rules</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Name ≥ 2 characters; employee must be ≥ 14 years old.</li>
          <li>Date of Entry cannot be before Date of Birth; Exit Date cannot be before Date of Entry.</li>
          <li>Reason for Exit required whenever Exit Date is set.</li>
          <li>Mobile = 10 digits, UAN = 12 digits, IFSC = 4 letters + 0 + 6 alphanumeric.</li>
          <li>Wage amounts cannot be negative; Basic wage capped at ₹2,00,000.</li>
        </ul>

        <p className="mt-3"><strong className="text-[#c8d8e8]">Filtering &amp; searching:</strong> the Employees list has a live Search (name/ID, 300ms debounce), an Establishment filter, and a Status filter (Active/Exited/Suspended, defaults to Active).</p>
        <UseCase>
          You have 40 employees across 3 establishments and need to find one quickly before a payroll deadline —
          filter by Establishment, then type the first few letters of their name in Search; the list updates as
          you type, no need to click a Search button.
        </UseCase>
      </>
    ),
  },
  {
    id: 'holidays',
    title: 'Government Holidays',
    path: 'Sidebar → Holidays',
    keywords: 'government holidays holiday date name double wage load default holidays year attendance auto mark H paid pongal republic day christmas',
    body: (
      <>
        <p>Government holidays affect two things: attendance defaults (auto-marked <code>H</code> when a form task first opens) and double wages (an employee who works <code>P</code> on a holiday earns double).</p>
        <FieldTable
          rows={[
            { field: 'Year', notes: 'Selects which year&rsquo;s holiday list to view/edit.' },
            { field: 'Date*', notes: 'The official holiday date. Year is validated 2000–9999.' },
            { field: 'Holiday Name*', notes: 'Official name as notified, e.g. Pongal, Republic Day. Min 3 characters.' },
            { field: '"Load default holidays"', notes: 'Auto-populates the standard set of double-wage holidays for the selected year.' },
          ]}
        />
        <Shot src="/help/holidays.png" alt="Government Holidays page with Year selector, Add Holiday form, and holidays table" />
        <p>The table shows #, Date, Day (auto-computed), Holiday Name, a Double Wage badge, and a Delete action. Deleting a holiday does not retroactively update attendance already saved.</p>
        <Example>
          You add &ldquo;Pongal&rdquo; on 2026-01-14. The next time anyone opens a form task for a January 2026
          cycle, that date auto-fills as <code>H</code> in the attendance grid. If Alagurani is marked{' '}
          <code>P</code> on that date instead (she came in to work), she automatically earns double wages for
          that day.
        </Example>
        <UseCase>
          Before starting a new financial year, click &ldquo;Load default holidays&rdquo; for the upcoming year
          instead of typing in all 15+ TN government holidays by hand.
        </UseCase>
      </>
    ),
  },
  {
    id: 'wage-formula',
    title: 'Wage Formula & Salary Simulator',
    keywords: 'wage rules wage formula configuration preset fixed allowance hra lwf rate esi applicable lwf applicable salary setup live breakdown preview default total salary da reset pf mode percent fixed none esi percent threshold apply to wage defaults simulator gross net deductions',
    body: (
      <>
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
        <Shot src="/help/employee-form.png" alt="Salary Setup and Live Breakdown Preview inside the employee form" caption="Scroll to the Salary Setup section on any employee's edit page" />
        <Example>
          Default Total Salary ₹15,000, DA ₹5,544, ESI Applicable checked (0.75% / ₹21,000 threshold) → since
          ₹15,000 ≤ ₹21,000, the preview shows ESI = ₹112.50 (0.75% of gross). Raise Default Total Salary to
          ₹25,000 and ESI drops to ₹0 in the preview — it&rsquo;s above the threshold.
        </Example>
        <UseCase>
          An employee asks why their ESI deduction changed after a raise — open their profile, use the Live
          Breakdown Preview to show them exactly how crossing the ₹21,000 gross threshold removes the ESI
          deduction, without touching their actual saved wage record.
        </UseCase>
      </>
    ),
  },
  {
    id: 'cycles',
    title: 'Monthly Cycles',
    path: 'Sidebar → Monthly Cycles',
    keywords: 'monthly cycle establishment month year wage period days create cycle detail form tasks sync employees sync wages salary slips status not started data entry ready for review needs correction approved exported delete cycle',
    body: (
      <>
        <p>A monthly cycle is one payroll period for one establishment, holding all attendance, wage, leave, OT, fines, and deduction data for that month.</p>
        <Shot src="/help/cycle-new.png" alt="New Monthly Cycle form" caption="Create Cycle form" />
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
        <Shot src="/help/cycle-detail.png" alt="Cycle detail page showing Form Tasks and Employees in this Cycle" />
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
        <Example>
          Creating a July 2026 cycle for DNV Orthocare (a Hospital) instantly creates 7 form tasks — Form XI, V,
          XII, XVII, IV, I, II — all starting at NOT STARTED, and snapshots its 9 currently-active employees into
          the cycle.
        </Example>
        <UseCase>
          Mid-month, two new nurses join DNV Orthocare. Instead of recreating the cycle, open its detail page and
          click <strong>Sync Employees</strong> — they now appear in every tab, ready for their partial-month
          attendance and wages.
        </UseCase>
      </>
    ),
  },
  {
    id: 'form-entry',
    title: 'Form Data Entry',
    path: 'Cycle Detail → Open a form task',
    keywords: 'attendance tab wage data tab overtime tab fines tab deductions tab leave tab present absent leave holiday weekly off overtime day wage days apply defaults save attendance prorated basic da gross pf esi net offence date fine deduction damage EL opening earned availed closing medical start entry move to review reopen for entry',
    body: (
      <>
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
        <Shot src="/help/form-attendance.png" alt="Attendance tab with the daily grid, legend, and per-employee totals" />
        <p>Totals: <strong>Wkd</strong> = P+OT, <strong>Lv</strong> = leave days, <strong>Ab</strong> = absent days, <strong>Wage</strong> = worked + leave + holiday days (used to prorate wages — paid holidays count).</p>
        <p>&ldquo;Apply Defaults&rdquo; fills any still-blank cells; click <strong>Save Attendance</strong> to persist.</p>
        <Example>
          Aruljoslinraj has 27 P days, 4 H days (weekly offs), and 0 L/A in a 31-day July. Wage = 27+0+4 = 31 —
          he&rsquo;s paid for the full month even though he only physically worked 27 days, because weekly-offs
          are paid days.
        </Example>

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
        <Shot src="/help/form-wage-data.png" alt="Wage Data tab showing per-employee Days, Basic, DA, Gross, PF, ESI, LWF, Net" />
        <p>Override per employee: Basic, DA, HRA/Other, PF, ESI, LWF, Advance Recovered, Fine Deduction, Payment Date, Receipt Reference. Click <strong>Save Wage Data</strong>.</p>
        <Example>
          Alagurani&rsquo;s Wage Days = 31 (full month present + holidays), Monthly Basic ₹37,456 → Prorated
          Basic stays ₹37,456 (31÷31). Gross = ₹40,360, PF = ₹1,800 (fixed mode), Net = ₹38,550 — matching her
          printed salary slip exactly.
        </Example>

        <p className="text-[#c8d8e8] font-medium mt-4">Overtime Tab</p>
        <p>Enter daily OT hours (0–24, half-hour steps) per employee; OT Rate and Normal Earn are editable, OT Earn and Total are computed. Click <strong>Save Overtime</strong>.</p>
        <Shot src="/help/form-overtime.png" alt="Overtime tab with daily OT hour inputs" />

        <p className="text-[#c8d8e8] font-medium mt-4">Fines Tab</p>
        <p>Select Employee*, enter Offence Date*, Description*, Fine Amount, then <strong>Add Fine</strong>. Populates Form I — Register of Fines.</p>

        <p className="text-[#c8d8e8] font-medium mt-4">Deductions Tab</p>
        <p>Select Employee*, enter Damage Date*, Description*, Deduction Amount, then <strong>Add Deduction</strong>. Populates Form II — Register of Deductions.</p>

        <p className="text-[#c8d8e8] font-medium mt-4">Leave Tab</p>
        <p>EL Open, EL Earned, EL Availed, EL Closing (auto = max(0, Open+Earned−Availed)), Medical, Other. Click <strong>Save Leave Data</strong>.</p>
        <Shot src="/help/form-leave.png" alt="Leave tab with EL Opening, Earned, Availed, Closing columns" />

        <p className="text-[#c8d8e8] font-medium mt-4">Workflow Toolbar</p>
        <p>&ldquo;Start Entry&rdquo; (Not Started → Data Entry), &ldquo;Move to Review&rdquo; (Data Entry → Ready for Review), &ldquo;Reopen for Entry&rdquo; (Needs Correction → Data Entry).</p>
        <UseCase>
          End of month: fill Attendance for all 9 employees, switch to the Wage Data tab (which recalculates
          automatically from the attendance you just entered), add any fines from the month, then click
          &ldquo;Move to Review&rdquo; so a supervisor can approve before export.
        </UseCase>
      </>
    ),
  },
  {
    id: 'salary-slips',
    title: 'Salary Slips',
    path: 'Cycle Detail → Salary Slips',
    keywords: 'salary slip all employees view individual slip print all view earnings deductions net pay signature original duplicate photocopy',
    body: (
      <>
        <p><strong className="text-[#c8d8e8]">All Employees View:</strong> a card grid, one per employee, showing Establishment/Period/Emp No/Days Worked/Name/Designation, full Earnings and Deductions breakdown, Net Pay, and a signature line. <strong>View</strong> opens the full slip; <strong>Print</strong> opens it in a new tab and triggers print immediately. <strong>&ldquo;Print All&rdquo;</strong> prints every slip, two per A4 sheet.</p>
        <Shot src="/help/salary-slips.png" alt="All Employees salary slip card grid" />
        <p><strong className="text-[#c8d8e8]">Individual Slip View:</strong> full-page slip rendered twice on one landscape sheet — labeled &ldquo;Original&rdquo; and &ldquo;Duplicate (Photocopy)&rdquo; — with prev/next navigation and both Employee and Authorised Signatory signature lines.</p>
        <Shot src="/help/salary-slip-individual.png" alt="Individual salary slip — Original and Duplicate side by side" caption="Alagurani's July 2026 salary slip" />
        <UseCase>
          On payday, print all slips at once with &ldquo;Print All&rdquo; and hand each employee their Original,
          keeping the Duplicate (Photocopy) half in your own records — both come from the exact same print run,
          so there&rsquo;s no risk of a mismatch.
        </UseCase>
      </>
    ),
  },
  {
    id: 'print-forms',
    title: 'Print Forms',
    path: 'Cycle Detail → Print link on any form task',
    keywords: 'print forms form XI form V form XII form XVII form IV form I form II form U form W form T form X register muster roll wage slip fines deductions employees employment orientation landscape portrait exports export history docx pdf',
    body: (
      <>
        <p>Opens the statutory form as a print-ready page. Press Ctrl+P (Cmd+P on Mac) to print or save as PDF.</p>
        <Shot src="/help/print-form-xi.png" alt="Form XI — Register of Employees, print-ready view" caption="Form XI — Register of Employees (Hospital)" />
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
        <Shot src="/help/exports.png" alt="Export history page listing generated DOCX/PDF documents" />
        <UseCase>
          A labour inspector visits and asks for the Register of Wages for the last quarter — open each month&rsquo;s
          cycle, click Print on Form XII/W, and either hand over a printed copy or save as PDF on the spot.
        </UseCase>
      </>
    ),
  },
  {
    id: 'bulk-import-export',
    title: 'Bulk Import & Export',
    path: 'Employees list → Import / Export',
    keywords: 'bulk import export template download action add update delete emp id upload csv xlsx result added updated deleted exited row errors',
    body: (
      <>
        <p className="text-[#c8d8e8] font-medium">Import</p>
        <Shot src="/help/employee-import.png" alt="Employee bulk import page with template download and upload form" />
        <FieldTable
          rows={[
            { field: 'ADD', notes: 'Emp ID optional (auto-generated), Name and Salary required — creates a new employee.' },
            { field: 'UPDATE', notes: 'Emp ID required, other fields optional — updates only non-blank fields.' },
            { field: 'DELETE', notes: 'Emp ID required — deletes if no cycle records exist, otherwise marks Exited.' },
          ]}
        />
        <p>Download the template, fill the Action column, then upload the file (.csv/.txt/.xlsx) against an Establishment. The result shows Added/Updated/Deleted/Exited counts plus per-row error messages for skipped rows.</p>
        <Example>
          You get a spreadsheet from HR listing 15 new hires. Download the template, paste their Name and Salary
          into the ADD rows, upload against the right establishment — Mustearly reports &ldquo;15 Added&rdquo;
          (or fewer, with row-by-row error messages for anything invalid, like a missing Salary).
        </Example>
        <p className="text-[#c8d8e8] font-medium mt-3">Export</p>
        <p>Available once an Establishment filter is selected on the Employees list. Downloads an XLSX in the exact same layout as the import template (Action pre-filled UPDATE, Emp ID populated) so it can be edited and re-imported directly.</p>
        <UseCase>
          You need to give everyone in one establishment a ₹500 raise. Export that establishment&rsquo;s
          employees (Action already set to UPDATE), edit the Salary column in Excel, then re-upload the same
          file through Import — no need to open 9 separate employee edit pages.
        </UseCase>
      </>
    ),
  },
  {
    id: 'calendar',
    title: 'Calendar',
    path: 'Sidebar → Calendar',
    keywords: 'calendar month view holiday wage cycle form due joined exit event add calendar event title date time recurring remind days before establishment notes',
    body: (
      <>
        <p>A unified month view combining holidays, wage-cycle deadlines, form due-dates, employee join/exit milestones, and custom events.</p>
        <Shot src="/help/calendar.png" alt="Calendar month view with event legend" />
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
        <Example>
          Add &ldquo;PF payment due&rdquo;, Recurring = Monthly, Remind days before = 5 — every month, 5 days
          before it&rsquo;s due, it shows up in the Dashboard&rsquo;s Reminders panel automatically, without
          re-entering it each month.
        </Example>
      </>
    ),
  },
  {
    id: 'settings',
    title: 'Settings',
    path: 'Sidebar → Settings',
    keywords: 'settings print register layout max employees per sheet min fill rows pagination',
    body: (
      <>
        <p>Controls print-register pagination globally.</p>
        <Shot src="/help/settings.png" alt="Settings page with print layout controls" />
        <FieldTable
          rows={[
            { field: 'Max employees per sheet', notes: 'Default 20 if blank. Capped at the per-sheet ceiling so each printed sheet keeps its own header.' },
            { field: 'Min fill rows', notes: 'Default 5 if blank. Below this many employees, rows stretch to fill the whole page.' },
          ]}
        />
        <UseCase>
          Your establishment only has 4 employees, and printed registers look sparse with tiny rows at the top of
          an otherwise empty page — increase &ldquo;Min fill rows&rdquo; so rows stretch to fill the sheet
          evenly.
        </UseCase>
      </>
    ),
  },
  {
    id: 'audit-log',
    title: 'Audit Log',
    path: 'Sidebar → Audit Log',
    keywords: 'audit log entity type created updated deleted detail change history',
    body: (
      <>
        <p>A chronological log of every record change across the system. Filter by entity type. Each row shows When (timestamp), Entity (type + ID), Action (Created/Updated/Deleted), and a truncated Detail preview of the changed value.</p>
        <Shot src="/help/audit.png" alt="Audit Log page listing record changes" />
        <UseCase>
          An employee&rsquo;s salary looks different from what you remember setting — check the Audit Log
          filtered to &ldquo;Employee&rdquo; entities to see exactly when and what changed.
        </UseCase>
      </>
    ),
  },
  {
    id: 'workflows',
    title: 'Common Workflows',
    keywords: 'common workflows monthly payroll new employee mid month employee leaves organisation changing wage formula next month',
    body: (
      <>
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
      </>
    ),
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    keywords: 'troubleshooting wages showing zero gross wage lower than expected employee missing from cycle stale salary cannot delete establishment attendance not saving holiday not marking export link disabled print shows sidebar navigation problem solution',
    body: (
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
    ),
  },
]

function matchesQuery(section: SectionDef, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return (
    section.title.toLowerCase().includes(needle) ||
    section.keywords.toLowerCase().includes(needle) ||
    (section.path?.toLowerCase().includes(needle) ?? false)
  )
}

function Section({
  section,
  open,
  onToggle,
}: {
  section: SectionDef
  open: boolean
  onToggle: (id: string) => void
}) {
  return (
    <details
      id={section.id}
      open={open}
      onToggle={() => onToggle(section.id)}
      className="border-b border-[#1e2d3d] scroll-mt-4"
    >
      <summary className="cursor-pointer select-none px-6 py-3 text-sm font-semibold text-[#c8d8e8] hover:bg-[#0f1c2c] flex items-center justify-between">
        <span>{section.title}</span>
        {section.path && <span className="text-[10px] font-normal text-[#5a8ab8]">{section.path}</span>}
      </summary>
      <div className="px-6 pb-5 text-xs leading-relaxed text-[#a8c4d8] space-y-2">
        {section.body}
      </div>
    </details>
  )
}

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({ overview: true })

  const searching = query.trim().length > 0
  const matches = useMemo(
    () => (searching ? SECTIONS.filter((s) => matchesQuery(s, query)) : SECTIONS),
    [query, searching]
  )
  const matchIds = useMemo(() => new Set(matches.map((s) => s.id)), [matches])

  function isOpen(id: string) {
    return searching ? matchIds.has(id) : (manualOpen[id] ?? false)
  }

  function handleToggle(id: string) {
    if (searching) return // search forces state; manual toggling resumes once cleared
    setManualOpen((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }))
  }

  return (
    <div>
      <PageHeader title="Help" subtitle="Mustearly User Guide — Tamil Nadu Labour Compliance Manager" />
      <div className="p-6">
        <div className="max-w-xl mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a8ab8] text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the guide — e.g. ESI, wage days, import, salary slip…"
              aria-label="Search help"
              className="w-full bg-[#0f1923] border border-[#2a3a50] rounded-lg pl-9 pr-9 py-2 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a8ab8] hover:text-[#c8d8e8] text-sm"
              >
                ✕
              </button>
            )}
          </div>
          {searching && (
            <p className="text-[11px] text-[#5a8ab8] mt-1.5">
              {matches.length === 0
                ? 'No matching sections.'
                : `${matches.length} matching section${matches.length !== 1 ? 's' : ''} — expanded below.`}
            </p>
          )}
        </div>

        <div className="rounded border border-[#1e2d3d] bg-[#0a1520] overflow-hidden">
          {SECTIONS.map((section) => (
            <div key={section.id} style={{ display: searching && !matchIds.has(section.id) ? 'none' : undefined }}>
              <Section section={section} open={isOpen(section.id)} onToggle={handleToggle} />
            </div>
          ))}
          {searching && matches.length === 0 && (
            <p className="px-6 py-8 text-sm text-[#5a8ab8] text-center">
              No sections match &ldquo;{query}&rdquo;. Try a different term, like a field name or page name.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
