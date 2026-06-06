import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WAGE_RULE_DEFAULTS } from '@/domain/calculations/wage-defaults'

const RULE_KEYS = Object.keys(WAGE_RULE_DEFAULTS)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')
    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId is required' }, { status: 400 })
    }
    const custom = await prisma.wageRule.findMany({ where: { establishmentId } })
    const merged = RULE_KEYS.map((key) => {
      const found = custom.find((r) => r.ruleKey === key)
      return {
        ruleKey: key,
        ruleValue: found?.ruleValue ?? WAGE_RULE_DEFAULTS[key],
        isCustom: !!found,
        id: found?.id ?? null,
      }
    })
    return NextResponse.json(merged)
  } catch (error) {
    console.error('GET /api/wage-rules failed:', error)
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
    const b = body as { establishmentId?: string; ruleKey?: string; ruleValue?: number }
    if (!b.establishmentId || !b.ruleKey) {
      return NextResponse.json({ errors: ['establishmentId and ruleKey are required'] }, { status: 422 })
    }
    if (typeof b.ruleValue !== 'number' || b.ruleValue < 0) {
      return NextResponse.json({ errors: ['ruleValue must be a non-negative number'] }, { status: 422 })
    }
    if (!RULE_KEYS.includes(b.ruleKey)) {
      return NextResponse.json({ errors: [`unknown ruleKey: ${b.ruleKey}`] }, { status: 422 })
    }
    const rule = await prisma.wageRule.upsert({
      where: {
        establishmentId_ruleKey: {
          establishmentId: b.establishmentId,
          ruleKey: b.ruleKey,
        },
      },
      update: { ruleValue: b.ruleValue },
      create: {
        establishmentId: b.establishmentId,
        ruleKey: b.ruleKey,
        ruleValue: b.ruleValue,
      },
    })
    return NextResponse.json(rule)
  } catch (error) {
    console.error('PUT /api/wage-rules failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')
    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId is required' }, { status: 400 })
    }
    await prisma.wageRule.deleteMany({ where: { establishmentId } })
    return NextResponse.json({ reset: true })
  } catch (error) {
    console.error('DELETE /api/wage-rules failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
