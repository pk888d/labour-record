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

  console.log('Seed complete: 2 establishments, ' + hospitalEmployees.length + ' hospital employees')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
