import { notFound } from 'next/navigation'
import { getCycleContext, getWagesData, getMusterData, getEmployeeData,
  getOvertimeData, getFinesData, getDeductionsData, getLeaveData } from '@/lib/export/form-data'
import { printDensity } from '@/lib/print-density'
import { PrintButton } from './print-button'
import { HospitalFormXII } from './hospital-form-xii'
import { HospitalFormV } from './hospital-form-v'
import { HospitalFormXI } from './hospital-form-xi'
import { HospitalFormXVII } from './hospital-form-xvii'
import { HospitalFormIV } from './hospital-form-iv'
import { HospitalFormI } from './hospital-form-i'
import { HospitalFormII } from './hospital-form-ii'
import { ShopFormW } from './shop-form-w'
import { ShopFormT } from './shop-form-t'
import { ShopFormU } from './shop-form-u'
import { ShopFormV } from './shop-form-v'
import { ShopFormX } from './shop-form-x'

const VALID_CODES = [
  'HOSPITAL_FORM_XII','HOSPITAL_FORM_V','HOSPITAL_FORM_XI','HOSPITAL_FORM_XVII',
  'HOSPITAL_FORM_IV','HOSPITAL_FORM_I','HOSPITAL_FORM_II',
  'SHOP_FORM_W','SHOP_FORM_T','SHOP_FORM_U','SHOP_FORM_V','SHOP_FORM_X',
]

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ cycleId: string; formCode: string }>
  searchParams: Promise<{ orientation?: string }>
}) {
  const { cycleId, formCode } = await params
  const { orientation: orientationParam } = await searchParams
  const orientation: 'landscape' | 'portrait' = orientationParam === 'portrait' ? 'portrait' : 'landscape'
  if (!VALID_CODES.includes(formCode)) notFound()

  const ctx = await getCycleContext(cycleId).catch(() => null)
  if (!ctx) notFound()

  let content: React.ReactNode
  let rowCount = 0
  // Wage-slip layouts (Form XVII / Form T) lay out per-employee cards, not a row
  // table, so the row-height density does not apply to them.
  let densityEligible = true

  switch (formCode) {
    case 'HOSPITAL_FORM_XII': {
      const wages = await getWagesData(ctx)
      rowCount = wages.length
      content = <HospitalFormXII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_V': {
      const muster = await getMusterData(ctx)
      rowCount = muster.length
      content = <HospitalFormV ctx={ctx} muster={muster} />
      break
    }
    case 'HOSPITAL_FORM_XI': {
      const employees = await getEmployeeData(ctx)
      rowCount = employees.length
      content = <HospitalFormXI ctx={ctx} employees={employees} />
      break
    }
    case 'HOSPITAL_FORM_XVII': {
      const wages = await getWagesData(ctx)
      densityEligible = false
      content = <HospitalFormXVII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_IV': {
      const ot = await getOvertimeData(ctx)
      rowCount = ot.length
      content = <HospitalFormIV ctx={ctx} ot={ot} />
      break
    }
    case 'HOSPITAL_FORM_I': {
      const fines = await getFinesData(ctx)
      rowCount = fines.length
      content = <HospitalFormI ctx={ctx} fines={fines} />
      break
    }
    case 'HOSPITAL_FORM_II': {
      const ded = await getDeductionsData(ctx)
      rowCount = ded.length
      content = <HospitalFormII ctx={ctx} deductions={ded} />
      break
    }
    case 'SHOP_FORM_W': {
      const wages = await getWagesData(ctx)
      rowCount = wages.length
      content = <ShopFormW ctx={ctx} wages={wages} />
      break
    }
    case 'SHOP_FORM_T': {
      const wages = await getWagesData(ctx)
      densityEligible = false
      content = <ShopFormT ctx={ctx} wages={wages} />
      break
    }
    case 'SHOP_FORM_U': {
      const employees = await getEmployeeData(ctx)
      rowCount = employees.length
      content = <ShopFormU ctx={ctx} employees={employees} />
      break
    }
    case 'SHOP_FORM_V': {
      const muster = await getMusterData(ctx)
      rowCount = muster.length
      content = <ShopFormV ctx={ctx} muster={muster} />
      break
    }
    case 'SHOP_FORM_X': {
      const leave = await getLeaveData(ctx)
      rowCount = leave.length
      content = <ShopFormX ctx={ctx} leave={leave} />
      break
    }
  }

  const densityStyle = densityEligible ? printDensity(rowCount, orientation) : undefined

  // On-screen page width mirrors the chosen orientation (A4 @ 96dpi) so the
  // toggle is visibly WYSIWYG; @page drives the actual print orientation.
  const screenWidth = orientation === 'landscape' ? '1123px' : '794px'

  return (
    <>
      <style>{`
        /* margin:0 removes the browser's default print header/footer
           (page title, date, URL, "Page X of Y"); the inner padding lives in
           the print layout's .form-page rule (single source — no duplicates). */
        @page { size: A4 ${orientation}; margin: 0; }
        @media screen {
          .form-page {
            width: ${screenWidth};
            max-width: 100%;
            margin: 16px auto;
            background: #fff;
            box-shadow: 0 2px 16px rgba(0,0,0,0.4);
          }
        }
      `}</style>
      <PrintButton orientation={orientation} />
      <div style={densityStyle}>{content}</div>
    </>
  )
}
