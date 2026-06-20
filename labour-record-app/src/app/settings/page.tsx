import { getRawPrintSettings } from '@/lib/print-config-server'
import { singleSheetCeiling } from '@/lib/print-config'
import { SettingsForm } from '@/components/settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const initial = await getRawPrintSettings()
  const ceilings = {
    landscape: singleSheetCeiling('landscape'),
    portrait: singleSheetCeiling('portrait'),
  }
  return <SettingsForm initial={initial} ceilings={ceilings} />
}
