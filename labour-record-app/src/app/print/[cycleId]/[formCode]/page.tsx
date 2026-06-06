import { notFound } from 'next/navigation'
import { getCycleContext, getWagesData, getMusterData, getEmployeeData,
  getOvertimeData, getFinesData, getDeductionsData, getLeaveData } from '@/lib/export/form-data'
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
}: {
  params: Promise<{ cycleId: string; formCode: string }>
}) {
  const { cycleId, formCode } = await params
  if (!VALID_CODES.includes(formCode)) notFound()

  const ctx = await getCycleContext(cycleId).catch(() => null)
  if (!ctx) notFound()

  let content: React.ReactNode

  switch (formCode) {
    case 'HOSPITAL_FORM_XII': {
      const wages = await getWagesData(ctx)
      content = <HospitalFormXII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_V': {
      const muster = await getMusterData(ctx)
      content = <HospitalFormV ctx={ctx} muster={muster} />
      break
    }
    case 'HOSPITAL_FORM_XI': {
      const employees = await getEmployeeData(ctx)
      content = <HospitalFormXI ctx={ctx} employees={employees} />
      break
    }
    case 'HOSPITAL_FORM_XVII': {
      const wages = await getWagesData(ctx)
      content = <HospitalFormXVII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_IV': {
      const ot = await getOvertimeData(ctx)
      content = <HospitalFormIV ctx={ctx} ot={ot} />
      break
    }
    case 'HOSPITAL_FORM_I': {
      const fines = await getFinesData(ctx)
      content = <HospitalFormI ctx={ctx} fines={fines} />
      break
    }
    case 'HOSPITAL_FORM_II': {
      const ded = await getDeductionsData(ctx)
      content = <HospitalFormII ctx={ctx} deductions={ded} />
      break
    }
    case 'SHOP_FORM_W': {
      const wages = await getWagesData(ctx)
      content = <ShopFormW ctx={ctx} wages={wages} />
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
      content = <ShopFormV ctx={ctx} muster={muster} />
      break
    }
    case 'SHOP_FORM_X': {
      const leave = await getLeaveData(ctx)
      content = <ShopFormX ctx={ctx} leave={leave} />
      break
    }
  }

  return (
    <>
      <PrintButton />
      {content}
    </>
  )
}
