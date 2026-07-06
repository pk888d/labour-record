import { describe, it, expect } from 'vitest'
import { pluralize } from './utils'

describe('pluralize', () => {
  it('uses the singular for exactly 1', () => {
    expect(pluralize(1, 'employee')).toBe('1 employee')
  })

  it('uses the plural for 0 and many', () => {
    expect(pluralize(0, 'employee')).toBe('0 employees')
    expect(pluralize(3, 'employee')).toBe('3 employees')
  })

  it('accepts an irregular plural', () => {
    expect(pluralize(2, 'entry', 'entries')).toBe('2 entries')
  })
})
