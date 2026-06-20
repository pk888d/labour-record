import { describe, expect, it } from 'vitest'
import { isValidTransition, requiresComment, getFormCodes } from './kanban-transitions'

describe('isValidTransition', () => {
  it('allows the forward workflow path', () => {
    expect(isValidTransition('NOT_STARTED', 'DATA_ENTRY')).toBe(true)
    expect(isValidTransition('DATA_ENTRY', 'READY_FOR_REVIEW')).toBe(true)
    expect(isValidTransition('READY_FOR_REVIEW', 'APPROVED')).toBe(true)
    expect(isValidTransition('APPROVED', 'EXPORTED')).toBe(true)
  })

  it('allows review rejection and rework loops', () => {
    expect(isValidTransition('READY_FOR_REVIEW', 'NEEDS_CORRECTION')).toBe(true)
    expect(isValidTransition('NEEDS_CORRECTION', 'DATA_ENTRY')).toBe(true)
    expect(isValidTransition('APPROVED', 'DATA_ENTRY')).toBe(true)
  })

  it('rejects skips and any transition out of EXPORTED (terminal)', () => {
    expect(isValidTransition('NOT_STARTED', 'APPROVED')).toBe(false)
    expect(isValidTransition('DATA_ENTRY', 'EXPORTED')).toBe(false)
    expect(isValidTransition('EXPORTED', 'DATA_ENTRY')).toBe(false)
  })
})

describe('requiresComment', () => {
  it('requires a comment only when rejecting a review', () => {
    expect(requiresComment('READY_FOR_REVIEW', 'NEEDS_CORRECTION')).toBe(true)
    expect(requiresComment('READY_FOR_REVIEW', 'APPROVED')).toBe(false)
    expect(requiresComment('DATA_ENTRY', 'READY_FOR_REVIEW')).toBe(false)
  })
})

describe('getFormCodes', () => {
  it('returns hospital forms only for HOSPITAL', () => {
    const codes = getFormCodes('HOSPITAL')
    expect(codes.length).toBeGreaterThan(0)
    expect(codes.every((c) => c.startsWith('HOSPITAL_FORM'))).toBe(true)
  })

  it('returns shop forms for every other type', () => {
    const codes = getFormCodes('SHOP')
    expect(codes.length).toBeGreaterThan(0)
    expect(codes.every((c) => c.startsWith('SHOP_FORM'))).toBe(true)
    expect(codes).not.toEqual(getFormCodes('HOSPITAL'))
  })
})
