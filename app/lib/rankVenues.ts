import type { PollEntry, Vote, Category, Day } from './types'
import { RESTAURANTS, VENUE_MAP } from './restaurants'

// Strip day prefix (e.g. "d1:el-union-coffee" → "el-union-coffee")
function baseId(venueId: string): string {
  return venueId.replace(/^d[1-3]:/, '')
}

// Returns venues for a given category sorted by vote count descending
// O(n log n) — safe for ≤50 venues [AC-ITINPLAN0306-F7]
export function rankVenues(votes: Vote[], category: Category, day: Day = 1): PollEntry[] {
  const dayPrefix = `d${day}:`
  // Build index map O(n) — no O(n²) nested lookups
  const votesByVenue: Record<string, Vote[]> = {}

  for (const vote of votes) {
    // Only count votes for the requested day
    if (!vote.venue_id.startsWith(dayPrefix)) continue
    const base = baseId(vote.venue_id)
    const venue = VENUE_MAP[base]
    if (!venue || venue.category !== category) continue
    if (!votesByVenue[base]) {
      votesByVenue[base] = []
    }
    votesByVenue[base].push(vote)
  }

  // Include venues with 0 votes for the category
  const entries: PollEntry[] = RESTAURANTS.filter(
    (v) => v.category === category
  ).map((venue) => ({
    venue,
    votes: votesByVenue[venue.id] ?? [],
    voteCount: votesByVenue[venue.id]?.length ?? 0,
  }))

  return entries.sort((a, b) => b.voteCount - a.voteCount)
}

