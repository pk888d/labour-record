# Print Config Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the two print-pagination controls editable from an in-app Settings page (sidebar), persisted in the DB, with env vars + hardcoded values as fallback.

**Architecture:** A new key/value `AppSetting` table stores the values. `print-config.ts` holds the **pure** logic (`resolvePrintConfig`, `parseSettingValue`, `chunk`) — unit-tested, no DB. A new `print-config-server.ts` reads/wraps the DB (`getRawPrintSettings`, async `getPrintConfig` with DB→env→default precedence) — separated because `@/lib/prisma` opens the SQLite file at import time and must stay out of unit tests. A `/api/settings` route + `/settings` page + sidebar link expose editing. The print page awaits the config once and passes it into `paginateForm`.

**Tech Stack:** Next.js (App Router, server components + route handlers), React (client form), Prisma 7 + better-sqlite3, vitest, Playwright. Note: per `AGENTS.md` this Next.js may differ from training data — check `node_modules/next/dist/docs/` if a route-handler / `revalidatePath` API behaves unexpectedly.

---

## Reference: current state

- `src/lib/print-config.ts` exports sync `getPrintConfig(orientation)` (reads `process.env`), `chunk<T>`, plus internal `posIntEnv` / `singleSheetCeiling` / `DEFAULT_*`. Full current content is reproduced in Task 2.
- `src/lib/print-config.test.ts` currently tests sync `getPrintConfig` (via `vi.stubEnv`) and `chunk` (11 tests).
- `src/app/print/[cycleId]/[formCode]/page.tsx`: module-scope `paginateForm<T>(data, orientation, render)` calls the sync `getPrintConfig` itself; 9 `paginateForm(...)` call sites in the switch. Full current content reproduced in Task 5.
- `src/lib/prisma.ts` exports a `prisma` singleton (instantiated at import → opens SQLite). Route handlers import `{ prisma } from '@/lib/prisma'` and `{ NextResponse } from 'next/server'`.
- `src/components/sidebar.tsx`: `navItems` is an array of `{ section, items: [{ href, label, icon }] }`. Groups: Workspace / Masters / Output.
- Pages opt into dynamic rendering with `export const dynamic = 'force-dynamic'` (see `src/app/cycles/page.tsx`).
- Prisma model `AppSetting` → client accessor `prisma.appSetting`.
- Test scoping: `npm test -- <name>` filters; bare `npm test` also globs Playwright `e2e/*.spec.ts` which fail under vitest (pre-existing — ignore, always filter). Full build gate: `npm run build`. Migrations: `npx prisma migrate dev --name <n>` (creates migration + regenerates client).

---

## Task 1: AppSetting model + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_app_setting/migration.sql` (generated)

- [ ] **Step 1: Add the model**

Append to `prisma/schema.prisma` (after the last model):

```prisma
model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Create the migration + regenerate client**

Run: `npx prisma migrate dev --name add_app_setting`
Expected: creates `prisma/migrations/<ts>_add_app_setting/`, applies it to `dev.db`, prints "Your database is now in sync" and regenerates the client. 

- [ ] **Step 3: Verify the table + client accessor**

Run: `node -e "const{PrismaClient}=require('./src/generated/prisma/client');console.log(typeof new PrismaClient().appSetting.findMany)"`
Expected: prints `function`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add AppSetting key/value table"
```

---

## Task 2: Pure config logic in print-config.ts

Refactor `print-config.ts` to be PURE (no DB, no env reads): the math (`resolvePrintConfig`), a settings input parser (`parseSettingValue`), `chunk`, and shared constants/types. The env/DB reading moves to Task 3.

**Files:**
- Modify: `src/lib/print-config.ts`
- Modify (rewrite): `src/lib/print-config.test.ts`

- [ ] **Step 1: Rewrite the test file**

Replace the entire contents of `src/lib/print-config.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { resolvePrintConfig, parseSettingValue, chunk } from './print-config'

describe('resolvePrintConfig', () => {
  it('uses defaults when raw values are undefined', () => {
    const cfg = resolvePrintConfig(undefined, undefined, 'landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('uses provided raw values', () => {
    const cfg = resolvePrintConfig(15, 3, 'portrait')
    expect(cfg.maxRowsPerSheet).toBe(15)
    expect(cfg.minFillRows).toBe(3)
  })

  it('falls back to defaults for non-positive / non-integer raw values', () => {
    const cfg = resolvePrintConfig(0, -2, 'landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('clamps max to the landscape single-sheet ceiling (23)', () => {
    expect(resolvePrintConfig(999, undefined, 'landscape').maxRowsPerSheet).toBe(23)
  })

  it('clamps max to the portrait single-sheet ceiling (36)', () => {
    expect(resolvePrintConfig(999, undefined, 'portrait').maxRowsPerSheet).toBe(36)
  })
})

describe('parseSettingValue', () => {
  it('treats blank / null / undefined as "clear" (null)', () => {
    expect(parseSettingValue('')).toEqual({ ok: true, value: null })
    expect(parseSettingValue('   ')).toEqual({ ok: true, value: null })
    expect(parseSettingValue(null)).toEqual({ ok: true, value: null })
    expect(parseSettingValue(undefined)).toEqual({ ok: true, value: null })
  })

  it('accepts a positive integer (string or number)', () => {
    expect(parseSettingValue('15')).toEqual({ ok: true, value: 15 })
    expect(parseSettingValue(15)).toEqual({ ok: true, value: 15 })
  })

  it('rejects zero, negatives, and non-integers', () => {
    expect(parseSettingValue('0').ok).toBe(false)
    expect(parseSettingValue('-3').ok).toBe(false)
    expect(parseSettingValue('1.5').ok).toBe(false)
    expect(parseSettingValue('abc').ok).toBe(false)
  })
})

describe('chunk', () => {
  it('splits an even array', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]])
  })
  it('keeps the remainder in a final shorter chunk', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
  it('returns one empty sheet for an empty array', () => {
    expect(chunk([], 5)).toEqual([[]])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- print-config`
Expected: FAIL — `resolvePrintConfig` / `parseSettingValue` not exported.

- [ ] **Step 3: Rewrite `src/lib/print-config.ts`**

Replace the entire contents with:

```ts
// Pure logic for the print-register pagination config. No DB / env reads here
// (those live in print-config-server.ts) so this stays unit-testable and safe to
// import anywhere. Resolution precedence (saved DB value -> env -> default) is
// applied by the caller; this module only turns raw numbers into a final config.

export const DEFAULT_MAX_ROWS_PER_SHEET = 20
export const DEFAULT_MIN_FILL_ROWS = 5

export interface PrintConfig {
  maxRowsPerSheet: number
  minFillRows: number
}

// Saved raw values as the UI / resolver see them: a positive int, or null (unset).
export interface RawPrintSettings {
  maxRowsPerSheet: number | null
  minFillRows: number | null
}

function posIntOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isInteger(value) && value > 0 ? value : fallback
}

// Clamp so a chunk can never overflow into an un-headered second page
// (print-density.ts uses usableMm 150 landscape / 235 portrait and a 6.5mm floor).
function singleSheetCeiling(orientation: 'landscape' | 'portrait'): number {
  const usableMm = orientation === 'landscape' ? 150 : 235
  return Math.floor(usableMm / 6.5) // 23 landscape, 36 portrait
}

export function resolvePrintConfig(
  rawMax: number | undefined,
  rawMin: number | undefined,
  orientation: 'landscape' | 'portrait',
): PrintConfig {
  const requested = posIntOr(rawMax, DEFAULT_MAX_ROWS_PER_SHEET)
  const maxRowsPerSheet = Math.min(requested, singleSheetCeiling(orientation))
  const minFillRows = posIntOr(rawMin, DEFAULT_MIN_FILL_ROWS)
  return { maxRowsPerSheet, minFillRows }
}

export type ParseResult =
  | { ok: true; value: number | null }
  | { ok: false }

// Validate one Settings input: blank/null/undefined => clear (null); a positive
// integer => that number; anything else => invalid.
export function parseSettingValue(input: string | number | null | undefined): ParseResult {
  if (input === null || input === undefined) return { ok: true, value: null }
  if (typeof input === 'string' && input.trim() === '') return { ok: true, value: null }
  const n = Number(input)
  if (Number.isInteger(n) && n > 0) return { ok: true, value: n }
  return { ok: false }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]] // always render at least one (blank) sheet
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- print-config`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/print-config.ts src/lib/print-config.test.ts
git commit -m "refactor: pure resolvePrintConfig + parseSettingValue in print-config"
```

---

## Task 3: DB-backed config in print-config-server.ts

**Files:**
- Create: `src/lib/print-config-server.ts`

- [ ] **Step 1: Implement the server module**

Create `src/lib/print-config-server.ts`:

```ts
import { prisma } from '@/lib/prisma'
import {
  resolvePrintConfig,
  type PrintConfig,
  type RawPrintSettings,
} from '@/lib/print-config'

export const SETTING_KEYS = {
  maxRowsPerSheet: 'print.maxRowsPerSheet',
  minFillRows: 'print.minFillRows',
} as const

function toPosIntOrNull(value: string | undefined): number | null {
  if (value === undefined) return null
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

// Saved values (positive int) or null when unset — used by the Settings UI.
export async function getRawPrintSettings(): Promise<RawPrintSettings> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [SETTING_KEYS.maxRowsPerSheet, SETTING_KEYS.minFillRows] } },
  })
  const byKey = (k: string) => rows.find((r) => r.key === k)?.value
  return {
    maxRowsPerSheet: toPosIntOrNull(byKey(SETTING_KEYS.maxRowsPerSheet)),
    minFillRows: toPosIntOrNull(byKey(SETTING_KEYS.minFillRows)),
  }
}

// Effective config at print time: saved DB value -> env -> hardcoded default,
// then the per-orientation single-sheet clamp.
export async function getPrintConfig(
  orientation: 'landscape' | 'portrait',
): Promise<PrintConfig> {
  const raw = await getRawPrintSettings()
  const rawMax = raw.maxRowsPerSheet ?? toPosIntOrNull(process.env.PRINT_MAX_ROWS_PER_SHEET) ?? undefined
  const rawMin = raw.minFillRows ?? toPosIntOrNull(process.env.PRINT_MIN_FILL_ROWS) ?? undefined
  return resolvePrintConfig(rawMax, rawMin, orientation)
}
```

- [ ] **Step 2: Typecheck the new module compiles in a build**

(No unit test — DB I/O is exercised by the e2e in Task 7. Defer the build check to Task 5, where the print page consumes it. For now just confirm no syntax error:)
Run: `npx tsc --noEmit src/lib/print-config-server.ts 2>&1 | head -5 || true`
Expected: no errors that reference `print-config-server.ts` itself (project-wide Prisma/implicit-any noise from `--noEmit` on a single file is expected; the authoritative gate is `npm run build` in Task 5).

- [ ] **Step 3: Commit**

```bash
git add src/lib/print-config-server.ts
git commit -m "feat: DB-backed getPrintConfig + getRawPrintSettings (DB->env->default)"
```

---

## Task 4: /api/settings route

**Files:**
- Create: `src/app/api/settings/route.ts`

- [ ] **Step 1: Implement GET + PUT**

Create `src/app/api/settings/route.ts`:

```ts
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
```

- [ ] **Step 2: Defer runtime check to Task 7**

(The route is exercised by the e2e in Task 7 and the build in Task 5. No standalone step here.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/settings/route.ts
git commit -m "feat: /api/settings GET + PUT (validate, upsert/clear print settings)"
```

---

## Task 5: Consume async config in the print page

**Files:**
- Modify: `src/app/print/[cycleId]/[formCode]/page.tsx`

- [ ] **Step 1: Update the import**

Change:
```ts
import { getPrintConfig, chunk } from '@/lib/print-config'
```
to:
```ts
import { chunk, type PrintConfig } from '@/lib/print-config'
import { getPrintConfig } from '@/lib/print-config-server'
```

- [ ] **Step 2: Change `paginateForm` to take a `cfg` parameter (no longer calls getPrintConfig)**

Replace the current `paginateForm` function:
```ts
function paginateForm<T>(
  data: T[],
  orientation: 'landscape' | 'portrait',
  render: (rows: T[], startIndex: number) => React.ReactNode,
): React.ReactNode {
  const { maxRowsPerSheet, minFillRows } = getPrintConfig(orientation)
  return chunk(data, maxRowsPerSheet).map((rows, i, all) => (
    <div
      key={i}
      style={{
        ...printDensity(rows.length, orientation, minFillRows),
        breakAfter: i < all.length - 1 ? 'page' : 'auto',
      }}
    >
      {render(rows, i * maxRowsPerSheet)}
    </div>
  ))
}
```
with:
```ts
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
```

- [ ] **Step 3: Fetch the config once, before the switch**

After the existing lines:
```ts
  const ctx = await getCycleContext(cycleId).catch(() => null)
  if (!ctx) notFound()

  let body: React.ReactNode = null
```
insert immediately after `if (!ctx) notFound()` (and before `let body`):
```ts
  const cfg = await getPrintConfig(orientation)
```

- [ ] **Step 4: Pass `cfg` into every `paginateForm` call**

In the switch, update all 9 `paginateForm(` calls to insert `cfg` as the 2nd argument. The exact replacements (each is a one-line change):

```
paginateForm(wages, orientation, (rows, si) => <HospitalFormXII ctx={ctx} wages={rows} startIndex={si} />)
  -> paginateForm(wages, cfg, orientation, (rows, si) => <HospitalFormXII ctx={ctx} wages={rows} startIndex={si} />)

paginateForm(muster, orientation, (rows, si) => <HospitalFormV ctx={ctx} muster={rows} startIndex={si} />)
  -> paginateForm(muster, cfg, orientation, (rows, si) => <HospitalFormV ctx={ctx} muster={rows} startIndex={si} />)

paginateForm(employees, orientation, (rows, si) => <HospitalFormXI ctx={ctx} employees={rows} startIndex={si} />)
  -> paginateForm(employees, cfg, orientation, (rows, si) => <HospitalFormXI ctx={ctx} employees={rows} startIndex={si} />)

paginateForm(ot, orientation, (rows, si) => <HospitalFormIV ctx={ctx} ot={rows} startIndex={si} />)
  -> paginateForm(ot, cfg, orientation, (rows, si) => <HospitalFormIV ctx={ctx} ot={rows} startIndex={si} />)

paginateForm(fines, orientation, (rows, _si) => <HospitalFormI ctx={ctx} fines={rows} />)
  -> paginateForm(fines, cfg, orientation, (rows, _si) => <HospitalFormI ctx={ctx} fines={rows} />)

paginateForm(ded, orientation, (rows, _si) => <HospitalFormII ctx={ctx} deductions={rows} />)
  -> paginateForm(ded, cfg, orientation, (rows, _si) => <HospitalFormII ctx={ctx} deductions={rows} />)

paginateForm(wages, orientation, (rows, si) => <ShopFormW ctx={ctx} wages={rows} startIndex={si} />)
  -> paginateForm(wages, cfg, orientation, (rows, si) => <ShopFormW ctx={ctx} wages={rows} startIndex={si} />)

paginateForm(muster, orientation, (rows, si) => <ShopFormV ctx={ctx} muster={rows} startIndex={si} />)
  -> paginateForm(muster, cfg, orientation, (rows, si) => <ShopFormV ctx={ctx} muster={rows} startIndex={si} />)

paginateForm(leave, orientation, (rows, si) => <ShopFormX ctx={ctx} leave={rows} startIndex={si} />)
  -> paginateForm(leave, cfg, orientation, (rows, si) => <ShopFormX ctx={ctx} leave={rows} startIndex={si} />)
```

(The card forms — XVII, T, U — are unchanged; they don't call `paginateForm`.)

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: compiles; `/print/[cycleId]/[formCode]` and `/api/settings` routes present. (If it errors that the Prisma client is missing, run `npx prisma generate` first — known prerequisite.)

- [ ] **Step 6: Commit**

```bash
git add "src/app/print/[cycleId]/[formCode]/page.tsx"
git commit -m "feat: print page reads DB-backed config once, passes into paginateForm"
```

---

## Task 6: Settings page, form, and sidebar link

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/components/settings-form.tsx`
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Add the sidebar entry**

In `src/components/sidebar.tsx`, change the `navItems` array's `Output` group block from:
```ts
  { section: 'Output', items: [
    { href: '/exports', label: 'Exports', icon: '↓' },
  ]},
]
```
to:
```ts
  { section: 'Output', items: [
    { href: '/exports', label: 'Exports', icon: '↓' },
  ]},
  { section: 'System', items: [
    { href: '/settings', label: 'Settings', icon: '⚙' },
  ]},
]
```

- [ ] **Step 2: Create the client form**

Create `src/components/settings-form.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RawPrintSettings } from '@/lib/print-config'

type Props = {
  initial: RawPrintSettings
  ceilings: { landscape: number; portrait: number }
}

export function SettingsForm({ initial, ceilings }: Props) {
  const router = useRouter()
  const [maxRowsPerSheet, setMax] = useState(initial.maxRowsPerSheet?.toString() ?? '')
  const [minFillRows, setMin] = useState(initial.minFillRows?.toString() ?? '')
  const [errors, setErrors] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])
    setSaved(false)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxRowsPerSheet, minFillRows }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl p-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold">Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Print register layout</p>
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-red-600 list-disc pl-5">
          {errors.map((er, i) => <li key={i}>{er}</li>)}
        </ul>
      )}
      {saved && <p className="text-sm text-green-700">Saved.</p>}

      <label className="block">
        <span className="text-sm font-medium">Max employees per sheet</span>
        <input
          type="number"
          min={1}
          value={maxRowsPerSheet}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Default 20"
          className="mt-1 block w-40 border rounded px-2 py-1"
        />
        <span className="block text-xs text-gray-500 mt-1">
          Leave blank for the default (20). Values above the per-sheet ceiling
          ({ceilings.landscape} landscape / {ceilings.portrait} portrait) are capped
          so each sheet keeps its own header.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Min fill rows</span>
        <input
          type="number"
          min={1}
          value={minFillRows}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Default 5"
          className="mt-1 block w-40 border rounded px-2 py-1"
        />
        <span className="block text-xs text-gray-500 mt-1">
          Below this many employees, rows stretch to fill the whole page. Blank uses the default (5).
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded bg-[var(--ts-navy-mid)] text-white text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create the page**

Create `src/app/settings/page.tsx`:

```tsx
import { getRawPrintSettings } from '@/lib/print-config-server'
import { SettingsForm } from '@/components/settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const initial = await getRawPrintSettings()
  // Mirror singleSheetCeiling: floor(usableMm / 6.5).
  const ceilings = { landscape: Math.floor(150 / 6.5), portrait: Math.floor(235 / 6.5) }
  return <SettingsForm initial={initial} ceilings={ceilings} />
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compiles; `/settings` route present (dynamic `ƒ`). (Run `npx prisma generate` first if it complains about the client.)

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/page.tsx src/components/settings-form.tsx src/components/sidebar.tsx
git commit -m "feat: Settings page + sidebar entry to edit print config"
```

---

## Task 7: e2e + full verification + status

**Files:**
- Create: `e2e/12-settings.spec.ts`
- Modify: `status.md`

- [ ] **Step 1: Write the e2e spec**

Create `e2e/12-settings.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Settings — print config', () => {
  // Always restore defaults so other specs see env/default behavior.
  test.afterAll(async ({ request }) => {
    await request.put('/api/settings', { data: { maxRowsPerSheet: '', minFillRows: '' } })
  })

  test('Settings page is reachable from the sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.locator('aside').getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByText('Max employees per sheet')).toBeVisible()
  })

  test('saving a value persists it', async ({ page }) => {
    await page.goto('/settings')
    const maxInput = page.getByLabel('Max employees per sheet')
    await maxInput.fill('10')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Saved.')).toBeVisible()

    // Reload — the saved value is shown again.
    await page.goto('/settings')
    await expect(page.getByLabel('Max employees per sheet')).toHaveValue('10')
  })

  test('rejects a non-positive value', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Max employees per sheet').fill('0')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/positive whole number/i)).toBeVisible()
  })

  test('clearing a value reverts to default (blank persists)', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Max employees per sheet').fill('')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Saved.')).toBeVisible()
    await page.goto('/settings')
    await expect(page.getByLabel('Max employees per sheet')).toHaveValue('')
  })
})
```

- [ ] **Step 2: Run the new e2e (auto-starts dev server, uses seeded dev.db)**

Run: `npx playwright test e2e/12-settings.spec.ts --reporter=list`
Expected: 4 passed. (If `getByLabel` doesn't match, confirm the `<label>` wraps the input text + control as in `settings-form.tsx`; Playwright associates wrapped labels.)

- [ ] **Step 3: Run the print e2e to confirm no regression**

Run: `npx playwright test e2e/07-print-views.spec.ts e2e/10-print-pagination.spec.ts --reporter=list`
Expected: 11 + 3 = 14 passed (config now read from DB, none saved during this run since 12-settings cleaned up → identical to defaults).

- [ ] **Step 4: Run the full unit suite**

Run: `npm test`
Expected: all unit tests pass (print-config now 11 tests for resolve/parse/chunk). The 13 e2e files vitest wrongly globs still "fail to load" — pre-existing, unrelated.

- [ ] **Step 5: Update status.md**

Add a `### Task Update — <today> — Print config Settings page` entry per the repo's status.md format (Task / Status: completed / Scope / Files changed / Metrics impact / Validation / Next step).

- [ ] **Step 6: Commit**

```bash
git add e2e/12-settings.spec.ts status.md
git commit -m "test: e2e for Settings page + status update"
```

---

## Self-review notes

- **Spec coverage:** AppSetting table (T1) ✓; pure resolve + parse (T2) ✓; DB→env→default getPrintConfig + getRawPrintSettings (T3) ✓; /api/settings GET/PUT with validate + clear (T4) ✓; print page awaits config once, passes into paginateForm (T5) ✓; Settings page + form + sidebar (T6) ✓; e2e + verification + status (T7) ✓. Env vars remain as fallback (T3) and `.env.example` stays as-is (no change needed) ✓.
- **Deviation from spec:** DB I/O lives in `print-config-server.ts` (not `print-config.ts`) so `@/lib/prisma`'s import-time DB open stays out of vitest. `print-config.ts` keeps the pure `resolvePrintConfig`/`parseSettingValue`/`chunk`. Faithful to the spec's "pure core + thin I/O wrapper" intent.
- **Type consistency:** `PrintConfig` / `RawPrintSettings` / `resolvePrintConfig(rawMax,rawMin,orientation)` / `parseSettingValue(...) -> {ok,value?}` / `getPrintConfig(orientation): Promise<PrintConfig>` / `getRawPrintSettings(): Promise<RawPrintSettings>` / `SETTING_KEYS` / new 4-arg `paginateForm(data, cfg, orientation, render)` used consistently across T2–T6.
- **No placeholders:** every code step is complete.
