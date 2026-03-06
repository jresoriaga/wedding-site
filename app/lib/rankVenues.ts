import type { PollEntry, Vote, Category } from './types'
import { RESTAURANTS, VENUE_MAP } from './restaurants'

// Returns venues for a given category sorted by vote count descending
// O(n log n) — safe for ≤50 venues [AC-ITINPLAN0306-F7]
export function rankVenues(votes: Vote[], category: Category): PollEntry[] {
  // Build index map O(n) — no O(n²) nested lookups
  const votesByVenue: Record<string, Vote[]> = {}

  for (const vote of votes) {
    const venue = VENUE_MAP[vote.venue_id]
    if (!venue || venue.category !== category) continue
    if (!votesByVenue[vote.venue_id]) {
      votesByVenue[vote.venue_id] = []
    }
    votesByVenue[vote.venue_id].push(vote)
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
