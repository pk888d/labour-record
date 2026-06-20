import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRawPrintSettings, SETTING_KEYS } from '@/lib/print-config-server'
import { parseSettingValue } from '@/lib/print-config'

export async function GET() {
  try {
    const settings = await getRawPrintSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { maxRowsPerSheet?: string | number | null; minFillRows?: string | number | null }

    const fields: { key: string; raw: string | number | null | undefined; label: string }[] = [
      { key: SETTING_KEYS.maxRowsPerSheet, raw: b.maxRowsPerSheet, label: 'Max rows per sheet' },
      { key: SETTING_KEYS.minFillRows, raw: b.minFillRows, label: 'Min fill rows' },
    ]

    // Validate all fields first; only persist if every one is valid.
    const errors: string[] = []
    const ops: { key: string; value: number | null }[] = []
    for (const f of fields) {
      const parsed = parseSettingValue(f.raw)
      if (!parsed.ok) {
        errors.push(`${f.label} must be a positive whole number (or blank to use the default)`)
      } else {
        ops.push({ key: f.key, value: parsed.value })
      }
    }
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

    for (const op of ops) {
      if (op.value === null) {
        await prisma.appSetting.deleteMany({ where: { key: op.key } })
      } else {
        await prisma.appSetting.upsert({
          where: { key: op.key },
          update: { value: String(op.value) },
          create: { key: op.key, value: String(op.value) },
        })
      }
    }

    const settings = await getRawPrintSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('PUT /api/settings failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
