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

  // Enrich every row with a serial number and a few computed columns the
  // statutory templates expect (left blank via nullGetter when not applicable).
  const enrichedRows = rows.map((r, i) => {
    const row = r as unknown as Record<string, number>
    const totalNormal = (row.basic ?? 0) + (row.da ?? 0)
    const totalDeductions =
      (row.pf ?? 0) + (row.esi ?? 0) + (row.lwf ?? 0) +
      (row.fineDeduction ?? 0) + (row.otherDeductions ?? 0) + (row.advanceRecovered ?? 0)
    return {
      ...r,
      sno: i + 1,
      totalNormal,
      totalDeductions,
      leaveWages: 0,
      otEarnings: (r as { otEarnings?: number }).otEarnings ?? 0,
    }
  })

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
    rows: enrichedRows,
  }
}

export type PageOrientation = 'landscape' | 'portrait'

// A4 dimensions in twips. Landscape is the default (registers are wide tables).
const A4 = { short: 11906, long: 16838 }

function setOrientation(xml: string, orientation: PageOrientation): string {
  const w = orientation === 'landscape' ? A4.long : A4.short
  const h = orientation === 'landscape' ? A4.short : A4.long
  const pgSz = `<w:pgSz w:w="${w}" w:h="${h}" w:orient="${orientation}"/>`
  if (/<w:pgSz\b[^>]*\/>/.test(xml)) {
    return xml.replace(/<w:pgSz\b[^>]*\/>/g, pgSz)
  }
  // No pgSz present — inject one into the section properties.
  return xml.replace(/<w:sectPr\b[^>]*>/, (m) => m + pgSz)
}

export async function generateDocx(
  cycleId: string,
  formCode: string,
  baseFileName: string,
  orientation: PageOrientation = 'landscape'
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
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '', // leave untagged/missing columns blank instead of throwing
  })

  doc.render(buildTemplateData(ctx, rows))

  // Apply page orientation (landscape by default for wide register tables).
  const zip2 = doc.getZip()
  const docXmlFile = zip2.file('word/document.xml')
  if (docXmlFile) {
    zip2.file('word/document.xml', setOrientation(docXmlFile.asText(), orientation))
  }

  const buffer = zip2.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer

  fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  const outputPath = path.join(EXPORTS_DIR, `${baseFileName}.docx`)
  fs.writeFileSync(outputPath, buffer)

  return outputPath
}
