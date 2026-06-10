import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { WageSlipForm } from './wage-slip-form'

export function HospitalFormXVII({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  return (
    <WageSlipForm
      ctx={ctx}
      wages={wages}
      formTitle="FORM No. XVII — WAGE SLIP"
      rule="Prescribed under Rule 27(3) of Minimum Wages (Tamil Nadu) Rules, 1963"
    />
  )
}
