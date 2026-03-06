import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RestaurantCard from '../RestaurantCard'
import type { Venue } from '@/app/lib/types'

const mockVenue: Venue = {
  id: 'test-01',
  name: 'Elyu Café',
  category: 'breakfast',
  vibe: ['café', 'casual dining'],
  address: 'San Juan, La Union',
  lat: 16.67,
  lng: 120.32,
  description: 'Great coffee by the beach.',
}

describe('RestaurantCard', () => {
  it('[AC-ITINPLAN0306-F5] renders venue name, address, vibe tags, and vote badge', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        voteCount={3}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByText('Elyu Café')).toBeInTheDocument()
    expect(screen.getByText(/San Juan/)).toBeInTheDocument()
    expect(screen.getByText('café')).toBeInTheDocument()
    expect(screen.getByText('casual dining')).toBeInTheDocument()
    expect(screen.getByLabelText('3 votes')).toBeInTheDocument()
  })

  it('[AC-ITINPLAN0306-F5] selected state sets aria-pressed="true"', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={true}
        voteCount={1}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('restaurant-card-test-01')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('[AC-ITINPLAN0306-F5] click fires onToggle with venue id', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        voteCount={0}
        onToggle={onToggle}
        onInfoClick={vi.fn()}
      />
    )
    await user.click(screen.getByTestId('restaurant-card-test-01'))
    expect(onToggle).toHaveBeenCalledWith('test-01')
  })

  it('[AC-ITINPLAN0306-E6] data-testid is present', () => {
    render(
      <RestaurantCard
        venue={mockVenue}
        selected={false}
        voteCount={0}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('restaurant-card-test-01')).toBeInTheDocument()
  })

  // [AC-ITINPLAN0306-S3] XSS prevention — voter_name rendered via JSX text
  it('[AC-ITINPLAN0306-S3] renders script injection attempt as escaped text, not executed', () => {
    const maliciousVenue: Venue = {
      ...mockVenue,
      name: '<script>alert(1)</script>',
    }
    const { container } = render(
      <RestaurantCard
        venue={maliciousVenue}
        selected={false}
        voteCount={0}
        onToggle={vi.fn()}
        onInfoClick={vi.fn()}
      />
    )
    // No script tag should exist in DOM
    expect(container.querySelector('script')).toBeNull()
    // Text is displayed literally
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
  })
})
