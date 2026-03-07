import { describe, it, expect } from 'vitest'
import { haversineKm, estimateTravelMinutes, buildDaySchedule } from '../scheduleBuilder'
import type { TripConfig, Venue, Activity } from '../types'

// [AC-ACTIVITIES-F14, F15] scheduleBuilder — pure functions, no external deps

const HOTEL: Pick<TripConfig, 'stay_lat' | 'stay_lng'> = {
  stay_lat: 16.6596,
  stay_lng: 120.3224,
}

const BASE_CONFIG: TripConfig = {
  id: 'main',
  trip_name: 'La Union',
  start_date: '2026-04-10',
  end_date: '2026-04-12',
  stay_name: 'Flotsam & Jetsam',
  stay_lat: HOTEL.stay_lat,
  stay_lng: HOTEL.stay_lng,
  updated_by: 'Joef',
  updated_at: '2026-03-07T00:00:00Z',
}

const BREAKFAST: Venue = { id: 'b-01', name: 'El Union', category: 'breakfast', address: 'San Juan', lat: 16.66, lng: 120.32, vibe: ['café'] }
const LUNCH: Venue    = { id: 'l-01', name: 'Tagpuan',  category: 'lunch',     address: 'San Juan', lat: 16.65, lng: 120.32, vibe: ['casual dining'] }
const DINNER: Venue   = { id: 'd-01', name: 'Surf Shack', category: 'dinner',  address: 'San Juan', lat: 16.65, lng: 120.32, vibe: ['bar'] }

const MORNING_ACT: Activity   = { id: 'surf-01', name: 'Surfing', category: 'morning',   vibe: ['beach'], address: 'San Juan', lat: 16.66, lng: 120.32 }
const AFTERNOON_ACT: Activity = { id: 'atv-01',  name: 'ATV',     category: 'afternoon', vibe: ['adventure'], address: 'Urbiztondo', lat: 16.67, lng: 120.33 }
const EVENING_ACT: Activity   = { id: 'bg-01',   name: 'Bar Night', category: 'evening', vibe: ['nightlife'], address: 'San Juan', lat: 16.66, lng: 120.32 }

const ALL_RESTAURANTS = { breakfast: BREAKFAST, lunch: LUNCH, dinner: DINNER }
const ALL_ACTIVITIES  = { morning: MORNING_ACT, afternoon: AFTERNOON_ACT, evening: EVENING_ACT }

// ── haversineKm ───────────────────────────────────────────────────────────────

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(16.66, 120.32, 16.66, 120.32)).toBe(0)
  })

  it('returns positive distance for different coordinates', () => {
    const d = haversineKm(16.66, 120.32, 16.65, 120.32)
    expect(d).toBeGreaterThan(0)
    expect(d).toBeLessThan(2) // Should be ~1.1 km
  })

  it('is symmetric — swap order gives same result', () => {
    const d1 = haversineKm(16.66, 120.32, 14.5995, 120.9842)
    const d2 = haversineKm(14.5995, 120.9842, 16.66, 120.32)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })
})

// ── estimateTravelMinutes ─────────────────────────────────────────────────────

describe('estimateTravelMinutes', () => {
  it('returns minimum 2 minutes for 0 km', () => {
    expect(estimateTravelMinutes(0)).toBe(2)
  })

  it('returns at least 2 minutes for very small distances', () => {
    expect(estimateTravelMinutes(0.001)).toBeGreaterThanOrEqual(2)
  })

  it('returns ~20 min for 10 km at 30 km/h average', () => {
    const mins = estimateTravelMinutes(10)
    // 10 km / 30 km/h = 20 min exactly
    expect(mins).toBe(20)
  })
})

// ── buildDaySchedule ──────────────────────────────────────────────────────────

describe('buildDaySchedule', () => {
  it('[AC-ACTIVITIES-F15] Day 2 has full 6-slot schedule', () => {
    const slots = buildDaySchedule(BASE_CONFIG, ALL_RESTAURANTS, ALL_ACTIVITIES, 2)
    const labels = slots.map((s) => s.label)
    expect(labels).toContain('Breakfast')
    expect(labels).toContain('Morning Activity')
    expect(labels).toContain('Lunch')
    expect(labels).toContain('Afternoon Activity')
    expect(labels).toContain('Dinner')
    expect(labels).toContain('Evening Activity')
    expect(slots).toHaveLength(6)
  })

  it('[AC-ACTIVITIES-F14] Day 1 arrival 12pm skips Breakfast and Morning Activity', () => {
    const config: TripConfig = { ...BASE_CONFIG, arrival_time: '12:00 PM' }
    const slots = buildDaySchedule(config, ALL_RESTAURANTS, ALL_ACTIVITIES, 1)
    const labels = slots.map((s) => s.label)
    expect(labels).not.toContain('Breakfast')
    expect(labels).not.toContain('Morning Activity')
    expect(labels).toContain('Lunch')
  })

  it('[AC-ACTIVITIES-F14] Day 1 arrival 2pm skips Breakfast, Morning, Lunch', () => {
    const config: TripConfig = { ...BASE_CONFIG, arrival_time: '2:00 PM' }
    const slots = buildDaySchedule(config, ALL_RESTAURANTS, ALL_ACTIVITIES, 1)
    const labels = slots.map((s) => s.label)
    expect(labels).not.toContain('Breakfast')
    expect(labels).not.toContain('Morning Activity')
    expect(labels).not.toContain('Lunch')
    expect(labels).toContain('Afternoon Activity')
    expect(labels).toContain('Dinner')
  })

  it('[AC-ACTIVITIES-F14] Day 1 arrival 5pm — only Dinner and Evening Activity', () => {
    const config: TripConfig = { ...BASE_CONFIG, arrival_time: '5:00 PM' }
    const slots = buildDaySchedule(config, ALL_RESTAURANTS, ALL_ACTIVITIES, 1)
    const labels = slots.map((s) => s.label)
    expect(labels).toHaveLength(2)
    expect(labels).toContain('Dinner')
    expect(labels).toContain('Evening Activity')
  })

  it('[AC-ACTIVITIES-F14] Day 1 with no arrival_time uses full schedule', () => {
    const config: TripConfig = { ...BASE_CONFIG, arrival_time: undefined }
    const slots = buildDaySchedule(config, ALL_RESTAURANTS, ALL_ACTIVITIES, 1)
    expect(slots).toHaveLength(6)
  })

  it('[AC-ACTIVITIES-F15] null venue shows "No votes yet"', () => {
    const slots = buildDaySchedule(BASE_CONFIG, { breakfast: null, lunch: null, dinner: null }, {}, 2)
    const mealSlots = slots.filter((s) => s.type === 'meal')
    for (const slot of mealSlots) {
      expect(slot.name).toBe('No votes yet')
    }
  })

  it('[AC-ACTIVITIES-F15] null activity shows "No activity selected"', () => {
    const slots = buildDaySchedule(BASE_CONFIG, ALL_RESTAURANTS, { morning: null, afternoon: null, evening: null }, 2)
    const actSlots = slots.filter((s) => s.type === 'activity')
    for (const slot of actSlots) {
      expect(slot.name).toBe('No activity selected')
    }
  })

  it('[AC-ACTIVITIES-F15] first slot distance is from hotel', () => {
    const slots = buildDaySchedule(BASE_CONFIG, ALL_RESTAURANTS, ALL_ACTIVITIES, 2)
    const first = slots[0]
    const expected = haversineKm(HOTEL.stay_lat, HOTEL.stay_lng, first.lat, first.lng)
    expect(first.distanceKmFromPrev).toBeCloseTo(expected, 5)
  })

  it('[AC-ACTIVITIES-F15] slot types alternate meal/activity', () => {
    const slots = buildDaySchedule(BASE_CONFIG, ALL_RESTAURANTS, ALL_ACTIVITIES, 2)
    const types = slots.map((s) => s.type)
    expect(types).toEqual(['meal', 'activity', 'meal', 'activity', 'meal', 'activity'])
  })
})
