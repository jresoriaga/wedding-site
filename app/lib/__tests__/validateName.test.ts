import { describe, it, expect } from 'vitest'
import { validateName, sanitizeName } from '../validateName'

describe('validateName', () => {
  it('[AC-ITINPLAN0306-E1] returns error for empty string', () => {
    expect(validateName('')).toBe('Please enter your name.')
  })

  it('[AC-ITINPLAN0306-E1] returns error for whitespace-only string', () => {
    expect(validateName('   ')).toBe('Please enter your name.')
  })

  it('[AC-ITINPLAN0306-S1] returns error for name exceeding 50 characters', () => {
    const longName = 'A'.repeat(51)
    expect(validateName(longName)).toBe('Name must be 50 characters or fewer.')
  })

  it('[AC-ITINPLAN0306-F2] returns null for valid name', () => {
    expect(validateName('Maria')).toBeNull()
  })

  it('[AC-ITINPLAN0306-F2] returns null for name at exactly 50 characters', () => {
    expect(validateName('A'.repeat(50))).toBeNull()
  })

  it('[AC-ITINPLAN0306-E5] returns null for Unicode name', () => {
    expect(validateName('María')).toBeNull()
  })

  it('[AC-ITINPLAN0306-E5] returns null for name with emoji', () => {
    expect(validateName('Juan 🌊')).toBeNull()
  })

  it('[AC-ITINPLAN0306-F2] rejects name that exceeds 50 chars even with surrounding whitespace', () => {
    const paddedName = '  ' + 'A'.repeat(51) + '  '
    expect(validateName(paddedName)).toBe('Name must be 50 characters or fewer.')
  })
})

describe('sanitizeName', () => {
  it('trims whitespace from both ends', () => {
    expect(sanitizeName('  Maria  ')).toBe('Maria')
  })
})
