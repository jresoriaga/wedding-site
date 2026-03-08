import type { Venue, Category, TimeOfDay } from './types'

// [AC-GUIDE-F1] Map unified time-of-day to the DB Category used by restaurants
export function timeOfDayToCategory(tod: TimeOfDay): Category {
  if (tod === 'morning') return 'breakfast'
  if (tod === 'afternoon') return 'lunch'
  return 'dinner'
}

// [AC-GUIDE-S1] Only https:// URLs are safe to render as <img src> — reject javascript: / data: / relative paths
export function safeImageUrl(url: string | undefined): string | null {
  if (!url) return null
  if (!url.startsWith('https://')) return null
  return url
}

// O(n) filtering — no nested find/filter inside map [vercel-react-best-practices]
export function filterVenues(
  venues: Venue[],
  category: Category,
  selectedVibes: Set<string>
): Venue[] {
  return venues.filter((venue) => {
    if (venue.category !== category) return false
    if (selectedVibes.size === 0) return true
    return venue.vibe.some((v) => selectedVibes.has(v))
  })
}
