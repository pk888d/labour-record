import { describe, expect, it } from 'vitest'
import { splitDays } from './day-split'

describe('splitDays', () => {
  it('splits a 31-day month into 16 + 15', () => {
    const { first, second } = splitDays(31)
    expect(first).toEqual([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])
    expect(second).toEqual([17,18,19,20,21,22,23,24,25,26,27,28,29,30,31])
  })
  it('splits a 30-day month into 15 + 15', () => {
    const { first, second } = splitDays(30)
    expect(first.length).toBe(15)
    expect(second).toEqual([16,17,18,19,20,21,22,23,24,25,26,27,28,29,30])
  })
  it('splits a 28-day month into 14 + 14', () => {
    const { first, second } = splitDays(28)
    expect(first.length).toBe(14)
    expect(second.length).toBe(14)
  })
})
