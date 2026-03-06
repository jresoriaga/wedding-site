// In-memory votes store — used as primary store when Supabase is not configured.
// Single-instance only (local dev / single serverless function).
import type { Vote } from './types'

const votes = new Map<string, Vote>() // key: `${venue_id}::${voter_name}`

function key(venue_id: string, voter_name: string): string {
  return `${venue_id}::${voter_name}`
}

export function memAddVote(venue_id: string, voter_name: string): Vote | null {
  const k = key(venue_id, voter_name)
  if (votes.has(k)) return null // duplicate → treat as 409
  const vote: Vote = {
    id: k,
    venue_id,
    voter_name,
    created_at: new Date().toISOString(),
  }
  votes.set(k, vote)
  return vote
}

export function memRemoveVote(venue_id: string, voter_name: string): void {
  votes.delete(key(venue_id, voter_name))
}

export function memGetVotes(): Vote[] {
  return Array.from(votes.values())
}

export function memRenameVoter(oldName: string, newName: string): void {
  const toRename: Vote[] = []
  for (const vote of votes.values()) {
    if (vote.voter_name === oldName) toRename.push(vote)
  }
  for (const old of toRename) {
    votes.delete(key(old.venue_id, oldName))
    const updated: Vote = { ...old, id: key(old.venue_id, newName), voter_name: newName }
    votes.set(key(old.venue_id, newName), updated)
  }
}

// Delete all votes by a voter that belong to a specific day prefix (e.g. "d1:")
export function memClearDayVotes(voter_name: string, day_prefix: string): void {
  const toDelete: string[] = []
  for (const [k, vote] of votes.entries()) {
    if (vote.voter_name === voter_name && vote.venue_id.startsWith(day_prefix)) {
      toDelete.push(k)
    }
  }
  for (const k of toDelete) votes.delete(k)
}

