import type { CycleContext, EmployeeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function ShopFormU({ ctx, employees }: { ctx: CycleContext; employees: EmployeeRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF EMPLOYEES</h2>
        <p>Form U [Rule 14] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — as of {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Father/Spouse</th>
            <th>Sex</th>
            <th>DOB</th>
            <th>Designation</th>
            <th>Date of Entry</th>
            <th>Present Address</th>
            <th>Permanent Address</th>
            <th>UAN</th>
            <th>ESI No</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr key={emp.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{emp.empId}</td>
              <td>{emp.name}</td>
              <td>{emp.fatherSpouseName}</td>
              <td style={{ textAlign: 'center' }}>{emp.sex}</td>
              <td style={{ textAlign: 'center' }}>{emp.dob}</td>
              <td>{emp.designation}</td>
              <td style={{ textAlign: 'center' }}>{emp.dateOfEntry}</td>
              <td>{emp.presentAddress}</td>
              <td>{emp.permanentAddress}</td>
              <td>{emp.uan ?? ''}</td>
              <td>{emp.esiNo ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
