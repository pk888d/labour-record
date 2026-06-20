import Link from 'next/link'
import type { PageMeta } from '@/lib/paginate'

// Renders Prev / "Page X of Y · N results" / Next, preserving the current query
// params (filters, search) and only swapping the `page` param.
export function Pagination({
  meta,
  basePath,
  params,
}: {
  meta: PageMeta
  basePath: string
  params: Record<string, string | undefined>
}) {
  if (meta.totalPages <= 1) return null

  const hrefFor = (page: number) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (k !== 'page' && v) sp.set(k, v)
    }
    sp.set('page', String(page))
    return `${basePath}?${sp.toString()}`
  }

  const linkClass = 'px-3 py-1 rounded text-xs border border-[#2a3a50] text-[#7a9ab8] hover:border-[#4a6a8a]'
  const disabledClass = 'px-3 py-1 rounded text-xs border border-[#1a2332] text-[#3a4a5a] cursor-default'

  return (
    <div className="flex items-center gap-3 mt-4 text-xs text-[#5a8ab8]">
      {meta.hasPrev ? (
        <Link href={hrefFor(meta.page - 1)} className={linkClass}>← Prev</Link>
      ) : (
        <span className={disabledClass}>← Prev</span>
      )}
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.from}–{meta.to} of {meta.total}
      </span>
      {meta.hasNext ? (
        <Link href={hrefFor(meta.page + 1)} className={linkClass}>Next →</Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </div>
  )
}
