import { notFound } from 'next/navigation'
import { getCycleContext, getWagesData, getMusterData, getEmployeeData,
  getOvertimeData, getFinesData, getDeductionsData, getLeaveData } from '@/lib/export/form-data'
import { printDensity } from '@/lib/print-density'
import { chunk, type PrintConfig } from '@/lib/print-config'
import { getPrintConfig } from '@/lib/print-config-server'
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

// Paginate a register's rows into per-sheet chunks. Each sheet re-renders the
// whole form (header repeats) with a continuous startIndex, wrapped in a density
// <div> that fills the page and forces a page break after every sheet but the last.
function paginateForm<T>(
  data: T[],
  cfg: PrintConfig,
  orientation: 'landscape' | 'portrait',
  render: (rows: T[], startIndex: number) => React.ReactNode,
): React.ReactNode {
  return chunk(data, cfg.maxRowsPerSheet).map((rows, i, all) => (
    <div
      key={i}
      style={{
        ...printDensity(rows.length, orientation, cfg.minFillRows),
        breakAfter: i < all.length - 1 ? 'page' : 'auto',
      }}
    >
      {render(rows, i * cfg.maxRowsPerSheet)}
    </div>
  ))
}

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

  const cfg = await getPrintConfig(orientation)

  let body: React.ReactNode = null

  switch (formCode) {
    case 'HOSPITAL_FORM_XII': {
      const wages = await getWagesData(ctx)
      body = paginateForm(wages, cfg, orientation, (rows, si) => <HospitalFormXII ctx={ctx} wages={rows} startIndex={si} />)
      break
    }
    case 'HOSPITAL_FORM_V': {
      const muster = await getMusterData(ctx)
      body = paginateForm(muster, cfg, orientation, (rows, si) => <HospitalFormV ctx={ctx} muster={rows} startIndex={si} />)
      break
    }
    case 'HOSPITAL_FORM_XI': {
      const employees = await getEmployeeData(ctx)
      body = paginateForm(employees, cfg, orientation, (rows, si) => <HospitalFormXI ctx={ctx} employees={rows} startIndex={si} />)
      break
    }
    case 'HOSPITAL_FORM_XVII': {
      const wages = await getWagesData(ctx)
      // Wage-slip cards, not a row table — rendered once, no pagination.
      body = <HospitalFormXVII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_IV': {
      const ot = await getOvertimeData(ctx)
      body = paginateForm(ot, cfg, orientation, (rows, si) => <HospitalFormIV ctx={ctx} ot={rows} startIndex={si} />)
      break
    }
    case 'HOSPITAL_FORM_I': {
      const fines = await getFinesData(ctx)
      // Form I numbers from r.sno (data field), so startIndex is unused.
      body = paginateForm(fines, cfg, orientation, (rows, _si) => <HospitalFormI ctx={ctx} fines={rows} />)
      break
    }
    case 'HOSPITAL_FORM_II': {
      const ded = await getDeductionsData(ctx)
      // Form II numbers from r.sno (data field), so startIndex is unused.
      body = paginateForm(ded, cfg, orientation, (rows, _si) => <HospitalFormII ctx={ctx} deductions={rows} />)
      break
    }
    case 'SHOP_FORM_W': {
      const wages = await getWagesData(ctx)
      body = paginateForm(wages, cfg, orientation, (rows, si) => <ShopFormW ctx={ctx} wages={rows} startIndex={si} />)
      break
    }
    case 'SHOP_FORM_T': {
      const wages = await getWagesData(ctx)
      // Wage-slip cards, not a row table — rendered once, no pagination.
      body = <ShopFormT ctx={ctx} wages={wages} />
      break
    }
    case 'SHOP_FORM_U': {
      const employees = await getEmployeeData(ctx)
      // Form U renders as a single employee-register card layout, not a row table.
      body = <ShopFormU ctx={ctx} employees={employees} />
      break
    }
    case 'SHOP_FORM_V': {
      const muster = await getMusterData(ctx)
      body = paginateForm(muster, cfg, orientation, (rows, si) => <ShopFormV ctx={ctx} muster={rows} startIndex={si} />)
      break
    }
    case 'SHOP_FORM_X': {
      const leave = await getLeaveData(ctx)
      body = paginateForm(leave, cfg, orientation, (rows, si) => <ShopFormX ctx={ctx} leave={rows} startIndex={si} />)
      break
    }
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
