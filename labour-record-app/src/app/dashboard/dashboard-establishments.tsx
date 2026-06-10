'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ESTABLISHMENT_TYPE_LABELS } from '@/domain/calculations/da-rates'
import type { EstablishmentType } from '@/types'

export type EstRow = {
  id: string
  name: string
  type: EstablishmentType
  address: string
  employerName: string
  managerName: string
  regCertNo: string
  contactPhone: string | null
  contactEmail: string | null
  processingFee: number
  serviceStartDate: string | null
  employees: number
  cycles: number
  daRate: number
}

type View = 'cards' | 'table' | 'rows' | 'directory'
const fmtMoney = (n: number) => '₹' + n.toLocaleString('en-IN')
const typeLabel = (t: EstablishmentType) => ESTABLISHMENT_TYPE_LABELS[t] ?? t
const contact = (e: EstRow) =>
  [e.contactPhone, e.contactEmail].filter(Boolean).join(' · ') || '—'

const VIEWS: { key: View; label: string; icon: React.ReactNode }[] = [
  { key: 'cards', label: 'Cards', icon: <Grid /> },
  { key: 'table', label: 'Table', icon: <TableIcon /> },
  { key: 'rows', label: 'Expandable', icon: <Rows /> },
  { key: 'directory', label: 'Directory', icon: <Columns /> },
]

export function DashboardEstablishments({ establishments }: { establishments: EstRow[] }) {
  const [view, setView] = useState<View>('cards')

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-view') as View | null
    if (saved && VIEWS.some((v) => v.key === saved)) setView(saved)
  }, [])

  function pick(v: View) {
    setView(v)
    localStorage.setItem('dashboard-view', v)
  }

  return (
    <div>
      {/* View switcher */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-[var(--ts-text-muted)]">Establishments</p>
        <div className="flex items-center rounded-lg border border-[var(--ts-border)] overflow-hidden">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => pick(v.key)}
              title={v.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                view === v.key
                  ? 'bg-[var(--ts-gold)] text-[var(--ts-navy)] font-semibold'
                  : 'text-[var(--ts-text-secondary)] hover:bg-[var(--ts-navy-light)]'
              }`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {establishments.length === 0 ? (
        <p className="text-[var(--ts-text-muted)] text-sm">
          No firms yet.{' '}
          <Link href="/establishments/new" className="text-[var(--ts-gold)] hover:underline">Register the first one.</Link>
        </p>
      ) : view === 'cards' ? (
        <CardsView rows={establishments} />
      ) : view === 'table' ? (
        <TableView rows={establishments} />
      ) : view === 'rows' ? (
        <RowsView rows={establishments} />
      ) : (
        <DirectoryView rows={establishments} />
      )}
    </div>
  )
}

/* ── A. Rich cards ─────────────────────────────────────────── */
function CardsView({ rows }: { rows: EstRow[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((e) => (
        <div key={e.id} className="rounded-lg bg-[var(--ts-navy-mid)] border border-[var(--ts-border)] p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <Link href={`/establishments/${e.id}/employees`} className="text-sm font-semibold text-[var(--ts-text-primary)] hover:text-[var(--ts-gold)]">
              {e.name}
            </Link>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--ts-navy-light)] text-[var(--ts-text-secondary)] whitespace-nowrap ml-2">
              {typeLabel(e.type)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ts-text-muted)] mt-1">{e.address}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-[11px]">
            <Field label="Owner" value={e.employerName} />
            <Field label="POC" value={e.managerName} />
            <Field label="Contact" value={contact(e)} span />
            <Field label="Fee" value={`${fmtMoney(e.processingFee)}/mo`} />
            <Field label="Started" value={e.serviceStartDate ?? '—'} />
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--ts-border)]">
            <Stat value={e.employees} label="Employees" color="var(--ts-green)" />
            <Stat value={e.cycles} label="Cycles" color="var(--ts-blue)" />
            <div className="ml-auto text-right">
              <p className="text-sm font-semibold text-[var(--ts-text-secondary)] leading-none">{fmtMoney(e.daRate)}</p>
              <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">DA rate</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Link href={`/establishments/${e.id}/employees`} className="flex-1 text-center text-xs py-1.5 rounded bg-[var(--ts-navy-light)] text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)]">View</Link>
            <Link href={`/establishments/${e.id}`} className="flex-1 text-center text-xs py-1.5 rounded border border-[var(--ts-border)] text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)]">Edit</Link>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── B. Detailed table ─────────────────────────────────────── */
function TableView({ rows }: { rows: EstRow[] }) {
  const th = 'text-left py-2 px-3 text-[var(--ts-text-muted)] font-medium text-[10px] uppercase whitespace-nowrap'
  const td = 'py-2 px-3 text-[var(--ts-text-secondary)] whitespace-nowrap'
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--ts-border)]">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-[var(--ts-navy-mid)]">
          <tr>
            <th className={th}>#</th><th className={th}>Firm</th><th className={th}>Type</th>
            <th className={th}>Address</th><th className={th}>Emp</th><th className={th}>Owner</th>
            <th className={th}>POC</th><th className={th}>Contact</th><th className={th}>Fee/mo</th>
            <th className={th}>Started</th><th className={th}>DA</th><th className={th} />
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => (
            <tr key={e.id} className="border-t border-[var(--ts-border)] hover:bg-[var(--ts-navy-mid)]">
              <td className={`${td} text-center`}>{i + 1}</td>
              <td className="py-2 px-3 font-medium"><Link href={`/establishments/${e.id}/employees`} className="text-[var(--ts-text-primary)] hover:text-[var(--ts-gold)]">{e.name}</Link></td>
              <td className={td}>{typeLabel(e.type)}</td>
              <td className={`${td} max-w-[180px] truncate`} title={e.address}>{e.address}</td>
              <td className={`${td} text-center`}>{e.employees}</td>
              <td className={td}>{e.employerName}</td>
              <td className={td}>{e.managerName}</td>
              <td className={`${td} max-w-[160px] truncate`} title={contact(e)}>{contact(e)}</td>
              <td className={`${td} text-right`}>{fmtMoney(e.processingFee)}</td>
              <td className={td}>{e.serviceStartDate ?? '—'}</td>
              <td className={`${td} text-right`}>{fmtMoney(e.daRate)}</td>
              <td className={td}><Link href={`/establishments/${e.id}`} className="text-[var(--ts-gold)] hover:underline">Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── C. Expandable rows ────────────────────────────────────── */
function RowsView({ rows }: { rows: EstRow[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="rounded-lg border border-[var(--ts-border)] overflow-hidden">
      {rows.map((e) => {
        const isOpen = open === e.id
        return (
          <div key={e.id} className="border-t border-[var(--ts-border)] first:border-t-0">
            <button onClick={() => setOpen(isOpen ? null : e.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--ts-navy-mid)]">
              <span className="text-[var(--ts-gold)] w-3">{isOpen ? '▾' : '▸'}</span>
              <span className="font-medium text-[var(--ts-text-primary)] text-sm flex-1">{e.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--ts-navy-light)] text-[var(--ts-text-secondary)]">{typeLabel(e.type)}</span>
              <span className="text-xs text-[var(--ts-text-muted)] w-20 text-right">{e.employees} emp</span>
              <span className="text-xs text-[var(--ts-text-secondary)] w-20 text-right">{fmtMoney(e.daRate)} DA</span>
            </button>
            {isOpen && (
              <div className="px-10 pb-3 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-[11px] bg-[var(--ts-navy-mid)]">
                <Field label="Address" value={e.address} span />
                <Field label="Owner" value={e.employerName} />
                <Field label="POC / Manager" value={e.managerName} />
                <Field label="Reg. Cert. No" value={e.regCertNo} />
                <Field label="Contact" value={contact(e)} />
                <Field label="Processing Fee" value={`${fmtMoney(e.processingFee)} / month`} />
                <Field label="Service Started" value={e.serviceStartDate ?? '—'} />
                <Field label="Employees" value={String(e.employees)} />
                <Field label="Cycles" value={String(e.cycles)} />
                <div className="col-span-full flex gap-2 mt-1">
                  <Link href={`/establishments/${e.id}/employees`} className="text-[var(--ts-gold)] hover:underline">View employees →</Link>
                  <Link href={`/establishments/${e.id}`} className="text-[var(--ts-gold)] hover:underline ml-4">Edit firm →</Link>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── D. Directory split view ───────────────────────────────── */
function DirectoryView({ rows }: { rows: EstRow[] }) {
  const [sel, setSel] = useState<string>(rows[0]?.id ?? '')
  const e = rows.find((r) => r.id === sel) ?? rows[0]
  return (
    <div className="flex gap-4 rounded-lg border border-[var(--ts-border)] overflow-hidden min-h-[320px]">
      <div className="w-56 shrink-0 bg-[var(--ts-navy-mid)] border-r border-[var(--ts-border)] overflow-y-auto">
        {rows.map((r) => (
          <button key={r.id} onClick={() => setSel(r.id)}
            className={`w-full text-left px-4 py-2.5 text-sm border-b border-[var(--ts-border)] ${
              r.id === sel ? 'bg-[var(--ts-navy-light)] text-[var(--ts-gold)] font-semibold' : 'text-[var(--ts-text-secondary)] hover:bg-[var(--ts-navy-light)]'
            }`}>
            {r.name}
            <span className="block text-[10px] text-[var(--ts-text-muted)] font-normal">{typeLabel(r.type)} · {r.employees} emp</span>
          </button>
        ))}
      </div>
      {e && (
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>{e.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--ts-navy-light)] text-[var(--ts-text-secondary)]">{typeLabel(e.type)}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-xs">
            <Field label="Address" value={e.address} span />
            <Field label="Owner" value={e.employerName} />
            <Field label="POC / Manager" value={e.managerName} />
            <Field label="Reg. Cert. No" value={e.regCertNo} />
            <Field label="Contact" value={contact(e)} />
            <Field label="Processing Fee" value={`${fmtMoney(e.processingFee)} / month`} />
            <Field label="Service Started" value={e.serviceStartDate ?? '—'} />
            <Field label="DA Rate" value={fmtMoney(e.daRate)} />
            <Field label="Employees" value={String(e.employees)} />
            <Field label="Monthly Cycles" value={String(e.cycles)} />
          </div>
          <div className="flex gap-2 mt-5">
            <Link href={`/establishments/${e.id}/employees`} className="px-3 py-1.5 rounded bg-[var(--ts-gold)] text-[var(--ts-navy)] text-xs font-semibold">View employees</Link>
            <Link href={`/establishments/${e.id}`} className="px-3 py-1.5 rounded border border-[var(--ts-border)] text-[var(--ts-text-secondary)] text-xs hover:text-[var(--ts-gold)]">Edit firm</Link>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── shared bits ───────────────────────────────────────────── */
function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <span className="text-[var(--ts-text-muted)]">{label}: </span>
      <span className="text-[var(--ts-text-secondary)]">{value}</span>
    </div>
  )
}
function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">{label}</p>
    </div>
  )
}

function Grid() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg> }
function TableIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="1"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="4" x2="9" y2="20"/></svg> }
function Rows() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function Columns() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="6" height="16" rx="1"/><rect x="11" y="4" width="10" height="16" rx="1"/></svg> }
