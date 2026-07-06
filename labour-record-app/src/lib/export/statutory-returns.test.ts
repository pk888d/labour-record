import { describe, expect, it } from 'vitest'
import {
  buildEcrLines,
  buildEsiReturnRows,
  ESI_REASON_NO_WORK,
  ESI_REASON_NOT_REQUIRED,
  type EcrInput,
  type EsiInput,
} from './statutory-returns'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const pfEmp = (over: Partial<EcrInput> = {}): EcrInput => ({
  name: 'Asha Rao',
  uan: '100234567890',
  pfMode: 'PERCENT',
  pfPercent: 12,
  pfAmount: 0,
  pfWageCeiling: 15000,
  grossWages: 28000,
  pfWage: 25000,
  pfContribution: 1800,
  wageDays: 26,
  daysInMonth: 31,
  ...over,
})

const esiEmp = (over: Partial<EsiInput> = {}): EsiInput => ({
  name: 'Sundari Devi',
  esiNo: '3100456789',
  esiApplicable: true,
  grossWages: 12000,
  wageDays: 26,
  lastWorkingDay: '',
  ...over,
})

// ---------------------------------------------------------------------------
// ECR 2.0 golden-file tests — assert EXACT full lines
// ---------------------------------------------------------------------------

describe('buildEcrLines (EPFO ECR 2.0)', () => {
  it('emits the exact golden line for a ceiling-capped PERCENT employee', () => {
    // pfWage 25000 capped at 15000 → EPF wages 15000; EPS = min(15000, 15000);
    // EPS contri = round(8.33% × 15000) = 1250; diff = round(12% × 15000) − 1250 = 550;
    // NCP = 31 − 26 = 5.
    const { lines, skipped } = buildEcrLines([pfEmp()])
    expect(skipped).toEqual([])
    expect(lines).toEqual([
      '100234567890#~#ASHA RAO#~#28000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#5#~#0',
    ])
  })

  it('emits the exact golden line for an uncapped employee, sanitising the member name and rounding paise', () => {
    // No ceiling (0 = uncapped): EPF wages = round(9000.4) = 9000; EPS contri =
    // round(8.33% × 9000) = 750; diff = round(12% × 9000) − 750 = 1080 − 750 = 330.
    // Name keeps only A-Z, space and dot, uppercased, whitespace collapsed.
    const { lines, skipped } = buildEcrLines([
      pfEmp({
        name: 'Ravi Kumar-2  (Jr.)',
        uan: '101122334455',
        pfWageCeiling: 0,
        grossWages: 10000.4,
        pfWage: 9000.4,
        pfContribution: 1080.05,
        wageDays: 30,
        daysInMonth: 30,
      }),
    ])
    expect(skipped).toEqual([])
    expect(lines).toEqual([
      '101122334455#~#RAVI KUMAR JR.#~#10000#~#9000#~#9000#~#9000#~#1080#~#750#~#330#~#0#~#0',
    ])
  })

  it('uses the cycle PF contribution as-is for FIXED-mode employees', () => {
    const { lines } = buildEcrLines([
      pfEmp({ pfMode: 'FIXED', pfPercent: 0, pfAmount: 1800, pfContribution: 1800 }),
    ])
    expect(lines).toEqual([
      '100234567890#~#ASHA RAO#~#28000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#5#~#0',
    ])
  })

  it('every line has exactly 10 #~# separators (11 fields)', () => {
    const { lines } = buildEcrLines([pfEmp(), pfEmp({ uan: '101122334455', name: 'B' })])
    for (const line of lines) expect(line.split('#~#')).toHaveLength(11)
  })

  it('skips (with reason) PF-applicable employees whose UAN is missing — never emits an invalid line', () => {
    const { lines, skipped } = buildEcrLines([
      pfEmp({ name: 'No Uan Nila', uan: null }),
      pfEmp({ name: 'Blank Uan Balu', uan: '   ' }),
    ])
    expect(lines).toEqual([])
    expect(skipped).toEqual([
      { name: 'No Uan Nila', reason: 'Missing UAN' },
      { name: 'Blank Uan Balu', reason: 'Missing UAN' },
    ])
  })

  it('silently excludes employees where PF does not apply (NONE / zero-percent / zero-fixed)', () => {
    const { lines, skipped } = buildEcrLines([
      pfEmp({ name: 'None Mode', uan: null, pfMode: 'NONE' }), // even without UAN: not skipped, not emitted
      pfEmp({ name: 'Zero Percent', pfMode: 'PERCENT', pfPercent: 0 }),
      pfEmp({ name: 'Zero Fixed', pfMode: 'FIXED', pfAmount: 0 }),
    ])
    expect(lines).toEqual([])
    expect(skipped).toEqual([])
  })

  it('floors NCP days at 0 when wage days exceed days in month', () => {
    const { lines } = buildEcrLines([pfEmp({ wageDays: 35, daysInMonth: 31 })])
    expect(lines[0].split('#~#')[9]).toBe('0')
  })

  it('EPS wages stay below the 15000 statutory ceiling even when the employee ceiling is higher', () => {
    // Employee-level ceiling 20000: EPF wages = 18000, but EPS/EDLI cap at 15000.
    // EPS contri = 1250; diff = round(12% × 18000) − 1250 = 2160 − 1250 = 910.
    const { lines } = buildEcrLines([
      pfEmp({ pfWageCeiling: 20000, pfWage: 18000, pfContribution: 2160 }),
    ])
    expect(lines).toEqual([
      '100234567890#~#ASHA RAO#~#28000#~#18000#~#15000#~#15000#~#2160#~#1250#~#910#~#5#~#0',
    ])
  })

  it('returns empty results for an empty roster', () => {
    expect(buildEcrLines([])).toEqual({ lines: [], skipped: [] })
  })
})

// ---------------------------------------------------------------------------
// ESI return golden tests — assert exact row objects
// ---------------------------------------------------------------------------

describe('buildEsiReturnRows (ESIC monthly-contribution upload)', () => {
  it('emits the exact golden row for a regular IP', () => {
    const { rows, skipped } = buildEsiReturnRows([esiEmp()])
    expect(skipped).toEqual([])
    expect(rows).toEqual([
      {
        ipNumber: '3100456789',
        ipName: 'Sundari Devi',
        noOfDays: 26,
        totalMonthlyWages: 12000,
        reasonCode: ESI_REASON_NOT_REQUIRED,
        lastWorkingDay: '',
      },
    ])
  })

  it('rounds wages to whole rupees and trims the IP name/number', () => {
    const { rows } = buildEsiReturnRows([
      esiEmp({ name: '  Sundari Devi  ', esiNo: ' 3100456789 ', grossWages: 12000.6 }),
    ])
    expect(rows[0]).toMatchObject({ ipNumber: '3100456789', ipName: 'Sundari Devi', totalMonthlyWages: 12001 })
  })

  it('uses the zero-working-days reason code when wage days are 0', () => {
    const { rows } = buildEsiReturnRows([esiEmp({ wageDays: 0, grossWages: 0 })])
    expect(rows).toEqual([
      {
        ipNumber: '3100456789',
        ipName: 'Sundari Devi',
        noOfDays: 0,
        totalMonthlyWages: 0,
        reasonCode: ESI_REASON_NO_WORK,
        lastWorkingDay: '',
      },
    ])
  })

  it('passes through the last working day for an employee exited in the month', () => {
    const { rows } = buildEsiReturnRows([esiEmp({ lastWorkingDay: '15/03/2094' })])
    expect(rows[0].lastWorkingDay).toBe('15/03/2094')
  })

  it('skips (with reason) ESI-applicable employees whose ESI number is missing', () => {
    const { rows, skipped } = buildEsiReturnRows([
      esiEmp({ name: 'No Esi Elan', esiNo: null }),
      esiEmp({ name: 'Blank Esi Bhanu', esiNo: '  ' }),
    ])
    expect(rows).toEqual([])
    expect(skipped).toEqual([
      { name: 'No Esi Elan', reason: 'Missing ESI number' },
      { name: 'Blank Esi Bhanu', reason: 'Missing ESI number' },
    ])
  })

  it('silently excludes employees where ESI does not apply — even with a missing ESI number', () => {
    const { rows, skipped } = buildEsiReturnRows([
      esiEmp({ name: 'Above Threshold', esiApplicable: false, grossWages: 30000 }),
      esiEmp({ name: 'Not Applicable No Number', esiApplicable: false, esiNo: null }),
    ])
    expect(rows).toEqual([])
    expect(skipped).toEqual([])
  })

  it('returns empty results for an empty roster', () => {
    expect(buildEsiReturnRows([])).toEqual({ rows: [], skipped: [] })
  })
})
