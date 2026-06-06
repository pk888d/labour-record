import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode } from '@/types'
import type { FormTaskStatus } from '@/generated/prisma/client'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec']

const COLUMNS: { status: FormTaskStatus; label: string; color: string }[] = [
  { status: 'NOT_STARTED',      label: 'Not Started',      color: 'text-[#4a6a8a]' },
  { status: 'DATA_ENTRY',       label: 'Data Entry',       color: 'text-[#4a9eff]' },
  { status: 'READY_FOR_REVIEW', label: 'Ready for Review', color: 'text-[#c0a040]' },
  { status: 'NEEDS_CORRECTION', label: 'Needs Correction', color: 'text-[#f07070]' },
  { status: 'APPROVED',         label: 'Approved',         color: 'text-[#40c070]' },
  { status: 'EXPORTED',         label: 'Exported',         color: 'text-[#c087f0]' },
]

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ establishmentId?: string; month?: string; year?: string }>
}) {
  const { establishmentId, month, year } = await searchParams

  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const monthNum = month ? parseInt(month) : undefined
  const yearNum = year ? parseInt(year) : undefined

  const formTasks = await prisma.formTask.findMany({
    where: {
      cycle: {
        ...(establishmentId ? { establishmentId } : {}),
        ...(monthNum ? { month: monthNum } : {}),
        ...(yearNum ? { year: yearNum } : {}),
      },
    },
    include: {
      cycle: {
        include: { establishment: { select: { name: true, type: true } } },
      },
    },
    orderBy: [{ cycle: { year: 'desc' } }, { cycle: { month: 'desc' } }, { formCode: 'asc' }],
  })

  const byStatus = Object.fromEntries(
    COLUMNS.map((col) => [col.status, formTasks.filter((t) => t.status === col.status)])
  ) as Record<FormTaskStatus, typeof formTasks>

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d] bg-[#0f1923]">
        <h1 className="text-base font-semibold text-white">Kanban Board</h1>
        <form method="GET" className="flex items-center gap-2">
          <select name="establishmentId" defaultValue={establishmentId ?? ''}
            className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]">
            <option value="">All Establishments</option>
            {establishments.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select name="month" defaultValue={month ?? ''}
            className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]">
            <option value="">All Months</option>
            {MONTH_NAMES.slice(1).map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select name="year" defaultValue={year ?? ''}
            className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]">
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit"
            className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060]">
            Filter
          </button>
          {(establishmentId || month || year) && (
            <Link href="/" className="text-xs text-[#4a6a8a] hover:text-[#7a9ab8]">Clear</Link>
          )}
        </form>
      </div>

      <div className="flex flex-1 overflow-x-auto gap-0 min-h-0">
        {COLUMNS.map((col) => {
          const cards = byStatus[col.status] ?? []
          return (
            <div key={col.status}
              className="flex-1 min-w-[180px] flex flex-col border-r border-[#1e2d3d] last:border-r-0">
              <div className="px-3 py-2 border-b border-[#1e2d3d] bg-[#0f1923]">
                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                <span className="ml-2 text-[10px] text-[#4a6a8a]">{cards.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.map((task) => {
                  const display = FORM_DISPLAY_NAMES[task.formCode as FormCode]
                  return (
                    <Link key={task.id} href={`/forms/${task.id}`}
                      className="block p-2 rounded bg-[#0f1923] border border-[#1e2d3d] hover:border-[#2a4060] cursor-pointer">
                      <p className="text-xs font-medium text-white leading-tight">
                        {display?.name ?? task.formCode}
                      </p>
                      <p className="text-[10px] text-[#4a6a8a] mt-1">
                        {task.cycle.establishment.name}
                      </p>
                      <p className="text-[10px] text-[#4a6a8a]">
                        {MONTH_NAMES[task.cycle.month]} {task.cycle.year}
                      </p>
                      {display?.ref && (
                        <p className="text-[10px] text-[#2a4a6a] mt-1">{display.ref}</p>
                      )}
                    </Link>
                  )
                })}
                {cards.length === 0 && (
                  <p className="text-[10px] text-[#2a3a4a] px-1 py-2">—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
