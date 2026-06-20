import { getRawPrintSettings } from '@/lib/print-config-server'
import { SettingsForm } from '@/components/settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const initial = await getRawPrintSettings()
  // Mirror singleSheetCeiling: floor(usableMm / 6.5).
  const ceilings = { landscape: Math.floor(150 / 6.5), portrait: Math.floor(235 / 6.5) }
  return <SettingsForm initial={initial} ceilings={ceilings} />
}
