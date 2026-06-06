import { describe, it, expect } from 'vitest'
import { isValidTransition, requiresComment, getFormCodes } from '@/domain/workflow/kanban-transitions'

describe('isValidTransition', () => {
  it('allows NOT_STARTED → DATA_ENTRY', () => {
    expect(isValidTransition('NOT_STARTED', 'DATA_ENTRY')).toBe(true)
  })

  it('allows DATA_ENTRY → READY_FOR_REVIEW', () => {
    expect(isValidTransition('DATA_ENTRY', 'READY_FOR_REVIEW')).toBe(true)
  })

  it('allows READY_FOR_REVIEW → APPROVED', () => {
    expect(isValidTransition('READY_FOR_REVIEW', 'APPROVED')).toBe(true)
  })

  it('allows READY_FOR_REVIEW → NEEDS_CORRECTION', () => {
    expect(isValidTransition('READY_FOR_REVIEW', 'NEEDS_CORRECTION')).toBe(true)
  })

  it('allows NEEDS_CORRECTION → DATA_ENTRY', () => {
    expect(isValidTransition('NEEDS_CORRECTION', 'DATA_ENTRY')).toBe(true)
  })

  it('allows APPROVED → EXPORTED', () => {
    expect(isValidTransition('APPROVED', 'EXPORTED')).toBe(true)
  })

  it('allows APPROVED → DATA_ENTRY (admin override)', () => {
    expect(isValidTransition('APPROVED', 'DATA_ENTRY')).toBe(true)
  })

  it('rejects NOT_STARTED → APPROVED', () => {
    expect(isValidTransition('NOT_STARTED', 'APPROVED')).toBe(false)
  })

  it('rejects EXPORTED → DATA_ENTRY', () => {
    expect(isValidTransition('EXPORTED', 'DATA_ENTRY')).toBe(false)
  })

  it('rejects DATA_ENTRY → APPROVED (skip review)', () => {
    expect(isValidTransition('DATA_ENTRY', 'APPROVED')).toBe(false)
  })
})

describe('requiresComment', () => {
  it('requires comment for READY_FOR_REVIEW → NEEDS_CORRECTION', () => {
    expect(requiresComment('READY_FOR_REVIEW', 'NEEDS_CORRECTION')).toBe(true)
  })

  it('does not require comment for READY_FOR_REVIEW → APPROVED', () => {
    expect(requiresComment('READY_FOR_REVIEW', 'APPROVED')).toBe(false)
  })

  it('does not require comment for DATA_ENTRY → READY_FOR_REVIEW', () => {
    expect(requiresComment('DATA_ENTRY', 'READY_FOR_REVIEW')).toBe(false)
  })
})

describe('getFormCodes', () => {
  it('returns 7 hospital forms', () => {
    expect(getFormCodes('HOSPITAL')).toHaveLength(7)
  })

  it('returns 5 shop forms', () => {
    expect(getFormCodes('SHOP')).toHaveLength(5)
  })

  it('includes HOSPITAL_FORM_XII', () => {
    expect(getFormCodes('HOSPITAL')).toContain('HOSPITAL_FORM_XII')
  })

  it('includes SHOP_FORM_W', () => {
    expect(getFormCodes('SHOP')).toContain('SHOP_FORM_W')
  })
})
