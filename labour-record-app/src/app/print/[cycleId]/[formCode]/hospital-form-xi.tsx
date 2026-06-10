import type { CycleContext, EmployeeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

function ageFrom(dob: string): string {
  if (!dob) return ''
  const d = new Date(dob)
  if (isNaN(d.getTime())) return ''
  const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
  return age > 0 && age < 100 ? String(age) : ''
}

export function HospitalFormXI({ ctx, employees }: { ctx: CycleContext; employees: EmployeeRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM No. XI — REGISTER OF EMPLOYEES</h2>
        <p>Prescribed under Rule 25 of Minimum Wages (Tamil Nadu) Rules</p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo} | Month: {period}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Name</th>
            <th>Age &amp; Sex</th>
            <th>Father&apos;s / Husband&apos;s Name</th>
            <th>Nature of Employment / Designation</th>
            <th>Permanent Address of Employee</th>
            <th>Date of Commencement of Employment</th>
            <th>Date of termination / leaving of service</th>
            <th>Date &amp; Signature or thumb-impression</th>
          </tr>
          <tr>{Array.from({ length: 9 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 1})</th>)}</tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => {
            const age = ageFrom(emp.dob)
            return (
              <tr key={emp.employeeId}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{emp.name}</td>
                <td style={{ textAlign: 'center' }}>{age ? `${age} / ${emp.sex}` : emp.sex}</td>
                <td>{emp.fatherSpouseName || 'Nil'}</td>
                <td>{emp.designation}{emp.department ? ` / ${emp.department}` : ''}</td>
                <td>{emp.permanentAddress || 'Nil'}</td>
                <td style={{ textAlign: 'center' }}>{emp.dateOfEntry}</td>
                <td style={{ textAlign: 'center' }}>Nil</td>
                <td />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
