'use client'
import { useState, useMemo } from 'react'
import { WAGE_RULE_DEFAULTS } from '@/domain/calculations/wage-defaults'
import { Info } from '@/components/info-tooltip'

type Establishment = { id: string; name: string }
type RuleRow = { ruleKey: string; ruleValue: number; isCustom: boolean; id: string | null }

const RULE_INFO: Record<string, { label: string; info: string; min: number; max: number }> = {
  HOLIDAY_MULTIPLIER: {
    label: 'Holiday Work Multiplier (×)',
    info: 'Pay multiplier for working on a government holiday. 2 = double wages. Statutory minimum is 2×.',
    min: 1, max: 3,
  },
  OT_MULTIPLIER: {
    label: 'Overtime Multiplier (×)',
    info: 'Pay multiplier for overtime hours. 2 = double the hourly rate for OT hours.',
    min: 1, max: 3,
  },
  PF_EMPLOYEE_PCT: {
    label: 'PF Employee (%)',
    info: 'Employee PF contribution as % of Basic wage. Statutory rate: 12%. e.g. Basic ₹6,000 → PF ₹720.',
    min: 0, max: 12,
  },
  PF_EMPLOYER_PCT: {
    label: 'PF Employer (%)',
    info: 'Employer PF contribution as % of Basic wage. Statutory rate: 13% (12% PF + 1% admin).',
    min: 0, max: 15,
  },
  PF_WAGE_CEILING: {
    label: 'PF Wage Ceiling (₹)',
    info: 'PF is computed on the PF wage capped at this ceiling. Statutory ceiling: ₹15,000 → max PF ₹1,800 at 12%. Set 0 for no cap.',
    min: 0, max: 100000,
  },
  ESI_EMPLOYEE_PCT: {
    label: 'ESI Employee (%)',
    info: 'Employee ESI contribution as % of gross wages. Statutory rate: 0.75%. e.g. Gross ₹7,360 → ESI ₹55.20.',
    min: 0, max: 1.75,
  },
  ESI_EMPLOYER_PCT: {
    label: 'ESI Employer (%)',
    info: 'Employer ESI contribution as % of gross wages. Statutory rate: 3.25%.',
    min: 0, max: 5,
  },
  ESI_THRESHOLD: {
    label: 'ESI Threshold (₹)',
    info: 'ESI applies only when gross wages are at or below this amount. Statutory threshold: ₹21,000. Set 0 to always apply.',
    min: 0, max: 100000,
  },
  LWF_EMPLOYEE: {
    label: 'LWF Employee (₹/month)',
    info: 'Labour Welfare Fund deducted from the employee each month (flat amount).',
    min: 0, max: 1000,
  },
}

// Maps each salary slip line to the rule key that drives it
const LINE_RULE: Record<string, string> = {
  holidayBonus: 'HOLIDAY_MULTIPLIER',
  otEarnings:   'OT_MULTIPLIER',
  pfEmployee:   'PF_EMPLOYEE_PCT',
  pfEmployer:   'PF_EMPLOYER_PCT',
  esiEmployee:  'ESI_EMPLOYEE_PCT',
  esiEmployer:  'ESI_EMPLOYER_PCT',
  lwf:          'LWF_EMPLOYEE',
}

function r2(n: number) { return Math.round(n * 100) / 100 }
function fmt(n: number) { return '₹' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }

function getRuleVal(rules: RuleRow[], key: string): number {
  return rules.find((r) => r.ruleKey === key)?.ruleValue ?? WAGE_RULE_DEFAULTS[key] ?? 0
}

export function WageRulesClient({ establishments }: { establishments: Establishment[] }) {
  const [selectedId, setSelectedId] = useState('')
  const [rules, setRules] = useState<RuleRow[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Salary slip simulator inputs
  const [slip, setSlip] = useState({
    monthlyBasic: 6000,
    monthlyDa: 1360,
    fixedAllowance: 360,
    daysInMonth: 30,
    wageDays: 26,
    holidayDaysWorked: 0,
    otHours: 0,
  })
  const setSlipField = (field: string, val: number) =>
    setSlip((p) => ({ ...p, [field]: val }))

  async function loadRules(id: string) {
    setSelectedId(id)
    setEditingKey(null)
    setErrors([])
    if (!id) { setRules([]); return }
    const res = await fetch(`/api/wage-rules?establishmentId=${id}`)
    const data = await res.json() as RuleRow[]
    setRules(data)
  }

  async function saveRule(ruleKey: string) {
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) {
      setErrors(['Value must be a non-negative number'])
      return
    }
    const ruleInfo = RULE_INFO[ruleKey]
    if (ruleInfo && (val < ruleInfo.min || val > ruleInfo.max)) {
      setErrors([`${ruleInfo.label}: value should be between ${ruleInfo.min} and ${ruleInfo.max}`])
      return
    }
    setSaving(true)
    setErrors([])
    const res = await fetch('/api/wage-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ establishmentId: selectedId, ruleKey, ruleValue: val }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[] }
      setErrors(data.errors ?? ['Save failed'])
      return
    }
    setRules((prev) =>
      prev.map((r) => r.ruleKey === ruleKey ? { ...r, ruleValue: val, isCustom: true } : r)
    )
    setEditingKey(null)
  }

  async function resetToDefaults() {
    if (!window.confirm('Reset all wage rules for this establishment to system defaults? This cannot be undone.')) return
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/wage-rules?establishmentId=${selectedId}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) { setErrors(['Reset failed']); return }
    setRules((prev) =>
      prev.map((r) => ({ ...r, ruleValue: WAGE_RULE_DEFAULTS[r.ruleKey] ?? r.ruleValue, isCustom: false, id: null }))
    )
    setEditingKey(null)
  }

  // ── Live salary slip calculation ──────────────────────────────────────────
  const calc = useMemo(() => {
    const { monthlyBasic, monthlyDa, fixedAllowance, daysInMonth, wageDays, holidayDaysWorked, otHours } = slip
    const safeWageDays = Math.min(wageDays, daysInMonth)

    const proratedBasic = daysInMonth > 0 ? r2(monthlyBasic * safeWageDays / daysInMonth) : 0
    const proratedDa    = daysInMonth > 0 ? r2(monthlyDa    * safeWageDays / daysInMonth) : 0

    const holidayMult  = getRuleVal(rules, 'HOLIDAY_MULTIPLIER')
    const otMult       = getRuleVal(rules, 'OT_MULTIPLIER')
    const pfEmpPct     = getRuleVal(rules, 'PF_EMPLOYEE_PCT')
    const pfErPct      = getRuleVal(rules, 'PF_EMPLOYER_PCT')
    const pfCeiling    = getRuleVal(rules, 'PF_WAGE_CEILING')
    const esiEmpPct    = getRuleVal(rules, 'ESI_EMPLOYEE_PCT')
    const esiErPct     = getRuleVal(rules, 'ESI_EMPLOYER_PCT')
    const esiThreshold = getRuleVal(rules, 'ESI_THRESHOLD')
    const lwf          = getRuleVal(rules, 'LWF_EMPLOYEE')

    const dailyRate     = safeWageDays > 0 ? r2((proratedBasic + proratedDa) / safeWageDays) : 0
    const holidayBonus  = r2(dailyRate * (holidayMult - 1) * holidayDaysWorked)
    const hourlyRate    = r2(dailyRate / 8)
    const otEarnings    = r2(hourlyRate * otMult * otHours)

    const totalEarnings = r2(proratedBasic + proratedDa + fixedAllowance + holidayBonus)
    const grossWages    = r2(totalEarnings + otEarnings)

    // PF on the PF wage capped at the ceiling (0 = no cap); ESI only at/below threshold.
    const pfWage      = pfCeiling > 0 ? Math.min(proratedBasic, pfCeiling) : proratedBasic
    const esiApplies  = esiThreshold <= 0 || grossWages <= esiThreshold
    const pfEmployee  = r2(pfWage * pfEmpPct / 100)
    const esiEmployee = r2(esiApplies ? grossWages * esiEmpPct / 100 : 0)
    const totalDeductions = r2(pfEmployee + esiEmployee + lwf)
    const netPay      = r2(grossWages - totalDeductions)

    const pfEmployer  = r2(pfWage * pfErPct / 100)
    const esiEmployer = r2(esiApplies ? grossWages * esiErPct / 100 : 0)
    const totalCtc    = r2(grossWages + pfEmployer + esiEmployer)

    return {
      proratedBasic, proratedDa, fixedAllowance, holidayBonus, otEarnings,
      totalEarnings, grossWages,
      pfEmployee, esiEmployee, lwf, totalDeductions, netPay,
      pfEmployer, esiEmployer, totalCtc, esiApplies,
      // formula strings
      formulas: {
        proratedBasic: `₹${monthlyBasic} × ${safeWageDays} days ÷ ${daysInMonth} days`,
        proratedDa:    `₹${monthlyDa} × ${safeWageDays} days ÷ ${daysInMonth} days`,
        holidayBonus:  `daily rate ₹${dailyRate} × (${holidayMult}× − 1) × ${holidayDaysWorked} holiday(s)`,
        otEarnings:    `₹${hourlyRate}/hr × ${otMult}× × ${otHours} hrs`,
        pfEmployee:    `min(₹${proratedBasic}, ₹${pfCeiling} ceiling) × ${pfEmpPct}%`,
        esiEmployee:   esiApplies ? `₹${grossWages} gross × ${esiEmpPct}%` : `gross ₹${grossWages} > ₹${esiThreshold} threshold → Nil`,
        pfEmployer:    `min(₹${proratedBasic}, ₹${pfCeiling} ceiling) × ${pfErPct}%`,
        esiEmployer:   esiApplies ? `₹${grossWages} gross × ${esiErPct}%` : `over ₹${esiThreshold} threshold → Nil`,
        lwf:           'flat monthly amount (LWF_EMPLOYEE rule)',
      },
    }
  }, [slip, rules])

  // Highlight a slip row if its driving rule is currently being edited
  function rowHighlight(lineKey: string) {
    const ruleKey = LINE_RULE[lineKey]
    if (!ruleKey || editingKey !== ruleKey) return ''
    return 'bg-[#1a3a1a] ring-1 ring-[#40c070] rounded'
  }

  const inputClass = 'bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-2 py-1 rounded w-full'
  const slipRow = (label: string, value: number, formula: string, lineKey?: string, ruleKey?: string) => {
    const highlight = lineKey ? rowHighlight(lineKey) : ''
    const isHighlighted = lineKey ? LINE_RULE[lineKey] === editingKey : false
    return (
      <div className={`flex items-baseline justify-between py-1 px-2 ${highlight}`}>
        <div className="flex-1 min-w-0">
          <span className="text-[#c8d8e8] text-xs">{label}</span>
          {ruleKey && (
            <span className={`ml-2 text-[9px] px-1 py-0.5 rounded ${isHighlighted ? 'bg-[#0f3a0f] text-[#40c070] font-semibold' : 'bg-[#1a2a3a] text-[#5a8ab8]'}`}>
              {ruleKey}
            </span>
          )}
          <div className="text-[9px] text-[#3a5a7a] mt-0.5 truncate">{formula}</div>
        </div>
        <span className="text-xs font-mono text-white ml-3 whitespace-nowrap">{fmt(value)}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#1e2d3d]">
        <div>
          <p className="text-xs text-[#5a8ab8]">Masters › Wage Rules</p>
          <h1 className="text-lg font-semibold text-white mt-0.5">Wage Rules</h1>
          <p className="text-[11px] text-[#4a6a8a] mt-0.5">Configure calculation rules per establishment · Live salary slip shows the impact</p>
        </div>
      </div>

      {/* Establishment selector */}
      <div className="px-6 py-4 border-b border-[#1e2d3d]">
        <label className="block text-[10px] text-[#5a8ab8] uppercase tracking-wider mb-1" htmlFor="est-select">
          Establishment
        </label>
        <select
          id="est-select"
          value={selectedId}
          onChange={(e) => loadRules(e.target.value)}
          aria-label="Establishment"
          className="bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-3 py-1.5 rounded w-64"
        >
          <option value="">— Select establishment —</option>
          {establishments.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {errors.length > 0 && (
        <div className="mx-6 mt-3 bg-[#2a1010] border border-[#5a2020] rounded p-2 text-xs text-[#f07070]">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Two-column layout: rules left, salary slip right */}
      <div className="flex gap-0 divide-x divide-[#1e2d3d]">

        {/* ── Left: Rules table ─────────────────────────────────────── */}
        <div className="flex-1 px-6 py-4">
          {selectedId && rules.length > 0 ? (
            <>
              {editingKey && (
                <p className="text-[10px] text-[#40c070] mb-2">
                  Editing <span className="font-mono font-semibold">{editingKey}</span> — the affected salary slip line is highlighted →
                </p>
              )}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1e2d3d]">
                    <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Rule</th>
                    <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Default</th>
                    <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Current</th>
                    <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => {
                    const info = RULE_INFO[r.ruleKey]
                    const isBeingEdited = editingKey === r.ruleKey
                    return (
                      <tr key={r.ruleKey}
                        className={`border-b border-[#1a2332] ${isBeingEdited ? 'bg-[#0f2a0f]' : 'hover:bg-[#111d2d]'}`}
                      >
                        <td className="py-2 px-2 text-[#c8d8e8]">
                          {info ? (
                            <span className="inline-flex items-center gap-0.5">
                              {info.label}
                              <Info text={info.info} />
                            </span>
                          ) : (
                            r.ruleKey
                          )}
                          <div className="font-mono text-[9px] text-[#4a6a8a] mt-0.5">{r.ruleKey}</div>
                        </td>
                        <td className="py-2 px-2 text-right text-[#4a6a8a]">{WAGE_RULE_DEFAULTS[r.ruleKey]}</td>
                        <td className="py-2 px-2 text-right">
                          {isBeingEdited ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 bg-[#1a2a3a] border border-[#4a9eff] rounded px-1 py-0.5 text-xs text-[#c8d8e8] text-right"
                              autoFocus
                            />
                          ) : (
                            <span className={r.isCustom ? 'text-[#4a9eff] font-semibold' : 'text-white'}>
                              {r.ruleValue}
                              {!r.isCustom && (
                                <span className="ml-1 text-[9px] text-[#4a6a8a] font-normal">default</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {isBeingEdited ? (
                            <span className="flex gap-1 justify-end">
                              <button onClick={() => saveRule(r.ruleKey)} disabled={saving}
                                className="text-[10px] px-2 py-0.5 bg-[#1a5adc] text-white rounded hover:bg-[#2a6aec] disabled:opacity-50">
                                Save
                              </button>
                              <button onClick={() => setEditingKey(null)}
                                className="text-[10px] px-2 py-0.5 border border-[#2a3a50] text-[#7a9ab8] rounded hover:bg-[#1a2a3a]">
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => { setEditingKey(r.ruleKey); setEditValue(String(r.ruleValue)) }}
                              className="text-[10px] px-2 py-0.5 border border-[#2a3a50] text-[#4a9eff] rounded hover:bg-[#1a2a3a]"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="mt-4">
                <button onClick={resetToDefaults} disabled={saving}
                  className="px-4 py-1.5 bg-[#2a1010] border border-[#5a2020] text-[#f07070] text-xs font-medium rounded hover:bg-[#3a1010] disabled:opacity-50">
                  Reset to Defaults
                </button>
              </div>
            </>
          ) : selectedId ? (
            <div className="text-sm text-[#4a6a8a]">Loading rules…</div>
          ) : (
            <div className="text-sm text-[#4a6a8a]">Select an establishment to configure rules.</div>
          )}
        </div>

        {/* ── Right: Salary Slip Simulator ──────────────────────────── */}
        <div className="w-80 shrink-0 px-5 py-4 bg-[#080f18]">
          <p className="text-[10px] text-[#5a8ab8] uppercase tracking-wider mb-3">
            Salary Slip Simulator
          </p>

          {/* Sample inputs */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4">
            {[
              { label: 'Monthly Basic (₹)', field: 'monthlyBasic', min: 0 },
              { label: 'Monthly DA (₹)',    field: 'monthlyDa',    min: 0 },
              { label: 'Fixed Allowance (₹)', field: 'fixedAllowance', min: 0 },
              { label: 'Days in Month',     field: 'daysInMonth',  min: 1 },
              { label: 'Wage Days Worked',  field: 'wageDays',     min: 0 },
              { label: 'Holiday Days Worked', field: 'holidayDaysWorked', min: 0 },
              { label: 'OT Hours',          field: 'otHours',      min: 0 },
            ].map(({ label, field, min }) => (
              <div key={field}>
                <label className="block text-[9px] text-[#4a6a8a] mb-0.5">{label}</label>
                <input
                  type="number"
                  min={min}
                  step="0.01"
                  value={slip[field as keyof typeof slip]}
                  onChange={(e) => setSlipField(field, parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* Salary Slip */}
          <div className="border border-[#1e2d3d] rounded overflow-hidden text-[11px]">
            {/* Earnings */}
            <div className="bg-[#0a1520] px-2 py-1">
              <span className="text-[9px] text-[#5a8ab8] uppercase tracking-wider font-semibold">Earnings</span>
            </div>
            {slipRow('Basic (prorated)',     calc.proratedBasic,  calc.formulas.proratedBasic)}
            {slipRow('DA (prorated)',        calc.proratedDa,     calc.formulas.proratedDa)}
            {slipRow('Fixed Allowance',      calc.fixedAllowance, 'as configured')}
            {slipRow('Holiday Bonus',        calc.holidayBonus,   calc.formulas.holidayBonus,   'holidayBonus', 'HOLIDAY_MULTIPLIER')}
            {slipRow('OT Earnings',          calc.otEarnings,     calc.formulas.otEarnings,      'otEarnings',   'OT_MULTIPLIER')}
            <div className="flex justify-between items-center px-2 py-1.5 bg-[#0f2030] border-t border-[#1e2d3d]">
              <span className="text-xs font-semibold text-[#c8d8e8]">Gross Wages</span>
              <span className="text-xs font-bold font-mono text-[#40c070]">{fmt(calc.grossWages)}</span>
            </div>

            {/* Deductions */}
            <div className="bg-[#0a1520] px-2 py-1 border-t border-[#1e2d3d]">
              <span className="text-[9px] text-[#5a8ab8] uppercase tracking-wider font-semibold">Deductions (Employee)</span>
            </div>
            {slipRow('PF',  calc.pfEmployee,  calc.formulas.pfEmployee,  'pfEmployee',  'PF_EMPLOYEE_PCT')}
            {slipRow('ESI', calc.esiEmployee, calc.formulas.esiEmployee, 'esiEmployee', 'ESI_EMPLOYEE_PCT')}
            {slipRow('LWF', calc.lwf,         calc.formulas.lwf,         'lwf',         'LWF_EMPLOYEE')}
            <div className="flex justify-between items-center px-2 py-1.5 bg-[#0f2030] border-t border-[#1e2d3d]">
              <span className="text-xs font-semibold text-[#c8d8e8]">Total Deductions</span>
              <span className="text-xs font-bold font-mono text-[#f07070]">{fmt(calc.totalDeductions)}</span>
            </div>

            {/* Net */}
            <div className="flex justify-between items-center px-2 py-2 bg-[#0a2010] border-t border-[#2a4a2a]">
              <span className="text-sm font-bold text-white">Net Pay</span>
              <span className="text-sm font-bold font-mono text-[#40c070]">{fmt(calc.netPay)}</span>
            </div>

            {/* Employer cost */}
            <div className="bg-[#0a1520] px-2 py-1 border-t border-[#1e2d3d]">
              <span className="text-[9px] text-[#5a8ab8] uppercase tracking-wider font-semibold">Employer Contributions</span>
            </div>
            {slipRow('PF Employer',  calc.pfEmployer,  calc.formulas.pfEmployer,  'pfEmployer',  'PF_EMPLOYER_PCT')}
            {slipRow('ESI Employer', calc.esiEmployer, calc.formulas.esiEmployer, 'esiEmployer', 'ESI_EMPLOYER_PCT')}
            <div className="flex justify-between items-center px-2 py-1.5 bg-[#0f2030] border-t border-[#1e2d3d]">
              <span className="text-xs font-semibold text-[#c8d8e8]">Total CTC</span>
              <span className="text-xs font-bold font-mono text-[#c087f0]">{fmt(calc.totalCtc)}</span>
            </div>
          </div>

          {!selectedId && (
            <p className="text-[10px] text-[#4a6a8a] mt-2">
              Select an establishment to use its saved rules. Default system values are used until then.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
