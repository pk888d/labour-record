import path from 'path'
import fs from 'fs'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import {
  getCycleContext, getWagesData, getMusterData, getEmployeeData,
  getOvertimeData, getFinesData, getDeductionsData, getLeaveData,
  MONTH_NAMES,
} from './form-data'
import type {
  CycleContext, WagesRow, MusterRow, EmployeeRow,
  OvertimeRow, FineRow, DeductionRow, LeaveRow,
} from './form-data'

const TEMPLATES_DIR = path.join(process.cwd(), 'templates')
const EXPORTS_DIR = path.join(process.cwd(), 'exports')

function getTemplatePath(formCode: string): string {
  const isHospital = formCode.startsWith('HOSPITAL_')
  const subdir = isHospital ? 'hospital' : 'shop'
  const filename = `${formCode.toLowerCase()}.docx`
  return path.join(TEMPLATES_DIR, subdir, filename)
}

function buildTemplateData(
  ctx: CycleContext,
  rows: WagesRow[] | MusterRow[] | EmployeeRow[] | OvertimeRow[] | FineRow[] | DeductionRow[] | LeaveRow[]
): Record<string, unknown> {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return {
    establishmentName: establishment.name,
    address: establishment.address,
    regCertNo: establishment.regCertNo,
    employerName: establishment.employerName,
    managerName: establishment.managerName,
    period,
    year: cycle.year,
    month: cycle.month,
    daysInMonth,
    rows,
  }
}

export async function generateDocx(
  cycleId: string,
  formCode: string,
  baseFileName: string
): Promise<string> {
  const templatePath = getTemplatePath(formCode)
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  const ctx = await getCycleContext(cycleId)

  let rows: WagesRow[] | MusterRow[] | EmployeeRow[] | OvertimeRow[] | FineRow[] | DeductionRow[] | LeaveRow[]

  switch (formCode) {
    case 'HOSPITAL_FORM_XII':
    case 'HOSPITAL_FORM_XVII':
    case 'SHOP_FORM_W':
    case 'SHOP_FORM_T':
      rows = await getWagesData(ctx)
      break
    case 'HOSPITAL_FORM_V':
    case 'SHOP_FORM_V':
      rows = await getMusterData(ctx)
      break
    case 'HOSPITAL_FORM_XI':
    case 'SHOP_FORM_U':
      rows = await getEmployeeData(ctx)
      break
    case 'HOSPITAL_FORM_IV':
      rows = await getOvertimeData(ctx)
      break
    case 'HOSPITAL_FORM_I':
      rows = await getFinesData(ctx)
      break
    case 'HOSPITAL_FORM_II':
      rows = await getDeductionsData(ctx)
      break
    case 'SHOP_FORM_X':
      rows = await getLeaveData(ctx)
      break
    default:
      throw new Error(`Unknown formCode: ${formCode}`)
  }

  const templateContent = fs.readFileSync(templatePath, 'binary')
  const zip = new PizZip(templateContent)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

  doc.render(buildTemplateData(ctx, rows))

  const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer

  fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  const outputPath = path.join(EXPORTS_DIR, `${baseFileName}.docx`)
  fs.writeFileSync(outputPath, buffer)

  return outputPath
}
