import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const filePath = url.startsWith('file:') ? url.slice(5) : url

const adapter = new PrismaBetterSqlite3({ url: filePath })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hospital = await prisma.establishment.upsert({
    where: { id: 'est_hospital_dnv' },
    update: {},
    create: {
      id: 'est_hospital_dnv',
      name: 'DNV Orthocare',
      address: 'Palacode, Dharmapuri District, Tamil Nadu',
      employerName: 'Dr. Nagarajan',
      managerName: 'Ramesh Kumar',
      regCertNo: 'TN-HR-2021-001',
      type: 'HOSPITAL',
      wageFormulaConfig: JSON.stringify({
        preset: 'TN_MINIMUM_WAGES_HOSPITAL',
        fixedAllowance: 360,
        esiApplicable: false,
        lwfApplicable: true,
        lwfRate: 0.25,
      }),
    },
  })

  await prisma.establishment.upsert({
    where: { id: 'est_shop_sriranga' },
    update: {},
    create: {
      id: 'est_shop_sriranga',
      name: 'Sri Ranga Department Store',
      address: 'Palacode, Dharmapuri District, Tamil Nadu',
      employerName: 'Sri Ranga Traders',
      managerName: 'Sundaram',
      regCertNo: 'TN-SE-2019-042',
      type: 'SHOP',
      wageFormulaConfig: JSON.stringify({
        preset: 'TN_SHOPS_ESTABLISHMENTS',
        esiApplicable: true,
        lwfApplicable: true,
        lwfRate: 0.25,
      }),
    },
  })

  const hospitalEmployees = [
    { empId: 'H001', name: 'Alagurani',     sex: 'F', fatherSpouseName: 'Angappan',  designation: 'Nurse' },
    { empId: 'H002', name: 'Ambika',        sex: 'F', fatherSpouseName: 'Sambath',   designation: 'Nurse' },
    { empId: 'H003', name: 'Aruljoslinraj', sex: 'M', fatherSpouseName: 'Fernandas', designation: 'Attender' },
    { empId: 'H004', name: 'Muniraj',       sex: 'M', fatherSpouseName: 'Mariappan', designation: 'Attender' },
    { empId: 'H005', name: 'Muthulakshmi',  sex: 'F', fatherSpouseName: 'Mariappan', designation: 'Nurse' },
    { empId: 'H006', name: 'Mynavathy',     sex: 'F', fatherSpouseName: 'Saravanan', designation: 'Nurse' },
  ]

  for (const emp of hospitalEmployees) {
    await prisma.employee.upsert({
      where: { id: `emp_${emp.empId.toLowerCase()}` },
      update: {},
      create: {
        id: `emp_${emp.empId.toLowerCase()}`,
        ...emp,
        dateOfEntry: new Date('2020-01-01'),
        presentAddress: 'Palacode, Tamil Nadu',
        permanentAddress: 'Palacode, Tamil Nadu',
        establishmentId: hospital.id,
      },
    })
  }

  // Bulk hospital fixture for print-pagination e2e: BULK_EMPLOYEE_COUNT staff so a
  // register spans multiple printed sheets. The count is kept above the landscape
  // single-sheet ceiling (floor(150/6.5) = 23) so pagination triggers under ANY
  // valid PRINT_MAX_ROWS_PER_SHEET. Keep in sync with e2e/08-print-pagination.spec.ts.
  const BULK_EMPLOYEE_COUNT = 25
  const bulk = await prisma.establishment.upsert({
    where: { id: 'est_hospital_bulk' },
    update: {},
    create: {
      id: 'est_hospital_bulk',
      name: 'QA Bulk Hospital',
      address: 'Palacode, Dharmapuri District, Tamil Nadu',
      employerName: 'Dr. Bulk',
      managerName: 'Bulk Manager',
      regCertNo: 'TN-HR-2099-BULK',
      type: 'HOSPITAL',
      wageFormulaConfig: JSON.stringify({
        preset: 'TN_MINIMUM_WAGES_HOSPITAL',
        fixedAllowance: 360,
        esiApplicable: false,
        lwfApplicable: true,
        lwfRate: 0.25,
      }),
    },
  })

  for (let n = 1; n <= BULK_EMPLOYEE_COUNT; n++) {
    const empId = `B${String(n).padStart(3, '0')}`
    await prisma.employee.upsert({
      where: { id: `emp_${empId.toLowerCase()}` },
      update: {},
      create: {
        id: `emp_${empId.toLowerCase()}`,
        empId,
        // Zero-padded so name-ascending order (used by getCycleContext) is 1..N.
        name: `Bulk Worker ${String(n).padStart(2, '0')}`,
        sex: n % 2 === 0 ? 'F' : 'M',
        fatherSpouseName: 'Test Parent',
        designation: 'Nurse',
        dateOfEntry: new Date('2020-01-01'),
        presentAddress: 'Palacode, Tamil Nadu',
        permanentAddress: 'Palacode, Tamil Nadu',
        establishmentId: bulk.id,
      },
    })
  }

  console.log(
    `Seed complete: 3 establishments, ${hospitalEmployees.length} hospital employees, ${BULK_EMPLOYEE_COUNT} bulk employees`,
  )
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
