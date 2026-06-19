import { notFound } from 'next/navigation'
import { getCycleContext, getWagesData, getMusterData, getEmployeeData,
  getOvertimeData, getFinesData, getDeductionsData, getLeaveData } from '@/lib/export/form-data'
import { printDensity } from '@/lib/print-density'
import { getPrintConfig, chunk } from '@/lib/print-config'
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

  // Row-table registers: chunked across sheets (header repeats per sheet).
  // `data` is the full row array; `renderSheet` renders one sheet's slice with a
  // starting index so S.No stays continuous.
  let data: unknown[] | null = null
  let renderSheet: ((rows: never[], startIndex: number) => React.ReactNode) | null = null
  // Card forms (Form XVII / Form T / Form U) render once with all data, no chunking.
  let content: React.ReactNode = null

  switch (formCode) {
    case 'HOSPITAL_FORM_XII': {
      const wages = await getWagesData(ctx)
      data = wages
      renderSheet = (rows, startIndex) => <HospitalFormXII ctx={ctx} wages={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_V': {
      const muster = await getMusterData(ctx)
      data = muster
      renderSheet = (rows, startIndex) => <HospitalFormV ctx={ctx} muster={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_XI': {
      const employees = await getEmployeeData(ctx)
      data = employees
      renderSheet = (rows, startIndex) => <HospitalFormXI ctx={ctx} employees={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_XVII': {
      const wages = await getWagesData(ctx)
      content = <HospitalFormXVII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_IV': {
      const ot = await getOvertimeData(ctx)
      data = ot
      renderSheet = (rows, startIndex) => <HospitalFormIV ctx={ctx} ot={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_I': {
      const fines = await getFinesData(ctx)
      data = fines
      // Form I numbers from r.sno (data field), so no startIndex is needed.
      renderSheet = (rows) => <HospitalFormI ctx={ctx} fines={rows} />
      break
    }
    case 'HOSPITAL_FORM_II': {
      const ded = await getDeductionsData(ctx)
      data = ded
      // Form II numbers from r.sno (data field), so no startIndex is needed.
      renderSheet = (rows) => <HospitalFormII ctx={ctx} deductions={rows} />
      break
    }
    case 'SHOP_FORM_W': {
      const wages = await getWagesData(ctx)
      data = wages
      renderSheet = (rows, startIndex) => <ShopFormW ctx={ctx} wages={rows} startIndex={startIndex} />
      break
    }
    case 'SHOP_FORM_T': {
      const wages = await getWagesData(ctx)
      content = <ShopFormT ctx={ctx} wages={wages} />
      break
    }
    case 'SHOP_FORM_U': {
      const employees = await getEmployeeData(ctx)
      content = <ShopFormU ctx={ctx} employees={employees} />
      break
    }
    case 'SHOP_FORM_V': {
      const muster = await getMusterData(ctx)
      data = muster
      renderSheet = (rows, startIndex) => <ShopFormV ctx={ctx} muster={rows} startIndex={startIndex} />
      break
    }
    case 'SHOP_FORM_X': {
      const leave = await getLeaveData(ctx)
      data = leave
      renderSheet = (rows, startIndex) => <ShopFormX ctx={ctx} leave={rows} startIndex={startIndex} />
      break
    }
  }

  // Build the printable body: chunked sheets for row tables, single node for cards.
  let body: React.ReactNode
  if (data && renderSheet) {
    const { maxRowsPerSheet, minFillRows } = getPrintConfig(orientation)
    const sheets = chunk(data, maxRowsPerSheet)
    body = sheets.map((rows, i) => (
      <div
        key={i}
        style={{
          ...printDensity(rows.length, orientation, minFillRows),
          breakAfter: i < sheets.length - 1 ? 'page' : 'auto',
        }}
      >
        {renderSheet(rows as never[], i * maxRowsPerSheet)}
      </div>
    ))
  } else {
    body = content
  }

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
      {body}
    </>
  )
}
