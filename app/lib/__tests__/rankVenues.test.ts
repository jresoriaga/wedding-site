import { describe, it, expect } from 'vitest'
import { rankVenues } from '../rankVenues'
import type { Vote } from '../types'

// Votes must be day-prefixed (d1:, d2:, d3:) — day 1 is the default
const makeVote = (venue_id: string, voter_name: string, id: string, day = 1): Vote => ({
  id,
  venue_id: `d${day}:${venue_id}`,
  voter_name,
  created_at: new Date().toISOString(),
})

describe('rankVenues', () => {
  it('[AC-ITINPLAN0306-F7] ranks venues by vote count descending', () => {
    const votes: Vote[] = [
      makeVote('b-01', 'Maria', 'v1'),
      makeVote('b-01', 'Jose', 'v2'),
      makeVote('b-02', 'Ana', 'v3'),
    ]
    const result = rankVenues(votes, 'breakfast', 1)
    expect(result[0].venue.id).toBe('b-01')
    expect(result[0].voteCount).toBe(2)
    expect(result[1].venue.id).toBe('b-02')
    expect(result[1].voteCount).toBe(1)
  })

  it('[AC-ITINPLAN0306-E3] returns all breakfast venues with 0 votes when no votes exist', () => {
    const result = rankVenues([], 'breakfast', 1)
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.voteCount === 0)).toBe(true)
  })

  it('[AC-ITINPLAN0306-F7] ignores votes for other categories', () => {
    const votes: Vote[] = [
      makeVote('l-01', 'Maria', 'v1'), // lunch venue → should not appear in breakfast
    ]
    const result = rankVenues(votes, 'breakfast', 1)
    expect(result.every((e) => e.venue.category === 'breakfast')).toBe(true)
    expect(result.every((e) => e.voteCount === 0)).toBe(true)
  })

  it('[AC-ITINPLAN0306-F7] returns correct voters list per entry', () => {
    const votes: Vote[] = [
      makeVote('b-01', 'Maria', 'v1'),
      makeVote('b-01', 'Jose', 'v2'),
    ]
    const result = rankVenues(votes, 'breakfast', 1)
    const entry = result.find((e) => e.venue.id === 'b-01')!
    expect(entry.votes.map((v) => v.voter_name)).toContain('Maria')
    expect(entry.votes.map((v) => v.voter_name)).toContain('Jose')
  })
})

