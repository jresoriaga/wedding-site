// [AC-ACTIVITIES-F14, F15] Proximity-ordered day schedule builder
// Pure functions with no side effects — fully unit-testable

import type { TripConfig, Venue, Activity, ScheduleSlot } from './types'

/**
 * Haversine formula — great-circle distance between two GPS points in km.
 * No external deps required.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Estimate travel time in minutes assuming 30 km/h average (La Union traffic + walking mix).
 * Minimum 2 minutes.
 */
export function estimateTravelMinutes(km: number): number {
  if (km === 0) return 2
  return Math.max(2, Math.ceil((km / 30) * 60))
}

/** Parse "6:00 AM" / "12:00 PM" → hour in 24h (0–23). Returns -1 on failure. */
function parseHour24(timeStr: string | undefined): number {
  if (!timeStr) return -1
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return -1
  let h = parseInt(match[1], 10)
  const period = match[3].toUpperCase()
  if (period === 'AM' && h === 12) h = 0
  if (period === 'PM' && h !== 12) h += 12
  return h
}

/**
 * Build a proximity-ordered schedule for one day.
 *
 * Day 1 uses arrival_time to skip slots that happen before arrival:
 *   - arrives before 14:00 → include: lunch, afternoon activity, dinner, evening activity
 *   - arrives 14:00–16:59  → include: afternoon activity, dinner, evening activity
 *   - arrives 17:00+       → include: dinner, evening activity
 *
 * Day 2 & 3: full schedule (breakfast, morning, lunch, afternoon, dinner, evening)
 *
 * Each slot's distanceKmFromPrev is computed from the previous slot's lat/lng,
 * starting from the hotel coordinates.
 */
export function buildDaySchedule(
  config: TripConfig,
  topRestaurants: Partial<Record<'breakfast' | 'lunch' | 'dinner', Venue | null>>,
  topActivities: Partial<Record<'morning' | 'afternoon' | 'evening', Activity | null>>,
  day: number,
): ScheduleSlot[] {
  type SlotSpec =
    | { type: 'meal'; label: string; venue: Venue | null | undefined }
    | { type: 'activity'; label: string; activity: Activity | null | undefined }

  // Canonical day-slot order
  const all: SlotSpec[] = [
    { type: 'meal', label: 'Breakfast', venue: topRestaurants.breakfast },
    { type: 'activity', label: 'Morning Activity', activity: topActivities.morning },
    { type: 'meal', label: 'Lunch', venue: topRestaurants.lunch },
    { type: 'activity', label: 'Afternoon Activity', activity: topActivities.afternoon },
    { type: 'meal', label: 'Dinner', venue: topRestaurants.dinner },
    { type: 'activity', label: 'Evening Activity', activity: topActivities.evening },
  ]

  // Day 1 arrival filtering [AC-ACTIVITIES-F14]
  let slots: SlotSpec[] = all
  if (day === 1) {
    const arrivalHour = parseHour24(config.arrival_time)
    if (arrivalHour >= 0) {
      if (arrivalHour >= 17) {
        // 5pm or later — just dinner + evening activity
        slots = all.slice(4)
      } else if (arrivalHour >= 14) {
        // 2pm–5pm — afternoon activity, dinner, evening activity
        slots = all.slice(3)
      } else {
        // Before 2pm — start at lunch
        slots = all.slice(2)
      }
    }
  }

  // Compute distances starting from hotel
  let prevLat = config.stay_lat
  let prevLng = config.stay_lng

  const result: ScheduleSlot[] = []

  for (const spec of slots) {
    let name: string
    let address: string
    let lat: number
    let lng: number

    if (spec.type === 'meal') {
      const v = spec.venue
      name = v?.name ?? 'No votes yet'
      address = v?.address ?? ''
      lat = v?.lat ?? prevLat
      lng = v?.lng ?? prevLng
    } else {
      const a = spec.activity
      name = a?.name ?? 'No activity selected'
      address = a?.address ?? ''
      lat = a?.lat ?? prevLat
      lng = a?.lng ?? prevLng
    }

    const distanceKmFromPrev = haversineKm(prevLat, prevLng, lat, lng)
    const travelMinutes = estimateTravelMinutes(distanceKmFromPrev)

    result.push({
      type: spec.type,
      label: spec.label,
      name,
      address,
      lat,
      lng,
      distanceKmFromPrev,
      travelMinutes,
    })

    prevLat = lat
    prevLng = lng
  }

  return result
}
