import { describe, it, expect } from 'vitest'
import { rankActivities } from '../rankActivities'
import type { ActivityVote, Activity } from '../types'

// [AC-ACTIVITIES-F12] rankActivities — sorts by vote count desc, alpha tie-break

const BASE_ACTIVITIES: Activity[] = [
  { id: 'surf-01', name: 'Surfing at San Juan', category: 'morning',   vibe: ['beach'], address: 'San Juan', lat: 16.66, lng: 120.32 },
  { id: 'hike-01', name: 'Tangadan Falls Hike', category: 'morning',   vibe: ['adventure'], address: 'San Gabriel', lat: 16.65, lng: 120.43 },
  { id: 'atv-01',  name: 'ATV Riding',          category: 'afternoon', vibe: ['adventure'], address: 'Urbiztondo', lat: 16.67, lng: 120.33 },
  { id: 'bg-01',   name: 'Bar Gaming Night',    category: 'evening',   vibe: ['nightlife'], address: 'San Juan', lat: 16.66, lng: 120.32 },
]

function makeVote(day: 1 | 2 | 3, activityId: string, voter: string, idx: number): ActivityVote {
  return { id: `v${idx}`, activity_id: `d${day}:act:${activityId}`, voter_name: voter, created_at: '' }
}

describe('rankActivities', () => {
  it('[AC-ACTIVITIES-F12] returns all activities in category even with zero votes', () => {
    const result = rankActivities([], 'morning', 1, BASE_ACTIVITIES)
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.voteCount === 0)).toBe(true)
  })

  it('[AC-ACTIVITIES-F12] sorts by vote count descending', () => {
    const votes: ActivityVote[] = [
      makeVote(1, 'hike-01', 'Alice', 1),
      makeVote(1, 'hike-01', 'Bob',   2),
      makeVote(1, 'surf-01', 'Carol', 3), // 1 vote
    ]
    const result = rankActivities(votes, 'morning', 1, BASE_ACTIVITIES)
    expect(result[0].activity.id).toBe('hike-01')  // 2 votes
    expect(result[1].activity.id).toBe('surf-01')  // 1 vote
  })

  it('[AC-ACTIVITIES-F12] ties broken alphabetically (name asc)', () => {
    const votes: ActivityVote[] = [
      makeVote(1, 'surf-01', 'Alice', 1),
      makeVote(1, 'hike-01', 'Bob',   2),
      // both 1 vote — Surfing > Tangadan alphabetically → Tangadan first? no: S < T → Surfing wins
    ]
    const result = rankActivities(votes, 'morning', 1, BASE_ACTIVITIES)
    // "Surfing at San Juan" < "Tangadan Falls Hike" alphabetically
    expect(result[0].activity.name).toBe('Surfing at San Juan')
  })

  it('[AC-ACTIVITIES-F12] isolates votes by day — Day 2 votes ignored on Day 1', () => {
    const votes: ActivityVote[] = [
      makeVote(2, 'surf-01', 'Alice', 1), // Day 2 vote, should be ignored for Day 1
      makeVote(1, 'hike-01', 'Bob',   2),
    ]
    const result = rankActivities(votes, 'morning', 1, BASE_ACTIVITIES)
    const surf = result.find((e) => e.activity.id === 'surf-01')
    const hike = result.find((e) => e.activity.id === 'hike-01')
    expect(surf?.voteCount).toBe(0) // Day 2 vote not counted for Day 1
    expect(hike?.voteCount).toBe(1)
  })

  it('[AC-ACTIVITIES-F12] ignores votes for other categories', () => {
    // atv-01 is afternoon — should not appear in morning results
    const votes: ActivityVote[] = [
      makeVote(1, 'atv-01', 'Alice', 1),
    ]
    const result = rankActivities(votes, 'morning', 1, BASE_ACTIVITIES)
    expect(result.every((e) => e.activity.category === 'morning')).toBe(true)
  })

  it('[AC-ACTIVITIES-F12] voteCount matches actual votes for that activity', () => {
    const votes: ActivityVote[] = [
      makeVote(1, 'surf-01', 'Alice', 1),
      makeVote(1, 'surf-01', 'Bob',   2),
      makeVote(1, 'surf-01', 'Carol', 3),
    ]
    const result = rankActivities(votes, 'morning', 1, BASE_ACTIVITIES)
    const surf = result.find((e) => e.activity.id === 'surf-01')
    expect(surf?.voteCount).toBe(3)
    expect(surf?.votes).toHaveLength(3)
  })

  it('[AC-ACTIVITIES-F12] works with default ACTIVITIES when dynamicActivities not provided', () => {
    // Just verify it doesn't throw and returns an array
    const result = rankActivities([], 'morning', 1)
    expect(Array.isArray(result)).toBe(true)
  })
})
