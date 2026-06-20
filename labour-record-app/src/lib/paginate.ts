// Pure pagination helpers shared by the list pages. Kept free of Prisma/Next so
// the page-math is unit-tested in isolation.

export const DEFAULT_PAGE_SIZE = 25

export interface PageQuery {
  page: number
  pageSize: number
  skip: number
  take: number
}

// Parse a ?page= param into a 1-based page + Prisma skip/take.
export function parsePage(raw: string | undefined, pageSize: number = DEFAULT_PAGE_SIZE): PageQuery {
  const n = Number(raw)
  const page = Number.isInteger(n) && n > 0 ? n : 1
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export interface PageMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
  from: number // 1-based index of the first row on this page (0 when empty)
  to: number // 1-based index of the last row on this page
}

export function pageMeta(total: number, page: number, pageSize: number = DEFAULT_PAGE_SIZE): PageMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const clampedPage = Math.min(Math.max(1, page), totalPages)
  return {
    total,
    page: clampedPage,
    pageSize,
    totalPages,
    hasPrev: clampedPage > 1,
    hasNext: clampedPage < totalPages,
    from: total === 0 ? 0 : (clampedPage - 1) * pageSize + 1,
    to: Math.min(clampedPage * pageSize, total),
  }
}
