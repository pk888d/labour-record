import type { CycleContext, DeductionRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function HospitalFormII({ ctx, deductions }: { ctx: CycleContext; deductions: DeductionRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS</h2>
        <p>Form No. II — Prescribed under Rule 21(4) of Minimum Wages (Tamil Nadu) Rules, 1963</p>
        <p style={{ fontWeight: 'bold' }}>Register of Deductions for Damage or Loss caused to the Employer by Neglect or Default — for {period}</p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Name</th>
            <th>Father&apos;s / Husband&apos;s Name</th>
            <th>Age &amp; Sex</th>
            <th>Department</th>
            <th>Damage or Loss Caused with Date</th>
            <th>Whether worker showed cause against deduction (if so, date)</th>
            <th>Date of Deduction imposed</th>
            <th>Amount of Deduction imposed</th>
            <th>No. of installments (if any)</th>
            <th>Date on which total amount realized</th>
            <th>Remarks</th>
          </tr>
          <tr>
            {Array.from({ length: 12 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 1})</th>)}
          </tr>
        </thead>
        <tbody>
          {deductions.map((r) => (
            <tr key={r.sno}>
              <td style={{ textAlign: 'center' }}>{r.sno}</td>
              <td>{r.name}</td>
              <td>{r.fatherSpouseName}</td>
              <td style={{ textAlign: 'center' }}>{r.sex}</td>
              <td style={{ textAlign: 'center' }}>{r.department}</td>
              <td style={{ textAlign: 'center' }}>{r.description}</td>
              <td style={{ textAlign: 'center' }}>{r.showCause}</td>
              <td style={{ textAlign: 'center' }}>{r.damageDate}</td>
              <td style={{ textAlign: 'center' }}>{r.deductionAmount}</td>
              <td style={{ textAlign: 'center' }}>{r.installments}</td>
              <td style={{ textAlign: 'center' }}>{r.dateRealised}</td>
              <td style={{ textAlign: 'center' }}>{r.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
