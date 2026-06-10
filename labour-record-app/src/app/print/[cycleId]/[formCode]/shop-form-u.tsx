import type { CycleContext, EmployeeRow } from '@/lib/export/form-data'

function EmployeeCard({ emp, sno, ctx }: { emp: EmployeeRow; sno: number; ctx: CycleContext }) {
  const { establishment } = ctx
  const td: React.CSSProperties = { border: '1px solid #000', padding: '2px 5px', fontSize: '9px', verticalAlign: 'top' }
  const num: React.CSSProperties = { ...td, width: '6%', textAlign: 'center' }
  const lbl: React.CSSProperties = { ...td, width: '40%' }
  const fields: [string, string][] = [
    ['Name of the Employee', emp.name],
    ['Employee ID No', emp.empId],
    ['Gender', emp.sex],
    ['Father / Spouse Name', emp.fatherSpouseName || 'Nil'],
    ['Date of Birth', emp.dob || 'Nil'],
    ['Date of Entry into Service', emp.dateOfEntry || 'Nil'],
    ['Designation', emp.designation],
    ['Present Address', emp.presentAddress || 'Nil'],
    ['Permanent Address', emp.permanentAddress || 'Nil'],
    ['Employee Provident Fund – UAN', emp.uan || 'Nil'],
    ['Employees State Insurance Corporation No', emp.esiNo || 'Nil'],
    ['Aadhaar No', 'Nil'],
    ['Date of completion of 480 days of service', 'Nil'],
    ['Date on which made Permanent', 'Nil'],
    ['Period of Suspension if any', 'Nil'],
    ['Bank A/C Number, Name of Bank, Branch (IFSC)', 'Nil'],
    ['Photo', ''],
    ['Mobile Number', 'Nil'],
    ['E-Mail ID', 'Nil'],
    ['Specimen Signature / Thumb impression', ''],
    ['Date of Exit', 'Nil'],
    ['Reason for Exit', 'Nil'],
    ['Remarks', 'Nil'],
  ]
  return (
    <div style={{ pageBreakInside: 'avoid', marginBottom: '12px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
        Employee #{sno} — {establishment.name}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {fields.map(([label, value], i) => (
            <tr key={i}>
              <td style={num}>{i + 1}</td>
              <td style={lbl}>{label}</td>
              <td style={td}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ShopFormU({ ctx, employees }: { ctx: CycleContext; employees: EmployeeRow[] }) {
  const { establishment } = ctx
  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM U — EMPLOYEE REGISTER</h2>
        <p>Prescribed under Rule 16(1) of the Tamil Nadu Shops and Establishments Rules, 1948</p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {employees.map((emp, i) => (
          <EmployeeCard key={emp.employeeId} emp={emp} sno={i + 1} ctx={ctx} />
        ))}
      </div>
    </div>
  )
}
