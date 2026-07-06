// One-off cleanup for TEC-23: corrupt WageRecord.otherAllowances JSON.
//
// Background: on 2026-06-10 a value shaped like `["[]"]` (a stringified empty
// array nested INSIDE the allowances array) was written by the wages PUT
// route and crashed statutory form rendering (Form XII/XVII/W/T). The write
// path is now fixed (see src/domain/validations/record-numbers.ts ->
// validateOtherAllowances, wired into src/app/api/form-tasks/[id]/wages/route.ts),
// but any rows already corrupted before that fix need a one-off repair.
//
// This scans every WageRecord, re-normalizes otherAllowances through the same
// validateOtherAllowances() used by the write path (dropping any non-numeric
// junk entries, keeping the valid numbers), and reports which rows would
// change vs. which are already clean.
//
// Usage:
//   npx tsx scripts/fix-other-allowances.ts            # dry run (default) — report only, no writes
//   npx tsx scripts/fix-other-allowances.ts --dry-run   # same as above, explicit
//   npx tsx scripts/fix-other-allowances.ts --apply     # actually persist the fixes

import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { validateOtherAllowances } from '../src/domain/validations/record-numbers'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const filePath = url.startsWith('file:') ? url.slice(5) : url

const adapter = new PrismaBetterSqlite3({ url: filePath })
const prisma = new PrismaClient({ adapter })

const apply = process.argv.includes('--apply')

async function main() {
  const records = await prisma.wageRecord.findMany({
    select: { id: true, otherAllowances: true, employeeId: true, cycleId: true },
  })

  let fixed = 0
  let untouched = 0
  let unparseable = 0

  for (const rec of records) {
    let parsed: unknown
    let parseFailed = false
    try {
      parsed = JSON.parse(rec.otherAllowances)
    } catch {
      parseFailed = true
      parsed = undefined
    }

    const { normalized } = validateOtherAllowances(parsed)
    const normalizedJson = JSON.stringify(normalized)

    if (parseFailed || normalizedJson !== rec.otherAllowances) {
      fixed++
      console.log(
        `${apply ? 'FIXED' : 'WOULD FIX'}  WageRecord ${rec.id} (employee ${rec.employeeId}, cycle ${rec.cycleId}): ` +
          `${JSON.stringify(rec.otherAllowances)} -> ${normalizedJson}`,
      )
      if (parseFailed) unparseable++
      if (apply) {
        await prisma.wageRecord.update({
          where: { id: rec.id },
          data: { otherAllowances: normalizedJson },
        })
      }
    } else {
      untouched++
    }
  }

  console.log('')
  console.log(`Scanned: ${records.length}`)
  console.log(`Fixed (${apply ? 'applied' : 'dry-run — not persisted'}): ${fixed}`)
  console.log(`  of which unparseable JSON: ${unparseable}`)
  console.log(`Untouched (already clean): ${untouched}`)
  if (!apply && fixed > 0) {
    console.log('')
    console.log('Re-run with --apply to persist these fixes.')
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
