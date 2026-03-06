import type { Venue, Category, Vibe } from './types'

// O(n) filtering — no nested find/filter inside map [vercel-react-best-practices]
export function filterVenues(
  venues: Venue[],
  category: Category,
  selectedVibes: Set<Vibe>
): Venue[] {
  return venues.filter((venue) => {
    if (venue.category !== category) return false
    if (selectedVibes.size === 0) return true
    return venue.vibe.some((v) => selectedVibes.has(v))
  })
}
