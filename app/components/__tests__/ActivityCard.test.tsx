import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ActivityCard from '../ActivityCard'
import type { Activity } from '@/app/lib/types'

// [AC-ACTIVITIES-F8] ActivityCard component tests

const MOCK_ACTIVITY: Activity = {
  id: 'surf-01',
  name: 'Surfing at San Juan',
  category: 'morning',
  vibe: ['beach', 'adventure'],
  address: 'Urbiztondo, San Juan, La Union',
  lat: 16.6596,
  lng: 120.3224,
  description: 'Catch waves at the famous surf spot.',
  hours: '6:00 AM – 6:00 PM',
}

describe('ActivityCard', () => {
  it('[AC-ACTIVITIES-F8] renders activity name', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={0}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByText('Surfing at San Juan')).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F8] renders activity address', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={0}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByText(/Urbiztondo/)).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F8] aria-pressed is false when not selected', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={0}
        onToggle={vi.fn()}
      />
    )
    const card = screen.getByTestId('activity-card-surf-01')
    expect(card).toHaveAttribute('aria-pressed', 'false')
  })

  it('[AC-ACTIVITIES-F8] aria-pressed is true when selected', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={true}
        voteCount={2}
        onToggle={vi.fn()}
      />
    )
    const card = screen.getByTestId('activity-card-surf-01')
    expect(card).toHaveAttribute('aria-pressed', 'true')
  })

  it('[AC-ACTIVITIES-F8] calls onToggle with activity id when clicked', () => {
    const onToggle = vi.fn()
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={0}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByTestId('activity-card-surf-01'))
    expect(onToggle).toHaveBeenCalledWith('surf-01')
  })

  it('[AC-ACTIVITIES-F8] shows vote count when greater than zero', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={3}
        onToggle={vi.fn()}
      />
    )
    // Vote count shown via aria-label on the span
    expect(screen.getByLabelText('3 votes')).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F8] shows voter names when provided', () => {
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={2}
        voterNames={['Alice', 'Bob']}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
  })

  it('[AC-ACTIVITIES-F8] is keyboard accessible — Enter key triggers onToggle', () => {
    const onToggle = vi.fn()
    render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={0}
        onToggle={onToggle}
      />
    )
    fireEvent.keyDown(screen.getByTestId('activity-card-surf-01'), { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledWith('surf-01')
  })

  it('[AC-ACTIVITIES-F8] data-testid uses activity id for resilient selection', () => {
    const { container } = render(
      <ActivityCard
        activity={MOCK_ACTIVITY}
        selected={false}
        voteCount={0}
        onToggle={vi.fn()}
      />
    )
    expect(container.querySelector('[data-testid="activity-card-surf-01"]')).toBeInTheDocument()
  })
})
