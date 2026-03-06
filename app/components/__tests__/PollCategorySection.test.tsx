import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PollCategorySection from '../PollCategorySection'
import type { PollEntry } from '@/app/lib/types'

const mockEntries: PollEntry[] = [
  {
    venue: {
      id: 'b-01',
      name: 'Elyu Café',
      category: 'breakfast',
      vibe: ['café'],
      address: 'San Juan, La Union',
      lat: 16.67,
      lng: 120.32,
    },
    votes: [
      { id: 'v1', venue_id: 'b-01', voter_name: 'Maria', created_at: '' },
      { id: 'v2', venue_id: 'b-01', voter_name: 'Jose', created_at: '' },
    ],
    voteCount: 2,
  },
  {
    venue: {
      id: 'b-02',
      name: 'Morning Waves',
      category: 'breakfast',
      vibe: ['casual dining'],
      address: 'San Juan, La Union',
      lat: 16.67,
      lng: 120.32,
    },
    votes: [{ id: 'v3', venue_id: 'b-02', voter_name: 'Ana', created_at: '' }],
    voteCount: 1,
  },
]

describe('PollCategorySection', () => {
  it('[AC-ITINPLAN0306-F7] renders venues in descending vote order', () => {
    render(<PollCategorySection category="breakfast" entries={mockEntries} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Elyu Café')
    expect(items[1]).toHaveTextContent('Morning Waves')
  })

  it('[AC-ITINPLAN0306-E3] shows empty state when all votes are 0', () => {
    const zeroEntries: PollEntry[] = mockEntries.map((e) => ({ ...e, votes: [], voteCount: 0 }))
    render(<PollCategorySection category="breakfast" entries={zeroEntries} />)
    expect(screen.getByText(/no votes yet/i)).toBeInTheDocument()
  })

  // [AC-ITINPLAN0306-S3] XSS: voter_name containing script rendered safely
  it('[AC-ITINPLAN0306-S3] renders malicious voter_name as escaped text, not executed', () => {
    const maliciousEntries: PollEntry[] = [
      {
        ...mockEntries[0],
        votes: [
          {
            id: 'v-xss',
            venue_id: 'b-01',
            voter_name: '<script>alert(1)</script>',
            created_at: '',
          },
        ],
        voteCount: 1,
      },
    ]
    const { container } = render(
      <PollCategorySection category="breakfast" entries={maliciousEntries} />
    )
    expect(container.querySelector('script')).toBeNull()
  })

  it('[AC-ITINPLAN0306-F7] shows vote counts per venue', () => {
    render(<PollCategorySection category="breakfast" entries={mockEntries} />)
    expect(screen.getByText('2 votes')).toBeInTheDocument()
    expect(screen.getByText('1 vote')).toBeInTheDocument()
  })
})
