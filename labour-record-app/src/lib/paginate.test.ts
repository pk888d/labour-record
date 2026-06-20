import { describe, expect, it } from 'vitest'
import { parsePage, pageMeta, DEFAULT_PAGE_SIZE } from './paginate'

describe('parsePage', () => {
  it('defaults to page 1 when missing or invalid', () => {
    expect(parsePage(undefined)).toMatchObject({ page: 1, skip: 0, take: DEFAULT_PAGE_SIZE })
    expect(parsePage('abc').page).toBe(1)
    expect(parsePage('0').page).toBe(1)
    expect(parsePage('-3').page).toBe(1)
    expect(parsePage('2.5').page).toBe(1)
  })

  it('computes skip/take for a valid page', () => {
    expect(parsePage('3', 10)).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 })
  })
})

describe('pageMeta', () => {
  it('describes a middle page', () => {
    const m = pageMeta(100, 2, 25)
    expect(m).toMatchObject({ totalPages: 4, hasPrev: true, hasNext: true, from: 26, to: 50 })
  })

  it('handles the last (partial) page', () => {
    const m = pageMeta(55, 3, 25)
    expect(m).toMatchObject({ totalPages: 3, hasPrev: true, hasNext: false, from: 51, to: 55 })
  })

  it('handles an empty result set', () => {
    const m = pageMeta(0, 1, 25)
    expect(m).toMatchObject({ totalPages: 1, hasPrev: false, hasNext: false, from: 0, to: 0 })
  })

  it('clamps a page beyond the end', () => {
    const m = pageMeta(10, 9, 25)
    expect(m.page).toBe(1)
    expect(m.hasNext).toBe(false)
  })
})
