import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { WageSlipForm } from './wage-slip-form'

export function ShopFormT({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  return (
    <WageSlipForm
      ctx={ctx}
      wages={wages}
      formTitle="FORM T — WAGE SLIP"
      rule="Prescribed under Rule 11(6) of the Tamil Nadu Shops and Establishments Rules, 1948"
    />
  )
}
