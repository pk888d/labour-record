import type { CycleContext, FineRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function HospitalFormI({ ctx, fines }: { ctx: CycleContext; fines: FineRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF FINES</h2>
        <p>Form No. I — Prescribed under Rule 21(4) of Minimum Wages (Tamil Nadu) Rules, 1953</p>
        <p>Register of Fines for the Month of <strong>{period}</strong></p>
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
            <th>Nature and Date of the offence for which Fine imposed</th>
            <th>Whether show cause notice was served</th>
            <th>Whether workman showed cause against Fine (if so, date)</th>
            <th>Rate of wages</th>
            <th>Date and amount of Fines imposed</th>
            <th>Date on which fine Realized</th>
            <th>Remarks</th>
          </tr>
          <tr>
            {Array.from({ length: 12 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 1})</th>)}
          </tr>
        </thead>
        <tbody>
          {fines.map((r) => (
            <tr key={r.sno}>
              <td style={{ textAlign: 'center' }}>{r.sno}</td>
              <td>{r.name}</td>
              <td>{r.fatherSpouseName}</td>
              <td style={{ textAlign: 'center' }}>{r.sex}</td>
              <td style={{ textAlign: 'center' }}>{r.department}</td>
              <td style={{ textAlign: 'center' }}>{r.offenceDescription}</td>
              <td style={{ textAlign: 'center' }}>{r.showCause}</td>
              <td style={{ textAlign: 'center' }}>{r.heard}</td>
              <td style={{ textAlign: 'center' }}>{r.rate}</td>
              <td style={{ textAlign: 'center' }}>{r.fineAmount}</td>
              <td style={{ textAlign: 'center' }}>{r.dateRealised}</td>
              <td style={{ textAlign: 'center' }}>{r.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
