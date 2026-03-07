import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActivityPollSection from '../ActivityPollSection'
import type { ActivityPollEntry } from '@/app/lib/types'

// [AC-ACTIVITIES-F9] ActivityPollSection component tests

const SURF: ActivityPollEntry = {
  activity: {
    id: 'surf-01',
    name: 'Surfing at San Juan',
    category: 'morning',
    vibe: ['beach'],
    address: 'San Juan',
    lat: 16.66,
    lng: 120.32,
  },
  votes: [
    { id: 'v1', activity_id: 'd1:act:surf-01', voter_name: 'Alice', created_at: '' },
    { id: 'v2', activity_id: 'd1:act:surf-01', voter_name: 'Bob',   created_at: '' },
  ],
  voteCount: 2,
}

const HIKE: ActivityPollEntry = {
  activity: {
    id: 'hike-01',
    name: 'Tangadan Falls Hike',
    category: 'morning',
    vibe: ['adventure'],
    address: 'San Gabriel',
    lat: 16.65,
    lng: 120.43,
  },
  votes: [
    { id: 'v3', activity_id: 'd1:act:hike-01', voter_name: 'Carol', created_at: '' },
  ],
  voteCount: 1,
}

describe('ActivityPollSection', () => {
  it('[AC-ACTIVITIES-F9] shows empty state message when no votes', () => {
    const emptyEntries: ActivityPollEntry[] = [{ ...SURF, votes: [], voteCount: 0 }]
    render(<ActivityPollSection category="morning" entries={emptyEntries} />)
    expect(screen.getByText(/no activity votes yet/i)).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F9] renders activity names with votes', () => {
    render(<ActivityPollSection category="morning" entries={[SURF, HIKE]} />)
    expect(screen.getByText('Surfing at San Juan')).toBeInTheDocument()
    expect(screen.getByText('Tangadan Falls Hike')).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F9] shows vote counts', () => {
    render(<ActivityPollSection category="morning" entries={[SURF, HIKE]} />)
    // Vote counts rendered as text inside the ranked list
    // Use getByText with exact match inside the ranked list items
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })

  it('[AC-ACTIVITIES-F9] renders correct heading for morning category', () => {
    render(<ActivityPollSection category="morning" entries={[SURF]} />)
    expect(screen.getByText(/Morning Activities/i)).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F9] renders correct heading for evening category', () => {
    const eveningEntry: ActivityPollEntry = {
      ...SURF,
      activity: { ...SURF.activity, category: 'evening' },
    }
    render(<ActivityPollSection category="evening" entries={[eveningEntry]} />)
    expect(screen.getByText(/Evening Activities/i)).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F9] uses accessible section landmark', () => {
    render(<ActivityPollSection category="morning" entries={[SURF]} />)
    const section = screen.getByRole('region', { name: /morning activities/i })
    expect(section).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F9] shows voter names', () => {
    render(<ActivityPollSection category="morning" entries={[SURF]} />)
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText(/Bob/)).toBeInTheDocument()
  })
})
