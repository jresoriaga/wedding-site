import { describe, it, expect } from 'vitest'
import { filterVenues, timeOfDayToCategory, safeImageUrl } from '../filterVenues'
import type { Venue, Vibe } from '../types'

const mockVenues: Venue[] = [
  {
    id: 'b-01',
    name: 'Café A',
    category: 'breakfast',
    vibe: ['café', 'casual dining'],
    address: 'La Union',
    lat: 16.67,
    lng: 120.32,
  },
  {
    id: 'b-02',
    name: 'Street B',
    category: 'breakfast',
    vibe: ['street food'],
    address: 'La Union',
    lat: 16.67,
    lng: 120.32,
  },
  {
    id: 'l-01',
    name: 'Lunch Spot C',
    category: 'lunch',
    vibe: ['casual dining', 'bar'],
    address: 'La Union',
    lat: 16.67,
    lng: 120.32,
  },
]

describe('filterVenues', () => {
  it('[AC-ITINPLAN0306-F3] returns only venues matching the given category', () => {
    const result = filterVenues(mockVenues, 'breakfast', new Set<Vibe>())
    expect(result).toHaveLength(2)
    expect(result.every((v) => v.category === 'breakfast')).toBe(true)
  })

  it('[AC-ITINPLAN0306-F4] with vibes selected, returns only venues matching at least one vibe', () => {
    const result = filterVenues(mockVenues, 'breakfast', new Set<Vibe>(['café']))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b-01')
  })

  it('[AC-ITINPLAN0306-E2] returns empty array when no venues match vibe', () => {
    const result = filterVenues(mockVenues, 'breakfast', new Set<Vibe>(['party']))
    expect(result).toHaveLength(0)
  })

  it('[AC-ITINPLAN0306-F4] with empty vibe set, returns all venues in category', () => {
    const result = filterVenues(mockVenues, 'lunch', new Set<Vibe>())
    expect(result).toHaveLength(1)
  })

  it('[AC-ITINPLAN0306-F4] matches venues with multiple vibes — matches any selected', () => {
    const result = filterVenues(
      mockVenues,
      'breakfast',
      new Set<Vibe>(['casual dining', 'street food'])
    )
    expect(result).toHaveLength(2)
  })
})

// ── Cycle 1: timeOfDayToCategory [AC-GUIDE-F1] ───────────────────────────────
describe('timeOfDayToCategory', () => {
  it('[AC-GUIDE-F1] maps morning → breakfast', () => {
    expect(timeOfDayToCategory('morning')).toBe('breakfast')
  })

  it('[AC-GUIDE-F1] maps afternoon → lunch', () => {
    expect(timeOfDayToCategory('afternoon')).toBe('lunch')
  })

  it('[AC-GUIDE-F1] maps evening → dinner', () => {
    expect(timeOfDayToCategory('evening')).toBe('dinner')
  })
})

// ── Cycle 2: safeImageUrl [AC-GUIDE-S1] ──────────────────────────────────────
describe('safeImageUrl', () => {
  it('[AC-GUIDE-S1] returns null for undefined', () => {
    expect(safeImageUrl(undefined)).toBeNull()
  })

  it('[AC-GUIDE-S1] returns null for empty string', () => {
    expect(safeImageUrl('')).toBeNull()
  })

  it('[AC-GUIDE-S1] rejects javascript: protocol URLs', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBeNull()
  })

  it('[AC-GUIDE-S1] rejects data: URLs', () => {
    expect(safeImageUrl('data:image/png;base64,abc')).toBeNull()
  })

  it('[AC-GUIDE-S1] rejects http:// (non-secure)', () => {
    expect(safeImageUrl('http://example.com/img.jpg')).toBeNull()
  })

  it('[AC-GUIDE-S1] accepts https:// URLs unchanged', () => {
    expect(safeImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg')
  })
})
